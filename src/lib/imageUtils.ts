/**
 * 구글 이미지 SEO 유틸리티
 *
 * - generateShopImageAlt()     광고 이미지 alt 텍스트 자동 생성
 * - generateShopImageFilename() SEO 최적화 파일명 생성
 * - buildImageSitemapEntry()   이미지 사이트맵 항목 생성
 *
 * 전략 근거:
 *   경쟁사 전부 alt="" 또는 업체명만 → 파일명 UUID → SEO 0점
 *   웨이터존 자동생성: "강남 룸웨이터 월급 350만원 이상 초보환영 채용공고 - 웨이터존"
 */

const BASE_URL = 'https://www.waiterzone.kr';

/** 급여 방식 한글 표시 */
const PAY_TYPE_LABEL: Record<string, string> = {
    TC:       '일당',
    시급:     '시급',
    일급:     '일당',
    일당:     '일당',
    월급:     '월급',
    주급:     '주급',
    연봉:     '연봉',
    협의:     '급여협의',
};

/** 업종 슬러그 → 한글 (work-type-guide.ts WORK_TYPE_SLUGS와 동기화) */
const WORK_TYPE_LABEL: Record<string, string> = {
    // ── 가이드 페이지 슬러그 (WORK_TYPE_SLUGS 기준)
    '룸웨이터':       '룸웨이터',
    '텐프로':       '텐프로',
    '쩜오알바':     '쩜오(0.5차) 알바',
    '텐카페':       '텐카페',
    '노래주점':     '노래주점',
    '노래방웨이터':   '노래빠 알바',
    '바알바':       '바(Bar) 알바',
    '마사지':       '마사지',
    '엔터':         '엔터테이너',
    // ── 레거시/DB 카테고리 표기
    '룸살롱':       '룸살롱',
    '단란주점':     '단란주점',
    '바텐더':       '바텐더',
    '노래방':       '노래방',
    '클럽':         '클럽',
    '남성유흥알바':     '남성유흥알바',
    '노래빠':       '노래빠',
    '요정':         '요정',
    '다방':         '다방',
    '카페':         '카페',
    '기타':         '기타',
};

interface ShopLike {
    id?: string | number;
    name?: string;
    title?: string;
    region?: string;
    category?: string;
    work_type?: string;
    pay?: string;
    pay_type?: string;
    pay_amount?: number;
    media_url?: string;
    banner_image_url?: string;
}

/**
 * 광고 이미지 alt 텍스트 자동 생성
 *
 * 패턴: "{지역} {업종} {급여방식} {급여} 이상 초보환영 채용공고 - 웨이터존"
 * 예시: "강남 룸웨이터 월급 350만원 이상 초보환영 채용공고 - 웨이터존"
 */
export function generateShopImageAlt(shop: ShopLike): string {
    const region   = (shop.region || '').replace(/[\[\]]/g, '').trim();
    const workType = shop.work_type || shop.category || '';
    const payType  = PAY_TYPE_LABEL[shop.pay_type || ''] || '';
    const pay      = shop.pay || (shop.pay_amount ? `${shop.pay_amount.toLocaleString()}원` : '');

    const parts: string[] = [];
    if (region)   parts.push(region);
    if (workType) parts.push(WORK_TYPE_LABEL[workType] || workType);
    if (payType)  parts.push(payType);
    if (pay)      parts.push(`${pay} 이상`);
    parts.push('초보환영 채용공고');

    return `${parts.join(' ')} - 웨이터존`;
}

/**
 * SEO 최적화 이미지 파일명 생성 (업로드 시 사용)
 *
 * 패턴: "{지역}-{업종}-{급여}-웨이터존.webp"
 * 예시: "강남-룸웨이터-월급350만원-웨이터존.webp"
 */
export function generateShopImageFilename(shop: ShopLike): string {
    const region   = (shop.region || '').replace(/[\[\]\s]/g, '').trim();
    const workType = (shop.work_type || shop.category || '').trim();
    const payType  = PAY_TYPE_LABEL[shop.pay_type || ''] || '';
    const pay      = (shop.pay || '').replace(/\s+/g, '').replace(/,/g, '');

    const parts: string[] = [];
    if (region)             parts.push(region);
    if (workType)           parts.push(workType);
    if (payType && pay)     parts.push(`${payType}${pay}`);
    parts.push('웨이터존');

    return `${parts.join('-')}.webp`;
}

/**
 * 이미지 사이트맵용 항목 생성
 * sitemap.xml에 <image:image> 태그로 삽입
 */
export interface ImageSitemapEntry {
    loc:     string; // 이미지 URL
    title:   string;
    caption: string;
}

export function buildShopImageSitemapEntry(shop: ShopLike): ImageSitemapEntry | null {
    const imageUrl = shop.banner_image_url || shop.media_url;
    if (!imageUrl) return null;

    const region   = (shop.region || '').replace(/[\[\]]/g, '').trim();
    const workType = shop.work_type || shop.category || '';
    const pay      = shop.pay || '';

    return {
        loc:     imageUrl,
        title:   `${region} ${workType} ${pay} - 웨이터존 채용공고`,
        caption: generateShopImageAlt(shop),
    };
}

/**
 * 광고 상세 페이지 URL 생성
 */
export function buildShopPageUrl(shop: ShopLike, regionSlug: string): string {
    return `${BASE_URL}/waiter/${regionSlug}/${shop.id}`;
}
