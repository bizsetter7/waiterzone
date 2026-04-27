import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAdmin } from '@/lib/requireAdmin';

export const dynamic = 'force-dynamic';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
);

/**
 * GET /api/admin/get-user-shops?userId=xxx
 * 특정 업체회원의 활성 공고 목록 반환 (배너 연결용)
 */
export async function GET(req: NextRequest) {
    const authError = await requireAdmin(req);
    if (authError) return authError;

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
        return NextResponse.json({ error: 'userId 파라미터가 필요합니다.' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
        .from('shops')
        .select('id, name, title, tier, product_type, region, work_region_sub, status, banner_status, banner_image_url, banner_position')
        .eq('user_id', userId)
        .neq('status', 'CLOSED')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('[get-user-shops] error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ shops: data || [] });
}
