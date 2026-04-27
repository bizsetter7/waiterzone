import { describe, it, expect } from 'vitest';
import { normalizeAd, normalizePayment } from './normalization';

describe('normalizeAd', () => {
    it('DB 데이터 필드(work_region 등)가 표준화된 필드(regionCity 등)로 매핑되어야 한다', () => {
        const dbAd = {
            id: 1,
            title: '테스트 공고',
            work_region: '서울',
            work_region_sub: '강남구',
            pay_type: '시급',
            pay_amount: 10000,
            options: { nickname: 'DB닉네임' }
        };
        const normalized = normalizeAd(dbAd)!;
        expect(normalized.regionCity).toBe('서울');
        expect(normalized.regionGu).toBe('강남구');
        expect(normalized.nickname).toBe('DB닉네임');
        expect(normalized.payType).toBe('시급');
    });

    it('로컬 데이터 필드(selectedIcon 등)가 그대로 유지되어야 한다', () => {
        const localAd = {
            id: 'mock_1',
            title: '로컬 공고',
            nickname: '로컬닉네임',
            selectedIcon: 5,
            selectedHighlighter: 2,
            borderOption: 'glow'
        };
        const normalized = normalizeAd(localAd)!;
        expect(normalized.nickname).toBe('로컬닉네임');
        expect(normalized.selectedIcon).toBe(5);
        expect(normalized.selectedHighlighter).toBe(2);
        expect(normalized.borderOption).toBe('glow');
    });

    it('데이터가 비어있을 경우 기본값이 설정되어야 한다', () => {
        const emptyAd = { id: 999 };
        const normalized = normalizeAd(emptyAd)!;
        expect(normalized.nickname).toBe('관리자');
        expect(normalized.regionCity).toBe('지역');
        expect(normalized.status).toBe('진행중');
        expect(normalized.payAmount).toBe(0);
    });
});

describe('normalizePayment', () => {
    it('결제 데이터와 metadata가 올바르게 adObject로 변환되어야 한다', () => {
        const payment = {
            id: 'pay_1',
            shop_id: 100,
            amount: 50000,
            metadata: {
                nickname: '메타닉네임',
                adTitle: '메타공고제목',
                options: { icon: 3 }
            }
        };
        const normalized = normalizePayment(payment, '기본이름');
        expect(normalized.nickname).toBe('메타닉네임');
        expect(normalized.price).toBe('50,000원');
        expect(normalized.adObject.title).toBe('메타공고제목');
        expect(normalized.adObject.options.icon).toBe(3);
    });
});
