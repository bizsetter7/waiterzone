'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

/**
 * OAuth 콜백 핸들러 (Google 등)
 * Supabase code → session 교환 후 홈으로 리다이렉트
 */
export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const handleCallback = async () => {
      const url = new URL(window.location.href);
      const code = url.searchParams.get('code');

      if (code) {
        try {
          await supabase.auth.exchangeCodeForSession(code);
        } catch {
          // 교환 실패해도 계속 진행
        }
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        // OAuth 가입자 profiles 보정 (placeholder username, 미설정 full_name, 미지급 100p)
        try {
          await fetch('/api/auth/oauth-complete', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session.access_token}`,
            },
          });
        } catch { /* 보정 실패해도 로그인 흐름은 진행 */ }

        // 로그인 완료 → 성인게이트 자동 통과 (localStorage 플래그)
        localStorage.setItem('adult_verified', 'true');
        window.location.href = '/';
      } else {
        router.replace('/');
      }
    };

    handleCallback();
  }, [router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-white">
      <div className="w-10 h-10 border-4 border-blue-700 border-t-transparent rounded-full animate-spin" />
      <p className="text-gray-500 text-sm font-medium">구글 로그인 처리 중...</p>
    </div>
  );
}
