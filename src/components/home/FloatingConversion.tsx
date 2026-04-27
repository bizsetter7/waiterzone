'use client';

import React, { useState, useEffect } from 'react';
import { Megaphone, ExternalLink, X, TrendingUp, Zap } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export const FloatingConversion = () => {
    const { userType } = useAuth();

    // Hide for individual members as requested by user
    if (userType === 'individual') return null;

    return (
        <div className="fixed bottom-24 right-4 md:bottom-6 md:right-6 z-[9999] flex flex-col items-end gap-3 pointer-events-none scale-90 md:scale-100 origin-bottom-right">
            {/* Floating Action Button */}
            <div className="pointer-events-auto flex flex-col gap-2 group">
                <a
                    href="/customer-center?tab=ad"
                    className="flex items-center gap-2.5 bg-slate-950 text-white pl-5 pr-3 py-3 rounded-full shadow-[0_20px_40px_-10px_rgba(0,0,0,0.3)] hover:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] hover:-translate-y-1 transition-all duration-300 border border-slate-800"
                >
                    <div className="flex flex-col items-start leading-none">
                        <span className="text-[9px] font-black text-blue-400 uppercase tracking-[0.2em] mb-0.5">
                            Advertising
                        </span>
                        <span className="text-sm font-black tracking-tighter">
                            광고 집행 문의
                        </span>
                    </div>
                    <div className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/20 group-hover:scale-110 transition-transform">
                        <Megaphone size={16} className="md:hidden" fill="white" />
                        <Megaphone size={18} className="hidden md:block" fill="white" />
                    </div>
                </a>

                <div className="flex justify-end pr-2">
                    <div className="bg-white/70 backdrop-blur-md px-3 py-1.5 rounded-full border border-slate-200 text-[10px] font-black text-slate-500 flex items-center gap-2 shadow-sm">
                        <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        24시간 실시간 컨설팅 대기 중
                    </div>
                </div>
            </div>
        </div>
    );
};
