import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAuth } from './useAuth';

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
    supabase: {
        auth: {
            getSession: vi.fn(() => Promise.resolve({ data: { session: null }, error: null })),
            onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
            signInWithPassword: vi.fn(),
            signUp: vi.fn(),
            signOut: vi.fn()
        },
        from: vi.fn(() => ({
            select: vi.fn(() => ({
                eq: vi.fn(() => ({
                    single: vi.fn(() => Promise.resolve({ data: null, error: null }))
                }))
            }))
        }))
    }
}));

describe('useAuth Hook (Core Logic Baseline)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
    });

    it('초기 상태는 게이트(Guest) 타입이어야 한다 (정답: guest)', async () => {
        const { result } = renderHook(() => useAuth());

        // Wait for initial loading to finish if necessary, but here we check initial sync
        expect(result.current.user.type).toBe('guest');
        expect(result.current.isLoggedIn).toBe(false);
    });

    it('로컬 스토리지에 Mock 세션이 있으면 복구해야 한다', async () => {
        const mockUser = {
            type: 'corporate',
            id: 'test_id',
            name: '테스트 사장님',
            nickname: '조사장',
            points: 100
        };
        localStorage.setItem('coco_mock_session', JSON.stringify(mockUser));

        const { result } = renderHook(() => useAuth());

        expect(result.current.isLoggedIn).toBe(true);
        expect(result.current.user.nickname).toBe('조사장');
    });

    it('로그아웃 시 모든 로컬 데이터와 세션이 제거되어야 한다', async () => {
        localStorage.setItem('adult_verified', 'true');
        localStorage.setItem('coco_mock_session', '{}');

        const { result } = renderHook(() => useAuth());

        // signOut은 window.location.href를 바꾸므로 mock 처리하거나 로직만 체크
        // 여기서는 useAuth 내부의 localStorage 삭제 로직이 호출되는지 확인 위주
        await act(async () => {
            await result.current.logout();
        });

        expect(localStorage.getItem('coco_mock_session')).toBeNull();
        expect(localStorage.getItem('adult_verified')).toBeNull();
    });
});
