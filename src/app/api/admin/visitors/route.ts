/**
 * [Admin] /api/admin/visitors
 * 현재 활성 방문자 수 조회 (last_seen_at 기준 3분 이내)
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/requireAdmin';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function GET(request: NextRequest) {
    const authError = await requireAdmin(request);
    if (authError) return authError;

    // 3분(180초) 이내 last_seen_at 기준 활성 세션 카운트
    const cutoff = new Date(Date.now() - 3 * 60 * 1000).toISOString();

    const { count, error } = await supabaseAdmin
        .from('active_visitors')
        .select('*', { count: 'exact', head: true })
        .gte('last_seen_at', cutoff);

    if (error) {
        return NextResponse.json({ ok: false, count: 0, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, count: count ?? 0 });
}
