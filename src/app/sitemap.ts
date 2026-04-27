import { MetadataRoute } from 'next';
import shopsData from '@/lib/data/shops.json';
import seoRegionsMaster from '@/lib/data/seo_regions_master.json';
import shadowRegionsData from '@/lib/data/Shadow_SEO_Regions.json';
import { MOCK_POSTS } from '@/constants/community';
import { supabase } from '@/lib/supabase';
import { WORK_TYPE_SLUGS } from '@/lib/data/work-type-guide';
import { slugify } from '@/utils/shopUtils';

// Dynamic so sitemap includes latest DB posts
export const dynamic = 'force-dynamic';
export const revalidate = 3600; // Re-generate every 1 hour

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = 'https://www.waiterzone.kr';

    // 1. Static Routes
    const routes = [
        '',
        '/jobs',
        '/region',
        '/community',
        '/talent',
        '/guide',
        '/customer-center',
        '/favorites',
        '/notice/card-payment-termination',
        '/notice/job-scam',
    ].map((route) => ({
        url: `${baseUrl}${route}`,
        lastModified: new Date(),
        changeFrequency: 'daily' as const,
        priority: 1.0,
    }));

    // 2. Region Pages (SEO Landing Pages) - High Priority
    // [Fix] slugify 적용 — generateStaticParams와 동일한 경로 생성
    const regionRoutes = seoRegionsMaster.map((region) => ({
        url: `${baseUrl}/coco/${slugify(region.id)}`,
        lastModified: new Date(),
        changeFrequency: 'daily' as const,
        priority: 0.9,
    }));

    // 3. Shop Detail Pages — 콘텐츠 있는 광고만 포함 (thin content 제외)
    // title 또는 description 중 하나라도 있어야 sitemap에 포함
    // → 빈 UUID 광고 제외로 크롤 예산 보호
    // [Fix] shop.region에 '[서울]' 등 대괄호 포함된 경우 slugify로 정규화 (M-020 참조)
    const cleanRegionSlug = (region: string) =>
        slugify(region.replace(/\[|\]/g, '').trim());

    // 목업(bait/premium-extra) ID는 사이트맵 제외 — mock 데이터로 색인 가치 없음
    const MOCK_ID_PREFIXES = ['bait-', 'premium-extra-'];
    const isMockShop = (id: string) => MOCK_ID_PREFIXES.some(p => String(id).startsWith(p));

    const shopRoutes = shopsData
        .filter((shop: any) => {
            if (isMockShop(shop.id)) return false; // 목업 제외
            const hasTitle = ((shop.title as string) || '').trim().length > 4;
            const hasDesc = ((shop.description as string) || '').trim().length > 20;
            return hasTitle || hasDesc;
        })
        .map((shop) => {
            const regionSlug = cleanRegionSlug(shop.region || '');
            if (!regionSlug) return null; // 지역 없는 광고는 사이트맵 제외
            return {
                url: `${baseUrl}/coco/${regionSlug}/${shop.id}`,
                lastModified: new Date(),
                changeFrequency: 'weekly' as const,
                priority: 0.7,
            };
        })
        .filter(Boolean) as MetadataRoute.Sitemap;

    // 4-A. 지역×업종 가이드 랜딩 페이지 (예: /coco/서울/룸웨이터)
    // [Fix] shadowRegionsData 기준 사용 — generateStaticParams와 동일한 데이터소스
    const guideRoutes = shadowRegionsData.flatMap((region) =>
        WORK_TYPE_SLUGS.map((workType) => ({
            url: `${baseUrl}/coco/${slugify(region.id)}/${workType}`,
            lastModified: new Date(),
            changeFrequency: 'monthly' as const,
            priority: 0.8,
        }))
    );

    // 4. [SAFE] Mock Community Posts - 항상 포함되는 안전장치
    const mockPostRoutes = MOCK_POSTS.map((post) => ({
        url: `${baseUrl}/community/${post.id}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.6,
    }));

    // 5. [NEW] Real DB Community Posts - 실제 유저 글도 자동 포함
    let dbPostRoutes: MetadataRoute.Sitemap = [];
    try {
        const { data: dbPosts } = await supabase
            .from('community_posts')
            .select('id, created_at')
            .eq('is_secret', false)
            .order('created_at', { ascending: false })
            .limit(500); // 최대 500개

        if (dbPosts && dbPosts.length > 0) {
            // Mock IDs 제외 (중복 방지)
            const mockIds = new Set(MOCK_POSTS.map(p => p.id));
            dbPostRoutes = dbPosts
                .filter(p => !mockIds.has(p.id))
                .map((post) => ({
                    url: `${baseUrl}/community/${post.id}`,
                    lastModified: new Date(post.created_at),
                    changeFrequency: 'weekly' as const,
                    priority: 0.6,
                }));
        }
    } catch (e) {
        // DB 오류 시 Mock만 사용 (안전장치)
        console.warn('Sitemap: DB fetch failed, using mock only.');
    }

    return [...routes, ...regionRoutes, ...shopRoutes, ...guideRoutes, ...mockPostRoutes, ...dbPostRoutes];
}
