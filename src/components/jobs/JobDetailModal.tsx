'use client';

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Star, MapPin, Briefcase, Info, MessageSquare, Phone, MessageCircle, Flag, ClipboardList, CheckCircle, Loader2, Camera } from 'lucide-react';
import { toPng } from 'html-to-image';
import { supabase } from '@/lib/supabase';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
import { Shop } from '@/types/shop';
import ShopDetailView from './ShopDetailView';
import { formatKoreanMoney } from '@/utils/formatMoney';
import { getHighlighterStyle } from '@/utils/highlighter';
import { cleanShopTitle, generateSEOKeywords } from '@/utils/shopUtils';
import { ICONS } from '@/constants/job-options';
import { useBrand } from '@/components/BrandProvider';
import { AD_TIER_STANDARDS } from '@/constants/standards';
import { getCategoryWorkTypeSlugs, WORK_TYPE_INFO } from '@/lib/data/work-type-guide';
import Link from 'next/link';
import { getPayColor, getPayAbbreviation } from '@/utils/payColors';
import { ReportAdModal } from '@/components/common/ReportAdModal';
import { useAuth } from '@/hooks/useAuth';
import { useAdultGate } from '@/hooks/useAdultGate';

/**
 * Kakao Maps SDK 로더 — autoload=false + 명시적 kakao.maps.load() 패턴
 *
 * [autoload=true 폐기 이유]
 *   autoload=true 상태에서 kakao.maps.load()는 no-op → 콜백 미실행 → Promise 무한 대기
 *   → 지도 미표시(에러도 없음). PC/모바일 공통 발생. autoload=false만 안정적.
 *
 * [기존 script 존재 시]
 *   setInterval 100ms 폴링으로 maps.services 초기화 대기 (무한루프 안전)
 */
