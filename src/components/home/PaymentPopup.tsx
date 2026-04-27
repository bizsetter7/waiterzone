'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useBrand } from '@/components/BrandProvider';
import { X, ExternalLink, Check } from 'lucide-react';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';

interface PaymentPopupProps {
    isOpen: boolean;
    onClose: () => void;
    initialTier?: string;
}

const PLANS = [
    {
        id: 'basic',
        name: '베이직',
        price: 22000,
        tag: null,
        features: [
            { label: '밤길 지도 핀', included: true },
            { label: '웨이터존 구인 노출', included: true },
            { label: '웨이터존 / 선수존', included: false },
            { label: '강조효과 (인기 아이콘)', included: false },
            { label: 'PC 사이드바 노출', included: false },
            { label: 'PC/모바일 최상단 고정', included: false },
        ],
    },
    {
        id: 'standard',
        name: '스탠다드',
        price: 66000,
        tag: null,
        features: [
            { label: '밤길 지도 핀', included: true },
            { label: '웨이터존 구인 노출', included: false },
            { label: '웨이터존 OR 선수존 (택1)', included: true },
            { label: '강조효과 (인기 아이콘)', included: false },
            { label: 'PC 사이드바 노출', included: false },
            { label: 'PC/모바일 최상단 고정', included: false },
        ],
    },
    {
        id: 'special',
        name: '스페셜',
        price: 88000,
        tag: '인기',
        features: [
            { label: '밤길 지도 핀', included: true },
            { label: '웨이터존 구인 노출', included: true },
            { label: '웨이터존 OR 선수존 (택1)', included: true },
            { label: '강조효과 (인기 아이콘)', included: false },
            { label: 'PC 사이드바 노출', included: false },
            { label: 'PC/모바일 최상단 고정', included: false },
        ],
    },
    {
        id: 'deluxe',
        name: '디럭스',
        price: 199000,
        tag: null,
        features: [
            { label: '밤길 지도 핀', included: true },
            { label: '웨이터존 구인 노출', included: true },
            { label: '웨이터존 OR 선수존 (택1)', included: true },
            { label: '강조효과 (인기 아이콘)', included: true },
            { label: 'PC 사이드바 노출', included: true },
            { label: 'PC/모바일 최상단 고정', included: false },
        ],
    },
    {
        id: 'premium',
        name: '프리미엄',
        price: 399000,
        tag: '최상위',
        features: [
            { label: '밤길 지도 핀', included: true },
            { label: '웨이터존 구인 노출', included: true },
            { label: '웨이터존 OR 선수존 (택1)', included: true },
            { label: '강조효과 (인기 아이콘)', included: true },
            { label: 'PC 사이드바 노출', included: true },
            { label: 'PC/모바일 최상단 고정', included: true },
        ],
    },
];

const PLATFORMS = [
    { name: '밤길', desc: '지도 업소 홍보', emoji: '🗺️' },
    { name: '웨이터존', desc: '웨이터 구인', emoji: '🤵' },
    { name: '웨이터존', desc: '웨이터 구인', emoji: '💼' },
    { name: '선수존', desc: '선수 구인', emoji: '⚡' },
];

