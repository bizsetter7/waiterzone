import { NextRequest, NextResponse } from 'next/server';
import { isWhitelistedBot } from '@/lib/seo';

// ─── 차단할 봇 User-Agent 목록 ──────────────────────────────────
const BLOCKED_BOTS = [
    'python-requests',
    'python-httpx',
    'scrapy',
    'wget',
    'curl/',
    'go-http-client',
    'java/',
    'libwww-perl',
    'lwp-trivial',
    'ahrefsbot',
    'semrushbot',
    'mj12bot',
    'dotbot',
    'blexbot',
    'serpstatbot',
    'petalbot',
    'claudebot',      // AI 크롤러
    'gptbot',         // OpenAI 크롤러
    'dataforseobot',
    'bytespider',
    'facebookexternalhit',  // FB 과도 크롤링
];

// ─── 보호할 경로 ────────────────────────────────────────────────
const PROTECTED_PATHS = [
    '/admin',
    '/api/',
    '/my-shop',
    '/favorites',
];

// ─── In-Memory Rate Limiter (배포 시 Upstash Redis 권장) ────────
const ipRequestMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 60;       // 허용 요청 수 (1분당)
const RATE_WINDOW = 60_000;  // 기준 시간 (ms) = 1분

function isRateLimited(ip: string): boolean {
    const now = Date.now();
    const record = ipRequestMap.get(ip);

    if (!record || now > record.resetTime) {
        ipRequestMap.set(ip, { count: 1, resetTime: now + RATE_WINDOW });
        return false;
    }

    record.count++;
    if (record.count > RATE_LIMIT) return true;

    return false;
}

// ─── 클라이언트 실제 IP 추출 ────────────────────────────────────
function getClientIp(req: NextRequest): string {
    return (
        req.headers.get('cf-connecting-ip') ||       // Cloudflare 실제 IP
        req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
        req.headers.get('x-real-ip') ||
        '0.0.0.0'
    );
}

// ─── 응답 헬퍼 ──────────────────────────────────────────────────
function blocked(reason: string, status = 403): NextResponse {
    return new NextResponse(
        `<!DOCTYPE html><html><head><title>Access Denied</title></head><body>
        <h1>🚫 접근이 제한되었습니다</h1>
        <p>${reason}</p>
        <p>정상적인 이용은 <a href="/">홈으로</a> 돌아가세요.</p>
        </body></html>`,
        {
            status,
            headers: {
                'Content-Type': 'text/html; charset=utf-8',
                'X-Robots-Tag': 'noindex',
            },
        }
    );
}

// ─── 메인 미들웨어 ───────────────────────────────────────────────
export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const ua = (request.headers.get('user-agent') || '').toLowerCase();
    const ip = getClientIp(request);

    // [최우선] Cron 경로는 봇 차단/Rate Limit 우회 — CRON_SECRET 검증으로 보안 보장
    if (pathname.startsWith('/api/cron/')) {
        return NextResponse.next();
    }

    // 0. 도메인 정규화 중단 (Vercel 도메인 설정과 충돌 방지)
    // 인프라 설정을 따르도록 리다이렉트 로직을 제거합니다.

    // 1. 관리자 페이지 — 보안 이관 (미들웨어 간섭 제거)
    // [Fix] Vercel 배포 환경에서 쿠키 감지 실패로 인한 무한 루프 방지를 위해 미들웨어 강제 리다이렉트 비활성화
    // 보안은 AdminLayout 및 useAuth의 클라이언트 사이드 체크로 이관됨.
    if (pathname.startsWith('/admin')) {
        // 통과 허용
    }

    // [항목 11] 주요 보호 페이지 — 보안 이관
    const PROTECTED_AUTH_PATHS = ['/my-shop/dashboard'];
    const needsAuth = PROTECTED_AUTH_PATHS.some(p => pathname.startsWith(p));
    if (needsAuth) {
        // 통과 허용
    }


    // 1. 보안 제외 경로 (Audit Mode 대응)
    const isAuditPath = pathname.includes('/audit') || pathname.includes('/test');
    // P-03 표준: 검색엔진 봇 8종 화이트리스트 (Googlebot/Naverbot/Bingbot/Yeti/Daumoa 등 즉시 통과)
    const isSearchBot = isWhitelistedBot(ua);

    // 2. 봇 User-Agent 차단 (로컬 IP는 제외 — TestSprite 등 로컬 테스트 도구 허용)
    const isLocalIp = ip === '127.0.0.1' || ip === '::1';
    const isBlockedBot = BLOCKED_BOTS.some(bot => ua.includes(bot.toLowerCase()));

    // 검색엔진 봇은 명시적으로 허용
    if (isBlockedBot && !isAuditPath && !isLocalIp && !isSearchBot) {
        console.warn(`[BOT BLOCKED] IP: ${ip} | UA: ${ua.substring(0, 80)}`);
        return blocked('자동화된 접근이 차단되었습니다.', 403);
    }

    // 3. User-Agent 없는 요청 차단 (빈 UA는 거의 100% 봇)
    if ((!ua || ua.length < 10) && !isAuditPath && !isSearchBot) {
        return blocked('올바른 브라우저로 접속해주세요.', 403);
    }

    // 4. Rate Limiting — 1분에 60회 초과 시 차단 (다만 /audit 경로 및 로컬/터널 트래픽 제외)
    // 검색엔진 봇도 Rate Limit에서 제외하여 원활한 색인 허용
    const isLocalTraffic = !request.headers.get('cf-connecting-ip');
    if (isRateLimited(ip) && !isAuditPath && !isLocalTraffic && !isSearchBot) {
        console.warn(`[RATE LIMITED] IP: ${ip} | Path: ${pathname}`);
        return new NextResponse('요청이 너무 많습니다. 잠시 후 다시 시도해주세요.', {
            status: 429,
            headers: {
                'Retry-After': '60',
                'Content-Type': 'text/plain; charset=utf-8',
            },
        });
    }

    // 5. 보안 헤더 추가 (모든 응답에)
    const response = NextResponse.next();

    // [보안] 로컬 시뮬레이터 및 개발 환경 배려: AUDIT_MODE이거나 개발 환경일 때 보안 헤더 대폭 완화
    if (process.env.NODE_ENV === 'production' && process.env.NEXT_PUBLIC_AUDIT_MODE !== 'true') {
        response.headers.set('X-Frame-Options', 'SAMEORIGIN');
        response.headers.set('X-Content-Type-Options', 'nosniff');
        response.headers.set('X-XSS-Protection', '1; mode=block');
    } else {
        // 시뮬레이터 모니터링을 위해 모든 프레임 제한 해제 (file:// 환경 포함)
        response.headers.delete('X-Frame-Options');
        response.headers.delete('Content-Security-Policy');
        response.headers.set('Access-Control-Allow-Origin', '*');
        response.headers.delete('X-Content-Type-Options');
    }
    
    response.headers.set('Referrer-Policy', 'no-referrer-when-downgrade');
    response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

    return response;
}

// ─── 미들웨어 적용 경로 설정 ────────────────────────────────────
export const config = {
    matcher: [
        /*
         * 아래 경로는 제외:
         * - _next/static (정적 파일)
         * - _next/image (이미지 최적화)
         * - favicon.ico, sitemap.xml, robots.txt
         * - public 폴더 파일
         */
        '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|image-sitemap.xml|robots.txt|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp|woff|woff2)).*)',
    ],
};
