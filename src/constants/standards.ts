/**
 * 플랫폼 통합 기술 표준 (Single Source of Truth)
 * 모든 UI 구성 요소 및 서버 유틸리티는 이 상수를 참조하여 정합성을 유지합니다.
 */

// 1. 광고 등급 비주얼 표준 (Ad Tier Standards) — 야사장 구독 플랜 기준 (2026-05-04 v2.1, P2 동기화)
// 신규 광고는 야사장 구독 플랜만 사용. legacy 등급(grand/recommended/native)은 구 데이터 호환용
export const AD_TIER_STANDARDS = [
    // ── 현행 야사장 구독 플랜 (active) ──
    { name: '프리미엄 (Premium)', id: 'p2', altId: 'premium',  tw: 'bg-red-600',     hex: '#DC2626', legacy: false },
    { name: '디럭스 (Deluxe)',    id: 'p3', altId: 'deluxe',   tw: 'bg-blue-600',    hex: '#2563EB', legacy: false },
    { name: '스페셜 (Special)',   id: 'p4', altId: 'special',  tw: 'bg-emerald-600', hex: '#059669', legacy: false },
    { name: '스탠다드 (Standard)',id: 'p6', altId: 'standard', tw: 'bg-slate-600',   hex: '#475569', legacy: false },
    { name: '베이직 (Basic)',     id: 'p7', altId: 'basic',    tw: 'bg-sky-600',     hex: '#0284C7', legacy: false },
    // ── 구 직접입점 등급 (legacy — 신규 사용 금지, 기존 DB 데이터 호환용) ──
    { name: '그랜드 [legacy]',    id: 'p1', altId: 'grand',       tw: 'bg-amber-500',  hex: '#F59E0B', legacy: true },
    { name: '급구·추천 [legacy]', id: 'p5', altId: 'recommended', tw: 'bg-purple-600', hex: '#9333EA', legacy: true },
    { name: '네이티브 [legacy]',  id: 'p6_native', altId: 'native', tw: 'bg-zinc-500', hex: '#71717A', legacy: true },
];

// 2. 급여 배지 약어 및 컬러 표준 (Pay Badge Standards v2.1 — 2026-05-04, P2 동기화)
// ⚠️ PROTECTED: 색상은 대표님 확정 규칙. abbr는 풀네임 표기 (대표님 승인 2026-05-04)
export const PAY_BADGE_STANDARDS = [
    { name: '시급', id: 'hourly',  abbr: '시급', hex: '#06B6D4', tw: 'bg-cyan-500'    }, // 🩵 Cyan
    { name: '일급', id: 'daily',   abbr: '일급', hex: '#3B82F6', tw: 'bg-blue-500'    }, // 🔵 Blue
    { name: '주급', id: 'weekly',  abbr: '주급', hex: '#22C55E', tw: 'bg-green-500'   }, // 🟢 Green
    { name: '월급', id: 'monthly', abbr: '월급', hex: '#A855F7', tw: 'bg-purple-500'  }, // 🟣 Purple
    { name: '연봉', id: 'yearly',  abbr: '연봉', hex: '#EF4444', tw: 'bg-red-500'     }, // 🔴 Red
    { name: 'TC',   id: 'tc',      abbr: 'TC',   hex: '#F97316', tw: 'bg-orange-500'  }, // 🟠 Orange
    { name: '건별', id: 'per_job', abbr: '건별', hex: '#64748B', tw: 'bg-slate-500'   }, // ⬛ Slate
    { name: '협의', id: 'nego',    abbr: '협의', hex: '#9CA3AF', tw: 'bg-gray-400'    }, // ⬜ Gray
];

// 3. 유료 강조 옵션 표준 (Paid Option Standards)
export const PAID_OPTION_STANDARDS = [
    { name: '아이콘', abbr: '아', tw: 'bg-indigo-500', key: 'selectedIcon', dbKey: 'icon' },
    { name: '형광펜', abbr: '형', tw: 'bg-gray-600', key: 'selectedHighlighter', dbKey: 'highlighter' },
    { name: '테두리', abbr: '테', tw: 'bg-blue-500', key: 'borderOption', dbKey: 'border' },
    { name: '급여수식어', abbr: '급', tw: 'bg-blue-500', key: 'paySuffixes', dbKey: 'pay_suffixes' },
];

// 4. 데이터 정규화 표준 (Normalization Standards)
export const NORMALIZATION_STANDARDS = [
    { target: '상세직종', from: '정보없음 / NULL', to: '일반', reason: 'UX 가용성 확보 및 미려한 텍스트 유지', checkKey: 'categorySub' },
    { target: '닉네임', from: 'NULL / 공백', to: '상호명 (Fallback)', reason: '게시자 식별성 및 신뢰도 보장', checkKey: 'nickname' },
    { target: '강조 옵션', from: 'NULL / 미정', to: 'none / []', reason: '렌더링 에러 방지 및 기본값 고정', checkKey: 'options' },
    { target: '급여 타입', from: 'NULL', to: '협의', reason: '데이터 무결성(SYSTEM_MAPPING) 준수', checkKey: 'payType' },
];

// 5. 데이터 맵핑 딕셔너리 (Data Mapping Standards)
export const DATA_MAPPING_STANDARDS = [
    { item: '공고 제목', db: 'title', ui: 'title', required: true },
    { item: '상호명', db: 'name', ui: 'shopName', required: true },
    { item: '닉네임', db: 'nickname', ui: 'nickname', required: true },
    { item: '업종 정보', db: 'category', ui: 'industryMain', required: true },
    { item: '상세 직종', db: 'category_sub', ui: 'categorySub', required: false },
    { item: '지역(시)', db: 'region', ui: 'regionCity', required: true },
    { item: '지역(구)', db: 'work_region_sub', ui: 'regionGu', required: true },
    { item: '담당자명', db: 'manager_name', ui: 'managerName', required: true },
    { item: '담당자번호', db: 'manager_phone', ui: 'managerPhone', required: true },
    { item: '카카오', db: 'kakao', ui: 'messengers.kakao', required: false },
    { item: '텔레그램', db: 'telegram', ui: 'messengers.telegram', required: false },
    { item: '급여 타입', db: 'pay_type', ui: 'payType', required: true },
    { item: '급여 금액', db: 'pay_amount', ui: 'payAmount', required: true },
    { item: '광고 등급', db: 'tier', ui: 'selectedAdProduct', required: true },
    { item: '결제 금액', db: 'ad_price', ui: 'totalAmount', required: true },
    { item: '공고 본문', db: 'content', ui: 'editorHtml', required: true },
    { item: '상세 주소', db: 'profiles.address', ui: 'publisherAddress', required: false },
];
