'use client';

import React from 'react';
import { Star, Flame, PlusCircle, Megaphone } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { Shop } from '@/types/shop';
import { formatKoreanMoney } from '@/utils/formatMoney';
import { getHighlighterStyle } from '@/utils/highlighter';
import { cleanShopTitle } from '@/utils/shopUtils';
import { IconBadge } from '../common/IconBadge';
import { saveShopSnapshot } from '@/utils/favorites';

// Use Shop type directly
type Job = Shop;

// border 옵션 → 클래스 변환
// [Rule] border_period > 0 인 경우에만 적용 (결제된 광고만)
const getBorderClass = (opt?: string, period?: number): string => {
    if (!opt || opt === 'none' || !period || period <= 0) return '';
    switch (opt) {
        case 'color':    return 'border-2 border-blue-400 shadow-md shadow-blue-100';
        case 'glow':     return 'border-2 border-yellow-400 shadow-md shadow-yellow-100';
        case 'sparkle':  return 'border-2 border-pink-400 shadow-md shadow-pink-100';
        case 'rainbow':  return 'border-2 animate-rainbow-border shadow-lg';
        default:         return '';
    }
};

interface Brand {
    theme: 'dark' | 'light';
    primaryColor?: string;
}

interface JobListViewProps {
    shops: Job[];
    brand: Brand;
    favorites: string[];
    toggleFavorite: (e: React.MouseEvent, id: string) => void;
    setSelectedShop: (shop: Job) => void;
    visibleCount: number;
    setVisibleCount: React.Dispatch<React.SetStateAction<number>>;
    onAdRegister?: (tier?: string) => void;
    onNativeAdRegister?: (tier?: string) => void;
}

// [Optimization] Helper for Pay Badge Logic (Pure function)
// ⚠️ Pay Badge Standards v1.0 — standards.ts PAY_BADGE_STANDARDS와 동기화 유지
const getPayBadgeInfo = (shop: Shop) => {
    const payStr = shop.pay || '';
    let badgeLabel = '협';
    let badgeColor = 'bg-gray-400';   // 기본값: 협의
    let amount = payStr;

    const typeToCheck = shop.payType || payStr;

    // PAY_BADGE_STANDARDS v2.0 — standards.ts 동기화 (2026-03-22)
    if (typeToCheck.includes('TC') || typeToCheck === 'T') {
        badgeLabel = 'T';
        badgeColor = 'bg-orange-500'; // TC — 🟠 orange (v2.0)
    } else if (typeToCheck.includes('시급') || typeToCheck === '시') {
        badgeLabel = '시';
        badgeColor = 'bg-cyan-500';   // 시급 — 🩵 cyan
    } else if (typeToCheck.includes('일급') || typeToCheck.includes('일')) {
        badgeLabel = '일';
        badgeColor = 'bg-blue-500';   // 일급 — 🔵 blue
    } else if (typeToCheck.includes('주급') || typeToCheck.includes('주')) {
        badgeLabel = '주';
        badgeColor = 'bg-green-500';  // 주급 — 🟢 green (v2.0: blue→green)
    } else if (typeToCheck.includes('월급') || typeToCheck.includes('월')) {
        badgeLabel = '월';
        badgeColor = 'bg-purple-500'; // 월급 — 🟣 purple
    } else if (typeToCheck.includes('연봉') || typeToCheck.includes('연')) {
        badgeLabel = '연';
        badgeColor = 'bg-red-500';    // 연봉 — 🔴 red (v2.0: green→red)
    } else if (typeToCheck.includes('건별') || typeToCheck.includes('건당') || typeToCheck.includes('건')) {
        badgeLabel = '건';
        badgeColor = 'bg-slate-500';  // 건별 — ⬛ slate
    } else if (typeToCheck.includes('협의') || amount === '면접후결정') {
        badgeLabel = '협';
        badgeColor = 'bg-gray-400';   // 협의 — ⬜ gray
        amount = '면접후협의';
    }

    const cleanedAmount = typeof amount === 'string' ? amount.replace(/[^\d]/g, '') : String(amount);
    if (!isNaN(Number(cleanedAmount)) && cleanedAmount !== '') {
        amount = formatKoreanMoney(cleanedAmount);
    }

    return { badgeLabel, badgeColor, amount };
};

