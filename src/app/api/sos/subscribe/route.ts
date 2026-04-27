import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getAdmin() {
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceKey) return null;
    return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey);
}

// POST /api/sos/subscribe — 구직자 Web Push 구독 등록/갱신
export async function POST(request: Request) {
    try {
        const { userId, subscription, regions } = await request.json();

        if (!userId || !subscription) {
            return NextResponse.json({ error: '필수 파라미터 누락' }, { status: 400 });
        }

        const supabaseAdmin = getAdmin();
        if (!supabaseAdmin) {
            return NextResponse.json({ error: 'Server not configured' }, { status: 503 });
        }

        const { error } = await supabaseAdmin
            .from('push_subscriptions')
            .upsert({
                user_id: userId,
                subscription: subscription,
                regions: regions || [],
                updated_at: new Date().toISOString(),
            }, { onConflict: 'user_id' });

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (err: any) {
        console.error('Push subscribe error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

// DELETE /api/sos/subscribe — 구독 해제
export async function DELETE(request: Request) {
    try {
        const { userId } = await request.json();
        if (!userId) return NextResponse.json({ error: '필수 파라미터 누락' }, { status: 400 });

        const supabaseAdmin = getAdmin();
        if (!supabaseAdmin) {
            return NextResponse.json({ error: 'Server not configured' }, { status: 503 });
        }

        const { error } = await supabaseAdmin
            .from('push_subscriptions')
            .delete()
            .eq('user_id', userId);

        if (error) throw error;
        return NextResponse.json({ success: true });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
