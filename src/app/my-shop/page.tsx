'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
    Plus, LayoutDashboard, Settings, Menu
} from 'lucide-react';
import { useBrand } from '@/components/BrandProvider';
import { usePreventLeave } from '@/hooks/usePreventLeave';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';

// --- Late Imports Moved to top ---
import { PaymentsView } from './components/PaymentsView';
import { ApplicantsView } from './components/ApplicantsView';
import { PointHistoryView } from './components/PointHistoryView';
import { ResumeForm } from './components/ResumeForm';

// --- Components ---
import BusinessDashboard from './components/dashboard/BusinessDashboard';
import PersonalDashboard from './components/dashboard/PersonalDashboard';
import AdForm from './AdForm';
import { useAdFormState } from './useAdFormState';
import { normalizeAd, normalizePayment } from './utils/normalization';
import { getJumpConfig, DETAILED_PRICING } from './constants';

// --- Components (Refactored) ---
import { WarningModal } from './components/WarningModal';
import { DesignRequestModal } from './components/DesignRequestModal';
import { ExampleModal } from './components/ExampleModal';
import { AdDetailModal } from './components/AdDetailModal';
import { ResumeDetailModal } from './components/ResumeDetailModal';
import { BusinessMobileMenu } from './components/BusinessMobileMenu';
import { BusinessSidebar } from './components/BusinessSidebar';
import { MemberInfoForm } from './components/MemberInfoForm';
import { ChangePasswordView } from './components/ChangePasswordView';
import { AdTemplateModal } from './components/AdTemplateModal';
import { OngoingAdsView } from './components/OngoingAdsView';
import { ClosedAdsView } from './components/ClosedAdsView';
import { SosAlertView } from './components/SosAlertView';
import { BankTransferModal } from './components/BankTransferModal';
import { ExtendAdModal } from './components/ExtendAdModal';
import { PointShopView } from './components/PointShopView';

// Removed problematic ErrorBoundary class for framework compatibility

export default function MyShopPage() {
    // Force rebuild
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center font-bold">로딩 중...</div>}>
            <MyShopContent />
        </Suspense>
    );
}

function MyShopContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const brand = useBrand();
    const { userType: authUserType, user: authUser, isLoading: authLoading, userJumpBalance } = useAuth();
    const [userType, setUserType] = useState<'corporate' | 'individual' | 'admin' | 'guest' | null>(null);
    const [isNewEntry, setIsNewEntry] = useState(false);
    const [editingAdId, setEditingAdId] = useState<any | null>(null);
    const editingAdIdRef = React.useRef<string | null>(null); // [Ref Fix] Synchronous ID storage
    const [isSaving, setIsSaving] = useState(false);
    const isJustSaved = React.useRef(false); // [Ref] Prevent "ZOMBIE" data overwriting immediately after save
    const tabFocusRef = React.useRef(false); // [Fix] 탭 복귀 시 Next.js searchParams 재생성으로 인한 폼 리셋 방지
    const initialLoadDoneRef = React.useRef(false); // [Fix] 초기 로드 완료 후 authLoading 재발동으로 스피너 노출 방지

    const [view, _setView] = useState<any>('dashboard');
    const [lastLoadedId, setLastLoadedId] = useState<string | null>(null); // [Fix] Prevent reload loop
    // Business Data States
    const [registeredAds, setRegisteredAds] = useState<any[]>([]);
    const [paymentHistory, setPaymentHistory] = useState<any[]>([]);
    const [isDataLoaded, setIsDataLoaded] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [showBankModal, setShowBankModal] = useState(false);
    const [bankModalAmount, setBankModalAmount] = useState(0);
    const [bankModalTitle, setBankModalTitle] = useState<string | undefined>(undefined);

    // 연장 모달 state
    const [showExtendModal, setShowExtendModal] = useState(false);
    const [extendTargetAd, setExtendTargetAd] = useState<any>(null);

    useEffect(() => {
        setMounted(true);
    }, []);

    // [Dev Only] ?autoLogin=corporate|shop|individual URL 파라미터로 mock 세션 자동 설정
    // TestSprite E2E 테스트 전용 — 개발 환경에서만 동작 (프로덕션 비활성)
    useEffect(() => {
        if (typeof window === 'undefined') return;
        if (process.env.NODE_ENV === 'production') return; // 프로덕션 차단
        const autoLogin = searchParams.get('autoLogin');
        if (autoLogin) {
            const existing = localStorage.getItem('coco_mock_session');
            if (!existing) {
                const isCorporate = autoLogin === 'corporate' || autoLogin === 'shop';
                const mockSession = isCorporate
                    ? { type: 'corporate', id: 'mock_test_shop', name: '테스트업체', nickname: '테스트업체', credit: 1000, points: 500 }
                    : { type: 'individual', id: 'mock_test_user', name: '테스트회원', nickname: '테스트회원', credit: 0, points: 0 };
                localStorage.setItem('coco_mock_session', JSON.stringify(mockSession));
                // 파라미터 제거 후 리로드 (깨끗한 URL 유지)
                const url = new URL(window.location.href);
                url.searchParams.delete('autoLogin');
                window.location.replace(url.toString());
            }
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // --- Data Fetching (Supabase) ---
    const fetchRegisteredAds = async () => {
        if (!authUser?.id || authUser.id === 'guest') return;

        try {
            let dbData: any[] = [];
            if (!authUser.id.startsWith('mock_')) {
                const { data, error } = await supabase
                    .from('shops')
                    .select('*')
                    .eq('user_id', authUser.id)
                    .eq('platform', 'waiterzone') // [플랫폼 분리] 웨이터존 공고만 조회
                    .order('created_at', { ascending: false });
                if (error) throw error;
                dbData = data || [];
            }

            const mockAdsRaw = localStorage.getItem('coco_mock_ads');
            const mockAds = mockAdsRaw ? JSON.parse(mockAdsRaw) : [];

            // [Standard] Always normalize all data sources
            const finalAds = [...dbData, ...mockAds].map(normalizeAd);

            // [ZOMBIE PROTECTION] Skip update if we just saved to prevent "Reverting" UI
            if (isJustSaved.current) {
                return;
            }

            setRegisteredAds(finalAds);

        } catch (err: any) {
            console.warn("Fetch ads failed, falling back to local mocks:", err);
            const mockAdsRaw = localStorage.getItem('coco_mock_ads');
            if (mockAdsRaw) {
                const localMocks = JSON.parse(mockAdsRaw);
                setRegisteredAds(localMocks.map(normalizeAd)); // [Fix] Normalization required here too
            }
        } finally {
            setIsDataLoaded(true);
            initialLoadDoneRef.current = true; // [Fix] 이후 authLoading 재발동 시 스피너 표시 안 함
        }
    };

    const fetchPaymentHistory = async () => {
        if (!authUser?.id || authUser.id === 'guest') return;

        try {
            const { data, error } = await supabase
                .from('payments')
                .select('*')
                .eq('user_id', authUser.id)
                .eq('platform', 'waiterzone') // [플랫폼 분리] 웨이터존 결제만 조회
                .order('created_at', { ascending: false });

            const dbPayments = data || [];

            // [Fix] 실제 회원은 localStorage 결제내역 무시 (중복·타 세션 데이터 방지)
            const isMockUser2 = authUser.id.startsWith('mock_');
            const mockPaymentsRaw = isMockUser2 ? localStorage.getItem('my_site_payment_history') : null;
            const mockPayments = mockPaymentsRaw ? JSON.parse(mockPaymentsRaw) : [];

            const finalPayments = [...dbPayments, ...mockPayments].map((p: any) => normalizePayment(p, bizShopName || formState.shopName));

            // [Debug/Test] If no payments exist, add a sample one for verification
            if (finalPayments.length === 0 && authUser.id !== 'guest') {
                // Removed auto-mock to avoid confusion
            }

            setPaymentHistory(finalPayments);
        } catch (err: any) {
            console.error("Fetch payments error:", err);
        }
    };

    const [resumeCount, setResumeCount] = useState(0);

    const fetchResumeCount = async () => {
        if (!authUser?.id || authUser.id === 'guest') return;
        try {
            let total = 0;
            if (!authUser.id.startsWith('mock_')) {
                const { count } = await supabase.from('resumes').select('*', { count: 'exact', head: true }).eq('user_id', authUser.id);
                total = count || 0;
            }
            const mock = localStorage.getItem('coco_mock_resumes');
            if (mock) {
                const mockList = JSON.parse(mock);
                // Simple filtering for simulated user if needed, but currently assumes local mocks are global for browser
                total += mockList.length;
            }
            setResumeCount(total);
        } catch (e) { console.warn(e); }
    };

    // 업체회원 사업자 인증 상태 + 상호명 로드
    const [bizVerified, setBizVerified] = React.useState(false);
    const [bizDataLoaded, setBizDataLoaded] = React.useState(false); // [Fix] 레이스 컨디션 방지
    const [bizAddress, setBizAddress] = React.useState('');
    // [Fix] bizShopName은 formState.resetAdStates()에 영향 안 받는 별도 state (상호명 깜빡임 방지)
    const [bizShopName, setBizShopName] = React.useState('');
    const [profileRegionCity, setProfileRegionCity] = React.useState('');
    const [profileRegionGu, setProfileRegionGu] = React.useState('');

    useEffect(() => {
        if (!authUser?.id || authUser.id === 'guest' || authUser.id.startsWith('mock_')) {
            setBizDataLoaded(true); // 비기업 계정은 체크 불필요 → 즉시 완료 처리
            return;
        }
        if (authUserType !== 'corporate') {
            setBizDataLoaded(true);
            return;
        }

        const loadShopName = async () => {
            try {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('nickname, full_name, business_name, business_verified, business_address, business_address_detail')
                    .eq('id', authUser.id)
                    .single();

                if (profile) {
                    const verified = (profile as any).business_verified === true;
                    setBizVerified(verified);
                    // 인증 완료된 경우에만 business_name 반영
                    if (verified && (profile as any).business_name) {
                        formState.setShopName((profile as any).business_name);
                        setBizShopName((profile as any).business_name);
                    } else {
                        // 미인증 회원: sessionStorage draft에 남아있을 타 계정 상호명 초기화
                        formState.setShopName('');
                        setBizShopName('');
                    }
                    // 사업장 주소 로드 + 근무지역 자동 반영
                    const addr = (profile as any).business_address || '';
                    const detail = (profile as any).business_address_detail || '';
                    if (addr) {
                        setBizAddress(detail ? `${addr} ${detail}` : addr);
                        const parts = addr.trim().split(/\s+/);
                        const REGION_ALIAS: Record<string, string> = {
                            '경기': '경기도', '강원': '강원도', '경남': '경상남도', '경북': '경상북도',
                            '전남': '전라남도', '전북': '전라북도', '충남': '충청남도', '충북': '충청북도',
                            '제주': '제주도',
                        };
                        const city = REGION_ALIAS[parts[0]] || parts[0] || '';
                        if (city) setProfileRegionCity(city);
                        if (parts[1]) setProfileRegionGu(parts[1]);
                        if (city && !formState.regionCity) formState.setRegionCity(city);
                        if (parts[1] && !formState.regionGu)   formState.setRegionGu(parts[1]);
                    }
                }
            } finally {
                setBizDataLoaded(true); // [Fix] 성공/실패 무관하게 로드 완료 표시
            }
        };

        loadShopName();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [authUser?.id, authUserType]);

    // [Fix] resetAdStates() 후 근무지역 복원 — view=form 진입 시 profileRegion 값으로 세팅
    useEffect(() => {
        if (view === 'form' && profileRegionCity && !formState.regionCity) {
            formState.setRegionCity(profileRegionCity);
        }
        if (view === 'form' && profileRegionGu && !formState.regionGu) {
            formState.setRegionGu(profileRegionGu);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [view, profileRegionCity, profileRegionGu]);

    useEffect(() => {
        if (!authUser?.id || authUser.id === 'guest') return;
        // [Fix] 실제 회원은 localStorage 결제 캐시 초기화 (중복·타 세션 데이터 방지)
        if (!authUser.id.startsWith('mock_')) {
            localStorage.removeItem('my_site_payment_history');
        }
        fetchRegisteredAds();
        fetchPaymentHistory();
        fetchResumeCount();
        // fetchResumeCount는 의존성에서 제외 — 함수 참조 변경으로 인한 무한루프 방지
        // authUser.id가 변경될 때만 재실행
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [authUser?.id]);

    useEffect(() => {
        const handleUpdate = () => fetchResumeCount();
        window.addEventListener('resume-updated', handleUpdate);
        return () => window.removeEventListener('resume-updated', handleUpdate);
    }, [authUser?.id]);

    // [Fix] 탭 복귀 시 Next.js searchParams 재생성으로 폼 리셋 방지
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                tabFocusRef.current = true;
                setTimeout(() => { tabFocusRef.current = false; }, 1500);
            }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, []);

    // SOS에서 공고등록 이동 이벤트
    useEffect(() => {
        const handleSetView = (e: any) => setView(e.detail);
        window.addEventListener('setView', handleSetView);
        return () => window.removeEventListener('setView', handleSetView);
    }, []);

    const setView = (newView: any, adId?: string, isNew?: boolean) => {
        const viewId = typeof newView === 'object' ? newView.id : newView;
        if (viewId === view && !adId && isNew === undefined) return;

        // [Critical Sync] Update state IMMEDIATELY for snappy UI response
        _setView(newView);

        const params = new URLSearchParams(searchParams.toString());
        params.set('view', viewId);

        // [New Sync] Handle new entry state explicitly in URL and State
        const finalIsNew = isNew !== undefined ? isNew : isNewEntry;
        setIsNewEntry(finalIsNew);

        if (finalIsNew && viewId === 'form') {
            params.set('new', 'true');
        } else {
            params.delete('new');
        }

        // Preserve or set ID if provided or moving to form in edit mode
        if (adId) {
            params.set('id', adId);
        } else if (viewId === 'dashboard') {
            params.delete('id');
            setLastLoadedId(null);
        }

        // [Fix] Use native replaceState to avoid "Failed to fetch" on RSC data fetching during simple view transitions
        // Next.js 14.1+ officially supports this for updating query params without server roundtrips.
        const newUrl = `${window.location.pathname}?${params.toString()}`;
        window.history.replaceState(null, '', newUrl);

        // [Safety Fix] Force state update again after router call to ensure it sticks
        if (finalIsNew !== isNewEntry) setIsNewEntry(finalIsNew);

        window.scrollTo({ top: 0, behavior: 'instant' });
    };

    // [Scroll Fix] view 변경 시 상단 고정 — rAF + setTimeout 이중 보장
    // [Fix] 탭 복귀 시 form 뷰에서는 스크롤 방지 (탭 전환 후 상단으로 올라가는 현상)
    useEffect(() => {
        const isFormView = view === 'form' || (typeof view === 'object' && (view as any)?.id === 'form');
        if (tabFocusRef.current && isFormView) return;
        window.scrollTo({ top: 0, behavior: 'instant' });
        const raf = requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: 'instant' }));
        const timer = setTimeout(() => window.scrollTo({ top: 0, behavior: 'instant' }), 80);
        return () => { cancelAnimationFrame(raf); clearTimeout(timer); };
    }, [view]);

    // Modal States
    const [showWarningModal, setShowWarningModal] = useState(false);
    const [showDesignModal, setShowDesignModal] = useState(false);
    const [showMobileMenu, setShowMobileMenu] = useState(false);
    const [showExampleModal, setShowExampleModal] = useState(false);
    const [showTemplateModal, setShowTemplateModal] = useState(false);
    const [exampleType, setExampleType] = useState<any>(null);
    const [selectedAdForModal, setSelectedAdForModal] = useState<any>(null);
    const [selectedResumeForModal, setSelectedResumeForModal] = useState<any>(null);
    // 구독 게이트 모달
    const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
    const [subscriptionModalMsg, setSubscriptionModalMsg] = useState('');
    // [구독 모드] 구독 플랜에서 자동 결정된 tier (Step3 자동 적용용)
    const [subscriptionTier, setSubscriptionTier] = useState<string | null>(null);

    // Form State (Hook) — userId 전달로 타 계정의 sessionStorage draft 오염 방지
    const formState = useAdFormState(authUser?.id);

    // [구독 모드] 실제 청구 금액 = Step4 extras만 (Step3 기본가는 구독료에 포함)
    const effectiveTotalAmount = React.useMemo(() => {
        if (!subscriptionTier) return formState.totalAmount;
        const product = DETAILED_PRICING.find(p => p.id === subscriptionTier);
        const basePrice = product ? ((product as any)[`d${formState.selectedAdPeriod}`] as number ?? 0) : 0;
        return Math.max(0, formState.totalAmount - basePrice);
    }, [subscriptionTier, formState.totalAmount, formState.selectedAdPeriod]);

    useBodyScrollLock(!!selectedAdForModal || !!selectedResumeForModal || showDesignModal || showMobileMenu || showExampleModal);
    usePreventLeave(formState.isDirty && view === 'form');

    // [Security] 개인회원이 URL로 직접 view=form 접근 시 dashboard로 자동 전환
    useEffect(() => {
        if (userType === 'individual' && view === 'form') {
            setView('dashboard');
        }
    }, [view, userType]);

    // [Security] 사업자 미인증 corporate → view=form 직접 접근 차단
    // [Fix] bizDataLoaded 추가: bizVerified 로드 완료 전 레이스 컨디션으로 인증 유저 튕기는 현상 방지
    useEffect(() => {
        if (view === 'form' && userType === 'corporate' && isDataLoaded && bizDataLoaded && !bizVerified) {
            // [UX Fix] alert는 동기적으로 작동하므로 사용자가 확인을 누를 때까지 코드가 멈춤을 이용
            window.alert('사업자 인증 후 광고를 등록하실 수 있습니다.\n\n마이페이지 > 회원정보수정 하단에서\n사업자 인증을 먼저 완료해주세요.');
            setView('dashboard');
        }
    }, [view, userType, bizVerified, isDataLoaded, bizDataLoaded]);

    useEffect(() => {
        // [Critical Fix] 세션 로딩 중에는 아무것도 하지 않음
        // authLoading이 true인 동안 authUserType은 'guest' 초기값 → 리다이렉트 금지
        if (authLoading) return;

        // [Fix v3] window.location.search 직접 참조 (useSearchParams 재동기화 버그 방지)
        const windowParams = new URLSearchParams(window.location.search);
        const simulate = windowParams.get('simulate');
        const viewParam = windowParams.get('view');

        // [Auth Guard] 비로그인(guest) 접근 차단 → 로그인 페이지로
        if (authUserType === 'guest') {
            router.replace('/?page=login');
            return;
        }
        if (authUserType === 'admin' && !simulate) {
            // [Security] Only redirect if absolutely NO view context exists
            if (!viewParam && windowParams.toString() === '') {
                router.replace('/admin');
                return;
            }
        }
        if (authUserType) {
            setUserType(authUserType === 'admin' ? (simulate === 'individual' ? 'individual' : 'corporate') : authUserType);
        }
    }, [authUserType, authLoading, authUser.id, authUser.name, authUser.nickname, searchParams]);

    useEffect(() => {
        // [Fix v3] window.location.search 직접 참조로 근본 원인 해결
        // 원인: replaceState는 window.location은 즉시 업데이트하지만,
        //       useSearchParams()는 Next.js 내부 라우터 상태(서버 최초값)를 반환할 수 있음.
        //       탭 복귀 시 Next.js가 router 재동기화 → searchParams가 서버 최초값(빈값)으로 리셋
        //       → viewParam='dashboard' → 폼이 사라지는 버그.
        // 해결: 항상 window.location.search에서 직접 읽어 실제 URL 기준으로 판단.
        const windowParams = new URLSearchParams(window.location.search);
        const viewParam = (windowParams.get('view') || 'dashboard') as any;
        const currentViewId = typeof view === 'object' ? view.id : view;

        if (viewParam !== currentViewId) {
            _setView(viewParam);
        }
    }, [searchParams]); // searchParams 변경 시 트리거, 하지만 읽기는 window.location에서

    useEffect(() => {
        const handleToggle = () => {
            setShowMobileMenu(true);
        };
        // [New Navigator Integration] Listen for Global Header Menu Click
        window.addEventListener('open-my-shop-menu', handleToggle);
        return () => window.removeEventListener('open-my-shop-menu', handleToggle);
    }, []);

    useEffect(() => {
        // [Fix v3] window.location.search 직접 참조 (useSearchParams 라우터 재동기화 버그 방지)
        const windowParams = new URLSearchParams(window.location.search);
        const adIdParam = windowParams.get('id');
        const viewParam = windowParams.get('view');
        const hasNewParam = windowParams.has('new');
        const isNewParam = windowParams.get('new') === 'true';

        // [Critical Fix] Only sync isNewEntry from URL if we are NOT in the middle of a view transition
        // or if the URL explicitly has the 'new' parameter.
        if (viewParam === 'form') {
            if (hasNewParam) {
                setIsNewEntry(isNewParam);
            }
        }

        setEditingAdId(adIdParam);
        if (view === 'form' && adIdParam && isDataLoaded && registeredAds.length > 0) {
            if (lastLoadedId !== adIdParam) {
                const ad = registeredAds.find(a => String(a.id) === String(adIdParam));
                if (ad) {
                    formState.loadAdData(ad);
                    // [Fix] 인증된 업체회원 — 프로필 상호명으로 덮어쓰기 (ad.name 대신)
                    if (bizVerified && bizShopName) formState.setShopName(bizShopName);
                    setLastLoadedId(adIdParam);
                }
            }
        } else if (view !== 'form') {
            if (lastLoadedId !== null && !tabFocusRef.current) setLastLoadedId(null);
        }
    }, [searchParams, view, isDataLoaded, registeredAds, lastLoadedId]);

    // [tier 자동선택] PaymentPopup에서 tier 파라미터와 함께 view=form으로 진입 시 Step3 자동 선택
    useEffect(() => {
        const tierParam = searchParams.get('tier');
        if (view === 'form' && tierParam && !formState.selectedAdProduct) {
            const product = DETAILED_PRICING.find(p => p.altId === tierParam || p.id === tierParam);
            if (product) {
                formState.setSelectedAdProduct(product.id);
                formState.setSelectedAdPeriod(30);
            }
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [view, isNewEntry]);

    const onPreview = () => {
        const newAd = {
            id: 'preview',
            title: formState.title || '제목을 입력해주세요',
            nickname: (['닉네임','관리자',''].includes(formState.nickname) ? null : formState.nickname) || bizShopName || authUser.name || '',
            managerName: formState.managerName,
            managerPhone: formState.managerPhone,
            messengers: formState.messengers || [],
            category: formState.industryMain || '업종',
            categorySub: formState.industrySub,
            regionCity: formState.regionCity || '지역',
            regionGu: formState.regionGu,
            payType: formState.payType || '시급',
            payAmount: formState.payAmount || 0,
            content: formState.editorRef.current?.innerHTML || '<p>내용이 없습니다.</p>',
            keywords: formState.selectedKeywords || [],
            updateDate: new Date().toISOString().split('T')[0],
            deadline: new Date(Date.now() + (Number(formState.selectedAdPeriod || 30)) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            applicantCount: 0,
            status: 'PENDING_REVIEW',
            productType: formState.selectedAdProduct || '그랜드',
            options: {
                icon: formState.selectedIcon,
                icon_period: formState.iconPeriod,
                highlighter: formState.selectedHighlighter,
                highlighter_period: formState.highlighterPeriod,
                border: formState.borderOption,
                border_period: formState.borderPeriod,
                paySuffixes: formState.paySuffixes,
                messengers: formState.messengers,
                keywords: formState.selectedKeywords
            },
            // [Fix] Add flattened fields for AdDetailModal compatibility
            selectedIcon: formState.selectedIcon,
            selectedHighlighter: formState.selectedHighlighter,
            borderOption: formState.borderOption,
            paySuffixes: formState.paySuffixes
        };
        setSelectedAdForModal(newAd);
    };

    const handleDelete = async (adId: number | string) => {
        if (!confirm('정말 삭제하시겠습니까?')) return;

        try {
            // [Admin Bypass] Admin can delete any ad
            const isAdmin = userType === 'admin';

            if (!authUser.id.startsWith('mock_')) {
                // Admin uses service role to bypass RLS
                if (isAdmin) {
                    const { error } = await supabase.from('shops').delete().eq('id', adId);
                    if (error) {
                        throw error;
                    }
                } else {
                    // Regular user - RLS applies
                    const { error } = await supabase.from('shops').delete().eq('id', adId).eq('user_id', authUser.id);
                    if (error) {
                        throw error;
                    }
                }
            }

            // Also remove from localStorage
            const mockAdsRaw = localStorage.getItem('coco_mock_ads');
            if (mockAdsRaw) {
                const mockAds = JSON.parse(mockAdsRaw);
                const newMocks = mockAds.filter((a: any) => String(a.id) !== String(adId));
                localStorage.setItem('coco_mock_ads', JSON.stringify(newMocks));
            }

            // Instant UI update + DB refresh
            setRegisteredAds(prev => prev.filter(a => String(a.id) !== String(adId)));
            fetchRegisteredAds();

        } catch (err: any) {
            console.error('[DELETE] Failed:', err);
            alert("삭제 실패: " + err.message);
        }
    };

    // [구독 게이트] 새 광고 등록 전 웨이터존 구독 여부 확인 (어드민 bypass)
    const handleNewAdWithSubCheck = async () => {
        const prepareNewAdState = () => {
            setIsNewEntry(true);
            setEditingAdId(null);
            editingAdIdRef.current = null;
            formState.resetAdStates();
            if (profileRegionCity) formState.setRegionCity(profileRegionCity);
            if (profileRegionGu) formState.setRegionGu(profileRegionGu);
            if (bizVerified && bizShopName) formState.setShopName(bizShopName);
        };

        // 어드민은 구독 체크 없이 바로 진행 (구독 모드 아님)
        if (authUserType === 'admin') {
            setSubscriptionTier(null);
            prepareNewAdState();
            setShowWarningModal(true);
            return;
        }

        try {
            const res = await fetch(`/api/subscription/check?userId=${authUser.id}`);
            const data = await res.json();
            if (data.hasAccess) {
                prepareNewAdState();
                // [Step 3 자동화] 구독 플랜 기반 티어 저장 → WarningModal confirm 시 재적용
                const tier = data.tier || null;
                setSubscriptionTier(tier);
                setShowWarningModal(true);
            } else {
                setSubscriptionTier(null);
                setSubscriptionModalMsg(data.message || '웨이터존 구독이 필요합니다. 야사장에서 구독 플랜을 선택해주세요.');
                setShowSubscriptionModal(true);
            }
        } catch {
            // 네트워크 오류 시 fail-open (UX 우선 — 차단보다 통과)
            setSubscriptionTier(null);
            prepareNewAdState();
            setShowWarningModal(true);
        }
    };

    const handleSave = async () => {
        try {
            // [Validation UX 강화] 상세 누락 항목 체크 및 자동 스크롤
            const missingFields = [];

            // [Fix] Auto-fill Manager Name if missing (Safety Net)
            let finalManagerName = formState.managerName?.trim();
            if (!finalManagerName) {
                // Priority: Real Name > '관리자'
                finalManagerName = (authUser?.name && authUser.name !== '게스트') ? authUser.name : '관리자';
                formState.setManagerName(finalManagerName); // Update State for UI
            }

            // Step 1: Shop Info
            if (!formState.shopName?.trim()) missingFields.push('상호명');
            if (!finalManagerName) missingFields.push('담당자명');
            if (!formState.managerPhone?.trim()) missingFields.push('연락처');

            // Step 2: Job Detail
            if (!formState.title?.trim()) missingFields.push('공고 제목');
            if (!formState.industryMain) missingFields.push('업종 선택');
            if (!formState.regionCity) missingFields.push('지역 선택');
            if (!formState.payType || formState.payType === '종류선택' || formState.payType === '급여방식선택') missingFields.push('급여 방식');
            if (formState.payType !== '협의' && (!formState.payAmount || Number(formState.payAmount) === 0)) missingFields.push('급여 금액');

            if (missingFields.length > 0) {
                alert(`[필수 항목 누락]\n${missingFields.join(', ')} 항목을 입력해주세요.`);
                // 누락된 필드에 따라 자동 스크롤
                const targetId = (!formState.shopName || !formState.managerName || !formState.managerPhone) ? 'myshop-step-1' :
                    (!formState.title || !formState.industryMain || !formState.regionCity) ? 'myshop-step-2' : 'myshop-step-3';

                const element = document.getElementById(targetId);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
                return;
            }

            // [Phase A 정정] STEP3(메인 광고 상품)·STEP4(부스터) 제거됨 — 야사장 구독/입점 방식으로 변경
            // 기존 selectedAdProduct·borderOption 검증은 잔재 코드. 제거하지 않으면 등록 막힘.

            setIsSaving(true);
            // [Fix] 에디터 내용 최종 동기화 강제 (저장 직전)
            if (formState.editorRef.current) {
                formState.setEditorHtml(formState.editorRef.current.innerHTML);
            }

            // --- Step 4 Validation ---
            if (formState.selectedIcon && Number(formState.iconPeriod) === 0) {
                alert("'10종 무빙 아이콘'의 기간을 선택해주세요."); setIsSaving(false); return;
            }
            if (formState.selectedHighlighter && Number(formState.highlighterPeriod) === 0) {
                alert("'10종 형광펜'의 기간을 선택해주세요."); setIsSaving(false); return;
            }
            if (formState.borderOption !== 'none' && Number(formState.borderPeriod) === 0) {
                alert("'테두리 효과'의 기간을 선택해주세요."); setIsSaving(false); return;
            }

            // --- Monthly Edit Limit Logic ---
            const now = new Date();
            const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
            const originalAd = editingAdId ? registeredAds.find(a => String(a.id) === String(editingAdId)) : null;

            // [Resilient Retrieval] Fallback to multiple potential locations for edit_count
            let editCount = originalAd?.options?.edit_count || originalAd?.edit_count || 0;
            const lastEditMonth = originalAd?.options?.last_edit_month || originalAd?.last_edit_month;

            // 월이 바뀌었으면 0으로 초기화
            if (lastEditMonth !== currentMonth) {
                editCount = 0;
            }

            if (editingAdId) {
                editCount += 1;
            }

            const isMockUser = authUser.id.startsWith('mock_');
            const isTargetMock = editingAdId ? String(editingAdId).startsWith('AD_MOCK_') : isMockUser;

            const cleanContent = formState.editorRef.current?.innerHTML || formState.editorHtml;
            // 플레이스홀더('닉네임', '관리자')는 무효 처리 → 상호명으로 폴백
            const INVALID_NICK_VALS = ['닉네임', '관리자', ''];
            const rawFormNick = formState.nickname;
            const cleanNickname = (!INVALID_NICK_VALS.includes(rawFormNick) ? rawFormNick : null)
                || (!INVALID_NICK_VALS.includes(authUser.nickname) ? authUser.nickname : null)
                || bizShopName  // 업체회원의 경우 상호명
                || authUser.name
                || '';

            // [Strategy] Reject if payload contains massive Base64 images
            if (cleanContent.includes('data:image/') && cleanContent.length > 800000) {
                alert("이미지 용량이 너무 큽니다. 에디터에 직접 붙여넣은 이미지는 한 개당 0.5MB를 초과할 수 없습니다. 이미지를 압축하거나 파일 업로드 기능을 이용해주세요.");
                setIsSaving(false);
                return;
            }

            // [Strategy] Preserve original product info if in edit mode
            const finalProductType = originalAd ? (originalAd.productType || originalAd.ad_type || formState.selectedAdProduct) : formState.selectedAdProduct;
            const finalDeadline = originalAd ? (originalAd.deadline || originalAd.options?.deadline) : (new Date(Date.now() + (Number(formState.selectedAdPeriod || 30)) * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);

            // [Fix] Remove forced sanitization - let user select what they want
            const cleanCategorySub = formState.industrySub || '';

            // [Standard Fix] pay_type이 '급여방식선택'인 레거시 오류 방지
            let finalPayType = formState.payType;
            if (!finalPayType || finalPayType === '급여방식선택' || finalPayType === '종류선택') {
                // 선택되지 않았을 경우 '협의'로 폴백하거나 에러 처리 (여기서는 협의로 유도)
                finalPayType = '협의';
            }

            const isYasajangAd = !!(originalAd?.options?.yasajang_business_id);
            const finalStatus = (isYasajangAd && originalAd?.status === 'active') ? 'active' : 'pending';

            const adData: any = {
                // [Standard Root Columns] - V4 DB 컬럼명 100% 준수
                name: formState.shopName,
                title: formState.title,
                region: formState.regionCity,
                phone: formState.managerPhone,
                kakao: formState.messengers.kakao,
                line: formState.messengers.line,
                telegram: formState.messengers.telegram,
                tier: finalProductType,
                pay: String(formState.payAmount),
                pay_amount: parseInt(String(formState.payAmount).replace(/,/g, '') || '0'),
                pay_type: finalPayType,
                category: formState.industryMain,
                category_sub: cleanCategorySub,
                work_region_sub: formState.regionGu,
                content: cleanContent,
                nickname: cleanNickname,
                manager_name: formState.managerName,
                manager_phone: formState.managerPhone,
                media_url: formState.mediaUrl,
                edit_count: editCount,
                last_edit_month: currentMonth,
                ad_price: effectiveTotalAmount,
                ad_duration: Number(formState.selectedAdPeriod || 30),
                updated_at: new Date().toISOString(),
                status: finalStatus,
                user_id: authUser.id,
                deadline: finalDeadline,
                product_type: finalProductType,
                platform: 'waiterzone', // [플랫폼 분리] P9 웨이터존 공고

                // [Snapshot Bucket] - UI용 핵심 정보 보관
                options: {
                    ...(originalAd?.options || {}),
                    managerName: formState.managerName,
                    managerPhone: formState.managerPhone,
                    payType: finalPayType,
                    payAmount: parseInt(String(formState.payAmount).replace(/,/g, '') || '0'),
                    product_type: finalProductType,
                    product_period: originalAd ? (originalAd.options?.product_period || originalAd.productPeriod) : formState.selectedAdPeriod,
                    status: finalStatus,
                    deadline: finalDeadline,
                    keywords: formState.selectedKeywords,
                    icon: formState.selectedIcon,
                    icon_period: formState.iconPeriod,
                    highlighter: formState.selectedHighlighter,
                    highlighter_period: formState.highlighterPeriod,
                    border: formState.borderOption,
                    border_period: formState.borderPeriod,
                    paySuffixes: formState.paySuffixes,  // camelCase — ShopCard/AdBannerCard 읽기 규격 통일 (2026-03-22)
                    ad_price: effectiveTotalAmount,
                    ageMin: formState.ageMin,
                    ageMax: formState.ageMax,
                    addressDetail: formState.addressDetail,
                    regionCity: formState.regionCity,
                    regionGu: formState.regionGu,
                    mediaUrl: formState.mediaUrl,
                    // 메신저 ID 스냅샷 (shops 테이블에 line 루트 컬럼 미존재 → options에 저장)
                    kakao: formState.messengers.kakao,
                    line: formState.messengers.line,
                    telegram: formState.messengers.telegram,
                    // [스냅샷] 업종 정보 — normalizeAd workType 복원용
                    shopName: formState.shopName,
                    category: formState.industryMain,
                    industrySub: cleanCategorySub,
                    categorySub: cleanCategorySub,
                    // [지도 스냅샷] 관리자 팝업 지도 표시용 — RLS 없이 주소 조회 가능하도록 저장
                    businessAddress: bizAddress || (originalAd?.options as any)?.businessAddress || ''
                }
            };

            let newShopId: any = editingAdId;
            if (editingAdId) {
                if (!isTargetMock) {
                    // [Critical Fix] Real DB Ad Update
                    // Remove 'ad_price' AND 'price' from DB payload as columns may not exist
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    // [Critical Fix] Strictly filter payload for 'shops' table update
                    const validColumns = [
                        'name', 'title', 'region', 'phone', 'kakao', 'line', 'telegram', 'tier',
                        'pay', 'pay_amount', 'pay_type', 'category', 'category_sub',
                        'work_region_sub', 'content', 'nickname', 'manager_name', 'manager_phone',
                        'edit_count', 'last_edit_month', 'ad_price', 'updated_at', 'status', 'user_id', 'deadline', 'options', 'product_type', 'media_url',
                        'banner_position', 'banner_image_url', 'banner_media_type', 'banner_status',
                    ];
                    const dbPayload: any = {};
                    validColumns.forEach(col => {
                        const val = adData[col];
                        if (val !== undefined && val !== null) {
                            // [Standard Fix] Trust Supabase-js for automatic JSON serialization
                            dbPayload[col] = val;
                        }
                    });

                    const { data, error } = await supabase.from('shops')
                        .update(dbPayload)
                        .eq('id', String(editingAdId))
                        .select()
                        .single();

                    if (error) throw new Error(`DB 업데이트 실패: ${error.message}`);
                    if (!data) throw new Error("업데이트할 공고를 찾을 수 없습니다.");
                }
                else {
                    // [Fix] Mock Ad Update (localStorage)
                    const mockAds = JSON.parse(localStorage.getItem('coco_mock_ads') || '[]');
                    const idx = mockAds.findIndex((a: any) => String(a.id) === String(editingAdId));
                    if (idx !== -1) {
                        mockAds[idx] = { ...mockAds[idx], ...adData };
                        localStorage.setItem('coco_mock_ads', JSON.stringify(mockAds));
                    } else {
                        throw new Error("수정하려는 임시 데이터를 찾을 수 없습니다.");
                    }
                }
                // [Critical Fix] Normalized Update to keep UI consistent with form fields
                setRegisteredAds(prev => prev.map(a =>
                    String(a.id) === String(editingAdId)
                        ? normalizeAd({ ...a, ...adData, options: { ...(a.options || {}), ...(adData.options || {}) } })
                        : a
                ));
            } else {
                if (!isTargetMock) {
                    // [Critical Fix] Payload Sanitization - Filter only valid shops table columns
                    const validColumns = [
                        'name', 'title', 'region', 'phone', 'kakao', 'line', 'telegram', 'tier',
                        'pay', 'pay_amount', 'pay_type', 'category', 'category_sub',
                        'work_region_sub', 'content', 'nickname', 'manager_name', 'manager_phone',
                        'edit_count', 'last_edit_month', 'ad_price', 'updated_at', 'status', 'user_id', 'deadline', 'options', 'product_type', 'media_url',
                        'banner_position', 'banner_image_url', 'banner_media_type', 'banner_status',
                        'platform',
                    ];
                    const dbPayload: any = {};
                    validColumns.forEach(col => {
                        const val = adData[col];
                        if (val !== undefined && val !== null) {
                            // [Standard Fix] Trust Supabase-js for automatic JSON serialization
                            dbPayload[col] = val;
                        }
                    });
                    // [Migration 07] 플랫폼 태깅 — 웨이터존 공고임을 명시
                    dbPayload.platform = 'waiterzone';

                    const { data, error } = await supabase.from('shops').insert([dbPayload]).select().single();
                    if (error) throw new Error(`DB 삽입 실패: ${error.message}`);
                    newShopId = data.id;
                    // [Added] Insert into local state with normalization
                    setRegisteredAds(prev => [normalizeAd(data), ...prev]);
                } else {
                    const newId = `AD_MOCK_${Date.now()}`;
                    const mockAds = JSON.parse(localStorage.getItem('coco_mock_ads') || '[]');
                    const newMockAd = { ...adData, id: newId, isMock: true, created_at: new Date().toISOString() };
                    localStorage.setItem('coco_mock_ads', JSON.stringify([newMockAd, ...mockAds]));
                    newShopId = newId;
                    setRegisteredAds(prev => [normalizeAd(newMockAd), ...prev]);
                }
            }

            // [Fix] 무료 이벤트 광고(p7e 등 0원) + 구독 포함 광고 → 관리자 텔레그램 알림 발송
            if (!editingAdId && newShopId && !isTargetMock && effectiveTotalAmount === 0) {
                fetch('/api/notify/new-payment', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        shopName: formState.shopName,
                        amount: 0,
                        product: formState.selectedAdProduct,
                        title: formState.title,
                    }),
                }).catch(() => {});
            }

            if (!editingAdId && newShopId && !isTargetMock) {
                // [CLAUDE.md 결제흐름 기준] 신규 공고 등록 시 항상 payments row 생성 (0원 포함)
                // 어드민 승인 시 update-shop-status가 이 row를 찾아 UPDATE함
                // [구독 모드] platform='waiterzone' 명시, amount=effectiveTotalAmount (Step4 extras만)
                const paymentData = {
                    user_id: authUser.id,
                    shop_id: newShopId,
                    amount: effectiveTotalAmount,
                    method: subscriptionTier ? 'subscription' : 'bank_transfer',
                    status: 'pending',
                    description: subscriptionTier
                        ? `[구독포함:${subscriptionTier}] ${formState.shopName} 공고 등록`
                        : `[${formState.selectedAdProduct}] ${formState.shopName} 공고 결제`,
                    platform: 'waiterzone', // [플랫폼 분리] P9 웨이터존 결제
                    metadata: {
                        nickname: cleanNickname,
                        shopName: formState.shopName,
                        adTitle: formState.title,
                        product_type: finalProductType,
                        subscription_tier: subscriptionTier || null,
                    },
                    created_at: new Date().toISOString()
                };
                const { error } = await supabase.from('payments').insert([paymentData]);
                    if (error) {
                        console.error("Payment log failed", error);
                        alert(`결제 내역 생성 실패: ${error.message}`);
                    } else {
                        // 텔레그램 관리자 알림
                        fetch('/api/notify/new-payment', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                shopName: formState.shopName,
                                amount: effectiveTotalAmount,
                                product: formState.selectedAdProduct,
                                title: formState.title,
                            }),
                        }).catch(() => {});
                    }
                // DB에서 다시 읽어 최신 결제 상태 반영
                fetchPaymentHistory();
            }

            // [무통장 입금 안내] 신규 공고: effectiveTotalAmount > 0일 때만 (구독 포함 = 0원이므로 skip)
            if (!editingAdId && effectiveTotalAmount > 0) {
                setBankModalAmount(effectiveTotalAmount);
                formState.resetAdStates();
                window.dispatchEvent(new CustomEvent('resume-updated'));
                isJustSaved.current = true;
                setTimeout(() => { isJustSaved.current = false; }, 10000);
                setShowBankModal(true);
            } else {
                // 수정이거나 무료 등록인 경우 바로 대시보드로
                formState.resetAdStates();
                window.dispatchEvent(new CustomEvent('resume-updated'));
                isJustSaved.current = true;
                setTimeout(() => { isJustSaved.current = false; }, 10000);
                alert(editingAdId ? '공고가 수정되었습니다.' : '공고가 접수되었습니다.');
                setView('dashboard');
            }
        } catch (err: any) {
            console.error("Save Error:", err);
            if (err.message?.includes('Failed to fetch')) {
                alert(`DB 연결 오류 (Failed to fetch): 네트워크가 불안정하거나 서버 응답 크기가 너무 큽니다.\n\n[진단 팁]\n1. 브라우저의 '광고 차단 프로그램(AdBlock 등)'을 끈 뒤 재시도해주세요.\n2. 에디터에 붙여넣은 대용량 이미지가 있다면 삭제 후 다시 작성해주세요.\n3. 계속 발생할 경우 사내망 방화벽을 확인해주세요.`);
            } else {
                alert(`오류: ${err.message}`);
            }
        }
        finally { setIsSaving(false); }
    };

    // [Feature] Auto-fill Manager Info from Auth
    useEffect(() => {
        if (view === 'form' && authUser && authUser.id !== 'guest') {
            if (!formState.managerName) {
                const name = (authUser.name && authUser.name !== '게스트') ? authUser.name : '관리자';
                formState.setManagerName(name);
            }
            // phone exists in some session structures, check and fill if available
            const userPhone = (authUser as any).phone || (authUser as any).phoneNumber;
            if (!formState.managerPhone && userPhone) {
                formState.setManagerPhone(userPhone);
            }
        }
    }, [view, authUser, formState.managerName, formState.managerPhone]);

    const handleJump = async (adId: any) => {
        if (!authUser?.id || authUser.id === 'guest') return;

        try {
            // 1. Get ad details for tier and jump counts
            const ad = registeredAds.find(a => String(a.id) === String(adId));
            if (!ad) throw new Error('공고를 찾을 수 없습니다.');

            // [Guard] 관리자 승인(active) 상태만 점프 허용
            const adStatus = (ad.status || '').toLowerCase();
            if (adStatus !== 'active') {
                const msg = adStatus === 'pending_review' || adStatus === 'pending'
                    ? '관리자 승인 대기 중입니다.\n승인 완료 후 점프 기능을 이용할 수 있습니다.'
                    : adStatus === 'rejected'
                    ? '반려된 공고는 점프할 수 없습니다.\n공고를 수정 후 재신청해 주세요.'
                    : '현재 점프 기능을 사용할 수 없는 상태입니다.';
                alert(msg);
                return;
            }

            // [Fix] getJumpConfig로 tier 매핑 통일 (p1~p7, altId, 레거시 한글명 모두 대응)
            const tierKey = (ad.productType || ad.tier || ad.product_type || ad.ad_type || ad.options?.product_type || 'p7').toLowerCase();
            const { manual: maxJumps } = getJumpConfig(tierKey);
            
            const options = ad.options || {};
            // KST timezone today
            const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Seoul' });
            
            let currentJumps = options.daily_manual_jump_count || 0;
            if (options.last_manual_jump_date !== today) {
                currentJumps = 0;
            }
            
            let isPaidJump = false;
            if (currentJumps >= maxJumps) {
                if (userJumpBalance <= 0) {
                if (window.confirm('잔여 횟수가 소진되었습니다.\n\n점프 서비스 구매 페이지로 이동하시겠습니까?')) {
                    setView('buy-points');
                }
                return;
            }

            if (!window.confirm(`오늘 제공된 무료 점프 횟수를 모두 소진했습니다. (${maxJumps}/${maxJumps}회)\n\n보유 중인 유료 점프 이용권 1회를 사용하여 추가 점프하시겠습니까?\n(현재 잔여: ${userJumpBalance}회)`)) {
                    return;
                }
                
                // 유료 점프 횟수 차감 (profiles 테이블의 jump_balance)
                const { error: deductError } = await supabase.from('profiles')
                    .update({ 
                        jump_balance: userJumpBalance - 1, 
                        updated_at: new Date().toISOString() 
                    })
                    .eq('id', authUser.id);
                
                if (deductError) throw deductError;

                // 점프 로그 — point_logs 실제 컬럼: id/user_id/amount/reason/created_at 만 존재 (note/description 없음)
                await supabase.from('point_logs').insert({
                    user_id: authUser.id,
                    amount: -1,
                    reason: `SHOP_JUMP_PAID:${adId}`,
                });
                
                isPaidJump = true;
            } else {
                if (!window.confirm(`공고를 가장 위로 끌어올립니다.\n(무료 잔여 횟수: ${maxJumps - currentJumps}회 / 일일 최대 ${maxJumps}회)\n\n수동 점프를 사용하시겠습니까?`)) return;
            }

            const newOptions = {
                ...options,
                daily_manual_jump_count: isPaidJump ? currentJumps : currentJumps + 1,
                last_manual_jump_date: today
            };
            const nowIso = new Date().toISOString();

            const { error: jumpError } = await supabase.from('shops')
                .update({ 
                    created_at: nowIso, 
                    updated_at: nowIso,
                    options: newOptions 
                })
                .eq('id', adId).eq('user_id', authUser.id);
            if (jumpError) throw jumpError;

            if (isPaidJump) {
                alert(`유료 점프권 1회를 사용하여 성공적으로 추가 JUMP 되었습니다! ✨\n(잔여 유료 횟수: ${userJumpBalance - 1}회)`);
                // useAuth의 세션 업데이트 유도를 위해 credit-updated 이벤트 활용 (또는 페이지 리로드)
                window.dispatchEvent(new Event('credit-updated'));
            } else {
                alert(`무료 JUMP 완료! ✨\n(오늘 남은 무료 횟수: ${maxJumps - (currentJumps + 1)}회)`);
            }
            
            fetchRegisteredAds();
        } catch (err: any) {
            console.error('Jump error:', err);
            alert(`오류: ${err.message}`);
        }
    };

    const handleExtend = async (adId: string, period: 30 | 60 | 90, amount: number) => {
        setShowExtendModal(false);
        setExtendTargetAd(null);

        try {
            if (!authUser?.id || authUser.id === 'guest') return;

            const ad = registeredAds.find(a => String(a.id) === String(adId));
            if (!ad) throw new Error('공고를 찾을 수 없습니다.');

            if (!authUser.id.startsWith('mock_')) {
                const paymentData = {
                    user_id: authUser.id,
                    shop_id: adId,
                    amount,
                    method: 'bank_transfer',
                    status: 'pending',
                    description: `[연장 ${period}일] ${ad.title || ad.name || '공고'} 기간 연장`,
                    metadata: {
                        type: 'extend',
                        period,
                        shopName: bizShopName || formState.shopName,
                        adTitle: ad.title || ad.name || '',
                    },
                    created_at: new Date().toISOString(),
                };

                // ⭐ Phase A-4: payments.platform 명시 (P-08 SSOT)
                const { error } = await supabase.from('payments').insert([{ ...paymentData, platform: 'waiterzone' }]);
                if (error) {
                    console.error('연장 결제 내역 생성 실패:', error);
                    alert(`연장 신청 실패: ${error.message}`);
                    return;
                }

                fetchPaymentHistory();

                // 텔레그램 관리자 알림
                fetch('/api/notify/new-payment', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        shopName: bizShopName || formState.shopName,
                        amount,
                        product: `연장 ${period}일`,
                        title: ad.title || ad.name || '',
                    }),
                }).catch(() => {});
            }

            setBankModalTitle('연장 신청이 접수되었습니다!');
            setBankModalAmount(amount);
            setShowBankModal(true);
        } catch (err: any) {
            console.error('[EXTEND] Error:', err);
            alert('연장 신청 중 오류: ' + err.message);
        }
    };

    const handleToggleAutoJump = async (adId: string, enabled: boolean) => {
        const ad = registeredAds.find(a => String(a.id) === String(adId));
        if (!ad) return;

        const newOptions = { ...(ad.options || {}), auto_jump_enabled: enabled };

        // 즉시 UI 반영
        setRegisteredAds(prev =>
            prev.map(a => String(a.id) === String(adId) ? { ...a, options: newOptions } : a)
        );

        if (!authUser?.id || authUser.id.startsWith('mock_')) return; // mock 세션은 DB 스킵

        const { error } = await supabase
            .from('shops')
            .update({ options: newOptions })
            .eq('id', adId)
            .eq('user_id', authUser.id);

        if (error) {
            // 실패 시 롤백
            setRegisteredAds(prev =>
                prev.map(a => String(a.id) === String(adId) ? { ...a, options: ad.options } : a)
            );
            alert('자동 점프 설정 저장 실패: ' + error.message);
        }
    };

    const handleBack = () => {
        // [Fix] Restore exit confirmation logic
        if (formState.isDirty) {
            if (!window.confirm('작성 중인 내용이 저장되지 않았습니다. 정말 나가시겠습니까?')) {
                return;
            }
        }
        formState.resetAdStates();
        setSubscriptionTier(null); // [구독 모드 해제] 뒤로가기 시 tier 리셋
        setView('dashboard');
    };

    // [Feature] Real-time Sync Payment History with Latest Ad Data
    const syncedPaymentHistory = paymentHistory.map(p => {
        const sid = String(p.shop_id || p.shopId || p.adObject?.id || '');
        const latestAd = registeredAds.find(ad => String(ad.id) === sid);
        if (latestAd) {
            return {
                ...p,
                adTitle: latestAd.title, // [Sync] Overwrite title with latest
                nickname: latestAd.nickname, // [Sync] Overwrite nickname with latest
                // [Sync] Overwrite adObject with latest data to show correct badges and edit count
                adObject: {
                    ...p.adObject,
                    ...latestAd,
                    title: latestAd.title,
                    nickname: latestAd.nickname,
                    options: {
                        ...(p.adObject?.options || {}),
                        ...(latestAd.options || {}),
                        edit_count: latestAd.edit_count || 0
                    }
                }
            };
        }
        return p;
    });

    // [Flicker Guard] 마운트 전, 세션 로딩 중, 혹은 기업회원인데 아직 데이터가 로드되지 않은 경우 로딩 화면 유지
    // [Fix] initialLoadDoneRef: 초기 로드 완료 후 Supabase 토큰갱신으로 authLoading 재발동 시 스피너 표시 안 함
    const showingLoader = !mounted || userType === null || (authLoading && !initialLoadDoneRef.current) || (userType === 'corporate' && !isDataLoaded);
    if (showingLoader) return (
        <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-4">
            <div className="w-10 h-10 border-4 border-[#1e3a5f] border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-bold text-gray-400 animate-pulse">정보를 안전하게 불러오는 중...</p>
        </div>
    );

    const execCmd = (cmd: string, val?: string) => { formState.restoreSelection(); document.execCommand(cmd, false, val); formState.updateToolbarStatus(); formState.syncEditorHtml(); };
    const insertEmoji = (emoji: string) => { formState.restoreSelection(); document.execCommand('insertText', false, emoji); formState.syncEditorHtml(); };
    const handlePayTypeChange = (e: any) => formState.setPayType(e.target.value);
    const handlePayAmountChange = (e: any) => formState.setPayAmount(e.target.value.replace(/[^0-9]/g, ''));
    const togglePaySuffix = (s: string) => {
        if (formState.paySuffixes.includes(s)) formState.setPaySuffixes(formState.paySuffixes.filter(x => x !== s));
        else if (formState.paySuffixes.length < 6) formState.setPaySuffixes([...formState.paySuffixes, s]);
    };

    return (
        <div className={`h-auto ${brand.theme === 'dark' ? 'bg-gray-950 text-white' : 'bg-white text-gray-900'} pb-24`}>
            {/* Modals */}
            {showWarningModal && (
                <WarningModal
                    brand={brand}
                    onClose={() => setShowWarningModal(false)}
                    onConfirm={() => {
                        if (isNewEntry) {
                            formState.resetAdStates();
                            if (profileRegionCity) formState.setRegionCity(profileRegionCity);
                            if (profileRegionGu) formState.setRegionGu(profileRegionGu);
                            if (bizVerified && bizShopName) formState.setShopName(bizShopName);
                            // [구독 모드] reset 후 구독 플랜 tier 재적용 (useEffect 충돌 방지)
                            if (subscriptionTier) {
                                formState.setSelectedAdProduct(subscriptionTier);
                                formState.setSelectedAdPeriod(30);
                            }
                            setView('form', undefined, true);
                        } else {
                            // [Critical Fix] Read from Ref to guarantee we have the ID regardless of render cycle
                            const targetId = editingAdIdRef.current;
                            if (targetId) {
                                setView('form', targetId, false);
                            } else {
                                // Fallback
                                setView('form', undefined, false);
                            }
                        }
                        setShowWarningModal(false);
                    }}
                />
            )}
            {showBankModal && (
                <BankTransferModal
                    amount={bankModalAmount}
                    title={bankModalTitle}
                    onConfirm={() => { setShowBankModal(false); setBankModalTitle(undefined); setView('dashboard'); }}
                />
            )}
            {showExtendModal && extendTargetAd && (
                <ExtendAdModal
                    ad={extendTargetAd}
                    brand={brand}
                    onConfirm={handleExtend}
                    onClose={() => { setShowExtendModal(false); setExtendTargetAd(null); }}
                />
            )}
            {showDesignModal && <DesignRequestModal brand={brand} onClose={() => setShowDesignModal(false)} user={authUser} shopName={bizShopName || formState.shopName} />}
            {showExampleModal && <ExampleModal show={true} type={exampleType} onClose={() => setShowExampleModal(false)} brand={brand} />}
            {showTemplateModal && (
                <AdTemplateModal
                    brand={brand}
                    onClose={() => setShowTemplateModal(false)}
                    onApply={(html) => {
                        if (formState.editorRef.current) {
                            formState.editorRef.current.innerHTML = html;
                            formState.syncEditorHtml();
                            formState.setIsEditorDirty(true);
                        }
                    }}
                />
            )}

            {selectedAdForModal && (
                <AdDetailModal ad={selectedAdForModal} onClose={() => setSelectedAdForModal(null)} />
            )}
            {selectedResumeForModal && (
                <ResumeDetailModal resume={selectedResumeForModal} onClose={() => setSelectedResumeForModal(null)} />
            )}

            {showMobileMenu && (
                <BusinessMobileMenu
                    brand={brand}
                    onClose={() => setShowMobileMenu(false)}
                    setView={setView}
                    shopName={userType === 'individual' ? (authUser?.nickname || authUser?.name || '개인회원') : (bizShopName || formState.shopName || '내 상점')}
                    nickname={formState.nickname || authUser?.nickname || '회원님'}
                    router={router}
                    userType={userType}
                />
            )}

            {/* Global Mobile Menu Trigger (Moves to Header position) */}
            <button 
                onClick={() => setShowMobileMenu(true)}
                className="md:hidden fixed top-[10px] right-3 z-[20005] p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
                <Menu size={26} className={brand.theme === 'dark' ? 'text-white' : 'text-gray-900'} />
            </button>

            {/* Content View */}
            {view !== 'form' && (
                <div className="max-w-6xl mx-auto px-4 md:px-6">
                    {/* Common Header */}
                    <div
                        className={`p-4 md:p-6 sm:rounded-[32px] shadow-sm border mb-5 mt-2 md:mt-4 ${brand.theme === 'dark' ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'}`}
                    >
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <h1 onClick={() => setView('dashboard')} className="text-xl md:text-2xl font-black flex items-center gap-3 cursor-pointer hover:text-blue-500 transition">
                                    <span className="hidden md:inline-block w-2 h-8 bg-blue-500 rounded-full"></span>
                                    마이페이지
                                </h1>
                            </div>
                            <div className="text-xs font-bold text-gray-400">MY DASHBOARD</div>
                        </div>
                    </div>

                    <div className={`grid grid-cols-1 ${userType === 'individual' ? '' : 'md:grid-cols-4'} gap-4 md:pt-0 md:pb-6`}>
                        {userType === 'corporate' && (
                            <BusinessSidebar brand={brand} shopName={bizShopName || formState.shopName} nickname={formState.nickname || authUser?.nickname || '사장님'} view={view} setView={setView} />
                        )}

                        <div className={userType === 'individual' ? 'w-full' : 'col-span-3 space-y-4'}>
                            {userType === 'individual' ? (
                                <PersonalDashboard view={view} setView={setView} resumeCount={resumeCount} onShowResumeDetail={(r) => setSelectedResumeForModal(r)} authUser={authUser} />
                            ) : (
                                <>
                                    {userType === 'corporate' && (
                                        <>
                                            {view === 'dashboard' && (
                                                <BusinessDashboard
                                                    brand={brand} shopName={bizShopName || formState.shopName} nickname={formState.nickname} isVerified={formState.isVerified} bizVerified={bizVerified} bizAddress={bizAddress} onGoMemberInfo={() => setView('member-info')}
                                                    handleAdClick={(isNew, ad) => {
                                                        if (isNew) {
                                                            // [구독 게이트] 새 광고는 구독 확인 후 진행
                                                            handleNewAdWithSubCheck();
                                                        } else if (ad) {
                                                            // 기존 광고 수정은 구독 체크 불필요 + 구독 모드 해제
                                                            setSubscriptionTier(null);
                                                            setIsNewEntry(false);
                                                            setEditingAdId(ad.id);
                                                            editingAdIdRef.current = ad.id;
                                                            formState.loadAdData(ad);
                                                            if (bizVerified && bizShopName) formState.setShopName(bizShopName);
                                                            setShowWarningModal(true);
                                                        }
                                                    }}
                                                    setShowDesignModal={setShowDesignModal} setView={setView} router={router} ads={registeredAds || []} onOpenMenu={() => setShowMobileMenu(true)} onShowAdDetail={(ad) => setSelectedAdForModal(ad)} onDeleteAd={handleDelete} onJumpAd={handleJump} onExtendAd={(ad) => { setExtendTargetAd(ad); setShowExtendModal(true); }} onToggleAutoJump={handleToggleAutoJump}
                                                />
                                            )}
                                            {view === 'ongoing-ads' && <OngoingAdsView setView={setView} userName={bizShopName || formState.shopName} ads={registeredAds || []} jumpBalance={userJumpBalance || 0} onShowAdDetail={setSelectedAdForModal} onOpenMenu={() => setShowMobileMenu(true)} onDeleteAd={handleDelete} onJumpAd={handleJump} userId={authUser?.id} onNewAd={handleNewAdWithSubCheck} onEditAd={(ad) => { setSubscriptionTier(null); setIsNewEntry(false); setEditingAdId(ad.id); editingAdIdRef.current = ad.id; formState.loadAdData(ad); if (bizVerified && bizShopName) formState.setShopName(bizShopName); setShowWarningModal(true); }} />}
                                            {view === 'payments' && <PaymentsView setView={setView} userName={bizShopName || formState.shopName} payments={syncedPaymentHistory || []} onShowAdDetail={(item) => { const adId = typeof item === 'object' ? (item.id || item.shop_id) : item; const fullAd = registeredAds.find(a => String(a.id) === String(adId)); const ad = fullAd || (typeof item === 'object' ? item : null); if (ad) setSelectedAdForModal(ad); else alert('공고 상세 정보를 찾을 수 없습니다.'); }} onOpenMenu={() => setShowMobileMenu(true)} />}
                                            {view === 'member-info' && <MemberInfoForm {...formState} brand={brand} setView={setView} onOpenMenu={() => setShowMobileMenu(true)} />}
                                            {view === 'change-password' && (userType as any) === 'admin' && <ChangePasswordView setView={setView} />}
                                            {view === 'sos-alert' && <SosAlertView brand={brand} onNewAd={handleNewAdWithSubCheck} />}
                                            {view === 'buy-points' && <PointShopView brand={brand} shopName={bizShopName || formState.shopName} userId={authUser?.id ?? ''} onOpenMenu={() => setShowMobileMenu(true)} />}
                                            {view === 'closed-ads' && <ClosedAdsView setView={setView} userName={bizShopName || formState.shopName} ads={(registeredAds || []).filter(ad => ad?.isClosed)} onShowAdDetail={setSelectedAdForModal} onOpenMenu={() => setShowMobileMenu(true)} onDeleteAd={handleDelete} />}
                                            {view === 'applicants' && <ApplicantsView setView={setView} userName={bizShopName || formState.shopName} userId={authUser?.id ?? ''} onOpenMenu={() => setShowMobileMenu(true)} />}
                                             {view === 'point-history' && <PointHistoryView userId={authUser?.id ?? ''} />}
                                        </>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* 구독 게이트 모달 — 웨이터존 구독 없이 광고 등록 시도 시 표시 */}
            {showSubscriptionModal && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[99999] px-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 animate-fade-in">
                        <div className="text-center mb-5">
                            <div className="w-14 h-14 bg-[#1e3a5f]/10 rounded-full flex items-center justify-center mx-auto mb-3">
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 text-[#1e3a5f]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-black text-gray-900 mb-2">구독이 필요합니다</h3>
                            <p className="text-sm text-gray-600 font-medium leading-relaxed">{subscriptionModalMsg}</p>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setShowSubscriptionModal(false)}
                                className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 font-bold text-sm hover:bg-gray-50 transition-colors"
                            >
                                닫기
                            </button>
                            <a
                                href="https://www.yasajang.kr"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-1 py-3 rounded-xl bg-[#1e3a5f] text-white font-black text-sm text-center hover:bg-[#152d4a] transition-colors"
                                onClick={() => setShowSubscriptionModal(false)}
                            >
                                야사장에서 구독하기
                            </a>
                        </div>
                    </div>
                </div>
            )}

            {view === 'form' && userType === 'individual' && (
                <div className="max-w-6xl mx-auto px-4 py-20 text-center">
                    <p className="text-gray-500 font-bold text-lg mb-2">업체회원만 접근할 수 있는 페이지입니다.</p>
                    <p className="text-gray-400 text-sm mb-6">공고등록은 업체회원 계정으로 이용해 주세요.</p>
                    <button onClick={() => setView('dashboard')} className="px-8 py-3 bg-[#1e3a5f] text-white rounded-2xl font-black hover:bg-[#162d4a] transition-all">마이홈으로 이동</button>
                </div>
            )}

            {view === 'form' && (userType === 'corporate' || userType === 'admin') && (
                <div className="w-full">
                    <AdForm {...formState} totalAmount={effectiveTotalAmount} isSaving={isSaving} isNewEntry={isNewEntry} subscriptionTier={subscriptionTier} brand={brand} setShowDesignModal={setShowDesignModal} setShowTemplateModal={setShowTemplateModal} handleEditorInteract={formState.updateToolbarStatus} saveSelection={formState.saveSelection} execCmd={execCmd} insertEmoji={insertEmoji} handlePayTypeChange={handlePayTypeChange} handlePayAmountChange={handlePayAmountChange} togglePaySuffix={togglePaySuffix} setExampleType={setExampleType} setShowExampleModal={setShowExampleModal} onSave={handleSave} onBack={handleBack} onPreview={onPreview} setSelectedAdPeriod={(v: any) => formState.setSelectedAdPeriod(v)} setBorderOption={(v: any) => formState.setBorderOption(v)} setBorderPeriod={(v: any) => formState.setBorderPeriod(v)} setIconPeriod={(v: any) => formState.setIconPeriod(v)} setHighlighterPeriod={(v: any) => formState.setHighlighterPeriod(v)} />
                </div>
            )}
        </div>
    );
}
