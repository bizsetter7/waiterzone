'use client';

import React, { useEffect, useRef, useCallback } from 'react';
import { Edit3, Laptop, Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, Type, Palette, Smile, ChevronDown, Image as ImageIcon, Sparkles } from 'lucide-react';
import { INDUSTRY_DATA, REGION_DATA, AGES, PAY_TYPES, FONT_DISPLAY_NAMES, FONT_SIZES, TEXT_COLORS, BG_COLORS } from '../../../constants';

interface Step2Props {
    brand: any;
    title: string;
    setTitle: (v: string) => void;
    industryMain: string;
    setIndustryMain: (v: string) => void;
    industrySub: string;
    setIndustrySub: (v: string) => void;
    ageMin: number;
    setAgeMin: (v: number) => void;
    ageMax: number;
    setAgeMax: (v: number) => void;
    regionCity: string;
    setRegionCity: (v: string) => void;
    regionGu: string;
    setRegionGu: (v: string) => void;
    payType: string;
    handlePayTypeChange: (e: any) => void;
    payAmount: string;
    handlePayAmountChange: (e: any) => void;
    setShowDesignModal: (v: boolean) => void;
    setShowTemplateModal: (v: boolean) => void;
    editorRef: React.RefObject<HTMLDivElement | null>;
    handleEditorInteract: () => void;
    setIsEditorDirty: (v: boolean) => void;
    saveSelection: () => void;
    restoreSelection: () => void;
    syncEditorHtml: () => void;
    editorHtml: string;
    toolbarStatus: any;
    execCmd: (cmd: string, val?: string) => void;
    updateToolbarStatus: () => void;
    showFontMenu: boolean;
    setShowFontMenu: (v: boolean) => void;
    showFontSizeMenu: boolean;
    setShowFontSizeMenu: (v: boolean) => void;
    showForeColorMenu: boolean;
    setShowForeColorMenu: (v: boolean) => void;
    showHiliteColorMenu: boolean;
    setShowHiliteColorMenu: (v: boolean) => void;
    showEmojiMenu: boolean;
    setShowEmojiMenu: (v: boolean) => void;
    insertEmoji: (emoji: string) => void;
    setExampleType: (v: any) => void;
    setShowExampleModal: (v: boolean) => void;
}

