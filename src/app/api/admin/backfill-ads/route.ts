import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAdmin } from '@/lib/requireAdmin';

const svc = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function POST(request: NextRequest) {
    const authError = await requireAdmin(request);
    if (authError) return authError;

    try {
        const { adIds, amount, userId } = await request.json();

        if (!adIds || !Array.isArray(adIds)) {
            return NextResponse.json({ success: false, error: 'Invalid adIds' }, { status: 400 });
        }

        const stats = { updatedShops: 0, insertedPayments: 0 };

        for (const adId of adIds) {
            // 1. shops.id = bigint → Number() 변환 필수 (M-026 기준)
            const numericAdId = Number(adId);

            // 2. Shop status → active 수복
            const { data: shop, error: shopErr } = await svc
                .from('shops')
                .update({
                    status: 'active',
                    ad_price: amount || 0,
                    ad_duration: 30,
                    updated_at: new Date().toISOString()
                })
                .eq('id', numericAdId)
                .select()
                .single();

            if (!shopErr && shop) stats.updatedShops++;

            // 3. Payment 내역 생성
            // payments 실제 컬럼: id, user_id, shop_id(bigint), amount, status, pay_type, metadata, created_at
            // ❌ 존재하지 않는 컬럼: type, method, description → metadata JSONB에 포함
            if (shop) {
                const { error: payErr } = await svc.from('payments').insert([{
                    user_id: userId,
                    shop_id: numericAdId,           // bigint → Number() 변환 완료
                    amount: amount || 0,
                    status: 'completed',
                    pay_type: 'AD',                 // ✅ pay_type (type 컬럼 없음)
                    method: 'admin_manual',         // ✅ payments.method 컬럼 존재
                    description: `[백필] ${shop.title} (소급 등록)`, // ✅ payments.description 컬럼 존재
                    metadata: {
                        shop_name: shop.name || '',
                        tier: shop.tier || 'grand',
                        duration: 30,
                        admin_id: 'internal_agent_fix',
                    },
                    created_at: new Date().toISOString()
                }]);
                if (!payErr) stats.insertedPayments++;
            }
        }

        return NextResponse.json({
            success: true,
            message: `${stats.updatedShops}개 광고 수복 및 ${stats.insertedPayments}개 결제 내역 생성 완료`,
            stats
        });

    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
