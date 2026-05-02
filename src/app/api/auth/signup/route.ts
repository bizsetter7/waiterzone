import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * POST /api/auth/signup
 * Supabase Admin API로 가입 처리 → email_confirm: true 설정으로 이메일 확인 없이 즉시 로그인 가능
 */
export async function POST(req: NextRequest) {
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

    // SERVICE_ROLE_KEY가 없으면 클라이언트 SDK fallback 안내
    if (!serviceRoleKey || !supabaseUrl) {
        return NextResponse.json(
            { success: false, code: 'NO_ADMIN_KEY', message: 'SUPABASE_SERVICE_ROLE_KEY가 설정되지 않았습니다.' },
            { status: 501 }
        );
    }

    try {
        const { email, password, name, nickname, role, phone, birthdate, gender, contact_email, identity_ci, username: usernameParam } = await req.json();

        if (!email || !password) {
            return NextResponse.json(
                { success: false, message: '이메일과 비밀번호는 필수입니다.' },
                { status: 400 }
            );
        }

        const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
            auth: { autoRefreshToken: false, persistSession: false }
        });

        // [중복가입 방지] 개인회원 본인인증 CI 중복 체크
        if (role === 'individual' && identity_ci) {
            const { data: existingCi } = await supabaseAdmin
                .from('profiles')
                .select('id')
                .eq('identity_ci', identity_ci)
                .maybeSingle();
            if (existingCi) {
                return NextResponse.json(
                    { success: false, code: 'DUPLICATE_IDENTITY', message: '동일한 회원정보로 이미 가입되어있습니다.' },
                    { status: 409 }
                );
            }
        }

        // Admin API로 가입: email_confirm: true → 이메일 확인 없이 즉시 로그인 가능
        const { data, error } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: {
                full_name: name,
                nickname: nickname || '',
                role: role || 'individual',
                phone: phone || '',
                birthdate: birthdate || '',
                gender: gender || '',
            },
        });

        if (error) {
            // 이미 등록된 이메일(아이디) 중복 처리 → 한국어 메시지 반환
            const isAlreadyRegistered =
                error.message?.toLowerCase().includes('already registered') ||
                error.message?.toLowerCase().includes('already exists') ||
                error.message?.toLowerCase().includes('duplicate');
            return NextResponse.json(
                {
                    success: false,
                    code: isAlreadyRegistered ? 'ALREADY_REGISTERED' : 'SIGNUP_ERROR',
                    message: isAlreadyRegistered
                        ? '이미 사용 중인 아이디입니다. 다른 아이디를 선택해주세요.'
                        : error.message,
                },
                { status: isAlreadyRegistered ? 409 : 400 }
            );
        }

        // [이중보장] email_confirm: true가 키 권한 문제로 미적용될 경우를 대비해
        // updateUserById로 한 번 더 이메일 확인 처리
        if (data.user?.id && !data.user?.email_confirmed_at) {
            try {
                await supabaseAdmin.auth.admin.updateUserById(data.user.id, {
                    email_confirm: true,
                });
            } catch (updateErr) {
                console.warn('[signup] updateUserById 실패 (무시):', updateErr);
            }
        }

        // [profiles 직접 삽입] DB 트리거(on_auth_user_created) 미적용 환경 대응
        // 트리거가 있어도 upsert는 중복 없이 안전하게 동작
        if (data.user?.id) {
            const finalRole = role || 'individual';
            const finalUsername = usernameParam || email.split('@')[0];
            const profilePayload: Record<string, any> = {
                id: data.user.id,
                username: finalUsername,
                full_name: name || '',
                nickname: nickname || name || finalUsername,
                // role + user_type 둘 다 설정 (라이브 DB 트리거는 user_type만 쓰는 경우 대응)
                role: finalRole,
                user_type: finalRole,
                points: finalRole === 'individual' ? 100 : 0, // 가입 축하 포인트 — 개인회원만 지급
            };
            // migration 05 컬럼 (있으면 삽입, 없으면 fallback에서 제외)
            if (phone) profilePayload.phone = phone;
            if (gender) profilePayload.gender = gender;
            if (contact_email) profilePayload.contact_email = contact_email;
            if (identity_ci) profilePayload.identity_ci = identity_ci;

            const { error: profileErr } = await supabaseAdmin
                .from('profiles')
                .upsert(profilePayload, { onConflict: 'id' });

            if (profileErr) {
                // 컬럼 미존재 시 반드시 존재하는 최소 필드로 재시도
                const { error: fallbackErr } = await supabaseAdmin.from('profiles').upsert({
                    id: data.user.id,
                    username: finalUsername,
                    full_name: name || '',
                    nickname: nickname || name || finalUsername,
                    role: finalRole,
                    user_type: finalRole,
                    points: finalRole === 'individual' ? 100 : 0,
                }, { onConflict: 'id' });
                if (fallbackErr) console.warn('[signup] profiles 기본 삽입 실패:', fallbackErr.message);
            }
        }

        return NextResponse.json({ success: true, userId: data.user?.id });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : '서버 오류';
        return NextResponse.json({ success: false, message }, { status: 500 });
    }
}
