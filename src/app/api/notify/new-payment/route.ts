import { NextResponse } from 'next/server';
import { sendTelegramAlert } from '@/lib/telegram';

// POST /api/notify/new-payment — 새 공고 결제 신청 시 텔레그램 알림
export async function POST(request: Request) {
    try {
        const { shopName, amount, product, title } = await request.json();

        const isFree = Number(amount) === 0;
        const msg = isFree
            ? `📝 <b>새 공고 등록 (이벤트 무료)</b>\n\n` +
              `🏪 업체명: <b>${shopName}</b>\n` +
              `📋 공고: ${title || '(제목 없음)'}\n` +
              `📦 상품: ${product || '-'} (무료 이벤트)\n` +
              `💰 금액: <b>0원</b>\n\n` +
              `👉 어드민 페이지에서 공고 심사 후 승인해주세요.`
            : `🔔 <b>새 결제 신청</b>\n\n` +
              `🏪 업체명: <b>${shopName}</b>\n` +
              `📋 공고: ${title || '(제목 없음)'}\n` +
              `📦 상품: ${product || '-'}\n` +
              `💰 금액: <b>${Number(amount).toLocaleString()}원</b>\n\n` +
              `👉 어드민 페이지에서 입금 확인 후 승인해주세요.`;

        await sendTelegramAlert(msg);

        return NextResponse.json({ ok: true });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
