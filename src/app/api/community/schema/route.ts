import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
);

/** GET /api/community/schema — 테이블 컬럼 확인용 (디버그) */
export async function GET() {
    const { data, error } = await supabaseAdmin
        .from('community_posts')
        .select('*')
        .limit(1);

    return NextResponse.json({ columns: data ? Object.keys(data[0] || {}) : [], error: error?.message });
}
