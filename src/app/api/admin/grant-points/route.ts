import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAdmin } from '@/lib/requireAdmin';

// Service role key — RLS 완전 우회 (서버 전용)
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function POST(request: NextRequest) {
    const authError = await requireAdmin(request);
    if (authError) return authError;

    try {
        const { userId, amount, reason } = await request.json();

        if (!userId || typeof amount !== 'number' || amount === 0) {
            return NextResponse.json({ success: false, message: '올바르지 않은 요청입니다.' }, { status: 400 });
        }

        // 1. 현재 포인트 조회
        const { data: profile, error: profileError } = await supabaseAdmin
            .from('profiles')
            .select('points')
            .eq('id', userId)
            .single();

        if (profileError || !profile) {
            return NextResponse.json({ success: false, message: '회원을 찾을 수 없습니다.' }, { status: 404 });
        }

        const newTotal = (profile.points || 0) + amount;

        // 2. profiles.points 업데이트
        const { error: updateError } = await supabaseAdmin
            .from('profiles')
            .update({ points: newTotal, updated_at: new Date().toISOString() })
            .eq('id', userId);

        if (updateError) throw updateError;

        // 3. point_logs 기록 (사유 포함)
        const { error: logError } = await supabaseAdmin
            .from('point_logs')
            .insert({ 
                user_id: userId, 
                amount, 
                reason: reason || 'ADMIN_GRANT' 
            });

        if (logError) throw logError;

        return NextResponse.json({ success: true, newTotal });
    } catch (err: any) {
        console.error('[grant-points] error:', err);
        return NextResponse.json({ success: false, message: err.message || '서버 오류' }, { status: 500 });
    }
}
