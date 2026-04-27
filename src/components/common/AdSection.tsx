'use client';

import React from 'react';
import { ChevronRight } from 'lucide-react';
import { Shop } from '@/types/shop';
import { ShopCard } from '@/components/shop/ShopCard';
import { useBrand } from '@/components/BrandProvider';
import { AdBannerCard } from '@/components/shop/AdBannerCard';
import { AD_TIER_STANDARDS } from '@/constants/standards';

// ...
interface AdSectionProps {
    title: string;
    icon: React.ReactNode;
    shops: Shop[];
    tierId: string;
    onAdRegister: (tier: string) => void;
    rowCountPC: number;
    onSelectShop?: (shop: Shop) => void;
    hasSidebar?: boolean;
}

export const AdSection = React.memo(({ title, icon, shops, tierId, onAdRegister, rowCountPC, onSelectShop, hasSidebar }: AdSectionProps) => {
    const brand = useBrand();
    const isDark = brand.theme === 'dark';

    // [Tier-based Grid Settings Map]
    const GRID_CONFIGS: Record<string, { normal: string, sidebar: string, totalPC: number, totalMob: number, label: string }> = {
        grand: {
            normal: "grid-cols-2 md:grid-cols-4",
            sidebar: "grid-cols-2 md:grid-cols-3",
            totalPC: 12, totalMob: 6, label: 'GRAND'
        },
        premium: {
            normal: "grid-cols-2 md:grid-cols-5",
            sidebar: "grid-cols-2 md:grid-cols-4",
            totalPC: 15, totalMob: 6, label: 'PREMIUM'
        },
        deluxe: {
            normal: "grid-cols-2 md:grid-cols-6",
            sidebar: "grid-cols-2 md:grid-cols-5",
            totalPC: 18, totalMob: 8, label: 'DELUXE'
        },
        special: {
            normal: "grid-cols-2 md:grid-cols-6",
            sidebar: "grid-cols-2 md:grid-cols-5",
            totalPC: 18, totalMob: 8, label: 'SPECIAL'
        },
        urgent: {
            normal: "grid-cols-2 md:grid-cols-6",
            sidebar: "grid-cols-2 md:grid-cols-5",
            totalPC: 18, totalMob: 6, label: 'URGENT'
        },
        recommended: {
            normal: "grid-cols-2 md:grid-cols-6",
            sidebar: "grid-cols-2 md:grid-cols-5",
            totalPC: 18, totalMob: 6, label: 'RECOMMENDED'
        }
    };

    const config = GRID_CONFIGS[tierId] || GRID_CONFIGS.grand;
    // Select grid class based on sidebar presence
    const currentGridClass = hasSidebar ? config.sidebar : config.normal;
    const gridClass = `grid gap-2 md:gap-3 ${currentGridClass}`;
    const { totalPC, totalMob, label: tierLabel } = config;

    const isHighTier = tierId === 'grand' || tierId === 'premium';

    return (
        <section className="mb-12 relative px-4 xl:px-0">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    {icon}
                    <h2 className={`text-xl md:text-2xl font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>{title}</h2>
                </div>
                <button
                    onClick={() => onAdRegister(tierId)}
                    className="px-3 py-1.5 md:px-4 md:py-2 text-xs md:text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all flex items-center gap-1"
                >
                    <span>광고신청</span>
                    <ChevronRight size={14} />
                </button>
            </div>

            {/* Grid */}
            <div className={`${gridClass} items-stretch`}>
                {shops.slice(0, totalPC).map((shop, idx) => {
                    // [Fix] Grand/Premium이라도 이미지가 없으면 텍스트 중심 ShopCard 사용 (No.1005 등 해결)
                    // mediaUrl이나 기본 이미지가 유효한지 체크 (AdBannerCard 내부 로직과 유사하게 판단)
                    // 여기서는 간단히 options.mediaUrl이나 workType에 따른 기본 이미지가 있는지 봅니다.
                    // 하지만 대부분의 경우 workType에 따른 기본 이미지는 있으므로, 
                    // "데이터에 명시적인 외부 이미지가 없고 && 텍스트가 긴 경우" 등을 고려해야 하나,
                    // 사용자 요청(1001 vs 1005)에 따라 "이미지 데이터가 빈약하면 ShopCard"로 접근합니다.

                    // JSON 데이터 구조상 url만 있고 API/DB에서 가져온 이미지가 없는 경우를 체크
                    // shop.options?.mediaUrl 이 핵심입니다. 
                    // (주의: getShopDefaultImage는 항상 값을 반환할 수 있으므로, '실제 등록 이미지' 여부를 따져야 함)

                    // HighTier(Grand/Premium)는 무조건 AdBannerCard 사용
                    // (이미지 누락 시 컴포넌트 내부에서 Fallback UI 처리)
                    const useBanner = isHighTier;

                    return (
                        <div key={shop.id || idx} className={`${idx >= totalMob ? 'hidden md:block' : ''} h-full`}>
                            {useBanner ? (
                                <AdBannerCard
                                    shop={shop}
                                    tierId={tierId}
                                    onClick={() => onSelectShop && onSelectShop(shop)}
                                />
                            ) : (
                                <ShopCard
                                    shop={shop}
                                    tierId={tierId}
                                    tierLabel={tierLabel}
                                    onClick={() => onSelectShop && onSelectShop(shop)}
                                />
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Footer */}
            <div className="mt-6 flex justify-center">
                <button
                    className={`px-6 py-3 rounded-xl border-2 font-bold text-sm flex items-center gap-2 transition-all ${isDark ? 'border-gray-700 text-gray-300 hover:bg-gray-800' : 'border-gray-200 text-gray-500 hover:bg-gray-50 hover:border-gray-300'}`}
                >
                    {title} 공고 더보기 <ChevronRight size={16} />
                </button>
            </div>
        </section>
    );
});
AdSection.displayName = 'AdSection';
