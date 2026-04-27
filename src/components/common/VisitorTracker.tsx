'use client';

/**
 * VisitorTracker — 전역 방문자 추적 컴포넌트
 * - layout.tsx에서 1회만 마운트
 * - sessionStorage에 session_id 저장 (탭 닫으면 소멸)
 * - 30초마다 /api/visitors/ping 호출 (하트비트)
 * - 페이지 이동 시 page_path 갱신
 */

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

function generateSessionId(): string {
    // crypto.randomUUID() 지원 환경 우선, 폴백은 timestamp+random
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

function getSessionId(): string {
    try {
        let id = sessionStorage.getItem('coco_visitor_session');
        if (!id) {
            id = generateSessionId();
            sessionStorage.setItem('coco_visitor_session', id);
        }
        return id;
    } catch {
        return generateSessionId();
    }
}

export default function VisitorTracker() {
    const pathname = usePathname();
    const sessionIdRef = useRef<string>('');

    const sendPing = (path: string) => {
        const sessionId = sessionIdRef.current;
        if (!sessionId) return;

        // sendBeacon 우선 (페이지 언로드 시에도 전송 보장), 폴백은 fetch
        const payload = JSON.stringify({ sessionId, pagePath: path });
        if (navigator.sendBeacon) {
            const blob = new Blob([payload], { type: 'application/json' });
            navigator.sendBeacon('/api/visitors/ping', blob);
        } else {
            fetch('/api/visitors/ping', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: payload,
                keepalive: true,
            }).catch(() => {});
        }
    };

    // 초기화 — session_id 생성
    useEffect(() => {
        sessionIdRef.current = getSessionId();
    }, []);

    // 페이지 이동 시 즉시 ping
    useEffect(() => {
        if (!sessionIdRef.current) return;
        sendPing(pathname);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pathname]);

    // 30초 하트비트
    useEffect(() => {
        if (!sessionIdRef.current) return;

        const interval = setInterval(() => {
            sendPing(pathname);
        }, 30_000);

        return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pathname]);

    return null; // UI 없음
}
