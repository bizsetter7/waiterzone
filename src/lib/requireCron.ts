/**
 * [Cron API Guard] requireCron
 * Vercel Cron 또는 관리자 수동 트리거 검증
 *
 * 허용 조건:
 *   1. Vercel이 자동 삽입하는 x-vercel-cron-signature 헤더 존재 (프로덕션 자동 트리거)
 *   2. Authorization: Bearer {CRON_SECRET} 헤더 매칭 (수동 테스트 또는 관리자 API 호출)
 */
import { NextRequest, NextResponse } from 'next/server';

export function requireCron(request: NextRequest): NextResponse | null {
    // Vercel 자동 크론 트리거 — 프로덕션에서 자동 실행 시
    const cronSig = request.headers.get('x-vercel-cron-signature');
    if (cronSig) return null; // Vercel 서명 존재 시 통과

    // 수동 테스트 또는 내부 트리거 — CRON_SECRET 환경변수 검증
    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret) {
        // CRON_SECRET 미설정 시 로컬 개발 환경 허용
        if (process.env.NODE_ENV === 'development') return null;
        return NextResponse.json({ error: 'CRON_SECRET 환경변수가 설정되지 않았습니다.' }, { status: 500 });
    }

    const authHeader = request.headers.get('authorization') ?? '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';

    if (token !== cronSecret) {
        return NextResponse.json({ error: '크론 인증 실패' }, { status: 401 });
    }

    return null; // 통과
}
