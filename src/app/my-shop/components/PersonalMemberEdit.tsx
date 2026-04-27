'use client';

import React, { useState, useEffect } from 'react';
import { useBrand } from '@/components/BrandProvider';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { IdentityVerifyModal } from '@/components/auth/IdentityVerifyModal';
import type { IdentityVerifyResult } from '@/types/identity-verify';

export const PersonalMemberEdit = ({ setView, onOpenMenu }: { setView: (v: any) => void, onOpenMenu?: () => void }) => {
    const brand = useBrand();
    const { user } = useAuth();
    const [showIdentityModal, setShowIdentityModal] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);

    // 닉네임 1일 1회 수정 제한
    const [nicknameLastUpdated, setNicknameLastUpdated] = useState<string | null>(null);
    const [originalNickname, setOriginalNickname] = useState('');

    const [formData, setFormData] = useState({
        nickname: '',
        fullName: '',    // full_name (본인인증 이름, 표시 전용)
        email: '',
        phone: '',
        birthDate: '',   // birth_date (본인인증 값, 표시 전용)
        gender: '',      // gender (본인인증 값, 표시 전용)
        smsConsent: true, // SMS 수신 동의 (마케팅 활용)
        newPassword: '',
        newPasswordConfirm: '',
    });

    // 닉네임 수정 가능 여부 (1일 1회 제한)
    const canEditNickname = (() => {
        if (!nicknameLastUpdated) return true;
        const last = new Date(nicknameLastUpdated).getTime();
        const now = Date.now();
        return (now - last) >= 24 * 60 * 60 * 1000; // 24시간 경과 여부
    })();

    // 다음 수정 가능 시간 표시
    const nextEditableTime = (() => {
        if (!nicknameLastUpdated || canEditNickname) return null;
        const next = new Date(new Date(nicknameLastUpdated).getTime() + 24 * 60 * 60 * 1000);
        return next.toLocaleString('ko-KR', { month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    })();

    // supabase profiles 실제 데이터 로드
    useEffect(() => {
        if (!user?.id || user.id === 'guest' || user.id.startsWith('mock_')) {
            setFormData(prev => ({
                ...prev,
                nickname: user?.nickname || '',
                email: user?.email || '',
            }));
            setOriginalNickname(user?.nickname || '');
            setIsLoaded(true);
            return;
        }

        const loadProfile = async () => {
            const [{ data: profile }, { data: { user: authUser } }] = await Promise.all([
                supabase
                    .from('profiles')
                    .select('nickname, full_name, phone, nickname_updated_at, birth_date, gender')
                    .eq('id', user.id)
                    .single(),
                supabase.auth.getUser(),
            ]);

            // user_metadata를 fallback으로 활용 (profiles 데이터가 없을 경우 대비)
            const meta = authUser?.user_metadata || {};

            const nick = profile?.nickname || user?.nickname || '';
            setFormData(prev => ({
                ...prev,
                nickname: nick,
                fullName: profile?.full_name || meta.full_name || '',
                email: user?.email || '',
                phone: profile?.phone || meta.phone || '',
                birthDate: profile?.birth_date || meta.birthdate || '',
                gender: profile?.gender || meta.gender || '',
            }));
            setOriginalNickname(nick);
            setNicknameLastUpdated(profile?.nickname_updated_at || null);
            setIsLoaded(true);
        };

        loadProfile();
    }, [user?.id]);

    const handleChange = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    // 본인인증 완료 → 휴대폰 번호 업데이트
    const handleVerified = (result: IdentityVerifyResult) => {
        setShowIdentityModal(false);
        if (result.phone) {
            setFormData(prev => ({ ...prev, phone: result.phone || prev.phone }));
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

        // 닉네임 변경 시 1일 1회 제한 검증
        const isNicknameChanged = formData.nickname !== originalNickname;
        if (isNicknameChanged && !canEditNickname) {
            alert(`닉네임은 1일 1회만 수정할 수 있습니다.\n다음 수정 가능 시간: ${nextEditableTime}`);
            return;
        }

        setIsSaving(true);
        try {
            if (!user.id.startsWith('mock_')) {
                // profiles 업데이트
                const updatePayload: any = {
                    nickname: formData.nickname,
                    phone: formData.phone,
                };

                // 닉네임이 변경된 경우 nickname_updated_at 갱신
                if (isNicknameChanged) {
                    updatePayload.nickname_updated_at = new Date().toISOString();
                }

                const { error } = await supabase
                    .from('profiles')
                    .update(updatePayload)
                    .eq('id', user.id);

                if (error) throw error;

                // auth user_metadata 동기화 → 닉네임을 모든 컴포넌트에서 일관되게 사용
                // (커뮤니티, 1:1문의, 이력서 등에서 user_metadata.nickname 참조)
                const { error: metaError } = await supabase.auth.updateUser({
                    data: { nickname: formData.nickname }
                });
                if (metaError) {
                    // 메타데이터 업데이트 실패는 경고만 (치명적 오류 아님)
                    console.warn('auth metadata 업데이트 실패:', metaError.message);
                }

                // 비밀번호 변경 (입력한 경우만)
                if (formData.newPassword) {
                    const { error: pwError } = await supabase.auth.updateUser({
                        password: formData.newPassword
                    });
                    if (pwError) throw pwError;
                }

                // 닉네임 변경 후 로컬 상태 업데이트
                if (isNicknameChanged) {
                    setOriginalNickname(formData.nickname);
                    setNicknameLastUpdated(new Date().toISOString());
                }
            }

            alert('정보가 수정되었습니다.');
            setView('dashboard');
        } catch (e: any) {
            alert('수정 중 오류가 발생했습니다: ' + (e.message || '잠시 후 다시 시도해주세요.'));
        } finally {
            setIsSaving(false);
        }
    };

    const [isWithdrawing, setIsWithdrawing] = useState(false);

    const handleWithdraw = async () => {
        if (!user?.id || user.id === 'guest') return;
        const confirmed = window.confirm(
            '정말 탈퇴하시겠습니까?\n\n탈퇴 시 모든 개인정보가 삭제되며 복구할 수 없습니다.\n포인트 및 서비스 이용 내역도 모두 소멸됩니다.'
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

    const isDark = brand.theme === 'dark';

    if (!isLoaded) {
        return (
            <div className={`max-w-4xl mx-auto p-10 rounded-[32px] border text-center ${isDark ? 'bg-gray-900 border-gray-800 text-gray-400' : 'bg-white border-gray-100 text-gray-400'}`}>
                정보를 불러오는 중...
            </div>
        );
    }

    return (
        <>
            <div className={`max-w-4xl mx-auto p-3 md:p-10 rounded-[24px] md:rounded-[32px] shadow-xl border ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'}`}>
                <h2 className={`text-lg md:text-2xl font-black mb-3 md:mb-10 pb-3 md:pb-5 border-b flex items-center gap-2 md:gap-3 ${isDark ? 'text-white border-gray-800' : 'text-gray-950 border-gray-100'}`}>
                    <span className="w-2 h-8 bg-[#f82b60] rounded-full hidden md:block"></span>
                    개인 회원 정보 수정
                </h2>

                <div className="space-y-6 md:space-y-8">

                    {/* 아이디 / 이름 (고정) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className={`block text-xs font-black mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>아이디</label>
                            <input
                                type="text"
                                value={user?.email?.split('@')[0] || user?.name || ''}
                                disabled
                                className={`w-full p-3 md:p-4 rounded-xl font-bold border ${isDark ? 'bg-gray-800 border-gray-700 text-gray-400' : 'bg-gray-100 border-gray-200 text-gray-500'}`}
                            />
                        </div>
                        <div>
                            <label className={`block text-xs font-black mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>이름</label>
                            <input
                                type="text"
                                value={formData.fullName}
                                disabled
                                placeholder="본인인증 후 자동 입력"
                                className={`w-full p-3 md:p-4 rounded-xl font-bold border ${isDark ? 'bg-gray-800 border-gray-700 text-gray-400' : 'bg-gray-100 border-gray-200 text-gray-500'}`}
                            />
                        </div>
                    </div>

                    {/* 본인인증 정보 (생년월일 / 성별) — 표시 전용 */}
                    <div className={`p-4 rounded-xl border ${isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-rose-50/50 border-rose-100'}`}>
                        <p className={`text-xs font-black mb-3 flex items-center gap-2 ${isDark ? 'text-gray-400' : 'text-rose-700'}`}>
                            <span className="w-1 h-4 bg-[#f82b60] rounded-full inline-block" />
                            본인인증 확인 정보
                        </p>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className={`block text-xs font-bold mb-1.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>생년월일</label>
                                <input
                                    type="text"
                                    value={formData.birthDate || ''}
                                    disabled
                                    placeholder="본인인증 후 자동 입력"
                                    className={`w-full p-3 rounded-xl font-bold border text-sm ${isDark ? 'bg-gray-800 border-gray-700 text-gray-400' : 'bg-gray-100 border-gray-200 text-gray-500'}`}
                                />
                            </div>
                            <div>
                                <label className={`block text-xs font-bold mb-1.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>성별</label>
                                <input
                                    type="text"
                                    value={formData.gender === 'M' ? '남성' : formData.gender === 'F' ? '여성' : (formData.gender === '남성' || formData.gender === '여성') ? formData.gender : ''}
                                    disabled
                                    placeholder="본인인증 후 자동 입력"
                                    className={`w-full p-3 rounded-xl font-bold border text-sm ${isDark ? 'bg-gray-800 border-gray-700 text-gray-400' : 'bg-gray-100 border-gray-200 text-gray-500'}`}
                                />
                            </div>
                        </div>
                        <p className="text-[10px] text-rose-500 mt-2 font-bold">* 본인인증으로 확인된 정보로 임의 수정이 불가합니다.</p>
                    </div>

                    {/* 닉네임 */}
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <label className={`text-xs font-black ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>닉네임</label>
                            <span className="text-[10px] font-bold text-[#f82b60]">*1일 1회 수정가능</span>
                        </div>
                        <input
                            type="text"
                            value={formData.nickname}
                            onChange={(e) => canEditNickname && handleChange('nickname', e.target.value)}
                            readOnly={!canEditNickname}
                            maxLength={10}
                            className={`w-full p-3 md:p-4 rounded-xl font-bold border transition outline-none ${
                                canEditNickname
                                    ? `focus:ring-2 focus:ring-rose-500/20 ${isDark ? 'bg-gray-800 border-gray-700 text-white focus:border-rose-500' : 'bg-white border-gray-200 text-gray-950 focus:border-rose-500'}`
                                    : `cursor-not-allowed ${isDark ? 'bg-gray-800 border-gray-700 text-gray-500' : 'bg-gray-100 border-gray-200 text-gray-400'}`
                            }`}
                        />
                        {!canEditNickname && nextEditableTime && (
                            <p className={`text-xs mt-1.5 font-bold ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                다음 수정 가능: {nextEditableTime}
                            </p>
                        )}
                    </div>

                    {/* 휴대폰 번호 + 재인증 */}
                    <div>
                        <label className={`block text-xs font-black mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                            휴대폰 번호
                            <span className={`ml-1 font-normal ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>(재인증으로만 변경 가능)</span>
                        </label>
                        <div className="flex items-center gap-2">
                            <input
                                type="text"
                                value={formData.phone || '미등록'}
                                readOnly
                                className={`flex-1 min-w-0 p-3 md:p-4 rounded-xl font-bold border ${isDark ? 'bg-gray-800 border-gray-700 text-gray-400' : 'bg-gray-50 border-gray-200 text-gray-500'}`}
                            />
                            <button
                                onClick={() => setShowIdentityModal(true)}
                                className="px-4 py-3 md:py-4 bg-[#f82b60] hover:bg-[#db2456] text-white rounded-xl text-xs font-black shrink-0 transition shadow-lg shadow-rose-500/20 active:scale-95"
                            >
                                재인증
                            </button>
                        </div>
                    </div>

                    {/* 비밀번호 변경 */}
                    <div className={`p-5 md:p-8 rounded-3xl border border-dashed ${isDark ? 'bg-black/20 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                        <h3 className={`text-sm font-black mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>비밀번호 변경</h3>
                        <p className={`text-xs mb-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>변경하지 않으려면 비워두세요.</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <input
                                type="password"
                                placeholder="새 비밀번호 (6자 이상)"
                                value={formData.newPassword}
                                onChange={(e) => handleChange('newPassword', e.target.value)}
                                className={`w-full p-3 md:p-4 rounded-xl font-bold border outline-none focus:ring-2 focus:ring-rose-500/20 ${isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-950'}`}
                            />
                            <input
                                type="password"
                                placeholder="비밀번호 확인"
                                value={formData.newPasswordConfirm}
                                onChange={(e) => handleChange('newPasswordConfirm', e.target.value)}
                                className={`w-full p-3 md:p-4 rounded-xl font-bold border outline-none focus:ring-2 focus:ring-rose-500/20 ${isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-950'}`}
                            />
                        </div>
                    </div>

                    {/* SMS 수신 동의 */}
                    <label className="flex items-center gap-3 cursor-pointer select-none">
                        <input
                            type="checkbox"
                            checked={formData.smsConsent}
                            onChange={(e) => handleChange('smsConsent', e.target.checked)}
                            className="w-4 h-4 accent-[#f82b60]"
                        />
                        <span className={`text-sm font-bold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>SMS 수신 동의 (중요 알림 및 공지사항)</span>
                    </label>

                    {/* 하단 버튼 */}
                    <div className="flex flex-col sm:flex-row justify-between gap-3 pt-8 border-t border-gray-100 dark:border-gray-800">
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
                                className="px-8 py-4 rounded-2xl bg-[#f82b60] text-white font-black hover:bg-[#db2456] shadow-xl shadow-rose-500/20 transition active:scale-95 disabled:opacity-60"
                            >
                                {isSaving ? '저장 중...' : '정보 수정하기'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* 본인인증 모달 */}
            {showIdentityModal && (
                <IdentityVerifyModal
                    onClose={() => setShowIdentityModal(false)}
                    onVerified={handleVerified}
                />
            )}
        </>
    );
};
