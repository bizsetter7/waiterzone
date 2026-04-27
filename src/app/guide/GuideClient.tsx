'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Trophy, Sparkles, Star, ChevronRight } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export default function CocoGuidePage() {
    const router = useRouter();
    const { isLoggedIn, userType } = useAuth();

    const handleStart = () => {
        if (!isLoggedIn) {
            router.push('/?page=login');
            return;
        }
        if (userType === 'individual') {
            alert('업체회원만 이용 가능한 서비스입니다.');
            return;
        }
        router.push('/my-shop');
    };

    return (
        <div className="min-h-screen bg-white flex flex-col font-sans">
            <main className="flex-1 max-w-6xl mx-auto px-4 md:px-8 py-10 md:py-16">
                <div className="text-center mb-10 md:mb-14">
                    <span className="inline-block px-4 py-1.5 bg-rose-50 text-[#f82b60] rounded-full text-[10px] md:text-xs font-black uppercase tracking-[0.2em] mb-4">
                        STEP BY STEP GUIDE
                    </span>
                    <h1 className="text-3xl md:text-4xl font-black text-slate-900 mb-6 tracking-tighter leading-[1.1]">
                        웨이터존 서비스<br className="md:hidden" /> 이용 가이드
                    </h1>
                    <p className="text-slate-500 text-sm md:text-lg font-bold tracking-tight break-keep opacity-80">
                        웨이터존를 200% 활용하여 가장 빠르고<br className="md:hidden" /> 안전하게 인재를 찾아보세요.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-6 max-w-5xl mx-auto">
                    {/* Step 1: GRAND / REGION TOP Style */}
                    <div className="relative group bg-white rounded-[28px] p-7 border-2 border-amber-400 shadow-[0_10px_30px_-15px_rgba(251,191,36,0.12)] transition-all hover:-translate-y-1">
                        <div className="flex flex-col items-center text-center">
                            <span className="text-[10px] md:text-[11px] font-[900] text-amber-500 uppercase tracking-[0.1em] mb-4">Grand / Region Top</span>
                            <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-500 mb-5 shadow-inner">
                                <Trophy size={28} />
                            </div>
                            <h2 className="text-xl md:text-xl font-black text-slate-900 mb-4 tracking-tight">1+1 광고 이벤트</h2>
                            <p className="text-slate-600 text-xs md:text-sm leading-relaxed break-keep font-bold opacity-90">
                                <strong className="text-[#f82b60]">1개월 결제 시 1개월 추가 무료!</strong><br />지금 신청하면 총 2개월을 경험하세요.
                                <span className="block mt-4 text-[10px] text-slate-400 font-bold tracking-tight">골드 보더 + 상단 고정 효과와 유사한<br />프리미엄 노출을 2배로 경험하세요.</span>
                            </p>
                        </div>
                    </div>

                    {/* Step 2: COMMUNITY / LIST NATIVE Style */}
                    <div className="relative group bg-rose-50/10 rounded-[28px] p-7 border-2 border-dashed border-rose-200 shadow-[0_10px_30px_-15px_rgba(248,43,96,0.08)] transition-all hover:-translate-y-1">
                        <div className="flex flex-col items-center text-center">
                            <span className="text-[10px] md:text-[11px] font-[900] text-[#f82b60] uppercase tracking-[0.1em] mb-4">Community / List Native</span>
                            <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center text-[#f82b60] mb-5 shadow-lg shadow-rose-500/5 ring-4 ring-rose-50">
                                <Sparkles size={28} fill="currentColor" />
                            </div>
                            <h2 className="text-xl md:text-xl font-black text-slate-900 mb-4 tracking-tight">통합 커뮤니티 활용</h2>
                            <div className="text-slate-600 text-xs md:text-sm leading-relaxed break-keep font-bold opacity-90">
                                파트너스크레딧과 연동된 통합<br />
                                <span className="md:block md:whitespace-nowrap">커뮤니티에서 브랜드 신뢰도를 높이세요.</span>
                                <div className="mt-4">
                                    <span className="text-[9px] text-[#f82b60] font-black uppercase tracking-widest bg-rose-100/50 py-1.5 px-3 rounded-full inline-block">Recommended Ad System</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Step 3: LOUNGE / STAR MEMBERSHIP Style */}
                    <div className="relative group bg-slate-900 rounded-[28px] p-7 border border-slate-800 shadow-[0_20px_40px_-15px_rgba(15,23,42,0.2)] transition-all hover:-translate-y-1 text-white">
                        <div className="flex flex-col items-center text-center relative z-10">
                            <span className="text-[10px] md:text-[11px] font-[900] text-indigo-400 uppercase tracking-[0.1em] mb-4">Lounge / Star Member</span>
                            <div className="w-14 h-14 bg-white/5 backdrop-blur-xl rounded-full flex items-center justify-center text-white mb-5 ring-1 ring-white/10">
                                <div className="p-2 bg-indigo-500/20 rounded-full">
                                    <Star size={24} fill="currentColor" className="text-amber-400" />
                                </div>
                            </div>
                            <h2 className="text-xl md:text-xl font-black mb-4 tracking-tight">지역별 맞춤 정보</h2>
                            <p className="text-slate-300 text-xs md:text-sm leading-relaxed break-keep font-bold opacity-90">
                                하이퍼 로컬 시스템을 통해<br />가장 근접한 인재를 매칭해 드립니다.
                                <span className="block mt-4 text-[9px] font-black text-amber-400 uppercase tracking-widest border border-amber-400/20 py-1 px-3 rounded-full inline-block">Star Member VIP Benefit</span>
                            </p>
                        </div>
                    </div>
                </div>

                <div className="mt-20 md:mt-28 text-center flex flex-col items-center">
                    <h3 className="text-2xl md:text-3xl font-black text-slate-900 mb-10 tracking-tighter leading-[1.6] break-keep">
                        지금 바로 <br className="md:hidden" />전국 통합 구인 시스템의<br /> 주인공이 되어보세요!
                    </h3>
                    <button
                        onClick={handleStart}
                        className="group flex items-center gap-3 bg-[#f82b60] hover:bg-[#db2456] text-white font-black px-10 md:px-14 py-4 md:py-5 rounded-full text-lg md:text-xl transition-all hover:-translate-y-1 active:scale-95 shadow-xl shadow-rose-500/20"
                    >
                        시작하기 <ChevronRight size={24} strokeWidth={3} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                    <p className="mt-12 text-slate-400 text-[10px] md:text-xs font-black tracking-tight opacity-50 uppercase">
                        ※ 상세한 노출 방식과 디자인은 상품별 가이드라인에 따라 제공됩니다.
                    </p>
                </div>
            </main>

            {/* Removed redundant footer section */}
        </div>
    );
}
