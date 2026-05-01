import React from 'react';
import { Shop } from '@/types/shop';
import { formatKoreanMoney } from '@/utils/formatMoney';
import { getPayColor } from '@/utils/payColors';
import { getHighlighterStyle } from '@/utils/highlighter';
import { cleanShopTitle, slugify } from '@/utils/shopUtils';
import { IconBadge } from '../common/IconBadge';
import { useMobile } from '@/hooks/useMobile';

interface ShopCardProps {
    shop: Shop;
    rank?: number;
    tierLabel?: string;
    tierId?: string;
    onClick?: (e: React.MouseEvent) => void;
    hideImage?: boolean;
}

/**
 * ShopCard (Deluxe/Special/Urgent/Recommended/Native/Basic)
 *
 * [이미지 있는 카드 - Deluxe/Special]
 *   이미지 섹션: 이미지 있으면 이미지, 없으면 공고 제목만 표시
 *   하단 3-Row 규칙:
 *     Row1: 담당자 광고닉네임(좌) | 지역정보(우)
 *     Row2: 급여종류배지+급여(좌) | 업종정보(우)
 *     Row3: 추가급여옵션(paySuffixes)
 *
 * [이미지 없는 카드 - Urgent/Recommended]
 *   이미지 섹션 없음, 텍스트 위주 레이아웃 유지
 */
// border 옵션 → 클래스 (border_period > 0 인 경우만)
const getBorderClass = (opt?: string, period?: number): string => {
    if (!opt || opt === 'none' || !period || period <= 0) return '';
    switch (opt) {
        case 'color':   return 'border-2 border-blue-400 shadow-md shadow-blue-100';
        case 'glow':    return 'border-2 border-yellow-400 shadow-md shadow-yellow-100';
        case 'sparkle': return 'border-2 border-pink-400 shadow-md shadow-pink-100';
        case 'rainbow': return 'border-2 animate-rainbow-border shadow-lg';
        default:        return '';
    }
};

