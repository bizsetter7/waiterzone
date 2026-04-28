'use client'; // Re-triggering deployment after limit reset

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useBrand } from '@/components/BrandProvider';
import { StickyWrapper } from '@/components/ui/StickyWrapper';

import {
    Megaphone,
    Info,
    FileText,
    Home,
    ShoppingBag,
    HelpCircle,
    MessageSquare,
    PhoneCall,
    MessageCircle,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { TabHome } from './components/TabHome';
import { TabUsageGuide } from './components/TabUsageGuide';
import { TabFAQ } from './components/TabFAQ';
import { TabPolicies } from './components/TabPolicies';
import { TabAdGuide } from './components/TabAdGuide';
import { TabNotice } from './components/TabNotice';
import { TabInquiry } from './components/TabInquiry';


export default function CustomerCenterPage() {
    return (
        <>
            {/* Deployment Verification Tag for SSR Visibility */}
            <div data-deploy-version="2026-02-04-03:00" style={{ display: 'none' }}></div>
            <Suspense fallback={<div className="min-h-screen flex items-center justify-center font-bold">로딩 중...</div>}>
                <CustomerCenterContent />
            </Suspense>
        </>
    );
}

export function CustomerCenterContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const brand = useBrand();

    // SSR 안전한 탭 상태 관리
    const [activeTab, setActiveTab] = useState('센터 홈');
    const [isMounted, setIsMounted] = useState(false);


    useEffect(() => {
        setIsMounted(true);
    }, []);

    // 쿼리 스트링 변경 감지하여 탭 전환 및 스크롤 제어
    // Sync activeTab with URL query parameters & Reset Filters
    useEffect(() => {
        if (!isMounted) return;
        const tab = searchParams.get('tab') || searchParams.get('page');
        if (tab) {
            let targetTab = '공지사항';
            if (tab === 'dashboard' || tab === 'home') targetTab = '센터 홈';
            else if (tab === 'notice' || tab === 'support') targetTab = '공지사항';
            else if (tab === 'ad') targetTab = '광고안내';
            else if (tab === 'guide') targetTab = '이용방법';
            else if (tab === 'faq') targetTab = '자주묻는질문';
            else if (tab === 'inquiry') targetTab = '1:1 문의';
            else if (tab === 'policy') targetTab = '약관 및 정책';

            if (activeTab !== targetTab) {
                setActiveTab(targetTab);
                window.scrollTo({ top: 0, behavior: 'instant' });
            }
        }
    }, [searchParams, isMounted, activeTab]);

    // Admin & Session State
    const { user: authUser, isLoggedIn } = useAuth();

    // 탭 변경 시 URL만 변경 (상태는 useEffect가 searchParams를 감지하여 변경함)
    const handleTabChange = (tabName: string) => {
        const params = new URLSearchParams(searchParams.toString());
        let tabParam = 'dashboard';
        if (tabName === '센터 홈' || tabName === 'dashboard') tabParam = 'dashboard';
        else if (tabName === '공지사항') tabParam = 'notice';
        else if (tabName === '광고안내') tabParam = 'ad';
        else if (tabName === '이용방법') tabParam = 'guide';
        else if (tabName === '자주묻는질문') tabParam = 'faq';
        else if (tabName === '1:1 문의' || tabName === '1:1문의') tabParam = 'inquiry';
        else if (tabName === '약관 및 정책') tabParam = 'policy';

        params.set('tab', tabParam);
        router.push(`${pathname}?${params.toString()}`, { scroll: false });
    };



    const TABS = [
        { id: '센터 홈', icon: <Home size={16} /> },
        { id: '공지사항', icon: <Megaphone size={16} /> },
        { id: '광고안내', icon: <ShoppingBag size={16} /> },
        { id: '이용방법', icon: <Info size={16} /> },
        { id: '자주묻는질문', icon: <HelpCircle size={16} /> },
        { id: '1:1 문의', icon: <MessageSquare size={16} /> },
        { id: '약관 및 정책', icon: <FileText size={16} /> },
    ];



    return (
        <>

            <div className="px-4 pt-6">
                <div className="flex flex-col md:flex-row gap-8">
                    {/* Sidebar / Mobile Nav (Sticky 지원) */}
                    <aside className="w-full md:w-64 shrink-0 z-50 self-stretch relative">
                        <StickyWrapper offsetTop={56} isInternal={true}>
                            <div className={`rounded-2xl md:rounded-3xl md:border overflow-hidden ${brand.theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100 shadow-sm'}`}>
                                {/* PC Title / Mobile Toggle Header */}
                                <div className={`p-4 md:p-5 border-b flex items-center justify-between rounded-t-2xl md:rounded-t-3xl ${brand.theme === 'dark' ? 'bg-gray-700/50 border-gray-700' : 'bg-gray-50 border-gray-100'}`}>
                                    <p className={`text-[13px] font-black uppercase tracking-widest hidden md:block ${brand.theme === 'dark' ? 'text-gray-100' : 'text-gray-400'}`}>Customer Support</p>
                                    {/* Mobile View: Active Tab Display Only */}
                                    <div className="md:hidden flex items-center gap-2 text-sm font-black w-full justify-between">
                                        <span className={`${brand.theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{activeTab}</span>
                                    </div>
                                </div>

                                {/* Desktop Nav List (Hidden on mobile) */}
                                <nav className="hidden md:flex flex-col p-2 md:p-0 gap-1 md:gap-0">
                                    {TABS.map((tab) => (
                                        <button
                                            key={tab.id}
                                            onClick={() => handleTabChange(tab.id)}
                                            className={`w-full flex items-center justify-start gap-3 md:gap-4 px-4 py-3 md:px-6 md:py-5 text-[13px] md:text-sm font-black whitespace-nowrap rounded-lg md:rounded-none md:border-l-4 ${activeTab === tab.id
                                                ? `bg-blue-50 md:bg-gradient-to-br md:border-[#1e3a5f] shadow-sm md:shadow-none ${brand.theme === 'dark' ? 'from-blue-900/20 to-gray-800 text-blue-400 bg-gray-700' : 'bg-white text-[#1e3a5f]'}`
                                                : `${brand.theme === 'dark' ? 'bg-transparent text-gray-400 hover:text-white' : 'bg-transparent text-gray-500 hover:text-gray-900'} border-transparent`}`}
                                        >
                                            <div className={` ${activeTab === tab.id ? 'text-[#1e3a5f]' : 'text-gray-300'}`}>
                                                {tab.icon}
                                            </div>
                                            <span>{tab.id}</span>
                                        </button>
                                    ))}
                                </nav>
                            </div>

                            {/* Customer Service Box (Desktop Only) */}
                            <div className={`hidden md:block mt-1 p-5 rounded-[32px] border ${brand.theme === 'dark' ? 'bg-gray-800 border-gray-700 shadow-blue-900/10' : 'bg-white border-gray-100 shadow-gray-100/10'} shadow-xl`}>
                                <div className="flex items-center gap-3 mb-5">
                                    <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-lg bg-[#1e3a5f]">
                                        <PhoneCall size={20} />
                                    </div>
                                    <span className={`font-black text-lg ${brand.theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>고객센터</span>
                                </div>
                                <p className={`text-3xl font-black mb-2 tracking-tighter ${brand.theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>1877-1442</p>
                                <p className={`text-[13px] leading-relaxed font-black ${brand.theme === 'dark' ? 'text-gray-200' : 'text-gray-500'}`}>
                                    평일 10:00 ~ 18:00<br />
                                    점심 12:00 ~ 13:00<br />
                                    <span className="text-[#1e3a5f] font-black mt-1 block">공휴일 / 주말 휴무</span>
                                </p>
                                <a href="https://t.me/waiterzone_cs_bot" className="mt-6 flex items-center justify-center gap-2 w-full py-4 bg-gray-900 text-white rounded-2xl text-sm font-black hover:bg-black transition shadow-lg">
                                    <MessageCircle size={18} /> 텔레그램 실시간 상담
                                </a>
                            </div>
                        </StickyWrapper>
                    </aside>

                    {/* Content Area */}
                    <div className="flex-1 min-w-0 pb-20">
                        {/* 0. Center Dashboard (Landing View) */}
                        {(activeTab === '센터 홈' || !activeTab) && (
                            <TabHome onTabChange={handleTabChange} />
                        )}
                        {/* 1. Notice Board */}
                        {activeTab === '공지사항' && (
                            <TabNotice />
                        )}

                        {/* 2. Ad Guide */}
                        {activeTab === '광고안내' && (
                            <TabAdGuide onTabChange={handleTabChange} />
                        )}



                        {/* 3. Usage Guide */}
                        {
                            activeTab === '이용방법' && (
                                <TabUsageGuide />
                            )
                        }

                        {/* 4. FAQ */}
                        {
                            activeTab === '자주묻는질문' && (
                                <TabFAQ />
                            )
                        }

                        {/* 5. 1:1 Inquiry Board System */}
                        {(activeTab === '1:1 문의' || activeTab === '1:1문의') && (
                            <TabInquiry isLoggedIn={isLoggedIn} authUser={authUser} />
                        )}

                        {/* 6. 약관 및 정책 */}
                        {
                            activeTab === '약관 및 정책' && (
                                <TabPolicies />
                            )
                        }

                        {/* Customer Service Box (Mobile Lower Position) */}
                        <div className={`md:hidden mt-6 p-5 rounded-2xl border ${brand.theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-lg bg-[#1e3a5f]">
                                    <PhoneCall size={20} />
                                </div>
                                <span className={`font-black text-lg ${brand.theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>고객센터</span>
                            </div>
                            <p className={`text-3xl font-black mb-2 tracking-tighter ${brand.theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>1877-1442</p>
                            <p className={`text-[12px] leading-relaxed font-black ${brand.theme === 'dark' ? 'text-gray-300' : 'text-gray-500'}`}>
                                평일 10:00 ~ 18:00 / 점심 12:00 ~ 13:00<br />
                                <span className="text-[#1e3a5f] font-black mt-1 block">공휴일 / 주말 휴무 (텔레그램 상시 대기)</span>
                            </p>
                            <a href="https://t.me/waiterzone_cs_bot" className="mt-6 flex items-center justify-center gap-3 w-full py-4 bg-[#1e3a5f] text-white rounded-[20px] text-sm font-black hover:bg-[#162d4a] transition shadow-xl shadow-sm">
                                <MessageCircle size={18} /> 텔레그램 실시간 상담
                            </a>
                        </div>
                    </div>
                </div>

                <div data-deploy-version="2026-02-04-02:40" style={{ display: 'none' }}></div>
            </div>
        </>
    );
}
