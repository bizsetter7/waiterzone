'use client';

import React from 'react';
import Link from 'next/link';
import { WORK_TYPE_SLUGS } from '@/lib/data/work-type-guide';

interface WorkTypeGuideLinksProps {
    regionSlug: string;
}

export const WorkTypeGuideLinks = ({ regionSlug }: WorkTypeGuideLinksProps) => {
    // URL에 사용될 지역명 (이미 슬러그화 및 디코딩된 상태로 온다고 가정)
    
    return (
        <section className="mb-8 p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
            <h3 className="text-lg font-bold mb-4 text-gray-800">
                <span className="text-pink-600">{regionSlug.replace(/-/g, ' ')}</span> 업종별 가이드
            </h3>
            <div className="flex flex-wrap gap-2">
                {WORK_TYPE_SLUGS.map((slug) => (
                    <Link
                        key={slug}
                        href={`/coco/${regionSlug}/${slug}`}
                        className="inline-block px-4 py-2 bg-pink-500 text-white rounded-full text-sm font-medium hover:bg-pink-600 transition-colors shadow-sm active:scale-95"
                    >
                        {slug}
                    </Link>
                ))}
            </div>
            <p className="mt-3 text-xs text-gray-400">
                * 각 업종별 급여, 용어, 자주 묻는 질문(FAQ) 정보를 확인하세요.
            </p>
        </section>
    );
};
