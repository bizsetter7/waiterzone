'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { BrandConfig, BRANDS, DEFAULT_BRAND } from '@/lib/brand-config';
import { useSearchParams, usePathname } from 'next/navigation';
import ReactQueryProvider from './common/ReactQueryProvider';
import { Toaster } from 'react-hot-toast';

const BrandContext = createContext<BrandConfig>(DEFAULT_BRAND);

const BrandSync = ({ setBrand }: { setBrand: (b: BrandConfig) => void }) => {
    const searchParams = useSearchParams();
    const pathname = usePathname();

    // 0. Global Scroll to Top on Route Change
    useEffect(() => {
        if (typeof window !== 'undefined') {
            window.scrollTo({ top: 0, behavior: 'auto' });
        }
    }, [pathname]);

    useEffect(() => {
        // 1. Check search param first (for testing/development)
        const brandParam = searchParams.get('brand');
        if (brandParam && BRANDS[brandParam]) {
            setBrand(BRANDS[brandParam]);
            return;
        }

        // 2. Check hostname (for production)
        if (typeof window !== 'undefined') {
            const host = window.location.hostname;
            const foundBrand = Object.values(BRANDS).find((b) => host.includes(b.domain));
            if (foundBrand) {
                setBrand(foundBrand);
            }
        }
    }, [searchParams, setBrand]);

    return null;
};

/**
 * 빌드 타임 브랜드 ID 오버라이드 (Vercel 환경변수)
 * - P4: NEXT_PUBLIC_DEFAULT_BRAND_ID=choco → 초코파트너스 브랜드 강제 적용
 * - P2: 미설정(default) → DEFAULT_BRAND(coco) 사용
 */
const ENV_DEFAULT_BRAND_ID = process.env.NEXT_PUBLIC_DEFAULT_BRAND_ID;
const INITIAL_BRAND: BrandConfig =
    (ENV_DEFAULT_BRAND_ID && BRANDS[ENV_DEFAULT_BRAND_ID]) ? BRANDS[ENV_DEFAULT_BRAND_ID] : DEFAULT_BRAND;

export const BrandProvider = ({ children }: { children: React.ReactNode }) => {
    const [brand, setBrand] = useState<BrandConfig>(INITIAL_BRAND);

    // 3. Sync Dark Mode Class to HTML/Body
    useEffect(() => {
        if (typeof document !== 'undefined') {
            const root = document.documentElement;
            if (brand.theme === 'dark') {
                root.classList.add('dark');
            } else {
                root.classList.remove('dark');
            }
        }
    }, [brand.theme]);

    return (
        <BrandContext.Provider value={brand}>
            <ReactQueryProvider>
                <React.Suspense fallback={null}>
                    <BrandSync setBrand={setBrand} />
                </React.Suspense>
                <style dangerouslySetInnerHTML={{
                    __html: `
                    :root {
                        --brand-primary: ${brand.primaryColor};
                    }
                ` }} />
                {children}
                <Toaster position="top-center" />
            </ReactQueryProvider>
        </BrandContext.Provider>
    );
};

export const useBrand = () => useContext(BrandContext);
