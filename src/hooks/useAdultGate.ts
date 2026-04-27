'use client';
import { useCallback } from 'react';
import { useAuth } from './useAuth';

/**
 * 성인 인증 여부를 확인 후 콜백 실행.
 * 미인증 시 게이트를 열어 인증 후 자동 실행.
 */
export function useAdultGate() {
    const { user } = useAuth();

    const requireVerification = useCallback((onVerified: () => void) => {
        if (typeof window === 'undefined') return;

        // 1. 이미 로컬 스토리지가 인증되어 있거나
        const isLocalVerified = localStorage.getItem('adult_verified') === 'true';

        // 2. 어드민이거나 인증된 파트너인 경우 즉시 콜백 실행
        const isAdmin = user?.type === 'admin';
        const isVerifiedPartner = user?.isVerifiedPartnerVerified === true;

        if (isLocalVerified || isAdmin || isVerifiedPartner) {
            onVerified();
        } else {
            // 미인증 → 커스텀 이벤트로 LayoutWrapper에 게이트 오픈 요청
            window.dispatchEvent(new CustomEvent('open-adult-gate', { detail: { onVerified } }));
        }
    }, [user]);

    return { requireVerification };
}