export const PaymentPopup: React.FC<PaymentPopupProps> = ({ isOpen, onClose }) => {
    const brand = useBrand();
    const [selectedPlan, setSelectedPlan] = useState('special');
    const [mounted, setMounted] = useState(false);

    useBodyScrollLock(isOpen);

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    if (!mounted || !isOpen) return null;

    const handleApply = () => {
        window.open('https://yasajang.kr', '_blank', 'noopener,noreferrer');
        onClose();
    };

    const currentPlan = PLANS.find(p => p.id === selectedPlan) ?? PLANS[2];
    const isDark = brand.theme === 'dark';
    const primaryBgStyle = { backgroundColor: brand.primaryColor };

    return createPortal(
        <div
            className="modal-overlay fixed inset-0 z-[20000] flex items-center justify-center bg-black/80 backdrop-blur-sm touch-none overscroll-contain"
            onClick={onClose}
        >
            <div
                className={`
                    w-full max-w-lg rounded-t-2xl md:rounded-2xl shadow-2xl overflow-hidden relative flex flex-col
                    fixed bottom-0 md:static
                    max-h-[90dvh] md:max-h-[88vh]
                    ${isDark ? 'bg-gray-900' : 'bg-white'}
                    transform-gpu animate-in slide-in-from-bottom duration-300
                `}
                onClick={e => e.stopPropagation()}
            >
                {/* 헤더 */}
                <div className={`px-5 py-4 border-b text-center relative shrink-0 ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
                    <h2 className={`text-lg font-black tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        야사장 구독 플랜 안내
                    </h2>
                    <p className="text-xs text-gray-400 mt-1">한 번의 구독으로 여러 플랫폼에 동시 노출!</p>
                    <button
                        onClick={onClose}
                        className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 hover:bg-black/5 rounded-full transition-colors"
                    >
                        <X size={20} className={isDark ? 'text-gray-400' : 'text-gray-500'} />
                    </button>
                </div>

                {/* 스크롤 영역 */}
                <div className="overflow-y-auto flex-1 touch-pan-y overscroll-contain">

                    {/* 여기에 노출됩니다 */}
                    <div className={`px-5 pt-4 pb-3 ${isDark ? 'bg-gray-800/60' : 'bg-gray-50'}`}>
                        <p className={`text-[11px] font-black uppercase tracking-widest mb-3 ${isDark ? 'text-gray-400' : 'text-gray-400'}`}>
                            여기에 노출됩니다
                        </p>
                        <div className="grid grid-cols-4 gap-2">
                            {PLATFORMS.map((p) => (
                                <div key={p.name} className={`flex flex-col items-center gap-1 p-2 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-white'} border ${isDark ? 'border-gray-600' : 'border-gray-200'}`}>
                                    <span className="text-xl">{p.emoji}</span>
                                    <span className={`text-[10px] font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>{p.name}</span>
                                    <span className="text-[9px] text-gray-400 text-center leading-tight">{p.desc}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* 구독 플랜 탭 */}
                    <div className="px-5 pt-4">
                        <p className={`text-[11px] font-black uppercase tracking-widest mb-3 ${isDark ? 'text-gray-400' : 'text-gray-400'}`}>
                            구독 플랜 선택하기
                        </p>
                        <div className="flex gap-1.5 overflow-x-auto pt-3 pb-1 scrollbar-hide">
                            {PLANS.map((plan) => (
                                <button
                                    key={plan.id}
                                    onClick={() => setSelectedPlan(plan.id)}
                                    className={`relative flex-shrink-0 px-3 py-2 rounded-xl text-xs font-black transition-all border ${
                                        selectedPlan === plan.id
                                            ? 'bg-pink-600 text-white border-pink-600 shadow-md'
                                            : isDark
                                                ? 'bg-gray-800 text-gray-300 border-gray-700 hover:border-gray-500'
                                                : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                                    }`}
                                >
                                    {plan.tag && (
                                        <span className="absolute -top-2 -right-1 bg-red-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full">
                                            {plan.tag}
                                        </span>
                                    )}
                                    {plan.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* 선택된 플랜 상세 */}
                    <div className="px-5 pt-3 pb-4">
                        <div className={`rounded-2xl border p-4 ${
                            isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                        }`}>
                            {/* 플랜명 + 가격 */}
                            <div className="flex items-end justify-between mb-4">
                                <div>
                                    <span className={`text-xs font-bold ${isDark ? 'text-gray-400' : 'text-gray-400'}`}>
                                        월 기본가
                                    </span>
                                    <div className="flex items-baseline gap-1 mt-0.5">
                                        <span className={`text-2xl font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                            {currentPlan.price.toLocaleString()}
                                        </span>
                                        <span className={`text-sm font-bold ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>원/월</span>
                                    </div>
                                </div>
                                <span className="text-[10px] text-gray-400 font-medium">3개월↑ 최대 17% 할인</span>
                            </div>

                            {/* 포함 항목 체크리스트 */}
                            <div className="space-y-2.5">
                                {currentPlan.features.map((f) => (
                                    <div key={f.label} className="flex items-center gap-2.5">
                                        <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                                            f.included
                                                ? 'bg-pink-500'
                                                : isDark ? 'bg-gray-700' : 'bg-gray-100'
                                        }`}>
                                            {f.included
                                                ? <Check size={11} className="text-white" strokeWidth={3} />
                                                : <X size={9} className={isDark ? 'text-gray-500' : 'text-gray-400'} strokeWidth={2.5} />
                                            }
                                        </div>
                                        <span className={`text-xs font-semibold ${
                                            f.included
                                                ? isDark ? 'text-white' : 'text-gray-800'
                                                : isDark ? 'text-gray-500' : 'text-gray-400'
                                        }`}>
                                            {f.label}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            {/* 카드 자동결제 안내 */}
                            <p className="text-[10px] text-gray-400 text-center mt-4">
                                무통장 입금 · 언제든 해지 가능
                            </p>
                        </div>
                    </div>
                </div>

                {/* 푸터 */}
                <div className={`px-4 py-3 border-t shrink-0 ${isDark ? 'border-gray-700 bg-gray-900' : 'border-gray-100 bg-gray-50'}`}>
                    <button
                        style={primaryBgStyle}
                        className="w-full text-white font-black py-4 rounded-xl text-base shadow-md hover:opacity-90 transition active:scale-[0.99] flex items-center justify-center gap-2"
                        onClick={handleApply}
                    >
                        <ExternalLink size={18} />
                        월 {currentPlan.price.toLocaleString()}원 · 야사장에서 신청하기
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};
