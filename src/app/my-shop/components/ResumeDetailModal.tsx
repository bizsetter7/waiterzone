'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, User, MapPin, Briefcase, Calendar, Phone, MessageSquare, DollarSign } from 'lucide-react';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
import { getPayColor, getPayAbbreviation } from '@/utils/payColors';

export const ResumeDetailModal = ({ resume, onClose }: { resume: any, onClose: () => void }) => {
    const [mounted, setMounted] = useState(false);

    useBodyScrollLock(!!resume);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted || !resume) return null;
    if (typeof document === 'undefined') return null;

    return createPortal(
        <div
            className="modal-overlay fixed inset-0 z-[20000] flex items-end md:items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-300"
            onClick={onClose}
        >
            <div
                className="
                    bg-white shadow-2xl overflow-hidden flex flex-col
                    fixed bottom-0 inset-x-0 w-full h-[90dvh] rounded-t-[32px]
                    md:static md:w-[600px] md:h-auto md:max-h-[85vh] md:rounded-[32px]
                    animate-in slide-in-from-bottom duration-300
                "
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-6 md:p-8 bg-gradient-to-r from-blue-500 to-rose-600 relative text-white">
                    <button onClick={onClose} className="absolute top-5 right-6 p-2 hover:bg-white/20 rounded-full transition">
                        <X size={24} />
                    </button>

                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/30">
                            <User size={32} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black">{resume.title}</h2>
                            <div className="flex items-center gap-2 text-white/80 text-xs font-bold mt-1">
                                <span>{resume.gender}</span>
                                <span className="w-px h-2 bg-white/30"></span>
                                <span>{resume.birth_date || '생년월일 미입력'}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <span className="bg-black/20 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-black border border-white/20 flex items-center gap-1">
                            <MapPin size={10} /> {resume.region_main} {resume.region_sub}
                        </span>
                        <span className="bg-black/20 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-black border border-white/20 flex items-center gap-1">
                            <Briefcase size={10} /> {resume.industry_main} {resume.industry_sub}
                        </span>
                    </div>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 bg-white">
                    {/* Pay & Date */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 flex items-center gap-4">
                            <div className={`px-2 h-10 flex items-center justify-center rounded-xl text-lg font-black shadow-sm shrink-0 ${getPayColor(resume.pay_type || '협의')}`}>
                                {getPayAbbreviation(resume.pay_type || '협의')}
                            </div>
                            <div>
                                <div className="text-[10px] font-black text-gray-400 mb-0.5 flex items-center gap-1">
                                    희망 급여
                                </div>
                                <div className={`text-sm font-black ${resume.pay_amount > 0 ? 'text-blue-600' : 'text-gray-400'}`}>
                                    {(resume.pay_amount && Number(resume.pay_amount) > 0)
                                        ? `${Number(resume.pay_amount).toLocaleString()}원`
                                        : '급여협의'}
                                </div>
                            </div>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 italic">
                            <div className="text-[10px] font-black text-gray-400 mb-1 flex items-center gap-1">
                                <Calendar size={10} /> 등록 일자
                            </div>
                            <div className="text-sm font-black text-gray-800">
                                {new Date(resume.created_at).toLocaleDateString()}
                            </div>
                        </div>
                    </div>

                    {/* Self Intro */}
                    <div className="space-y-3">
                        <h3 className="text-sm font-black text-gray-900 flex items-center gap-2">
                            <span className="w-1 h-4 bg-blue-500 rounded-full"></span>
                            자기소개
                        </h3>
                        <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100 text-gray-700 text-sm font-medium leading-relaxed whitespace-pre-wrap min-h-[150px]">
                            {resume.content || '등록된 내용이 없습니다.'}
                        </div>
                    </div>
                </div>
                {/* Footer (Contact) - Only show if NOT site_msg */}
                {(!resume.contact_method || !String(resume.contact_method).includes('site_msg')) && (
                    <div className="p-6 bg-white border-t border-gray-100 flex gap-3 safe-area-bottom pb-4">
                        <button
                            onClick={() => alert('이력서에 등록된 정보를 확인했습니다.')}
                            className="flex-1 bg-gray-100 text-gray-500 py-3 rounded-xl font-black text-[11px] hover:bg-gray-200 transition"
                        >
                            정보 확인 완료
                        </button>
                        <button
                            onClick={() => {
                                if (resume.contact_method === 'phone') {
                                    window.location.href = `tel:${resume.contact_value}`;
                                } else {
                                    alert(`${resume.contact_method} 정보: ${resume.contact_value}`);
                                }
                            }}
                            className="flex-[2] bg-blue-600 text-white py-3 rounded-xl font-black text-[11px] shadow-lg shadow-blue-200 hover:bg-blue-700 transition"
                        >
                            {resume.contact_method === 'phone' ? '전화 걸기' : `${resume.contact_method} 연락하기`}
                        </button>
                    </div>
                )}

                {/* [New] 면접 제안 / 쪽지 버튼 (캡처 요청 사항 반영) */}
                <div className="px-6 pb-8 pt-0">
                    <button
                        onClick={() => alert('면접 제안 쪽지 기능이 준비 중입니다.')}
                        className="w-full flex items-center justify-center gap-3 py-4 bg-[#FFF5F7] border border-[#FFD1DC] rounded-[24px] text-[#E11D48] text-sm font-black hover:bg-[#FFE4EA] transition active:scale-95 shadow-sm"
                    >
                        <MessageSquare size={18} />
                        면접 제안 / 쪽지
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

