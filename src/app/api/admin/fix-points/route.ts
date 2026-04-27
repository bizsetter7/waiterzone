import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/requireAdmin';

/**
 * [Admin Tool] /api/admin/fix-points
 * 24시간 내 가입자 중 포인트가 0인 유저들에게 가입 보너스(100P)를 수동 지급합니다. (v2.0.8)
 */
export async function POST(request: NextRequest) {
    const authError = await requireAdmin(request);
    if (authError) return authError;

    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

    if (!serviceRoleKey || !supabaseUrl) {
        return NextResponse.json({ success: false, message: 'Missing env keys' }, { status: 500 });
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
        auth: { autoRefreshToken: false, persistSession: false }
    });

    try {
        const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        
        // 1. 대상 유저 조회
        const { data: profiles, error: fetchError } = await supabaseAdmin
            .from('profiles')
            .select('id, username, nickname, points, created_at')
            .gte('created_at', since)
            .eq('points', 0);
        
        if (fetchError) throw fetchError;
        if (!profiles || profiles.length === 0) {
            return NextResponse.json({ success: true, message: '복구 대상 유저가 없습니다.', count: 0 });
        }

        const fixResults = [];

        // 2. 루프 돌며 포인트 지급 및 로그 기록
        for (const user of profiles) {
            // 포인트 업데이트
            const { error: updateError } = await supabaseAdmin
                .from('profiles')
                .update({ points: 100, updated_at: new Date().toISOString() })
                .eq('id', user.id);
            
            if (updateError) {
                fixResults.push({ id: user.id, username: user.username, status: 'FAILED_UPDATE', error: updateError.message });
                continue;
            }

            // 로그 기록 (note 컬럼 미존재 — user_id/amount/reason만 사용)
            const { error: logError } = await supabaseAdmin
                .from('point_logs')
                .insert({
                    user_id: user.id,
                    amount: 100,
                    reason: 'JOIN',
                });
            
            fixResults.push({ 
                id: user.id, 
                username: user.username, 
                status: logError ? 'UPDATE_ONLY' : 'SUCCESS',
                logError: logError ? logError.message : null
            });
        }

        return NextResponse.json({ 
            success: true, 
            message: `총 ${profiles.length}명 복구 프로세스 완료`, 
            details: fixResults 
        });

    } catch (err: any) {
        return NextResponse.json({ success: false, message: err.message }, { status: 500 });
    }
}
