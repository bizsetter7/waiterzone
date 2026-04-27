import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { BrandProvider } from "@/components/BrandProvider";
import { Suspense } from "react";
import { Shop } from "@/types/shop";
import { LayoutWrapper } from "@/components/LayoutWrapper";
import ScrollToTop from "@/components/common/ScrollToTop";
import { MonitorProvider } from "@/components/MonitorProvider";

const inter = Inter({ subsets: ["latin"], display: 'swap' });

import { SEOManager } from "@/components/common/seo/SEOManager";
import { SEOInjection } from "@/components/common/seo/SEOInjection";
import { AuthProvider } from '@/components/auth/AuthProvider';
import VisitorTracker from '@/components/common/VisitorTracker';

import { getCurrentSEO } from "@/lib/metadata-config";
import { AUDIT_MODE } from "@/lib/brand-config";

/**
 * generateMetadata — 도메인/브랜드별 타이틀 동적 분기
 * - AUDIT_MODE=true (P4 초코파트너스) → 타이틀 "초코파트너스 - 파트너스크레딧 공식 B2B 플랫폼"
 * - 기본 (P2 웨이터존)               → getCurrentSEO() 기반 타이틀
 */
export async function generateMetadata(): Promise<Metadata> {
  const isAuditMode = AUDIT_MODE;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.waiterzone.kr';
  const isCloneSite = siteUrl.includes('d386') || (siteUrl.includes('vercel.app') && !siteUrl.includes('waiterzone'));

  // d386 복제사이트: 구글 색인 원천 차단 + 본 사이트로 canonical 지정
  if (isCloneSite) {
    return {
      title: '웨이터존',
      robots: {
        index: false,
        follow: false,
        googleBot: { index: false, follow: false },
      },
      alternates: {
        canonical: 'https://www.waiterzone.kr',
      },
    };
  }

  const seoConfig = getCurrentSEO();
  const ogImage = 'https://www.waiterzone.kr/og-image.jpg';
  const safeSiteUrl = siteUrl.startsWith('http') ? siteUrl : `https://${siteUrl}`;
  
  // [Safety] metadataBase Stringify — Next.js 14+ 런타임 안정성 확보
  let metadataBase: URL | null = null;
  try {
    metadataBase = new URL(safeSiteUrl);
  } catch (e) {
    metadataBase = new URL('https://www.waiterzone.kr');
  }

  // [Safety] SEO Config Null Check
  const title = seoConfig?.metadata?.title || '웨이터존';
  const description = seoConfig?.metadata?.description || '대한민국 1등 웨이터 전문 구인 플랫폼';
  const keywords = seoConfig?.metadata?.keywords || [];

  return {
    metadataBase,
    alternates: {
    },
    title,
    description,
    keywords,
    verification: seoConfig?.metadata?.verification,
    openGraph: {
      title,
      description,
      url: siteUrl,
      siteName: '웨이터존',
      images: [{ url: ogImage, width: 1200, height: 630, alt: '웨이터존 - No.1 웨이터 전문 매칭' }],
      type: 'website',
      locale: 'ko_KR',
    },
    twitter: {
      card: 'summary_large_image',
      title: seoConfig.metadata.title,
      description: seoConfig.metadata.description,
      images: [ogImage],
    },
    other: {
      google: "notranslate",
      "color-scheme": seoConfig.theme.colorScheme,
      "supported-color-schemes": seoConfig.theme.supportedColorSchemes,
      "geo.region": "KR",
      "geo.placename": "Seoul",
      "geo.position": "37.4979;127.0276",
      "ICBM": "37.4979, 127.0276",
      // Google Discover + 구글 이미지 검색 대형 썸네일 허용 — 미설정 시 Discover 제외
      "robots": "max-image-preview:large",
    },
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#ffffff",
  colorScheme: "light",
};

import shopsData from "@/lib/data/shops.json";

import Script from "next/script";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // [Optimization] Server-side data prep for sidebars
  const grandAds = (shopsData as Shop[]).filter(s => s.tier === 'grand');
  const premiumAds = (shopsData as Shop[]).filter(s => s.tier === 'premium' || s.is_premium);
  const sideAds = [...grandAds, ...premiumAds];

  return (
    <html lang="ko" suppressHydrationWarning={true}>
      <head />
      <body className={`${inter.className} notranslate`} suppressHydrationWarning={true}>
        {/* Google Tag Manager (noscript) */}
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-NXSFG837"
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          />
        </noscript>
        {/* End Google Tag Manager (noscript) */}
        {/* FB Pixel noscript: NEXT_PUBLIC_FB_PIXEL_ID 환경변수 설정 후 활성화 */}

        {!AUDIT_MODE && (
          <>
            {/* Google Tag Manager */}
            <Script
              id="gtm-script"
              strategy="afterInteractive"
              dangerouslySetInnerHTML={{
                __html: `
                  (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
                  new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
                  j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
                  'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
                  })(window,document,'script','dataLayer','GTM-NXSFG837');
                `,
              }}
            />
            {/* End Google Tag Manager */}

            {/* FB Pixel: NEXT_PUBLIC_FB_PIXEL_ID 환경변수 설정 후 아래 주석 해제 */}
            {/* <Script id="fb-pixel" strategy="afterInteractive" dangerouslySetInnerHTML={{ __html: `...fbq('init', process.env.NEXT_PUBLIC_FB_PIXEL_ID)...` }} /> */}

            {/* PortOne V2 SDK */}
            <Script src="https://cdn.portone.io/v2/browser-sdk.js" strategy="afterInteractive" />
          </>
        )}
        
        {/* WebSite + SearchAction Schema — 구글 사이트링크 검색박스 활성화 */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              "name": "웨이터존",
              "alternateName": "WAITERZONE",
              "url": "https://www.waiterzone.kr",
              "potentialAction": {
                "@type": "SearchAction",
                "target": {
                  "@type": "EntryPoint",
                  "urlTemplate": "https://www.waiterzone.kr/jobs?q={search_term_string}"
                },
                "query-input": "required name=search_term_string"
              }
            })
          }}
        />

        {/* [v2.8.0] Pretendard 폰트 디자인 원복 — 최적화 로드 */}
        <link 
          rel="stylesheet" 
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css" 
          crossOrigin="anonymous"
        />

        <Suspense fallback={null}>
          <SEOManager />
          <SEOInjection />
        </Suspense>

        <AuthProvider>
          <BrandProvider>
            {/* 전역 감시 훅 — JS에러/DeadClick/WebVitals/LongTask 수집 */}
            <MonitorProvider />
            {/* 방문자 추적 — 어드민 대시보드 실시간 접속자 표시용 */}
            <VisitorTracker />
            <div className="flex flex-col h-auto">
              <Suspense fallback={<div className="min-h-screen bg-white" />}>
                <LayoutWrapper sideAds={sideAds}>
                  <Suspense fallback={null}>
                    {children}
                  </Suspense>
                </LayoutWrapper>
              </Suspense>
            </div>
            <ScrollToTop />
          </BrandProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
