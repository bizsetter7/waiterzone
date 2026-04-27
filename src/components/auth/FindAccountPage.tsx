'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useBrand } from '@/components/BrandProvider';
import { IdentityVerifyModal } from './IdentityVerifyModal';
import type { IdentityVerifyResult } from '@/types/identity-verify';
import { CheckCircle2, Smartphone } from 'lucide-react';

type TabType = 'find-id' | 'find-pw';

export const FindAccountPage = ({ initialTab = 'find-id' }: { initialTab?: TabType }) => {
    const brand = useBrand();
    const router = useRouter();
    const [tab, setTab] = useState<TabType>(initialTab);
    const [userId, setUserId] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [verified, setVerified] = useState(false);
    const [verifyResult, setVerifyResult] = useState<IdentityVerifyResult | null>(null);
    const [foundId, setFoundId] = useState('');
    const [foundIds, setFoundIds] = useState<string[]>([]);
    const [newPw, setNewPw] = useState('');
    const [newPwConfirm, setNewPwConfirm] = useState('');
    const [pwStep, setPwStep] = useState<'input' | 'verified' | 'done'>('input');
    const [isLoading, setIsLoading] = useState(false);

    const primary = brand.primaryColor;
    const gradientStyle = {
        background: `linear-gradient(135deg, ${primary} 0%, ${primary}cc 100%)`,
    };

    const handleVerified = async (result: IdentityVerifyResult) => {
        setVerifyResult(result);
        setVerified(true);
        setShowModal(false);

        if (tab === 'find-id') {
            // 아이디 찾기: 본인인증 이름으로 DB 조회
            setIsLoading(true);
            try {
                const res = await fetch('/api/auth/find-username', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name: result.name }),
                });
                const data = await res.json();
                if (data.success) {
                    setFoundIds(data.usernames || []);
                    setFoundId(data.exactUsername || data.usernames?.[0] || '');
                } else {
                    setFoundId('');
                    setFoundIds([]);
                    alert(data.message || '계정을 찾을 수 없습니다.');
                }
            } catch {
                alert('아이디 조회 중 오류가 발생했습니다.');
            } finally {
                setIsLoading(false);
            }
        } else {
            // 비밀번호 찾기: 비밀번호 변경 단계로
            setPwStep('verified');
        }
    };

    const handleTabChange = (t: TabType) => {
        setTab(t);
        setVerified(false);
        setVerifyResult(null);
        setFoundId('');
        setFoundIds([]);
        setUserId('');
        setPwStep('input');
        setNewPw('');
        setNewPwConfirm('');
        setIsLoading(false);
    };

    const handleChangePw = async () => {
        if (!newPw || newPw.length < 6) {
            alert('비밀번호는 6자 이상 입력해주세요.');
            return;
        }
        if (newPw !== newPwConfirm) {
            alert('비밀번호가 일치하지 않습니다.');
            return;
        }

        setIsLoading(true);
        try {
            const res = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: userId.trim(),
                    newPassword: newPw,
                    verifiedName: verifyResult?.name,
                }),
            });
            const data = await res.json();
            if (data.success) {
                setPwStep('done');
            } else {
                alert(data.message || '비밀번호 변경에 실패했습니다.');
            }
        } catch {
            alert('비밀번호 변경 중 오류가 발생했습니다.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center py-10 px-4">
            <div className="w-full max-w-sm">
                {/* Card */}
                <div className="bg-white rounded-3xl shadow-xl overflow-hidden">

                    {/* Header Gradient */}
                    <div className="p-6 pb-8 text-center" style={gradientStyle}>
                        <h2 className="text-2xl font-black text-white mb-4">계정 찾기</h2>

                        {/* Tab Toggle */}
                        <div className="flex bg-white/20 rounded-2xl p-1 gap-1">
                            <button
                                onClick={() => handleTabChange('find-id')}
                                className={`flex-1 py-2.5 rounded-xl text-sm font-black transition-all ${
                                    tab === 'find-id'
                                        ? 'bg-gray-700 text-white shadow hover:bg-gray-600'
                                        : 'text-white/80 hover:bg-white/15 hover:text-white'
                                }`}
                            >
                                아이디 찾기
                            </button>
                            <button
                                onClick={() => handleTabChange('find-pw')}
                                className={`flex-1 py-2.5 rounded-xl text-sm font-black transition-all ${
                                    tab === 'find-pw'
                                        ? 'bg-gray-700 text-white shadow hover:bg-gray-600'
                                        : 'text-white/80 hover:bg-white/15 hover:text-white'
                                }`}
                            >
                                비밀번호 찾기
                            </button>
                        </div>
                    </div>

                    {/* Body */}
                    <div className="p-6 space-y-5">

                        {/* ───── 아이디 찾기 ───── */}
                        {tab === 'find-id' && (
                            <>
                                {!verified ? (
                                    <>
                                        <p className="text-center text-sm text-gray-500 font-medium leading-relaxed">
                                            가입 시 인증한 휴대폰 번호로<br />
                                            본인인증을 진행해주세요.
                                        </p>
                                        <button
                                            onClick={() => setShowModal(true)}
                                            className="w-full py-4 rounded-2xl flex items-center justify-center gap-3 text-white font-black text-base shadow-lg active:scale-[0.98] transition-all"
                                            style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)' }}
                                        >
                                            <Smartphone size={20} className="shrink-0" />
                                            휴대폰 본인인증
                                        </button>
                                    </>
                                ) : isLoading ? (
                                    <div className="text-center py-8 text-gray-400 font-bold text-sm">조회 중...</div>
                                ) : (
                                    <div className="text-center space-y-4 py-2">
                                        <div className="w-14 h-14 bg-green-50 rounded-full flex items-center justify-center mx-auto">
                                            <CheckCircle2 size={28} className="text-green-500" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-400 font-medium mb-2">
                                                {verifyResult?.name}님으로 가입된 아이디
                                            </p>
                                            {foundIds.length > 0 ? (
                                                <div className="space-y-1.5">
                                                    {foundIds.map((id, i) => (
                                                        <p key={i} className="text-lg font-black text-gray-900 bg-gray-50 rounded-xl py-2 px-4">{id}</p>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-sm text-gray-400">아이디를 찾을 수 없습니다.</p>
                                            )}
                                        </div>
                                        <button
                                            onClick={() => router.push('/?page=login')}
                                            className="w-full py-3.5 rounded-2xl text-white font-black text-sm shadow-md active:scale-[0.98] transition-all"
                                            style={{ backgroundColor: primary }}
                                        >
                                            로그인하러 가기
                                        </button>
                                    </div>
                                )}
                            </>
                        )}

                        {/* ───── 비밀번호 찾기 ───── */}
                        {tab === 'find-pw' && (
                            <>
                                {pwStep === 'input' && (
                                    <>
                                        <p className="text-center text-sm text-gray-500 font-medium leading-relaxed">
                                            아이디를 입력한 후<br />
                                            본인인증을 진행해주세요.
                                        </p>
                                        <div>
                                            <label className="block text-xs font-black text-gray-600 mb-1.5">
                                                아이디 <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                placeholder="아이디를 입력하세요"
                                                value={userId}
                                                onChange={(e) => setUserId(e.target.value)}
                                                className="w-full p-3.5 rounded-xl border border-gray-200 bg-white text-sm font-medium focus:outline-none focus:ring-2 focus:border-transparent"
                                                style={{ '--tw-ring-color': primary } as React.CSSProperties}
                                            />
                                        </div>
                                        <button
                                            onClick={() => {
                                                if (!userId.trim()) {
                                                    alert('아이디를 입력해주세요.');
                                                    return;
                                                }
                                                setShowModal(true);
                                            }}
                                            className="w-full py-4 rounded-2xl flex items-center justify-center gap-3 text-white font-black text-base shadow-lg active:scale-[0.98] transition-all"
                                            style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)' }}
                                        >
                                            <Smartphone size={20} className="shrink-0" />
                                            휴대폰 본인인증
                                        </button>
                                    </>
                                )}

                                {pwStep === 'verified' && (
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2 p-3 bg-green-50 rounded-xl">
                                            <CheckCircle2 size={16} className="text-green-500 shrink-0" />
                                            <p className="text-xs font-bold text-green-700">
                                                {verifyResult?.name}님 본인인증 완료
                                            </p>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-black text-gray-600 mb-1.5">
                                                새 비밀번호 <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="password"
                                                placeholder="6자 이상 입력"
                                                value={newPw}
                                                onChange={(e) => setNewPw(e.target.value)}
                                                className="w-full p-3.5 rounded-xl border border-gray-200 bg-white text-sm font-medium focus:outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-black text-gray-600 mb-1.5">
                                                비밀번호 확인 <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="password"
                                                placeholder="비밀번호 재입력"
                                                value={newPwConfirm}
                                                onChange={(e) => setNewPwConfirm(e.target.value)}
                                                className="w-full p-3.5 rounded-xl border border-gray-200 bg-white text-sm font-medium focus:outline-none"
                                            />
                                        </div>
                                        <button
                                            onClick={handleChangePw}
                                            disabled={isLoading}
                                            className="w-full py-4 rounded-2xl text-white font-black text-sm shadow-lg active:scale-[0.98] transition-all disabled:opacity-60"
                                            style={{ backgroundColor: primary }}
                                        >
                                            {isLoading ? '변경 중...' : '비밀번호 변경하기'}
                                        </button>
                                    </div>
                                )}

                                {pwStep === 'done' && (
                                    <div className="text-center space-y-4 py-2">
                                        <div className="w-14 h-14 bg-green-50 rounded-full flex items-center justify-center mx-auto">
                                            <CheckCircle2 size={28} className="text-green-500" />
                                        </div>
                                        <div>
                                            <p className="font-black text-gray-900">비밀번호 변경 완료!</p>
                                            <p className="text-xs text-gray-400 mt-1">새 비밀번호로 로그인해주세요.</p>
                                        </div>
                                        <button
                                            onClick={() => router.push('/?page=login')}
                                            className="w-full py-3.5 rounded-2xl text-white font-black text-sm shadow-md active:scale-[0.98] transition-all"
                                            style={{ backgroundColor: primary }}
                                        >
                                            로그인하러 가기
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>

                {/* Back Link */}
                <button
                    onClick={() => router.push('/?page=login')}
                    className="w-full text-center mt-5 text-sm text-gray-400 hover:text-gray-600 font-medium transition"
                >
                    로그인 페이지로 돌아가기
                </button>
            </div>

            {showModal && (
                <IdentityVerifyModal
                    onClose={() => setShowModal(false)}
                    onVerified={handleVerified}
                />
            )}
        </div>
    );
};