const loadKakaoMapSdk = (): Promise<void> =>
    new Promise((resolve, reject) => {
        // 이미 초기화 완료
        if ((window as any).kakao?.maps?.services) { resolve(); return; }

        const key = process.env.NEXT_PUBLIC_KAKAO_MAP_KEY;
        if (!key) { reject(new Error('NEXT_PUBLIC_KAKAO_MAP_KEY 미설정')); return; }

        const TIMEOUT_MS = 15000;
        let settled = false;
        const settle = (fn: () => void) => { if (!settled) { settled = true; fn(); } };
        const timeoutId = setTimeout(() => settle(() => reject(new Error('카카오 지도 로딩 시간 초과'))), TIMEOUT_MS);

        const existing = document.querySelector(`script[src*="dapi.kakao.com"]`);
        if (existing) {
            // 스크립트는 있지만 아직 초기화 안 됨 → setInterval 폴링
            const poll = setInterval(() => {
                if ((window as any).kakao?.maps?.services) {
                    clearTimeout(timeoutId);
                    clearInterval(poll);
                    settle(resolve);
                }
            }, 100);
            return;
        }

        // 신규 스크립트 삽입 — autoload=false로 controlled 초기화
        const script = document.createElement('script');
        script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${key}&libraries=services&autoload=false`;
        script.async = true;
        script.onload = () => {
            const kakao = (window as any).kakao;
            if (!kakao?.maps?.load) {
                settle(() => reject(new Error('kakao.maps.load 없음 — SDK 로드 실패')));
                return;
            }
            // autoload=false: maps.load() 호출 시 services 포함 초기화
            kakao.maps.load(() => {
                clearTimeout(timeoutId);
                if ((window as any).kakao?.maps?.services) {
                    settle(resolve);
                } else {
                    settle(() => reject(new Error('카카오 지도 서비스 초기화 실패')));
                }
            });
        };
        script.onerror = () => {
            clearTimeout(timeoutId);
            settle(() => reject(new Error('카카오 지도 스크립트 로드 실패 (네트워크/도메인 인증 확인)')));
        };
        document.head.appendChild(script);
    });

interface JobDetailModalProps {
    shop: Shop;
    onClose: () => void;
    isFavorite: boolean;
    onToggleFavorite: (e: React.MouseEvent) => void;
}

// [Optimization] Detached Content for SEO & Portal usage
interface JobDetailContentProps {
    shop: Shop;
    publisherAddress?: string | null;
    onClose?: () => void;
    isFavorite?: boolean;
    onToggleFavorite?: (e: React.MouseEvent) => void;
}

export const JobDetailContent = ({
    shop, publisherAddress,
    onClose = () => window.history.back(),
    isFavorite = false,
    onToggleFavorite = () => {},
}: JobDetailContentProps) => {
    const [showReport, setShowReport] = useState(false);
    const { user, userType, isLoggedIn } = useAuth();
    const { requireVerification } = useAdultGate();
    const [showApplyForm, setShowApplyForm] = useState(false);
    const [applyName, setApplyName] = useState('');
    const [applyPhone, setApplyPhone] = useState('');
    const [applyMsg, setApplyMsg] = useState('');
    const [applying, setApplying] = useState(false);
    const [applied, setApplied] = useState(false);
    const [isCapturing, setIsCapturing] = useState(false);
    const modalRef = React.useRef<HTMLDivElement>(null);

    // [Fix 5] Kakao Map — address 해소 + 지도 렌더링
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const [mapError, setMapError] = useState<string | null>(null);
    const [resolvedAddress, setResolvedAddress] = useState<string | null>(publisherAddress || null);

    useEffect(() => {
        // 1순위: 상위 컴포넌트가 넘긴 주소 (profiles 직접 조회 결과)
        if (publisherAddress) { setResolvedAddress(publisherAddress); return; }
        // 2순위: shop.businessAddress (enrichAdData 또는 anyAdToShop이 options.businessAddress 포함하여 정제한 값)
        const shopAddr = (shop as any).businessAddress || (shop as any).options?.businessAddress;
        if (shopAddr) { setResolvedAddress(shopAddr); return; }
        // 3순위: profiles 직접 조회 fallback
        const userId = (shop as any).user_id;
        if (!userId) return;
        supabase.from('profiles')
            .select('business_address, business_address_detail')
            .eq('id', userId)
            .single()
            .then(({ data }) => {
                if (data?.business_address) {
                    const detail = (data as any).business_address_detail;
                    setResolvedAddress(detail ? `${data.business_address} ${detail}` : data.business_address);
                }
            });
    }, [(shop as any).user_id, publisherAddress, (shop as any).businessAddress]);

    useEffect(() => {
        if (!resolvedAddress || !mapContainerRef.current) return;
        let cancelled = false;
        loadKakaoMapSdk()
            .then(() => {
                if (cancelled || !mapContainerRef.current) return;
                const kakao = (window as any).kakao;
                const geocoder = new kakao.maps.services.Geocoder();

                const renderMap = (y: string, x: string) => {
                    if (cancelled || !mapContainerRef.current) return;
                    const coords = new kakao.maps.LatLng(y, x);
                    const map = new kakao.maps.Map(mapContainerRef.current, { center: coords, level: 4 });
                    new kakao.maps.Marker({ map, position: coords });
                };

                geocoder.addressSearch(resolvedAddress, (result: any[], status: string) => {
                    if (cancelled || !mapContainerRef.current) return;
                    if (status === kakao.maps.services.Status.OK && result[0]) {
                        renderMap(result[0].y, result[0].x);
                        return;
                    }
                    // [Fix] 상세호수 제거 후 재시도 — "302,303호" 같은 쉼표 포함 상세주소는 geocoder 실패 유발
                    // 패턴: 마지막 공백+숫자(쉼표 포함)+한국어 단위(호/층/동/관/실) 제거
                    const baseAddr = resolvedAddress.replace(/\s+[\d,]+[호층동관실]+[\d,호층]*\s*$/, '').trim();
                    if (baseAddr && baseAddr !== resolvedAddress) {
                        geocoder.addressSearch(baseAddr, (result2: any[], status2: string) => {
                            if (cancelled || !mapContainerRef.current) return;
                            if (status2 === kakao.maps.services.Status.OK && result2[0]) {
                                renderMap(result2[0].y, result2[0].x);
                            } else {
                                setMapError('주소를 지도에서 찾을 수 없습니다.');
                            }
                        });
                    } else {
                        setMapError('주소를 지도에서 찾을 수 없습니다.');
                    }
                });
            })
            .catch(err => { if (!cancelled) setMapError(err.message || '지도를 불러오지 못했습니다.'); });
        return () => { cancelled = true; };
    }, [resolvedAddress]);

    // CENTRALIZED THEME LOGIC
    const productType = shop.productType || shop.tier || 'p7';
    const pt = String(productType).toLowerCase();
    // 'urgent'는 AD_TIER_STANDARDS altId에 없으므로 선처리 (2026-03-22)
    const isUrgentTier = pt.includes('urgent');
    const tierStandard = isUrgentTier
        ? { id: 'urgent' }
        : (AD_TIER_STANDARDS.find(s => pt.includes(s.id) || pt.includes(s.altId)) || AD_TIER_STANDARDS[6]);

    // v2.0 — AD_TIER_STANDARDS 동기화 + 배지 흰색 통일 (2026-03-22)
    // [Fix 6] MobilePreviewContent.tsx TIER_STYLE_MAP 기준으로 통일 (2026-04-09)
    const getHeaderTheme = (tid: string) => {
        switch (tid) {
            case 'p1':     return { bg: "from-amber-400 via-orange-500 to-amber-600", accent: "text-amber-500",   badge: "bg-white/20" }; // Grand
            case 'p2':     return { bg: "from-red-500 to-blue-700",                   accent: "text-red-600",     badge: "bg-white/20" }; // Premium
            case 'p3':     return { bg: "from-blue-500 to-indigo-600",                accent: "text-blue-600",    badge: "bg-white/20" }; // Deluxe
            case 'p4':     return { bg: "from-emerald-400 to-teal-600",               accent: "text-emerald-600", badge: "bg-white/20" }; // Special
            case 'p5':     return { bg: "from-purple-500 to-violet-600",              accent: "text-purple-500",  badge: "bg-white/20" }; // Recommended 🟣
            case 'p6':     return { bg: "from-slate-400 to-gray-600",                 accent: "text-slate-500",   badge: "bg-white/20" }; // Native
            case 'urgent': return { bg: "from-purple-500 to-violet-600",              accent: "text-purple-500",  badge: "bg-white/20" }; // Urgent 🟣
            default:       return { bg: "from-slate-500 via-blue-600 to-slate-700",    accent: "text-blue-300",    badge: "bg-white/20" }; // Basic (p7)
        }
    };

    const themeConfig = getHeaderTheme(tierStandard.id);
    const headerBg = themeConfig.bg;

    const handleCapture = async () => {
        if (!modalRef.current) return;
        setIsCapturing(true);
        await new Promise(resolve => setTimeout(resolve, 100));
        
        try {
            const el = modalRef.current;
            const originStyle = el.style.cssText;
            
            // [중요 로직 추가] 캡처 전, 사용자가 내렸던 내부 스크롤을 맨 위로 롤백 (안 그러면 윗부분이 잘림)
            const oldScrollTop = el.scrollTop;
            el.scrollTop = 0;
            
            const innerScrolls = el.querySelectorAll('.overflow-y-auto, .overflow-hidden');
            const innerOldData: { el: HTMLElement, css: string, scrollTop: number }[] = [];
            
            // 1. 내부 컨테이너 스크롤/높이제한 해제 전 스크롤 원위치
            innerScrolls.forEach(child => {
                const target = child as HTMLElement;
                innerOldData.push({ el: target, css: target.style.cssText, scrollTop: target.scrollTop });
                target.scrollTop = 0; // 스크롤 맨 위로 고정
                target.style.setProperty('overflow', 'visible', 'important');
                target.style.setProperty('max-height', 'none', 'important');
                target.style.setProperty('height', 'auto', 'important');
            });

            // 2. 바깥 껍데기 제한 해제 (가로폭 고정하여 글씨 배열 틀어짐 방지)
            const elWidth = el.offsetWidth;
            el.style.setProperty('width', elWidth + 'px', 'important');
            el.style.setProperty('max-height', 'none', 'important');
            el.style.setProperty('height', 'auto', 'important');
            el.style.setProperty('overflow', 'visible', 'important');

            // 3. [보안(CORS) 회피] 외부 이미지 URL을 내부 프록시로 임시 치환
            const images = el.querySelectorAll('img');
            const originalSrcs: { img: HTMLImageElement, src: string }[] = [];

            images.forEach(img => {
                const src = img.src;
                // 외부 사이트(여우알바 등)의 이미지만 골라내어 프록시 통과 (Mapbox 제외)
                if (src && src.startsWith('http') && !src.includes(window.location.host) && !src.includes('mapbox.com') && !src.includes('api.mapbox')) {
                    originalSrcs.push({ img, src });
                    img.src = `/api/proxy-image?url=${encodeURIComponent(src)}`;
                }
            });

            // 레이아웃이 펴지고 프록시 이미지가 다운로드될 수 있는 시간 대기 (안정적으로 1초)
            await new Promise(resolve => setTimeout(resolve, 1000)); 

            const totalHeight = el.scrollHeight;

            const dataUrl = await toPng(el, {
                cacheBust: true,
                // skipFonts: true, <- 텍스트 배열 틀어짐의 핵심 주범 (제거하여 폰트 정상 내장)
                pixelRatio: 1.5, 
                backgroundColor: '#ffffff',
                imagePlaceholder: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
                filter: (node) => {
                    if (node && (node as HTMLElement).tagName === 'IMG') {
                        const imgSrc = (node as HTMLImageElement).src || '';
                        if (imgSrc.includes('mapbox.com') || imgSrc.includes('api.mapbox')) {
                            return false;
                        }
                    }
                    return true;
                },
                style: {
                    margin: '0', 
                    padding: '0',
                    top: '0',
                    bottom: 'auto',
                    right: 'auto',
                    left: '0',
                    transform: 'none',
                    width: elWidth + 'px',
                    height: totalHeight + 'px',
                }
            });

            // 4. 원래 상태(스크롤 위치, CSS, 이미지 URL)로 원복
            originalSrcs.forEach(item => {
                item.img.src = item.src;
            });
            innerOldData.forEach(item => {
                item.el.style.cssText = item.css;
                item.el.scrollTop = item.scrollTop;
            });
            el.style.cssText = originStyle;
            el.scrollTop = oldScrollTop;

            const link = document.createElement('a');
            link.download = `광고캡처_${cleanShopTitle(shop.title, shop.name) || '공고'}.png`;
            link.href = dataUrl;
            link.click();
        } catch (error: any) {
            console.error('캡처 렌더링 심각한 오류:', error);
            if (modalRef.current) modalRef.current.style.cssText = '';
            alert('외부 사이트의 이미지가 지나치게 많아 브라우저 보안 제한으로 캡처할 수 없습니다.');
        } finally {
            setIsCapturing(false);
        }
    };

    return (
        <div
            ref={modalRef}
            className={`
                bg-white shadow-2xl overflow-hidden flex flex-col
                fixed bottom-0 inset-x-0 w-full h-[95dvh] rounded-t-[32px] rounded-b-none
                md:static md:w-[500px] lg:w-[600px] md:h-auto md:max-h-[90vh] md:rounded-[32px]
                transform-gpu will-change-transform backface-hidden
            `}
            onClick={e => e.stopPropagation()}
        >
            {/* 1. HEADER SECTION */}
            <div className={`relative px-6 py-3 md:py-4 bg-gradient-to-br ${headerBg} text-white flex flex-col items-center text-center gap-2 shrink-0 shadow-lg`}>

                {/* [캡처 버튼] 로컬(나만 쓰는 개발환경)에서만 노출되도록 숨김 처리 */}
                {process.env.NODE_ENV === 'development' && (
                    <button
                        onClick={handleCapture}
                        disabled={isCapturing}
                        className="absolute top-4 right-14 px-3 py-2 bg-black/20 hover:bg-black/40 text-white text-[10px] font-black rounded-xl transition-all z-20 backdrop-blur-sm flex items-center gap-1.5 shadow-sm border border-white/10"
                        aria-label="화면 캡처"
                    >
                        {isCapturing ? <Loader2 size={14} className="animate-spin" /> : <Camera size={14} />}
                        <span className="hidden md:inline">{isCapturing ? '저장중...' : '이미지 저장'}</span>
                    </button>
                )}

                {/* [Mod Moved] Close Button (Inside Header) */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/30 text-white rounded-xl transition-all z-20 backdrop-blur-sm border border-white/10"
                    aria-label="닫기"
                >
                    <X size={18} />
                </button>

                {/* [Mod Moved] Favorite Button (Inside Header) */}
                <button
                    onClick={onToggleFavorite}
                    className="absolute top-4 left-4 p-2 bg-black/20 hover:bg-black/30 text-white rounded-full transition-all z-20 backdrop-blur-sm group"
                    aria-label="찜하기"
                >
                    <Star size={20} className={isFavorite ? "fill-yellow-400 text-yellow-400" : "text-white group-hover:scale-110 transition-transform"} />
                </button>

                {/* Region | Industry Badge (1차+2차 모두 표시) */}
                <div className="bg-black/40 px-3 py-1 rounded-full border border-white/20 text-[10px] font-black tracking-widest flex items-center gap-1.5 shadow-sm text-white mt-1">
                    <MapPin size={10} />
                    {shop.region}
                    {' | '}
                    <Briefcase size={10} />
                    {shop.category || shop.workType || '업종미기재'}
                    {((shop as any).categorySub || (shop as any).industrySub || (shop as any).category_sub) &&
                        ` | ${(shop as any).categorySub || (shop as any).industrySub || (shop as any).category_sub}`}
                </div>

                {/* Ad Title White Box Layout (CENTERED) */}
                <div className="w-full bg-white px-3 md:px-5 py-2 rounded-[20px] shadow-xl border border-white/50 flex items-center justify-center">
                    {/* 아이콘+제목 한 덩어리 중앙정렬 */}
                    <div className="inline-flex items-center justify-center gap-2 flex-wrap max-w-full">
                        {/* Icon Logic */}
                        {(shop.options?.icon) && (() => {
                            const iconId = Number(shop.options.icon);
                            const iconObj = ICONS.find((i) => i.id === iconId);
                            return iconObj ? (
                                <div className="flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-600 rounded-lg border border-blue-100 shadow-sm shrink-0">
                                    <span className="text-base">{iconObj.icon}</span>
                                    <span className="text-[9px] font-black uppercase tracking-tight">{iconObj.name}</span>
                                </div>
                            ) : null;
                        })()}

                        {/* Title Logic */}
                        <h2 className="text-[14px] md:text-[15px] font-black leading-tight text-gray-900 line-clamp-2 text-center break-keep">
                            <span style={getHighlighterStyle(shop.options?.highlighter)}>
                                {cleanShopTitle(shop.title, shop.name)}
                            </span>
                        </h2>
                    </div>
                </div>

                {/* Nickname Badge */}
                <div className="flex items-center gap-2 opacity-90 font-black text-[11px] md:text-[12px] bg-black/10 px-3 py-0.5 rounded-full">
                    {cleanShopTitle(undefined, shop.nickname || shop.name)}
                </div>
            </div>

            {/* 2. BODY SECTION */}
            <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 bg-gray-50/30 relative">
                {/* Ad No */}
                <div className="absolute top-2 right-4 text-[10px] font-mono font-bold text-gray-400 select-all z-10">
                    No.{shop.adNo || String(shop.id ?? '').substring(0, 4) || '1004'}
                </div>

                {/* Pay & Keywords Box */}
                <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex flex-col md:flex-row items-stretch group hover:shadow-md transition-shadow">
                    {/* Left: Salary Info */}
                    <div className="flex items-center gap-3 pr-4 border-b md:border-b-0 md:border-r border-gray-100 pb-4 md:pb-0 shrink-0">
                        <div className={`w-9 h-9 flex items-center justify-center rounded-xl text-md font-black shadow-inner shrink-0 text-white ${getPayColor(shop.payType || shop.pay)}`}>
                            {getPayAbbreviation(shop.payType || shop.pay)}
                        </div>
                        <div className="flex flex-col gap-0.5 overflow-hidden">
                            <div className="text-[18px] md:text-[22px] font-black text-gray-800 tracking-tighter leading-tight flex items-baseline gap-1">
                                {formatKoreanMoney(shop.pay)}
                            </div>
                        </div>
                    </div>

                    {/* Right: Keywords */}
                    <div className="flex-1 md:pl-6 grid grid-cols-3 gap-1.5 py-4 md:py-0">
                        {(shop.options?.paySuffixes || []).slice(0, 6).map((kw: string, i: number) => (
                            <span key={i} className="px-1 py-1.5 bg-blue-50 text-blue-500 text-[10px] font-black rounded-lg border border-blue-100/50 flex items-center justify-center text-center leading-tight shadow-sm">
                                {kw}
                            </span>
                        ))}
                        {(!shop.options?.paySuffixes || shop.options.paySuffixes.length === 0) && (
                            <span className="col-span-3 text-gray-300 text-[11px] font-bold italic py-2">등록된 급여 옵션 없음</span>
                        )}
                    </div>
                </div>

                {/* 상세 모집내용 */}
                <div>
                    <div className="flex items-center gap-2 mb-4">
                        <div className="w-1.5 h-6 bg-blue-500 rounded-full" />
                        <h3 className="text-[17px] font-black text-gray-800">상세 모집내용</h3>
                    </div>
                    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm min-h-[150px] overflow-hidden">
                        <div
                            className="prose prose-sm max-w-none text-gray-600 font-medium leading-relaxed break-words prose-img:rounded-2xl prose-img:shadow-sm [&>*:first-child]:mt-0 [&_*]:max-w-full [&_img]:h-auto pt-4 pb-2"
                            dangerouslySetInnerHTML={{
                                __html: (shop.description || `<p>${shop.name}에서 열정적인 분을 모십니다!</p>`)
                                    .replace(/foxalba\.com|queenalba\.net|ladyalba\.co\.kr/gi, 'waiterzone.kr')
                                    .replace(/여우알바|퀸알바|레이디알바|악녀알바|버블알바|슈슈알바/g, '웨이터존')
                            }}
                        />
                    </div>

                </div>

                {/* 위치 정보 */}
                <div className="space-y-3">
                    <h3 className="text-sm font-black text-gray-900 flex items-center gap-2">
                        <span className="w-1 h-4 bg-green-500 rounded-full"></span>
                        위치 정보
                    </h3>
                    <div className="aspect-video rounded-xl bg-gray-100 border border-gray-50 overflow-hidden relative">
                        {resolvedAddress ? (
                            mapError ? (
                                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-gray-400 px-4">
                                    <MapPin size={28} className="opacity-40" />
                                    <span className="text-xs font-medium text-center">{mapError}</span>
                                    {resolvedAddress && (
                                        <a
                                            href={`https://map.kakao.com/link/search/${encodeURIComponent(resolvedAddress)}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="px-4 py-2 bg-yellow-400 text-yellow-900 text-[11px] font-black rounded-xl hover:bg-yellow-300 transition-all active:scale-95 shadow-sm"
                                        >
                                            카카오맵에서 열기 →
                                        </a>
                                    )}
                                </div>
                            ) : (
                                <div ref={mapContainerRef} className="absolute inset-0 w-full h-full" />
                            )
                        ) : (
                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-gray-400">
                                <MapPin size={28} className="opacity-40" />
                                <span className="text-xs font-medium">위치 정보를 불러오는 중...</span>
                            </div>
                        )}
                        <div className="absolute bottom-0 inset-x-0 bg-white/95 backdrop-blur-sm p-3 border-t border-gray-100 flex items-center gap-3 z-10">
                            <MapPin size={24} className="text-gray-400 shrink-0" />
                            <div>
                                <div className="text-[12px] font-black text-gray-900">사업자 등록 주소</div>
                                <div className="text-[11px] text-gray-500 font-medium">
                                    {resolvedAddress || '주소 정보 없음'}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Keyword & Info */}
                <div className="space-y-2 pt-2">
                    <h3 className="text-xs font-bold text-gray-400 flex items-center gap-1.5 opacity-80">
                        <Info size={12} />
                        Keyword & 정보
                    </h3>
                    <div className="bg-gray-50/50 p-3 rounded-lg border border-gray-100">
                        <div className="flex flex-wrap gap-1.5 opacity-70 hover:opacity-100 transition-opacity">
                            {(() => {
                                // ── 1. 사용자 등록 키워드 ────────────────────────────────
                                const opt = (shop.options || {}) as any;
                                const userKeywords: string[] = [
                                    ...(Array.isArray(opt.paySuffixes) ? opt.paySuffixes : []),
                                    ...(Array.isArray(opt.keywords)    ? opt.keywords    : []),
                                ].filter(Boolean);

                                // ── 2. 폴백: 지역+업종 조합 자동 생성 ─────────────────────
                                // options.paySuffixes / keywords 둘 다 없을 때 사용
                                const regionRaw = typeof shop.region === 'string' ? shop.region : '';
                                const workType  = shop.workType || shop.category || '룸웨이터';
                                const fallbackKeywords: string[] = userKeywords.length === 0
                                    ? (() => {
                                        // region slug 형태(예: "서울-강남구") 또는 DB 형태("[서울]강남구") 처리
                                        const clean = regionRaw.replace(/[\[\]]/g, '').trim();
                                        const parts = clean.split(/[-\s]+/);
                                        const city     = parts[0] || '';
                                        const district = parts[1] || '';
                                        const display  = district || city;
                                        return [
                                            `${display}${workType}알바`,
                                            `${display}여자남성유흥알바`,
                                            `${display}여자고수익알바`,
                                        ].filter(k => k.trim().length > 4);
                                    })()
                                    : [];

                                const forbidden = ['레이디알바', '여우알바', '퀸알바', '악녀알바'];
                                const allKeywords = Array.from(new Set([...userKeywords, ...fallbackKeywords]))
                                    .filter((kw: any) => {
                                        const clean = String(kw).replace('#', '').trim();
                                        return clean && !forbidden.some(f => clean.includes(f));
                                    });

                                if (allKeywords.length > 0) {
                                    return allKeywords.map((kw: any, i: number) => (
                                        <span key={i} className="px-2 py-1 rounded bg-white border border-gray-200 text-gray-400 text-[10px] font-medium">
                                            #{String(kw).replace('#', '')}
                                        </span>
                                    ));
                                }
                                return <span className="text-gray-300 text-[11px] font-bold">#여자야간알바정보</span>;
                            })()}
                        </div>
                        <p className="mt-3 text-[10px] text-gray-400 font-medium leading-relaxed">
                            * 본 상세내용은 지역의 실제 정보를 바탕으로 구성되었습니다.<br />
                            웨이터존는 검증된 지역의 여자남성유흥알바 정보를 제공합니다.
                        </p>
                    </div>
                </div>
            </div>

            {/* 지역+업종 가이드 링크 — 내부 링크 SEO + 구직자 편의 */}
            {(() => {
                const regionRaw = typeof shop.region === 'string' ? shop.region : '';
                const category  = shop.category || shop.workType || '';
                const cleanRegion = regionRaw.replace(/[\[\]]/g, '').trim();
                const parts = cleanRegion.split(/[-\s]+/);
                const regionName = parts[0] || cleanRegion;
                const regionSlug = encodeURIComponent(cleanRegion);
                const relatedSlugs = getCategoryWorkTypeSlugs(category);
                if (!regionName || relatedSlugs.length === 0) return null;
                return (
                    <div className="px-6 py-3 bg-gray-50/60 border-t border-gray-100">
                        <p className="text-[10px] font-bold text-gray-400 mb-2">
                            📍 {regionName} 관련 알바 가이드
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                            {relatedSlugs.map(slug => (
                                <Link
                                    key={slug}
                                    href={`/coco/${regionSlug}/${slug}`}
                                    className="px-2.5 py-1 rounded-full bg-white border border-pink-100 text-[10px] font-medium text-pink-500 hover:bg-pink-50 hover:border-pink-300 transition-colors"
                                >
                                    {regionName}{WORK_TYPE_INFO[slug].name.replace(/\s*\(.*\)/, '').replace('알바', '알바')}
                                </Link>
                            ))}
                        </div>
                    </div>
                );
            })()}

            {/* 신고 링크 */}
            <div className="px-6 py-2 bg-white flex justify-end">
                <button
                    onClick={() => setShowReport(true)}
                    className="flex items-center gap-1 text-[11px] font-bold text-gray-400 hover:text-red-500 transition-colors"
                >
                    <Flag size={11} />
                    신고
                </button>
            </div>

            {showReport && <ReportAdModal onClose={() => setShowReport(false)} />}

            {/* 온라인 지원 섹션 (로그인 회원 전체) */}
            {isLoggedIn && (
                <div className="mx-6 mb-2 p-3 rounded-2xl border border-blue-100 bg-blue-50/50">
                    {applied ? (
                        <div className="flex items-center gap-2 text-green-600 font-black text-sm justify-center py-2">
                            <CheckCircle size={18} /> 지원이 완료되었습니다!
                        </div>
                    ) : !showApplyForm ? (
                        <button
                            onClick={() => requireVerification(() => {
                                setApplyName((user as any)?.full_name || (user as any)?.nickname || '');
                                setApplyPhone((user as any)?.phone || '');
                                setShowApplyForm(true);
                            })}
                            className="w-full py-3 rounded-xl bg-blue-600 text-white text-sm font-black flex items-center justify-center gap-2 hover:bg-blue-700 transition"
                        >
                            <ClipboardList size={16} /> 온라인 지원하기
                        </button>
                    ) : (
                        <div className="space-y-2">
                            <p className="text-xs font-black text-blue-700 mb-2">지원 정보 입력</p>
                            <input value={applyName} onChange={e => setApplyName(e.target.value)}
                                placeholder="이름 *" className="w-full px-3 py-2 rounded-xl border border-blue-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
                            <input value={applyPhone} onChange={e => setApplyPhone(e.target.value)}
                                placeholder="연락처 *" className="w-full px-3 py-2 rounded-xl border border-blue-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
                            <textarea value={applyMsg} onChange={e => setApplyMsg(e.target.value)}
                                placeholder="한 줄 소개 (선택)" rows={2}
                                className="w-full px-3 py-2 rounded-xl border border-blue-200 bg-white text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-300" />
                            <div className="flex gap-2">
                                <button onClick={() => setShowApplyForm(false)}
                                    className="flex-1 py-2 rounded-xl border border-blue-200 text-blue-500 text-xs font-black">취소</button>
                                <button
                                    disabled={applying || !applyName.trim() || !applyPhone.trim()}
                                    onClick={async () => {
                                        setApplying(true);
                                        try {
                                            await supabase.from('applications').insert({
                                                shop_id: shop.id,
                                                user_id: user?.id || null,
                                                applicant_name: applyName.trim(),
                                                applicant_phone: applyPhone.trim(),
                                                message: applyMsg.trim() || null,
                                                status: 'pending',
                                                created_at: new Date().toISOString(),
                                                owner_user_id: shop.user_id || null,
                                            });
                                            setApplied(true);
                                            setShowApplyForm(false);
                                        } catch {
                                            alert('지원 접수 중 오류가 발생했습니다.');
                                        } finally {
                                            setApplying(false);
                                        }
                                    }}
                                    className="flex-1 py-2 rounded-xl bg-blue-600 text-white text-xs font-black flex items-center justify-center gap-1 disabled:opacity-60 hover:bg-blue-700 transition"
                                >
                                    {applying ? <Loader2 size={14} className="animate-spin" /> : '지원 제출'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* 3. FOOTER SECTION */}
            <div className="px-4 py-2 md:py-3 bg-white border-t border-gray-100 grid grid-cols-4 gap-2 shrink-0 safe-area-bottom">
                <button
                    onClick={() => requireVerification(() => {
                        const event = new CustomEvent('open-note-modal', {
                            detail: { receiver: shop.managerName || shop.nickname || `${shop.name} 사장님` }
                        });
                        window.dispatchEvent(event);
                    })}
                    className="col-span-1 py-2 md:py-3 bg-gray-50 border border-gray-100 text-gray-600 rounded-2xl flex flex-col items-center justify-center gap-1 hover:bg-gray-100 transition shadow-sm group"
                >
                    <MessageSquare size={18} className="text-gray-400" />
                    <span className="text-[10px] font-black">쪽지문의</span>
                </button>
                <button
                    onClick={() => requireVerification(() => {
                        const messengerId = shop.kakao || shop.telegram;
                        if (messengerId) {
                            navigator.clipboard.writeText(messengerId);
                            alert(`${shop.kakao ? '카카오톡' : '텔레그램'} ID가 복사되었습니다: ${messengerId}`);
                        } else {
                            alert('등록된 메신저 ID가 없습니다.');
                        }
                    })}
                    className="col-span-1 py-2 md:py-3 bg-amber-400 text-black rounded-2xl flex flex-col items-center justify-center gap-1 hover:bg-amber-500 transition shadow-sm font-black group"
                >
                    <MessageCircle size={18} fill="currentColor" className="group-hover:scale-110 transition-transform" />
                    <span className="text-[10px]">카톡문의</span>
                </button>
                <button
                    onClick={() => requireVerification(() => {
                        window.location.href = `tel:${shop.phone}`;
                    })}
                    className="col-span-2 py-2 md:py-3 bg-[#1e3a5f] text-white rounded-2xl flex items-center justify-center gap-2 hover:bg-[#162d4a] transition shadow-lg shadow-[#1e3a5f]/30 group"
                >
                    <Phone size={17} fill="currentColor" className="group-hover:animate-bounce shrink-0" />
                    <span className="text-[13px] font-black">전화/문자문의</span>
                </button>
            </div>
        </div>
    );
};

export const JobDetailModal: React.FC<JobDetailModalProps> = ({ shop, onClose, isFavorite, onToggleFavorite }) => {
    const [mounted, setMounted] = useState(false);
    const [publisherAddress, setPublisherAddress] = useState<string | null>(null);
    useBodyScrollLock(!!shop);

    useEffect(() => {
        const fetchProfileAddress = async () => {
            if (!shop) return;
            const targetId = shop.user_id || shop.ownerId;
            if (!targetId) return;
            try {
                const { data } = await supabase
                    .from('profiles')
                    .select('business_address, business_address_detail')
                    .eq('id', targetId)
                    .single();
                if (data) {
                    const fullAddr = `${data.business_address || ''} ${data.business_address_detail || ''}`.trim();
                    if (fullAddr) setPublisherAddress(fullAddr);
                }
            } catch (err) {
                console.warn('Failed to fetch publisher address:', err);
            }
        };
        fetchProfileAddress();
    }, [shop]);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    return createPortal(
        <div
            className="modal-overlay fixed inset-0 z-[99999] flex items-end md:items-center justify-center bg-black/90 md:bg-black/80 backdrop-blur-sm touch-none overscroll-contain"
            onClick={onClose}
        >
            {/* 클릭 버블링 차단 — 내부 클릭은 모달 닫지 않음 */}
            <div
                className="relative w-full md:max-w-xl h-[92dvh] md:h-[88vh] md:rounded-3xl overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                <ShopDetailView
                    shop={shop}
                    onClose={onClose}
                    isFavorite={isFavorite}
                    onToggleFavorite={onToggleFavorite}
                />
            </div>
        </div>,
        document.body
    );
};

export default JobDetailModal;
