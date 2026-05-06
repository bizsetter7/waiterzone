'use client';

import React, { useState, useEffect } from 'react';
import { usePathname, useSearchParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { AdminSidebar, AdminMobileSidebar, AdminTab } from '@/components/admin/AdminSidebar';
import { ShieldCheck, LayoutDashboard } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const { isLoggedIn, userType, isLoading } = useAuth();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isAuthorized, setIsAuthorized] = useState(false);

    // Auth Check (Fixed: Redirect added for Client-side Security)
    useEffect(() => {
        if (isLoading) return;
        if (!isLoggedIn || userType !== 'admin') {
            // [Fix] 미들웨어 우회 시 직접적인 보안 확인을 위해 홈(로그인폼)으로 리다이렉트
            alert('관리자 권한이 필요합니다.');
            router.push('/?page=login');
        } else {
            setIsAuthorized(true);
            // [Fix] 관리자 API 인증 쿠키 갱신 — requireAdmin 서버 체크용 (7일 유효)
            // mock 로그인이든 실 Supabase 로그인이든 어드민 페이지 진입 시마다 갱신
            if (typeof document !== 'undefined' && process.env.NODE_ENV !== 'production') {
                document.cookie = 'coco_admin_mock=1; path=/; max-age=604800; SameSite=Lax';
            }
        }
    }, [isLoading, isLoggedIn, userType, router]);

    // Determine Active Tab
    const getCurrentTab = (): AdminTab => {
        if (pathname?.startsWith('/admin/marketing')) return 'marketing';
        const tab = searchParams?.get('tab');
        return (tab as AdminTab) || 'stats';
    };

    const activeTab = getCurrentTab();

    // Counts State
    const [counts, setCounts] = useState({
        ads: 0,
        inquiries: 0,
        payments: 0,
        business: 0,
        applications: 0,
        health: 0,
    });

    const fetchCounts = React.useCallback(async () => {
        try {
            // Fetch Pending Ads
            const { count: adsCount } = await supabase
                .from('shops')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'pending');

            // Fetch New Inquiries
            const { count: inqCount } = await supabase
                .from('inquiries')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'new');

            // Fetch Pending Payments
            const { count: payCount } = await supabase
                .from('payments')
                .select('*', { count: 'exact', head: true })
                .neq('status', 'completed');

            // Fetch Pending Business Verifications
            const { count: bizCount } = await supabase
                .from('profiles')
                .select('*', { count: 'exact', head: true })
                .eq('business_verify_status', 'pending');

            // Merge Local Mocks
            const localMockAdsRaw = localStorage.getItem('coco_mock_ads');
            let localPendingAds = 0;
            if (localMockAdsRaw) {
                try {
                    const localAds = JSON.parse(localMockAdsRaw);
                    localPendingAds = localAds.filter((a: any) => a.status === 'pending').length;
                } catch (e) { }
            }

            const { count: appCount } = await supabase
                .from('applications')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'pending');

            // Health check (경량 GET)
            let healthCount = 0;
            try {
                const { data: { session: hlSession } } = await supabase.auth.getSession();
                const hlToken = hlSession?.access_token;
                const healthRes = await fetch('/api/admin/health', {
                    method: 'GET',
                    headers: hlToken ? { 'Authorization': `Bearer ${hlToken}` } : undefined,
                });
                const healthData = await healthRes.json();
                healthCount = healthData.issueCount || 0;
            } catch { healthCount = 1; }

            setCounts({
                ads: (adsCount || 0) + localPendingAds,
                inquiries: inqCount || 0,
                payments: payCount || 0,
                business: bizCount || 0,
                applications: appCount || 0,
                health: healthCount,
            });
        } catch (e) {
            console.error('Error fetching admin counts:', e);
        }
    }, []);

    useEffect(() => {
        if (isAuthorized) {
            fetchCounts();

            // Listen for internal NoteService updates
            window.addEventListener('notes-updated', fetchCounts);

            // Supabase Realtime Subscriptions
            const channel = supabase
                .channel('admin-counts-all')
                .on('postgres_changes', { event: '*', schema: 'public', table: 'shops' }, fetchCounts)
                .on('postgres_changes', { event: '*', schema: 'public', table: 'inquiries' }, fetchCounts)
                .on('postgres_changes', { event: '*', schema: 'public', table: 'payments' }, fetchCounts)
                .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, fetchCounts)
                .subscribe();

            return () => {
                window.removeEventListener('notes-updated', fetchCounts);
                supabase.removeChannel(channel);
            };
        }
    }, [isAuthorized, fetchCounts]);

    const handleNavigate = (tab: AdminTab) => {
        if (tab === 'marketing') {
            router.push('/admin/marketing');
        } else {
            router.push(`/admin?tab=${tab}`);
        }
    };

    if (isLoading) return <div className="min-h-screen flex items-center justify-center font-bold">로딩 중...</div>;

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row relative font-sans">
            {/* Mobile Header */}
            <header className="md:hidden bg-slate-950 text-white p-4 flex justify-between items-center sticky top-0 z-[10002] shrink-0 shadow-lg">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20">
                        <ShieldCheck size={18} className="text-white" />
                    </div>
                    <span className="font-black tracking-tighter italic text-lg">COCO ADMIN</span>
                </div>
                <button onClick={() => setIsSidebarOpen(true)} className="p-2 hover:bg-slate-900 rounded-xl transition-colors">
                    <LayoutDashboard size={24} className="text-blue-400" />
                </button>
            </header>

            {/* Mobile Sidebar */}
            <AdminMobileSidebar
                activeTab={activeTab}
                counts={counts}
                onNavigate={handleNavigate}
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
            />

            {/* Desktop Sidebar */}
            <AdminSidebar
                activeTab={activeTab}
                counts={counts}
                onNavigate={handleNavigate}
                className="shadow-2xl shadow-slate-900/10"
            />

            {/* Main Content */}
            <main className="flex-1 w-full p-4 md:p-8 lg:p-12 overflow-y-auto">
                <div className="max-w-[1400px] mx-auto">
                    {children}
                </div>
            </main>
        </div>
    );
}
