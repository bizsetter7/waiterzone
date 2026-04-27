/**
 * 네이버 밴드 Open API 클라이언트
 *
 * 인증 방식: OAuth 2.0 Authorization Code Grant
 * 토큰 유효기간: Access Token 1시간 → Refresh Token으로 자동 갱신
 *
 * 필요 환경변수 (Vercel → Settings → Environment Variables):
 *   BAND_CLIENT_ID       — developers.band.us 앱 클라이언트 ID
 *   BAND_CLIENT_SECRET   — 앱 클라이언트 시크릿
 *   BAND_ACCESS_TOKEN    — 최초 OAuth 인증 후 발급 (1시간 유효)
 *   BAND_REFRESH_TOKEN   — 토큰 갱신용 (장기 유효)
 *   BAND_KEY             — 게시 대상 밴드 고유키 (/v2/bands 조회로 확인)
 *
 * 최초 설정:
 *   1. /api/admin/band-auth (GET) 접속 → Band 로그인 페이지로 이동
 *   2. 인증 완료 후 /api/admin/band-auth/callback으로 리다이렉트
 *   3. 발급된 access_token + refresh_token → Vercel 환경변수에 등록
 *   4. /api/admin/band-auth/bands 로 band_key 확인
 */

const BAND_API_BASE = 'https://openapi.band.us';
const BAND_AUTH_BASE = 'https://auth.band.us';

// ─── 환경변수 설정 여부 확인 ─────────────────────────────────────────────────

export function isBandConfigured(): boolean {
    return !!(
        process.env.BAND_CLIENT_ID &&
        process.env.BAND_CLIENT_SECRET &&
        process.env.BAND_REFRESH_TOKEN &&
        process.env.BAND_KEY
    );
}

// ─── Access Token 갱신 ───────────────────────────────────────────────────────

export async function refreshBandToken(): Promise<string> {
    const clientId     = process.env.BAND_CLIENT_ID!;
    const clientSecret = process.env.BAND_CLIENT_SECRET!;
    const refreshToken = process.env.BAND_REFRESH_TOKEN!;

    const res = await fetch(`${BAND_AUTH_BASE}/oauth2/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            grant_type:    'refresh_token',
            client_id:     clientId,
            client_secret: clientSecret,
            refresh_token: refreshToken,
        }),
    });

    if (!res.ok) {
        const body = await res.text();
        throw new Error(`[BandClient] 토큰 갱신 실패 ${res.status}: ${body}`);
    }

    const data = await res.json();
    if (!data.access_token) {
        throw new Error(`[BandClient] access_token 없음: ${JSON.stringify(data)}`);
    }
    return data.access_token as string;
}

// ─── 내가 속한 밴드 목록 조회 ────────────────────────────────────────────────

export async function getBandList(accessToken: string): Promise<{ name: string; band_key: string }[]> {
    const res = await fetch(`${BAND_API_BASE}/v2/bands?access_token=${encodeURIComponent(accessToken)}`);
    if (!res.ok) throw new Error(`[BandClient] 밴드 목록 조회 실패 ${res.status}`);
    const data = await res.json();
    return (data.result_data?.bands ?? []) as { name: string; band_key: string }[];
}

// ─── 이미지 업로드 → photoKey 획득 ──────────────────────────────────────────

export async function uploadBandPhoto(
    accessToken: string,
    bandKey: string,
    imageBuffer: Buffer,
    filename = 'card.png'
): Promise<string> {
    // Node.js 환경 — FormData + Blob 방식
    const { Blob } = await import('node:buffer');
    const blob = new Blob([imageBuffer], { type: 'image/png' });

    const form = new FormData();
    form.append('access_token', accessToken);
    form.append('band_key', bandKey);
    form.append('photo', blob as any, filename);

    const res = await fetch(`${BAND_API_BASE}/v2/band/photo/upload`, {
        method: 'POST',
        body: form as any,
    });

    if (!res.ok) {
        const body = await res.text();
        throw new Error(`[BandClient] 이미지 업로드 실패 ${res.status}: ${body}`);
    }

    const data = await res.json();
    const photoKey = data.result_data?.photo_key;
    if (!photoKey) throw new Error(`[BandClient] photo_key 없음: ${JSON.stringify(data)}`);
    return photoKey as string;
}

// ─── 게시글 작성 ─────────────────────────────────────────────────────────────

export interface BandPostResult {
    post_key: string;
    url: string;
}

export async function createBandPost(
    accessToken: string,
    bandKey: string,
    content: string,
    photoKeys: string[] = []
): Promise<BandPostResult> {
    const params: Record<string, string> = {
        access_token: accessToken,
        band_key:     bandKey,
        content,
        do_push:      'true',
    };
    if (photoKeys.length > 0) {
        params.photo_keys = JSON.stringify(photoKeys);
    }

    const res = await fetch(`${BAND_API_BASE}/v2/band/post/create`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body:    new URLSearchParams(params),
    });

    if (!res.ok) {
        const body = await res.text();
        throw new Error(`[BandClient] 게시글 작성 실패 ${res.status}: ${body}`);
    }

    const data = await res.json();
    const postKey = data.result_data?.post_key;
    if (!postKey) throw new Error(`[BandClient] post_key 없음: ${JSON.stringify(data)}`);

    return {
        post_key: postKey,
        url: `https://band.us/band/${bandKey}/post/${postKey}`,
    };
}

// ─── 통합 헬퍼: 토큰 갱신 → 이미지 업로드 → 게시글 작성 ────────────────────

export async function postCardToBand(
    imageBuffer: Buffer,
    content: string,
    filename = 'waiterzone-card.png'
): Promise<BandPostResult> {
    const bandKey = process.env.BAND_KEY!;

    // 1. Access Token 갱신 (1시간 만료 → refresh_token으로 자동 갱신)
    const accessToken = await refreshBandToken();

    // 2. 이미지 업로드
    const photoKey = await uploadBandPhoto(accessToken, bandKey, imageBuffer, filename);

    // 3. 게시글 작성
    return createBandPost(accessToken, bandKey, content, [photoKey]);
}