export const Step2JobDetail: React.FC<Step2Props> = ({
    brand, title, setTitle, industryMain, setIndustryMain, industrySub, setIndustrySub,
    ageMin, setAgeMin, ageMax, setAgeMax, regionCity, setRegionCity, regionGu, setRegionGu,
    payType, handlePayTypeChange, payAmount, handlePayAmountChange,
    setShowDesignModal, setShowTemplateModal, editorRef, handleEditorInteract, setIsEditorDirty, saveSelection,
    restoreSelection, syncEditorHtml, editorHtml,
    toolbarStatus, execCmd, updateToolbarStatus, showFontMenu, setShowFontMenu, showFontSizeMenu, setShowFontSizeMenu,
    showForeColorMenu, setShowForeColorMenu, showHiliteColorMenu, setShowHiliteColorMenu,
    showEmojiMenu, setShowEmojiMenu, insertEmoji, setExampleType, setShowExampleModal
}) => {
    // --- Toolbar Menus Logic ---
    const toggleMenu = useCallback((menuName: string) => {
        setShowFontMenu(menuName === 'font' ? !showFontMenu : false);
        setShowFontSizeMenu(menuName === 'fontSize' ? !showFontSizeMenu : false);
        setShowForeColorMenu(menuName === 'foreColor' ? !showForeColorMenu : false);
        setShowHiliteColorMenu(menuName === 'hiliteColor' ? !showHiliteColorMenu : false);
        setShowEmojiMenu(menuName === 'emoji' ? !showEmojiMenu : false);
    }, [showFontMenu, showFontSizeMenu, showForeColorMenu, showHiliteColorMenu, showEmojiMenu, setShowFontMenu, setShowFontSizeMenu, setShowForeColorMenu, setShowHiliteColorMenu, setShowEmojiMenu]);

    const [isUploading, setIsUploading] = React.useState(false);

    const insertImage = async (file: File) => {
        if (!file) return;

        // [New] File Size Check (5MB Limit)
        const MAX_SIZE = 5 * 1024 * 1024;
        if (file.size > MAX_SIZE) {
            alert('파일 크기가 너무 큽니다. 5MB 이하의 이미지만 업로드 가능합니다.');
            return;
        }

        try {
            setIsUploading(true);
            // 1. Supabase Storage Upload
            const { supabase } = await import('@/lib/supabase');
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random().toString(36).substring(2, 12)}_${Date.now()}.${fileExt}`;
            const filePath = `ad-contents/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('job-images')
                .upload(filePath, file);

            if (uploadError) {
                if (uploadError.message.includes('fetch')) {
                    throw new Error('네트워크 연결이 불안정합니다. 잠시 후 다시 시도해주세요.');
                }
                throw uploadError;
            }

            // 2. Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('job-images')
                .getPublicUrl(filePath);

            // 3. Insert into Editor
            restoreSelection();
            const img = `<img src="${publicUrl}" style="max-width: 100%; height: auto; border-radius: 12px; margin: 8px 0;" alt="직접 업로드 이미지" />`;
            document.execCommand('insertHTML', false, img);
            syncEditorHtml();
            editorRef.current?.focus();

        } catch (err: any) {
            console.error('이미지 업로드 실패:', err);
            alert(`이미지 업로드 실패: ${err.message || '알 수 없는 오류가 발생했습니다.'}`);
        } finally {
            setIsUploading(false);
        }
    };

    const applyPxFontSize = useCallback((size: string) => {
        // [iOS Fix] focus() → restoreSelection() 순서 보장 (2026-03-22)
        editorRef.current?.focus();
        let sel = window.getSelection();
        if (!sel || sel.rangeCount === 0) {
            restoreSelection(); // 유실된 경우 복원 시도
            sel = window.getSelection();
        }

        if (!sel || sel.rangeCount === 0) return;

        const range = sel.getRangeAt(0);
        if (range.collapsed) return;

        // 기존의 execCommand("fontSize")는 1-7 레벨로 변환되어버림
        // 대신 선택 영역을 span으로 감싸고 직접 스타일을 주입 (동기화 이슈 방지)
        const span = document.createElement('span');
        span.style.fontSize = size;
        span.style.lineHeight = '1.4';

        try {
            // 선택 영역의 콘텐츠를 추출하여 span에 넣고 다시 삽입
            const content = range.extractContents();
            span.appendChild(content);
            range.insertNode(span);

            // 삽입 후 선택 영역을 다시 span으로 잡아서 연속 작업 가능하게 함
            const newRange = document.createRange();
            newRange.selectNodeContents(span);
            sel.removeAllRanges();
            sel.addRange(newRange);
            saveSelection(); // 상태 업데이트
        } catch (err) {
            console.error('Font size apply error:', err);
        }

        setShowFontSizeMenu(false);
        syncEditorHtml();
        updateToolbarStatus();
        editorRef.current?.focus();
    }, [editorRef, setShowFontSizeMenu, syncEditorHtml, updateToolbarStatus, restoreSelection, saveSelection]);

    useEffect(() => {
        // 에디터 초기 내용 로드 (page 전환 시 유실 방지)
        if (editorRef.current && editorHtml && !editorRef.current.innerHTML) {
            editorRef.current.innerHTML = editorHtml;
        }
    }, [editorRef, editorHtml]);

    useEffect(() => {
        const handleDocMouseDown = (e: MouseEvent) => {
            // 에디터나 툴바가 아닌 다른 곳을 클릭했을 때 선택 영역을 저장
            // 단, 다른 텍스트를 드래그하려는 의도(input, textarea 등)가 아닐 때만 유지
            const target = e.target as HTMLElement;
            const isToolbar = target.closest('.editor-toolbar');
            const isEditor = target.closest('.editor-content');

            if (!isToolbar && !isEditor) {
                // 클릭한 곳이 에디터나 툴바가 아니면 현재 선택 영역을 백업
                const sel = window.getSelection();
                if (sel && sel.rangeCount > 0) {
                    saveSelection();
                }
            }
        };

        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            if (!target.closest('.font-menu')) setShowFontMenu(false);
            if (!target.closest('.size-menu')) setShowFontSizeMenu(false);
            if (!target.closest('.color-menu')) setShowForeColorMenu(false);
            if (!target.closest('.highlight-menu')) setShowHiliteColorMenu(false);
            if (!target.closest('.emoji-menu')) setShowEmojiMenu(false);
        };

        document.addEventListener('mousedown', handleDocMouseDown, true);
        document.addEventListener('click', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleDocMouseDown, true);
            document.removeEventListener('click', handleClickOutside);
        };
    }, [saveSelection, setShowFontMenu, setShowFontSizeMenu, setShowForeColorMenu, setShowHiliteColorMenu, setShowEmojiMenu]);
    return (
        <section id="myshop-step-2" className={`p-2 md:p-6 rounded-[32px] shadow-lg border-2 overflow-hidden ${brand.theme === 'dark' ? 'bg-gradient-to-br from-indigo-950 via-gray-900 to-gray-950 border-indigo-900/50' : 'bg-gradient-to-br from-indigo-50 via-white to-blue-50 border-indigo-200'}`}>
            <div className="bg-gradient-to-r from-green-600 via-emerald-500 to-green-600 text-white p-4 rounded-2xl mb-3 md:mb-6 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="text-center md:text-left">
                    <h2 className="font-black text-lg md:text-xl flex items-center justify-center md:justify-start gap-2">
                        <Edit3 size={24} className="text-white" />
                        STEP 2: 상세 내용 작성
                    </h2>
                    <p className="text-[13px] font-bold opacity-90 mt-1">공고의 제목과 내용을 상세하게 작성/표현해주세요!</p>
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                    <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); setExampleType('step2_card'); setShowExampleModal(true); }} className="flex-1 md:w-28 px-2 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-[10px] font-black border border-white/30 transition">광고카드 예시</button>
                    <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); setExampleType('step2_list'); setShowExampleModal(true); }} className="flex-1 md:w-28 px-2 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-[10px] font-black border border-white/30 transition">리스트 예시</button>
                </div>
            </div>

            <div className="space-y-4">
                {/* Basic Info Section */}
                <div className={`p-2 md:p-4 rounded-2xl shadow-sm border ${brand.theme === 'dark' ? 'bg-gray-900/50 border-gray-800' : 'bg-white border-gray-100'}`}>
                    <h2 className="font-black text-gray-800 mb-2 md:mb-4 flex items-center gap-2 text-sm"><span className="w-1.5 h-4 bg-blue-500 rounded-full"></span>채용 공고 정보</h2>
                    <div className="space-y-4">
                        <div>
                            <div className="flex items-center justify-between mb-1.5">
                                <label className="block text-sm font-black"><span className="text-red-500 mr-1">*</span>공고 제목</label>
                                <span className={`text-[10px] font-bold ${title.length >= 26 ? 'text-red-500' : 'text-gray-400'}`}>
                                    {title.length}/26 (한글 기준 약 13자 이내 권장)
                                </span>
                            </div>
                            <input
                                type="text"
                                placeholder="EX) 강남 1등 가게! 갯수 보장!"
                                value={title}
                                maxLength={26}
                                onChange={(e) => setTitle(e.target.value)}
                                className={`w-full border rounded-lg p-3 text-base font-black outline-none placeholder:text-gray-200 ${brand.theme === 'dark' ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200 text-black shadow-inner'}`}
                            />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="grid grid-cols-2 gap-2.5">
                                <div>
                                    <label className="block text-sm font-black mb-1.5"><span className="text-red-500 mr-1">*</span>직종</label>
                                    <div className="flex gap-1.5">
                                        <select value={industryMain} onChange={e => setIndustryMain(e.target.value)} className="w-full border rounded-lg p-2 text-sm outline-none bg-white">
                                            <option value="">1차</option>
                                            {Object.keys(INDUSTRY_DATA).map(i => <option key={i} value={i}>{i}</option>)}
                                        </select>
                                        <select value={industrySub} onChange={e => setIndustrySub(e.target.value)} className="w-full border rounded-lg p-2 text-sm outline-none bg-white" disabled={!industryMain}>
                                            <option value="">2차</option>
                                            {INDUSTRY_DATA[industryMain as keyof typeof INDUSTRY_DATA]?.map((j: string) => <option key={j} value={j}>{j}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-black mb-1.5"><span className="text-red-500 mr-1">*</span>연령</label>
                                    <div className="flex items-center gap-1.5">
                                        <select value={ageMin} onChange={e => setAgeMin(Number(e.target.value))} className="w-full border rounded-lg p-2 text-sm outline-none bg-white">
                                            {AGES.map(a => <option key={a} value={a}>{a}세</option>)}
                                        </select>
                                        <span className="text-gray-300">-</span>
                                        <select value={ageMax} onChange={e => setAgeMax(Number(e.target.value))} className="w-full border rounded-lg p-2 text-sm outline-none bg-white">
                                            {AGES.map(a => <option key={a} value={a}>{a}세</option>)}
                                        </select>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-black mb-1.5"><span className="text-red-500 mr-1">*</span>근무 지역</label>
                                <div className="flex gap-1.5 relative">
                                    <select value={regionCity} onChange={e => setRegionCity(e.target.value)} className="w-full border rounded-lg p-2 text-sm outline-none bg-white appearance-none cursor-pointer pr-8" style={{ WebkitAppearance: 'none' }}>
                                        <option value="">시/도</option>
                                        {Object.keys(REGION_DATA).map(r => <option key={r} value={r}>{r}</option>)}
                                    </select>
                                    <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                    <select value={regionGu} onChange={e => setRegionGu(e.target.value)} className="w-full border rounded-lg p-2 text-sm outline-none bg-white appearance-none cursor-pointer pr-8 disabled:bg-gray-50 disabled:cursor-not-allowed" disabled={!regionCity} style={{ WebkitAppearance: 'none' }}>
                                        <option value="">구/군</option>
                                        {REGION_DATA[regionCity as keyof typeof REGION_DATA]?.map((g: string) => <option key={g} value={g}>{g}</option>)}
                                    </select>
                                    <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                </div>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2.5">
                            <div>
                                <label className="block text-sm font-black mb-1.5"><span className="text-red-500 mr-1">*</span>급여 방식</label>
                                <select value={payType} onChange={handlePayTypeChange} className="w-full border rounded-lg p-2.5 text-sm outline-none bg-white h-[42px]">
                                    <option value="급여방식선택">급여방식선택</option>
                                    {PAY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-black mb-1.5"><span className="text-red-500 mr-1">*</span>급여액</label>
                                <div className={`relative flex items-center border rounded-lg overflow-hidden transition-all focus-within:ring-2 focus-within:ring-blue-100 ${brand.theme === 'dark' ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200 shadow-inner'}`}>
                                    <input
                                        type="text"
                                        placeholder="0"
                                        value={payAmount ? Number(payAmount).toLocaleString() : ''}
                                        onChange={handlePayAmountChange}
                                        className={`flex-1 p-2.5 text-base font-black outline-none bg-transparent h-[42px] placeholder:text-gray-200 text-left`}
                                    />
                                    <span className={`pr-3 pl-1 text-sm font-black shrink-0 ${payAmount ? 'text-gray-900' : 'text-gray-300'}`}>원</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Editor */}
                <div className="items-start">
                    {/* Editor Side */}
                    <div className={`p-5 md:p-6 rounded-[32px] border shadow-sm ${brand.theme === 'dark' ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'} h-full flex flex-col`}>
                        <div className="flex items-center justify-between mb-3">
                            <h2 className="font-black text-gray-800 flex items-center gap-2 text-sm">
                                <span className="w-1.5 h-4 bg-blue-500 rounded-full"></span>
                                상세내용 작성<br className="md:hidden" /> (에디터)
                            </h2>
                            <div className="flex items-center gap-1.5">
                                <button onMouseDown={(e) => e.preventDefault()} onClick={() => setShowTemplateModal(true)} className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black border border-blue-100 transition shadow-sm hover:bg-blue-100 ring-2 ring-blue-500/20 animate-pulse">
                                    <Sparkles size={12} /> Premium<br className="md:hidden" /> 템플릿 사용
                                </button>
                                <button onMouseDown={(e) => e.preventDefault()} onClick={() => setShowDesignModal(true)} className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black border border-blue-100 transition shadow-sm hover:bg-blue-100"><Laptop size={12} /> 디자인 의뢰</button>
                            </div>
                        </div>

                        {/* Sticky Toolbar — 단일 행 */}
                        <div id="editor-toolbar" className="editor-toolbar sticky top-0 z-[60] px-2 py-1.5 border-2 border-b-0 rounded-t-2xl flex flex-row items-center flex-wrap gap-1 md:gap-1.5 bg-white border-gray-200 text-gray-900 shadow-sm">
                            {/* 서식 */}
                            <div className="flex bg-gray-50 rounded-lg p-0.5 border border-gray-100">
                                <button onMouseDown={(e) => { e.preventDefault(); editorRef.current?.focus(); restoreSelection(); execCmd('bold'); }} className={`p-2 rounded hover:bg-white transition ${toolbarStatus.isBold ? 'text-blue-500 bg-white shadow-sm' : 'text-gray-500'}`}><Bold size={16} /></button>
                                <button onMouseDown={(e) => { e.preventDefault(); editorRef.current?.focus(); restoreSelection(); execCmd('italic'); }} className={`p-2 rounded hover:bg-white transition ${toolbarStatus.isItalic ? 'text-blue-500 bg-white shadow-sm' : 'text-gray-500'}`}><Italic size={16} /></button>
                                <button onMouseDown={(e) => { e.preventDefault(); editorRef.current?.focus(); restoreSelection(); execCmd('underline'); }} className={`p-2 rounded hover:bg-white transition ${toolbarStatus.isUnderline ? 'text-blue-500 bg-white shadow-sm' : 'text-gray-500'}`}><Underline size={16} /></button>
                            </div>
                            {/* 정렬 */}
                            <div className="flex bg-gray-50 rounded-lg p-0.5 border border-gray-100">
                                <button onMouseDown={(e) => { e.preventDefault(); editorRef.current?.focus(); restoreSelection(); execCmd('justifyLeft'); }} className={`p-1.5 rounded hover:bg-white transition ${toolbarStatus.textAlign === 'left' ? 'text-blue-500 bg-white shadow-sm' : 'text-gray-500'}`}><AlignLeft size={16} /></button>
                                <button onMouseDown={(e) => { e.preventDefault(); editorRef.current?.focus(); restoreSelection(); execCmd('justifyCenter'); }} className={`p-1.5 rounded hover:bg-white transition ${toolbarStatus.textAlign === 'center' ? 'text-blue-500 bg-white shadow-sm' : 'text-gray-500'}`}><AlignCenter size={16} /></button>
                                <button onMouseDown={(e) => { e.preventDefault(); editorRef.current?.focus(); restoreSelection(); execCmd('justifyRight'); }} className={`p-1.5 rounded hover:bg-white transition ${toolbarStatus.textAlign === 'right' ? 'text-blue-500 bg-white shadow-sm' : 'text-gray-500'}`}><AlignRight size={16} /></button>
                            </div>
                            {/* 폰트 */}
                            <div className="relative font-menu">
                                <button onMouseDown={(e) => { e.preventDefault(); toggleMenu('font'); }} className="h-8 min-w-[100px] text-[11px] font-black px-2 rounded-lg border border-gray-200 flex items-center justify-between gap-1 transition bg-white text-gray-900 shadow-sm hover:border-blue-300">
                                    <span className="truncate">{FONT_DISPLAY_NAMES[toolbarStatus.currentFont] || toolbarStatus.currentFont}</span>
                                    <ChevronDown size={14} className="shrink-0 text-gray-400" />
                                </button>
                                {showFontMenu && (
                                    <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-2xl z-[100] w-[180px] py-1 overflow-hidden animate-in fade-in zoom-in duration-150">
                                        {Object.entries(FONT_DISPLAY_NAMES).map(([id, name]) => (
                                            <button key={id} onMouseDown={(e) => { e.preventDefault(); editorRef.current?.focus(); restoreSelection(); execCmd('fontName', id); setShowFontMenu(false); }} className="w-full px-3 py-2 text-left hover:bg-gray-100 text-[13px] font-bold" style={{ fontFamily: id }}>{name}</button>
                                        ))}
                                    </div>
                                )}
                            </div>
                            {/* 폰트 크기 */}
                            <div className="relative size-menu">
                                <button onMouseDown={(e) => { e.preventDefault(); toggleMenu('fontSize'); }} className="h-8 min-w-[52px] text-[11px] font-black px-2 rounded-lg border border-gray-200 flex items-center justify-between gap-1 transition bg-white text-gray-900 shadow-sm hover:border-blue-300">
                                    {toolbarStatus.currentFontSize.replace('px', '').replace('pt', '') || '16'}pt
                                    <ChevronDown size={14} className="shrink-0 text-gray-400" />
                                </button>
                                {showFontSizeMenu && (
                                    <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-2xl z-[100] w-[80px] py-1 animate-in fade-in zoom-in duration-150">
                                        {FONT_SIZES.map(s => <button key={s} onMouseDown={(e) => { e.preventDefault(); applyPxFontSize(s); }} className="w-full px-3 py-2 text-left text-[12px] font-black hover:bg-gray-100">{s.replace('px', '')}</button>)}
                                    </div>
                                )}
                            </div>
                            {/* 텍스트 색상 */}
                            <div className="relative color-menu">
                                <button onMouseDown={(e) => { e.preventDefault(); toggleMenu('foreColor'); }} className="p-2 text-gray-500 hover:bg-gray-100 bg-white rounded-lg border border-gray-200 transition shadow-sm" title="글자색"><Type size={16} style={{ color: toolbarStatus.currentForeColor }} /></button>
                                {showForeColorMenu && (
                                    <div className="absolute top-full left-0 mt-1 grid grid-cols-5 gap-1 p-2 bg-white border border-gray-200 rounded-xl shadow-2xl z-[100] w-[160px] animate-in fade-in zoom-in duration-150">
                                        {TEXT_COLORS.map((c: any) => <button key={c.value} onMouseDown={(e) => { e.preventDefault(); editorRef.current?.focus(); restoreSelection(); execCmd('foreColor', c.value); setShowForeColorMenu(false); }} className="w-6 h-6 rounded-md border border-gray-100" style={{ backgroundColor: c.value }} title={c.label} />)}
                                    </div>
                                )}
                            </div>
                            {/* 형광펜 */}
                            <div className="relative highlight-menu">
                                <button onMouseDown={(e) => { e.preventDefault(); toggleMenu('hiliteColor'); }} className="p-2 text-gray-500 hover:bg-gray-100 bg-white rounded-lg border border-gray-200 transition shadow-sm" title="형광펜"><Palette size={16} style={{ backgroundColor: toolbarStatus.currentHiliteColor === 'transparent' ? 'transparent' : toolbarStatus.currentHiliteColor }} /></button>
                                {showHiliteColorMenu && (
                                    <div className="absolute top-full left-0 mt-1 grid grid-cols-5 gap-1 p-2 bg-white border border-gray-200 rounded-xl shadow-2xl z-[100] w-[160px] animate-in fade-in zoom-in duration-150">
                                        {BG_COLORS.map((c: any) => <button key={c.value} onMouseDown={(e) => { e.preventDefault(); editorRef.current?.focus(); restoreSelection(); execCmd('hiliteColor', c.value); setShowHiliteColorMenu(false); }} className="w-6 h-6 rounded-md border border-gray-100" style={{ backgroundColor: c.value }} title={c.label} />)}
                                    </div>
                                )}
                            </div>
                            {/* 이모지 */}
                            <div className="relative emoji-menu">
                                <button onMouseDown={(e) => { e.preventDefault(); toggleMenu('emoji'); }} className="p-1.5 text-gray-500 hover:bg-gray-100 bg-white rounded-lg border border-gray-200 transition shadow-sm"><Smile size={18} /></button>
                                {showEmojiMenu && (
                                    <div className="absolute top-full left-0 mt-1 grid grid-cols-6 gap-2 p-2 bg-white border border-gray-200 rounded-xl shadow-2xl z-[100] w-[210px] max-h-48 overflow-y-auto animate-in fade-in zoom-in duration-150">
                                        {['😊', '😂', '😍', '👍', '🔥', '✨', '💖', '⭐', '🎈', '🍺', '🎁', '🍭', '🤣', '😉', '😜', '🤩', '🥳', '😭', '😱', '😡', '✅', '🌈', '💎', '💰', '👑'].map(emoji => (
                                            <button key={emoji} onMouseDown={(e) => { e.preventDefault(); editorRef.current?.focus(); restoreSelection(); insertEmoji(emoji); setShowEmojiMenu(false); }} className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded text-xl transition active:scale-90">{emoji}</button>
                                        ))}
                                    </div>
                                )}
                            </div>
                            {/* 이미지 업로드 */}
                            <label className="p-1.5 text-gray-500 hover:bg-gray-100 bg-white rounded-lg border border-gray-200 transition shadow-sm cursor-pointer flex items-center justify-center shrink-0" title="이미지 삽입">
                                {isUploading ? (
                                    <div className="animate-spin text-blue-500"><svg className="w-[18px] h-[18px]" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg></div>
                                ) : (
                                    <ImageIcon size={18} />
                                )}
                                <input type="file" accept="image/*,image/gif" className="hidden" disabled={isUploading} onChange={(e) => { if (e.target.files?.[0]) insertImage(e.target.files[0]); }} />
                            </label>
                        </div>

                        <div
                            ref={editorRef}
                            contentEditable
                            onKeyUp={() => { handleEditorInteract(); saveSelection(); }}
                            onMouseUp={() => { handleEditorInteract(); saveSelection(); }}
                            onSelect={() => { handleEditorInteract(); saveSelection(); }}
                            onBlur={() => { saveSelection(); syncEditorHtml(); }}
                            onInput={() => { setIsEditorDirty(true); syncEditorHtml(); }}
                            className={`w-full min-h-[400px] lg:min-h-[500px] p-4 md:p-6 border-2 rounded-b-2xl outline-none overflow-y-auto ${brand.theme === 'dark' ? 'bg-gray-900 border-gray-800 text-white' : 'bg-white border-gray-100 text-gray-900'}`}
                            style={{ lineHeight: '1.6' }}
                        ></div>
                        <p className="text-[11px] mt-2 font-bold text-gray-400 px-1">* 팁: 에디터에서 작성한 내용이 공고에 그대로 반영됩니다.</p>
                    </div>
                </div>
            </div>
        </section>
    );
};
