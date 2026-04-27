import { NextRequest, NextResponse } from 'next/server';

/**
 * 국세청(NTS) 사업자등록 상태 조회 API
 * 공공데이터포털 nts-businessman API 연동
 * POST /api/nts/verify
 * Body: { businessNumber: string }  // 10자리 (하이픈 제외)
 */

type NTSStatus = '정상' | '휴업' | '폐업' | '유효하지 않음';

interface NTSApiResponseItem {
    b_no: string;
    b_stt: string;       // 납세자 상태 (계속사업자, 휴업자, 폐업자)
    b_stt_cd: string;    // 상태 코드 ('01'=계속, '02'=휴업, '03'=폐업)
    tax_type: string;
    tax_type_cd: string;
    end_dt: string;
    utcc_yn: string;
    tax_type_change_dt: string;
    invoice_apply_dt: string;
    rbf_tax_type: string;
    rbf_tax_type_cd: string;
}

interface NTSApiResponse {
    status_code: string;
    match_cnt: number;
    request_cnt: number;
    data: NTSApiResponseItem[];
}

function mapStatusCode(item: NTSApiResponseItem): NTSStatus {
    if (!item || !item.b_stt_cd) return '유효하지 않음';
    switch (item.b_stt_cd) {
        case '01': return '정상';
        case '02': return '휴업';
        case '03': return '폐업';
        default:   return '유효하지 않음';
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const raw: string = (body.businessNumber ?? '').replace(/[^0-9]/g, '');

        if (raw.length !== 10) {
            return NextResponse.json(
                { status: '유효하지 않음', message: '사업자번호는 10자리 숫자여야 합니다.' },
                { status: 400 }
            );
        }

        const serviceKey = process.env.NTS_API_SERVICE_KEY;
        if (!serviceKey) {
            // 환경변수 미설정 시 Mock 응답 (개발 환경용)
            console.warn('[NTS] NTS_API_SERVICE_KEY not set — returning mock response');
            return NextResponse.json({ status: '정상', message: '(개발 환경 Mock)' });
        }

        const apiUrl = `https://api.odcloud.kr/api/nts-businessman/v1/status?serviceKey=${encodeURIComponent(serviceKey)}`;

        const ntsRes = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
            body: JSON.stringify({ b_no: [raw] }),
            // TLS 1.2+ 는 Node.js fetch 기본값
        });

        if (!ntsRes.ok) {
            throw new Error(`NTS API HTTP ${ntsRes.status}`);
        }

        const ntsData: NTSApiResponse = await ntsRes.json();

        if (ntsData.status_code !== 'OK' || !ntsData.data?.length) {
            return NextResponse.json({ status: '유효하지 않음', message: '국세청에서 조회되지 않는 번호입니다.' });
        }

        const item = ntsData.data[0];
        const status: NTSStatus = mapStatusCode(item);

        return NextResponse.json({ status, statusText: item.b_stt });

    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : '알 수 없는 오류';
        console.error('[NTS] verify error:', message);
        return NextResponse.json(
            { status: '유효하지 않음', message: '국세청 API 호출 중 오류가 발생했습니다.' },
            { status: 502 }
        );
    }
}
