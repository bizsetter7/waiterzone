import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { sendKakaoAlimtalk, isKakaoMock } from '@/lib/kakao';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { campaignId, message, targets, templateCode } = body;

        if (!campaignId || !message || !targets || targets.length === 0) {
            return NextResponse.json(
                { success: false, message: 'Invalid payload' },
                { status: 400 }
            );
        }

        const messages = targets
            .filter((t: any) => t.phone_number?.trim())
            .map((t: any) => ({
                to: t.phone_number.replace(/[^0-9]/g, ''),
                content: message,
            }));

        if (messages.length === 0) {
            return NextResponse.json(
                { success: false, message: '유효한 수신자가 없습니다.' },
                { status: 400 }
            );
        }

        const result = await sendKakaoAlimtalk(messages, templateCode);

        // DB 업데이트
        await supabase
            .from('marketing_campaigns')
            .update({
                status:        result.success ? 'completed' : 'failed',
                success_count: result.successCount ?? 0,
                failed_count:  result.failCount    ?? 0,
                error_log:     result.error        || null,
                sent_at:       new Date().toISOString(),
            })
            .eq('id', campaignId);

        return NextResponse.json({
            success:  result.success,
            isMock:   isKakaoMock,
            provider: 'kakao',
            summary: {
                total:   messages.length,
                success: result.successCount ?? 0,
                failed:  result.failCount    ?? 0,
            },
        });

    } catch (error: any) {
        console.error('[API/marketing/kakao] Error:', error);
        return NextResponse.json(
            { success: false, message: 'Internal Server Error' },
            { status: 500 }
        );
    }
}

/** 카카오 연결 상태 확인 */
export async function GET() {
    return NextResponse.json({
        connected: !isKakaoMock,
        isMock:    isKakaoMock,
        message:   isKakaoMock
            ? 'KAKAO_SENDER_KEY, KAKAO_APP_KEY, KAKAO_TEMPLATE_CODE 환경변수를 설정하면 즉시 활성화됩니다.'
            : '카카오 알림톡 연결 완료',
    });
}
