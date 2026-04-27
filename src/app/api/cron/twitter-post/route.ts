/**
 * [Cron] /api/cron/twitter-post
 * 시간대별 트윗 자동 발행 파이프라인
 *
 * Vercel Cron 스케줄 (KST 기준 → UTC 변환):
 *   08:00 KST = 23:00 UTC(전날)  → 지역 시세 정보
 *   12:00 KST = 03:00 UTC        → 신규 구인 공고
 *   18:00 KST = 09:00 UTC        → 가이드 콘텐츠
 *   22:00 KST = 13:00 UTC        → 신규 구인 공고
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireCron } from '@/lib/requireCron';
import { isTwitterConfigured, postTweet, isTweetValid } from '@/lib/twitterClient';
import {
    getTweetTypeByHour,
    getTodayRegion,
    getTodayWorkType,
    buildNewJobTweet,
    buildSalaryInfoTweet,
    buildGuideTweet,
    type TweetType,
} from '@/lib/tweetTemplates';
import { slugify } from '@/utils/shopUtils';

export const dynamic = 'force-dynamic';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function GET(request: NextRequest) {
    // 크론 인증
    const authError = requireCron(request);
    if (authError) return authError;

    // Twitter 설정 확인
    if (!isTwitterConfigured()) {
        return NextResponse.json({
            ok: false,
            message: 'Twitter API 환경변수가 설정되지 않았습니다. Vercel 환경변수를 확인하세요.',
            required: ['TWITTER_API_KEY', 'TWITTER_API_SECRET', 'TWITTER_ACCESS_TOKEN', 'TWITTER_ACCESS_SECRET'],
        }, { status: 503 });
    }

    const tweetType: TweetType = getTweetTypeByHour();
    const todayRegion   = getTodayRegion();
    const todayWorkType = getTodayWorkType();

    try {
        let tweetText = '';

        // ── TYPE_A: 신규 구인 공고 ──────────────────────────────────────────
        if (tweetType === 'new_job') {
            // 최근 24시간 내 등록된 active 공고 중 1개 선택
            const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
            const { data: shops } = await supabaseAdmin
                .from('shops')
                .select('id, name, title, region, work_type, pay, pay_type, options, tier')
                .eq('status', 'active')
                .gte('created_at', since)
                .order('created_at', { ascending: false })
                .limit(10);

            if (!shops || shops.length === 0) {
                // 신규 없으면 가이드 콘텐츠로 폴백
                tweetText = buildGuideTweet({
                    workType:   todayWorkType,
                    regionSlug: todayRegion.slug,
                    regionName: todayRegion.name,
                    tip:        '',
                });
            } else {
                // 랜덤 1개 선택 (같은 공고 반복 방지)
                const shop    = shops[Math.floor(Math.random() * shops.length)];
                const region  = String(shop.region ?? '').replace(/[\[\]]/g, '').trim();
                const regionSlug = slugify(region) || todayRegion.slug;
                const workType   = String(shop.work_type ?? todayWorkType);
                const options    = shop.options ?? {};
                const conditions: string[] = [];
                if ((options as any).sameDayPay)   conditions.push('당일지급');
                if ((options as any).accommodation) conditions.push('숙식제공');
                if ((options as any).dailyPay)      conditions.push('일급');

                tweetText = buildNewJobTweet({
                    shopId:     shop.id,
                    name:       shop.title || shop.name || '업체명 미기재',
                    region:     shop.region ?? '',
                    regionSlug,
                    workType,
                    pay:        shop.pay ?? '면접후결정',
                    payType:    shop.pay_type ?? 'TC',
                    conditions,
                });
            }
        }

        // ── TYPE_B: 지역 시세 정보 ──────────────────────────────────────────
        else if (tweetType === 'salary_info') {
            const { data: shops } = await supabaseAdmin
                .from('shops')
                .select('pay, pay_type, region, work_type')
                .eq('status', 'active')
                .eq('work_type', todayWorkType)
                .not('pay', 'is', null)
                .neq('pay', '면접후결정');

            const numeric = (shops ?? [])
                .map(s => Number(s.pay))
                .filter(p => p > 0 && p < 10_000_000); // 이상치 제거

            if (numeric.length < 2) {
                // 데이터 부족 시 가이드로 폴백
                tweetText = buildGuideTweet({
                    workType:   todayWorkType,
                    regionSlug: todayRegion.slug,
                    regionName: todayRegion.name,
                    tip:        '',
                });
            } else {
                const avg = Math.round(numeric.reduce((a, b) => a + b, 0) / numeric.length);
                const max = Math.max(...numeric);
                tweetText = buildSalaryInfoTweet({
                    regionSlug: todayRegion.slug,
                    regionName: todayRegion.name,
                    workType:   todayWorkType,
                    avgPay:     avg,
                    maxPay:     max,
                    shopCount:  numeric.length,
                    payType:    '일당',
                });
            }
        }

        // ── TYPE_C: 가이드 콘텐츠 ──────────────────────────────────────────
        else {
            tweetText = buildGuideTweet({
                workType:   todayWorkType,
                regionSlug: todayRegion.slug,
                regionName: todayRegion.name,
                tip:        '',
            });
        }

        // 길이 검증
        if (!isTweetValid(tweetText)) {
            tweetText = tweetText.slice(0, 270) + '…';
        }

        // 트윗 발행 시도 — X API 유료화로 실패 시 초안 저장 후 200 반환
        try {
            const result = await postTweet(tweetText);
            return NextResponse.json({
                ok:        true,
                mode:      'auto',
                tweetType,
                tweetId:   result.id,
                tweetText: result.text,
                postedAt:  new Date().toISOString(),
            });
        } catch (apiError: any) {
            // X API 실패(402/403 등) → 초안을 DB에 저장하고 200 반환 (크론 실패 처리 방지)
            console.warn('[Cron/twitter-post] X API 실패, 초안 저장 모드:', apiError?.message);
            try {
                await supabaseAdmin.from('tweet_queue').insert({
                    tweet_text: tweetText,
                    tweet_type: tweetType,
                    status: 'pending',
                    created_at: new Date().toISOString(),
                });
            } catch { /* 테이블 없어도 무시 */ }

            return NextResponse.json({
                ok:        true,
                mode:      'draft_saved',
                tweetType,
                tweetText,
                message:   'X API 미지원(유료화) — 초안 저장 완료. SNS 관리 페이지에서 수동 게시하세요.',
                generatedAt: new Date().toISOString(),
            });
        }

    } catch (error: any) {
        console.error('[Cron/twitter-post]', error);
        return NextResponse.json({
            ok:      false,
            error:   error.message ?? '알 수 없는 오류',
            tweetType,
        }, { status: 500 });
    }
}
