'use client';

import React from 'react';
import Link from 'next/link';

interface JobTypeGuideLinksProps {
    jobType: string; // selectedJobType (e.g. '룸웨이터', '텐프로/쩜오')
}

// 업종별 채용(JobClient) 선택 직종 → 가이드 페이지 슬러그 매핑
const JOB_TYPE_TO_GUIDE_SLUG: Record<string, string> = {
    '룸웨이터':    '룸웨이터',
    '텐프로/쩜오': '텐프로',
    '노래주점':   '노래주점',
    '바(Bar)':   '바알바',
    '마사지':    '마사지',
    // 요정·엔터·다방·카페·기타는 가이드 페이지 미존재 → null 처리
};

// 가이드 링크로 노출할 상위 지역 (가이드 데이터가 있는 주요 지역)
const TOP_REGIONS = ['서울', '부산', '대구', '인천', '대전', '광주'];

export const JobTypeGuideLinks = ({ jobType }: JobTypeGuideLinksProps) => {
    const guideSlug = JOB_TYPE_TO_GUIDE_SLUG[jobType];

    // 매핑되는 가이드 슬러그 없으면 미표시
    if (!guideSlug) return null;

    return (
        <section className="mb-8 p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
            <h3 className="text-lg font-bold mb-4 text-gray-800">
                <span className="text-pink-600">{jobType}</span> 지역별 가이드
            </h3>
            <div className="flex flex-wrap gap-2">
                {TOP_REGIONS.map((region) => (
                    <Link
                        key={region}
                        href={`/coco/${region}/${guideSlug}`}
                        className="inline-block px-4 py-2 bg-pink-500 text-white rounded-full text-sm font-medium hover:bg-pink-600 transition-colors shadow-sm active:scale-95"
                    >
                        {region} {jobType}
                    </Link>
                ))}
            </div>
            <p className="mt-3 text-xs text-gray-400">
                * 각 지역별 급여, 용어, 자주 묻는 질문(FAQ) 정보를 확인하세요.
            </p>
        </section>
    );
};
