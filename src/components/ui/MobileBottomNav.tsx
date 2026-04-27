'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Home, MessageSquare, User, Sparkles, Plus, ChevronDown, ChevronUp, ShieldCheck, Settings } from 'lucide-react';
import { PaymentPopup } from '@/components/home/PaymentPopup';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useBrand } from '@/components/BrandProvider';
import { NoteService } from '@/lib/noteService';
import { useAuth } from '@/hooks/useAuth';
import { useAdultGate } from '@/hooks/useAdultGate';
import { UI_Z_INDEX } from '@/constants/ui';

export const MobileBottomNav = () => {
    return (
        <React.Suspense fallback={null}>
            <MobileBottomNavContent />
        </React.Suspense>
    );
};

const MobileBottomNavContent = () => {
    const pathname = usePathname();
    const brand = useBrand();
    const router = useRouter();
    const searchParams = useSearchParams();
    const { userType, isLoggedIn, isLoading, user } = useAuth();
    const { requireVerification } = useAdultGate();
    const [isExpanded, setIsExpanded] = useState(true);
    const [mounted, setMounted] = useState(false);
    const [showPaymentPopup, setShowPaymentPopup] = useState(false);

    const [unreadCount, setUnreadCount] = useState(0);

    // mounted 플래그 (SSR 안전)
    useEffect(() => {
        setMounted(true);
    }, []);

    // 안읽은 쪽지 카운트 — user.name 필요, 없으면 스킵
    useEffect(() => {
        const updateUnreadCount = async () => {
            if (!user?.name) return;
            try {
                const unread = await NoteService.getUnread(user.name);
                setUnreadCount(unread.length);
            } catch {
                // 쪽지 배지는 비중요 기능 — 오류 시 무시
            }
        };

        window.addEventListener('notes-updated', updateUnreadCount);
        updateUnreadCount();

        return () => window.removeEventListener('notes-updated', updateUnreadCount);
    }, [user?.name]);

    const navItems = userType === 'admin' ? [
        { label: '홈', icon: <Home size={24} />, href: '/' },
        { label: '통계', icon: <Sparkles size={24} />, href: '/admin?tab=dashboard' },
        {
            label: '회원관리',
            icon: <Plus size={32} className="text-white" />,
            href: '/admin?tab=users',
            isMain: true
        },
        { label: '심사', icon: <ShieldCheck size={24} />, href: '/admin?tab=ad-audit' },
        { label: '설정', icon: <Settings size={24} />, href: '/admin?tab=settings' },
    ] : userType === 'corporate' ? [ // Shop/Business accounts reconfigured
        { label: '홈', icon: <Home size={24} />, href: '/' },
        {
            label: '광고등록',
            icon: <Plus size={24} />,
            href: '/ad-register',
            isAction: false
        },
        {
            label: isExpanded ? '숨기기' : '열기',
            icon: isExpanded ? <ChevronDown size={32} className="text-white" /> : <ChevronUp size={32} className="text-white" />,
            isMain: true,
            isToggle: true
        },
        { label: '쪽지함', icon: <MessageSquare size={24} />, href: '#message-modal', isAction: true },
        { label: 'MY', icon: <User size={24} />, href: '/my-shop' },
    ] : [ // Individual/Guest accounts stay as original
        { label: '홈', icon: <Home size={24} />, href: '/' },
        { label: '커뮤니티', icon: <MessageSquare size={24} />, href: '/community' },
        {
            label: (!mounted || isLoading) ? '등록하기' : (userType === 'individual') ? '이력서등록' : '등록하기',
            icon: <Plus size={32} className="text-white" />,
            href: (mounted && userType === 'individual') ? '/my-shop?view=resume-form' : '/ad-register',
            isMain: true
        },
        { label: '쪽지함', icon: <MessageSquare size={24} />, href: '#message-modal', isAction: true },
        { label: 'MY', icon: <User size={24} />, href: '/my-shop' },
    ];

    const isDark = brand.theme === 'dark';

    const handleMainBtnClick = (e: React.MouseEvent) => {
        requireVerification(() => {
            if (mounted && userType === 'corporate') {
                setIsExpanded(!isExpanded);
            } else if (mounted && userType === 'admin') {
                router.push('/admin?tab=users');
            } else if (mounted && userType === 'individual') {
                e.preventDefault();
                router.push('/my-shop?view=resume-form');
            } else {
                e.preventDefault();
                setShowPaymentPopup(true);
            }
        });
    };



    const isRegForm = pathname === '/my-shop' && searchParams.get('view') === 'form';

    if (isRegForm) return null;

    return (
        <>
            <div className={`fixed bottom-0 left-0 right-0 md:hidden flex flex-col items-center pointer-events-none bottom-nav`} style={{ zIndex: UI_Z_INDEX.NAV_BOTTOM }}>
            {/* Toggle Handle — Visibility corrected: Members/Guest/Admin use this, Corporate uses center button */}
            {userType !== 'corporate' && (
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className={`pointer-events-auto border border-b-0 rounded-t-xl px-4 py-1.5 shadow-md -mb-1 flex items-center gap-1.5 text-xs font-bold transition-colors self-end mr-6 ${mounted && isDark
                        ? 'bg-gray-800 border-gray-700 text-gray-400 hover:text-gray-200'
                        : 'bg-white border-gray-200 text-gray-400 hover:text-gray-600'
                        }`}
                    style={{ zIndex: UI_Z_INDEX.NAV_BOTTOM + 10 }}
                >
                    {isExpanded ? (
                        <>
                            <span>숨기기</span>
                            <ChevronDown size={14} />
                        </>
                    ) : (
                        <>
                            <span>네비게이션 열기</span>
                            <ChevronUp size={14} />
                        </>
                    )}
                </button>
            )}

            {/* Persistent handle if hidden — for corporate accounts */}
            {!isExpanded && userType === 'corporate' && (
                <button
                    onClick={() => setIsExpanded(true)}
                    className={`absolute bottom-4 left-1/2 -translate-x-1/2 w-14 h-14 rounded-full bg-gradient-to-r from-blue-500 to-rose-500 shadow-lg shadow-blue-500/30 flex items-center justify-center pointer-events-auto hover:scale-105 transition-transform`}
                    style={{ zIndex: UI_Z_INDEX.NAV_BOTTOM + 11 }}
                >
                    <ChevronUp size={32} className="text-white" />
                </button>
            )}

                {/* Nav Content */}
                <div
                    className={`
                        w-full border-t shadow-xl pb-safe transition-all duration-300 ease-in-out pointer-events-auto
                        ${mounted && isDark ? 'bg-gray-950 border-gray-800' : 'bg-white border-gray-200'}
                        ${isExpanded ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'}
                    `}
                >
                    <div className="grid grid-cols-5 h-16 items-center px-2">
                        {navItems.map((item, index) => {
                            const isActive = (!item.href || item.href === '/')
                                ? pathname === '/'
                                : item.href?.includes('?')
                                    ? pathname === item.href.split('?')[0] && searchParams.get('tab') === item.href.split('tab=')[1]
                                    : pathname?.startsWith(item.href || '') && item.href !== '#message-modal';

                            if (item.isMain) {
                                return (
                                    <button
                                        key={index}
                                        onClick={handleMainBtnClick}
                                        className="relative -top-5 flex flex-col items-center justify-center cursor-pointer"
                                    >
                                        <div className="w-14 h-14 rounded-full bg-gradient-to-r from-blue-500 to-rose-500 shadow-lg shadow-blue-500/30 flex items-center justify-center hover:scale-105 transition-transform">
                                            {item.icon}
                                        </div>
                                        <span className={`text-[10px] font-bold mt-1 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                                            {item.label}
                                        </span>
                                    </button>
                                );
                            }

                            if (item.isAction) {
                                return (
                                    <button
                                        key={index}
                                        onClick={(e) => {
                                            e.preventDefault();
                                            requireVerification(() => {
                                                // Dispatch open note modal event
                                                window.dispatchEvent(new CustomEvent('open-note-modal'));
                                            });
                                        }}
                                        className={`flex flex-col items-center justify-center gap-1 py-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}
                                    >
                                        <div className="relative">
                                            {item.icon}
                                            {item.label === '쪽지함' && unreadCount > 0 && (
                                                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border border-white animate-pulse"></span>
                                            )}
                                        </div>
                                        <span className="text-[10px] font-medium">
                                            {item.label}
                                        </span>
                                    </button>
                                )
                            }


                            // MY 버튼: 비로그인(guest) 시 로그인 페이지로 이동
                            if (item.href === '/my-shop') {
                                return (
                                    <button
                                        key={index}
                                        onClick={() => {
                                            if (isLoading) return; // 아직 세션 로딩 중이면 무시
                                            if (!isLoggedIn || !userType || userType === 'guest') {
                                                router.push('/?page=login');
                                            } else {
                                                router.push('/my-shop');
                                            }
                                        }}
                                        className={`flex flex-col items-center justify-center gap-1 py-1 ${isActive ? (isDark ? 'text-white' : 'text-gray-900') : (isDark ? 'text-gray-500' : 'text-gray-400')}`}
                                    >
                                        <div className={isActive ? 'text-[#f82b60]' : ''}>
                                            {item.icon}
                                        </div>
                                        <span className={`text-[10px] ${isActive ? 'font-bold' : 'font-medium'}`}>
                                            {item.label}
                                        </span>
                                    </button>
                                );
                            }

                            return (
                                <Link
                                    key={index}
                                    href={item.href || '#'}
                                    className={`flex flex-col items-center justify-center gap-1 py-1 ${isActive ? (isDark ? 'text-white' : 'text-gray-900') : (isDark ? 'text-gray-500' : 'text-gray-400')}`}
                                >
                                    <div className={isActive ? 'text-[#f82b60]' : ''}>
                                        {item.icon}
                                    </div>
                                    <span className={`text-[10px] ${isActive ? 'font-bold' : 'font-medium'}`}>
                                        {item.label}
                                    </span>
                                </Link>
                            );
                        })}
                    </div>
                    {/* Safe Area Spacer for iPhone X+ */}
                    <div className={`h-[env(safe-area-inset-bottom)] ${isDark ? 'bg-gray-950' : 'bg-white'}`} />
                </div>
            </div>

            {showPaymentPopup && (
                <PaymentPopup isOpen={showPaymentPopup} onClose={() => setShowPaymentPopup(false)} />
            )}
        </>
    );
};
