/**
 * P2 웨이터존 공지사항 상수
 * 새 공지 추가 시 배열 맨 앞에 삽입 → UnifiedJobListing에서 자동으로 최신 공지 표시
 * 향후 Supabase community_posts 연동 시 이 파일 대신 API 호출로 교체 예정
 */
export interface NoticeItem {
    id: number;
    badge: '공지' | '중요' | '안내' | '점검';
    title: string;
    date: string;       // YYYY-MM-DD
    link?: string;      // 클릭 시 이동할 경로 (기본값: /customer-center?tab=notice)
}

export const NOTICES: NoticeItem[] = [
    {
        id: 6,
        badge: '공지',
        title: '[이벤트] 웨이터존 오픈기념 상생지원 이벤트 및 이용안내',
        date: '2026-04-02',
        link: '/customer-center?tab=notice',
    },
    {
        id: 5,
        badge: '공지',
        title: '[안내] 프리미엄 광고 "Grand Tier" 서비스 개편 및 혜택 안내',
        date: '2026-03-21',
        link: '/customer-center?tab=notice',
    },
    {
        id: 4,
        badge: '공지',
        title: '[공지] PC 사이드배너 광고 시스템 정식 도입 안내',
        date: '2026-03-15',
        link: '/customer-center?tab=notice',
    },
    {
        id: 3,
        badge: '중요',
        title: '[중요] 카드 결제 서비스 종료 안내',
        date: '2026-03-10',
        link: '/notice/card-payment-termination',
    },
    {
        id: 2,
        badge: '공지',
        title: '[공지] 서비스 전면 개편 및 광고 상품 단가 확정 안내',
        date: '2026-03-05',
        link: '/customer-center?tab=notice',
    },
    {
        id: 1,
        badge: '안내',
        title: '[안내] 구인사기 피해 예방 수칙 안내',
        date: '2026-02-20',
        link: '/notice/job-scam',
    },
];

/** 최신 공지 1개 반환 (UnifiedJobListing Announcement Bar 용) */
export const LATEST_NOTICE = NOTICES[0];
