'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, ArrowRight, Zap } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
import { useAuth } from '@/hooks/useAuth';

export default function OpenEventPopup() {
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);
    const [mounted, setMounted] = useState(false);

    const { isLoggedIn, userType } = useAuth();

    useBodyScrollLock(isOpen);

    useEffect(() => {
        setMounted(true);

        if (pathname !== '/') {
            setIsOpen(false);
            return;
        }

        if (!isLoggedIn || userType !== 'corporate') return;

        const lastClose = localStorage.getItem('coco_open_event_hide');
        const today = new Date().toDateString();

        if (lastClose !== today) {
            setIsOpen(true);
        }
    }, [isLoggedIn, userType, pathname]);

    const closePopup = (hideForToday: boolean) => {
        setIsOpen(false);
        if (hideForToday) {
            localStorage.setItem('coco_open_event_hide', new Date().toDateString());
        }
    };

    const handleApply = () => {
        window.open('https://www.yasajang.kr', '_blank', 'noopener,noreferrer');
        closePopup(false);
    };

    if (!isOpen || !mounted || pathname !== '/') return null;

    return createPortal(
        <div
            className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/70 backdrop-blur-sm p-5"
            onClick={() => closePopup(false)}
        >
            <div
                className="relative w-[90%] max-w-sm md:max-w-md bg-white rounded-[32px] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.3)] animate-in zoom-in-95 duration-300"
                onClick={e => e.stopPropagation()}
            >
                {/* 헤더 — 야사장 CTA */}
                <div className="bg-gradient-to-br from-gray-900 to-gray-800 px-5 pt-6 pb-5 text-center relative">
                    <button
                        onClick={() => closePopup(false)}
                        className="absolute top-3 right-3 p-1.5 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
                    >
                        <X size={18} className="text-gray-300" />
                    </button>
                    <div className="flex items-center justify-center gap-2 mb-3">
                        <span className="bg-pink-600/20 text-pink-400 text-[10px] font-black px-2.5 py-1 rounded-full border border-pink-600/30 flex items-center gap-1">
                            <Zap size={10} /> 즉시 노출
                        </span>
                        <span className="bg-gray-700 text-gray-300 text-[10px] font-black px-2.5 py-1 rounded-full border border-gray-600">
                            🏷 언제든 해지
                        </span>
                    </div>
                    <h2 className="text-white font-black text-[18px] md:text-[22px] leading-tight tracking-tight">
                        손님유입+웨이터+아가씨 모집
                    </h2>
                    <p className="text-pink-400 font-black text-[22px] md:text-[28px] mt-1">월 88,000원으로</p>
                    <p className="text-white font-black text-[18px] md:text-[22px]">한 번에 해결!</p>
                </div>

                <div className="p-4 md:p-6 text-center">
                    {/* 플랫폼 노출 안내 */}
                    <div className="grid grid-cols-4 gap-2 mb-5">
                        {[
                            { emoji: '🗺️', name: '밤길', desc: '손님 유입\n지도 노출' },
                            { emoji: '🤵', name: '웨이터존', desc: '웨이터 구인' },
                            { emoji: '💼', name: '코코알바', desc: '아가씨 구인' },
                            { emoji: '⚡', name: '선수존', desc: '선수 구인' },
                        ].map(p => (
                            <div key={p.name} className="flex flex-col items-center gap-1 p-2 rounded-xl bg-gray-50 border border-gray-200">
                                <span className="text-lg">{p.emoji}</span>
                                <span className="text-[9px] font-black text-gray-800">{p.name}</span>
                                <span className="text-[8px] text-gray-400 text-center leading-tight whitespace-pre-line">{p.desc}</span>
                            </div>
                        ))}
                    </div>

                    {/* CTA 버튼 */}
                    <button
                        onClick={handleApply}
                        className="w-full py-4 bg-[#f82b60] hover:bg-[#db2456] text-white font-black text-[15px] md:text-[17px] rounded-[18px] shadow-xl shadow-[#f82b60]/30 transition-all active:scale-95 flex items-center justify-center gap-2"
                    >
                        야사장에서 신청하기 <ArrowRight size={18} />
                    </button>
                    <p className="mt-2 text-[10px] text-gray-400 font-medium">무통장 입금 · 언제든 해지 가능</p>
                </div>

                {/* 하단 컨트롤 바 */}
                <div className="flex border-t border-gray-100 bg-[#fcfcfc]">
                    <button
                        onClick={() => closePopup(true)}
                        className="flex-1 py-4 md:py-5 text-[13px] font-black text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors border-r border-gray-100"
                    >
                        오늘 하루 보지 않기
                    </button>
                    <button
                        onClick={() => closePopup(false)}
                        className="flex-1 py-4 md:py-5 text-[13px] font-black text-[#1e3a5f] hover:bg-gray-50 transition-colors"
                    >
                        닫기
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}
