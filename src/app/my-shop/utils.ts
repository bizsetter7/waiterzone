
// [2026-03-27] Normalization 함수들을 utils/normalization.ts로 통합
// 여기서는 다른 유틸리티만 관리합니다.

// --- Helper Functions ---

/** 사업자등록번호 포맷터 (000-00-00000). MemberInfoForm, Step1BasicInfo 공통 사용 */
export function formatBizNumber(value: string): string {
    const n = value.replace(/\D/g, '').slice(0, 10);
    if (n.length <= 3) return n;
    if (n.length <= 5) return `${n.slice(0, 3)}-${n.slice(3)}`;
    return `${n.slice(0, 3)}-${n.slice(3, 5)}-${n.slice(5)}`;
}

/** Safari/iOS 날짜 파싱 호환 헬퍼 (SQL timestamp space→T 변환) */
export const safeParseDate = (dateStr: string | null | undefined): Date | null => {
    if (!dateStr) return null;
    let d = new Date(dateStr);
    if (!isNaN(d.getTime())) return d;
    d = new Date(dateStr.replace(' ', 'T'));
    if (!isNaN(d.getTime())) return d;
    return null;
};
