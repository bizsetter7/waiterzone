'use client';

import React from 'react';
import { useBrand } from '@/components/BrandProvider';
import { Megaphone, Zap, Search, ArrowRight, PhoneCall } from 'lucide-react';

interface TabHomeProps {
    onTabChange: (tabName: string) => void;
}

export const TabHome = ({ onTabChange }: TabHomeProps) => {
    const brand = useBrand();

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-5 duration-700">
            {/* Hero Section */}
            <div className="bg-slate-950 rounded-[32px] md:rounded-[50px] p-6 md:p-12 text-white overflow-hidden relative border border-slate-800 shadow-2xl">
                <div className="absolute top-0 right-0 w-96 h-96 bg-rose-600/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-rose-600/10 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/2" />

                <div className="relative z-10 max-w-2xl">

                    <h2 className="text-[28px] md:text-5xl font-black tracking-tighter mb-4 leading-[1.5] md:leading-[1.1]">
                        무엇을 <span className="text-[#f82b60] whitespace-nowrap">도와드릴까요?</span><br />
                        코코플러스가 해결해 드립니다.
                    </h2>
                    <p className="text-slate-400 text-base md:text-lg font-bold leading-relaxed mb-6 opacity-80">
                        광고 효과를 극대화하는 전략부터 안전한 채용을 위한 운영<br className="hidden md:block" />
                        정책까지, 모든 궁금증을 한곳에서 해결하세요.
                    </p>
                    <div className="grid grid-cols-2 gap-3 md:flex md:flex-wrap md:gap-4">
                        <button onClick={() => onTabChange('1:1 문의')} className="w-full md:w-auto px-4 md:px-8 py-4 bg-[#f82b60] rounded-2xl font-black text-[13px] md:text-[15px] hover:bg-[#db2456] transition-colors shadow-lg shadow-rose-900/20 whitespace-nowrap">
                            지금 문의하기
                        </button>
                        <button onClick={() => onTabChange('자주묻는질문')} className="w-full md:w-auto px-4 md:px-8 py-4 bg-slate-900 border border-slate-800 rounded-2xl font-black text-[13px] md:text-[15px] hover:bg-slate-800 transition-colors whitespace-nowrap">
                            자주 묻는 질문
                        </button>
                    </div>
                </div>
            </div>

            {/* Summary Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Notice Summary */}
                <div onClick={() => onTabChange('공지사항')} className={`p-3 md:p-4 rounded-[40px] border group cursor-pointer transition-all hover:shadow-2xl hover:-translate-y-1 ${brand.theme === 'dark' ? 'bg-gray-800 border-gray-700 hover:bg-gray-700' : 'bg-white border-gray-100'}`}>
                    <div className="flex items-center gap-3 mb-2 md:block md:mb-0">
                        <div className="w-10 h-10 md:w-12 md:h-12 bg-rose-50 text-[#f82b60] rounded-2xl flex items-center justify-center md:mb-3 group-hover:scale-110 transition-transform">
                            <Megaphone size={20} className="md:w-6 md:h-6" />
                        </div>
                        <h3 className="text-lg md:text-xl font-black md:mb-1">공지사항</h3>
                    </div>
                    <p className="text-gray-400 text-[11px] md:text-sm font-bold leading-relaxed mb-3 truncate md:whitespace-normal md:overflow-visible">최신 업데이트와 중요한 정책 변경 사항을 확인하세요.</p>
                    <div className="flex items-center gap-2 text-[#f82b60] text-xs font-black uppercase tracking-widest">
                        View All <ArrowRight size={14} />
                    </div>
                </div>

                {/* Ad Guide Summary */}
                <div onClick={() => onTabChange('광고안내')} className={`p-3 md:p-4 rounded-[40px] border group cursor-pointer transition-all hover:shadow-2xl hover:-translate-y-1 ${brand.theme === 'dark' ? 'bg-gray-800 border-gray-700 hover:bg-gray-700' : 'bg-white border-gray-100 shadow-sm shadow-rose-100/10'}`}>
                    <div className="flex items-center gap-3 mb-2 md:block md:mb-0">
                        <div className="w-10 h-10 md:w-12 md:h-12 bg-rose-50 text-[#f82b60] rounded-2xl flex items-center justify-center md:mb-3 group-hover:scale-110 transition-transform">
                            <Zap size={20} className="md:w-6 md:h-6" />
                        </div>
                        <h3 className="text-lg md:text-xl font-black md:mb-1">광고 가이드</h3>
                    </div>
                    <p className="text-gray-400 text-[11px] md:text-sm font-bold leading-relaxed mb-3 truncate md:whitespace-normal md:overflow-visible">최고의 광고 효과를 위한 위치별 단가 및 상품 안내입니다.</p>
                    <div className="flex items-center gap-2 text-[#f82b60] text-xs font-black uppercase tracking-widest">
                        View Price <ArrowRight size={14} />
                    </div>
                </div>

                {/* FAQ Summary */}
                <div onClick={() => onTabChange('자주묻는질문')} className={`p-3 md:p-4 rounded-[40px] border group cursor-pointer transition-all hover:shadow-2xl hover:-translate-y-1 ${brand.theme === 'dark' ? 'bg-gray-800 border-gray-700 hover:bg-gray-700' : 'bg-white border-gray-100'}`}>
                    <div className="flex items-center gap-3 mb-2 md:block md:mb-0">
                        <div className="w-10 h-10 md:w-12 md:h-12 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center md:mb-3 group-hover:scale-110 transition-transform">
                            <Search size={20} className="md:w-6 md:h-6" />
                        </div>
                        <h3 className="text-lg md:text-xl font-black md:mb-1">FAQ</h3>
                    </div>
                    <p className="text-gray-400 text-[11px] md:text-sm font-bold leading-relaxed mb-3 truncate md:whitespace-normal md:overflow-visible">궁금해 하시는 질문들을 카테고리별로 모았습니다.</p>
                    <div className="flex items-center gap-2 text-emerald-500 text-xs font-black uppercase tracking-widest">
                        Solve Fast <ArrowRight size={14} />
                    </div>
                </div>
            </div>


        </div>
    );
};
