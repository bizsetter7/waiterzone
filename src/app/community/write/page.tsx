'use client';

import React, { useState, useEffect } from 'react';
import {
    ArrowLeft,
    Image as ImageIcon,
    X,
    Home,
    Sparkles,
    Lock,
    Eye,
    EyeOff
} from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { usePreventLeave } from '@/hooks/usePreventLeave';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { updatePoints } from '@/lib/points';

import { CATEGORIES as COMMUNITY_CATEGORIES } from '@/constants/community';

// '전체' 탭을 제외한 실제 작성 가능한 카테고리만 필터링
const CATEGORIES = COMMUNITY_CATEGORIES
    .filter(cat => cat.id !== 'all')
    .map(cat => cat.name);

export default function WritePostPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const isEditMode = searchParams.get('mode') === 'edit';
    const editPostId = searchParams.get('id');

    const [category, setCategory] = useState('');
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [images, setImages] = useState<string[]>([]);

    // edit 모드: 기존 글 데이터 로드
    useEffect(() => {
        if (!isEditMode || !editPostId) return;
        const fetchPost = async () => {
            const { data } = await supabase
                .from('community_posts')
                .select('*')
                .eq('id', editPostId)
                .single();
            if (data) {
                setCategory(data.category || '');
                setTitle(data.title || '');
                setContent(data.content || '');
            }
        };
        fetchPost();
    }, [isEditMode, editPostId]);

    // [Security] Password & Secret
    const [password, setPassword] = useState('');
    const [isSecret, setIsSecret] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const { user, isLoggedIn } = useAuth();
    const [isSubmitting, setIsSubmitting] = useState(false);
    // usePreventLeave 우회용 — 등록 성공 직후 true로 설정
    const isSubmittedRef = React.useRef(false);

    usePreventLeave(!isSubmittedRef.current && (title.trim() !== '' || content.trim() !== ''));

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            if (images.length >= 3) return alert('이미지는 최대 3장까지 등록 가능합니다.');
            // Mock upload: create local URL
            const url = URL.createObjectURL(e.target.files[0]);
            setImages([...images, url]);
        }
    };

    const removeImage = (index: number) => {
        setImages(images.filter((_, i) => i !== index));
    };

    const handleEditSubmit = async () => {
        if (!title.trim() || !content.trim()) return alert('제목과 내용을 입력해주세요.');
        setIsSubmitting(true);
        try {
            const res = await fetch(`/api/community/post`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: editPostId, title, content, category }),
            });
            const result = await res.json();
            if (!res.ok || !result.success) throw new Error(result.error || '서버 오류');
            isSubmittedRef.current = true;
            alert('게시글이 수정되었습니다.');
            router.push(`/community/${editPostId}`);
        } catch (err: any) {
            alert(`수정 실패: ${err.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSubmit = async () => {
        // [Policy] Community allows Anonymous writes too, but strictly requires password.
        // if (!isLoggedIn) return alert('로그인이 필요한 서비스입니다.'); -> Removed as per request (or kept if desired? User said "Non-members can write with password")
        // User said: "Community posts need password...". Implicitly supports anonymous if we use password for auth. 
        // But the previous code had !isLoggedIn check. I will KEEP it for now unless user explicitly asked for Anon Post creation. 
        // User request: "Community posts... need password when saving". 
        // Let's assume Logged In users also need password for individual post security? Or Anon?
        // User said "Community... need password... when saving". 
        // I'll Relax the login requirement to allow ANONYMOUS posting if password is provided, OR keep login but require password for edit.
        // Given "1:1 Inquiry" context, usually members write. But "Community" might be open.
        // Let's stick to "Login Required" for now to avoid spam, but ADD password as mandatory field.

        if (!category) return alert('카테고리를 선택해주세요.');
        if (!title.trim() || !content.trim()) return alert('제목과 내용을 입력해주세요.');
        // [New Policy] 모든 사용자(개인회원 포함) 수정/삭제를 위해 비밀번호 필수 입력 
        if (!password.trim() || password.length < 4) return alert('추후 수정 및 삭제를 위해 비밀번호를 4자리 이상 입력해주세요.');

        setIsSubmitting(true);

        // ─── 자동 SEO 키워드 생성 (유저에게 보이지 않음) ───────────
        const BASE_SEO = ['웨이터존', '웨이터알바', '남성알바', '야간알바', '고소득알바'];
        const CATEGORY_SEO: Record<string, string[]> = {
            '웨이터 소통방': ['웨이터정보', '소통방', '알바후기', '남성알바커뮤니티'],
            '웨이터 썰': ['웨이터썰', '알바썰', '직장썰', '공감썰'],
            '웨이터 팁': ['웨이터팁', '알바꿀팁', '수입올리기', '노하우'],
            '지역방': ['지역정보', '업소정보', '지역알바'],
            '프리미엄 라운지': ['프리미엄정보', '재테크', '꿀팁', '성공노하우'],
            '중고거래': ['중고거래', '직거래', '알바용품'],
            '무료법률상담': ['법률상담', '근로계약', '노동법'],
        };
        const titleKeywords = title.split(/[\s,!?~]+/).filter(w => w.length >= 2).slice(0, 6);
        const seoKeywords = [...new Set([...BASE_SEO, ...(CATEGORY_SEO[category] || []), ...titleKeywords])].join(', ');
        // ─────────────────────────────────────────────────────────────

        try {
            // 서버 API 통해 등록 (RLS 우회)
            const res = await fetch('/api/community/post', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    // 대표님 지시사항: 예외조건 없이 무조건 로그인한 회원의 고유 ID를 백엔드에 꽂아넣음
                    author_id: (isLoggedIn && user?.id) ? user.id : null,
                    author_name: isLoggedIn ? (user.nickname || '익명') : '익명',
                    author_nickname: isLoggedIn ? (user.nickname || '익명') : '익명',
                    category,
                    title,
                    content,
                    images,
                    password,
                    is_secret: isSecret,
                    seo_keywords: seoKeywords,
                }),
            });

            const result = await res.json();
            if (!res.ok || !result.success) {
                throw new Error(result.error || '서버 오류');
            }

            // ✅ 성공 — usePreventLeave 즉시 해제 후 이동
            isSubmittedRef.current = true;
            setTitle('');
            setContent('');

            // [Gamification] 포인트 지급
            if (isLoggedIn && user?.id && !user.id.startsWith('mock_')) {
                try {
                    await updatePoints(user.id as string, 'COMMUNITY_POST');
                    alert('게시글이 등록되었습니다! +20P 적립되었습니다. ✨');
                } catch (pErr) {
                    console.error('Point award failed:', pErr);
                    alert('게시글이 등록되었습니다!');
                }
            } else {
                alert('게시글이 등록되었습니다!');
            }

            router.push(`/community?t=${Date.now()}`);
        } catch (err: any) {
            console.error(err);
            alert(`등록 실패: ${err.message || '알 수 없는 오류'}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-0 bg-white">
            {/* Header */}
            <header className="sticky top-0 bg-white/80 backdrop-blur-md border-b z-10 flex items-center justify-between px-4 h-14">
                <button onClick={() => router.back()} className="p-2 -ml-2 text-gray-600">
                    <ArrowLeft size={24} />
                </button>
                <h1 className="text-lg font-black text-gray-900">{isEditMode ? '글 수정' : '글쓰기'}</h1>
                <div className="flex items-center gap-2">
                    <button onClick={() => router.push('/')} className="p-2 text-gray-400 hover:text-gray-900 transition-colors">
                        <Home size={22} />
                    </button>
                </div>
            </header>

            {/* Form */}
            <main className="max-w-4xl mx-auto pb-32">
                {/* 1. Category Section */}
                <section className="p-6 border-b border-gray-100 bg-white">
                    <label className="block text-[11px] font-black text-[#1e3a5f] uppercase tracking-widest mb-4">카테고리 선택</label>

                    {/* Desktop: Buttons */}
                    <div className="hidden md:flex flex-wrap gap-2">
                        {CATEGORIES.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setCategory(cat)}
                                className={`px-4 py-2.5 rounded-2xl text-[13px] font-black border transition-all ${category === cat
                                    ? 'border-[#1e3a5f] bg-[#1e3a5f] text-white shadow-lg shadow-sm'
                                    : 'border-gray-100 text-gray-500 bg-gray-50 hover:bg-gray-100'
                                    }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>

                    {/* Mobile: Dropdown */}
                    <div className="md:hidden">
                        <select
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className={`w-full border-2 rounded-2xl px-5 py-4 text-sm font-black outline-none transition-all appearance-none cursor-pointer ${category === '' ? 'border-[#1e3a5f] text-[#1e3a5f] bg-blue-50' : 'bg-gray-50 border-gray-100 focus:border-[#1e3a5f]'}`}
                        >
                            <option value="" disabled>카테고리를 선택해주세요</option>
                            {CATEGORIES.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </div>
                </section>

                {/* 2. Security Section - Darker Background */}
                <section className="p-6 border-b border-gray-200 bg-gray-100/80">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <label className="relative flex items-center gap-3 cursor-pointer group">
                                <input
                                    type="checkbox"
                                    className="peer hidden"
                                    checked={isSecret}
                                    onChange={(e) => setIsSecret(e.target.checked)}
                                />
                                <div className="w-6 h-6 rounded-lg border-2 border-gray-300 flex items-center justify-center transition-all peer-checked:bg-[#1e3a5f] peer-checked:border-[#1e3a5f] group-hover:border-[#1e3a5f] bg-white">
                                    {isSecret && <Sparkles size={14} className="text-white" />}
                                </div>
                                <span className="text-sm font-black text-gray-800">비밀글로 등록</span>
                            </label>
                            <span className="text-[10px] text-gray-400 font-bold">관리자와 작성자만 확인 가능</span>
                        </div>

                        <div className={`flex items-center gap-3 transition-opacity duration-300 opacity-100`}>
                            <div className="relative flex-1 sm:w-48">
                                <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="비밀번호 (4자리 이상)"
                                    className="w-full bg-white border border-gray-200 rounded-2xl pl-11 pr-12 py-3 text-sm font-black outline-none focus:border-[#1e3a5f] transition-all shadow-sm placeholder-gray-400"
                                    maxLength={20}
                                />
                                <button
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>
                    </div>
                </section>

                {/* 3. Content Section - Darker Background for Title/Content Area */}
                <section className="p-4 md:p-6 space-y-4 md:space-y-6 bg-gray-100/50">
                    <div className="bg-white p-3 md:p-4 rounded-[22px] md:rounded-[28px] border border-gray-200 shadow-sm">
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="제목을 입력하세요"
                            className="w-full text-sm md:text-lg font-black placeholder-gray-400 border-none outline-none p-1 focus:ring-0 text-gray-900 bg-transparent"
                        />
                    </div>

                    <div className="min-h-[300px] bg-white p-5 md:p-6 rounded-[30px] md:rounded-[35px] border border-gray-200 shadow-sm">
                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder={"자유롭게 이야기를 나누어보세요.\n(욕설, 비방 금지)"}
                            className="w-full h-[400px] text-[15px] md:text-[16px] text-gray-700 placeholder-gray-400 border-none outline-none resize-none p-0 focus:ring-0 leading-relaxed font-medium bg-transparent"
                        />
                    </div>
                </section>

                {/* 4. Media Section */}
                <section className="px-6 py-5 bg-gray-50/50">
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">사진 첨부 (최대 3장)</label>
                    <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                        <label className="w-24 h-24 bg-white border-2 border-dashed border-gray-200 rounded-[28px] flex flex-col items-center justify-center text-gray-400 cursor-pointer shrink-0 hover:border-blue-200 hover:text-[#1e3a5f] transition-all active:scale-95 shadow-sm">
                            <ImageIcon size={28} className="mb-1" />
                            <span className="text-[11px] font-black">{images.length}/3</span>
                            <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                        </label>

                        {images.map((img, idx) => (
                            <div key={idx} className="w-24 h-24 rounded-[28px] border border-gray-100 overflow-hidden relative shrink-0 shadow-md group">
                                <Image
                                    src={img}
                                    alt="preview"
                                    width={96}
                                    height={96}
                                    className="w-full h-full object-cover transition-transform group-hover:scale-110"
                                    unoptimized
                                />
                                <button
                                    onClick={() => removeImage(idx)}
                                    className="absolute top-2 right-2 w-7 h-7 bg-black/60 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-red-500 transition-colors shadow-lg"
                                >
                                    <X size={14} strokeWidth={3} />
                                </button>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Guidelines */}
                <section className="p-6 text-[11px] text-gray-400 leading-relaxed font-bold border-t border-gray-50 mt-4">
                    <div className="flex flex-col gap-1 max-w-full overflow-hidden">
                        <p className="whitespace-nowrap overflow-hidden text-ellipsis">• 부적절한 게시글은 관리자에 의해 제재를 받을 수 있습니다.</p>
                        <p className="whitespace-nowrap overflow-hidden text-ellipsis">• 타인의 권리를 침해하거나 명예를 훼손하는 내용은 금지됩니다.</p>
                        <p className="text-[#1e3a5f] whitespace-nowrap md:whitespace-normal">
                            • 설정하신 비밀번호는 글 수정 및 삭제 시 본인확인을 위해 꼭 필요합니다.
                        </p>
                    </div>
                </section>
            </main>

            {/* Bottom Actions */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-xl border-t z-20">
                <div className="max-w-4xl mx-auto flex gap-3">
                    <button
                        onClick={() => router.back()}
                        className="flex-1 py-4 bg-gray-100 text-gray-600 rounded-2xl font-black text-sm hover:bg-gray-200 transition-all active:scale-95"
                    >
                        취소
                    </button>
                    <button
                        onClick={isEditMode ? handleEditSubmit : handleSubmit}
                        className="flex-[2] py-4 bg-[#1e3a5f] text-white rounded-2xl font-black text-base shadow-xl shadow-blue-200 hover:bg-[#162d4a] transition-all active:scale-[0.98] disabled:opacity-50 disabled:shadow-none"
                        disabled={isSubmitting || !title.trim() || !content.trim() || (!isEditMode && (isSecret || !isLoggedIn) && !password.trim())}
                    >
                        {isSubmitting ? '처리 중...' : isEditMode ? '수정 완료' : '게시글 등록하기'}
                    </button>
                </div>
            </div>
        </div>
    );
}
