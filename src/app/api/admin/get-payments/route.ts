import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAdmin } from '@/lib/requireAdmin';

/**
 * [Admin API] GET /api/admin/get-payments
 * service_role 클라이언트로 payments 전체 조회 (RLS 우회)
 * - admin/page.tsx에서 anon client로 조회 시 RLS에 의해 차단되는 문제 해결
 * - [M-020] 결제 미노출 원인: anon client RLS → service role로 분리
 */
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function GET(request: NextRequest) {
    const authError = await requireAdmin(request);
    if (authError) return authError;

    try {
        // payments 전체 조회 (service_role — RLS 우회)
        const { data: payData, error } = await supabaseAdmin
            .from('payments')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(2000);

        if (error) throw error;

        // profiles join: anon client는 auth.users 조회 불가 → service_role로 별도 조회 후 매핑
        const userIds = [...new Set((payData || []).map((p: any) => p.user_id).filter(Boolean))];
        let profilesMap: Record<string, any> = {};
        if (userIds.length > 0) {
            const { data: profilesData } = await supabaseAdmin
                .from('profiles')
                .select('id, username, nickname, full_name, business_name, business_number, business_file_url')
                .in('id', userIds);
            (profilesData || []).forEach((p: any) => { profilesMap[p.id] = p; });
        }

        const enriched = (payData || []).map((pay: any) => ({
            ...pay,
            profiles: profilesMap[pay.user_id] || null
        }));

        return NextResponse.json({ data: enriched });
    } catch (err: any) {
        console.error('[get-payments] Error:', err.message);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
