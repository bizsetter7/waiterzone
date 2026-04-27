export interface Post {
    id: number;
    title: string;
    content: string;
    author: string;
    category: string;
    time: string;
    likes: number;
    comments: number;
    isHot?: boolean;
    created_at?: string;
    views?: number;
    // [Added for Security & User Info]
    author_id?: string;
    author_nickname?: string;
    is_secret?: boolean;
    password?: string;
}

export interface Comment {
    id: number;
    post_id?: number; // DB style
    postId?: number;  // Mock style fallback
    author: string;
    content: string;
    time: string;
    created_at?: string;
}
