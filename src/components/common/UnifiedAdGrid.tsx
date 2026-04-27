'use client';

import React from 'react';
import { Trophy, Star } from 'lucide-react';
import { Shop } from '@/types/shop';
import { AdSection } from './AdSection';
import { AdSectionSkeleton } from './AdSectionSkeleton';

interface UnifiedAdGridProps {
    shops: Shop[] | null;
    isLoading?: boolean;
    onAdRegister: (tier: string) => void;
    onSelectShop: (shop: Shop) => void;
    hasSidebar?: boolean;
}

export const UnifiedAdGrid = ({ shops, isLoading, onAdRegister, onSelectShop, hasSidebar }: UnifiedAdGridProps) => {
    if (isLoading || !shops) {
        return (
            <div className="w-full">
                <AdSectionSkeleton title="프리미엄 채용" rowCountPC={2} />
            </div>
        );
    }

    const T1_T2 = new Set(['grand', 'p1', 'vip', 'premium', 'p2']);

    // T2: tier가 p2/premium인 광고
    const premiumShops = shops.filter(s => {
        const t = (s.tier ?? '').toLowerCase();
        return t === 'premium' || t === 'p2';
    });

    // T3: 프리미엄/그랜드 제외한 모든 광고 (standard·special·deluxe·basic 등)
    const t3Shops = shops.filter(s => {
        const t = (s.tier ?? '').toLowerCase();
        return !T1_T2.has(t);
    });

    if (premiumShops.length === 0 && t3Shops.length === 0) return null;

    return (
        <div className="w-full">
            {/* T2. 프리미엄 채용 — 야사장 프리미엄 구독 업체만 */}
            {premiumShops.length > 0 && (
                <AdSection
                    title="프리미엄 채용"
                    icon={<Trophy className="text-slate-500" fill="currentColor" />}
                    shops={premiumShops}
                    tierId="premium"
                    rowCountPC={3}
                    onAdRegister={onAdRegister}
                    onSelectShop={onSelectShop}
                    hasSidebar={hasSidebar}
                />
            )}
            {/* T3. 구인광고 — 프리미엄 외 전체 광고 */}
            {t3Shops.length > 0 && (
                <AdSection
                    title="업체정보"
                    icon={<Star className="text-amber-400" fill="currentColor" />}
                    shops={t3Shops}
                    tierId="standard"
                    rowCountPC={3}
                    onAdRegister={onAdRegister}
                    onSelectShop={onSelectShop}
                    hasSidebar={hasSidebar}
                />
            )}
        </div>
    );
};
