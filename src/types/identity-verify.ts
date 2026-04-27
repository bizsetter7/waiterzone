/**
 * 본인인증 공통 인터페이스
 * 지원 제공업체: Danal (다날)
 * 연동 방식: 팝업/리다이렉트 방식 공통 추상화
 */

export type IdentityVerifyProvider = 'danal';

export interface IdentityVerifyRequest {
    /** 인증 제공업체 */
    provider: IdentityVerifyProvider;
    /** 인증 완료 후 돌아올 콜백 URL (서버사이드 처리) */
    returnUrl: string;
    /** 인증 실패/취소 시 돌아올 URL */
    errorUrl: string;
    /** 팝업 모드 여부 (false 시 리다이렉트) */
    popup?: boolean;
}

export interface IdentityVerifyResult {
    success: boolean;
    provider: IdentityVerifyProvider;
    /** 인증된 실명 */
    name?: string;
    /** 마스킹 처리된 생년월일 (YYYYMM**) */
    birthdate?: string;
    /** 마스킹 처리된 휴대폰 (010-****-1234) */
    phone?: string;
    /** 성별 코드 (M/F) */
    gender?: string;
    /** 내/외국인 구분 (local/foreign) */
    nationality?: 'local' | 'foreign';
    /** 개인 식별 고유값 (상점간 불변) */
    ci?: string;
    /** 상점별 식별 고유값 (상점마다 다름) */
    di?: string;
    /** 오류 코드 (실패 시) */
    errorCode?: string;
    errorMessage?: string;
}

/** 서버사이드 토큰 생성 요청 */
export interface IdentityVerifyTokenRequest {
    provider: IdentityVerifyProvider;
    returnUrl: string;
    errorUrl: string;
}

/** 서버사이드 토큰 생성 응답 */
export interface IdentityVerifyTokenResponse {
    /** 팝업/폼에 삽입할 암호화 토큰 */
    encryptedToken: string;
    /** 제공업체 인증 URL */
    authUrl: string;
    /** 토큰 유효시간 (초) */
    expiresIn: number;
}
