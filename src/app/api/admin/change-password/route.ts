import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * POST /api/admin/change-password
 * 어드민 비밀번호 변경 — 현재 비밀번호로 재인증 후 새 비밀번호로 업데이트
 * (mock 세션 상태에서 supabase.auth.updateUser()가 세션 없어서 실패하는 문제 해결)
 */
export async function POST(request: Request) {
    try {
        const { email, currentPassword, newPassword } = await request.json();

        if (!email || !currentPassword || !newPassword) {
            return NextResponse.json({ error: '이메일, 현재 비밀번호, 새 비밀번호를 모두 입력해주세요.' }, { status: 400 });
        }

        if (newPassword.length < 6) {
            return NextResponse.json({ error: '새 비밀번호는 6자 이상이어야 합니다.' }, { status: 400 });
        }

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        // 1단계: 현재 비밀번호로 재인증 (보안 검증)
        const authClient = createClient(supabaseUrl, anonKey);
        const { data: signInData, error: signInError } = await authClient.auth.signInWithPassword({
            email,
            password: currentPassword,
        });

        if (signInError || !signInData.user) {
            return NextResponse.json({ error: '현재 비밀번호가 올바르지 않습니다.' }, { status: 401 });
        }

        // 2단계: 어드민 role 확인
        const adminClient = serviceKey
            ? createClient(supabaseUrl, serviceKey)
            : authClient;

        const { data: profile } = await adminClient
            .from('profiles')
            .select('role')
            .eq('id', signInData.user.id)
            .single();

        if (profile?.role !== 'admin') {
            return NextResponse.json({ error: '어드민 계정이 아닙니다.' }, { status: 403 });
        }

        // 3단계: 새 비밀번호로 업데이트 (service role 사용)
        if (serviceKey) {
            const { error: updateError } = await adminClient.auth.admin.updateUserById(
                signInData.user.id,
                { password: newPassword }
            );
            if (updateError) throw updateError;
        } else {
            // service role 없으면 재인증된 세션으로 updateUser
            const { error: updateError } = await authClient.auth.updateUser({ password: newPassword });
            if (updateError) throw updateError;
        }

        return NextResponse.json({ success: true });
    } catch (err: any) {
        console.error('[change-password]', err);
        return NextResponse.json({ error: err.message || '비밀번호 변경에 실패했습니다.' }, { status: 500 });
    }
}
