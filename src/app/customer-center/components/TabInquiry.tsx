'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useBrand } from '@/components/BrandProvider';
import { supabase } from '@/lib/supabase';
import { usePreventLeave } from '@/hooks/usePreventLeave';
import {
    Search,
    Zap,
    UserCheck,
    MessageSquare,
    PenBox,
    List,
    RefreshCw,
    ShieldCheck,
    MessageCircle,
    Paperclip,
    Lock,
    ChevronLeft,
    Megaphone,
    Trash2
} from 'lucide-react';

interface TabInquiryProps {
    isLoggedIn: boolean;
    authUser: any;
}

export const TabInquiry = ({ isLoggedIn, authUser }: TabInquiryProps) => {
    const brand = useBrand();

    // Inquiry form states
    const [inquiryContact, setInquiryContact] = useState('');
    const [inquiryTitle, setInquiryTitle] = useState('');
    const [inquiryContent, setInquiryContent] = useState('');
    const [isInquirySubmitting, setIsInquirySubmitting] = useState(false);
    const [inquiries, setInquiries] = useState<any[]>([]);
    const [inquiryMode, setInquiryMode] = useState<'list' | 'write' | 'detail'>('list');
    const [viewingInquiry, setViewingInquiry] = useState<any | null>(null);
    const [inquiryThread, setInquiryThread] = useState<any[]>([]);
    const [passwordInput, setPasswordInput] = useState('');
    const [isPasswordVerified, setIsPasswordVerified] = useState(false);
    const [isSecretInquiry, setIsSecretInquiry] = useState(false);

    // 모달/상세보기 오픈 시 배경 스크롤 방지
    useEffect(() => {
        if (inquiryMode === 'detail') {
            const originalStyle = window.getComputedStyle(document.body).overflow;
            document.body.style.overflow = 'hidden';
            return () => {
                document.body.style.overflow = originalStyle;
            };
        }
    }, [inquiryMode]);

    // Pagination & Search States
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    const [searchType, setSearchType] = useState('title');
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [totalCount, setTotalCount] = useState(0);

    // Responsive Placeholder for Content
    const [contentPlaceholder, setContentPlaceholder] = useState('상담을 위해 구체적인 내용을 작성해주세요.');
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 768) {
                setContentPlaceholder('상담을 위해 구체적인 내용을\n작성해주세요.');
            } else {
                setContentPlaceholder('상담을 위해 구체적인 내용을 작성해주세요.');
            }
        };
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Category Filter State & Counts
    const [activeCategory, setActiveCategory] = useState('전체');
    const INQUIRY_CATEGORIES = ['전체', '입금확인문의', '배너문의', '주문형광고문의', '기간연장문의', '개인회원문의', '제휴문의', '광고 상품', '채용 관련', '신고/정책', '기타문의'];
    const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({
        '입금확인문의': 0,
        '배너문의': 0,
        '주문형광고문의': 0,
        '기간연장문의': 0,
        '개인회원문의': 0,
        '제휴문의': 0,
        '광고 상품': 0,
        '채용 관련': 0,
        '신고/정책': 0,
        '기타문의': 0,
    });

    // Admin & Session State
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [profileBusinessName, setProfileBusinessName] = useState<string>('');
    // [닉네임 실시간 조회] user_id → {nickname, business_name, role} 캐시 맵 (관리자탭과 동일 방식)
    const [writerProfileMap, setWriterProfileMap] = useState<Record<string, any>>({});
    const isAdmin = !!(
        authUser?.email === 'admin_user' ||
        authUser?.type === 'admin' ||
        currentUser?.email === 'admin_user' ||
        currentUser?.user_metadata?.role === 'admin'
    );

    useEffect(() => {
        supabase.auth.getUser().then(async ({ data: { user } }) => {
            setCurrentUser(user);
            if (user && authUser?.type === 'corporate') {
                // 업체회원: writer_name에 쓸 business_name 추가 조회
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('business_name')
                    .eq('id', user.id)
                    .single();
                if (profile?.business_name) setProfileBusinessName(profile.business_name);
            }
        });
    }, [authUser?.type]);

    // 1:1 문의 상태 변경 시 자동 상단 스크롤
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'instant' });
    }, [inquiryMode, activeCategory, currentPage]);

    const isDirty = inquiryMode === 'write' && (inquiryContact !== '' || inquiryTitle !== '' || inquiryContent !== '');

    // Fetch inquiries with search, pagination, and category filter
    const fetchInquiries = useCallback(async () => {
        setIsSearching(true);
        try {
            // [OPTIMIZATION] Select only necessary fields for list view to prevent timeout
            // user_id 추가 — 닉네임 실시간 조회용 (writer_name 저장 오류 대응)
            let query = supabase
                .from('inquiries')
                .select('id, type, title, writer_name, user_id, created_at, status, parent_id, is_secret, file_url', { count: 'exact' });

            if (activeCategory !== '전체') {
                query = query.eq('type', activeCategory);
            }

            if (searchQuery) {
                if (searchType === 'title') {
                    query = query.ilike('title', `%${searchQuery}%`);
                } else if (searchType === 'content') {
                    query = query.ilike('content', `%${searchQuery}%`);
                } else if (searchType === 'writer') {
                    query = query.ilike('writer_name', `%${searchQuery}%`);
                }
            }

            const { data, count, error } = await query
                .order('created_at', { ascending: false })
                .range((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage - 1);

            if (error) throw error;

            // [IMPORTANT] In-memory sorting for reply grouping
            if (data) {
                const sortedData = [...data].sort((a, b) => {
                    const aThreadId = a.parent_id || a.id;
                    const bThreadId = b.parent_id || b.id;

                    if (aThreadId !== bThreadId) {
                        const aParent = data.find(item => item.id === aThreadId) || a;
                        const bParent = data.find(item => item.id === bThreadId) || b;
                        return new Date(bParent.created_at).getTime() - new Date(aParent.created_at).getTime();
                    }

                    if (!a.parent_id && b.parent_id) return -1;
                    if (a.parent_id && !b.parent_id) return 1;
                    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
                });
                setInquiries(sortedData);

                // [닉네임 실시간 조회] user_id 있는 항목만 배치로 프로필 조회
                const userIds = [...new Set(
                    sortedData
                        .map((inq: any) => inq.user_id)
                        .filter((id: any) => !!id)
                )];
                if (userIds.length > 0) {
                    supabase
                        .from('profiles')
                        .select('id, nickname, business_name, role')
                        .in('id', userIds)
                        .then(({ data: profiles }) => {
                            if (profiles) {
                                const map: Record<string, any> = {};
                                profiles.forEach((p: any) => { map[p.id] = p; });
                                setWriterProfileMap(map);
                            }
                        });
                }
            }
            if (count !== null) setTotalCount(count);

            // [FIX] Initialize counts for all categories
            const counts: Record<string, number> = {};
            ['입금확인문의', '배너문의', '주문형광고문의', '기간연장문의', '개인회원문의', '제휴문의', '광고 상품', '채용 관련', '신고/정책', '기타문의'].forEach(cat => {
                counts[cat] = 0;
            });
            setCategoryCounts(counts);
        } catch (err: any) {
            console.error('Fetch error full:', JSON.stringify(err, null, 2));
            console.error('Fetch error msg:', err?.message || err);
        } finally {
            setIsSearching(false);
        }
    }, [activeCategory, searchQuery, searchType, currentPage, itemsPerPage]);

    useEffect(() => {
        fetchInquiries();
    }, [fetchInquiries]);

    const handleSearch = () => {
        setCurrentPage(1);
        fetchInquiries();
    };

    // 문의 삭제 — 작성자 본인 또는 관리자만 가능
    const handleDeleteInquiry = async (inquiryId: string) => {
        if (!confirm('정말 삭제하시겠습니까? 삭제 후 복구가 불가합니다.')) return;
        try {
            // 답변 댓글(parent_id=inquiryId)도 함께 삭제
            await supabase.from('inquiries').delete().eq('parent_id', inquiryId);
            const { error } = await supabase.from('inquiries').delete().eq('id', inquiryId);
            if (error) throw error;
            alert('삭제되었습니다.');
            setInquiryMode('list');
            setViewingInquiry(null);
            fetchInquiries();
        } catch (err: any) {
            alert('삭제 중 오류가 발생했습니다: ' + err.message);
        }
    };

    usePreventLeave(isDirty);

    // [SCROLL FIX] Force unlock body scroll when entering detail view
    useEffect(() => {
        if (inquiryMode === 'detail') {
            document.body.style.overflow = 'auto';
            document.body.classList.remove('modal-open');
            return () => {
                document.body.style.overflow = '';
            };
        }
    }, [inquiryMode]);

    return (
            <div className="space-y-8">
                {/* Dashboard Info Card */}
                <div className="bg-gradient-to-br from-[#f82b60] to-[#db2456] p-8 md:p-10 rounded-[40px] text-white shadow-xl shadow-rose-100 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-10 opacity-10">
                        <MessageCircle size={150} />
                    </div>
                    <div className="relative z-10">
                        <h3 className="text-2xl md:text-3xl font-black mb-2 tracking-tighter">1:1 맞춤 상담 게시판</h3>
                        <p className="text-rose-50 text-sm font-bold opacity-90 leading-relaxed">
                            광고, 채용, 이벤트, 허위광고신고 등<br />
                            회원분들의 소중한 의견을 남겨주세요!
                        </p>
                    </div>
                </div>

                {inquiryMode === 'list' && (
                    <div className="space-y-6">

                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mt-6">
                            <div className="flex items-center gap-3">
                                <div className="w-1.5 h-6 bg-[#f82b60] rounded-full"></div>
                                <h4 className={`text-xl font-black ${brand.theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{activeCategory === '전체' ? '1:1 맞춤 상담 내역' : activeCategory} <span className="text-[#f82b60] ml-1">{totalCount}</span></h4>
                            </div>
                            <div className="flex items-center justify-center md:justify-end gap-2 w-full md:w-auto">
                                <button
                                    onClick={() => {
                                        // Clear form states
                                        setInquiryTitle('');
                                        setInquiryContent('');
                                        setPasswordInput('');
                                        // 업체회원 → business_name, 개인회원 → nickname
                                        const writerLabel = authUser?.type === 'corporate'
                                            ? (profileBusinessName || authUser?.name || '업체회원')
                                            : (authUser?.nickname || currentUser?.user_metadata?.nickname || currentUser?.nickname || '익명');
                                        setInquiryContact(`|${writerLabel}`);

                                        setInquiryMode('write');
                                    }}
                                    className="px-5 py-3 bg-gray-900 text-white rounded-xl text-[13px] font-black hover:bg-black transition shadow-lg flex items-center gap-1.5"
                                >
                                    <PenBox size={16} /> 글쓰기
                                </button>
                                <button
                                    onClick={() => {
                                        setSearchQuery('');
                                        setActiveCategory('전체');
                                        setCurrentPage(1);
                                        fetchInquiries();
                                    }}
                                    className="px-5 py-3 border border-gray-200 bg-white text-gray-700 rounded-xl text-[13px] font-black hover:bg-gray-50 transition shadow-sm flex items-center gap-1.5"
                                >
                                    <List size={16} /> 글목록
                                </button>
                            </div>
                        </div>

                        {/* Board List (Desktop & Mobile Unified Overhaul) */}
                        <div className={`rounded-xl border ${brand.theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100 shadow-sm'}`}>
                            <div className="overflow-hidden p-0 md:p-1">
                                <table className="w-full text-left table-fixed border-collapse">
                                    <thead>
                                        <tr className={`border-b text-[8.5px] md:text-[10px] font-black uppercase tracking-[0.05em] ${brand.theme === 'dark' ? 'bg-gray-700/50 border-gray-700 text-gray-500' : 'bg-gray-50 border-gray-100 text-gray-400'}`}>
                                            <th className="px-1 py-2 w-8 md:w-16 text-center">번호</th>
                                            <th className="px-2 py-2">제목</th>
                                            <th className="px-1 py-2 w-14 md:w-28 text-center">등록인</th>
                                            <th className="px-1 py-2 w-14 md:w-32 text-center">등록일</th>
                                        </tr>
                                    </thead>
                                    <tbody className={`divide-y ${brand.theme === 'dark' ? 'divide-gray-700' : 'divide-gray-50'}`}>
                                        {inquiries.length > 0 ? (inquiries.map((inq, idx) => {
                                            const isNotice = inq.type === '공지';
                                            const isReply = !!inq.parent_id;

                                            return (
                                                <tr
                                                    key={inq.id}
                                                    onClick={async () => {
                                                        const { data, error } = await supabase
                                                            .from('inquiries')
                                                            .select('*')
                                                            .eq('id', inq.id)
                                                            .single();

                                                        if (data) {
                                                            setViewingInquiry(data);

                                                            // [NEW] Fetch entire thread
                                                            const threadId = data.parent_id || data.id;
                                                            const { data: threadData } = await supabase
                                                                .from('inquiries')
                                                                .select('*')
                                                                .or(`id.eq.${threadId},parent_id.eq.${threadId}`)
                                                                .order('created_at', { ascending: true });

                                                            if (threadData) {
                                                                setInquiryThread(threadData);
                                                            }

                                                            // [SECURITY TIGHTENING] 오직 시스템이 보증하는 역할과 정확한 이메일 매칭만 허용
                                                            const canBypass = !!(
                                                                isAdmin ||
                                                                authUser?.email === 'admin_user' ||
                                                                authUser?.type === 'admin' ||
                                                                currentUser?.email === 'admin_user' ||
                                                                currentUser?.user_metadata?.role === 'admin'
                                                            );

                                                            if (data.is_secret && !isNotice && !canBypass) {
                                                                setInquiryMode('detail');
                                                                setIsPasswordVerified(false);
                                                                setPasswordInput('');
                                                            } else {
                                                                setInquiryMode('detail');
                                                                setIsPasswordVerified(true);
                                                            }
                                                            window.scrollTo({ top: 0, behavior: 'instant' });
                                                        }
                                                    }}
                                                    className={`group cursor-pointer border-b last:border-0 transition-colors ${brand.theme === 'dark' ? 'hover:bg-gray-700/30' : 'hover:bg-rose-50/30'}`}
                                                >
                                                    <td className="px-1 py-1.5 md:py-3.5 text-center text-[9px] md:text-[10px] font-bold text-gray-400 italic">
                                                        {isNotice ? <Megaphone size={11} className="text-[#f82b60] mx-auto" /> : (totalCount - ((currentPage - 1) * itemsPerPage + idx))}
                                                    </td>
                                                    <td className="px-2 py-1.5 md:py-3.5">
                                                        <div className="flex items-center gap-1 overflow-hidden">
                                                            {isReply && (
                                                                <div className="ml-0.5 md:ml-4 flex items-center gap-0.5 text-gray-400 flex-shrink-0">
                                                                    <span className="text-[12px] font-thin leading-none opacity-50">↳</span>
                                                                </div>
                                                            )}
                                                            {inq.file_url && <Paperclip size={10} className="text-[#f82b60]/60 flex-shrink-0" />}
                                                            <span className={`text-[11px] md:text-[12.5px] tracking-tight truncate ${isNotice ? 'font-black text-[#f82b60] underline underline-offset-4 decoration-pink-200' : isReply ? 'text-gray-500 font-medium' : 'text-gray-900 font-bold'}`}>
                                                                {inq.title.replace(/^[↳\s]+/, '')}
                                                            </span>
                                                            {inq.is_secret && <Lock size={8} className="text-gray-300 ml-0.5 flex-shrink-0" />}
                                                            {/* [NEW] Status & Reply Count Stickers (Only for non-admin/notice posts) */}
                                                            <div className="flex items-center gap-1 ml-1.5 shrink-0">
                                                                {!isNotice && inq.writer_name !== '운영팀' && (
                                                                    inq.status === 'completed' ? (
                                                                        <span className="px-1 py-0.5 bg-rose-100 text-[#f82b60] text-[8px] md:text-[9px] rounded font-black whitespace-nowrap">답변완료</span>
                                                                    ) : (
                                                                        <span className="px-1 py-0.5 bg-gray-100 text-gray-400 text-[8px] md:text-[9px] rounded font-black whitespace-nowrap">답변대기</span>
                                                                    )
                                                                )}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className={`px-0.5 py-1.5 md:py-3.5 text-[10px] md:text-[11.5px] text-center font-black truncate ${isReply ? 'text-gray-400' : 'text-gray-500'}`}>
                                                        {isNotice ? '운영팀' : (() => {
                                                            if (inq.writer_name === '운영팀') return '운영팀';
                                                            const p = inq.user_id ? writerProfileMap[inq.user_id] : null;
                                                            if (!p) return inq.writer_name;
                                                            return (p.role === 'corporate' ? p.business_name : p.nickname) || inq.writer_name;
                                                        })()}
                                                    </td>
                                                    <td className="px-0.5 py-1.5 md:py-3.5 text-[9px] md:text-[10.5px] text-center font-medium text-gray-400 tabular-nums whitespace-nowrap relative">
                                                        <span className="group-hover:hidden">
                                                            {new Date(inq.created_at).toLocaleDateString('ko-KR', { year: '2-digit', month: '2-digit', day: '2-digit', timeZone: 'Asia/Seoul' }).replace(/-/g, '.').replace(/\.$/, '')}
                                                        </span>
                                                        {/* 본인 글: hover 시 삭제 버튼 표시 */}
                                                        {(isAdmin || (currentUser?.id && currentUser.id === (inq as any).user_id)) && (
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleDeleteInquiry(inq.id);
                                                                }}
                                                                className="hidden group-hover:inline-flex items-center gap-1 px-2 py-1 bg-red-50 text-red-400 rounded-lg text-[9px] font-black hover:bg-red-100 transition border border-red-100"
                                                            >
                                                                <Trash2 size={9} /> 삭제
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })) : (
                                            <tr>
                                                <td colSpan={4} className="px-6 py-20 text-center text-gray-400 font-bold">
                                                    {isSearching ? <RefreshCw className="animate-spin mx-auto text-[#f82b60]" size={24} /> : '등록된 문의 내역이 없습니다.'}
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Bottom Action Area (Pagination & Buttons) */}
                        <div className="flex flex-col items-center gap-8 py-4">
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setInquiryMode('write')}
                                    className="px-6 py-3.5 bg-gray-900 text-white rounded-2xl text-sm font-black hover:bg-black transition shadow-lg flex items-center gap-2"
                                >
                                    <PenBox size={18} /> 글쓰기
                                </button>
                                <button
                                    onClick={() => {
                                        setSearchQuery('');
                                        setCurrentPage(1);
                                        fetchInquiries();
                                    }}
                                    className="px-6 py-3.5 border border-gray-200 bg-white text-gray-700 rounded-2xl text-sm font-black hover:bg-gray-50 transition shadow-sm flex items-center gap-2"
                                >
                                    <List size={18} /> 글목록
                                </button>
                            </div>

                            {/* Pagination */}
                            <div className="flex items-center gap-1">
                                {Array.from({ length: Math.ceil(totalCount / itemsPerPage) }, (_, i) => i + 1).map((pageNum) => (
                                    <button
                                        key={pageNum}
                                        onClick={() => {
                                            setCurrentPage(pageNum);
                                            window.scrollTo({ top: 0, behavior: 'instant' });
                                        }}
                                        className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-black transition-all ${currentPage === pageNum
                                            ? 'bg-[#f82b60] text-white shadow-lg shadow-rose-200'
                                            : 'bg-white border border-gray-100 text-gray-400 hover:border-rose-200 hover:text-[#f82b60]'
                                            }`}
                                    >
                                        {pageNum}
                                    </button>
                                ))}
                                {totalCount > itemsPerPage * currentPage && (
                                    <button className="px-4 h-10 bg-white border border-gray-100 rounded-lg text-sm font-black text-gray-400 hover:border-rose-200 hover:text-[#f82b60]">다음</button>
                                )}
                            </div>

                            {/* Search Bar */}
                            <div className="flex flex-wrap items-center justify-center gap-2 p-4 bg-gray-50 rounded-[28px] border border-gray-100">
                                <select
                                    value={searchType}
                                    onChange={(e) => setSearchType(e.target.value)}
                                    className="px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-black outline-none focus:border-[#f82b60]"
                                >
                                    <option value="title">제목</option>
                                    <option value="content">내용</option>
                                    <option value="writer">등록인</option>
                                </select>
                                <div className="relative flex-1 min-w-[200px]">
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                        className="w-full px-5 py-3 pr-12 bg-white border border-gray-200 rounded-xl text-sm font-black outline-none focus:border-[#f82b60]"
                                        placeholder="검색어를 입력해 주세요"
                                    />
                                    <button
                                        onClick={handleSearch}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#f82b60] transition"
                                    >
                                        <Search size={20} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {inquiryMode === 'write' && (
                    <div className="space-y-6 px-1">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <button onClick={() => setInquiryMode('list')} className="p-2 hover:bg-gray-100 rounded-full transition"><ChevronLeft /></button>
                                <h4 className={`text-xl font-black ${brand.theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>문의 작성하기</h4>
                            </div>
                        </div>

                        <div className={`p-6 md:p-10 rounded-[45px] border shadow-sm space-y-6 md:space-y-8 ${brand.theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                                <div>
                                    <label className="block text-xs font-black mb-2 ml-2 text-gray-400 uppercase tracking-widest">문의 유형 <span className="text-[#f82b60]">*</span></label>
                                    <select
                                        className={`w-full border-2 rounded-2xl p-4 text-sm font-black focus:ring-4 focus:ring-[#f82b60]/10 outline-none appearance-none cursor-pointer ${brand.theme === 'dark' ? 'border-gray-700 bg-gray-900 text-white' : 'border-gray-100 bg-gray-50 text-gray-900'}`}
                                        value={inquiryTitle.match(/^\[(.*?)\]/) ? inquiryTitle.match(/^\[(.*?)\]/)![1] : ''}
                                        onChange={(e) => {
                                            const type = e.target.value;
                                            const currentTitleWithoutType = inquiryTitle.includes(']') ? inquiryTitle.split(']')[1].trim() : inquiryTitle;
                                            setInquiryTitle(`[${type}] ${currentTitleWithoutType}`);
                                        }}
                                    >
                                        <option value="" disabled>유형 선택</option>
                                        <option value="입금확인문의">입금 확인 문의</option>
                                        <option value="배너문의">배너 광고 문의</option>
                                        <option value="주문형광고문의">주문형 광고 문의</option>
                                        <option value="기간연장문의">기간 연장 문의</option>
                                        <option value="개인회원문의">개인 회원 문의</option>
                                        <option value="제휴문의">제휴/파트너십 문의</option>
                                        <option value="광고 상품">광고 상품 일반 문의</option>
                                        <option value="채용 관련">채용 관련 문의 (구직자)</option>
                                        <option value="신고/정책">신고 및 운영 정책</option>
                                        <option value="기타문의">기타 문의</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-black mb-2 ml-2 text-gray-400 uppercase tracking-widest">작성자 닉네임</label>
                                    <input
                                        type="text"
                                        value={isLoggedIn
                                            ? (authUser?.type === 'corporate'
                                                ? (profileBusinessName || authUser?.name || '업체회원')
                                                : (authUser?.nickname || currentUser?.nickname || '회원'))
                                            : (inquiryContact.split('|')[1] || '')}
                                        onChange={(e) => !isLoggedIn && setInquiryContact(prev => `${prev.split('|')[0]}|${e.target.value}`)}
                                        readOnly={isLoggedIn}
                                        className={`w-full border-2 rounded-2xl p-4 text-sm font-black outline-none ${brand.theme === 'dark' ? 'border-gray-700 bg-gray-900/50 text-white' : 'border-gray-100 bg-gray-50 text-gray-900'} ${isLoggedIn ? 'opacity-50' : ''}`}
                                        placeholder="닉네임을 입력해주세요"
                                    />
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 md:p-6 bg-gray-50/50 rounded-[35px] border border-gray-100 gap-4">
                                <div className="flex items-center gap-3">
                                    <label className="relative flex items-center gap-3 cursor-pointer group">
                                        <input
                                            type="checkbox"
                                            className="peer hidden"
                                            checked={isSecretInquiry}
                                            onChange={(e) => setIsSecretInquiry(e.target.checked)}
                                        />
                                        <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${isSecretInquiry ? 'bg-[#f82b60] border-[#f82b60]' : 'bg-white border-gray-200'} group-hover:border-rose-200`}>
                                            {isSecretInquiry && <Zap size={14} className="text-white fill-white" />}
                                        </div>
                                        <span className="text-sm font-black text-gray-700">비밀글 설정</span>
                                    </label>
                                    <span className="text-[10px] text-gray-400 font-bold hidden xs:inline">관리자와 작성자만 확인 가능</span>
                                </div>

                                <div className={`flex items-center gap-3 transition-all duration-300 ${isSecretInquiry ? 'opacity-100 translate-x-0' : 'opacity-20 pointer-events-none grayscale'}`}>
                                    <div className="relative flex-1 sm:w-56">
                                        <Lock size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <input
                                            type="password"
                                            value={passwordInput}
                                            onChange={(e) => setPasswordInput(e.target.value)}
                                            placeholder="비밀번호 (4자리 이상)"
                                            className={`w-full border-2 rounded-2xl pl-12 pr-6 py-4 text-sm font-black outline-none focus:ring-4 focus:ring-[#f82b60]/10 ${brand.theme === 'dark' ? 'border-gray-700 bg-gray-900 text-white' : 'border-gray-100 bg-white text-gray-900 shadow-sm'}`}
                                            maxLength={20}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-4 md:gap-6">
                                <div>
                                    <label className="block text-xs font-black mb-2 ml-2 text-gray-400 uppercase tracking-widest">연락처/회신처 <span className="text-[#f82b60]">*</span></label>
                                    <input
                                        type="text"
                                        value={inquiryContact.split('|')[0]}
                                        onChange={(e) => setInquiryContact(prev => `${e.target.value}|${prev.split('|')[1] || ''}`)}
                                        placeholder="회신 받을 번호 또는 이메일"
                                        className={`w-full border-2 rounded-2xl p-4 text-sm font-black focus:ring-4 focus:ring-[#f82b60]/10 outline-none placeholder-gray-400 ${brand.theme === 'dark' ? 'border-gray-700 bg-gray-900 text-white' : 'border-gray-100 bg-gray-50 text-gray-900'}`}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-black mb-2 ml-2 text-gray-400 uppercase tracking-widest">문의 제목 <span className="text-[#f82b60]">*</span></label>
                                <input
                                    type="text"
                                    value={inquiryTitle.replace(/^\[.*?\]\s*/, '')}
                                    onChange={(e) => {
                                        const typeMatch = inquiryTitle.match(/^\[(.*?)\]/);
                                        const typePrefix = typeMatch ? `[${typeMatch[1]}] ` : '';
                                        setInquiryTitle(`${typePrefix}${e.target.value}`);
                                    }}
                                    placeholder="핵심 내용을 요약해주세요"
                                    className={`w-full border-2 rounded-2xl p-4 text-sm font-black focus:ring-4 focus:ring-[#f82b60]/10 outline-none placeholder-gray-400 ${brand.theme === 'dark' ? 'border-gray-700 bg-gray-900 text-white' : 'border-gray-100 bg-gray-50 text-gray-900'}`}
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-black mb-2 ml-2 text-gray-400 uppercase tracking-widest">상세 내용 <span className="text-[#f82b60]">*</span></label>
                                <textarea
                                    value={inquiryContent}
                                    onChange={(e) => setInquiryContent(e.target.value)}
                                    placeholder={contentPlaceholder}
                                    className={`w-full border-2 rounded-[35px] p-6 md:p-8 text-sm font-black h-56 md:h-64 resize-none focus:ring-4 focus:ring-[#f82b60]/10 outline-none placeholder-gray-400 ${brand.theme === 'dark' ? 'border-gray-700 bg-gray-900 text-white' : 'border-gray-100 bg-gray-50 text-gray-900'}`}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                                {[1, 2, 3].map(num => (
                                    <div key={num}>
                                        <label className="block text-xs font-black mb-2 ml-2 text-gray-400 uppercase tracking-widest whitespace-nowrap overflow-hidden text-ellipsis">첨부파일 {num} (선택)</label>
                                        <div className="relative group">
                                            <input
                                                type="file"
                                                id={`inquiry_file_${num}`}
                                                className={`w-full border-2 rounded-2xl p-4 text-xs font-black focus:ring-4 focus:ring-[#f82b60]/10 outline-none text-transparent file:hidden ${brand.theme === 'dark' ? 'border-gray-700 bg-gray-900' : 'border-gray-100 bg-gray-50'}`}
                                                onChange={(e) => {
                                                    const fileName = e.target.files?.[0]?.name || '선택된 파일없음';
                                                    const displayEl = document.getElementById(`inquiry_file_name_${num}`);
                                                    if (displayEl) displayEl.innerText = fileName;
                                                }}
                                            />
                                            <div
                                                id={`inquiry_file_name_${num}`}
                                                className="absolute left-5 top-1/2 -translate-y-1/2 text-xs font-black text-gray-400 pointer-events-none"
                                            >
                                                선택된 파일없음
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="flex gap-4">
                                <button
                                    onClick={() => {
                                        if (inquiryTitle || inquiryContent) {
                                            if (!confirm('작성 중인 내용은 저장되지 않습니다. 정말 취소하시겠습니까?')) return;
                                        }
                                        setInquiryMode('list');
                                    }}
                                    className={`flex-1 py-5 rounded-2xl text-base font-black transition ${brand.theme === 'dark' ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}
                                >
                                    취소
                                </button>
                                <button
                                    disabled={isInquirySubmitting}
                                    onClick={async () => {
                                        const contact = inquiryContact.split('|')[0];
                                        // 업체회원 → business_name, 개인회원 → nickname, 비로그인 → 입력값
                                        // [Fix] authUser.nickname(UserSession/DB기반) 1순위 — currentUser는 auth객체라 nickname 없음
                                        const writer = isLoggedIn
                                            ? (authUser?.type === 'corporate'
                                                ? (profileBusinessName || authUser?.name || '업체회원')
                                                : (authUser?.nickname || authUser?.name || currentUser?.user_metadata?.nickname || '닉네임'))
                                            : inquiryContact.split('|')[1];

                                        if (!contact || !writer || !inquiryTitle || !inquiryContent) {
                                            alert('필수 항목(*)을 모두 입력해주세요.');
                                            return;
                                        }

                                        setIsInquirySubmitting(true);
                                        try {
                                            const fileUrls: string[] = [];
                                            const fileInputIds = ['inquiry_file_1', 'inquiry_file_2', 'inquiry_file_3'];

                                            for (const id of fileInputIds) {
                                                const input = document.getElementById(id) as HTMLInputElement;
                                                const file = input?.files?.[0];
                                                if (file) {
                                                    const fileExt = file.name.split('.').pop();
                                                    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`; // Unique filename
                                                    const { error: uploadError } = await supabase.storage
                                                        .from('inquiry-attachments')
                                                        .upload(fileName, file);
                                                    if (uploadError) throw uploadError;
                                                    const { data: { publicUrl } } = supabase.storage.from('inquiry-attachments').getPublicUrl(fileName);
                                                    fileUrls.push(publicUrl);
                                                }
                                            }
                                            const finalFileUrl = fileUrls.length > 0 ? JSON.stringify(fileUrls) : '';

                                            const typeMatch = inquiryTitle.match(/^\[(.*?)\]/);
                                            const finalType = typeMatch ? typeMatch[1] : '기타';

                                            const { error } = await supabase.from('inquiries').insert([{
                                                type: finalType,
                                                writer_name: writer,
                                                password: passwordInput,
                                                contact: contact,
                                                shop_name: '',
                                                title: inquiryTitle,
                                                content: inquiryContent,
                                                status: 'new',
                                                is_secret: isSecretInquiry,
                                                user_id: currentUser?.id || null,
                                                file_url: finalFileUrl
                                            }]);

                                            if (error) throw error;

                                            alert('문의가 접수되었습니다. 목록에서 확인해 주세요.');
                                            setInquiryContact('');
                                            setInquiryTitle('');
                                            setInquiryContent('');
                                            setPasswordInput('');
                                            setInquiryMode('list');
                                            fetchInquiries();
                                            window.scrollTo({ top: 0, behavior: 'instant' });
                                        } catch (err: any) {
                                            console.error('Inquiry Submission Error:', err);
                                            alert('접수 중 오류가 발생했습니다.');
                                        } finally {
                                            setIsInquirySubmitting(false);
                                        }
                                    }}
                                    className="flex-[2] py-5 bg-[#f82b60] text-white rounded-2xl text-base font-black shadow-lg shadow-rose-100 hover:bg-[#db2456] transition flex items-center justify-center gap-2"
                                >
                                    {isInquirySubmitting ? <RefreshCw className="animate-spin" size={20} /> : '문의 등록하기'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {inquiryMode === 'detail' && viewingInquiry && (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                                <button onClick={() => {
                                    setInquiryMode('list');
                                    setIsPasswordVerified(false);
                                    setPasswordInput('');
                                }} className="p-2 hover:bg-gray-100 rounded-full transition"><ChevronLeft /></button>
                                <h4 className={`text-xl font-black ${brand.theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>문의 내용 확인</h4>
                            </div>
                            {/* 삭제 버튼 — 본인 글이거나 관리자인 경우 표시 */}
                            {(isAdmin || (currentUser?.id && currentUser.id === viewingInquiry.user_id)) && (
                                <button
                                    onClick={() => handleDeleteInquiry(viewingInquiry.id)}
                                    className="flex items-center gap-1.5 px-4 py-2 bg-red-50 text-red-500 border border-red-100 rounded-xl text-[12px] font-black hover:bg-red-100 transition-all active:scale-95"
                                >
                                    <Trash2 size={13} /> 삭제
                                </button>
                            )}
                        </div>

                        {!isPasswordVerified ? (
                            <div className={`p-10 md:p-16 rounded-[45px] border text-center space-y-8 ${brand.theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                                <div className="w-16 h-16 bg-rose-50 text-[#f82b60] rounded-3xl flex items-center justify-center mx-auto shadow-inner">
                                    <Zap size={32} />
                                </div>
                                <div className="space-y-2">
                                    <h5 className="text-xl font-black text-gray-900">비밀글입니다.</h5>
                                    <p className="text-sm font-bold text-gray-400">작성 시 설정한 비밀번호를 입력해주세요.</p>
                                </div>
                                <div className="max-w-xs mx-auto space-y-4">
                                    <input
                                        type="password"
                                        value={passwordInput}
                                        onChange={(e) => setPasswordInput(e.target.value)}
                                        placeholder="비밀번호 입력"
                                        className={`w-full border-2 rounded-2xl p-4 text-center text-lg font-black focus:ring-4 focus:ring-[#f82b60]/10 outline-none ${brand.theme === 'dark' ? 'border-gray-700 bg-gray-900 text-white' : 'border-gray-100 bg-gray-50 text-gray-900'}`}
                                    />
                                    <button
                                        onClick={() => {
                                            // Always permit admin or correct password
                                            if (isAdmin || passwordInput === viewingInquiry.password || viewingInquiry.writer_name === '운영팀') {
                                                setIsPasswordVerified(true);
                                                setPasswordInput('');
                                            } else {
                                                alert('비밀번호가 일치하지 않습니다.');
                                            }
                                        }}
                                        className="w-full py-5 bg-gray-900 text-white rounded-2xl text-base font-black hover:bg-black transition shadow-lg"
                                    >
                                        비밀번호 확인
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {/* Board Style Detail View */}
                                <div className={`p-6 md:p-10 rounded-[30px] border shadow-sm ${brand.theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
                                    {/* Header */}
                                    <div className={`border-b pb-6 mb-6 ${brand.theme === 'dark' ? 'border-gray-700' : 'border-gray-100'}`}>
                                        <div className="flex flex-col gap-3">
                                            <div className="flex items-center gap-2">
                                                <span className={`px-2.5 py-1 rounded-lg text-[11px] font-black ${viewingInquiry.status === 'completed'
                                                    ? 'bg-rose-100 text-[#f82b60]'
                                                    : 'bg-gray-100 text-gray-500'
                                                    }`}>
                                                    {viewingInquiry.status === 'completed' ? '답변완료' : '답변대기'}
                                                </span>
                                                <span className="text-[13px] font-bold text-[#f82b60]">[{viewingInquiry.type}]</span>
                                            </div>
                                            <h4 className={`text-xl md:text-2xl font-black leading-snug ${brand.theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                                {viewingInquiry.title}
                                            </h4>
                                            <div className="flex items-center gap-3 text-xs font-bold text-gray-400">
                                                <span className="flex items-center gap-1"><UserCheck size={14} /> {viewingInquiry.writer_name}</span>
                                                <span className="w-px h-3 bg-gray-300"></span>
                                                <span>{new Date(viewingInquiry.created_at).toLocaleString('ko-KR')}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Content Body */}
                                    <div className={`min-h-[200px] text-[15px] leading-loose font-medium whitespace-pre-wrap ${brand.theme === 'dark' ? 'text-gray-300' : 'text-gray-800'}`}>
                                        {viewingInquiry.content}
                                    </div>

                                    {/* Attachments */}
                                    {viewingInquiry.file_url && (() => {
                                        try {
                                            const files = JSON.parse(viewingInquiry.file_url);
                                            if (Array.isArray(files) && files.length > 0) {
                                                return (
                                                    <div className={`mt-8 pt-6 border-t ${brand.theme === 'dark' ? 'border-gray-700' : 'border-gray-100'}`}>
                                                        <h6 className="text-xs font-black text-gray-400 mb-3">첨부파일</h6>
                                                        <div className="flex flex-wrap gap-2">
                                                            {files.map((url: string, idx: number) => (
                                                                <a
                                                                    key={idx}
                                                                    href={url}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className={`flex items-center gap-2 px-4 py-3 rounded-xl text-xs font-bold transition ${brand.theme === 'dark' ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}
                                                                >
                                                                    <Paperclip size={14} />
                                                                    <span>첨부파일 {idx + 1}</span>
                                                                </a>
                                                            ))}
                                                        </div>
                                                    </div>
                                                );
                                            }
                                        } catch (e) { return null; }
                                    })()}
                                </div>

                                {/* Comments / Answers Section */}
                                <div className={`p-6 md:p-8 rounded-[30px] ${brand.theme === 'dark' ? 'bg-gray-800/50' : 'bg-gray-50'}`}>
                                    <h5 className={`text-lg font-black mb-6 flex items-center gap-2 ${brand.theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                        <MessageSquare size={18} className="text-[#f82b60]" />
                                        답변 및 댓글 <span className="text-gray-400 font-bold text-sm">({inquiryThread.filter(t => t.id !== viewingInquiry.id).length})</span>
                                    </h5>

                                    <div className="space-y-4 mb-8">
                                        {inquiryThread.filter(t => t.id !== viewingInquiry.id).map((comment) => {
                                            const isAdmin = comment.writer_name === '운영팀';
                                            return (
                                                <div key={comment.id} className={`flex gap-4 p-5 rounded-2xl ${isAdmin
                                                    ? (brand.theme === 'dark' ? 'bg-rose-900/20 border border-[#f82b60]/30' : 'bg-white border border-rose-100 shadow-sm')
                                                    : (brand.theme === 'dark' ? 'bg-gray-700 border border-gray-600' : 'bg-white border border-gray-100 shadow-sm')
                                                    }`}>
                                                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${isAdmin
                                                        ? 'bg-rose-100 text-[#f82b60]'
                                                        : 'bg-gray-100 text-gray-500'
                                                        }`}>
                                                        {isAdmin ? <ShieldCheck size={18} /> : <UserCheck size={18} />}
                                                    </div>
                                                    <div className="flex-1 space-y-1">
                                                        <div className="flex items-center justify-between">
                                                            <span className={`font-black text-sm ${isAdmin
                                                                ? (brand.theme === 'dark' ? 'text-rose-400' : 'text-[#f82b60]')
                                                                : (brand.theme === 'dark' ? 'text-white' : 'text-gray-900')
                                                                }`}>
                                                                {comment.writer_name}
                                                                {isAdmin && <span className="ml-2 text-[10px] bg-[#f82b60] text-white px-1.5 py-0.5 rounded-md">ADMIN</span>}
                                                            </span>
                                                            <span className="text-[11px] font-bold text-gray-400">
                                                                {new Date(comment.created_at).toLocaleString('ko-KR', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                                                            </span>
                                                        </div>
                                                        <p className={`text-sm leading-relaxed whitespace-pre-wrap ${brand.theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                                                            {comment.content}
                                                        </p>
                                                    </div>
                                                </div>
                                            );
                                        })}

                                        {inquiryThread.filter(t => t.id !== viewingInquiry.id).length === 0 && (
                                            <div className="text-center py-8 text-gray-400 text-sm font-bold">
                                                등록된 댓글이 없습니다.
                                            </div>
                                        )}
                                    </div>

                                    {/* Comment Input */}
                                    <div className="flex flex-col gap-3">
                                        <textarea
                                            value={inquiryContent}
                                            onChange={(e) => setInquiryContent(e.target.value)}
                                            placeholder="추가 문의사항이나 내용은 여기에 작성해주세요."
                                            className={`w-full p-4 border rounded-2xl text-sm font-medium focus:ring-2 focus:ring-[#f82b60]/20 outline-none resize-none h-24 ${brand.theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-500' : 'bg-white border-gray-200 text-gray-900'}`}
                                        />
                                        <div className="flex justify-end">
                                            <button
                                                onClick={async () => {
                                                    if (!inquiryContent.trim()) {
                                                        alert('내용을 입력해주세요.');
                                                        return;
                                                    }
                                                    if (!confirm('댓글을 등록하시겠습니까?')) return;

                                                    try {
                                                        const rootId = viewingInquiry.parent_id || viewingInquiry.id;
                                                        // Determine writer name: Admin -> '운영팀', User -> Nickname or Original Writer
                                                        // Note: isAdmin needs to be accessible here. Assuming it is from outer scope.
                                                        const canBypass = !!(
                                                            isAdmin ||
                                                            authUser?.email === 'admin_user' ||
                                                            authUser?.type === 'admin' ||
                                                            currentUser?.email === 'admin_user' ||
                                                            currentUser?.user_metadata?.role === 'admin'
                                                        );

                                                        // [Fix] authUser.nickname(UserSession, DB 프로필 기반)을 1순위로 사용
                                                        // currentUser는 Supabase auth 객체라 nickname 필드 없음 → '회원' 오류 방지
                                                        const writerName = canBypass ? '운영팀' : (
                                                            authUser?.type === 'corporate'
                                                                ? (profileBusinessName || authUser?.name || '업체')
                                                                : (authUser?.nickname || currentUser?.user_metadata?.nickname || '회원')
                                                        );

                                                        const { error } = await supabase.from('inquiries').insert([{
                                                            type: viewingInquiry.type,
                                                            writer_name: writerName,
                                                            password: viewingInquiry.password,
                                                            contact: viewingInquiry.contact,
                                                            shop_name: '',
                                                            title: `RE: ${viewingInquiry.title}`,
                                                            content: inquiryContent,
                                                            status: 'new',
                                                            is_secret: viewingInquiry.is_secret,
                                                            parent_id: rootId,
                                                            user_id: currentUser?.id || null
                                                        }]);

                                                        if (error) throw error;

                                                        // Update parent status to 'new' if user replies? Or 'active'?
                                                        // For now, just insert.

                                                        // Refresh thread
                                                        const { data: threadData } = await supabase
                                                            .from('inquiries')
                                                            .select('*')
                                                            .or(`id.eq.${rootId},parent_id.eq.${rootId}`)
                                                            .order('created_at', { ascending: true });

                                                        if (threadData) setInquiryThread(threadData);
                                                        setInquiryContent('');
                                                        alert('등록되었습니다.');

                                                    } catch (e) {
                                                        console.error(e);
                                                        alert('등록 실패');
                                                    }
                                                }}
                                                className="px-6 py-3 bg-gray-900 text-white rounded-xl font-black text-sm hover:bg-black transition flex items-center gap-2 shadow-lg"
                                            >
                                                <MessageSquare size={16} />
                                                댓글 등록
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-center pt-4 pb-20"> {/* pb-20 added for mobile scroll clarity */}
                                    <button onClick={() => {
                                        setInquiryMode('list');
                                        setIsPasswordVerified(false);
                                        setPasswordInput('');
                                    }} className={`px-10 py-4 rounded-2xl font-black text-sm transition ${brand.theme === 'dark' ? 'bg-gray-800 text-gray-400 hover:bg-gray-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                                        목록으로 돌아가기
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
    );
};
