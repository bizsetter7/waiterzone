/**
 * SNS 해시태그 엔진 (웨이터존)
 */

// ─── 지역별 해시태그 ───────────────────────────────────────────────────────────

export const REGION_HASHTAGS: Record<string, string[]> = {
    '서울':                  ['서울웨이터', '서울남성알바'],
    '서울-강남구':            ['강남웨이터', '강남남성알바'],
    '서울-마포구':            ['홍대웨이터', '마포웨이터'],
    '경기-수원시':            ['수원웨이터', '인계동웨이터'],
    '부산':                  ['부산웨이터', '서면웨이터'],
    '대전':                  ['대전웨이터', '유성웨이터'],
    '대구':                  ['대구웨이터', '동성로웨이터'],
    '인천':                  ['인천웨이터', '부평웨이터'],
};

// ─── 업종별 해시태그 ───────────────────────────────────────────────────────────

export const WORKTYPE_HASHTAGS: Record<string, string[]> = {
    '룸살롱':    ['룸살롱웨이터', '룸웨이터'],
    '가라오케':  ['가라오케웨이터', '가라웨이터'],
    '클럽':      ['클럽웨이터', '클럽엠디'],
    '나이트':    ['나이트웨이터', '나이트부킹'],
    '바':        ['바웨이터', '바텐더'],
    '기타':      ['남성알바', '웨이터알바'],
};

// ─── 세부 지역 약칭 매핑 ───────────────────────────────────────────────────

export const REGION_SHORT_NAME: Record<string, string> = {
    '서울-강남구':    '강남',
    '서울-서초구':    '서초',
    '서울-마포구':    '홍대',
    '서울-영등포구':  '영등포',
    '서울-용산구':    '이태원',
    '경기-수원시':    '수원',
    '경기-성남시':    '분당',
    '부산-해운대구':  '해운대',
    '부산-부산진구':  '서면',
    '대전-유성구':    '유성',
};

// ─── 공통 브랜드 해시태그 ────────────────────────────────────────────────────

export const BRAND_HASHTAGS = ['웨이터존', '웨이터알바', '남성알바'];

// ─── 해시태그 생성기 ──────────────────────────────────────────────────────────

export function buildHashtags(regionSlug: string, workType: string): string[] {
    const shortName    = REGION_SHORT_NAME[regionSlug];                              
    const mainRegion   = regionSlug.split('-')[0];                                   
    const regionTags   = REGION_HASHTAGS[regionSlug] ?? REGION_HASHTAGS[mainRegion] ?? [];
    const worktypeTags = WORKTYPE_HASHTAGS[workType] ?? [];

    const detailTag = shortName && workType ? `${shortName}${workType}` : null;
    const broadTag  = mainRegion && workType && mainRegion !== shortName
        ? `${mainRegion}${workType}`
        : null;

    const all = [
        detailTag,          
        broadTag,           
        regionTags[0],      
        worktypeTags[0],    
        ...BRAND_HASHTAGS,  
    ].filter((t): t is string => !!t);

    return [...new Set(all)].slice(0, 5);
}

export function formatHashtags(tags: string[]): string {
    return tags.map(t => `#${t}`).join(' ');
}
