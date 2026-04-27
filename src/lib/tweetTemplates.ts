/**
 * 트윗 템플릿 엔진 (웨이터존)
 */

import { buildHashtags, formatHashtags } from './snsHashtags';
import { slugify } from '@/utils/shopUtils';

const BASE_URL = 'https://waiterzone.kr';

// ─── TYPE_A: 신규 구인 공고 알림 ─────────────────────────────────────────────

export interface NewJobTweetData {
    shopId:    string | number;
    name:      string;
    region:    string;          
    regionSlug:string;          
    workType:  string;
    pay:       string | number;
    payType:   string;          
    conditions:string[];        
}

export function buildNewJobTweet(data: NewJobTweetData): string {
    const { shopId, name, regionSlug, workType, pay, payType, conditions } = data;

    const payDisplay = String(pay) === '면접후결정'
        ? '💬 면접 후 결정'
        : `💰 ${payType} ${Number(pay).toLocaleString()}원`;

    const condStr = conditions.slice(0, 2).join(' · ');
    const hashtags = formatHashtags(buildHashtags(regionSlug, workType));
    const url = `${BASE_URL}/waiter/${encodeURIComponent(regionSlug)}/${shopId}`;

    const lines = [
        `🆕 ${workType} 신규 구인`,
        `📍 ${name}`,
        payDisplay,
        condStr ? `✅ ${condStr}` : '',
        '',
        `▶ 상세 보기 ${url}`,
        '',
        hashtags,
    ].filter(l => l !== undefined);

    return lines.join('\n');
}

// ─── TYPE_B: 지역 시세 정보 ───────────────────────────────────────────────────

export interface SalaryInfoTweetData {
    regionSlug:  string;
    regionName:  string;
    workType:    string;
    avgPay:      number;
    maxPay:      number;
    shopCount:   number;
    payType:     string;
}

export function buildSalaryInfoTweet(data: SalaryInfoTweetData): string {
    const { regionSlug, regionName, workType, avgPay, maxPay, shopCount, payType } = data;

    const hashtags = formatHashtags(buildHashtags(regionSlug, workType));
    const url = `${BASE_URL}/waiter/${encodeURIComponent(regionSlug)}/${encodeURIComponent(workType)}`;

    const lines = [
        `📊 ${regionName} ${workType} 이번 주 시세`,
        ``,
        `평균 ${payType}: ${avgPay.toLocaleString()}원`,
        `최고 ${payType}: ${maxPay.toLocaleString()}원`,
        `구인 업소: ${shopCount}개`,
        ``,
        `💡 전체 보기 ${url}`,
        ``,
        hashtags,
    ];

    return lines.join('\n');
}

// ─── TYPE_C: 정보성 가이드 콘텐츠 ────────────────────────────────────────────

export interface GuideTweetData {
    workType:   string;
    regionSlug: string;
    regionName: string;
    tip:        string;   
    guideUrl?:  string;   
}

const GUIDE_TIPS: Record<string, string[]> = {
    '룸살롱':    [
        '웨이터 면접 전 기본급과 팁 정산 방식을 반드시 확인하세요',
        '나이트나 룸살롱 웨이터는 봉사료 정산 비율이 수입에 중요합니다',
        '업소 분위기와 주 고객층을 파악하면 팁 수입을 높일 수 있습니다',
    ],
    '가라오케':    [
        '가라오케 웨이터는 서비스 마인드가 수입의 핵심입니다',
        '단체 예약이 많은 업소는 고수입 기회가 많습니다',
    ],
    '클럽':  [
        '클럽 웨이터는 체력이 중요하며, 주말 수입이 평일보다 월등히 높습니다',
        '인맥 관리가 예약으로 이어져 수입이 증가합니다',
    ],
    '나이트':    [
        '나이트 웨이터는 실적제가 많으므로 본인의 영업 능력이 중요합니다',
    ],
    '바':  [
        '바 웨이터는 차분한 응대와 대화 능력이 요구됩니다',
    ],
};

export function buildGuideTweet(data: GuideTweetData): string {
    const { workType, regionSlug, regionName, guideUrl } = data;

    const tips   = GUIDE_TIPS[workType] ?? ['업소 면접 전 계약 조건을 반드시 확인하세요'];
    const dayIdx = new Date().getDate() % tips.length;
    const tip    = data.tip || tips[dayIdx];

    const hashtags = formatHashtags(buildHashtags(regionSlug, workType));
    const url      = guideUrl ?? `${BASE_URL}/waiter/${encodeURIComponent(regionSlug)}/${encodeURIComponent(workType)}`;

    const lines = [
        `💡 ${regionName} ${workType} 꿀팁`,
        ``,
        tip,
        ``,
        `📖 ${workType} 가이드 전체 보기`,
        url,
        ``,
        hashtags,
    ];

    return lines.join('\n');
}

export type TweetType = 'new_job' | 'salary_info' | 'guide' | 'manual';

export function getTweetTypeByHour(): TweetType {
    const kstHour = (new Date().getUTCHours() + 9) % 24;
    if (kstHour >= 7  && kstHour < 10)  return 'salary_info';  
    if (kstHour >= 11 && kstHour < 14)  return 'new_job';      
    if (kstHour >= 17 && kstHour < 20)  return 'guide';        
    if (kstHour >= 21 && kstHour < 24)  return 'new_job';      
    return 'guide'; 
}

const REGION_ROTATION = [
    { slug: '서울-강남구',    name: '강남' },
    { slug: '부산-해운대구',  name: '해운대' },
    { slug: '대전-유성구',    name: '대전 유성' },
    { slug: '경기-수원시',    name: '수원' },
    { slug: '대구-수성구',    name: '대구 수성' },
    { slug: '광주-서구',      name: '광주 상무' },
    { slug: '서울-마포구',    name: '홍대' },
    { slug: '서울-영등포구',  name: '영등포' },
    { slug: '경기-성남시',    name: '분당·성남' },
    { slug: '부산-부산진구',  name: '서면' },
    { slug: '경기-부천시',    name: '부천' },
    { slug: '충남-천안시',    name: '천안' },
    { slug: '충북-청주시',    name: '청주' },
    { slug: '전북-전주시',    name: '전주' },
];

export function getTodayRegion(): { slug: string; name: string } {
    const dayOfWeek = new Date().getDay();
    return REGION_ROTATION[dayOfWeek % REGION_ROTATION.length];
}

const WORKTYPE_ROTATION = ['룸살롱', '가라오케', '클럽', '나이트', '바', '기타'];

export function getTodayWorkType(): string {
    const dayOfMonth = new Date().getDate();
    return WORKTYPE_ROTATION[(dayOfMonth - 1) % WORKTYPE_ROTATION.length];
}
