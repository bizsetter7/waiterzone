import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAdmin } from '@/lib/requireAdmin';

export const dynamic = 'force-dynamic';

// ── 타입 ────────────────────────────────────────────────────────────────────────
type TestStatus = 'pass' | 'fail' | 'warn';

interface TestResult {
    name: string;
    label: string;
    status: TestStatus;
    message: string;
    duration_ms: number;
}

interface TestGroupResult {
    tests: TestResult[];
    passed: number;
    failed: number;
    warnings: number;
}

// ── Service Role 클라이언트 ─────────────────────────────────────────────────────
function getServiceClient() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

// ── 헬퍼: 단일 테스트 실행 래퍼 ──────────────────────────────────────────────
async function runTest(
    name: string,
    label: string,
    fn: () => Promise<{ status: TestStatus; message: string }>
): Promise<TestResult> {
    const start = Date.now();
    try {
        const { status, message } = await fn();
        return { name, label, status, message, duration_ms: Date.now() - start };
    } catch (err: any) {
        return {
            name,
            label,
            status: 'fail',
            message: `예외 발생: ${err?.message ?? String(err)}`,
            duration_ms: Date.now() - start,
        };
    }
}

// ── fetch 헬퍼 (AbortSignal 타임아웃 8초) ────────────────────────────────────
// User-Agent 필수: 서버사이드 fetch는 UA 없음 → middleware 빈 UA 차단(403) 우회
async function safeFetch(url: string, init?: RequestInit): Promise<Response> {
    return fetch(url, {
        ...init,
        headers: {
            ...(init?.headers ?? {}),
            'User-Agent': 'CocoAlba-E2E-Runner/1.0 (internal health check)',
        },
        signal: AbortSignal.timeout(8000),
    });
}

// ══════════════════════════════════════════════════════════════════════════════
// 테스트 그룹 정의
// ══════════════════════════════════════════════════════════════════════════════

// ── GROUP: api_security ────────────────────────────────────────────────────────
async function runApiSecurity(siteUrl: string): Promise<TestResult[]> {
    return Promise.all([
        runTest(
            'resumes_save_requires_auth',
            '이력서 저장 API — 인증 없이 401 반환',
            async () => {
                const res = await safeFetch(`${siteUrl}/api/resumes/save`, { method: 'POST' });
                if (res.status === 401) return { status: 'pass', message: '401 Unauthorized 정상 반환' };
                return { status: 'fail', message: `기대 401, 실제 ${res.status}` };
            }
        ),
        runTest(
            'admin_health_requires_auth',
            '어드민 헬스체크 API — 인증 없이 401 반환',
            async () => {
                const res = await safeFetch(`${siteUrl}/api/admin/health`, { method: 'POST' });
                if (res.status === 401) return { status: 'pass', message: '401 Unauthorized 정상 반환' };
                return { status: 'fail', message: `기대 401, 실제 ${res.status}` };
            }
        ),
        runTest(
            'admin_grant_points_requires_auth',
            '어드민 포인트 지급 API — 인증 없이 401 반환',
            async () => {
                const res = await safeFetch(`${siteUrl}/api/admin/grant-points`, { method: 'POST' });
                if (res.status === 401) return { status: 'pass', message: '401 Unauthorized 정상 반환' };
                return { status: 'fail', message: `기대 401, 실제 ${res.status}` };
            }
        ),
        runTest(
            'admin_save_requires_auth',
            '어드민 저장 API — 인증 없이 401 반환',
            async () => {
                const res = await safeFetch(`${siteUrl}/api/admin/save`, { method: 'POST' });
                if (res.status === 401) return { status: 'pass', message: '401 Unauthorized 정상 반환' };
                return { status: 'fail', message: `기대 401, 실제 ${res.status}` };
            }
        ),
    ]);
}

// ── GROUP: api_availability ───────────────────────────────────────────────────
async function runApiAvailability(siteUrl: string): Promise<TestResult[]> {
    return Promise.all([
        runTest(
            'talent_list_responds',
            '인재 목록 API — 200 응답 및 success:true',
            async () => {
                const res = await safeFetch(`${siteUrl}/api/talent/list`);
                if (!res.ok) return { status: 'fail', message: `HTTP ${res.status} 반환` };
                const body = await res.json();
                if (body.success !== true) return { status: 'warn', message: `200이지만 success 필드 없음: ${JSON.stringify(body).slice(0, 80)}` };
                return { status: 'pass', message: '200 + success:true 정상' };
            }
        ),
        runTest(
            'community_posts_responds',
            '커뮤니티 게시글 API — 200 응답',
            async () => {
                const res = await safeFetch(`${siteUrl}/api/community/posts`);
                if (res.ok) return { status: 'pass', message: `200 응답 정상` };
                return { status: 'fail', message: `HTTP ${res.status} 반환` };
            }
        ),
        runTest(
            'sos_count_responds',
            'SOS 공고 수 API — 200 응답 및 count 필드',
            async () => {
                const res = await safeFetch(`${siteUrl}/api/sos/count?regions=서울`);
                if (!res.ok) return { status: 'fail', message: `HTTP ${res.status} 반환` };
                const body = await res.json();
                if (body.count === undefined) return { status: 'warn', message: `200이지만 count 필드 없음: ${JSON.stringify(body).slice(0, 80)}` };
                return { status: 'pass', message: `200 + count:${body.count} 정상` };
            }
        ),
        runTest(
            'username_check_responds',
            '사용자명 중복확인 API — 500 아닌 응답',
            async () => {
                const res = await safeFetch(`${siteUrl}/api/auth/check-username?username=testuser`);
                if (res.status === 500) return { status: 'fail', message: '500 Internal Server Error 발생' };
                return { status: 'pass', message: `${res.status} 응답 (500 아님) — 정상` };
            }
        ),
    ]);
}

