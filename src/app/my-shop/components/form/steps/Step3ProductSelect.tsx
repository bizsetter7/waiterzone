'use client';

import React from 'react';
import { Award, Zap, Gift } from 'lucide-react';
import { DETAILED_PRICING } from '../../../constants';

interface Step3Props {
    brand: any;
    selectedAdProduct: string | null;
    setSelectedAdProduct: (v: string | null) => void;
    selectedAdPeriod: number;
    setSelectedAdPeriod: (v: number) => void;
    isNewEntry?: boolean;
}

export const Step3ProductSelect: React.FC<Step3Props> = ({
    brand, selectedAdProduct, setSelectedAdProduct, selectedAdPeriod, setSelectedAdPeriod, isNewEntry
}) => {
    // 그랜드부터 베이직까지만 필터링 (순서 보장)
    const mainProducts = DETAILED_PRICING.filter(p => p.isMain);
    // 이벤트 상품 (isMain: false, d30 === 0)
    const eventProduct = DETAILED_PRICING.find(p => p.id === 'p7e');

    const handleEventSelect = () => {
        if (isNewEntry === false) {
            alert('등록한 옵션은 변경이 불가합니다.\nstep1, step2의 영역만 수정가능.');
            return;
        }
        if (eventProduct) {
            setSelectedAdProduct(eventProduct.id);
            setSelectedAdPeriod(30);
        }
    };

    return (
        <section id="myshop-step-3" className={`p-1.5 md:p-5 rounded-[32px] shadow-lg border-2 overflow-hidden ${brand.theme === 'dark' ? 'bg-gradient-to-br from-purple-950 via-gray-900 to-gray-950 border-purple-900/50' : 'bg-gradient-to-br from-purple-50 via-white to-fuchsia-50 border-purple-200'}`}>
            <div className="bg-gradient-to-r from-purple-600 via-fuchsia-500 to-purple-600 text-white p-3 md:p-5 rounded-2xl mb-4 md:mb-6 shadow-xl text-center md:text-left">
                <h2 className="font-black text-base md:text-xl flex flex-col md:flex-row md:items-center justify-center md:justify-start gap-1 md:gap-2">
                    <div className="flex items-center justify-center gap-1.5">
                        <Award size={22} className="text-white shrink-0" />
                        <span>STEP 3: 광고 타입 선택</span>
                    </div>
                    <span className="text-[12px] md:text-lg opacity-80 font-bold">(7개 타입중 택1)</span>
                </h2>
                <p className="text-[11px] md:text-[13px] font-bold opacity-90 mt-2 break-keep leading-tight">
                    기본부터 그랜드까지 광고 등급을 선택해주세요.<br className="md:hidden" /> 높은 타입일수록 더 많은 노출 혜택을 받습니다.
                </p>
            </div>

            {/* 실시간 노출 최적화 안내 박스 */}
            <div className={`mx-0.5 mb-5 p-3 rounded-xl border flex items-center justify-center gap-2 ${brand.theme === 'dark' ? 'bg-indigo-950/30 border-indigo-900/50 text-indigo-300' : 'bg-indigo-50 border-indigo-100 text-indigo-600'}`}>
                <Zap size={14} className="animate-pulse shrink-0" />
                <span className="text-[11px] md:text-[13px] font-black italic">광고 타입별 선택 (실시간 노출 최적화 적용됨)</span>
            </div>

            {/* 오픈기념 무료 이벤트 상품 카드 */}
            {eventProduct && (
                <div
                    onClick={handleEventSelect}
                    className={`mb-4 mx-0.5 p-3 md:p-5 rounded-[20px] border-2 cursor-pointer transition-all duration-300 flex items-center justify-between gap-3
                        ${selectedAdProduct === 'p7e'
                            ? 'border-emerald-500 bg-emerald-50 shadow-lg shadow-emerald-100'
                            : 'border-emerald-300 bg-white hover:border-emerald-400 hover:shadow-md'
                        }`}
                >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${selectedAdProduct === 'p7e' ? 'bg-emerald-500' : 'bg-emerald-100'}`}>
                            <Gift size={20} className={selectedAdProduct === 'p7e' ? 'text-white' : 'text-emerald-600'} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                                <span className="text-[9px] md:text-[10px] font-black bg-emerald-500 text-white px-2 py-0.5 rounded-full">오픈기념 FREE</span>
                                <span className="text-[9px] md:text-[10px] font-black text-red-500">선착순 10개 업소</span>
                                {selectedAdProduct === 'p7e' && <span className="text-[9px] md:text-[10px] font-black bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">선택 완료</span>}
                            </div>
                            <h3 className="text-[14px] md:text-[16px] font-black text-emerald-700 leading-tight">오픈기념 무료 베이직</h3>
                            <p className="text-[10px] md:text-[11px] text-gray-500 font-bold mt-0.5">최신 구인정보 리스트 · Step4 옵션 추가 가능</p>
                        </div>
                    </div>
                    <div className="text-right shrink-0">
                        <div className="text-[11px] text-gray-400 font-bold line-through">60,000원</div>
                        <div className="text-[18px] md:text-[22px] font-black text-emerald-600 leading-tight">0원</div>
                        <div className="text-[9px] text-gray-400 font-bold">30일</div>
                    </div>
                </div>
            )}

            {/* 그리드 설정: 모바일 2열(grid-cols-2), PC 3열(lg:grid-cols-3) */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-5 pb-3">
                {mainProducts.map((p: any, index: number) => {
                    const typeLabel = `Type ${index + 1}`;
                    return (
                        <div
                            key={p.id}
                            className={`p-3 md:p-6 rounded-[24px] border-2 transition-all duration-300 flex items-center justify-between gap-2.5 md:gap-4 ${selectedAdProduct === p.id
                                ? (p.code === 'T1' ? 'border-amber-400 bg-white shadow-xl shadow-amber-100' :
                                    p.code === 'T2' ? 'border-red-500 bg-white shadow-xl shadow-red-100' :
                                        p.code === 'T3' ? 'border-blue-500 bg-white shadow-xl shadow-blue-100' :
                                            'border-purple-500 bg-white shadow-xl shadow-purple-100')
                                : 'border-gray-100 md:border-gray-200 bg-white/60 hover:border-purple-400 md:hover:border-purple-400 hover:shadow-2xl hover:shadow-purple-100/50 hover:bg-white'}`}
                        >
                            {/* 왼쪽: 상품 정보 */}
                            <div className="flex-1 flex flex-col justify-center py-0.5 min-w-0">
                                <div className="flex items-center justify-between mb-2">
                                    <span className={`px-2 py-0.5 rounded-md text-[8px] md:text-[10px] font-black tracking-tight ${selectedAdProduct === p.id
                                        ? (p.code === 'T1' ? 'bg-amber-500 text-white' :
                                            p.code === 'T2' ? 'bg-red-600 text-white' :
                                                p.code === 'T3' ? 'bg-blue-600 text-white' :
                                                    'bg-purple-600 text-white')
                                        : 'bg-gray-100 text-gray-400'}`}>
                                        {selectedAdProduct === p.id ? '선택 완료' : '광고 상품'}
                                    </span>
                                    {selectedAdProduct === p.id && <Award size={16} className={`${p.color.replace('text-', 'text-')} shrink-0`} />}
                                </div>
                                <div className="mb-2.5">
                                    <div className={`text-[9px] md:text-[11px] font-black mb-0.5 opacity-60 ${p.color}`}>{p.code}</div>
                                    <h3 className={`text-[18px] md:text-[24px] font-black leading-tight tracking-tighter ${p.color}`}>{p.tier}</h3>
                                    <div className={`text-[10px] md:text-[12px] font-bold opacity-70 italic ${p.color}`}>{p.eng || ''}</div>
                                </div>
                                <p className="text-[10px] md:text-[12px] text-gray-500 font-bold whitespace-pre-line leading-tight opacity-90 break-keep">
                                    {p.desc}
                                </p>
                                {/* 점프 기본 제공 횟수 */}
                                {p.jumpManual > 0 && (
                                    <div className="mt-2 flex items-center gap-1 flex-wrap">
                                        <span className="text-[8px] md:text-[9px] font-black bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full whitespace-nowrap">
                                            수동 {p.jumpManual}회/일
                                        </span>
                                        {p.jumpAuto > 0 ? (
                                            <span className="text-[8px] md:text-[9px] font-black bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full whitespace-nowrap">
                                                자동 {p.jumpAuto}회/일
                                            </span>
                                        ) : (
                                            <span className="text-[8px] md:text-[9px] font-black bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded-full whitespace-nowrap">
                                                자동없음
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* 세로 구분선 (PC 전용) */}
                            <div className="w-px h-12 bg-gray-200 hidden md:block opacity-50 shrink-0"></div>

                            {/* 오른쪽: 기간 선택 버튼 (모바일 너비 추가 축소: 72px -> 68px) */}
                            <div className="w-[68px] md:w-[125px] flex flex-col gap-1.5 shrink-0">
                                {[30, 60, 90].map((days) => {
                                    const price = days === 30 ? p.d30 : days === 60 ? p.d60 : p.d90;
                                    const isSelected = selectedAdProduct === p.id && selectedAdPeriod === days;

                                    return (
                                        <button
                                            key={days}
                                            type="button"
                                            onClick={() => {
                                                if (isNewEntry === false) {
                                                    alert('등록한 옵션은 변경이 불가합니다.\nstep1, step2의 영역만 수정가능.');
                                                    return;
                                                }
                                                setSelectedAdProduct(p.id);
                                                setSelectedAdPeriod(days);
                                            }}
                                            className={`flex flex-col items-center justify-center p-1 md:p-2.5 rounded-lg md:rounded-xl border transition-all duration-200 ${isSelected ? 'border-purple-500 bg-purple-50 ring-1 ring-purple-500' : 'border-gray-300 md:border-gray-100 bg-white hover:border-purple-300 hover:shadow-sm'}`}
                                        >
                                            <div className="flex items-center gap-1 mb-0.5 md:mb-1 origin-center">
                                                <span className={`text-[8.5px] md:text-[10.5px] font-black px-1 py-0.2 md:px-1.5 md:py-0.5 rounded-full ${isSelected ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-500'}`}>
                                                    {days}일
                                                </span>
                                                {days !== 30 && (
                                                    <span className={`text-[7.5px] md:text-[9.5px] font-black ${isSelected ? 'text-purple-500' : 'text-gray-400'}`}>
                                                        {days === 60 ? '5%' : '10%'}
                                                    </span>
                                                )}
                                            </div>
                                            <span className={`text-[10.5px] md:text-[14px] font-black tracking-tighter leading-none ${isSelected ? 'text-purple-700' : 'text-gray-900'}`}>
                                                {(price).toLocaleString()}원
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>
        </section>
    );
};
