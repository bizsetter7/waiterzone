'use client';

import React from 'react';
import Link from 'next/link';
import { Briefcase, MapPin, User, Moon, Users, Siren, Scale, Megaphone, Gift, Home, Sparkles, MessageCircle, Headphones, Crown, Search, Coffee } from 'lucide-react';
import { useBrand } from '@/components/BrandProvider';

export const QuickMenu = React.memo(() => {
    const brand = useBrand();

    // 퀵메뉴 순서 및 라벨 (최종 테마 반영)
    const MENU_ITEMS = [
        { icon: Briefcase, label: '업종별채용', bg: 'bg-indigo-50', color: 'text-indigo-600', link: '/jobs' },
        { icon: MapPin, label: '지역별채용', bg: 'bg-blue-50', color: 'text-blue-600', link: '/region' },
        { icon: Search, label: '인재정보', bg: 'bg-teal-50', color: 'text-teal-600', link: '/talent' },
        {
            icon: Crown,
            label: '프리미엄\n라운지',
            bg: 'bg-purple-50',
            color: 'text-purple-600',
            link: '/community?category=프리미엄 라운지'
        },
        {
            icon: Users,
            label: '같이일할단짝',
            bg: 'bg-blue-50',
            color: 'text-blue-600',
            link: '/community?category=같이일할단짝'
        },
        {
            icon: Sparkles,
            label: '그녀들의\n수다',
            bg: 'bg-blue-50',
            color: 'text-blue-600',
            link: '/community'
        },
        {
            icon: Scale,
            label: '무료\n법률상담',
            bg: 'bg-slate-50',
            color: 'text-slate-600',
            link: '/community?category=무료법률상담'
        },
        { icon: Megaphone, label: '광고문의', bg: 'bg-orange-50', color: 'text-orange-600', link: '/customer-center?tab=ad' },
    ];

    return (
        <div className="w-full relative z-20 -mt-8 md:-mt-12 px-4 max-w-[1020px] mx-auto">
            {/* Perfectly Square Individual Cards - Matched with Capture 2 */}
            <div className="grid grid-cols-4 md:grid-cols-8 gap-2 md:gap-3 justify-items-center">
                {MENU_ITEMS.map((item, i) => (
                    <Link
                        key={i}
                        href={item.link}
                        prefetch={true}
                        className="w-full aspect-square flex flex-col items-center justify-center group cursor-pointer bg-white border border-slate-100 rounded-[14px] md:rounded-[21px] shadow-[0_4px_12px_rgba(0,0,0,0.03)] hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300"
                    >
                        <div className={`w-9 h-9 md:w-13 md:h-13 rounded-[18px] md:rounded-[24px] mb-1 md:mb-2 flex items-center justify-center ${item.bg} ${item.color} shadow-sm group-hover:scale-105 transition-transform duration-300`}>
                            <item.icon size={16} className="md:w-6 md:h-6" />
                        </div>
                        <span className="text-[9px] md:text-[12px] font-black text-center leading-[1.35] text-slate-800 tracking-tighter opacity-90 group-hover:opacity-100 transition-all">
                            {item.label.split('\n').map((line, idx) => (
                                <React.Fragment key={idx}>
                                    {line}
                                    {idx < item.label.split('\n').length - 1 && <br />}
                                </React.Fragment>
                            ))}
                        </span>
                    </Link>
                ))}
            </div>
        </div>
    );
});

QuickMenu.displayName = 'QuickMenu';
