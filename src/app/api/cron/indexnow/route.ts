/**
 * [Cron] /api/cron/indexnow
 * Google / Bing IndexNow API — 신규·수정 URL 즉시 색인 요청
 *
 * IndexNow 프로토콜: https://www.indexnow.org/documentation
 * - Bing에 제출 시 Google, Yandex 등 파트너 엔진에 자동 전파
 * - 무료, 즉시 처리 (평균 수분 내 색인)
 *
 * 환경변수:
 *   INDEXNOW_KEY — 인증 키 (public/{INDEXNOW_KEY}.txt 파일과 동일한 값)
 *
 * 동작:
 *   1. 최근 6시간 내 생성/수정된 active 광고 URL 수집
 *   2. 최근 커뮤니티 게시물 URL 수집
 *   3. IndexNow API에 일괄 제출
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireCron } from '@/lib/requireCron';
import { slugify } from '@/utils/shopUtils';

export const dynamic = 'force-dynamic';

const BASE_URL = 'https://www.waiterzone.kr';
const INDEXNOW_HOST = 'api.indexnow.org';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function GET(request: NextRequest) {
    const authError = requireCron(request);
    if (authError) return authError;

    const indexNowKey = process.env.INDEXNOW_KEY;
    if (!indexNowKey) {
        return NextResponse.json({
            ok: false,
            message: 'INDEXNOW_KEY 환경변수가 설정되지 않았습니다.',
        }, { status: 503 });
    }

    const since = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString();
    const urls: string[] = [];

    try {
        // ── 1. 신규·수정 광고 URL ──────────────────────────────────────────
        const { data: shops } = await supabaseAdmin
            .from('shops')
            .select('id, region, updated_at')
            .eq('status', 'active')
            .gte('updated_at', since)
            .limit(100);

        for (const shop of shops ?? []) {
            const region = String(shop.region ?? '').replace(/[\[\]]/g, '').trim();
            const regionSlug = slugify(region);
            if (regionSlug) {
                urls.push(`${BASE_URL}/coco/${regionSlug}/${shop.id}`);
            }
        }

        // ── 2. 신규 커뮤니티 게시물 ───────────────────────────────────────
        const { data: posts } = await supabaseAdmin
            .from('community_posts')
            .select('id')
            .eq('is_secret', false)
            .gte('created_at', since)
            .limit(50);

        for (const post of posts ?? []) {
            urls.push(`${BASE_URL}/community/${post.id}`);
        }

        if (urls.length === 0) {
            return NextResponse.json({ ok: true, message: '제출할 URL 없음', submitted: 0 });
        }

        // ── 3. IndexNow API 제출 ───────────────────────────────────────────
        const body = {
            host:    'www.waiterzone.kr',
            key:     indexNowKey,
            keyLocation: `${BASE_URL}/${indexNowKey}.txt`,
            urlList: urls,
        };

        const response = await fetch(`https://${INDEXNOW_HOST}/IndexNow`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json; charset=utf-8' },
            body: JSON.stringify(body),
        });

        // IndexNow: 200 = 성공, 202 = 접수됨(처리 중)
        if (!response.ok && response.status !== 202) {
            const errText = await response.text();
            throw new Error(`IndexNow API ${response.status}: ${errText}`);
        }

        return NextResponse.json({
            ok:        true,
            submitted: urls.length,
            urls:      urls.slice(0, 5), // 로그용 샘플만
            status:    response.status,
            submittedAt: new Date().toISOString(),
        });

    } catch (error: any) {
        console.error('[Cron/indexnow]', error);
        return NextResponse.json({
            ok:    false,
            error: error.message ?? '알 수 없는 오류',
        }, { status: 500 });
    }
}
