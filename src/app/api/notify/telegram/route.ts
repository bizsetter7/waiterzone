import { NextResponse } from 'next/server';

// GET /api/notify/telegram?setup=1 → 관리자 Chat ID 확인용
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const isSetup = searchParams.get('setup');

    if (!isSetup) return NextResponse.json({ error: 'use ?setup=1' }, { status: 400 });

    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) return NextResponse.json({ error: 'TELEGRAM_BOT_TOKEN not set' }, { status: 503 });

    try {
        const res = await fetch(`https://api.telegram.org/bot${token}/getUpdates`);
        const data = await res.json();
        const updates = data.result ?? [];

        if (!updates.length) {
            return NextResponse.json({
                message: '봇에게 먼저 메시지를 보내주세요 (@waiterzone_bot 에서 /start)',
                updates: []
            });
        }

        const chatId = updates[updates.length - 1]?.message?.chat?.id;
        const from = updates[updates.length - 1]?.message?.from;

        return NextResponse.json({ chatId, from, hint: '.env.local에 TELEGRAM_ADMIN_CHAT_ID=' + chatId + ' 추가하세요' });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
