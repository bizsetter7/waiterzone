import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * [Cron] /api/cron/daily-jump-tasks — 매일 자정 1회 호출 (Vercel Hobby 호환)
 *
 * 3종 작업 통합 처리:
 *   1. 30일 도달 회원 잔액 reset (구독 plan별 횟수)
 *   2. 프리미엄 회원 매일 +1 적립
 *   3. 자동 점프 reset (auto_remaining_today set) + 자동 점프 사용
 *
 * 점프 정책 (2026-04-30 확정):
 *   자동: 스페셜 3 / 디럭스 6 / 프리미엄 8 (매일 자정 set)
 *   수동: 스페셜 10 / 디럭스 30 / 프리미엄 30 + 매일 +1 (30일 주기 reset)
 *
 * Vercel Hobby 플랜 = 매일 1회 cron만 허용. 인터벌 분산은 향후 Pro 또는 외부 cron으로 보강 검토.
 */

const PLAN_AUTO_JUMP: Record<string, number> = {
    basic:    0,
    standard: 0,
    special:  3,
    deluxe:   6,
    premium:  8,
};

const PLAN_MANUAL_JUMP_RESET: Record<string, number> = {
    basic:    0,
    standard: 0,
    special:  10,
    deluxe:   30,
    premium:  30,
};

function getAdmin() {
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceKey) return null;
    return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey);
}

export async function GET(request: Request) {
    // Vercel cron 보안 — CRON_SECRET 검증
    const authHeader = request.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabaseAdmin = getAdmin();
    if (!supabaseAdmin) {
        return NextResponse.json({ error: 'Supabase admin not configured' }, { status: 503 });
    }

    const now = new Date();
    const nowIso = now.toISOString();

    const summary = {
        reset_30days: 0,
        premium_increment: 0,
        auto_reset: 0,
        auto_jumped: 0,
    };

    try {
        // ─── 1. 활성 구독 회원 전체 조회 (한 번에) ───
        const { data: subs, error: subError } = await supabaseAdmin
            .from('subscriptions')
            .select('business_id, plan, status, confirmed_at')
            .in('status', ['active', 'trial']);

        if (subError) throw subError;

        // business_id → owner_id 매핑
        const businessIds = (subs ?? []).map((s) => s.business_id);
        const { data: businesses } = await supabaseAdmin
            .from('businesses')
            .select('id, owner_id')
            .in('id', businessIds);

        const bizOwnerMap = new Map<string, string>();
        (businesses ?? []).forEach((b) => {
            if (b.owner_id) bizOwnerMap.set(b.id, b.owner_id);
        });

        // user_id → plan 매핑 (가장 높은 plan 우선 — 한 user가 여러 구독 가능 대응)
        const userPlanMap = new Map<string, string>();
        const planRank: Record<string, number> = { premium: 5, deluxe: 4, special: 3, standard: 2, basic: 1 };
        (subs ?? []).forEach((s) => {
            const ownerId = bizOwnerMap.get(s.business_id);
            if (!ownerId) return;
            const currentPlan = userPlanMap.get(ownerId);
            if (!currentPlan || (planRank[s.plan] ?? 0) > (planRank[currentPlan] ?? 0)) {
                userPlanMap.set(ownerId, s.plan);
            }
        });

        // ─── 2. 30일 도달 회원 잔액 reset ───
        const { data: dueResets } = await supabaseAdmin
            .from('user_jumps')
            .select('user_id, next_reset_at')
            .lte('next_reset_at', nowIso);

        for (const uj of dueResets ?? []) {
            const plan = userPlanMap.get(uj.user_id);
            if (!plan) continue;
            const newBalance = PLAN_MANUAL_JUMP_RESET[plan] ?? 0;
            const next = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
            await supabaseAdmin
                .from('user_jumps')
                .update({
                    subscription_balance: newBalance,
                    next_reset_at: next.toISOString(),
                    updated_at: nowIso,
                })
                .eq('user_id', uj.user_id);
            summary.reset_30days++;
        }

        // ─── 3. 프리미엄 회원 매일 +1 적립 ───
        const premiumUsers = Array.from(userPlanMap.entries())
            .filter(([, plan]) => plan === 'premium')
            .map(([userId]) => userId);

        for (const userId of premiumUsers) {
            const { data: existing } = await supabaseAdmin
                .from('user_jumps')
                .select('subscription_balance')
                .eq('user_id', userId)
                .maybeSingle();

            if (existing) {
                await supabaseAdmin
                    .from('user_jumps')
                    .update({
                        subscription_balance: (existing.subscription_balance ?? 0) + 1,
                        updated_at: nowIso,
                    })
                    .eq('user_id', userId);
            } else {
                await supabaseAdmin
                    .from('user_jumps')
                    .insert({
                        user_id: userId,
                        subscription_balance: 1,
                        next_reset_at: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                    });
            }
            summary.premium_increment++;
        }

        // ─── 4. 자동 점프 reset (auto_remaining_today set) ───
        for (const [userId, plan] of userPlanMap.entries()) {
            const auto = PLAN_AUTO_JUMP[plan] ?? 0;
            if (auto === 0) continue;

            const { data: existing } = await supabaseAdmin
                .from('user_jumps')
                .select('user_id')
                .eq('user_id', userId)
                .maybeSingle();

            if (existing) {
                await supabaseAdmin
                    .from('user_jumps')
                    .update({
                        auto_remaining_today: auto,
                        last_daily_reset_at: nowIso,
                        updated_at: nowIso,
                    })
                    .eq('user_id', userId);
            } else {
                await supabaseAdmin
                    .from('user_jumps')
                    .insert({
                        user_id: userId,
                        auto_remaining_today: auto,
                        last_daily_reset_at: nowIso,
                    });
            }
            summary.auto_reset++;
        }

        // ─── 5. 자동 점프 사용 (auto_jump_enabled === true 광고) ───
        // platform='waiterzone' 광고만 (P9/P10은 자기 cron에서 자기 platform 처리)
        const { data: shopsData } = await supabaseAdmin
            .from('shops')
            .select('id, user_id, platform, options')
            .eq('platform', 'waiterzone')
            .neq('status', 'CLOSED')
            .neq('status', 'closed')
            .neq('status', 'rejected')
            .neq('status', 'REJECTED');

        for (const shop of shopsData ?? []) {
            const opts = shop.options || {};
            if (!opts.auto_jump_enabled) continue;

            // 잔여 자동 점프 확인
            const { data: uj } = await supabaseAdmin
                .from('user_jumps')
                .select('auto_remaining_today')
                .eq('user_id', shop.user_id)
                .maybeSingle();

            if (!uj || (uj.auto_remaining_today ?? 0) <= 0) continue;

            // 점프 실행: created_at = now() + last_jumped_at = now() + auto 잔여 -1
            await supabaseAdmin
                .from('shops')
                .update({
                    created_at: nowIso,
                    updated_at: nowIso,
                    last_jumped_at: nowIso,
                })
                .eq('id', shop.id);

            await supabaseAdmin
                .from('user_jumps')
                .update({
                    auto_remaining_today: (uj.auto_remaining_today ?? 1) - 1,
                    updated_at: nowIso,
                })
                .eq('user_id', shop.user_id);

            summary.auto_jumped++;
        }

        return NextResponse.json({ success: true, summary });
    } catch (err: any) {
        console.error('[daily-jump-tasks] Error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
