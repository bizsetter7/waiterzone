'use client';

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { useBrand } from '@/components/BrandProvider';
import {
    Zap,
    Star,
    Crown,
    FileText,
    Search,
    Monitor,
    Smartphone,
    ChevronUp,
    ChevronDown,
    Info,
    ArrowRight,
    MapPin,
    CheckCircle2,
    Clock,
    Home,
    X,
    Sparkles,
} from 'lucide-react';

// 야사장 구독 플랜 확정 v2 (2026-04-25)
const PLANS = [
    {
        id: 'free',
        name: '무료',
        price: 0,
        description: '밤길 3개월 무료 체험',
        platforms: ['밤길'],
        cocoalba: false,
        features: [
            '밤길 지도 기본 핀 노출',
            '3개월 무료 체험',
            '※ 코코알바 미노출',
        ],
        icon: <FileText className="text-gray-400" />,
        highlight: false,
    },
    {
        id: 'basic',
        name: '베이직',
        price: 22000,
        description: '첫 시작을 위한 기본 플랜',
        platforms: ['밤길', '웨이터존'],
        cocoalba: false,
        features: [
            '밤길 지도 기본 핀 노출',
            '웨이터존 리스트 노출',
        ],
        icon: <FileText className="text-gray-400" />,
        highlight: false,
    },
    {
        id: 'standard',
        name: '스탠다드',
        price: 66000,
        description: '코코알바 또는 선수존 선택 노출',
        platforms: ['밤길', '코코알바 또는 선수존'],
        cocoalba: true,
        features: [
            '밤길 지도 기본 핀 노출',
            '코코알바 업체정보 리스트 노출',
            '선수존 리스트 노출 (택 1)',
        ],
        icon: <Star className="text-blue-400" />,
        highlight: false,
    },
    {
        id: 'special',
        name: '스페셜',
        price: 88000,
        description: '3개 플랫폼 동시 노출',
        platforms: ['밤길', '웨이터존', '코코알바 또는 선수존'],
        cocoalba: true,
        features: [
            '밤길 지도 기본 핀 노출',
            '웨이터존 리스트 노출',
            '코코알바 업체정보 리스트 노출',
            '선수존 리스트 노출 (택 1)',
            '광고 점프:\n무료 10회 + 자동 3회/일',
        ],
        icon: <Zap className="text-[#1e3a5f]" />,
        highlight: true,
    },
    {
        id: 'deluxe',
        name: '디럭스',
        price: 199000,
        description: '강조 효과로 경쟁 업소 압도',
        platforms: ['밤길', '웨이터존', '코코알바 또는 선수존'],
        cocoalba: true,
        features: [
            '스페셜의 모든 기능 포함',
            '인기 업소 아이콘 강조 표시',
            '밤길 대형 핀 노출',
            '광고 점프:\n무료 30회 + 자동 6회/일',
        ],
        icon: <Crown className="text-purple-400" />,
        highlight: false,
    },
    {
        id: 'premium',
        name: '프리미엄',
        price: 399000,
        description: 'PC·모바일 상위노출 최강 패키지',
        platforms: ['밤길', '웨이터존', '코코알바 또는 선수존'],
        cocoalba: true,
        features: [
            '스페셜의 모든 기능 포함',
            '코코알바 프리미엄 채용 섹션 노출',
            'PC·모바일 최상단 고정 노출',
            '인기 업소 아이콘 강조 표시',
            '광고 점프:\n무료 30회 +\n매일 +1회 추가 + 자동 8회/일',
        ],
        icon: <Sparkles className="text-amber-400" />,
        highlight: false,
    },
];

// 기간별 할인 단가표
const PERIOD_DISCOUNTS = [
    { label: '1개월', months: 1, rate: 0 },
    { label: '3개월', months: 3, rate: 0.05 },
    { label: '6개월', months: 6, rate: 0.10 },
    { label: '12개월', months: 12, rate: 0.17 },
];

function calcPrice(monthly: number, months: number, rate: number) {
    return Math.floor(monthly * months * (1 - rate));
}

interface TabAdGuideProps {
    onTabChange: (tabName: string) => void;
}

