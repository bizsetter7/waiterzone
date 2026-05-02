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
import { useBannerControl } from '@/hooks/useBannerControl';

// [Optimization] Memoized Sub-component to prevent unnecessary re-renders
const SideAdCard = React.memo(({ ad, onSelect }: { ad: Shop, onSelect: (shop: Shop) => void }) => {
    const getTierGradient = (tier: string): string => {
        switch (tier) {
            case 'p2': case 'premium':     return 'from-red-600 to-red-700';
            case 'p3': case 'deluxe':      return 'from-blue-600 to-blue-700';
            case 'p4': case 'special':
            case 'standard':               return 'from-emerald-600 to-emerald-700';
            default:                       return 'from-stone-700 to-stone-800';
        }
    };

    const bannerImageUrl: string | null = (ad as any).banner_image_url || null;
    const bannerStatus: string | null = (ad as any).banner_status || null;
    const hasBannerImage = !!bannerImageUrl && (bannerStatus === 'approved' || bannerStatus === 'approved_banner');
    const isVideo = (ad as any).banner_media_type === 'video';

    const hasImage = !!ad.options?.mediaUrl;
    const badgeChar = ad.payType?.substring(0, 1) || (String(ad.pay) === '면접후결정' ? '면' : '시');
    const paySuffixes: string[] = ad.options?.paySuffixes || (ad.options as any)?.pay_suffixes || (ad as any).paySuffixes || [];

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
                        muted autoPlay loop playsInline
                    />
                ) : (
                    <img
                        src={bannerImageUrl!}
                        alt={ad.name}
                        className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
                    />
                )}
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
            <div className={`relative w-full h-[80px] shrink-0 overflow-hidden ${!hasImage ? `bg-gradient-to-br ${getTierGradient(ad.tier || '')}` : ''}`}>
                {hasImage ? (
                    <img src={ad.options!.mediaUrl} alt={ad.name} className="w-full h-full object-cover" />
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center px-2">
                        <h4 className="text-white font-black text-[11px] leading-tight drop-shadow-md break-keep text-center line-clamp-3 w-full">
                            {ad.title || ad.name}
                        </h4>
                    </div>
                )}
            </div>

            <div className="px-2 pt-1.5 pb-1 flex flex-col justify-between flex-1 bg-white overflow-hidden">
                <div className="flex justify-between items-baseline gap-1 min-w-0">
                    <span className="text-[9px] font-bold text-gray-700 truncate flex-1 leading-none">
                        {ad.nickname || ad.name}
                    </span>
                    <span className="text-[9px] font-semibold text-gray-400 truncate shrink-0 text-right leading-none">
                        {ad.region}
                    </span>
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
                    <span className="text-[9px] font-bold text-gray-400 truncate shrink-0 text-right max-w-[48%] leading-none">
                        {ad.workType}
                    </span>
                </div>

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
    shops?: Shop[];  // optional — DB 직접 조회가 우선, prop은 fallback
}

