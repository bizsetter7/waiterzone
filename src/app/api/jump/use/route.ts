import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * [API] /api/jump/use — 사용자가 광고를 수동 점프
 *
 * 우선순위 차감:
 *   1. user_jumps.subscription_balance (구독 무료 적립, 30일 소멸)
 *   2. user_jumps.package_balance (패키지 충전, 만료 X)
 *   둘 다 0이면 → 충전 안내
 *
 * 점프 실행:
 *   shops.created_at = now() (목록 정렬에 의해 상단으로)
 *   shops.last_jumped_at = now() (방금 점프 배지 5분 윈도우)
 *
 * Body: { adId: number, userId: string }
 */
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function POST(request: NextRequest) {
    try {
        // 사용자 인증 확인 (헤더 Bearer 토큰)
        const authHeader = request.headers.get('authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 });
        }
        const token = authHeader.slice(7);
        const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
        if (authError || !user) {
            return NextResponse.json({ error: '유효하지 않은 토큰' }, { status: 401 });
        }

        const { adId } = await request.json();
        if (!adId) {
            return NextResponse.json({ error: 'adId 필수' }, { status: 400 });
        }

        // 광고 소유자 확인
        const { data: shop, error: shopError } = await supabaseAdmin
            .from('shops')
            .select('id, user_id, platform, status')
            .eq('id', Number(adId))
            .maybeSingle();
        if (shopError) throw shopError;
        if (!shop) return NextResponse.json({ error: '광고를 찾을 수 없습니다' }, { status: 404 });
        if (shop.user_id !== user.id) {
            return NextResponse.json({ error: '본인 광고만 점프 가능합니다' }, { status: 403 });
        }

        // 잔액 조회
        const { data: uj } = await supabaseAdmin
            .from('user_jumps')
            .select('subscription_balance, package_balance')
            .eq('user_id', user.id)
            .maybeSingle();

        const subBal = uj?.subscription_balance ?? 0;
        const pkgBal = uj?.package_balance ?? 0;

        if (subBal <= 0 && pkgBal <= 0) {
            return NextResponse.json({
                error: '점프 잔액이 없습니다',
                code: 'NO_BALANCE',
                message: '점프 패키지를 충전하거나 구독 플랜을 업그레이드해주세요.',
            }, { status: 400 });
        }

        // 우선순위 차감: subscription > package
        const useFromSub = subBal > 0;
        const updateData: Record<string, any> = { updated_at: new Date().toISOString() };
        if (useFromSub) {
            updateData.subscription_balance = subBal - 1;
        } else {
            updateData.package_balance = pkgBal - 1;
        }

        // user_jumps row 없으면 생성, 있으면 업데이트
        if (uj) {
            await supabaseAdmin
                .from('user_jumps')
                .update(updateData)
                .eq('user_id', user.id);
        } else {
            // 잔액 없는 user_jumps row → 점프 불가 (위 잔액 체크에서 이미 차단)
            return NextResponse.json({ error: '잔액 정보 없음' }, { status: 400 });
        }

        // 광고 created_at 갱신 + last_jumped_at 표시
        const nowIso = new Date().toISOString();
        const { error: jumpError } = await supabaseAdmin
            .from('shops')
            .update({
                created_at: nowIso,
                updated_at: nowIso,
                last_jumped_at: nowIso,
            })
            .eq('id', Number(adId));

        if (jumpError) {
            // 차감 롤백
            await supabaseAdmin
                .from('user_jumps')
                .update(useFromSub
                    ? { subscription_balance: subBal }
                    : { package_balance: pkgBal })
                .eq('user_id', user.id);
            throw jumpError;
        }

        // 로그 (point_logs 재활용 — reason 컬럼만 있음)
        await supabaseAdmin
            .from('point_logs')
            .insert({
                user_id: user.id,
                amount: -1,
                reason: useFromSub
                    ? `JUMP_SUBSCRIPTION:${adId}`
                    : `JUMP_PACKAGE:${adId}`,
            });

        return NextResponse.json({
            success: true,
            source: useFromSub ? 'subscription' : 'package',
            remaining: {
                subscription_balance: useFromSub ? subBal - 1 : subBal,
                package_balance: useFromSub ? pkgBal : pkgBal - 1,
            },
        });
    } catch (err: any) {
        console.error('[jump/use] Error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
