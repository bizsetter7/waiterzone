'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    ArrowLeft,
    Home,
    Heart,
    MessageSquare,
    User,
    MoreVertical,
    Share2,
    ShieldCheck,
    Lock,
    Trash2,
    Edit,
    Eye,
    EyeOff
} from 'lucide-react';
import { MOCK_POSTS, MOCK_COMMENTS } from '@/constants/community';
import { supabase } from '@/lib/supabase';
import { Post, Comment } from '@/types/community';
import { createPortal } from 'react-dom';
import { useAuth } from '@/hooks/useAuth';
import { updatePoints } from '@/lib/points';

export default function CommunityDetailClient({ id }: { id: string }) {
    const router = useRouter();
    const postId = parseInt(id);
    const [post, setPost] = useState<Post | null>(null);
    const { user, isLoggedIn, userType } = useAuth();

    // [Comment Input State]
    const [commentText, setCommentText] = useState('');
    const [isSubmittingComment, setIsSubmittingComment] = useState(false);


    // [New] Views increment logic
    useEffect(() => {
        if (post?.id) {
            const incrementViews = async () => {
                await supabase.rpc('increment_community_post_views', { post_id: post.id });
            };
            incrementViews();
        }
    }, [post?.id]);
    const [comments, setComments] = useState<Comment[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // [Edit/Delete Actions]
    const [showActionMenu, setShowActionMenu] = useState(false);
    const [actionType, setActionType] = useState<'edit' | 'delete' | null>(null);
    const [password, setPassword] = useState('');
    const [isActionLoading, setIsActionLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        const fetchDetail = async () => {
            setIsLoading(true);
            try {
                // Fetch Post
                const { data: postData, error: _postError } = await supabase
                    .from('community_posts')
                    .select('*')
                    .eq('id', postId)
                    .single();

                let isFromMock = false;
                if (postData) {
                    setPost(postData as Post);
                } else {
                    const mock = MOCK_POSTS.find(p => p.id === postId);
                    if (mock) {
                        setPost(mock);
                        isFromMock = true;
                    }
                }

                // Fetch Comments
                const { data: commentData } = await supabase
                    .from('community_comments')
                    .select('*')
                    .eq('post_id', postId);

                // [Fix] 맥락 불일치 해결: 게시글이 DB 데이터라면 DB 댓글만 표시 (댓글이 없어도 Mock으로 폴백하지 않음)
                // 게시글이 Mock 데이터인 경우에만 Mock 댓글로 폴백
                if (isFromMock) {
                    setComments(MOCK_COMMENTS.filter(c => c.postId === postId) as Comment[]);
                } else {
                    setComments((commentData as Comment[]) || []);
                }

            } catch (error) {
                console.error('Error fetching detail:', error);
                const mockP = MOCK_POSTS.find(p => p.id === postId);
                if (mockP) setPost(mockP);
                setComments(MOCK_COMMENTS.filter(c => c.postId === postId) as Comment[]);
            } finally {
                setIsLoading(false);
            }
        };

        fetchDetail();
    }, [postId]);

    const handlePasswordAction = async () => {
        if (!password) return alert('비밀번호를 입력해주세요.');
        setIsActionLoading(true);

        try {
            if (actionType === 'delete') {
                // Call RPC for secure delete
                const { data, error } = await supabase.rpc('delete_post_with_password', {
                    p_id: postId,
                    p_password: password
                });

                if (error) throw error;
                if (data === true) {
                    alert('게시글이 삭제되었습니다.');
                    router.push('/community');
                } else {
                    alert('비밀번호가 일치하지 않거나 삭제 권한이 없습니다.');
                }
            } else if (actionType === 'edit') {
                // Edit flow is complex (needs move to write page with data). 
                // For now, let's verify password first then redirect?
                // Or simply redirect to /write?mode=edit&id=... and ask password there?
                // Better: Verify here, then redirect with a short-lived token or simply pass state?
                // Simplest for now: Just alert feature implementation or basic check.
                // User requirement: "Need password for modify".
                // Let's implement Delete first as it's destructive. Edit might redirect.
                alert('게시글 수정 기능은 준비 중입니다. (삭제 후 다시 작성해주세요)');
            }
        } catch (err: any) {
            console.error(err);
            alert(`오류 발생: ${err.message}`);
        } finally {
            setIsActionLoading(false);
            setPassword('');
            setActionType(null); // Close modal
        }
    };

    // [Comment Submit Handler] 서버 API → DB 삽입 + 5P 포인트 지급
    const handleCommentSubmit = async () => {
        if (!isLoggedIn || !commentText.trim()) return;

        const trimmed = commentText.trim();

        // [New Validation] 최소 5자 이상 성의 있는 댓글 유도
        if (trimmed.length < 5) {
            alert('댓글은 최소 5자 이상 입력해주세요. (따뜻한 소통을 지향합니다! ✨)');
            return;
        }

        // [New Validation] 포인트 파밍(단순 반복) 방지
        const uniqueChars = new Set(trimmed.replace(/\s/g, '').split('')).size;
        if (uniqueChars <= 2 && trimmed.length < 10) {
            alert('조금 더 구체적인 내용을 작성해주세요! (무의미한 반복이나 단순 자음은 등록되지 않습니다)');
            return;
        }

        // [New Validation] 무맥락/형식적 댓글 차단 (v1.5)
        // 15자 미만의 짧은 댓글이면서, 게시글 제목의 키워드를 포함하지 않고 스팸 문구만 있는 경우 차단
        const spamPhrases = ['잘보고갑니다', '좋은정보', '감사합니다', '출첵', '출석', 'ㅎㅇ', 'ㅎㅇㅌ', '화이팅', '다녀갑니다', '반가워요', '방가방가'];
        const isSpamLabel = spamPhrases.some(p => trimmed.replace(/\s/g, '').includes(p.replace(/\s/g, '')));
        const titleKeywords = (post?.title || '').split(/[\s,!?~]+/).filter(w => w.length >= 2);
        const hasRelevance = titleKeywords.length === 0 || titleKeywords.some(kw => trimmed.includes(kw));

        if (trimmed.length < 15 && isSpamLabel && !hasRelevance) {
            alert('게시글 내용과 관련된 댓글을 작성해주세요! (형식적인 인사나 무맥락 댓글은 등록되지 않습니다) ✨');
            return;
        }

        setIsSubmittingComment(true);
        try {
            // 서버 API 통해 등록 (RLS 우회)
            const res = await fetch('/api/community/comment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    post_id: postId,
                    author_id: (user?.id && !user.id.startsWith('mock_')) ? user.id : null,
                    author: user?.nickname || '익명',
                    content: commentText.trim(),
                }),
            });

            const result = await res.json();
            if (!res.ok || !result.success) throw new Error(result.error || '서버 오류');

            // 즉시 UI 갱신
            setComments(prev => [...prev, result.data as Comment]);
            setCommentText('');

            // [Gamification] 포인트 지급 (+5P)
            if (user?.id && !user.id.startsWith('mock_')) {
                updatePoints(user.id, 'COMMUNITY_COMMENT').catch(e =>
                    console.error('Comment point award failed:', e)
                );
            }
        } catch (err: any) {
            console.error('Comment submit error:', err);
            alert(`댓글 등록 실패: ${err.message}`);
        } finally {
            setIsSubmittingComment(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-pulse font-black text-[#f82b60]">게시글을 불러오는 중...</div>
            </div>
        );
    }

    if (!post) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-4">
                <p className="text-gray-500 font-bold mb-4">존재하지 않는 게시글이거나 비밀글입니다.</p>
                <button onClick={() => router.back()} className="text-[#f82b60] font-bold underline">뒤로 가기</button>
            </div>
        );
    }

    return (
        <div className="min-h-0 bg-white pb-20 font-sans relative">
            {/* Header */}
            <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md">
                <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <button onClick={() => router.back()} className="p-2 -ml-2 text-gray-800 hover:bg-gray-100 rounded-full transition-colors">
                            <ArrowLeft size={24} />
                        </button>
                        <span className="font-black text-lg text-gray-900 truncate max-w-[150px]">{post.category}</span>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => router.push('/')} className="p-2 text-gray-500 hover:text-gray-900">
                            <Home size={22} />
                        </button>
                        <button className="p-2 text-gray-500 hover:text-gray-900">
                            <Share2 size={22} />
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-4xl mx-auto pt-6 px-4">
                {/* Post Content */}
                <article className="py-6 border-b border-gray-100 relative">
                    {/* Secret Badge */}
                    {post.is_secret && (
                        <div className="absolute top-0 right-0 bg-gray-100 text-gray-500 text-[10px] px-2 py-1 rounded-full flex items-center gap-1">
                            <Lock size={10} /> 비밀글
                        </div>
                    )}

                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center text-[#f82b60] ring-2 ring-rose-50">
                                <User size={24} />
                            </div>
                            <div>
                                <div className="flex items-center gap-1.5">
                                    <span className="font-black text-gray-900">{post.author_nickname || post.author}</span>
                                    {post.likes > 20 && (
                                        <span className="bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded text-[10px] font-bold flex items-center gap-0.5">
                                            <ShieldCheck size={10} /> BEST
                                        </span>
                                    )}
                                </div>
                                <span className="text-xs text-gray-400 font-medium">{post.created_at?.substring(0, 10) || post.time} · 조회 {post.views || 0}</span>
                            </div>
                        </div>

                        {/* Action Menu Trigger */}
                        <div className="relative">
                            <button
                                onClick={() => setShowActionMenu(!showActionMenu)}
                                className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-50"
                            >
                                <MoreVertical size={20} />
                            </button>

                            {/* Dropdown Menu */}
                            {showActionMenu && (
                                <div className="absolute right-0 top-full mt-2 w-32 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-200">
                                    <button
                                        onClick={() => {
                                            setShowActionMenu(false);
                                            if (userType === 'admin') {
                                                // 관리자: 비밀번호 없이 수정 페이지로 이동
                                                router.push(`/community/write?mode=edit&id=${postId}`);
                                            } else {
                                                setActionType('edit');
                                            }
                                        }}
                                        className="w-full text-left px-4 py-3 text-sm font-bold text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                    >
                                        <Edit size={14} /> 수정하기
                                    </button>
                                    <button
                                        onClick={async () => {
                                            setShowActionMenu(false);
                                            if (userType === 'admin') {
                                                if (confirm('관리자 권한으로 이 글을 완전히 삭제하시겠습니까?')) {
                                                    try {
                                                        const res = await fetch(`/api/community/post?id=${postId}`, { method: 'DELETE' });
                                                        if (!res.ok) throw new Error('API 삭제 실패');
                                                        alert('관리자 권한으로 완벽히 삭제되었습니다.');
                                                        router.push('/community');
                                                    } catch (e: any) {
                                                        alert('삭제 중 오류: ' + e.message);
                                                    }
                                                }
                                            } else {
                                                setActionType('delete');
                                            }
                                        }}
                                        className="w-full text-left px-4 py-3 text-sm font-bold text-red-500 hover:bg-red-50 flex items-center gap-2"
                                    >
                                        <Trash2 size={14} /> 삭제하기
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    <h2 className="text-2xl font-black text-gray-900 mb-6 leading-tight">
                        {post.isHot && <span className="text-red-500 mr-2">🔥</span>}
                        {post.title}
                    </h2>

                    <div className="text-gray-700 leading-loose text-lg mb-10 whitespace-pre-wrap break-words">
                        {post.content}
                    </div>

                    {/* [NEW] Buttons row */}
                    <div className="flex flex-col gap-4 mt-12 pb-8 border-b border-gray-100">
                        <button
                            onClick={() => router.push('/community')}
                            className="w-full py-4 border-2 border-[#f82b60] text-[#f82b60] rounded-2xl font-black hover:bg-rose-50 transition-all flex items-center justify-center gap-2"
                        >
                            목록으로 돌아가기
                        </button>
                    </div>

                    <div className="flex items-center gap-6 py-4 px-6 bg-gray-50 rounded-3xl w-fit">
                        <button className="flex items-center gap-2 text-[#f82b60] font-black hover:scale-110 transition-transform">
                            <Heart size={20} className={post.likes > 10 ? 'fill-pink-500' : ''} />
                            {post.likes || 0}
                        </button>
                        <button className="flex items-center gap-2 text-[#f82b60] font-black">
                            <MessageSquare size={20} />
                            {post.comments || comments.length}
                        </button>
                    </div>
                </article>

                {/* Comments Section */}
                <section className="py-8">
                    <h4 className="font-black text-gray-900 mb-6 flex items-center gap-2">
                        댓글 <span className="text-[#f82b60]">{comments.length}</span>
                    </h4>

                    {comments.length > 0 ? (
                        <div className="space-y-6">
                            {comments.map((comment) => (
                                <div key={comment.id} className="flex gap-4 group">
                                    <div className="flex-shrink-0 w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center text-gray-400">
                                        <User size={18} />
                                    </div>
                                    <div className="flex-1 space-y-1 bg-gray-50/50 p-4 rounded-2xl group-hover:bg-gray-50 transition-colors">
                                        <div className="flex items-center justify-between">
                                            <span className="font-black text-sm text-gray-800">{comment.author}</span>
                                            <span className="text-[10px] text-gray-400">{comment.created_at || comment.time}</span>
                                        </div>
                                        <p className="text-sm text-gray-600 leading-relaxed font-medium">{comment.content}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-10 bg-gray-50 rounded-3xl">
                            <p className="text-gray-400 text-sm font-bold">첫 번째 댓글을 남겨보세요! 💬</p>
                        </div>
                    )}
                </section>
            </main>

            {/* Comment Input Sticky */}
            <div className="fixed bottom-0 w-full bg-white border-t p-3 max-w-4xl mx-auto left-0 right-0 z-40">
                <div className="flex gap-3 items-center">
                    <input
                        type="text"
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleCommentSubmit(); } }}
                        placeholder={isLoggedIn ? "따뜻한 댓글을 남겨주세요." : "로그인 후 댓글을 작성할 수 있습니다."}
                        disabled={!isLoggedIn || isSubmittingComment}
                        className="flex-1 bg-gray-100 border-none rounded-2xl px-5 py-3.5 text-sm font-bold focus:ring-2 focus:ring-[#f82b60] outline-none transition-shadow disabled:opacity-60"
                    />
                    <button
                        onClick={handleCommentSubmit}
                        disabled={!isLoggedIn || !commentText.trim() || isSubmittingComment}
                        className="bg-rose-50 text-[#f82b60] font-black px-6 py-3.5 rounded-2xl hover:bg-[#f82b60] hover:text-white transition-all shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        {isSubmittingComment ? '...' : '등록'}
                    </button>
                </div>
            </div>


            {/* UI_Z_INDEX.MODAL (20000) 표준 적용 */}
            {actionType && createPortal(
                <div className="fixed inset-0 z-[20000] flex items-center justify-center px-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setActionType(null)}></div>
                    <div className="bg-white rounded-[32px] p-8 w-full max-w-sm relative z-10 shadow-2xl animate-in zoom-in-95">
                        <h3 className="text-xl font-black mb-2 text-gray-900">
                            {actionType === 'delete' ? '게시글 삭제' : '게시글 수정'}
                        </h3>
                        <p className="text-sm text-gray-500 mb-6">
                            게시글 작성 시 설정한 비밀번호를 입력해주세요.
                        </p>

                        <div className="relative mb-6">
                            <input
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="비밀번호 입력"
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#f82b60] transition-colors"
                            />
                            <button
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-3 text-gray-400"
                            >
                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setActionType(null)}
                                className="flex-1 py-3 text-gray-500 font-bold hover:bg-gray-50 rounded-xl transition-colors"
                            >
                                취소
                            </button>
                            <button
                                onClick={handlePasswordAction}
                                disabled={isActionLoading}
                                className={`flex-1 py-3 text-white font-bold rounded-xl transition-colors shadow-lg ${actionType === 'delete' ? 'bg-red-500 hover:bg-red-600 shadow-red-200' : 'bg-[#f82b60] hover:bg-[#db2456] shadow-rose-200'}`}
                            >
                                {isActionLoading ? '확인 중...' : '확인'}
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}
