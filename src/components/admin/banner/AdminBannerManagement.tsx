'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Image as ImageIcon, CheckCircle, XCircle, Clock, RefreshCw, MapPin, Tag } from 'lucide-react';
import { supabase } from '@/lib/supabase';

// ── 타입 ────────────────────────────────────────────────────────────────────
type BannerStatus = 'pending_banner' | 'approved' | 'rejected_banner';
type FilterTab = 'all' | BannerStatus;

interface BannerAd {
    id: number;
    name: string | null;
    title: string | null;
    banner_image_url: string;
    banner_media_type: string | null;
    banner_status: BannerStatus;
    banner_position: string | null;
    product_type: string | null;
    tier: string | null;
    created_at: string;
    user_id: string | null;
}

// ── 상수 ────────────────────────────────────────────────────────────────────
const TIER_LABEL: Record<string, { label: string; color: string }> = {
    grand:   { label: 'Grand(T1)',   color: 'bg-amber-500' },
    p1:      { label: 'Grand(T1)',   color: 'bg-amber-500' },
    premium: { label: 'Premium(T2)', color: 'bg-red-600' },
    p2:      { label: 'Premium(T2)', color: 'bg-red-600' },
    deluxe:  { label: 'Deluxe(T3)',  color: 'bg-blue-600' },
    p3:      { label: 'Deluxe(T3)',  color: 'bg-blue-600' },
    special: { label: 'Special(T4)', color: 'bg-emerald-600' },
    p4:      { label: 'Special(T4)', color: 'bg-emerald-600' },
};

// DB 허용값 기준: left / right / both / inner (chk_banner_position)
const POSITION_LABEL: Record<string, string> = {
    left:  '좌측 사이드바',
    right: '우측 사이드바',
    both:  '양쪽 사이드바 (좌+우)',
    inner: '내부 사이드바',
};

const STATUS_INFO: Record<FilterTab, { label: string; color: string; icon: React.ReactNode }> = {
    all:             { label: '전체',     color: 'bg-slate-600',   icon: <ImageIcon size={12} /> },
    pending_banner:  { label: '승인대기', color: 'bg-amber-500',   icon: <Clock size={12} /> },
    approved:        { label: '승인완료', color: 'bg-emerald-600', icon: <CheckCircle size={12} /> },
    rejected_banner: { label: '반려됨',   color: 'bg-red-600',     icon: <XCircle size={12} /> },
};

