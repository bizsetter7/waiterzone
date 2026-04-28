'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  X, MapPin, Phone, MessageCircle, Heart, Share2,
  ChevronDown, CheckCircle2,
  Gift, Navigation, Briefcase, Clock, ExternalLink,
  ChevronRight, AlertTriangle, MessageSquare, Copy
} from 'lucide-react';
import { Shop } from '@/types/shop';
import { formatKoreanMoney } from '@/utils/formatMoney';
import { getPayColor, getPayAbbreviation } from '@/utils/payColors';
import { useAdultGate } from '@/hooks/useAdultGate';
import { supabase } from '@/lib/supabase';

interface ShopDetailViewProps {
  shop: Shop;
  onClose?: () => void;
  isFavorite?: boolean;
  onToggleFavorite?: (e: React.MouseEvent) => void;
}

// 이름 마스킹: 김대순 → 김○순
const maskName = (name: string | null | undefined): string => {
  if (!name || name.length < 2) return name || '';
  if (name.length === 2) return name[0] + '○';
  return name[0] + '○' + name[name.length - 1];
};

// 전화번호 하이픈 포맷
const formatPhone = (phone: string | null | undefined): string => {
  if (!phone) return '';
  const d = phone.replace(/[^0-9]/g, '');
  if (d.length === 11) return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}`;
  return phone;
};

// 사업자번호 마스킹: 2261391078 → 226-139-10**
const maskBizNum = (num: string | null | undefined): string => {
  if (!num) return '-';
  const clean = num.replace(/[^0-9]/g, '');
  if (clean.length >= 8) return `${clean.slice(0, 3)}-${clean.slice(3, 6)}-${clean.slice(6, 8)}**`;
  return num;
};

// 날짜 포맷: ISO → 2025.02.20
const formatDate = (dt: string | null | undefined): string | null => {
  if (!dt) return null;
  try {
    const d = new Date(dt);
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
  } catch { return null; }
};

// 인증일: YYYY. M. D 형식 (예: 2026. 4. 26)
const formatCertDate = (dt: string | null | undefined): string => {
  if (!dt) return '';
  try {
    const d = new Date(dt);
    if (isNaN(d.getTime())) return '';
    return `${d.getFullYear()}. ${d.getMonth() + 1}. ${d.getDate()}`;
  } catch { return ''; }
};

// 개업일 기준 연차 계산
const calcYears = (dt: string | null | undefined): string | null => {
  if (!dt) return null;
  try {
    const diff = Date.now() - new Date(dt).getTime();
    const years = Math.floor(diff / (1000 * 60 * 60 * 24 * 365));
    return years >= 1 ? `${years}년차` : '신규';
  } catch { return null; }
};

declare global { interface Window { kakao: any; } }

export default function ShopDetailView({
  shop,
  onClose = () => window.history.back(),
  isFavorite = false,
  onToggleFavorite = () => {},
}: ShopDetailViewProps) {
  const { requireVerification } = useAdultGate();
  const [descOpen, setDescOpen] = useState(true);
  const [imgErrors, setImgErrors] = useState<Set<number | string>>(new Set());
  const scrollRef = useRef<HTMLDivElement>(null);
  const kakaoMapRef = useRef<HTMLDivElement>(null);

  // businesses 테이블 — 인증/업체 정보
  const [bizInfo, setBizInfo] = useState<{
    waiterzone_tier: string | null;
    verified_at: string | null;
    is_verified: boolean;
    manager_name: string | null;
    manager_phone: string | null;
    name: string | null;
    room_count: number | null;
    floor_area: number | null;
    opened_at: string | null;
    license_url: string | null;
    description: string | null;
  } | null>(null);

  // 인근지역 채용정보
  const [nearbyShops, setNearbyShops] = useState<any[]>([]);

  useEffect(() => {
    if (!shop.user_id) return;
    supabase
      .from('businesses')
      .select('waiterzone_tier, verified_at, is_verified, manager_name, manager_phone, name, room_count, floor_area, opened_at, license_url, description')
      .eq('owner_id', shop.user_id)
      .single()
      .then(({ data }) => { if (data) setBizInfo(data as any); });
  }, [shop.user_id]);

  // 카카오맵 초기화
  useEffect(() => {
    const addr = shop.businessAddress;
    if (!addr || !kakaoMapRef.current) return;
    const mapEl = kakaoMapRef.current;

    const initMap = () => {
      if (!window.kakao?.maps) return;
      const geocoder = new window.kakao.maps.services.Geocoder();
      geocoder.addressSearch(addr, (result: any, status: any) => {
        if (status === window.kakao.maps.services.Status.OK && mapEl) {
          const coords = new window.kakao.maps.LatLng(result[0].y, result[0].x);
          const map = new window.kakao.maps.Map(mapEl, { center: coords, level: 4 });
          new window.kakao.maps.Marker({ map, position: coords });
        }
      });
    };

    if (window.kakao?.maps) {
      initMap();
    } else {
      const existing = document.querySelector('script[data-kakao-map]');
      if (existing) {
        existing.addEventListener('load', () => window.kakao.maps.load(initMap));
      } else {
        const script = document.createElement('script');
        script.setAttribute('data-kakao-map', '1');
        script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.NEXT_PUBLIC_KAKAO_MAP_KEY}&libraries=services&autoload=false`;
        script.onload = () => window.kakao.maps.load(initMap);
        document.head.appendChild(script);
      }
    }
  }, [shop.businessAddress]);

  useEffect(() => {
    const regionPrefix = (shop.region || '').split(' ')[0];
    if (!regionPrefix) return;
    supabase
      .from('shops')
      .select('id, name, nickname, region, pay, pay_type, tier, options, banner_image_url, media_url')
      .ilike('region', `${regionPrefix}%`)
      .neq('id', String(shop.id))
      .eq('is_closed', false)
      .limit(4)
      .then(({ data }) => { if (data && data.length > 0) setNearbyShops(data); });
  }, [shop.id, shop.region]);

  // 파생 값
  const managerName = bizInfo?.manager_name || (shop as any).manager_name || shop.managerName || '';
  const managerPhone = bizInfo?.manager_phone || (shop as any).manager_phone || shop.phone || '';
  const verifiedAt = formatDate(bizInfo?.verified_at);
  const tier = bizInfo?.waiterzone_tier || shop.tier || null;
  const openedAt = formatDate(bizInfo?.opened_at);
  const yearsOpen = calcYears(bizInfo?.opened_at);
  const roomCount = bizInfo?.room_count;

  const regionFull = [shop.region, shop.options?.regionGu].filter(Boolean).join(' ');
  const ageMin = shop.options?.ageMin;
  const ageMax = shop.options?.ageMax;
  const ageLabel = (ageMin && ageMax) ? `${ageMin}~${ageMax}세` : shop.age ? `${shop.age}대` : '나이 무관';
  const catLabel = shop.category || shop.workType || '업종';

  const kakaoMapUrl = shop.businessAddress
    ? `https://map.kakao.com/?q=${encodeURIComponent(shop.businessAddress)}`
    : null;

  const smsTemplate = `안녕하세요:)\n웨이터존 보고 연락드렸어요.\n\n이름:\n나이:\n경력:\n거주 지역:\n출근 가능 일:`;
  const smsUrl = `sms:${managerPhone}?body=${encodeURIComponent(smsTemplate)}`;

  const heroImage = shop.banner_image_url || shop.options?.mediaUrl || null;
  const [heroImgError, setHeroImgError] = useState(false);
  const hasRealImage = !!heroImage && !heroImgError;

  return (
    <div className="flex flex-col w-full h-full bg-gray-50 overflow-hidden">

      {/* ── STICKY HEADER ── */}
      <div className="flex-none flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-100 z-50">
        <button onClick={onClose} className="p-1.5 rounded-full hover:bg-gray-100 transition-colors shrink-0">
          <X size={18} className="text-gray-600" />
        </button>
        <h1 className="flex-1 text-[15px] font-black text-gray-900 truncate">{shop.name}</h1>
        <div className="flex gap-1.5 shrink-0">
          <button onClick={onToggleFavorite} className="p-1.5 rounded-full hover:bg-gray-100 transition-colors">
            <Heart size={18} className={isFavorite ? 'fill-[#1e3a5f] text-[#1e3a5f]' : 'text-gray-400'} />
          </button>
          <button className="p-1.5 rounded-full hover:bg-gray-100 transition-colors">
            <Share2 size={18} className="text-gray-400" />
          </button>
        </div>
      </div>

      {/* ── SCROLL AREA ── */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">

        {/* 등급 배지 바 */}
        {tier && tier !== 'basic' && tier !== 'free' && (
          <div className={`text-white text-center py-1.5 text-[11px] font-black tracking-widest uppercase ${
            tier.includes('premium-extra') || tier === 'premium_extra' ? 'bg-blue-500' :
            tier.includes('premium') ? 'bg-amber-500' :
            tier.includes('standard') ? 'bg-blue-500' :
            'bg-slate-800'
          }`}>
            {tier.replace('-', ' ').replace('_', ' ')}
          </div>
        )}

        {/* 사진 */}
        <div className="relative w-full bg-zinc-900" style={{ aspectRatio: '4/3' }}>
          {hasRealImage ? (
            <img
              src={heroImage!}
              alt={shop.name}
              className="w-full h-full object-cover"
              onError={() => setHeroImgError(true)}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-gray-700 via-gray-800 to-gray-900 flex flex-col items-center justify-center gap-2 px-8">
              <p className="text-2xl font-black text-white/25 text-center break-keep leading-tight tracking-tight">
                {shop.name}
              </p>
              <p className="text-[11px] text-white/20 font-medium">
                {catLabel}{shop.region ? ` · ${shop.region}` : ''}
              </p>
            </div>
          )}
          {hasRealImage && <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />}
          <div className="absolute bottom-3 right-3 bg-black/40 text-white text-[10px] font-mono px-2 py-0.5 rounded backdrop-blur-sm">
            No.{shop.id || '---'}
          </div>
        </div>

        {/* 인증 상태 */}
        <div className="px-4 py-3 bg-white border-b border-gray-100 flex items-center gap-2">
          <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
          <span className="text-[11px] text-emerald-700 font-medium">
            {formatCertDate(bizInfo?.verified_at || (shop as any).approved_at || shop.created_at)} 영업허가 확인 결과 정상영업 업체입니다.
          </span>
        </div>

        {/* 브레드크럼 */}
        <div className="px-4 pt-3 pb-1 bg-white flex items-center gap-1 text-[11px] text-gray-400 font-medium flex-wrap">
          <span>홈</span><ChevronRight size={10} />
          <span>{shop.region || '지역'}</span>
          {shop.options?.regionGu && !shop.region?.includes(shop.options.regionGu) && (
            <><ChevronRight size={10} /><span>{shop.options.regionGu}</span></>
          )}
          {catLabel && <><ChevronRight size={10} /><span>{catLabel}</span></>}
        </div>

        {/* 상호명 + 매니저 */}
        <div className="px-4 pb-4 pt-2 bg-white">
          <h2 className="text-xl font-black text-gray-900 break-keep mb-2 leading-tight">{shop.name}</h2>
          {(managerName || managerPhone) && (
            <div className="flex items-center gap-2 flex-wrap">
              {managerName && <span className="text-[13px] text-gray-600 font-medium">{maskName(managerName)} 사장</span>}
              {managerPhone && (
                <>
                  <span className="text-[13px] text-gray-500">{formatPhone(managerPhone)}</span>
                  <button
                    onClick={() => requireVerification(() => { window.location.href = `tel:${managerPhone}`; })}
                    className="px-1.5 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-black rounded border border-blue-100"
                  >
                    전화걸기
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {/* 급여 박스 — 크게 */}
        <div className="mx-4 mb-4 p-5 rounded-2xl bg-gray-900">
          <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">급여</div>
          <div className="flex items-baseline gap-2 mb-1">
            <span className={`text-[11px] font-black px-2 py-0.5 rounded text-white shrink-0 ${getPayColor(shop.payType || shop.pay)}`}>
              {getPayAbbreviation(shop.payType || shop.pay)}
            </span>
            <span className="text-2xl font-black text-white tracking-tight">{formatKoreanMoney(shop.pay)}</span>
          </div>
          {(shop.options?.paySuffixes || []).length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {(shop.options?.paySuffixes || []).slice(0, 3).map((s: string, i: number) => (
                <span key={i} className="text-[9px] px-2 py-0.5 bg-white/10 text-white/70 rounded font-bold">{s}</span>
              ))}
            </div>
          )}
          <div className="text-[10px] text-gray-500 mt-1">협의 가능</div>
        </div>

        {/* 업체 기본정보 2열 */}
        <div className="mx-4 mb-4 grid grid-cols-2 gap-2">
          {[
            { icon: <MapPin size={13} className="text-[#1e3a5f]" />, label: '지역', value: regionFull || shop.region },
            { icon: <Briefcase size={13} className="text-blue-500" />, label: '업종', value: catLabel },
            { icon: <Clock size={13} className="text-amber-500" />, label: '근무시간', value: shop.workTime || '협의' },
            { icon: <span className="text-purple-500 text-[11px] font-black">나이</span>, label: '연령', value: ageLabel },
          ].map((item, i) => (
            <div key={i} className="bg-white rounded-xl p-3 border border-gray-100">
              <div className="flex items-center gap-1 mb-1">{item.icon}<span className="text-[9px] text-gray-400 font-bold uppercase tracking-wide">{item.label}</span></div>
              <div className="text-[12px] font-black text-gray-800 leading-tight">{item.value}</div>
            </div>
          ))}
        </div>

        {/* 근무 조건 */}
        <div className="mx-4 mb-4 bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-50">
            <h3 className="text-[14px] font-black text-gray-900">근무 조건</h3>
          </div>
          <div className="divide-y divide-gray-50">
            {[
              { label: '모집 직종', value: shop.workType || catLabel },
              { label: '모집 나이', value: ageLabel },
              { label: '근무 시간', value: shop.workTime || '협의' },
              { label: '고용 형태', value: shop.payType || '파트타임' },
            ].map((row, i) => (
              <div key={i} className="flex items-start gap-3 px-4 py-3">
                <span className="text-[11px] text-gray-400 font-bold w-18 shrink-0 pt-0.5">{row.label}</span>
                <span className="text-[12px] font-bold text-gray-800 flex-1 leading-snug">{row.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 복지혜택 */}
        {(shop.options?.icons || []).length > 0 && (
          <div className="mx-4 mb-4 bg-white rounded-2xl border border-gray-100 p-4">
            <h3 className="text-[14px] font-black text-gray-900 mb-3">복지혜택</h3>
            <div className="flex flex-wrap gap-2">
              {(shop.options?.icons || []).map((item: string, i: number) => (
                <div key={i} className="flex items-center gap-1.5 px-3 py-2 bg-blue-50 rounded-xl border border-blue-100">
                  <Gift size={12} className="text-blue-500 shrink-0" />
                  <span className="text-[11px] font-black text-blue-700">{item}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 채용메시지 (아코디언) */}
        {shop.description && (
          <div className="mx-4 mb-4 bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <button
              onClick={() => setDescOpen(prev => !prev)}
              className="w-full flex items-center justify-between px-4 py-3.5 text-left"
            >
              <span className="text-[14px] font-black text-gray-900">채용메시지</span>
              <ChevronDown size={16} className={`text-gray-400 transition-transform duration-300 ${descOpen ? 'rotate-180' : ''}`} />
            </button>
            {descOpen && (
              <div className="px-4 py-4 border-t border-gray-100">
                <div
                  className="prose prose-sm max-w-none text-gray-700 leading-relaxed break-words text-[13px]"
                  dangerouslySetInnerHTML={{ __html: shop.description }}
                />
                {(shop.options?.keywords || []).length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-4 border-t border-gray-50 mt-4">
                    {(shop.options?.keywords || []).map((kw: string, i: number) => (
                      <span key={i} className="px-2 py-1 bg-gray-50 text-gray-500 text-[10px] font-bold rounded-lg border border-gray-100">#{kw}</span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ═══ 가게 정보 ═══ */}
        <div className="mx-4 mb-4 bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-50">
            <h3 className="text-[14px] font-black text-gray-900">가게 정보</h3>
          </div>
          <div className="grid grid-cols-2 gap-px bg-gray-100">
            {[
              { label: '업소명', value: bizInfo?.name || shop.name },
              { label: '업소규모', value: roomCount ? `룸 ${roomCount}개` : '-' },
              { label: '영업허가', value: '정상영업' },
              {
                label: '개업일',
                value: openedAt ? `${openedAt}${yearsOpen ? `\n(${yearsOpen})` : ''}` : '-'
              },
              { label: '채용담당자', value: maskName(managerName) + ' 사장' },
              { label: '연락처', value: formatPhone(managerPhone) || '-' },
            ].map((cell, i) => (
              <div key={i} className="bg-white px-4 py-3">
                <div className="text-[10px] text-gray-400 font-bold mb-1">{cell.label}</div>
                <div className="text-[12px] font-black text-gray-800 whitespace-pre-line leading-snug">{cell.value || '-'}</div>
                {cell.label === '채용담당자' && managerPhone && (
                  <button
                    onClick={() => requireVerification(() => { window.location.href = `tel:${managerPhone}`; })}
                    className="text-[10px] text-blue-500 font-bold mt-1"
                  >
                    전화걸기
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ═══ 가게 소개 ═══ */}
        {bizInfo?.description && (
          <div className="mx-4 mb-4 bg-white rounded-2xl border border-gray-100 p-4">
            <h3 className="text-[14px] font-black text-gray-900 mb-3">가게 소개</h3>
            <p className="text-[13px] text-gray-700 leading-relaxed break-keep">{bizInfo.description}</p>
          </div>
        )}

        {/* ═══ 문자 지원 ═══ */}
        {managerPhone && (
          <div className="mx-4 mb-4 bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
              <h3 className="text-[14px] font-black text-gray-900">문자 지원</h3>
              <button
                onClick={() => requireVerification(() => { window.open(smsUrl); })}
                className="text-[11px] text-blue-500 font-black"
              >
                문자 보내기
              </button>
            </div>
            <div className="px-4 py-3 bg-amber-50 border border-amber-100 mx-3 my-3 rounded-xl">
              <p className="text-[12px] text-gray-600 leading-relaxed whitespace-pre-line">{smsTemplate}</p>
            </div>
            <div className="px-4 pb-3">
              <button
                onClick={() => requireVerification(() => { window.open(smsUrl); })}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-black text-[13px] rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <MessageSquare size={15} />
                위 내용으로 문자 지원하기
              </button>
            </div>
          </div>
        )}

        {/* ═══ 위치 ═══ */}
        <div className="mx-4 mb-4 bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
            <h3 className="text-[14px] font-black text-gray-900">위치</h3>
            {shop.businessAddress && (
              <button
                onClick={() => { navigator.clipboard.writeText(shop.businessAddress || ''); alert('주소가 복사되었습니다.'); }}
                className="flex items-center gap-1 text-[11px] text-blue-500 font-black"
              >
                <Copy size={11} />주소 복사
              </button>
            )}
          </div>
          <div className="px-4 py-3">
            <div className="flex items-start gap-2 mb-3">
              <MapPin size={14} className="text-[#1e3a5f] shrink-0 mt-0.5" />
              <span className="text-[13px] font-bold text-gray-800 leading-snug break-keep flex-1">
                {shop.businessAddress || '문의 시 상세 주소 안내'}
              </span>
            </div>
            {shop.businessAddress && (
              <div
                ref={kakaoMapRef}
                className="w-full rounded-xl overflow-hidden mb-3 bg-gray-100"
                style={{ height: '180px' }}
              />
            )}
            {kakaoMapUrl && (
              <a
                href={kakaoMapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-3 bg-yellow-400 hover:bg-yellow-500 text-black font-black text-[13px] rounded-xl transition-colors"
              >
                <Navigation size={15} />
                카카오 길찾기
                <ExternalLink size={12} />
              </a>
            )}
          </div>
        </div>

        {/* ═══ 안내사항 ═══ */}
        <div className="mx-4 mb-4 bg-white rounded-2xl border border-gray-100 p-4">
          <div className="space-y-2 mb-4">
            {[
              `이 채용공고는 '${shop.name}' 채용 담당자가 직접 등록한 정보입니다.`,
              '웨이터존는 공고에 적힌 급여나 조건 등이 사실인지 직접 확인하지 않습니다.',
              '문제가 있다고 느껴지면, 허위 광고나 임금체불 등 신고하실 수 있습니다.',
              '본 정보는 웨이터존의 동의 없이 상업적으로 사용할 수 없습니다.',
            ].map((text, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="text-gray-300 text-[11px] mt-0.5 shrink-0">-</span>
                <p className="text-[11px] text-gray-500 leading-relaxed">{text}</p>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[
              { icon: '🔒', label: '보이스피싱 주의' },
              { icon: '⚠️', label: '취업 사기 주의' },
              { icon: '📋', label: '허위광고, 임금체불 신고' },
              { icon: '📢', label: '체불사업주 명단공개' },
            ].map((btn, i) => (
              <button key={i} className="flex items-center gap-2 p-3 rounded-xl border border-gray-100 bg-gray-50 hover:bg-gray-100 transition-colors text-left">
                <span className="text-base">{btn.icon}</span>
                <span className="text-[10px] font-bold text-gray-600 leading-tight">{btn.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ═══ 인근지역 채용정보 ═══ */}
        <div className="mx-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[14px] font-black text-gray-900">
              {(shop.options?.regionGu || shop.region || '인근')} 채용정보
            </h3>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {Array.from({ length: 4 }, (_, i) => {
              const s = nearbyShops[i];
              if (!s) return (
                <div key={`slot-${i}`} className="bg-white rounded-xl border border-dashed border-gray-200 overflow-hidden">
                  <div className="w-full bg-gray-50 flex items-center justify-center" style={{ aspectRatio: '4/3' }}>
                    <span className="text-[10px] text-gray-300 font-bold">입점문의</span>
                  </div>
                  <div className="p-2.5">
                    <p className="text-[11px] text-gray-300 font-bold">광고 슬롯</p>
                    <p className="text-[10px] text-gray-200 mt-0.5">-</p>
                  </div>
                </div>
              );
              const img = s.banner_image_url || s.media_url || s.options?.mediaUrl;
              const imgFailed = imgErrors.has(s.id);
              return (
                <a key={s.id} href={`/shop/${s.id}`}
                  className="bg-white rounded-xl border border-gray-100 overflow-hidden block active:scale-[0.98] transition-transform"
                >
                  <div className="relative w-full bg-gray-100" style={{ aspectRatio: '4/3' }}>
                    {img && !imgFailed ? (
                      <img src={img} alt={s.name} className="w-full h-full object-cover"
                        onError={() => setImgErrors(prev => new Set([...prev, s.id]))} />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300">
                        <span className="text-[10px] text-gray-400 font-bold text-center px-2 leading-snug">{s.nickname || s.name}</span>
                      </div>
                    )}
                    {(s.tier === 'premium' || s.tier === 'p2') && (
                      <span className="absolute top-1.5 left-1.5 text-[8px] font-black bg-amber-500 text-white px-1.5 py-0.5 rounded">프리미엄</span>
                    )}
                  </div>
                  <div className="p-2.5">
                    <p className="text-[11px] font-black text-gray-900 truncate">{s.nickname || s.name}</p>
                    <p className="text-[10px] text-gray-400 truncate">{s.region}</p>
                    <p className="text-[11px] font-black text-gray-800 mt-0.5">{formatKoreanMoney(s.pay)}</p>
                  </div>
                </a>
              );
            })}
          </div>
        </div>

        <div className="h-4" />
      </div>{/* /스크롤 영역 끝 */}

      {/* ── FOOTER CTA ── */}
      <div className="flex-none bg-white border-t border-gray-100 px-4 py-3 flex gap-2.5 safe-area-bottom">
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
          className="flex-1 py-3.5 bg-amber-400 text-black rounded-2xl flex flex-col items-center justify-center gap-0.5 hover:bg-amber-500 transition active:scale-95"
        >
          <MessageCircle size={18} fill="currentColor" />
          <span className="text-[10px] font-black">카톡문의</span>
        </button>
        <button
          onClick={() => requireVerification(() => { window.location.href = `tel:${managerPhone || shop.phone}`; })}
          className="flex-[2.5] py-3.5 bg-[#1e3a5f] text-white rounded-2xl flex items-center justify-center gap-2 hover:bg-[#162d4a] transition shadow-lg shadow-blue-200 active:scale-95"
        >
          <Phone size={17} fill="currentColor" />
          <span className="text-[13px] font-black tracking-tight">전화/문자 상담하기</span>
        </button>
      </div>
    </div>
  );
}
