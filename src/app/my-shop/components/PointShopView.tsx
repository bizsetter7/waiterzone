'use client';

import React, { useState } from 'react';
import { BrandConfig } from '@/lib/brand-config';
import { Zap, RefreshCw, Check, Copy, ExternalLink, AlertCircle, ChevronRight, X, Info } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface PointShopViewProps {
    brand: BrandConfig;
    shopName: string;
    userId: string;
    onOpenMenu?: () => void;
}

const SOS_PACKAGES = [
    { id: 'sos_10', points: 1000, price: 10000, bonus: 0 },
    { id: 'sos_30', points: 3150, price: 30000, bonus: 5 },
    { id: 'sos_50', points: 5500, price: 50000, bonus: 10 },
];

const JUMP_PACKAGES = [
    { id: 'jump_200',  count: 200,  price: 10000 },
    { id: 'jump_450',  count: 450,  price: 20000 },
    { id: 'jump_700',  count: 700,  price: 30000 },
    { id: 'jump_1200', count: 1200, price: 50000 },
    { id: 'jump_2000', count: 2000, price: 80000 },
];

export function PointShopView({ brand, shopName, userId, onOpenMenu }: PointShopViewProps) {
    const [activeTab, setActiveTab ] = useState<'sos' | 'jump'>('sos');
    const [selectedSosId, setSelectedSosId] = useState<string | null>(null);
    const [selectedJumpId, setSelectedJumpId] = useState<string | null>(null);
    const [showConfirm, setShowConfirm] = useState(false);
    const [submittedPkg, setSubmittedPkg] = useState<any | null>(null);
    const [copied, setCopied] = useState(false);
    const [showSosInfo, setShowSosInfo] = useState(false);
    
    // Safety check for brand
    if (!brand) return <div className="p-10 text-center font-bold">브랜드 설정을 불러올 수 없습니다.</div>;
    const isDark = brand.theme === 'dark';

    const copyAccount = () => {
        navigator.clipboard.writeText('1002-4683-1712').then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    const handleInitialSubmit = () => {
        setShowConfirm(true);
    };

    const handleFinalSubmit = async () => {
        const pkg = activeTab === 'sos'
            ? SOS_PACKAGES.find(p => p.id === selectedSosId)
            : JUMP_PACKAGES.find(p => p.id === selectedJumpId);
        if (!pkg) return;

        // DB에 충전 신청 기록
        if (userId) {
            const isPoint = 'points' in pkg;
            const chargeDesc = isPoint
                ? `SOS 포인트 충전 ${(pkg as any).points}P (${pkg.price.toLocaleString()}원)`
                : `점프 서비스 충전 ${(pkg as any).count}회 (${pkg.price.toLocaleString()}원)`;
            await supabase.from('payments').insert([{
                user_id: userId,
                amount: pkg.price,
                status: 'pending',
                method: 'bank_transfer',
                description: chargeDesc,
                metadata: {
                    type: isPoint ? 'point_charge' : 'jump_charge',
                    packageId: pkg.id,
                    shopName,
                    ...(isPoint ? { points: (pkg as any).points } : { count: (pkg as any).count })
                }
            }]);
        }

        setSubmittedPkg(pkg);
        setShowConfirm(false);
    };

    const canSubmit = activeTab === 'sos' ? !!selectedSosId : !!selectedJumpId;

    const currentPkg = activeTab === 'sos' 
        ? SOS_PACKAGES.find(p => p.id === selectedSosId)
        : JUMP_PACKAGES.find(p => p.id === selectedJumpId);

    return (
        <div className={`rounded-[32px] border shadow-sm p-4 md:p-6 lg:p-10 ${isDark ? 'bg-gray-950 border-gray-800 text-white' : 'bg-white border-gray-100'}`}>
            {/* Header (Margins compressed 70%) */}
            <div className="flex flex-col mb-4 md:mb-6">
                <div className="flex items-center justify-between mb-1">
                    <h2 className={`text-xl md:text-2xl font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>추가옵션 신청페이지</h2>
                    {!submittedPkg && !showConfirm && (
                        <button
                            onClick={handleInitialSubmit}
                            disabled={!canSubmit}
                            className={`px-5 md:px-7 py-2 md:py-2.5 rounded-xl text-xs md:text-sm font-black transition-all ${
                                canSubmit 
                                    ? 'bg-blue-600 text-white shadow-xl hover:bg-blue-700 active:scale-95' 
                                    : (isDark ? 'bg-gray-800 text-gray-700' : 'bg-gray-100 text-gray-300') + ' cursor-not-allowed'
                            }`}
                        >
                            신청하기
                        </button>
                    )}
                </div>
                
                <div className="text-[11px] md:text-xs font-bold text-gray-500 leading-relaxed border-t border-gray-100 dark:border-gray-800 pt-1.5">
                    <p className="text-gray-900 dark:text-white mb-0.5">※ 이용안내 및 주의사항</p>
                    <div className="hidden md:block">
                        모든 유료 옵션은 광고 진행 업체회원만 가능하며, 환불이 불가합니다.
                    </div>
                    <div className="block md:hidden space-y-0.5">
                        모든 유료 옵션은 광고 진행 업체회원만 가능하며, <br />
                        환불이 불가합니다.
                    </div>
                </div>
            </div>

            {!submittedPkg ? (
                <>
                    {showConfirm ? (
                        <div className="py-10 flex flex-col items-center justify-center animate-in zoom-in-95 duration-300">
                            <div className={`w-full max-w-sm p-8 rounded-[32px] border-2 border-blue-500 ${isDark ? 'bg-gray-900' : 'bg-blue-50/30'} text-center mb-8`}>
                                <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white mx-auto mb-6 shadow-xl shadow-blue-600/20">
                                    <Info size={32} />
                                </div>
                                <h3 className="text-xl font-black mb-2">선택 내용을 확인해주세요</h3>
                                <p className="text-sm font-bold text-gray-500 mb-6">아래 내용으로 신청하시겠습니까?</p>
                                
                                <div className={`p-5 rounded-2xl border mb-6 ${isDark ? 'bg-gray-950 border-gray-800' : 'bg-white border-blue-100'}`}>
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-xs font-bold text-gray-400">신청 서비스</span>
                                        <span className="text-sm font-black text-blue-600">{activeTab === 'sos' ? 'SOS 긴급구인' : '점프 서비스'}</span>
                                    </div>
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-xs font-bold text-gray-400">충전 내용</span>
                                        <span className="text-sm font-black">
                                            {currentPkg && ('points' in currentPkg ? `${currentPkg.points.toLocaleString()}P` : `${(currentPkg as any).count.toLocaleString()}회`)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center pt-2 border-t border-gray-100 dark:border-gray-800">
                                        <span className="text-xs font-bold text-gray-400">결제 금액</span>
                                        <span className="text-lg font-black text-rose-600">{currentPkg?.price.toLocaleString()}원</span>
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    <button 
                                        onClick={() => setShowConfirm(false)}
                                        className={`flex-1 py-4 rounded-xl font-black text-sm border transition ${isDark ? 'border-gray-800 text-gray-400 hover:bg-gray-800' : 'border-gray-200 text-gray-500 hover:bg-white'}`}
                                    >
                                        돌아가기
                                    </button>
                                    <button 
                                        onClick={handleFinalSubmit}
                                        className="flex-1 py-4 rounded-xl bg-blue-600 text-white font-black text-sm shadow-xl shadow-blue-600/20 hover:bg-blue-700 transition-all active:scale-95"
                                    >
                                        신청확인
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* Tab Selection */}
                            <div className={`flex p-1.5 rounded-2xl gap-1 ${isDark ? 'bg-gray-900' : 'bg-gray-100'}`}>
                                <button
                                    onClick={() => { setActiveTab('sos'); setSelectedJumpId(null); }}
                                    className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-[14px] text-sm font-black transition-all ${
                                        activeTab === 'sos'
                                            ? 'bg-white text-blue-600 shadow-lg'
                                            : 'text-gray-500 hover:text-gray-700 border border-transparent'
                                    }`}
                                >
                                    <Zap size={16} className={activeTab === 'sos' ? 'fill-blue-600' : ''} />
                                    SOS 긴급구인
                                </button>
                                <button
                                    onClick={() => { setActiveTab('jump'); setSelectedSosId(null); }}
                                    className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-[14px] text-sm font-black transition-all ${
                                        activeTab === 'jump'
                                            ? 'bg-[#0a0a0b] text-rose-500 shadow-lg'
                                            : 'text-gray-500 hover:text-gray-700 border border-transparent'
                                    }`}
                                >
                                    <RefreshCw size={16} className={activeTab === 'jump' ? 'animate-spin-slow' : ''} />
                                    점프 서비스
                                </button>
                            </div>

                            <div className="min-h-[300px] animate-in fade-in slide-in-from-bottom-2 duration-300">
                                {activeTab === 'sos' ? (
                                    <section className="space-y-6">
                                        <div className="flex flex-col gap-0.5 mb-4">
                                            <div className="flex items-center gap-2">
                                                <p className="!text-sm !font-black text-blue-600">🆘 SOS 긴급구인 안내</p>
                                                <button 
                                                    onClick={() => setShowSosInfo(!showSosInfo)}
                                                    className="px-2 py-0.5 rounded-md bg-blue-600 !text-[10px] !font-black text-white hover:bg-blue-700 shadow-sm whitespace-nowrap"
                                                >
                                                    (안내사항)
                                                </button>
                                            </div>
                                            <div className="flex flex-col md:flex-row md:gap-1 !text-[11px] md:!text-xs !font-bold text-gray-500 leading-tight">
                                                <p className="whitespace-nowrap">알림 수신을 동의한 회원들에게</p>
                                                <p className="whitespace-nowrap">메세지 발송기능!</p>
                                            </div>
                                        </div>

                                        {showSosInfo && (
                                            <div className="p-5 rounded-2xl border-2 border-blue-500 bg-blue-50/50 relative md:max-w-xs animate-in zoom-in-95 z-20">
                                                <button onClick={() => setShowSosInfo(false)} className="absolute top-3 right-3 text-blue-500"><X size={16}/></button>
                                                <div className="text-sm font-black text-blue-900 leading-snug pr-6">
                                                    SOS 긴급구인은 유료광고진행중인 <br /> 
                                                    업체회원만 사용할 수 있습니다.
                                                </div>
                                            </div>
                                        )}

                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                            {SOS_PACKAGES.map((pkg) => {
                                                const isSelected = selectedSosId === pkg.id;
                                                const basePoints = pkg.price / 10;
                                                return (
                                                    <button
                                                        key={pkg.id}
                                                        onClick={() => setSelectedSosId(isSelected ? null : pkg.id)}
                                                        className={`relative p-5 md:p-7 rounded-[28px] border-2 transition-all flex flex-col items-center justify-center text-center group ${
                                                            isSelected
                                                                ? 'border-blue-500 bg-blue-50/50 shadow-lg shadow-blue-500/10'
                                                                : isDark ? 'border-gray-800 bg-gray-900 hover:border-gray-700' : 'border-gray-200 bg-white hover:border-blue-200'
                                                        }`}
                                                    >
                                                        <div className="absolute top-4 right-4">
                                                            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${isSelected ? 'border-blue-500 bg-blue-500' : 'border-gray-300'}`}>
                                                                {isSelected && <Check size={10} className="text-white" />}
                                                            </div>
                                                        </div>
                                                        {pkg.bonus > 0 && (
                                                            <span className="mb-3 bg-gradient-to-r from-rose-500 to-orange-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full shadow-sm animate-bounce">
                                                                +{pkg.bonus}% BONUS
                                                            </span>
                                                        )}
                                                        <p className={`text-xl md:text-2xl font-black mb-1 ${isSelected ? 'text-blue-600' : isDark ? 'text-white' : 'text-gray-900'}`}>
                                                            {basePoints.toLocaleString()}P<span className="text-[10px] ml-1 opacity-60">(포인트)</span>
                                                        </p>
                                                        <p className={`text-xs md:text-sm font-bold ${isSelected ? 'text-blue-500' : 'text-gray-400'}`}>
                                                            ({pkg.price === 10000 ? '1만원' : pkg.price === 30000 ? '3만원' : '5만원'})
                                                        </p>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </section>
                                ) : (
                                    <section className="space-y-4">
                                        <div className="bg-[#0a0a0b] rounded-[32px] p-6 md:p-10 border border-white/5 relative overflow-hidden shadow-2xl">
                                            <div className="absolute -top-10 -right-10 w-48 h-48 bg-rose-600/10 blur-[80px] rounded-full" />
                                            <div className="relative z-10">
                                                <div className="mb-6">
                                                    <p className="text-white !text-sm md:!text-sm !font-black leading-tight">
                                                        리스트 최상단으로 점프
                                                    </p>
                                                    <p className="text-gray-500 !text-[11px] md:!text-xs !font-bold">
                                                        (단, 해당광고등급 내에서 적용)
                                                    </p>
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
                                                    {JUMP_PACKAGES.map((pkg) => {
                                                        const isSelected = selectedJumpId === pkg.id;
                                                        return (
                                                            <button
                                                                key={pkg.id}
                                                                onClick={() => setSelectedJumpId(isSelected ? null : pkg.id)}
                                                                className={`relative p-5 md:p-8 rounded-2xl border-2 transition-all flex flex-col items-center justify-center text-center ${
                                                                    isSelected
                                                                        ? 'bg-rose-500/10 border-rose-500 shadow-lg shadow-rose-500/20 scale-[1.02]'
                                                                        : 'bg-white/5 border-transparent hover:bg-white/[0.08] hover:border-white/10'
                                                                }`}
                                                            >
                                                                <div className="absolute top-3 right-3">
                                                                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${isSelected ? 'border-rose-500 bg-rose-500' : 'border-white/20'}`}>
                                                                        {isSelected && <Check size={10} className="text-white" />}
                                                                    </div>
                                                                </div>
                                                                <p className="text-base md:text-lg font-black text-white mb-1 whitespace-nowrap">
                                                                    {pkg.count.toLocaleString()}회 점프충전
                                                                </p>
                                                                <p className={`text-sm md:text-base font-bold ${isSelected ? 'text-rose-400' : 'text-gray-500'}`}>
                                                                    ({pkg.price.toLocaleString()}원)
                                                                </p>
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        </div>
                                    </section>
                                )}
                            </div>
                        </div>
                    )}
                </>
            ) : (
                <div className="space-y-6 max-w-md mx-auto py-2 animate-in zoom-in-95 duration-300">
                    <div className="bg-gradient-to-br from-blue-600 to-rose-600 text-white rounded-[28px] p-8 text-center shadow-2xl relative overflow-hidden">
                        <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Check size={28} />
                        </div>
                        <p className="font-black text-xl">충전 신청 완료!</p>
                        <p className="text-white/80 text-sm mt-1 font-bold">아래 계좌로 입금 시 확인 후 바로 반영처리됩니다.</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className={`p-5 rounded-2xl border text-center ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-gray-50 border-gray-100'}`}>
                            <p className="text-xs font-bold text-gray-400 mb-1">입금 금액</p>
                            <p className="text-xl font-black text-rose-600">{submittedPkg!.price.toLocaleString()}원</p>
                        </div>
                        <div className={`p-5 rounded-2xl border text-center ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-gray-50 border-gray-100'}`}>
                            <p className="text-xs font-bold text-gray-400 mb-1">충전 내용</p>
                            <p className="text-xl font-black text-blue-600">
                                {'points' in submittedPkg! ? `${submittedPkg.points.toLocaleString()}P` : `${(submittedPkg as any).count.toLocaleString()}회`}
                            </p>
                        </div>
                    </div>

                    <div className={`rounded-[28px] p-8 space-y-4 border ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200 shadow-sm'}`}>
                        <div className="flex justify-between items-center group cursor-pointer" onClick={copyAccount}>
                            <div className="flex flex-col">
                                <span className="text-xs font-bold text-gray-400 mb-1">입금 계좌 (토스뱅크)</span>
                                <span className="text-lg font-black group-hover:text-blue-600 transition-colors tracking-tight">1002-4683-1712</span>
                            </div>
                            <div className={`px-3 py-1.5 rounded-xl font-black text-xs transition-all ${copied ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-500'}`}>
                                {copied ? '복사됨' : '복사'}
                            </div>
                        </div>
                        <div className="flex flex-col gap-1">
                            <div className="flex justify-between items-center text-sm">
                                <span className="font-bold text-gray-400">예금주</span>
                                <span className="font-black">고남우(초코아이디어)</span>
                            </div>
                            <p className="text-[10px] md:text-xs font-black text-rose-500 text-right mt-1">※입금시 예금주는 아이디를 기재해주세요.</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
