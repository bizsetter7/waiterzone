'use client';

import React from 'react';
import { AlertTriangle, Phone, ChevronLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

const HOT_PINK = '#f82b60';

export default function JobScamNoticePage() {
    const router = useRouter();

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Header */}
            <div className="bg-white border-b sticky top-0 z-50">
                <div className="container mx-auto px-4 h-14 flex items-center gap-3">
                    <button onClick={() => router.back()} className="p-1 hover:bg-gray-100 rounded-full">
                        <ChevronLeft size={24} />
                    </button>
                    <h1 className="text-lg font-bold">공지사항</h1>
                </div>
            </div>

            {/* Content */}
            <div className="container mx-auto px-4 py-8 max-w-2xl">
                <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">

                    {/* Banner */}
                    <div className="p-8 pb-4 text-center">
                        <div
                            className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
                            style={{ backgroundColor: '#fff3cd', color: '#b45309' }}
                        >
                            <AlertTriangle size={40} strokeWidth={1.5} />
                        </div>
                        <h2 className="text-2xl md:text-3xl font-black tracking-tighter text-gray-900 mb-4 break-keep">
                            취업사기 주의
                        </h2>
                        <div className="inline-block px-4 py-1.5 rounded-full bg-red-50 text-red-600 text-sm font-bold mb-8">
                            필독 공지
                        </div>
                    </div>

                    {/* Body */}
                    <div className="px-8 pb-10 space-y-8 text-gray-700">

                        {/* 도입 */}
                        <p className="leading-relaxed break-keep text-gray-600">
                            최근 국내외 취업사기가 급증함에 따라 피해사례가 속출하고 있습니다.<br />
                            구직활동 시 꼭 아래 사항을 주의해주세요.
                        </p>

                        {/* 위험 구인광고 */}
                        <section className="space-y-3">
                            <h3 className="font-black text-lg text-gray-900 flex items-center gap-2">
                                <span style={{ color: HOT_PINK }}>⚠</span>
                                취업사기에 해당할 위험이 높은 구인광고
                            </h3>
                            <div className="bg-red-50 rounded-2xl p-5 border-l-4 border-red-400 space-y-2">
                                {[
                                    '동종업계 대비 지나치게 좋은 조건 제시',
                                    '채용 전 신분증 사본 등 개인정보 요청',
                                    '취업사례금 등 각종 명목으로 금전을 요구',
                                ].map((item, i) => (
                                    <p key={i} className="flex gap-2 text-sm text-red-800 font-medium">
                                        <span className="shrink-0 font-black">{i + 1}.</span>
                                        <span>{item}</span>
                                    </p>
                                ))}
                            </div>
                        </section>

                        {/* 신고 연락처 */}
                        <section className="space-y-3">
                            <h3 className="font-black text-lg text-gray-900">📞 신고 및 상담 연락처</h3>
                            <div className="bg-gray-50 rounded-2xl p-5 space-y-3">
                                {[
                                    { label: '취업사기', contact: '경찰청 (국번없이 112)' },
                                    { label: '보이스피싱 피해', contact: '금융감독원 (국번없이 1332)' },
                                    { label: '거짓구인광고 신고', contact: '고용노동부 (국번없이 1350)' },
                                ].map(({ label, contact }) => (
                                    <div key={label} className="flex items-center gap-3 text-sm">
                                        <span className="font-black text-gray-900 min-w-[110px]" style={{ color: HOT_PINK }}>{label}</span>
                                        <span className="text-gray-600">{contact}</span>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* 온라인 신고 */}
                        <section className="space-y-3">
                            <h3 className="font-black text-lg text-gray-900">🌐 온라인 신고 채널</h3>
                            <div className="space-y-2 text-sm text-gray-600">
                                <p className="flex gap-2">
                                    <span className="shrink-0">•</span>
                                    <span>(온라인) 보이스피싱 지킴이:&nbsp;
                                        <a href="https://www.fss.or.kr" target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-900">www.fss.or.kr</a>
                                    </span>
                                </p>
                                <p className="flex gap-2">
                                    <span className="shrink-0">•</span>
                                    <span>(온라인) 거짓구인광고 신고:&nbsp;
                                        <a href="https://www.work24.go.kr" target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-900">www.work24.go.kr</a>
                                    </span>
                                </p>
                                <p className="flex gap-2">
                                    <span className="shrink-0">•</span>
                                    <span>(모바일) 고용24 모바일 앱 &gt; 기타민원 &gt; 거짓구인광고 신고</span>
                                </p>
                            </div>
                        </section>

                        {/* 참고자료 */}
                        <section className="space-y-3">
                            <h3 className="font-black text-lg text-gray-900">🎬 참고자료</h3>
                            <a
                                href="https://www.youtube.com/watch?v=Bcq0JBvSnbU"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors"
                            >
                                <span className="text-2xl">▶</span>
                                <span className="text-sm font-medium text-gray-700 underline">취업사기 주의 영상 (고용노동부 유튜브)</span>
                            </a>
                        </section>
                    </div>

                    {/* Footer Bar */}
                    <div className="py-6 flex flex-col items-center justify-center text-white" style={{ backgroundColor: HOT_PINK }}>
                        <div className="flex items-center gap-2 mb-1">
                            <Phone size={20} fill="white" />
                            <span className="text-xl md:text-2xl font-black">웨이터존 고객센터 1877-1442</span>
                        </div>
                        <p className="text-[10px] opacity-70 uppercase tracking-widest font-bold">
                            Copyright(c) 2026 COCOALBA All Rights Reserved.
                        </p>
                    </div>
                </div>

                {/* 돌아가기 */}
                <button
                    onClick={() => router.push('/customer-center?tab=notice')}
                    className="w-full mt-8 py-4 rounded-2xl text-white font-bold transition-transform active:scale-95 shadow-lg"
                    style={{ backgroundColor: HOT_PINK }}
                >
                    공지사항 목록으로
                </button>
            </div>
        </div>
    );
}
