import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * [Admin API Guard] requireAdmin
 * 어드민 API 라우트에서 호출 — 요청자가 실제 admin 역할인지 서버에서 검증
 *
 * 사용법:
 *   const authError = await requireAdmin(request);
 *   if (authError) return authError;
 */
export async function requireAdmin(request: NextRequest): Promise<NextResponse | null> {
    // [Admin Mock Bypasser] 개발 환경 전용 — 프로덕션에서는 Supabase 토큰 검증만 허용
    if (process.env.NODE_ENV !== 'production') {
        const mockCookie = request.cookies.get('coco_admin_mock');
        if (mockCookie?.value === '1') return null;
    }

    // 프로덕션: Supabase 세션 + profiles.role 검증
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const anonKey   = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    // Authorization 헤더 또는 쿠키에서 세션 토큰 추출
    const authHeader = request.headers.get('authorization') || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) {
        return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    try {
        const supabaseAdmin = createClient(supabaseUrl, serviceKey || anonKey, {
            auth: { autoRefreshToken: false, persistSession: false },
        });

        // 토큰으로 유저 조회
        const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
        if (userError || !user) {
            return NextResponse.json({ error: '유효하지 않은 세션입니다.' }, { status: 401 });
        }

        // profiles.role 확인
        const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (profile?.role !== 'admin' && profile?.role !== 'master') {
            return NextResponse.json({ error: '관리자 권한이 없습니다.' }, { status: 403 });
        }

        return null; // 인증 통과
    } catch (err: any) {
        return NextResponse.json({ error: `인증 오류: ${err.message}` }, { status: 500 });
    }
}
