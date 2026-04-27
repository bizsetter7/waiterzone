'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';

// Components
import LeftSidebar from '@/components/LeftSidebar';

import JobDetailModal from '@/components/jobs/JobDetailModal';
import { PaymentPopup } from '@/components/home/PaymentPopup';
import { WorkTypeGuideLinks } from '@/components/guide/WorkTypeGuideLinks';

// Types & Data
import { Shop } from '@/types/shop';
import { useBrand } from '@/components/BrandProvider';
import { useAuth } from '@/hooks/useAuth';
import { REGION_BRACKET_MAP } from '@/constants/regions';
import { JOB_CATEGORY_MAP } from '@/constants/jobs';
import { ListingPageLayout } from '@/components/ListingPageLayout';
import { UnifiedJobListing } from '@/components/listing/UnifiedJobListing';
import { UnifiedAdGrid } from '@/components/common/UnifiedAdGrid';
import { getFavorites, toggleFavorite as toggleFav, saveShopSnapshot } from '@/utils/favorites';
import { useAdultGate } from '@/hooks/useAdultGate';

interface RegionClientProps {
    shops: Shop[];
    initialRegion?: string;
    regionSlug?: string;
}

export default function RegionClient({ shops, initialRegion = '전체', regionSlug }: RegionClientProps) {
    const brand = useBrand();
    const router = useRouter();
    const { isLoggedIn, userType, userName, userCredit } = useAuth();
    const { requireVerification } = useAdultGate();

    // -- State --
    const [selectedRegion, setSelectedRegion] = useState(initialRegion);
    const [selectedSubRegion, setSelectedSubRegion] = useState('전체');
    const [selectedJobType, setSelectedJobType] = useState('전체');
    const [selectedSubJobType, setSelectedSubJobType] = useState('전체');
    const [searchQuery, setSearchQuery] = useState('');
    const [activeSearchQuery, setActiveSearchQuery] = useState('');

    const [visibleCount, setVisibleCount] = useState(20);
    const [selectedShop, setSelectedShop] = useState<Shop | null>(null);

    // Track viewed shops (타임스탬프 포함 저장 → 24시간 후 자동 만료)
    const handleSetSelectedShop = React.useCallback((shop: Shop | null) => {
        if (!shop) {
            setSelectedShop(null);
            return;
        }
        requireVerification(() => {
            setSelectedShop(shop);
            const saved = localStorage.getItem('viewed_shops');
            const now = Date.now();
            const MS_24H = 86400000;
            let entries: { shop: Shop; timestamp: number }[] = [];
            if (saved) {
                try {
                    const parsed = JSON.parse(saved);
                    // 구형 포맷(Shop[]) 호환 처리
                    if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].id) {
                        entries = (parsed as Shop[]).map(s => ({ shop: s, timestamp: now }));
                    } else {
                        entries = parsed;
                    }
                } catch { entries = []; }
            }
            // 24시간 이내 + 중복 제거 + 최신 상단
            entries = [
                { shop, timestamp: now },
                ...entries.filter(e => e.shop?.id !== shop.id && (now - e.timestamp) < MS_24H),
            ].slice(0, 50);
            localStorage.setItem('viewed_shops', JSON.stringify(entries));
        });
    }, [requireVerification]);

    const [favorites, setFavorites] = useState<string[]>(() => getFavorites());
    const [showPaymentPopup, setShowPaymentPopup] = useState(false);
    const [selectedTier, setSelectedTier] = useState('grand');

    const toggleFavorite = React.useCallback((e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        // [BUG-05 FIX] 비로그인 상태에서 즐겨찾기 클릭 시 로그인 페이지로 이동
        if (!isLoggedIn) {
            router.push('/?page=login');
            return;
        }
        const shop = shops?.find(s => s.id === id);
        if (shop) saveShopSnapshot(id, shop);
        setFavorites(prev => toggleFav(id, prev));
    }, [shops, isLoggedIn, router]);

    // [GeoTargeting] viewed_shops 기반 홈 지역 감지 (전체 뷰에서 해당 지역 광고 우선 노출)
    const homeRegion = useMemo(() => {
        try {
            const saved = localStorage.getItem('viewed_shops');
            if (!saved) return null;
            const entries: { shop: Shop; timestamp: number }[] = JSON.parse(saved);
            const regionCount: Record<string, number> = {};
            entries.forEach(e => {
                const r = e.shop?.region;
                if (r) regionCount[r] = (regionCount[r] || 0) + 1;
            });
            const top = Object.entries(regionCount).sort((a, b) => b[1] - a[1])[0];
            return top?.[0] || null;
        } catch { return null; }
    }, []);

    // Data Filtering
    const filteredShops = useMemo(() => {
        if (!shops) return [];
        const filtered = shops.filter(shop => {
            // Region Filter (전체명 → shops.json 약칭 변환 후 substring 검색)
            if (selectedRegion !== '전체') {
                const bracketKey = REGION_BRACKET_MAP[selectedRegion] || selectedRegion;
                if (!(shop.region?.includes(bracketKey))) return false;
            }
            if (selectedSubRegion !== '전체' && !(shop.region?.includes(selectedSubRegion))) return false;
            // Job Type Filter (부모 카테고리 또는 서브카테고리 매칭)
            // workType 형식: "부모명" 또는 "부모명-서브명" (대소문자 혼재 가능)
            if (selectedJobType !== '전체') {
                const subTypes = JOB_CATEGORY_MAP[selectedJobType] || [];
                const wt = (shop.workType || '').toLowerCase();
                const sjt = selectedJobType.toLowerCase();
                // 정확한 부모 매칭: workType === parent 또는 "parent-xxx" 형태
                const matchesParent = wt === sjt || wt.startsWith(sjt + '-');
                // 서브카테고리 매칭 (대소문자 무시)
                const matchesChild = subTypes.some(sub => sub && wt.includes(sub.toLowerCase()));
                if (!matchesParent && !matchesChild) return false;
            }
            if (selectedSubJobType !== '전체' && !(shop.workType?.toLowerCase().includes(selectedSubJobType.toLowerCase()))) return false;
            if (activeSearchQuery) {
                const query = activeSearchQuery.toLowerCase();
                const matchName = shop.name.toLowerCase().includes(query) || (shop.realName && shop.realName.toLowerCase().includes(query));
                const matchRegion = shop.region.toLowerCase().includes(query);
                const matchType = shop.workType.toLowerCase().includes(query);
                const matchTitle = shop.title && shop.title.toLowerCase().includes(query);
                if (!matchName && !matchRegion && !matchType && !matchTitle) return false;
            }
            return true;
        });

        // [Fix] isMock 판별 — Supabase 레코드는 isMock 컬럼 없으므로 user_id로 구분
        const isMockAd = (s: any) =>
            s.isMock === true ||
            String(s.user_id || '').startsWith('6fc68887') ||
            String(s.id || '').startsWith('AD_MOCK_');

        // [Fix] p1~p7 실제 tier 기준 (구버전 grand/premium 호환 포함)
        const getTierRank = (tier: string): number => {
            const t = (tier || '').toLowerCase();
            const O: Record<string, number> = { p1:1,grand:1,vip:1, p2:2,premium:2, p3:3,deluxe:3, p4:4,special:4, p5:5,urgent:5,recommended:5, p6:6,native:6, p7:7,basic:7,common:7 };
            return O[t] ?? 99;
        };

        const realsOnly = filtered.filter(s => !isMockAd(s));
        const mocksOnly = filtered.filter(s => isMockAd(s));
        const realCount = realsOnly.length;

        // 실제 광고 수만큼 목업 뒤에서 제거
        const visibleMocks = realCount > 0
            ? mocksOnly.slice(0, Math.max(0, mocksOnly.length - realCount))
            : mocksOnly;

        const sortByTierDate = (arr: any[]) => arr.sort((a: any, b: any) => {
            const rA = getTierRank(a.tier), rB = getTierRank(b.tier);
            if (rA !== rB) return rA - rB;
            return new Date(b.created_at || b.date || 0).getTime() - new Date(a.created_at || a.date || 0).getTime();
        });

        // 실제광고는 tier 무관하게 목업보다 항상 앞에
        return [...sortByTierDate(realsOnly), ...sortByTierDate(visibleMocks)];
    }, [shops, selectedRegion, selectedSubRegion, selectedJobType, selectedSubJobType, activeSearchQuery, homeRegion]);

    // [BUG-04 FIX] LeftSidebar에서 직종 변경 시 subJobType도 함께 리셋
    // LeftSidebar에는 setSelectedSubJobType prop이 없어 잔류값이 필터를 오염시키는 버그 수정
    const handleSetSelectedJobType = React.useCallback((v: string) => {
        setSelectedJobType(v);
        setSelectedSubJobType('전체');
    }, []);

    const openPaymentPopup = React.useCallback((tier: string) => {
        requireVerification(() => {
            setSelectedTier(tier);
            setShowPaymentPopup(true);
        });
    }, [requireVerification]);

    return (
        <div className={`min-h-screen ${brand.theme === 'dark' ? 'bg-gray-950 text-white' : 'bg-gray-50 text-gray-900'} pb-24 lg:pb-0`}>


            <div className="pt-0">
                <ListingPageLayout sidebar={
                    <LeftSidebar
                        selectedRegion={selectedRegion}
                        setSelectedRegion={setSelectedRegion}
                        setSelectedSubRegion={setSelectedSubRegion}
                        selectedJobType={selectedJobType}
                        setSelectedJobType={handleSetSelectedJobType}
                        onPaymentClick={openPaymentPopup}
                        isLoggedIn={isLoggedIn}
                        userType={userType as any}
                        userName={userName}
                        userCredit={userCredit}
                    />
                }>
                    {/* 지역 가이드 — 필터 선택 시 동적 업데이트, 미선택 시 URL regionSlug 기본값 */}
                    {(() => {
                        const dynamicSlug = selectedRegion !== '전체' ? selectedRegion : regionSlug;
                        return dynamicSlug ? <WorkTypeGuideLinks regionSlug={dynamicSlug} /> : null;
                    })()}

                    {/* Unified Listing Content with Ad Grid Injected */}
                    <UnifiedJobListing
                        title="지역별 채용"
                        shops={filteredShops}
                        favorites={favorites}
                        toggleFavorite={toggleFavorite}
                        setSelectedShop={handleSetSelectedShop}
                        visibleCount={visibleCount}
                        setVisibleCount={setVisibleCount}
                        onAdRegister={() => openPaymentPopup('basic')}
                        onNativeAdRegister={() => openPaymentPopup('native')}

                        // Pass Ad Grid here
                        adGrid={
                            <UnifiedAdGrid
                                shops={shops}
                                onAdRegister={openPaymentPopup}
                                onSelectShop={handleSetSelectedShop as any}
                                hasSidebar={true}
                            />
                        }

                        selectedRegion={selectedRegion}
                        setSelectedRegion={setSelectedRegion}
                        selectedSubRegion={selectedSubRegion}
                        setSelectedSubRegion={setSelectedSubRegion}
                        selectedJobType={selectedJobType}
                        setSelectedJobType={setSelectedJobType}
                        selectedSubJobType={selectedSubJobType}
                        setSelectedSubJobType={setSelectedSubJobType}

                        searchQuery={searchQuery}
                        setSearchQuery={setSearchQuery}
                        activeSearchQuery={activeSearchQuery}
                        setActiveSearchQuery={setActiveSearchQuery}
                        filterOrder={['region', 'subRegion', 'job', 'subJob']} // Custom order for Region page
                    />
                </ListingPageLayout>
            </div>

            {/* Modals */}
            {selectedShop && (
                <JobDetailModal
                    shop={selectedShop}
                    onClose={() => setSelectedShop(null)}
                    isFavorite={favorites.includes(selectedShop.id)}
                    onToggleFavorite={(e) => toggleFavorite(e, selectedShop.id)}
                />
            )}

            {showPaymentPopup && (
                <PaymentPopup
                    isOpen={showPaymentPopup}
                    onClose={() => setShowPaymentPopup(false)}
                    initialTier={selectedTier}
                />
            )}
        </div>
    );
}
