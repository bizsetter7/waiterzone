import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.waiterzone.kr';
    const isCloneSite = siteUrl.includes('d386') || siteUrl.includes('vercel.app');

    // d386 복제사이트: 구글 색인 완전 차단 (SEO 중복 페이지 방지)
    if (isCloneSite) {
        return {
            rules: {
                userAgent: '*',
                disallow: '/', // 전체 크롤링 차단
            },
        };
    }

    // 본 사이트(www.waiterzone.kr): 정상 색인 허용
    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: [
                '/api/',
                '/admin/',
                '/my-shop/dashboard/',
                '/static/media/',
                '/_next/static/', // Next.js 내부 정적 자산 404 방지
                '/fonts/',         // 폰트 파일 해시 변경 대응
                '/shop/',          // 레거시 URL 크롤링 중복 방지 (리다이렉트 처리됨)
            ],
        },
        sitemap: [
            `${siteUrl}/sitemap.xml`,
            `${siteUrl}/image-sitemap.xml`,
        ],
        // AI 검색 최적화 (GEO)
        // llms.txt: https://www.waiterzone.kr/llms.txt
    };
}
