'use client';

import React, { useState, useEffect } from 'react';
import { ShieldOff, User, Trash2 } from 'lucide-react';
import { useBrand } from '@/components/BrandProvider';

const STORAGE_KEY = 'coco_blocked_users';

interface BlockedUser {
    nickname: string;
    blockedAt: string;
}

function formatDate(dateStr: string) {
    const d = new Date(dateStr);
    return d.toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\. /g, '.').replace(/\.$/, '');
}

export function BlockSettingsView() {
    const brand = useBrand();
    const isDark = brand.theme === 'dark';
    const [blockedList, setBlockedList] = useState<BlockedUser[]>([]);

    useEffect(() => {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            setBlockedList(raw ? JSON.parse(raw) : []);
        } catch {
            setBlockedList([]);
        }
    }, []);

    const handleUnblock = (nickname: string) => {
        if (!confirm(`"${nickname}" 님을 차단 해제하시겠습니까?`)) return;
        const updated = blockedList.filter(u => u.nickname !== nickname);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        setBlockedList(updated);
    };

    return (
        <div className="space-y-4">
            {/* 헤더 */}
            <div className="flex items-center justify-between mb-2">
                <h2 className={`text-xl font-black flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    <ShieldOff size={20} className="text-[#f82b60]" />
                    회원 차단 설정
                    {blockedList.length > 0 && (
                        <span className="text-sm font-black text-[#f82b60]">{blockedList.length}명</span>
                    )}
                </h2>
            </div>

            {/* 안내 문구 */}
            <div className={`px-5 py-4 rounded-2xl text-sm font-bold ${isDark ? 'bg-gray-800 text-gray-400' : 'bg-gray-50 text-gray-500'}`}>
                차단한 회원의 게시글은 커뮤니티에서 숨겨집니다. 차단 목록은 본 기기에만 저장됩니다.
            </div>

            {/* 목록 */}
            {blockedList.length === 0 ? (
                <div className={`p-12 rounded-[32px] border text-center ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'}`}>
                    <ShieldOff size={40} className="mx-auto mb-4 text-gray-200" />
                    <p className={`font-black text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>차단한 회원이 없습니다.</p>
                    <p className={`text-xs mt-1 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>커뮤니티 게시글의 더보기 메뉴에서 회원을 차단할 수 있습니다.</p>
                </div>
            ) : (
                <div className="flex flex-col gap-3">
                    {blockedList.map((u) => (
                        <div
                            key={u.nickname}
                            className={`p-5 rounded-[24px] border shadow-sm flex items-center gap-4 ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'}`}
                        >
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${isDark ? 'bg-gray-800 text-gray-500' : 'bg-gray-100 text-gray-400'}`}>
                                <User size={20} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className={`font-black text-sm truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>{u.nickname}</p>
                                <p className={`text-xs mt-0.5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>차단일: {formatDate(u.blockedAt)}</p>
                            </div>
                            <button
                                onClick={() => handleUnblock(u.nickname)}
                                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black transition-all active:scale-95 ${isDark ? 'bg-gray-800 text-gray-400 hover:bg-red-900/30 hover:text-red-400' : 'bg-gray-100 text-gray-500 hover:bg-red-50 hover:text-red-500'}`}
                            >
                                <Trash2 size={13} />
                                차단 해제
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
