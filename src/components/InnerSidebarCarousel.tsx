'use client';

/**
 * InnerSidebarCarousel
 * 업종별/지역별 채용페이지 내부 사이드바 — 디럭스/스페셜 광고 캐러셀
 *
 * 동작 규칙:
 * - banner_position='inner' OR tier in ['deluxe','special','p3','p4'] 중 active 광고만 표시
 * - 랜덤 셔플 후 4초마다 좌→우 슬라이드 자동 전환
 * - 이미지 없는 업체: tier 그라디언트 + 공고 제목 텍스트 자동 표시 (기존 SideAdCard 방식 동일)
 * - 이미지/GIF/영상(MP4) 지원
 */

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { formatKoreanMoney } from '@/utils/formatMoney';
import { getPayColor } from '@/utils/payColors';
import { Shop } from '@/types/shop';
import { normalizeAd } from '@/app/my-shop/utils/normalization';
import { useMobile } from '@/hooks/useMobile';

// ─── 유틸 ──────────────────────────────────────────────────────────────────────
function shuffle<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

function getTierGradient(tier: string): string {
    switch (tier) {
        case 'deluxe': case 'p3': return 'from-blue-600 to-blue-700';
        case 'special': case 'p4': return 'from-emerald-600 to-emerald-700';
        default: return 'from-slate-600 to-slate-700';
    }
}

// ─── 단일 카드 ─────────────────────────────────────────────────────────────────
interface CarouselCardProps {
    ad: Shop;
    onClick: () => void;
}

const CarouselCard = React.memo(({ ad, onClick }: CarouselCardProps) => {
    const bannerImageUrl  = (ad as any).banner_image_url || ad.options?.mediaUrl || '';
    const bannerMediaType = (ad as any).banner_media_type || 'image';
    const hasImage  = !!bannerImageUrl;
    const isVideo   = bannerMediaType === 'video' || bannerImageUrl?.toLowerCase().endsWith('.mp4');
    const tierGrad  = getTierGradient(ad.tier || '');
    const badgeChar = ad.payType?.substring(0, 1) || '시';
    const paySuffixes: string[] = ad.options?.paySuffixes || (ad.options as any)?.pay_suffixes || [];

    return (
        <div
            onClick={onClick}
            className="group w-full h-[140px] bg-white rounded-xl overflow-hidden cursor-pointer shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all border border-gray-100 flex flex-col shrink-0"
            style={{ minWidth: '100%' }}
        >
            {/* 이미지 영역 80px */}
            <div className={`relative w-full h-[80px] shrink-0 overflow-hidden ${!hasImage ? `bg-gradient-to-br ${tierGrad}` : ''}`}>
                {hasImage ? (
                    isVideo ? (
                        <video
                            src={bannerImageUrl}
                            autoPlay
                            loop
                            muted
                            playsInline
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <img
                            src={bannerImageUrl}
                            alt={ad.name}
                            className="w-full h-full object-cover"
                            loading="lazy"
                        />
                    )
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center px-2">
                        <h4 className="text-white font-black text-[11px] leading-tight drop-shadow-md break-keep text-center line-clamp-3 w-full">
                            {ad.title || ad.name}
                        </h4>
                    </div>
                )}
            </div>

            {/* 정보 영역 60px */}
            <div className="px-2 pt-1.5 pb-1 flex flex-col justify-between flex-1 bg-white overflow-hidden">
                <div className="flex justify-between items-baseline gap-1 min-w-0">
                    <span className="text-[9px] font-bold text-gray-700 truncate flex-1 leading-none">{ad.nickname || ad.name}</span>
                    <span className="text-[9px] font-semibold text-gray-400 truncate shrink-0 text-right leading-none">{ad.region}</span>
                </div>
                <div className="flex justify-between items-center gap-1 min-w-0">
                    <div className="flex items-center gap-0.5 min-w-0">
                        <span className={`shrink-0 w-[13px] h-[13px] flex items-center justify-center rounded-[3px] text-[8px] font-black text-white leading-none ${getPayColor(ad.payType || '')}`}>
                            {badgeChar}
                        </span>
                        <span className="text-[10px] font-black text-gray-900 tracking-tighter truncate">
                            {formatKoreanMoney(ad.pay)}
                        </span>
                    </div>
                    <span className="text-[9px] font-bold text-gray-400 truncate shrink-0 text-right max-w-[48%] leading-none">{ad.workType}</span>
                </div>
                <div className="flex gap-0.5 overflow-hidden h-[14px] items-center">
                    {paySuffixes.slice(0, 3).map((s: string, i: number) => (
                        <span key={i} className="text-[8px] text-gray-400 font-medium bg-gray-50 px-1 rounded border border-gray-100 whitespace-nowrap leading-[13px]">{s}</span>
                    ))}
                </div>
            </div>
        </div>
    );
});
CarouselCard.displayName = 'CarouselCard';

