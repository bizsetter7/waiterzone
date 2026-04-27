/**
 * [어드민] 업소 검색 API — 광고카드 생성기 DB 모드용
 * GET /api/admin/shops/search?q=검색어
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAdmin } from '@/lib/requireAdmin';

export const dynamic = 'force-dynamic';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function GET(request: NextRequest) {
    const authError = await requireAdmin(request);
    if (authError) return authError;

    const q = request.nextUrl.searchParams.get('q')?.trim() ?? '';
    if (!q) return NextResponse.json({ ok: false, error: '검색어를 입력하세요' }, { status: 400 });

    const { data, error } = await supabaseAdmin
        .from('shops')
        .select('id, nickname, name, region, work_region_sub, status')
        .or(`nickname.ilike.%${q}%,name.ilike.%${q}%,title.ilike.%${q}%`)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(20);

    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });

    return NextResponse.json({
        ok: true,
        shops: (data ?? []).map(s => ({
            id:       s.id,
            nickname: s.nickname || '',
            name:     s.name     || '',
            region:   (s.region  || '').replace(/[\[\]]/g, '').trim(),
        })),
    });
}
