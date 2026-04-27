'use client';

import React from 'react';
import { Megaphone, CheckCircle2, Building2, Send, Phone, MessageSquareReply } from 'lucide-react';

export const EventOpenNoticeDetail = () => {
    return (
        <div className="flex flex-col items-center py-6 md:py-10 px-1 md:px-0 max-w-4xl mx-auto space-y-8 md:space-y-10">
            {/* Header Section */}
            <div className="text-center space-y-3">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#f82b60]/10 text-[#f82b60] font-black text-xs md:text-sm mb-2">
                    <Megaphone size={16} /> 오픈기념 상생지원 이벤트
                </div>
                <h4 className="text-[22px] md:text-4xl font-black text-gray-900 tracking-tighter break-keep leading-tight">
                    사장님 주목! 🙌<br />
                    웨이터존가<br className="md:hidden" /> <span className="text-[#f82b60]">통큰 혜택</span>을 쏩니다!
                </h4>
            </div>

            {/* Event Benefit Cards */}
            <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <div className="bg-white border-2 border-gray-100 rounded-[30px] p-6 md:p-10 shadow-sm hover:shadow-md transition-shadow">
                    <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center text-[#f82b60] mb-4">
                        <CheckCircle2 size={24} />
                    </div>
                    <p className="text-[#f82b60] font-black text-[11px] uppercase tracking-widest mb-1">Benefit 01</p>
                    <h5 className="text-xl font-black text-gray-900 mb-2">지역별 선착순 10곳</h5>
                    <p className="text-[13px] md:text-[14px] font-bold text-gray-500 leading-relaxed break-keep">
                        각 지역별로 가장 먼저 등록하시는<br className="hidden md:block" />
                        <span className="text-gray-900 font-black md:whitespace-nowrap">사장님 10분께 베이직 광고 무료 게시 혜택!</span>
                    </p>
                </div>

                <div className="bg-white border-2 border-gray-100 rounded-[30px] p-6 md:p-10 shadow-sm hover:shadow-md transition-shadow">
                    <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center text-[#f82b60] mb-4">
                        <Megaphone size={24} />
                    </div>
                    <p className="text-[#f82b60] font-black text-[11px] uppercase tracking-widest mb-1">Benefit 02</p>
                    <h5 className="text-xl font-black text-gray-900 mb-2">모든 광고 1+1 혜택</h5>
                    <p className="text-[13px] md:text-[14px] font-bold text-gray-500 leading-relaxed break-keep">
                        <span className="md:whitespace-nowrap">등급에 상관없이 모든 유료 광고 등록 시</span><br className="hidden md:block" />
                        <span className="text-gray-900 font-black md:whitespace-nowrap">추가 1개월(1+1)을 더 지원해 드립니다.</span>
                    </p>
                </div>
            </div>

            {/* Verification Guide Box */}
            <div className="w-full bg-slate-50 border border-slate-100 rounded-[32px] p-6 md:p-8 space-y-4">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-slate-400 shadow-sm">
                        <Building2 size={18} />
                    </div>
                    <h6 className="font-black text-gray-900">이용안내 및 주의사항</h6>
                </div>
                <ul className="space-y-2.5">
                    <li className="flex items-start gap-2 text-[13px] md:text-sm font-bold text-gray-600 leading-relaxed break-keep">
                        <span className="text-[#f82b60] shrink-0 mt-1">※</span>
                        <span>본 이벤트는 회원가입 후 <b>'사업자인증'</b>이 완료된 업체회원만 참여 가능합니다.</span>
                    </li>
                    <li className="flex items-start gap-2 text-[13px] md:text-sm font-bold text-gray-600 leading-relaxed break-keep">
                        <span className="text-[#f82b60] shrink-0 mt-1">※</span>
                        <span>마이샵 {'>'} 회원정보관리 페이지 하단에서 간편하게 사업자 인증을 진행하실 수 있습니다.</span>
                    </li>
                    <li className="flex items-start gap-2 text-[12px] md:text-xs text-gray-400 font-medium leading-relaxed break-keep">
                        <span className="shrink-0 mt-1">※</span>
                        <span>모든 이벤트는 한시적으로 진행되며, 서비스 상황에 따라 예고 없이 연장 또는 조기 종료될 수 있습니다.</span>
                    </li>
                </ul>
            </div>

            {/* Partner Message & Contact */}
            <div className="w-full text-center space-y-6">
                <div className="py-4 border-y border-gray-100">
                    <p className="text-lg md:text-xl font-black text-gray-800 break-keep leading-snug">
                        "웨이터존가 회원분들의 든든한 파트너가 되겠습니다."
                    </p>
                </div>

                <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8">
                    <div className="flex items-center gap-2 text-gray-500 font-bold">
                        <Phone size={18} className="text-[#f82b60]" />
                        <span>고객센터: <span className="text-gray-900 font-black">1877-1442</span></span>
                    </div>
                    <a 
                        href="https://t.me/waiterzone_cs_bot" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-gray-500 font-bold hover:text-blue-500 transition-colors group"
                    >
                        <Send size={18} className="text-blue-400 group-hover:scale-110 transition-transform" />
                        <span>텔레그램: <span className="text-gray-900 font-black decoration-blue-200 underline underline-offset-4 group-hover:text-blue-500">@waiterzone_cs_bot</span></span>
                    </a>
                </div>

                {/* Highlighted Pink Box */}
                <div className="w-full bg-[#f82b60] text-white p-5 md:p-6 rounded-[24px] shadow-lg shadow-rose-100 animate-in fade-in zoom-in duration-500">
                    <div className="flex flex-col items-center gap-2">
                        <div className="bg-white/20 p-2 rounded-full mb-1">
                            <MessageSquareReply size={20} />
                        </div>
                        <p className="text-sm md:text-base font-black tracking-tight leading-relaxed break-keep max-w-[260px] md:max-w-none">
                            텔레그램 친구 추가 시 다양한 전용 이벤트를<br className="hidden md:block" /> 실시간으로 안내받을 수 있습니다.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
