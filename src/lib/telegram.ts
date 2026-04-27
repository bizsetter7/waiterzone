// Telegram 관리자 알림 유틸 (알람봇 — 공고 등록/결제 알림)
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const ADMIN_CHAT_ID = process.env.TELEGRAM_ADMIN_CHAT_ID;

export async function sendTelegramAlert(message: string): Promise<boolean> {
    if (!BOT_TOKEN || !ADMIN_CHAT_ID) return false;

    try {
        const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: ADMIN_CHAT_ID,
                text: message,
                parse_mode: 'HTML',
            }),
        });
        return res.ok;
    } catch {
        return false;
    }
}

export async function sendTelegramMessage(chatId: string, text: string): Promise<boolean> {
    if (!BOT_TOKEN) return false;

    try {
        const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
        });
        return res.ok;
    } catch {
        return false;
    }
}

// CS봇 (고객 문의 전용 — @waiterzone_cs_bot)
const CS_BOT_TOKEN = process.env.TELEGRAM_CS_BOT_TOKEN;

export async function sendCsBotMessage(chatId: string, text: string): Promise<boolean> {
    if (!CS_BOT_TOKEN) return false;

    try {
        const res = await fetch(`https://api.telegram.org/bot${CS_BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
        });
        return res.ok;
    } catch {
        return false;
    }
}

// ─── Jobs봇 (@waiterzone_jobs_bot) ─────────────────────────────────────────────
// 신규 광고 승인 시 채널/그룹에 자동 발송
// 환경변수:
//   TELEGRAM_JOBS_BOT_TOKEN  — BotFather에서 받은 토큰
//   TELEGRAM_JOBS_CHANNEL_ID — 발송 대상 채널 ID (예: @waiterzone_jobs 또는 숫자 ID)

const JOBS_BOT_TOKEN  = process.env.TELEGRAM_JOBS_BOT_TOKEN;
const JOBS_CHANNEL_ID = process.env.TELEGRAM_JOBS_CHANNEL_ID;

export function isJobsBotConfigured(): boolean {
    return Boolean(JOBS_BOT_TOKEN && JOBS_CHANNEL_ID);
}

/**
 * 신규 공고 승인 시 Jobs 채널에 알림 발송
 * @param shop  승인된 업소 정보
 */
export async function sendJobsApprovalAlert(shop: {
    id: number | string;
    title?: string;
    name?: string;
    nickname?: string;
    region?: string;
    category?: string;
    pay?: string;
    pay_type?: string;
}): Promise<boolean> {
    if (!JOBS_BOT_TOKEN || !JOBS_CHANNEL_ID) return false;

    const shopName  = shop.nickname || shop.name || '업체';
    const region    = (shop.region  || '').replace(/[\[\]]/g, '').trim();
    const workType  = shop.category || '';
    const payStr    = shop.pay && shop.pay !== '면접후결정'
        ? `${shop.pay_type ?? ''} ${Number(String(shop.pay).replace(/[^0-9]/g, '')).toLocaleString()}원`
        : '면접 후 결정';
    const url = `https://www.waiterzone.kr/coco/${encodeURIComponent(region)}/${shop.id}`;

    const text = [
        `🆕 <b>[신규 공고 등록]</b>`,
        ``,
        `📍 <b>${shopName}</b>`,
        region   ? `🗺 ${region}${workType ? ' · ' + workType : ''}` : '',
        `💰 ${payStr}`,
        ``,
        `▶ <a href="${url}">공고 상세 보기</a>`,
        ``,
        `<i>웨이터존 | waiterzone.kr</i>`,
    ].filter(l => l !== undefined).join('\n');

    try {
        const res = await fetch(`https://api.telegram.org/bot${JOBS_BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id:    JOBS_CHANNEL_ID,
                text,
                parse_mode: 'HTML',
                disable_web_page_preview: false,
            }),
        });
        return res.ok;
    } catch {
        return false;
    }
}
