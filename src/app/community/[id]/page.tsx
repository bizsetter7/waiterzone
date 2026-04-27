import { MOCK_POSTS } from '@/constants/community';
import { supabase } from '@/lib/supabase';
import CommunityDetailClient from './CommunityDetailClient';

// ─── 자동 SEO 키워드 추출 함수 ────────────────────────────────
// 제목+내용에서 의미있는 단어를 추출하고, 웨이터존 관련 고정 키워드와 합칩니다.
function extractSeoKeywords(title: string, content: string, category: string): string {
    const BASE_KEYWORDS = [
        '웨이터존', '코코판', '남성알바', '야간알바', '룸웨이터', '형님들수다',
        '연애고민', '형님들커뮤니티', '썰', '공감', '연애썰', '직장인고민'
    ];

    const CATEGORY_KEYWORDS: Record<string, string[]> = {
        '형님들의 수다(썰)': ['연애썰', '연애고민', '남친고민', '고민공감', '공감썰', '연애이야기'],
        '프리미엄 라운지': ['프리미엄정보', '재테크', '성공노하우', '재무관리', '알바정보'],
        '밤 문화 Talk': ['남성알바', '프리미엄정보', '밤문화', '알바후기'],
        '뷰티·패션·이벤트': ['뷰티꿀팁', '패션', '화장품후기', '뷰티정보'],
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
