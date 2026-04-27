import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getAdmin() {
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceKey) return null;
    return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey);
}

/**
 * GET /api/cron/expire-ads
 * 매일 자정 실행 — 기간 만료된 공고를 자동으로 CLOSED 처리
 * 조건: status = 'active' AND deadline < 오늘(KST)
 */
export async function GET(request: Request) {
    const authHeader = request.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabaseAdmin = getAdmin();
    if (!supabaseAdmin) {
        return NextResponse.json({ error: 'Supabase admin not configured' }, { status: 503 });
    }

    try {
        const todayKST = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Seoul' }); // YYYY-MM-DD

        // active 상태이면서 deadline이 오늘 이전인 공고 조회
        const { data: expiredShops, error: fetchError } = await supabaseAdmin
            .from('shops')
            .select('id, user_id, title, name, deadline')
            .eq('status', 'active')
            .lt('deadline', todayKST)
            .not('deadline', 'is', null);

        if (fetchError) throw fetchError;
        if (!expiredShops || expiredShops.length === 0) {
            return NextResponse.json({ success: true, expiredCount: 0, message: '만료 공고 없음' });
        }

        const nowIso = new Date().toISOString();
        let expiredCount = 0;

        for (const shop of expiredShops) {
            // 상태를 CLOSED로 변경
            const { error: updateError } = await supabaseAdmin
                .from('shops')
                .update({ status: 'CLOSED', updated_at: nowIso })
                .eq('id', shop.id);

            if (updateError) {
                console.error(`[expire-ads] 공고 ${shop.id} 만료 처리 실패:`, updateError.message);
                continue;
            }

            expiredCount++;

            // 업체 회원에게 만료 알림 발송 (user_id가 유효한 UUID인 경우만)
            const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(shop.user_id || '');
            if (isUuid) {
                try {
                    await supabaseAdmin.from('notifications').insert({
                        user_id: shop.user_id,
                        type: 'AD_EXPIRED',
                        title: '광고 기간이 만료되었습니다',
                        message: `'${shop.title || shop.name}' 공고의 게재 기간이 만료되어 마감 처리되었습니다. 광고 연장을 원하시면 마이샵에서 신청해주세요.`,
                        read: false,
                        link: '/my-shop?view=closed-ads',
                        created_at: nowIso,
                    });
                } catch (notifErr) {
                    console.error(`[expire-ads] 알림 생성 실패 (shop ${shop.id}):`, notifErr);
                    // 알림 실패해도 만료 처리는 완료
                }
            }
        }

        return NextResponse.json({ success: true, expiredCount, date: todayKST });
    } catch (err: any) {
        console.error('[expire-ads] Cron error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
