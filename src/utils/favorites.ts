/**
 * Favorites (스크랩) 유틸리티
 * - localStorage 'favorites' 키: 스크랩된 shop ID 배열
 * - localStorage 'favorites_timestamps' 키: { [shopId]: timestamp(ms) }
 * - localStorage 'favorites_snapshots' 키: { [shopId]: 공고 핵심 데이터 }
 * - 30일 초과 항목은 자동 만료/삭제
 */

const FAVORITES_KEY = 'favorites';
const TIMESTAMPS_KEY = 'favorites_timestamps';
const SNAPSHOTS_KEY = 'favorites_snapshots';
export const SCRAP_EXPIRE_DAYS = 30;
const EXPIRE_MS = SCRAP_EXPIRE_DAYS * 24 * 60 * 60 * 1000;

/** 현재 유효한 스크랩 ID 목록 반환 (만료된 항목 자동 제거) */
export function getFavorites(): string[] {
    if (typeof window === 'undefined') return [];
    try {
        const ids: string[] = JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]');
        const timestamps: Record<string, number> = JSON.parse(localStorage.getItem(TIMESTAMPS_KEY) || '{}');
        const now = Date.now();

        // 만료되지 않은 항목만 필터 (타임스탬프 없으면 유효로 처리 — 기존 데이터 호환)
        const validIds = ids.filter(id => {
            const ts = timestamps[id];
            return !ts || (now - ts) < EXPIRE_MS;
        });

        // 만료 항목이 있으면 자동 정리
        if (validIds.length !== ids.length) {
            const cleanTs: Record<string, number> = {};
            validIds.forEach(id => { if (timestamps[id]) cleanTs[id] = timestamps[id]; });
            localStorage.setItem(FAVORITES_KEY, JSON.stringify(validIds));
            localStorage.setItem(TIMESTAMPS_KEY, JSON.stringify(cleanTs));

            // 만료된 ID의 스냅샷도 정리
            try {
                const snapshots = JSON.parse(localStorage.getItem(SNAPSHOTS_KEY) || '{}');
                const expiredIds = ids.filter(id => !validIds.includes(id));
                expiredIds.forEach(id => delete snapshots[id]);
                localStorage.setItem(SNAPSHOTS_KEY, JSON.stringify(snapshots));
            } catch { /* ignore */ }
        }

        return validIds;
    } catch { return []; }
}

/** 스크랩 토글 — 추가 시 타임스탬프 기록, 제거 시 삭제. 새 배열 반환 */
export function toggleFavorite(id: string, current: string[]): string[] {
    try {
        const timestamps: Record<string, number> = JSON.parse(localStorage.getItem(TIMESTAMPS_KEY) || '{}');
        let newFavs: string[];

        if (current.includes(id)) {
            newFavs = current.filter(fid => fid !== id);
            delete timestamps[id];
        } else {
            newFavs = [...current, id];
            timestamps[id] = Date.now();
        }

        localStorage.setItem(FAVORITES_KEY, JSON.stringify(newFavs));
        localStorage.setItem(TIMESTAMPS_KEY, JSON.stringify(timestamps));
        return newFavs;
    } catch { return current; }
}

/** 스크랩 시 공고 핵심 데이터를 localStorage에 캐시 (Supabase 미존재 공고 대응) */
export function saveShopSnapshot(id: string, shop: any): void {
    if (typeof window === 'undefined') return;
    try {
        const snapshots = JSON.parse(localStorage.getItem(SNAPSHOTS_KEY) || '{}');
        snapshots[id] = {
            id: shop.id,
            name: shop.name || shop.shop_name || '',
            title: shop.title || '',
            region: shop.region || shop.work_region || '',
            workType: shop.workType || shop.work_type || shop.category || '',
            pay: shop.pay || String(shop.pay_amount || shop.options?.payAmount || 0),
            tier: shop.tier || '',
            options: shop.options || {},
            adNo: shop.adNo,
            status: shop.status || 'active',
        };
        localStorage.setItem(SNAPSHOTS_KEY, JSON.stringify(snapshots));
    } catch { /* ignore */ }
}

/** 스냅샷으로 저장된 전체 공고 데이터 반환 */
export function getAllShopSnapshots(): Record<string, any> {
    if (typeof window === 'undefined') return {};
    try {
        return JSON.parse(localStorage.getItem(SNAPSHOTS_KEY) || '{}');
    } catch { return {}; }
}

/** 특정 shopId의 스크랩 등록일 반환 (없으면 null) */
export function getScrapDate(id: string): Date | null {
    try {
        const timestamps: Record<string, number> = JSON.parse(localStorage.getItem(TIMESTAMPS_KEY) || '{}');
        return timestamps[id] ? new Date(timestamps[id]) : null;
    } catch { return null; }
}

/** 특정 shopId의 만료까지 남은 일수 반환 (타임스탬프 없으면 null) */
export function getDaysUntilExpiry(id: string): number | null {
    try {
        const timestamps: Record<string, number> = JSON.parse(localStorage.getItem(TIMESTAMPS_KEY) || '{}');
        if (!timestamps[id]) return null;
        const remaining = EXPIRE_MS - (Date.now() - timestamps[id]);
        return Math.max(0, Math.ceil(remaining / (24 * 60 * 60 * 1000)));
    } catch { return null; }
}
