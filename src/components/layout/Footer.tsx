'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ReportAdModal } from '@/components/common/ReportAdModal';

const THEME_BLUE = '#1e3a5f';

// ── 최저임금: 매년 1월 아래 두 값만 수정 ──────────────────
const MIN_WAGE_YEAR = 2026;
const MIN_WAGE_AMOUNT = '10,320';
// ────────────────────────────────────────────────────────────

const NAV_LINKS = [
    { label: '광고등록안내', href: '/customer-center?tab=ad' },
    { label: '광고/제휴문의', href: '/customer-center?tab=inquiry' },
    { label: '이용약관', href: '/customer-center?tab=policy' },
    { label: '개인정보처리방침', href: '/customer-center?tab=policy' },
    { label: '청소년보호정책', href: '/customer-center?tab=policy' },
    { label: '커뮤니티', href: '/community' },
] as const;

const POPULAR_REGIONS = [
    { label: '강남 알바', href: '/coco/서울-강남구' },
    { label: '논현동 알바', href: '/coco/서울-강남구-논현동' },
    { label: '여의도 알바', href: '/coco/서울-영등포구-여의도동' },
    { label: '수원 인계동 야간알바', href: '/coco/경기-수원시-인계동' },
    { label: '부천 상동 알바', href: '/coco/경기-부천시-상동' },
    { label: '부산 서면 알바', href: '/coco/부산-부산진구' },
    { label: '해운대 알바', href: '/coco/부산-해운대구' },
    { label: '인천 계양구 알바', href: '/coco/인천-계양구' },
    { label: '대전 유성 알바', href: '/coco/대전-유성구' },
    { label: '대구 수성구 알바', href: '/coco/대구-수성구' },
    { label: '광주 상무지구 알바', href: '/coco/광주-서구' },
];

