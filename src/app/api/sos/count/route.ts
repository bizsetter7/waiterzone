import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// GET /api/sos/count?regions=강남구,서초구
// 해당 지역의 알림 수신 동의 구직자 수 반환 (업체가 발송 전 확인용)
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const regionsParam = searchParams.get('regions');

    if (!regionsParam) {
        return NextResponse.json({ count: 0 });
    }

    const regions = regionsParam.split(',').map(r => r.trim()).filter(Boolean);

    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceKey) {
        // 개발환경 또는 키 미설정 시 임시 카운트 반환
        return NextResponse.json({ count: 0, regions, note: 'service key not configured' });
    }

    const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        serviceKey
    );

    try {
        const { count, error } = await supabaseAdmin
            .from('push_subscriptions')
            .select('*', { count: 'exact', head: true })
            .overlaps('regions', regions);

        if (error) throw error;

        return NextResponse.json({ count: count ?? 0, regions });
    } catch (err: any) {
        console.error('SOS count error:', err);
        return NextResponse.json({ count: 0, error: err.message });
    }
}
