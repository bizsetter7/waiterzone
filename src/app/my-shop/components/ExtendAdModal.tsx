'use client';

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Calendar } from 'lucide-react';
import { DETAILED_PRICING } from '../constants';

interface ExtendAdModalProps {
    ad: any;
    brand: any;
    onConfirm: (adId: string, period: 30 | 60 | 90, amount: number) => void;
    onClose: () => void;
}

export function ExtendAdModal({ ad, brand, onConfirm, onClose }: ExtendAdModalProps) {
    const [period, setPeriod] = useState<30 | 60 | 90>(30);
    const isDark = brand?.theme === 'dark';

    // 광고 등급 → DETAILED_PRICING 매칭 (p1~p7, grand/premium/... altId, 한글 tier명 모두 대응)
    const rawTier = (ad?.productType || ad?.tier || ad?.product_type || ad?.ad_type || ad?.options?.product_type || 'p7').toLowerCase();
    const pricing =
        DETAILED_PRICING.find(p =>
            rawTier === p.id ||
            (p.altId && rawTier === p.altId) ||
            (p.altId && rawTier.includes(p.altId)) ||
            rawTier === p.code?.toLowerCase() ||
            rawTier.includes((p.tier || '').toLowerCase())
        ) ?? DETAILED_PRICING.find(p => p.id === 'p7')!;

    const priceMap: Record<30 | 60 | 90, number> = {
        30: pricing.d30,
        60: pricing.d60,
        90: pricing.d90,
    };

    const amount = priceMap[period];

    // 현재 마감일 기준 + period일 → 예상 연장 마감일
    const baseDeadline = ad?.deadline ? new Date(ad.deadline) : new Date();
    if (!ad?.deadline) baseDeadline.setDate(baseDeadline.getDate()); // fallback: today
    const newDeadline = new Date(baseDeadline);
    newDeadline.setDate(newDeadline.getDate() + period);
    const deadlineStr = newDeadline.toLocaleDateString('ko-KR', {
        year: 'numeric', month: 'long', day: 'numeric',
    });

    if (typeof document === 'undefined') return null;

    return createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
            <div className={`rounded-[28px] shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-300 ${isDark ? 'bg-gray-900' : 'bg-white'}`}>

                {/* ── 헤더 ── */}
                <div className="bg-gradient-to-r from-blue-500 to-blue-700 px-6 py-5 text-white">
                    <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                                <Calendar size={20} />
                                <h2 className="text-xl font-black">광고 기간 연장</h2>
                            </div>
                            <p className="text-white/80 text-sm font-semibold truncate">
                                {ad?.title || '공고'}
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition shrink-0 ml-3"
                        >
                            <X size={16} />
                        </button>
                    </div>
                </div>

                <div className="p-6 space-y-5">
                    {/* ── 현재 등급 표시 ── */}
                    <div className={`flex items-center gap-3 p-3 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}>
                        <span className="bg-gray-900 text-white text-[10px] px-2 py-1 rounded font-black shrink-0">
                            {pricing.code}
                        </span>
                        <div>
                            <p className={`text-xs font-black ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                {pricing.tier} {pricing.eng}
                            </p>
                            <p className={`text-[11px] font-bold ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                현재 광고 등급
                            </p>
                        </div>
                    </div>

                    {/* ── 기간 선택 ── */}
                    <div>
                        <p className={`text-xs font-black mb-3 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                            연장 기간 선택
                        </p>
                        <div className="grid grid-cols-3 gap-2">
                            {([30, 60, 90] as const).map((p) => (
                                <button
                                    key={p}
                                    onClick={() => setPeriod(p)}
                                    className={`py-3 rounded-xl font-black text-sm transition border-2 ${
                                        period === p
                                            ? 'bg-blue-500 text-white border-blue-500 shadow-lg shadow-blue-500/30'
                                            : isDark
                                                ? 'bg-gray-800 text-gray-300 border-gray-700 hover:border-blue-500'
                                                : 'bg-gray-50 text-gray-700 border-gray-200 hover:border-blue-400'
                                    }`}
                                >
                                    {p}일
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* ── 금액 표시 ── */}
                    <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-center">
                        <p className="text-xs font-bold text-blue-500 mb-1">연장 금액</p>
                        <p className="text-3xl font-black text-blue-600">{amount.toLocaleString()}원</p>
                        <p className="text-xs text-blue-400 font-bold mt-1.5">
                            연장 후 마감일 : {deadlineStr}
                        </p>
                    </div>

                    {/* ── 안내 ── */}
                    <p className={`text-[11px] font-bold leading-relaxed ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                        * 입금 확인 후 관리자가 마감일을 연장 처리합니다.<br />
                        * 현재 마감일 기준으로 선택 기간이 추가됩니다.
                    </p>
                </div>

                {/* ── 버튼 ── */}
                <div className="px-6 pb-6 flex gap-3">
                    <button
                        onClick={onClose}
                        className={`flex-1 py-4 rounded-2xl font-black transition ${
                            isDark ? 'bg-gray-800 text-gray-400 hover:bg-gray-700' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                        }`}
                    >
                        취소
                    </button>
                    <button
                        onClick={() => onConfirm(String(ad.id), period, amount)}
                        className="flex-1 py-4 rounded-2xl bg-blue-500 text-white font-black hover:bg-blue-600 shadow-xl shadow-blue-500/20 transition active:scale-95"
                    >
                        연장 신청
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}
