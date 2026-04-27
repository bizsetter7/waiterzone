/**
 * [Admin] Band OAuth 2.0 초기 인증 헬퍼
 *
 * ── 최초 1회만 실행하면 됩니다 ──────────────────────────────────────────────
 *
 * STEP 1 — 인증 시작
 *   브라우저에서: https://www.waiterzone.kr/api/admin/band-auth?action=start
 *   → Band 로그인 페이지로 이동
 *   → 로그인 + 권한 허용
 *   → /api/admin/band-auth?action=callback&code=XXX 로 리다이렉트
 *
 * STEP 2 — 토큰 확인
 *   콜백 응답에서 access_token + refresh_token 확인
 *   → Vercel 환경변수에 등록:
 *     BAND_ACCESS_TOKEN  = 발급된 access_token
 *     BAND_REFRESH_TOKEN = 발급된 refresh_token
 *
 * STEP 3 — 밴드 키 확인
 *   https://www.waiterzone.kr/api/admin/band-auth?action=bands&token=ACCESS_TOKEN
 *   → 내 밴드 목록 확인 → band_key 복사 → BAND_KEY 환경변수에 등록
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/requireAdmin';
import { getBandList } from '@/lib/bandClient';

const REDIRECT_URI = `${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.waiterzone.kr'}/api/admin/band-auth?action=callback`;

export async function GET(request: NextRequest) {
    const authError = await requireAdmin(request);
    if (authError) return authError;

    const action = request.nextUrl.searchParams.get('action') ?? 'start';

    // ── STEP 1: 인증 시작 ─────────────────────────────────────────────────────
    if (action === 'start') {
        const clientId = process.env.BAND_CLIENT_ID;
        if (!clientId) {
            return NextResponse.json({ error: 'BAND_CLIENT_ID 환경변수가 설정되지 않았습니다.' }, { status: 503 });
        }
        const authUrl = new URL('https://auth.band.us/oauth2/authorize');
        authUrl.searchParams.set('response_type', 'code');
        authUrl.searchParams.set('client_id', clientId);
        authUrl.searchParams.set('redirect_uri', REDIRECT_URI);
        // 게시글 작성 + 밴드 목록 조회 scope
        authUrl.searchParams.set('scope', 'read_post write_post');

        return NextResponse.redirect(authUrl.toString());
    }

    // ── STEP 2: 콜백 — code → token 교환 ────────────────────────────────────
    if (action === 'callback') {
        const code = request.nextUrl.searchParams.get('code');
        if (!code) {
            return NextResponse.json({ error: '인증 코드 없음. Band 로그인을 다시 시도하세요.' }, { status: 400 });
        }

        const clientId     = process.env.BAND_CLIENT_ID!;
        const clientSecret = process.env.BAND_CLIENT_SECRET!;

        const res = await fetch('https://auth.band.us/oauth2/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                grant_type:    'authorization_code',
                code,
                client_id:     clientId,
                client_secret: clientSecret,
                redirect_uri:  REDIRECT_URI,
            }),
        });

        const data = await res.json();

        return NextResponse.json({
            ok: res.ok,
            message: res.ok
                ? '✅ 토큰 발급 성공! 아래 값을 Vercel 환경변수에 등록하세요.'
                : '❌ 토큰 발급 실패',
            vercel_env: res.ok ? {
                BAND_ACCESS_TOKEN:  data.access_token,
                BAND_REFRESH_TOKEN: data.refresh_token,
                expires_in:         `${data.expires_in}초 (약 1시간)`,
            } : null,
            next_step: res.ok
                ? `환경변수 등록 후: /api/admin/band-auth?action=bands&token=${data.access_token} 로 band_key 확인`
                : null,
            raw: data,
        });
    }

    // ── STEP 3: 밴드 목록 조회 → band_key 확인 ───────────────────────────────
    if (action === 'bands') {
        const token = request.nextUrl.searchParams.get('token');
        if (!token) {
            return NextResponse.json({ error: 'token 파라미터가 필요합니다.' }, { status: 400 });
        }

        try {
            const bands = await getBandList(token);
            return NextResponse.json({
                ok: true,
                message: '아래 band_key 중 게시 대상 밴드를 선택하여 BAND_KEY 환경변수에 등록하세요.',
                bands: bands.map(b => ({ name: b.name, band_key: b.band_key })),
            });
        } catch (e: any) {
            return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
        }
    }

    return NextResponse.json({
        usage: {
            step1: '/api/admin/band-auth?action=start — Band 로그인 → 토큰 발급',
            step2: '/api/admin/band-auth?action=bands&token=발급된ACCESS_TOKEN — 밴드 목록 조회',
        },
    });
}
