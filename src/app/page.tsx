import React, { Suspense } from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import HomePortalClient from './HomePortalClient';
import { WORK_TYPE_SLUGS, WORK_TYPE_INFO } from '@/lib/data/work-type-guide';

// 홈 내부 링크에 노출할 대표 지역 (검색량 상위)
const HOME_GUIDE_REGIONS = [
  { slug: '서울', name: '서울' },
  { slug: '인천', name: '인천' },
  { slug: '수원', name: '수원' },
  { slug: '부산', name: '부산' },
  { slug: '대전', name: '대전' },
  { slug: '대구', name: '대구' },
  { slug: '광주', name: '광주' },
  { slug: '유성', name: '유성' },
];

export const metadata: Metadata = {
  title: '웨이터알바·룸웨이터·나이트웨이터·남성알바 1위 웨이터존',
  description: '웨이터존은 전국 웨이터알바, 룸웨이터, 야간알바, 노래방웨이터, 남성알바, 당일지급알바 구인구직 1위 플랫폼입니다. 20대·30대 남성 환영, 당일지급·숙식제공 보장 업체를 지금 바로 확인하세요.',
  keywords: [
    '웨이터존', '웨이터알바', '룸웨이터', '야간알바', '남성알바', '남성유흥알바',
    '노래방웨이터', '나이트웨이터', '당일지급알바', '단기알바', '주말알바', '평일알바',
    '20대남성알바', '30대남성알바', '호스트바웨이터', '대학생알바', '웨이터썰',
    '나이트', '클럽웨이터', '바웨이터', '가라오케웨이터', '고소득알바', '당일알바',
    '서울웨이터알바', '인천웨이터알바', '수원웨이터알바', '부산웨이터알바', '대전웨이터알바',
  ],
  alternates: {
    canonical: 'https://www.waiterzone.kr',
  },
  openGraph: {
    title: '웨이터알바·룸웨이터·나이트웨이터·남성알바 1위 웨이터존',
    description: '전국 웨이터알바·야간알바·남성알바·당일지급 구인정보 No.1 웨이터존. 20대·30대 남성 환영!',
    url: 'https://www.waiterzone.kr',
    siteName: '웨이터존',
  },
};

export default function HomePortal() {
  return (
    <>
      <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
        <HomePortalClient />
      </Suspense>

      {/* ── 지역×업종 가이드 내부 링크 (서버사이드 — 구글봇 크롤 경로 확보) ── */}
      <nav aria-label="지역별 업종 가이드" className="sr-only">
        <h2 className="text-sm font-bold text-gray-400 mb-4">📍 지역별 알바 가이드</h2>
        <div className="space-y-3">
          {HOME_GUIDE_REGIONS.map(({ slug, name }) => (
            <div key={slug}>
              <p className="text-xs font-semibold text-gray-500 mb-1.5">{name}</p>
              <div className="flex flex-wrap gap-1.5">
                {WORK_TYPE_SLUGS.map((workType) => (
                  <Link
                    key={workType}
                    href={`/coco/${encodeURIComponent(slug)}/${workType}`}
                    className="px-2.5 py-1 rounded-full bg-gray-50 border border-gray-200 text-[11px] text-gray-500 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                  >
                    {name} {WORK_TYPE_INFO[workType].name.replace(/\s*\(.*\)$/, '')}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </nav>
    </>
  );
}
