'use client';
// 배너 광고 슬롯 — 향후 새 배너 시스템 연동 예정 (기존 tier 연동 시스템 제거됨)

interface BannerSidebarProps {
    side: 'left' | 'right';
}

export const BannerSidebar = ({ side }: BannerSidebarProps) => {
    return (
        <div
            className="hidden xl:flex flex-col items-center w-[160px] min-h-screen pt-6 px-2 gap-3"
            data-banner-slot={side}
        >
            {/* 슬롯 1 — 300x250 */}
            <div className="w-full flex flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-gray-200 bg-gray-50 text-gray-300 sticky top-6"
                style={{ width: '150px', height: '300px' }}>
                <svg className="w-6 h-6 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <rect x="3" y="3" width="18" height="18" rx="2" strokeWidth="1.5" />
                    <path d="M3 9h18M9 21V9" strokeWidth="1.5" />
                </svg>
                <span className="text-[10px] font-bold tracking-widest opacity-50 uppercase">AD</span>
                <span className="text-[9px] opacity-40">150 × 300</span>
            </div>

            {/* 슬롯 2 — 150x150 */}
            <div className="w-full flex flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-gray-200 bg-gray-50 text-gray-300"
                style={{ width: '150px', height: '150px' }}>
                <svg className="w-5 h-5 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <rect x="3" y="3" width="18" height="18" rx="2" strokeWidth="1.5" />
                    <path d="M3 9h18M9 21V9" strokeWidth="1.5" />
                </svg>
                <span className="text-[10px] font-bold tracking-widest opacity-50 uppercase">AD</span>
            </div>
        </div>
    );
};
