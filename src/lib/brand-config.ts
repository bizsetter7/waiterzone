/**
 * B2B 랜딩 모드 플래그
 * 환경변수 NEXT_PUBLIC_AUDIT_MODE=true 일 때 AuditLanding 컴포넌트 노출
 */
/**
 * [브랜드 통합 설정]
 * P2 (웨이터존): 2026-03-25부로 심사 위장막(WhiteCell) 영구 폐기 -> 상시 B2C 실전 모드.
 */
export const AUDIT_MODE = false; // [핵심] P2는 이제 위장막이 필요 없습니다. (SOP v1.9.8)
export const IS_PRODUCTION = true; // 실전 모드 강제

/**
 * 기업전용인증 게이트 마스터 락 (Master Lock)
 *
 * ⚠️ 기본값 = true (비활성화) — 환경변수 미설정 시에도 게이트 차단
 *
 * 판정 규칙:
 *   NEXT_PUBLIC_ADULT_GATE_DISABLED 미설정 → undefined !== 'false' = TRUE  → 게이트 차단 ✅
 *   NEXT_PUBLIC_ADULT_GATE_DISABLED=true   → 'true'    !== 'false' = TRUE  → 게이트 차단 ✅
 *   NEXT_PUBLIC_ADULT_GATE_DISABLED=false  → 'false'   !== 'false' = FALSE → 게이트 활성 (런칭 후 사용)
 *
 * 런칭 시 단계:
 *   1) 본인인증 서비스 계약 완료
 *   2) Vercel 환경변수: NEXT_PUBLIC_ADULT_GATE_DISABLED=false 설정
 *   3) 재배포
 */
// [Master Unlock] 성인인증 게이트 상시 활성화
export const ADULT_GATE_DISABLED = false;

/**
 * 하위 호환성을 위해 유지 (곧 제거 예정)
 */
export const IS_SAFE_MODE = false;

export type BrandConfig = {
    id: string;
    name: string;
    domain: string;
    primaryColor: string;
    logoText: string;
    displayName: string;
    tagline: string;
    theme: 'dark' | 'light';
};

export const BRANDS: Record<string, BrandConfig> = {
    coco: {
        id: 'coco',
        name: '웨이터존',
        domain: 'waiterzone.kr',
        primaryColor: '#1e3a5f',
        logoText: 'WAITERZONE',
        displayName: '웨이터존',
        tagline: '대한민국 1등 웨이터 전문 구인 플랫폼',
        theme: 'dark',
    },
    /**
     * P4 초코파트너스 / 파트너스크레딧
     * - 도메인: partnerscredit.co.kr (실제 도메인 확정 시 업데이트)
     * - Vercel 환경변수: NEXT_PUBLIC_DEFAULT_BRAND_ID=choco, NEXT_PUBLIC_AUDIT_MODE=true
     */
    choco: {
        id: 'choco',
        name: '초코파트너스',
        domain: 'partnerscredit.co.kr',
        primaryColor: '#1E3A8A',
        logoText: 'CHOCO',
        displayName: '초코파트너스',
        tagline: '파트너스크레딧 — 검증된 파트너사와 함께하는 B2B 성장 플랫폼',
        theme: 'light',
    },
    bibi: {
        id: 'bibi',
        name: '비비알바',
        domain: 'bibialba.com',
        primaryColor: '#FF1493',
        logoText: 'BIBI',
        displayName: 'BIBI 비비알바',
        tagline: '센스있는 형님들의 선택, 비비알바',
        theme: 'dark',
    },
    lulu: {
        id: 'lulu',
        name: '루루알바',
        domain: 'lulualba.com',
        primaryColor: '#8A2BE2',
        logoText: 'LULU',
        displayName: 'LULU 루루알바',
        tagline: '일상이 화보가 되는 곳, 루루알바',
        theme: 'light',
    },
    luna: {
        id: 'luna',
        name: '루나알바',
        domain: 'lunaalba.com',
        primaryColor: '#C0C0C0',
        logoText: 'LUNA',
        displayName: 'LUNA 루나알바',
        tagline: '밤하늘의 달처럼 빛나는 당신, 루나알바',
        theme: 'dark',
    },
};

export const DEFAULT_BRAND = BRANDS.coco;