export const ShopCard = React.memo(({ shop, rank, tierLabel, tierId, onClick, hideImage }: ShopCardProps) => {
    const isMobile = useMobile();
    const [imgError, setImgError] = React.useState(false);

    // mediaUrl이 바뀌면 imgError 초기화 (URL 교체 후 깜빡임 방지)
    React.useEffect(() => { setImgError(false); }, [shop.options?.mediaUrl]);
    // enrichAdData: approved배너 → options.mediaUrl → media_url → picsum(mock only) 순 우선순위
    const hasImage = !!shop.options?.mediaUrl && !imgError;
    const isUrgentType = tierId === 'urgent' || tierId === 'recommended';
    const showImage = !isUrgentType && !hideImage;
    const cleanTitle = cleanShopTitle(shop.title, shop.name);
    const paySuffixes: string[] = shop.options?.paySuffixes || (shop.options as any)?.pay_suffixes || (shop as any).paySuffixes || [];
    const badgeChar = shop.payType?.substring(0, 1) || '시';
    const borderCls = getBorderClass(shop.options?.border, shop.options?.border_period);

    // 업종(workType/category) 기반 그라디언트 — 이미지 없을 때 업소 특성 시각화
    const getCategoryGradient = (workType?: string, category?: string): string => {
        const cat = (workType || category || '').toLowerCase();
        if (cat.includes('룸') || cat.includes('room')) return 'from-rose-700 via-pink-800 to-zinc-900';
        if (cat.includes('노래') || cat.includes('karaoke')) return 'from-purple-700 via-violet-800 to-zinc-900';
        if (cat.includes('바') || cat.includes('bar') || cat.includes('주점')) return 'from-blue-700 via-indigo-800 to-zinc-900';
        if (cat.includes('마사지') || cat.includes('massage')) return 'from-teal-700 via-emerald-800 to-zinc-900';
        if (cat.includes('엔터') || cat.includes('enter')) return 'from-amber-700 via-orange-800 to-zinc-900';
        if (cat.includes('다방')) return 'from-orange-700 via-amber-800 to-zinc-900';
        if (cat.includes('카페') || cat.includes('cafe')) return 'from-amber-600 via-yellow-800 to-zinc-900';
        if (cat.includes('요정')) return 'from-fuchsia-700 via-pink-800 to-zinc-900';
        // 등급별 fallback
        const tid = tierId || '';
        if (tid === 'deluxe')      return 'from-blue-700 via-blue-800 to-zinc-900';
        if (tid === 'special')     return 'from-emerald-700 via-teal-800 to-zinc-900';
        if (tid === 'urgent' || tid === 'recommended') return 'from-purple-700 via-violet-800 to-zinc-900';
        return 'from-zinc-700 via-zinc-800 to-zinc-950';
    };
    const cardGradient = getCategoryGradient(shop.workType, shop.category);

    return (
        <a
            href={`/coco/${slugify(shop.region)}/${shop.id}`}
            onClick={(e) => {
                if (onClick) {
                    e.preventDefault();
                    onClick(e);
                }
            }}
            className={`h-full flex flex-col group relative rounded-2xl cursor-pointer transition-[transform,box-shadow] duration-200
            ${!isMobile ? 'hover:scale-[1.01] active:scale-95' : 'active:scale-95'}
            !bg-white border border-gray-200 shadow-md shadow-gray-200/50 pb-2 overflow-hidden ${borderCls}`}
        >
            {/* NEW 배지 - 상단 좌측 */}
            {shop.options?.blink && (
                <div className="absolute top-0 left-0 z-50 overflow-hidden w-14 h-14 pointer-events-none rounded-tl-2xl">
                    <div className="absolute top-[6px] left-[-22px] bg-red-600 text-white text-[9px] font-black py-1 w-20 text-center -rotate-45 shadow-[0_2px_4px_rgba(0,0,0,0.3)] uppercase tracking-tighter">
                        NEW
                    </div>
                </div>
            )}

            {/* ── 이미지 섹션 (Deluxe/Special만 표시) ── */}
            {showImage && (() => {
                // [구글 이미지 SEO] alt/figcaption 자동 생성 패턴: {지역} {업종} {급여} 이상 초보환영 채용공고
                const regionClean = (shop.region || '').replace(/[\[\]]/g, '').trim();
                const imageAlt = [
                    regionClean,
                    shop.workType || shop.category,
                    shop.pay ? `${shop.pay} 이상` : '',
                    '초보환영 채용공고',
                ].filter(Boolean).join(' ') + ' - 웨이터존';

                return (
                    <figure className="relative w-full aspect-[4/3] overflow-hidden bg-slate-900 border-b border-gray-100 m-0">
                        {hasImage ? (
                            // 미디어 타입에 따른 분기 (비디오/이미지)
                            shop.options!.mediaUrl?.toLowerCase().match(/\.(mp4|webm|mov)$/i) ? (
                                <video
                                    src={shop.options!.mediaUrl}
                                    className="w-full h-full object-cover"
                                    muted
                                    autoPlay
                                    loop
                                    playsInline
                                    onError={() => setImgError(true)}
                                />
                            ) : (
                                // 이미지일 경우
                                <img
                                    src={shop.options!.mediaUrl}
                                    alt={imageAlt}
                                    className="w-full h-full object-cover"
                                    loading={rank && rank <= 2 ? 'eager' : 'lazy'}
                                    decoding="async"
                                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                                    onError={() => setImgError(true)}
                                />
                            )
                        ) : (
                            // 이미지 없을 경우: 업종 그라디언트 + 업소명 중앙 강조
                            <div className={`absolute inset-0 bg-gradient-to-b ${cardGradient} overflow-hidden`}>
                                <span className="absolute inset-0 flex items-center justify-center text-white/5 font-black select-none leading-none" style={{ fontSize: '5rem' }}>
                                    {(shop.name || shop.nickname || cleanTitle)?.[0]}
                                </span>
                                <div className="absolute inset-0 flex flex-col items-center justify-center p-3 text-center">
                                    <p className="text-white/40 text-[8px] font-black uppercase tracking-widest mb-1.5">
                                        {shop.workType || shop.category || ''}
                                    </p>
                                    <h4 className="relative z-10 text-white font-black text-[14px] leading-snug drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)] break-keep line-clamp-2 w-full">
                                        {shop.name || shop.nickname || cleanTitle}
                                    </h4>
                                    <p className="text-white/30 text-[9px] font-bold mt-1.5 truncate max-w-full">
                                        {shop.region || ''}
                                    </p>
                                </div>
                            </div>
                        )}
                        {/* 순위 배지 */}
                        {rank && (
                            <div className="absolute top-2 right-2 w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center shadow-md z-20">
                                <span className="text-[10px] font-black text-black">{rank}</span>
                            </div>
                        )}
                        {/* [구글 이미지 SEO] figcaption — 시각적으로 숨기되 크롤러/스크린리더 노출 */}
                        {hasImage && <figcaption className="sr-only">{imageAlt}</figcaption>}
                    </figure>
                );
            })()}

            {/* ── 컨텐츠 영역 ── */}
            <div className={`px-2 ${showImage ? 'pt-1.5' : 'pt-2'} flex flex-col gap-1 overflow-hidden font-medium flex-1 ${showImage ? 'justify-between' : ''}`}>

                {showImage ? (
                    // ── [Deluxe/Special] 3-Row 규칙 ──
                    <>
                        {/* Row 1: 담당자 광고닉네임(좌) | 지역정보(우) */}
                        <div className="flex justify-between items-baseline gap-2 min-w-0">
                            <span className="text-[11px] font-bold text-gray-700 truncate flex-1">
                                {shop.nickname || shop.name}
                            </span>
                            <span className="text-[11px] font-semibold text-gray-400 truncate shrink-0 text-right">
                                {shop.region}
                            </span>
                        </div>

                        {/* Row 2: 급여종류배지+급여(좌) | 업종정보(우) */}
                        <div className="flex justify-between items-center gap-2 min-w-0">
                            <div className="flex items-center gap-1 min-w-0">
                                <span className={`text-[10px] font-black w-[18px] h-[18px] flex items-center justify-center rounded-[4px] ${getPayColor(shop.payType || '시급')} whitespace-nowrap flex-shrink-0 text-white shadow-sm`}>
                                    {badgeChar}
                                </span>
                                <span className="text-[13px] font-black text-gray-900 tracking-tighter truncate">
                                    {formatKoreanMoney(shop.pay || 0)}
                                </span>
                            </div>
                            <span className="text-[11px] font-bold text-gray-400 truncate shrink-0 text-right">
                                {shop.workType || '업종'}
                            </span>
                        </div>

                        {/* Row 3: 추가급여옵션 (paySuffixes) — 4개 이상 시 마퀴 슬라이드 */}
                        {paySuffixes.length > 0 && (
                            <div className="overflow-hidden max-h-[18px]">
                                {paySuffixes.length <= 3 ? (
                                    <div className="flex gap-1">
                                        {paySuffixes.map((suffix: string, i: number) => (
                                            <span key={i} className="px-1.5 py-0.5 bg-gray-50 text-gray-500 text-[9px] font-bold rounded border border-gray-100 whitespace-nowrap leading-none">
                                                {suffix}
                                            </span>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="keyword-marquee flex gap-1" style={{ width: 'max-content' }}>
                                        {[...paySuffixes, ...paySuffixes].map((suffix: string, i: number) => (
                                            <span key={i} className="px-1.5 py-0.5 bg-gray-50 text-gray-500 text-[9px] font-bold rounded border border-gray-100 whitespace-nowrap leading-none">
                                                {suffix}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                ) : (
                    // ── [Urgent/Recommended] 새 레이아웃: 1줄 제목 + 3-Row ──
                    <>
                        {/* 공고제목 */}
                        <div className="flex items-center gap-1 w-full min-w-0 pt-0.5">
                            <IconBadge
                                iconId={shop.options?.icon}
                                className="text-[11px] shrink-0"
                                textOnly={true}
                            />
                            <h3
                                className="text-[12px] font-black leading-tight line-clamp-1 w-full break-all"
                                style={getHighlighterStyle(shop.options?.highlighter)}
                            >
                                {cleanTitle}
                            </h3>
                        </div>

                        {/* Row 1: 업소명/닉네임(좌) | 지역(우) */}
                        <div className="flex justify-between items-baseline gap-2 min-w-0">
                            <span className="text-[10px] font-bold text-gray-600 truncate flex-1">
                                {shop.nickname || shop.name}
                            </span>
                            <span className="text-[10px] font-semibold text-gray-400 truncate shrink-0 text-right">
                                {shop.region}
                            </span>
                        </div>

                        {/* Row 2: 급여종류배지+급여(좌) | 업종(우) */}
                        <div className="flex justify-between items-center gap-2 min-w-0">
                            <div className="flex items-center gap-1 min-w-0">
                                <span className={`text-[10px] font-black w-[16px] h-[16px] flex items-center justify-center rounded-[3px] ${getPayColor(shop.payType || '시급')} whitespace-nowrap flex-shrink-0 text-white shadow-sm`}>
                                    {badgeChar}
                                </span>
                                <span className="text-[12px] font-black text-gray-900 tracking-tighter truncate">
                                    {formatKoreanMoney(shop.pay || 0)}
                                </span>
                            </div>
                            <span className="text-[10px] font-bold text-gray-400 truncate shrink-0 text-right">
                                {shop.workType || '업종'}
                            </span>
                        </div>

                        {/* Row 3: 추가급여옵션 (paySuffixes) — 5개 이상 시 마퀴 슬라이드 */}
                        {paySuffixes.length > 0 && (
                            <div className="overflow-hidden max-h-[16px]">
                                {paySuffixes.length <= 4 ? (
                                    <div className="flex gap-1">
                                        {paySuffixes.map((suffix: string, i: number) => (
                                            <span key={i} className="px-1 py-0.5 bg-gray-50 text-gray-500 text-[9px] font-bold rounded border border-gray-100 whitespace-nowrap leading-none">
                                                {suffix}
                                            </span>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="keyword-marquee flex gap-1" style={{ width: 'max-content' }}>
                                        {[...paySuffixes, ...paySuffixes].map((suffix: string, i: number) => (
                                            <span key={i} className="px-1 py-0.5 bg-gray-50 text-gray-500 text-[9px] font-bold rounded border border-gray-100 whitespace-nowrap leading-none">
                                                {suffix}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>
        </a>
    );
});

ShopCard.displayName = 'ShopCard';
