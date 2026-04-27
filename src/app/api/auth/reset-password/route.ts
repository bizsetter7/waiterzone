import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * POST /api/auth/reset-password
 * 본인인증 완료 후 비밀번호 재설정
 * - profiles.username으로 사용자 식별
 * - profiles.full_name === verifiedName 일치 여부 확인 (보안)
 * - Admin API로 비밀번호 업데이트
 */
export async function POST(req: NextRequest) {
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

    if (!serviceRoleKey || !supabaseUrl) {
        return NextResponse.json(
            { success: false, message: '서버 설정 오류입니다.' },
            { status: 501 }
        );
    }

    try {
        const { username, newPassword, verifiedName } = await req.json();

        if (!username || !newPassword || !verifiedName) {
            return NextResponse.json(
                { success: false, message: '필수 정보가 누락되었습니다.' },
                { status: 400 }
            );
        }

        if (newPassword.length < 6) {
            return NextResponse.json(
                { success: false, message: '비밀번호는 6자 이상이어야 합니다.' },
                { status: 400 }
            );
        }

        const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
            auth: { autoRefreshToken: false, persistSession: false }
        });

        // 1. username으로 profiles 조회
        const { data: profile, error: profileError } = await supabaseAdmin
            .from('profiles')
            .select('id, full_name, username')
            .eq('username', username)
            .single();

        if (profileError || !profile) {
            return NextResponse.json(
                { success: false, message: '해당 아이디로 가입된 계정을 찾을 수 없습니다.' },
                { status: 404 }
            );
        }

        // 2. 본인인증 이름과 profiles.full_name 일치 확인
        if (profile.full_name !== verifiedName) {
            return NextResponse.json(
                { success: false, message: '본인인증 정보가 해당 계정과 일치하지 않습니다.' },
                { status: 403 }
            );
        }

        // 3. Admin API로 비밀번호 업데이트
        const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
            profile.id,
            { password: newPassword }
        );

        if (updateError) throw updateError;

        return NextResponse.json({ success: true });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : '서버 오류';
        return NextResponse.json({ success: false, message }, { status: 500 });
    }
}
