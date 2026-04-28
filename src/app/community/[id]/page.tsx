import { MOCK_POSTS } from '@/constants/community';
import { supabase } from '@/lib/supabase';
import CommunityDetailClient from './CommunityDetailClient';

// ─── 자동 SEO 키워드 추출 함수 ────────────────────────────────
// 제목+내용에서 의미있는 단어를 추출하고, 웨이터존 관련 고정 키워드와 합칩니다.
function extractSeoKeywords(title: string, content: string, category: string): string {
    const BASE_KEYWORDS = [
        '웨이터존', '웨이터알바', '남성알바', '야간알바', '룸웨이터', '고소득알바',
        '웨이터커뮤니티', '소통방', '웨이터썰', '알바꿀팁'
    ];

    const CATEGORY_KEYWORDS: Record<string, string[]> = {
        '웨이터 소통방': ['웨이터정보', '소통방', '알바후기', '남성알바커뮤니티'],
        '웨이터 썰': ['웨이터썰', '알바썰', '직장썰', '공감썰'],
        '웨이터 팁': ['웨이터팁', '알바꿀팁', '수입올리기', '노하우'],
        '지역방': ['지역정보', '업소정보', '지역알바'],
        '프리미엄 라운지': ['프리미엄정보', '재테크', '성공노하우', '재무관리', '알바정보'],
        '중고거래': ['중고거래', '직거래', '알바용품'],
        '무료법률상담': ['법률상담', '근로계약', '노동법'],
    };

    // 제목에서 주요 단어 추출 (2글자 이상)
    const titleWords = title.split(/[\s,\.!?ㅠㅋ~]+/)
        .filter(w => w.length >= 2 && !/^[a-zA-Z0-9]+$/.test(w))
        .slice(0, 5);

    const categoryKws = CATEGORY_KEYWORDS[category] || [];
    const allKeywords = [...new Set([...BASE_KEYWORDS, ...categoryKws, ...titleWords])];

    return allKeywords.join(', ');
}

// ─── 메타데이터 생성 ──────────────────────────────────────────
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const postId = parseInt(id);

    // 1. DB에서 먼저 찾기 (실제 유저 글 우선)
    let post: { title: string; content: string; category: string; author?: string } | null = null;
    
    try {
        const { data } = await supabase
            .from('community_posts')
            .select('title, content, category')
            .eq('id', postId)
            .single();
        if (data) post = data;
    } catch { /* DB 오류 무시 */ }

    // 2. DB에 없으면 Mock에서 찾기 (안전장치)
    if (!post) {
        post = MOCK_POSTS.find(p => p.id === postId) || null;
    }

    if (!post) return { title: '게시글을 찾을 수 없습니다 - 웨이터존' };

    const title = `${post.title} - 커뮤니티 | 웨이터존`;
    const description = `${post.content.slice(0, 120)}... 웨이터존 커뮤니티에서 더 많은 이야기를 확인하세요.`;

    // 자동 키워드 추출 (보이지 않지만 구글 크롤러가 읽음)
    const keywords = extractSeoKeywords(post.title, post.content, post.category);

    return {
        title,
        description,
        keywords, // ← 자동 생성된 SEO 키워드
        openGraph: {
            title,
            description,
            url: `https://waiterzone.kr/community/${id}`,
            siteName: '웨이터존',
            type: 'article',
        },
        twitter: {
            card: 'summary',
            title,
            description,
        },
    };
}

// ─── 정적 경로 사전 생성 (Mock 포함) ─────────────────────────
export async function generateStaticParams() {
    // Mock 게시글 경로 (안전장치: 항상 포함)
    const mockParams = MOCK_POSTS.map((post) => ({
        id: post.id.toString(),
    }));

    // DB 게시글 경로 추가
    try {
        const { data: dbPosts } = await supabase
            .from('community_posts')
            .select('id')
            .eq('is_secret', false)
            .limit(200);

        const mockIds = new Set(MOCK_POSTS.map(p => p.id.toString()));
        const dbParams = (dbPosts || [])
            .filter(p => !mockIds.has(p.id.toString()))
            .map(p => ({ id: p.id.toString() }));

        return [...mockParams, ...dbParams];
    } catch {
        return mockParams; // DB 오류 시 Mock만 반환 (안전장치)
    }
}

export default async function CommunityDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    return <CommunityDetailClient id={id} />;
}
