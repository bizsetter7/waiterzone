'use client';

import React from 'react';
import { AlertCircle, Clock, LogOut, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface IdleLogoutModalProps {
    isOpen: boolean;
    secondsLeft: number;
    onKeepAlive: () => void;
    onLogout: () => void;
}

export const IdleLogoutModal = ({ isOpen, secondsLeft, onKeepAlive, onLogout }: IdleLogoutModalProps) => {
    if (!isOpen) return null;

    const minutes = Math.floor(secondsLeft / 60);
    const seconds = secondsLeft % 60;

    return (
        <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4">
            {/* Backdrop with Heavy Blur (Glassmorphism) */}
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300" />

            {/* Modal Container */}
            <div className="relative w-full max-w-[340px] bg-white dark:bg-slate-900 rounded-[28px] overflow-hidden shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] border border-slate-200/50 dark:border-slate-800/50 animate-in zoom-in-95 fade-in duration-300">
                
                {/* Visual Header */}
                <div className="p-6 pb-0 flex flex-col items-center text-center">
                    <div className="w-16 h-16 rounded-full bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center mb-4 relative">
                        <Clock size={32} className="text-rose-500 animate-pulse" />
                        <div className="absolute inset-0 rounded-full border-4 border-rose-500/20 border-t-rose-500 animate-spin" style={{ animationDuration: '3s' }} />
                    </div>
                    
                    <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight mb-2">
                        로그아웃 예정 안내
                    </h2>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400 leading-relaxed px-2">
                        장시간 활동이 감지되지 않아<br />
                        <span className="font-black text-rose-500 underline underline-offset-4 decoration-2">자동 로그아웃</span>될 예정입니다.
                    </p>
                </div>

                {/* Countdown Display */}
                <div className="mt-6 mx-6 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex flex-col items-center justify-center">
                    <div className="flex items-baseline gap-1 text-[#f82b60]">
                        <span className="text-4xl font-black tabular-nums">{minutes}</span>
                        <span className="text-xl font-bold">분</span>
                        <span className="text-4xl font-black tabular-nums ml-1">
                            {seconds < 10 ? `0${seconds}` : seconds}
                        </span>
                        <span className="text-xl font-bold">초</span>
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2 px-3 py-0.5 rounded-full border border-slate-200 dark:border-slate-700">
                        Remaining Time
                    </span>
                </div>

                {/* Actions */}
                <div className="p-6 flex flex-col gap-2">
                    <button
                        onClick={onKeepAlive}
                        className="w-full h-14 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black text-sm flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl"
                    >
                        로그인 상태 유지하기
                        <ArrowRight size={18} />
                    </button>
                    
                    <button
                        onClick={onLogout}
                        className="w-full h-12 bg-transparent text-slate-400 dark:text-slate-500 hover:text-rose-500 font-bold text-sm flex items-center justify-center gap-1 transition-colors"
                    >
                        <LogOut size={16} />
                        즉시 로그아웃
                    </button>
                </div>

                {/* Footer Info */}
                <div className="bg-slate-50 dark:bg-slate-950/50 px-6 py-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
                    <AlertCircle size={14} className="text-slate-400" />
                    <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500">
                        개인정보 보호를 위해 30분 무활동 시 로그아웃됩니다.
                    </span>
                </div>
            </div>
        </div>
    );
};
