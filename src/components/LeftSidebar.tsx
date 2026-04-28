'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

import { useBrand } from '@/components/BrandProvider';
import {
    Phone, ChevronRight, Star, Flame, Zap, Gift, Crown, User, Sparkles, List, FileText, ChevronDown
} from 'lucide-react';

interface LeftSidebarProps {
    selectedRegion: string;
    setSelectedRegion: (region: string) => void;
    setSelectedSubRegion: (subRegion: string) => void;
    selectedJobType: string;
    setSelectedJobType: (jobType: string) => void;
    onPaymentClick: (tier: string) => void;
    isLoggedIn?: boolean;
    userName?: string;
    userType?: 'corporate' | 'individual';
    userCredit?: number;
}

// 지역 목록 (label: 2글자 표기, value: REGION_BRACKET_MAP 연동용 전체명)
const REGION_BUTTONS: { label: string; value: string }[] = [
    { label: '서울', value: '서울' },
    { label: '경기', value: '경기도' },
    { label: '인천', value: '인천' },
    { label: '부산', value: '부산' },
    { label: '대구', value: '대구' },
    { label: '광주', value: '광주' },
    { label: '대전', value: '대전' },
    { label: '울산', value: '울산' },
    { label: '세종', value: '세종시' },
    { label: '강원', value: '강원도' },
    { label: '충북', value: '충청북도' },
    { label: '충남', value: '충청남도' },
    { label: '전북', value: '전라북도' },
    { label: '전남', value: '전라남도' },
    { label: '경북', value: '경상북도' },
    { label: '경남', value: '경상남도' },
    { label: '제주', value: '제주도' },
];

// 직종 목록 (1차 직종)
const JOB_TYPE_BUTTONS = ['룸살롱', '가라오케', '클럽', '나이트', '바', '기타'];

import { SIDEBAR_KEYWORDS } from '@/constants/job-options';

const CATEGORY_LINKS = [
    { icon: Crown, label: '그랜드', color: 'text-amber-500', tier: 'grand' },
    { icon: Star, label: '프리미엄', color: 'text-purple-500', tier: 'premium' },
    { icon: Zap, label: '디럭스', color: 'text-blue-500', tier: 'deluxe' },
    { icon: Sparkles, label: '스페셜', color: 'text-blue-500', tier: 'special' },
    { icon: Flame, label: '급구', color: 'text-red-500', tier: 'urgent' },
    { icon: Gift, label: '추천', color: 'text-emerald-500', tier: 'urgent' },
    { icon: List, label: '리스트네이티브', color: 'text-cyan-500', tier: 'native' },
    { icon: FileText, label: '베이직(줄광고)', color: 'text-gray-500', tier: 'basic' },
];

import { useAuth } from '@/hooks/useAuth';
import { useMobile } from '@/hooks/useMobile';
import { InnerSidebarCarousel } from '@/components/InnerSidebarCarousel';

