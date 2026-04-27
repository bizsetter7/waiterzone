import { useEffect, useState } from 'react';

/**
 * Hook to control banner visibility.
 * Updated: Always returns true to prevent banners from disappearing behind modals.
 * Manual toggle is still supported via custom events.
 */
export const useBannerControl = () => {
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        const handleCustomToggle = (e: Event) => {
            const customEvent = e as CustomEvent;
            if (customEvent.detail && typeof customEvent.detail.visible === 'boolean') {
                setIsVisible(customEvent.detail.visible);
            }
        };
        window.addEventListener('toggle-side-banner', handleCustomToggle);

        return () => {
            window.removeEventListener('toggle-side-banner', handleCustomToggle);
        };
    }, []);

    return isVisible;
};