export const Footer = () => {
    const [reportOpen, setReportOpen] = useState(false);

    return (
        <>
            <footer className="border-t border-gray-200 bg-gray-50 font-sans text-gray-500">
                <div className="w-full max-w-5xl mx-auto px-6">

                    {/* ── 지역 알바 정보 (중앙 정렬 수복) ─────────────────────── */}
                    <div className="py-10 border-b border-gray-200">
                        <div className="flex flex-col items-center text-center gap-6">
                            <span className="text-[14px] md:text-[16px] font-black text-gray-900 tracking-tight">전국지역 알바정보</span>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-x-8 gap-y-3.5 max-w-4xl mx-auto">
                                {POPULAR_REGIONS.map((region) => (
                                    <Link
                                        key={region.href}
                                        href={region.href}
                                        className="text-[11.5px] md:text-[12.5px] text-gray-500 hover:text-[#1e3a5f] hover:font-bold transition-all whitespace-nowrap"
                                    >
                                        {region.label}
                                    </Link>
                                ))}
                                <Link
                                    href="/region/all"
                                    className="text-[11.5px] md:text-[12.5px] font-black text-[#1e3a5f] hover:underline flex items-center justify-center"
                                >
                                    더보기 +
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* ── PC: LADYALBA 스타일 4열 (고객센터 및 무통장) ─────────────────────── */}
                    <div className="hidden md:flex items-start justify-between gap-0 py-10 border-b border-gray-200">

                        <div className="shrink-0 pr-6 border-r border-gray-200">
                            <p className="text-xs font-black mb-2" style={{ color: THEME_BLUE }}>고객센터</p>
                            <p className="text-[2.8rem] font-black text-gray-900 tracking-tight leading-none">
                                1877-1442
                            </p>
                        </div>

                        <div className="shrink-0 px-6 text-xs space-y-2.5 self-start pt-0.5">
                            <p>
                                <span className="font-black mr-2" style={{ color: THEME_BLUE }}>평일</span>
                                10:00 ~ 18:00 (주말·공휴일 휴무)
                            </p>
                            <p>
                                <span className="font-black mr-2" style={{ color: THEME_BLUE }}>점심</span>
                                12:00 ~ 13:00
                            </p>
                            <p>
                                <span className="font-black mr-2">E-mail</span>
                                <a href="mailto:bizsetter7@gmail.com" className="hover:underline">
                                    bizsetter7@gmail.com
                                </a>
                            </p>
                        </div>

                        {/* 3열: 최저임금 */}
                        <div className="shrink-0 px-6 border-l border-gray-200 text-xs space-y-1">
                            <p className="font-black mb-2" style={{ color: THEME_BLUE }}>
                                {MIN_WAGE_YEAR}년 최저임금
                            </p>
                            <div className="flex items-baseline gap-2">
                                <span className="text-2xl font-black text-gray-900">
                                    {MIN_WAGE_AMOUNT}원
                                </span>
                                <a
                                    href="https://www.minimumwage.go.kr"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="font-bold hover:underline text-xs"
                                    style={{ color: THEME_BLUE }}
                                >
                                    더보기 &gt;
                                </a>
                            </div>
                            <a
                                href="https://www.moel.go.kr/info/defaulter/defaulterList.do"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-bold hover:underline block"
                                style={{ color: THEME_BLUE }}
                            >
                                임금체불사업주 명단 확인하기 &gt;
                            </a>
                        </div>

                        {/* 4열: 무통장입금 */}
                        <div className="shrink-0 pl-6 border-l border-gray-200">
                            <p className="text-sm font-black mb-1.5 whitespace-nowrap" style={{ color: THEME_BLUE }}>무통장입금안내</p>
                            <p className="text-lg font-black text-gray-900 tracking-tight leading-snug whitespace-nowrap">토스&nbsp;&nbsp;1002-4683-1712</p>
                            <p className="text-sm text-gray-400 mt-1 whitespace-nowrap">예금주 : 고남우(초코아이디어)</p>
                        </div>

                    </div>

                    {/* ── 모바일: 2열 (고객센터 | 무통장입금) ─────────────────────── */}
                    <div className="md:hidden my-4 -mx-5">
                        <div className="flex border-y border-gray-100 bg-white">
                            {/* 좌측: 고객센터 */}
                            <div className="w-1/2 py-[25px] px-3 border-r border-gray-100 flex justify-center bg-white">
                                <div className="flex flex-col items-start w-fit">
                                    <p className="text-[11px] text-gray-900 font-bold mb-1 ml-[1px]">고객지원센터</p>
                                    <p className="font-[900] leading-none whitespace-nowrap mb-2.5" style={{ color: THEME_BLUE, fontSize: '1.82rem', letterSpacing: '-0.09em' }}>
                                        1877-1442
                                    </p>
                                    <div className="text-[10.2px] text-gray-500 leading-tight font-medium tracking-tight whitespace-nowrap ml-[1px]">
                                        <p>평일 10:00-18:00 (점심 12:00-13:00)</p>
                                        <p>주말/공휴일은 휴무</p>
                                    </div>
                                </div>
                            </div>
                            {/* 우측: 무통장입금 */}
                            <div className="w-1/2 py-[25px] px-3 flex justify-center bg-white">
                                <div className="flex flex-col items-start w-fit">
                                    <p className="text-[11px] text-gray-900 font-bold mb-1 ml-[1px]">무통장 입금안내</p>
                                    <p className="text-[10px] text-gray-400 font-medium leading-none mb-1 ml-[1px]">토스뱅크</p>
                                    <p className="font-[900] text-gray-900 leading-none tracking-tight mb-2.5 whitespace-nowrap" style={{ fontSize: '1.2rem', letterSpacing: '-0.02em' }}>
                                        1002-4683-1712
                                    </p>
                                    <p className="text-[10.2px] text-gray-500 leading-tight font-medium tracking-tight ml-[1px]">
                                        예금주 : 고남우(초코아이디어)
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── 네비 링크 (PC) ──────────────────────────────────── */}
                    <div className="hidden md:flex flex-wrap justify-between items-center gap-x-0 gap-y-1.5 py-4 border-b border-gray-200 text-sm font-medium">
                        {NAV_LINKS.map(({ label, href }) => (
                            <React.Fragment key={label}>
                                <Link
                                    href={href}
                                    className="hover:text-gray-900 transition-colors whitespace-nowrap"
                                    style={label === '개인정보처리방침' ? { fontWeight: 700, color: '#374151' } : {}}
                                >
                                    {label}
                                </Link>
                                <span className="text-gray-300 select-none">|</span>
                            </React.Fragment>
                        ))}
                        <button
                            onClick={() => window.dispatchEvent(new CustomEvent('open-note-modal', { detail: { receiver: 'admin' } }))}
                            className="hover:text-gray-900 transition-colors whitespace-nowrap"
                        >
                            관리자쪽지
                        </button>
                    </div>

                    {/* ── 네비 링크 (모바일) — 3개만 표시 ─────────────────── */}
                    <div className="md:hidden flex justify-center items-center gap-x-3 py-3 border-b border-gray-200 text-[11px] font-medium">
                        <Link href="/customer-center?tab=policy" className="hover:text-gray-900 transition-colors whitespace-nowrap font-bold text-gray-700">
                            개인정보처리방침
                        </Link>
                        <span className="text-gray-300 select-none">|</span>
                        <Link href="/customer-center?tab=policy" className="hover:text-gray-900 transition-colors whitespace-nowrap">
                            이용약관
                        </Link>
                        <span className="text-gray-300 select-none">|</span>
                        <Link href="/customer-center?tab=policy" className="hover:text-gray-900 transition-colors whitespace-nowrap">
                            청소년보호정책
                        </Link>
                    </div>


                    {/* ── 사업자 정보 (PC) ─────────────────────────────────── */}
                    <div className="hidden md:flex py-5 items-start gap-6">
                        {/* 3가지 링크 (좌측 컬럼) */}
                        <div className="shrink-0 border-r border-gray-200 pr-6 text-[11px] text-gray-500 min-w-[110px]">
                            <button
                                onClick={() => setReportOpen(true)}
                                className="flex items-center justify-between w-full h-6 hover:text-gray-900 font-medium transition-colors text-left"
                            >
                                <span>허위광고 신고</span>
                                <span className="ml-2 text-gray-400">&gt;</span>
                            </button>
                            <Link
                                href="/notice/job-scam"
                                className="flex items-center justify-between w-full h-6 hover:text-gray-900 font-medium transition-colors"
                            >
                                <span>취업사기 주의</span>
                                <span className="ml-2 text-gray-400">&gt;</span>
                            </Link>
                            <a
                                href="https://www.moel.go.kr/info/defaulter/list.do"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-between w-full h-6 hover:text-gray-900 font-medium transition-colors"
                            >
                                <span>체불사업자 명단</span>
                                <span className="ml-2 text-gray-400">&gt;</span>
                            </a>
                        </div>
                        {/* 사업자 정보 텍스트 */}
                        <div className="text-[11px] text-gray-400">
                            <p className="h-6 flex items-center">주소: 경기도 평택시 지산로12번길 93, 2층(지산동)&nbsp;&nbsp;|&nbsp;&nbsp;초코아이디어</p>
                            <p className="h-6 flex items-center">
                                사업자등록번호: 226-13-91078&nbsp;&nbsp;|&nbsp;&nbsp;
                                통신판매업신고번호 : 제 2017-경기송탄-0029호&nbsp;&nbsp;|&nbsp;&nbsp;
                                직업정보제공사업신고번호 : J1806020260001
                            </p>
                            <p className="h-6 flex items-center">
                                웨이터알바·룸웨이터·나이트웨이터·가라오케웨이터 구인정보 1위 플랫폼 웨이터존&nbsp;&nbsp;·&nbsp;&nbsp;COPYRIGHT (c) WAITERZONE. ALL RIGHTS RESERVED.
                            </p>
                        </div>
                    </div>

                    {/* ── 사업자 정보 (모바일) ─────────────────────────────── */}
                    <div className="md:hidden py-4 text-center text-[10.5px] text-gray-400 space-y-1 leading-[1.6]">
                        <p>경기도 평택시 지산로12번길 93, 2층(지산동)</p>
                        <p>사업자등록번호: 226-13-91078 | 초코아이디어</p>
                        <p>통신판매업신고번호 : 제 2017-경기송탄-0029호</p>
                        <p>직업정보제공사업신고번호 : J1806020260001</p>
                        <p>개인정보 및 이용관리 bizsetter7@gmail.com</p>
                        <p className="pt-2 text-gray-400/70 text-[9.5px]">웨이터알바·룸웨이터·나이트웨이터·가라오케웨이터 구인정보 1위 플랫폼 웨이터존</p>
                        <p className="text-gray-400/50 text-[9px]">COPYRIGHT (c) WAITERZONE. ALL RIGHTS RESERVED.</p>
                    </div>

                </div>
            </footer>

            {reportOpen && <ReportAdModal onClose={() => setReportOpen(false)} />}
        </>
    );
};
