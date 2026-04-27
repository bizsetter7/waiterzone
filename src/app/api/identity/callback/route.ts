import { NextRequest, NextResponse } from 'next/server';

/**
 * 본인인증 콜백 수신용 HTML 페이지 반환
 * GET /api/identity/callback
 */
export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const isError = searchParams.get('error') === 'true';
    const token = searchParams.get('token') || '';
    
    // 이 페이지는 팝업 내에서 실행되며 부모 창으로 결과를 전달하고 닫힙니다.
    const html = `
        <!DOCTYPE html>
        <html>
        <head><title>인증 처리 중...</title></head>
        <body>
            <script>
                const result = {
                    type: 'IDENTITY_VERIFY_RESULT',
                    success: ${!isError},
                    token: '${token}',
                    message: ${isError ? "'인증을 취소했거나 오류가 발생했습니다.'" : "''"}
                };
                
                if (window.opener) {
                    window.opener.postMessage(result, window.location.origin);
                    window.close();
                } else {
                    document.body.innerHTML = '부모 창을 찾을 수 없습니다. 창을 닫고 다시 시도해주세요.';
                }
            </script>
        </body>
        </html>
    `;

    return new NextResponse(html, {
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
}
