/**
 * 점프 시스템 유틸리티 (Migration 10 — 2026-04-30)
 */

/**
 * 광고가 최근 5분 내에 점프됐는지 확인 → "🚀 방금 점프" 배지 표시 여부
 * shops.last_jumped_at 기준
 */
export function isRecentlyJumped(lastJumpedAt?: string | null): boolean {
    if (!lastJumpedAt) return false;
    const last = new Date(lastJumpedAt).getTime();
    if (isNaN(last)) return false;
    const diffMs = Date.now() - last;
    return diffMs >= 0 && diffMs < 5 * 60 * 1000; // 5분 윈도우
}

/**
 * 점프 잔액 합산 (UI 표시용)
 */
export interface JumpBalance {
    subscription_balance?: number | null;
    package_balance?: number | null;
    auto_remaining_today?: number | null;
}

export function totalJumpBalance(j: JumpBalance | null | undefined): number {
    if (!j) return 0;
    return (j.subscription_balance ?? 0) + (j.package_balance ?? 0) + (j.auto_remaining_today ?? 0);
}

/**
 * 야사장 plan별 자동 점프 횟수 (P2/P9/P10 cron 공유)
 */
export const PLAN_AUTO_JUMP_DAILY: Record<string, number> = {
    basic:    0,
    standard: 0,
    special:  3,
    deluxe:   6,
    premium:  8,
};

/**
 * 야사장 plan별 30일 주기 수동 점프 무료 적립 횟수
 */
export const PLAN_MANUAL_JUMP_RESET: Record<string, number> = {
    basic:    0,
    standard: 0,
    special:  10,
    deluxe:   30,
    premium:  30, // 즉시 30 + 매일 +1 (cron에서 처리)
};
