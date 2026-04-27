'use client';

import React, { useState, useEffect } from 'react';
import {
    XCircle,
    Save,
    Image as ImageIcon,
    Loader2,
    CheckCircle2,
    AlertCircle,
    ChevronRight,
} from 'lucide-react';

interface User {
    id: string;
    name?: string;
    full_name?: string;
    phone?: string;
    nickname?: string;
    business_name?: string;
}

interface Shop {
    id: number;
    name: string;
    title: string;
    tier: string;
    product_type: string;
    region: string;
    work_region_sub: string;
    status: string;
    banner_status: string | null;
    banner_image_url: string | null;
    banner_position: string | null;
}

interface AdminAdRegistrationModalProps {
    user: User;
    onClose: () => void;
    fetchData: () => void;
}

const TIER_LABEL: Record<string, string> = {
    // altId 형식 (grand/premium/...)
    grand: '그랜드',   premium: '프리미엄', deluxe: '디럭스',
    special: '스페셜', urgent: '급구/추천', recommended: '급구/추천',
    native: '네이티브', basic: '베이직',
    // DB 저장 형식 (p1/p2/...)
    p1: '그랜드',  p2: '프리미엄', p3: '디럭스',
    p4: '스페셜',  p5: '급구/추천', p6: '네이티브',
    p7: '베이직',  p7e: '베이직',
};

const TIER_COLOR: Record<string, string> = {
    grand: 'bg-yellow-100 text-yellow-700',   p1: 'bg-yellow-100 text-yellow-700',
    premium: 'bg-blue-100 text-blue-700',     p2: 'bg-blue-100 text-blue-700',
    deluxe: 'bg-purple-100 text-purple-700',  p3: 'bg-purple-100 text-purple-700',
    special: 'bg-green-100 text-green-700',   p4: 'bg-green-100 text-green-700',
    urgent: 'bg-orange-100 text-orange-700',  p5: 'bg-orange-100 text-orange-700',
    recommended: 'bg-orange-100 text-orange-700',
};

// OngoingAdsView.tsx의 BANNER_ELIGIBLE_TIERS와 동일하게 유지 (PATTERN-07 기준)
const BANNER_ELIGIBLE = ['grand', 'premium', 'deluxe', 'special', 'p1', 'p2', 'p3', 'p4'];

// DB chk_banner_position 허용값: 'left' | 'right' | 'both' | 'inner' (NULL 포함)
// BannerSidebar.tsx도 동일 값 기준으로 필터링 중 — 반드시 일치시킬 것
const POSITION_OPTIONS = [
    { value: 'both',  label: '양쪽 사이드바 동시', desc: '그랜드 전용 (좌+우)' },
    { value: 'left',  label: '좌측 사이드바',       desc: '그랜드/프리미엄' },
    { value: 'right', label: '우측 사이드바',        desc: '그랜드/프리미엄' },
    { value: 'inner', label: '내부 사이드바',        desc: '디럭스/스페셜' },
];

