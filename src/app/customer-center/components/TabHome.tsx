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
            {/* Hero Section — minimal */}
            <div className="pb-8 border-b border-gray-100">
                <h2 className={`text-[28px] md:text-4xl font-black tracking-tighter mb-3 leading-tight ${brand.theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    무엇을 <span className="text-[#1e3a5f]">도와드릴까요?</span><br />
                    웨이터존이 해결해 드립니다.
                </h2>
                <p className={`text-sm md:text-base font-bold leading-relaxed mb-6 ${brand.theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                    광고 효과를 극대화하는 전략부터 안전한 채용을 위한 운영 정책까지,<br className="hidden md:block" />
                    모든 궁금증을 한곳에서 해결하세요.
                </p>
                <div className="flex flex-wrap gap-3">
                    <button onClick={() => onTabChange('1:1 문의')} className="px-6 py-3 bg-[#1e3a5f] text-white rounded-xl font-black text-[13px] hover:bg-[#162d4a] transition-colors shadow-md whitespace-nowrap">
                        지금 문의하기
                    </button>
                    <button onClick={() => onTabChange('자주묻는질문')} className={`px-6 py-3 border rounded-xl font-black text-[13px] transition-colors whitespace-nowrap ${brand.theme === 'dark' ? 'border-gray-600 text-gray-300 hover:bg-gray-800' : 'border-gray-200 text-gray-700 hover:bg-gray-50'}`}>
                        자주 묻는 질문
                    </button>
                </div>
            </div>

            {/* Summary Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Notice Summary */}
                <div onClick={() => onTabChange('공지사항')} className={`p-3 md:p-4 rounded-[40px] border group cursor-pointer transition-all hover:shadow-2xl hover:-translate-y-1 ${brand.theme === 'dark' ? 'bg-gray-800 border-gray-700 hover:bg-gray-700' : 'bg-white border-gray-100'}`}>
                    <div className="flex items-center gap-3 mb-2 md:block md:mb-0">
                        <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-50 text-[#1e3a5f] rounded-2xl flex items-center justify-center md:mb-3 group-hover:scale-110 transition-transform">
                            <Megaphone size={20} className="md:w-6 md:h-6" />
                        </div>
                        <h3 className="text-lg md:text-xl font-black md:mb-1">공지사항</h3>
                    </div>
                    <p className="text-gray-400 text-[11px] md:text-sm font-bold leading-relaxed mb-3 truncate md:whitespace-normal md:overflow-visible">최신 업데이트와 중요한 정책 변경 사항을 확인하세요.</p>
                    <div className="flex items-center gap-2 text-[#1e3a5f] text-xs font-black uppercase tracking-widest">
                        View All <ArrowRight size={14} />
                    </div>
                </div>

                {/* Ad Guide Summary */}
                <div onClick={() => onTabChange('광고안내')} className={`p-3 md:p-4 rounded-[40px] border group cursor-pointer transition-all hover:shadow-2xl hover:-translate-y-1 ${brand.theme === 'dark' ? 'bg-gray-800 border-gray-700 hover:bg-gray-700' : 'bg-white border-gray-100 shadow-sm shadow-gray-100/10'}`}>
                    <div className="flex items-center gap-3 mb-2 md:block md:mb-0">
                        <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-50 text-[#1e3a5f] rounded-2xl flex items-center justify-center md:mb-3 group-hover:scale-110 transition-transform">
                            <Zap size={20} className="md:w-6 md:h-6" />
                        </div>
                        <h3 className="text-lg md:text-xl font-black md:mb-1">광고 가이드</h3>
                    </div>
                    <p className="text-gray-400 text-[11px] md:text-sm font-bold leading-relaxed mb-3 truncate md:whitespace-normal md:overflow-visible">최고의 광고 효과를 위한 위치별 단가 및 상품 안내입니다.</p>
                    <div className="flex items-center gap-2 text-[#1e3a5f] text-xs font-black uppercase tracking-widest">
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
