export interface Shop {
    name: string;
    nickname?: string;
    realName?: string;
    managerName?: string; // Business Owner Name
    title?: string;
    region: string;
    phone: string;
    kakao: string;
    telegram: string;
    pay: string;
    payType?: string;
    workType: string;
    // [Added] Missing properties for UI
    businessAddress?: string; // Business Registration Address
    workTime?: string;
    gender?: string;
    age?: string;
    keywords?: string[];
    url: string;
    site: string;
    id: string;
    adNo?: number; // Unique Ad Number for easy identification
    is_placeholder: boolean;
    is_premium?: boolean;
    is_verified?: boolean;
    recommended?: boolean;
    tier?: 'grand' | 'premium' | 'deluxe' | 'special' | 'urgent' | 'recommended' | 'native' | 'common' | 'basic'
          | 'p1' | 'p2' | 'p3' | 'p4' | 'p5' | 'p6' | 'p7'; // DB 실등록 ID 포맷 (2026-03-22)
    color?: string;
    updatedAt?: string;
    date?: string;
    description?: string;
    options?: {
        blink?: boolean;
        bold?: boolean;
        color?: string;
        icons?: string[];
        mediaUrl?: string;
        paySuffixes?: string[];
        pay_suffixes?: string[];
        icon?: number | string;
        icon_period?: number;
        highlighter?: number | string;
        highlighter_period?: number;
        keywords?: string[];
        border?: 'none' | 'color' | 'glow' | 'sparkle' | 'rainbow';
        border_period?: number;
        effect?: 'neon' | 'none' | 'rainbow' | 'bounce' | 'disco' | 'flash';
        product_type?: string;
        product_period?: number;
        regionCity?: string;
        regionGu?: string;
        shopName?: string;
        category?: string;
        industrySub?: string;
        categorySub?: string;
        workType?: string;
        managerName?: string;
        managerPhone?: string;
        payType?: string;
        payAmount?: number;
        editorHtml?: string;
        content?: string;
        deadline?: string;
        status?: string;
        ad_price?: number;
        ageMin?: number;
        ageMax?: number;
        addressDetail?: string;
        businessAddress?: string;
        approved_at?: string;
        edit_count?: number;
        last_edit_month?: string;
        [key: string]: any; // 확장 필드 허용 (DB 스냅샷 폴백용)
    };
    // [Added] Admin/Ad Management
    status?: 'pending' | 'approved' | 'rejected' | 'active' | 'expired';
    category?: string;
    shopName?: string;
    ownerId?: string;
    edits?: number;
    adStartDate?: string;
    adEndDate?: string;
    adDuration?: 30 | 60 | 90;
    adPrice?: number;
    price?: number; // Legacy/Fallback
    lat?: number;
    lng?: number;
    // [Added] External Scraping Source Info
    sourceUrl?: string;
    sourceSite?: string;
    // [Added] Detailed Ad Info
    user_id?: string;
    regionCity?: string;
    regionGu?: string;
    productType?: string;
    ad_type?: string;
    selectedIcon?: string | number;
    selectedHighlighter?: string | number;
    paySuffixes?: string[];
    payStatus?: string;
    rejection_history?: { reason: string; date: string; rejectedBy?: string }[];
    edit_count?: number;
    approved_at?: string;
    created_at?: string;
    deadline?: string;
    pay_amount?: number;
    work_region_sub?: string;
    category_sub?: string;
    ad_price?: number;
    city?: string;
    district?: string;
    content?: string;
    media_url?: string;     // DB root 컬럼 (snake_case)
    mediaUrl?: string;      // options 스냅샷 / normalizeAd camelCase
    manager_phone?: string; // DB root 컬럼
    manager_name?: string;  // DB root 컬럼
    pay_type?: string;      // DB root 컬럼
    work_type?: string;     // DB root 컬럼 (= category_sub 동의어)
    isMock?: boolean;       // 목업 광고 여부
    // 배너 슬롯 (migration 06)
    banner_position?: 'left' | 'right' | 'both' | 'inner' | null;
    banner_image_url?: string | null;
    banner_media_type?: 'image' | 'gif' | 'video';
    banner_status?: 'pending_banner' | 'approved' | 'rejected' | null;
    // 점프 시스템 (migration 10) — "🚀 방금 점프" 배지 (5분 윈도우)
    last_jumped_at?: string | null;
}
