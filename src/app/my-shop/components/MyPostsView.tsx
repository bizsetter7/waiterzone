'use client';

import React, { useState, useEffect } from 'react';
import { FileText, MessageSquare, Lock, ChevronRight, RefreshCw } from 'lucide-react';
import { useBrand } from '@/components/BrandProvider';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';

type ActiveTab = 'community' | 'inquiry';

interface CommunityPost {
    id: number;
    category: string;
    title: string;
    created_at: string;
    is_secret: boolean;
    images: string[];
}

interface InquiryPost {
    id: string;
    type: string | null;
    title: string;
    created_at: string;
    status: string;
    is_secret: boolean;
}

const CATEGORY_COLORS: Record<string, string> = {
    '그녀들의 수다': 'bg-rose-50 text-rose-500',
    '꿀팁 & 노하우': 'bg-amber-50 text-amber-500',
    '뷰티·패션·이벤트': 'bg-pink-50 text-pink-500',
    '같이일할단짝': 'bg-violet-50 text-violet-500',
    '중고거래': 'bg-blue-50 text-blue-500',
    '무료법률상담': 'bg-green-50 text-green-500',
    '프리미엄 라운지': 'bg-yellow-50 text-yellow-600',
};

const STATUS_MAP: Record<string, { label: string; className: string }> = {
    new: { label: '접수중', className: 'bg-blue-50 text-blue-500' },
    in_progress: { label: '처리중', className: 'bg-amber-50 text-amber-500' },
    completed: { label: '답변완료', className: 'bg-green-50 text-green-600' },
    closed: { label: '종료', className: 'bg-gray-100 text-gray-400' },
};

function formatDate(dateStr: string) {
    const d = new Date(dateStr);
    return d.toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\. /g, '.').replace(/\.$/, '');
}

