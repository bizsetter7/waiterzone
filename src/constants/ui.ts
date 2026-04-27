/**
 * UI 레이어 관리 시스템 (Centralized Z-Index Standards)
 * 
 * [규칙]
 * 1. 모든 z-index는 이 상수를 통해서만 관리합니다.
 * 2. 새로운 레이어가 필요할 경우 이 파일에 정의 후 사용합니다.
 * 3. 팝업(MODAL)이 뜰 때 헤더와 사이드바를 확실히 덮어야 합니다.
 */

export const UI_Z_INDEX = {
    // 기본 콘텐츠
    BASE: 0,
    CONTENT: 10,
    
    // 부유형 요소
    STICKY: 50,
    NAV_BOTTOM: 100,
    FLOATING: 20500,  // 헤더(10000)·사이드바(10001)·모달(20000) 위에 표시 (SOS 알림팝업 등)
    
    // 레이아웃 프레임 (Core Layout)
    HEADER: 10000,
    SIDEBAR: 10001,
    
    // 최상위 모달 및 레이어 (System Layer)
    VERIFICATION_GATE: 11000,
    MODAL: 20000,
    SYSTEM_OVERLAY: 99999,
} as const;

export type UIZIndexType = typeof UI_Z_INDEX;
