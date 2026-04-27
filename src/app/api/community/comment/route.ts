import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Service role key — RLS 완전 우회
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
);

/** POST /api/community/comment — 댓글 등록 */
export async function POST(request: NextRequest) {
    try {
        const { post_id, author_id, author, content } = await request.json();

        if (!post_id || !content?.trim()) {
            return NextResponse.json({ error: 'post_id와 content는 필수입니다.' }, { status: 400 });
        }

        const trimmed = content.trim();
        const uniqueChars = new Set(trimmed.replace(/\s/g, '').split('')).size;
        
        // 1. 기본 길이 및 중복 문자 체크
        if (trimmed.length < 5 || (uniqueChars <= 2 && trimmed.length < 10)) {
            return NextResponse.json({ 
                error: '성의 있는 댓글을 작성해주세요! (최소 5자 이상, 의미 없는 반복 차단)' 
            }, { status: 400 });
        }

        // 2. [Advanced] 무맥락/형식적 댓글 차단 (v1.5)
        // 게시글 제목 정보를 가져와서 연관성 확인
        const { data: postData } = await supabaseAdmin
            .from('community_posts')
            .select('title')
            .eq('id', post_id)
            .single();

        if (postData) {
            const spamPhrases = ['잘보고갑니다', '좋은정보', '감사합니다', '출첵', '출석', 'ㅎㅇ', 'ㅎㅇㅌ', '화이팅', '다녀갑니다', '반가워요', '방가방가'];
            const isSpamLabel = spamPhrases.some(p => trimmed.replace(/\s/g, '').includes(p.replace(/\s/g, '')));
            const titleKeywords = postData.title.split(/[\s,!?~]+/).filter((w: string) => w.length >= 2);
            const hasRelevance = titleKeywords.length === 0 || titleKeywords.some((kw: string) => trimmed.includes(kw));

            // 15자 미만의 짧은 댓글이 제목 키워드도 없고 스팸 문구만 포함된 경우 차단
            if (trimmed.length < 15 && isSpamLabel && !hasRelevance) {
                return NextResponse.json({ 
                    error: '게시글 내용과 관련된 댓글을 작성해주세요! (형식적인 인사나 무맥락 댓글은 등록되지 않습니다)' 
                }, { status: 400 });
            }
        }

        const { data, error } = await supabaseAdmin
            .from('community_comments')
            .insert([{
                post_id,
                author_id: author_id || null,
                author: author || '익명',
                content: trimmed,
                created_at: new Date().toISOString(),
            }])
            .select()
            .single();

        if (error) {
            console.error('[community/comment] Insert error:', error.message, error.code);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, data });

    } catch (err: any) {
        console.error('[community/comment] Unexpected error:', err.message);
        return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
    }
}
