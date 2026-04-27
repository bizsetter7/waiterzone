'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
    X, Check, Eye, Layout, Type, Palette, Sparkles,
    AlertCircle, Plus, Trash2, ArrowUp, ArrowDown,
    GripVertical, MessageSquare, List, CreditCard, Phone, Move
} from 'lucide-react';
import { BrandConfig } from '@/lib/brand-config';
import { AD_TEMPLATES, AdTemplate, AdBlock, AdBlockType } from '@/constants/job-templates';

interface AdTemplateModalProps {
    brand: BrandConfig;
    onClose: () => void;
    onApply: (html: string) => void;
}

export const AdTemplateModal: React.FC<AdTemplateModalProps> = ({ brand, onClose, onApply }) => {
    const [selectedTemplate, setSelectedTemplate] = useState<AdTemplate>(AD_TEMPLATES[0]);
    const [blocks, setBlocks] = useState<AdBlock[]>([]);

    // Initialize default blocks when template changes
    useEffect(() => {
        const initialBlocks = selectedTemplate.defaultBlocks.map((b, idx) => ({
            ...b,
            id: `${selectedTemplate.id}-${Date.now()}-${idx}`
        }));
        setBlocks(initialBlocks);
    }, [selectedTemplate]);

    // 모달 오픈 시 배경 스크롤 방지
    useEffect(() => {
        const originalStyle = window.getComputedStyle(document.body).overflow;
        document.body.style.overflow = 'hidden';

        return () => {
            document.body.style.overflow = originalStyle;
        };
    }, []);

    const handleUpdateBlock = (id: string, key: string, value: string) => {
        setBlocks(prev => prev.map(b =>
            b.id === id ? { ...b, values: { ...b.values, [key]: value } } : b
        ));
    };

    const handleAddBlock = (type: AdBlockType) => {
        const currentCount = blocks.filter(b => b.type === type).length;
        const defaultCount = selectedTemplate.defaultBlocks.filter(b => b.type === type).length;

        if (currentCount - defaultCount >= 3) {
            alert(`'${type}' 블록은 최대 3개까지만 추가할 수 있습니다.`);
            return;
        }

        const newBlock: AdBlock = {
            id: `new-${Date.now()}`,
            type,
            values: type === 'benefit' ? { title: '제목 입력', desc: '설명 입력' } : { text: '' }
        };
        setBlocks(prev => [...prev, newBlock]);
    };

    const handleRemoveBlock = (id: string) => {
        setBlocks(prev => prev.filter(b => b.id !== id));
    };

    const handleMoveBlock = (index: number, direction: 'up' | 'down') => {
        const newBlocks = [...blocks];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        if (targetIndex >= 0 && targetIndex < newBlocks.length) {
            [newBlocks[index], newBlocks[targetIndex]] = [newBlocks[targetIndex], newBlocks[index]];
            setBlocks(newBlocks);
        }
    };

    const renderedHtml = useMemo(() => {
        const renderedBlocks = blocks.map(b => selectedTemplate.renderBlock(b));
        return selectedTemplate.wrapperHtml(blocks, renderedBlocks);
    }, [selectedTemplate, blocks]);

    const getBlockIcon = (type: AdBlockType) => {
        switch (type) {
            case 'main_title': return <Sparkles size={14} className="text-amber-500" />;
            case 'sub_title': return <MessageSquare size={14} className="text-blue-500" />;
            case 'benefit': return <List size={14} className="text-blue-500" />;
            case 'salary': return <CreditCard size={14} className="text-green-500" />;
            case 'contact': return <Phone size={14} className="text-indigo-500" />;
            default: return <Type size={14} />;
        }
    };

    const canAddBlock = (type: AdBlockType) => {
        const currentCount = blocks.filter(b => b.type === type).length;
        const defaultCount = selectedTemplate.defaultBlocks.filter(b => b.type === type).length;
        return currentCount - defaultCount < 3;
    };

    if (typeof document === 'undefined') return null;

    return createPortal(
        <div className="fixed inset-0 z-[20000] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md overflow-hidden">
            <div className={`w-full max-w-6xl h-[95vh] flex flex-col rounded-[40px] shadow-2xl overflow-hidden transform animate-in fade-in zoom-in duration-200 ${brand.theme === 'dark' ? 'bg-gray-950 border border-indigo-900/50' : 'bg-white'}`}>

                {/* Header */}
                <div className="flex items-center justify-between px-8 py-5 border-b border-gray-100 shrink-0 bg-white/50 backdrop-blur-sm z-20">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-rose-600 flex items-center justify-center text-white shadow-xl shadow-blue-500/20">
                            <Sparkles size={28} />
                        </div>
                        <div>
                            <h3 className={`text-xl font-black ${brand.theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>프리미엄 블록형 공고 빌더</h3>
                            <p className="text-xs font-bold text-gray-400">자유롭게 블록을 추가하고 순서를 바꿔보세요!</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-3 hover:bg-gray-100 rounded-full transition-colors text-gray-400"><X size={28} /></button>
                </div>

                <div className="flex-1 flex overflow-hidden">
                    {/* Left: Controls */}
                    <div className="w-full md:w-[450px] border-r border-gray-100 flex flex-col overflow-hidden bg-gray-50/50">
                        <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-hide">
                            {/* Template Selector */}
                            <section>
                                <h4 className="text-[10px] font-black text-gray-400 flex items-center gap-1.5 mb-4 uppercase tracking-[0.2em]"><Layout size={12} /> 프리미엄 템플릿 선택</h4>
                                <div className="grid grid-cols-4 gap-3">
                                    {AD_TEMPLATES.map(t => (
                                        <button
                                            key={t.id}
                                            onClick={() => setSelectedTemplate(t)}
                                            className={`relative group flex flex-col items-center gap-2 p-2 rounded-2xl border-2 transition-all ${selectedTemplate.id === t.id ? 'border-blue-500 bg-white shadow-lg' : 'border-transparent bg-gray-100/50 hover:bg-white'}`}
                                        >
                                            <div className="w-full aspect-square rounded-xl shadow-inner overflow-hidden flex items-center justify-center" style={{ background: t.themeColor }}>
                                                {selectedTemplate.id === t.id && (
                                                    <div className="absolute top-1 right-1 bg-blue-500 text-white rounded-full p-1 shadow-lg ring-4 ring-white"><Check size={10} strokeWidth={4} /></div>
                                                )}
                                                <div className="text-xl">{t.id === 'luxury-purple' ? '✨' : t.id === 'gold-winner' ? '🏆' : t.id === 'sweet-pink' ? '🎀' : t.id === 'neon-b2b' ? '🕺' : t.id === 'red-impact' ? '🔴' : '☁️'}</div>
                                            </div>
                                            <span className="text-[10px] font-black truncate w-full text-center">{t.name}</span>
                                        </button>
                                    ))}
                                </div>
                            </section>

                            <div className="h-px bg-gray-200/50" />

                            {/* Blocks Editor */}
                            <section className="space-y-4">
                                <div className="flex items-center justify-between mb-4">
                                    <h4 className="text-[10px] font-black text-gray-400 flex items-center gap-1.5 uppercase tracking-[0.2em]"><GripVertical size={12} /> 블록 구성 및 편집</h4>
                                    <div className="flex gap-1">
                                        {(['benefit', 'sub_title', 'salary', 'contact'] as AdBlockType[]).map(type => (
                                            <button
                                                key={type}
                                                onClick={() => handleAddBlock(type)}
                                                className={`w-7 h-7 flex items-center justify-center rounded-lg bg-white border border-gray-200 text-gray-400 transition-all shadow-sm active:scale-90 ${canAddBlock(type) ? 'hover:text-blue-500 hover:border-blue-500' : 'opacity-30 cursor-not-allowed'}`}
                                                title={canAddBlock(type) ? `${type} 추가` : '추가 제한 도달'}
                                                disabled={!canAddBlock(type)}
                                            >
                                                <Plus size={14} />
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    {blocks.map((block, index) => (
                                        <div key={block.id} className="group relative bg-white rounded-2xl border border-gray-100 shadow-sm p-4 hover:border-blue-200 hover:shadow-md transition-all">
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="flex items-center gap-2">
                                                    <div className="p-1.5 rounded-lg bg-gray-50 text-gray-400 group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors">
                                                        {getBlockIcon(block.type)}
                                                    </div>
                                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                                        {block.type === 'main_title' ? '메인 제목' :
                                                            block.type === 'sub_title' ? '서브 제목' :
                                                                block.type === 'benefit' ? '혜택/안내' :
                                                                    block.type === 'salary' ? '급여 정보' :
                                                                        block.type === 'contact' ? '연락처' :
                                                                            '텍스트'}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => handleMoveBlock(index, 'up')} disabled={index === 0} className="p-1.5 text-gray-300 hover:text-blue-500 disabled:opacity-30"><ArrowUp size={14} /></button>
                                                    <button onClick={() => handleMoveBlock(index, 'down')} disabled={index === blocks.length - 1} className="p-1.5 text-gray-300 hover:text-blue-500 disabled:opacity-30"><ArrowDown size={14} /></button>
                                                    <button onClick={() => handleRemoveBlock(block.id)} className="p-1.5 text-gray-300 hover:text-red-500"><Trash2 size={14} /></button>
                                                </div>
                                            </div>

                                            {block.type === 'benefit' ? (
                                                <div className="space-y-2">
                                                    <input
                                                        value={block.values.title}
                                                        onChange={e => handleUpdateBlock(block.id, 'title', e.target.value)}
                                                        placeholder="혜택 제목"
                                                        className="w-full text-xs font-black border-none focus:ring-0 p-0 placeholder:text-gray-300"
                                                    />
                                                    <textarea
                                                        value={block.values.desc}
                                                        onChange={e => handleUpdateBlock(block.id, 'desc', e.target.value)}
                                                        placeholder="상세 설명"
                                                        className="w-full text-[11px] font-medium border-none focus:ring-0 p-0 text-gray-500 min-h-[40px] resize-none placeholder:text-gray-300"
                                                    />
                                                </div>
                                            ) : (
                                                <textarea
                                                    value={block.values.text}
                                                    onChange={e => handleUpdateBlock(block.id, 'text', e.target.value)}
                                                    placeholder="내용을 입력하세요"
                                                    className={`w-full border-none focus:ring-0 p-0 placeholder:text-gray-300 resize-none ${block.type === 'main_title' ? 'text-sm font-black' : 'text-xs font-medium text-gray-600'}`}
                                                    rows={block.type === 'main_title' ? 1 : 2}
                                                />
                                            )}
                                        </div>
                                    ))}
                                </div>

                                {canAddBlock('benefit') && (
                                    <button
                                        onClick={() => handleAddBlock('benefit')}
                                        className="w-full py-4 rounded-2xl border-2 border-dashed border-gray-200 text-gray-300 flex items-center justify-center gap-2 hover:border-blue-200 hover:text-blue-400 hover:bg-blue-50/30 transition-all font-black text-xs"
                                    >
                                        <Plus size={16} /> 새로운 블록 추가하기
                                    </button>
                                )}
                            </section>
                        </div>
                    </div>

                    {/* Right: Live Preview */}
                    <div className={`hidden md:flex flex-1 flex-col overflow-hidden ${brand.theme === 'dark' ? 'bg-black' : 'bg-gray-100'}`}>
                        <div className="p-5 border-b border-gray-100/10 flex items-center justify-between shrink-0 bg-white/5 backdrop-blur-sm z-20">
                            <div className="flex items-center gap-3">
                                <div className="flex gap-1.5">
                                    <span className="w-3 h-3 rounded-full bg-red-400" />
                                    <span className="w-3 h-3 rounded-full bg-yellow-400" />
                                    <span className="w-3 h-3 rounded-full bg-green-400" />
                                </div>
                                <h4 className="text-[10px] font-black text-gray-500 flex items-center gap-1.5 uppercase tracking-[0.2em] border-l border-gray-200 pl-3">Real-time Preview</h4>
                            </div>
                            <div className="flex items-center gap-4">
                                <span className={`text-[10px] font-black px-2 py-1 rounded-md ${brand.theme === 'dark' ? 'bg-gray-800 text-gray-400' : 'bg-white text-gray-400 shadow-sm'}`}>MOBILE MODE</span>
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-12 flex justify-center bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:20px_20px]">
                            <div className="w-full max-w-[480px] h-fit bg-white shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)] rounded-[40px] overflow-hidden ring-8 ring-gray-900/5 transition-transform duration-500">
                                <div className="p-0" dangerouslySetInnerHTML={{ __html: renderedHtml }} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-8 py-6 border-t border-gray-100 flex items-center justify-between shrink-0 bg-white shadow-[0_-10px_30px_-15px_rgba(0,0,0,0.05)] z-20">
                    <div className="flex items-center gap-3 px-4 py-2 bg-rose-50 rounded-2xl text-rose-500">
                        <AlertCircle size={16} />
                        <span className="text-[11px] font-black">적용 시 에디터에 작성된 기존 내용이 이 디자인으로 교체됩니다.</span>
                    </div>
                    <div className="flex gap-4">
                        <button onClick={onClose} className="px-8 py-3.5 rounded-2xl text-sm font-black text-gray-400 hover:bg-gray-100 transition-all">나중에 하기</button>
                        <button
                            onClick={() => {
                                onApply(renderedHtml);
                                onClose();
                            }}
                            className="px-12 py-3.5 rounded-2xl text-sm font-black bg-gradient-to-r from-blue-500 to-rose-600 text-white shadow-2xl shadow-blue-500/40 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2 group"
                        >
                            <Sparkles size={18} className="group-hover:rotate-12 transition-transform" />
                            지금 바로 적용하기
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};
