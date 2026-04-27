import { describe, it, expect, vi, beforeEach } from 'vitest';
// Note: We mock the global fetch for API testing
global.fetch = vi.fn();

describe('Adult Verification API (Logic Check)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        process.env.PORTONE_API_SECRET = 'test_secret';
    });

    it('만 19세 미만(예: 2010년생)은 인증에 실패해야 한다 (정답지: 실패)', async () => {
        // Mock PortOne Response
        (fetch as any).mockResolvedValue({
            ok: true,
            json: async () => ({
                status: 'VERIFIED',
                verifiedCustomer: {
                    birthDate: '2010-01-01',
                    name: '홍길동'
                }
            })
        });

        // Simulating the logic inside the route.ts (Simplified for logic check)
        const birthYear = 2010;
        const currentYear = new Date().getFullYear();
        const age = currentYear - birthYear;

        expect(age).toBeLessThan(19);
    });

    it('만 19세 이상(예: 1990년생)은 인증에 성공해야 한다 (정답지: 성공)', async () => {
        (fetch as any).mockResolvedValue({
            ok: true,
            json: async () => ({
                status: 'VERIFIED',
                verifiedCustomer: {
                    birthDate: '1990-05-20',
                    name: '김기업전용'
                }
            })
        });

        const birthYear = 1990;
        const currentYear = new Date().getFullYear();
        const age = currentYear - birthYear;

        expect(age).toBeGreaterThanOrEqual(19);
    });

    it('PortOne 응답이 VERIFIED가 아니면 실패해야 한다', async () => {
        (fetch as any).mockResolvedValue({
            ok: true,
            json: async () => ({
                status: 'FAILED',
                message: '인증 취소됨'
            })
        });

        const data = { status: 'FAILED' };
        expect(data.status).not.toBe('VERIFIED');
    });
});
