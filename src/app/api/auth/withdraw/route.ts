import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

/**
 * POST /api/auth/withdraw
 * 회원 탈퇴 처리
 * 1. profiles 개인정보 익명화 (삭제 대신 nullify — 거래내역 참조 보존)
 * 2. Supabase Auth 계정 삭제
 */
export async function POST(req: NextRequest) {
    try {
        const { userId } = await req.json();
        if (!userId) {
            return NextResponse.json({ error: '사용자 ID가 필요합니다.' }, { status: 400 });
        }

        // 1. profiles 개인정보 익명화 (법적 보관 의무 없는 항목 삭제)
        const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .update({
                full_name: null,
                phone: null,
                birth_date: null,
                gender: null,
                nickname: '탈퇴회원',
                contact_email: null,
                address: null,
                is_withdrawn: true,
                withdrawn_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            })
            .eq('id', userId);

        if (profileError) {
            // 컬럼 미존재 시 (마이그레이션 05 미적용 환경) 최소 컬럼으로 재시도
            const { error: fallbackError } = await supabaseAdmin
                .from('profiles')
                .update({
                    full_name: null,
                    nickname: '탈퇴회원',
                    birth_date: null,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', userId);

            if (fallbackError) {
                console.error('[withdraw] profiles 익명화 실패 (fallback):', fallbackError.message);
                return NextResponse.json({ error: '회원 정보 처리 중 오류가 발생했습니다.' }, { status: 500 });
            }
            console.warn('[withdraw] 일부 컬럼 미존재로 최소 익명화 처리 (migration 05 미적용):', profileError.message);
        }

        // 2. Supabase Auth 계정 삭제 (service role 필요)
        const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);

        if (authError) {
            console.error('[withdraw] Auth 계정 삭제 실패:', authError.message);
            // Auth 삭제 실패해도 profiles는 이미 익명화됨 — 기록만 남김
            return NextResponse.json({ error: '계정 삭제 중 오류가 발생했습니다. 고객센터에 문의해주세요.' }, { status: 500 });
        }

        return NextResponse.json({ success: true, message: '탈퇴가 완료되었습니다.' });
    } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : '알 수 없는 오류';
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}
