/**
 * Twitter API v2 클라이언트 — OAuth 1.0a (User Context)
 *
 * 트윗 게시(write)는 OAuth 1.0a User Context가 필수입니다.
 * Bearer Token은 읽기 전용이므로 사용하지 않습니다.
 *
 * 필요한 환경변수 (Vercel → Settings → Environment Variables):
 *   TWITTER_API_KEY          — Developer Portal > App > Keys and Tokens > API Key
 *   TWITTER_API_SECRET       — Developer Portal > App > Keys and Tokens > API Key Secret
 *   TWITTER_ACCESS_TOKEN     — Developer Portal > App > Keys and Tokens > Access Token
 *   TWITTER_ACCESS_SECRET    — Developer Portal > App > Keys and Tokens > Access Token Secret
 */

import crypto from 'crypto';

// ─── OAuth 1.0a 서명 생성 ─────────────────────────────────────────────────────

function percentEncode(str: string): string {
    return encodeURIComponent(str)
        .replace(/!/g, '%21')
        .replace(/'/g, '%27')
        .replace(/\(/g, '%28')
        .replace(/\)/g, '%29')
        .replace(/\*/g, '%2A');
}

function buildOAuthSignature(
    method: string,
    url: string,
    oauthParams: Record<string, string>,
    consumerSecret: string,
    tokenSecret: string
): string {
    // 파라미터 정렬 및 인코딩
    const sortedParams = Object.entries(oauthParams)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([k, v]) => `${percentEncode(k)}=${percentEncode(v)}`)
        .join('&');

    const signatureBase = [
        method.toUpperCase(),
        percentEncode(url),
        percentEncode(sortedParams),
    ].join('&');

    const signingKey = `${percentEncode(consumerSecret)}&${percentEncode(tokenSecret)}`;

    return crypto
        .createHmac('sha1', signingKey)
        .update(signatureBase)
        .digest('base64');
}

function buildAuthorizationHeader(method: string, url: string): string {
    const apiKey       = process.env.TWITTER_API_KEY       ?? '';
    const apiSecret    = process.env.TWITTER_API_SECRET    ?? '';
    const accessToken  = process.env.TWITTER_ACCESS_TOKEN  ?? '';
    const tokenSecret  = process.env.TWITTER_ACCESS_SECRET ?? '';

    if (!apiKey || !apiSecret || !accessToken || !tokenSecret) {
        throw new Error('[TwitterClient] 환경변수 미설정: TWITTER_API_KEY / TWITTER_API_SECRET / TWITTER_ACCESS_TOKEN / TWITTER_ACCESS_SECRET');
    }

    const oauthParams: Record<string, string> = {
        oauth_consumer_key:     apiKey,
        oauth_nonce:            crypto.randomBytes(16).toString('hex'),
        oauth_signature_method: 'HMAC-SHA1',
        oauth_timestamp:        Math.floor(Date.now() / 1000).toString(),
        oauth_token:            accessToken,
        oauth_version:          '1.0',
    };

    const signature = buildOAuthSignature(method, url, oauthParams, apiSecret, tokenSecret);
    oauthParams.oauth_signature = signature;

    const authParts = Object.entries(oauthParams)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([k, v]) => `${percentEncode(k)}="${percentEncode(v)}"`)
        .join(', ');

    return `OAuth ${authParts}`;
}

// ─── 트윗 게시 ────────────────────────────────────────────────────────────────

export interface TweetResult {
    id: string;
    text: string;
}

/**
 * 트윗 게시
 * @param text 트윗 본문 (Twitter 제한: 280자)
 */
export async function postTweet(text: string): Promise<TweetResult> {
    const url = 'https://api.twitter.com/2/tweets';

    const authHeader = buildAuthorizationHeader('POST', url);

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            Authorization: authHeader,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
    });

    if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`[Twitter API ${response.status}] ${errorBody}`);
    }

    const data = await response.json();
    return data.data as TweetResult;
}

// ─── 환경변수 설정 여부 확인 ─────────────────────────────────────────────────

export function isTwitterConfigured(): boolean {
    return !!(
        process.env.TWITTER_API_KEY &&
        process.env.TWITTER_API_SECRET &&
        process.env.TWITTER_ACCESS_TOKEN &&
        process.env.TWITTER_ACCESS_SECRET
    );
}

// ─── 트윗 텍스트 길이 검증 ─────────────────────────────────────────────────────

/** Twitter 기준 280자 (URL은 23자로 고정 계산) */
export function getTweetLength(text: string): number {
    // URL 패턴을 23자로 대체하여 계산
    const withNormalizedUrls = text.replace(/https?:\/\/\S+/g, '?' .repeat(23));
    return [...withNormalizedUrls].length; // 유니코드 완전 처리
}

export function isTweetValid(text: string): boolean {
    return getTweetLength(text) <= 280;
}
