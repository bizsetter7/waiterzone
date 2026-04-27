import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAdmin } from '@/lib/requireAdmin';

/**
 * [Admin API] /api/admin/grant-balance
 * 어드민 수동 포인트/점프 지급 — service role key로 RLS 완전 우회
 * AdminPaymentManagement.handlePointGrant에서 호출
 */
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function POST(request: NextRequest) {
    const authError = await requireAdmin(request);
    if (authError) return authError;

    try {
        const { userId, amount, type } = await request.json();

        if (!userId || !amount || !type) {
            return NextResponse.json({ error: 'userId, amount, type은 필수입니다.' }, { status: 400 });
        }
        if (type !== 'points' && type !== 'jump_balance') {
            return NextResponse.json({ error: 'type은 points 또는 jump_balance만 허용됩니다.' }, { status: 400 });
        }

        const now = new Date().toISOString();

        // 1. 현재 잔액 조회
        const { data: profile, error: fetchError } = await supabaseAdmin
            .from('profiles')
            .select(type)
            .eq('id', userId)
            .single();
        if (fetchError) throw fetchError;

        const current = (profile as any)?.[type] || 0;
        const newTotal = current + Number(amount);

        // 2. 잔액 업데이트
        const { error: updateError } = await supabaseAdmin
            .from('profiles')
            .update({ [type]: newTotal, updated_at: now })
            .eq('id', userId);
        if (updateError) throw updateError;

        // 3. point_logs 기록 (포인트만 — 점프는 별도 로그 테이블 없음)
        if (type === 'points') {
            const { error: logError } = await supabaseAdmin
                .from('point_logs')
                .insert({
                    user_id: userId,
                    amount: Number(amount),
                    reason: 'ADMIN_GRANT',
                });
            if (logError) {
                // 로그 실패 시 포인트 롤백
                await supabaseAdmin
                    .from('profiles')
                    .update({ [type]: current, updated_at: now })
                    .eq('id', userId);
                throw new Error(`point_logs 기록 실패: ${logError.message}`);
            }
        }

        return NextResponse.json({ success: true, newTotal });

    } catch (err: any) {
        console.error('[grant-balance] Error:', err.message);
        return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
    }
}
