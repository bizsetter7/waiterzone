'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Megaphone, ArrowRight } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
import { useAuth } from '@/hooks/useAuth';

export default function OpenEventPopup() {
    const router = useRouter();
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [viewMode, setViewMode] = useState<'event' | 'notice'>('event');

    const { isLoggedIn, userType } = useAuth(); // 인증 상태 직접 체크 대신 범용 이동으로 단순화

    // 전역 스크롤 관리자 연동
    useBodyScrollLock(isOpen);

    useEffect(() => {
        setMounted(true);

        // [New] 메인페이지('/')가 아니면 팝업을 아예 띄우지 않음
        if (pathname !== '/') {
            setIsOpen(false);
            return;
        }

        // 로그인된 사업자 회원에게만 노출
        if (!isLoggedIn || userType !== 'corporate') return;

        // 오늘 하루 보지 않기 여부 체크
        const lastClose = localStorage.getItem('coco_open_event_hide');
        const today = new Date().toDateString();

        if (lastClose !== today) {
            setIsOpen(true);
            setViewMode('event'); // 오픈 시 항상 이벤트 모드
        }
    }, [isLoggedIn, userType, pathname]); // pathname 의존성 추가

    const closePopup = (hideForToday: boolean) => {
        setIsOpen(false);
        if (hideForToday) {
            localStorage.setItem('coco_open_event_hide', new Date().toDateString());
        }
    };

    const handleRedirect = () => {
        // [Simplified] 복잡한 로직 대신 마이샵으로 통합 이동
        router.push('/my-shop');
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
                {/* Decorative Top Gradient */}
                <div className="h-2 md:h-3 w-full bg-gradient-to-r from-[#f82b60] to-[#ff6b95]"></div>

                {/* Close X Button (Top Right) */}
                <button
                    onClick={() => closePopup(false)}
                    className="absolute top-3 right-3 md:top-4 md:right-4 z-10 p-1.5 md:p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
                >
                    <X size={18} className="text-gray-500" />
                </button>

                <div className="p-4 md:p-10 pb-4 md:pb-8 text-center min-h-fit md:min-h-[340px] flex flex-col justify-center">
                    {viewMode === 'event' ? (
                        <div className="animate-in fade-in duration-300">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#f82b60]/10 text-[#f82b60] font-black text-[11px] mb-3 md:mb-6">
                                <Megaphone size={14} /> 오픈기념 상생지원 이벤트
                            </div>

                            <h2 className="text-[20px] md:text-[30px] font-black leading-[1.2] tracking-tighter text-gray-900 mb-4 md:mb-6">
                                사장님 주목! 🙌<br />
                                <span className="text-[#f82b60]">통큰 혜택</span> 드립니다
                            </h2>

                            {/* Event Blocks (Extreme compact for mobile) */}
                            <div className="space-y-2 md:space-y-3 mb-5 md:mb-8 text-left">
                                <div className="flex items-center gap-3 md:gap-4 p-3 md:p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                    <div className="w-9 h-9 md:w-11 md:h-11 bg-white rounded-xl flex items-center justify-center shadow-sm shrink-0 font-bold text-lg md:text-xl">
                                        💎
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">EVENT 01</p>
                                        <p className="text-[12px] md:text-[14px] font-black text-gray-800 leading-tight">
                                            지역별 <span className="text-[#f82b60]">선착순 10곳</span><br />
                                            베이직 무료 광고 게시!
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 md:gap-4 p-3 md:p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                    <div className="w-9 h-9 md:w-11 md:h-11 bg-white rounded-xl flex items-center justify-center shadow-sm shrink-0 font-bold text-lg md:text-xl">
                                        🎁
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">EVENT 02</p>
                                        <p className="text-[12px] md:text-[14px] font-black text-gray-800 leading-tight">
                                            모든 광고 등록 시<br />
                                            <span className="text-[#f82b60]">추가 1개월 무료(1+1)</span>
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* CTA Button */}
                            <button
                                onClick={() => setViewMode('notice')}
                                className="group w-full py-3.5 md:py-5 bg-[#f82b60] hover:bg-[#db2456] text-white font-black text-[16px] md:text-lg rounded-[18px] md:rounded-[20px] shadow-xl shadow-[#f82b60]/30 transition-all active:scale-95 flex items-center justify-center gap-2"
                            >
                                무료 공고 등록하기 <ArrowRight size={20} />
                            </button>

                            <p className="mt-3 md:mt-4 text-[11px] md:text-[12px] font-bold text-gray-400">
                                * 사업자 인증 완료 회원 한정 적용
                            </p>
                        </div>
                    ) : (
                        <div className="animate-in fade-in duration-0">
                            <div className="bg-gray-50 p-4 md:p-6 rounded-[24px] md:rounded-[28px] border border-gray-100 mb-5 md:mb-8">
                                <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full text-[20px] md:text-[22px] font-black text-[#f82b60] shadow-sm mb-4 md:mb-5 border border-gray-100">
                                    📢 이용안내
                                </div>
                                <p className="text-[13px] md:text-[15px] font-bold text-gray-800 leading-[1.6] whitespace-pre-wrap">
                                    ※ 회원가입 후 '사업자인증'이{"\n"}
                                    된 회원분들만 가능합니다.{"\n"}
                                    (마이샵-회원정보페이지{"\n"}-하단에서 사업자인증 가능.){"\n\n"}
                                    <span className="text-[11px] md:text-[13px] text-gray-500 font-medium">모든 이벤트는 한시적으로 진행되며,{"\n"}필요시 연장 또는 조기 종료될 수 있습니다.</span>
                                </p>
                            </div>

                            <div className="flex flex-col gap-2 md:gap-3">
                                <button
                                    onClick={handleRedirect}
                                    className="w-full py-4 md:py-5 bg-[#f82b60] hover:bg-[#db2456] text-white font-black text-[16px] md:text-lg rounded-[18px] md:rounded-[22px] shadow-xl shadow-[#f82b60]/30 transition-all active:scale-95 flex items-center justify-center gap-2"
                                >
                                    확인 및 이동하기 <ArrowRight size={20} />
                                </button>
                                <button
                                    onClick={() => setViewMode('event')}
                                    className="w-full py-2 md:py-3 text-[12px] md:text-[13px] font-bold text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    이전으로
                                </button>
                            </div>
                        </div>
                    )}
                </div>



                {/* Mobile-Friendly Control Bar */}
                <div className="flex border-t border-gray-100 bg-[#fcfcfc]">
                    <button
                        onClick={() => closePopup(true)}
                        className="flex-1 py-4 md:py-5 text-[13px] font-black text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors border-r border-gray-100"
                    >
                        오늘 하루 보지 않기
                    </button>
                    <button
                        onClick={() => closePopup(false)}
                        className="flex-1 py-4 md:py-5 text-[13px] font-black text-[#f82b60] hover:bg-gray-50 transition-colors"
                    >
                        닫기
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}
