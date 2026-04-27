import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAdmin } from '@/lib/requireAdmin';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
);

// GET: 사업자 인증 요청 목록 조회 (관리자용)
export async function GET(req: NextRequest) {
    const authError = await requireAdmin(req);
    if (authError) return authError;
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || 'pending';

    const { data, error } = await supabaseAdmin
        .from('profiles')
        .select('id, username, full_name, business_name, business_number, business_type, business_file_url, manager_phone, manager_kakao, manager_line, manager_telegram, business_verify_status, business_verify_requested_at, business_verified_at')
        .eq('business_verify_status', status)
        .order('business_verify_requested_at', { ascending: false });

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
}

// POST: 승인 또는 반려
export async function POST(req: NextRequest) {
    const authError = await requireAdmin(req);
    if (authError) return authError;

    const body = await req.json();
    const { profileId, action, rejectReason } = body;
    // action: 'approve' | 'reject'

    if (!profileId || !action) {
        return NextResponse.json({ error: '필수 파라미터 누락' }, { status: 400 });
    }

    const now = new Date().toISOString();

    if (action === 'approve') {
        // 1. profiles 업데이트
        const { error: updateError } = await supabaseAdmin
            .from('profiles')
            .update({
                business_verified: true,
                business_verify_status: 'approved',
                business_verified_at: now,
            })
            .eq('id', profileId);

        if (updateError) {
            return NextResponse.json({ error: updateError.message }, { status: 500 });
        }

        // 2. notifications 테이블에 승인 알림 생성
        const { error: notifError } = await supabaseAdmin
            .from('notifications')
            .insert({
                user_id: profileId,
                type: 'business_verify',
                title: '사업자 인증이 완료되었습니다 ✅',
                message: '사업자 인증이 승인되었습니다. 이제 공고 등록이 가능합니다.',
                read: false,
                link: '/my-shop',
                created_at: now,
            });

        if (notifError) {
            console.error('[business-verify] notification insert error:', notifError.message);
            // 알림 실패해도 승인은 완료 처리
        }

        return NextResponse.json({ success: true, message: '승인 완료' });

    } else if (action === 'reject') {
        const reason = rejectReason || '제출하신 서류를 확인할 수 없습니다.';

        const { error: updateError } = await supabaseAdmin
            .from('profiles')
            .update({
                business_verified: false,
                business_verify_status: 'rejected',
            })
            .eq('id', profileId);

        if (updateError) {
            return NextResponse.json({ error: updateError.message }, { status: 500 });
        }

        // 반려 알림
        await supabaseAdmin
            .from('notifications')
            .insert({
                user_id: profileId,
                type: 'business_verify',
                title: '사업자 인증 반려 안내',
                message: `사업자 인증이 반려되었습니다. 사유: ${reason}. 서류를 재확인 후 다시 신청해주세요.`,
                read: false,
                link: '/my-shop?view=member-info',
                created_at: now,
            });

        return NextResponse.json({ success: true, message: '반려 완료' });
    }

    return NextResponse.json({ error: '잘못된 action 값' }, { status: 400 });
}
