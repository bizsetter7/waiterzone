/**
 * 지역명 정규화 유틸 — 단일 출처 (M-059)
 *
 * shops.region은 약칭('경기', '서울')을 사용.
 * 드롭다운·필터에서는 전체명('경기도', '서울')을 사용.
 * 이 파일이 두 형식 간 변환의 유일한 출처.
 */

/** 약칭 → 전체명 (shops.region '경기' → 드롭다운 표시 '경기도') */
export const REGION_SHORT_TO_FULL: Record<string, string> = {
    '경기': '경기도',
    '강원': '강원도',
    '경남': '경상남도',
    '경북': '경상북도',
    '전남': '전라남도',
    '전북': '전라북도',
    '충남': '충청남도',
    '충북': '충청북도',
    '제주': '제주도',
    // 나머지(서울·인천·부산·대구·광주·대전·울산·세종시)는 변환 없음
};

/** 전체명 → 약칭 (드롭다운 '경기도' → shops.region '경기') */
export const REGION_FULL_TO_SHORT: Record<string, string> = {
    '경기도': '경기',
    '강원도': '강원',
    '경상남도': '경남',
    '경상북도': '경북',
    '전라남도': '전남',
    '전라북도': '전북',
    '충청남도': '충남',
    '충청북도': '충북',
    '제주도': '제주',
};

/**
 * 어떤 형식의 지역명이든 shops.region 약칭으로 정규화.
 * '경기도' → '경기', '경기' → '경기', '서울' → '서울'
 */
export function normalizeRegion(raw: string): string {
    if (!raw) return '';
    const trimmed = raw.trim();
    return REGION_FULL_TO_SHORT[trimmed] ?? trimmed;
}

/**
 * 어떤 형식의 지역명이든 드롭다운 전체명으로 변환.
 * '경기' → '경기도', '경기도' → '경기도', '서울' → '서울'
 */
export function normalizeRegionFull(raw: string): string {
    if (!raw) return '';
    const trimmed = raw.trim();
    return REGION_SHORT_TO_FULL[trimmed] ?? trimmed;
}

/**
 * 지역명을 URL slug로 변환 (한글 그대로 사용, 공백만 제거).
 * '경기도' → '경기도', '서울' → '서울'
 * SEO URL에서 추가 encode는 Next.js가 처리.
 */
export function regionToSlug(region: string): string {
    return normalizeRegion(region).replace(/\s+/g, '');
}
