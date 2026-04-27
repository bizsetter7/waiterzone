import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// [Security] Service role key — 서버에서만 사용, RLS 완전 우회
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
);

const POINT_AMOUNTS: Record<string, number> = {
    JOIN: 100,
    RESUME_UPLOAD: 500,
    COMMUNITY_POST: 20,
    COMMUNITY_COMMENT: 5,
    COUPON_EXCHANGE: -2000,
    RESUME_JUMP: 0,
    SHOP_JUMP: 0,
    SOS_SEND_SMALL: -500,
    SOS_SEND_MEDIUM: -1000,
    SOS_SEND_LARGE: -1500,
    SOS_SEND_XLARGE: -2000,
    ADMIN_GRANT: 0,
    ATTENDANCE_CHECK: 3,
};

export async function POST(request: NextRequest) {
    try {
        const { userId, reason, customAmount } = await request.json();

        if (!userId || !reason) {
            return NextResponse.json({ error: 'userId and reason are required' }, { status: 400 });
        }

        const amount = customAmount ?? POINT_AMOUNTS[reason];
        if (amount === undefined) {
            return NextResponse.json({ error: `Unknown point reason: ${reason}` }, { status: 400 });
        }

        // [중복 방지] ATTENDANCE_CHECK: 오늘(KST 기준) 이미 출석했는지 서버에서 검증
        // KST = UTC+9: new Date()에 9시간 더해 KST 날짜 추출 후 UTC 범위로 변환
        if (reason === 'ATTENDANCE_CHECK') {
            const KST_OFFSET_MS = 9 * 60 * 60 * 1000;
            const nowKst = new Date(Date.now() + KST_OFFSET_MS);
            const todayKst = nowKst.toISOString().substring(0, 10); // KST 기준 'YYYY-MM-DD'
            // KST 하루 범위를 UTC ISO로 변환
            const dayStartUtc = new Date(`${todayKst}T00:00:00+09:00`).toISOString();
            const dayEndUtc   = new Date(`${todayKst}T23:59:59+09:00`).toISOString();

            const { data: existing } = await supabaseAdmin
                .from('point_logs')
                .select('id')
                .eq('user_id', userId)
                .eq('reason', 'ATTENDANCE_CHECK')
                .gte('created_at', dayStartUtc)
                .lte('created_at', dayEndUtc)
                .maybeSingle();

            if (existing) {
                return NextResponse.json(
                    { error: '오늘 이미 출석체크를 완료했습니다.', alreadyChecked: true },
                    { status: 409 }
                );
            }
        }

        // 1. 포인트 로그 먼저 기록 (중복 방지 및 무결성 최우선)
        // [중요] 포인트 로그가 먼저 생겨야 나중에 중계/정산 시 누락이 없음
        const { error: logError } = await supabaseAdmin
            .from('point_logs')
            .insert({ user_id: userId, amount, reason });

        if (logError) {
            console.error('[award-points] Log insert error:', logError.message);
            // 이미 출석한 경우 (Unique Constraint 위반 등 대응)
            if (logError.code === '23505') {
                return NextResponse.json({ error: '데이터 처리 중 오류가 발생했습니다. (중복)' }, { status: 409 });
            }
            return NextResponse.json({ error: '포인트 기록 저장에 실패했습니다.' }, { status: 500 });
        }

        // 2. 현재 포인트 조회 및 업데이트
        const { data: profile, error: profileError } = await supabaseAdmin
            .from('profiles')
            .select('points')
            .eq('id', userId)
            .maybeSingle();

        if (profileError) {
            console.error('[award-points] Profile fetch error:', profileError.message);
            return NextResponse.json({ error: profileError.message }, { status: 500 });
        }

        const newTotal = (profile?.points || 0) + amount;

        const { error: updateError } = await supabaseAdmin
            .from('profiles')
            .update({ points: newTotal, updated_at: new Date().toISOString() })
            .eq('id', userId);

        if (updateError) {
            console.error('[award-points] Profile update error:', updateError.message);
            // 포인트 업데이트 실패 시 로그 롤백 (데이터 정합성 사수)
            await supabaseAdmin.from('point_logs').delete().eq('user_id', userId).eq('reason', reason).limit(1);
            return NextResponse.json({ error: updateError.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, newTotal });

    } catch (err: any) {
        console.error('[award-points] Unexpected error:', err.message);
        return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
    }
}