export function AdminAdRegistrationModal({ user, onClose, fetchData }: AdminAdRegistrationModalProps) {
    const [shops, setShops] = useState<Shop[]>([]);
    const [isLoadingShops, setIsLoadingShops] = useState(true);
    const [loadError, setLoadError] = useState('');

    const [selectedShopId, setSelectedShopId] = useState<number | null>(null);
    const [mediaUrl, setMediaUrl] = useState('');
    const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
    const [bannerPosition, setBannerPosition] = useState('');

    const [isUploading, setIsUploading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const selectedShop = shops.find(s => s.id === selectedShopId) || null;

    // ── 공고 목록 로드 ──────────────────────────────────────────────
    useEffect(() => {
        const load = async () => {
            setIsLoadingShops(true);
            try {
                const res = await fetch(`/api/admin/get-user-shops?userId=${encodeURIComponent(user.id)}`);
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || '공고 목록 로드 실패');
                setShops(data.shops || []);
            } catch (e: any) {
                setLoadError(e.message);
            } finally {
                setIsLoadingShops(false);
            }
        };
        load();
    }, [user.id]);

    // ── 파일 업로드 ─────────────────────────────────────────────────
    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const isVideo = file.type.startsWith('video/');
        setMediaType(isVideo ? 'video' : 'image');

        setIsUploading(true);
        try {
            const form = new FormData();
            form.append('file', file);
            form.append('bucket', 'job-images');
            form.append('folder', 'banners');

            const res = await fetch('/api/admin/upload-image', { method: 'POST', body: form });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || '업로드 실패');
            setMediaUrl(data.publicUrl);
        } catch (e: any) {
            alert(`업로드 실패: ${e.message}`);
        } finally {
            setIsUploading(false);
        }
    };

    // ── 저장 ────────────────────────────────────────────────────────
    const handleSave = async () => {
        if (!selectedShopId) { alert('공고를 선택해주세요.'); return; }
        if (!mediaUrl)        { alert('배너 이미지/영상을 업로드해주세요.'); return; }
        if (!bannerPosition)  { alert('배너 위치를 선택해주세요.'); return; }

        setIsSaving(true);
        try {
            const res = await fetch('/api/admin/set-banner', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    shopId: selectedShopId,
                    bannerImageUrl: mediaUrl,
                    bannerPosition,
                    bannerMediaType: mediaType,
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || '저장 실패');

            alert(`배너가 즉시 활성화되었습니다.\n공고: ${selectedShop?.title}`);
            fetchData();
            onClose();
        } catch (e: any) {
            alert(`오류: ${e.message}`);
        } finally {
            setIsSaving(false);
        }
    };

    // PATTERN-07: DB raw값 기준 tier 추출 (p1~p7e 또는 altId 형식 모두 대응)
    const getTier = (s: Shop) =>
        (s.tier || s.product_type || '').toLowerCase();

    const eligibleShops   = shops.filter(s => BANNER_ELIGIBLE.includes(getTier(s)));
    const ineligibleShops = shops.filter(s => !BANNER_ELIGIBLE.includes(getTier(s)));

    return (
        <div className="fixed inset-0 z-[10030] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={onClose} />

            <div className="bg-white w-full max-w-2xl rounded-[32px] shadow-2xl relative z-10 flex flex-col max-h-[90vh] overflow-hidden">

                {/* Header */}
                <div className="px-8 py-6 bg-slate-950 text-white flex items-center justify-between shrink-0">
                    <div>
                        <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Banner Registration</p>
                        <h3 className="text-lg font-black">
                            <span className="text-blue-400">{user.business_name || user.name || user.full_name}</span>
                            <span className="text-slate-300 font-medium"> 님 배너 등록</span>
                        </h3>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                        <XCircle size={26} />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-8 space-y-8">

                    {/* ── Step 1: 공고 선택 ── */}
                    <section className="space-y-3">
                        <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-black flex items-center justify-center">1</span>
                            <h4 className="text-sm font-black text-slate-900">배너를 연결할 공고 선택</h4>
                        </div>

                        {isLoadingShops && (
                            <div className="flex items-center gap-2 text-slate-400 text-sm py-4">
                                <Loader2 size={16} className="animate-spin" /> 공고 목록 불러오는 중...
                            </div>
                        )}

                        {loadError && (
                            <div className="flex items-center gap-2 text-red-500 text-sm py-2">
                                <AlertCircle size={16} /> {loadError}
                            </div>
                        )}

                        {!isLoadingShops && !loadError && shops.length === 0 && (
                            <div className="text-slate-400 text-sm py-4 text-center bg-slate-50 rounded-2xl">
                                등록된 공고가 없습니다.
                            </div>
                        )}

                        {/* 배너 가능 공고 */}
                        {eligibleShops.length > 0 && (
                            <div className="space-y-2">
                                {eligibleShops.map(shop => {
                                    const tier = getTier(shop);
                                    const isSelected = selectedShopId === shop.id;
                                    const hasBanner = shop.banner_status === 'approved';
                                    return (
                                        <button
                                            key={shop.id}
                                            type="button"
                                            onClick={() => {
                                                setSelectedShopId(shop.id);
                                                // 기존 배너 있으면 URL 프리로드
                                                if (shop.banner_image_url) setMediaUrl(shop.banner_image_url);
                                                if (shop.banner_position) setBannerPosition(shop.banner_position);
                                            }}
                                            className={`w-full text-left px-5 py-4 rounded-2xl border-2 transition-all flex items-center gap-4 ${
                                                isSelected
                                                    ? 'border-blue-500 bg-blue-50'
                                                    : 'border-slate-200 bg-white hover:border-blue-200'
                                            }`}
                                        >
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${TIER_COLOR[tier] || 'bg-slate-100 text-slate-600'}`}>
                                                        {TIER_LABEL[tier] || tier}
                                                    </span>
                                                    {hasBanner && (
                                                        <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                                                            배너 활성
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-sm font-black text-slate-900 truncate">{shop.title}</p>
                                                <p className="text-xs text-slate-400 font-medium">{shop.name} · {shop.region} {shop.work_region_sub}</p>
                                            </div>
                                            {isSelected
                                                ? <CheckCircle2 size={20} className="text-blue-500 shrink-0" />
                                                : <ChevronRight size={18} className="text-slate-300 shrink-0" />
                                            }
                                        </button>
                                    );
                                })}
                            </div>
                        )}

                        {/* 배너 불가 공고 (참고용) */}
                        {ineligibleShops.length > 0 && (
                            <details className="mt-2">
                                <summary className="text-xs text-slate-400 font-bold cursor-pointer select-none">
                                    배너 불가 공고 {ineligibleShops.length}건 보기 (그랜드/프리미엄/디럭스 외)
                                </summary>
                                <div className="mt-2 space-y-1">
                                    {ineligibleShops.map(shop => (
                                        <div key={shop.id} className="px-4 py-3 rounded-xl bg-slate-50 border border-slate-100 opacity-50">
                                            <p className="text-xs font-bold text-slate-600 truncate">{shop.title}</p>
                                            <p className="text-[10px] text-slate-400">{shop.tier || shop.product_type} · {shop.region}</p>
                                        </div>
                                    ))}
                                </div>
                            </details>
                        )}
                    </section>

                    {/* ── Step 2: 배너 업로드 ── */}
                    <section className="space-y-3">
                        <div className="flex items-center gap-2">
                            <span className={`w-6 h-6 rounded-full text-white text-xs font-black flex items-center justify-center ${selectedShopId ? 'bg-blue-600' : 'bg-slate-300'}`}>2</span>
                            <h4 className={`text-sm font-black ${selectedShopId ? 'text-slate-900' : 'text-slate-400'}`}>배너 이미지 / 영상 업로드</h4>
                        </div>

                        {/* 슬롯별 권장 사이즈 안내 */}
                        <div className="grid grid-cols-2 gap-2">
                            {[
                                { pos: '좌/우 사이드바',   size: '320 × 280px',  ratio: '8:5', desc: '풀 오버레이 (그랜드/프리미엄)' },
                                { pos: '사이드바 이미지',  size: '320 × 160px',  ratio: '2:1', desc: '이미지 섹션만 (그랜드/프리미엄)' },
                                { pos: '그랜드/프리미엄 카드', size: '800 × 600px', ratio: '4:3', desc: '등급별 리스트 카드 썸네일' },
                                { pos: '디럭스/스페셜 카드',   size: '600 × 450px', ratio: '4:3', desc: '등급별 리스트 카드 썸네일' },
                                { pos: '내부 배너',        size: '800 × 200px',  ratio: '4:1', desc: '메인 컨텐츠 내부 배너' },
                            ].map(item => (
                                <div key={item.pos} className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 space-y-0.5">
                                    <p className="text-[10px] font-black text-slate-700">{item.pos}</p>
                                    <p className="text-[12px] font-black text-blue-600 tracking-tight">{item.size}</p>
                                    <p className="text-[9px] text-slate-400 font-bold">비율 {item.ratio} · {item.desc}</p>
                                </div>
                            ))}
                            <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5 space-y-0.5 flex flex-col justify-center">
                                <p className="text-[10px] font-black text-amber-700">포맷 안내</p>
                                <p className="text-[10px] text-amber-600 font-bold">JPG · PNG · GIF · MP4</p>
                                <p className="text-[9px] text-amber-500 font-bold">MP4 권장 5MB 이하</p>
                            </div>
                        </div>

                        <div className={`rounded-2xl border-2 border-dashed p-5 transition-all ${mediaUrl ? 'border-blue-300 bg-blue-50/30' : 'border-slate-200 bg-slate-50'} ${!selectedShopId ? 'opacity-40 pointer-events-none' : ''}`}>
                            <div className="flex gap-5 items-center">
                                {/* 프리뷰 */}
                                <div className="w-32 h-24 rounded-xl border border-slate-200 bg-white overflow-hidden shrink-0 flex items-center justify-center">
                                    {mediaUrl ? (
                                        mediaType === 'video'
                                            ? <video src={mediaUrl} className="w-full h-full object-cover" muted loop autoPlay playsInline />
                                            : <img src={mediaUrl} alt="preview" className="w-full h-full object-cover" />
                                    ) : (
                                        <ImageIcon size={24} className="text-slate-300" />
                                    )}
                                </div>
                                <div className="flex-1 space-y-2">
                                    {mediaUrl && (
                                        <p className="text-[10px] text-blue-600 font-bold break-all">{mediaUrl}</p>
                                    )}
                                    <label className={`inline-flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-black cursor-pointer transition active:scale-95 shadow ${isUploading ? 'bg-slate-200 text-slate-400 pointer-events-none' : 'bg-slate-900 text-white hover:bg-slate-700'}`}>
                                        {isUploading ? <><Loader2 size={14} className="animate-spin" /> 업로드 중...</> : <><ImageIcon size={14} /> {mediaUrl ? '파일 변경' : '파일 선택'}</>}
                                        <input
                                            type="file"
                                            accept="image/*,video/*"
                                            className="hidden"
                                            onChange={handleFileUpload}
                                            disabled={isUploading}
                                        />
                                    </label>
                                    <p className="text-[10px] text-slate-400 font-medium">위 슬롯 사이즈에 맞게 제작 후 업로드 · 승인 즉시 활성화</p>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* ── Step 3: 위치 선택 ── */}
                    <section className="space-y-3">
                        <div className="flex items-center gap-2">
                            <span className={`w-6 h-6 rounded-full text-white text-xs font-black flex items-center justify-center ${mediaUrl ? 'bg-blue-600' : 'bg-slate-300'}`}>3</span>
                            <h4 className={`text-sm font-black ${mediaUrl ? 'text-slate-900' : 'text-slate-400'}`}>배너 노출 위치</h4>
                        </div>

                        <div className={`grid grid-cols-2 gap-2 ${!mediaUrl ? 'opacity-40 pointer-events-none' : ''}`}>
                            {POSITION_OPTIONS.map(opt => (
                                <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() => setBannerPosition(opt.value)}
                                    className={`flex flex-col items-center justify-center py-4 px-3 rounded-2xl border-2 transition-all ${
                                        bannerPosition === opt.value
                                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                                            : 'border-slate-200 bg-white text-slate-500 hover:border-blue-200'
                                    }`}
                                >
                                    <span className="text-[12px] font-black">{opt.label}</span>
                                    <span className="text-[10px] mt-0.5 opacity-60">{opt.desc}</span>
                                </button>
                            ))}
                        </div>
                    </section>

                    {/* ── 요약 확인 ── */}
                    {selectedShop && mediaUrl && bannerPosition && (
                        <section className="bg-slate-950 text-white rounded-2xl px-6 py-5 space-y-2">
                            <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">적용 요약</p>
                            <p className="text-sm font-bold truncate">📋 {selectedShop.title}</p>
                            <p className="text-sm font-bold">📍 {POSITION_OPTIONS.find(o => o.value === bannerPosition)?.label}</p>
                            <p className="text-sm font-bold">🖼 {mediaType === 'video' ? '영상(MP4/GIF)' : '이미지'} 배너</p>
                            <p className="text-[11px] text-green-400 font-black mt-1">✓ 어드민 직접 배정 → 즉시 활성화 (승인 절차 없음)</p>
                        </section>
                    )}
                </div>

                {/* Footer */}
                <div className="px-8 py-5 border-t border-slate-100 bg-white flex gap-3 shrink-0">
                    <button
                        onClick={onClose}
                        className="flex-1 py-3.5 bg-slate-100 text-slate-500 rounded-2xl text-sm font-black hover:bg-slate-200 transition active:scale-95"
                    >
                        취소
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving || !selectedShopId || !mediaUrl || !bannerPosition}
                        className="flex-[2] py-3.5 bg-blue-600 text-white rounded-2xl text-sm font-black shadow-lg shadow-blue-200 hover:bg-blue-700 transition active:scale-95 flex items-center justify-center gap-2 disabled:opacity-40 disabled:pointer-events-none"
                    >
                        {isSaving ? <><Loader2 size={16} className="animate-spin" /> 적용 중...</> : <><Save size={16} /> 배너 즉시 활성화</>}
                    </button>
                </div>
            </div>
        </div>
    );
}
