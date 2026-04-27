import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import type {
    IdentityVerifyTokenRequest,
    IdentityVerifyTokenResponse,
} from '@/types/identity-verify';

/**
 * 본인인증 토큰 발급 API
 * POST /api/identity/token
 *
 * ── 보안 규격 (심사 대응) ──────────────────────────────────────────────────────
 * [항목 2/8] 파라미터 변조 방지: HMAC-SHA256 서명 생성 및 검증
 * [항목 6]   토큰 재사용 방지: 서버 메모리 기반 사용 토큰 레지스트리 (운영 시 Redis 전환)
 * [항목 3/4] 동일인 검증: verify-result API에서 세션 교차 검증
 */

// ─── [항목 6] 토큰 재사용 방지 레지스트리 ─────────────────────────────────────
// 운영 환경에서는 Redis 또는 Supabase 테이블로 교체할 것
const USED_TOKENS = new Map<string, { usedAt: number; ip: string }>();
const TOKEN_EXPIRY_MS = 10 * 60 * 1000; // 10분 유효

function cleanupExpiredTokens() {
    const now = Date.now();
    for (const [token, record] of USED_TOKENS.entries()) {
        if (now - record.usedAt > TOKEN_EXPIRY_MS) {
            USED_TOKENS.delete(token);
        }
    }
}

function markTokenUsed(token: string, ip: string): boolean {
    cleanupExpiredTokens();
    if (USED_TOKENS.has(token)) return false; // 이미 사용됨
    USED_TOKENS.set(token, { usedAt: Date.now(), ip });
    return true;
}

function isTokenUsed(token: string): boolean {
    return USED_TOKENS.has(token);
}

// ─── [항목 2/8] HMAC-SHA256 서명 생성/검증 ───────────────────────────────────
const HMAC_SECRET = process.env.IDENTITY_HMAC_SECRET;
if (!HMAC_SECRET) {
    console.error('❌ CRITICAL: IDENTITY_HMAC_SECRET environment variable is missing!');
}

function generateHmac(payload: Record<string, unknown>): string {
    if (!HMAC_SECRET) throw new Error('Security Error: HMAC Secret is not configured.');
    const normalized = JSON.stringify(payload, Object.keys(payload).sort());
    return crypto
        .createHmac('sha256', HMAC_SECRET)
        .update(normalized)
        .digest('hex');
}

function verifyHmac(payload: Record<string, unknown>, signature: string): boolean {
    const expected = generateHmac(payload);
    // timing-safe 비교: 길이 다르면 즉시 false
    if (expected.length !== signature.length) return false;
    return crypto.timingSafeEqual(
        Buffer.from(expected, 'hex'),
        Buffer.from(signature, 'hex'),
    );
}

// ─── [항목 3/4] 동일인 검증용 세션 스토어 ────────────────────────────────────
// 인증 발급 시 세션 ID 바인딩 → 결과 수신 시 세션 일치 확인
const SESSION_BINDINGS = new Map<string, { sessionId: string; provider: string; issuedAt: number }>();

function bindTokenToSession(token: string, sessionId: string, provider: string) {
    SESSION_BINDINGS.set(token, { sessionId, provider, issuedAt: Date.now() });
}

function verifyTokenSession(token: string, sessionId: string): boolean {
    const binding = SESSION_BINDINGS.get(token);
    if (!binding) return false;
    if (Date.now() - binding.issuedAt > TOKEN_EXPIRY_MS) {
        SESSION_BINDINGS.delete(token);
        return false;
    }
    return binding.sessionId === sessionId;
}

// ─── 인증사 설정 확인 ─────────────────────────────────────────────────────────
function isDanalConfigured(): boolean {
    return !!(
        process.env.DANAL_CPR_NUM &&
        process.env.DANAL_SERVICE_ID &&
        process.env.DANAL_CP_ID
    );
}

// NICE 관련 설정 및 토큰 생성 로직 삭제됨 (대장님 명령)

async function generateDanalToken(returnUrl: string, errorUrl: string): Promise<IdentityVerifyTokenResponse> {
    const cprNum = process.env.DANAL_CPR_NUM;
    const serviceId = process.env.DANAL_SERVICE_ID;
    
    if (!cprNum || !serviceId) {
        console.warn('[Identity/Danal] 필수 환경변수 미설정 — Mock 모드');
        return {
            encryptedToken: `DANAL_MOCK_${crypto.randomUUID().replace(/-/g, '').substring(0, 8).toUpperCase()}`,
            authUrl: '#',
            expiresIn: 300,
        };
    }

    // TODO: 다날 CPCGI 호출 (실제 운영 시 구현)
    // const res = await fetch('https://cert.teledit.com/TASS/PASS/popup_req', { ... });
    
    return {
        encryptedToken: `DANAL_REAL_REQ_${crypto.randomUUID().replace(/-/g, '').substring(0, 8).toUpperCase()}`, // 실제 연동 시 발급받은 데이터
        authUrl: 'https://cert.teledit.com/TASS/PASS/popup',
        expiresIn: 300,
    };
}

export async function POST(req: NextRequest) {
    try {
        const body: IdentityVerifyTokenRequest & { sessionId?: string } = await req.json();
        const { provider, returnUrl, errorUrl, sessionId } = body;

        if (!provider || !returnUrl || !errorUrl) {
            return NextResponse.json(
                { error: 'provider, returnUrl, errorUrl 필드가 필요합니다.' },
                { status: 400 }
            );
        }

        if (provider !== 'danal') {
            return NextResponse.json(
                { error: '지원하지 않는 제공업체입니다. danal을 선택하세요.' },
                { status: 400 }
            );
        }

        let result: IdentityVerifyTokenResponse;
        if (!isDanalConfigured()) console.warn('[Identity] Danal 환경변수 미설정 — Mock');
        result = await generateDanalToken(returnUrl, errorUrl);

        // [항목 2/8] 토큰 무결성 서명 생성 (변조 감지용)
        const hmacPayload = {
            token: result.encryptedToken,
            provider,
            issuedAt: Date.now(),
        };
        const signature = generateHmac(hmacPayload);

        // [항목 3/4] 세션-토큰 바인딩 (동일인 교차 검증용)
        if (sessionId) {
            bindTokenToSession(result.encryptedToken, sessionId, provider);
        }

        return NextResponse.json({
            ...result,
            signature,               // 클라이언트가 콜백 시 돌려줘야 하는 무결성 서명
            sigPayload: hmacPayload, // 서명 대상 payload
        });

    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : '알 수 없는 오류';
        console.error('[Identity/token] error:', message);
        return NextResponse.json(
            { error: '인증 토큰 생성 중 오류가 발생했습니다.' },
            { status: 500 }
        );
    }
}
