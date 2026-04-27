/**
 * [Cron] /api/cron/band-post
 * 네이버 밴드 자동 게시 파이프라인
 *
 * 동작 흐름:
 *   1. 최근 24시간 내 승인된 공고 중 랜덤 1개 선택
 *   2. /api/card/generate 호출 → PNG 카드 이미지 생성
 *   3. Band API → 이미지 업로드 → 게시글 작성
 *
 * cron-job.org 설정:
 *   URL: https://www.waiterzone.kr/api/cron/band-post?secret=CRON_SECRET값
 *   주기: 6시간마다 (하루 4회)
 *
 * 필요 환경변수:
 *   BAND_CLIENT_ID, BAND_CLIENT_SECRET, BAND_REFRESH_TOKEN, BAND_KEY
 *   CRON_SECRET — 크론 인증키
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireCron } from '@/lib/requireCron';
import { isBandConfigured, postCardToBand } from '@/lib/bandClient';

export const dynamic = 'force-dynamic';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
);

// 지역별 해시태그 (롱테일 SEO)
function buildHashtags(region: string, workType: string): string {
    const regionClean = region.replace(/[\[\]]/g, '').trim();
    const regionShort = regionClean.split(/[-\s]/)[1] || regionClean.split(/[-\s]/)[0] || '';
    const tags = [
        `#${regionShort}알바`,
        `#${regionShort}${workType}알바`,
        `#${workType}알바`,
        `#웨이터알바`,
        `#남성유흥알바`,
        `#고수입알바`,
        `#웨이터존`,
    ].filter(t => t.replace(/#/g, '').length > 2);
    return [...new Set(tags)].slice(0, 7).join(' ');
}

// 밴드 게시글 본문 생성
function buildBandContent(shop: {
    name?: string;
    nickname?: string;
    title?: string;
    region?: string;
    category?: string;
    pay?: string;
    pay_type?: string;
    id: number;
}): string {
    const shopName  = shop.nickname || shop.name || '업체';
    const region    = (shop.region || '').replace(/[\[\]]/g, '').trim();
    const workType  = shop.category || '알바';
    const payStr    = shop.pay && shop.pay !== '면접후결정'
        ? `${shop.pay_type ?? ''} ${Number(String(shop.pay).replace(/[^0-9]/g, '')).toLocaleString()}원+α`
        : '면접 후 결정';
    const url = `https://www.waiterzone.kr/coco/${encodeURIComponent(region)}/${shop.id}`;
    const hashtags = buildHashtags(region, workType);

    return [
        `📢 ${shopName} 신규 구인 공고`,
        ``,
        `📍 지역: ${region}`,
        `💼 업종: ${workType}`,
        `💰 급여: ${payStr}`,
        shop.title ? `📋 ${shop.title}` : '',
        ``,
        `👉 상세 공고 보기`,
        url,
        ``,
        hashtags,
        ``,
        `─────────────────`,
        `🍫 웨이터존 | 여성 유흥 구인구직 전문`,
        `www.waiterzone.kr`,
    ].filter(l => l !== null && l !== undefined).join('\n');
}

export async function GET(request: NextRequest) {
    // 크론 인증
    const authError = requireCron(request);
    if (authError) return authError;

    // Band 설정 확인
    if (!isBandConfigured()) {
        return NextResponse.json({
            ok:      false,
            message: 'Band API 환경변수 미설정',
            required: ['BAND_CLIENT_ID', 'BAND_CLIENT_SECRET', 'BAND_REFRESH_TOKEN', 'BAND_KEY'],
        }, { status: 503 });
    }

    // 1. 최근 24시간 내 active 공고 조회
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: shops, error } = await supabaseAdmin
        .from('shops')
        .select('id, name, nickname, title, region, category, pay, pay_type')
        .eq('status', 'active')
        .gte('approved_at', since)
        .order('approved_at', { ascending: false })
        .limit(10);

    if (error) {
        return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    // 최근 공고 없으면 전체에서 랜덤 선택 (폴백)
    let shop = shops && shops.length > 0
        ? shops[Math.floor(Math.random() * shops.length)]
        : null;

    if (!shop) {
        const { data: fallbackShops } = await supabaseAdmin
            .from('shops')
            .select('id, name, nickname, title, region, category, pay, pay_type')
            .eq('status', 'active')
            .order('approved_at', { ascending: false })
            .limit(20);

        if (!fallbackShops || fallbackShops.length === 0) {
            return NextResponse.json({ ok: false, message: '게시할 공고가 없습니다.' });
        }
        shop = fallbackShops[Math.floor(Math.random() * fallbackShops.length)];
    }

    // 2. 광고 카드 이미지 생성 (/api/card/generate 호출)
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.waiterzone.kr';
    const cardUrl = `${baseUrl}/api/card/generate?shopId=${shop.id}&template=A&bg=navy`;

    let imageBuffer: Buffer;
    try {
        const imgRes = await fetch(cardUrl);
        if (!imgRes.ok) throw new Error(`카드 생성 실패: ${imgRes.status}`);
        const arrayBuf = await imgRes.arrayBuffer();
        imageBuffer = Buffer.from(arrayBuf);
        if (imageBuffer.length < 1000) throw new Error('카드 이미지 0 bytes');
    } catch (imgErr: any) {
        console.error('[Cron/band-post] 카드 생성 오류:', imgErr.message);
        return NextResponse.json({ ok: false, error: `카드 생성 실패: ${imgErr.message}` }, { status: 500 });
    }

    // 3. 게시글 본문 생성
    const content = buildBandContent(shop);

    // 4. 밴드에 이미지 + 게시글 발행
    try {
        const region   = (shop.region || '').replace(/[\[\]]/g, '').trim();
        const filename = `${region}-${shop.nickname || shop.name || 'waiterzone'}-구인공고.png`
            .replace(/\s+/g, '-').replace(/[^\w가-힣.-]/g, '');

        const result = await postCardToBand(imageBuffer, content, filename);

        console.log(`[Cron/band-post] ✅ 게시 완료: ${result.url}`);

        return NextResponse.json({
            ok:        true,
            shopId:    shop.id,
            shopName:  shop.nickname || shop.name,
            postKey:   result.post_key,
            postUrl:   result.url,
            postedAt:  new Date().toISOString(),
        });

    } catch (bandErr: any) {
        console.error('[Cron/band-post] Band API 오류:', bandErr.message);

        // 실패해도 200 반환 (cron-job.org 실패 처리 방지)
        return NextResponse.json({
            ok:      true,
            mode:    'failed',
            error:   bandErr.message,
            message: 'Band 게시 실패 — 토큰 갱신 또는 BAND_KEY 확인 필요',
        });
    }
}
