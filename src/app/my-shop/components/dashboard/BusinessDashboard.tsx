'use client';

import React from 'react';
import { ChevronLeft, Store, MapPin, Check, Plus, RefreshCw, Calendar, List, LogOut, CreditCard, User, Settings, AlertTriangle, ChevronRight, Zap } from 'lucide-react';
import { getHighlighterStyle } from '@/utils/highlighter';
import { IconBadge } from '@/components/common/IconBadge';
import { getJumpConfig } from '../../constants';

interface BusinessDashboardProps {
    brand: any;
    shopName: string;
    nickname: string;
    isVerified: boolean;
    bizVerified?: boolean;
    bizAddress?: string;
    onGoMemberInfo?: () => void;
    handleAdClick: (isNew: boolean, ad?: any) => void;
    setShowDesignModal: (v: boolean) => void;
    setView: (v: any) => void;
    router: any;
    ads?: any[];
    onOpenMenu?: () => void;
    onShowAdDetail?: (ad: any) => void;
    onDeleteAd?: (adId: string) => void;
    onJumpAd?: (adId: string) => void;
    onExtendAd?: (ad: any) => void;
    onToggleAutoJump?: (adId: string, enabled: boolean) => void;
}

export const BusinessDashboard: React.FC<BusinessDashboardProps> = ({
    brand, shopName, nickname, isVerified, bizVerified = false, bizAddress, onGoMemberInfo, handleAdClick, setShowDesignModal, setView, router, ads = [], onOpenMenu, onShowAdDetail, onDeleteAd, onJumpAd, onExtendAd, onToggleAutoJump
}) => {
    const [activeTab, setActiveTab] = React.useState<'ongoing' | 'closed'>('ongoing');

    const ongoingAds = ads.filter(ad => !ad.isClosed);
    const closedAds = ads.filter(ad => ad.isClosed);
    const displayedAds = activeTab === 'ongoing' ? ongoingAds : closedAds;

    return (
        <div className="w-full space-y-3 md:space-y-6 pb-20">
            {/* 사업자 미인증 배너 */}
            {!bizVerified && (
                <button
                    onClick={onGoMemberInfo}
                    className="w-full flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-2xl text-left hover:bg-amber-100 transition group"
                >
                    <div className="w-9 h-9 bg-amber-100 rounded-xl flex items-center justify-center shrink-0">
                        <AlertTriangle size={18} className="text-amber-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="font-black text-amber-800 text-sm">사업자 인증이 필요합니다</p>
                        <p className="text-xs text-amber-600 font-bold">공고 등록 전 회원정보수정에서 사업자 인증을 완료해주세요.</p>
                    </div>
                    <ChevronRight size={16} className="text-amber-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
                </button>
            )}

            <header className="flex flex-col gap-2 md:gap-4 mb-2 md:mb-4">
                <div className={`p-4 md:p-6 sm:rounded-[32px] shadow-sm border relative ${brand.theme === 'dark' ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'} `}>
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2 md:gap-4">
                        <div className="flex items-center gap-4">
                            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-white shadow-lg ${brand.theme === 'dark' ? 'bg-gray-800' : bizVerified ? 'bg-blue-600' : 'bg-gray-400'} `}>
                                <Store size={32} />
                            </div>
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <h2 className={`text-2xl font-black ${brand.theme === 'dark' ? 'text-white' : 'text-gray-900'} `}>
                                        {bizVerified ? shopName : '미인증 업체'}
                                    </h2>
                                    {bizVerified && <Check size={16} className="text-blue-500" strokeWidth={3} />}
                                </div>
                                <p className={`text-sm font-bold flex items-center gap-1 ${bizVerified ? 'text-gray-500' : 'text-amber-500'}`}>
                                    {bizVerified
                                        ? <><MapPin size={14} /> {bizAddress || '인증된 사업자'}</>
                                        : <><AlertTriangle size={14} /> 사업자 인증 후 공고 등록 가능</>
                                    }
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-2 w-full md:w-auto">
                            <button onClick={() => setShowDesignModal(true)} className={`flex-1 md:flex-none py-3 px-5 rounded-xl text-sm font-bold border transition ${brand.theme === 'dark' ? 'border-gray-700 text-gray-300 hover:bg-gray-800' : 'border-gray-200 text-gray-600 hover:bg-gray-50'} `}>
                                디자인 의뢰
                            </button>
                            <button onClick={() => handleAdClick(true)} className="flex-1 md:flex-none py-3 px-6 rounded-xl bg-[#f82b60] text-white text-sm font-black hover:bg-[#db2456] shadow-lg shadow-[#f82b60]/30 transition flex items-center justify-center gap-2 whitespace-nowrap">
                                <Plus size={18} /> 광고 등록
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Progress Tabs */}
            <div className="flex gap-0 overflow-hidden rounded-xl border border-gray-200 font-black text-sm">
                <button
                    onClick={() => setActiveTab('ongoing')}
                    className={`flex-1 py-4 flex items-center justify-center gap-2 border-r border-gray-200 transition-colors ${activeTab === 'ongoing' ? 'bg-gray-600 text-white' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}
                >
                    진행중인 채용정보 <span className={`px-2 py-0.5 rounded text-xs ${activeTab === 'ongoing' ? 'bg-white/20' : 'bg-gray-200 text-gray-500'}`}>{ongoingAds.length}</span>
                </button>
                <button
                    onClick={() => setActiveTab('closed')}
                    className={`flex-1 py-4 flex items-center justify-center gap-2 transition-colors ${activeTab === 'closed' ? 'bg-gray-600 text-white' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}
                >
                    마감된 채용정보 <span className={`px-2 py-0.5 rounded text-xs ${activeTab === 'closed' ? 'bg-white/20' : 'bg-gray-200 text-gray-500'}`}>{closedAds.length}</span>
                </button>
            </div>

            <div className="space-y-4">
                {displayedAds.length === 0 ? (
                    <div className={`p-12 rounded-2xl border border-dashed text-center flex flex-col items-center justify-center gap-2 ${brand.theme === 'dark' ? 'bg-gray-900 border-gray-800' : 'bg-gray-50/50 border-gray-200'} `}>
                        <List size={32} className="text-gray-300" />
                        <p className="text-gray-400 font-bold">{activeTab === 'ongoing' ? '진행중인 공고가 없습니다.' : '마감된 공고가 없습니다.'}</p>
                    </div>
                ) : (
                    displayedAds.map((ad: any) => (
                        <div key={ad.id} className={`p-6 rounded-2xl border transition shadow-sm ${brand.theme === 'dark' ? 'bg-gray-900 border-gray-800 hover:bg-gray-800/50' : 'bg-white border-gray-100 hover:shadow-md'} `}>
                            <div className="flex flex-col md:flex-row justify-between gap-4">
                                <div className="space-y-2 flex-1 min-w-0">
                                    <div className="flex gap-2 text-[11px] items-center font-black">
                                        <span className={`${
                                            (ad?.status === 'rejected' || ad?.status === 'REJECTED') ? 'bg-red-100 text-red-500' :
                                            (ad?.status === 'active' || ad?.status === 'ACTIVE') ? 'bg-green-100 text-green-600' :
                                            (ad?.status === 'PENDING_REVIEW' || ad?.status === 'pending_review') ? 'bg-orange-100 text-orange-500' :
                                            (activeTab === 'ongoing' ? 'bg-blue-100 text-blue-500' : 'bg-gray-200 text-gray-500')
                                        } px-2 py-0.5 rounded shadow-sm`}>
                                            {(ad?.status === 'rejected' || ad?.status === 'REJECTED') ? '반려' :
                                             (ad?.status === 'active' || ad?.status === 'ACTIVE') ? '광고게시중' :
                                             (ad?.status === 'PENDING_REVIEW' || ad?.status === 'pending_review') ? '심사중' :
                                             (activeTab === 'ongoing' ? '진행중' : '마감')}
                                        </span>
                                        <div className="flex flex-col text-gray-400">
                                            {(ad?.status === 'active' || ad?.status === 'ACTIVE') ? (
                                                <span>마감일: {ad?.deadline || '미정'}</span>
                                            ) : (
                                                <span>신청일: {ad?.created_at ? new Date(ad.created_at).toLocaleDateString() : '날짜 없음'}</span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Title & Tier/Icon Badges (Stacked Layout) */}
                                    <div className="flex flex-col gap-2 mb-3">
                                        {/* Tier & Options Line */}
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                            {/* Tier Code Badge (Mirroring Payments: bg-gray-900) */}
                                            <span className="bg-gray-900 text-white text-[9px] px-1.5 py-0.5 rounded-sm font-black shadow-sm shrink-0 whitespace-nowrap">
                                                {(() => {
                                                    const pt = (ad?.productType || ad?.tier || ad?.product_type || ad?.ad_type || ad?.options?.product_type || 'p7').toLowerCase();
                                                    const adProduct = [
                                                        { id: 'p1', code: 'T1' }, { id: 'p2', code: 'T2' }, { id: 'p3', code: 'T3' },
                                                        { id: 'p4', code: 'T4' }, { id: 'p5', code: 'T5' }, { id: 'p6', code: 'T6' }, { id: 'p7', code: 'T7' }
                                                    ].find(tp => pt.includes(tp.id));

                                                    if (pt.includes('grand')) return 'T1';
                                                    if (pt.includes('premium')) return 'T2';
                                                    return adProduct?.code || (pt === 'p7' ? 'T7' : 'AD');
                                                })()}
                                            </span>

                                            {/* Option Mini Badges (PaymentsView Mapping) */}
                                            <div className="flex items-center gap-1 shrink-0">
                                                {(ad.options?.icon || ad.selectedIcon) && (
                                                    <span className="bg-indigo-500 text-white text-[9px] px-1.5 py-0.5 rounded-sm font-black shadow-sm">아</span>
                                                )}
                                                {(ad.options?.highlighter || ad.selectedHighlighter) && (
                                                    <span className="bg-gray-600 text-white text-[9px] px-1.5 py-0.5 rounded-sm font-black shadow-sm">형</span>
                                                )}
                                                {(ad.options?.border && ad.options?.border !== 'none' || (ad.borderOption && ad.borderOption !== 'none')) && (
                                                    <span className="bg-blue-500 text-white text-[9px] px-1.5 py-0.5 rounded-sm font-black shadow-sm">테</span>
                                                )}
                                                {(ad.options?.pay_suffixes?.length > 0 || ad.options?.paySuffixes?.length > 0 || (ad.paySuffixes || []).length > 0) && (
                                                    <span className="bg-blue-500 text-white text-[9px] px-1.5 py-0.5 rounded-sm font-black shadow-sm">급</span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Title Line (Under Badges) */}
                                        <h4
                                            onClick={() => onShowAdDetail?.(ad)}
                                            className={`font-black text-[17px] md:text-[19px] cursor-pointer hover:text-blue-500 transition leading-tight flex items-center gap-1.5 w-full ${brand.theme === 'dark' ? 'text-white' : 'text-gray-900'} `}
                                            style={getHighlighterStyle(ad.options?.highlighter || ad.selectedHighlighter)}
                                        >
                                            {(ad.options?.icon || ad.selectedIcon) && (
                                                <IconBadge iconId={ad.options?.icon || ad.selectedIcon} />
                                            )}
                                            {ad.title}
                                        </h4>

                                        {/* [New] Rejection Reason Display */}
                                        {(ad.status === 'rejected' || ad.status === 'REJECTED') && ad.rejection_reason && (
                                            <div className="mt-1 p-3 bg-red-50 border border-red-100 rounded-xl animate-in slide-in-from-top-1 duration-300">
                                                <div className="flex gap-2">
                                                    <span className="text-[10px] font-black text-red-600 bg-white px-1.5 py-0.5 rounded shadow-sm h-fit shrink-0">거절사유</span>
                                                    <p className="text-[12px] font-bold text-red-700 leading-snug">
                                                        {ad.rejection_reason}
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className={`text-xs font-bold ${brand.theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} `}>
                                        <span className="text-blue-600 font-extrabold uppercase">
                                            {(() => {
                                                const nick = ad.nickname || nickname || '';
                                                if (nick.includes('게스트') || nick === '관리자' || !nick) return '사업자';
                                                return nick;
                                            })()}
                                        </span>
                                        <span className="md:hidden"><br /></span>
                                        <span className="hidden md:inline"> | </span>
                                        {ad.regionCity || '지역 정보 없음'} {ad.regionGu || ''} | {ad.category || '종류'} | {ad.categorySub || '자유직종'}
                                    </div>
                                </div>
                                {(() => {
                                    // 승인 여부 — active 상태만 점프 허용
                                    const isApproved = ad?.status === 'active' || ad?.status === 'ACTIVE';

                                    // 잔여 수동 점프 횟수 계산
                                    const todayKST = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Seoul' });
                                    const tierKey = (ad.productType || ad.tier || ad.product_type || ad.ad_type || ad.options?.product_type || 'p7').toLowerCase();
                                    const jumpCfg = getJumpConfig(tierKey);
                                    const usedManual = ad.options?.last_manual_jump_date === todayKST
                                        ? (ad.options?.daily_manual_jump_count || 0) : 0;
                                    const remainManual = Math.max(0, jumpCfg.manual - usedManual);
                                    const usedAuto = ad.options?.last_auto_jump_date === todayKST
                                        ? (ad.options?.daily_auto_jump_count || 0) : 0;
                                    const remainAuto = Math.max(0, jumpCfg.auto - usedAuto);
                                    const autoEnabled = !!ad.options?.auto_jump_enabled;

                                    return (
                                        <div className="flex flex-col items-end gap-2 mt-3 md:mt-0 shrink-0 w-full md:w-auto">
                                            {/* 월간 수정 + 점프 잔여 */}
                                            <div className="flex items-center gap-2 flex-wrap justify-end">
                                                <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-gray-200 bg-gray-50 shadow-sm">
                                                    <span className="text-[14px]">📝</span>
                                                    <span className="text-[11px] font-black text-gray-500">월간 수정:</span>
                                                    <span className={`text-[12px] font-black ${(ad.edit_count || 0) >= 25 ? 'text-red-600' : 'text-gray-900'}`}>
                                                        {ad.edit_count || 0}
                                                    </span>
                                                    <span className="text-[11px] font-bold text-gray-400">/ 30회</span>
                                                </div>
                                                {/* 수동 점프 잔여 — 미승인 시 잠금 표시 */}
                                                <div className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border shadow-sm ${
                                                    !isApproved ? 'border-gray-200 bg-gray-50' :
                                                    remainManual === 0 ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'
                                                }`}>
                                                    <RefreshCw size={11} className={!isApproved ? 'text-gray-300' : remainManual === 0 ? 'text-red-400' : 'text-green-500'} />
                                                    <span className={`text-[11px] font-black ${!isApproved ? 'text-gray-400' : remainManual === 0 ? 'text-red-500' : 'text-green-700'}`}>
                                                        {!isApproved ? '점프 잠김' : `수동 ${remainManual}/${jumpCfg.manual}`}
                                                    </span>
                                                </div>
                                                {/* 자동 점프 잔여 (지원 tier + 승인된 광고만) */}
                                                {jumpCfg.auto > 0 && (
                                                    <div className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border shadow-sm ${
                                                        !isApproved ? 'border-gray-200 bg-gray-50' :
                                                        autoEnabled ? (remainAuto === 0 ? 'border-orange-200 bg-orange-50' : 'border-blue-200 bg-blue-50') : 'border-gray-200 bg-gray-50'
                                                    }`}>
                                                        <Zap size={11} className={!isApproved ? 'text-gray-300' : autoEnabled ? (remainAuto === 0 ? 'text-orange-400' : 'text-blue-500') : 'text-gray-400'} />
                                                        <span className={`text-[11px] font-black ${!isApproved ? 'text-gray-400' : autoEnabled ? (remainAuto === 0 ? 'text-orange-500' : 'text-blue-600') : 'text-gray-400'}`}>
                                                            {!isApproved ? '자동 잠김' : autoEnabled ? `${remainAuto}/${jumpCfg.auto}` : 'OFF'}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* 버튼 영역 */}
                                            <div className="flex flex-wrap gap-1.5 items-center justify-end w-full md:w-auto">
                                                <button onClick={() => handleAdClick(false, ad)} className="px-3 py-2 border border-blue-200 text-blue-500 text-xs font-bold rounded-lg hover:bg-blue-50 transition">
                                                    수정
                                                </button>
                                                <button
                                                    onClick={() => onJumpAd?.(String(ad.id))}
                                                    disabled={!isApproved || remainManual === 0}
                                                    title={
                                                        !isApproved ? '관리자 승인 후 점프 이용 가능' :
                                                        remainManual === 0 ? `오늘 수동 점프 소진 (${jumpCfg.manual}/${jumpCfg.manual}회)` :
                                                        `수동 점프 (잔여 ${remainManual}회)`
                                                    }
                                                    className={`flex items-center gap-1.5 px-3 py-2 text-white text-xs font-black rounded-lg shadow-sm transition active:scale-95 ${
                                                        !isApproved || remainManual === 0 ? 'bg-gray-400 cursor-not-allowed opacity-60' : 'bg-green-500 hover:bg-green-600'
                                                    }`}
                                                >
                                                    <RefreshCw size={12} />
                                                    {!isApproved ? '승인대기' : `점프 ${remainManual}/${jumpCfg.manual}`}
                                                </button>
                                                {/* 자동 점프 ON/OFF (지원 tier + 승인된 광고만) */}
                                                {jumpCfg.auto > 0 && (
                                                    <button
                                                        onClick={() => isApproved && onToggleAutoJump?.(String(ad.id), !autoEnabled)}
                                                        disabled={!isApproved}
                                                        title={!isApproved ? '관리자 승인 후 자동 점프 설정 가능' : autoEnabled ? '자동 점프 끄기' : '자동 점프 켜기'}
                                                        className={`flex items-center gap-1.5 px-3 py-2 text-xs font-black rounded-lg border-2 transition active:scale-95 ${
                                                            !isApproved ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed opacity-60' :
                                                            autoEnabled ? 'bg-blue-500 border-blue-500 text-white shadow-sm shadow-blue-500/30' :
                                                            'bg-white border-gray-300 text-gray-500 hover:border-blue-400'
                                                        }`}
                                                    >
                                                        <Zap size={12} /> 자동{autoEnabled ? ' ON' : ' OFF'}
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => onExtendAd?.(ad)}
                                                    className="flex items-center gap-1.5 px-3 py-2 bg-blue-500 text-white text-xs font-black rounded-lg hover:bg-blue-600 shadow-sm transition active:scale-95"
                                                >
                                                    <Calendar size={12} /> 연장
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); !isApproved && onDeleteAd?.(ad.id); }}
                                                    disabled={isApproved}
                                                    title={isApproved ? "게시 중인 공고는 삭제할 수 없습니다." : "공고 삭제"}
                                                    className={`px-3 py-2 text-xs font-bold rounded-lg transition-all ${
                                                        isApproved 
                                                            ? 'bg-gray-100 border border-gray-200 text-gray-400 cursor-not-allowed opacity-60' 
                                                            : 'bg-[#ef4444] text-white border-2 border-[#dc2626] hover:bg-red-600 cursor-pointer'
                                                    }`}
                                                >
                                                    삭제
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })()}
                            </div>

                            {/* Bottom Action Area (Applicants) */}
                            <div className={`px-5 py-3 flex flex-wrap items-center justify-between gap-3 mt-4 -mx-6 mb-[-24px] border-t ${brand.theme === 'dark' ? 'bg-gray-800/30 border-gray-800' : 'bg-gray-50 border-gray-100'}`}>
                                <button
                                    onClick={() => setView('applicants')}
                                    className="bg-gray-900 text-white px-4 py-2 text-[12px] font-black rounded-xl shadow-lg hover:bg-black transition active:scale-95"
                                >
                                    온라인 인재관리
                                </button>
                                <div className="flex gap-4 text-[13px] font-black"></div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
export default BusinessDashboard;
