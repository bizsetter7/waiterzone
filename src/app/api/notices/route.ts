import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * GET /api/notices?platform=waiterzone
 * 공개 공지사항 조회 — platform 필터 + 발행 상태 기준
 * P2 코코알바 notices 테이블(공유 DB)에서 waiterzone 대상 공지만 반환
 */
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const platform = searchParams.get('platform') || 'waiterzone';

    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    try {
        const now = new Date().toISOString();
        const { data, error } = await supabase
            .from('notices')
            .select('id, badge, title, content, is_pinned, published_at, expires_at, platforms')
            .eq('is_published', true)
            .contains('platforms', [platform])
            .or(`expires_at.is.null,expires_at.gt.${now}`)
            .order('is_pinned', { ascending: false })
            .order('published_at', { ascending: false })
            .limit(50);

        if (error) throw error;
        return NextResponse.json({ notices: data ?? [] });
    } catch (err: any) {
        return NextResponse.json({ notices: [], error: err.message }, { status: 200 });
    }
}
