'use client';

import React, { useEffect, useRef, useState } from 'react';
import { MapPin, Store, MessageCircle, Phone, Info } from 'lucide-react'; // Removed X import as it is part of Modal wrapper
import { formatKoreanMoney } from '@/utils/formatMoney';
import { cleanShopTitle } from '@/utils/shopUtils';
import { IconBadge } from '@/components/common/IconBadge';
import { getHighlighterStyle } from '@/utils/highlighter';
import { getPayColor, getPayAbbreviation } from '@/utils/payColors';

const loadKakaoMapSdk = (): Promise<void> =>
    new Promise((resolve, reject) => {
        const kakao = (window as any).kakao;
        // 1. 이미 서비스 라이브러리까지 완벽히 로드된 경우 즉시 완료
        if (kakao?.maps?.services) { resolve(); return; }

        const key = process.env.NEXT_PUBLIC_KAKAO_MAP_KEY;
        if (!key) { reject(new Error('NEXT_PUBLIC_KAKAO_MAP_KEY 미설정')); return; }

        // 10초 타임아웃 설정
        const timeoutId = setTimeout(() => {
            reject(new Error('카카오 지도 로딩 시간 초과 (네트워크 상태 확인 필요)'));
        }, 10000);

        const checkInitialized = () => {
            if ((window as any).kakao?.maps?.services) {
                clearTimeout(timeoutId);
                resolve();
                return true;
            }
            return false;
        };

        // 2. 이미 스크립트 태그는 있으나 초기화 중인 경우
        const existing = document.querySelector(`script[src*="dapi.kakao.com"]`);
        if (existing) {
            const poll = () => {
                if (checkInitialized()) return;
                
                const k = (window as any).kakao;
                if (k?.maps?.load) {
                    k.maps.load(() => {
                        if (!checkInitialized()) {
                            // load 후에도 services가 없으면 잠시 대기
                            setTimeout(poll, 100);
                        }
                    });
                } else {
                    setTimeout(poll, 100);
                }
            };
            poll();
            return;
        }

        // 3. 신규 스크립트 로드
        const script = document.createElement('script');
        script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${key}&libraries=services&autoload=false`;
        script.onload = () => {
            const k = (window as any).kakao;
            if (k?.maps?.load) {
                k.maps.load(() => {
                    // 주기적으로 체크하여 services까지 로드되었는지 확인
                    const finalPoll = () => {
                        if (checkInitialized()) return;
                        setTimeout(finalPoll, 100);
                    };
                    finalPoll();
                });
            } else {
                reject(new Error('카카오 지도 객체 생성 실패 (도메인 확인 필요)'));
            }
        };
        script.onerror = () => {
            clearTimeout(timeoutId);
            reject(new Error('카카오 지도 스크립트 로드 실패'));
        };
        document.head.appendChild(script);
    });

interface MobilePreviewContentProps {
    formData: any;
    brand?: any; // Optional, defaults used if missing
    bizAddressOverride?: string; // [관리자 팝업용] RLS 우회: 이미 아는 주소를 직접 주입
}

export const MobilePreviewContent: React.FC<MobilePreviewContentProps> = ({ formData, brand, bizAddressOverride }) => {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const [bizAddress, setBizAddress] = useState<string | null>(null);
    const [mapError, setMapError] = useState<string | null>(null);

    // 사업장 주소 로드 — override가 있으면 DB 조회 생략 (관리자 RLS 우회)
    useEffect(() => {
        if (bizAddressOverride) {
            setBizAddress(bizAddressOverride);
            return;
        }
        const userId = formData.user_id || formData.ownerId;
        if (!userId) return;
        import('@/lib/supabase').then(({ supabase }) => {
            supabase.from('profiles')
                .select('business_address, business_address_detail')
                .eq('id', userId)
                .single()
                .then(({ data }) => {
                    if (data?.business_address) {
                        const detail = (data as any).business_address_detail;
                        setBizAddress(detail ? `${data.business_address} ${detail}` : data.business_address);
                    }
                });
        });
    }, [bizAddressOverride, formData.user_id, formData.ownerId]);

    // 카카오맵 렌더링
    useEffect(() => {
        if (!bizAddress || !mapContainerRef.current) return;
        let cancelled = false;
        loadKakaoMapSdk()
            .then(() => {
                if (cancelled || !mapContainerRef.current) return;
                const kakao = (window as any).kakao;
                const geocoder = new kakao.maps.services.Geocoder();
                geocoder.addressSearch(bizAddress, (result: any[], status: string) => {
                    if (cancelled || !mapContainerRef.current) return;
                    if (status !== kakao.maps.services.Status.OK || !result[0]) {
                        setMapError('주소를 지도에서 찾을 수 없습니다.'); return;
                    }
                    const coords = new kakao.maps.LatLng(result[0].y, result[0].x);
                    const map = new kakao.maps.Map(mapContainerRef.current, { center: coords, level: 4 });
                    new kakao.maps.Marker({ map, position: coords });
                    const infowindow = new kakao.maps.InfoWindow({
                        content: `<div style="padding:6px 10px;font-size:11px;font-weight:700;white-space:nowrap;">${bizAddress}</div>`,
                    });
                    infowindow.open(map, new kakao.maps.Marker({ map, position: coords }));
                });
            })
            .catch(err => {
                if (!cancelled) {
                    console.error('Map loading error:', err);
                    setMapError(err.message || '지도를 불러오지 못했습니다.');
                }
            });
        return () => { cancelled = true; };
    }, [bizAddress]);
    // [표준 규정] 광고 등급별 스타일 맵 (T1~T7 지원)
    const TIER_STYLE_MAP: Record<string, { header: string, accent: string, badge: string }> = {
        'p1': { header: "from-amber-400 via-orange-500 to-amber-600", accent: "text-amber-600", badge: "bg-amber-100" }, // Grand (Gold)
        'p2': { header: "from-red-500 to-rose-700", accent: "text-red-600", badge: "bg-red-100" },               // Premium (Red)
        'p3': { header: "from-blue-500 to-indigo-600", accent: "text-blue-600", badge: "bg-blue-100" },               // Deluxe (Blue)
        'p4': { header: "from-emerald-400 to-teal-600", accent: "text-emerald-600", badge: "bg-emerald-100" },          // Special (Green)
        'p5': { header: "from-purple-500 to-violet-600", accent: "text-purple-600", badge: "bg-purple-100" },          // Urgent/Rec (Purple)
        'p6': { header: "from-slate-400 to-gray-600", accent: "text-gray-600", badge: "bg-gray-100" },               // Native (Slate)
        'p7': { header: "from-slate-300 to-slate-400", accent: "text-slate-400", badge: "bg-slate-50" },                // Basic (Gray)
    };


    // T계열 코드 보정 (T1 -> p1 매핑)
    const normalizedProduct = (formData.selectedAdProduct || 'p7').toLowerCase();
    const tierKey = normalizedProduct.replace('t', 'p');

    // 최종 스타일 추출 (Grand/Premium/Deluxe/Special/Urgent 등 텍스트 키 지원 포함)
    const currentStyle = TIER_STYLE_MAP[tierKey] ||
        (normalizedProduct.includes('grand') ? TIER_STYLE_MAP.p1 :
            normalizedProduct.includes('premium') ? TIER_STYLE_MAP.p2 :
                normalizedProduct.includes('deluxe') ? TIER_STYLE_MAP.p3 :
                    normalizedProduct.includes('special') ? TIER_STYLE_MAP.p4 :
                        normalizedProduct.includes('urgent') ? TIER_STYLE_MAP.p5 : TIER_STYLE_MAP.p7);

    const headerBg = currentStyle.header;
    const accentColor = currentStyle.accent;
    // const badgeBg = currentStyle.badge;


    // Pay type abbreviation
    const getPayAbbr = (type: string) => {
        if (type?.includes('시급')) return '시';
        if (type?.includes('일급')) return '일';
        if (type?.includes('주급')) return '주';
        if (type?.includes('월급')) return '월';
        if (type?.includes('연봉')) return '연';
        if (type?.includes('건당')) return '건';
        return type?.[0] || '급';
    };

    const getBorderClass = (opt: string) => {
        switch (opt) {
            case 'color': return 'border-4 border-blue-500';
            case 'glow': return 'border-4 border-cyan-400 shadow-[0_0_30px_rgba(34,211,238,0.6)]';
            case 'sparkle': return 'border-4 border-yellow-400 shadow-[0_0_35px_rgba(250,204,21,0.8)] animate-pulse';
            case 'rainbow': return 'animate-rainbow-border shadow-lg';
            default: return 'border border-gray-200';
        }
    };

    return (
        <div className={`flex flex-col h-full bg-white rounded-[32px] overflow-hidden shadow-sm ${getBorderClass(formData.borderOption)}`}>
            {/* Header (Capture 3 style) */}
            <div className={`relative px-6 py-4 md:py-5 bg-gradient-to-br ${headerBg} text-white flex flex-col items-center text-center gap-2 md:gap-3 shrink-0 shadow-lg`}>
                <div className="absolute top-0 left-0 bg-blue-600 text-white text-[10px] font-bold px-2 py-1 rounded-br-lg z-10">
                    MOBILE PREVIEW
                </div>

                <div className="bg-black/20 backdrop-blur-md px-3 py-1 rounded-full border border-white/20 text-[10px] font-black tracking-widest flex items-center gap-1 shadow-sm">
                    <MapPin size={10} /> [{formData.regionCity} {formData.regionGu}] | <Store size={10} /> {formData.industryMain || '업종미기재'}{formData.categorySub ? ` > ${formData.categorySub}` : ''}
                </div>

                {/* Ad Title White Box Layout (CENTERED) */}
                <div className="w-full bg-white px-4 md:px-6 py-3 rounded-[24px] shadow-xl border border-white/50 flex flex-col items-center justify-center gap-2">
                    <div className="flex items-center justify-center gap-2 md:gap-3 w-full">
                        <IconBadge iconId={formData.selectedIcon} showName={true} />

                        <h2 className="text-[13px] md:text-sm font-black leading-tight text-gray-900 line-clamp-2 text-center break-all">
                            <span style={getHighlighterStyle(formData.selectedHighlighter)}>
                                {cleanShopTitle(formData.title || formData.shopName, formData.shopName)}
                            </span>
                        </h2>
                    </div>
                </div>

                <div className="flex items-center gap-2 opacity-95 font-black text-[12px] md:text-[13px] bg-black/10 px-3 py-1 rounded-full">
                    {(() => {
                        const displayNickname = formData.nickname || formData.shopName || '비즈니스 파트너';
                        // [Fix] 만약 전달된 닉네임이 '닉네임'이라는 문자열이면 상호명으로 대체
                        return cleanShopTitle(undefined, displayNickname === '닉네임' ? (formData.shopName || '비즈니스 파트너') : displayNickname);
                    })()}
                </div>
            </div>

            {/* Content (Scrollable) */}
            <div className="flex-1 overflow-y-auto pt-6 px-6 pb-2 md:p-8 space-y-8 bg-gray-50/30">
                {/* Pay & Keywords Box (CENTERED/GRID) */}
                <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex flex-col md:flex-row items-stretch group hover:shadow-md transition-shadow">
                    {/* Left: Salary Info */}
                    <div className="flex items-center gap-3 pr-4 border-b md:border-b-0 md:border-r border-gray-100 pb-4 md:pb-0 shrink-0">
                        {/* Stylish Square Box Badge - [규정 준수] 급여 종류별 표준 컬러 적용 */}
                        <div className={`w-9 h-9 flex items-center justify-center rounded-xl text-md font-black shadow-inner shrink-0 text-white ${getPayColor(formData.payType)}`}>
                            {getPayAbbreviation(formData.payType)}
                        </div>
                        <div className="flex flex-col gap-0.5 overflow-hidden">
                            <div className="text-[18px] md:text-[22px] font-black text-gray-800 tracking-tighter leading-tight flex items-baseline gap-1">
                                {formatKoreanMoney(formData.payAmount)}
                            </div>
                        </div>
                    </div>

                    {/* Right: Keywords (Grid 3 cols) */}
                    <div className="flex-1 md:pl-6 grid grid-cols-3 gap-1.5 py-4 md:py-0">
                        {(formData.paySuffixes || formData.options?.paySuffixes || formData.options?.pay_suffixes)?.slice(0, 6).map((kw: string, i: number) => (
                            <span key={i} className="px-1 py-1.5 bg-blue-50 text-blue-500 text-[10px] font-black rounded-lg border border-blue-100/50 flex items-center justify-center text-center leading-tight shadow-sm">
                                {kw}
                            </span>
                        ))}
                        {(!(formData.paySuffixes || formData.options?.paySuffixes || formData.options?.pay_suffixes) ||
                            (formData.paySuffixes || formData.options?.paySuffixes || formData.options?.pay_suffixes).length === 0) && (
                            <span className="col-span-3 text-gray-300 text-[11px] font-bold italic py-2">등록된 급여 옵션 없음</span>
                        )}
                    </div>
                </div>

                {/* Recruiting Section (Moved Up) */}
                <div>
                    <div className="flex items-center gap-2 mb-4">
                        <div className="w-1.5 h-6 bg-blue-500 rounded-full" />
                        <h3 className="text-[17px] font-black text-gray-800">상세 모집내용</h3>
                    </div>
                    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm min-h-[150px]">
                        <div
                            className="prose prose-sm max-w-none text-gray-600 font-medium leading-relaxed break-words"
                            dangerouslySetInnerHTML={{ __html: formData.editorHtml || '등록된 상세 내용이 없습니다.' }}
                        />
                    </div>
                </div>

                {/* 위치 정보 (카카오 지도 연동) */}
                <div className="space-y-3">
                    <h3 className="text-sm font-black text-gray-900 flex items-center gap-2">
                        <span className="w-1 h-4 bg-green-500 rounded-full"></span>
                        위치 정보
                    </h3>
                    {bizAddress ? (
                        <div>
                            {mapError ? (
                                <div className="aspect-video rounded-xl bg-gray-100 flex items-center justify-center text-gray-400 flex-col gap-2 border border-gray-50">
                                    <MapPin size={32} className="opacity-50" />
                                    <span className="text-xs font-bold">{formData.regionCity} {formData.regionGu}</span>
                                    <span className="text-[10px] text-red-400">{mapError}</span>
                                </div>
                            ) : (
                                <div ref={mapContainerRef} className="w-full aspect-video rounded-xl overflow-hidden border border-gray-100" />
                            )}
                        </div>
                    ) : (
                        <div className="aspect-video rounded-xl bg-gray-100 flex items-center justify-center text-gray-400 flex-col gap-2 border border-gray-50">
                            <MapPin size={32} className="opacity-50" />
                            <span className="text-xs font-bold">{formData.regionCity} {formData.regionGu}</span>
                            <span className="text-[10px] opacity-60">위치 정보가 등록되지 않았습니다.</span>
                        </div>
                    )}
                </div>

                <div className="space-y-2 pt-2">
                    <h3 className="text-xs font-bold text-gray-400 flex items-center gap-1.5 opacity-80">
                        <Info size={12} />
                        Keyword & 정보
                    </h3>
                    <div className="bg-gray-50/50 p-3 rounded-lg border border-gray-100">
                        <div className="flex flex-wrap gap-1.5 opacity-80 hover:opacity-100 transition-opacity">
                            {(() => {
                                const userKeywords = formData.selectedKeywords || formData.keywords || [];
                                
                                // [Standard Fix] 사용자가 선택한 모든 키워드를 그대로 노출 (임의 필터링 제거)
                                const filteredKeywords = userKeywords.filter((kw: any) => {
                                    const cleanKw = String(kw).replace('#', '').trim();
                                    return !!cleanKw;
                                });
                                
                                if (filteredKeywords.length > 0) {
                                    return filteredKeywords.map((kw: string, i: number) => (
                                        <span key={i} className="px-2 py-1 rounded bg-white border border-gray-200 text-gray-500 text-[10px] font-bold">
                                            #{String(kw).replace('#', '')}
                                        </span>
                                    ));
                                } else {
                                    return <span className="text-gray-300 text-[11px] font-bold italic">등록된 키워드가 없습니다.</span>;
                                }
                            })()}
                        </div>
                    </div>
                </div>

                {/* Scroll Margin for Safe Area */}
                <div className="h-2"></div>
            </div>

            {/* Footer Buttons (Mockup style) */}
            <div className="px-4 py-3 bg-white border-t border-gray-100 grid grid-cols-4 gap-2 shrink-0">
                <button className="col-span-1 py-3 bg-gray-50 border border-gray-100 text-gray-600 rounded-2xl flex flex-col items-center justify-center gap-1 hover:bg-gray-100 transition shadow-sm group">
                    <MessageCircle size={18} className="group-hover:scale-110 transition-transform" />
                    <span className="text-[10px] font-black">쪽지문의</span>
                </button>
                <button className="col-span-1 py-3 bg-amber-400 text-black rounded-2xl flex flex-col items-center justify-center gap-1 hover:bg-amber-500 transition shadow-sm font-black group">
                    <MessageCircle size={18} fill="currentColor" className="group-hover:scale-110 transition-transform" />
                    <span className="text-[10px]">카톡문의</span>
                </button>
                <button className="col-span-2 py-3 bg-[#f82b60] text-white rounded-2xl flex items-center justify-center gap-2 hover:bg-[#db2456] transition shadow-lg shadow-[#f82b60]/30 group">
                    <Phone size={17} fill="currentColor" className="group-hover:animate-bounce shrink-0" />
                    <span className="text-[13px] font-black">전화/문자문의</span>
                </button>
            </div>
        </div>
    );
};
