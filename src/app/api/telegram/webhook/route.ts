import { NextResponse } from 'next/server';
import { sendCsBotMessage } from '@/lib/telegram';

const ADMIN_CHAT_ID = process.env.TELEGRAM_ADMIN_CHAT_ID;

export async function POST(request: Request) {
    try {
        const body = await request.json();

        if (!body.message?.text) return NextResponse.json({ ok: true });

        const chatId = String(body.message.chat.id);
        const text: string = body.message.text;
        const username = body.message.from?.username
            ? `@${body.message.from.username}`
            : body.message.from?.first_name || '고객';

        // 관리자 답장 명령: /reply <chatId> <메시지>
        if (chatId === ADMIN_CHAT_ID && text.startsWith('/reply ')) {
            const after = text.slice(7);
            const spaceIdx = after.indexOf(' ');
            if (spaceIdx === -1) {
                await sendCsBotMessage(chatId, '⚠️ 형식: /reply <chatId> <메시지>');
                return NextResponse.json({ ok: true });
            }
            const targetChatId = after.slice(0, spaceIdx);
            const replyText = after.slice(spaceIdx + 1);
            await sendCsBotMessage(targetChatId, replyText);
            await sendCsBotMessage(chatId, `✅ 전송 완료 → ${targetChatId}`);
            return NextResponse.json({ ok: true });
        }

        // /start
        if (text === '/start') {
            await sendCsBotMessage(chatId, `안녕하세요! 웨이터존 고객센터입니다 😊\n궁금하신 내용을 입력해주세요. 확인 후 빠르게 답변 드리겠습니다.`);
            return NextResponse.json({ ok: true });
        }

        // 고객 문의 접수
        // 1. 고객에게 접수 확인
        await sendCsBotMessage(chatId, `✅ 문의가 접수되었습니다.\n담당자 확인 후 이 채팅으로 답변 드리겠습니다.`);

        // 2. 관리자에게 포워딩
        const adminMsg = `📩 <b>[고객 문의]</b>\n👤 ${username} (ID: <code>${chatId}</code>)\n💬 ${text}\n\n↩️ <code>/reply ${chatId} 답변내용</code>`;
        if (ADMIN_CHAT_ID) await sendCsBotMessage(ADMIN_CHAT_ID, adminMsg);

        return NextResponse.json({ ok: true });
    } catch (err: any) {
        console.error('Telegram CS webhook error:', err);
        return NextResponse.json({ ok: false }, { status: 500 });
    }
}
