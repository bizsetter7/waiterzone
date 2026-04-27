'use client';

import React, { useState } from 'react';
import { Lock, Eye, EyeOff, CheckCircle, ChevronLeft } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useBrand } from '@/components/BrandProvider';

interface Props {
    setView: (v: any) => void;
    onOpenMenu?: () => void;
}

export const ChangePasswordView = ({ setView, onOpenMenu }: Props) => {
    const brand = useBrand();
    const isDark = brand.theme === 'dark';

    const [newPw, setNewPw] = useState('');
    const [confirmPw, setConfirmPw] = useState('');
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isDone, setIsDone] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (newPw.length < 6) {
            setError('비밀번호는 6자 이상이어야 합니다.');
            return;
        }
        if (newPw !== confirmPw) {
            setError('비밀번호가 일치하지 않습니다.');
            return;
        }

        setIsLoading(true);
        const { error: updateError } = await supabase.auth.updateUser({ password: newPw });
        setIsLoading(false);

        if (updateError) {
            setError('비밀번호 변경에 실패했습니다. 다시 로그인 후 시도해주세요.');
            return;
        }

        setIsDone(true);
        setTimeout(() => setView('dashboard'), 2500);
    };

    if (isDone) {
        return (
            <div className={`max-w-md mx-auto mt-6 p-8 rounded-[24px] border shadow-sm text-center ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'}`}>
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="text-emerald-500" size={32} />
                </div>
                <h2 className={`text-xl font-black mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>비밀번호 변경 완료!</h2>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>잠시 후 마이홈으로 이동합니다.</p>
            </div>
        );
    }

    return (
        <div className={`max-w-md mx-auto mt-2 p-6 md:p-8 rounded-[24px] border shadow-sm ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'}`}>
            {/* 헤더 */}
            <div className="flex items-center gap-3 mb-6">
                <button
                    onClick={() => setView('dashboard')}
                    className={`p-2 rounded-xl transition ${isDark ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}
                >
                    <ChevronLeft size={20} />
                </button>
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-slate-900 rounded-xl flex items-center justify-center">
                        <Lock className="text-white" size={16} />
                    </div>
                    <h2 className={`text-lg font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>비밀번호 변경</h2>
                </div>
            </div>

            <p className={`text-sm mb-6 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>새로운 비밀번호를 6자 이상으로 입력해주세요.</p>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                {/* 새 비밀번호 */}
                <div>
                    <label className={`block text-xs font-black mb-1.5 uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>새 비밀번호</label>
                    <div className="relative">
                        <input
                            type={showNew ? 'text' : 'password'}
                            value={newPw}
                            onChange={(e) => setNewPw(e.target.value)}
                            placeholder="새 비밀번호 입력 (6자 이상)"
                            className={`w-full border rounded-xl px-4 py-3 text-sm font-bold pr-10 outline-none focus:ring-2 focus:ring-slate-900/20 ${isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900'}`}
                            required
                        />
                        <button type="button" onClick={() => setShowNew(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                            {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                    </div>
                </div>

                {/* 비밀번호 확인 */}
                <div>
                    <label className={`block text-xs font-black mb-1.5 uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>비밀번호 확인</label>
                    <div className="relative">
                        <input
                            type={showConfirm ? 'text' : 'password'}
                            value={confirmPw}
                            onChange={(e) => setConfirmPw(e.target.value)}
                            placeholder="동일한 비밀번호 입력"
                            className={`w-full border rounded-xl px-4 py-3 text-sm font-bold pr-10 outline-none focus:ring-2 focus:ring-slate-900/20 ${isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900'}`}
                            required
                        />
                        <button type="button" onClick={() => setShowConfirm(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                            {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                    </div>
                </div>

                {/* 실시간 일치 여부 */}
                {confirmPw && newPw !== confirmPw && (
                    <p className="text-xs font-bold text-red-500">비밀번호가 일치하지 않습니다.</p>
                )}
                {confirmPw && newPw === confirmPw && newPw.length >= 6 && (
                    <p className="text-xs font-bold text-emerald-500">✓ 비밀번호가 일치합니다.</p>
                )}

                {/* 에러 메시지 */}
                {error && (
                    <p className="text-sm font-bold text-red-500 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                        {error}
                    </p>
                )}

                {/* 버튼 */}
                <div className="flex flex-col sm:flex-row gap-3 mt-2">
                    <button
                        type="button"
                        onClick={() => setView('dashboard')}
                        className={`flex-1 py-3.5 rounded-xl font-black text-sm transition ${isDark ? 'bg-gray-800 text-gray-400 hover:bg-gray-700' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                    >
                        취소
                    </button>
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="flex-1 bg-slate-900 text-white py-3.5 rounded-xl font-black text-sm hover:bg-slate-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? '변경 중...' : '비밀번호 변경'}
                    </button>
                </div>
            </form>
        </div>
    );
};
