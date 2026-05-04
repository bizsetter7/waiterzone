import React from 'react';
import { Shop } from '@/types/shop';
import { useMobile } from '@/hooks/useMobile';
import { formatKoreanMoney } from '@/utils/formatMoney';
import { getPayColor, getPayAbbreviation } from '@/utils/payColors';
import { cleanShopTitle, slugify } from '@/utils/shopUtils';

interface AdBannerCardProps {
    shop: Shop;
    tierId?: string; // 섹션 기준 등급 (grand | premium) — AD_TIER_STANDARDS 동기화용
    onClick?: (e: React.MouseEvent) => void;
}

/**
 * AdBannerCard (Grand/Premium)
 * ─ 이미지 있을 경우: 이미지 섹션에 이미지 표시
 * ─ 이미지 없을 경우: 이미지 섹션에 공고 제목만 표시
 * ─ 하단 컨텐츠 공통 3-Row 규칙:
 *   Row1: 담당자 광고닉네임(좌) | 지역정보(우)
 *   Row2: 급여종류배지+급여(좌) | 업종정보(우)
 *   Row3: 추가급여옵션(paySuffixes)
 */
// border 옵션 → 클래스 (border_period > 0 인 경우만)
const getBorderClass = (opt?: string, period?: number): string => {
    if (!opt || opt === 'none' || !period || period <= 0) return '';
    switch (opt) {
        case 'color':   return 'border-2 border-blue-400 shadow-md shadow-sm';
        case 'glow':    return 'border-2 border-yellow-400 shadow-md shadow-yellow-100';
        case 'sparkle': return 'border-2 border-pink-400 shadow-md shadow-pink-100';
        case 'rainbow': return 'border-2 animate-rainbow-border shadow-lg';
        default:        return '';
    }
};

export const AdBannerCard = React.memo(({ shop, tierId, onClick }: AdBannerCardProps) => {
    const isMobile = useMobile();
    const cleanTitle = cleanShopTitle(shop.title, shop.name);
    const [imgError, setImgError] = React.useState(false);

    // mediaUrl이 바뀌면 imgError 초기화 (URL 교체 후 깜빡임 방지)
    React.useEffect(() => { setImgError(false); }, [shop.options?.mediaUrl]);
    // enrichAdData: approved배너 → options.mediaUrl → media_url → picsum(mock only) 순 우선순위
    const hasImage = !!shop.options?.mediaUrl && !imgError;
    const paySuffixes: string[] = shop.options?.paySuffixes || (shop.options as any)?.pay_suffixes || (shop as any).paySuffixes || [];
    const badgeChar = getPayAbbreviation(shop.payType || '시급');
    const borderCls = getBorderClass(shop.options?.border, shop.options?.border_period);

    // AD_TIER_STANDARDS 동기화 — 이미지 없을 때 등급별 고정 그라디언트 (2026-03-22)
    // tierId(섹션 기준) 우선, 없으면 shop.tier fallback
    const getTierGradient = (): string => {
        const tier = (tierId || shop.tier || shop.productType || '').toLowerCase();
        if (tier === 'grand'   || tier === 'p1') return 'from-amber-500 to-amber-600';   // 🟡 Grand
        if (tier === 'premium' || tier === 'p2') return 'from-red-600 to-red-700';        // 🔴 Premium
        return 'from-amber-500 to-amber-600'; // fallback
    };

    return (
        <a 
            href={`/waiter/${slugify(shop.region)}/${shop.id}`}
            onClick={(e) => {
                if (onClick) {
                    e.preventDefault();
                    onClick(e);
                }
            }}
            className={`
            h-full flex flex-col group relative rounded-2xl cursor-pointer transition-[transform,box-shadow] duration-200
            ${!isMobile ? 'hover:scale-[1.02] active:scale-95' : 'active:scale-95'}
            bg-white overflow-hidden border border-gray-200 shadow-md shadow-gray-200/50 pb-2
            ${borderCls}
        `}>

            {/* NEW 배지 */}
            {shop.options?.blink && (
                <div className="absolute top-0 left-0 z-50 overflow-hidden w-14 h-14 pointer-events-none rounded-tl-2xl">
                    <div className="absolute top-[6px] left-[-22px] bg-red-600 text-white text-[9px] font-black py-1 w-20 text-center -rotate-45 shadow-[0_2px_4px_rgba(0,0,0,0.3)] uppercase tracking-tighter">
                        NEW
                    </div>
                </div>
            )}

            {/* ── 이미지 섹션 ── */}
            {(() => {
                // [구글 이미지 SEO] alt/figcaption 자동 생성 패턴: {지역} {업종} {급여} 이상 초보환영 채용공고
                const regionClean = (shop.region || '').replace(/[\[\]]/g, '').trim();
                const imageAlt = [
                    regionClean,
                    shop.workType || shop.category,
                    shop.pay ? `${shop.pay} 이상` : '',
                    '초보환영 채용공고',
                ].filter(Boolean).join(' ') + ' - 웨이터존';

                return (
                    <figure className="relative w-full aspect-[4/3] overflow-hidden bg-slate-950 border-b border-gray-100 m-0">
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
                                    loading="lazy"
                                    decoding="async"
                                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                                    onError={() => setImgError(true)}
                                />
                            )
                        ) : (
                            // 이미지 없을 경우: 공고 제목만 중앙 표시
                            <div className={`absolute inset-0 flex items-center justify-center p-4 text-center bg-gradient-to-br ${getTierGradient()}`}>
                                <div className="absolute inset-0 opacity-20 pointer-events-none overflow-hidden">
                                    <div className="absolute -top-10 -left-10 w-40 h-40 bg-white rounded-full blur-3xl animate-pulse" />
                                    <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-blue-500 rounded-full blur-3xl animate-pulse" />
                                </div>
                                <h2 className="relative z-10 text-white font-black text-[13px] leading-snug drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)] tracking-tighter break-keep line-clamp-5 w-full">
                                    {cleanTitle}
                                </h2>
                                <div className="absolute inset-0 shadow-[inset_0_0_60px_rgba(0,0,0,0.4)] pointer-events-none" />
                            </div>
                        )}
                        {/* [구글 이미지 SEO] figcaption — 시각적으로 숨기되 크롤러/스크린리더 노출 */}
                        {hasImage && <figcaption className="sr-only">{imageAlt}</figcaption>}
                    </figure>
                );
            })()}

            {/* ── 하단 컨텐츠 섹션 (3-Row 고정 규칙) ── */}
            <div className="px-2 pt-1.5 pb-0 flex flex-col gap-1 overflow-hidden font-medium flex-1 justify-between">

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
                        <span className={`text-[10px] font-black px-1.5 h-[18px] inline-flex items-center justify-center rounded-[4px] ${getPayColor(shop.payType || '시급')} whitespace-nowrap flex-shrink-0 text-white shadow-sm`}>
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
            </div>
        </a>
    );
});

AdBannerCard.displayName = 'AdBannerCard';
