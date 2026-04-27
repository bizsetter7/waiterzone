'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

const IDLE_MS = 30 * 60 * 1000;   // 30분 무활동 → 자동 로그아웃
const WARN_MS = 2 * 60 * 1000;    // 로그아웃 2분 전 경고

const ACTIVITY_EVENTS = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'click'] as const;

interface UseIdleLogoutOptions {
    enabled: boolean;          // 어드민이면 false
    onLogout: () => void;
}

export function useIdleLogout({ enabled, onLogout }: UseIdleLogoutOptions) {
    const [showWarning, setShowWarning] = useState(false);
    const [secondsLeft, setSecondsLeft] = useState(WARN_MS / 1000);

    const logoutTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const warnTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const clearAllTimers = useCallback(() => {
        if (logoutTimer.current) clearTimeout(logoutTimer.current);
        if (warnTimer.current) clearTimeout(warnTimer.current);
        if (countdownRef.current) clearInterval(countdownRef.current);
    }, []);

    const startTimers = useCallback(() => {
        clearAllTimers();
        setShowWarning(false);

        // 경고 타이머
        warnTimer.current = setTimeout(() => {
            setShowWarning(true);
            setSecondsLeft(WARN_MS / 1000);

            // 카운트다운
            countdownRef.current = setInterval(() => {
                setSecondsLeft(prev => {
                    if (prev <= 1) {
                        if (countdownRef.current) clearInterval(countdownRef.current);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }, IDLE_MS - WARN_MS);

        // 로그아웃 타이머
        logoutTimer.current = setTimeout(() => {
            setShowWarning(false);
            onLogout();
        }, IDLE_MS);
    }, [clearAllTimers, onLogout]);

    const resetTimer = useCallback(() => {
        if (!enabled) return;
        startTimers();
    }, [enabled, startTimers]);

    // 활동 감지
    useEffect(() => {
        if (!enabled) return;

        startTimers();

        const handleActivity = () => resetTimer();
        ACTIVITY_EVENTS.forEach(event => window.addEventListener(event, handleActivity, { passive: true }));

        return () => {
            clearAllTimers();
            ACTIVITY_EVENTS.forEach(event => window.removeEventListener(event, handleActivity));
        };
    }, [enabled, startTimers, resetTimer, clearAllTimers]);

    // 경고 팝업에서 "계속 이용" 클릭 시
    const keepAlive = useCallback(() => {
        resetTimer();
    }, [resetTimer]);

    return { showWarning, secondsLeft, keepAlive };
}
