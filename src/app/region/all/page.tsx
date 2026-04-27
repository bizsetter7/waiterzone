'use client';

import React from 'react';
import Link from 'next/link';
import seoRegionsMaster from '@/lib/data/seo_regions_master.json';

// 주요 광역시/도시 순서 정의
const PROVINCE_ORDER = [
    '서울', '경기', '부산', '인천', '대구', '대전', '광주', '울산', '세종',
    '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주'
];

export default function RegionAllPage() {
    // 지역 데이터 그룹화 (도/단위)
    const groupedRegions = PROVINCE_ORDER.reduce((acc, province) => {
        acc[province] = seoRegionsMaster.filter(reg => reg.mainRegion.startsWith(province));
        return acc;
    }, {} as Record<string, typeof seoRegionsMaster>);

    return (
        <div className="min-h-screen bg-white">
            {/* Header Area */}
            <div className="bg-gradient-to-b from-[#f82b60]/5 to-transparent py-12 border-b border-gray-100">
                <div className="max-w-5xl mx-auto px-6 text-center">
                    <h1 className="text-3xl font-black text-gray-900 mb-4 tracking-tight">
                        전국 지역별 <span className="text-[#f82b60]">고소득 남성알바</span> 통합정보
                    </h1>
                    <p className="text-gray-500 text-sm leading-relaxed max-w-2xl mx-auto">
                        서울 강남부터 제주까지, 웨이터존가 보증하는 프리미엄 업소 정보를 지역별로 한눈에 확인하세요.<br />
                        실시간 업데이트되는 전국의 채용 공고를 확인하세요.
                    </p>
                </div>
            </div>

            {/* Quick Navigation (Anchor Links) */}
            <div className="sticky top-[56px] z-50 bg-white/80 backdrop-blur-md border-b border-gray-200 shadow-sm overflow-x-auto whitespace-nowrap scrollbar-hide">
                <div className="max-w-5xl mx-auto px-6 py-3 flex gap-4 md:gap-6 justify-between md:justify-center">
                    {PROVINCE_ORDER.map(province => (
                        <a 
                            key={province} 
                            href={`#section-${province}`}
                            className="text-[13px] font-bold text-gray-600 hover:text-[#f82b60] transition-colors"
                        >
                            {province}
                        </a>
                    ))}
                </div>
            </div>

            {/* Content Area */}
            <div className="max-w-5xl mx-auto px-6 py-12">
                {PROVINCE_ORDER.map(province => {
                    const regions = groupedRegions[province];
                    if (!regions?.length) return null;

                    return (
                        <section key={province} id={`section-${province}`} className="mb-20 scroll-mt-28">
                            <div className="flex items-center gap-4 mb-8">
                                <h2 className="text-2xl font-black text-gray-900 border-b-4 border-[#f82b60]/20 pb-1">
                                    {province}
                                </h2>
                                <span className="text-xs font-bold text-gray-400">총 {regions.length}개 지역</span>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-4 gap-y-3">
                                {regions.map((region) => (
                                    <Link
                                        key={region.id}
                                        href={`/region/${region.id}`}
                                        className="py-2.5 px-3 rounded-lg border border-gray-100 hover:border-[#f82b60]/30 hover:bg-[#f82b60]/5 transition-all group"
                                    >
                                        <div className="flex flex-col">
                                            <span className="text-[13px] font-medium text-gray-700 group-hover:text-[#f82b60]">
                                                {region.mainRegion}
                                            </span>
                                            <span className="text-[10px] text-gray-400 group-hover:text-[#f82b60]/60">
                                                남성알바 공고 &gt;
                                            </span>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </section>
                    );
                })}
            </div>

            {/* SEO Text Content (Invisible to users, but visible to bots) */}
            <div className="sr-only" aria-hidden="true">
                <h2>고소득 남성알바 전국 상권 정보</h2>
                <p>
                    노래방알바, 룸웨이터, 가라오케, 당일지급, 고수익 보장. 강남, 수도권 및 전국 주요 상권 100% 매칭.
                    버블알바, 슈슈알바, 여우알바보다 확실한 프리미엄 공고를 만나보세요.
                </p>
            </div>
        </div>
    );
}
