'use client';

import React from 'react';
import { useBrand } from '@/components/BrandProvider';
import { CreditCard, AlertCircle, ChevronLeft, Phone, Info } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function CardNoticePage() {
    const router = useRouter();

    const pinkColor = "#FF1B51"; // Vivid Pink from user screenshot
    const goldColor = "#D4AF37"; // Gold from login button

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
            {/* Header Area */}
            <div className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 sticky top-0 z-50">
                <div className="container mx-auto px-4 h-14 flex items-center gap-3">
                    <button onClick={() => router.back()} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
                        <ChevronLeft size={24} />
                    </button>
                    <h1 className="text-lg font-bold truncate">공지사항</h1>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="container mx-auto px-4 py-8 max-w-2xl">
                <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl overflow-hidden border border-gray-100 dark:border-gray-700">

                    {/* Visual Banner Part */}
                    <div className="p-8 pb-4 text-center">
                        <div
                            className="w-20 h-20 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-6"
                            style={{ color: pinkColor }}
                        >
                            <CreditCard size={40} strokeWidth={1.5} />
                        </div>

                        <h2 className="text-2xl md:text-3xl font-black tracking-tighter text-gray-900 dark:text-white mb-4 break-keep">
                            카드 결제 서비스 종료 및<br />
                            무통장 입금 방식 전환 안내
                        </h2>

                        <div className="inline-block px-4 py-1.5 rounded-full bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm font-bold mb-8">
                            중요 공지
                        </div>
                    </div>

                    {/* Detailed Content */}
                    <div className="px-8 pb-10 space-y-8">
                        <section className="space-y-4">
                            <div className="flex items-center gap-2 text-gray-900 dark:text-white font-bold text-lg">
                                <AlertCircle size={20} style={{ color: pinkColor }} />
                                <span>서비스 변경 안내</span>
                            </div>
                            <p className="text-gray-600 dark:text-gray-400 leading-relaxed break-keep">
                                안녕하세요. <span className="font-bold text-gray-900 dark:text-white">COCO 웨이터존</span>입니다.<br />
                                현재 카드사 및 결제 시스템 상의 정책 변경으로 인해, 부득이하게 카드 결제 기능이 종료됨을 안내드립니다.
                            </p>

                            <div className="bg-gray-50 dark:bg-gray-700/50 p-6 rounded-2xl border-l-4" style={{ borderColor: pinkColor }}>
                                <ul className="space-y-3">
                                    <li className="flex items-start gap-2">
                                        <span className="font-bold whitespace-nowrap" style={{ color: pinkColor }}>• 종료 일시:</span>
                                        <span className="font-black text-gray-900 dark:text-white">2025년 6월 21일(토) 00:00부</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="font-bold whitespace-nowrap" style={{ color: pinkColor }}>• 변경 사항:</span>
                                        <span className="font-medium text-gray-800 dark:text-gray-200">채용 공고 등록 시 무통장 입금만 이용 가능</span>
                                    </li>
                                </ul>
                            </div>
                        </section>

                        <section className="space-y-4">
                            <div className="flex items-center gap-2 text-gray-900 dark:text-white font-bold text-lg">
                                <Info size={20} style={{ color: goldColor }} />
                                <span>참고 및 유의사항</span>
                            </div>
                            <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
                                <p className="flex gap-2">
                                    <span className="shrink-0">📌</span>
                                    <span>기존 결제 건은 종료 시점까지 정상 이용 가능하오니, 가급적 6월 21일 전까지 결제를 완료해 주시기 바랍니다.</span>
                                </p>
                                <p className="flex gap-2">
                                    <span className="shrink-0">📌</span>
                                    <span>카드사 측 프리미엄 업종 카드 결제 등록 정책에 따른 조치이오니 사장님들의 넓은 양해 부탁드립니다.</span>
                                </p>
                                <p className="flex gap-2">
                                    <span className="shrink-0">📌</span>
                                    <span>추후 결제 환경이 개선될 경우 카드 결제 기능의 재도입 여부를 별도 공지로 안내드리겠습니다.</span>
                                </p>
                            </div>
                        </section>

                        <p className="text-center pt-4 text-gray-500 text-sm font-medium">
                            항상 웨이터존를 이용해 주셔서 감사드리며,<br />
                            보다 안정적인 서비스 제공을 위해 노력하겠습니다.
                        </p>
                    </div>

                    {/* Branded Footer Bar - Matching user screenshot exactly */}
                    <div
                        className="py-6 flex flex-col items-center justify-center text-white"
                        style={{ backgroundColor: pinkColor }}
                    >
                        <div className="flex items-center gap-2 mb-1">
                            <Phone size={20} fill="white" />
                            <span className="text-xl md:text-2xl font-black">웨이터존 고객센터 1877-1442</span>
                        </div>
                        <p className="text-[10px] opacity-70 uppercase tracking-widest font-bold">
                            Copyright(c) 2026 COCOALBA All Rights Reserved.
                        </p>
                    </div>
                </div>

                {/* Return Button */}
                <button
                    onClick={() => router.push('/')}
                    className="w-full mt-8 py-4 rounded-2xl text-white font-bold transition-transform active:scale-95 shadow-lg"
                    style={{ backgroundColor: goldColor }}
                >
                    메인으로 돌아가기
                </button>
            </div>
        </div>
    );
}
