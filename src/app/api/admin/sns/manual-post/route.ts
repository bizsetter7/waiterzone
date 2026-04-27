/**
 * [Admin API] /api/admin/sns/manual-post
 * 관리자 수동 트윗 발행
 *
 * POST { text } → Twitter에 즉시 게시
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/requireAdmin';
import { postTweet, isTwitterConfigured, isTweetValid, getTweetLength } from '@/lib/twitterClient';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    const authError = await requireAdmin(request);
    if (authError) return authError;

    if (!isTwitterConfigured()) {
        return NextResponse.json({
            ok: false,
            error: 'Twitter API 환경변수가 설정되지 않았습니다.',
            required: ['TWITTER_API_KEY', 'TWITTER_API_SECRET', 'TWITTER_ACCESS_TOKEN', 'TWITTER_ACCESS_SECRET'],
        }, { status: 503 });
    }

    const { text } = await request.json();

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
        return NextResponse.json({ ok: false, error: '트윗 텍스트가 필요합니다.' }, { status: 400 });
    }

    const trimmed = text.trim();

    if (!isTweetValid(trimmed)) {
        return NextResponse.json({
            ok:        false,
            error:     `트윗이 280자를 초과합니다. (현재 ${getTweetLength(trimmed)}자)`,
            charCount: getTweetLength(trimmed),
        }, { status: 400 });
    }

    try {
        const result = await postTweet(trimmed);
        return NextResponse.json({
            ok:        true,
            tweetId:   result.id,
            tweetText: result.text,
            postedAt:  new Date().toISOString(),
        });
    } catch (error: any) {
        console.error('[SNS/manual-post]', error);
        return NextResponse.json({
            ok:    false,
            error: error.message ?? '트윗 발행 실패',
        }, { status: 500 });
    }
}
