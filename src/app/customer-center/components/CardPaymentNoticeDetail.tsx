'use client';

import React from 'react';
import { CreditCard, AlertTriangle, Phone } from 'lucide-react';

export const CardPaymentNoticeDetail = () => {
    const pinkColor = "#FF1B51";

    return (
        <div className="flex flex-col py-6 md:py-10 max-w-4xl mx-auto space-y-8 font-sans">
            {/* Visual Header */}
            <div className="text-center space-y-4">
                <div
                    className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-rose-100"
                    style={{ color: pinkColor }}
                >
                    <CreditCard size={32} />
                </div>
                <h4 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tighter break-keep">
                    카드 결제 서비스 종료 및<br className="hidden md:block" />
                    무통장 입금 방식 전환 안내
                </h4>
            </div>

            {/* Content Box */}
            <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 p-6 md:p-10 shadow-sm space-y-8">
                <div className="space-y-4">
                    <div className="flex items-center gap-2 text-gray-900 dark:text-white font-bold text-lg">
                        <AlertTriangle size={20} style={{ color: pinkColor }} />
                        <span>서비스 변경 안내</span>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 leading-relaxed break-keep font-medium">
                        안녕하세요. <span className="font-bold text-gray-900 dark:text-white">COCO 웨이터존</span>입니다.<br className="hidden md:block" />
                        현재 카드사 및 결제 시스템 상의 정책 변경으로 인해, 부득이하게 카드 결제 기능이 종료됨을 안내드립니다.
                    </p>

                    <div className="bg-gray-50 dark:bg-gray-700/50 p-6 rounded-2xl border-l-4" style={{ borderColor: pinkColor }}>
                        <ul className="space-y-3">
                            <li className="flex items-start gap-2 text-sm md:text-base">
                                <span className="font-bold whitespace-nowrap" style={{ color: pinkColor }}>• 종료 일시:</span>
                                <span className="font-black text-gray-900 dark:text-white">2025년 6월 21일(토) 00:00부</span>
                            </li>
                            <li className="flex items-start gap-2 text-sm md:text-base">
                                <span className="font-bold whitespace-nowrap" style={{ color: pinkColor }}>• 변경 사항:</span>
                                <span className="font-medium text-gray-800 dark:text-gray-200">채용 공고 등록 시 무통장 입금만 이용 가능</span>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="space-y-4 font-medium leading-relaxed break-keep text-gray-600 dark:text-gray-400 text-[13px] md:text-sm">
                    <p className="flex gap-2">
                        <span className="shrink-0 text-red-500">📌</span>
                        <span>카드사 측 분류 기준에 따라 프리미엄 업종은 카드 결제 등록이 제한된 업종에 해당되며,<br className="hidden md:block" /> 이로 인해 본 사이트에서도 카드 결제 기능을 종료하게 된 점 양해 부탁드립니다.</span>
                    </p>
                    <p className="flex gap-2">
                        <span className="shrink-0 text-red-500">📌</span>
                        <span>추후 결제 환경이 개선될 경우 카드 결제 기능이 다시 제공될 수 있으며,<br className="hidden md:block" /> 관련 내용은 별도 공지를 통해 안내드리겠습니다.</span>
                    </p>
                </div>

                <p className="text-center pt-4 text-gray-500 text-xs md:text-sm font-bold border-t border-gray-50 break-keep">
                    항상 웨이터존를 이용해 주셔서 감사드리며,<br className="hidden md:block" />
                    보다 안정적인 서비스 제공을 위해 노력하겠습니다.<br className="hidden md:block" />
                    감사합니다.
                </p>
            </div>

            <div className="py-6 px-6 rounded-[28px] flex flex-col items-center justify-center text-white shadow-xl shadow-rose-100" style={{ backgroundColor: pinkColor }}>
                <div className="flex items-center gap-2 mb-2">
                    <Phone size={22} fill="white" className="animate-pulse" />
                    <span className="text-xl md:text-2xl font-black">웨이터존 고객센터 1877-1442</span>
                </div>
                <p className="text-[10px] opacity-80 uppercase tracking-[0.2em] font-black">COPYRIGHT(C) 2026 COCOALBA ALL RIGHTS RESERVED.</p>
            </div>
        </div>
    );
};
