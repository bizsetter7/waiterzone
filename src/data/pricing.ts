/**
 * 가격 정책 단일 출처 — Phase A (2026-05-02)
 *
 * ⚠️ 4개 플랫폼(P2/P5/P9/P10) 동일 파일. 가격 변경 시 4곳 모두 수정 필수.
 *
 * Refs:
 * - PATTERNS/P-10 (예정): 가격 정책 단일 출처 파일
 * - admin_redesign_FINAL_decisions_2026-05-02.md
 * - SERVICE_GUIDE_2026-05-02.md
 */

export const PRICING = {
    /**
     * 추가광고 (단순 노출권)
     * - 업체정보 광고리스트 + 최신구인정보 섹션 노출
     * - 점프·SOS·부스터 미포함 (별도 결제)
     * - P2 코코알바 / P9 웨이터존 / P10 선수존 동일 가격
     * - P5 야사장은 추가광고 없음 (구독만)
     */
    additional_ad: {
        '1m': { price: 66000,  duration_days: 30,  discount_rate: 0    },
        '3m': { price: 188100, duration_days: 90,  discount_rate: 0.05 },
        '6m': { price: 356400, duration_days: 180, discount_rate: 0.10 },
    },

    /**
     * 부스터 — 광고 시각 강조 옵션
     * - 광고 보유 필수, 단독 구매 불가
     * - 결제 시 광고 잔여일 기준 일할 차감 (calcBoosterPrice)
     * - 광고 만료 시 부스터도 소멸
     */
    booster: {
        moving_icon: { '30d': 30000, '60d': 55000, '90d': 70000 }, // 제목 앞 애니메이션 아이콘
        highlighter: { '30d': 30000, '60d': 55000, '90d': 70000 }, // 제목 컬러 배경 강조
        border:      { '30d': 30000, '60d': 55000, '90d': 70000 }, // 광고 카드 테두리 효과
        pay_suffix_extra: 5000,                                     // 급여 옵션 추가 (첫 1개 무료, 추가당)
    },

    /**
     * SOS 충전 (계정 포인트)
     * - 광고 만료 무관, 계정에 포인트로 보존
     * - 추후 정의 (현재는 기존 코드 유지)
     */
    sos: {
        per_message: null as number | null,  // TODO: 별도 결정 후 채워넣기
    },

    /**
     * 점프 추가 충전 (광고별 ad_jumps)
     * - 구독 무료 분배는 P5에서 자동 (M-060)
     * - 추가 충전 패키지는 추후 정의
     */
    jump: {
        package: null as { count: number; price: number }[] | null, // TODO
    },
} as const;

/**
 * 부스터 일할 차감 계산
 *
 * 광고 잔여일이 부스터 옵션 기간보다 짧을 때만 적용.
 * 예: 60일 부스터(55,000원) 구매, 광고 30일 남음 → 27,500원
 *
 * @param basePrice       옵션 기본 가격 (예: 55000)
 * @param optionDays      옵션 기간 (예: 60)
 * @param adRemainingDays 광고 잔여일 (예: 30)
 * @returns 일할 차감 후 최종 가격
 */
export function calcBoosterPrice(
    basePrice: number,
    optionDays: number,
    adRemainingDays: number
): number {
    if (optionDays <= 0 || adRemainingDays <= 0) return 0;
    const effectiveDays = Math.min(optionDays, adRemainingDays);
    return Math.floor(basePrice * effectiveDays / optionDays);
}

/**
 * 추가광고 결제 옵션 라벨 (UI 표시용)
 */
export function getAdditionalAdLabel(key: '1m' | '3m' | '6m'): string {
    const opt = PRICING.additional_ad[key];
    const months = key === '1m' ? 1 : key === '3m' ? 3 : 6;
    const discount = opt.discount_rate > 0 ? ` (${opt.discount_rate * 100}% 할인)` : '';
    return `${months}개월 — ${opt.price.toLocaleString()}원${discount}`;
}
