'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useBrand } from '@/components/BrandProvider';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';

export const LoginPage = () => {
    const brand = useBrand();
    const router = useRouter();
    const { login, signIn } = useAuth();
    const [loginId, setLoginId] = useState('');
    const [loginPassword, setLoginPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async () => {
        const id = loginId.trim();
        const pw = loginPassword.trim();

        if (!id || !pw) {
            alert('아이디와 비밀번호를 입력해주세요.');
            return;
        }

        setIsLoading(true);
        try {
            // 1. Real Supabase Login (실제 서비스 모드: 하드코딩 테스트 계정 우회 제거)
            // 이제 admin_user 등도 실제 DB비밀번호를 검증하도록 직결됨
            // 2. Real Supabase Login
            // 아이디만 입력한 경우 @waiterzone.kr 이메일 형식으로 변환
            const email = id.includes('@') ? id : `${id}@waiterzone.kr`;
            const authResult = await signIn(email, pw);
            // [Fix] 로그인 성공 시 기존의 모든 시뮬레이션 모드 초기화 (어드민 진입 보장)
            if (typeof window !== 'undefined') {
                localStorage.removeItem('coco_sim_mode');
            }
            alert('로그인에 성공했습니다.');
            
            // role 체크를 통해 어드민이면 /admin, 아니면 / 로 이동
            try {
                // [Fix] 전역 supabase 인스턴스를 사용하여 세션 무결성 보장
                const { supabase: sharedSupabase } = await import('@/lib/supabase');
                
                // [Fix] 세션이 안정화될 때까지 아주 잠시 대기 (Race Condition 방지)
                const { data: { session: currentSession } } = await sharedSupabase.auth.getSession();
                
                // [Fix] 하드코딩된 마스터 어드민 이메일 체크 (비상구)
                const MASTER_EMAILS = ['bizsetter7@gmail.com', 'admin@waiterzone.kr'];
                const isMasterEmail = currentSession?.user?.email && MASTER_EMAILS.includes(currentSession.user.email);

                const { data: profile } = await sharedSupabase
                    .from('profiles')
                    .select('role')
                    .eq('id', authResult?.user?.id)
                    .single();
                
                if (profile?.role === 'admin' || profile?.role === 'master' || isMasterEmail) {
                    // [Fix] 쿠키가 브라우저에 구워질 시간을 벌기 위해 200ms 지연 후 이동
                    setTimeout(() => {
                        window.location.href = '/admin';
                    }, 200);
                    return;
                }
            } catch (err) {
                console.error('Role check failed after login', err);
            }
            // 일반 회원은 홈으로
            setTimeout(() => {
                window.location.href = '/';
            }, 200);
        } catch (err: any) {
            console.error('Login error:', err);
            const msg: string = err.message || '';
            let korMsg = '아이디 또는 비밀번호를 확인해주세요.';
            if (msg.toLowerCase().includes('invalid login') || msg.toLowerCase().includes('invalid credentials')) {
                korMsg = '아이디 또는 비밀번호가 올바르지 않습니다.';
            } else if (msg.toLowerCase().includes('email not confirmed')) {
                korMsg = '이메일 인증이 완료되지 않은 계정입니다. 관리자에게 문의해주세요.';
            } else if (msg.toLowerCase().includes('user not found') || msg.toLowerCase().includes('no user found')) {
                korMsg = '등록되지 않은 아이디입니다.';
            } else if (msg.toLowerCase().includes('too many requests')) {
                korMsg = '로그인 시도가 너무 많습니다. 잠시 후 다시 시도해주세요.';
            }
            alert(korMsg);
        } finally {
            setIsLoading(false);
        }
    };

    const quickLogin = (type: 'admin' | 'shop' | 'personal') => {
        login(type);
        const label = type === 'admin' ? '마스터 관리자' : (type === 'shop' ? '기업 회원' : '일반 회원');
        alert(`${label}로 즉시 로그인되었습니다.`);
        if (type === 'admin') window.location.href = '/admin';
        else window.location.href = '/';
    };

    const handleGoogleLogin = async () => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
            },
        });
        if (error) alert('구글 로그인 실패: ' + error.message);
    };

    const primaryStyle = { color: brand.primaryColor };
    const primaryBgStyle = { backgroundColor: brand.primaryColor };

    return (
        <div className="max-w-md mx-auto px-4 py-16 min-h-[600px] flex flex-col justify-center">
            <div className="text-center mb-10">
                <h2 className="text-3xl font-black mb-2" style={primaryStyle}>{brand.displayName}</h2>
                <p className="text-gray-500">더 나은 미래를 위한 첫 걸음</p>
            </div>
            <div className="space-y-4">
                <input
                    type="text"
                    placeholder="아이디"
                    value={loginId}
                    onChange={(e) => setLoginId(e.target.value)}
                    className={`w-full p-4 rounded-xl border ${brand.theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} `}
                    onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                />
                <input
                    type="password"
                    placeholder="비밀번호"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className={`w-full p-4 rounded-xl border ${brand.theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} `}
                    onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                />
                <button
                    style={primaryBgStyle}
                    className="w-full text-white font-bold py-4 rounded-xl shadow-lg hover:opacity-90 transition active:scale-[0.98]"
                    onClick={handleLogin}
                >
                    로그인
                </button>

                {/* 소셜 로그인 구분선 */}
                <div className="flex items-center gap-3 my-1">
                    <div className="flex-1 h-px bg-gray-200" />
                    <span className="text-xs text-gray-400 whitespace-nowrap">또는 소셜 로그인</span>
                    <div className="flex-1 h-px bg-gray-200" />
                </div>

                {/* 구글 로그인 */}
                <button
                    onClick={handleGoogleLogin}
                    className="w-full flex items-center justify-center gap-3 py-3.5 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all font-semibold text-gray-700 bg-white text-sm"
                >
                    <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    구글로 로그인
                </button>

                <div className="flex justify-center items-center text-[13px] text-gray-400 mt-4 whitespace-nowrap gap-2 sm:gap-4">
                    <button className="cursor-pointer hover:text-gray-600 transition" onClick={() => router.push('/?page=find-id')}>아이디 찾기</button>
                    <span className="w-px h-3 bg-gray-200"></span>
                    <button className="cursor-pointer hover:text-gray-600 transition" onClick={() => router.push('/?page=find-pw')}>비밀번호 찾기</button>
                    <span className="w-px h-3 bg-gray-200"></span>
                    <button className="text-gray-600 font-bold hover:underline" onClick={() => router.push('/?page=signup')}>회원가입</button>
                </div>

                {/* [Exclusive] Quick Login for Owner - Only visible in Development */}
                {process.env.NODE_ENV !== 'production' && (
                    <div className="mt-10 p-4 rounded-2xl bg-gray-50 border border-dashed border-gray-200">
                        <p className="text-center text-[11px] font-black text-gray-400 uppercase tracking-widest mb-4">운영자 전용 원클릭 패스 (개발용)</p>
                        <div className="grid grid-cols-3 gap-2">
                            <button
                                onClick={() => quickLogin('admin')}
                                className="bg-red-600 text-white text-[10px] font-black py-3 rounded-xl shadow-md active:scale-95 transition-all"
                            >
                                마스터
                            </button>
                            <button
                                onClick={() => quickLogin('shop')}
                                className="bg-blue-600 text-white text-[10px] font-black py-3 rounded-xl shadow-md active:scale-95 transition-all"
                            >
                                기업(업주)
                            </button>
                            <button
                                onClick={() => quickLogin('personal')}
                                className="bg-slate-700 text-white text-[10px] font-black py-3 rounded-xl shadow-md active:scale-95 transition-all"
                            >
                                일반회원
                            </button>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};
