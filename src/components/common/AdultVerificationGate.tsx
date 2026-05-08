'use client';

import React, { useState } from 'react';
import { Smartphone, User } from 'lucide-react';
import { useBrand } from '@/components/BrandProvider';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { AUDIT_MODE } from '@/lib/brand-config';
import { supabase } from '@/lib/supabase';
import { UI_Z_INDEX } from '@/constants/ui';

interface AdultVerificationGateProps {
    onVerify: () => void;
    onSkip?: () => void;
    /** 로그인 상태이나 is_adult_verified=false인 유저의 id (OAuth 가입자 등) */
    loggedInUserId?: string;
}

const MOCK_USERS: Record<string, { type: 'corporate' | 'individual', name: string }> = {
    'admin_user': { type: 'individual', name: '마스터관리자' },
    'test_shop': { type: 'corporate', name: '테스트 사장님' },
    'test_user': { type: 'individual', name: '테스트 회원' }
};

const VerificationBadge = () => (
    <div className="py-2 flex items-center justify-center gap-3">
        <div className="shrink-0 w-11 h-11 rounded-full border-[3px] border-red-600 flex items-center justify-center bg-white shadow-sm">
            <span className="text-lg font-black text-gray-900 leading-none">19</span>
        </div>
        <div className="text-left">
            <p className="text-[11.5px] font-black leading-tight text-gray-600">
                본 정보내용은 청소년 유해매체물로서<br />
                <span className="text-red-600">만 19세 미만 청소년은 이용할 수 없습니다.</span>
            </p>
        </div>
    </div>
);

interface LoginFormProps {
    id: string; setId: (v: string) => void;
    pw: string; setPw: (v: string) => void;
    loginType: 'corporate' | 'individual'; setLoginType: (v: any) => void;
    handleLogin: (e: React.FormEvent) => void;
    primaryColor?: string;
    onNav: (page: string) => void;
}

const LoginForm = ({ id, setId, pw, setPw, loginType, setLoginType, handleLogin, primaryColor, onNav }: LoginFormProps) => (
    <div className="space-y-2">
        <div className="flex items-center justify-between">
            <h3 className="text-[11px] font-black text-gray-900 flex items-center gap-1">
                <span className="text-red-500 font-bold">→</span> 회원로그인
            </h3>
            <div className="flex items-center gap-2 text-[10px] font-black">
                {['corporate', 'individual'].map((type) => (
                    <label key={type} className="flex items-center gap-1 cursor-pointer">
                        <input type="radio" value={type} checked={loginType === type} onChange={() => setLoginType(type as any)} className="w-3 h-3 accent-red-500" />
                        <span className={loginType === type ? 'text-red-600' : 'text-gray-400'}>
                            {type === 'corporate' ? '기업회원' : '개인회원'}
                        </span>
                    </label>
                ))}
            </div>
        </div>

        <form onSubmit={handleLogin} className="flex gap-1.5 h-20">
            <div className="flex-1 flex flex-col gap-1.5">
                <input type="text" placeholder="아이디@이메일 (예: hong@gmail.com)" value={id} onChange={(e) => setId(e.target.value)} className="w-full h-1/2 px-3 border-2 border-gray-100 text-[12px] font-bold focus:border-red-500 outline-none rounded-md bg-gray-50/20" />
                <input type="password" placeholder="비밀번호" value={pw} onChange={(e) => setPw(e.target.value)} className="w-full h-1/2 px-3 border-2 border-gray-100 text-[12px] font-bold focus:border-red-500 outline-none rounded-md bg-gray-50/20" />
            </div>
            <button type="submit" style={{ backgroundColor: primaryColor || '#1e3a5f' }} className="w-20 h-full text-white font-black text-xs hover:brightness-105 active:scale-95 transition-all rounded-md shadow-sm">로그인</button>
        </form>

        <div className="flex gap-4 px-1 text-[11px] font-bold text-gray-400">
            <label className="flex items-center gap-1.5 cursor-pointer"><input type="checkbox" className="w-3.5 h-3.5 accent-red-500 rounded" defaultChecked /> 아이디저장</label>
            <label className="flex items-center gap-1.5 cursor-pointer"><input type="checkbox" className="w-3.5 h-3.5 accent-red-500 rounded" defaultChecked /> 자동로그인</label>
        </div>

        <div className="grid grid-cols-3 gap-1.5">
            <button onClick={() => onNav('find-id')} className="bg-gray-100 text-gray-600 text-[10.5px] font-black py-2.5 rounded-md hover:bg-gray-200 transition-colors">아이디찾기</button>
            <button onClick={() => onNav('find-pw')} className="bg-gray-100 text-gray-600 text-[10.5px] font-black py-2.5 rounded-md hover:bg-gray-200 transition-colors">비번찾기</button>
            <button onClick={() => onNav('signup')} className="bg-gray-900 text-white text-[10.5px] font-black py-2.5 rounded-md hover:brightness-110 transition-all">회원가입</button>
        </div>
    </div>
);

