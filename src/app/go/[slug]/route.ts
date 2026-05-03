/**
 * [단축 URL 리디렉터] /go/[slug]
 *
 * X(트위터) 등 SNS에서 한글 URL 인식 불가 문제 해결을 위한
 * 영문 단축 슬러그 → 한글 경로 리디렉트 시스템
 *
 * 사용법: waiterzone.kr/go/gangnam-room → /waiter/서울-강남구/룸웨이터
 */

import { NextRequest, NextResponse } from 'next/server';

// ─── 슬러그 → 경로 매핑 테이블 ─────────────────────────────────────────────────

const SLUG_MAP: Record<string, string> = {

    // ── 서울 ──────────────────────────────────────────────────────────────────
    'gangnam-room':     '/waiter/서울-강남구/룸웨이터',
    'gangnam-ten':      '/waiter/서울-강남구/텐프로',
    'gangnam-tencafe':  '/waiter/서울-강남구/텐카페',
    'gangnam-bar':      '/waiter/서울-강남구/바알바',
    'gangnam-jjumoh':   '/waiter/서울-강남구/쩜오알바',

    'hongdae-room':     '/waiter/서울-마포구/룸웨이터',
    'hongdae-ten':      '/waiter/서울-마포구/텐프로',
    'hongdae-bar':      '/waiter/서울-마포구/바알바',

    'yeongdeungpo-room': '/waiter/서울-영등포구/룸웨이터',
    'yeongdeungpo-ten':  '/waiter/서울-영등포구/텐프로',

    'seoul-room':       '/waiter/서울/룸웨이터',
    'seoul-ten':        '/waiter/서울/텐프로',
    'seoul-bar':        '/waiter/서울/바알바',
    'seoul-tencafe':    '/waiter/서울/텐카페',
    'seoul-massage':    '/waiter/서울/마사지',

    // ── 경기 ──────────────────────────────────────────────────────────────────
    'suwon-room':       '/waiter/경기-수원시/룸웨이터',
    'suwon-ten':        '/waiter/경기-수원시/텐프로',
    'suwon-bar':        '/waiter/경기-수원시/바알바',
    'suwon-tencafe':    '/waiter/경기-수원시/텐카페',

    'bundang-room':     '/waiter/경기-성남시/룸웨이터',
    'bundang-ten':      '/waiter/경기-성남시/텐프로',
    'bundang-bar':      '/waiter/경기-성남시/바알바',

    'bucheon-room':     '/waiter/경기-부천시/룸웨이터',
    'bucheon-ten':      '/waiter/경기-부천시/텐프로',

    'gyeonggi-room':    '/waiter/경기/룸웨이터',
    'gyeonggi-ten':     '/waiter/경기/텐프로',
    'gyeonggi-bar':     '/waiter/경기/바알바',

    // ── 인천 ──────────────────────────────────────────────────────────────────
    'incheon-room':     '/waiter/인천/룸웨이터',
    'incheon-ten':      '/waiter/인천/텐프로',
    'incheon-bar':      '/waiter/인천/바알바',

    // ── 부산 ──────────────────────────────────────────────────────────────────
    'busan-room':       '/waiter/부산/룸웨이터',
    'busan-ten':        '/waiter/부산/텐프로',
    'busan-bar':        '/waiter/부산/바알바',
    'busan-tencafe':    '/waiter/부산/텐카페',

    'seomyeon-room':    '/waiter/부산-부산진구/룸웨이터',
    'seomyeon-ten':     '/waiter/부산-부산진구/텐프로',
    'seomyeon-bar':     '/waiter/부산-부산진구/바알바',

    'haeundae-room':    '/waiter/부산-해운대구/룸웨이터',
    'haeundae-ten':     '/waiter/부산-해운대구/텐프로',

    // ── 대전 ──────────────────────────────────────────────────────────────────
    'daejeon-room':     '/waiter/대전/룸웨이터',
    'daejeon-ten':      '/waiter/대전/텐프로',
    'daejeon-bar':      '/waiter/대전/바알바',

    'yuseong-room':     '/waiter/대전-유성구/룸웨이터',
    'yuseong-ten':      '/waiter/대전-유성구/텐프로',
    'yuseong-bar':      '/waiter/대전-유성구/바알바',
    'yuseong-jjumoh':   '/waiter/대전-유성구/쩜오알바',

    // ── 대구 ──────────────────────────────────────────────────────────────────
    'daegu-room':       '/waiter/대구/룸웨이터',
    'daegu-ten':        '/waiter/대구/텐프로',
    'daegu-bar':        '/waiter/대구/바알바',

    'suseong-room':     '/waiter/대구-수성구/룸웨이터',
    'suseong-ten':      '/waiter/대구-수성구/텐프로',

    // ── 광주 ──────────────────────────────────────────────────────────────────
    'gwangju-room':     '/waiter/광주/룸웨이터',
    'gwangju-ten':      '/waiter/광주/텐프로',
    'gwangju-bar':      '/waiter/광주/바알바',

    'sangmu-room':      '/waiter/광주-서구/룸웨이터',
    'sangmu-ten':       '/waiter/광주-서구/텐프로',
    'sangmu-bar':       '/waiter/광주-서구/바알바',

    // ── 울산 ──────────────────────────────────────────────────────────────────
    'ulsan-room':       '/waiter/울산/룸웨이터',
    'ulsan-ten':        '/waiter/울산/텐프로',
    'ulsan-bar':        '/waiter/울산/바알바',

    // ── 충청 ──────────────────────────────────────────────────────────────────
    'cheonan-room':     '/waiter/충남-천안시/룸웨이터',
    'cheonan-ten':      '/waiter/충남-천안시/텐프로',
    'cheonan-bar':      '/waiter/충남-천안시/바알바',

    'cheongju-room':    '/waiter/충북-청주시/룸웨이터',
    'cheongju-ten':     '/waiter/충북-청주시/텐프로',

    // ── 전라 ──────────────────────────────────────────────────────────────────
    'jeonju-room':      '/waiter/전북-전주시/룸웨이터',
    'jeonju-ten':       '/waiter/전북-전주시/텐프로',
    'jeonju-bar':       '/waiter/전북-전주시/바알바',

    // ── 전국 / 공통 ────────────────────────────────────────────────────────────
    'room':             '/waiter/서울/룸웨이터',
    'ten':              '/waiter/서울/텐프로',
    'bar':              '/waiter/서울/바알바',
    'tencafe':          '/waiter/서울/텐카페',
    'massage':          '/waiter/서울/마사지',
    'jjumoh':           '/waiter/서울/쩜오알바',
    'karaoke':          '/waiter/서울/노래주점',
};

// ─── 리디렉터 ────────────────────────────────────────────────────────────────

export const dynamic = 'force-dynamic';

export async function GET(
    _req: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    const { slug: rawSlug } = await params;
    const slug = rawSlug?.toLowerCase().trim();
    const target = SLUG_MAP[slug];

    if (!target) {
        // 매핑 없으면 메인 페이지로
        return NextResponse.redirect(new URL('/', 'https://www.waiterzone.kr'), 302);
    }

    return NextResponse.redirect(
        new URL(target, 'https://www.waiterzone.kr'),
        { status: 301 } // 영구 리디렉트 (SEO 주스 전달)
    );
}
