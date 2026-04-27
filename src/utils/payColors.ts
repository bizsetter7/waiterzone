/**
 * 급여 배지 컬러/약어 유틸
 * 단일 소스: constants/standards.ts PAY_BADGE_STANDARDS 참조
 * ⚠️ 이 파일 단독 수정 금지 — standards.ts 수정 후 자동 반영
 */
import { PAY_BADGE_STANDARDS } from '@/constants/standards';

export const getPayColor = (payType: string = '') => {
    const type = payType.trim();

    // TC/T 우선 처리 (Orange — v2.0)
    if (type.startsWith('TC') || type === 'T') return 'bg-orange-500 text-white';

    // standards.ts PAY_BADGE_STANDARDS 순서대로 매칭
    const standard = PAY_BADGE_STANDARDS.find(s =>
        type.startsWith(s.name) || type.startsWith(s.abbr) || s.id === type
    );
    if (standard) return `${standard.tw} text-white`;

    return 'bg-gray-400 text-white'; // 협의 / 기본값
};

export const getPayAbbreviation = (payType: string = '') => {
    if (!payType) return '협';
    const type = payType.trim();
    if (type.startsWith('TC') || type === 'T') return 'T';
    if (type.includes('시급') || type === '시') return '시';
    if (type.includes('일급') || type.includes('일')) return '일';
    if (type.includes('주급') || type.includes('주')) return '주';
    if (type.includes('월급') || type.includes('월')) return '월';
    if (type.includes('연봉') || type.includes('연')) return '연';
    if (type.includes('건별') || type.includes('건당') || type.includes('건')) return '건';
    if (type.includes('협의') || type.includes('협')) return '협';
    // [Fix] 플레이스홀더가 들어온 경우 무작정 첫 글자('급')를 따지 않고 '협'으로 안전하게 매칭
    if (type.includes('선택') || type.includes('종류')) return '협';
    
    return type.substring(0, 1) || '협';
};
