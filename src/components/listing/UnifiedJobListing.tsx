import React from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, Search, X } from 'lucide-react';
import JobListView from '@/components/jobs/JobListView';
import { JOB_CATEGORIES, JOB_CATEGORY_MAP } from '@/constants/jobs';
import { REGION_LIST, REGIONS_MAP } from '@/constants/regions';
import { LATEST_NOTICE } from '@/constants/notices';
import { Shop } from '@/types/shop';
import { useBrand } from '@/components/BrandProvider';

export type FilterType = 'job' | 'subJob' | 'region' | 'subRegion';

interface UnifiedJobListingProps {
    title: string;
    shops: Shop[];
    favorites: string[];
    toggleFavorite: (e: React.MouseEvent, id: string) => void;
    setSelectedShop: (shop: Shop) => void;
    visibleCount: number;
    setVisibleCount: React.Dispatch<React.SetStateAction<number>>;
    onAdRegister: () => void;
    onNativeAdRegister: () => void;

    // Filter State
    selectedRegion: string;
    setSelectedRegion: (v: string) => void;
    selectedSubRegion: string;
    setSelectedSubRegion: (v: string) => void;
    selectedJobType: string;
    setSelectedJobType: (v: string) => void;
    selectedSubJobType: string;
    setSelectedSubJobType: (v: string) => void;

    searchQuery: string;
    setSearchQuery: (v: string) => void;
    activeSearchQuery: string;
    setActiveSearchQuery: (v: string) => void;

    // Configuration
    filterOrder?: FilterType[];
    adGrid?: React.ReactNode;
}

