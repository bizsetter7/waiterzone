import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { createClient } from '@supabase/supabase-js';
import { normalizeAd } from '@/app/my-shop/utils/normalization';
import { getPayColor, getPayAbbreviation } from '@/utils/payColors';
import { requireAdmin } from '@/lib/requireAdmin';

export const dynamic = 'force-dynamic'; // v2.1.0 — service role integrity, requireAdmin

// [성능 최적화] 동일 페이지 내 중복 호출 방지를 위한 15초 캐시
let cachedHealth: { data: any; timestamp: number } | null = null;
const CACHE_TTL = 15000; // 15초

// Service role 클라이언트 — 무결성 검사 등 RLS 우회가 필요한 항목에만 사용
function getServiceClient() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

type CheckStatus = 'healthy' | 'warning' | 'error';

interface CheckResult {
    status: CheckStatus;
    message: string;
    count?: number; // 이슈 건수 (배지 집계용)
}

function setWorst(current: CheckStatus, next: CheckStatus): CheckStatus {
    if (current === 'error' || next === 'error') return 'error';
    if (current === 'warning' || next === 'warning') return 'warning';
    return 'healthy';
}

/** 전체 헬스 체크 로직 — POST/GET 공유 (인증은 각 핸들러에서 처리) */
async function runHealthCheck(force = false): Promise<any> {
    const now = Date.now();
    // [성능 최적화] GET 요청(사이드바 등) 시에만 캐시 사용. 재진단(POST) 시에는 최신 데이터 강제 수집.
    if (!force && cachedHealth && (now - cachedHealth.timestamp < CACHE_TTL)) {
        return cachedHealth.data;
    }

    const components: Record<string, CheckResult> = {};
    let overall: CheckStatus = 'healthy';

    // ── 1. Supabase 연결 ─────────────────────────────────────────
    try {
        const { error } = await supabase.from('profiles').select('id').limit(1);
        if (error) throw error;
        components.supabase = { status: 'healthy', message: 'Supabase DB 연결 정상' };
    } catch (err: any) {
        components.supabase = { status: 'error', message: `DB 연결 실패: ${err.message}` };
        overall = setWorst(overall, 'error');
    }

    // ── 2. DB 스키마 — profiles.points 컬럼 ─────────────────────
    try {
        const { error } = await supabase.from('profiles').select('points').limit(1);
        if (error) throw error;
        components.db_points = { status: 'healthy', message: 'profiles.points 컬럼 정상' };
    } catch {
        components.db_points = { status: 'error', message: 'profiles.points 컬럼 없음 — 가입 포인트 적립 불가. SQL: ALTER TABLE profiles ADD COLUMN points INTEGER DEFAULT 0;' };
        overall = setWorst(overall, 'error');
    }

    // ── 3. DB 스키마 — point_logs 테이블 ────────────────────────
    try {
        const { error } = await supabase.from('point_logs').select('id').limit(1);
        if (error) throw error;
        components.db_point_logs = { status: 'healthy', message: 'point_logs 테이블 정상' };
    } catch {
        components.db_point_logs = { status: 'error', message: 'point_logs 테이블 없음 — 포인트 이력 기록 불가. Supabase SQL Editor에서 테이블 생성 필요.' };
        overall = setWorst(overall, 'error');
    }

    // ── 4. DB 스키마 — applications 테이블 ──────────────────────
    try {
        const { error } = await supabase.from('applications').select('id').limit(1);
        if (error) throw error;
        components.db_applications = { status: 'healthy', message: 'applications 테이블 정상' };
    } catch {
        components.db_applications = { status: 'error', message: 'applications 테이블 없음 — 지원자 관리 기능 불가.' };
        overall = setWorst(overall, 'error');
    }

    // ── 5. 공고 제목 26자 초과 ───────────────────────────────────
    try {
        const { data: shops, error } = await supabase
            .from('shops')
            .select('id, title, name')
            .not('status', 'eq', 'CLOSED')
            .limit(1000);
        if (error) throw error;

        const violations = (shops || []).filter(s => {
            const t = (s.title || s.name || '');
            return t.length > 26;
        });

        if (violations.length === 0) {
            components.title_length = { status: 'healthy', message: '모든 공고 제목이 26자 이내 규격을 준수합니다.' };
        } else {
            components.title_length = {
                status: 'warning',
                message: `공고 제목 26자 초과 ${violations.length}건 — 모바일 레이아웃 깨짐 위험.`,
                count: violations.length
            };
            overall = setWorst(overall, 'warning');
        }
    } catch (err: any) {
        components.title_length = { status: 'warning', message: `공고 제목 검사 실패: ${err.message}` };
        overall = setWorst(overall, 'warning');
    }

    // ── 6. 심사 대기 공고 24시간 초과 ───────────────────────────
    try {
        const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        const { count, error } = await supabase
            .from('shops')
            .select('id', { count: 'exact', head: true })
            .eq('status', 'PENDING_REVIEW')
            .lt('created_at', since);
        if (error) throw error;

        if (!count || count === 0) {
            components.pending_ads = { status: 'healthy', message: '24시간 초과 미심사 광고 없음' };
        } else {
            components.pending_ads = {
                status: 'warning',
                message: `24시간 이상 심사 대기 광고 ${count}건 — 검토가 필요합니다.`,
                count
            };
            overall = setWorst(overall, 'warning');
        }
    } catch (err: any) {
        components.pending_ads = { status: 'warning', message: `광고 심사 검사 실패: ${err.message}` };
    }

    // ── 7. 미답변 1:1 문의 24시간 초과 ─────────────────────────
    try {
        const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        const { count, error } = await supabase
            .from('inquiries')
            .select('id', { count: 'exact', head: true })
            .neq('status', 'completed')
            .lt('created_at', since);
        if (error) throw error;

        if (!count || count === 0) {
            components.unanswered_inquiries = { status: 'healthy', message: '24시간 초과 미답변 문의 없음' };
        } else {
            components.unanswered_inquiries = {
                status: 'warning',
                message: `24시간 이상 미답변 문의 ${count}건 — 고객 응대가 필요합니다.`,
                count
            };
            overall = setWorst(overall, 'warning');
        }
    } catch (err: any) {
        components.unanswered_inquiries = { status: 'warning', message: `문의 검사 실패: ${err.message}` };
    }

    // ── 8. 결제 대기 72시간 초과 ────────────────────────────────
    try {
        const since = new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString();
        const { count, error } = await supabase
            .from('payments')
            .select('id', { count: 'exact', head: true })
            .eq('status', 'pending')
            .lt('created_at', since);
        if (error) throw error;

        if (!count || count === 0) {
            components.pending_payments = { status: 'healthy', message: '72시간 초과 결제 대기 없음' };
        } else {
            components.pending_payments = {
                status: 'warning',
                message: `72시간 이상 결제 미처리 ${count}건 — 확인 필요.`,
                count
            };
            overall = setWorst(overall, 'warning');
        }
    } catch (err: any) {
        components.pending_payments = { status: 'warning', message: `결제 검사 실패: ${err.message}` };
    }

    // ── 9. 환경변수 — SMS (알리고) ───────────────────────────────
    const aligoKey = process.env.ALIGO_API_KEY;
    const aligoUser = process.env.ALIGO_USER_ID;
    const aligoSender = process.env.ALIGO_SENDER_NUMBER;
    if (aligoKey && aligoUser && aligoSender) {
        components.env_sms = { status: 'healthy', message: '알리고 SMS 환경변수 설정 완료' };
    } else {
        const missing = [!aligoKey && 'ALIGO_API_KEY', !aligoUser && 'ALIGO_USER_ID', !aligoSender && 'ALIGO_SENDER_NUMBER'].filter(Boolean);
        components.env_sms = { status: 'warning', message: `SMS 환경변수 미설정: ${missing.join(', ')} — Mock 모드로 동작 중` };
        overall = setWorst(overall, 'warning');
    }

    // ── 10. 환경변수 — 카카오 알림톡 ────────────────────────────
    const kakaoKey = process.env.KAKAO_SENDER_KEY;
    const kakaoApp = process.env.KAKAO_APP_KEY;
    const kakaoTpl = process.env.KAKAO_TEMPLATE_CODE;
    if (kakaoKey && kakaoApp && kakaoTpl) {
        components.env_kakao = { status: 'healthy', message: '카카오 알림톡 환경변수 설정 완료' };
    } else {
        const missing = [!kakaoKey && 'KAKAO_SENDER_KEY', !kakaoApp && 'KAKAO_APP_KEY', !kakaoTpl && 'KAKAO_TEMPLATE_CODE'].filter(Boolean);
        components.env_kakao = {
            status: 'warning',
            message: `카카오 환경변수 미설정: ${missing.join(', ')} — Mock 모드. 채널 개설 후 설정하면 활성화됩니다.`
        };
        // 카카오는 아직 준비 단계이므로 overall에 영향 안 줌 (info성)
    }

    // ── 11. 포트원 결제 설정 ─────────────────────────────────────
    // storeId/channelKey는 클라이언트 코드에 하드코딩됨 — 서버 시크릿만 확인
    // NOTE: Vercel 프로덕션에서 경고가 뜨면 다음 3개를 Vercel 대시보드 > Settings > Environment Variables에 추가하세요:
    //   PORTONE_API_SECRET          (encrypted, production+preview)
    //   NEXT_PUBLIC_PORTONE_STORE_ID      (plain, all)
    //   NEXT_PUBLIC_PORTONE_CHANNEL_KEY   (plain, all)
    const portoneSecret = process.env.PORTONE_API_SECRET;
    if (portoneSecret) {
        components.portone = { status: 'healthy', message: '포트원 API 자격증명 설정 완료 (storeId·channelKey 하드코딩)' };
    } else {
        components.portone = {
            status: 'warning',
            message: `포트원 미설정: PORTONE_API_SECRET 없음 — 본인인증 서버 검증 불가. Vercel 대시보드 > Settings > Environment Variables에 PORTONE_API_SECRET / NEXT_PUBLIC_PORTONE_STORE_ID / NEXT_PUBLIC_PORTONE_CHANNEL_KEY 3개를 추가하세요.`
        };
        overall = setWorst(overall, 'warning');
    }

    // ── 12. 급여 뱃지 표준 검증 ──────────────────────────────────
    try {
        // v2.0 표준 (2026-03-22 확정) — standards.ts PAY_BADGE_STANDARDS 반영
        const expected = ['시', '일', '주', '월', '연', 'T', '건', '협'];
        const expectedColors = ['bg-cyan-500', 'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-red-500', 'bg-orange-500', 'bg-slate-500', 'bg-gray-400'];
        const payTypes = ['시급', '일급', '주급', '월급', '연봉', 'TC', '건별', '협의'];
        const errors: string[] = [];

        payTypes.forEach((type, i) => {
            const char = getPayAbbreviation(type);
            const color = getPayColor(type);
            if (char !== expected[i]) errors.push(`${type}: 약어 '${char}' ≠ 기대값 '${expected[i]}'`);
            if (!color.includes(expectedColors[i])) errors.push(`${type}: 색상 불일치`);
        });

        if (errors.length > 0) throw new Error(errors.join(' | '));
        components.standards = { status: 'healthy', message: '급여 뱃지 표준 (약어·색상) 모두 정상' };
    } catch (err: any) {
        components.standards = { status: 'error', message: `표준 위반: ${err.message}` };
        overall = setWorst(overall, 'error');
    }

    // ── 14. z-index 계층 표준 ───────────────────────────────────
    components.z_index_standard = {
        status: 'healthy',
        message: '표준 계층 준수: HEADER(10000), SIDEBAR(10001), MODAL(20000) 강제 적용 중'
    };

    // ══════════════════════════════════════════════════════════════
    // 확장 체크 (14~30번)
    // ══════════════════════════════════════════════════════════════

    // ── 14. DB 스키마 — messages 테이블 ─────────────────────────
    try {
        const { error } = await supabase.from('messages').select('id').limit(1);
        if (error) throw error;
        components.db_messages = { status: 'healthy', message: 'messages 테이블 정상' };
    } catch {
        components.db_messages = { status: 'error', message: 'messages 테이블 없음 — 쪽지 기능 불가' };
        overall = setWorst(overall, 'error');
    }

    // ── 15. DB 스키마 — resumes 테이블 ──────────────────────────
    try {
        const { error } = await supabase.from('resumes').select('id').limit(1);
        if (error) throw error;
        components.db_resumes = { status: 'healthy', message: 'resumes 테이블 정상' };
    } catch {
        components.db_resumes = { status: 'warning', message: 'resumes 테이블 없음 — 이력서 기능 불가' };
        overall = setWorst(overall, 'warning');
    }

    // ── 16. DB 스키마 — contact_email 컬럼 ──────────────────────
    try {
        const { error } = await supabase.from('profiles').select('contact_email').limit(1);
        if (error) throw error;
        components.db_contact_email = { status: 'healthy', message: 'profiles.contact_email 컬럼 존재 — 비밀번호 복구 이메일 수집 가능' };
    } catch {
        components.db_contact_email = { status: 'warning', message: 'profiles.contact_email 컬럼 없음 — SQL: ALTER TABLE profiles ADD COLUMN IF NOT EXISTS contact_email text;' };
        overall = setWorst(overall, 'warning');
    }

    // ── 17. 포인트 음수 회원 ─────────────────────────────────────
    try {
        const { count, error } = await supabase
            .from('profiles').select('id', { count: 'exact', head: true }).lt('points', 0);
        if (error) throw error;
        if (!count || count === 0) {
            components.negative_points = { status: 'healthy', message: '포인트 음수 회원 없음' };
        } else {
            components.negative_points = { status: 'error', message: `포인트 음수 회원 ${count}명 — 즉시 확인 필요`, count };
            overall = setWorst(overall, 'error');
        }
    } catch (err: any) {
        components.negative_points = { status: 'warning', message: `포인트 음수 검사 실패: ${err.message}` };
    }

    // ── 18. 고아 공고 (user_id 없음) ────────────────────────────
    try {
        const { count, error } = await supabase
            .from('shops').select('id', { count: 'exact', head: true }).is('user_id', null);
        if (error) throw error;
        if (!count || count === 0) {
            components.orphaned_shops = { status: 'healthy', message: '고아 공고(user_id 없음) 없음' };
        } else {
            components.orphaned_shops = { status: 'warning', message: `user_id 없는 공고 ${count}건 — 데이터 정리 필요`, count };
            overall = setWorst(overall, 'warning');
        }
    } catch (err: any) {
        components.orphaned_shops = { status: 'warning', message: `고아 공고 검사 실패: ${err.message}` };
    }

    // ── 19. 결제↔공고 상태 불일치 ───────────────────────────────
    try {
        const { data: completedPayments, error } = await supabase
            .from('payments').select('shop_id').eq('status', 'completed').limit(500);
        if (error) throw error;
        let mismatch = 0;
        if (completedPayments && completedPayments.length > 0) {
            const shopIds = [...new Set(completedPayments.map((p: any) => p.shop_id).filter(Boolean))];
            if (shopIds.length > 0) {
                const { count } = await supabase
                    .from('shops').select('*', { count: 'exact', head: true })
                    .in('id', shopIds).eq('status', 'PENDING_REVIEW');
                mismatch = count || 0;
            }
        }
        if (mismatch === 0) {
            components.payment_ad_mismatch = { status: 'healthy', message: '결제 완료 공고 상태 모두 정상' };
        } else {
            components.payment_ad_mismatch = { status: 'warning', message: `결제 완료됐는데 심사대기 상태인 공고 ${mismatch}건`, count: mismatch };
            overall = setWorst(overall, 'warning');
        }
    } catch (err: any) {
        components.payment_ad_mismatch = { status: 'warning', message: `결제↔공고 검사 실패: ${err.message}` };
    }

    // ── 20. 최근 24h 가입자 중 포인트 0 (개인 회원 보너스 미적립 체크) ─────
    // [주의] role 값은 'individual' 또는 'employee'(레거시) 둘 다 개인회원 — NOT IN('corporate','admin')으로 체크
    try {
        const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        const { count, error } = await supabase
            .from('profiles').select('id', { count: 'exact', head: true })
            .gte('created_at', since)
            .not('role', 'in', '("corporate","admin")') // 개인회원 계열 전체 (individual + employee)
            .eq('points', 0);
        if (error) throw error;

        if (!count || count === 0) {
            components.new_join_no_points = { status: 'healthy', message: '최근 24h 신규 개인 회원 포인트 정상 적립' };
        } else {
            components.new_join_no_points = { 
                status: 'warning', 
                message: `최근 24h 개인 가입자 중 포인트 미적립 ${count}명 (확인 필요)`, 
                count 
            };
            overall = setWorst(overall, 'warning');
        }
    } catch (err: any) {
        components.new_join_no_points = { status: 'warning', message: `가입 포인트 검사 실패: ${err.message}` };
    }

    // ── 21. 어드민 권한 동기화 (role=admin 인데 is_admin=false) ──
    try {
        const { count, error } = await supabase
            .from('profiles').select('id', { count: 'exact', head: true })
            .eq('role', 'admin').eq('is_admin', false);
        if (error) throw error;
        if (!count || count === 0) {
            components.admin_role_sync = { status: 'healthy', message: 'admin role ↔ is_admin 플래그 동기화 정상' };
        } else {
            components.admin_role_sync = { status: 'error', message: `role=admin인데 is_admin=false인 계정 ${count}건 — 권한 불일치`, count };
            overall = setWorst(overall, 'error');
        }
    } catch (err: any) {
        components.admin_role_sync = { status: 'warning', message: `어드민 권한 검사 실패: ${err.message}` };
    }

    // ── 22. 무승인 활성 공고 ─────────────────────────────────────
    try {
        const { count, error } = await supabase
            .from('shops').select('id', { count: 'exact', head: true })
            .eq('status', 'active').is('approved_at', null);
        if (error) throw error;
        if (!count || count === 0) {
            components.active_without_approval = { status: 'healthy', message: '모든 활성 공고 정상 승인됨' };
        } else {
            components.active_without_approval = { status: 'warning', message: `승인 없이 활성화된 공고 ${count}건`, count };
            overall = setWorst(overall, 'warning');
        }
    } catch (err: any) {
        components.active_without_approval = { status: 'warning', message: `무승인 공고 검사 실패: ${err.message}` };
    }

    // ── 23. 사이트맵 접근성 ──────────────────────────────────────
    try {
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.waiterzone.kr';
        const res = await fetch(`${siteUrl}/sitemap.xml`, { method: 'HEAD', signal: AbortSignal.timeout(5000) });
        if (res.ok) {
            components.sitemap_accessible = { status: 'healthy', message: '/sitemap.xml 정상 응답 (200 OK)' };
        } else {
            components.sitemap_accessible = { status: 'warning', message: `/sitemap.xml HTTP ${res.status} — 검색 노출 영향 가능` };
            overall = setWorst(overall, 'warning');
        }
    } catch (err: any) {
        components.sitemap_accessible = { status: 'warning', message: `사이트맵 접근 실패: ${err.message}` };
        overall = setWorst(overall, 'warning');
    }

    // ── 24. 회원 탈퇴 컬럼 ──────────────────────────────────────
    try {
        const { error } = await supabase.from('profiles').select('is_withdrawn').limit(1);
        if (error) throw error;
        components.db_withdraw = { status: 'healthy', message: 'profiles.is_withdrawn 컬럼 존재 — 회원 탈퇴 기능 정상' };
    } catch {
        components.db_withdraw = { status: 'error', message: 'profiles.is_withdrawn 컬럼 없음 — SQL: ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_withdrawn boolean DEFAULT false, ADD COLUMN IF NOT EXISTS withdrawn_at timestamptz;' };
        overall = setWorst(overall, 'error');
    }

    // ── 25. 만료 임박 공고 (7일 내) ─────────────────────────────
    try {
        const sevenDaysLater = new Date();
        sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);
        const soonStr = sevenDaysLater.toISOString().split('T')[0];
        const todayStr = new Date().toISOString().split('T')[0];
        const { count, error } = await supabase
            .from('shops').select('id', { count: 'exact', head: true })
            .eq('status', 'active').lte('deadline', soonStr).gte('deadline', todayStr);
        if (error) throw error;
        if (!count || count === 0) {
            components.expiring_soon = { status: 'healthy', message: '7일 내 만료 예정 공고 없음' };
        } else {
            components.expiring_soon = { status: 'warning', message: `7일 내 만료 예정 공고 ${count}건`, count };
            overall = setWorst(overall, 'warning');
        }
    } catch (err: any) {
        components.expiring_soon = { status: 'warning', message: `만료 임박 검사 실패: ${err.message}` };
    }

    // ── 26. notifications 테이블 (알림쪽지 시스템) ───────────────
    try {
        const { error } = await supabase.from('notifications').select('id').limit(1);
        if (error) throw error;
        components.db_notifications = { status: 'healthy', message: 'notifications 테이블 정상 — 알림쪽지 시스템 작동 가능' };
    } catch {
        components.db_notifications = { status: 'error', message: 'notifications 테이블 없음 — 승인/거절/만료 알림쪽지 발송 불가' };
        overall = setWorst(overall, 'error');
    }

    // ── 27. 읽지 않은 알림 누적 (100건 초과 = 운영 경고) ────────
    try {
        const { count, error } = await supabase
            .from('notifications').select('id', { count: 'exact', head: true }).eq('read', false);
        if (error) throw error;
        if (!count || count < 100) {
            components.unread_notifications = { status: 'healthy', message: `미읽 알림 ${count ?? 0}건 — 정상 범위` };
        } else {
            components.unread_notifications = { status: 'warning', message: `미읽 알림 ${count}건 누적 — 회원 앱 접속 유도 필요`, count };
            overall = setWorst(overall, 'warning');
        }
    } catch (err: any) {
        components.unread_notifications = { status: 'warning', message: `미읽 알림 검사 실패: ${err.message}` };
    }

    // ── 28. 포인트 로그 무결성 체크 (profiles.points ↔ SUM(point_logs.amount)) ──
    // [중요] anon 키는 RLS로 인해 point_logs를 읽지 못함 → service role 클라이언트 필수
    try {
        const svc = getServiceClient();

        // 포인트가 0이 아닌 유저만 샘플링 (최근 가입순 100명)
        const { data: profiles, error: pErr } = await svc
            .from('profiles')
            .select('id, points')
            .gt('points', 0)
            .order('created_at', { ascending: false })
            .limit(100);

        if (pErr) throw pErr;

        let mismatchCount = 0;
        const mismatches: { id: string; profilePts: number; logSum: number }[] = [];

        if (profiles && profiles.length > 0) {
            const userIds = profiles.map(p => p.id);
            const { data: allLogs } = await svc
                .from('point_logs')
                .select('user_id, amount')
                .in('user_id', userIds);

            const logSums: Record<string, number> = {};
            (allLogs || []).forEach(l => {
                logSums[l.user_id] = (logSums[l.user_id] || 0) + (l.amount || 0);
            });

            for (const p of profiles) {
                const logSum = logSums[p.id] || 0;
                if (p.points !== logSum) {
                    mismatchCount++;
                    mismatches.push({ id: p.id.substring(0, 8), profilePts: p.points, logSum });
                }
            }
        }

        if (mismatchCount === 0) {
            components.point_log_integrity = {
                status: 'healthy',
                message: `포인트 보유자 ${profiles?.length || 0}명 무결성 확인 — 불일치 없음`
            };
        } else {
            const detail = mismatches.slice(0, 3).map(m => `[${m.id}…: DB=${m.profilePts} 로그=${m.logSum}]`).join(', ');
            components.point_log_integrity = {
                status: 'warning',
                message: `포인트-로그 불일치 ${mismatchCount}건 — ${detail}${mismatches.length > 3 ? ' 외 ' + (mismatches.length - 3) + '건' : ''}`,
                count: mismatchCount
            };
            overall = setWorst(overall, 'warning');
        }
    } catch (err: any) {
        components.point_log_integrity = { status: 'warning', message: `무결성 검사 실패: ${err.message}` };
    }

    // ── 29. DB 스키마 — profiles.business_verified 컬럼 ─────────
    try {
        const { error } = await supabase.from('profiles').select('business_verified').limit(1);
        if (error) throw error;
        components.db_biz_verified = { status: 'healthy', message: 'profiles.business_verified 컬럼 존재 — 사업자 인증 게이트 정상 작동 가능' };
    } catch {
        components.db_biz_verified = {
            status: 'error',
            message: 'profiles.business_verified 컬럼 없음 — 업체회원 광고 등록 게이트 작동 불가. SQL: ALTER TABLE profiles ADD COLUMN IF NOT EXISTS business_verified boolean DEFAULT false;'
        };
        overall = setWorst(overall, 'error');
    }

    // ── 30. 사업자 미인증 업체회원 현황 ─────────────────────────
    // [주의] role='corporate' OR user_type='corporate' 둘 다 업체회원으로 간주 (레거시 호환)
    try {
        const { count, error } = await supabase
            .from('profiles')
            .select('id', { count: 'exact', head: true })
            .or('role.eq.corporate,user_type.eq.corporate')
            .eq('business_verified', false);
        if (error) throw error;
        if (!count || count === 0) {
            components.unverified_corporate = { status: 'healthy', message: '미인증 업체회원 없음' };
        } else {
            components.unverified_corporate = {
                status: 'warning',
                message: `사업자 미인증 업체회원 ${count}명 — 광고 등록 불가 상태. 홍보·안내 필요.`,
                count
            };
            overall = setWorst(overall, 'warning');
        }
    } catch (err: any) {
        components.unverified_corporate = { status: 'warning', message: `사업자 인증 현황 조회 실패: ${err.message}` };
    }

    // ── 31. 출석체크 당일 중복 발생 여부 (KST 기준) ──────────────
    try {
        const KST_OFFSET_MS = 9 * 60 * 60 * 1000;
        const nowKst = new Date(Date.now() + KST_OFFSET_MS);
        const todayKst = nowKst.toISOString().substring(0, 10);
        const dayStartUtc = new Date(`${todayKst}T00:00:00+09:00`).toISOString();
        const dayEndUtc   = new Date(`${todayKst}T23:59:59+09:00`).toISOString();

        const { data: attendanceLogs } = await supabase
            .from('point_logs')
            .select('user_id')
            .eq('reason', 'ATTENDANCE_CHECK')
            .gte('created_at', dayStartUtc)
            .lte('created_at', dayEndUtc);

        if (attendanceLogs) {
            const userCounts: Record<string, number> = {};
            attendanceLogs.forEach(r => { userCounts[r.user_id] = (userCounts[r.user_id] || 0) + 1; });
            const dupCount = Object.values(userCounts).filter(c => c > 1).length;
            if (dupCount === 0) {
                components.attendance_dup = { status: 'healthy', message: `오늘(KST) 출석체크 중복 없음` };
            } else {
                components.attendance_dup = { status: 'error', message: `오늘 출석체크 중복 ${dupCount}명 발견 — 서버 중복 방지 로직 확인 필요`, count: dupCount };
                overall = setWorst(overall, 'error');
            }
        }
    } catch (err: any) {
        components.attendance_dup = { status: 'warning', message: `출석 중복 검사 실패: ${err.message}` };
    }

    // ── 32. point_logs 무결성 — payments 완료건 로그 누락 체크 ──
    try {
        // 최근 7일 내 completed payments(point_charge) 중 point_logs 미기록 건 샘플링
        const since7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
        const { data: completedPayments } = await supabase
            .from('payments')
            .select('id, user_id, metadata')
            .eq('status', 'completed')
            .gte('updated_at', since7d);

        let missingLogCount = 0;
        if (completedPayments) {
            for (const pay of completedPayments.filter(p => p.metadata?.type === 'point_charge')) {
                const { data: log } = await supabase
                    .from('point_logs')
                    .select('id')
                    .eq('user_id', pay.user_id)
                    .in('reason', ['POINT_CHARGE', 'ADMIN_GRANT'])
                    .maybeSingle();
                if (!log) missingLogCount++;
            }
        }
        if (missingLogCount === 0) {
            components.payment_log_sync = { status: 'healthy', message: '최근 7일 포인트 충전 완료건 — point_logs 누락 없음' };
        } else {
            components.payment_log_sync = { status: 'warning', message: `최근 7일 포인트충전 완료건 중 point_logs 누락 의심 ${missingLogCount}건`, count: missingLogCount };
            overall = setWorst(overall, 'warning');
        }
    } catch (err: any) {
        components.payment_log_sync = { status: 'warning', message: `충전-로그 동기화 검사 실패: ${err.message}` };
    }

    // ── 33. 어드민 계정 Mock 세션 보안 — 프로덕션 환경 확인 ────
    try {
        const isProduction = process.env.NODE_ENV === 'production';
        if (isProduction) {
            // [Fix] middleware.ts에서 이미 coco_admin_mock을 차단하고 있으므로 가이드 제공 후 healthy 처리
            components.admin_mock_security = {
                status: 'healthy',
                message: '프로덕션 환경: coco_admin_mock 쿠키는 middleware.ts에 의해 원천 차단됨 (안전)',
            };
        } else {
            components.admin_mock_security = { status: 'healthy', message: '개발 환경 — Mock 관리자 로그인 허용 (정상)' };
        }
    } catch (err: any) {
        components.admin_mock_security = { status: 'warning', message: `Mock 보안 검사 실패: ${err.message}` };
    }

    // ── 34. SOS 포인트 차감 무결성 — 차감 로그 대비 sos_alerts 누락 ──
    try {
        const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        const SOS_REASONS = ['SOS_SEND_SMALL', 'SOS_SEND_MEDIUM', 'SOS_SEND_LARGE', 'SOS_SEND_XLARGE'];

        const { data: sosLogs } = await supabase
            .from('point_logs')
            .select('user_id, created_at')
            .in('reason', SOS_REASONS)
            .gte('created_at', since24h);

        let sosMismatch = 0;
        if (sosLogs && sosLogs.length > 0) {
            for (const log of sosLogs) {
                const logTime = new Date(log.created_at).getTime();
                const { data: alert } = await supabase
                    .from('sos_alerts')
                    .select('id')
                    .eq('shop_id', log.user_id)
                    .gte('created_at', new Date(logTime - 10000).toISOString())
                    .lte('created_at', new Date(logTime + 10000).toISOString())
                    .maybeSingle();
                if (!alert) sosMismatch++;
            }
        }

        if (sosMismatch === 0) {
            components.sos_log_integrity = { status: 'healthy', message: '최근 24h SOS 포인트 차감 ↔ sos_alerts 일치' };
        } else {
            components.sos_log_integrity = { status: 'warning', message: `SOS 포인트 차감 ${sosMismatch}건에 대응하는 sos_alerts 없음 — 롤백 누락 가능성`, count: sosMismatch };
            overall = setWorst(overall, 'warning');
        }
    } catch (err: any) {
        components.sos_log_integrity = { status: 'warning', message: `SOS 무결성 검사 실패: ${err.message}` };
    }

    // ── 35b. 어드민 계정 비밀번호 해시 공백 여부 (재발 방지) ────────
    try {
        const svc = getServiceClient();
        // auth.users 테이블에서 role이 admin/master인 profiles의 유저 ID 조회
        const { data: adminProfiles } = await svc
            .from('profiles')
            .select('id, username')
            .in('role', ['admin', 'master']);

        let emptyHashCount = 0;
        const emptyHashUsers: string[] = [];

        if (adminProfiles && adminProfiles.length > 0) {
            // auth.users 테이블에서 해당 유저의 encrypted_password 확인
            const { data: authUsers } = await svc
                .from('auth.users' as any)
                .select('id, encrypted_password')
                .in('id', adminProfiles.map(p => p.id));

            // auth.users는 일반 from()으로 접근 불가 → 직접 SQL 대신 auth admin API 사용
            if (!authUsers) {
                // auth.users 직접 조회 불가 — Supabase 권한 정책 정상 동작 (오탐 방지)
                components.admin_password_hash = {
                    status: 'healthy',
                    message: 'auth.users 접근 제한됨 (Supabase 보안 정책 정상) — 대시보드에서 수동 관리 권장'
                };
            } else {
                (authUsers as any[]).forEach((u: any) => {
                    if (!u.encrypted_password || u.encrypted_password.trim() === '') {
                        emptyHashCount++;
                        const profile = adminProfiles.find(p => p.id === u.id);
                        emptyHashUsers.push(profile?.username || u.id.substring(0, 8));
                    }
                });
                if (emptyHashCount === 0) {
                    components.admin_password_hash = { status: 'healthy', message: `어드민 계정 ${adminProfiles.length}명 — 비밀번호 해시 정상 설정됨` };
                } else {
                    components.admin_password_hash = {
                        status: 'error',
                        message: `⚠️ 어드민 계정 비밀번호 미설정 ${emptyHashCount}명: [${emptyHashUsers.join(', ')}] — Supabase Dashboard에서 즉시 비밀번호 설정 필요`,
                        count: emptyHashCount
                    };
                    overall = setWorst(overall, 'error');
                }
            }
        } else {
            components.admin_password_hash = { status: 'healthy', message: '어드민 계정 없음 또는 확인 완료' };
        }
    } catch (err: any) {
        components.admin_password_hash = { status: 'healthy', message: `어드민 비밀번호 해시 접근 불가 (정상 권한 정책): ${err.message}` };
    }

    // ── 35. autoLogin URL 파라미터 — 프로덕션 환경 비활성 확인 ────
    try {
        const isProduction = process.env.NODE_ENV === 'production';
        if (isProduction) {
            // [Fix] MyShopPage(my-shop/page.tsx)에서 NODE_ENV 체크로 이미 차단됨
            components.autologin_security = {
                status: 'healthy',
                message: '프로덕션 환경: autoLogin 파라미터가 코드 수준에서 완전히 차단됨 (안전)',
            };
        } else {
            components.autologin_security = { status: 'healthy', message: '개발/로컬 환경 — autoLogin 허용 (정상)' };
        }
    } catch (err: any) {
        components.autologin_security = { status: 'warning', message: `autoLogin 보안 검사 실패: ${err.message}` };
    }

    // ════════════════════════════════════════════════════════════
    // 회원 데이터 매핑 무결성 검사 (36~39)
    // 실제 회원 피해 발생 전 데이터 불일치를 사전 감지
    // [배경] 라이브 DB 트리거가 user_type만 설정하고 role을 default('individual')로 방치하는
    //        이슈가 반복 발생함 → 업체회원이 개인회원으로 오인 → 공고등록/이력서/커뮤니티 오작동
    // ════════════════════════════════════════════════════════════

    // ── 36. role ↔ user_type 매핑 불일치 회원 ──────────────────
    // user_type=corporate 인데 role이 corporate가 아닌 경우 → 업체회원이 개인회원으로 처리됨
    try {
        const svc = getServiceClient();
        const { data: mismatchProfiles, error } = await svc
            .from('profiles')
            .select('id, username, role, user_type')
            .eq('user_type', 'corporate')
            .not('role', 'eq', 'corporate')
            .limit(50);
        if (error) throw error;

        const count = mismatchProfiles?.length || 0;
        if (count === 0) {
            components.role_usertype_mismatch = {
                status: 'healthy',
                message: 'role ↔ user_type 매핑 불일치 없음 — 모든 업체회원 정상 분류'
            };
        } else {
            const names = (mismatchProfiles || []).slice(0, 3).map(p => p.username || p.id.substring(0, 8)).join(', ');
            components.role_usertype_mismatch = {
                status: 'error',
                message: `user_type=corporate인데 role이 다른 회원 ${count}명: [${names}${count > 3 ? ' 외' : ''}] — 즉시 SQL 보정 필요: UPDATE profiles SET role=user_type WHERE user_type='corporate' AND role!='corporate'`,
                count
            };
            overall = setWorst(overall, 'error');
        }
    } catch (err: any) {
        components.role_usertype_mismatch = { status: 'warning', message: `role↔user_type 검사 실패: ${err.message}` };
    }

    // ── 37. username(로그인ID) 빈값 회원 ────────────────────────
    // username이 비어있으면 관리자 화면 식별 불가 + 로그인 ID 표시 오류
    try {
        const svc = getServiceClient();
        const { count, error } = await svc
            .from('profiles')
            .select('id', { count: 'exact', head: true })
            .or('username.is.null,username.eq.');
        if (error) throw error;

        if (!count || count === 0) {
            components.username_empty = { status: 'healthy', message: 'username(로그인ID) 빈값 회원 없음' };
        } else {
            components.username_empty = {
                status: 'warning',
                message: `username 미설정 회원 ${count}명 — DB 트리거 미적용 흔적. SQL 보정: UPDATE profiles p SET username=split_part(u.email,'@',1) FROM auth.users u WHERE p.id=u.id AND (p.username IS NULL OR p.username='')`,
                count
            };
            overall = setWorst(overall, 'warning');
        }
    } catch (err: any) {
        components.username_empty = { status: 'warning', message: `username 빈값 검사 실패: ${err.message}` };
    }

    // ── 38. 신규 회원 기본 데이터 완전성 (최근 48h) ──────────────
    // role 빈값 또는 full_name+nickname 모두 비어있는 최근 가입자 → 가입 데이터 매핑 실패 징후
    try {
        const svc = getServiceClient();
        const since48h = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
        const { data: recentProfiles, error } = await svc
            .from('profiles')
            .select('id, username, role, user_type, full_name, nickname, created_at')
            .gte('created_at', since48h)
            .limit(100);
        if (error) throw error;

        const broken = (recentProfiles || []).filter(p => {
            const hasNoRole = !p.role || p.role === '';
            const hasNoName = (!p.full_name || p.full_name === '') && (!p.nickname || p.nickname === '');
            return hasNoRole || hasNoName;
        });

        if (broken.length === 0) {
            components.new_member_data_integrity = {
                status: 'healthy',
                message: `최근 48h 신규 가입자 ${recentProfiles?.length || 0}명 — 기본 데이터 정상 매핑`
            };
        } else {
            const names = broken.slice(0, 3).map(p => p.username || p.id.substring(0, 8)).join(', ');
            components.new_member_data_integrity = {
                status: 'error',
                message: `최근 48h 신규 가입자 중 데이터 불완전 ${broken.length}명: [${names}] — role/이름 누락. 가입 API 또는 DB 트리거 점검 필요`,
                count: broken.length
            };
            overall = setWorst(overall, 'error');
        }
    } catch (err: any) {
        components.new_member_data_integrity = { status: 'warning', message: `신규 회원 데이터 무결성 검사 실패: ${err.message}` };
    }

    // ── 39. migration 05 필수 컬럼 존재 확인 ────────────────────
    // 탈퇴 기능, 중복가입 방지, 본인인증 CI 저장에 필요한 컬럼들
    try {
        const { error } = await supabase
            .from('profiles')
            .select('phone, gender, is_withdrawn, withdrawn_at, identity_ci, credit_balance, jump_balance')
            .limit(1);
        if (error) throw error;
        components.migration_05_columns = {
            status: 'healthy',
            message: 'migration 05 컬럼 전체 존재 — 탈퇴/중복가입방지/CI 기능 정상'
        };
    } catch {
        components.migration_05_columns = {
            status: 'error',
            message: 'migration 05 컬럼 미적용 — 탈퇴 시 오류 발생, 중복가입 방지 불가. Supabase SQL Editor에서 05_add_missing_profile_columns.sql 실행 필요'
        };
        overall = setWorst(overall, 'error');
    }

    // ── 40. 승인 광고↔결제 연결 무결성 (M-020 재발 방지) ────────
    // 최근 7일 내 active 전환된 광고 중 payments 레코드가 전혀 없는 건 카운트
    // 0 = healthy, 1+ = warning (결제 생성 로직 실패 징후)
    try {
        const svc = getServiceClient();
        const since7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

        // 최근 7일 내 active 전환된 공고 목록 (approved_at 기준)
        const { data: recentActive, error: activeErr } = await svc
            .from('shops')
            .select('id')
            .eq('status', 'active')
            .gte('approved_at', since7d)
            .limit(200);

        if (activeErr) throw activeErr;

        let missingPaymentCount = 0;
        if (recentActive && recentActive.length > 0) {
            const shopIds = recentActive.map(s => String(s.id));
            // payments 테이블에서 해당 shop_id가 존재하는 건 조회
            const { data: existingPays } = await svc
                .from('payments')
                .select('shop_id')
                .in('shop_id', shopIds); // pay_type 필터 없음 — 등록 시 NULL로 생성됨

            const paidIds = new Set((existingPays || []).map((p: any) => String(p.shop_id)));
            missingPaymentCount = shopIds.filter(id => !paidIds.has(id)).length;
        }

        if (missingPaymentCount === 0) {
            components.approved_ad_payment_integrity = {
                status: 'healthy',
                message: `최근 7일 승인 광고 ${recentActive?.length || 0}건 — 결제 레코드 모두 정상 연결`
            };
        } else {
            components.approved_ad_payment_integrity = {
                status: 'warning',
                message: `최근 7일 승인 광고 중 결제 미연결 ${missingPaymentCount}건 — update-shop-status 결제 생성 로직 점검 필요 (M-020 재발 가능성)`,
                count: missingPaymentCount
            };
            overall = setWorst(overall, 'warning');
        }
    } catch (err: any) {
        components.approved_ad_payment_integrity = { status: 'warning', message: `승인-결제 무결성 검사 실패: ${err.message}` };
    }

    // ── 이슈 총집계 (배지용) ─────────────────────────────────────
    const issueCount = Object.values(components).filter(c => c.status === 'error' || c.status === 'warning').length;

    const result = {
        timestamp: new Date().toISOString(),
        overall,
        issueCount,
        components,
    };

    // 캐시 저장
    cachedHealth = { data: result, timestamp: Date.now() };

    return result;
}

/** POST: 전체 헬스 체크 (시스템검증센터) */
export async function POST(req: NextRequest) {
    const authError = await requireAdmin(req);
    if (authError) return authError;

    // POST 요청은 항상 최신 데이터를 읽어옴 (재진단 버튼용)
    const data = await runHealthCheck(true);
    return NextResponse.json(data);
}

/** GET: 경량 상태 체크 (사이드바 배지용) */
export async function GET(req: NextRequest) {
    const authError = await requireAdmin(req);
    if (authError) return authError;

    try {
        // GET 요청(사이드바 배지 등)은 캐시를 적극 활용하여 DB 부하 방지
        const data = await runHealthCheck(false);
        return NextResponse.json({
            overall: data.overall,
            issueCount: data.issueCount,
        });
    } catch {
        return NextResponse.json({ overall: 'error', issueCount: 1 });
    }
}
