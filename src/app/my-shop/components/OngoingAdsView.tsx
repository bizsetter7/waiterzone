import React from 'react';
import { List, RefreshCw, Calendar, ChevronLeft, Zap, Image as ImageIcon, Loader2 } from 'lucide-react';
import { useBrand } from '@/components/BrandProvider';
import { getHighlighterStyle } from '@/utils/highlighter';
import { IconBadge } from '@/components/common/IconBadge';
import { supabase } from '@/lib/supabase';

// ─── 카드 이미지 업로드 패널 ────────────────────────────────────────────────────
// 등급별 리스트 카드 썸네일(options.mediaUrl + shops.media_url) 변경용
// 사이드바 배너(banner_image_url)와 별개 — 승인 불필요, 즉시 반영
interface CardImageUploadPanelProps {
    adId: string;
    currentImageUrl?: string | null;
    onSuccess: (url: string) => void;
}

const CardImageUploadPanel = ({ adId, currentImageUrl, onSuccess }: CardImageUploadPanelProps) => {
    const [isUploading, setIsUploading] = React.useState(false);
    const [previewUrl, setPreviewUrl] = React.useState<string>(currentImageUrl || '');
    const [urlInput, setUrlInput] = React.useState('');
    const [msg, setMsg] = React.useState('');

    const saveToDb = async (url: string) => {
        // options JSONB의 mediaUrl도 함께 업데이트 (카드 렌더링 기준 컬럼)
        const { data: shopData, error: fetchErr } = await supabase
            .from('shops')
            .select('options')
            .eq('id', Number(adId))
            .single();
        if (fetchErr) throw fetchErr;
        const newOptions = { ...(shopData?.options || {}), mediaUrl: url };
        const { error } = await supabase
            .from('shops')
            .update({
                media_url: url,
                options: newOptions,
                updated_at: new Date().toISOString(),
            })
            .eq('id', Number(adId));
        return error;
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const MAX_SIZE = 10 * 1024 * 1024;
        if (file.size > MAX_SIZE) { setMsg('❌ 파일 크기 10MB 이하만 가능합니다.'); return; }
        const ext = file.name.split('.').pop()?.toLowerCase() || '';
        const allowed = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
        if (!allowed.includes(ext)) { setMsg('❌ JPG/PNG/GIF/WebP만 가능합니다.'); return; }
        setIsUploading(true); setMsg('');
        try {
            const fileName = `card-images/${adId}_${Date.now()}.${ext}`;
            const { error: upErr } = await supabase.storage
                .from('job-images')
                .upload(fileName, file, { upsert: true });
            if (upErr) throw upErr;
            const { data: { publicUrl } } = supabase.storage
                .from('job-images')
                .getPublicUrl(fileName);
            const dbErr = await saveToDb(publicUrl);
            if (dbErr) throw dbErr;
            setPreviewUrl(publicUrl);
            setMsg('✅ 카드 이미지 변경 완료! 목록에 즉시 반영됩니다.');
            onSuccess(publicUrl);
        } catch (err: any) {
            setMsg(`❌ 업로드 실패: ${err.message || '알 수 없는 오류'}`);
        } finally {
            setIsUploading(false);
            e.target.value = '';
        }
    };

    const handleUrlSave = async () => {
        if (!urlInput.trim()) return;
        setIsUploading(true); setMsg('');
        try {
            const dbErr = await saveToDb(urlInput.trim());
            if (dbErr) throw dbErr;
            setPreviewUrl(urlInput.trim());
            setMsg('✅ 카드 이미지 URL 저장 완료!');
            onSuccess(urlInput.trim());
            setUrlInput('');
        } catch (err: any) {
            setMsg(`❌ 저장 실패: ${err.message || '알 수 없는 오류'}`);
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="mt-3 p-4 rounded-2xl border-2 border-dashed border-green-200 bg-green-50/30 space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
                <ImageIcon size={14} className="text-green-600" />
                <span className="text-[11px] font-black text-green-700 uppercase tracking-wide">카드 리스트 이미지 변경</span>
                <span className="text-[9px] text-gray-400 font-bold">· 권장 800×600px (4:3) · 승인 불필요 즉시 반영</span>
            </div>
            {previewUrl && (
                <div className="w-full h-20 rounded-xl overflow-hidden border border-green-100 bg-white shadow-sm">
                    <img src={previewUrl} alt="카드 이미지 미리보기" className="w-full h-full object-cover" />
                </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <label className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-[11px] font-black cursor-pointer transition-all active:scale-95 border ${isUploading ? 'bg-gray-100 text-gray-400 border-gray-200 pointer-events-none' : 'bg-green-700 text-white border-transparent hover:bg-green-800 shadow-md'}`}>
                    {isUploading
                        ? <><Loader2 size={12} className="animate-spin" />업로드 중...</>
                        : <><ImageIcon size={12} />파일 선택 (JPG/PNG/GIF/WebP)</>
                    }
                    <input type="file" className="hidden" accept="image/jpeg,image/png,image/gif,image/webp" onChange={handleFileUpload} disabled={isUploading} />
                </label>
                <div className="flex gap-1.5">
                    <input
                        type="text"
                        value={urlInput}
                        onChange={e => setUrlInput(e.target.value)}
                        placeholder="이미지 URL 직접 입력"
                        className="flex-1 px-3 py-2 text-[11px] font-bold bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-300/30"
                        disabled={isUploading}
                        onKeyDown={e => e.key === 'Enter' && handleUrlSave()}
                    />
                    <button
                        onClick={handleUrlSave}
                        disabled={!urlInput.trim() || isUploading}
                        className="px-3 py-2 bg-green-600 text-white text-[11px] font-black rounded-xl hover:bg-green-700 transition disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        등록
                    </button>
                </div>
            </div>
            <p className="text-[9px] text-gray-400 font-bold">
                * 권장: 800×600px (4:3 비율) | 최대 10MB | JPG·PNG·GIF·WebP 지원<br />
                * 변경 즉시 카드 목록에 반영됩니다. (별도 관리자 승인 불필요)
            </p>
            {msg && (
                <p className={`text-[11px] font-bold ${msg.startsWith('✅') ? 'text-green-600' : 'text-red-500'}`}>{msg}</p>
            )}
        </div>
    );
};

// ─── 메인 컴포넌트 ──────────────────────────────────────────────────────────────
export const OngoingAdsView = ({
    setView, ads = [], userName = '', jumpBalance = 0,
    onShowAdDetail, onOpenMenu, onEditAd, onDeleteAd, onJumpAd, userId, onNewAd,
}: {
    setView: (v: any) => void;
    ads?: any[];
    userName?: string;
    jumpBalance?: number;
    onShowAdDetail?: (ad: any) => void;
    onOpenMenu?: () => void;
    onEditAd?: (ad: any) => void;
    onDeleteAd?: (adId: any) => void;
    onJumpAd?: (adId: any) => void;
    userId?: string;
    onNewAd?: () => void;
}) => {
    const brand = useBrand();
    const [isMounted, setIsMounted] = React.useState(false);
    // 카드 이미지 업로드 패널 열림 상태
    const [cardImagePanelOpen, setCardImagePanelOpen] = React.useState<Record<string, boolean>>({});
    // 카드 이미지 업로드 성공 후 로컬 반영용
    const [cardImageUpdates, setCardImageUpdates] = React.useState<Record<string, string>>({});

    React.useEffect(() => { setIsMounted(true); }, []);

    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Seoul' });

    const getTierLabel = (ad: any) => {
        if (!ad) return 'T7';
        const pt = (ad.productType || ad.tier || ad.product_type || ad.ad_type || ad.options?.product_type || 'p7').toLowerCase();
        if (pt.includes('premium') || pt === 'p2') return 'T2';
        if (pt === 'p3' || pt.includes('deluxe')) return 'T3';
        if (pt === 'p4' || pt.includes('special')) return 'T4';
        return 'T7';
    };

    if (!isMounted) return <div className="p-12 text-center text-gray-400 font-bold min-h-screen">로딩 중...</div>;

    const activeAds = ads.filter(ad => ad.status !== 'CLOSED' && ad.status !== 'closed');

    return (
        <div className="space-y-4 md:space-y-6 pb-20">
            {/* Header */}
            <div className={`p-4 md:p-6 sm:rounded-[32px] shadow-sm border mb-5 mt-2 md:mt-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ${brand.theme === 'dark' ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'}`}>
                <div className="flex items-center gap-4">
                    <button onClick={() => setView('dashboard')} className="p-2 hover:bg-gray-100 rounded-full transition">
                        <ChevronLeft size={24} />
                    </button>
                    <div>
                        <h2 className={`text-xl md:text-2xl font-black ${brand.theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{userName} 공고 현황</h2>
                        <div className="flex items-center gap-2 mt-0.5">
                            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                            <p className="text-xs text-gray-400 font-bold">실시간 진행중인 공고 관리</p>
                        </div>
                    </div>
                </div>

                <div className={`p-4 rounded-2xl border flex items-center gap-4 ${brand.theme === 'dark' ? 'bg-black border-gray-800' : 'bg-gray-50 border-gray-200'}`}>
                    <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 shadow-sm border border-blue-100/20">
                        <Zap size={20} />
                    </div>
                    <div>
                        <p className="text-[10px] text-gray-400 font-black uppercase tracking-wider">My Jump Balance</p>
                        <p className="text-lg font-black text-blue-600">
                            {jumpBalance.toLocaleString()} <span className="text-xs text-gray-400 ml-0.5">회</span>
                        </p>
                    </div>
                    <button onClick={() => setView('buy-points')} className="ml-2 px-4 py-2 bg-gray-900 text-white text-[12px] font-black rounded-xl hover:bg-black transition-all active:scale-95 shadow-lg shadow-gray-200">
                        충전하기
                    </button>
                </div>
            </div>

            <div className="space-y-4">
                {activeAds.length === 0 ? (
                    <div className={`p-16 rounded-[32px] border border-dashed text-center flex flex-col items-center justify-center gap-4 ${brand.theme === 'dark' ? 'bg-gray-900 border-gray-800' : 'bg-gray-50/50 border-gray-200'}`}>
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center text-gray-300">
                            <List size={32} />
                        </div>
                        <p className="text-gray-400 font-bold">현재 진행 중인 채용정보가 없습니다.</p>
                        <button onClick={() => onNewAd ? onNewAd() : setView('form')} className="px-6 py-2.5 bg-[#1e3a5f] text-white rounded-xl font-black text-sm hover:translate-y-[-2px] transition-transform shadow-lg shadow-blue-200">
                            첫 공고 등록하기
                        </button>
                    </div>
                ) : (
                    activeAds.map((ad) => {
                        const tLabel = getTierLabel(ad);
                        const limit = tLabel === 'T2' ? 15
                            : (tLabel === 'T3' || tLabel === 'T4') ? 10 : 5;
                        const options = ad.options || {};
                        const lastDate = options.last_manual_jump_date || ad.last_manual_jump_date || ad.last_jump_date;
                        const usedCount = lastDate === today ? (options.daily_manual_jump_count || ad.daily_manual_jump_count || 0) : 0;
                        const remainCount = Math.max(0, limit - usedCount);
                        const isExhausted = remainCount <= 0;

                        return (
                            <div key={ad.id} className={`p-6 rounded-[32px] border transition-all duration-300 shadow-sm overflow-hidden group ${brand.theme === 'dark' ? 'bg-gray-900 border-gray-800 hover:bg-gray-800/50' : 'bg-white border-gray-100 hover:shadow-xl hover:border-blue-100 hover:translate-y-[-2px]'}`}>
                                <div className="flex flex-col md:flex-row justify-between gap-6 relative">
                                    {/* 광고 정보 */}
                                    <div className="space-y-3 flex-1 min-w-0">
                                        <div className="flex gap-2 items-center flex-wrap">
                                            <span className="bg-gray-900 text-white text-[10px] px-2.5 py-0.5 rounded-full font-black shadow-sm uppercase tracking-tighter">
                                                {tLabel} 등급
                                            </span>
                                            <span className={`${ad.status === 'rejected' || ad.status === 'REJECTED' ? 'bg-red-100 text-red-500' :
                                                ad.status === 'PENDING_REVIEW' || ad.status === 'pending' ? 'bg-orange-100 text-orange-500' :
                                                'bg-blue-100 text-blue-500'} px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-tighter shadow-sm`}>
                                                {ad.status === 'rejected' || ad.status === 'REJECTED' ? '반려' :
                                                 ad.status === 'PENDING_REVIEW' || ad.status === 'pending' ? '심사중' : '진행중'}
                                            </span>
                                            <span className="flex items-center gap-1 text-[11px] font-bold text-gray-400">
                                                <Calendar size={12} /> {ad.approved_at ? new Date(ad.approved_at).toLocaleDateString() : '심사 대기'}
                                            </span>
                                        </div>

                                        <h4
                                            onClick={() => onShowAdDetail?.(ad)}
                                            className={`font-black text-xl md:text-2xl cursor-pointer hover:text-blue-500 transition-colors leading-tight line-clamp-1 break-all flex items-center gap-1.5 ${brand.theme === 'dark' ? 'text-white' : 'text-gray-900'}`}
                                            style={getHighlighterStyle(options.highlighter || ad.selectedHighlighter)}
                                        >
                                            {(options.icon || ad.selectedIcon) && <IconBadge iconId={options.icon || ad.selectedIcon} />}
                                            {ad.title}
                                        </h4>

                                        <div className="flex items-center gap-4 text-xs font-bold text-gray-400 flex-wrap">
                                            <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-100">
                                                <span className="text-gray-400">월간 수정</span>
                                                <span className={`${(ad.edit_count || 0) >= 28 ? 'text-red-600 animate-pulse' : (ad.edit_count || 0) >= 20 ? 'text-orange-500' : 'text-gray-900'} font-black`}>
                                                    {ad.edit_count || 0}/30
                                                </span>
                                            </div>
                                            <div className="h-4 w-px bg-gray-200 hidden md:block" />
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-gray-400">마감일</span>
                                                <span className="text-gray-600 font-black">{ad.deadline || '상시채용'}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Actions Area */}
                                    <div className="flex flex-col items-end gap-3 shrink-0">
                                        {/* Jump Status Card */}
                                        <div className={`p-4 rounded-2xl border min-w-[200px] shadow-sm ${isExhausted ? 'bg-gray-50 border-gray-200' : 'bg-gray-50/50 border-blue-100'}`}>
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Free Daily Jump</span>
                                                <span className={`text-xs font-black ${isExhausted ? 'text-gray-500' : 'text-blue-600'}`}>{usedCount}/{limit}</span>
                                            </div>
                                            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden mb-3 shadow-inner">
                                                <div
                                                    className={`h-full transition-all duration-700 ease-out ${isExhausted ? 'bg-gray-400' : 'bg-blue-500'}`}
                                                    style={{ width: `${Math.min(100, (usedCount / limit) * 100)}%` }}
                                                />
                                            </div>
                                            <button
                                                onClick={() => onJumpAd?.(ad.id)}
                                                className={`w-full py-3 rounded-xl flex items-center justify-center gap-2 text-sm font-black transition-all active:scale-95 ${isExhausted ? 'bg-gray-900 text-white hover:bg-black shadow-lg shadow-gray-200' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-sm'}`}
                                            >
                                                <RefreshCw size={14} className={usedCount > 0 && !isExhausted ? 'animate-spin-slow' : ''} />
                                                {isExhausted ? '유료 점프 사용' : '무료 점프 실행'}
                                            </button>
                                            {isExhausted && jumpBalance > 0 && (
                                                <p className="text-[10px] text-center mt-2 font-bold text-gray-400 italic">
                                                    유료 잔여: {jumpBalance.toLocaleString()}회
                                                </p>
                                            )}
                                        </div>

                                        <div className="flex gap-2 w-full">
                                            <button onClick={() => onEditAd?.(ad)} className="flex-1 px-4 py-2 bg-white border border-gray-200 text-gray-600 text-[11px] md:text-xs font-bold rounded-xl hover:bg-gray-50 transition-all font-black">수정</button>
                                            {(() => {
                                                const isApprovedActive = ad.status !== 'rejected' && ad.status !== 'REJECTED' && ad.status !== 'PENDING_REVIEW' && ad.status !== 'pending';
                                                return (
                                                    <button
                                                        onClick={() => !isApprovedActive && onDeleteAd?.(ad.id)}
                                                        disabled={isApprovedActive}
                                                        className={`px-4 py-2 border text-[11px] md:text-xs font-bold rounded-xl transition-all font-black ${isApprovedActive ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed opacity-60' : 'bg-white border-red-100 text-red-500 hover:bg-red-50 cursor-pointer'}`}
                                                        title={isApprovedActive ? "게시 중인 공고는 삭제할 수 없습니다." : "공고 삭제"}
                                                    >
                                                        삭제
                                                    </button>
                                                );
                                            })()}
                                        </div>

                                        {/* ── 카드 리스트 이미지 변경 버튼 (전 등급 — 반려/종료 제외) ── */}
                                        {ad.status !== 'rejected' && ad.status !== 'REJECTED' && ad.status !== 'CLOSED' && ad.status !== 'closed' && (
                                            <button
                                                onClick={() => setCardImagePanelOpen(prev => ({ ...prev, [ad.id]: !prev[ad.id] }))}
                                                className={`w-full flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-[11px] font-black transition-all active:scale-95 border ${cardImagePanelOpen[ad.id]
                                                    ? 'bg-green-600 text-white border-green-600 shadow-md shadow-green-100'
                                                    : (cardImageUpdates[ad.id] || ad.options?.mediaUrl || ad.mediaUrl)
                                                        ? 'bg-green-50 text-green-600 border-green-200 hover:bg-green-100'
                                                        : 'bg-white text-green-600 border-green-200 hover:bg-green-50'
                                                }`}
                                            >
                                                <ImageIcon size={12} />
                                                {(cardImageUpdates[ad.id] || ad.options?.mediaUrl || ad.mediaUrl)
                                                    ? '카드 이미지 변경'
                                                    : '카드 이미지 등록'}
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* ── 카드 이미지 업로드 패널 (펼침) ── */}
                                {cardImagePanelOpen[ad.id] && (
                                    <CardImageUploadPanel
                                        adId={String(ad.id)}
                                        currentImageUrl={cardImageUpdates[ad.id] || ad.options?.mediaUrl || ad.mediaUrl || null}
                                        onSuccess={(url) => {
                                            setCardImageUpdates(prev => ({ ...prev, [ad.id]: url }));
                                        }}
                                    />
                                )}
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};
