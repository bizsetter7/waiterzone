import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAdmin } from '@/lib/requireAdmin';

// service_role 클라이언트 로컬 선언 (존재하지 않는 공용 모듈 import 방지)
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function POST(req: NextRequest) {
    try {
        const authError = await requireAdmin(req);
        if (authError) return authError;

        const { businessId, action } = await req.json();

        if (!businessId || !action) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        if (action === 'approve') {
            // 1. businesses 상태 업데이트
            const { error: bizErr } = await supabaseAdmin
                .from('businesses')
                .update({ status: 'active', is_active: true, updated_at: new Date().toISOString() })
                .eq('id', businessId);
            if (bizErr) throw bizErr;

            // 2. 해당 업소의 구독 상태도 active로 업데이트
            const { error: subErr } = await supabaseAdmin
                .from('subscriptions')
                .update({ status: 'active', updated_at: new Date().toISOString() })
                .eq('business_id', businessId);
            if (subErr) throw subErr;

        } else if (action === 'reject') {
            // 반려 처리
            const { error: bizErr } = await supabaseAdmin
                .from('businesses')
                .update({ status: 'rejected', updated_at: new Date().toISOString() })
                .eq('id', businessId);
            if (bizErr) throw bizErr;
        } else {
            return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Yasajang review error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
