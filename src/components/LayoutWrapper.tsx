'use client';

import React, { Suspense } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

import { MobileBottomNav } from './ui/MobileBottomNav';
import { useBrand } from './BrandProvider';
import { Footer } from './layout/Footer';
import MainHeader from './common/MainHeader';
import { AdultVerificationGate } from './common/AdultVerificationGate';
import { AuditLanding } from './audit/AuditLanding';

import { useAuth } from '@/hooks/useAuth';
import { useIdleLogout } from '@/hooks/useIdleLogout';
import { IdleLogoutModal } from './auth/IdleLogoutModal';
import { AUDIT_MODE, ADULT_GATE_DISABLED } from '@/lib/brand-config';
import { isWorkTypeSlug } from '@/lib/data/work-type-guide';
import OpenEventPopup from './OpenEventPopup';
import { PushPermission } from './PushPermission';
import { BannerSidebar } from './BannerSidebar';

interface LayoutWrapperProps {
    children: React.ReactNode;
}

export const LayoutWrapper = ({ children }: LayoutWrapperProps) => {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const isAdminPage = pathname?.startsWith('/admin');
    const { user: authUser, isLoading, isLoggedIn, logout } = useAuth();
    
    // [Safety] Hydration Guard — 서버/클라이언트 렌더링 불일치 원천 차단
    const [isMounted, setIsMounted] = React.useState(false);
    
    // [SEO Enhancement] Bot Detection Hook — 최상단으로 이동 (Hook 순서 보장)
    const [isBot, setIsBot] = React.useState(false);
    
    // [Gate State] 인증 상태 Hook — 최상단으로 이동
    const [isVerified, setIsVerified] = React.useState<boolean | null>(null);
    // [External Entry] 검색엔진 유입 시 진입 페이지 저장 (해당 페이지만 게이트 면제)
    const [externalEntryPage, setExternalEntryPage] = React.useState<string | null>(null);

    // [CTA Trigger] CTA 클릭 시 성인게이트 강제 트리거 상태
    const [forceShowGate, setForceShowGate] = React.useState(false);
    const [pendingCallback, setPendingCallback] = React.useState<(() => void) | null>(null);

    React.useEffect(() => {
        setIsMounted(true);

        // Bot Detection Logic
        if (typeof navigator !== 'undefined') {
            const ua = navigator.userAgent.toLowerCase();
            const botKeywords = ['googlebot', 'bingbot', 'yeti', 'naverbot', 'daum'];
            if (botKeywords.some(keyword => ua.includes(keyword))) {
                setIsBot(true);
            }
        }

        // [External Entry Detection] 검색엔진·외부 링크로 유입된 경우 진입 페이지 기억
        if (typeof window !== 'undefined' && typeof document !== 'undefined') {
            const ref = document.referrer;
            const SEARCH_ENGINES = ['google.', 'naver.com', 'daum.net', 'bing.com', 'yahoo.com', 'zum.com'];
            const isFromSearch = ref !== '' && SEARCH_ENGINES.some(se => ref.includes(se));
            const isDirectExternal = ref !== '' && !ref.includes('waiterzone.kr') && !ref.includes('localhost');
            if (isFromSearch || isDirectExternal) {
                const entry = sessionStorage.getItem('external_entry_page');
                if (!entry) {
                    sessionStorage.setItem('external_entry_page', pathname || '/');
                }
            }
            setExternalEntryPage(sessionStorage.getItem('external_entry_page'));
        }

        // [CTA Trigger Listener]
        const handleOpenGate = (e: Event) => {
            const { onVerified } = (e as CustomEvent).detail;
            setPendingCallback(() => onVerified);
            setForceShowGate(true);
        };
        window.addEventListener('open-adult-gate', handleOpenGate);
        return () => window.removeEventListener('open-adult-gate', handleOpenGate);
    }, []);

    // [Idle Logout Setup]
    const { showWarning, secondsLeft, keepAlive } = useIdleLogout({
        enabled: isLoggedIn && (authUser?.type === 'corporate' || authUser?.type === 'individual'),
        onLogout: logout,
    });

    // [Logic Flags] — Hooks 선언 완료 후 계산
    const currentQueryPage = searchParams?.get('page');
    const isPublicPage = ['signup', 'find-id', 'find-pw', 'support', 'faq', 'inquiry'].includes(currentQueryPage || '');
    const isAuthPage = ['login', 'signup', 'find-id', 'find-pw', 'guest'].includes(currentQueryPage || '');
    const isAuthFlowPage = pathname?.startsWith('/auth/');

    const decodedPath = (pathname ? decodeURIComponent(pathname) : '').normalize('NFC');
    const pathParts = decodedPath.split('/');
    const isGuidePage = pathParts.length === 4 && pathParts[1] === 'coco' && isWorkTypeSlug(pathParts[3]);

    // 검색엔진 외부 유입 시: 최초 진입 페이지만 게이트 면제 (다른 페이지 이동 시 게이트 재표시)
    const isOnExternalEntryPage = !!(externalEntryPage && pathname === externalEntryPage);
    const showAdultGate = forceShowGate || (isMounted && !isVerified && !ADULT_GATE_DISABLED && !isAdminPage && !isAuthFlowPage && !isPublicPage && !isGuidePage && !isBot && !isOnExternalEntryPage);

    React.useEffect(() => {
        if (isLoading) return;

        // 게이트가 비활성화(DISABLED=true) 되어있으면 즉시 통과
        if (ADULT_GATE_DISABLED) {
            setIsVerified(true);
            return;
        }

        // 관리자 계정은 모든 게이트 자동 통과
        if (authUser && authUser.type === 'admin') {
            setIsVerified(true);
            return;
        }

        // 로그인된 유저가 인증된 파트너이거나, 로컬 스토리지에 기록이 있으면 통과
        if (authUser && authUser.id !== 'guest' && authUser.isVerifiedPartnerVerified) {
            setIsVerified(true);
            return;
        }

        // adult_gate_skipped 제거 — "나가기" 는 Google로 이탈하므로 skip으로 진입 허용 안 함
        const localVerified = typeof window !== 'undefined' && localStorage.getItem('adult_verified') === 'true';
        setIsVerified(localVerified);
    }, [isLoading, authUser, pathname]);

    const handleVerify = () => {
        localStorage.setItem('adult_verified', 'true');
        setIsVerified(true);
        setForceShowGate(false);
        if (pendingCallback) {
            pendingCallback();
            setPendingCallback(null);
        }
    };

    // [Sync] 인증 상태가 외부에서 true가 된 경우(예: 로그인) 강제 게이트 해제 및 콜백 실행
    React.useEffect(() => {
        if (isVerified && forceShowGate) {
            setForceShowGate(false);
            if (pendingCallback) {
                pendingCallback();
                setPendingCallback(null);
            }
        }
    }, [isVerified, forceShowGate, pendingCallback]);

    const handleSkip = () => {
        // 나가기 = Google로 이탈 (AdultVerificationGate에서 직접 처리)
        // 이 콜백은 더 이상 skip 권한을 부여하지 않음
        window.location.href = 'https://www.google.com';
    };

    // ── [3] All Conditional Early Returns (Hooks 이후에 배치) ──────────────────
    
    if (!isMounted || isLoading || isVerified === null) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-white">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    if (AUDIT_MODE && !isAdminPage) {
        return (
            <div className="w-full min-h-screen bg-white">
                <Suspense fallback={null}>
                    <AuditLanding />
                </Suspense>
            </div>
        );
    }

    return (
        <React.Fragment>
            {/* [Soft Gate Overlay] — 미인증 시에만 노출 (봇 제외) */}
            {showAdultGate && (
                <div className="fixed inset-0 z-[20000] bg-white/40 backdrop-blur-xl flex items-center justify-center p-4">
                    <AdultVerificationGate onVerify={handleVerify} onSkip={handleSkip} />
                </div>
            )}

            <div className={`flex flex-col min-h-screen ${showAdultGate ? 'blur-2xl pointer-events-none select-none max-h-screen overflow-hidden' : ''}`}>
                {/* Global Header — 어드민 페이지는 자체 레이아웃이 있으므로 제외 */}
                {!isAdminPage && <MainHeader />}

                {/*
                   [Golden Rule - Framework Reconstruction v2]
                   1. Outer Wrapper: Max 1432px, Centered, Relative
                   2. Main Grid: 160px Spacers + 1fr Content
                   3. Sidebars: Now nested INSIDE spacers to contribute to height and ensure alignment
                */}
                <div className={`w-full max-w-[1432px] mx-auto relative h-auto flex-1`}>

                    <div className="xl:grid xl:grid-cols-[160px_1fr_160px] min-h-screen">
                        {/* Left Banner Sidebar */}
                        {!isAdminPage && <BannerSidebar side="left" />}

                        {/* Main Content */}
                        <main className={`w-full flex-1 min-w-0 relative z-[10] ${isAdminPage ? 'px-0' : ''}`}>
                            {children}
                        </main>

                        {/* Right Banner Sidebar */}
                        {!isAdminPage && <BannerSidebar side="right" />}
                    </div>

                </div>

                {/* Global Footer */}
                <Footer />
            </div>

            <Suspense fallback={null}>
                <MobileBottomNav />
            </Suspense>

            <IdleLogoutModal
                isOpen={showWarning}
                secondsLeft={secondsLeft}
                onKeepAlive={keepAlive}
                onLogout={logout}
            />

            {/* 오픈 상생지원 이벤트 팝업 (어드민/인증게이트 제외) */}
            {!isAdminPage && !showAdultGate && <OpenEventPopup />}

            {/* SOS 알림 수신 동의 팝업 (구직자 로그인 시) */}
            {!isAdminPage && !showAdultGate && <PushPermission />}
        </React.Fragment>
    );
};
