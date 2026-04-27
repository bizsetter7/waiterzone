import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import webpush from 'web-push';
import { getSosPointReason } from '@/lib/points';

function getAdmin() {
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceKey) return null;
    return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey,
        { auth: { autoRefreshToken: false, persistSession: false } });
}

const POINT_COST_MAP: Record<string, number> = {
    SOS_SEND_SMALL: 500,
    SOS_SEND_MEDIUM: 1000,
    SOS_SEND_LARGE: 1500,
    SOS_SEND_XLARGE: 2000,
};

/** 요청자 user_id 검증 — Bearer 토큰 또는 mock 세션 쿠키 */
async function getRequestUserId(request: NextRequest, supabaseAdmin: ReturnType<typeof getAdmin>): Promise<string | null> {
    if (!supabaseAdmin) return null;

    // 개발 환경 mock 세션 쿠키 허용
    if (process.env.NODE_ENV !== 'production') {
        const mockCookie = request.cookies.get('coco_mock_session');
        if (mockCookie?.value) {
            try { return JSON.parse(mockCookie.value)?.id || null; } catch { /* ignore */ }
        }
    }

    const authHeader = request.headers.get('authorization') || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token) return null;

    try {
        const { data: { user } } = await supabaseAdmin.auth.getUser(token);
        return user?.id || null;
    } catch {
        return null;
    }
}

// POST /api/sos/send
// body: { shopId, shopName, message, regions: string[] }
export async function POST(request: NextRequest) {
    const supabaseAdmin = getAdmin();
    if (!supabaseAdmin) {
        return NextResponse.json({ error: 'Server not configured' }, { status: 503 });
    }

    const vapidEmail = process.env.VAPID_EMAIL;
    const vapidPublic = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    const vapidPrivate = process.env.VAPID_PRIVATE_KEY;

    if (!vapidEmail || !vapidPublic || !vapidPrivate) {
        return NextResponse.json({ error: 'VAPID keys not configured' }, { status: 503 });
    }

    webpush.setVapidDetails(vapidEmail, vapidPublic, vapidPrivate);

    try {
        // ⚠️ 여기서 shopId = 발송자의 profiles.id (uuid)
        //    shops.id(bigint)가 아님. sos_alerts.shop_id에 user uuid가 저장됨.
        const { shopId, shopName, message, regions } = await request.json();

        if (!shopId || !shopName || !message || !regions?.length) {
            return NextResponse.json({ error: '필수 파라미터 누락' }, { status: 400 });
        }

        if (message.length > 50) {
            return NextResponse.json({ error: '메시지는 50자 이내로 작성해주세요.' }, { status: 400 });
        }

        // 요청자 본인 확인 — shopId는 반드시 로그인한 유저의 ID와 일치해야 함
        const requesterId = await getRequestUserId(request, supabaseAdmin);
        if (!requesterId) {
            return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
        }
        if (requesterId !== shopId) {
            return NextResponse.json({ error: '본인 샵만 SOS 발송할 수 있습니다.' }, { status: 403 });
        }

        // 1. 해당 지역 구독자 조회
        const { data: subscribers, error: subError } = await supabaseAdmin
            .from('push_subscriptions')
            .select('user_id, subscription')
            .overlaps('regions', regions);

        if (subError) throw subError;

        const recipientCount = subscribers?.length ?? 0;

        // 2. 포인트 확인 및 차감
        const pointReason = getSosPointReason(recipientCount);
        const pointCost = POINT_COST_MAP[pointReason];

        const { data: profile, error: profileError } = await supabaseAdmin
            .from('profiles')
            .select('points')
            .eq('id', shopId)
            .single();

        if (profileError) throw profileError;

        const currentPoints = profile?.points ?? 0;
        if (currentPoints < pointCost) {
            return NextResponse.json({
                error: `포인트가 부족합니다. 필요: ${pointCost}P, 보유: ${currentPoints}P`
            }, { status: 402 });
        }

        // 포인트 차감
        const { error: deductError } = await supabaseAdmin
            .from('profiles')
            .update({
                points: currentPoints - pointCost,
                updated_at: new Date().toISOString()
            })
            .eq('id', shopId);

        if (deductError) throw deductError;

        // point_logs 기록 (note 컬럼 없음 — user_id/amount/reason만 사용)
        const { error: logError } = await supabaseAdmin.from('point_logs').insert({
            user_id: shopId,
            amount: -pointCost,
            reason: pointReason,
        });

        if (logError) {
            // 로그 실패 시 포인트 롤백
            await supabaseAdmin
                .from('profiles')
                .update({ points: currentPoints, updated_at: new Date().toISOString() })
                .eq('id', shopId);
            console.error('[sos/send] point_logs 기록 실패, 포인트 롤백:', logError.message);
            return NextResponse.json({ error: '발송 처리 중 오류가 발생했습니다. 다시 시도해주세요.' }, { status: 500 });
        }

        // [New] 어드민 통합 결제 내역(payments)에도 기록 추가
        try {
            await supabaseAdmin.from('payments').insert([{
                user_id: shopId,
                amount: pointCost,
                status: 'completed',
                pay_type: 'SOS',        // ✅ pay_type (type 컬럼 없음)
                method: 'points',
                description: `[SOS] ${shopName} — ${recipientCount}명 발송`,
                metadata: {
                    reason: pointReason,
                    recipient_count: recipientCount,
                    shop_name: shopName
                }
            }]);
        } catch (payErr) {
            console.warn('[SOS/Send] payments 기록 실패 (무시하고 진행):', payErr);
        }

        // 3. SOS 발송 이력 저장
        const { data: alertData, error: alertError } = await supabaseAdmin
            .from('sos_alerts')
            .insert({
                shop_id: shopId,
                shop_name: shopName,
                message,
                target_regions: regions,
                point_deducted: pointCost,
                recipient_count: recipientCount,
            })
            .select('id')
            .single();

        if (alertError) {
            // sos_alerts 저장 실패 시 포인트 및 로그 롤백
            await supabaseAdmin
                .from('profiles')
                .update({ points: currentPoints, updated_at: new Date().toISOString() })
                .eq('id', shopId);
            await supabaseAdmin
                .from('point_logs')
                .delete()
                .eq('user_id', shopId)
                .eq('reason', pointReason)
                .order('created_at', { ascending: false })
                .limit(1);
            console.error('[sos/send] sos_alerts 저장 실패, 롤백 처리:', alertError.message);
            throw alertError;
        }

        const alertId = alertData?.id;

        // 4. Web Push 발송 (Stealth 정책 적용)
        const pushPayload = JSON.stringify({
            stealth: true,
            title: '새 알림이 있습니다',
            body: `${shopName}: ${message}`,
            url: `/shops?sos=${alertId}`,
            alertId,
            tag: `sos-${alertId}`,
        });

        let successCount = 0;
        let failCount = 0;

        const sendPromises = (subscribers ?? []).map(async (sub) => {
            try {
                await webpush.sendNotification(sub.subscription, pushPayload);
                successCount++;
            } catch (err: any) {
                failCount++;
                if (err.statusCode === 410) {
                    await supabaseAdmin
                        .from('push_subscriptions')
                        .delete()
                        .eq('user_id', sub.user_id);
                }
            }
        });

        await Promise.allSettled(sendPromises);

        return NextResponse.json({
            success: true,
            recipientCount,
            successCount,
            failCount,
            pointDeducted: pointCost,
            remainingPoints: currentPoints - pointCost,
        });

    } catch (err: any) {
        console.error('SOS send error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
