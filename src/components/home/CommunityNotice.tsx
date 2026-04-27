import React from 'react';
import { useRouter } from 'next/navigation';
import { MessageCircle, Bell } from 'lucide-react';
import { useBrand } from '../BrandProvider';
import { MOCK_POSTS } from '@/constants/community';
import { NOTICES } from '@/constants/notices';

export const CommunityNotice = () => {
    const brand = useBrand();
    const router = useRouter();
    const isDark = brand.theme === 'dark';

    // Top 3 posts for preview
    const recentPosts = MOCK_POSTS.slice(0, 3);

    // [New] Category to Icon Mapper
    const getCategoryIcon = (category: string) => {
        if (category.includes('수다') || category.includes('썰')) return '🗣️';
        if (category.includes('밤 문화')) return '🌙';
        if (category.includes('뷰티')) return '💄';
        if (category.includes('라운지')) return '💎';
        if (category.includes('단짝')) return '👯‍♀️';
        if (category.includes('중고')) return '📦';
        if (category.includes('법률')) return '⚖️';
        if (category.includes('수입')) return '💰';
        return '✨';
    };

    // Style tokens
    const communityContainerStyle = `flex-1 rounded-2xl p-3 md:p-5 border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-rose-50/50 border-rose-100'} shadow-sm relative overflow-hidden cursor-pointer hover:shadow-md transition-shadow active:scale-[0.99]`;
    const noticeContainerStyle = `flex-1 rounded-2xl p-3 md:p-5 border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-rose-50/50 border-rose-100'} shadow-sm relative overflow-hidden cursor-pointer hover:shadow-md transition-shadow active:scale-[0.99]`;

    const headerStyle = "flex flex-col xl:flex-row items-start xl:items-center justify-between mb-3 md:mb-4 gap-1";
    const titleStyle = `text-base md:text-lg font-black flex items-center gap-2 whitespace-nowrap ${isDark ? 'text-white' : 'text-gray-900'}`;
    const listStyle = "flex flex-col gap-2 md:gap-3";
    const itemStyle = `text-[13px] md:text-sm font-medium truncate ${isDark ? 'text-gray-400' : 'text-gray-700'}`;
    const iconBoxStyle = (color: string) => `w-5 h-5 md:w-6 md:h-6 rounded flex items-center justify-center shrink-0 ${isDark ? 'bg-gray-700' : 'bg-white'} ${color}`;

    return (
        <div className="grid grid-cols-2 gap-3 md:gap-6 mb-8 md:mb-12">
            {/* Community Section */}
            <div className={communityContainerStyle} onClick={() => router.push('/community')}>
                <div className={headerStyle}>
                    <h3 className={titleStyle}>
                        <MessageCircle className="text-[#f82b60] shrink-0" fill="currentColor" size={18} />
                        커뮤니티
                    </h3>
                    <span className="text-[10px] md:text-xs text-gray-400 cursor-pointer hover:text-gray-600 ml-0.5">자유게시판</span>
                </div>
                <div className={listStyle}>
                    {recentPosts.map((post) => (
                        <div key={post.id} className="flex items-center gap-2 md:gap-3 group">
                            <span className={iconBoxStyle('text-[#f82b60]')}>{getCategoryIcon(post.category)}</span>
                            <span className={`${itemStyle} group-hover:text-[#f82b60] transition-colors`}>{post.title}</span>
                        </div>
                    ))}
                </div>
                <div className="absolute -top-10 -right-10 w-24 h-24 md:w-32 md:h-32 bg-rose-500/10 rounded-full blur-2xl pointer-events-none"></div>
            </div>

            {/* Notice Section */}
            <div className={noticeContainerStyle} onClick={() => router.push('/customer-center?tab=notice')}>
                <div className={headerStyle}>
                    <h3 className={titleStyle}>
                        <Bell className="text-[#f82b60] shrink-0" fill="currentColor" size={18} />
                        공지사항
                    </h3>
                    <span className="text-[10px] md:text-xs text-gray-400 cursor-pointer hover:text-gray-600 ml-0.5">업데이트</span>
                </div>
                <div className={listStyle}>
                    {NOTICES.slice(0, 3).map((item) => (
                        <div
                            key={item.id}
                            className="flex items-center gap-2 md:gap-3 group cursor-pointer"
                            onClick={(e) => {
                                e.stopPropagation();
                                router.push(item.link || '/customer-center?tab=notice');
                            }}
                        >
                            <span className={iconBoxStyle('text-[#f82b60]')}>
                                {item.badge === '중요' ? '🚨' : '📢'}
                            </span>
                            <span className={`${itemStyle} group-hover:underline ${item.badge === '중요' ? 'font-bold text-red-500' : ''}`}>
                                {item.title}
                            </span>
                        </div>
                    ))}
                </div>
                <div className="absolute -top-10 -right-10 w-24 h-24 md:w-32 md:h-32 bg-rose-500/10 rounded-full blur-2xl pointer-events-none"></div>
            </div>
        </div>
    );
};
