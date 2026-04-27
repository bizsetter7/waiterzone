'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Star, CreditCard, AlertTriangle, Briefcase, FileText, User, Home, Settings, LayoutDashboard, X, Gift, Coins, Lock, CalendarDays } from 'lucide-react';
import { useBrand } from '@/components/BrandProvider';
import { useAuth } from '@/hooks/useAuth';
import { PersonalMemberEdit } from '../PersonalMemberEdit';
import { ResumeForm } from '../ResumeForm';
import { ResumeListView } from '../ResumeListView';
import { ComingSoonView } from '../ComingSoonView';
import { MyPostsView } from '../MyPostsView';
import { BlockSettingsView } from '../BlockSettingsView';
import { PointExchangeView } from '../PointExchangeView';
import { PointHistoryView } from '../PointHistoryView';
import { ChangePasswordView } from '../ChangePasswordView';
import { AttendanceView } from '../AttendanceView';
import { supabase } from '@/lib/supabase';
import JobDetailModal from '@/components/jobs/JobDetailModal';
import { getFavorites, toggleFavorite as toggleFav, getDaysUntilExpiry, SCRAP_EXPIRE_DAYS, getAllShopSnapshots } from '@/utils/favorites';




export function PersonalSidebar({ view, setView }: { view: any, setView: (v: any) => void }) {
    const brand = useBrand();
    const { user } = useAuth();
    // useAuth 우선, 없으면 localStorage 폴백
    const displayName = user?.nickname || user?.name || localStorage.getItem('user_name') || '회원';
    const fileInputRef = React.useRef<HTMLInputElement>(null);
    const [profileImage, setProfileImage] = useState<string | null>(null);

    useEffect(() => {
        const savedImg = localStorage.getItem('personal_profile_image');
        if (savedImg) setProfileImage(savedImg);
        // 모바일에서 이미지 업로드 시 PC 사이드바도 업데이트
        const handler = () => {
            const saved = localStorage.getItem('personal_profile_image');
            setProfileImage(saved || null);
        };
        window.addEventListener('profile-image-updated', handler);
        return () => window.removeEventListener('profile-image-updated', handler);
    }, []);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = reader.result as string;
                setProfileImage(base64String);
                localStorage.setItem('personal_profile_image', base64String);
                window.dispatchEvent(new CustomEvent('profile-image-updated'));
            };
            reader.readAsDataURL(file);
        }
    };

    const isItemActive = (id: string) => {
        const currentViewId = typeof view === 'object' ? view.id : view;
        if (id === 'resume-list') return currentViewId === 'resume-list' || currentViewId === 'resume-form';
        return currentViewId === id;
    };

    const menuItems = [
        { id: 'dashboard', icon: LayoutDashboard, label: '마이홈' },
        { id: 'member-edit', icon: User, label: '정보수정' },
        { id: 'resume-list', icon: FileText, label: '이력서 관리' },
        { id: 'scrap-jobs', icon: Star, label: '채용정보 스크랩' },
        { id: 'point-history', icon: Coins, label: '포인트 및 점프 내역' },
        { id: 'point-exchange', icon: Gift, label: '포인트 상품권 교환' },
        { id: 'payment-history', icon: CreditCard, label: '유료 결제 내역' },
        { id: 'excluded-shops', icon: AlertTriangle, label: '열람불가 업소설정' },
        { id: 'custom-jobs', icon: Briefcase, label: '맞춤구인정보' },
        { id: 'my-posts', icon: FileText, label: '내가 작성한 게시글' },
        { id: 'block-settings', icon: User, label: '회원 차단 설정' },
    ];

    return (
        <aside className="hidden md:block md:col-span-1 space-y-4">
            <div className={`p-6 rounded-[32px] border shadow-sm text-center ${brand.theme === 'dark' ? 'bg-gray-900 border-gray-800' : 'bg-white border-blue-100'}`}>
                <div
                    onClick={() => fileInputRef.current?.click()}
                    className="w-20 h-20 bg-blue-50 rounded-full mx-auto mb-4 flex items-center justify-center text-blue-500 border-2 border-blue-100 overflow-hidden cursor-pointer group relative"
                >
                    {profileImage ? (
                        <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                        <User size={32} />
                    )}
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Settings size={16} className="text-white" />
                    </div>
                </div>
                <h2 className="font-black text-xl mb-1">{displayName}</h2>
                <div className="flex flex-col items-center gap-2 mb-4">
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="px-4 py-1.5 bg-rose-50 text-[#f82b60] text-[10px] font-black rounded-full border border-rose-100 hover:bg-rose-100 transition active:scale-95 flex items-center gap-1"
                    >
                        사진 등록/수정
                    </button>
                    <button
                        onClick={() => setView('member-edit')}
                        className={`w-full py-2.5 mt-2 flex items-center justify-center gap-2 text-xs font-black rounded-2xl transition-all ${typeof view === 'string' && view === 'member-edit'
                            ? 'bg-[#f82b60] text-white shadow-lg shadow-rose-100'
                            : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                            }`}
                    >
                        <Settings size={14} />
                        내 정보수정
                    </button>
                </div>
            </div>

            <div className={`p-4 rounded-3xl border shadow-sm ${brand.theme === 'dark' ? 'bg-gray-900 border-gray-800 text-white' : 'bg-white border-gray-100 text-gray-900'}`}>
                <div className="flex flex-col gap-1">
                    {menuItems.filter(item => item.id !== 'member-edit').map((item) => (
                        <button
                            key={item.id}
                            onClick={() => setView(item.id)}
                            className={`w-full flex items-center gap-3 p-3.5 rounded-2xl text-sm font-black transition-all ${isItemActive(item.id)
                                ? 'bg-[#f82b60] text-white shadow-lg shadow-rose-100'
                                : item.id === 'point-exchange'
                                    ? 'text-[#f82b60] bg-rose-50 hover:bg-rose-100 border border-rose-100'
                                    : 'text-gray-500 hover:bg-gray-50'
                                }`}
                        >
                            <item.icon size={18} />
                            {item.label}
                        </button>
                    ))}
                </div>
            </div>
        </aside>
    );
}

