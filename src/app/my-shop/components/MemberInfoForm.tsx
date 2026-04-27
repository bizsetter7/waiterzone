'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Check, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { IdentityVerifyModal } from '@/components/auth/IdentityVerifyModal';
import type { IdentityVerifyResult } from '@/types/identity-verify';
import { BusinessVerifySection } from './BusinessVerifySection';

/**
 * 기업회원 회원정보수정 폼
 * - 아이디(고정), 비밀번호 변경
 * - 이메일(수정), 휴대폰(재인증), SMS 수신동의
 * - 담당자(성함), 생년월일, 성별 (본인인증 값, 수정불가)
 * - 사업자 인증 신청 섹션 (신규)
 */
export const MemberInfoForm = ({ brand, setView, onOpenMenu, shopName }: any) => {
    const { user } = useAuth();
    const isDark = brand?.theme === 'dark';
    const [isLoaded, setIsLoaded] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [showIdentityModal, setShowIdentityModal] = useState(false);

    // 기본 폼
    const [formData, setFormData] = useState({
        email: '',
        phone: '',
        managerName: '',   // full_name
        birthDate: '',     // birth_date
        gender: '',        // gender
        smsConsent: true,  // SMS 수신 동의 (마케팅 활용)
        newPassword: '',
        newPasswordConfirm: '',
    });


    // 아이디 = email 에서 @waiterzone.kr 앞 부분
    const username = user?.email?.replace('@waiterzone.kr', '') || user?.name || '';

    useEffect(() => {
        if (!user?.id || user.id === 'guest') {
            setFormData(prev => ({
                ...prev,
                email: user?.email || '',
            }));
            setIsLoaded(true);
            return;
        }

        const loadProfile = async () => {
            const [{ data: profile }, { data: { user: authUser } }] = await Promise.all([
                supabase
                    .from('profiles')
                    .select('phone, full_name, birth_date, gender')
                    .eq('id', user.id)
                    .single(),
                supabase.auth.getUser(),
            ]);

            // user_metadata를 fallback으로 활용 (profiles 데이터가 없을 경우 대비)
            const meta = authUser?.user_metadata || {};

            setFormData(prev => ({
                ...prev,
                email: user?.email || '',
                phone: (profile as any)?.phone || meta.phone || '',
                managerName: (profile as any)?.full_name || meta.full_name || user?.name || '',
                birthDate: (profile as any)?.birth_date || meta.birthdate || '',
                gender: (profile as any)?.gender || meta.gender || '',
            }));

            setIsLoaded(true);
        };

        loadProfile();
    }, [user?.id]);

    const handleChange = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const [isWithdrawing, setIsWithdrawing] = useState(false);

    const handleWithdraw = async () => {
        if (!user?.id || user.id === 'guest') return;
        const confirmed = window.confirm(
            '정말 탈퇴하시겠습니까?\n\n탈퇴 시 모든 개인정보가 삭제되며 복구할 수 없습니다.\n등록된 공고 및 포인트도 모두 소멸됩니다.'
        );
        if (!confirmed) return;

        setIsWithdrawing(true);
        try {
            const res = await fetch('/api/auth/withdraw', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.id }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || '탈퇴 처리 실패');
            await supabase.auth.signOut();
            alert('탈퇴가 완료되었습니다. 이용해주셔서 감사합니다.');
            window.location.href = '/';
        } catch (e: any) {
            alert('탈퇴 처리 중 오류가 발생했습니다: ' + e.message);
        } finally {
            setIsWithdrawing(false);
        }
    };

    const handleSave = async () => {
        if (!user?.id || user.id === 'guest') {
            alert('로그인이 필요합니다.');
            return;
        }
        if (formData.newPassword && formData.newPassword !== formData.newPasswordConfirm) {
            alert('비밀번호가 일치하지 않습니다.');
            return;
        }
        if (formData.newPassword && formData.newPassword.length < 6) {
            alert('비밀번호는 6자 이상이어야 합니다.');
            return;
        }

        setIsSaving(true);
        try {
            if (!user.id.startsWith('mock_')) {
                if (formData.newPassword) {
                    const { error: pwError } = await supabase.auth.updateUser({
                        password: formData.newPassword,
                    });
                    if (pwError) throw pwError;
                }
            }
            alert('회원 정보가 수정되었습니다.');
            setView('dashboard');
        } catch (e: any) {
            alert('수정 중 오류가 발생했습니다: ' + (e.message || '잠시 후 다시 시도해주세요.'));
        } finally {
            setIsSaving(false);
        }
    };

    const inputCls = `w-full p-3 md:p-4 rounded-xl font-bold border transition focus:ring-2 focus:ring-blue-500/20 outline-none ${
        isDark ? 'bg-gray-800 border-gray-700 text-white focus:border-blue-500' : 'bg-white border-gray-200 text-gray-900 focus:border-blue-500'
    }`;
    const disabledCls = `w-full p-3 md:p-4 rounded-xl font-bold border ${
        isDark ? 'bg-gray-800 border-gray-700 text-gray-400' : 'bg-gray-100 border-gray-200 text-gray-500'
    }`;
    const labelCls = `block text-xs font-bold mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`;

    if (!isLoaded) {
        return (
            <div className={`max-w-4xl mx-auto p-10 rounded-[32px] border text-center ${isDark ? 'bg-gray-900 border-gray-800 text-gray-400' : 'bg-white border-gray-100 text-gray-400'}`}>
                정보를 불러오는 중...
            </div>
        );
    }

    return (
        <div className={`max-w-4xl mx-auto p-3 md:p-10 rounded-[24px] md:rounded-[32px] shadow-xl border relative ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'}`}>
            <h2 className={`text-lg md:text-2xl font-black mb-3 md:mb-10 pb-3 md:pb-5 border-b flex items-center gap-2 md:gap-3 ${isDark ? 'text-white border-gray-800' : 'text-gray-950 border-gray-100'}`}>
                <span className="w-2 h-8 bg-blue-500 rounded-full hidden md:block" />
                회원 정보 수정
            </h2>

            <div className="space-y-6 md:space-y-8">

                {/* ── 아이디 / 비밀번호 변경 ── */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className={labelCls}>아이디</label>
                        <input type="text" value={username} disabled className={disabledCls} />
                    </div>
                    <div className="space-y-2">
                        <label className={labelCls}>비밀번호 변경 <span className="font-normal text-gray-400">(변경하지 않으면 비워두세요)</span></label>
                        <input
                            type="password"
                            placeholder="새 비밀번호 (6자 이상)"
                            value={formData.newPassword}
                            onChange={(e) => handleChange('newPassword', e.target.value)}
                            className={inputCls}
                        />
                        <input
                            type="password"
                            placeholder="비밀번호 확인"
                            value={formData.newPasswordConfirm}
                            onChange={(e) => handleChange('newPasswordConfirm', e.target.value)}
                            className={inputCls}
                        />
                        {formData.newPasswordConfirm && formData.newPassword !== formData.newPasswordConfirm && (
                            <p className="text-[10px] text-red-500 font-bold">비밀번호가 일치하지 않습니다.</p>
                        )}
                    </div>
                </div>

                {/* ── 이메일 / 휴대폰 ── */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className={labelCls}>이메일</label>
                        <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => handleChange('email', e.target.value)}
                            className={inputCls}
                            placeholder="이메일 주소 입력"
                        />
                    </div>
                    <div>
                        <label className={`${labelCls} flex items-center gap-1`}>
                            휴대폰 번호 <span className="text-red-500">*</span>
                        </label>
                        <div className="flex flex-col sm:flex-row gap-2">
                            <input
                                type="text"
                                value={formData.phone || '미등록'}
                                readOnly
                                className={`w-full sm:flex-1 p-3 md:p-4 rounded-xl font-bold border outline-none ${isDark ? 'bg-gray-800 border-gray-700 text-gray-400' : 'bg-gray-50 border-gray-200 text-gray-900'}`}
                            />
                            <button
                                onClick={() => setShowIdentityModal(true)}
                                className="w-full sm:w-auto px-6 py-3 md:py-4 rounded-xl font-bold whitespace-nowrap bg-indigo-500 text-white hover:bg-indigo-600 shadow-lg shadow-indigo-500/30 transition"
                            >
                                재인증
                            </button>
                        </div>
                    </div>
                </div>

                {/* ── 담당자 정보 (본인인증 값, 수정불가) ── */}
                <div className={`p-4 rounded-xl border ${isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-blue-50/50 border-blue-100'}`}>
                    <p className={`text-xs font-black mb-4 flex items-center gap-2 ${isDark ? 'text-gray-400' : 'text-blue-700'}`}>
                        <span className="w-1 h-4 bg-blue-500 rounded-full inline-block" />
                        담당자 정보 (본인인증 확인 값)
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className={labelCls}>담당자(성함)</label>
                            <input type="text" value={formData.managerName} disabled className={disabledCls} />
                        </div>
                        <div>
                            <label className={labelCls}>생년월일</label>
                            <input type="text" value={formData.birthDate} disabled className={disabledCls} placeholder="본인인증 후 자동 입력" />
                        </div>
                        <div>
                            <label className={labelCls}>성별</label>
                            <input type="text" value={formData.gender === 'M' ? '남성' : formData.gender === 'F' ? '여성' : (formData.gender === '남성' || formData.gender === '여성') ? formData.gender : ''} disabled className={disabledCls} placeholder="본인인증 후 자동 입력" />
                        </div>
                    </div>
                    <p className="text-[10px] text-blue-500 mt-2 font-bold">* 본인인증으로 확인된 정보로 임의 수정이 불가합니다.</p>
                </div>

                {/* ── SMS 수신동의 ── */}
                <div className={`p-4 rounded-xl border flex items-center gap-3 ${isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                    <div
                        onClick={() => handleChange('smsConsent', !formData.smsConsent)}
                        className={`w-6 h-6 rounded border flex items-center justify-center cursor-pointer transition ${formData.smsConsent ? 'bg-blue-500 border-blue-500 text-white' : 'bg-white border-gray-300'}`}
                    >
                        {formData.smsConsent && <Check size={16} />}
                    </div>
                    <label
                        className={`cursor-pointer font-bold select-none ${isDark ? 'text-gray-300' : 'text-gray-700'}`}
                        onClick={() => handleChange('smsConsent', !formData.smsConsent)}
                    >
                        [필수] SMS 수신 동의 (중요 알림 및 공지사항)
                    </label>
                </div>

                {/* ── 저장 버튼 ── */}
                <div className="flex flex-col sm:flex-row justify-between gap-3 pt-6 border-t border-gray-100 dark:border-gray-800">
                    {/* 회원탈퇴 */}
                    <button
                        onClick={handleWithdraw}
                        disabled={isWithdrawing}
                        className={`px-5 py-3 rounded-2xl font-black text-xs transition disabled:opacity-60 ${isDark ? 'text-gray-600 hover:text-red-400' : 'text-gray-300 hover:text-red-500'}`}
                    >
                        {isWithdrawing ? '처리 중...' : '회원 탈퇴'}
                    </button>
                    <div className="flex flex-col sm:flex-row gap-3">
                        <button
                            onClick={() => setView('dashboard')}
                            className={`px-8 py-4 rounded-2xl font-black transition ${isDark ? 'bg-gray-800 text-gray-400 hover:bg-gray-700' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                        >
                            취소
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="px-8 py-4 rounded-2xl bg-blue-500 text-white font-black hover:bg-blue-600 shadow-xl shadow-blue-500/20 transition active:scale-95 disabled:opacity-50"
                        >
                            {isSaving ? '저장 중...' : '회원정보 수정하기'}
                        </button>
                    </div>
                </div>

                {/* ══════════════════════════════════════════════
                    사업자 인증 신청 섹션 (BusinessVerifySection)
                ══════════════════════════════════════════════ */}
                <BusinessVerifySection brand={brand} setView={setView} />
            </div>

            {/* 재인증 모달 */}
            {showIdentityModal && (
                <IdentityVerifyModal
                    onClose={() => setShowIdentityModal(false)}
                    onVerified={(result: IdentityVerifyResult) => {
                        setShowIdentityModal(false);
                        if (result.phone) {
                            setFormData(prev => ({ ...prev, phone: result.phone || prev.phone }));
                        }
                    }}
                />
            )}
        </div>
    );
};

