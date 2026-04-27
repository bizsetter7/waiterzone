'use client';

import React from 'react';
import { AlertTriangle, Phone } from 'lucide-react';

export const JobScamNoticeDetail = () => {
    const HOT_PINK = '#f82b60';
    return (
        <div className="flex flex-col py-6 md:py-10 max-w-4xl mx-auto space-y-8 font-sans">
            <div className="text-center space-y-3">
                <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: '#fff3cd', color: '#b45309' }}>
                    <AlertTriangle size={32} strokeWidth={1.5} />
                </div>
                <h4 className="text-2xl md:text-3xl font-black tracking-tighter text-gray-900 break-keep">
                    [필독] 취업사기 주의 — 피해 예방 가이드
                </h4>
            </div>
            <div className="bg-white rounded-3xl border border-gray-100 p-6 md:p-10 shadow-sm space-y-8 text-gray-700">
                <p className="leading-relaxed break-keep text-gray-600">
                    최근 국내외 취업사기가 급증함에 따라 피해사례가 속출하고 있습니다.<br className="hidden md:block" />
                    구직활동 시 꼭 아래 사항을 주의해주세요.
                </p>
                <section className="space-y-3">
                    <h5 className="font-black text-lg text-gray-900 flex items-center gap-2">
                        <span style={{ color: HOT_PINK }}>⚠</span>취업사기에 해당할 위험이 높은 구인광고
                    </h5>
                    <div className="bg-red-50 rounded-2xl p-5 border-l-4 border-red-400 space-y-2">
                        {['동종업계 대비 지나치게 좋은 조건 제시', '채용 전 신분증 사본 등 개인정보 요청', '취업사례금 등 각종 명목으로 금전을 요구'].map((item, i) => (
                            <p key={i} className="flex gap-2 text-sm text-red-800 font-medium">
                                <span className="shrink-0 font-black">{i + 1}.</span><span>{item}</span>
                            </p>
                        ))}
                    </div>
                </section>
                <section className="space-y-3">
                    <h5 className="font-black text-lg text-gray-900">📞 신고 및 상담 연락처</h5>
                    <div className="bg-gray-50 rounded-2xl p-5 space-y-4 md:space-y-3">
                        {[
                            { label: '취업사기', contact: '경찰청 (국번없이 112)' },
                            { label: '보이스피싱 피해', contact: '금융감독원 (국번없이 1332)' },
                            { label: '거짓구인광고 신고', contact: '고용노동부 (국번없이 1350)' },
                        ].map(({ label, contact }) => (
                            <div key={label} className="flex flex-col md:flex-row md:items-center gap-1 md:gap-3 text-sm">
                                <span className="font-black md:min-w-[110px]" style={{ color: HOT_PINK }}>{label}</span>
                                <span className="text-gray-600 font-bold md:font-medium">{contact}</span>
                            </div>
                        ))}
                    </div>
                </section>
                <section className="space-y-3">
                    <h5 className="font-black text-lg text-gray-900">🌐 온라인 신고 채널</h5>
                    <div className="space-y-3 md:space-y-2 text-[13.5px] md:text-sm text-gray-600">
                        <div className="flex flex-col md:flex-row md:items-center">
                            <span className="flex gap-2">
                                <span className="shrink-0">•</span>
                                <span>(온라인) 보이스피싱 지킴이</span>
                            </span>
                            <div className="ml-5 md:ml-1 flex items-center">
                                <span className="mr-1">:</span>
                                <a href="https://www.fss.or.kr" target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-900">www.fss.or.kr</a>
                            </div>
                        </div>

                        <div className="flex flex-col md:flex-row md:items-center">
                            <span className="flex gap-2">
                                <span className="shrink-0">•</span>
                                <span>(온라인) 거짓구인광고 신고</span>
                            </span>
                            <div className="ml-5 md:ml-1 flex items-center">
                                <span className="mr-1">:</span>
                                <a href="https://www.work24.go.kr" target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-900">www.work24.go.kr</a>
                            </div>
                        </div>

                        <div className="flex gap-2 break-keep">
                            <span className="shrink-0">•</span>
                            <span>
                                (모바일) 고용24 모바일 앱 &gt;<br className="md:hidden" />
                                기타민원 &gt; 거짓구인광고 신고
                            </span>
                        </div>
                    </div>
                </section>
            </div>
            <div className="py-6 px-6 rounded-[28px] flex flex-col items-center justify-center text-white shadow-xl shadow-rose-100" style={{ backgroundColor: HOT_PINK }}>
                <div className="flex items-center gap-2 mb-2">
                    <Phone size={22} fill="white" className="animate-pulse" />
                    <span className="text-xl md:text-2xl font-black">웨이터존 고객센터 1877-1442</span>
                </div>
                <p className="text-[10px] opacity-80 uppercase tracking-[0.2em] font-black">COPYRIGHT(C) 2026 WAITERZONE ALL RIGHTS RESERVED.</p>
            </div>
        </div>
    );
};