// ── 서브 컴포넌트 ────────────────────────────────────────────────────────────
const StatusBadge = ({ status }: { status: BannerStatus }) => {
    const info = STATUS_INFO[status] ?? STATUS_INFO.pending_banner;
    return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black text-white ${info.color}`}>
            {info.icon} {info.label}
        </span>
    );
};

// ── 메인 컴포넌트 ────────────────────────────────────────────────────────────
interface AdminBannerManagementProps {
    onCountChange?: (count: number) => void;
}

export const AdminBannerManagement = ({ onCountChange }: AdminBannerManagementProps) => {
    const [ads, setAds] = useState<BannerAd[]>([]);
    const [filter, setFilter] = useState<FilterTab>('pending_banner');
    const [isLoading, setIsLoading] = useState(true);
    const [processingId, setProcessingId] = useState<number | null>(null);
    const [rejectTarget, setRejectTarget] = useState<number | null>(null);
    const [rejectReason, setRejectReason] = useState('');
    const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
    const [savingPositionId, setSavingPositionId] = useState<number | null>(null);

    const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    };

    const fetchAds = useCallback(async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('shops')
                .select('id, name, title, banner_image_url, banner_media_type, banner_status, banner_position, product_type, tier, created_at, user_id')
                .not('banner_image_url', 'is', null)
                .not('banner_status', 'eq', 'none')
                .order('created_at', { ascending: false });

            if (error) throw error;

            const result = (data || []) as BannerAd[];
            setAds(result);
            const pending = result.filter(a => a.banner_status === 'pending_banner').length;
            onCountChange?.(pending);
        } catch (err: any) {
            console.error('[AdminBannerManagement] fetch error:', err.message);
        } finally {
            setIsLoading(false);
        }
    }, [onCountChange]);

    useEffect(() => { fetchAds(); }, [fetchAds]);

    const handleAction = async (adId: number, action: 'approve' | 'reject', reason?: string) => {
        setProcessingId(adId);
        try {
            const { data: sessionData } = await supabase.auth.getSession();
            const token = sessionData.session?.access_token;

            const res = await fetch('/api/admin/banner-approve', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify({ adId: String(adId), action, rejectReason: reason }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || '처리 실패');

            showToast(action === 'approve' ? '배너 승인 완료 ✅' : '배너 반려 완료', action === 'approve' ? 'success' : 'error');
            setRejectTarget(null);
            setRejectReason('');
            await fetchAds();
        } catch (err: any) {
            showToast(`오류: ${err.message}`, 'error');
        } finally {
            setProcessingId(null);
        }
    };

    const handlePositionChange = async (adId: number, newPosition: string) => {
        setSavingPositionId(adId);
        try {
            const { error } = await supabase
                .from('shops')
                .update({ banner_position: newPosition, updated_at: new Date().toISOString() })
                .eq('id', adId);
            if (error) throw error;
            setAds(prev => prev.map(a => a.id === adId ? { ...a, banner_position: newPosition } : a));
            showToast(`위치 변경: ${POSITION_LABEL[newPosition] || newPosition} ✅`);
        } catch (err: any) {
            showToast(`위치 변경 실패: ${err.message}`, 'error');
        } finally {
            setSavingPositionId(null);
        }
    };

    const filtered = filter === 'all' ? ads : ads.filter(a => a.banner_status === filter);

    const counts: Record<FilterTab, number> = {
        all:             ads.length,
        pending_banner:  ads.filter(a => a.banner_status === 'pending_banner').length,
        approved:        ads.filter(a => a.banner_status === 'approved').length,
        rejected_banner: ads.filter(a => a.banner_status === 'rejected_banner').length,
    };

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20 relative">
            {/* Toast */}
            {toast && (
                <div className={`fixed top-6 right-6 z-[99999] px-5 py-3 rounded-2xl text-white font-black text-sm shadow-2xl transition-all ${toast.type === 'success' ? 'bg-emerald-600' : 'bg-red-600'}`}>
                    {toast.msg}
                </div>
            )}

            {/* 헤더 */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-3xl font-black text-slate-950 tracking-tighter">
                        배너 슬롯 관리 <span className="text-blue-600">.</span>
                    </h2>
                    <p className="text-slate-400 text-xs font-bold mt-1">
                        업체에서 업로드한 배너 이미지를 검토하고 승인/반려 처리합니다.
                    </p>
                </div>
                <button
                    onClick={fetchAds}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-black text-xs rounded-xl transition-all active:scale-95"
                >
                    <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
                    새로고침
                </button>
            </div>

            {/* 필터 탭 */}
            <div className="flex gap-2 mb-6 flex-wrap">
                {(Object.keys(STATUS_INFO) as FilterTab[]).map(tab => (
                    <button
                        key={tab}
                        onClick={() => setFilter(tab)}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black transition-all ${filter === tab ? `${STATUS_INFO[tab].color} text-white shadow-lg` : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                    >
                        {STATUS_INFO[tab].icon}
                        {STATUS_INFO[tab].label}
                        <span className={`px-1.5 py-0.5 rounded-lg text-[9px] font-black ${filter === tab ? 'bg-white/20' : 'bg-slate-200'}`}>
                            {counts[tab]}
                        </span>
                    </button>
                ))}
            </div>

            {/* 로딩 */}
            {isLoading && (
                <div className="flex items-center justify-center py-20">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                </div>
            )}

            {/* 빈 상태 */}
            {!isLoading && filtered.length === 0 && (
                <div className="text-center py-20 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    <ImageIcon size={40} className="mx-auto text-slate-300 mb-3" />
                    <p className="text-slate-400 font-black text-sm">
                        {filter === 'pending_banner' ? '승인 대기 중인 배너가 없습니다.' : '해당 상태의 배너가 없습니다.'}
                    </p>
                </div>
            )}

            {/* 카드 그리드 */}
            {!isLoading && filtered.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filtered.map(ad => {
                        const tierKey = (ad.product_type || ad.tier || '').toLowerCase();
                        const tierInfo = TIER_LABEL[tierKey];
                        const posLabel = POSITION_LABEL[ad.banner_position || ''] || ad.banner_position || '미지정';
                        const isVideo = ad.banner_media_type === 'video';
                        const isProcessing = processingId === ad.id;

                        return (
                            <div key={ad.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
                                {/* 배너 이미지 미리보기 */}
                                <div className="relative w-full h-[160px] bg-slate-100 overflow-hidden shrink-0">
                                    {isVideo ? (
                                        <video
                                            src={ad.banner_image_url}
                                            className="w-full h-full object-cover"
                                            muted
                                            autoPlay
                                            loop
                                            playsInline
                                        />
                                    ) : (
                                        <img
                                            src={ad.banner_image_url}
                                            alt={ad.title || ad.name || '배너'}
                                            className="w-full h-full object-cover"
                                        />
                                    )}
                                    {/* 상태 배지 오버레이 */}
                                    <div className="absolute top-2 right-2">
                                        <StatusBadge status={ad.banner_status} />
                                    </div>
                                    {isVideo && (
                                        <div className="absolute bottom-2 left-2 bg-black/60 text-white text-[9px] font-black px-1.5 py-0.5 rounded-md">VIDEO</div>
                                    )}
                                </div>

                                {/* 정보 영역 */}
                                <div className="p-3 flex flex-col gap-2 flex-1">
                                    <div>
                                        <p className="text-[12px] font-black text-slate-900 truncate leading-tight">
                                            {ad.name || ad.title || `ID ${ad.id}`}
                                        </p>
                                        <p className="text-[10px] text-slate-400 font-bold truncate mt-0.5">
                                            {ad.title || '제목 없음'}
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-1.5 flex-wrap">
                                        {tierInfo && (
                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black text-white ${tierInfo.color}`}>
                                                <Tag size={8} /> {tierInfo.label}
                                            </span>
                                        )}
                                        <div className="flex items-center gap-1 min-w-0">
                                            <MapPin size={8} className="text-slate-400 shrink-0" />
                                            <select
                                                value={ad.banner_position || ''}
                                                onChange={e => handlePositionChange(ad.id, e.target.value)}
                                                disabled={savingPositionId === ad.id}
                                                className="text-[9px] font-black bg-slate-100 text-slate-600 border-0 rounded-lg px-1.5 py-0.5 outline-none cursor-pointer hover:bg-slate-200 transition disabled:opacity-50"
                                            >
                                                <option value="">미지정</option>
                                                <option value="both">양쪽 사이드바</option>
                                                <option value="left">좌측 사이드바</option>
                                                <option value="right">우측 사이드바</option>
                                                <option value="inner">내부 배너</option>
                                            </select>
                                            {savingPositionId === ad.id && (
                                                <span className="text-[8px] text-slate-400 animate-pulse">저장 중...</span>
                                            )}
                                        </div>
                                    </div>

                                    <p className="text-[9px] text-slate-300 font-bold">
                                        {new Date(ad.created_at).toLocaleDateString('ko-KR', { timeZone: 'Asia/Seoul' })} 등록
                                    </p>

                                    {/* 반려 사유 입력 (반려 버튼 클릭 시 인라인 표시) */}
                                    {rejectTarget === ad.id && (
                                        <div className="mt-1 space-y-1.5">
                                            <textarea
                                                value={rejectReason}
                                                onChange={e => setRejectReason(e.target.value)}
                                                placeholder="반려 사유 입력 (선택)"
                                                rows={2}
                                                className="w-full text-[11px] font-bold border border-slate-200 rounded-xl px-3 py-2 resize-none outline-none focus:ring-2 focus:ring-red-400/30 bg-slate-50"
                                            />
                                            <div className="flex gap-1.5">
                                                <button
                                                    onClick={() => handleAction(ad.id, 'reject', rejectReason)}
                                                    disabled={isProcessing}
                                                    className="flex-1 py-2 bg-red-600 text-white text-[11px] font-black rounded-xl hover:bg-red-700 transition-all disabled:opacity-50 active:scale-95"
                                                >
                                                    {isProcessing ? '처리 중...' : '반려 확정'}
                                                </button>
                                                <button
                                                    onClick={() => { setRejectTarget(null); setRejectReason(''); }}
                                                    className="flex-1 py-2 bg-slate-100 text-slate-600 text-[11px] font-black rounded-xl hover:bg-slate-200 transition-all active:scale-95"
                                                >
                                                    취소
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {/* 승인/반려 버튼 (pending_banner 상태만) */}
                                    {ad.banner_status === 'pending_banner' && rejectTarget !== ad.id && (
                                        <div className="flex gap-1.5 mt-auto pt-1">
                                            <button
                                                onClick={() => handleAction(ad.id, 'approve')}
                                                disabled={isProcessing}
                                                className="flex-1 flex items-center justify-center gap-1 py-2 bg-emerald-600 text-white text-[11px] font-black rounded-xl hover:bg-emerald-700 transition-all disabled:opacity-50 active:scale-95"
                                            >
                                                {isProcessing ? (
                                                    <span className="animate-spin rounded-full h-3 w-3 border-b-2 border-white" />
                                                ) : (
                                                    <><CheckCircle size={12} /> 승인</>
                                                )}
                                            </button>
                                            <button
                                                onClick={() => setRejectTarget(ad.id)}
                                                disabled={isProcessing}
                                                className="flex-1 flex items-center justify-center gap-1 py-2 bg-slate-100 text-red-600 text-[11px] font-black rounded-xl hover:bg-red-50 hover:border hover:border-red-200 transition-all disabled:opacity-50 active:scale-95"
                                            >
                                                <XCircle size={12} /> 반려
                                            </button>
                                        </div>
                                    )}

                                    {/* 이미 처리된 상태 표시 */}
                                    {ad.banner_status === 'approved' && (
                                        <div className="flex items-center gap-1 py-2 text-emerald-600 text-[11px] font-black mt-auto pt-1">
                                            <CheckCircle size={13} /> 사이드바 게재 중
                                        </div>
                                    )}
                                    {ad.banner_status === 'rejected_banner' && (
                                        <div className="flex items-center gap-1 py-2 text-red-500 text-[11px] font-black mt-auto pt-1">
                                            <XCircle size={13} /> 반려됨 (이미지 삭제)
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};
