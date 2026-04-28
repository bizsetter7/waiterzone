'use client';

import React from 'react';
import { Sparkles, MousePointer2, Highlighter, Palette, Zap, Radio } from 'lucide-react';
import { ICONS, HIGHLIGHTERS, PAY_SUFFIX_OPTIONS, STEP4_CONVENIENCE_KEYWORDS } from '../../../constants';

interface Step4Props {
    brand: any;
    paySuffixes: string[];
    togglePaySuffix: (v: string) => void;
    borderOption: string;
    setBorderOption: (v: any) => void;
    borderPeriod: number;
    setBorderPeriod: (v: number) => void;
    selectedIcon: number | null;
    setSelectedIcon: (v: number | null) => void;
    iconPeriod: number;
    setIconPeriod: (v: number) => void;
    selectedHighlighter: number | null;
    setSelectedHighlighter: (v: number | null) => void;
    highlighterPeriod: number;
    setHighlighterPeriod: (v: number) => void;
    selectedKeywords: string[];
    setSelectedKeywords: (v: string[]) => void;
    selectedAdProduct: string | null;
    setExampleType: (v: any) => void;
    setShowExampleModal: (v: boolean) => void;
    isNewEntry?: boolean;
}

export const Step4Extras: React.FC<Step4Props> = ({
    brand, paySuffixes, togglePaySuffix, borderOption, setBorderOption, borderPeriod, setBorderPeriod,
    selectedIcon, setSelectedIcon, iconPeriod, setIconPeriod,
    selectedHighlighter, setSelectedHighlighter, highlighterPeriod, setHighlighterPeriod,
    selectedKeywords, setSelectedKeywords,
    selectedAdProduct, setExampleType, setShowExampleModal,
    isNewEntry
}) => {
    const checkStep3 = () => {
        if (!selectedAdProduct) {
            alert("STEP 3의 광고 타입을 먼저 선택해야 신청 가능합니다!");
            return false;
        }
        return true;
    };

    const checkEditMode = (allowImage: boolean = false) => {
        if (isNewEntry === false && !allowImage) {
            alert('등록한 옵션은 변경이 불가합니다.\nstep1, step2의 영역만 수정가능.');
            return false;
        }
        return true;
    };

    const handleTogglePaySuffix = (s: string) => {
        if (!checkEditMode()) return;
        if (!checkStep3()) return;
        if (!paySuffixes.includes(s) && paySuffixes.length >= 6) {
            alert('최대 6개까지만 선택가능합니다');
            return;
        }
        togglePaySuffix(s);
    };

    const handleSetBorderPeriod = (v: number) => {
        if (!checkEditMode()) return;
        if (v > 0 && !checkStep3()) return;
        setBorderPeriod(v);
        if (v > 0 && borderOption === 'none') setBorderOption('color');
    };

    const handleSetIconPeriod = (v: number) => {
        if (!checkEditMode()) return;
        if (v > 0 && !checkStep3()) return;
        setIconPeriod(v);
    };

    const handleSetHighlighterPeriod = (v: number) => {
        if (!checkEditMode()) return;
        if (v > 0 && !checkStep3()) return;
        setHighlighterPeriod(v);
    };

    const toggleKeyword = (kw: string) => {
        if (!checkEditMode()) return;
        if (selectedKeywords.includes(kw)) {
            setSelectedKeywords(selectedKeywords.filter(k => k !== kw));
        } else {
            if (selectedKeywords.length < 10) {
                setSelectedKeywords([...selectedKeywords, kw]);
            } else {
                alert('최대 10개까지만 선택가능합니다');
            }
        }
    };

    const openExample = (type: string) => {
        setExampleType(type);
        setShowExampleModal(true);
    };

    const renderPeriodSelector = (current: number, setter: (v: number) => void, noneLabel: string = "안함") => (
        <div className="grid grid-cols-4 gap-1 w-full">
            {[0, 30, 60, 90].map(p => (
                <button
                    key={p}
                    type="button"
                    onClick={() => setter(p)}
                    className={`flex flex-col items-center justify-center py-1.5 md:py-2 rounded-lg border transition-all ${current === p
                        ? 'bg-blue-50 text-blue-600 border-blue-400 ring-1 ring-blue-400'
                        : 'bg-white border-gray-100 text-gray-400 hover:border-blue-200'
                        }`}
                >
                    {p === 0 ? (
                        <div className="flex flex-col items-center">
                            <div className={`w-3 h-3 rounded-full border-2 mb-1 flex items-center justify-center ${current === 0 ? 'border-blue-500 bg-blue-500' : 'border-gray-200'}`}>
                                {current === 0 && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                            </div>
                            <span className="text-[10px] md:text-[12px] font-black">{noneLabel}</span>
                        </div>
                    ) : (
                        <>
                            <div className={`w-3 h-3 rounded-full border-2 mb-1 flex items-center justify-center ${current === p ? 'border-blue-500 bg-blue-500' : 'border-gray-200'}`}>
                                {current === p && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                            </div>
                            <span className="text-[10px] md:text-[12px] font-black">{p}일</span>
                            <div className="text-[8px] md:text-[10px] opacity-70 font-bold">+{p === 30 ? '3' : p === 60 ? '5.5' : '7'}만원</div>
                        </>
                    )}
                </button>
            ))}
        </div>
    );

    return (
        <section id="myshop-step-4" className={`p-1.5 md:p-5 rounded-[32px] shadow-lg border-2 overflow-hidden ${brand.theme === 'dark' ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'}`}>
            <div className="bg-gradient-to-r from-[#9333ea] via-[#a855f7] to-[#ec4899] text-white p-5 md:p-7 rounded-[24px] mb-6 md:mb-8 shadow-xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl group-hover:scale-110 transition-transform duration-700"></div>
                <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-white/30 rounded-2xl flex items-center justify-center border border-white/40 shadow-inner">
                            <Sparkles size={28} className="text-white animate-pulse" />
                        </div>
                        <div>
                            <h2 className="font-black text-xl md:text-2xl tracking-tight flex items-center gap-2">
                                STEP 4 : 추가 노출 강조 옵션
                            </h2>
                            <div className="flex items-center gap-4 mt-1">
                                <span className="text-yellow-300 font-black text-sm md:text-base animate-bounce">노출 효과의 압도적 극대화!!</span>
                                <div className="hidden md:block w-px h-4 bg-white/30"></div>
                                <span className="text-white/80 font-bold text-xs md:text-sm">다양한 옵션으로 시선을 사로 잡으세요!</span>
                            </div>
                        </div>
                    </div>
                    <div className="bg-black/30 px-4 py-2 rounded-full border border-white/20 mx-auto md:mx-0 flex items-center justify-center w-fit">
                        <span className="text-[10px] md:text-xs font-black tracking-widest text-[#e9d5ff]">SELECTION OPTIONS</span>
                        <span className="text-white font-black text-xs md:text-sm ml-2">선택 시 추가 비용 발생</span>
                    </div>
                </div>
            </div>

            <div className="space-y-6 md:space-y-10">
                {/* 1. 급여 추가 옵션 (4열 그리드) */}
                <div>
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex flex-wrap items-end md:items-center gap-1.5 md:gap-3">
                            <h3 className="text-[13px] md:text-[16px] font-black text-gray-700 flex items-center gap-2">
                                <div className="w-6 h-6 bg-amber-100 rounded-lg flex items-center justify-center text-amber-600"><Zap size={14} fill="currentColor" /></div>
                                급여 추가 옵션
                            </h3>
                            <span className="text-[10px] md:text-[11px] font-bold text-blue-500 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">+5,000원</span>
                            <span className="text-[9px] md:text-[12px] text-gray-400 font-bold bg-gray-100 px-2 py-0.5 rounded-full md:w-auto">기본 1개 제공(무료), 추가 5개까지 선택가능(유료)</span>
                        </div>
                        <button
                            type="button"
                            onClick={() => openExample('step4_pay')}
                            className="px-2.5 py-1 text-[10px] font-black bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition shadow-sm text-gray-600 shrink-0"
                        >
                            예시보기
                        </button>
                    </div>
                    <p className="text-[11px] text-gray-400 font-bold mb-3 ml-8 leading-tight">
                        광고 외/내부 급여 바로 옆에 표시됨!
                    </p>
                    <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-1.5 md:gap-2">
                        {PAY_SUFFIX_OPTIONS.map(s => {
                            const isSelected = paySuffixes.includes(s);
                            const count = paySuffixes.length;
                            // 1개 선택시 핑크색, 2개부터는 보라색
                            const activeClass = count >= 2 ? 'bg-purple-600 border-purple-600' : 'bg-blue-500 border-blue-500';

                            return (
                                <button
                                    key={s}
                                    type="button"
                                    onClick={() => handleTogglePaySuffix(s)}
                                    className={`flex items-center justify-center h-9 md:h-11 rounded-lg text-[10.5px] md:text-[13px] font-bold transition border-2 ${isSelected ? `text-white ${activeClass} shadow-sm` : 'bg-white border-gray-100 text-gray-500 hover:border-amber-200'}`}
                                >
                                    {s}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* 2. 편의사항 및 키워드 (4열 그리드) */}
                <div>
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                            <h3 className="text-[13px] md:text-[16px] font-black text-gray-700 flex items-center gap-2">
                                <div className="w-6 h-6 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600"><Sparkles size={14} fill="currentColor" /></div>
                                편의사항 및 키워드 (최대 10개)
                            </h3>
                            <span className="text-[10px] md:text-[11px] font-bold text-cyan-500 bg-cyan-50 px-2 py-0.5 rounded-full border border-cyan-100">무료</span>
                        </div>
                        <span className="text-[12px] md:text-[14px] font-black text-blue-500">{selectedKeywords.length}/10</span>
                    </div>
                    <div className={`p-2 md:p-5 rounded-2xl border-2 border-dashed ${brand.theme === 'dark' ? 'bg-gray-900/40 border-gray-800' : 'bg-white/40 border-gray-100 shadow-inner'}`}>
                        <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-1.5 md:gap-2">
                            {STEP4_CONVENIENCE_KEYWORDS.map(kw => (
                                <button
                                    key={kw}
                                    type="button"
                                    onClick={() => toggleKeyword(kw)}
                                    className={`flex items-center justify-center h-9 md:h-11 rounded-lg text-[10.5px] md:text-[13px] font-bold transition border-2 ${selectedKeywords.includes(kw) ? 'bg-indigo-500 text-white border-indigo-500 shadow-sm' : 'bg-white border-gray-100 text-gray-400 hover:border-indigo-200'}`}
                                >
                                    {kw}
                                </button>
                            ))}
                        </div>
                        <p className="text-[9.5px] md:text-[12px] text-gray-400 font-bold mt-4 text-center">
                            * 선택하신 키워드는 검색 필터와 매칭되어 노출 효율을 높여줍니다.
                        </p>
                    </div>
                </div>

                {/* 3 & 4. 아이콘 & 형광펜 (2열 배치) */}
                <div className="grid md:grid-cols-2 gap-4 md:gap-6">
                    {/* 아이콘 선택 */}
                    <div className="rounded-2xl border-2 overflow-hidden border-gray-200 bg-white shadow-sm flex flex-col">
                        <div className="bg-gray-600 text-white p-2.5 md:p-3 flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center shadow-inner"><MousePointer2 size={18} fill="currentColor" className="rotate-90" /></div>
                                <div>
                                    <h3 className="text-[13px] md:text-[16px] font-black leading-none">10종 무빙 아이콘</h3>
                                    <p className="text-[10px] md:text-[11px] font-bold opacity-80 mt-1">제목앞에 아이콘을 노출하여 주목도를 높이세요!</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => openExample('step4_pay')}
                                className="px-2.5 py-1 text-[10px] font-black bg-white/10 border border-white/20 rounded-lg hover:bg-white/20 transition backdrop-blur-sm"
                            >
                                예시보기
                            </button>
                        </div>
                        <div className="p-3 md:p-5 space-y-4 flex-1">
                            {renderPeriodSelector(iconPeriod, handleSetIconPeriod as any, "안함")}
                            <div className="grid grid-cols-5 gap-2 md:gap-3">
                                {ICONS.map(item => (
                                    <button
                                        key={item.id}
                                        type="button"
                                        onClick={() => {
                                            if (!checkEditMode()) return;
                                            if (!checkStep3()) return;
                                            setSelectedIcon(selectedIcon === item.id ? null : item.id);
                                        }}
                                        className={`flex flex-col items-center justify-center py-2 md:py-3 rounded-lg transition-all border-2 ${selectedIcon === item.id ? 'border-blue-500 bg-blue-50 shadow-sm' : 'border-transparent bg-gray-50/30 hover:bg-gray-50'}`}
                                    >
                                        {/* [New] Custom Badge for 'NEW' in Selection List */}
                                        {item.icon === 'NEW' ? (
                                            <span className="inline-flex items-center justify-center px-1.5 h-[18px] bg-red-600 text-white text-[9px] font-black rounded-[6px] tracking-tighter shrink-0 align-middle shadow-sm animate-seesaw mb-1">
                                                NEW
                                            </span>
                                        ) : (
                                            <span className="text-lg md:text-2xl mb-1 animate-seesaw inline-block origin-bottom">{item.icon}</span>
                                        )}
                                        <span className={`text-[8px] md:text-[11px] font-black ${selectedIcon === item.id ? 'text-blue-600' : 'text-gray-400'}`}>{item.name}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* 형광펜 선택 */}
                    <div className="rounded-2xl border-2 overflow-hidden border-gray-200 bg-white shadow-sm flex flex-col">
                        <div className="bg-gray-600 text-white p-2.5 md:p-3 flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center shadow-inner"><Highlighter size={18} fill="currentColor" /></div>
                                <div>
                                    <h3 className="text-[13px] md:text-[16px] font-black leading-none">10종 형광펜</h3>
                                    <p className="text-[10px] md:text-[11px] font-bold opacity-80 mt-1">제목에 시각적인 광고효과를 입혀보세요!</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => openExample('step2_list')}
                                className="px-2.5 py-1 text-[10px] font-black bg-white/10 border border-white/20 rounded-lg hover:bg-white/20 transition backdrop-blur-sm"
                            >
                                예시보기
                            </button>
                        </div>
                        <div className="p-3 md:p-5 space-y-4 flex-1">
                            {renderPeriodSelector(highlighterPeriod, handleSetHighlighterPeriod as any, "안함")}
                            <div className="grid grid-cols-4 gap-2 md:gap-2.5">
                                {HIGHLIGHTERS.map(item => (
                                    <button
                                        key={item.id}
                                        type="button"
                                        onClick={() => {
                                            if (!checkEditMode()) return;
                                            if (!checkStep3()) return;
                                            setSelectedHighlighter(selectedHighlighter === item.id ? null : item.id);
                                        }}
                                        className={`py-1.5 md:py-2 px-1 rounded-lg transition-all border-2 flex items-center justify-center ${selectedHighlighter === item.id ? 'border-blue-500 bg-blue-50 shadow-sm' : 'border-transparent bg-gray-50/30 hover:bg-gray-50'}`}
                                    >
                                        <span
                                            className="w-full py-1 rounded text-[9px] md:text-[12px] font-black"
                                            style={item.color === 'rainbow' ? {
                                                background: 'linear-gradient(to right, #ef5350, #f48fb1, #7e57c2, #2196f3, #26c6da, #43a047, #eeff41, #f9a825, #ff5722)',
                                                color: 'white',
                                                textShadow: '0 1px 2px rgba(0,0,0,0.2)'
                                            } : item.color === 'blink' ? {
                                                backgroundColor: '#ffff00',
                                                color: '#000',
                                                animation: 'blink 1s ease-in-out infinite'
                                            } : { backgroundColor: item.color, color: '#333' }}
                                        >
                                            {item.name}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* 5. 테두리 효과 (테두리/특수효과) */}
                <div className="grid md:grid-cols-2 gap-4 md:gap-6">
                    <div className="rounded-2xl border-2 overflow-hidden border-gray-200 bg-white shadow-sm">
                        <div className="bg-gray-600 text-white p-2.5 md:p-3 flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center shadow-inner"><Radio size={18} /></div>
                                <div>
                                    <h3 className="text-[13px] md:text-[16px] font-black leading-none">
                                        테두리 효과
                                        <span className="text-[10px] md:text-[11px] text-blue-500 font-bold ml-2">(프리미엄 미리보기 참고)</span>
                                    </h3>
                                    <p className="text-[10px] md:text-[11px] font-bold opacity-80 mt-1">테두리/특수효과로 나만의 광고를 돋보이세요!</p>
                                </div>
                            </div>
                        </div>
                        <div className="p-4 md:p-6 space-y-6">
                            {/* 기간 선택 (상단 배치) */}
                            <div>
                                {renderPeriodSelector(borderPeriod, handleSetBorderPeriod as any, "안함")}
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <h3 className="text-[13px] md:text-[16px] font-black mb-3 text-gray-700">
                                        테두리/특수효과 선택
                                    </h3>
                                    <div className="grid grid-cols-2 gap-2">
                                        {[
                                            { id: 'color', label: '컬러 테두리' },
                                            { id: 'glow', label: 'Glow 효과' },
                                            { id: 'sparkle', label: '반짝이 효과' },
                                            { id: 'rainbow', label: '무지개 효과' }
                                        ].map(opt => (
                                            <button
                                                key={opt.id}
                                                type="button"
                                                onClick={() => {
                                                    if (!checkEditMode()) return;
                                                    if (!checkStep3()) return;
                                                    setBorderOption(borderOption === opt.id ? 'none' : opt.id as any);
                                                }}
                                                className={`py-3 md:py-3.5 px-2 rounded-xl border-2 transition-all font-black text-[10px] md:text-[13px] ${borderOption === opt.id ? 'bg-purple-100 text-purple-700 border-purple-400' : 'bg-white border-gray-100 text-gray-400 hover:border-purple-200'}`}
                                            >
                                                {opt.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* 미리보기 영역 (최하단 배치, 아이콘 섹션 박스 스타일 적용) */}
                            <div className="pt-4 border-t border-gray-100">
                                <h4 className="text-[12px] md:text-[14px] font-black text-gray-500 font-black mb-3">프리미엄 미리보기</h4>
                                <div className={`h-24 md:h-28 rounded-xl border-2 flex items-center justify-center transition-all duration-300 bg-gray-50/50 ${borderOption === 'color'
                                    ? 'border-blue-500 border-4 shadow-sm'
                                    : borderOption === 'glow'
                                        ? 'border-cyan-400 border-4 shadow-[0_0_20px_rgba(34,211,238,0.4)]'
                                        : borderOption === 'sparkle'
                                            ? 'border-yellow-400 border-4 shadow-[0_0_25px_rgba(250,204,21,0.6)] animate-pulse'
                                            : borderOption === 'rainbow'
                                                ? 'animate-rainbow-border shadow-lg'
                                                : 'border-gray-200 border-dashed'
                                    }`}>
                                    <div className="text-center group">
                                        <Palette size={20} className={`mx-auto mb-1.5 transition-colors ${borderOption !== 'none' ? (borderOption === 'sparkle' ? 'text-yellow-500' : borderOption === 'rainbow' ? 'text-purple-500' : 'text-blue-500') : 'text-gray-300'} ${borderOption === 'sparkle' ? 'animate-bounce' : ''}`} />
                                        <span className={`text-[11px] md:text-[13px] font-black transition-colors ${borderOption !== 'none' ? 'text-gray-900' : 'text-gray-400'}`}>실제 노출 효과 예시</span>
                                    </div>
                                </div>
                                <p className="text-[9px] md:text-[11px] text-gray-400 font-bold mt-3 text-center">
                                    ※ 위의 이미지는 적용된 효과의 예시이며, 실제 공고 노출 시 디자인 및 위치가 다를 수 있습니다.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

