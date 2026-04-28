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

    return (
        <div className="w-full bg-white border-b border-gray-100 py-8 md:py-10 px-4">
            <div className="max-w-3xl mx-auto text-center">
                {/* Event Badge */}
                <span className="inline-block px-3 py-1 bg-[#1e3a5f]/10 text-[#1e3a5f] text-[11px] font-black rounded-full uppercase tracking-widest mb-4">
                    Limited Event
                </span>

                {/* Title */}
                <h1 className="text-[26px] md:text-[42px] font-black text-gray-900 tracking-tighter leading-tight mb-3">
                    <span className="text-[#1e3a5f]">1+1 광고 이벤트</span> 진행중
                </h1>

                {/* Subtitle */}
                <p className="text-sm md:text-base font-bold text-gray-500 mb-6 leading-relaxed">
                    웨이터알바·룸웨이터·나이트웨이터·가라오케웨이터 구인구직 1위 플랫폼
                </p>

                {/* Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 items-center justify-center">
                    <button
                        onClick={handleAdClick}
                        className="px-8 py-3 bg-[#1e3a5f] text-white font-black text-sm rounded-xl shadow-md hover:bg-[#152d4a] transition-colors whitespace-nowrap"
                    >
                        1+1 이벤트 시작하기 🚀
                    </button>
                    <Link
                        href="/guide"
                        className="px-8 py-3 border border-gray-200 text-gray-700 font-bold text-sm rounded-xl hover:bg-gray-50 transition-colors whitespace-nowrap"
                    >
                        서비스 가이드 보기
                    </Link>
                </div>
            </div>

            <PaymentPopup
                isOpen={isPaymentPopupOpen}
                onClose={() => setIsPaymentPopupOpen(false)}
                initialTier="grand"
            />
        </div>
    );
};

