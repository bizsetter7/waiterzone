import { JOB_CATEGORY_MAP } from '@/constants/jobs';
import { REGIONS_MAP } from '@/constants/regions';
import {
    PAY_TYPES as GLOBAL_PAY_TYPES,
    PAY_SUFFIX_OPTIONS as GLOBAL_PAY_SUFFIX,
    CONVENIENCE_KEYWORDS as GLOBAL_CONVENIENCE,
    AGES as GLOBAL_AGES,
    TEXT_COLORS as GLOBAL_TEXT_COLORS,
    BG_COLORS as GLOBAL_BG_COLORS,
    ICONS as GLOBAL_ICONS,
    HIGHLIGHTERS as GLOBAL_HIGHLIGHTERS
} from '@/constants/job-options';

// 기존 인터페이스 호환을 위해 명칭 맵핑
export const INDUSTRY_DATA = JOB_CATEGORY_MAP;

export const REGION_DATA: Record<string, string[]> = REGIONS_MAP;

export const AGES = GLOBAL_AGES;

export const PAY_TYPES = GLOBAL_PAY_TYPES;

// 단일 출처(job-options.ts) 사용 — 중복 배열 제거
export const PAY_SUFFIX_OPTIONS = GLOBAL_PAY_SUFFIX;
export const STEP4_CONVENIENCE_KEYWORDS = GLOBAL_CONVENIENCE;

export const FONT_DISPLAY_NAMES: { [key: string]: string } = {
    'Pretendard': '프리텐다드 (기본)',
    'Nanum Gothic': '나눔고딕',
    'Nanum Myeongjo': '나눔명조',
    'Hahmlet': '함렛 (궁서체)',
    'Gowun Batang': '고운바탕 (바탕체)',
    'Arial': 'Arial (영문)',
    'system-ui': '시스템 기본'
};

export const FONT_SIZES = ['12px', '14px', '16px', '18px', '20px', '24px', '30px', '36px', '48px'];

export const TEXT_COLORS = GLOBAL_TEXT_COLORS;

export const BG_COLORS = GLOBAL_BG_COLORS;

/**
 * jumpManual : 24시간(KST) 기준 수동 점프 최대 횟수
 * jumpAuto   : 24시간(KST) 기준 자동 점프 최대 횟수 (0 = 미지원)
 * jumpAutoIntervalHours : 자동 점프 실행 간격(시간) — Vercel cron 기준
 */
export const DETAILED_PRICING = [
    { id: 'p1', altId: 'grand',       code: 'T1', tier: '그랜드',   eng: '(Grand)',      name: '타입1. 그랜드 (Grand)',      color: 'text-amber-600',  desc: '메인 최상단 노출 및\n압도적 광고 효과',         d30: 350000, d60: 630000, d90: 840000, isMain: true,  jumpManual: 15, jumpAuto: 8, jumpAutoIntervalHours: 3 },
    { id: 'p2', altId: 'premium',     code: 'T2', tier: '프리미엄', eng: '(Premium)',    name: '타입2. 프리미엄 (Premium)',  color: 'text-red-600',    desc: '상단 시선 집중\n높은 효율성 노출',             d30: 200000, d60: 360000, d90: 480000, isMain: true,  jumpManual: 15, jumpAuto: 8, jumpAutoIntervalHours: 3 },
    { id: 'p3', altId: 'deluxe',      code: 'T3', tier: '디럭스',   eng: '(Deluxe)',     name: '타입3. 디럭스 (Deluxe)',     color: 'text-blue-600',   desc: '타겟 지역 집중\n전략적 배너 노출',             d30: 180000, d60: 324000, d90: 432000, isMain: true,  jumpManual: 10, jumpAuto: 6, jumpAutoIntervalHours: 4 },
    { id: 'p4', altId: 'special',     code: 'T4', tier: '스페셜',   eng: '(Special)',    name: '타입4. 스페셜 (Special)',    color: 'text-emerald-600',desc: '가성비 최우선\n실속형 배너 노출',             d30: 150000, d60: 270000, d90: 360000, isMain: true,  jumpManual: 10, jumpAuto: 6, jumpAutoIntervalHours: 4 },
    { id: 'p5', altId: 'recommended', code: 'T5', tier: '급구/추천',eng: '(Urgent/Rec)', name: '타입5. 급구/추천 (Urgent)',  color: 'text-purple-600', desc: '급구/추천 배지 노출로\n주목도 실속형',         d30: 120000, d60: 216000, d90: 288000, isMain: true,  jumpManual: 8,  jumpAuto: 3, jumpAutoIntervalHours: 8 },
    { id: 'p6', altId: 'native',      code: 'T6', tier: '네이티브', eng: '(Native)',     name: '타입6. 네이티브 (Native)',   color: 'text-slate-600',  desc: '리스트 광고에 배치\n랜덤 상단노출효과',          d30: 100000, d60: 180000, d90: 240000, isMain: true,  jumpManual: 6,  jumpAuto: 0, jumpAutoIntervalHours: 0 },
    { id: 'p7', altId: 'basic',       code: 'T7', tier: '베이직',   eng: '(Basic)',      name: '타입7. 베이직/줄광고',        color: 'text-slate-400',  desc: '최신 구인정보 리스트\n(실속형 구인 상품)',        d30: 60000,  d60: 100000, d90: 140000, isMain: true,  jumpManual: 5,  jumpAuto: 0, jumpAutoIntervalHours: 0 },
    { id: 'p7e', altId: 'event_basic', code: 'T7', tier: '베이직',  eng: '(Basic)',      name: '오픈기념 무료 베이직',          color: 'text-slate-400',  desc: '최신 구인정보 리스트\n(오픈기념 선착순 무료)',   d30: 0,      d60: 100000, d90: 140000, isMain: false, jumpManual: 5,  jumpAuto: 0, jumpAutoIntervalHours: 0 },
    { id: 'bold',                      code: 'Opt',tier: '굵은글씨', eng: '',             name: '기타-강조옵션 (Emphasis)',   color: 'text-black',      desc: '아이콘/형광펜\n테두리/급여추가\n(주목도 200% 상승)', d30: 30000,  d60: 55000,  d90: 70000,  isMain: false, jumpManual: 0,  jumpAuto: 0, jumpAutoIntervalHours: 0 },
];

/**
 * productType (p1~p7, altId, code 등) → 점프 설정 반환
 * 매핑 실패 시 기본값 { manual: 5, auto: 0, autoIntervalHours: 0 } 반환
 */
export const getJumpConfig = (productType: string): { manual: number; auto: number; autoIntervalHours: number } => {
    const key = (productType || '').toLowerCase();
    const found = DETAILED_PRICING.find(p =>
        p.id === key ||
        (p.altId && p.altId === key) ||
        (p.code && p.code.toLowerCase() === key)
    );
    return {
        manual: found?.jumpManual ?? 5,
        auto:   found?.jumpAuto   ?? 0,
        autoIntervalHours: found?.jumpAutoIntervalHours ?? 0,
    };
};

export const ICONS = GLOBAL_ICONS;
export const HIGHLIGHTERS = GLOBAL_HIGHLIGHTERS;