export function MyPostsView({ setView }: { setView: (v: any) => void }) {
    const brand = useBrand();
    const { user, isLoggedIn } = useAuth();
    const isDark = brand.theme === 'dark';

    const [activeTab, setActiveTab] = useState<ActiveTab>('community');
    const [communityPosts, setCommunityPosts] = useState<CommunityPost[]>([]);
    const [inquiryPosts, setInquiryPosts] = useState<InquiryPost[]>([]);
    const [isLoadingCommunity, setIsLoadingCommunity] = useState(false);
    const [isLoadingInquiry, setIsLoadingInquiry] = useState(false);
    const [communityLoaded, setCommunityLoaded] = useState(false);
    const [inquiryLoaded, setInquiryLoaded] = useState(false);

    // 게스트만 제외하고 로그인된 아이디가 있다면 모두 읽기 허용
    const isMockUser = !user?.id || user.id === 'guest';

    // 커뮤니티 게시글 로드
    const loadCommunityPosts = async () => {
        if (!user?.id || isMockUser) return;
        setIsLoadingCommunity(true);
        try {
            // 대표님 지시사항: 닉네임 꼼수 없이, 무조건 로그인한 실제 고유 ID 기준으로만 1:1 완벽 매칭
            const { data, error } = await supabase
                .from('community_posts')
                .select('id, category, title, created_at, is_secret') // images 컬럼이 DB에 없어서 발생하는 크래시 버그 해결
                .eq('author_id', user.id)
                .order('created_at', { ascending: false })
                .limit(50);

            if (error) throw error;
            // 타입스크립트 에러 방지용: DB에 images 컬럼이 없으므로 프론트엔드가 죽지 않게 빈 배열을 억지로 채워 줌
            const mappedData = (data || []).map(post => ({
                ...post,
                images: []
            }));
            setCommunityPosts(mappedData);
        } catch (e) {
            console.warn('커뮤니티 게시글 로드 실패:', e);
        } finally {
            setIsLoadingCommunity(false);
            setCommunityLoaded(true);
        }
    };

    // 1:1 문의 로드
    const loadInquiryPosts = async () => {
        if (!user?.id || isMockUser) return;
        setIsLoadingInquiry(true);
        try {
            // 대표님 지시사항: 닉네임 매칭 제거, 오직 고유 식별 ID로만 처리
            const { data, error } = await supabase
                .from('inquiries')
                .select('id, type, title, created_at, status, is_secret')
                .eq('user_id', user.id)
                .is('parent_id', null)
                .order('created_at', { ascending: false })
                .limit(50);

            if (error) throw error;
            setInquiryPosts(data || []);
        } catch (e) {
            console.warn('1:1 문의 로드 실패:', e);
        } finally {
            setIsLoadingInquiry(false);
            setInquiryLoaded(true);
        }
    };

    // 탭 전환 시 lazy load
    useEffect(() => {
        if (isMockUser) return;
        // 작성 후 마이페이지 진입 시 즉시 반영을 위해 탭 전환 시 매번 로드
        if (activeTab === 'community') {
            loadCommunityPosts();
        } else if (activeTab === 'inquiry') {
            loadInquiryPosts();
        }
    }, [activeTab, user?.id]);

    // mock 유저 안내
    if (isMockUser) {
        return (
            <div className={`p-10 rounded-[32px] border text-center ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'}`}>
                <FileText size={40} className="mx-auto mb-4 text-gray-200" />
                <p className={`font-black text-base mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>실제 계정으로 로그인 시 확인 가능합니다.</p>
                <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Supabase 계정으로 로그인하면 내가 작성한 게시글을 확인할 수 있습니다.</p>
            </div>
        );
    }

    const isLoading = activeTab === 'community' ? isLoadingCommunity : isLoadingInquiry;

    return (
        <div className="space-y-4">
            {/* 헤더 */}
            <div className="flex items-center justify-between mb-2">
                <h2 className={`text-xl font-black flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    <FileText size={20} className="text-[#f82b60]" />
                    내가 작성한 게시글
                </h2>
                <button
                    onClick={() => activeTab === 'community' ? loadCommunityPosts() : loadInquiryPosts()}
                    className={`p-2 rounded-xl transition-all ${isDark ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-400'} ${isLoading ? 'animate-spin' : ''}`}
                    title="새로고침"
                >
                    <RefreshCw size={16} />
                </button>
            </div>

            {/* 탭 */}
            <div className={`flex rounded-2xl p-1 ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
                <button
                    onClick={() => setActiveTab('community')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-black transition-all ${activeTab === 'community'
                            ? 'bg-[#f82b60] text-white shadow-md shadow-rose-200'
                            : isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    <FileText size={15} />
                    커뮤니티 게시글
                    {communityLoaded && communityPosts.length > 0 && (
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-black ${activeTab === 'community' ? 'bg-white/30 text-white' : 'bg-rose-100 text-[#f82b60]'}`}>
                            {communityPosts.length}
                        </span>
                    )}
                </button>
                <button
                    onClick={() => setActiveTab('inquiry')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-black transition-all ${activeTab === 'inquiry'
                            ? 'bg-[#f82b60] text-white shadow-md shadow-rose-200'
                            : isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    <MessageSquare size={15} />
                    1:1 문의
                    {inquiryLoaded && inquiryPosts.length > 0 && (
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-black ${activeTab === 'inquiry' ? 'bg-white/30 text-white' : 'bg-rose-100 text-[#f82b60]'}`}>
                            {inquiryPosts.length}
                        </span>
                    )}
                </button>
            </div>

            {/* 커뮤니티 탭 */}
            {activeTab === 'community' && (
                <>
                    {isLoadingCommunity ? (
                        <div className={`p-12 rounded-[32px] border text-center ${isDark ? 'bg-gray-900 border-gray-800 text-gray-500' : 'bg-white border-gray-100 text-gray-400'}`}>
                            <RefreshCw size={28} className="mx-auto mb-3 animate-spin opacity-40" />
                            <p className="text-sm font-bold">불러오는 중...</p>
                        </div>
                    ) : communityPosts.length === 0 ? (
                        <div className={`p-12 rounded-[32px] border text-center ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'}`}>
                            <FileText size={40} className="mx-auto mb-4 text-gray-200" />
                            <p className={`font-black text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>작성한 커뮤니티 게시글이 없습니다.</p>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-3">
                            {communityPosts.map((post) => (
                                <a
                                    key={post.id}
                                    href={`/community/${post.id}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={`p-5 rounded-[24px] border shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all flex items-center gap-4 ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'}`}
                                >
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${CATEGORY_COLORS[post.category] || 'bg-gray-100 text-gray-500'}`}>
                                                {post.category}
                                            </span>
                                            {post.is_secret && (
                                                <span className="flex items-center gap-0.5 text-[10px] font-black text-gray-400">
                                                    <Lock size={10} /> 비밀글
                                                </span>
                                            )}
                                        </div>
                                        <p className={`font-black text-sm truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>{post.title}</p>
                                        <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{formatDate(post.created_at)}</p>
                                    </div>
                                    <ChevronRight size={16} className="text-gray-300 shrink-0" />
                                </a>
                            ))}
                        </div>
                    )}
                </>
            )}

            {/* 1:1 문의 탭 */}
            {activeTab === 'inquiry' && (
                <>
                    {isLoadingInquiry ? (
                        <div className={`p-12 rounded-[32px] border text-center ${isDark ? 'bg-gray-900 border-gray-800 text-gray-500' : 'bg-white border-gray-100 text-gray-400'}`}>
                            <RefreshCw size={28} className="mx-auto mb-3 animate-spin opacity-40" />
                            <p className="text-sm font-bold">불러오는 중...</p>
                        </div>
                    ) : inquiryPosts.length === 0 ? (
                        <div className={`p-12 rounded-[32px] border text-center ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'}`}>
                            <MessageSquare size={40} className="mx-auto mb-4 text-gray-200" />
                            <p className={`font-black text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>접수한 1:1 문의가 없습니다.</p>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-3">
                            {inquiryPosts.map((inq) => {
                                const st = STATUS_MAP[inq.status] || { label: inq.status, className: 'bg-gray-100 text-gray-400' };
                                return (
                                    <a
                                        key={inq.id}
                                        href="/customer-center"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={`p-5 rounded-[24px] border shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all flex items-center gap-4 ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'}`}
                                    >
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                                {inq.type && (
                                                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-violet-50 text-violet-500">
                                                        {inq.type}
                                                    </span>
                                                )}
                                                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${st.className}`}>
                                                    {st.label}
                                                </span>
                                                {inq.is_secret && (
                                                    <span className="flex items-center gap-0.5 text-[10px] font-black text-gray-400">
                                                        <Lock size={10} /> 비밀글
                                                    </span>
                                                )}
                                            </div>
                                            <p className={`font-black text-sm truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>{inq.title}</p>
                                            <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{formatDate(inq.created_at)}</p>
                                        </div>
                                        <ChevronRight size={16} className="text-gray-300 shrink-0" />
                                    </a>
                                );
                            })}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
