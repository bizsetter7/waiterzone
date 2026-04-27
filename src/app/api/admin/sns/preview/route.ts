/**
 * [Admin API] /api/admin/sns/preview
 * 다음 발행 예정 트윗 미리보기 + 수동 트윗 텍스트 생성
 *
 * GET → 현재 시간 기준 자동 생성될 트윗 미리보기
 * POST { type, regionSlug?, workType? } → 지정 조건으로 트윗 미리보기 생성
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAdmin } from '@/lib/requireAdmin';
import {
    getTweetTypeByHour,
    getTodayRegion,
    getTodayWorkType,
    buildNewJobTweet,
    buildSalaryInfoTweet,
    buildGuideTweet,
    type TweetType,
} from '@/lib/tweetTemplates';
import { getTweetLength, isTwitterConfigured } from '@/lib/twitterClient';
import { slugify } from '@/utils/shopUtils';

export const dynamic = 'force-dynamic';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function GET(request: NextRequest) {
    const authError = await requireAdmin(request);
    if (authError) return authError;

    const tweetType   = getTweetTypeByHour();
    const todayRegion = getTodayRegion();
    const todayWT     = getTodayWorkType();

    // 미리보기용 샘플 데이터 조회
    const { data: sampleShop } = await supabaseAdmin
        .from('shops')
        .select('id, name, title, region, work_type, pay, pay_type, options')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

    let previewText = '';

    if (tweetType === 'new_job' && sampleShop) {
        const region     = String(sampleShop.region ?? '').replace(/[\[\]]/g, '').trim();
        const regionSlug = slugify(region) || todayRegion.slug;
        previewText = buildNewJobTweet({
            shopId:     sampleShop.id,
            name:       sampleShop.title || sampleShop.name || '업체명',
            region:     sampleShop.region ?? '',
            regionSlug,
            workType:   sampleShop.work_type ?? todayWT,
            pay:        sampleShop.pay ?? '면접후결정',
            payType:    sampleShop.pay_type ?? 'TC',
            conditions: [],
        });
    } else if (tweetType === 'salary_info') {
        previewText = buildSalaryInfoTweet({
            regionSlug: todayRegion.slug,
            regionName: todayRegion.name,
            workType:   todayWT,
            avgPay:     130000,
            maxPay:     200000,
            shopCount:  12,
            payType:    '일당',
        });
    } else {
        previewText = buildGuideTweet({
            workType:   todayWT,
            regionSlug: todayRegion.slug,
            regionName: todayRegion.name,
            tip:        '',
        });
    }

    const kstHour = (new Date().getUTCHours() + 9) % 24;

    return NextResponse.json({
        ok: true,
        preview: {
            type:          tweetType,
            text:          previewText,
            charCount:     getTweetLength(previewText),
            todayRegion,
            todayWorkType: todayWT,
            kstHour,
        },
        twitterConfigured: isTwitterConfigured(),
        nextSlots: [
            { kst: '08:00', type: 'salary_info',  utc: '23:00 (전날)' },
            { kst: '12:00', type: 'new_job',       utc: '03:00' },
            { kst: '18:00', type: 'guide',         utc: '09:00' },
            { kst: '22:00', type: 'new_job',       utc: '13:00' },
        ],
    });
}

export async function POST(request: NextRequest) {
    const authError = await requireAdmin(request);
    if (authError) return authError;

    const body = await request.json();
    const {
        type = 'guide',
        regionSlug,
        workType,
        customText,
    }: {
        type?: TweetType;
        regionSlug?: string;
        workType?: string;
        customText?: string;
    } = body;

    const region  = regionSlug ?? getTodayRegion().slug;
    const wt      = workType   ?? getTodayWorkType();
    const rName   = region.split('-')[0];

    let text = customText ?? '';

    if (!text) {
        if (type === 'new_job') {
            const { data: shop } = await supabaseAdmin
                .from('shops')
                .select('id, name, title, region, work_type, pay, pay_type')
                .eq('status', 'active')
                .order('created_at', { ascending: false })
                .limit(1)
                .single();

            if (shop) {
                const r = String(shop.region ?? '').replace(/[\[\]]/g, '').trim();
                text = buildNewJobTweet({
                    shopId:     shop.id,
                    name:       shop.title || shop.name || '업체명',
                    region:     shop.region ?? '',
                    regionSlug: slugify(r) || region,
                    workType:   shop.work_type ?? wt,
                    pay:        shop.pay ?? '면접후결정',
                    payType:    shop.pay_type ?? 'TC',
                    conditions: [],
                });
            }
        } else if (type === 'salary_info') {
            text = buildSalaryInfoTweet({
                regionSlug: region,
                regionName: rName,
                workType:   wt,
                avgPay:     130000,
                maxPay:     200000,
                shopCount:  8,
                payType:    '일당',
            });
        } else {
            text = buildGuideTweet({
                workType:   wt,
                regionSlug: region,
                regionName: rName,
                tip:        '',
            });
        }
    }

    return NextResponse.json({
        ok:        true,
        text,
        charCount: getTweetLength(text),
        isValid:   getTweetLength(text) <= 280,
    });
}