// ─── 로그인 유저 전용 간소화 본인인증 UI ─────────────────────────────────────
interface LoggedInVerifyPanelProps {
    userId: string;
    brandName?: string;
    primaryColor?: string;
    onVerify: () => void;
}

const LoggedInVerifyPanel = ({ userId, brandName, primaryColor, onVerify }: LoggedInVerifyPanelProps) => {
    const [isVerifying, setIsVerifying] = useState(false);

    const handleVerify = async () => {
        if (typeof (window as any).PortOne === 'undefined') {
            alert('인증 라이브러리를 불러오는 중입니다. 잠시 후 다시 시도해주세요.');
            return;
        }
        try {
            setIsVerifying(true);
            const response = await (window as any).PortOne.requestIdentityVerification({
                storeId: 'store-6e7eb5d5-d11e-4f26-bdd4-da8d9a743c0a',
                channelKey: 'channel-key-4d5d9730-3097-467b-9e86-21bb1fad82c0',
                identityVerificationId: `verify-${Date.now()}`,
            });

            if (response.code != null) {
                alert(`인증 실패: ${response.message}`);
                setIsVerifying(false);
                return;
            }

            // 서버에서 검증 + 프로필 is_adult_verified=true 저장 [M-066]
            const verifyRes = await fetch('/api/identity/verify-result', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    identityVerificationId: response.identityVerificationId,
                    userId, // 서버에서 profiles.is_adult_verified=true 갱신
                }),
            });

            const data = await verifyRes.json();
            if (verifyRes.ok && data.success) {
                onVerify(); // 게이트 해제 — 이후 로그인 시 자동 패스
            } else {
                alert(`검증 실패: ${data.message || '인증 정보를 확인할 수 없습니다.'}`);
            }
        } catch (error: any) {
            alert(`오류가 발생했습니다: ${error.message}`);
        } finally {
            setIsVerifying(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[20000] overflow-hidden bg-white antialiased flex items-center justify-center p-4">
            <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
                {/* 헤더 */}
                <div className="px-6 pt-7 pb-5 text-center border-b border-gray-100">
                    <div className="w-14 h-14 rounded-full border-[3px] border-red-600 flex items-center justify-center mx-auto mb-3 bg-white shadow-sm">
                        <span className="text-2xl font-black text-gray-900 leading-none">19</span>
                    </div>
                    <h2 className="text-base font-black text-gray-900 mb-1">{brandName || '웨이터존'}</h2>
                    <p className="text-[11.5px] font-bold text-gray-500 leading-snug">
                        본 정보내용은 청소년 유해매체물로서<br />
                        <span className="text-red-600 font-black">만 19세 미만 청소년은 이용할 수 없습니다.</span>
                    </p>
                </div>

                {/* 본문 */}
                <div className="px-6 py-5 space-y-4">
                    <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-center">
                        <p className="text-[12px] font-black text-amber-800 leading-snug">
                            로그인된 계정의 성인인증이 확인되지 않았습니다.<br />
                            <span className="text-amber-600">최초 1회만</span> 인증하면 이후 자동으로 통과됩니다.
                        </p>
                    </div>

                    <button
                        onClick={handleVerify}
                        disabled={isVerifying}
                        style={{ backgroundColor: isVerifying ? '#d1d5db' : (primaryColor || '#1e3a5f') }}
                        className="w-full py-4 text-white font-black text-[13px] rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:cursor-not-allowed shadow-sm"
                    >
                        <Smartphone size={16} />
                        {isVerifying ? '인증 처리 중...' : '휴대폰 본인인증'}
                    </button>

                    <button
                        onClick={() => { window.location.href = 'https://www.google.com'; }}
                        className="w-full py-3 border-2 border-gray-200 text-gray-600 font-black text-[12px] rounded-xl hover:bg-gray-50 transition-all"
                    >
                        성인인증없이 나가기
                    </button>
                </div>

                {/* 푸터 */}
                <div className="shrink-0 bg-gray-900 text-white py-3 px-4 text-center">
                    <p className="text-[10px] font-bold text-gray-400">본인인증 정보는 연령 확인 목적으로만 사용됩니다.</p>
                </div>
            </div>
        </div>
    );
};

