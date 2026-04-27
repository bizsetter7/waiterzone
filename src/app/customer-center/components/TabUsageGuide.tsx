'use client';

import React from 'react';
import { useBrand } from '@/components/BrandProvider';
import { UserCheck, FileText, Search, MessageSquare, Briefcase } from 'lucide-react';

export const TabUsageGuide = () => {
    const brand = useBrand();

    return (
        <div className="space-y-12">
            <section>
                <div className="flex items-center gap-3 mb-8 bg-slate-50/10 dark:bg-white/5 p-2 rounded-xl md:bg-white/40 md:p-4 md:rounded-2xl md:border md:border-gray-100/50 md:dark:border-gray-800/50">
                    <div className="w-2 h-8 bg-[#f82b60] rounded-full"></div>
                    <h3 className={`text-2xl font-black uppercase tracking-tighter ${brand.theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>구직자 이용가이드</h3>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {[
                        { step: '01', title: '회원가입', icon: <UserCheck />, desc: 'SNS 연동 간편 가입' },
                        { step: '02', title: '이력서 등록', icon: <FileText />, desc: '자유 형식의 강점 어필' },
                        { step: '03', title: '업소 서칭', icon: <Search />, desc: '맞춤 필터링 시스템' },
                        { step: '04', title: '1:1 상담', icon: <MessageSquare />, desc: '안심 면접을 위한 소통' },
                    ].map((item, i) => (
                        <div key={i} className={`p-6 rounded-[30px] border text-center relative overflow-hidden group hover:shadow-xl transition-all ${brand.theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                            <span className={`absolute -top-3 -left-3 text-5xl font-black transition-colors pointer-events-none ${brand.theme === 'dark' ? 'text-gray-700' : 'text-gray-50'} group-hover:text-rose-50/50`}>{item.step}</span>
                            <div className="w-14 h-14 bg-rose-50 text-[#f82b60] rounded-2xl flex items-center justify-center mx-auto mb-5 relative z-10 shadow-inner">
                                {item.icon}
                            </div>
                            <h4 className={`font-black text-[15px] mb-1 relative z-10 ${brand.theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{item.title}</h4>
                            <p className={`text-[11px] relative z-10 font-bold ${brand.theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>{item.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            <section>
                <div className="flex items-center gap-3 mb-8 bg-slate-50/10 dark:bg-white/5 p-2 rounded-xl md:bg-white/40 md:p-4 md:rounded-2xl md:border md:border-gray-100/50 md:dark:border-gray-800/50">
                    <div className="w-2 h-8 bg-[#f82b60] rounded-full"></div>
                    <h3 className={`text-2xl font-black uppercase tracking-tighter ${brand.theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>구인자(사장님) 가이드</h3>
                </div>
                <div className={`p-8 md:p-10 rounded-[45px] border shadow-xl shadow-rose-100/10 space-y-10 ${brand.theme === 'dark' ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-100 text-gray-900'}`}>
                    <div className="flex flex-col md:flex-row items-center gap-8">
                        <div className="w-20 h-20 bg-rose-50 text-[#f82b60] rounded-[28px] flex items-center justify-center shrink-0 border border-rose-100">
                            <Briefcase size={36} />
                        </div>
                        <div className="text-center md:text-left flex flex-col items-center md:items-start">
                            <h4 className="text-xl md:text-2xl font-black mb-3 md:mb-2 tracking-tight text-gray-900 whitespace-nowrap">사장님, 안심하고 이용하세요!</h4>
                            <div className="text-[14px] md:text-[15px] text-gray-500 font-bold leading-relaxed flex flex-col items-center md:items-start">
                                <span className="whitespace-nowrap">철저한 사업자 인증을 통해 클린하고 신뢰할 수 있는</span>
                                <span className="whitespace-nowrap">구인 공고 문화를 만들어갑니다.</span>
                            </div>
                        </div>
                        <button className="w-full md:w-auto md:ml-auto px-8 py-4 bg-gray-900 text-white rounded-2xl text-[15px] font-black shadow-xl hover:bg-black transition">
                            사업자 인증하러 가기
                        </button>
                    </div>
                    <div className="h-px bg-gray-100 w-full" />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-10">
                        {[
                            { num: '1', title: '상품 선택', sub: '효율적인 광고 상품을 직접 픽업하세요.' },
                            { num: '2', title: '공고 등록', sub: '상세한 업소 정보는 채용 성공률을 높입니다.' },
                            { num: '3', title: '컨택 & 매칭', sub: '열람권을 통해 적합한 인재를 먼저 선점하세요.' }
                        ].map((box, i) => (
                            <div key={i} className={`flex items-start gap-4 md:gap-5 p-6 md:p-0 rounded-3xl border md:border-0 ${brand.theme === 'dark' ? 'bg-gray-700/50 border-gray-700' : 'bg-gray-50 md:bg-transparent border-gray-100'}`}>
                                <span className="text-4xl md:text-5xl font-black text-[#f82b60]/20 shrink-0 leading-none w-[36px] md:w-12 text-center">{box.num}</span>
                                <div className="flex flex-col items-start text-left pt-1 md:pt-2">
                                    <h5 className="font-black text-base md:text-lg text-gray-900 leading-none mb-2">{box.title}</h5>
                                    <p className="text-[12px] md:text-[13px] text-gray-500 font-bold leading-relaxed break-keep">
                                        {box.sub}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
};
