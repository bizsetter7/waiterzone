import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Service role key — RLS 완전 우회 (READ 포함)
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
);

/** GET /api/community/posts — 게시글 목록 조회 (RLS 우회) */
export async function GET() {
    try {
        const { data, error } = await supabaseAdmin
            .from('community_posts')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(200);

        if (error) {
            console.error('[community/posts] Fetch error:', error.message);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, data: data || [] });

    } catch (err: any) {
        console.error('[community/posts] Unexpected error:', err.message);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
