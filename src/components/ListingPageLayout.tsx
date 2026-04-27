'use client';

import React from 'react';
import { useBrand } from './BrandProvider';
import { StickyWrapper } from './ui/StickyWrapper';

interface ListingPageLayoutProps {
    children: React.ReactNode;
    sidebar?: React.ReactNode;
}

export const ListingPageLayout = ({ children, sidebar }: ListingPageLayoutProps) => {
    const brand = useBrand();
    const isDark = brand.theme === 'dark';

    const SidebarContent = sidebar;

    // Mobile: px-0, pt-0
    // Desktop: pt-4
    return (
        <div className={`w-full h-auto pb-20 pt-0 lg:pt-4 ${isDark ? 'bg-gray-950' : 'bg-white'}`}>
            <div className="max-w-[1432px] mx-auto px-0 md:px-0 flex flex-col lg:flex-row gap-4 relative">

                {/* 1. Sidebar Container */}
                {/* Mobile: Static Top Block */}
                <div className="lg:hidden w-full mb-0">
                    {SidebarContent}
                </div>

                {/* Desktop: Dynamic Sticky Left Block */}
                <aside className="hidden lg:block w-[220px] flex-shrink-0 relative self-stretch">
                    <StickyWrapper offsetTop={56} isInternal={true}>
                        {SidebarContent}
                    </StickyWrapper>
                </aside>

                {/* 2. Main Content */}
                <div className="flex-1 min-w-0">
                    {children}
                </div>
            </div>
        </div>
    );
};
