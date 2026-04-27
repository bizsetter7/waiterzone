import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Service role key — RLS 완전 우회
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
);

/** 요청자 user_id 검증 — Bearer 토큰 또는 mock 세션 쿠키 */
async function getRequestUserId(request: NextRequest): Promise<string | null> {
    // 개발 환경 mock 세션 쿠키 허용
    if (process.env.NODE_ENV !== 'production') {
        const mockCookie = request.cookies.get('coco_mock_session');
        if (mockCookie?.value) {
            try { return JSON.parse(mockCookie.value)?.id || null; } catch { /* ignore */ }
        }
    }

    const authHeader = request.headers.get('authorization') || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token) return null;

    try {
        const { data: { user } } = await supabaseAdmin.auth.getUser(token);
        return user?.id || null;
    } catch {
        return null;
    }
}

export async function POST(request: NextRequest) {
    // 인증 먼저 확인 — body 파싱 전 (미인증 시 json() 예외로 500 반환되는 버그 방지)
    const requesterId = await getRequestUserId(request);
    if (!requesterId) {
        return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    try {
        const { action, resumeData, resumeId } = await request.json();

        if (!resumeData?.user_id) {
            return NextResponse.json({ error: 'user_id is required' }, { status: 400 });
        }

        // 요청자 본인 소유 여부 검증
        if (requesterId !== resumeData.user_id) {
            return NextResponse.json({ error: '본인의 이력서만 저장할 수 있습니다.' }, { status: 403 });
        }

        if (action === 'update' && resumeId) {
            // 수정 전 소유권 재확인
            const { data: existing } = await supabaseAdmin
                .from('resumes')
                .select('user_id')
                .eq('id', resumeId)
                .single();
            if (existing && existing.user_id !== requesterId) {
                return NextResponse.json({ error: '본인의 이력서만 수정할 수 있습니다.' }, { status: 403 });
            }

            // ID, created_at, updated_at 제거 후 업데이트 (resumes 테이블엔 updated_at 없음)
            const { id: _, created_at: __, updated_at: ___, ...updateFields } = resumeData as any;
            const { error } = await supabaseAdmin
                .from('resumes')
                .update(updateFields)
                .eq('id', resumeId);

            if (error) {
                console.error('[resume-save] Update error:', error.message, error.code);
                return NextResponse.json({ error: error.message }, { status: 500 });
            }
            return NextResponse.json({ success: true });

        } else {
            // 신규 등록: mock ID 제거 후 insert
            const { id: _, ...insertFields } = resumeData;
            const { data, error } = await supabaseAdmin
                .from('resumes')
                .insert([insertFields])
                .select()
                .single();

            if (error) {
                console.error('[resume-save] Insert error:', error.message, error.code);
                return NextResponse.json({ error: error.message }, { status: 500 });
            }
            return NextResponse.json({ success: true, data });
        }

    } catch (err: any) {
        console.error('[resume-save] Unexpected error:', err.message);
        return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
    }
}
