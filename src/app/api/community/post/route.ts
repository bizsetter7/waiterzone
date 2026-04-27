import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAdmin } from '@/lib/requireAdmin';

// Service role key — RLS 완전 우회
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
);

/** POST /api/community/post — 게시글 등록 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        if (!body.title?.trim() || !body.content?.trim()) {
            return NextResponse.json({ error: '제목과 내용은 필수입니다.' }, { status: 400 });
        }

        const { data, error } = await supabaseAdmin
            .from('community_posts')
            .insert([{
                author_id: body.author_id || null,
                author: body.author_nickname || body.author_name || '익명', // 닉네임 최우선
                author_name: '익명', // 실명 전송 원천 차단
                author_nickname: body.author_nickname || body.author_name || '익명',
                category: body.category,
                title: body.title,
                content: body.content,
                password: body.password || '',
                is_secret: body.is_secret || false,
                created_at: new Date().toISOString(),
            }])
            .select()
            .single();

        if (error) {
            console.error('[community/post] Insert error:', error.message, error.code);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, data });

    } catch (err: any) {
        console.error('[community/post] Unexpected error:', err.message);
        return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
    }
}

/** PATCH /api/community/post — 관리자 권한 게시글 수정 */
export async function PATCH(request: NextRequest) {
    const authError = await requireAdmin(request);
    if (authError) return authError;

    try {
        const body = await request.json();
        const { id, title, content, category } = body;

        if (!id) return NextResponse.json({ error: '게시글 ID가 필요합니다.' }, { status: 400 });
        if (!title?.trim() || !content?.trim()) return NextResponse.json({ error: '제목과 내용은 필수입니다.' }, { status: 400 });

        const { error } = await supabaseAdmin
            .from('community_posts')
            .update({ title, content, category, updated_at: new Date().toISOString() })
            .eq('id', id);

        if (error) {
            console.error('[community/post] Admin update error:', error.message);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });

    } catch (err: any) {
        console.error('[community/post] Unexpected update error:', err.message);
        return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
    }
}

/** DELETE /api/community/post — 관리자 권한 게시글 삭제 (비밀번호 없음) */
export async function DELETE(request: NextRequest) {
    const authError = await requireAdmin(request);
    if (authError) return authError;

    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        
        if (!id) {
            return NextResponse.json({ error: '게시글 ID가 필요합니다.' }, { status: 400 });
        }

        const { error } = await supabaseAdmin
            .from('community_posts')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('[community/post] Admin delete error:', error.message);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });

    } catch (err: any) {
        console.error('[community/post] Unexpected delete error:', err.message);
        return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
    }
}
