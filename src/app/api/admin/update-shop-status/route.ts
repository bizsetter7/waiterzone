import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAdmin } from '@/lib/requireAdmin';
import { sendJobsApprovalAlert, isJobsBotConfigured } from '@/lib/telegram';

/**
 * [Admin API] /api/admin/update-shop-status
 * 공고 승인/반려 상태 변경 및 결제 내역 동기화 (service_role 사용으로 RLS 우회)
 *
 * ── payments 테이블 실제 스키마 (2026-04-12 확인) ──────────────────
 * id: bigint NOT NULL
 * created_at: timestamptz NOT NULL
 * user_id: text
 * shop_id: bigint   ← TEXT 아님! Number()로 통일
 * amount: integer
 * method: text
 * status: text
 * description: text
 * metadata: jsonb
 * pay_type: text    ← 'type' 컬럼 없음! pay_type 사용
 * (updated_at 컬럼 없음)
 * ──────────────────────────────────────────────────────────────────
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
        const { adId, status, rejectionReason, adData } = await request.json();

        if (!adId || !status) {
            return NextResponse.json({ error: 'adId와 status는 필수입니다.' }, { status: 400 });
        }

        const nowIso = new Date().toISOString();
        const updateData: any = {
            status: status,
            updated_at: nowIso
        };

        if (status === 'active') {
            updateData.approved_at = nowIso;
        } else if (status === 'rejected') {
            updateData.rejection_reason = rejectionReason;

            const { data: currentShop } = await supabaseAdmin
                .from('shops')
                .select('options')
                .eq('id', Number(adId))
                .single();

            const currentOptions = currentShop?.options || {};
            const currentHistory = (currentOptions as any).rejection_history || [];
            const newHistoryItem = {
                reason: rejectionReason || '심사 기준 미달',
                date: nowIso,
                index: currentHistory.length + 1
            };

            updateData.options = {
                ...currentOptions,
                rejection_history: [...currentHistory, newHistoryItem]
            };
        }

        // 1. Shops 테이블 업데이트
        const { error: shopError, count } = await supabaseAdmin
            .from('shops')
            .update(updateData, { count: 'exact' })
            .eq('id', Number(adId));

        if (shopError) throw shopError;

        if (count === 0) {
            const hasServiceKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
            throw new Error(`DB 업데이트 실패: 대상 공고(ID: ${adId})를 찾을 수 없습니다. ${!hasServiceKey ? "(서버 Service Key 누락 의심)" : "(ID 불일치 의심)"}`);
        }

        // 2. 결제 내역 동기화 (status === 'active' 승인 시)
        if (status === 'active') {
            // ad_price: shops 루트 컬럼 → options.ad_price → price 순 폴백
            const adPrice = Number(
                adData?.ad_price ||
                adData?.adPrice ||
                (adData?.options as any)?.ad_price ||
                adData?.price ||
                0
            );

            // userId: adData에 없으면 DB에서 직접 조회 (null silent skip 방지)
            let userId: string | undefined = adData?.user_id || adData?.ownerId;
            if (!userId) {
                const { data: shopRow } = await supabaseAdmin
                    .from('shops')
                    .select('user_id')
                    .eq('id', Number(adId))
                    .single();
                userId = shopRow?.user_id;
                if (!userId) {
                    console.error(`[update-shop-status] ⚠️ shop(${adId}) user_id 없음 — 결제 레코드 생성 불가`);
                }
            }

            // 기존 결제 레코드 확인
            // shop_id = bigint. pay_type 필터 제거 — 공고등록 시 pay_type=NULL로 생성되므로
            // 'AD'로 필터하면 기존 레코드를 못 찾아 중복 insert 발생
            const { data: existingRows, error: existingErr } = await supabaseAdmin
                .from('payments')
                .select('id')
                .eq('shop_id', Number(adId))
                .limit(1);
            if (existingErr) console.error('[update-shop-status] 결제 조회 실패:', existingErr.message);
            const existingPayment = existingRows?.[0] || null;

            if (existingPayment) {
                // 기존 내역 → status + 금액 업데이트 (updated_at 컬럼 없음)
                const { error: updatePayErr } = await supabaseAdmin
                    .from('payments')
                    .update({
                        status: 'completed',
                        pay_type: 'AD',
                        amount: adPrice,
                        description: `[시스템승인] ${adData?.name || '공고'} 결제 승인 완료`
                    })
                    .eq('id', existingPayment.id);
                if (updatePayErr) console.error('[update-shop-status] 결제 업데이트 실패:', updatePayErr.message);
                else console.log(`[update-shop-status] 결제 업데이트 완료 (id: ${existingPayment.id})`);
            } else if (userId) {
                // 결제 레코드 없음 → 신규 생성
                const shopName = adData?.shopName || adData?.name || adData?.shop_name || '비즈니스 업체';
                const adTitle = adData?.title || adData?.adTitle || '공고 내역';

                const { error: insertPayErr } = await supabaseAdmin.from('payments').insert([{
                    shop_id: Number(adId),   // bigint
                    user_id: userId,          // text
                    amount: adPrice,          // integer
                    status: 'completed',
                    pay_type: 'AD',           // pay_type (type 컬럼 없음)
                    method: 'bank_transfer',
                    description: `[관리자승인] ${shopName} 결제 완료`,
                    created_at: nowIso,
                    metadata: {
                        shopName,
                        adTitle,
                        product_type: adData?.tier || adData?.product_type || 'p7'
                    }
                }]);
                if (insertPayErr) console.error('[update-shop-status] 결제 생성 실패:', insertPayErr.message);
                else console.log(`[update-shop-status] 결제 생성 완료 (shop: ${adId}, user: ${userId})`);
            }

            // 3. 알림 쪽지 발송
            const targetUserId = userId || adData?.user_id || adData?.ownerId;
            if (targetUserId) {
                const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(targetUserId);
                if (isUuid) {
                    await supabaseAdmin.from('notifications').insert({
                        user_id: targetUserId,
                        type: 'AD_APPROVED',
                        title: '광고가 승인되었습니다 ✅',
                        message: `'${adData?.title || adData?.name || '공고'}'가 심사를 통과하여 정상 게재 중입니다.`,
                        read: false,
                        link: '/my-shop?view=dashboard',
                        created_at: nowIso,
                    });
                }
            }
        }

        // 4. Jobs봇 채널 알림 (승인 시, 환경변수 설정된 경우)
        if (status === 'active' && isJobsBotConfigured()) {
            // 승인된 공고 정보 조회 (adData에 없을 수 있음)
            const { data: shopRow } = await supabaseAdmin
                .from('shops')
                .select('id,nickname,name,title,region,category,pay,pay_type')
                .eq('id', Number(adId))
                .single();
            if (shopRow) {
                sendJobsApprovalAlert(shopRow).catch(() => {}); // 실패해도 승인은 완료
            }
        }

        return NextResponse.json({ success: true, status });

    } catch (err: any) {
        console.error('[update-shop-status] Error:', err.message);
        return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
    }
}
