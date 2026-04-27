'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import ShopDetailView from '@/components/jobs/ShopDetailView';
import { anyAdToShop } from '@/lib/adUtils';

/**
 * my-shop 전용 광고 상세 모달
 * JobDetailContent를 래핑하여 데이터 정규화를 수행합니다.
 */
export const AdDetailModal = ({ ad, onClose }: { ad: any; onClose: () => void }) => {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted || !ad) return null;

    const shop = anyAdToShop(ad);

    return createPortal(
        <div 
            className="modal-overlay fixed inset-0 z-[20000] flex items-end md:items-center justify-center bg-black/80 backdrop-blur-sm touch-none overscroll-contain animate-in fade-in duration-300"
            onClick={onClose}
        >
            <div
                className="relative w-full md:max-w-[500px] lg:max-w-[600px] h-[92vh] md:h-[88vh] overflow-hidden rounded-t-[32px] md:rounded-[32px] bg-white z-10 animate-in slide-in-from-bottom duration-300"
                onClick={e => e.stopPropagation()}
            >
                <ShopDetailView shop={shop} onClose={onClose} />
            </div>
        </div>,
        document.body
    );
};

export default AdDetailModal;
