import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getAdmin() {
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceKey) return null;
    return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey);
}

// GET /api/sos/history?shopId=xxx
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const shopId = searchParams.get('shopId');

    if (!shopId) return NextResponse.json({ alerts: [] });

    const supabaseAdmin = getAdmin();
    if (!supabaseAdmin) return NextResponse.json({ alerts: [] });

    try {
        const { data, error } = await supabaseAdmin
            .from('sos_alerts')
            .select('id, message, target_regions, point_deducted, recipient_count, sent_at')
            .eq('shop_id', shopId)
            .order('sent_at', { ascending: false })
            .limit(10);

        if (error) throw error;

        return NextResponse.json({ alerts: data ?? [] });
    } catch (err: any) {
        return NextResponse.json({ alerts: [], error: err.message });
    }
}
