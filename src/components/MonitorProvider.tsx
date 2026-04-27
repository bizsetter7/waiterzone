'use client';

import { useMonitor } from '@/hooks/useMonitor';
import { useAuth } from '@/hooks/useAuth';

/**
 * MonitorProvider
 * layout.tsx에 삽입되는 전역 감시 훅 활성화 컴포넌트.
 * - JS 에러 / Unhandled Rejection 수집
 * - Dead Click (응답 없는 버튼 클릭) 감지
 * - Web Vitals (LCP, FID, CLS, FCP, TTFB) 자동 측정
 * - Long Task (렌더링 버벅임 100ms+) 감지
 * 모두 /api/monitor/errors 및 /api/monitor/vitals 로 전송됨.
 */
export function MonitorProvider() {
    const { user } = useAuth();
    const userId = user?.id !== 'guest' ? user?.id : undefined;
    useMonitor(userId);
    return null; // 렌더링 없음 — 훅만 실행
}
