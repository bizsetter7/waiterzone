'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

export default function ScrollToTop() {
    const pathname = usePathname();
    const lastPathRef = useRef<string>('');

    useEffect(() => {
        // 실제 경로(pathname)가 바뀌었을 때만 스크롤
        // searchParams 변경은 무시하여 에디터 입력 등에서의 버벅임/튐 방지
        if (lastPathRef.current !== pathname) {
            try {
                window.scrollTo(0, 0);
            } catch (error) {
                console.error('ScrollToTop error:', error);
            }
            lastPathRef.current = pathname;
        }
    }, [pathname]);

    return null;
}
