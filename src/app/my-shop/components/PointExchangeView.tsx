'use client';

import React, { useState } from 'react';
import { Gift, AlertCircle, Check } from 'lucide-react';
import { useBrand } from '@/components/BrandProvider';
import { useAuth } from '@/hooks/useAuth';

export function PointExchangeView({ setView }: { setView: (v: any) => void }) {
    const brand = useBrand();
    const { user } = useAuth();
    const isDark = brand.theme === 'dark';

    // To be strictly correct, user points should be fetched from DB/State.
    const userPoints = user?.points || 0;
    const canExchange = userPoints >= 2000;

    const [selectedItem, setSelectedItem] = useState<string | null>(null);
    const [submitted, setSubmitted] = useState(false);

    const EXCHAGE_ITEMS = [
        { id: 'naver', name: '네이버페이 포인트 (20,000원)', points: 2000, img: 'https://img.icons8.com/color/96/naver.png' },
        { id: 'baemin', name: '배달의민족 상품권 (20,000원)', points: 2000, img: 'https://img.icons8.com/plasticine/100/food.png' },
    ];

    const handleSubmit = () => {
        if (!selectedItem || !canExchange) return;
        setSubmitted(true);
    };

    return (
        <div className={`p-6 md:p-10 rounded-[32px] border shadow-sm ${isDark ? 'bg-gray-900 border-gray-800 text-white' : 'bg-white border-rose-100 text-gray-900'}`}>
            <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center shrink-0">
                    <Gift size={24} />
                </div>
                <div>
                    <h2 className="text-xl md:text-2xl font-black">포인트 상품권 교환</h2>
                    <p className={`text-sm font-bold mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>2,000P 모으면 2만원 상품권으로 바로 교환!</p>
                </div>
            </div>

            {/* My Points Area */}
            <div className={`p-6 rounded-3xl mb-8 border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-4">
                    <div>
                        <h3 className={`text-sm font-black ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>현재 보유 포인트</h3>
                        <div className="text-3xl font-black text-[#f82b60] mt-1">{userPoints.toLocaleString()} <span className="text-lg">P</span></div>
                    </div>
                    {!canExchange && (
                        <div className="flex items-center gap-2 text-xs font-bold text-orange-600 bg-orange-50 px-4 py-2 rounded-xl border border-orange-100">
                            <AlertCircle size={16} />
                            <span>교환까지 <b>{(2000 - userPoints).toLocaleString()}P</b> 남았습니다!</span>
                        </div>
                    )}
                    {canExchange && (
                        <div className="flex items-center gap-2 text-xs font-bold text-green-600 bg-green-50 px-4 py-2 rounded-xl border border-green-100">
                            <Check size={16} />
                            <span>교환 가능! 상품권을 선택해주세요</span>
                        </div>
                    )}
                </div>
                {/* 달성률 프로그레스바 */}
                <div>
                    <div className="flex justify-between items-center mb-1.5">
                        <span className={`text-[11px] font-black ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>교환 달성률</span>
                        <span className="text-[11px] font-black text-[#f82b60]">{Math.min(100, Math.round((userPoints / 2000) * 100))}% · {Math.min(userPoints, 2000).toLocaleString()} / 2,000P</span>
                    </div>
                    <div className={`w-full h-3 rounded-full overflow-hidden ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
                        <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{
                                width: `${Math.min(100, Math.round((userPoints / 2000) * 100))}%`,
                                background: canExchange ? 'linear-gradient(90deg, #10b981, #34d399)' : 'linear-gradient(90deg, #f82b60, #fb7185)',
                            }}
                        />
                    </div>
                </div>
            </div>

            {!submitted ? (
                <>
                    <h3 className="text-lg font-black mb-4">교환 상품 선택</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                        {EXCHAGE_ITEMS.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => canExchange && setSelectedItem(item.id)}
                                disabled={!canExchange}
                                className={`relative flex flex-col items-center justify-center p-6 border-2 rounded-3xl text-center transition-all ${
                                    !canExchange
                                        ? 'border-gray-100 bg-gray-50 opacity-60 cursor-not-allowed grayscale'
                                        : selectedItem === item.id
                                            ? 'border-[#f82b60] bg-rose-50 shadow-lg shadow-rose-100'
                                            : isDark ? 'border-gray-700 hover:border-gray-500' : 'border-gray-200 hover:border-rose-300'
                                }`}
                            >
                                <img src={item.img} alt={item.name} className="w-16 h-16 object-contain mb-3 drop-shadow-sm" />
                                <p className="font-black text-[15px] mb-1">{item.name}</p>
                                <p className={`text-xs font-bold ${selectedItem === item.id ? 'text-[#f82b60]' : 'text-gray-400'}`}>{item.points.toLocaleString()}P 차감</p>

                                {!canExchange && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-white/40 backdrop-blur-[1px] rounded-3xl">
                                        <span className="bg-black/70 text-white text-[10px] font-black px-3 py-1.5 rounded-full">
                                            2,000P부터 가능
                                        </span>
                                    </div>
                                )}
                            </button>
                        ))}
                    </div>

                    <div className={`p-4 rounded-2xl mb-8 space-y-1 text-xs font-bold ${isDark ? 'bg-gray-800 text-gray-400' : 'bg-rose-50/50 text-gray-500'}`}>
                        <p className="text-[#f82b60] mb-2 font-black text-[13px]">💡 포인트를 모으는 방법! 가입만 해도 600P!</p>
                        <p>✅ 회원가입 달성 <span className={`font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>+100P</span></p>
                        <p>✅ 이력서 1회 등록 <span className={`font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>+500P</span></p>
                        <p>✅ 게시글 작성 <span className={`font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>+20P</span></p>
                        <p>✅ 댓글 작성 <span className={`font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>+5P</span></p>
                        <p>✅ 출석체크 <span className={`font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>+3P</span></p>
                    </div>

                    <button
                        onClick={handleSubmit}
                        disabled={!canExchange || !selectedItem}
                        className={`w-full py-4 text-base font-black rounded-2xl transition-all ${
                            canExchange && selectedItem
                                ? 'bg-[#f82b60] text-white hover:bg-[#db2456] shadow-xl shadow-rose-100 active:scale-95'
                                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        }`}
                    >
                        {canExchange && selectedItem ? '교환 신청하기' : '상품부터 선택해주세요'}
                    </button>
                </>
            ) : (
                <div className="flex flex-col items-center justify-center py-10 text-center animate-in zoom-in-95 duration-300">
                    <Check size={64} className="text-green-500 mb-4" />
                    <h3 className="text-2xl font-black mb-2">교환 신청이 접수되었습니다!</h3>
                    <p className={`text-sm font-bold max-w-sm leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        관리자 확인 후 회원정보에 등록된 연락처로 상품권 핀번호가 발송됩니다. (영업일 기준 1~2일 소요)
                    </p>
                    <button
                        onClick={() => {
                            setSubmitted(false);
                            setSelectedItem(null);
                        }}
                        className="mt-8 px-6 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-black hover:bg-black transition-all"
                    >
                        다른 상품 더 보기
                    </button>
                </div>
            )}
        </div>
    );
}
