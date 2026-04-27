import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Service role key — RLS 완전 우회 (서버사이드 전용)
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
);

/** 
 * GET /api/talent/list 
 * 인재정보 목록을 실제 닉네임과 함께 가져옵니다. (RLS 우회 및 수동 조인)
 */
export async function GET(request: NextRequest) {
    try {
        // 1) 이력서 정보 먼저 가져오기
        const { data: resumes, error: resError } = await supabaseAdmin
            .from('resumes')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(50);

        if (resError) {
            console.error('[talent/list] Resumes fetch error:', resError.message);
            return NextResponse.json({ error: resError.message }, { status: 500 });
        }

        if (!resumes || resumes.length === 0) {
            return NextResponse.json({ success: true, talents: [] });
        }

        // 2) 고유한 user_id 목록 추출 (진짜 UUID 형식만 골라내어 DB 에러 방지)
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        const userIds = Array.from(new Set(resumes.map(r => r.user_id).filter(id => id && uuidRegex.test(id))));

        // 3) 프로필 테이블에서 닉네임, 유저네임 정보 가져오기
        let profilesMap: Record<string, any> = {};
        if (userIds.length > 0) {
            const { data: profiles, error: profError } = await supabaseAdmin
                .from('profiles')
                .select('id, nickname, full_name, username') // id(UUID)가 실제 매핑 키입니다.
                .in('id', userIds);

            if (profError) {
                console.error('[talent/list] Profiles join error:', profError.message);
            }

            if (profiles) {
                profiles.forEach(p => {
                    profilesMap[p.id] = p; // 기본키 id를 기준으로 맵에 저장
                });
            }
        }

        // 4) 데이터 수동 병합 및 마스킹 처리
        const mappedData = resumes.map(r => {
            const profile = profilesMap[r.user_id];
            
            // 닉네임 결정 로직: DB 프로필 -> r.writer_name -> 아이디 앞부분 -> '회원'
            let displayName = '회원';
            if (profile) {
                displayName = profile.nickname || profile.full_name || profile.username || '회원';
            } else {
                // 프로필을 못 찾은 경우
                if (r.user_id && r.user_id.length > 5) {
                    // 아이디 앞 4자리라도 보여주어 익명화 방지
                    displayName = `회원(${r.user_id.substring(0, 4)})`;
                }
                console.warn(`[talent/list] No profile found for user_id: ${r.user_id}`);
            }
            
            // 세련된 마스킹 (나O난, 홍O동, 김O 등)
            let maskedName = displayName;
            if (displayName.length === 2) {
                maskedName = displayName.substring(0, 1) + 'O';
            } else if (displayName.length >= 3 && !displayName.includes('(')) {
                // (9483) 같은 괄호 포함 시 마스킹 제외
                maskedName = displayName.substring(0, 1) + 'O' + displayName.substring(displayName.length - 1);
            }

            return {
                ...r,
                name: maskedName,
                author_username: profile?.username || 'unknown'
            };
        });

        return NextResponse.json({ success: true, talents: mappedData });

    } catch (err: any) {
        console.error('[talent/list] Unexpected error:', err.message);
        return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
    }
}
