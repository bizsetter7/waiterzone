'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useBrand } from '@/components/BrandProvider';
import { PaymentPopup } from '@/components/home/PaymentPopup';
import { useAuth } from '@/hooks/useAuth';


export const HeroSection = () => {
    const brand = useBrand();
    const router = useRouter();
    const { isLoggedIn, userType, isLoading } = useAuth();
    const [isPaymentPopupOpen, setIsPaymentPopupOpen] = useState(false);

    const handleAdClick = () => {
        if (isLoading) return;
        if (!isLoggedIn) {
            router.push('/?page=login');
            return;
        }
        if (userType === 'individual') {
            alert('업체회원만 이용 가능한 서비스입니다.');
            return;
        }
        // corporate or admin → 결제 팝업 열기
        setIsPaymentPopupOpen(true);
    };

    // Simplified static banner info for diet
    const bannerInfo = {
        title: "1+1 광고 이벤트",
        subtitle: "1개월 결제 시 1개월 추가 무료 제공!",
        bg: "bg-gray-900"
    };

    return (
        <div className="relative w-full h-[360px] md:h-[340px] overflow-hidden bg-slate-950 text-white shadow-2xl">
            {/* Background Layer */}
            <div className={`absolute inset-0 ${bannerInfo.bg} opacity-80`}>
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(30,58,95,0.25),transparent_70%)]" />
            </div>

            {/* Overlay */}
            <div className="absolute inset-0 bg-slate-950/20 backdrop-brightness-75 z-0" />

            {/* Main Content Box - Stable Responsive Layout */}
            <div className="relative z-10 h-full max-w-3xl mx-auto flex flex-col items-center justify-center px-6 text-center">
                <div className="flex flex-col items-center -mt-4 md:-mt-6">
                    {/* Top Divider */}
                    <div className="w-12 md:w-20 h-px bg-gradient-to-r from-transparent via-blue-400 to-transparent opacity-40 mb-6 md:mb-8" />

                    {/* Title */}
                    <h1 className="text-[28px] md:text-[52px] font-black mb-4 md:mb-6 tracking-tighter leading-[1.3] md:leading-[1.1] filter drop-shadow-[0_10px_10px_rgba(0,0,0,0.5)]">
                        <><span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-sky-400 to-blue-500">1+1 광고 이벤트</span><br className="md:hidden" /> 진행중</>
                    </h1>

                    {/* Subtitle */}
                    <div className="flex flex-col items-center">
                        <p className="text-[14px] md:text-lg font-bold text-slate-200 tracking-tight drop-shadow-md leading-[1.6] mb-6 md:mb-8">
                            <span className="md:hidden">웨이터알바·룸웨이터·나이트웨이터·가라오케웨이터<br />구인구직 1위 플랫폼</span>
                            <span className="hidden md:inline">웨이터알바·룸웨이터·나이트웨이터·가라오케웨이터 구인구직 1위 플랫폼</span>
                        </p>
                        
                        {/* Bottom Divider */}
                        <div className="w-12 md:w-20 h-px bg-gradient-to-r from-transparent via-blue-400 to-transparent opacity-40 mb-8 md:mb-10" />
                    </div>

                    {/* Buttons */}
                    {/* Buttons - Raised slightly on PC as requested */}
                    <div className="flex flex-col sm:flex-row gap-2.5 items-center md:-mt-3 animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-300">
                        <button
                            onClick={handleAdClick}
                            className="group relative inline-flex items-center justify-center px-8 py-2.5 md:px-10 md:py-3.5 rounded-xl md:rounded-2xl bg-white text-slate-900 font-bold text-xs md:text-sm shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 overflow-hidden whitespace-nowrap"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-50 to-sky-50 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                            <span className="relative z-10">
                                1+1 이벤트 시작하기 🚀
                            </span>
                        </button>
                        <Link
                            href="/guide"
                            className="group inline-flex items-center justify-center px-8 py-2.5 md:px-10 md:py-3.5 rounded-xl md:rounded-2xl bg-slate-900/40 backdrop-blur-md border border-white/20 text-white font-bold text-xs md:text-sm hover:bg-slate-900/60 transition-all duration-300 whitespace-nowrap"
                        >
                            서비스 가이드 보기
                        </Link>
                    </div>
                </div>
            </div>

            {/* Side Accents - Premium Blue */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/10 blur-[120px] rounded-full -mr-64 -mt-64 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-slate-800/10 blur-[100px] rounded-full -ml-40 -mb-40 pointer-events-none" />

            <PaymentPopup
                isOpen={isPaymentPopupOpen}
                onClose={() => setIsPaymentPopupOpen(false)}
                initialTier="grand"
            />
        </div>
    );
};

