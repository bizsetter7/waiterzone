'use client';

import React from 'react';
import { useBrand } from '@/components/BrandProvider';

interface AdSectionSkeletonProps {
    title: string;
    rowCountPC: number;
}

export const AdSectionSkeleton = ({ title, rowCountPC }: AdSectionSkeletonProps) => {
    const brand = useBrand();
    const isDark = brand.theme === 'dark';
    const totalPC = 4 * rowCountPC;
    const totalMob = 6;

    return (
        <section className="mb-12 relative px-4 xl:px-0 animate-pulse">
            {/* Header Skeleton */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-full ${isDark ? 'bg-gray-800' : 'bg-gray-200'}`} />
                    <div className={`h-8 w-40 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-gray-200'}`} />
                </div>
                <div className={`h-8 w-24 rounded-full ${isDark ? 'bg-gray-800' : 'bg-gray-200'}`} />
            </div>

            {/* Grid Skeleton */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                {Array.from({ length: totalPC }).map((_, idx) => (
                    <div
                        key={idx}
                        className={`
                            aspect-[4/5] rounded-2xl 
                            ${isDark ? 'bg-gray-800' : 'bg-gray-100'}
                            ${idx >= totalMob ? 'hidden md:block' : ''}
                        `}
                    />
                ))}
            </div>
        </section>
    );
};
