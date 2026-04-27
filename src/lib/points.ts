import { supabase } from './supabase';

export type PointReason =
    | 'JOIN'
    | 'RESUME_UPLOAD'
    | 'COMMUNITY_POST'
    | 'COMMUNITY_COMMENT'
    | 'COUPON_EXCHANGE'
    | 'RESUME_JUMP'
    | 'SHOP_JUMP'
    | 'SOS_SEND_SMALL'   // ~10명 수신
    | 'SOS_SEND_MEDIUM'  // ~30명 수신
    | 'SOS_SEND_LARGE'   // ~50명 수신
    | 'SOS_SEND_XLARGE'  // 50명 초과
    | 'ADMIN_GRANT'     // 어드민 수동 지급 (customAmount 필수)
    | 'ATTENDANCE_CHECK'; // 출석체크 일일 지급

const POINT_AMOUNTS: Record<PointReason, number> = {
    JOIN: 100,
    RESUME_UPLOAD: 500,
    COMMUNITY_POST: 20,
    COMMUNITY_COMMENT: 5,
    COUPON_EXCHANGE: -2000,
    RESUME_JUMP: 0,
    SHOP_JUMP: 0,          // 업체 공고 최상단 점프 (횟수제로 변경)
    SOS_SEND_SMALL: -500,  // ~10명
    SOS_SEND_MEDIUM: -1000, // ~20명
    SOS_SEND_LARGE: -1500,  // ~30명
    SOS_SEND_XLARGE: -2000, // 30명 초과
    ADMIN_GRANT: 0,        // customAmount로 지정
    ATTENDANCE_CHECK: 3,   // 일일 출석체크 +3P
};

/** 수신자 수 기반 SOS 차감 reason 결정 */
export function getSosPointReason(recipientCount: number): PointReason {
    if (recipientCount <= 10) return 'SOS_SEND_SMALL';
    if (recipientCount <= 20) return 'SOS_SEND_MEDIUM';
    if (recipientCount <= 30) return 'SOS_SEND_LARGE';
    return 'SOS_SEND_XLARGE';
}

/**
 * Award or deduct points from a user
 */
export async function updatePoints(userId: string, reason: PointReason, customAmount?: number) {
    try {
        const res = await fetch('/api/points/award', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, reason, customAmount }),
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
            console.error(`[updatePoints] API error (${reason}):`, data.error || data);
            return { success: false, error: data.error };
        }

        return { success: true, newTotal: data.newTotal };
    } catch (err: any) {
        console.error(`[updatePoints] Network error (${reason}):`, err.message);
        return { success: false, error: err };
    }
}

/**
 * Get current credit for a user
 */
export async function getUserPoints(userId: string) {
    const { data, error } = await supabase
        .from('profiles')
        .select('points') // [Fix] credit_balance가 아닌 points 컬럼 조회
        .eq('id', userId)
        .single();

    if (error) return 0;
    return data?.points || 0;
}
