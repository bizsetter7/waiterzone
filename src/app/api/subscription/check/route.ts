import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * GET /api/subscription/check?userId=<uuid>
 *
 * 야사장 subscriptions 테이블을 통해 웨이터존 광고 등록 권한 확인
 *
 * 접근 허용 조건:
 *   1. businesses.owner_id = userId (야사장에 업소 등록됨)
 *   2. subscriptions.platform_choice = 'waiterzone'
 *   3. subscriptions.status IN ('trial', 'active')
 *   4. trial → trial_ends_at > now()
 *      active → next_billing_at > now()
 *
 * admin 계정은 호출 전 클라이언트에서 bypass 처리.
 */
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');

        if (!userId) {
            return NextResponse.json({ hasAccess: false, reason: 'userId_required' }, { status: 400 });
        }

        const now = new Date().toISOString();

        // 1) 야사장 businesses 테이블에서 owner_id로 business 조회
        const { data: business, error: bizError } = await supabaseAdmin
            .from('businesses')
            .select('id')
            .eq('owner_id', userId)
            .single();

        if (bizError || !business) {
            // 야사장에 업소 미등록 → 구독 자체가 불가능
            return NextResponse.json({
                hasAccess: false,
                reason: 'no_business',
                message: '야사장에 업소가 등록되어 있지 않습니다. 먼저 야사장에서 업소를 등록해주세요.',
            });
        }

        // 2) subscriptions 테이블에서 웨이터존 구독 확인
        const { data: sub, error: subError } = await supabaseAdmin
            .from('subscriptions')
            .select('id, status, platform_choice, trial_ends_at, next_billing_at, plan, plan_name')
            .eq('business_id', business.id)
            .eq('platform_choice', 'waiterzone')
            .single();

        if (subError || !sub) {
            return NextResponse.json({
                hasAccess: false,
                reason: 'no_subscription',
                message: '웨이터존 구독이 없습니다. 야사장에서 구독 플랜을 선택해주세요.',
            });
        }

        // 3) status 체크
        if (!['trial', 'active'].includes(sub.status)) {
            const reasonMap: Record<string, string> = {
                paused:    '구독이 일시정지 상태입니다. 야사장 대시보드에서 확인해주세요.',
                cancelled: '구독이 해지되었습니다. 야사장에서 재구독해주세요.',
            };
            return NextResponse.json({
                hasAccess: false,
                reason: sub.status,
                message: reasonMap[sub.status] || '구독 상태를 확인할 수 없습니다.',
            });
        }

        // 4) 만료 체크
        if (sub.status === 'trial') {
            if (!sub.trial_ends_at || sub.trial_ends_at <= now) {
                return NextResponse.json({
                    hasAccess: false,
                    reason: 'trial_expired',
                    message: '무료 체험 기간이 만료되었습니다. 야사장에서 구독을 시작해주세요.',
                    expiresAt: sub.trial_ends_at,
                });
            }
        } else {
            // active
            if (!sub.next_billing_at || sub.next_billing_at <= now) {
                return NextResponse.json({
                    hasAccess: false,
                    reason: 'subscription_expired',
                    message: '구독 기간이 만료되었습니다. 야사장에서 구독을 갱신해주세요.',
                    expiresAt: sub.next_billing_at,
                });
            }
        }

        // 5) 모든 체크 통과 → 접근 허용
        return NextResponse.json({
            hasAccess: true,
            plan: sub.plan_name || sub.plan,
            platform: sub.platform_choice,
            expiresAt: sub.status === 'trial' ? sub.trial_ends_at : sub.next_billing_at,
        });

    } catch (err: any) {
        console.error('[subscription/check] Unexpected error:', err.message);
        return NextResponse.json({ hasAccess: false, reason: 'server_error' }, { status: 500 });
    }
}
