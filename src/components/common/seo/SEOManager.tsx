'use client';

import React from 'react';
import { getCurrentSEO } from '@/lib/metadata-config';

/**
 * [SEO v3.0] Stealth JSON-LD Structured Data
 * 환경변수에 따라 Clean(화이트셀) / b2b(안전 프리미엄) 모드의 스키마를 동적으로 제공합니다.
 */
export const SEOManager = () => {
    const [mounted, setMounted] = React.useState(false);

    React.useEffect(() => {
        setMounted(true);
    }, []);

    const { schemas } = getCurrentSEO();

    if (!mounted) return null;

    return (
        <>
            {schemas.map((schema, index) => (
                <script
                    key={index}
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
                />
            ))}
        </>
    );
};
