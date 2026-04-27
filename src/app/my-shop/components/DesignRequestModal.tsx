'use client';
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Laptop, CheckCircle, Loader2 } from 'lucide-react';
import { BrandConfig } from '@/lib/brand-config';
import { supabase } from '@/lib/supabase';

interface ModalProps {
    brand: BrandConfig;
    onClose: () => void;
    user?: any;
    shopName?: string;
}

export const DesignRequestModal: React.FC<ModalProps> = ({ brand, onClose, user, shopName }) => {
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [done, setDone] = useState(false);

    const handleSubmit = async () => {
        setLoading(true);
        try {
            const writerName = shopName || user?.nickname || user?.full_name || user?.username || '업체회원';
            const contact = (user as any)?.phone || user?.email || '-';
            const content = [
                `[디자인 의뢰 접수]`,
                `업체명: ${shopName || '-'}`,
                `연락처: ${contact}`,
                message.trim() ? `\n추가 요청사항:\n${message.trim()}` : '',
            ].filter(Boolean).join('\n');

            await supabase.from('inquiries').insert({
                writer_name: writerName,
                title: `[디자인의뢰] ${shopName || writerName} 상세페이지 제작 요청`,
                content,
                type: '디자인의뢰',
                contact,
                status: 'pending',
                user_id: user?.id || null,
                shop_name: shopName || null,
                created_at: new Date().toISOString(),
            });
            setDone(true);
        } catch (e) {
            console.error(e);
            alert('접수 중 오류가 발생했습니다. 다시 시도해주세요.');
        } finally {
            setLoading(false);
        }
    };

    if (typeof document === 'undefined') return null;
    return createPortal(
        <div className="fixed inset-0 z-[20000] flex items-center justify-center bg-black/70 p-4 backdrop-blur-md">
            <div className={`rounded-[32px] shadow-2xl max-w-sm w-full p-8 text-center space-y-6 transform animate-in fade-in zoom-in duration-200 ${brand.theme === 'dark' ? 'bg-gray-900 border border-gray-800' : 'bg-white'}`}>
                {done ? (
                    <>
                        <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto bg-green-50 border-4 border-white shadow-sm">
                            <CheckCircle size={40} className="text-green-500" />
                        </div>
                        <h3 className={`text-2xl font-black tracking-tight ${brand.theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>접수 완료!</h3>
                        <p className={`text-sm leading-relaxed ${brand.theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                            디자인 의뢰가 접수되었습니다.<br />
                            담당자가 확인 후 빠르게 연락드리겠습니다.
                        </p>
                        <button onClick={onClose} className="w-full py-3 rounded-xl bg-blue-600 text-white font-black hover:bg-blue-700 transition">확인</button>
                    </>
                ) : (
                    <>
                        <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-2 border-4 shadow-sm ${brand.theme === 'dark' ? 'bg-blue-900/30 border-gray-800' : 'bg-blue-50 border-white'}`}>
                            <Laptop size={40} className="text-blue-500" />
                        </div>
                        <h3 className={`text-2xl font-black tracking-tight ${brand.theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>상세페이지 디자인 의뢰</h3>
                        <p className={`${brand.theme === 'dark' ? 'text-gray-300' : 'text-gray-800'} text-sm leading-relaxed`}>
                            전문 디자이너가 사장님만의 <br />
                            <strong className="text-blue-500 font-black text-lg">고퀄리티 상세페이지</strong>를 제작해드립니다.
                        </p>
                        <div className={`p-6 rounded-2xl text-left space-y-3 text-xs md:text-sm border font-bold ${brand.theme === 'dark' ? 'bg-blue-900/10 text-blue-200 border-blue-900/30' : 'bg-blue-50/50 text-gray-700 border-blue-100'}`}>
                            <p>• 브랜드 전용 1:1 맞춤형 고해상도 디자인</p>
                            <p>• 7단계 노출 등급에 최적화된 레이아웃 제공</p>
                            <p>• 움직이는 GIF 및 프리미엄 움짤 무료 제작</p>
                            <p>• 제작 기간: 영업일 기준 평균 1~2일</p>
                        </div>
                        <textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="추가 요청사항이 있으면 입력해주세요. (선택)"
                            rows={3}
                            className={`w-full rounded-2xl px-4 py-3 text-sm font-medium resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/30 border ${brand.theme === 'dark' ? 'bg-gray-800 border-gray-700 text-white placeholder:text-gray-500' : 'bg-gray-50 border-gray-200 text-gray-800 placeholder:text-gray-400'}`}
                        />
                        <div className="grid grid-cols-1 gap-3 pt-2">
                            <button
                                onClick={handleSubmit}
                                disabled={loading}
                                className="py-4 rounded-xl bg-blue-600 text-white font-black hover:bg-blue-700 shadow-xl shadow-blue-100/10 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                            >
                                {loading ? <><Loader2 size={18} className="animate-spin" /> 접수 중...</> : '실시간 1:1 문의 접수하기'}
                            </button>
                            <button onClick={onClose} className="py-3 text-gray-400 font-bold hover:text-gray-600">닫기</button>
                        </div>
                    </>
                )}
            </div>
        </div>,
        document.body
    );
};