// [Optimization] Memoized Row Component
const JobRow = React.memo(({
    shop,
    isFav,
    brandTheme,
    onToggleFav,
    onSelect
}: {
    shop: Shop,
    isFav: boolean,
    brandTheme: 'dark' | 'light',
    onToggleFav: (e: React.MouseEvent, id: string) => void,
    onSelect: (shop: Shop) => void
}) => {
    const { badgeLabel, badgeColor, amount } = getPayBadgeInfo(shop);

    const borderCls = getBorderClass(shop.options?.border, shop.options?.border_period);
    return (
        <tr
            onClick={() => onSelect(shop)}
            className={`transition-colors cursor-pointer group ${brandTheme === 'dark' ? 'hover:bg-gray-800/50' : 'hover:bg-gray-50'} ${borderCls}`}
        >
            {/* 1. 지역 */}
            <td className="py-4 px-2 text-center whitespace-nowrap truncate">
                <span className={`text-[13px] font-bold ${brandTheme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}>
                    {shop.region.split(' ')[1] ? `[${shop.region.split(' ')[1]}]` : shop.region}
                </span>
            </td>

            {/* 2. 스크랩 */}
            <td className="py-4 px-2 text-center">
                <button onClick={(e) => { saveShopSnapshot(shop.id, shop); onToggleFav(e, shop.id); }} className={`transition-transform active:scale-90 ${isFav ? 'text-amber-400' : 'text-gray-200 group-hover:text-gray-300'}`}>
                    <Star size={18} fill={isFav ? "currentColor" : "none"} />
                </button>
            </td>

            {/* 3. 업소명 — 공고닉네임 우선, 없으면 상호명 */}
            <td className="py-4 px-2 text-center">
                <div className="flex items-center justify-center gap-1.5 w-full">
                    <span className={`font-black text-[14px] truncate max-w-full ${brandTheme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>
                        {shop.nickname || cleanShopTitle(undefined, shop.name)}
                    </span>
                </div>
            </td>

            {/* 4. 직종 */}
            <td className="py-4 px-2 text-center">
                <span className="text-[13px] font-bold text-gray-500 truncate block">{shop.workType}</span>
            </td>

            {/* 5. 공고제목 (1줄 제한) */}
            <td className="py-4 px-2 text-center">
                {/* 5. 공고제목 (1줄 제한 - Flex Refactor for PC Table) */}
                <div className="flex items-center justify-center gap-1 w-full px-2">
                    {shop.options?.blink && <span className="text-[10px] bg-red-600 !text-white px-1.5 py-0.5 rounded font-black whitespace-nowrap shrink-0 shadow-sm">NEW</span>}
                    <IconBadge iconId={shop.options?.icon} className="text-[14px] shrink-0" textOnly={true} />
                    <div
                        className={`text-[14px] font-bold ${brandTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'} truncate text-center leading-snug max-w-[300px]`}
                    >
                        <span
                            style={getHighlighterStyle(shop.options?.highlighter)}
                            className="truncate"
                        >
                            {cleanShopTitle(shop.title, shop.name)}
                        </span>
                    </div>
                </div>
            </td>

            {/* 6. 급여 */}
            <td className="py-4 pr-4 pl-2 text-right">
                <div className="flex flex-col items-end justify-center w-full">
                    <div className="flex items-center gap-1 shrink-0 whitespace-nowrap">
                        <span className={`${badgeColor} text-white text-[10px] w-[18px] h-[18px] flex items-center justify-center rounded-sm font-bold shadow-sm`}>{badgeLabel}</span>
                        <div className={`font-black text-[12px] tracking-tighter ${brandTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                            {amount}
                        </div>
                    </div>
                    {shop.options?.paySuffixes && shop.options.paySuffixes.length > 0 && (
                        <div className="overflow-hidden mt-1 w-full max-w-[160px]">
                            {shop.options.paySuffixes.length <= 3 ? (
                                <div className="flex gap-1 justify-end flex-wrap">
                                    {shop.options.paySuffixes.map((suffix, i) => (
                                        <span key={i} className="px-1.5 py-0.5 bg-gray-100 text-gray-600 text-[9px] rounded font-bold border border-gray-200 whitespace-nowrap">
                                            {suffix}
                                        </span>
                                    ))}
                                </div>
                            ) : (
                                <div className="keyword-marquee flex gap-1" style={{ width: 'max-content' }}>
                                    {[...shop.options.paySuffixes, ...shop.options.paySuffixes].map((suffix, i) => (
                                        <span key={i} className="px-1.5 py-0.5 bg-gray-100 text-gray-600 text-[9px] rounded font-bold border border-gray-200 whitespace-nowrap">
                                            {suffix}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </td>
        </tr>
    );
});
JobRow.displayName = 'JobRow';

const getTierBadge = (tier?: string) => {
    switch (tier) {
        case 'special': return { label: '스페셜', color: 'bg-emerald-500 text-white' };
        case 'deluxe': return { label: '디럭스', color: 'bg-blue-600 text-white' };
        case 'urgent': return { label: '급구', color: 'bg-purple-600 text-white' }; // 🟣 보라 (급구/추천)
        case 'grand': return { label: '그랜드', color: 'bg-amber-400 text-black' };
        case 'premium': return { label: '프리미엄', color: 'bg-purple-600 text-white' };
        default: return null;
    }
};

// [Optimization] Memoized Mobile Row Component
const MobileJobRow = React.memo(({
    shop,
    isFav,
    onSelect,
    onToggleFav
}: {
    shop: Shop,
    isFav: boolean,
    onSelect: (shop: Shop) => void,
    onToggleFav: (e: React.MouseEvent, id: string) => void
}) => {
    const { badgeLabel, badgeColor, amount } = getPayBadgeInfo(shop);
    const borderCls = getBorderClass(shop.options?.border, shop.options?.border_period);

    return (
        <div
            onClick={() => onSelect(shop)}
            className={`p-1 flex flex-col border-b last:border-0 relative !bg-white border-gray-100 shadow-sm shadow-gray-100`}
            style={{ mixBlendMode: 'normal' }}
        >
            <div className={`w-full bg-white rounded-lg p-3 flex justify-between items-start gap-1 relative shadow-sm border border-gray-100 ${borderCls}`}>
                <div className="flex-1 min-w-0 flex flex-col gap-1.5 pr-2 pt-1">

                    {/* Line 1: IconOption + Highlighter + Title (2줄까지) */}
                    {/* Line 1: IconOption + Highlighter + Title (1줄 제한 - Flex Refactor) */}
                    <div className="flex items-center gap-1 mb-0.5 min-w-0">
                        {shop.options?.blink && <span className="text-[9px] bg-red-600 !text-white px-1.5 py-0.5 rounded font-black whitespace-nowrap shadow-sm shrink-0">NEW</span>}
                        <IconBadge iconId={shop.options?.icon} className="shrink-0" textOnly={true} />
                        <h3 className={`text-[15px] font-bold text-gray-900 leading-snug line-clamp-2 break-all w-full`}>
                            <span
                                style={getHighlighterStyle(shop.options?.highlighter)}
                            >
                                {cleanShopTitle(shop.title, shop.name)}
                            </span>
                        </h3>
                    </div>

                    {/* Line 2: Left(Region + Industry) / Right(Nickname) */}
                    <div className="flex justify-between items-center text-[12px]">
                        <div className="flex items-center gap-1.5 min-w-0">
                            <span className="text-blue-600 font-bold truncate">{shop.region}</span>
                            <span className="text-gray-300">|</span>
                            <span className="text-gray-500 font-medium truncate">{shop.workType}</span>
                        </div>
                        <div className="text-gray-800 font-bold truncate ml-2">
                            {shop.nickname || cleanShopTitle(undefined, shop.name)}
                        </div>
                    </div>

                    {/* Line 3: Pay Badge + Amount (좌) | 추가급여옵션 마퀴 (우) */}
                    <div className="flex items-center gap-1 mt-0.5 min-w-0">
                        <div className={`
                            px-1.5 py-0.5 rounded-[4px] text-[10px] font-bold text-white shrink-0
                            ${badgeColor}
                        `}>
                            {badgeLabel}
                        </div>
                        <div className={`text-[11px] font-black tracking-tighter !text-gray-900 force-dark-text shrink-0`}>
                            {amount}
                        </div>
                        {shop.options?.paySuffixes && shop.options.paySuffixes.length > 0 && (
                            <div className="overflow-hidden flex-1 min-w-0">
                                {shop.options.paySuffixes.length <= 3 ? (
                                    <div className="flex gap-1">
                                        {shop.options.paySuffixes.map((suffix, i) => (
                                            <span key={i} className="px-1.5 py-0.5 bg-gray-100 text-gray-600 text-[9px] rounded font-bold border border-gray-200 whitespace-nowrap">
                                                {suffix}
                                            </span>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="keyword-marquee flex gap-1" style={{ width: 'max-content' }}>
                                        {[...shop.options.paySuffixes, ...shop.options.paySuffixes].map((suffix, i) => (
                                            <span key={i} className="px-1.5 py-0.5 bg-gray-100 text-gray-600 text-[9px] rounded font-bold border border-gray-200 whitespace-nowrap">
                                                {suffix}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right: Star Icon */}
                <button
                    onClick={(e) => { saveShopSnapshot(shop.id, shop); onToggleFav(e, shop.id); }}
                    className="p-1 shrink-0 text-gray-300 active:scale-90 transition-transform"
                >
                    <Star size={20} fill={isFav ? "currentColor" : "none"} className={isFav ? "text-amber-400" : ""} />
                </button>
            </div>
        </div>
    );
});
MobileJobRow.displayName = 'MobileJobRow';

const MobileNativeAd = React.memo(({
    onRegister,
    onNavigate
}: {
    onRegister?: (tier?: string) => void,
    onNavigate: () => void
}) => (
    <div className="p-3 bg-blue-50">
        <div className="bg-white/90 rounded-xl p-3 border border-blue-100 flex items-center justify-between">
            <div>
                <p className="text-[10px] text-blue-600 font-black mb-0.5">PREMIUM AD</p>
                <p className="text-[13px] font-bold text-gray-800">사장님, 여기보세요!</p>
            </div>
            <button
                onClick={() => onRegister ? onRegister('mobile_list') : onNavigate()}
                className="px-3 py-1.5 bg-blue-600 text-white text-[11px] font-bold rounded-lg shadow-sm"
            >
                광고등록
            </button>
        </div>
    </div>
));
MobileNativeAd.displayName = 'MobileNativeAd';

const JobListView: React.FC<JobListViewProps> = ({
    shops,
    brand,
    favorites,
    toggleFavorite,
    setSelectedShop,
    visibleCount,
    setVisibleCount,
    onAdRegister,
    onNativeAdRegister,
}) => {
    const router = useRouter();

    // [Optimization] DOM Culling Logic
    // Initially render BOTH (hidden by CSS) to prevent hydration mismatch.
    // After mount, remove the hidden one from DOM to save memory/cpu.
    const [isMounted, setIsMounted] = React.useState(false);
    const [isMobile, setIsMobile] = React.useState(false);

    React.useEffect(() => {
        setIsMounted(true);
        const checkMobile = () => setIsMobile(window.innerWidth < 1024); // Unified 1024px breakpoint (lg)
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const showDesktop = isMounted && !isMobile;
    const showMobile = isMounted && isMobile;

    return (
        <div id="latest-job-info-region" className="w-full clear-both mt-0 px-4 md:px-0">
            <div className="flex items-center justify-between mb-5 w-full">
                <h2 className={`text-xl md:text-2xl font-black flex items-center gap-2 ${brand.theme === 'dark' ? 'text-white' : 'text-gray-900'} `}>
                    <Flame size={24} className="text-blue-600 animate-pulse" />
                    <span>최신 구인정보</span>
                    <span className="bg-blue-600 text-white text-[10px] px-2 py-0.5 rounded-full font-black animate-pulse uppercase font-sans shadow-md">LIVE</span>
                </h2>
                <div className="flex items-center gap-2">
                    <button
                        className="hidden md:flex items-center px-4 py-2 rounded-xl text-xs font-bold border border-gray-200 text-gray-500 hover:bg-gray-50 transition shadow-sm"
                    >
                        <Star size={14} className="mr-1 text-amber-400" fill="currentColor" /> 내 보관함
                    </button>
                    <button
                        className="hidden md:flex items-center px-4 py-2 rounded-xl text-xs font-bold border border-gray-200 text-gray-500 hover:bg-gray-50 transition shadow-sm"
                    >
                        더보기 +
                    </button>
                    <button
                        onClick={() => onAdRegister ? onAdRegister('basic') : router.push('/?page=payment')}
                        className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 transition shadow-md hover:shadow-lg active:scale-95"
                    >
                        광고신청
                    </button>
                </div>
            </div>

            <div className={`rounded-2xl border shadow-sm overflow-hidden ${brand.theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
                {/* Desktop Table View */}
                {showDesktop && (
                    <div className="hidden md:block overflow-hidden">
                        <table className="w-full text-left border-collapse table-fixed">
                            <thead className={`text-[13px] border-b ${brand.theme === 'dark' ? 'bg-gray-800/50 border-gray-700 text-gray-300' : 'bg-gray-50/80 border-gray-100 text-gray-500'}`}>
                                <tr>
                                    <th className="py-4 px-2 font-black whitespace-nowrap w-[10%] text-center">지역</th>
                                    <th className="py-4 px-2 font-black whitespace-nowrap w-[5%] text-center">찜</th>
                                    <th className="py-4 px-2 font-black whitespace-nowrap w-[15%] text-center">업소명</th>
                                    <th className="py-4 px-2 font-black whitespace-nowrap w-[10%] text-center">직종</th>
                                    <th className="py-4 px-2 font-black whitespace-nowrap w-[45%] text-center">모집내용</th>
                                    <th className="py-4 px-2 font-black whitespace-nowrap w-[15%] text-center">급여</th>
                                </tr>
                            </thead>
                            <tbody className={`divide-y ${brand.theme === 'dark' ? 'divide-gray-800' : 'divide-gray-50'}`}>
                                {shops.length > 0 ? (
                                    shops.slice(0, visibleCount).map((shop, i) => {
                                        const isFav = favorites.includes(shop.id);
                                        const isAdRow = (i + 1) % 5 === 0;

                                        return (
                                            <React.Fragment key={shop.id || i}>
                                                <JobRow
                                                    shop={shop}
                                                    isFav={isFav}
                                                    brandTheme={brand.theme}
                                                    onToggleFav={toggleFavorite}
                                                    onSelect={setSelectedShop}
                                                />

                                                {/* 광고 영역 (Native Ad) */}
                                                {isAdRow && (
                                                    <tr>
                                                        <td colSpan={6} className="p-4">
                                                            <div className="w-full bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6 border border-blue-100 flex items-center justify-between relative overflow-hidden group cursor-pointer shadow-sm hover:shadow-md transition-all">
                                                                <div className="relative z-10">
                                                                    <h4 className="text-[17px] font-black text-gray-900 mb-1 flex items-center gap-2">
                                                                        <Megaphone size={20} className="text-blue-600" />
                                                                        <span>사장님, 광고 한칸 어떠세요?</span>
                                                                    </h4>
                                                                    <p className="text-gray-500 text-xs font-medium">
                                                                        최고의 노출 효과로 매출을 UP 시켜보세요!
                                                                    </p>
                                                                </div>
                                                                <div className="relative z-10">
                                                                    <button
                                                                        onClick={(e) => { e.stopPropagation(); onNativeAdRegister ? onNativeAdRegister('native') : (onAdRegister ? onAdRegister('native') : router.push('/?page=payment')); }}
                                                                        className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold px-5 py-2.5 rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all flex items-center gap-1.5"
                                                                    >
                                                                        <PlusCircle size={16} /> 광고신청
                                                                    </button>
                                                                </div>
                                                                {/* Optimized Decor elements (Removed heavy blur) */}
                                                                <div className="absolute right-0 top-0 w-32 h-32 bg-blue-100/30 rounded-full -translate-y-1/2 translate-x-1/2" />
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </React.Fragment>
                                        );
                                    })
                                ) : (
                                    <tr><td colSpan={6} className="py-20 text-center text-gray-400 font-bold">결과가 없습니다.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Mobile Ad-like View */}
                {showMobile && (
                    <div className="md:hidden">
                        <div className={`divide-y ${brand.theme === 'dark' ? 'divide-gray-800' : 'divide-gray-100'}`}>
                            {shops.length > 0 ? (
                                shops.slice(0, visibleCount).map((shop, i) => {
                                    const isFav = favorites.includes(shop.id);
                                    return (
                                        <React.Fragment key={shop.id || i}>
                                            <MobileJobRow
                                                shop={shop}
                                                isFav={isFav}
                                                onSelect={setSelectedShop}
                                                onToggleFav={toggleFavorite}
                                            />

                                            {/* Mobile Native Ad */}
                                            {(i + 1) % 5 === 0 && (
                                                <MobileNativeAd
                                                    onRegister={onNativeAdRegister}
                                                    onNavigate={() => router.push('/?page=payment')}
                                                />
                                            )}
                                        </React.Fragment>
                                    );
                                })
                            ) : (
                                <div className="py-20 text-center text-gray-400 font-bold">
                                    결과가 없습니다.
                                </div>
                            )}
                        </div>

                        {/* View More Button */}
                        {shops.length >= visibleCount && (
                            <div className="p-4">
                                <button
                                    onClick={() => setVisibleCount(prev => prev + 20)}
                                    className={`w-full py-3 rounded-xl font-bold border transition-all active:scale-95 ${brand.theme === 'dark' ? 'bg-gray-800 border-gray-700 text-gray-300' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                                >
                                    더보기 +
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default JobListView;
