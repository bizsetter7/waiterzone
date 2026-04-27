import { ICONS } from '@/constants/job-options';

/**
 * 🧹 공고 제목 정제 유틸리티
 * 대괄호[], 소괄호(), 중괄호{} 및 내부 텍스트를 제거하고 트림합니다.
 */
export const cleanShopTitle = (title?: string, name?: string): string => {
    const rawTitle = title || name || '공고 정보';
    // 1단계: [], (), {} 및 내부 텍스트 제거
    // 2단계: 경쟁사 브랜드(여우, 퀸, 레이디, 알바몬, 알바천국 등) 및 B2B 키워드 제거
    // 3단계: 연속된 공백을 하나로 합치고 트림
    const cleaned = rawTitle
        .replace(/\[.*?\]|\(.*?\)|\{.*?\}/g, ' ')
        .replace(/여우알바|퀸알바|레이디알바|악녀알바|버블알바|슈슈알바|알바몬|알바천국/g, ' ')
        .replace(/엔터프라이즈|인재솔루션|인재알바/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    // 정제 후 너무 짧아지면 원본 반환 (시인성 확보)
    return cleaned.length < 2 ? rawTitle : cleaned;
};

/**
 * 🔍 아이콘 객체 조회 유틸리티
 * ID를 통해 ICONS 상수에서 아이콘 정보를 찾습니다.
 */
export const getIconById = (id?: number | string | null) => {
    if (!id) return null;
    return ICONS.find(icon => String(icon.id) === String(id)) || null;
};
/**
 * 🔗 URL Slug 생성 유틸리티
 * 지역명 등을 URL에 안전한 형태로 변환합니다.
 */
export const slugify = (str: string): string => {
    if (!str) return 'all';
    return str
        .replace(/[\[\]\>\<\(\)\{\}]/g, '') // 특수문자 제거
        .replace(/[\s\/]+/g, '-')           // 공백 및 슬래시를 하이픈으로 변경
        .replace(/-+/g, '-')                // 중복 하이픈 제거
        .trim();
};

/**
 * 🖼️ 업종별 기본 이미지 반환 유틸리티
 * 각 업종에 어울리는 프리미엄 이미지를 반환합니다.
 */
export const getShopDefaultImage = (workType?: string): string => {
    const type = workType || '';

    if (type.includes('바') || type.includes('Bar') || type.includes('카페')) {
        return 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&q=80&w=800'; // 프리미엄 바 이미지
    }
    if (type.includes('노래') || type.includes('가라오케') || type.includes('주점')) {
        return 'https://images.unsplash.com/photo-1525286335722-c30c6b5df541?auto=format&fit=crop&q=80&w=800'; // 가라오케/마이크 이미지
    }
    if (type.includes('룸') || type.includes('셔츠')) {
        return 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=800'; // 클럽/하이엔드 라운지
    }
    if (type.includes('테라피') || type.includes('마사지') || type.includes('스웨디시')) {
        return 'https://images.unsplash.com/photo-1544161515-4af6b1d8e159?auto=format&fit=crop&q=80&w=800'; // 스파/테라피 이미지
    }
    if (type.includes('해외') || type.includes('출장')) {
        return 'https://images.unsplash.com/photo-1436491865332-7a61a109c0f2?auto=format&fit=crop&q=80&w=800'; // 공항/여행 이미지
    }

    // 기본 리드 이미지 (waiterzone premium)
    return 'https://images.unsplash.com/photo-1566737236500-c8ac43014a67?auto=format&fit=crop&q=80&w=800';
};
/**
 * 🖼️ 광고카드/공고팝업 Row3 키워드 폴백 생성
 * options.paySuffixes + options.keywords 가 없을 때 지역+업종 조합으로 자동 생성
 * (광고카드 생성기 Row3, JobDetailModal 키워드 섹션 공통 사용)
 */
export const buildAdKeywordFallback = (region: string, workType: string): string[] => {
    // region: "서울-강남구" | "[서울]강남구" | "강남구" 등 다양한 포맷 지원
    const clean = region.replace(/[\[\]]/g, '').trim();
    const parts = clean.split(/[-\s]+/);
    const city = parts[0] || '';
    const district = parts[1] || '';
    const displayRegion = district || city;

    return [
        `${displayRegion}${workType}알바`,
        `${displayRegion}여자남성유흥알바`,
        `${displayRegion}여자고수익알바`,
    ].filter(k => k.trim().length > 4);
};

/**
 * 🏷️ SEO 키워드 자동 생성 유틸리티
 * 지역명을 기반으로 검색 최적화된 고효율 키워드 배열을 반환합니다.
 * '엔터프라이즈', '인재', '솔루션' 등 불필요 단어 전수 제거 (2026-04-01)
 * 지역명 중복 노출 해결 (예: 부산 부산진구 -> 부산진구)
 */
export const generateSEOKeywords = (region?: string): string[] => {
    if (!region) return ['웨이터존', '남성알바', '야간알바'];

    const cleanRegion = region.replace(/[\[\]]/g, '').trim();
    const parts = cleanRegion.split(/\s+/);
    
    // 마지막 구/동 단위 추출 (예: "부산 부산진구 개금동" -> "개금동")
    const city = parts[0] || '';
    const district = parts[1] || '';
    const town = parts[parts.length - 1] || '';

    // 지역명 중복 제거 로직 (예: "부산 부산진구" -> "부산진구")
    // "서울", "부산" 같은 광역시는 1차 지역명이며, "강남구", "해운대구" 같은 2차 지역명이 있으면 1차는 생략
    const displayRegion = district || city;
    // "부산 부산진구" 대신 "부산진구", "서울 강남구" 대신 "강남구"
    const fullPrefix = (district && city !== district) ? district : city;

    const baseKeywords = [
        `${fullPrefix} 남성알바`,
        `${displayRegion} 여자남성유흥알바`,
        `${displayRegion} 여자룸웨이터`,
        `${town} 노래방알바`,
        `${fullPrefix} 야간알바`,
        `${town} 여우알바`,
        `${displayRegion} 룸나무`,
        `${displayRegion} 고수익알바`,
        '웨이터존'
    ];

    // 금지어 필터링 및 정규화 (B2B 잔재 및 경쟁사 브랜드)
    const forbiddenWords = [
        '엔터프라이즈', '인재', '솔루션', '레이디알바', '전문', '숙식', '초보', '자유', '텃세', '친절',
        '여우알바', '퀸알바', '악녀알바', '슈슈알바', '버블알바'
    ];
    
    return Array.from(new Set(baseKeywords))
        .filter(kw => !forbiddenWords.some(fw => kw.includes(fw)))
        .map(kw => kw.trim());
};
