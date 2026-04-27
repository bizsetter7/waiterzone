import { CreditCard, ArrowRight } from 'lucide-react';
import { useBrand } from '@/components/BrandProvider';
import { getPayColor, getPayAbbreviation } from '@/utils/payColors';
import { getHighlighterStyle } from '@/utils/highlighter';
import { DETAILED_PRICING } from '../constants';
import { IconBadge } from '@/components/common/IconBadge';
import { safeParseDate } from '../utils';

export const PaymentsView = ({ setView, payments = [], userName = '', onShowAdDetail, onOpenMenu }: { setView: (v: any) => void, payments?: any[], userName?: string, onShowAdDetail?: (adId: any) => void, onOpenMenu?: () => void }) => {
    const brand = useBrand();

    return (
        <div className="space-y-3 md:space-y-6">
            <div className={`relative p-3 md:p-6 rounded-[20px] md:rounded-[32px] shadow-sm border ${brand.theme === 'dark' ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'} `}>

                <div className="flex items-center gap-4 pr-10 md:pr-0">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white ${brand.theme === 'dark' ? 'bg-gray-800' : 'bg-green-600'} `}>
                        <CreditCard size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-gray-800 md:inline block">결제 내역</h2>
                    </div>
                </div>
            </div>

            <div className="space-y-6">
                <div className="border-t border-gray-200 dark:border-gray-800 pt-8">
                    <div className="flex items-center gap-2 mb-6">
                        <ArrowRight size={14} className="text-blue-500 shrink-0" />
                        <span className={`font-black text-sm ${brand.theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>유료 결제 내역 (최신순)</span>
                    </div>

                    {payments.length === 0 ? (
                        <div className={`min-h-[200px] flex flex-col items-center justify-center border rounded-[24px] ${brand.theme === 'dark' ? 'bg-gray-900/50 border-gray-800' : 'bg-gray-50/50 border-gray-100'}`}>
                            <CreditCard size={40} className="text-gray-200 mb-3" />
                            <p className="text-gray-400 font-bold">결제 내역이 아직 없습니다.</p>
                        </div>
                    ) : (
                        <>
                            {/* PC View (Table) */}
                            <div className="hidden md:block overflow-hidden rounded-[24px] border border-gray-100 dark:border-gray-800 shadow-sm transition hover:shadow-md">
                                <table className="w-full text-center border-collapse text-[13px]">
                                    <thead className={`${brand.theme === 'dark' ? 'bg-gray-800/50 text-gray-400' : 'bg-gray-50 text-gray-500'} font-black border-b border-gray-100 dark:border-gray-800 whitespace-nowrap`}>
                                        <tr>
                                            <th className="py-4 px-2">번호</th>
                                            <th className="py-4 px-2 text-left">구매 항목</th>
                                            <th className="py-4 px-2">결제 금액</th>
                                            <th className="py-4 px-2">결제 방식</th>
                                            <th className="py-4 px-2">닉네임</th>
                                            <th className="py-4 px-2">신청일 / 마감일</th>
                                            <th className="py-4 px-2">상태</th>
                                        </tr>
                                    </thead>
                                    <tbody className={`${brand.theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                                        {payments.map((p: any, index: number) => {
                                            // [Fix] Robust Type Matching for 'T1-T7' Badge
                                            // Priority: p.pay_type (V4 Schema Column) -> p.metadata.product_type -> p.metadata.ad_tier
                                            const rawType = p.pay_type || p.payType || p.metadata?.product_type || p.metadata?.ad_tier || p.adObject?.productType || '';
                                            const typeKey = (rawType || '').toLowerCase();

                                            const adProduct = DETAILED_PRICING.find(tp =>
                                                tp.tier === rawType ||
                                                tp.id === rawType ||
                                                tp.code === rawType ||
                                                tp.altId === rawType ||
                                                (typeKey.includes('grand') && tp.id === 'p1') ||
                                                (typeKey.includes('premium') && tp.id === 'p2') ||
                                                (typeKey.includes('deluxe') && tp.id === 'p3') ||
                                                (typeKey.includes('special') && tp.id === 'p4') ||
                                                ((typeKey.includes('urgent') || typeKey.includes('rec')) && tp.id === 'p5') ||
                                                (typeKey.includes('native') && tp.id === 'p6') ||
                                                (typeKey.includes('basic') && tp.id === 'p7')
                                            );
                                            const typeCode = adProduct?.code || 'T7'; // 기본값 T7 (AD 탈피)
                                            // eslint-disable-next-line @typescript-eslint/no-unused-vars
                                            const tierName = adProduct?.tier || '일반';

                                            const displayPrice = typeof p.price === 'number'
                                                ? p.price.toLocaleString() + '원'
                                                : p.price;

                                            return (
                                                <tr key={p.id} className="border-b border-gray-50 dark:border-gray-800/50 last:border-0 hover:bg-gray-50/50 dark:hover:bg-gray-800/20 transition">
                                                    {/* [Fix] Sequential Number */}
                                                    <td className="py-5 px-2 font-mono text-gray-400 text-[11px]">{payments.length - index}</td>
                                                    <td className="py-5 px-2">
                                                        <div className="flex flex-col gap-1.5 text-left">
                                                            <div className="flex flex-wrap gap-1">
                                                                <span className="bg-gray-900 text-white text-[9px] px-1.5 py-0.5 rounded-sm font-black shadow-sm shrink-0 whitespace-nowrap">
                                                                    {typeCode}
                                                                </span>
                                                                {p.adObject?.options?.icon && <span className="bg-indigo-500 text-white text-[9px] px-1.5 py-0.5 rounded-sm font-black shadow-sm">아</span>}
                                                                {p.adObject?.options?.highlighter && <span className="bg-gray-600 text-white text-[9px] px-1.5 py-0.5 rounded-sm font-black shadow-sm">형</span>}
                                                                {(p.adObject?.options?.border && p.adObject?.options?.border !== 'none') && <span className="bg-blue-500 text-white text-[9px] px-1.5 py-0.5 rounded-sm font-black shadow-sm">테</span>}
                                                                {((p.adObject?.options?.paySuffixes?.length > 0) || (p.adObject?.options?.pay_suffixes?.length > 0)) && <span className="bg-blue-500 text-white text-[9px] px-1.5 py-0.5 rounded-sm font-black shadow-sm">급</span>}
                                                            </div>
                                                            <div
                                                                onClick={(e) => { e.stopPropagation(); onShowAdDetail?.(p.adObject || p); }}
                                                                className={`font-black text-[14px] hover:text-blue-500 cursor-pointer transition line-clamp-1 break-all px-1 flex items-center gap-1 ${brand.theme === 'dark' ? 'text-white' : 'text-gray-900'}`}
                                                                style={getHighlighterStyle(p.adObject?.options?.highlighter || p.adObject?.selectedHighlighter)}
                                                            >
                                                                {(p.adObject?.options?.icon || p.adObject?.selectedIcon) && (
                                                                    <IconBadge iconId={p.adObject?.options?.icon || p.adObject?.selectedIcon} />
                                                                )}
                                                                {p.adTitle || p.adObject?.title || '공고 제목 없음'}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="py-5 px-2 font-black text-blue-500">{displayPrice}</td>
                                                    <td className="py-5 px-2 text-[11px] font-bold text-gray-400">
                                                        {p.method === 'bank_transfer' ? '무통장입금' : p.method}
                                                    </td>
                                                    <td className="py-5 px-2 font-black max-w-[100px] truncate">
                                                        {p.adObject?.options?.nickname || p.adObject?.nickname || p.nickname || '-'}
                                                    </td>
                                                    <td className="py-5 px-2 text-[11px] text-gray-400 font-mono leading-tight whitespace-nowrap">
                                                        <div className="flex flex-col">
                                                            {p.adObject?.status === 'active' || p.adObject?.status === 'ACTIVE' ? (
                                                                <>
                                                                    <span className="text-blue-500 font-black">
                                                                        {(() => {
                                                                            const d = safeParseDate(p.adObject?.approved_at || p.date);
                                                                            return d ? d.toLocaleDateString() : '-';
                                                                        })()}
                                                                    </span>
                                                                    <span className="text-[10px] opacity-70">
                                                                        {p.adObject?.deadline || '미정'}
                                                                    </span>
                                                                </>
                                                            ) : (
                                                                <div className="flex flex-col items-center">
                                                                    <span className="font-bold">
                                                                        {(() => {
                                                                            const d = safeParseDate(p.date);
                                                                            return d ? d.toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\.$/, '') : '-';
                                                                        })()}
                                                                    </span>
                                                                    <span className="text-[10px] text-gray-400 font-mono">
                                                                        {(() => {
                                                                            const d = safeParseDate(p.date);
                                                                            return d ? d.toLocaleTimeString('ko-KR', { hour12: false, hour: '2-digit', minute: '2-digit' }) : '';
                                                                        })()}
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="py-5 px-2">
                                                        {(() => {
                                                            const adStatus = p.adObject?.status;
                                                            const payStatus = p.status;

                                                            if (adStatus === 'rejected' || adStatus === 'REJECTED') {
                                                                return <span className="px-2 py-1 bg-red-500 text-white text-[10px] font-black rounded-lg shadow-sm whitespace-nowrap">반려</span>;
                                                            }
                                                            if (adStatus === 'active' || adStatus === 'ACTIVE') {
                                                                return <span className="px-2 py-1 bg-blue-500 text-white text-[10px] font-black rounded-lg shadow-sm whitespace-nowrap">승인됨</span>;
                                                            }
                                                            if (adStatus === 'PENDING_REVIEW' || adStatus === 'pending_review') {
                                                                return <span className="px-2 py-1 bg-orange-500 text-white text-[10px] font-black rounded-lg shadow-sm whitespace-nowrap">심사중</span>;
                                                            }

                                                            const isSuccess = payStatus === '결제완료' || payStatus === 'success';
                                                            return (
                                                                <span className={`px-2 py-1 text-white text-[10px] font-black rounded-lg ${isSuccess ? 'bg-green-500' : 'bg-orange-500'} shadow-sm whitespace-nowrap`}>
                                                                    {payStatus === 'pending' ? '결제대기' : (isSuccess ? '결제완료' : (payStatus || '대기'))}
                                                                </span>
                                                            );
                                                        })()}
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            {/* Mobile View (Cards) */}
                            <div className="md:hidden space-y-4">
                                {payments.map((p: any, index: number) => {
                                    // [Fix] Robust Type Matching for 'T1-T7' Badge (Mobile)
                                    const rawType = p.pay_type || p.payType || p.metadata?.product_type || p.metadata?.ad_tier || p.adObject?.productType || '';
                                    const typeKey = (rawType || '').toLowerCase();

                                    const adProduct = DETAILED_PRICING.find(tp =>
                                        tp.tier === rawType ||
                                        tp.id === rawType ||
                                        tp.code === rawType ||
                                        tp.altId === rawType ||
                                        (typeKey.includes('grand') && tp.id === 'p1') ||
                                        (typeKey.includes('premium') && tp.id === 'p2') ||
                                        (typeKey.includes('deluxe') && tp.id === 'p3') ||
                                        (typeKey.includes('special') && tp.id === 'p4') ||
                                        ((typeKey.includes('urgent') || typeKey.includes('rec')) && tp.id === 'p5') ||
                                        (typeKey.includes('native') && tp.id === 'p6') ||
                                        (typeKey.includes('basic') && tp.id === 'p7')
                                    );
                                    const typeCode = adProduct?.code || 'T7';
                                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                                    const tierName = adProduct?.tier || '일반';

                                    const displayPrice = typeof p.price === 'number'
                                        ? p.price.toLocaleString() + '원'
                                        : (p.price || '0') + '원';

                                    return (
                                        <div key={p.id} className={`${brand.theme === 'dark' ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'} border rounded-[24px] p-5 shadow-sm space-y-4`}>
                                            <div className="flex justify-between items-start gap-2">
                                                <div className="space-y-1 overflow-hidden">
                                                    <div className="flex flex-wrap gap-1">
                                                        <span className={`${brand.theme === 'dark' ? 'bg-blue-500' : 'bg-gray-900'} text-white text-[9.5px] px-2 py-0.5 rounded-sm font-black uppercase whitespace-nowrap tracking-tighter`}>
                                                            {typeCode}
                                                        </span>
                                                        {(p.adObject?.options?.icon || p.adObject?.selectedIcon) && <span className="bg-indigo-500 text-white text-[9px] px-1.5 py-0.5 rounded-sm font-black">아</span>}
                                                        {(p.adObject?.options?.highlighter || p.adObject?.selectedHighlighter) && <span className="bg-gray-600 text-white text-[9px] px-1.5 py-0.5 rounded-sm font-black">형</span>}
                                                        {((p.adObject?.options?.border && p.adObject?.options?.border !== 'none') || (p.adObject?.borderOption && p.adObject?.borderOption !== 'none')) && <span className="bg-blue-500 text-white text-[9px] px-1.5 py-0.5 rounded-sm font-black">테</span>}
                                                        {((p.adObject?.options?.paySuffixes?.length > 0) || (p.adObject?.options?.pay_suffixes?.length > 0) || ((p.adObject?.paySuffixes || []).length > 0)) && <span className="bg-blue-500 text-white text-[9px] px-1.5 py-0.5 rounded-sm font-black">급</span>}
                                                    </div>
                                                    <div
                                                        onClick={(e) => { e.stopPropagation(); onShowAdDetail?.(p.adObject || p); }}
                                                        className={`text-[15px] font-black leading-tight line-clamp-1 break-all px-1 flex items-center gap-1 ${brand.theme === 'dark' ? 'text-white' : 'text-gray-900'} active:text-blue-500 cursor-pointer`}
                                                        style={getHighlighterStyle(p.adObject?.options?.highlighter || p.adObject?.selectedHighlighter)}
                                                    >
                                                        {(p.adObject?.options?.icon || p.adObject?.selectedIcon) && (
                                                            <IconBadge iconId={p.adObject?.options?.icon || p.adObject?.selectedIcon} />
                                                        )}
                                                        {p.adTitle || p.adObject?.title || '공고 제목 없음'}
                                                    </div>
                                                    {/* Nickname */}
                                                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1 px-1">
                                                        <span className="text-[10px] text-blue-500 font-black">
                                                            {p.adObject?.options?.nickname || p.adObject?.nickname || p.nickname || '-'}
                                                        </span>
                                                    </div>
                                                </div>
                                                {(() => {
                                                    const adStatus = p.adObject?.status;
                                                    const payStatus = p.status;

                                                    if (adStatus === 'rejected' || adStatus === 'REJECTED') {
                                                        return <span className="shrink-0 px-2 py-1 bg-red-500 text-white text-[10px] font-black rounded-lg shadow-sm">반려</span>;
                                                    }
                                                    if (adStatus === 'active' || adStatus === 'ACTIVE') {
                                                        return <span className="shrink-0 px-2 py-1 bg-blue-500 text-white text-[10px] font-black rounded-lg shadow-sm">승인완료</span>;
                                                    }
                                                    if (adStatus === 'PENDING_REVIEW' || adStatus === 'pending_review') {
                                                        return <span className="shrink-0 px-2 py-1 bg-orange-500 text-white text-[10px] font-black rounded-lg shadow-sm">심사중</span>;
                                                    }

                                                    const isSuccess = payStatus === '결제완료' || payStatus === 'success';
                                                    return (
                                                        <span className={`shrink-0 px-2 py-1 text-white text-[10px] font-black rounded-lg ${isSuccess ? 'bg-green-500' : 'bg-orange-500'}`}>
                                                            {payStatus === 'pending' ? '결제대기' : (isSuccess ? '결제완료' : (payStatus || '대기'))}
                                                        </span>
                                                    );
                                                })()}
                                            </div>

                                            <div className={`grid grid-cols-2 gap-3 p-4 rounded-2xl ${brand.theme === 'dark' ? 'bg-black/20 text-gray-400' : 'bg-gray-50 text-gray-500'} text-[11px] font-bold`}>
                                                <div className="space-y-1">
                                                    <p className="text-[9px] text-gray-400">
                                                        {p.adObject?.status === 'active' || p.adObject?.status === 'ACTIVE' ? '결제일/마감일' : '신청일시'}
                                                    </p>
                                                    <div className={`${brand.theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} leading-tight`}>
                                                        {p.adObject?.status === 'active' || p.adObject?.status === 'ACTIVE' ? (
                                                            <>
                                                                <span className="text-blue-500 font-black">
                                                                    {(() => {
                                                                        const d = safeParseDate(p.adObject?.approved_at || p.date);
                                                                        return d ? d.toLocaleDateString() : '-';
                                                                    })()}
                                                                </span><br />
                                                                <span className="text-[10px] text-gray-400">
                                                                    {p.adObject?.deadline || '미정'}
                                                                </span>
                                                            </>
                                                        ) : (
                                                            <div className="flex flex-col">
                                                                <span className="font-black text-[12px]">
                                                                    {(() => {
                                                                        const d = safeParseDate(p.date);
                                                                        return d ? d.toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\.$/, '') : '-';
                                                                    })()}
                                                                </span>
                                                                <span className="text-[10px] text-gray-400 font-mono">
                                                                    {(() => {
                                                                        const d = safeParseDate(p.date);
                                                                        return d ? d.toLocaleTimeString('ko-KR', { hour12: false, hour: '2-digit', minute: '2-digit' }) : '';
                                                                    })()}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-[9px] text-gray-400">결제 금액</p>
                                                    <p className={`text-sm font-black ${brand.theme === 'dark' ? 'text-white' : 'text-blue-600'}`}>{displayPrice}</p>
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-[9px] text-gray-400">결제 방식</p>
                                                    <p className={`text-sm font-black ${brand.theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>무통장입금</p>
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-[9px] text-gray-400">결제 번호</p>
                                                    <p className="font-mono">#{payments.length - index}</p>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>

                            <div className="flex justify-center items-center gap-1 mt-10">
                                <button className={`w-8 h-8 rounded-full border flex items-center justify-center text-[10px] ${brand.theme === 'dark' ? 'border-gray-800 text-gray-600' : 'border-gray-200 text-gray-400'}`}>&lt;</button>
                                <span className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center text-[11px] font-black shadow-lg shadow-blue-500/30">1</span>
                                <button className={`w-8 h-8 rounded-full border flex items-center justify-center text-[10px] ${brand.theme === 'dark' ? 'border-gray-800 text-gray-600' : 'border-gray-200 text-gray-400'}`}>&gt;</button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};