export const AdultVerificationGate = ({ onVerify, onSkip, loggedInUserId }: AdultVerificationGateProps) => {
    if (AUDIT_MODE) return null;

    const brand = useBrand();
    const router = useRouter();
    const { login, signIn } = useAuth();
    const [loginType, setLoginType] = useState<'corporate' | 'individual'>('corporate');
    const [id, setId] = useState('');
    const [pw, setPw] = useState('');
    const [isAuthenticating, setIsAuthenticating] = useState(false);

    // 로그인 상태이나 미인증 → 간소화 UI 표시 (로그인 폼 불필요)
    if (loggedInUserId) {
        return (
            <LoggedInVerifyPanel
                userId={loggedInUserId}
                brandName={brand.name}
                primaryColor={brand.primaryColor}
                onVerify={onVerify}
            />
        );
    }

    const handleExit = () => {
        // 나가기 = 사이트 이탈 → Google로 이동 (접근 권한 부여 안 함)
        window.location.href = 'https://www.google.com';
    };
    
    const handleNonMemberAuth = async (type: string) => {
        if (typeof (window as any).PortOne === 'undefined') {
            alert('인증 라이브러리를 불러오는 중입니다. 잠시 후 다시 시도해주세요.');
            return;
        }

        try {
            setIsAuthenticating(true);
            const response = await (window as any).PortOne.requestIdentityVerification({
                storeId: 'store-6e7eb5d5-d11e-4f26-bdd4-da8d9a743c0a',
                channelKey: 'channel-key-4d5d9730-3097-467b-9e86-21bb1fad82c0',
                identityVerificationId: `verify-${Date.now()}`, // [필수] 고유 식별번호 주입
            });

            if (response.code != null) {
                alert(`인증 실패: ${response.message}`);
                setIsAuthenticating(false);
                return;
            }

            // 성공 시 identityVerificationId를 백엔드로 전달하여 검증
            const verifyRes = await fetch('/api/identity/verify-result', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ identityVerificationId: response.identityVerificationId })
            });

            const data = await verifyRes.json();
            if (verifyRes.ok && data.success) {
                onVerify(); // 게이트 해제
                router.push('/'); // 비회원 인증 완료 후 메인페이지로 이동
            } else {
                alert(`검증 실패: ${data.message || '인증 정보를 확인할 수 없습니다.'}`);
            }
        } catch (error: any) {
            console.error('본인인증 오류:', error);
            alert(`오류가 발생했습니다: ${error.message}`);
        } finally {
            setIsAuthenticating(false);
        }
    };

    const handleGoogleLogin = async () => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: { redirectTo: `${window.location.origin}/auth/callback` },
        });
        if (error) alert('구글 로그인 실패: ' + error.message);
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        const targetId = id.trim().toLowerCase();
        if (!targetId || !pw) { alert('아이디와 비밀번호를 입력해주세요.'); return; }

        setIsAuthenticating(true);
        try {
            const foundMockUser = MOCK_USERS[targetId];
            if (foundMockUser) {
                const isAdmin = targetId.startsWith('admin_');
                if (!isAdmin && foundMockUser.type !== loginType) {
                    alert('회원 구분을 확인해주세요.');
                    setIsAuthenticating(false);
                    return;
                }
                const sessionType = isAdmin ? 'admin' : (foundMockUser.type === 'corporate' ? 'shop' : 'personal');
                login(sessionType as any, targetId, foundMockUser.name, foundMockUser.name);
                onVerify();
                return;
            }

            // 아이디 입력 시 @waiterzone.kr 이메일로 변환 (LoginPage와 동일한 로직)
            const email = targetId.includes('@') ? targetId : `${targetId}@waiterzone.kr`;
            await signIn(email, pw);

            // 회원 유형 불일치 검사 — 불일치 시 로그아웃 후 차단
            try {
                const { data: { user: authUser } } = await supabase.auth.getUser();
                if (authUser) {
                    const { data: profile } = await supabase.from('profiles').select('role').eq('id', authUser.id).single();
                    const rawRole = profile?.role || 'individual';

                    // M-014: employee(구형) + individual(신형) 모두 개인회원 — 정규화 필수
                    const isCorporate = rawRole === 'corporate' || rawRole === 'admin';
                    const selectedIsCorporate = loginType === 'corporate';

                    if (isCorporate !== selectedIsCorporate) {
                        // 타입 불일치 → 즉시 로그아웃 후 차단 (경고만 하고 통과시키지 않음)
                        await supabase.auth.signOut();
                        alert(`회원유형을 확인해주세요.\n선택: ${selectedIsCorporate ? '기업회원' : '개인회원'} / 실제: ${isCorporate ? '기업회원' : '개인회원'}`);
                        setIsAuthenticating(false);
                        return;
                    }
                }
            } catch (_) { /* 유형 검사 실패 시 로그인 허용 */ }

            onVerify();
        } catch (err: any) {
            alert(`로그인 실패: ${err.message}`);
        } finally {
            setIsAuthenticating(false);
        }
    };

    return (
        <div className={`fixed inset-0 z-[${UI_Z_INDEX.VERIFICATION_GATE}] overflow-hidden bg-white antialiased`}>
            <div className="flex flex-col items-center justify-start h-full w-full">
                <div className="flex flex-col w-full h-full bg-white relative overflow-hidden animate-in fade-in duration-300" style={{ maxWidth: '400px', textRendering: 'optimizeLegibility' }}>
                    
                    <div className="flex-1 flex flex-col overflow-y-auto overflow-x-hidden custom-scrollbar min-h-0">
                        <div className="flex-1 flex flex-col pt-8 pb-3 px-5 space-y-3 min-h-0">
                            <div className="flex flex-col items-center mb-2 shrink-0">
                                <h1 className="text-lg font-black text-gray-900 tracking-tighter flex items-center gap-1.5">
                                    <div className="w-7 h-7 bg-gray-900 rounded-full flex items-center justify-center">
                                        <User className="text-white w-2/3 h-2/3" />
                                    </div>
                                    {brand.name || 'COCO ALBA'}
                                </h1>
                            </div>

                            <VerificationBadge />

                            <div className="text-center pb-1">
                                <p className="text-[13px] font-black text-gray-800 tracking-tight leading-snug">
                                    서비스 이용을 위해 <span className="text-red-500 underline underline-offset-4 decoration-2">로그인</span> 또는 <span className="text-red-500 underline underline-offset-4 decoration-2">성인인증</span>이 필요합니다.
                                </p>
                            </div>

                            <LoginForm
                                id={id} setId={setId} pw={pw} setPw={setPw}
                                loginType={loginType} setLoginType={setLoginType}
                                handleLogin={handleLogin} primaryColor={brand.primaryColor}
                                onNav={(page) => router.push(`/?page=${page}`)}
                            />

                            {/* 구글 소셜 로그인 */}
                            <div className="space-y-1.5">
                                <div className="flex items-center gap-2">
                                    <div className="flex-1 h-px bg-gray-100" />
                                    <span className="text-[10px] text-gray-400 whitespace-nowrap font-bold">또는 소셜 로그인</span>
                                    <div className="flex-1 h-px bg-gray-100" />
                                </div>
                                <button
                                    onClick={handleGoogleLogin}
                                    className="w-full flex items-center justify-center gap-2 py-2.5 border-2 border-gray-100 rounded-lg hover:bg-gray-50 transition-all text-[11.5px] font-bold text-gray-700 bg-white"
                                >
                                    <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0" aria-hidden="true">
                                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                                    </svg>
                                    구글로 로그인
                                </button>
                            </div>

                            {/* 4. Non-Member Verification Area */}
                            <div className="space-y-2">
                                <h3 className="text-[11px] font-black text-gray-900 flex items-center gap-1">
                                    <span className="text-red-500 font-bold">→</span> 비회원 본인인증
                                </h3>
                                <div className="h-20">
                                    <button onClick={() => handleNonMemberAuth('휴대폰')} className="w-full h-full flex flex-col items-center justify-center gap-2 border-2 border-gray-100 rounded-lg group hover:border-red-200 hover:bg-red-50/20 transition-all">
                                        <Smartphone className="text-gray-300 group-hover:text-red-500 w-1/3 h-1/3" />
                                        <span className="text-[10.5px] font-black text-gray-600 group-hover:text-red-700">휴대폰인증</span>
                                    </button>
                                </div>
                                <div className="text-center py-1 space-y-2.5">
                                    <p className="text-[10.5px] font-black text-gray-500 leading-tight">인증 시 정보를 저장하지 않으며,<br /><span className="text-red-400">1회성 인증</span>으로 즉시 이용 가능합니다.</p>
                                    <button onClick={handleExit} className="w-full py-2.5 border-2 border-gray-900 text-gray-900 font-black text-[13px] rounded-lg hover:bg-gray-900 hover:text-white transition-all shadow-sm">성인인증없이 나가기</button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 5. Footer */}
                    <div className="shrink-0 bg-[#1e3a5f] text-white py-5 px-4 text-center select-none">
                        <p className="text-[14px] font-black leading-tight mb-1 opacity-90">
                            {brand.name || '웨이터존'} 고객센터
                        </p>
                        <p className="text-[28px] font-black tracking-tight leading-none">
                            1877-1442
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
