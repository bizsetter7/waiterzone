import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAdmin } from '@/lib/requireAdmin';

export const dynamic = 'force-dynamic';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
);

/**
 * PATCH /api/admin/set-banner
 * 어드민이 기존 공고에 배너를 직접 연결 + 즉시 승인 처리
 * Body: { shopId, bannerImageUrl, bannerPosition, bannerMediaType }
 */
export async function PATCH(req: NextRequest) {
    const authError = await requireAdmin(req);
    if (authError) return authError;

    try {
        const { shopId, bannerImageUrl, bannerPosition, bannerMediaType } = await req.json();

        if (!shopId || !bannerImageUrl || !bannerPosition) {
            return NextResponse.json(
                { error: 'shopId, bannerImageUrl, bannerPosition은 필수입니다.' },
                { status: 400 }
            );
        }

        if (bannerPosition === 'none') {
            return NextResponse.json(
                { error: '배너 위치를 선택해주세요.' },
                { status: 400 }
            );
        }

        // shops.id는 bigint → Number() 변환 필수
        const { error } = await supabaseAdmin
            .from('shops')
            .update({
                banner_image_url: bannerImageUrl,
                banner_position: bannerPosition,
                banner_media_type: bannerMediaType || 'image',
                banner_status: 'approved',  // 관리자 직접 배정 = 즉시 승인
                updated_at: new Date().toISOString(),
            })
            .eq('id', Number(shopId));

        if (error) {
            console.error('[set-banner] Supabase error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });

    } catch (err: any) {
        console.error('[set-banner] Server error:', err);
        return NextResponse.json({ error: err.message || '서버 오류' }, { status: 500 });
    }
}
