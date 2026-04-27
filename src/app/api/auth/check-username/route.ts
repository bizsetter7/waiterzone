import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * GET /api/auth/check-username?id=bizsetter
 * 아이디 중복확인 API
 * - profiles.username 컬럼으로 직접 조회 (listUsers 불필요)
 */
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id')?.trim();

    if (!id) {
        return NextResponse.json({ available: false, message: '아이디를 입력해주세요.' }, { status: 400 });
    }
    if (id.length < 4 || id.length > 20) {
        return NextResponse.json({ available: false, message: '아이디는 4~20자여야 합니다.' }, { status: 400 });
    }
    if (!/^[a-zA-Z0-9]+$/.test(id)) {
        return NextResponse.json({ available: false, message: '아이디는 영문/숫자만 사용 가능합니다.' }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseAnonKey) {
        try {
            // profiles.username 컬럼으로 직접 조회 (Public read 정책으로 anon key 사용 가능)
            const client = createClient(supabaseUrl, supabaseAnonKey, {
                auth: { autoRefreshToken: false, persistSession: false }
            });
            const { data, error } = await client
                .from('profiles')
                .select('id')
                .eq('username', id)
                .maybeSingle();

            if (error) throw error;

            if (data) {
                return NextResponse.json({ available: false, message: '이미 사용 중인 아이디입니다.' });
            }
            return NextResponse.json({ available: true, message: '사용 가능한 아이디입니다.' });
        } catch (err: any) {
            console.error('[check-username] profiles 조회 오류:', err.message);
            // 조회 실패 시 안전하게 사용불가 반환 (가입 시 Supabase 최종 검증)
            return NextResponse.json({
                available: false,
                message: '아이디 중복확인 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
                code: 'CHECK_FAILED'
            }, { status: 503 });
        }
    }

    // 환경변수 없음 → 사용 가능 (signUp 시 Supabase 최종 검증)
    return NextResponse.json({ available: true, message: '사용 가능한 아이디입니다.' });
}
