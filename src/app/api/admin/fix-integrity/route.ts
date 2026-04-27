import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAdmin } from '@/lib/requireAdmin';

/**
 * POST /api/admin/fix-integrity
 * profiles.points ↔ SUM(point_logs.amount) 불일치를 수복합니다.
 *
 * 동작 방식:
 * - profiles.points > logSum → 차이만큼 point_logs에 CORRECTION 항목 INSERT
 * - profiles.points < logSum → profiles.points를 logSum으로 UPDATE (로그를 신뢰)
 * - mode=dry_run (기본) → 조회만, 실제 수정 없음
 * - mode=fix → 실제 수정
 */
export async function POST(request: NextRequest) {
    const authError = await requireAdmin(request);
    if (authError) return authError;

    const svc = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { autoRefreshToken: false, persistSession: false } }
    );

    try {
        const body = await request.json().catch(() => ({}));
        const mode: 'dry_run' | 'fix' = body.mode === 'fix' ? 'fix' : 'dry_run';

        // 포인트 보유자 전체 조회 (service role → RLS 우회)
        const { data: profiles, error: pErr } = await svc
            .from('profiles')
            .select('id, username, points')
            .gt('points', 0)
            .order('created_at', { ascending: false })
            .limit(200);

        if (pErr) throw pErr;
        if (!profiles || profiles.length === 0) {
            return NextResponse.json({ success: true, message: '포인트 보유자 없음', fixed: 0 });
        }

        const results: any[] = [];
        let fixedCount = 0;

        for (const p of profiles) {
            const { data: logs } = await svc
                .from('point_logs')
                .select('amount')
                .eq('user_id', p.id);

            const logSum = (logs || []).reduce((sum: number, l: any) => sum + (l.amount || 0), 0);

            if (p.points === logSum) continue; // 정상

            const diff = p.points - logSum;
            const entry: any = {
                user_id: p.id.substring(0, 8),
                username: p.username || '—',
                profilePts: p.points,
                logSum,
                diff,
                action: diff > 0 ? 'INSERT_CORRECTION_LOG' : 'UPDATE_PROFILE_POINTS',
                status: 'pending',
            };

            if (mode === 'fix') {
                if (diff > 0) {
                    // profiles.points가 더 많음 → 차이만큼 로그 보정 INSERT
                    const { error: insertErr } = await svc
                        .from('point_logs')
                        .insert({
                            user_id: p.id,
                            amount: diff,
                            reason: 'CORRECTION',
                        });
                    entry.status = insertErr ? `실패: ${insertErr.message}` : '완료 (로그 보정)';
                    if (!insertErr) fixedCount++;
                } else {
                    // logSum이 더 많음 → profiles.points를 logSum으로 수정 (로그 신뢰)
                    const { error: updateErr } = await svc
                        .from('profiles')
                        .update({ points: logSum, updated_at: new Date().toISOString() })
                        .eq('id', p.id);
                    entry.status = updateErr ? `실패: ${updateErr.message}` : '완료 (포인트 수정)';
                    if (!updateErr) fixedCount++;
                }
            }

            results.push(entry);
        }

        return NextResponse.json({
            success: true,
            mode,
            mismatchCount: results.length,
            fixedCount,
            results,
            message: mode === 'dry_run'
                ? `불일치 ${results.length}건 발견 (dry_run — 실제 수정 없음). mode=fix로 재요청 시 수복됩니다.`
                : `${fixedCount}건 수복 완료`,
        });

    } catch (err: any) {
        console.error('[fix-integrity]', err.message);
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
