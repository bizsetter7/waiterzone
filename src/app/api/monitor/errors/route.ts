import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAdmin } from '@/lib/requireAdmin';

export const dynamic = 'force-dynamic';

function getAdmin() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

/**
 * POST /api/monitor/errors
 * 브라우저/API에서 발생한 에러를 system_error_logs에 기록
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const {
            tier = 'browser',
            error_type,
            severity = 'error',
            path,
            component,
            api_route,
            user_id,
            session_id,
            message,
            stack,
            meta,
        } = body;

        if (!error_type || !message) {
            return NextResponse.json({ success: false, message: 'error_type, message 필수' }, { status: 400 });
        }

        const supabase = getAdmin();
        const { error } = await supabase.from('system_error_logs').insert({
            tier, error_type, severity, path, component,
            api_route, user_id: user_id || null, session_id,
            message, stack, meta: meta || null,
        });

        if (error) {
            console.error('[monitor/errors] insert 실패:', error.message);
            return NextResponse.json({ success: false }, { status: 500 });
        }

        // CRITICAL 에러는 텔레그램 알림 시도
        if (severity === 'critical') {
            try {
                await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3003'}/api/notify/telegram`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        message: `🚨 [CRITICAL] ${error_type}\n경로: ${path || '-'}\n내용: ${message}`,
                    }),
                });
            } catch { /* 알림 실패는 무시 */ }
        }

        return NextResponse.json({ success: true });
    } catch (err: any) {
        return NextResponse.json({ success: false, message: err.message }, { status: 500 });
    }
}

/**
 * GET /api/monitor/errors
 * 어드민용 에러 로그 조회 (최근 200건)
 */
export async function GET(req: NextRequest) {
    const authError = await requireAdmin(req);
    if (authError) return authError;

    try {
        const supabase = getAdmin();
        const { data, error } = await supabase
            .from('system_error_logs')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(200);

        if (error) throw error;
        return NextResponse.json({ success: true, logs: data || [] });
    } catch (err: any) {
        return NextResponse.json({ success: false, logs: [], message: err.message });
    }
}

/**
 * PATCH /api/monitor/errors
 * 에러 해결 처리 (resolved = true)
 */
export async function PATCH(req: NextRequest) {
    const authError = await requireAdmin(req);
    if (authError) return authError;

    try {
        const { id } = await req.json();
        if (!id) return NextResponse.json({ success: false }, { status: 400 });

        const supabase = getAdmin();
        await supabase.from('system_error_logs')
            .update({ resolved: true, resolved_at: new Date().toISOString() })
            .eq('id', id);

        return NextResponse.json({ success: true });
    } catch (err: any) {
        return NextResponse.json({ success: false, message: err.message }, { status: 500 });
    }
}
