import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAdmin } from '@/lib/requireAdmin';

/**
 * [Admin API] POST /api/admin/recover-payment
 * 특정 shop_id에 대한 결제 레코드가 없을 경우 수동으로 생성
 * - 광고 승인 후 결제 내역이 반영되지 않은 경우 사용
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
        const { shopId } = await request.json();
        if (!shopId) {
            return NextResponse.json({ error: 'shopId 필수' }, { status: 400 });
        }

        const numericId = Number(shopId);

        // 1. Shop 정보 조회
        const { data: shop, error: shopErr } = await supabaseAdmin
            .from('shops')
            .select('id, user_id, title, name, ad_price, options, status')
            .eq('id', numericId)
            .single();

        if (shopErr || !shop) {
            return NextResponse.json({
                success: false,
                error: `shop(${shopId}) 조회 실패: ${shopErr?.message || '없음'}`
            }, { status: 404 });
        }

        // 2. 기존 결제 레코드 확인
        const { data: existingRows } = await supabaseAdmin
            .from('payments')
            .select('id, status, pay_type, amount')
            .eq('shop_id', numericId)
            .limit(1);

        const existingPayment = existingRows?.[0] || null;

        // 3. 결과 진단
        const diagnosis = {
            shopId: numericId,
            shopStatus: shop.status,
            userId: shop.user_id,
            hasUserId: !!shop.user_id,
            existingPayment: existingPayment
                ? { id: existingPayment.id, status: existingPayment.status, payType: existingPayment.pay_type }
                : null,
        };

        // 4. 결제 레코드가 이미 있으면 진단 결과만 반환
        if (existingPayment) {
            return NextResponse.json({
                success: true,
                action: 'already_exists',
                message: `payments 레코드 존재 (id: ${existingPayment.id}, status: ${existingPayment.status})`,
                diagnosis
            });
        }

        // 5. user_id 없으면 수복 불가
        if (!shop.user_id) {
            return NextResponse.json({
                success: false,
                action: 'no_user_id',
                error: `shop(${shopId})에 user_id가 없어 결제 생성 불가`,
                diagnosis
            });
        }

        // 6. payment 신규 생성
        const adPrice = Number(
            shop.ad_price ||
            (shop.options as any)?.ad_price ||
            0
        );
        const shopName = shop.name || '업체';
        const adTitle = shop.title || '공고';
        const nowIso = new Date().toISOString();

        const { error: insertErr } = await supabaseAdmin.from('payments').insert([{
            shop_id: numericId,
            user_id: shop.user_id,
            amount: adPrice,
            status: 'completed',
            pay_type: 'AD',
            method: 'bank_transfer',
            description: `[관리자수복] ${shopName} 결제 완료`,
            created_at: nowIso,
            metadata: {
                shopName,
                adTitle,
                product_type: (shop.options as any)?.product_type || 'p7',
                recoveredAt: nowIso,
                recoveredBy: 'admin/recover-payment'
            }
        }]);

        if (insertErr) {
            return NextResponse.json({
                success: false,
                action: 'insert_failed',
                error: insertErr.message,
                diagnosis
            }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            action: 'created',
            message: `shop(${shopId}) 결제 레코드 수복 완료`,
            diagnosis
        });

    } catch (err: any) {
        console.error('[recover-payment] Error:', err.message);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