export default function LeftSidebar({
    selectedRegion,
    setSelectedRegion,
    setSelectedSubRegion,
    selectedJobType,
    setSelectedJobType,
    onPaymentClick,
    isLoggedIn: propIsLoggedIn,
    userName: propUserName,
    userType: propUserType,
    userCredit: propUserCredit,
}: LeftSidebarProps) {
    const isMobile = useMobile();
    const brand = useBrand();
    const router = useRouter();
    const {
        isLoggedIn: authIsLoggedIn,
        userName: authUserName,
        userType: authUserType,
        userCredit: authUserCredit,
        userPoints: authUserPoints,
        logout,
        login: authLogin,
        signIn
    } = useAuth();
    const [selectedKeywords, setSelectedKeywords] = React.useState<string[]>([]);
    const [isLoginOpen, setIsLoginOpen] = React.useState(false);
    const [isRegionOpen, setIsRegionOpen] = React.useState(false);
    const [isJobTypeOpen, setIsJobTypeOpen] = React.useState(true);
    const [isKeywordOpen, setIsKeywordOpen] = React.useState(false);
    const [isAdProductOpen, setIsAdProductOpen] = React.useState(false);

    const [isLoginLoading, setIsLoginLoading] = React.useState(false);
    const [loginId, setLoginId] = React.useState('');
    const [loginPw, setLoginPw] = React.useState('');

    // [Optimization] Early return for mobile after all hooks are called
    if (isMobile) return null;

    // Use auth hook values for better sync across pages if props are not explicitly updated
    const isLoggedIn = propIsLoggedIn ?? authIsLoggedIn;
    const userName = propUserName ?? authUserName;
    const userType = propUserType ?? authUserType;
    const userCredit = propUserCredit ?? authUserCredit;
    const userPoints = authUserPoints ?? 0;

    // 반복 카드 컨테이너 className 상수화
    const cardClass = `py-2.5 px-4 rounded-xl border ${brand.theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`;

    const clearLoginForm = () => {
        setIsLoginOpen(false);
        setLoginId('');
        setLoginPw('');
    };

    const handleLogin = async () => {
        if (!loginId || !loginPw) {
            alert('아이디와 비밀번호를 입력해주세요.');
            return;
        }

        const id = loginId.trim();
        const pw = loginPw.trim();

        setIsLoginLoading(true);
        try {
            // 1. Check for Test/Mock IDs
            if ((id === 'admin_shop' || id === 'admin_user') && pw === 'password123') {
                authLogin('admin', id, id === 'admin_shop' ? '최고관리자' : '마스터관리자', id === 'admin_shop' ? '시스템마스터' : '운영총괄');
                clearLoginForm();
                return;
            } else if (id === 'test_shop' && pw === 'password123') {
                authLogin('shop', id, '테스트 사장님', '번창하는조사장');
                clearLoginForm();
                return;
            } else if (id === 'test_user' && pw === 'password123') {
                authLogin('personal', id, '테스트 회원', '밤의제왕');
                clearLoginForm();
                return;
            }

            // 2. Real Supabase Login
            // 아이디만 입력한 경우 @waiterzone.kr 이메일 형식으로 변환 (LoginPage와 동일한 로직)
            const email = id.includes('@') ? id : `${id}@waiterzone.kr`;
            await signIn(email, pw);
            clearLoginForm();
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : '아이디 또는 비밀번호를 확인해주세요.';
            console.error('Sidebar Login error:', err);
            alert(`로그인 실패: ${message}`);
        } finally {
            setIsLoginLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleLogin();
        }
    };

    const toggleKeyword = (kw: string) => {
        if (selectedKeywords.includes(kw)) {
            setSelectedKeywords(prev => prev.filter(k => k !== kw));
        } else {
            if (selectedKeywords.length < 5) {
                setSelectedKeywords(prev => [...prev, kw]);
            } else {
                alert('최대 5개까지만 선택 가능합니다.');
            }
        }
    };


    return (
        <div className="hidden lg:block w-full flex-shrink-0 space-y-2">
            {/* 0. Partners Credit Funnel - REMOVED (Moved to Community Banner as requested) */}
            {/* 
            <div 
                onClick={() => window.open('https://partners-credit-site.vercel.app', '_blank')}
                className="mb-2 p-3 rounded-xl bg-gradient-to-r from-yellow-400 to-orange-500 cursor-pointer shadow-md hover:scale-[1.02] transition-all border-b-4 border-orange-700 active:border-b-0 active:translate-y-1"
            >
                <div className="flex items-center gap-2">
                    <div className="bg-white/30 p-1.5 rounded-lg">
                        <Coins size={18} className="text-white" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-orange-900/70 leading-none">수익형 커뮤니티</p>
                        <h4 className="text-sm font-black text-white flex items-center gap-1">
                            파트너스 활동 <ChevronRight size={12} strokeWidth={3} />
                        </h4>
                    </div>
                </div>
            </div>
            */}

            {/* 1. MEMBER LOGIN / 로그인 상태 박스 */}
            <div className={cardClass}>
                <div
                    className="flex items-center justify-between cursor-pointer group"
                    onClick={() => setIsLoginOpen(!isLoginOpen)}
                >
                    <h4 className={`text-xs font-black uppercase tracking-wider ${brand.theme === 'dark' ? 'text-gray-400' : 'text-gray-900'}`}>
                        {isLoggedIn ? 'MEMBER INFO' : 'MEMBER LOGIN'}
                    </h4>
                    <ChevronDown
                        size={14}
                        className={`text-gray-400 group-hover:text-purple-500 transition-transform duration-300 ${isLoginOpen ? 'rotate-0' : '-rotate-90'}`}
                    />
                </div>

                <div className={`transition-all duration-300 overflow-hidden ${isLoginOpen ? 'max-h-[500px] mt-4 opacity-100' : 'max-h-0 opacity-0'}`}>
                    {isLoggedIn ? (
                        <>
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-8 h-8 rounded bg-gray-200 flex items-center justify-center">
                                    <User size={16} className="text-gray-500" />
                                </div>
                                <div>
                                    <p className={`text-xs font-black ${brand.theme === 'dark' ? 'text-white' : 'text-black'}`}>
                                        {userName} 님 <span className="text-gray-400">☆</span>
                                    </p>
                                </div>
                            </div>
                            <p className="text-[11px] text-gray-500 mb-2 text-center">
                                회원님은 <span className="text-purple-600 font-bold">
                                    {userType === 'admin' ? '최고 관리자' : (userType === 'corporate' ? '기업회원' : '일반회원')}
                                </span> 입니다.
                            </p>
                            <div className={`mb-3 p-2 rounded-lg ${brand.theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] text-gray-500">웨이터 포인트</span>
                                    <span className={`text-sm font-bold ${brand.theme === 'dark' ? 'text-yellow-400' : 'text-blue-600'}`}>
                                        C {userPoints.toLocaleString()}
                                    </span>
                                </div>
                                {(userCredit ?? 0) > 0 && (
                                    <div className="flex items-center justify-between mt-0.5">
                                        <span className="text-[10px] text-gray-400">크레딧</span>
                                        <span className={`text-xs font-bold ${brand.theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                                            {(userCredit ?? 0).toLocaleString()}
                                        </span>
                                    </div>
                                )}
                            </div>
                            <div className="grid grid-cols-2 gap-1">
                                <button
                                    onClick={() => { setIsLoginOpen(false); router.push('/my-shop'); }}
                                    className="py-2 bg-purple-100 text-purple-600 rounded text-[10px] font-bold hover:bg-purple-200 transition"
                                >
                                    마이페이지
                                </button>
                                <button
                                    onClick={() => { setIsLoginOpen(false); logout(); }}
                                    className={`py-2 rounded text-[10px] font-bold transition ${brand.theme === 'dark' ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                                >
                                    로그아웃
                                </button>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="space-y-2">
                                <input
                                    type="text"
                                    placeholder="ID"
                                    value={loginId}
                                    onChange={(e) => setLoginId(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    className={`w-full px-3 py-2 rounded-lg text-xs border ${brand.theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-gray-50 border-gray-200 text-black placeholder-gray-400'}`}
                                />
                                <input
                                    type="password"
                                    placeholder="PASSWORD"
                                    value={loginPw}
                                    onChange={(e) => setLoginPw(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    className={`w-full px-3 py-2 rounded-lg text-xs border ${brand.theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-gray-50 border-gray-200 text-black placeholder-gray-400'}`}
                                />
                                <button
                                    onClick={handleLogin}
                                    className="w-full py-2 bg-purple-600 text-white rounded-lg text-xs font-bold hover:bg-purple-700 transition"
                                >
                                    로그인
                                </button>
                            </div>
                            <div className="flex justify-center gap-2 mt-3 text-[10px] text-gray-500">
                                <button onClick={() => { setIsLoginOpen(false); router.push('/?page=signup'); }} className="hover:text-blue-600 transition">회원가입</button>
                                <span>|</span>
                                <button onClick={() => setIsLoginOpen(false)} className="hover:text-blue-600 transition">아이디/패스워드 찾기</button>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* 2. 광고 배너 슬롯 1 - 하루 200보장 */}
            <div className="group relative h-[100px] rounded-xl overflow-hidden cursor-pointer shadow-lg hover:scale-[1.02] transition-all">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700"></div>
                {/* Background Deco Patterns */}
                <div className="absolute inset-0 opacity-20 pointer-events-none">
                    <div className="absolute -top-6 -left-6 w-20 h-20 bg-white rounded-full blur-xl animate-pulse" />
                    <div className="absolute -bottom-6 -right-6 w-20 h-20 bg-blue-400 rounded-full blur-xl animate-pulse" />
                </div>
                <div className="relative z-10 h-full flex flex-col items-center justify-center text-white text-center p-3">
                    <p className="text-xl font-black drop-shadow-lg tracking-tighter">
                        하루 200보장
                    </p>
                    <div className="w-8 h-0.5 bg-white/30 my-1.5 rounded-full" />
                    <p className="text-[10px] font-bold text-white/70 uppercase tracking-widest">
                        WaiterZone Premium
                    </p>
                </div>
            </div>

            {/* 3. 지역별 채용정보 */}
            <div className={cardClass}>
                <div
                    className="flex items-center justify-between cursor-pointer group mb-1"
                    onClick={() => setIsRegionOpen(!isRegionOpen)}
                >
                    <h4 className={`text-sm font-black ${brand.theme === 'dark' ? 'text-white' : 'text-black'}`}>
                        <span className="text-purple-600">지역별</span> 채용정보
                    </h4>
                    <ChevronDown
                        size={14}
                        className={`text-gray-400 group-hover:text-purple-500 transition-transform duration-300 ${isRegionOpen ? 'rotate-0' : '-rotate-90'}`}
                    />
                </div>

                <div className={`grid grid-cols-5 gap-1 transition-all duration-300 overflow-hidden ${isRegionOpen ? 'max-h-[500px] mt-3 opacity-100' : 'max-h-0 opacity-0'}`}>
                    {REGION_BUTTONS.map((reg) => (
                        <button
                            key={reg.value}
                            onClick={() => {
                                setSelectedRegion(reg.value);
                                setSelectedSubRegion('전체');
                                setIsRegionOpen(false);
                            }}
                            className={`px-1 py-1.5 rounded text-[10px] font-bold transition ${selectedRegion === reg.value
                                ? 'bg-purple-600 text-white'
                                : brand.theme === 'dark' ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'
                                }`}
                        >
                            {reg.label}
                        </button>
                    ))}
                </div>

                {/* Regional Specialty Mall Links (SEO & Direct Funnel) */}
                {isRegionOpen && (
                    <div className="mt-3 pt-3 border-t border-dashed border-gray-200 dark:border-gray-700">
                        <p className="text-[10px] font-black text-purple-500 mb-2 px-1">✨ 지역별 전문 가이드</p>
                        <div className="flex flex-wrap gap-1">
                            {[
                                { label: '강남관', slug: 'gangnam' },
                                { label: '강남논현', slug: 'gangnam-nonhyeon' },
                                { label: '부산관', slug: 'busan' },
                                { label: '인천관', slug: 'incheon' },
                                { label: '수원관', slug: 'suwon-ingye' },
                                { label: '대전관', slug: 'daejeon' },
                                { label: '대구관', slug: 'daegu' },
                                { label: '광주관', slug: 'gwangju-sangmu' }
                            ].map((link) => (
                                <button
                                    key={link.slug}
                                    onClick={() => window.open(`https://region.waiterzone.kr/${link.slug}/`, '_blank')}
                                    className="px-2 py-1 bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded text-[9px] font-black hover:bg-purple-600 hover:text-white transition-all border border-purple-100 dark:border-purple-800"
                                >
                                    {link.label}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* 4. 업직종별 채용정보 */}
            <div className={cardClass}>
                <div
                    className="flex items-center justify-between cursor-pointer group mb-1"
                    onClick={() => setIsJobTypeOpen(!isJobTypeOpen)}
                >
                    <h4 className={`text-sm font-black ${brand.theme === 'dark' ? 'text-white' : 'text-black'}`}>
                        <span className="text-purple-600">업직종별</span> 채용정보
                    </h4>
                    <ChevronDown
                        size={14}
                        className={`text-gray-400 group-hover:text-purple-500 transition-transform duration-300 ${isJobTypeOpen ? 'rotate-0' : '-rotate-90'}`}
                    />
                </div>

                <div className={`grid grid-cols-2 gap-1.5 transition-all duration-300 overflow-hidden ${isJobTypeOpen ? 'max-h-[500px] mt-3 opacity-100' : 'max-h-0 opacity-0'}`}>
                    {JOB_TYPE_BUTTONS.map((job) => (
                        <button
                            key={job}
                            onClick={() => {
                                setSelectedJobType(job);
                                setIsJobTypeOpen(false); // Auto-close after selection
                            }}
                            className={`px-2 py-1.5 rounded text-[10px] font-bold transition ${selectedJobType === job
                                ? 'bg-purple-600 text-white'
                                : brand.theme === 'dark' ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'
                                }`}
                        >
                            · {job}
                        </button>
                    ))}
                </div>
            </div>



            {/* 5. 편의사항/키워드 (최대 5개 선택 -> Expanded List) */}
            <div className={cardClass}>
                <div
                    className="flex items-center justify-between cursor-pointer group mb-1"
                    onClick={() => setIsKeywordOpen(!isKeywordOpen)}
                >
                    <h4 className={`text-sm font-black ${brand.theme === 'dark' ? 'text-white' : 'text-black'}`}>
                        <span className="text-purple-600">편의사항</span> 키워드
                    </h4>
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] text-gray-500">
                            {selectedKeywords.length}/5
                        </span>
                        <ChevronDown
                            size={14}
                            className={`text-gray-400 group-hover:text-purple-500 transition-transform duration-300 ${isKeywordOpen ? 'rotate-0' : '-rotate-90'}`}
                        />
                    </div>
                </div>

                <div className={`flex flex-wrap gap-1 transition-all duration-300 overflow-hidden ${isKeywordOpen ? 'max-h-[300px] mt-3 opacity-100' : 'max-h-0 opacity-0'}`}>
                    {SIDEBAR_KEYWORDS.map((kw) => {
                        const isSelected = selectedKeywords.includes(kw);
                        return (
                            <button
                                key={kw}
                                onClick={() => toggleKeyword(kw)}
                                className={`px-2 py-1 rounded text-[9px] font-bold transition ${isSelected
                                    ? 'bg-blue-500 text-white shadow-md'
                                    : brand.theme === 'dark'
                                        ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                            >
                                {kw}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* 6. 카테고리 링크 + 광고신청 */}
            <div className={`rounded-xl border overflow-hidden ${brand.theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                <div
                    className="flex items-center justify-between px-4 py-2.5 cursor-pointer group"
                    onClick={() => setIsAdProductOpen(!isAdProductOpen)}
                >
                    <h4 className={`text-sm font-black ${brand.theme === 'dark' ? 'text-white' : 'text-black'}`}>
                        <span className="text-purple-600">광고상품</span> 바로가기
                    </h4>
                    <ChevronDown
                        size={14}
                        className={`text-gray-400 group-hover:text-purple-500 transition-transform duration-300 ${isAdProductOpen ? 'rotate-0' : '-rotate-90'}`}
                    />
                </div>

                <div className={`transition-all duration-300 overflow-hidden ${isAdProductOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
                    {CATEGORY_LINKS.map((cat, idx) => (
                        <div
                            key={idx}
                            className={`flex items-center justify-between px-3 py-2.5 border-t ${brand.theme === 'dark' ? 'border-gray-700' : 'border-gray-100'}`}
                        >
                            <div className="flex items-center gap-2">
                                <cat.icon size={14} className={cat.color} />
                                <span className={`text-[11px] font-bold ${brand.theme === 'dark' ? 'text-gray-200' : 'text-black'}`}>{cat.label}</span>
                            </div>
                            <button
                                onClick={() => {
                                    setIsAdProductOpen(false); // Can auto-close on click
                                    onPaymentClick(cat.tier);
                                }}
                                className="px-2 py-1 bg-gray-100 hover:bg-blue-100 text-gray-500 hover:text-blue-600 rounded text-[9px] font-bold transition"
                            >
                                광고신청
                            </button>
                        </div>
                    ))}
                </div>
            </div>


            {/* 7-A. 디럭스/스페셜 내부 사이드바 슬롯 — 캐러셀 */}
            {/* 광고상품 바로가기 아래 2슬롯: 디럭스(p3) → 스페셜(p4) 랜덤 슬라이드 */}
            <InnerSidebarCarousel />

            {/* 8. 광고 슬롯 2 - 웨이터존 광고입전상담 */}
            <div
                onClick={() => router.push('/customer-center?tab=inquiry')}
                className="group relative h-[180px] rounded-xl overflow-hidden cursor-pointer shadow-lg hover:scale-[1.02] transition-all"
            >
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-700 via-purple-700 to-blue-700"></div>
                <div className="absolute inset-0 opacity-20 pointer-events-none">
                    <div className="absolute -top-10 -left-10 w-40 h-40 bg-white rounded-full blur-3xl animate-pulse" />
                </div>
                <div className="relative z-10 h-full flex flex-col items-center justify-center text-white text-center p-4">
                    <p className="text-xs font-black text-white/70 tracking-widest mb-1 uppercase">
                        WAITERZONE OFFICIAL
                    </p>
                    <h4 className="text-[24px] font-black mb-1 drop-shadow-md tracking-tighter">
                        광고입점상담
                    </h4>
                    <div className="w-10 h-1 bg-white/40 rounded-full my-3" />
                    <p className="text-[20px] font-black text-amber-300 drop-shadow-lg">
                        {'<1:1문의>'}
                    </p>
                </div>
            </div>

            {/* 9. 광고 슬롯 3 - 웨이터존 광고입점상담 (스타일 2) */}
            <div
                onClick={() => router.push('/customer-center?tab=inquiry')}
                className="group relative h-[180px] rounded-xl overflow-hidden cursor-pointer shadow-lg hover:scale-[1.02] transition-all border-2 border-white/10"
            >
                <div className="absolute inset-0 bg-slate-950"></div>
                <div className="absolute top-3 right-3 text-xl opacity-30 animate-pulse">💎</div>
                <div className="relative z-10 h-full flex flex-col items-center justify-center text-white text-center p-4">
                    <p className="text-[14px] font-bold text-gray-400 mb-2">프리미엄 채용 안내</p>
                    <h4 className="text-[20px] font-black text-white mb-4 tracking-tighter">
                        웨이터존 광고상담
                    </h4>
                    <div className="bg-blue-600 text-white px-5 py-2 rounded-full text-xs font-black shadow-[0_0_15px_rgba(219,39,119,0.5)] active:scale-95 transition-all">
                        {'<1:1문의 바로가기>'}
                    </div>
                </div>
            </div>

            {/* 7. 고객지원센터 (최하단 이동) */}
            <div className={cardClass}>
                <div className="flex items-center justify-between mb-3">
                    <h4 className={`text-xs font-black flex items-center gap-1 ${brand.theme === 'dark' ? 'text-white' : 'text-black'}`}>
                        <Phone size={12} />
                        고객지원센터
                    </h4>
                    <button
                        onClick={() => router.push('/?page=support')}
                        className="text-[10px] text-gray-400 hover:text-purple-600 flex items-center gap-0.5 transition"
                    >
                        MORE <ChevronRight size={10} />
                    </button>
                </div>
                {/* 전화번호 */}
                <div className="mb-2">
                    <p className="text-[22px] font-black text-purple-600 tracking-tighter leading-tight">1877-1442</p>
                </div>

                {/* 텔레그램 문의 */}
                <a
                    href="https://t.me/waiterzone"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 mb-2 group"
                >
                    <div className="w-8 h-8 rounded-full bg-[#2AABEE] flex items-center justify-center shrink-0 group-hover:brightness-110 transition">
                        <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white">
                            <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                        </svg>
                    </div>
                    <div>
                        <p className={`text-xs font-black ${brand.theme === 'dark' ? 'text-white' : 'text-black'}`}>
                            텔레그램 문의
                        </p>
                        <p className="text-[11px] font-bold text-[#2AABEE] tracking-tight">@waiterzone</p>
                    </div>
                </a>

                <p className="text-[9px] text-gray-500 mb-2">평일 10:00~18:00 점심 12:00~13:00<br />*공휴일 토,일은 근무하지 않습니다.</p>
                <div className="flex gap-2 text-[10px]">
                    <button
                        onClick={() => router.push('/?page=faq')}
                        className={`hover:text-purple-600 transition ${brand.theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}
                    >
                        ➤ FAQ 도움말
                    </button>
                    <button
                        onClick={() => router.push('/?page=inquiry')}
                        className={`hover:text-purple-600 transition ${brand.theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}
                    >
                        ➤ 광고문의 & 일반문의
                    </button>
                </div>
            </div>
        </div >
    );
}
