'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Crown } from 'lucide-react';
import { Shop } from '@/types/shop';
import { useBrand } from './BrandProvider';
import { useMobile } from '@/hooks/useMobile';
import { formatKoreanMoney } from '@/utils/formatMoney';
import { getPayColor } from '@/utils/payColors';
import JobDetailModal from './jobs/JobDetailModal';
import { getFavorites, toggleFavorite as toggleFav, saveShopSnapshot } from '@/utils/favorites';
import { supabase } from '@/lib/supabase';
import { enrichAdData } from '@/lib/adUtils';

// [Optimization] Memoized Sub-component to prevent unnecessary re-renders
const SideAdCard = React.memo(({ ad, onSelect }: { ad: Shop, onSelect: (shop: Shop) => void }) => {
    // AD_TIER_STANDARDS 동기화 — 등급별 고정 그라디언트 (2026-03-22)
    const getTierGradient = (tier: string): string => {
        switch (tier) {
            case 'grand':       return 'from-amber-500 to-amber-600';      // 🟡 Grand
            case 'premium':     return 'from-red-600 to-red-700';           // 🔴 Premium
            case 'deluxe':      return 'from-blue-600 to-blue-700';         // 🔵 Deluxe
            case 'special':     return 'from-emerald-600 to-emerald-700';   // 🟢 Special
            case 'urgent':      return 'from-purple-600 to-purple-700';      // 🟣 Urgent/Recommended
            case 'recommended': return 'from-purple-600 to-purple-700';     // 🟣 Urgent/Recommended
            case 'native':      return 'from-slate-600 to-slate-700';       // ⬛ Native
            default:            return 'from-stone-700 to-stone-800';       // 🪨 Basic
        }
    };

    // [Banner v1] 어드민 승인된 배너 이미지가 있으면 카드 전체를 이미지로 꽉 채움
    const bannerImageUrl: string | null = (ad as any).banner_image_url || null;
    const bannerStatus: string | null = (ad as any).banner_status || null;
    const hasBannerImage = !!bannerImageUrl && bannerStatus === 'approved';
    const isVideo = (ad as any).banner_media_type === 'video';

    const hasImage = !!ad.options?.mediaUrl;
    const badgeChar = ad.payType?.substring(0, 1) || (String(ad.pay) === '면접후결정' ? '면' : '시');
    const paySuffixes: string[] = ad.options?.paySuffixes || (ad.options as any)?.pay_suffixes || (ad as any).paySuffixes || [];

    // [Banner v1] 배너 이미지 전체 채움 카드 — 클릭 시 광고상세 팝업 유지
    if (hasBannerImage) {
        return (
            <div
                onClick={() => onSelect(ad)}
                className="group relative w-full h-[140px] bg-black rounded-xl overflow-hidden cursor-pointer shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all"
            >
                {isVideo ? (
                    <video
                        src={bannerImageUrl!}
                        className="w-full h-full object-cover"
                        muted
                        autoPlay
                        loop
                        playsInline
                    />
                ) : (
                    <img
                        src={bannerImageUrl!}
                        alt={ad.name}
                        className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
                    />
                )}
                {/* 하단 업체명 오버레이 */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-2 py-1.5">
                    <p className="text-white text-[9px] font-black truncate drop-shadow-md">
                        {ad.nickname || ad.name}
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div
            onClick={() => onSelect(ad)}
            className="group relative w-full h-[140px] bg-white rounded-xl overflow-hidden cursor-pointer shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all border border-gray-100 flex flex-col"
        >
            {/* ── 이미지 섹션 (고정 80px) ── */}
            <div className={`relative w-full h-[80px] shrink-0 overflow-hidden ${!hasImage ? `bg-gradient-to-br ${getTierGradient(ad.tier || '')}` : ''}`}>
                {hasImage ? (
                    // 이미지 있을 경우: 이미지만 표시
                    <img
                        src={ad.options!.mediaUrl}
                        alt={ad.name}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    // 이미지 없을 경우: 제목 텍스트만 중앙 표시
                    <div className="absolute inset-0 flex items-center justify-center px-2">
                        <h4 className="text-white font-black text-[11px] leading-tight drop-shadow-md break-keep text-center line-clamp-3 w-full">
                            {ad.title || ad.name}
                        </h4>
                    </div>
                )}
            </div>

            {/* ── 하단 정보 섹션 (고정 60px) ── */}
            <div className="px-2 pt-1.5 pb-1 flex flex-col justify-between flex-1 bg-white overflow-hidden">

                {/* Row 1: 닉네임(좌) | 지역(우) */}
                <div className="flex justify-between items-baseline gap-1 min-w-0">
                    <span className="text-[9px] font-bold text-gray-700 truncate flex-1 leading-none">
                        {ad.nickname || ad.name}
                    </span>
                    <span className="text-[9px] font-semibold text-gray-400 truncate shrink-0 text-right leading-none">
                        {ad.region}
                    </span>
                </div>

                {/* Row 2: 급여종류배지+급여(좌) | 업종(우) */}
                <div className="flex justify-between items-center gap-1 min-w-0">
                    <div className="flex items-center gap-0.5 min-w-0">
                        <span className={`shrink-0 w-[13px] h-[13px] flex items-center justify-center rounded-[3px] text-[8px] font-black text-white leading-none ${getPayColor(ad.payType || '')}`}>
                            {badgeChar}
                        </span>
                        <span className="text-[10px] font-black text-gray-900 tracking-tighter truncate">
                            {formatKoreanMoney(ad.pay)}
                        </span>
                    </div>
                    <span className="text-[9px] font-bold text-gray-400 truncate shrink-0 text-right max-w-[48%] leading-none">
                        {ad.workType}
                    </span>
                </div>

                {/* Row 3: 추가급여옵션 (paySuffixes) */}
                <div className="flex gap-0.5 overflow-hidden h-[14px] items-center">
                    {paySuffixes.slice(0, 3).map((s: string, i: number) => (
                        <span key={i} className="text-[8px] text-gray-400 font-medium bg-gray-50 px-1 rounded border border-gray-100 whitespace-nowrap leading-[13px]">
                            {s}
                        </span>
                    ))}
                </div>
            </div>
        </div>
    );
});
SideAdCard.displayName = 'SideAdCard';

interface BannerSidebarProps {
    side: 'left' | 'right';
    shops: Shop[];
}

import { useBannerControl } from '@/hooks/useBannerControl';

// [Optimization] Main Component Memoization
export const BannerSidebar = React.memo(({ side, shops }: BannerSidebarProps) => {
    const router = useRouter();
    const brand = useBrand();
    const isMobile = useMobile();
    const isVisible = useBannerControl(); // Global + Manual Control
    const [selectedAd, setSelectedAd] = useState<Shop | null>(null);
    const [favorites, setFavorites] = useState<string[]>(() => getFavorites());

    // [Banner v1] DB에서 실시간 배너 데이터 직접 조회 — layout.tsx 정적 JSON 한계 극복
    // shops prop(정적 JSON 기반)은 일반 광고카드 fallback으로 사용, DB fetch가 우선
    // [Optimization] 모바일에서는 사이드바 미사용 → DB 조회 완전 차단 (불필요 리소스 제거)
    const [dbShops, setDbShops] = useState<any[]>([]);
    useEffect(() => {
        if (isMobile) return; // 모바일 fetch 차단
        supabase
            .from('shops')
            .select('*')
            .eq('is_closed', false)
            .in('tier', ['grand', 'p1', 'premium', 'p2'])
            .order('updated_at', { ascending: false })
            .then(({ data }) => {
                if (data && data.length > 0) {
                    // enrichAdData로 정규화 — JobDetailModal 팝업에서 필드 동기화 보장
                    setDbShops(data.map(shop => enrichAdData(shop, [])));
                }
            });
    }, [isMobile]);

    const toggleFavorite = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (selectedAd?.id === id) saveShopSnapshot(id, selectedAd);
        setFavorites(prev => toggleFav(id, prev));
    };

    const isLeft = side === 'left';
    const sideChar = isLeft ? 'L' : 'R';

    // [Optimization] DB fetch 우선, 없으면 props fallback
    const allShops = useMemo(() => dbShops.length > 0 ? dbShops : (shops || []), [dbShops, shops]);

    // [Fix] grand+premium 합산 최대 4개 — 각각 4개씩 렌더하던 버그 수정
    // 우선순위: grand(p1) > premium(p2). banner_position 명시 없으면(NULL) 양쪽 모두 표시.
    // [Fix2] 목업 광고(user_id: 6fc68887...) 필터링 — 실제 광고 우선
    const isMockAd = (s: any) =>
        s.isMock === true ||
        String(s.user_id || '').startsWith('6fc68887') ||
        String(s.id || '').startsWith('AD_MOCK_');

    const SIDEBAR_SLOT_COUNT = 4;

    const sidebarAds = useMemo(() => {
        if (isMobile) return [];
        const TIER_PRIORITY: Record<string, number> = { grand: 1, p1: 1, premium: 2, p2: 2 };
        const isEligible = (s: Shop) =>
            s.tier === 'grand' || s.tier === 'p1' ||
            s.tier === 'premium' || s.tier === 'p2' ||
            (s as any).is_premium;
        const sideKey = isLeft ? 'left' : 'right';

        // 실제 광고만 — 목업 제거, 빈 슬롯은 "입점문의"로 표시
        const realAds = allShops
            .filter(s => !isMockAd(s))
            .filter(isEligible)
            .filter(s => {
                const pos = (s as any).banner_position;
                return pos == null || pos === 'both' || pos === sideKey;
            })
            .sort((a, b) => (TIER_PRIORITY[a.tier || ''] ?? 99) - (TIER_PRIORITY[b.tier || ''] ?? 99));

        return realAds.slice(0, SIDEBAR_SLOT_COUNT);
    }, [allShops, isLeft, isMobile]);

    // [Optimization] Valid Return for Mobile after hooks are called
    if (isMobile) return null;

    if (!isVisible && !selectedAd) return null;

    // [Optimization] Removed backdrop-blur-md, replaced with solid bg/opacity to reduce paint cost
    const contactBoxClass = brand.theme === 'dark'
        ? 'bg-gray-800/95 border-gray-800'
        : 'bg-white/95 border-gray-100';

    return (
        <>
            <div className={`flex flex-col gap-2 w-full pt-0`}>
                <div className="flex flex-col gap-2 pb-4">
                    <div className="flex flex-col gap-1.5">
                        <div
                            onClick={() => router.push('/customer-center?tab=ad')}
                            className="group bg-gradient-to-br from-amber-400 via-yellow-100 to-amber-600 p-0.5 rounded-[16px] shadow-sm cursor-pointer hover:scale-[1.02] transition-all will-change-transform"
                        >
                            <div className={`rounded-[14px] py-1 text-center ${brand.theme === 'dark' ? 'bg-gray-900' : 'bg-white'}`}>
                                <Crown size={12} className="mx-auto mb-0.5 text-amber-500 animate-pulse" fill="currentColor" />
                                <p className="text-[9px] font-black text-amber-600 uppercase tracking-tighter">
                                    GRAND {sideChar}
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-col gap-1 px-1">
                            {Array.from({ length: SIDEBAR_SLOT_COUNT }, (_, i) => {
                                const ad = sidebarAds[i];
                                return ad ? (
                                    <SideAdCard key={ad.id} ad={ad} onSelect={setSelectedAd} />
                                ) : (
                                    <div
                                        key={`empty-${i}`}
                                        onClick={() => router.push('/customer-center?tab=inquiry')}
                                        className="w-full h-[140px] rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-1 cursor-pointer hover:border-amber-300 hover:bg-amber-50/60 transition-all"
                                    >
                                        <span className="text-[10px] font-black text-gray-300">광고 슬롯</span>
                                        <span className="text-[12px] font-black text-amber-500">입점문의</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div
                        onClick={() => router.push('/customer-center?tab=inquiry')}
                        className={`p-2 border rounded-[18px] shadow-md text-center mx-1 border-b-2 border-b-pink-500/20 active:scale-95 transition-transform cursor-pointer ${contactBoxClass}`}
                    >
                        <p className="text-[10px] text-blue-600 font-extrabold mb-0.5">광고입점상담</p>
                        <p className={`text-[13px] font-black tracking-tighter ${brand.theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>{"<1:1문의>"}</p>
                    </div>
                </div>
            </div>

            {selectedAd && (
                <JobDetailModal
                    shop={selectedAd}
                    onClose={() => setSelectedAd(null)}
                    isFavorite={favorites.includes(selectedAd.id)}
                    onToggleFavorite={(e) => toggleFavorite(e, selectedAd.id)}
                />
            )}
        </>
    );
});
BannerSidebar.displayName = 'BannerSidebar';
