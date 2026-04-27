import { NextResponse } from 'next/server';
import { supabase as supabaseAdmin } from '@/lib/supabase';
import { sendSMS, isSMSMock } from '@/lib/sms';
import { sendKakaoAlimtalk, isKakaoMock } from '@/lib/kakao';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { campaignId, message, targets, channel } = body;

        if (!campaignId || !message || !targets || targets.length === 0) {
            return NextResponse.json(
                { success: false, message: 'Invalid payload' },
                { status: 400 }
            );
        }

        // ── 채널별 발송 분기 ─────────────────────────────────────────────
        let successCount = 0;
        let failedCount  = 0;
        let errorMsg     = '';
        let isMock       = false;
        let provider     = '';

        try {
            if (channel === 'kakao') {
                // ── 카카오 알림톡 ────────────────────────────────────────
                isMock    = isKakaoMock;
                provider  = 'kakao';

                const kakaoMessages = targets
                    .filter((t: any) => t.phone_number?.trim())
                    .map((t: any) => ({ to: t.phone_number, content: message }));

                const result = await sendKakaoAlimtalk(kakaoMessages);
                if (result.success) {
                    successCount = result.successCount ?? 0;
                    failedCount  = result.failCount    ?? 0;
                    if (result.error) errorMsg = result.error;
                } else {
                    failedCount = kakaoMessages.length;
                    errorMsg    = result.error || '카카오 알림톡 발송 실패';
                }

            } else {
                // ── SMS / LMS (알리고) ────────────────────────────────────
                isMock   = isSMSMock;
                provider = 'aligo';

                const phoneNumbers: string[] = targets
                    .map((t: any) => t.phone_number as string)
                    .filter((p: string) => p?.trim());

                if (phoneNumbers.length > 0) {
                    const result = await sendSMS(phoneNumbers, message, {
                        title   : channel === 'lms' ? '[웨이터존]' : undefined,
                        testmode: process.env.ALIGO_TEST_MODE === 'true',
                    });

                    if (result.success) {
                        switch (result.type) {
                            case 'mock':
                            case 'aligo-test':
                                successCount = phoneNumbers.length;
                                break;
                            default:
                                successCount = result.successCount ?? 0;
                                failedCount  = result.failCount    ?? 0;
                        }
                        if (result.error) {
                            console.warn('[API/marketing/send] 부분 실패:', result.error);
                            errorMsg = result.error;
                        }
                    } else {
                        failedCount = phoneNumbers.length;
                        errorMsg    = result.error || '알리고 발송 실패';
                    }
                }
            }
        } catch (e: any) {
            console.error('[API/marketing/send] 발송 예외:', e);
            failedCount = targets.length;
            errorMsg    = e.message;
        }

        // ── DB 업데이트 ──────────────────────────────────────────────────
        await supabaseAdmin
            .from('marketing_campaigns')
            .update({
                status       : 'completed',
                success_count: successCount,
                failed_count : failedCount,
                error_log    : errorMsg || null,
                sent_at      : new Date().toISOString(),
            })
            .eq('id', campaignId);

        return NextResponse.json({
            success : true,
            isMock,
            provider,
            summary : {
                total  : targets.length,
                success: successCount,
                failed : failedCount,
            },
        });

    } catch (error: any) {
        console.error('[API/marketing/send] Internal Error:', error);
        return NextResponse.json(
            { success: false, message: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