export const BannerSidebar = React.memo(({ side, shops = [] }: BannerSidebarProps) => {
    const router = useRouter();
    const brand = useBrand();
    const isMobile = useMobile();
    const isVisible = useBannerControl();
    const [selectedAd, setSelectedAd] = useState<Shop | null>(null);
    const [favorites, setFavorites] = useState<string[]>(() => getFavorites());

    const [dbShops, setDbShops] = useState<any[]>([]);
    useEffect(() => {
        supabase
            .from('shops')
            .select('*')
            .eq('status', 'active')
            .in('tier', ['p2', 'premium', 'p3', 'deluxe', 'p4', 'special', 'standard'])
            .order('updated_at', { ascending: false })
            .then(({ data }) => {
                if (data && data.length > 0) {
                    setDbShops(data.map(shop => enrichAdData(shop, [])));
                }
            });
    }, []);

    const toggleFavorite = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (selectedAd?.id === id) saveShopSnapshot(id, selectedAd);
        setFavorites(prev => toggleFav(id, prev));
    };

    const isLeft = side === 'left';
    const sideChar = isLeft ? 'L' : 'R';

    const allShops = useMemo(() => dbShops.length > 0 ? dbShops : shops, [dbShops, shops]);

    const isMockAd = (s: any) =>
        s.isMock === true ||
        String(s.user_id || '').startsWith('6fc68887') ||
        String(s.id || '').startsWith('AD_MOCK_');

    const sidebarAds = useMemo(() => {
        if (isMobile) return [];
        const TIER_PRIORITY: Record<string, number> = { p2: 2, premium: 2, p3: 3, deluxe: 3, p4: 4, special: 4, standard: 4 };
        const isEligible = (s: Shop) => ['p2', 'premium', 'p3', 'deluxe', 'p4', 'special', 'standard'].includes(s.tier || '');
        const sideKey = isLeft ? 'left' : 'right';

        const realAds = allShops
            .filter(s => !isMockAd(s))
            .filter(isEligible)
            .filter(s => {
                const pos = (s as any).banner_position;
                return pos == null || pos === 'both' || pos === sideKey;
            })
            .sort((a, b) => (TIER_PRIORITY[a.tier || ''] ?? 99) - (TIER_PRIORITY[b.tier || ''] ?? 99));

        if (realAds.length >= 4) return realAds.slice(0, 4);

        const mockAds = allShops
            .filter(isMockAd)
            .filter(isEligible)
            .filter(s => {
                const pos = (s as any).banner_position;
                return pos == null || pos === 'both' || pos === sideKey;
            })
            .sort((a, b) => (TIER_PRIORITY[a.tier || ''] ?? 99) - (TIER_PRIORITY[b.tier || ''] ?? 99));

        return [...realAds, ...mockAds].slice(0, 4);
    }, [allShops, isLeft, isMobile]);

    if (isMobile) return null;
    if (!isVisible && !selectedAd) return null;

    const contactBoxClass = brand.theme === 'dark'
        ? 'bg-gray-800/95 border-gray-800'
        : 'bg-white/95 border-gray-100';

    return (
        <>
            <div className="flex flex-col gap-2 w-full pt-0">
                <div className="flex flex-col gap-2 pb-4">
                    <div className="flex flex-col gap-1.5">
                        <div
                            onClick={() => router.push('/customer-center?tab=ad')}
                            className="group bg-gradient-to-br from-amber-400 via-yellow-100 to-amber-600 p-0.5 rounded-[16px] shadow-sm cursor-pointer hover:scale-[1.02] transition-all will-change-transform"
                        >
                            <div className={`rounded-[14px] py-1 text-center ${brand.theme === 'dark' ? 'bg-gray-900' : 'bg-white'}`}>
                                <Crown size={12} className="mx-auto mb-0.5 text-amber-500 animate-pulse" fill="currentColor" />
                                <p className="text-[9px] font-black text-amber-600 uppercase tracking-tighter">
                                    PREMIUM {sideChar}
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-col gap-1 px-1">
                            {/* 실제 광고 카드 */}
                            {sidebarAds.map((ad) => (
                                <SideAdCard key={ad.id} ad={ad} onSelect={setSelectedAd} />
                            ))}
                            {/* 항상 4개 고정 — 나머지 빈 슬롯으로 채움 */}
                            {Array.from({ length: Math.max(0, 4 - sidebarAds.length) }).map((_, i) => (
                                <div
                                    key={`empty-${i}`}
                                    onClick={() => router.push('/customer-center?tab=ad')}
                                    className="w-full h-[140px] rounded-xl border border-dashed border-gray-200 bg-gray-50 flex flex-col items-center justify-center gap-1 cursor-pointer hover:border-amber-300 hover:bg-amber-50 transition-all"
                                >
                                    <Crown size={14} className="text-gray-300" />
                                    <span className="text-[9px] font-bold text-gray-300 uppercase tracking-widest">AD SLOT</span>
                                </div>
                            ))}
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
