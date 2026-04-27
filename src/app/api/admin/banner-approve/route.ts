import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAdmin } from '@/lib/requireAdmin';

/**
 * [Admin API] /api/admin/banner-approve
 * 배너 이미지 승인/반려 처리 (service_role 사용으로 RLS 우회)
 *
 * POST body: { adId: string, action: 'approve' | 'reject', rejectReason?: string }
 * approve → banner_status: 'approved'
 * reject  → banner_status: 'rejected_banner', banner_image_url: null
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
        const { adId, action, rejectReason } = await request.json();

        if (!adId || !action) {
            return NextResponse.json({ error: 'adId와 action은 필수입니다.' }, { status: 400 });
        }
        if (action !== 'approve' && action !== 'reject') {
            return NextResponse.json({ error: 'action은 approve 또는 reject만 허용합니다.' }, { status: 400 });
        }

        const nowIso = new Date().toISOString();

        // 현재 광고 데이터 조회 (알림 발송용)
        const { data: shop, error: fetchError } = await supabaseAdmin
            .from('shops')
            .select('id, user_id, title, name, banner_image_url, banner_status')
            .eq('id', Number(adId))
            .single();

        if (fetchError || !shop) {
            return NextResponse.json({ error: `광고(ID: ${adId})를 찾을 수 없습니다.` }, { status: 404 });
        }

        // 배너 업데이트 데이터 구성
        const updateData: Record<string, any> = { updated_at: nowIso };

        if (action === 'approve') {
            updateData.banner_status = 'approved';
        } else {
            updateData.banner_status = 'rejected_banner';
            updateData.banner_image_url = null;
            updateData.banner_media_type = null;
        }

        // shops 테이블 업데이트
        const { error: updateError, count } = await supabaseAdmin
            .from('shops')
            .update(updateData, { count: 'exact' })
            .eq('id', Number(adId));

        if (updateError) throw updateError;
        if (count === 0) {
            throw new Error(`DB 업데이트 실패: 대상 광고(ID: ${adId})를 찾을 수 없습니다.`);
        }

        // 업체회원에게 알림 발송 (UUID인 경우만)
        const targetUserId = shop.user_id;
        const isUuid = targetUserId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(targetUserId);
        if (isUuid) {
            const adName = shop.title || shop.name || '공고';
            await supabaseAdmin.from('notifications').insert({
                user_id: targetUserId,
                type: action === 'approve' ? 'BANNER_APPROVED' : 'BANNER_REJECTED',
                title: action === 'approve' ? '배너 이미지가 승인되었습니다 ✅' : '배너 이미지가 반려되었습니다 ❌',
                message: action === 'approve'
                    ? `'${adName}' 광고의 배너 이미지가 사이드바에 게재됩니다.`
                    : `'${adName}' 배너 이미지가 반려되었습니다. ${rejectReason ? `사유: ${rejectReason}` : '다시 업로드해 주세요.'}`,
                read: false,
                link: '/my-shop?view=dashboard',
                created_at: nowIso,
            });
        }

        return NextResponse.json({
            success: true,
            action,
            adId,
            banner_status: updateData.banner_status,
        });

    } catch (err: any) {
        console.error('[banner-approve] Error:', err.message);
        return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
    }
}