export function TabAdGuide({ onTabChange }: TabAdGuideProps) {
    const brand = useBrand();
    const [activeAccordion, setActiveAccordion] = useState<string | null>(null);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    const dark = brand.theme === 'dark';

    return (
        <div className="space-y-8">

            {/* 히어로 배너 */}
            <div className="text-center py-10 md:py-12 bg-gradient-to-br from-[#1e3a5f] to-[#162d4a] rounded-[40px] text-white shadow-xl shadow-blue-200/50 relative overflow-hidden border border-blue-900">
                <div className="absolute top-0 right-0 p-10 opacity-10">
                    <Zap size={150} strokeWidth={3} className="text-white" />
                </div>
                <h2 className="text-2xl md:text-3xl font-black mb-3 tracking-tighter text-white">야사장 구독으로 한 번에 🚀</h2>
                <p className="text-blue-100 text-[13px] md:text-sm font-black tracking-tight opacity-90">
                    밤길 · {brand.name} · 웨이터존 · 선수존 — 플랫폼을 구독 하나로 통합 관리하세요.
                </p>
                <a
                    href="https://yasajang.kr/register"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 mt-6 px-6 py-3 bg-white text-[#1e3a5f] font-black rounded-full shadow-lg hover:scale-105 transition text-[14px]"
                >
                    야사장 입점 신청 <ArrowRight size={16} />
                </a>
            </div>

            {/* 플랜 카드 5개 */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
                {PLANS.map((plan) => (
                    <div
                        key={plan.id}
                        className={`p-4 md:p-5 rounded-[28px] border shadow-sm flex flex-col transition-all hover:scale-[1.02] relative
                            ${dark ? 'bg-gray-800' : 'bg-white'}
                            ${plan.highlight
                                ? 'border-[#1e3a5f] shadow-lg shadow-sm/50'
                                : dark ? 'border-gray-700' : 'border-gray-200'
                            }`}
                    >
                        {plan.highlight && (
                            <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#1e3a5f] text-white text-[10px] px-3 py-1 rounded-full font-black whitespace-nowrap">
                                인기
                            </span>
                        )}
                        <div className={`p-3 rounded-2xl shadow-inner w-fit mb-3 ${dark ? 'bg-gray-700' : 'bg-blue-50'}`}>
                            {React.cloneElement(plan.icon as React.ReactElement<{ size?: number }>, { size: 22 })}
                        </div>
                        <h3 className={`text-lg font-black mb-0.5 ${dark ? 'text-white' : 'text-gray-900'}`}>{plan.name}</h3>
                        <p className="text-[#1e3a5f] font-black text-lg leading-none mb-1">
                            {plan.price === 0 ? (
                                <>무료<span className="text-[11px] font-bold opacity-70">/3개월</span></>
                            ) : (
                                <>{plan.price.toLocaleString()}원<span className="text-[11px] font-bold opacity-70">/월</span></>
                            )}
                        </p>
                        <p className={`text-[11px] font-bold mb-4 ${dark ? 'text-gray-400' : 'text-gray-500'}`}>{plan.description}</p>
                        <div className="flex-1 space-y-2 mb-4">
                            {plan.features.map((f, i) => (
                                <p key={i} className={`text-[11px] flex items-start gap-2 font-bold ${dark ? 'text-gray-300' : 'text-gray-500'}`}>
                                    <CheckCircle2 size={13} className="text-[#1e3a5f] shrink-0 mt-0.5" />
                                    <span className="leading-tight break-keep whitespace-pre-line">{f}</span>
                                </p>
                            ))}
                        </div>
                        <a
                            href={`https://yasajang.kr/register?plan=${plan.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`w-full py-2.5 rounded-xl text-[12px] font-black text-center transition
                                ${plan.highlight
                                    ? 'bg-[#1e3a5f] text-white hover:bg-[#162d4a]'
                                    : dark ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-gray-900 text-white hover:bg-black'
                                }`}
                        >
                            신청하기
                        </a>
                    </div>
                ))}
            </div>

            {/* 기간별 단가표 */}
            <div className={`rounded-[32px] md:rounded-[40px] border p-5 md:p-8 shadow-sm space-y-6 ${dark ? 'bg-gray-800 border-gray-800' : 'bg-white border-gray-100'}`}>
                <div className="flex items-center gap-3">
                    <div className="w-2 h-8 bg-[#1e3a5f] rounded-full" />
                    <div>
                        <h3 className={`text-2xl font-black tracking-tighter ${dark ? 'text-white' : 'text-gray-900'}`}>기간별 단가표</h3>
                        <p className="text-[12px] text-gray-500 font-bold mt-0.5">장기 구독 시 최대 17% 할인 (12개월 기준)</p>
                    </div>
                </div>

                {/* PC 테이블 */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className={`border-b-2 ${dark ? 'border-gray-700' : 'border-blue-100'}`}>
                                <th className="py-4 text-left text-[13px] font-black text-gray-400 uppercase tracking-widest w-28">플랜</th>
                                <th className="py-4 text-left text-[13px] font-black text-gray-500 pl-4 w-[30%]">포함 플랫폼</th>
                                <th className="py-4 text-right text-[13px] font-black text-[#1e3a5f] pr-4">1개월</th>
                                <th className="py-4 text-right text-[13px] font-black text-gray-600 pr-4">3개월 <span className="text-[11px] text-green-600">5%↓</span></th>
                                <th className="py-4 text-right text-[13px] font-black text-gray-600 pr-4">6개월 <span className="text-[11px] text-green-600">10%↓</span></th>
                                <th className="py-4 text-right text-[13px] font-black text-gray-600 pr-4">12개월 <span className="text-[11px] text-green-600">17%↓</span></th>
                            </tr>
                        </thead>
                        <tbody className={`divide-y ${dark ? 'divide-gray-700' : 'divide-gray-50'}`}>
                            {PLANS.filter(p => p.id !== 'free').map((plan) => (
                                <tr key={plan.id} className="hover:bg-blue-50/20 transition-colors group">
                                    <td className={`py-3 text-[14px] font-black group-hover:text-[#1e3a5f] transition-colors ${dark ? 'text-white' : 'text-gray-900'}`}>
                                        {plan.name}
                                    </td>
                                    <td className="py-3 pl-4">
                                        <div className="flex flex-wrap gap-1">
                                            {plan.platforms.map((p, i) => (
                                                <span key={i} className={`text-[10px] font-black px-2 py-0.5 rounded-full ${dark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>{p}</span>
                                            ))}
                                        </div>
                                    </td>
                                    {PERIOD_DISCOUNTS.map((pd) => (
                                        <td key={pd.label} className={`py-3 text-right text-[14px] font-black pr-4 tabular-nums whitespace-nowrap ${pd.months === 1 ? 'text-[#1e3a5f]' : dark ? 'text-white' : 'text-gray-900'}`}>
                                            {calcPrice(plan.price, pd.months, pd.rate).toLocaleString()}원
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* 모바일 카드 */}
                <div className="md:hidden grid grid-cols-1 gap-3">
                    {PLANS.filter(p => p.id !== 'free').map((plan) => (
                        <div key={plan.id} className={`p-4 rounded-[24px] border ${dark ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-100'}`}>
                            <div className="flex items-center justify-between mb-3">
                                <span className={`text-[15px] font-black ${dark ? 'text-white' : 'text-gray-900'}`}>{plan.name}</span>
                                <div className="flex flex-wrap gap-1 justify-end">
                                    {plan.platforms.map((p, i) => (
                                        <span key={i} className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${dark ? 'bg-gray-700 text-gray-400' : 'bg-gray-200 text-gray-600'}`}>{p}</span>
                                    ))}
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-1.5">
                                {PERIOD_DISCOUNTS.map((pd) => (
                                    <div key={pd.label} className={`flex justify-between items-center px-3 py-2 rounded-xl ${pd.months === 1 ? dark ? 'bg-blue-900/20' : 'bg-blue-50' : dark ? 'bg-gray-800' : 'bg-white'}`}>
                                        <span className={`text-[9px] font-black uppercase ${pd.months === 1 ? 'text-blue-400' : 'text-gray-400'}`}>{pd.label}</span>
                                        <span className={`text-[12px] font-black tabular-nums ${pd.months === 1 ? 'text-[#1e3a5f]' : dark ? 'text-gray-200' : 'text-gray-800'}`}>
                                            {calcPrice(plan.price, pd.months, pd.rate).toLocaleString()}원
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                <div className={`p-3 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-2 ${dark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                    <p className="text-[11px] text-gray-400 font-black">※ 모든 가격 부가세 별도 (VAT 별도)</p>
                    <p className="text-[11px] text-gray-500 font-black">12개월 구독 시 <span className="text-[#1e3a5f] font-black">약 2개월 무료</span> 혜택</p>
                </div>
            </div>

            {/* 플랫폼별 노출 위치 안내 */}
            <div className={`rounded-[32px] md:rounded-[40px] border p-5 md:p-8 shadow-sm space-y-6 ${dark ? 'bg-gray-800 border-gray-800' : 'bg-white border-gray-100'}`}>
                <div className="flex items-center gap-3">
                    <div className="w-2 h-8 bg-[#1e3a5f] rounded-full" />
                    <h3 className={`text-2xl font-black tracking-tighter ${dark ? 'text-white' : 'text-gray-900'}`}>플랜별 노출 위치</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-[13px]">
                        <thead>
                            <tr className={`border-b ${dark ? 'border-gray-700' : 'border-gray-100'}`}>
                                <th className="py-3 text-left font-black text-gray-400 w-40">노출 위치</th>
                                {PLANS.filter(p => p.id !== 'free').map(p => (
                                    <th key={p.id} className={`py-3 text-center font-black ${dark ? 'text-white' : 'text-gray-900'}`}>{p.name}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className={`divide-y ${dark ? 'divide-gray-700/50' : 'divide-gray-50'}`}>
                            {[
                                { label: '밤길 기본 핀', plans: ['basic', 'standard', 'special', 'deluxe', 'premium'] },
                                { label: '밤길 대형 핀', plans: ['deluxe', 'premium'] },
                                { label: '웨이터존 리스트', plans: ['basic', 'special', 'deluxe', 'premium'] },
                                { label: '코코알바 업체정보', plans: ['standard', 'special', 'deluxe'] },
                                { label: '코코알바 프리미엄 채용', plans: ['premium'] },
                                { label: '선수존 리스트', plans: ['standard', 'special', 'deluxe', 'premium'] },
                                { label: '강조 아이콘', plans: ['deluxe', 'premium'] },
                                { label: '최상단 고정 노출', plans: ['premium'] },
                            ].map((row) => (
                                <tr key={row.label} className="hover:bg-blue-50/10 transition-colors">
                                    <td className={`py-3 text-[12px] font-bold ${dark ? 'text-gray-400' : 'text-gray-500'}`}>{row.label}</td>
                                    {PLANS.filter(p => p.id !== 'free').map(p => (
                                        <td key={p.id} className="py-3 text-center">
                                            {row.plans.includes(p.id)
                                                ? <CheckCircle2 size={16} className="text-[#1e3a5f] mx-auto" />
                                                : <span className="text-gray-200 text-lg">·</span>
                                            }
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <p className={`text-[11px] font-bold ${dark ? 'text-gray-500' : 'text-gray-400'}`}>
                    ※ 야사장 가입 후 코코알바·웨이터존·선수존 중 1개를 선택해 노출됩니다. 코코알바를 선택하면 위 표대로 노출되며, 다른 플랫폼 선택 시에는 해당 플랫폼 기준으로 노출됩니다.
                </p>
            </div>

            {/* 광고 점프(JUMP) 시스템 안내 */}
            <div className={`rounded-[32px] md:rounded-[40px] border p-5 md:p-8 shadow-sm space-y-6 ${dark ? 'bg-gray-800 border-gray-800' : 'bg-white border-gray-100'}`}>
                <div className="flex items-center gap-3">
                    <div className="w-2 h-8 bg-[#1e3a5f] rounded-full" />
                    <h3 className={`text-2xl font-black tracking-tighter ${dark ? 'text-white' : 'text-gray-900'}`}>광고 점프(JUMP) 시스템</h3>
                </div>
                <p className={`text-[13px] leading-relaxed ${dark ? 'text-gray-300' : 'text-gray-600'}`}>
                    점프는 내 광고를 리스트 최상단으로 끌어올리는 기능입니다. 매일 자정(KST)마다 <b>점프 +1회가 자동 적립</b>되며, 별도 충전 없이 누적된 잔액으로 사용할 수 있습니다.
                </p>

                {/* 구독 시 무료 점프 즉시 지급 */}
                <div className="space-y-2">
                    <h4 className={`text-[14px] font-black ${dark ? 'text-white' : 'text-gray-900'}`}>① 구독 활성화 시 무료 점프 즉시 지급</h4>
                    <div className="grid grid-cols-3 gap-2">
                        <div className={`rounded-xl p-3 text-center ${dark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                            <div className="text-[11px] text-gray-400 font-bold mb-1">스페셜</div>
                            <div className={`text-[20px] font-black ${dark ? 'text-white' : 'text-gray-900'}`}>10회</div>
                        </div>
                        <div className={`rounded-xl p-3 text-center ${dark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                            <div className="text-[11px] text-gray-400 font-bold mb-1">디럭스</div>
                            <div className={`text-[20px] font-black ${dark ? 'text-white' : 'text-gray-900'}`}>30회</div>
                        </div>
                        <div className={`rounded-xl p-3 text-center ${dark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                            <div className="text-[11px] text-gray-400 font-bold mb-1">프리미엄</div>
                            <div className={`text-[20px] font-black ${dark ? 'text-white' : 'text-gray-900'}`}>30회</div>
                        </div>
                    </div>
                    <p className="text-[11px] text-gray-400 font-bold">※ 베이직·스탠다드는 무료 점프 미지급. 자정 +1회 자동 적립만 받습니다.</p>
                </div>

                {/* 프리미엄 매일 +1 자동 적립 */}
                <div className={`rounded-2xl p-4 ${dark ? 'bg-gray-700/50' : 'bg-blue-50'}`}>
                    <div className="flex items-start gap-3">
                        <Zap size={20} className="text-[#1e3a5f] shrink-0 mt-0.5" />
                        <div>
                            <h4 className={`text-[14px] font-black mb-1 ${dark ? 'text-white' : 'text-gray-900'}`}>② 프리미엄 매일 +1회 추가 적립</h4>
                            <p className={`text-[12px] leading-relaxed ${dark ? 'text-gray-300' : 'text-gray-600'}`}>
                                <b>프리미엄 구독자</b>에게만 매일 자정(KST) 점프 1회가 자동으로 추가 적립됩니다. 다른 플랜(스페셜·디럭스)은 결제일 기준 30일 단위로 무료 점프 횟수가 리셋됩니다.
                            </p>
                        </div>
                    </div>
                </div>

                {/* 자동 점프 (cron 매일 set) */}
                <div className="space-y-2">
                    <h4 className={`text-[14px] font-black ${dark ? 'text-white' : 'text-gray-900'}`}>③ 자동 점프 (매일 자정 자동 실행)</h4>
                    <p className={`text-[12px] leading-relaxed ${dark ? 'text-gray-300' : 'text-gray-600'}`}>
                        자동 점프를 활성화하면 매일 자정 광고가 자동으로 리스트 최상단으로 이동합니다. 플랜별 1일 자동 점프 횟수가 다릅니다.
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                        <div className={`rounded-xl p-3 text-center ${dark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                            <div className="text-[11px] text-gray-400 font-bold mb-1">스페셜</div>
                            <div className={`text-[18px] font-black ${dark ? 'text-white' : 'text-gray-900'}`}>3회<span className="text-[11px] font-bold text-gray-400">/일</span></div>
                        </div>
                        <div className={`rounded-xl p-3 text-center ${dark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                            <div className="text-[11px] text-gray-400 font-bold mb-1">디럭스</div>
                            <div className={`text-[18px] font-black ${dark ? 'text-white' : 'text-gray-900'}`}>6회<span className="text-[11px] font-bold text-gray-400">/일</span></div>
                        </div>
                        <div className={`rounded-xl p-3 text-center ${dark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                            <div className="text-[11px] text-gray-400 font-bold mb-1">프리미엄</div>
                            <div className={`text-[18px] font-black ${dark ? 'text-white' : 'text-gray-900'}`}>8회<span className="text-[11px] font-bold text-gray-400">/일</span></div>
                        </div>
                    </div>
                </div>

                {/* 사용법 */}
                <div className="space-y-2">
                    <h4 className={`text-[14px] font-black ${dark ? 'text-white' : 'text-gray-900'}`}>④ 수동 점프 사용 방법</h4>
                    <ol className={`space-y-1.5 text-[13px] ${dark ? 'text-gray-300' : 'text-gray-700'}`}>
                        <li className="flex gap-2"><span className="text-[#1e3a5f] font-black shrink-0">1.</span><span>마이샵에서 점프 가능 광고를 확인합니다.</span></li>
                        <li className="flex gap-2"><span className="text-[#1e3a5f] font-black shrink-0">2.</span><span>「점프하기」 버튼을 클릭합니다.</span></li>
                        <li className="flex gap-2"><span className="text-[#1e3a5f] font-black shrink-0">3.</span><span>선택 광고가 즉시 동일 등급 리스트 최상단으로 이동합니다.</span></li>
                    </ol>
                </div>
            </div>

            {/* 노출 상세 가이드 아코디언 */}
            <section className="space-y-6">
                <div className="flex items-center gap-3">
                    <div className="w-2 h-8 bg-[#1e3a5f] rounded-full" />
                    <h3 className={`text-2xl font-black uppercase tracking-tighter ${dark ? 'text-white' : 'text-gray-900'}`}>노출 상세 및 영역 안내</h3>
                </div>
                <div className="space-y-4">
                    {[
                        { id: 'pc_1', title: 'PC 가이드 (1) - 메인/사이드/전체', img: '/images/guide/pc_1.png' },
                        { id: 'pc_2', title: 'PC 가이드 (2) - 업종별/지역별', img: '/images/guide/pc_2.png' },
                        { id: 'pc_3', title: 'PC 가이드 (3) - 디럭스/스페셜', img: '/images/guide/pc_3.png' },
                        { id: 'pc_4', title: 'PC 가이드 (4) - 베이직/네이티브', img: '/images/guide/pc_4.png' },
                        { id: 'mobile', title: '모바일 가이드 - 통합 레이아웃', img: '/images/guide/모바일.png', isMobile: true },
                    ].map((item) => (
                        <div key={item.id} className={`overflow-hidden rounded-2xl border ${dark ? 'bg-gray-800/30 border-gray-700' : 'bg-white border-gray-200 shadow-sm'}`}>
                            <button
                                onClick={() => setActiveAccordion(activeAccordion === item.id ? null : item.id)}
                                className={`w-full p-4 md:p-5 flex items-center justify-between transition-colors ${activeAccordion === item.id ? (dark ? 'bg-gray-700/50' : 'bg-gray-50') : ''}`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${dark ? 'bg-gray-800 text-[#1e3a5f]' : 'bg-blue-50 text-[#1e3a5f]'}`}>
                                        {(item as any).isMobile ? <Smartphone size={16} /> : <Monitor size={16} />}
                                    </div>
                                    <h4 className={`text-[13px] md:text-[14px] font-black ${dark ? 'text-white' : 'text-gray-900'}`}>{item.title}</h4>
                                </div>
                                {activeAccordion === item.id ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
                            </button>
                            {activeAccordion === item.id && (
                                <div className="p-4">
                                    <div
                                        className={`relative cursor-pointer overflow-hidden rounded-xl border ${dark ? 'border-gray-700' : 'border-gray-100'} ${(item as any).isMobile ? 'max-w-[180px] mx-auto aspect-[9/16]' : 'aspect-[16/10]'}`}
                                        onClick={() => setSelectedImage(item.img)}
                                    >
                                        <Image
                                            src={item.img}
                                            alt={item.title}
                                            width={(item as any).isMobile ? 180 : 800}
                                            height={(item as any).isMobile ? 320 : 500}
                                            className="w-full h-full object-cover"
                                        />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <span className="text-white font-black flex items-center gap-1.5 bg-[#1e3a5f] px-3 py-1.5 rounded-full text-[10px] shadow-xl">
                                                <Search size={12} /> 확대
                                            </span>
                                        </div>
                                    </div>
                                    <div className="mt-3 flex items-center justify-center gap-1.5 text-gray-400 text-[10px] font-bold">
                                        <Info size={12} /> 클릭 시 확대
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </section>

            {/* AI 지역 매칭 */}
            <section className="space-y-6">
                <div className="flex items-center gap-3">
                    <div className="w-2 h-8 bg-[#1e3a5f] rounded-full shadow-[0_0_15px_rgba(219,39,119,0.3)]" />
                    <h3 className={`text-2xl font-black uppercase tracking-tighter ${dark ? 'text-white' : 'text-gray-900'}`}>지역 기반 스마트 매칭</h3>
                </div>
                <div className="bg-gradient-to-br from-[#1e3a5f] to-[#162d4a] p-8 md:p-10 rounded-[32px] md:rounded-[45px] text-white shadow-2xl shadow-blue-200 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-10 opacity-20 transform translate-x-1/4 -translate-y-1/4">
                        <Home size={180} />
                    </div>
                    <div className="relative z-10 space-y-6">
                        <div>
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 rounded-full text-[10px] font-black uppercase tracking-widest mb-4 border border-white/30 backdrop-blur-md">
                                신규 기술 연동 정책
                            </div>
                            <h4 className="text-2xl md:text-3xl font-black leading-tight">사용자의 현재 위치를 찾아내는<br />AI 스마트 노출 시스템 🛰️</h4>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                            <div className="space-y-2">
                                <p className="text-[16px] font-black">1. 자동 지역 매칭</p>
                                <p className="text-blue-50 text-[13px] font-bold leading-relaxed opacity-90">유저가 직접 지역을 선택하지 않아도, 접속 리전을 자동으로 감지하여 가장 가까운 업소 배너를 우선 노출합니다.</p>
                            </div>
                            <div className="space-y-2">
                                <p className="text-[16px] font-black">2. 배너 인벤토리 효율 극대화</p>
                                <p className="text-blue-50 text-[13px] font-bold leading-relaxed opacity-90">서울 유저에겐 서울 배너를, 대구 유저에겐 대구 배너를! 하나의 구좌를 다수의 지역 광고주가 공유하여 효율을 높입니다.</p>
                            </div>
                        </div>
                        <div className="h-px bg-white/20 w-full" />
                        <p className="text-[12px] md:text-[13px] font-bold text-blue-50 italic">
                            ※ 본 시스템은 유저의 검색 편의성을 높이며 광고주의 광고 도달률을 비약적으로 상승시킵니다.
                        </p>
                    </div>
                </div>
            </section>

            {/* 이미지 제작 가이드 */}
            <section className="space-y-6">
                <div className="flex items-center gap-3">
                    <div className="w-2 h-8 bg-[#1e3a5f] rounded-full" />
                    <h3 className={`text-2xl font-black uppercase tracking-tighter ${dark ? 'text-white' : 'text-gray-900'}`}>이미지 제작 가이드</h3>
                </div>
                <div className={`p-8 md:p-10 rounded-[32px] md:rounded-[45px] border shadow-xl space-y-8 ${dark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className={`p-6 md:p-8 rounded-[32px] border ${dark ? 'bg-gray-700/30 border-blue-900/30' : 'bg-white border-gray-100'}`}>
                            <h4 className={`text-[17px] font-black mb-6 flex items-center gap-2.5 ${dark ? 'text-white' : 'text-gray-900'}`}>
                                <div className="p-2 bg-[#1e3a5f] text-white rounded-xl shadow-sm"><Clock size={16} /></div>
                                <span className="whitespace-nowrap">이미지 제작 기반 안내</span>
                            </h4>
                            <ul className="space-y-4 text-[13px] md:text-[14px] text-gray-500 font-bold leading-relaxed">
                                <li className="flex items-start gap-3">
                                    <div className="w-1.5 h-1.5 rounded-full bg-[#1e3a5f] mt-2 shrink-0" />
                                    <span className="break-keep">상세설명란에 구인 내용을 적어주시면 디자인 작업을 해드립니다.</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <div className="w-1.5 h-1.5 rounded-full bg-[#1e3a5f] mt-2 shrink-0" />
                                    <span className="break-keep">이미지 작업 및 등록은 결제일로부터 <span className="text-gray-900 font-black underline decoration-pink-200 underline-offset-4">영업일 기준 1~2일</span> 소요됩니다.</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <div className="w-1.5 h-1.5 rounded-full bg-[#1e3a5f] mt-2 shrink-0" />
                                    <span className="break-keep">공고는 결제 즉시 작성하신 내용으로 바로 노출됩니다.</span>
                                </li>
                            </ul>
                        </div>
                        <div className={`p-6 md:p-8 rounded-[32px] border ${dark ? 'bg-gray-700/30 border-gray-700' : 'bg-gray-50/50 border-gray-100'}`}>
                            <h4 className={`text-[17px] font-black mb-6 flex items-center gap-2.5 ${dark ? 'text-white' : 'text-gray-900'}`}>
                                <div className={`p-2 rounded-xl shadow-sm ${dark ? 'bg-gray-700 text-gray-300' : 'bg-gray-900 text-white'}`}><CheckCircle2 size={16} /></div>
                                <span className="whitespace-nowrap">수정 및 유의사항</span>
                            </h4>
                            <ul className="space-y-4 text-[13px] md:text-[14px] text-gray-500 font-bold leading-relaxed">
                                <li className="flex items-start gap-3">
                                    <div className="w-1.5 h-1.5 rounded-full bg-gray-400 mt-2 shrink-0" />
                                    <span className="break-keep">단순 텍스트(가격, 전번 등) 수정은 공고 기간 내 <span className="text-gray-900 font-black">상시 가능</span>합니다.</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <div className="w-1.5 h-1.5 rounded-full bg-gray-400 mt-2 shrink-0" />
                                    <span className="break-keep">레이아웃 전체가 변경되는 수정사항은 <span className="text-gray-900 font-black">1회에 한하여</span> 가능합니다.</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <div className="w-1.5 h-1.5 rounded-full bg-gray-400 mt-2 shrink-0" />
                                    <span className="break-keep">작업된 이미지는 당사 채널 내에서만 사용 가능합니다.</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div
                            onClick={() => onTabChange('1:1 문의')}
                            className="p-6 bg-[#1e3a5f] rounded-3xl text-white shadow-lg shadow-blue-200 flex items-center justify-between group cursor-pointer hover:bg-[#162d4a] transition"
                        >
                            <div>
                                <p className="text-[11px] font-bold opacity-80">디자인이 필요하신가요?</p>
                                <p className="text-[17px] font-black">기본 페이지 디자인 <span className="text-[13px] opacity-90 pl-1">5만원</span></p>
                            </div>
                            <ArrowRight size={24} className="group-hover:translate-x-1 transition-transform" />
                        </div>
                        <div
                            onClick={() => onTabChange('1:1 문의')}
                            className="p-6 bg-gray-900 rounded-3xl text-white shadow-lg shadow-gray-200 flex items-center justify-between group cursor-pointer hover:bg-black transition"
                        >
                            <div>
                                <p className="text-[11px] font-bold opacity-80">더 특별한 홍보를 위해!</p>
                                <p className="text-[17px] font-black">프리미엄 GIF 구성 <span className="text-[13px] opacity-90 pl-1">10만원</span></p>
                            </div>
                            <ArrowRight size={24} className="group-hover:translate-x-1 transition-transform" />
                        </div>
                    </div>
                </div>
            </section>

            {/* 야사장 통합 가입 흐름 안내 */}
            <section className={`p-8 md:p-10 rounded-[32px] border space-y-6 ${dark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
                <div className="text-center">
                    <h3 className={`text-2xl font-black ${dark ? 'text-white' : 'text-gray-900'}`}>야사장 통합 가입 흐름</h3>
                    <p className={`text-[13px] font-bold mt-1 ${dark ? 'text-gray-400' : 'text-gray-500'}`}>4단계로 {brand.name} · 밤길 · 웨이터존 · 선수존 동시 운영 시작</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                        { step: '1', title: '야사장 가입', desc: '카카오 / 구글 / 이메일로 30초 가입', icon: '🔑' },
                        { step: '2', title: '업소 등록', desc: '사업자등록증 + 영업허가증 업로드 (OCR 자동 입력)', icon: '📋' },
                        { step: '3', title: '플랜 선택', desc: '심사 완료 후 베이직~프리미엄 중 선택 · 무통장 입금', icon: '💳' },
                        { step: '4', title: '플랫폼 자동 연동', desc: `${brand.name} · 밤길 · 웨이터존 · 선수존 광고 즉시 게시`, icon: '🚀' },
                    ].map(({ step, title, desc, icon }) => (
                        <div key={step} className={`relative p-5 rounded-2xl border flex flex-col gap-2 ${dark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-100'}`}>
                            <div className="flex items-center gap-2">
                                <span className="w-6 h-6 rounded-full bg-[#1e3a5f] text-white text-[11px] font-black flex items-center justify-center shrink-0">{step}</span>
                                <span className="text-lg">{icon}</span>
                            </div>
                            <p className={`text-[14px] font-black ${dark ? 'text-white' : 'text-gray-900'}`}>{title}</p>
                            <p className={`text-[12px] leading-relaxed ${dark ? 'text-gray-400' : 'text-gray-500'}`}>{desc}</p>
                        </div>
                    ))}
                </div>
                <div className={`rounded-xl p-4 text-[12px] font-bold flex items-start gap-2 ${dark ? 'bg-amber-500/10 text-amber-400' : 'bg-amber-50 text-amber-700'}`}>
                    <Info size={14} className="shrink-0 mt-0.5" />
                    <span>심사는 평일 기준 1~2 영업일 내 완료됩니다. 이후 플랜을 선택하면 해당 플랫폼에 광고가 즉시 노출됩니다.</span>
                </div>
            </section>

            {/* 야사장 입점 CTA */}
            <section className={`p-8 md:p-10 rounded-[32px] border text-center space-y-4 ${dark ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-100'}`}>
                <h3 className={`text-2xl font-black ${dark ? 'text-white' : 'text-gray-900'}`}>지금 바로 시작하세요</h3>
                <p className={`text-[13px] font-bold ${dark ? 'text-gray-400' : 'text-gray-500'}`}>야사장 구독 한 번으로 {brand.name} · 밤길 · 웨이터존 · 선수존 동시 운영</p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                    <a
                        href="https://yasajang.kr/register"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-8 py-3.5 bg-[#1e3a5f] text-white font-black rounded-full shadow-lg hover:bg-[#162d4a] transition text-[14px]"
                    >
                        입점 신청하기 <ArrowRight size={16} />
                    </a>
                    <button
                        onClick={() => onTabChange('1:1 문의')}
                        className={`inline-flex items-center gap-2 px-8 py-3.5 font-black rounded-full border transition text-[14px] ${dark ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-100'}`}
                    >
                        문의하기 <MapPin size={16} />
                    </button>
                </div>
            </section>

            {/* selectedImage Modal */}
            {selectedImage && createPortal(
                <div className="fixed inset-0 z-[20000] bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setSelectedImage(null)}>
                    <div className="relative max-w-5xl w-full flex flex-col items-center justify-center" onClick={e => e.stopPropagation()}>
                        <div className="mb-6 text-center">
                            <h3 className="text-2xl md:text-3xl font-black text-white tracking-tighter mb-2">노출 상세 및 영역 안내</h3>
                            <div className="w-12 h-1 bg-[#1e3a5f] mx-auto rounded-full" />
                        </div>
                        <div className="relative w-full h-full flex items-center justify-center">
                            <Image
                                src={selectedImage}
                                alt="Ad Placement Guide Full"
                                width={1000}
                                height={1500}
                                className="max-width-full max-h-[75vh] object-contain rounded-2xl shadow-2xl border border-white/10"
                            />
                            <button
                                onClick={() => setSelectedImage(null)}
                                className="absolute -top-12 md:-top-10 right-0 md:-right-16 bg-white/10 hover:bg-white/20 text-white p-3 rounded-full backdrop-blur-md transition-all border border-white/20 shadow-lg"
                            >
                                <X size={24} />
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}
