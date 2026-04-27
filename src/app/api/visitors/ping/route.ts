/**
 * [Public] /api/visitors/ping
 * 방문자 하트비트 — 30초마다 호출, active_visitors 테이블 upsert
 * 인증 불필요 (세션 ID만 사용)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const sessionId = body.sessionId as string;
        const pagePath  = body.pagePath  as string || '/';

        if (!sessionId || typeof sessionId !== 'string' || sessionId.length > 100) {
            return NextResponse.json({ ok: false }, { status: 400 });
        }

        const now = new Date().toISOString();

        // upsert — 세션 존재 시 last_seen_at 갱신, 없으면 insert
        await supabaseAdmin
            .from('active_visitors')
            .upsert(
                { session_id: sessionId, page_path: pagePath, last_seen_at: now },
                { onConflict: 'session_id' }
            );

        // 5분 이상 비활성 세션 정리 (매 ping마다 소수만 정리 — 부하 최소화)
        const cutoff = new Date(Date.now() - 5 * 60 * 1000).toISOString();
        await supabaseAdmin
            .from('active_visitors')
            .delete()
            .lt('last_seen_at', cutoff);

        return NextResponse.json({ ok: true });
    } catch {
        return NextResponse.json({ ok: false }, { status: 500 });
    }
}
