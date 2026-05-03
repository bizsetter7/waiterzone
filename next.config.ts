import type { NextConfig } from "next";

// Forced reload to clear 500 error after cache purge
const nextConfig: NextConfig = {
  // [Fix] 탭 전환 시 Next.js 15 라우터 캐시 재검증으로 MyShopContent 재마운트 방지
  // staleTimes.dynamic = 0 (기본값) → 탭복귀 시 즉시 Suspense fallback 노출 → 폼 리셋
  experimental: {
    staleTimes: {
      dynamic: 3600, // 동적 라우트 1시간 캐시 유지 (탭 전환 보호 — 30초 부족하여 상향)
      static: 3600,  // 정적 라우트 1시간
    },
  },
  // output: 'export', // API Route 사용을 위해 정적 추출 모드 비활성화
  images: {
    // unoptimized: true 제거 — WebP 변환·크기 최적화 활성화 (LCP 개선)
    remotePatterns: [
      { protocol: 'https', hostname: '**.supabase.co' },        // Supabase Storage
      { protocol: 'https', hostname: 'ronqwailyistjuyolmyh.supabase.co' }, // 프로젝트 직접 지정
      { protocol: 'https', hostname: 'picsum.photos' },          // 개발용 placeholder
      { protocol: 'https', hostname: 'api.mapbox.com' },         // Mapbox 지도 이미지
      { protocol: 'https', hostname: '**.amazonaws.com' },       // S3 (확장 대비)
      { protocol: 'https', hostname: 'images.unsplash.com' },    // 기타 외부 이미지
    ],
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  async redirects() {
    return [
      // [SEO] non-www → www 정규화 (Google 리다이렉션 포함된 페이지 오류 해소)
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'waiterzone.kr' }],
        destination: 'https://www.waiterzone.kr/:path*',
        permanent: true, // 301
      },
      // [SEO-1E 2026-05-03] /coco/* → /waiter/* 브랜드 URL 일치 (P2 코드 복붙 잔재 정리)
      // 기존 GSC 색인된 /coco/ URL의 PageRank 보존을 위해 301 영구 리다이렉트
      {
        source: '/coco/:path*',
        destination: '/waiter/:path*',
        permanent: true, // 301
      },
    ];
  },
};

export default nextConfig;
