import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

function getAdmin() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

/**
 * POST /api/monitor/vitals
 * 브라우저 Web Vitals 기록 (LCP, FID, CLS, FCP, TTFB)
 */
export async function POST(req: NextRequest) {
    try {
        const { path, user_id, lcp, fid, cls, fcp, ttfb, device } = await req.json();
        if (!path) return NextResponse.json({ success: false }, { status: 400 });

        const supabase = getAdmin();
        await supabase.from('performance_logs').insert({
            path,
            user_id: user_id || null,
            lcp: lcp ?? null,
            fid: fid ?? null,
            cls: cls ?? null,
            fcp: fcp ?? null,
            ttfb: ttfb ?? null,
            device: device || 'unknown',
        });

        return NextResponse.json({ success: true });
    } catch (err: any) {
        return NextResponse.json({ success: false, message: err.message }, { status: 500 });
    }
}

/**
 * GET /api/monitor/vitals
 * 어드민용 성능 통계 — 페이지별 평균 (기간별: 24h, 7d)
 */
export async function GET(req: NextRequest) {
    try {
        const supabase = getAdmin();
        const { searchParams } = new URL(req.url);
        const period = searchParams.get('period') || '7d';

        // 기간 설정: 24시간(1일) 혹은 7일 (기본값)
        const hours = period === '24h' ? 24 : 168;
        const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

        const { data, error } = await supabase
            .from('performance_logs')
            .select('path, lcp, fid, cls, fcp, ttfb')
            .gte('created_at', since)
            .lt('lcp', 15000) // 15초(15,000ms) 초과 이상치(Outlier)는 통계 왜곡 방지를 위해 제외
            .limit(2000);

        if (error) throw error;

        // 페이지별 평균 계산
        const pageMap: Record<string, { lcp: number[]; fid: number[]; cls: number[]; fcp: number[]; ttfb: number[] }> = {};
        (data || []).forEach((row: any) => {
            if (!pageMap[row.path]) pageMap[row.path] = { lcp: [], fid: [], cls: [], fcp: [], ttfb: [] };
            if (row.lcp != null) pageMap[row.path].lcp.push(row.lcp);
            if (row.fid != null) pageMap[row.path].fid.push(row.fid);
            if (row.cls != null) pageMap[row.path].cls.push(row.cls);
            if (row.fcp != null) pageMap[row.path].fcp.push(row.fcp);
            if (row.ttfb != null) pageMap[row.path].ttfb.push(row.ttfb);
        });

        const avg = (arr: number[]) => arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

        const stats = Object.entries(pageMap).map(([path, vals]) => ({
            path,
            count: vals.lcp.length,
            avg_lcp: avg(vals.lcp),
            avg_fid: avg(vals.fid),
            avg_cls: avg(vals.cls),
            avg_fcp: avg(vals.fcp),
            avg_ttfb: avg(vals.ttfb),
        })).sort((a, b) => b.avg_lcp - a.avg_lcp);

        return NextResponse.json({ success: true, stats });
    } catch (err: any) {
        return NextResponse.json({ success: false, stats: [], message: err.message });
    }
}
