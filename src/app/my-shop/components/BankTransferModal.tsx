'use client';

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { UI_Z_INDEX } from '@/constants/ui';

interface BankTransferModalProps {
    amount: number;
    onConfirm: () => void;
    title?: string; // 기본값: '공고가 접수되었습니다!' / 연장 시 '연장 신청이 접수되었습니다!'
}

export function BankTransferModal({ amount, onConfirm, title }: BankTransferModalProps) {
    const [copied, setCopied] = useState(false);

    const copyAccount = () => {
        navigator.clipboard.writeText('1002-4683-1712').then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    if (typeof document === 'undefined') return null;

    return createPortal(
        <div className="fixed inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4" style={{ zIndex: UI_Z_INDEX.MODAL }}>
            <div className="bg-white rounded-[28px] shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-300">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-500 to-rose-600 px-6 py-5 text-white text-center">
                    <div className="text-3xl mb-2">✅</div>
                    <h2 className="text-xl font-black">{title ?? '공고가 접수되었습니다!'}</h2>
                    <p className="text-white/80 text-sm mt-1 font-semibold">아래 계좌로 입금하시면 관리자 심사 후 광고가 노출됩니다.</p>
                </div>

                {/* Body */}
                <div className="p-6 space-y-4">
                    {/* Amount */}
                    <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-center">
                        <p className="text-xs font-bold text-rose-500 mb-1">입금 금액</p>
                        <p className="text-3xl font-black text-rose-600">{amount.toLocaleString()}원</p>
                    </div>

                    {/* Bank Info */}
                    <div className="bg-gray-50 rounded-2xl p-4 space-y-3">
                        <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-gray-400">은행</span>
                            <span className="font-black text-gray-800">토스뱅크</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-gray-400">계좌번호</span>
                            <button
                                onClick={copyAccount}
                                className="flex items-center gap-2 font-black text-gray-800 hover:text-blue-600 transition-colors"
                            >
                                <span>1002-4683-1712</span>
                                <span className={`text-xs px-2 py-0.5 rounded-full font-bold transition-all ${copied ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}`}>
                                    {copied ? '복사됨' : '복사'}
                                </span>
                            </button>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-gray-400">예금주</span>
                            <span className="font-black text-gray-800">고남우(초코아이디어)</span>
                        </div>
                    </div>

                    {/* Notice */}
                    <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4">
                        <p className="text-xs font-bold text-yellow-700 leading-relaxed">
                            📌 입금 시 <span className="font-black">업체명 또는 아이디</span>를 메모에 남겨주세요.<br />
                            입금 확인 후 보통 <span className="font-black">1~3시간 내</span> 광고가 활성화됩니다.<br />
                            문의:{' '}
                            <a href="https://t.me/waiterzone_cs_bot" target="_blank" rel="noopener noreferrer" className="underline font-black">텔레그램 @waiterzone_cs_bot</a>
                            {' '}또는 1:1문의
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 pb-6">
                    <button
                        onClick={onConfirm}
                        className="w-full py-4 bg-gradient-to-r from-blue-500 to-rose-600 text-white font-black text-base rounded-2xl shadow-lg hover:brightness-110 active:scale-[0.98] transition-all"
                    >
                        확인
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}
