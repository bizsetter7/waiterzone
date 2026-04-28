'use client';

import React from 'react';
import { Zap, AlertTriangle, X, Info, Monitor, ArrowRight, UserCheck, Smartphone } from 'lucide-react';

export const ResumeNoticeDetail = () => {
    return (
        <div className="flex flex-col items-center py-6 md:py-10 px-1 md:px-0 max-w-4xl mx-auto space-y-10 md:space-y-12">
            {/* Main Header */}
            <div className="text-center space-y-2">
                <p className="text-gray-900 font-black text-xl md:text-2xl tracking-tighter">이력서 등록 시</p>
                <h4 className="text-4xl md:text-5xl font-black text-[#1e3a5f] tracking-tighter break-keep">구직자 주의사항!</h4>
            </div>

            {/* Warning Box */}
            <div className="w-full bg-[#1e3a5f] rounded-[30px] md:rounded-[40px] p-6 md:p-12 text-center text-white relative shadow-xl shadow-sm/50">
                <div className="absolute -top-8 md:-top-10 left-1/2 -translate-x-1/2 w-16 h-16 md:w-20 md:h-20 bg-white rounded-2xl md:rounded-3xl rotate-12 flex items-center justify-center shadow-lg border-4 border-[#1e3a5f]">
                    <div className="animate-pulse">
                        <Zap size={32} className="md:size-[40px] text-[#1e3a5f] fill-current" />
                    </div>
                </div>
                <div className="pt-6 space-y-4">
                    <h5 className="text-2xl md:text-3xl font-black leading-tight break-keep">
                        구직자분들의 피해 방지를 위해<br className="hidden md:block" />
                        이력서 등록 시 반드시 주의하세요.
                    </h5>
                    <div className="h-px bg-white/20 w-full"></div>
                    <div className="space-y-2 text-sm md:text-base font-bold text-blue-50 leading-relaxed opacity-90 break-keep">
                        <p>최근 불법 성매매 업소 및 보이스 피싱 등으로 인한<br className="hidden md:block" /> 피해 사례가 발생하고 있습니다.</p>
                        <p className="mt-4 pt-4 border-t border-white/10">회원님들의 피해 방지와 투명한 구인 활동을 위해<br className="hidden md:block" /> 주의 사항 및 대처 방법을 안내 드립니다.</p>
                    </div>
                </div>
            </div>

            {/* Subsection 1 */}
            <div className="w-full space-y-8">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-red-100 rounded-2xl flex items-center justify-center text-red-600">
                        <AlertTriangle size={24} />
                    </div>
                    <h6 className="text-xl md:text-2xl font-black text-gray-900 bg-red-50 px-6 py-3 rounded-full border border-red-100 shadow-sm">
                        면접 시 주의 사항 및 대처 방법
                    </h6>
                </div>

                <div className="text-center space-y-4 px-4 py-8 bg-slate-50 rounded-[40px] border-2 border-dashed border-slate-200">
                    <p className="text-lg md:text-xl font-black text-gray-900 break-keep">
                        구직자분들께서는 기업에서 먼저 연락이 올 시<br className="hidden md:block" />
                        <span className="text-[#1e3a5f] underline decoration-blue-200 underline-offset-4">진행중인 채용공고를 요청하시어</span><br className="hidden md:block" />
                        정보와 공고의 기업정보를 반드시 확인해 주세요.
                    </p>
                    <p className="text-sm font-bold text-gray-500 break-keep">대면과 유선 상담에 대해서는<br className="hidden md:block" /> 신중히 주의를 기울여 주시기 바랍니다.</p>
                </div>
            </div>

            {/* Number List */}
            <div className="w-full space-y-4">
                {[
                    "기업의 구체적인 정보를 알려주지 않고, 선물을 먼저 보내려고 하는 경우",
                    "상호명이 아닌 별도의 개인이나 연락처 등은 곳에서 면접을 보자고 하는 경우",
                    "통장, 원본, 인감 등 개인정보를 요구하는 경우 (보이스 피싱, 대출 등 사기 주의)",
                    "취업을 조건으로 보증금, 선입금 등 금전을 요구하는 경우",
                    "고수익 알바 미끼로 기만을 제의하는 경우 (보이스 피싱 및 성매매 등 불법 유입 주의)",
                    "그 외 채용공고의 내용과 다른 직무를 제안하거나 유도하는 경우"
                ].map((item, i) => (
                    <div key={i} className="group relative flex items-center bg-[#1e3a5f] text-white p-5 md:p-6 rounded-full shadow-md transition-transform hover:-translate-y-1">
                        <div className="w-10 h-10 md:w-12 md:h-12 bg-white text-[#1e3a5f] rounded-full flex items-center justify-center text-lg md:text-xl font-black shrink-0 shadow-sm">
                            {i + 1}
                        </div>
                        <p className="flex-1 ml-4 md:ml-6 text-sm md:text-[17px] font-black leading-tight break-keep">
                            {item}
                        </p>
                    </div>
                ))}
            </div>

            {/* Important Warning Boxes */}
            <div className="w-full space-y-4 md:space-y-6">
                <div className="bg-[#1e3a5f]/90 text-white p-6 md:p-8 rounded-[30px] md:rounded-[40px] flex items-start gap-4 md:gap-6 shadow-lg border-2 border-white/20">
                    <div className="w-10 h-10 md:w-12 md:h-12 bg-white rounded-xl md:rounded-2xl flex items-center justify-center text-[#1e3a5f] shrink-0 shadow-sm">
                        <X size={24} className="md:size-[32px]" />
                    </div>
                    <p className="text-[15px] md:text-lg font-black leading-normal pt-0.5 md:pt-1 break-keep">
                        통장, 체크카드, 계좌 비밀번호, 개인정보 요구는<br className="hidden md:block" />
                        취업을 빙자한 보이스 피싱 사기 행위일 수 있습니다.
                    </p>
                </div>

                <div className="bg-[#1e3a5f]/80 text-white p-6 md:p-8 rounded-[30px] md:rounded-[40px] flex items-start gap-4 md:gap-6 shadow-lg border-2 border-white/20">
                    <div className="w-10 h-10 md:w-12 md:h-12 bg-white rounded-xl md:rounded-2xl flex items-center justify-center text-[#1e3a5f] shrink-0 shadow-sm">
                        <Zap size={24} className="md:size-[32px]" />
                    </div>
                    <p className="text-[15px] md:text-lg font-black leading-normal pt-0.5 md:pt-1 break-keep">
                        고수익이 가능하다고 현혹하는 업체의 광고는<br className="hidden md:block" />
                        불법 성매매 광고일 가능성이 높으니 각별히 주의해 주세요.
                    </p>
                </div>
            </div>

            {/* Call Center Text */}
            <div className="w-full text-center space-y-2 py-6 border-y border-blue-50">
                <p className="text-[#1e3a5f] text-sm md:text-base font-black break-keep">
                    저희 웨이터존 브랜드 통합 시스템은 불법 행위 예방을 위해 최선을 다하고 있으며,<br className="hidden md:block" />
                    회원분들의 안전하고 건강한 구인활동을 위해 지속적인 상시모니터링을 진행하고 있습니다.
                </p>
            </div>

            {/* Guide Section */}
            <div className="w-full space-y-10">
                <h6 className="text-center text-2xl font-black text-gray-900">내 연락처 노출 설정 가이드</h6>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
                    {/* PC Guide */}
                    <div className="space-y-6 text-center">
                        <span className="inline-block px-4 py-1.5 bg-slate-900 text-white rounded-full text-xs font-black uppercase tracking-widest">Guide (PC버전)</span>
                        <div className="relative group overflow-hidden rounded-[30px] md:rounded-[40px] border-4 border-slate-100 shadow-xl bg-white p-8 md:p-10 space-y-6">
                            <div className="flex items-center justify-center gap-4">
                                <div className="w-12 h-12 md:w-16 md:h-16 rounded-xl md:rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover:text-[#1e3a5f] transition-colors">
                                    <Monitor size={28} className="md:size-[32px]" />
                                </div>
                                <ArrowRight size={20} className="text-slate-200 md:size-[24px]" />
                                <div className="w-12 h-12 md:w-16 md:h-16 rounded-xl md:rounded-2xl bg-[#1e3a5f] text-white flex items-center justify-center shadow-lg shadow-sm scale-110">
                                    <UserCheck size={28} className="md:size-[32px]" />
                                </div>
                            </div>
                            <div className="space-y-4">
                                <p className="text-[15px] md:text-base font-black text-gray-900 leading-snug">
                                    상단메뉴 {'>'} 마이페이지<br />
                                    {'>'} 연락처 노출 설정 OFF
                                </p>
                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                    <p className="text-[11px] md:text-xs font-bold text-gray-400 leading-relaxed">
                                        연락처를 비공개로 설정하면 제안 메시지로만<br />
                                        매칭이 이루어져 더욱 안전합니다.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Mobile Guide */}
                    <div className="space-y-6 text-center">
                        <span className="inline-block px-4 py-1.5 bg-[#1e3a5f] text-white rounded-full text-xs font-black uppercase tracking-widest">Guide (모바일버전)</span>
                        <div className="relative group overflow-hidden rounded-[30px] md:rounded-[40px] border-4 border-blue-50 shadow-xl bg-white p-8 md:p-10 space-y-6">
                            <div className="flex items-center justify-center gap-4">
                                <div className="w-12 h-12 md:w-16 md:h-16 rounded-xl md:rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-300 group-hover:text-[#1e3a5f] transition-colors">
                                    <Smartphone size={28} className="md:size-[32px]" />
                                </div>
                                <ArrowRight size={20} className="text-gray-200 md:size-[24px]" />
                                <div className="w-12 h-12 md:w-16 md:h-16 rounded-xl md:rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-lg shadow-slate-200 scale-110">
                                    <Info size={28} className="md:size-[32px]" />
                                </div>
                            </div>
                            <div className="space-y-4">
                                <p className="text-[15px] md:text-base font-black text-gray-900 leading-snug">
                                    하단 바 메뉴 {'>'} MY<br />
                                    {'>'} 개인정보 관리 {'>'} 수동 노출
                                </p>
                                <div className="p-4 bg-gray-50/50 rounded-2xl border border-blue-50">
                                    <p className="text-[11px] md:text-xs font-bold text-[#1e3a5f]/60 leading-relaxed">
                                        모바일에서도 간편하게 실시간으로<br />
                                        내 연락처 노출 여부를 제어하세요.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Info */}
            <div className="w-full bg-slate-900 rounded-[40px] md:rounded-[50px] p-8 md:p-14 text-white text-center space-y-10 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-10 opacity-10">
                    <Info size={150} className="hidden md:block" />
                </div>
                <div className="relative z-10 space-y-8">
                    <div className="space-y-2">
                        <p className="text-[10px] md:text-sm font-bold text-blue-400 tracking-widest uppercase">Safe Recruitment Policy</p>
                        <h5 className="text-xl md:text-3xl font-black leading-tight break-keep">
                            건강한 구인·구직 서비스,<br className="hidden md:block" />
                            우리가 함께 만들어 갑니다.
                        </h5>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-center">
                        <div className="p-5 md:p-6 bg-white/5 rounded-2xl md:rounded-3xl border border-white/10">
                            <h6 className="text-[#E14D2A] font-black mb-1 md:mb-2 text-base md:text-lg">기업 확인 필수</h6>
                            <p className="text-[12px] md:text-sm font-medium text-gray-400 leading-relaxed">기업정보 본인인증, 사업자 등록 여부 확인을 완료한 업체와의 구인을 권장합니다.</p>
                        </div>
                        <div className="p-5 md:p-6 bg-white/5 rounded-2xl md:rounded-3xl border border-white/10">
                            <h6 className="text-[#E14D2A] font-black mb-1 md:mb-2 text-base md:text-lg">피해 신고 안내</h6>
                            <p className="text-[12px] md:text-sm font-medium text-gray-400 leading-relaxed">피해 발생 시 즉시 고객센터에 제보주시면 확인 후 즉각적인 조치를 취하겠습니다.</p>
                        </div>
                    </div>
                    <p className="text-[11px] md:text-sm font-bold text-gray-400 leading-relaxed opacity-60 break-keep max-w-2xl mx-auto border-t border-white/5 pt-6 md:pt-8 line-clamp-2 md:line-clamp-none">
                        회원분들의 안전하고 투명한 구인 서비스를 위해<br className="hidden md:block" />
                        항상 최선의 노력을 다하겠습니다.
                    </p>
                </div>
            </div>

            {/* Call Center Info */}
            <div className="w-full pt-10 border-t border-blue-100 flex flex-col items-center gap-2">
                <p className="text-2xl md:text-4xl font-black text-gray-900 flex items-center gap-3">
                    고객센터 <span className="text-[#1e3a5f]">1877-1442</span>
                </p>
                <div className="text-center">
                    <p className="text-sm font-black text-[#1e3a5f] mb-1">고객센터 운영시간</p>
                    <p className="text-xs font-bold text-gray-500">(평일 10:00~18:00 / 점심시간 12:00~13:00)</p>
                    <p className="text-[10px] font-bold text-gray-400 mt-1">* 주말 및 공휴일은 고객센터 휴무입니다.</p>
                </div>
            </div>
        </div>
    );
};
