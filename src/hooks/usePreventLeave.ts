'use client';

import { useEffect, useRef } from 'react';

/**
 * usePreventLeave - 페이지 이탈 방지 후크 (강화판 v2)
 * @param isDirty - 경고를 띄울 조건 (true일 때만 작동)
 *
 * [Fix] isGuardedRef 추가 — isDirty가 false→true 여러 번 토글될 때
 * pushState가 중복 누적되어 뒤로가기 경고 다이얼로그가 안 뜨던 버그 수정.
 * 가드 엔트리는 딱 1개만 쌓고, isDirty=false가 되면 리셋한다.
 */
export const usePreventLeave = (isDirty: boolean) => {
    const isGuardedRef = useRef(false);

    // 1. 새로고침 및 탭 닫기 방지 (beforeunload)
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (!isDirty) return;
            e.preventDefault();
            e.returnValue = '작성 중인 내용이 유실될 수 있습니다. 정말 나가시겠습니까?';
            return e.returnValue;
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [isDirty]);

    // 2. 뒤로가기 방지 (Push State Hack)
    useEffect(() => {
        if (!isDirty) {
            // isDirty 해제 시 가드 플래그 초기화 (다음 진입을 위해)
            isGuardedRef.current = false;
            return;
        }

        // [핵심 Fix] 이미 가드 엔트리가 쌓여 있으면 중복 pushState 금지
        if (!isGuardedRef.current) {
            window.history.pushState({ prevLeaveGuarded: true }, '', window.location.href);
            isGuardedRef.current = true;
        }

        const pushStateHack = () => {
            window.history.pushState({ prevLeaveGuarded: true }, '', window.location.href);
        };

        const handlePopState = (e: PopStateEvent) => {
            // 뒤로가기 했는데도 여전히 보호 구역 내부 → 내부 이동이므로 경고 없음
            if (e.state && e.state.prevLeaveGuarded) {
                return;
            }

            if (window.confirm('작성 중인 내용이 저장되지 않았습니다. 정말 나가시겠습니까?')) {
                // 확인: 가드 해제 후 이탈 확정 이벤트 발송
                isGuardedRef.current = false;
                window.dispatchEvent(new CustomEvent('navigation-confirmed'));
            } else {
                // 취소: 다시 가드 엔트리 쌓아서 현재 위치 유지
                pushStateHack();
            }
        };

        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, [isDirty]);
};
