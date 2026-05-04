import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * POST /api/auth/oauth-complete
 *
 * Google OAuth 가입자의 profile 보정 API.
 *
 * 배경:
 * - Google OAuth는 /api/auth/signup을 거치지 않아 profiles 데이터가 누락됨
 * - DB 트리거가 username='신규회원' 같은 placeholder만 설정
 * - 100포인트 가입 보너스 미지급
 *
 * 동작:
 * - 세션 access_token으로 user_id 식별
 * - auth.users.raw_user_meta_data에서 Google 데이터(full_name/email/avatar) 추출
 * - profiles row가 placeholder 상태면 실제 데이터로 보정
 * - 개인회원 첫 보정 시 100포인트 지급 + point_logs 기록 (재실행 멱등 보장)
 */
export async function POST(req: NextRequest) {
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!serviceRoleKey || !supabaseUrl) {
        return NextResponse.json({ success: false, message: 'Service role 미설정' }, { status: 500 });
    }

    try {
        const authHeader = req.headers.get('authorization') || '';
        const token = authHeader.replace(/^Bearer\s+/i, '');
        if (!token) {
            return NextResponse.json({ success: false, message: 'Authorization 헤더 누락' }, { status: 401 });
        }

        const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
            auth: { autoRefreshToken: false, persistSession: false },
        });

        // 세션 토큰으로 user 조회
        const { data: userData, error: userErr } = await supabaseAdmin.auth.getUser(token);
        if (userErr || !userData?.user) {
            return NextResponse.json({ success: false, message: '유효하지 않은 세션' }, { status: 401 });
        }

        const authUser = userData.user;
        const userId = authUser.id;
        const meta = (authUser.user_metadata || {}) as Record<string, any>;
        const email = authUser.email || '';

        // 기존 profiles 조회
        const { data: existing } = await supabaseAdmin
            .from('profiles')
            .select('id, username, full_name, nickname, role, user_type, points, contact_email')
            .eq('id', userId)
            .maybeSingle();

        // placeholder 판단: username이 '신규회원'이거나 비어있고 + full_name이 비어있으면 신규 OAuth 가입자
        const isPlaceholder = !existing
            || !existing.username
            || existing.username === '신규회원'
            || (!existing.full_name && !existing.nickname);

        if (!isPlaceholder) {
            return NextResponse.json({ success: true, alreadyComplete: true });
        }

        // Google OAuth metadata에서 추출
        const googleName = meta.full_name || meta.name || meta.preferred_username || '';
        const googleEmail = email;
        const finalUsername = (existing?.username && existing.username !== '신규회원')
            ? existing.username
            : (googleEmail.split('@')[0] || `user_${userId.slice(0, 8)}`);
        const finalRole = existing?.role && existing.role !== '' ? existing.role : 'individual';

        // upsert (멱등)
        const profilePayload: Record<string, any> = {
            id: userId,
            username: finalUsername,
            full_name: googleName || existing?.full_name || '',
            nickname: existing?.nickname || googleName || finalUsername,
            role: finalRole,
            user_type: finalRole,
            contact_email: existing?.contact_email || googleEmail,
        };

        const { error: upsertErr } = await supabaseAdmin
            .from('profiles')
            .upsert(profilePayload, { onConflict: 'id' });

        if (upsertErr) {
            return NextResponse.json({ success: false, message: `Profile 보정 실패: ${upsertErr.message}` }, { status: 500 });
        }

        // 100포인트 보너스 — 개인회원 + 아직 SIGNUP_BONUS 로그 없을 때만 (재실행 멱등)
        let pointsGranted = false;
        if (finalRole === 'individual') {
            const { data: existingBonus } = await supabaseAdmin
                .from('point_logs')
                .select('id')
                .eq('user_id', userId)
                .eq('reason', 'SIGNUP_BONUS')
                .maybeSingle();

            if (!existingBonus) {
                const currentPoints = existing?.points || 0;
                await supabaseAdmin
                    .from('profiles')
                    .update({ points: currentPoints + 100 })
                    .eq('id', userId);
                await supabaseAdmin
                    .from('point_logs')
                    .insert({ user_id: userId, amount: 100, reason: 'SIGNUP_BONUS' });
                pointsGranted = true;
            }
        }

        return NextResponse.json({
            success: true,
            corrected: true,
            pointsGranted,
            username: finalUsername,
            full_name: profilePayload.full_name,
        });
    } catch (err: any) {
        return NextResponse.json({ success: false, message: err?.message || 'Unknown error' }, { status: 500 });
    }
}
