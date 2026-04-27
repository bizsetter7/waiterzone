'use client';

import React, { useMemo, Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import HomeClient from '@/components/home/HomeClient';
import { useLocation } from '@/hooks/useLocation';
import { useRouter } from 'next/navigation';
import { enrichAdData } from '@/lib/adUtils';
import { supabase } from '@/lib/supabase';

const LoginPage = dynamic(() => import('@/components/auth/LoginPage').then(m => ({ default: m.LoginPage })));
const SignupPage = dynamic(() => import('@/components/auth/SignupPage').then(m => ({ default: m.SignupPage })));
const FindAccountPage = dynamic(() => import('@/components/auth/FindAccountPage').then(m => ({ default: m.FindAccountPage })));
const CustomerCenterContent = dynamic(() => import('@/app/customer-center/CustomerCenterClient').then(m => ({ default: m.CustomerCenterContent })));

export default function HomePortalClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const page = searchParams.get('page');
  const { lat: userLat, lng: userLng, calculateDistance } = useLocation();

  // null = 아직 로딩 중, [] = 로딩 완료(데이터 없음)
  const [dbShops, setDbShops] = useState<any[] | null>(null);

  useEffect(() => {
    const fetchShops = async () => {
      try {
        const { data, error } = await supabase
          .from('shops')
          .select('*')
          .eq('is_closed', false)
          .order('updated_at', { ascending: false });

        setDbShops(!error && data ? data : []);
      } catch (err) {
        console.error('Failed to fetch shops:', err);
        setDbShops([]);
      }
    };
    fetchShops();
  }, []);

  const processedShops = useMemo(() => {
    const dataSource = dbShops ?? [];
    const allEnriched = dataSource.map((ad: any) => enrichAdData(ad, []));

    const getTierRank = (tier: string): number => {
      const t = (tier || '').toLowerCase();
      const ORDER: Record<string, number> = {
        p1: 1, grand: 1, vip: 1,
        p2: 2, premium: 2,
        p3: 3, deluxe: 3,
        p4: 4, special: 4,
        p5: 5, urgent: 5, recommended: 5,
        p6: 6, native: 6,
        p7: 7, basic: 7, common: 7,
      };
      return ORDER[t] ?? 99;
    };

    const isMockAd = (ad: any): boolean =>
      ad.isMock === true ||
      String(ad.user_id || '').startsWith('6fc68887') ||
      String(ad.id || '').startsWith('AD_MOCK_');

    const reals = allEnriched.filter((s: any) => !isMockAd(s));
    const mocks = allEnriched.filter((s: any) => isMockAd(s));

    const visibleMocks = reals.length > 0
      ? mocks.slice(0, Math.max(0, mocks.length - reals.length))
      : mocks;

    const sortByTierDate = (arr: any[]) => arr.sort((a: any, b: any) => {
      const aRank = getTierRank(a.tier);
      const bRank = getTierRank(b.tier);
      if (aRank !== bRank) return aRank - bRank;
      return new Date(b.created_at || b.date || 0).getTime() - new Date(a.created_at || a.date || 0).getTime();
    });
    return [...sortByTierDate(reals), ...sortByTierDate(visibleMocks)];
  }, [userLat, userLng, dbShops]);

  if (page === 'login') return <LoginPage />;
  if (page === 'signup') return <SignupPage />;
  if (page === 'find-id' || page === 'find-pw') return <FindAccountPage initialTab={page as 'find-id' | 'find-pw'} />;
  if (page === 'support' || page === 'faq' || page === 'inquiry') return <CustomerCenterContent />;

  // DB 로딩 완료 후에만 렌더 (null이면 로딩 스피너)
  if (dbShops === null) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return <HomeClient shops={processedShops} />;
}
