'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Lock, Eye, EyeOff, CheckCircle } from 'lucide-react';

export default function UpdatePasswordPage() {
    const router = useRouter();
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [showPw, setShowPw] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isDone, setIsDone] = useState(false);
    const [error, setError] = useState('');
    const [sessionReady, setSessionReady] = useState(false);

    // Supabase 세션 확인 — 3가지 경로 모두 커버
    // 1) 이메일 재설정 링크 → PASSWORD_RECOVERY 이벤트
    // 2) 로그인 상태에서 직접 진입 → getUser()로 즉시 확인
    // 3) SIGNED_IN 이벤트 (Supabase가 토큰 교환 후 발생)
    useEffect(() => {
        // 즉시 로그인 상태 확인 (getUser가 getSession보다 신뢰도 높음)
        supabase.auth.getUser().then(({ data: { user } }) => {
            if (user) setSessionReady(true);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
            if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') {
                setSessionReady(true);
            }
        });

        // 안전망: 3초 후에도 세션 미확인이면 강제 활성화
        // (updateUser 자체가 세션 없으면 에러를 반환하므로 보안상 안전)
        const fallback = setTimeout(() => setSessionReady(true), 3000);

        return () => {
            subscription.unsubscribe();
            clearTimeout(fallback);
        };
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (password.length < 6) {
            setError('비밀번호는 6자 이상이어야 합니다.');
            return;
        }
        if (password !== confirm) {
            setError('비밀번호가 일치하지 않습니다.');
            return;
        }

        setIsLoading(true);
        const { error: updateError } = await supabase.auth.updateUser({ password });
        setIsLoading(false);

        if (updateError) {
            setError('비밀번호 변경에 실패했습니다. 다시 시도해주세요.');
            return;
        }

        setIsDone(true);
        setTimeout(() => router.push('/'), 3000);
    };

    if (isDone) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 w-full max-w-md text-center">
                    <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle className="text-emerald-500" size={32} />
                    </div>
                    <h2 className="text-xl font-black text-slate-900 mb-2">비밀번호 변경 완료!</h2>
                    <p className="text-sm text-slate-500">3초 후 메인 페이지로 이동합니다.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 w-full max-w-md">
                <div className="flex flex-col items-center mb-6">
                    <div className="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center mb-3">
                        <Lock className="text-white" size={24} />
                    </div>
                    <h1 className="text-xl font-black text-slate-900">새 비밀번호 설정</h1>
                    <p className="text-sm text-slate-500 mt-1">6자 이상으로 입력해주세요.</p>
                </div>

                {!sessionReady && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-4 text-sm text-amber-700 font-bold">
                        ⚠️ 세션을 확인하는 중입니다. 잠시 기다려주세요.
                    </div>
                )}

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div>
                        <label className="block text-xs font-black text-slate-500 mb-1.5 uppercase tracking-wider">새 비밀번호</label>
                        <div className="relative">
                            <input
                                type={showPw ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="새 비밀번호 입력"
                                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold pr-10 focus:outline-none focus:ring-2 focus:ring-slate-900"
                                required
                            />
                            <button type="button" onClick={() => setShowPw(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-black text-slate-500 mb-1.5 uppercase tracking-wider">비밀번호 확인</label>
                        <div className="relative">
                            <input
                                type={showConfirm ? 'text' : 'password'}
                                value={confirm}
                                onChange={(e) => setConfirm(e.target.value)}
                                placeholder="동일한 비밀번호 입력"
                                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold pr-10 focus:outline-none focus:ring-2 focus:ring-slate-900"
                                required
                            />
                            <button type="button" onClick={() => setShowConfirm(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                                {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                    </div>

                    {error && (
                        <p className="text-sm font-bold text-red-500 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                            {error}
                        </p>
                    )}

                    <button
                        type="submit"
                        disabled={isLoading || !sessionReady}
                        className="w-full bg-slate-900 text-white py-3.5 rounded-xl font-black text-sm hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                    >
                        {isLoading ? '변경 중...' : '비밀번호 변경'}
                    </button>
                </form>
            </div>
        </div>
    );
}
