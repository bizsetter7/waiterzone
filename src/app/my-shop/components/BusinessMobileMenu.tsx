import React from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '@/hooks/useAuth';
import {
    List, LogOut, CreditCard, User, Settings, ShieldCheck, Home, Zap, Wallet, Coins, Star, Gift, AlertTriangle, Briefcase, FileText, Shield, Lock, CalendarDays
} from 'lucide-react';

interface MobileMenuProps {
    brand: any;
    onClose: () => void;
    setView: (view: any) => void;
    shopName: string;
    nickname: string;
    router: any;
    userType?: 'corporate' | 'individual' | 'admin' | 'guest';
}

export const BusinessMobileMenu: React.FC<MobileMenuProps> = ({ brand, onClose, setView, shopName, nickname, router, userType = 'corporate' }) => {
    const { logout } = useAuth();
    if (typeof document === 'undefined') return null;
    return createPortal(
        <div className="fixed inset-0 z-[20000] flex justify-end">
            <div className="absolute inset-0 bg-black/50" onClick={onClose} />
            <div className={`relative w-72 h-full shadow-2xl p-6 transform animate-in slide-in-from-right duration-300 ${brand.theme === 'dark' ? 'bg-gray-900' : 'bg-white'}`}>
                <div className="flex justify-between items-center mb-6">
                    <span className="text-[11px] font-black text-blue-500 uppercase tracking-widest">Menu</span>
                    <button onClick={onClose} className={`text-xs font-bold ${brand.theme === 'dark' ? 'text-gray-500' : 'text-gray-400'} hover:text-blue-500`}>
                        닫기
                    </button>
                </div>

                <div className="pb-4 border-b border-gray-100 dark:border-gray-800">
                    <div className="flex items-center justify-between gap-2 mb-2">
                        <div
                            onClick={() => { setView('dashboard'); onClose(); }}
                            className="cursor-pointer active:opacity-70 transition min-w-0"
                        >
                            <h2 className={`font-black text-lg truncate ${brand.theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{shopName || (userType === 'individual' ? '회원님' : '내 상점')}</h2>
                            <p className="text-xs text-gray-500 font-bold">{userType === 'individual' ? '일반 회원' : '업주 관리자'}</p>
                        </div>
                        <button
                            onClick={() => { if (window.confirm('로그아웃 하시겠습니까?')) logout(); }}
                            className={`p-2.5 rounded-xl border shrink-0 transition-all ${brand.theme === 'dark' ? 'bg-gray-800 border-gray-700 text-gray-400 hover:text-rose-500' : 'bg-gray-50 border-gray-100 text-gray-400 hover:bg-rose-50 hover:text-rose-500 hover:border-rose-100'}`}
                            title="로그아웃"
                        >
                            <LogOut size={16} />
                        </button>
                    </div>
                    {userType === 'individual' && (
                        <button
                            onClick={() => { setView('member-edit'); onClose(); }}
                            className={`w-full py-1.5 text-[10px] font-black rounded-lg border transition ${brand.theme === 'dark' ? 'bg-gray-800 border-gray-700 text-gray-400' : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100'}`}
                        >
                            내 정보수정
                        </button>
                    )}
                </div>

                <nav className={`mt-4 space-y-0.5 text-sm font-bold ${brand.theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                    {userType === 'individual' ? (
                        <>
                            <div onClick={() => { setView('dashboard'); onClose(); }} className="px-3 py-2.5 flex items-center gap-3 hover:bg-blue-50 hover:text-blue-500 rounded-xl transition cursor-pointer">
                                <Home size={18} /> 마이 대시보드
                            </div>
                            <div onClick={() => { setView('resume-list'); onClose(); }} className="px-3 py-2.5 flex items-center gap-3 hover:bg-blue-50 hover:text-blue-500 rounded-xl transition cursor-pointer">
                                <List size={18} /> 이력서 관리
                            </div>
                            <div onClick={() => { setView('scrap-jobs'); onClose(); }} className="px-3 py-2.5 flex items-center gap-3 hover:bg-blue-50 hover:text-blue-500 rounded-xl transition cursor-pointer">
                                <Star size={18} /> 채용정보 스크랩
                            </div>
                            <div onClick={() => { setView('point-history'); onClose(); }} className="px-3 py-2.5 flex items-center gap-3 hover:bg-blue-50 hover:text-blue-500 rounded-xl transition cursor-pointer">
                                <Coins size={18} /> 포인트 및 점프 내역
                            </div>
                            <div onClick={() => { setView('point-exchange'); onClose(); }} className="px-3 py-2.5 flex items-center gap-3 hover:bg-blue-50 hover:text-blue-500 rounded-xl transition cursor-pointer">
                                <Gift size={18} /> 포인트 상품권 교환
                            </div>
                            <div onClick={() => { setView('payment-history'); onClose(); }} className="px-3 py-2.5 flex items-center gap-3 hover:bg-blue-50 hover:text-blue-500 rounded-xl transition cursor-pointer">
                                <CreditCard size={18} /> 유료 결제 내역
                            </div>
                            <div onClick={() => { setView('excluded-shops'); onClose(); }} className="px-3 py-2.5 flex items-center gap-3 hover:bg-blue-50 hover:text-blue-500 rounded-xl transition cursor-pointer">
                                <AlertTriangle size={18} /> 열람불가 업소설정
                            </div>
                            <div onClick={() => { setView('custom-jobs'); onClose(); }} className="px-3 py-2.5 flex items-center gap-3 hover:bg-blue-50 hover:text-blue-500 rounded-xl transition cursor-pointer">
                                <Briefcase size={18} /> 맞춤구인정보
                            </div>
                            <div onClick={() => { setView('my-posts'); onClose(); }} className="px-3 py-2.5 flex items-center gap-3 hover:bg-blue-50 hover:text-blue-500 rounded-xl transition cursor-pointer">
                                <FileText size={18} /> 내가 작성한 게시글
                            </div>
                            <div onClick={() => { setView('block-settings'); onClose(); }} className="px-3 py-2.5 flex items-center gap-3 hover:bg-blue-50 hover:text-blue-500 rounded-xl transition cursor-pointer">
                                <Shield size={18} /> 회원 차단 설정
                            </div>
                        </>
                    ) : (
                        <>
                            <div onClick={() => { setView('dashboard'); onClose(); }} className="px-3 py-2.5 flex items-center gap-3 hover:bg-blue-50 hover:text-blue-500 rounded-xl transition cursor-pointer">
                                <List size={18} /> 진행중인 공고
                            </div>
                            <div onClick={() => { setView('closed-ads'); onClose(); }} className="px-3 py-2.5 flex items-center gap-3 hover:bg-blue-50 hover:text-blue-500 rounded-xl transition cursor-pointer">
                                <LogOut size={18} /> 마감된 공고
                            </div>
                            <div onClick={() => { setView('applicants'); onClose(); }} className="px-3 py-2.5 flex items-center gap-3 hover:bg-blue-50 hover:text-blue-500 rounded-xl transition cursor-pointer">
                                <User size={18} /> 지원자 관리
                            </div>
                            <div onClick={() => { setView('sos-alert'); onClose(); }} className="px-3 py-2.5 flex items-center gap-3 hover:bg-red-50 rounded-xl transition cursor-pointer text-red-500 font-black">
                                <Zap size={18} /> SOS 긴급구인
                            </div>
                            <div onClick={() => { setView('buy-points'); onClose(); }} className="px-3 py-2.5 flex items-center gap-3 hover:bg-blue-50 hover:text-blue-500 rounded-xl transition cursor-pointer">
                                <Wallet size={18} /> 추가옵션안내
                            </div>
                            <div onClick={() => { setView('payments'); onClose(); }} className="px-3 py-2.5 flex items-center gap-3 hover:bg-blue-50 hover:text-blue-500 rounded-xl transition cursor-pointer">
                                <CreditCard size={18} /> 유료 결제 내역
                            </div>
                            <div onClick={() => { setView('point-history'); onClose(); }} className="px-3 py-2.5 flex items-center gap-3 hover:bg-blue-50 hover:text-blue-500 rounded-xl transition cursor-pointer">
                                <Coins size={18} /> 포인트 및 점프 내역
                            </div>
                            <div onClick={() => { setView('member-info'); onClose(); }} className="px-3 py-2.5 flex items-center gap-3 hover:bg-blue-50 hover:text-blue-500 rounded-xl transition cursor-pointer border-t border-gray-100 mt-1">
                                <Settings size={18} /> 회원 정보 수정
                            </div>
                            {userType === 'admin' && (
                                <div onClick={() => { setView('change-password'); onClose(); }} className="px-3 py-2.5 flex items-center gap-3 hover:bg-blue-50 hover:text-blue-500 rounded-xl transition cursor-pointer">
                                    <Lock size={18} /> 비밀번호 변경
                                </div>
                            )}
                        </>
                    )}
                </nav>
            </div>
        </div>,
        document.body
    );
};
