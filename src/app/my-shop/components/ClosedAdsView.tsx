import React from 'react';
import { List } from 'lucide-react';
import { useBrand } from '@/components/BrandProvider';

export const ClosedAdsView = ({ setView, ads = [], userName = '', onOpenMenu, onShowAdDetail, onDeleteAd }: { setView: (v: any) => void, ads?: any[], userName?: string, onOpenMenu?: () => void, onShowAdDetail?: (ad: any) => void, onDeleteAd?: (adId: any) => void }) => {
    const brand = useBrand();

    return (
        <div className="space-y-4 md:space-y-6 pb-20">
            <div className={`relative p-5 md:p-6 rounded-[24px] md:rounded-[32px] shadow-sm border ${brand.theme === 'dark' ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'} `}>
                <div className="flex items-center gap-3 md:gap-4 pr-10 md:pr-0">
                    <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center text-white ${brand.theme === 'dark' ? 'bg-gray-800' : 'bg-gray-600'} `}>
                        <List size={20} className="md:w-6 md:h-6" />
                    </div>
                    <div>
                        <h2 className={`text-lg md:text-xl font-black ${brand.theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>마감된 채용정보</h2>
                    </div>
                </div>
            </div>

            <div className="border-t border-gray-200 pt-6 md:pt-10">
                {ads.length === 0 ? (
                    <div className="min-h-[300px] flex flex-col items-center justify-center">
                        <p className={`text-lg font-black ${brand.theme === 'dark' ? 'text-gray-400' : 'text-gray-900'}`}>마감된 구인정보가 없습니다.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-6 px-4 md:px-0">
                        {ads.map((ad: any) => (
                            <div key={ad.id} className={`${brand.theme === 'dark' ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'} border rounded-[28px] overflow-hidden relative shadow-sm opacity-75 grayscale-[0.5] transition-all`}>
                                <div className="p-6 md:p-8 space-y-4">
                                    <div className="flex flex-col gap-2 relative">
                                        {/* Status & Tier Badges Line (Stacked above title) */}
                                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                                            {/* Tier Code Badge (Standard: bg-gray-900) */}
                                            <span className="bg-gray-900 text-white text-[9px] px-1.5 py-0.5 rounded-sm font-black shadow-sm shrink-0 whitespace-nowrap">
                                                {(() => {
                                                    const pt = (ad.productType || ad.tier || ad.product_type || ad.ad_type || ad.options?.product_type || 'p7').toLowerCase();
                                                    if (pt.includes('grand')) return 'T1';
                                                    if (pt.includes('premium')) return 'T2';
                                                    if (pt === 'p3') return 'T3';
                                                    if (pt === 'p4') return 'T4';
                                                    if (pt === 'p5') return 'T5';
                                                    return 'T7';
                                                })()}
                                            </span>

                                            {/* Option Mini Badges (PaymentsView Colors) */}
                                            <div className="flex items-center gap-1 shrink-0">
                                                {(ad.options?.icon || ad.selectedIcon) && (
                                                    <span className="bg-indigo-500 text-white text-[9px] px-1.5 py-0.5 rounded-sm font-black shadow-sm">아</span>
                                                )}
                                                {(ad.options?.highlighter || ad.selectedHighlighter) && (
                                                    <span className="bg-gray-600 text-white text-[9px] px-1.5 py-0.5 rounded-sm font-black shadow-sm">형</span>
                                                )}
                                                {(ad.options?.border && ad.options?.border !== 'none' || (ad.borderOption && ad.borderOption !== 'none')) && (
                                                    <span className="bg-blue-500 text-white text-[9px] px-1.5 py-0.5 rounded-sm font-black shadow-sm">테</span>
                                                )}
                                                {(ad.options?.pay_suffixes || ad.options?.paySuffixes || ad.paySuffixes?.length > 0) && (
                                                    <span className="bg-blue-500 text-white text-[9px] px-1.5 py-0.5 rounded-sm font-black shadow-sm">급</span>
                                                )}
                                            </div>

                                            <span className="bg-gray-100 text-gray-500 px-2 py-0.5 rounded text-[10px] font-black border border-gray-200 uppercase ml-auto">마감됨</span>
                                        </div>

                                        <h3
                                            onClick={() => onShowAdDetail?.(ad)}
                                            className={`font-black text-[17px] md:text-[19px] leading-tight cursor-pointer hover:text-blue-500 transition line-clamp-2 ${brand.theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}
                                        >
                                            {ad.title}
                                        </h3>

                                        {/* Info Area [Pure Reflection Mode] - No Shop Name */}
                                        <div className="text-[11px] font-bold text-gray-400 flex flex-wrap items-center justify-between gap-1.5 mt-2">
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-blue-400/70 font-black uppercase">
                                                    {(() => {
                                                        const nick = ad.options?.nickname || ad.nickname || userName || '';
                                                        if (nick.includes('게스트') || nick === '관리자' || !nick) return '사업자';
                                                        return nick;
                                                    })()}
                                                </span>
                                                <span className="text-gray-200">|</span>
                                                <span className="shrink-0">{(ad.options?.regionCity || ad.regionCity)} {(ad.options?.regionGu || ad.regionGu)}</span>
                                                <span className="text-gray-200">|</span>
                                                <span className="truncate">{(ad.options?.category || ad.category)} | {(ad.options?.categorySub || ad.categorySub || '자유직종')}</span>
                                            </div>
                                            
                                            {/* Delete Button for Closed Ads */}
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); onDeleteAd?.(ad.id); }}
                                                className="px-4 py-1.5 bg-white border border-red-100 text-red-500 text-[10px] font-black rounded-lg hover:bg-red-50 transition-all opacity-100 grayscale-0"
                                            >
                                                삭제
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
