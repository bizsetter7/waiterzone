'use client';
// 배너 광고 슬롯 — 향후 새 배너 시스템 연동 예정 (기존 tier 연동 시스템 제거됨)

interface BannerSidebarProps {
    side: 'left' | 'right';
}

export const BannerSidebar = ({ side }: BannerSidebarProps) => {
    return (
        <div
            className="hidden xl:flex flex-col items-center w-[160px] min-h-screen pt-6 px-1"
            data-banner-slot={side}
        >
            {/* 배너 슬롯 예약 영역 — 향후 새 배너 시스템 연동 예정 */}
        </div>
    );
};