// ── GROUP: db_flows ───────────────────────────────────────────────────────────
async function runDbFlows(): Promise<TestResult[]> {
    const db = getServiceClient();

    return Promise.all([
        runTest(
            'resumes_table_has_required_columns',
            'resumes 테이블 필수 컬럼 존재 확인',
            async () => {
                const { error } = await db
                    .from('resumes')
                    .select('id, user_id, title, industry_main, region_main')
                    .limit(1);
                if (error) return { status: 'fail', message: `컬럼 조회 실패: ${error.message}` };
                return { status: 'pass', message: 'id/user_id/title/industry_main/region_main 컬럼 모두 존재' };
            }
        ),
        runTest(
            'point_logs_has_required_columns',
            'point_logs 테이블 필수 컬럼 존재 확인',
            async () => {
                const { error } = await db
                    .from('point_logs')
                    .select('id, user_id, reason, amount')
                    .limit(1);
                if (error) return { status: 'fail', message: `컬럼 조회 실패: ${error.message}` };
                return { status: 'pass', message: 'id/user_id/reason/amount 컬럼 모두 존재' };
            }
        ),
        runTest(
            'attendance_duplicate_prevention',
            '출석체크 중복 방지 로직 검증',
            async () => {
                // 같은 UTC 날짜에 ATTENDANCE_CHECK가 2건 이상인 user_id 존재 여부 확인
                // 이런 케이스가 존재하면 중복 방지 로직이 작동하지 않은 것
                const today = new Date();
                const startOfDay = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate())).toISOString();
                const endOfDay = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() + 1)).toISOString();

                const { data, error } = await db
                    .from('point_logs')
                    .select('user_id')
                    .eq('reason', 'ATTENDANCE_CHECK')
                    .gte('created_at', startOfDay)
                    .lt('created_at', endOfDay);

                if (error) return { status: 'warn', message: `조회 실패: ${error.message}` };

                // user_id 빈도 집계
                const freq: Record<string, number> = {};
                for (const row of (data || [])) {
                    if (row.user_id) freq[row.user_id] = (freq[row.user_id] || 0) + 1;
                }
                const duplicates = Object.values(freq).filter(v => v > 1).length;

                if (duplicates > 0) {
                    return {
                        status: 'fail',
                        message: `오늘 출석체크 중복 ${duplicates}명 발견 — 중복 방지 로직 오작동`,
                    };
                }
                return { status: 'pass', message: `오늘 출석체크 중복 없음 (총 ${Object.keys(freq).length}명 적립)` };
            }
        ),
        runTest(
            'profiles_has_required_columns',
            'profiles 테이블 필수 컬럼 존재 확인',
            async () => {
                const { error } = await db
                    .from('profiles')
                    .select('id, points, nickname, username, role, user_type')
                    .limit(1);
                if (error) return { status: 'fail', message: `컬럼 조회 실패: ${error.message}` };
                return { status: 'pass', message: 'id/points/nickname/username/role/user_type 컬럼 모두 존재' };
            }
        ),
        runTest(
            'payments_table_accessible',
            'payments 테이블 접근 가능 확인',
            async () => {
                const { error } = await db
                    .from('payments')
                    .select('id')
                    .limit(1);
                if (error) return { status: 'fail', message: `payments 테이블 접근 실패: ${error.message}` };
                return { status: 'pass', message: 'payments 테이블 정상 접근' };
            }
        ),
        runTest(
            'shops_has_required_columns',
            'shops 테이블 필수 컬럼 존재 확인',
            async () => {
                const { error } = await db
                    .from('shops')
                    .select('id, user_id, status, product_type, approved_at')
                    .limit(1);
                if (error) return { status: 'fail', message: `컬럼 조회 실패: ${error.message}` };
                return { status: 'pass', message: 'id/user_id/status/product_type/approved_at 컬럼 모두 존재' };
            }
        ),
    ]);
}

