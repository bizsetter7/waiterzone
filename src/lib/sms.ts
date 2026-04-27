/**
 * ┌─────────────────────────────────────────────────────────────┐
 * │  SMS 발송 모듈  —  Provider: 알리고 (Aligo)                   │
 * │  Docs: https://smartsms.aligo.in/admin/api/spec.html        │
 * │  구 Solapi(CoolSMS) 로직 전면 교체 / 2026-03                   │
 * └─────────────────────────────────────────────────────────────┘
 *
 * 환경변수 (모두 없으면 자동 Mock 모드)
 *   ALIGO_API_KEY        - 알리고 API 키
 *   ALIGO_USER_ID        - 알리고 사용자 ID
 *   ALIGO_SENDER_NUMBER  - 발신번호 (사전 등록 필요)
 *   ALIGO_TEST_MODE      - 'true' → 알리고 testmode_yn=Y (실제 발송 없음)
 */

const ALIGO_ENDPOINT = 'https://apis.aligo.in/send/';
const TIMEOUT_MS     = 10_000; // 10초 타임아웃
const BATCH_SIZE     = 1_000;  // 알리고 1회 최대 수신자 수

const apiKey        = process.env.ALIGO_API_KEY        || '';
const userId        = process.env.ALIGO_USER_ID        || '';
const senderNumber  = process.env.ALIGO_SENDER_NUMBER  || '';
const aligoTestMode = process.env.ALIGO_TEST_MODE === 'true';

/** 환경변수 누락 → Mock 모드 플래그 (route.ts에서도 참조) */
export const isSMSMock = !apiKey || !userId || !senderNumber;

// ─────────────────────────────────────────────────────────────
//  타입
// ─────────────────────────────────────────────────────────────
export interface SMSResult {
    success: boolean;
    type?: 'mock' | 'real' | 'aligo-test';
    count?: number;        // mock 모드일 때 요청 건수
    successCount?: number;
    failCount?: number;
    error?: string;
}

interface AligoResponse {
    result_code: string | number; // "1" 또는 1 이면 성공
    message: string;
    msg_id?: string;
    success_cnt?: number;
    error_cnt?: number;
    msg_type?: string;
}

// ─────────────────────────────────────────────────────────────
//  내부: 알리고 API 단일 배치 호출
// ─────────────────────────────────────────────────────────────
async function callAligoAPI(
    receivers : string[],
    text      : string,
    title?    : string,
    testmode  : boolean = false
): Promise<{ success: boolean; successCnt: number; failCnt: number; error?: string }> {

    const isLMS  = text.length > 90 || !!title;
    const msgType = isLMS ? 'LMS' : 'SMS';

    const form = new FormData();
    form.append('key',          apiKey);
    form.append('user_id',      userId);
    form.append('sender',       senderNumber);
    form.append('receiver',     receivers.join(','));
    form.append('msg',          text);
    form.append('msg_type',     msgType);
    form.append('testmode_yn',  testmode ? 'Y' : 'N');
    if (isLMS && title) form.append('title', title);

    const controller = new AbortController();
    const timer      = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
        const res = await fetch(ALIGO_ENDPOINT, {
            method : 'POST',
            // ── 화이트셀(보안) 환경 대응 헤더 ──────────────────────────
            // • User-Agent: 방화벽이 알려지지 않은 클라이언트를 차단할 수 있음
            // • Accept: JSON 명시 → 일부 프록시가 응답 타입으로 필터링
            // • Cache-Control: no-store → 중간 프록시 캐시 방지
            // • Connection: keep-alive → 재연결 오버헤드 최소화
            // • Content-Type은 FormData가 자동으로 multipart/form-data; boundary=... 설정
            headers: {
                'User-Agent'   : 'CocoAlba-Marketing/1.0 (Next.js; +https://coco-inky.vercel.app)',
                'Accept'       : 'application/json, text/plain, */*',
                'Cache-Control': 'no-store',
                'Connection'   : 'keep-alive',
            },
            body   : form,
            signal : controller.signal,
        });

        clearTimeout(timer);

        if (!res.ok) {
            const raw = await res.text().catch(() => '(empty)');
            throw new Error(`HTTP ${res.status}: ${raw.slice(0, 200)}`);
        }

        const json: AligoResponse = await res.json();

        // result_code === "1" or 1 이면 성공
        if (String(json.result_code) === '1') {
            return {
                success   : true,
                successCnt: json.success_cnt ?? receivers.length,
                failCnt   : json.error_cnt   ?? 0,
            };
        }

        // 알리고 에러 코드 → 메시지 그대로 전달
        return {
            success   : false,
            successCnt: 0,
            failCnt   : receivers.length,
            error     : `알리고 오류 [${json.result_code}]: ${json.message}`,
        };

    } catch (err: any) {
        clearTimeout(timer);

        const isTimeout = err.name === 'AbortError';
        const msg = isTimeout
            ? `[Timeout] 알리고 API ${TIMEOUT_MS / 1000}초 초과`
            : `[NetworkError] ${err.message}`;

        console.error('[SMS][Aligo]', msg);
        return { success: false, successCnt: 0, failCnt: receivers.length, error: msg };
    }
}

// ─────────────────────────────────────────────────────────────
//  Public API
// ─────────────────────────────────────────────────────────────
/**
 * SMS / LMS 발송
 * @param to       수신번호 (단일 문자열 or 배열)
 * @param text     메시지 본문 (90자 초과 → LMS 자동 전환)
 * @param opts.title    LMS 제목 (있으면 LMS 강제)
 * @param opts.testmode true → 알리고 테스트 모드 (실제 발송 없음, 과금 없음)
 */
export const sendSMS = async (
    to  : string | string[],
    text: string,
    opts: { title?: string; testmode?: boolean } = {}
): Promise<SMSResult> => {

    const recipients = (Array.isArray(to) ? to : [to])
        .map(n => n.trim())
        .filter(Boolean);

    // ── 1. Mock 모드 (환경변수 없음) ─────────────────────────────
    if (isSMSMock) {
        console.warn('[SMS][MOCK] 환경변수 누락 → 실제 발송 생략', {
            count: recipients.length,
            preview: recipients.slice(0, 3),
            text  : text.slice(0, 40) + (text.length > 40 ? '…' : ''),
        });
        return { success: true, type: 'mock', count: recipients.length };
    }

    // ── 2. 알리고 API 호출 (배치 분할) ──────────────────────────
    const isTestMode = opts.testmode ?? aligoTestMode;
    let totalSuccess = 0;
    let totalFail    = 0;
    const errors: string[] = [];

    for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
        const batch  = recipients.slice(i, i + BATCH_SIZE);
        const result = await callAligoAPI(batch, text, opts.title, isTestMode);

        totalSuccess += result.successCnt;
        totalFail    += result.failCnt;
        if (result.error) errors.push(result.error);
    }

    // 전체 실패
    if (totalSuccess === 0 && errors.length > 0) {
        return { success: false, error: errors.join(' | ') };
    }

    return {
        success     : true,
        type        : isTestMode ? 'aligo-test' : 'real',
        successCount: totalSuccess,
        failCount   : totalFail,
        ...(errors.length > 0 && { error: `일부 실패: ${errors.join(' | ')}` }),
    };
};