export const UnifiedJobListing = ({
    title,
    shops,
    favorites,
    toggleFavorite,
    setSelectedShop,
    visibleCount,
    setVisibleCount,
    onAdRegister,
    onNativeAdRegister,
    selectedRegion,
    setSelectedRegion,
    selectedSubRegion,
    setSelectedSubRegion,
    selectedJobType,
    setSelectedJobType,
    selectedSubJobType,
    setSelectedSubJobType,
    searchQuery,
    setSearchQuery,
    activeSearchQuery,
    setActiveSearchQuery,
    filterOrder = ['job', 'subJob', 'region', 'subRegion'], // Default Order
    adGrid
}: UnifiedJobListingProps) => {
    const brand = useBrand();
    const router = useRouter();
    const [activeTab, setActiveTab] = React.useState(title);
    const [viewedShops, setViewedShops] = React.useState<Shop[]>([]);

    // 활성 필터 여부 감지 (필터 초기화 버튼 표시 조건)
    const hasActiveFilter = selectedRegion !== '전체' || selectedSubRegion !== '전체' ||
        selectedJobType !== '전체' || selectedSubJobType !== '전체' || !!activeSearchQuery;

    // 전체 필터 초기화
    const resetFilters = () => {
        setSelectedRegion('전체');
        setSelectedSubRegion('전체');
        setSelectedJobType('전체');
        setSelectedSubJobType('전체');
        setSearchQuery('');
        setActiveSearchQuery('');
    };

    // 탭 변경 시 viewed_shops 로드 (24시간 이내 항목만 표시)
    React.useEffect(() => {
        if (activeTab === '오늘본공고') {
            const saved = localStorage.getItem('viewed_shops');
            if (saved) {
                try {
                    const parsed = JSON.parse(saved);
                    const now = Date.now();
                    const MS_24H = 86400000;
                    // 신형 포맷 { shop, timestamp }[] 처리
                    if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].timestamp !== undefined) {
                        const valid = (parsed as { shop: Shop; timestamp: number }[])
                            .filter(e => e.shop && (now - e.timestamp) < MS_24H)
                            .map(e => e.shop);
                        setViewedShops(valid);
                    } else {
                        // 구형 포맷(Shop[]) — 타임스탬프 없어 24시간 검증 불가 → 초기화
                        localStorage.removeItem('viewed_shops');
                        setViewedShops([]);
                    }
                } catch (e) {
                    console.error('Failed to parse viewed_shops', e);
                }
            }
        }
    }, [activeTab]);

    // Display Shops determination
    const displayShops = activeTab === '오늘본공고' ? viewedShops : shops;

    // Filter Components Map
    const renderFilter = (type: FilterType) => {
        switch (type) {
            case 'job':
                return (
                    <div className="relative" key="job">
                        <select
                            value={selectedJobType}
                            onChange={(e) => { setSelectedJobType(e.target.value); setSelectedSubJobType('전체'); }}
                            className="w-full h-12 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-black appearance-none pl-4 pr-10 focus:outline-none focus:border-blue-500 transition-colors text-black cursor-pointer"
                        >
                            <option value="전체">직종선택</option>
                            {JOB_CATEGORIES.map(job => (
                                <option key={job} value={job}>{job}</option>
                            ))}
                        </select>
                        <ChevronLeft size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 rotate-[-90deg] pointer-events-none" />
                    </div>
                );
            case 'subJob':
                return (
                    <div className="relative" key="subJob">
                        <select
                            value={selectedSubJobType}
                            onChange={(e) => setSelectedSubJobType(e.target.value)}
                            disabled={selectedJobType === '전체'}
                            className="w-full h-12 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-medium appearance-none pl-4 pr-10 focus:outline-none focus:border-blue-500 transition-colors text-black cursor-pointer disabled:bg-gray-100 disabled:text-gray-400"
                        >
                            <option value="전체">상세직종</option>
                            {selectedJobType !== '전체' && JOB_CATEGORY_MAP[selectedJobType]?.map(item => (
                                <option key={item} value={item}>{item}</option>
                            ))}
                        </select>
                        <ChevronLeft size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 rotate-[-90deg] pointer-events-none" />
                    </div>
                );
            case 'region':
                return (
                    <div className="relative" key="region">
                        <select
                            value={selectedRegion}
                            onChange={(e) => { setSelectedRegion(e.target.value); setSelectedSubRegion('전체'); }}
                            className="w-full h-12 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-black appearance-none pl-4 pr-10 focus:outline-none focus:border-blue-500 transition-colors text-black cursor-pointer"
                        >
                            <option value="전체">지역선택</option>
                            {REGION_LIST.map(reg => (
                                <option key={reg} value={reg}>{reg}</option>
                            ))}
                        </select>
                        <ChevronLeft size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 rotate-[-90deg] pointer-events-none" />
                    </div>
                );
            case 'subRegion':
                return (
                    <div className="relative" key="subRegion">
                        <select
                            value={selectedSubRegion}
                            onChange={(e) => setSelectedSubRegion(e.target.value)}
                            disabled={selectedRegion === '전체'}
                            className="w-full h-12 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-medium appearance-none pl-4 pr-10 focus:outline-none focus:border-blue-500 transition-colors text-black cursor-pointer disabled:bg-gray-100 disabled:text-gray-400"
                        >
                            <option value="전체">세부지역</option>
                            {selectedRegion !== '전체' && REGIONS_MAP[selectedRegion]?.map(sub => (
                                <option key={sub} value={sub}>{sub}</option>
                            ))}
                        </select>
                        <ChevronLeft size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 rotate-[-90deg] pointer-events-none" />
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="space-y-4 md:space-y-8">
            {/* Hero Section */}
            <div className="relative h-32 md:h-40 bg-gray-900 rounded-[24px] overflow-hidden group mx-4 md:mx-0">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-900 to-blue-900 flex items-center justify-center text-white">
                    <div className="text-center">
                        <h2 className="text-xl md:text-2xl font-black mb-1">웨이터존만의 특별한 혜택</h2>
                        <p className="text-sm opacity-80">지금 가입하고 무료 광고 혜택을 누리세요</p>
                    </div>
                </div>
                {/* Navigation Arrows */}
                <button className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/20 backdrop-blur-sm flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity">
                    <ChevronLeft size={24} />
                </button>
                <button className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/20 backdrop-blur-sm flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity">
                    <ChevronRight size={24} />
                </button>
                {/* Dots */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
                    {[1, 2, 3, 4, 5].map((_, i) => (
                        <div key={i} className={`w-1.5 h-1.5 rounded-full ${i === 0 ? 'bg-white' : 'bg-white/40'}`} />
                    ))}
                </div>
            </div>

            {/* Main Content Flow */}
            <div className="space-y-3 md:space-y-6">
                <h1 className="text-3xl font-black flex items-center gap-2 mx-4 md:mx-0">
                    <span className="w-1.5 h-8 bg-blue-500 rounded-full"></span>
                    {title}
                </h1>

                <div className="flex justify-center mx-4 md:mx-0">
                    <div className="flex gap-1 !bg-white !text-black p-1.5 rounded-2xl shadow-sm border border-gray-100 w-full overflow-x-auto no-scrollbar">
                        {['업종별 채용', '지역별 채용', '오늘본공고'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => {
                                    if (tab === '업종별 채용' && title !== '업종별 채용') router.push('/jobs');
                                    else if (tab === '지역별 채용' && title !== '지역별 채용') router.push('/region');
                                    else setActiveTab(tab);
                                }}
                                className={`flex-1 py-2.5 px-4 text-xs md:text-sm font-black rounded-xl transition-all whitespace-nowrap ${activeTab === tab ? 'bg-blue-600 text-white shadow-md' : 'text-gray-400 hover:text-gray-600'}`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Announcement Bar — notices.ts LATEST_NOTICE 자동 반영 */}
                <div
                    onClick={() => router.push(LATEST_NOTICE.link ?? '/customer-center?tab=notice')}
                    className={`flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer bg-white border-gray-100 hover:shadow-md hover:-translate-y-0.5 mx-4 md:mx-0 group/notice`}
                >
                    <div className="flex items-center gap-3 overflow-hidden">
                        <span className="bg-blue-600 text-white text-[10px] px-2 py-1 rounded-lg font-black shrink-0 uppercase tracking-wider shadow-sm group-hover/notice:bg-blue-700 transition-colors">
                            {LATEST_NOTICE.badge}
                        </span>
                        <p className="text-[13px] font-bold text-gray-700 truncate group-hover/notice:text-black transition-colors">
                            {LATEST_NOTICE.title}
                        </p>
                    </div>
                    <ChevronRight size={16} className="text-gray-300 shrink-0 group-hover/notice:text-gray-500 transition-colors" />
                </div>

                {/* Search Filter Box with Dropdowns - Hidden on Today View */}
                {activeTab !== '오늘본공고' && (
                    <div className="space-y-3 mx-4 md:mx-0">
                        <div className={`p-6 rounded-[32px] border shadow-xl !bg-white !text-black border-gray-100 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 relative z-20`}>
                            {/* Dynamic Filter Order */}
                            {filterOrder.map((filterType) => renderFilter(filterType))}

                            {/* Keyword Input */}
                            <div className="relative lg:col-span-1">
                                <input
                                    type="text"
                                    placeholder="키워드 검색"
                                    className="w-full h-12 bg-gray-50 border border-gray-100 rounded-2xl px-4 pr-10 text-sm font-bold outline-none focus:border-blue-300 transition-all font-black text-black"
                                    value={searchQuery}
                                    onChange={(e) => {
                                        setSearchQuery(e.target.value);
                                        // 입력 클리어 시 검색 필터도 즉시 초기화
                                        if (!e.target.value) setActiveSearchQuery('');
                                    }}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            setActiveSearchQuery(searchQuery);
                                        }
                                    }}
                                />
                                {searchQuery && (
                                    <button
                                        onClick={() => { setSearchQuery(''); setActiveSearchQuery(''); }}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                        <X size={16} />
                                    </button>
                                )}
                            </div>
                            <button
                                onClick={() => setActiveSearchQuery(searchQuery)}
                                className="h-12 bg-blue-600 text-white rounded-2xl text-sm font-black flex items-center justify-center gap-2 hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-500/30 active:scale-95 transition-all"
                            >
                                <Search size={18} />
                                검색
                            </button>
                        </div>
                    </div>
                )}

                {/* Ad Grid Section — 필터/검색 활성화 시 숨김 (결과가 하단으로 밀리는 UX 버그 수정) */}
                {adGrid && !hasActiveFilter && (
                    <div className="mt-6 md:mt-8">
                        {adGrid}
                    </div>
                )}

                {/* 검색/필터 결과 없음 (스켈레톤 대체) */}
                {activeTab !== '오늘본공고' && shops.length === 0 && (
                    <div className="py-16 text-center mx-4 md:mx-0">
                        <div className="text-5xl mb-4">🔍</div>
                        <p className="text-gray-700 font-black text-lg mb-2">검색 결과가 없습니다</p>
                        <p className="text-gray-400 text-sm mb-6 font-medium">
                            {hasActiveFilter ? '선택한 조건에 맞는 공고가 없습니다. 필터를 조정해 보세요.' : '현재 등록된 공고가 없습니다.'}
                        </p>
                        {hasActiveFilter && (
                            <button
                                onClick={resetFilters}
                                className="px-6 py-3 bg-blue-600 text-white rounded-2xl font-black text-sm hover:bg-blue-700 active:scale-95 transition-all shadow-lg shadow-blue-500/20"
                            >
                                필터 전체 초기화
                            </button>
                        )}
                    </div>
                )}

                {/* List View */}
                {activeTab === '오늘본공고' ? (
                    viewedShops.length === 0 ? (
                        <div className="py-20 text-center mx-4 md:mx-0">
                            <div className="text-5xl mb-4">👀</div>
                            <p className="text-gray-400 font-bold mb-4">오늘 본 공고가 아직 없습니다.</p>
                            <button
                                onClick={() => setActiveTab(title)}
                                className="text-blue-600 font-black text-sm underline"
                            >
                                전체 공고 보러가기
                            </button>
                        </div>
                    ) : (
                        <JobListView
                            shops={viewedShops}
                            brand={brand}
                            favorites={favorites}
                            toggleFavorite={toggleFavorite}
                            setSelectedShop={setSelectedShop}
                            visibleCount={visibleCount}
                            setVisibleCount={setVisibleCount}
                            onAdRegister={onAdRegister}
                            onNativeAdRegister={onNativeAdRegister}
                        />
                    )
                ) : shops.length > 0 ? (
                    <JobListView
                        shops={shops}
                        brand={brand}
                        favorites={favorites}
                        toggleFavorite={toggleFavorite}
                        setSelectedShop={setSelectedShop}
                        visibleCount={visibleCount}
                        setVisibleCount={setVisibleCount}
                        onAdRegister={onAdRegister}
                        onNativeAdRegister={onNativeAdRegister}
                    />
                ) : null}
            </div>
        </div>
    );
};