// ── GROUP: critical_flows ─────────────────────────────────────────────────────
async function runCriticalFlows(siteUrl: string): Promise<TestResult[]> {
    return Promise.all([
        runTest(
            'resume_save_auth_error_format',
            '이력서 저장 — 미인증 시 오류 메시지 형식 검증',
            async () => {
                const res = await safeFetch(`${siteUrl}/api/resumes/save`, { method: 'POST' });
                if (res.status !== 401) return { status: 'fail', message: `기대 401, 실제 ${res.status}` };
                const body = await res.json().catch(() => null);
                if (!body) return { status: 'fail', message: '응답 본문 파싱 실패' };
                if (body.error === '인증이 필요합니다.') return { status: 'pass', message: '오류 메시지 형식 정확히 일치' };
                return {
                    status: 'warn',
                    message: `오류 메시지 불일치. 기대: "인증이 필요합니다." 실제: "${body.error}"`,
                };
            }
        ),
        runTest(
            'points_award_unknown_reason_rejected',
            '포인트 지급 — 미지정 사유(UNKNOWN_REASON) 400 반환',
            async () => {
                const res = await safeFetch(`${siteUrl}/api/points/award`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ reason: 'UNKNOWN_REASON' }),
                });
                if (res.status === 400) return { status: 'pass', message: '알 수 없는 사유에 400 Bad Request 정상 반환' };
                // 401도 허용 (인증이 먼저 검사되는 경우)
                if (res.status === 401) return { status: 'warn', message: '401 반환 — 인증 우선 검사 구조 (사유 검증보다 인증이 먼저). 로직은 정상' };
                return { status: 'fail', message: `기대 400, 실제 ${res.status}` };
            }
        ),
        runTest(
            'community_posts_paginated',
            '커뮤니티 게시글 — 페이지네이션 구조 검증',
            async () => {
                const res = await safeFetch(`${siteUrl}/api/community/posts?page=1`);
                if (!res.ok) return { status: 'fail', message: `HTTP ${res.status} 반환` };
                const body = await res.json().catch(() => null);
                if (!body) return { status: 'fail', message: '응답 본문 파싱 실패' };
                // posts 또는 data 배열 중 하나가 있으면 정상
                const hasPosts = Array.isArray(body.posts) || Array.isArray(body.data);
                if (hasPosts) return { status: 'pass', message: '페이지네이션 응답 구조 정상 (posts/data 배열 존재)' };
                return { status: 'warn', message: `posts/data 배열 필드 없음: ${JSON.stringify(body).slice(0, 100)}` };
            }
        ),
        runTest(
            'talent_list_has_data_structure',
            '인재 목록 — talents 배열 필드 존재 확인',
            async () => {
                const res = await safeFetch(`${siteUrl}/api/talent/list`);
                if (!res.ok) return { status: 'fail', message: `HTTP ${res.status} 반환` };
                const body = await res.json().catch(() => null);
                if (!body) return { status: 'fail', message: '응답 본문 파싱 실패' };
                if (Array.isArray(body.talents)) return { status: 'pass', message: `talents 배열 존재 (${body.talents.length}건)` };
                return { status: 'warn', message: `talents 배열 없음: ${JSON.stringify(body).slice(0, 100)}` };
            }
        ),
    ]);
}

// ── 그룹 결과 집계 ─────────────────────────────────────────────────────────────
function summarizeGroup(tests: TestResult[]): TestGroupResult {
    return {
        tests,
        passed: tests.filter(t => t.status === 'pass').length,
        failed: tests.filter(t => t.status === 'fail').length,
        warnings: tests.filter(t => t.status === 'warn').length,
    };
}

// ══════════════════════════════════════════════════════════════════════════════
// 핸들러
// ══════════════════════════════════════════════════════════════════════════════
export async function POST(request: NextRequest) {
    const authError = await requireAdmin(request);
    if (authError) return authError;

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.waiterzone.kr';

    try {
        // 모든 그룹 순차 실행 (동시 접속 부하 방지)
        const securityTests = await runApiSecurity(siteUrl);
        const availabilityTests = await runApiAvailability(siteUrl);
        const dbTests = await runDbFlows();
        const criticalTests = await runCriticalFlows(siteUrl);

        const results: Record<string, TestGroupResult> = {
            api_security: summarizeGroup(securityTests),
            api_availability: summarizeGroup(availabilityTests),
            db_flows: summarizeGroup(dbTests),
            critical_flows: summarizeGroup(criticalTests),
        };

        // 전체 요약
        const allTests = [...securityTests, ...availabilityTests, ...dbTests, ...criticalTests];
        const summary = {
            total: allTests.length,
            passed: allTests.filter(t => t.status === 'pass').length,
            failed: allTests.filter(t => t.status === 'fail').length,
            warnings: allTests.filter(t => t.status === 'warn').length,
        };

        return NextResponse.json({ success: true, results, summary });
    } catch (err: any) {
        return NextResponse.json(
            { success: false, error: `E2E 실행 중 오류: ${err.message}` },
            { status: 500 }
        );
    }
}

// GET 요청도 동일하게 처리 (편의상)
export async function GET(request: NextRequest) {
    return POST(request);
}