// ─── 메인 캐러셀 컴포넌트 ──────────────────────────────────────────────────────
interface InnerSidebarCarouselProps {
    onAdSelect?: (ad: Shop) => void;
}

export function InnerSidebarCarousel({ onAdSelect }: InnerSidebarCarouselProps) {
    const isMobile = useMobile();
    const [ads, setAds]           = useState<Shop[]>([]);
    const [currentIdx, setCurrentIdx] = useState(0);
    const [sliding, setSliding]   = useState(false);

    // 광고 데이터 fetch (자체 조회 — LeftSidebar props 불필요)
    // [Optimization] 모바일에서는 내부 캐러셀 미사용 → DB 조회 + 타이머 완전 차단
    useEffect(() => {
        if (isMobile) return; // 모바일 fetch 차단
        const fetchAds = async () => {
            try {
                const { data } = await supabase
                    .from('shops')
                    .select(`
                        id, user_id, name, title, nickname, region, tier,
                        pay, pay_type, work_type, status,
                        banner_position, banner_image_url, banner_media_type, banner_status,
                        options
                    `)
                    .eq('is_closed', false)
                    .in('tier', ['deluxe', 'special', 'p3', 'p4'])
                    .order('created_at', { ascending: false })
                    .limit(30);

                if (data && data.length > 0) {
                    // banner_position='inner' 또는 tier 기준 필터
                    // migration 06 이전: banner_position 컬럼 없음 → tier만으로 표시
                    // migration 06 이후: banner_position='inner' + banner_status='approved'
                    const innerAds = data.filter((s: any) => {
                        const pos = s.banner_position;
                        const bStatus = s.banner_status;
                        if (pos === null || pos === undefined) return true; // migration 06 이전 호환
                        return pos === 'inner' && (bStatus === 'approved' || bStatus === null);
                    });
                    // normalizeAd로 camelCase/snake_case 불일치 완전 해소
                    const normalized = (innerAds
                        .map((s: any) => normalizeAd(s))
                        .filter(Boolean) as unknown) as Shop[];
                    setAds(shuffle(normalized));
                }
            } catch (err) {
                console.warn('[InnerSidebarCarousel] 광고 로드 실패:', err);
            }
        };
        fetchAds();
    }, [isMobile]);

    // 4초 자동 슬라이드 — 모바일에서는 타이머 실행 안 함
    useEffect(() => {
        if (isMobile || ads.length <= 1) return;
        const timer = setInterval(() => {
            setSliding(true);
            setTimeout(() => {
                setCurrentIdx(prev => (prev + 1) % ads.length);
                setSliding(false);
            }, 350);
        }, 4000);
        return () => clearInterval(timer);
    }, [ads.length, isMobile]);

    // [Optimization] 모바일에서는 캐러셀 미렌더 — 불필요 DOM + 타이머 완전 제거
    if (isMobile || ads.length === 0) return null;

    return (
        <div className="space-y-1.5">
            {/* 캐러셀 뷰포트 */}
            <div className="relative w-full overflow-hidden rounded-xl">
                {/* 슬라이드 트랙 */}
                <div
                    className="flex"
                    style={{
                        transform: `translateX(-${currentIdx * 100}%)`,
                        transition: sliding ? 'transform 0.35s cubic-bezier(0.4, 0, 0.2, 1)' : 'none',
                    }}
                >
                    {ads.map((ad) => (
                        <CarouselCard
                            key={ad.id}
                            ad={ad}
                            onClick={() => onAdSelect?.(ad)}
                        />
                    ))}
                </div>
            </div>

            {/* 인디케이터 도트 */}
            {ads.length > 1 && (
                <div className="flex justify-center items-center gap-1 py-0.5">
                    {ads.map((_, i) => (
                        <button
                            key={i}
                            onClick={() => { setSliding(false); setCurrentIdx(i); }}
                            className={`h-1.5 rounded-full transition-all duration-300 ${
                                i === currentIdx
                                    ? 'w-4 bg-blue-500'
                                    : 'w-1.5 bg-gray-300 hover:bg-gray-400'
                            }`}
                            aria-label={`슬라이드 ${i + 1}`}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
