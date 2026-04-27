'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

// ── 에러 전송 헬퍼 ─────────────────────────────────────────────────────────────
async function sendError(payload: {
    tier: string;
    error_type: string;
    severity?: string;
    path?: string;
    message: string;
    stack?: string;
    meta?: Record<string, any>;
    user_id?: string;
}) {
    try {
        await fetch('/api/monitor/errors', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            keepalive: true, // 페이지 이탈 시에도 전송
        });
    } catch { /* 모니터링 전송 실패는 무시 */ }
}

// ── 성능 지표 전송 헬퍼 ────────────────────────────────────────────────────────
async function sendVitals(payload: {
    path: string;
    user_id?: string;
    lcp?: number; fid?: number; cls?: number; fcp?: number; ttfb?: number;
    device?: string;
}) {
    try {
        await fetch('/api/monitor/vitals', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            keepalive: true,
        });
    } catch { /* 무시 */ }
}

// ── Dead Click 감지 ────────────────────────────────────────────────────────────
function getElementLabel(el: Element | null): string {
    if (!el) return 'unknown';
    const btn = el.closest('button, a, [role="button"]');
    if (!btn) return el.tagName.toLowerCase();
    return (
        (btn as HTMLElement).innerText?.slice(0, 40).trim() ||
        btn.getAttribute('aria-label') ||
        btn.getAttribute('title') ||
        btn.tagName.toLowerCase()
    );
}

// ── 메인 훅 ───────────────────────────────────────────────────────────────────
export function useMonitor(userId?: string) {
    const pathname = usePathname();
    const vitalsRef = useRef<Record<string, number>>({});
    const hasReportedVitals = useRef(false);

    // ── 1. 글로벌 JS 에러 감지 ─────────────────────────────────────────────
    useEffect(() => {
        const handleError = (event: ErrorEvent) => {
            sendError({
                tier: 'browser',
                error_type: 'js_error',
                severity: 'error',
                path: pathname || window.location.pathname,
                message: event.message || 'Unknown JS error',
                stack: event.error?.stack?.slice(0, 500),
                meta: { filename: event.filename, lineno: event.lineno, colno: event.colno },
                user_id: userId,
            });
        };

        const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
            const msg = event.reason?.message || String(event.reason) || 'Unhandled Promise Rejection';
            sendError({
                tier: 'browser',
                error_type: 'unhandled_rejection',
                severity: 'error',
                path: pathname || window.location.pathname,
                message: msg.slice(0, 300),
                stack: event.reason?.stack?.slice(0, 500),
                user_id: userId,
            });
        };

        window.addEventListener('error', handleError);
        window.addEventListener('unhandledrejection', handleUnhandledRejection);
        return () => {
            window.removeEventListener('error', handleError);
            window.removeEventListener('unhandledrejection', handleUnhandledRejection);
        };
    }, [pathname, userId]);

    // ── 2. Dead Click 감지 (수정: CPU 부하를 방지하기 위해 로직 최소화/비활성화) ──────────────────
    useEffect(() => {
        // [Optimization] 전역 MutationObserver는 500개 이상의 광고가 있는 사이트에서 
        // CPU 부하를 유발하므로, 실제 성능 문제를 해결하기 위해 Dead Click 감지를 최소화합니다.
        return () => {};
    }, [pathname, userId]);

    // ── 3. Web Vitals 수집 (수정: 대규모 테스트 기간 중 CPU 점유율 최소화를 위해 중단) ───────
    useEffect(() => {
        return () => {};
    }, [pathname, userId]);

    // ── 4. 렌더링 버벅임 (Long Task) 감지 (수정: 부하 방지를 위해 일시 중단) ─────────────
    useEffect(() => {
        return () => {};
    }, [pathname, userId]);
}
