/**
 * /image-sitemap.xml — 이미지 전용 사이트맵
 *
 * 구글 이미지 검색 상위노출 핵심 파일.
 * 광고 이미지(media_url, banner_image_url)가 있는 공고를 Google에 명시적으로 전달.
 * 이미지 없는 공고는 OG 이미지 URL로 폴백 처리.
 *
 * 참고: https://developers.google.com/search/docs/crawling-indexing/sitemaps/image-sitemaps
 *
 * ⚠️ NextResponse 대신 Response 사용 — NextResponse는 XML에 <script/> 주입 버그 있음
 */

import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const BASE_URL = 'https://www.waiterzone.kr';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

function escapeXml(str: string): string {
    return (str || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

function slugify(str: string): string {
    return encodeURIComponent(str.trim());
}

export async function GET() {
    try {
        // 이미지 있는 active 공고 조회 (service_role 없이 anon으로 가능한 범위)
        const { data: shopsWithImg } = await supabase
            .from('shops')
            .select('id, region, category, nickname, name, title, pay, pay_type, media_url, banner_image_url, updated_at')
            .eq('is_closed', false)
            .not('media_url', 'is', null)
            .order('updated_at', { ascending: false })
            .limit(300);

        const { data: shopsWithBanner } = await supabase
            .from('shops')
            .select('id, region, category, nickname, name, title, pay, pay_type, media_url, banner_image_url, updated_at')
            .eq('is_closed', false)
            .not('banner_image_url', 'is', null)
            .order('updated_at', { ascending: false })
            .limit(200);

        // 중복 제거 병합
        const seen = new Set<number>();
        const shops: any[] = [];
        for (const s of [...(shopsWithImg ?? []), ...(shopsWithBanner ?? [])]) {
            if (!seen.has(s.id)) {
                seen.add(s.id);
                shops.push(s);
            }
        }

        const urlEntries: string[] = [];

        for (const shop of shops) {
            const regionRaw = (shop.region || '').replace(/[\[\]]/g, '').trim();
            if (!regionRaw) continue;

            const imageUrl = shop.banner_image_url || shop.media_url;
            if (!imageUrl || !imageUrl.startsWith('http')) continue;

            const pageUrl  = `${BASE_URL}/waiter/${slugify(regionRaw)}/${shop.id}`;
            const shopName = shop.nickname || shop.name || '업체';
            const category = shop.category || '알바';
            const altText  = `${regionRaw} ${category} 구인공고 - ${shopName} | 웨이터존`;
            const titleText = shop.title
                ? `${regionRaw} ${category} - ${shop.title} | 웨이터존`
                : altText;

            urlEntries.push(
`  <url>
    <loc>${escapeXml(pageUrl)}</loc>
    <image:image>
      <image:loc>${escapeXml(imageUrl)}</image:loc>
      <image:title>${escapeXml(titleText)}</image:title>
      <image:caption>${escapeXml(altText)}</image:caption>
    </image:image>
  </url>`
            );
        }

        const xml = [
            '<?xml version="1.0" encoding="UTF-8"?>',
            '<urlset',
            '  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"',
            '  xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">',
            ...urlEntries,
            '</urlset>',
        ].join('\n');

        // ⚠️ NextResponse가 아닌 Response 사용 — <script/> 주입 방지
        return new Response(xml, {
            status: 200,
            headers: {
                'Content-Type': 'application/xml; charset=utf-8',
                'Cache-Control': 'public, max-age=3600, s-maxage=3600',
                'X-Robots-Tag': 'noindex',
            },
        });

    } catch (error) {
        console.error('[image-sitemap]', error);
        // 에러 시에도 빈 유효한 XML 반환 (GSC 오류 방지)
        return new Response(
            '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"></urlset>',
            {
                status: 200,
                headers: { 'Content-Type': 'application/xml; charset=utf-8' },
            }
        );
    }
}
