import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * POST /api/auth/find-username
 * 본인인증 결과(이름)로 아이디(username) 찾기
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
        const { name } = await req.json();

        if (!name) {
            return NextResponse.json(
                { success: false, message: '이름 정보가 필요합니다.' },
                { status: 400 }
            );
        }

        const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
            auth: { autoRefreshToken: false, persistSession: false }
        });

        // profiles에서 full_name으로 조회 (waiterzone.kr 이메일 계정만)
        const { data: profiles, error } = await supabaseAdmin
            .from('profiles')
            .select('username, full_name')
            .eq('full_name', name)
            .not('username', 'is', null);

        if (error) throw error;

        if (!profiles || profiles.length === 0) {
            return NextResponse.json(
                { success: false, message: '해당 이름으로 가입된 계정을 찾을 수 없습니다.' },
                { status: 404 }
            );
        }

        // 여러 계정이 있을 경우 마스킹 처리 후 반환
        const usernames = profiles.map(p => {
            const id = p.username || '';
            // 앞 2자 + *** + 마지막 1자 마스킹
            if (id.length <= 3) return id.slice(0, 1) + '***';
            return id.slice(0, 2) + '*'.repeat(id.length - 3) + id.slice(-1);
        });

        return NextResponse.json({
            success: true,
            usernames,
            // 단일 계정이면 그대로 반환 (로그인 바로가기용)
            exactUsername: profiles.length === 1 ? profiles[0].username : null,
        });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : '서버 오류';
        return NextResponse.json({ success: false, message }, { status: 500 });
    }
}
