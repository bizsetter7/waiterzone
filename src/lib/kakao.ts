/**
 * ┌─────────────────────────────────────────────────────────────┐
 * │  카카오 알림톡 발송 모듈  — Kakao Biz Message API             │
 * │  Docs: https://business.kakao.com/info/bizmessage           │
 * │                                                             │
 * │  연결 방법 (Vercel 환경변수 설정 후 즉시 작동):               │
 * │    KAKAO_SENDER_KEY  - 발신프로필 키 (채널 개설 후 발급)      │
 * │    KAKAO_APP_KEY     - 카카오 REST API 키                    │
 * │    KAKAO_TEMPLATE_CODE - 기본 알림톡 템플릿 코드              │
 * │                                                             │
 * │  환경변수 미설정 시 자동 Mock 모드 (실제 발송 없음)            │
 * └─────────────────────────────────────────────────────────────┘
 *
 * 사용 전 필수 준비사항:
 *   1. 카카오 비즈니스 채널 개설 (https://business.kakao.com)
 *   2. 알림톡 서비스 신청
 *   3. 발신프로필 키(senderKey) 발급
 *   4. 메시지 템플릿 작성 및 카카오 검수 승인 (1~2주 소요)
 *   5. 수신자가 해당 채널을 친구 추가한 상태여야 친구톡 수신 가능
 *      (알림톡은 친구 추가 없어도 발송 가능 — 거래 관계 기반)
 */

const KAKAO_API_ENDPOINT = 'https://bizmessage.kakao.com/talk/message/auth';
const TIMEOUT_MS = 15_000;

const senderKey    = process.env.KAKAO_SENDER_KEY    || '';
const appKey       = process.env.KAKAO_APP_KEY        || '';
const templateCode = process.env.KAKAO_TEMPLATE_CODE  || '';

/** 환경변수 누락 → Mock 모드 플래그 */
export const isKakaoMock = !senderKey || !appKey || !templateCode;

export interface KakaoMessage {
    to: string;          // 수신자 전화번호 (하이픈 제거, 예: 01012345678)
    content: string;     // 메시지 내용 (템플릿 변수 치환 후)
    variables?: Record<string, string>; // 템플릿 변수 (#{변수명} 형식)
}

export interface KakaoResult {
    success: boolean;
    type: 'mock' | 'kakao';
    successCount?: number;
    failCount?: number;
    error?: string;
    raw?: any;
}

/**
 * 알림톡 단건 / 다건 발송
 * @param messages - 수신자 목록 (최대 1,000건씩 배치 처리)
 * @param templateCodeOverride - 템플릿 코드 오버라이드 (기본값: env KAKAO_TEMPLATE_CODE)
 */
export async function sendKakaoAlimtalk(
    messages: KakaoMessage[],
    templateCodeOverride?: string
): Promise<KakaoResult> {

    // ── Mock 모드 ────────────────────────────────────────────────
    if (isKakaoMock) {
        return { success: true, type: 'mock', successCount: messages.length, failCount: 0 };
    }

    // ── 실제 발송 ────────────────────────────────────────────────
    const BATCH_SIZE = 1_000;
    const usedTemplateCode = templateCodeOverride || templateCode;

    let totalSuccess = 0;
    let totalFail = 0;
    let lastError = '';

    for (let i = 0; i < messages.length; i += BATCH_SIZE) {
        const batch = messages.slice(i, i + BATCH_SIZE);

        const requestDate = new Date()
            .toISOString()
            .replace('T', ' ')
            .replace(/\.\d+Z$/, '');

        const payload = {
            sender_key: senderKey,
            template_code: usedTemplateCode,
            request_date: requestDate,
            sms_fallback: 'N', // SMS 대체 발송 여부 (필요 시 'Y')
            messages: batch.map(m => ({
                to: m.to.replace(/[^0-9]/g, ''),
                content: m.content,
                ...(m.variables ? { variables: m.variables } : {}),
            })),
        };

        try {
            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

            const res = await fetch(KAKAO_API_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json;charset=UTF-8',
                    'Authorization': `KakaoAK ${appKey}`,
                },
                body: JSON.stringify(payload),
                signal: controller.signal,
            });

            clearTimeout(timer);
            const json = await res.json();

            if (!res.ok || json.code !== 0) {
                lastError = json.message || `HTTP ${res.status}`;
                totalFail += batch.length;
                console.error(`[Kakao] Batch ${i / BATCH_SIZE + 1} failed:`, json);
            } else {
                const successCnt = json.success_count ?? batch.length;
                const failCnt    = json.fail_count    ?? 0;
                totalSuccess += successCnt;
                totalFail    += failCnt;
            }
        } catch (e: any) {
            lastError = e.message;
            totalFail += batch.length;
            console.error(`[Kakao] Batch ${i / BATCH_SIZE + 1} exception:`, e);
        }
    }

    const success = totalFail === 0;
    return {
        success,
        type: 'kakao',
        successCount: totalSuccess,
        failCount: totalFail,
        error: lastError || undefined,
    };
}
