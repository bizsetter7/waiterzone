'use client';

import React from 'react';
import Link from 'next/link';
import { Home, MessageCircle, AlertCircle } from 'lucide-react';

export default function NotFound() {
    return (
        <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
            {/* Animated Icon Container */}
            <div className="relative mb-8">
                <div className="absolute inset-0 bg-blue-100 rounded-full blur-3xl opacity-50 animate-pulse" />
                <div className="relative bg-white p-8 rounded-[40px] border-2 border-blue-50 shadow-2xl">
                    <AlertCircle size={80} className="text-blue-500" strokeWidth={1.5} />
                </div>
            </div>

            <h1 className="text-6xl md:text-8xl font-black text-gray-900 tracking-tighter mb-4 italic">
                404
            </h1>

            <div className="max-w-md">
                <h2 className="text-xl md:text-2xl font-black text-gray-800 mb-4 tracking-tight">
                    찾으시는 페이지가 존재하지 않거나<br />
                    이동되었을 가능성이 있습니다.
                </h2>
                <p className="text-gray-500 font-bold mb-10 leading-relaxed text-sm md:text-base">
                    궁금하신 사항은 고객지원센터를 통해 문의해 주시면<br />
                    친절하게 안내해 드리겠습니다.
                </p>
            </div>

            <div className="flex flex-col md:flex-row gap-4 w-full max-w-sm">
                <Link
                    href="/"
                    className="flex-1 bg-gray-900 text-white font-black py-5 rounded-[24px] shadow-xl hover:bg-black transition-all hover:scale-[1.02] flex items-center justify-center gap-2"
                >
                    <Home size={20} />
                    홈으로 돌아가기
                </Link>
                <Link
                    href="/customer-center"
                    className="flex-1 bg-white text-gray-900 border-2 border-gray-100 font-black py-5 rounded-[24px] shadow-sm hover:bg-gray-50 transition-all hover:scale-[1.02] flex items-center justify-center gap-2"
                >
                    <MessageCircle size={20} />
                    고객지원센터
                </Link>
            </div>

            {/* Support Info */}
            <div className="mt-16 text-gray-400 font-bold text-xs uppercase tracking-[0.2em]">
                System Error Code: PAGE_NOT_FOUND_REACH
            </div>
        </div>
    );
}
