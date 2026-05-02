import React from 'react';
import { Metadata } from 'next';
import { createClient } from '@supabase/supabase-js';
import RegionClient from './RegionClient';
import { Shop } from '@/types/shop';
import { enrichAdData } from '@/lib/adUtils';

export const dynamic = 'force-dynamic';

const OG_IMAGE = 'https://www.waiterzone.kr/og-image.jpg';

export const metadata: Metadata = {
    title: '지역별 채용 - 1위 남성알바 웨이터존',
    description: '전국 지역별 남성알바, 룸웨이터, 남성유흥알바, 야간알바 정보. 서울·부산·인천·대구 등 전국 당일지급 고수익 알바.',
    keywords: ['지역별알바', '전국알바', '서울알바', '부산알바', '남성알바', '남성유흥알바', '룸웨이터', '야간알바', '당일지급'],
    alternates: {
        canonical: 'https://www.waiterzone.kr/region',
    },
    openGraph: {
        title: '지역별 채용 - 웨이터존',
        description: '전국 지역별 남성알바, 룸웨이터, 남성유흥알바 정보. 당일지급·숙식제공 보장.',
        url: 'https://www.waiterzone.kr/region',
        siteName: '웨이터존',
        images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: '웨이터존 지역별 채용' }],
        type: 'website',
        locale: 'ko_KR',
    },
    twitter: {
        card: 'summary_large_image',
        title: '지역별 채용 - 웨이터존',
        description: '전국 지역별 남성알바, 룸웨이터, 남성유흥알바 정보.',
        images: [OG_IMAGE],
    },
};

export default async function RegionPage() {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data } = await supabase
        .from('shops')
        .select('*')
        .eq('platform', 'waiterzone')  // ⭐ Phase A: SSOT (P-08) — 자기 플랫폼만
        .eq('is_closed', false)
        .order('created_at', { ascending: false })
        .limit(500);

    const { data: userData } = await supabase.from('profiles').select('*');

    const rawShops: Shop[] = (data || []).map((ad: any) => enrichAdData(ad, userData || []));

    // [Fix 2] 메인 페이지와 동일한 정렬 기준 (p1~p7 tier, 실제광고 우선)
    const getTierRank = (tier: string): number => {
        const t = (tier || '').toLowerCase();
        const O: Record<string, number> = { p2:2,premium:2, p3:3,deluxe:3, p4:4,special:4,standard:4, p7:7,basic:7 };
        return O[t] ?? 99;
    };
    const isMockAd = (ad: any) => ad.isMock === true || String(ad.user_id||'').startsWith('6fc68887') || String(ad.id||'').startsWith('AD_MOCK_');
    const reals = rawShops.filter(s => !isMockAd(s));
    const mocks = rawShops.filter(s => isMockAd(s));
    const visibleMocks = reals.length > 0 ? mocks.slice(0, Math.max(0, mocks.length - reals.length)) : mocks;
    const sortByTierDate = (arr: any[]) => arr.sort((a: any, b: any) => {
        const rA = getTierRank(a.tier), rB = getTierRank(b.tier);
        if (rA !== rB) return rA - rB;
        return new Date(b.created_at||0).getTime() - new Date(a.created_at||0).getTime();
    });
    // 실제광고는 tier 무관하게 목업보다 항상 앞에 표시
    const shops: Shop[] = [...sortByTierDate(reals), ...sortByTierDate(visibleMocks)];

    return <RegionClient shops={shops} />;
}