export function ScrapJobsView({ setView }: { setView: (v: any) => void }) {
    const brand = useBrand();
    const router = useRouter();
    const [favorites, setFavorites] = useState<string[]>([]);
    const [selectedShop, setSelectedShop] = useState<any | null>(null);
    const [favoriteShops, setFavoriteShops] = useState<any[]>([]);

    useEffect(() => {
        // 만료 항목 자동 정리 후 유효 목록 로드
        const validIds = getFavorites();
        setFavorites(validIds);
        if (validIds.length === 0) { setFavoriteShops([]); return; }

        // Supabase에서 스크랩된 shop ID들에 해당하는 공고 조회 (status 무관 — 임시/심사중 공고도 표시)
        supabase
            .from('shops')
            .select('*')
            .in('id', validIds)
            .then(({ data }) => {
                const dbShops = (data || []).map((ad: any) => ({
                    ...ad,
                    workType: ad.work_type || ad.category || ad.options?.category || '',
                    region: ad.region || ad.work_region || ad.options?.regionCity || '',
                    name: ad.name || ad.shop_name || '',
                    phone: ad.phone || ad.manager_phone || '',
                    kakao: ad.kakao || ad.kakao_id || ad.options?.kakao || '',
                    pay: String(ad.pay_amount || ad.options?.payAmount || 0),
                    is_placeholder: false, url: '', site: '',
                }));

                // Supabase에 없는 ID(shops.json 공고 등)는 localStorage 스냅샷으로 보완
                const dbIds = new Set(dbShops.map((s: any) => s.id));
                const snapshots = getAllShopSnapshots();
                const snapshotShops = validIds
                    .filter(id => !dbIds.has(id) && snapshots[id])
                    .map(id => ({ ...snapshots[id], is_placeholder: false, url: '', site: '' }));

                const merged = [...dbShops, ...snapshotShops];
                // 스크랩 순서 유지 (validIds 순서 기준)
                merged.sort((a: any, b: any) => validIds.indexOf(a.id) - validIds.indexOf(b.id));
                setFavoriteShops(merged);
            });
    }, []);

    const handleToggle = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        const newFavs = toggleFav(id, favorites);
        setFavorites(newFavs);
        setFavoriteShops(prev => prev.filter(s => s.id !== id));
        if (selectedShop?.id === id) setSelectedShop(null);
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
                <h2 className="text-xl font-black flex items-center gap-2">
                    <Star size={20} className="text-yellow-400 fill-yellow-400" /> 채용정보 스크랩
                </h2>
                <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400 font-bold">{SCRAP_EXPIRE_DAYS}일 후 자동 삭제</span>
                    <span className="text-sm font-black text-[#f82b60]">{favoriteShops.length}건</span>
                </div>
            </div>

            {favoriteShops.length === 0 ? (
                <div className={`p-12 rounded-[32px] border text-center ${brand.theme === 'dark' ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'}`}>
                    <Star size={40} className="text-gray-200 mx-auto mb-4" />
                    <p className="text-gray-400 font-bold text-sm">스크랩한 공고가 없습니다.</p>
                    <p className="text-gray-300 text-xs mt-1">공고 상세 화면의 ☆ 버튼을 눌러 스크랩하세요.</p>
                    <button
                        onClick={() => router.push('/')}
                        className="mt-6 px-6 py-2.5 bg-[#f82b60] text-white rounded-xl text-sm font-black hover:bg-[#db2456] transition-all"
                    >
                        공고 보러 가기
                    </button>
                </div>
            ) : (
                <div className="flex flex-col gap-3">
                    {favoriteShops.map((shop: any) => {
                        const daysLeft = getDaysUntilExpiry(shop.id);
                        const isExpiringSoon = daysLeft !== null && daysLeft <= 7;
                        return (
                            <div
                                key={shop.id}
                                onClick={() => setSelectedShop(shop)}
                                className={`p-5 rounded-[24px] border shadow-sm cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all ${brand.theme === 'dark' ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'}`}
                            >
                                <div className="flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                        <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center shrink-0">
                                            <Star size={18} className="text-yellow-400 fill-yellow-400" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-black text-sm truncate">{shop.name || shop.title}</p>
                                            <p className="text-xs text-gray-400 mt-0.5">{shop.region} · {shop.pay}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        {daysLeft !== null && (
                                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${isExpiringSoon ? 'bg-red-50 text-red-500' : 'bg-gray-50 text-gray-400'}`}>
                                                {daysLeft}일 후 만료
                                            </span>
                                        )}
                                        <button
                                            onClick={(e) => handleToggle(e, shop.id)}
                                            className="p-2 text-yellow-400 hover:text-gray-300 transition-colors"
                                            aria-label="스크랩 해제"
                                        >
                                            <X size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {selectedShop && (
                <JobDetailModal
                    shop={selectedShop}
                    onClose={() => setSelectedShop(null)}
                    isFavorite={favorites.includes(selectedShop.id)}
                    onToggleFavorite={(e) => handleToggle(e, selectedShop.id)}
                />
            )}
        </div>
    );
}

export function PersonalDashboardHome({ setView, resumeCount = 0 }: { setView: (v: any) => void, resumeCount?: number }) {
    const brand = useBrand();
    const { user } = useAuth();
    // useAuth 우선, 없으면 localStorage 폴백. '님' 접미어 제거
    const rawName = user?.nickname || user?.name || localStorage.getItem('user_name') || '회원';
    const displayName = rawName.endsWith('님') ? rawName.slice(0, -1) : rawName;

    // 실제 스크랩/열람/지원 카운트 읽기
    const [scrapCount, setScrapCount] = useState(0);
    const [viewedCount, setViewedCount] = useState(0);
    const [applyCount, setApplyCount] = useState(0);

    useEffect(() => {
        try {
            // 스크랩 — 'favorites' 키 (HomeClient/JobClient/RegionClient에서 저장)
            const favs = localStorage.getItem('favorites');
            setScrapCount(favs ? JSON.parse(favs).length : 0);
        } catch { setScrapCount(0); }

        try {
            // 열람한 공고 — 'viewed_shops' 키 (공고 클릭 시 저장)
            const viewed = localStorage.getItem('viewed_shops');
            setViewedCount(viewed ? JSON.parse(viewed).length : 0);
        } catch { setViewedCount(0); }

        try {
            // 지원한 내역 — 'coco_applications' 키
            const apps = localStorage.getItem('coco_applications');
            setApplyCount(apps ? JSON.parse(apps).length : 0);
        } catch { setApplyCount(0); }
    }, []);

    const [todayChecked, setTodayChecked] = useState<boolean | null>(null);

    useEffect(() => {
        if (!user?.id || user.id.startsWith('mock_')) return;
        const today = new Date();
        // [BUG-FIX] KST 타임존 보정: 로컬 자정~23:59를 toISOString()으로 UTC 변환 후 Supabase 비교
        // (순수 문자열 '2026-04-04T00:00:00' 은 Supabase 가 UTC로 해석 → KST 이른 아침 출석 누락)
        const fromLocal = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0);
        const toLocal   = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
        const from = fromLocal.toISOString();
        const to   = toLocal.toISOString();
        import('@/lib/supabase').then(({ supabase }) => {
            supabase.from('point_logs').select('id').eq('user_id', user.id).eq('reason', 'ATTENDANCE_CHECK').gte('created_at', from).lte('created_at', to).then(({ data }) => {
                setTodayChecked(data ? data.length > 0 : false);
            });
        });
    }, [user?.id]);

    const stats = [
        { label: '스크랩한 공고', val: scrapCount, icon: <Star className="text-yellow-400" />, onClick: () => setView('scrap-jobs') },
        { label: '열람한 공고', val: viewedCount, icon: <Home className="text-[#f82b60]" />, onClick: undefined },
        { label: '지원한 내역', val: applyCount, icon: <FileText className="text-[#f82b60]" />, onClick: undefined },
    ];

    return (
        <div className="space-y-6">
            {/* 0. 출석체크 유도 배너 */}
            {todayChecked === false && (
                <button
                    onClick={() => setView('attendance')}
                    className="w-full p-4 rounded-[24px] bg-gradient-to-r from-[#f82b60] to-pink-400 text-white flex items-center justify-between gap-3 shadow-lg shadow-rose-200 hover:brightness-110 active:scale-[0.99] transition-all"
                >
                    <div className="flex items-center gap-3">
                        <span className="text-2xl">📅</span>
                        <div className="text-left">
                            <p className="font-black text-sm whitespace-nowrap">오늘 출석체크 안 하셨네요!</p>
                            <p className="text-white/80 text-xs font-bold">지금 체크하면 +3P 즉시 적립</p>
                        </div>
                    </div>
                    <span className="bg-white/20 rounded-xl px-3 py-1.5 text-xs font-black whitespace-nowrap">출석하기 →</span>
                </button>
            )}
            {todayChecked === true && (
                <div className="w-full p-4 rounded-[24px] bg-green-50 border border-green-100 flex items-center gap-3">
                    <span className="text-2xl">✅</span>
                    <div>
                        <p className="font-black text-sm text-green-700">오늘 출석 완료!</p>
                        <p className="text-green-500 text-xs font-bold">+3P 적립됐습니다. 내일도 만나요 😊</p>
                    </div>
                </div>
            )}

            {/* 1. 통계 그리드 섹션 — 모바일: 건수를 텍스트 옆에 / PC: 대형 숫자 아래에 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                {stats.map((item, idx) => (
                    <div
                        key={idx}
                        onClick={item.onClick}
                        className={`rounded-[28px] border shadow-sm transition-all ${item.onClick ? 'cursor-pointer hover:shadow-md hover:-translate-y-0.5' : ''} ${brand.theme === 'dark' ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'}`}
                    >
                        {/* 모바일 레이아웃 (md 미만): 아이콘 + 텍스트 + 건수 한 줄 */}
                        <div className="flex items-center gap-3 p-5 md:hidden">
                            <span className="p-2 bg-gray-50 rounded-xl shrink-0">{item.icon}</span>
                            <span className="text-sm font-black flex-1">{item.label}</span>
                            <span className="font-black text-lg text-[#f82b60]">{item.val}<span className="text-xs text-gray-400 ml-0.5">건</span></span>
                        </div>
                        {/* PC 레이아웃 (md 이상): 기존 스타일 유지 */}
                        <div className="hidden md:block p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <span className="p-2 bg-gray-50 rounded-xl dark:bg-gray-800">{item.icon}</span>
                                <span className="text-sm font-black">{item.label}</span>
                            </div>
                            <div className="text-3xl font-black">{item.val}<span className="text-sm text-gray-400 ml-1">건</span></div>
                        </div>
                    </div>
                ))}
            </div>

            {/* 2. 구직활동 요약 섹션 (배너 바로 위, 중간 배치) */}
            <div className={`p-6 md:p-8 rounded-[32px] border shadow-sm ${brand.theme === 'dark' ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'}`}>
                <div className="flex items-center gap-2 mb-6 pb-4 border-b border-gray-50 dark:border-gray-800">
                    <div className="w-8 h-8 bg-gray-50 dark:bg-gray-800 rounded-lg flex items-center justify-center text-gray-400">
                        <FileText size={18} />
                    </div>
                    <h3 className={`text-lg font-black ${brand.theme === 'dark' ? 'text-white' : 'text-[#334155]'}`}>{displayName}님의 구직활동</h3>
                </div>

                <div className="flex items-center justify-around py-4 relative">
                    {/* 세로 구분선 */}
                    <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gray-100 dark:bg-gray-800 hidden md:block"></div>

                    <div className="text-center space-y-2">
                        <div className="text-xs md:text-sm font-black text-gray-500">이력서 등록수</div>
                        <div className="text-3xl md:text-5xl font-black text-[#f82b60] flex items-baseline justify-center gap-1">
                            {resumeCount}<span className="text-sm md:text-lg text-gray-400 font-bold">개</span>
                        </div>
                    </div>

                    <div className="text-center space-y-2">
                        <div className="text-xs md:text-sm font-black text-gray-500">공개중인 이력서</div>
                        <div className="text-3xl md:text-5xl font-black text-[#f82b60] flex items-baseline justify-center gap-1">
                            {resumeCount}<span className="text-sm md:text-lg text-gray-400 font-bold">개</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* 3. 하단 배너 섹션 */}
            <div className={`p-6 md:p-8 rounded-[32px] border shadow-sm ${brand.theme === 'dark' ? 'bg-gray-900 border-gray-800' : 'bg-white border-blue-100'}`}>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 md:w-20 md:h-20 rounded-[24px] bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white shadow-xl shadow-blue-200 shrink-0">
                            <User size={32} />
                        </div>
                        <div>
                            <h2 className="text-lg md:text-3xl font-black mb-1 whitespace-nowrap">관심 공고를 확인하세요!</h2>
                            <p className="text-sm text-gray-500 font-bold">회원님만을 위한 맞춤 취업 정보를 제공합니다.</p>
                        </div>
                    </div>
                    <button onClick={() => setView('resume-form')} className="w-full md:w-auto py-4 px-10 bg-[#f82b60] text-white rounded-2xl font-black hover:bg-[#db2456] shadow-xl shadow-rose-200 transition-all flex items-center justify-center gap-2 active:scale-95">
                        <span className="text-lg">+</span> 이력서 등록하기
                    </button>
                </div>
            </div>
        </div>
    );
}

/** 모바일 전용 프로필 헤더 (사진 + 이름 + 카테고리 탭) */
function MobileProfileHeader({ view, setView }: { view: any, setView: (v: any) => void }) {
    const brand = useBrand();
    const { user } = useAuth();
    const fileInputRef = React.useRef<HTMLInputElement>(null);
    const [profileImage, setProfileImage] = useState<string | null>(null);
    const rawName = user?.nickname || user?.name || localStorage.getItem('user_name') || '회원';
    const displayName = rawName.endsWith('님') ? rawName.slice(0, -1) : rawName;

    useEffect(() => {
        const saved = localStorage.getItem('personal_profile_image');
        if (saved) setProfileImage(saved);
    }, []);

    useEffect(() => {
        const handler = () => {
            const saved = localStorage.getItem('personal_profile_image');
            setProfileImage(saved || null);
        };
        window.addEventListener('profile-image-updated', handler);
        return () => window.removeEventListener('profile-image-updated', handler);
    }, []);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64 = reader.result as string;
                setProfileImage(base64);
                localStorage.setItem('personal_profile_image', base64);
                window.dispatchEvent(new CustomEvent('profile-image-updated'));
            };
            reader.readAsDataURL(file);
        }
    };

    const currentViewId = typeof view === 'object' ? view.id : view;

    return (
        <div className={`md:hidden mb-4 p-4 rounded-[24px] border shadow-sm ${brand.theme === 'dark' ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'}`}>
            <div className="flex items-center gap-4">
                <div
                    onClick={() => fileInputRef.current?.click()}
                    className="w-16 h-16 rounded-full overflow-hidden border-2 border-rose-100 bg-rose-50 flex items-center justify-center shrink-0 cursor-pointer relative group"
                >
                    {profileImage ? (
                        <img src={profileImage} alt="프로필" className="w-full h-full object-cover" />
                    ) : (
                        <User size={28} className="text-[#f82b60]" />
                    )}
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 rounded-full transition">
                        <Settings size={14} className="text-white" />
                    </div>
                </div>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                <div className="flex-1 min-w-0">
                    <p className="font-black text-base truncate">{displayName}님</p>
                    <div className="flex gap-2 mt-2">
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="px-3 py-1.5 text-[10px] font-black rounded-full bg-rose-50 text-[#f82b60] border border-rose-100 hover:bg-rose-100 transition"
                        >
                            사진 등록/수정
                        </button>
                        <button
                            onClick={() => setView('member-edit')}
                            className={`px-3 py-1.5 text-[10px] font-black rounded-full border transition ${
                                currentViewId === 'member-edit'
                                    ? 'bg-[#f82b60] text-white border-[#f82b60]'
                                    : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'
                            }`}
                        >
                            내 정보수정
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function PersonalDashboard({ view, setView, resumeCount = 0, onShowResumeDetail, authUser }: { view: string, setView: (v: any) => void, resumeCount?: number, onShowResumeDetail?: (r: any) => void, authUser: any }) {
    const brand = useBrand();

    return (
        <div className="max-w-6xl mx-auto p-3 md:py-0 grid grid-cols-1 md:grid-cols-4 gap-6">
            <PersonalSidebar view={view} setView={setView} />
            <main className="col-span-1 md:col-span-3">
                {/* 모바일 전용 프로필 헤더 */}
                <MobileProfileHeader view={view} setView={setView} />
                {((view as any) === 'member-info' || (view as any) === 'dashboard') && <PersonalDashboardHome setView={setView} resumeCount={resumeCount} />}
                {(view as any) === 'member-edit' && <PersonalMemberEdit setView={setView} />}
                {((view as any) === 'resume-form' || (typeof view === 'object' && (view as any).id === 'resume-form')) && (
                    <ResumeForm
                        setView={setView}
                        authUser={authUser}
                        editData={typeof view === 'object' ? (view as any).data : null}
                    />
                )}
                {(view as any) === 'resume-list' && <ResumeListView setView={setView} onShowDetail={onShowResumeDetail} authUser={authUser} />}

                {view === 'scrap-jobs' && <ScrapJobsView setView={setView} />}
                {view === 'point-exchange' && <PointExchangeView setView={setView} />}
                {view === 'point-history' && <PointHistoryView userId={authUser?.id ?? ''} />}
                {view === 'attendance' && <AttendanceView userId={authUser?.id ?? ''} />}
                {view === 'payment-history' && <ComingSoonView title="유료결제 내역" />}
                {view === 'excluded-shops' && <ComingSoonView title="열람불가 업소설정" />}
                {view === 'custom-jobs' && <ComingSoonView title="맞춤구인정보" />}
                {view === 'my-posts' && <MyPostsView setView={setView} />}
                {view === 'block-settings' && <BlockSettingsView />}
            </main>
        </div>
    );
}
