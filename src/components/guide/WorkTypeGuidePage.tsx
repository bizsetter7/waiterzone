import React from 'react';
import Link from 'next/link';
import { WorkTypeSlug, WorkTypeInfo, RegionPayData, WORK_TYPE_SLUGS, WORK_TYPE_INFO } from '@/lib/data/work-type-guide';

interface Props {
    regionSlug: string;
    regionName: string;
    workTypeSlug: WorkTypeSlug;
    workTypeInfo: WorkTypeInfo;
    regionPayData?: RegionPayData;
}

export default function WorkTypeGuidePage({ regionSlug, regionName, workTypeSlug, workTypeInfo, regionPayData }: Props) {
    const payData = regionPayData?.payByWorkType[workTypeSlug];
    const otherWorkTypes = WORK_TYPE_SLUGS.filter(s => s !== workTypeSlug);

    return (
        <div className="max-w-3xl mx-auto px-4 py-8 bg-white min-h-screen">

            {/* 브레드크럼 */}
            <nav className="text-sm text-gray-400 mb-6 flex items-center gap-1 flex-wrap">
                <Link href="/" className="hover:text-[#1e3a5f]">홈</Link>
                <span>›</span>
                <Link href={`/waiter/${regionSlug}`} className="hover:text-[#1e3a5f]">{regionName} 알바</Link>
                <span>›</span>
                <span className="text-gray-700 font-medium">{regionName} {workTypeInfo.name}</span>
            </nav>

            {/* 타이틀 */}
            <div className="mb-8">
                <div className="inline-block bg-[#1e3a5f]/10 text-[#1e3a5f] text-xs font-bold px-3 py-1 rounded-full mb-3">
                    {regionName} 지역 가이드
                </div>
                <h1 className="text-2xl font-bold text-gray-900 leading-tight mb-3">
                    {regionName} {workTypeInfo.name} 완전 가이드
                </h1>
                <p className="text-gray-600 leading-relaxed">
                    {workTypeInfo.description}
                </p>
            </div>

            {/* 급여 정보 */}
            {payData && (
                <section className="bg-[#1e3a5f]/5 border border-[#1e3a5f]/20 rounded-2xl p-6 mb-8">
                    <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <span className="text-2xl">💰</span>
                        {regionName} {workTypeInfo.name} 평균 급여
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {payData.tc && (
                            <div className="bg-white rounded-xl p-4 shadow-sm">
                                <div className="text-xs text-gray-400 mb-1">TC (테이블차지)</div>
                                <div className="text-xl font-bold text-[#1e3a5f]">{payData.tc}</div>
                            </div>
                        )}
                        {payData.hourly && (
                            <div className="bg-white rounded-xl p-4 shadow-sm">
                                <div className="text-xs text-gray-400 mb-1">시급</div>
                                <div className="text-xl font-bold text-orange-500">{payData.hourly}</div>
                            </div>
                        )}
                        {payData.daily && (
                            <div className="bg-white rounded-xl p-4 shadow-sm">
                                <div className="text-xs text-gray-400 mb-1">일급</div>
                                <div className="text-xl font-bold text-blue-500">{payData.daily}</div>
                            </div>
                        )}
                    </div>
                    {payData.note && (
                        <p className="text-xs text-gray-400 mt-3">※ {payData.note}</p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">※ 실제 급여는 업소·경력·근무 조건에 따라 상이합니다.</p>
                </section>
            )}

            {/* 업종 특징 */}
            <section className="mb-8">
                <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <span className="text-2xl">✅</span>
                    {workTypeInfo.name} 특징
                </h2>
                <ul className="space-y-2">
                    {workTypeInfo.characteristics.map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-gray-700">
                            <span className="text-[#1e3a5f] mt-0.5 flex-shrink-0">•</span>
                            <span>{item}</span>
                        </li>
                    ))}
                </ul>
            </section>

            {/* 핵심 용어 정리 */}
            <section className="mb-8">
                <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <span className="text-2xl">📖</span>
                    {workTypeInfo.name} 핵심 용어
                </h2>
                <div className="space-y-3">
                    {workTypeInfo.terminology.map((item, i) => (
                        <div key={i} className="border border-gray-100 rounded-xl p-4">
                            <div className="font-semibold text-gray-900 mb-1">{item.term}</div>
                            <div className="text-sm text-gray-600">{item.desc}</div>
                        </div>
                    ))}
                </div>
            </section>

            {/* FAQ */}
            <section className="mb-8">
                <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <span className="text-2xl">❓</span>
                    자주 묻는 질문
                </h2>
                <div className="space-y-4">
                    {workTypeInfo.faqs.map((item, i) => (
                        <div key={i} className="border border-gray-100 rounded-xl overflow-hidden">
                            <div className="bg-gray-50 px-4 py-3 font-medium text-gray-900 flex items-start gap-2">
                                <span className="text-[#1e3a5f] font-bold flex-shrink-0">Q.</span>
                                {item.q}
                            </div>
                            <div className="px-4 py-3 text-gray-700 text-sm leading-relaxed flex items-start gap-2">
                                <span className="text-orange-500 font-bold flex-shrink-0">A.</span>
                                {item.a}
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* 다른 업종 링크 */}
            <section className="mb-8">
                <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <span className="text-2xl">📍</span>
                    {regionName} 다른 업종 알아보기
                </h2>
                <div className="flex flex-wrap gap-2">
                    {otherWorkTypes.map((slug) => (
                        <Link
                            key={slug}
                            href={`/waiter/${regionSlug}/${slug}`}
                            className="px-4 py-2 rounded-full border border-gray-200 text-sm text-gray-600 hover:border-[#1e3a5f]/30 hover:text-[#1e3a5f] hover:bg-[#1e3a5f]/5 transition-colors"
                        >
                            {WORK_TYPE_INFO[slug].name}
                        </Link>
                    ))}
                </div>
            </section>

            {/* CTA */}
            <section className="bg-[#1e3a5f] rounded-2xl p-6 text-white text-center">
                <div className="text-xl font-bold mb-2">
                    {regionName} {workTypeSlug} 공고 지금 확인하기
                </div>
                <p className="text-white/70 text-sm mb-4">
                    웨이터존에서 검증된 {regionName} 지역 업소만 모아보세요
                </p>
                <Link
                    href={`/waiter/${regionSlug}`}
                    className="inline-block bg-white text-[#1e3a5f] font-bold px-6 py-3 rounded-full hover:bg-blue-50 transition-colors"
                >
                    {regionName} 공고 보러가기 →
                </Link>
            </section>

            {/* 안전 안내 */}
            <div className="mt-6 p-4 bg-gray-50 rounded-xl text-xs text-gray-400 leading-relaxed">
                ※ 이 페이지는 업종 정보를 제공하는 안내 페이지입니다. 실제 근무 전 계약서 작성, 공제 항목, 급여 지급 방식을 반드시 확인하세요. 선불페이 강요·과도한 개인정보 요구 업소는 이용하지 마세요.
            </div>
        </div>
    );
}
