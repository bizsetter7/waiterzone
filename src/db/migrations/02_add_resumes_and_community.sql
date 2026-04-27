-- 1. 이력서 테이블 생성
CREATE TABLE IF NOT EXISTS public.resumes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    gender TEXT,
    birth_date DATE,
    industry_main TEXT,
    industry_sub TEXT,
    region_main TEXT,
    region_sub TEXT,
    pay_type TEXT,
    pay_amount NUMERIC DEFAULT 0,
    contact_method TEXT,
    contact_value TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. 커뮤니티 게시글 테이블 생성
CREATE TABLE IF NOT EXISTS public.community_posts (
    id BIGSERIAL PRIMARY KEY,
    author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    author_name TEXT,
    author_nickname TEXT,
    category TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    images TEXT[] DEFAULT '{}',
    likes INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    is_notice BOOLEAN DEFAULT false
);

-- 3. RLS 설정 (기본적으로 인증된 사용자만 CRUD 가능하도록 설정 추천)
ALTER TABLE public.resumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;

-- 정책 예시 (모두에게 조회 허용, 작성자만 수정/삭제)
CREATE POLICY "Public resumes are viewable by everyone" ON public.resumes FOR SELECT USING (true);
CREATE POLICY "Users can insert their own resumes" ON public.resumes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own resumes" ON public.resumes FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Public posts are viewable by everyone" ON public.community_posts FOR SELECT USING (true);
CREATE POLICY "Users can insert their own posts" ON public.community_posts FOR INSERT WITH CHECK (auth.uid() = author_id);
