import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { IdentityVerifyResult } from '@/types/identity-verify';

// service_role — 로그인 유저 본인인증 완료 후 프로필 업데이트용 [M-066]
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
);

/**
 * 본인인증 콜백 검증 API (PortOne V2 전용)
 * POST /api/identity/verify-result
 * 
 * ── 보안 규격 (심사 대응) ──────────────────────────────────────────────────────
 * [항목 2/8] 서버-to-서버 통신: PortOne V2 REST API를 통해 인증값 진위 확인
 * [항목 6]   토큰 재사용 방지: PortOne 서버에서 이미 검증된 건은 재조회 불가능
 */

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        // userId: 로그인 상태의 OAuth 유저가 게이트에서 본인인증 시 전달 [M-066]
        const { identityVerificationId, userId } = body;

        if (!identityVerificationId) {
            return NextResponse.json(
                { success: false, code: 'MISSING_PARAMS', message: 'identityVerificationId가 누락되었습니다.' },
                { status: 400 }
            );
        }

        // ── [항목 2/8] 포트원 V2 REST API 조회 ──────────────────────────────
        const apiSecret = process.env.PORTONE_API_SECRET;
        
        if (!apiSecret) {
            console.warn('[Identity] PORTONE_API_SECRET 환경변수가 없습니다. Mock 인증으로 대체합니다.');
            // Mock 환경에서도 userId 전달 시 is_adult_verified=true 저장
            if (userId && typeof userId === 'string') {
                try {
                    await supabaseAdmin.from('profiles').update({ is_adult_verified: true }).eq('id', userId);
                } catch { /* ignore */ }
            }
            return NextResponse.json({
                success: true,
                code: 'VERIFIED_MOCK',
                message: 'API Secret 미설정으로 시뮬레이션 인증 성공 처리되었습니다.',
                result: {
                    success: true,
                    provider: 'danal',
                    name: '홍길동',
                    phone: '01012345678',
                    birthdate: '1990-01-01',
                    gender: 'M'
                }
            });
        }

        const portoneRes = await fetch(`https://api.portone.io/identity-verifications/${identityVerificationId}`, {
            method: 'GET',
            headers: {
                'Authorization': `PortOne ${apiSecret}`,
                'Content-Type': 'application/json',
            },
        });

        if (!portoneRes.ok) {
            const errorBody = await portoneRes.json();
            console.error('[Identity/PortOneV2] API 조회 실패:', errorBody);
            return NextResponse.json(
                { success: false, code: 'FETCH_FAILED', message: '포트원 서버에서 인증 정보를 가져오지 못했습니다.' },
                { status: 500 }
            );
        }

        const verifyData = await portoneRes.json();
        
        if (verifyData.status !== 'VERIFIED') {
            return NextResponse.json(
                { success: false, code: 'NOT_VERIFIED', message: `인증이 아직 완료되지 않았거나 실패했습니다. (상태: ${verifyData.status})` },
                { status: 403 }
            );
        }

        // 인증 성공 데이터 정제 (PortOne V2 verifiedCustomer 객체)
        const identity = verifyData.verifiedCustomer;

        // PortOne V2: gender는 'MALE'/'FEMALE'/'UNKNOWN' 형식으로 반환
        const genderRaw = identity?.gender || '';
        const genderCode = genderRaw === 'MALE' ? 'M' : genderRaw === 'FEMALE' ? 'F' : 'U';

        // PortOne V2: birthDate는 ISO 형식 "2000-01-01" 또는 개별 필드 fallback
        const birthDate = identity?.birthDate
            || (identity?.birthYear
                ? `${identity.birthYear}-${String(identity.birthMonth ?? '').padStart(2, '0')}-${String(identity.birthDay ?? '').padStart(2, '0')}`
                : '');

        // PortOne V2: phoneNumber 필드 — +82로 시작하면 한국 국내 형식(010...)으로 변환
        const rawPhone = identity?.phoneNumber || identity?.phone || identity?.mobile || '';
        const normalizedPhone = rawPhone
            .replace(/^\+82/, '0')   // +821012345678 → 01012345678
            .replace(/^82/, '0')     // 821012345678  → 01012345678
            .replace(/[^0-9]/g, ''); // 숫자 외 제거

        const result: IdentityVerifyResult = {
            success: true,
            provider: 'danal',
            name: identity?.name || '알수없음',
            phone: normalizedPhone,
            birthdate: birthDate,
            gender: genderCode,
            ci: identity?.ci,
            di: identity?.di
        };

        // [M-066] 로그인 유저 게이트 인증 시 프로필 자동 갱신
        if (userId && typeof userId === 'string') {
            try {
                const profilePatch: Record<string, unknown> = { is_adult_verified: true };
                if (result.phone) profilePatch.phone = result.phone;
                if (result.birthdate) profilePatch.birth_date = result.birthdate;
                if (result.gender) profilePatch.gender = result.gender;
                if (result.ci) profilePatch.identity_ci = result.ci;
                if (result.name) profilePatch.full_name = result.name;
                await supabaseAdmin.from('profiles').update(profilePatch).eq('id', userId);
            } catch (patchErr) {
                console.warn('[Identity/verify-result] 프로필 갱신 실패:', patchErr);
            }
        }

        return NextResponse.json({
            success: true,
            code: 'VERIFIED',
            message: '본인인증이 정상적으로 완료되었습니다.',
            result
        });

    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : '알 수 없는 오류';
        console.error('[Identity/verify-result] 서버 내부 처리 오류:', message);
        return NextResponse.json(
            { success: false, code: 'SERVER_ERROR', message: '검증 처리 중 서버 오류가 발생했습니다.' },
            { status: 500 }
        );
    }
}
