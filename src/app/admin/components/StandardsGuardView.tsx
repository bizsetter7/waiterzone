'use client';

import React, { useState, useEffect } from 'react';
import { ShieldCheck, CheckCircle2, AlertCircle, RefreshCw, Server, Zap, CreditCard, Layout, Palette, Search, ChevronDown, ChevronUp } from 'lucide-react';
import {
    AD_TIER_STANDARDS,
    PAY_BADGE_STANDARDS,
    PAID_OPTION_STANDARDS,
    NORMALIZATION_STANDARDS,
    DATA_MAPPING_STANDARDS
} from '@/constants/standards';

const EMPTY_ARRAY: any[] = [];

export const StandardsGuardView = ({ ads = EMPTY_ARRAY, payments = EMPTY_ARRAY }: { ads?: any[], payments?: any[] }) => {
    // Audit function is memoized to satisfy hooks dependency
    const [health, setHealth] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [auditResults, setAuditResults] = useState<any[]>([]);
    const [openSection, setOpenSection] = useState<string | null>(null); // 아코디언 기본 닫힘 (스크롤 최적화)

    const runAudit = React.useCallback(() => {
        const violations: any[] = [];

        // 1. Payment History Audit (Refined for V4 Schema)
        payments.forEach((p: any) => {
            const desc = p.description || p.desc || '';
            const tier = p.pay_type || p.payType || p.metadata?.product_type || '';

            // [Check 1] 비표준 약칭 감지
            if (desc.includes('[주]') || desc.includes('(주)')) {
                violations.push({ id: p.id, type: 'DATA_INTEGRITY', message: `결제 #${p.id}: 제목에 비표준 약어(주)가 포함됨 (플랫폼 가이드 위반)`, severity: 'error' });
            }

            // [Check 2] 광고 등급 약속 준수 (T1~T7)
            const tierStr = String(tier || '').toLowerCase();
            if (tierStr && !AD_TIER_STANDARDS.find(s => s.id === tierStr || s.altId === tierStr)) {
                violations.push({ id: p.id, type: 'SYSTEM_MAPPING', message: `결제 #${p.id}: 정의되지 않은 결제 등급 타입 '${tier}' 탐지 ('AD' 배지 노출 위험)`, severity: 'error' });
            }

            // [Check 3] 결제 방식 표준 (method 사용 여부)
            if (p.payment_method && !p.method) {
                violations.push({ id: p.id, type: 'SYSTEM_MAPPING', message: `결제 #${p.id}: 잘못된 결제 방식 필드명 사용 (payment_method -> method 로 수정 필요)`, severity: 'warning' });
            }
        });

        // 2. Ad Content & Structure Audit (Intelligent Engine)
        ads.forEach((ad: any) => {
            const opt = ad.options || {};
            const adTitle = ad.title || '제목 없음';

            // [Check 1] 지능형 광고 등급 필터 (P1~P7 외 가짜 등급/P8 등 탐지)
            const pt = String(ad.productType || ad.tier || ad.product_type || ad.ad_type || opt.product_type || ad.selectedAdProduct || '').toLowerCase();
            const isValidTier = AD_TIER_STANDARDS.some(s => pt.includes(s.id) || pt.includes(s.altId));

            if (pt && !isValidTier) {
                violations.push({
                    id: ad.id,
                    type: 'SYSTEM_MAPPING',
                    message: `공고 '${adTitle}': 비표준 광고 등급 '${pt}' 사용 중 (P1~P7 규정 위반)`,
                    severity: 'error'
                });
            }

            // [Check 2] 닉네임 유실 검사 (admin_user 외 일반 사용자 대상)
            // (admin_user ID는 시스템에서 별도 프리패스로 관리됨)
            const nicknameStr = (ad.nickname || '').trim();

            if (!nicknameStr) {
                violations.push({
                    id: ad.id,
                    type: 'DATA_INTEGRITY',
                    message: `공고 '${adTitle}': 닉네임 유실 탐지`,
                    severity: 'error'
                });
            }

            // [Check 3] 정규화 필터 (NORMALIZATION_STANDARDS 기반)
            NORMALIZATION_STANDARDS.forEach(s => {
                const val = ad[s.checkKey];
                const isUnnormalized = val === '정보없음' || !val || (Array.isArray(val) && val.length === 0 && s.to !== 'none / []');

                if (isUnnormalized && s.target !== '강조 옵션') { // 옵션은 빈 배열이 정상일 수 있음
                    violations.push({
                        id: ad.id,
                        type: 'SYSTEM_MAPPING',
                        message: `공고 '${adTitle}': ${s.target} 정규화 누약 (예상: '${s.to}')`,
                        severity: 'warning'
                    });
                }
            });

            // [Check 4] 유료 옵션 렌더링 동기화 (UI_SYNC 고도화)
            PAID_OPTION_STANDARDS.forEach(standard => {
                const hasValueInDB = opt[standard.dbKey] || ad[standard.dbKey];
                const hasValueInUI = ad[standard.key];

                if (hasValueInDB && !hasValueInUI) {
                    violations.push({
                        id: ad.id,
                        type: 'UI_SYNC',
                        message: `공고 '${adTitle}': 유료 옵션('${standard.name}') 데이터 유실 (DB 필드 '${standard.dbKey}'는 존재하나 UI 속성 '${standard.key}'이 비어있음)`,
                        severity: 'error'
                    });
                }
            });

            // [Check 5] 필수 비즈니스 데이터 무결성 (금액/업종 누락)
            if (!ad.industryMain && !ad.category) {
                violations.push({ id: ad.id, type: 'DATA_INTEGRITY', message: `공고 '${adTitle}': 업종 정보(industryMain) 누락 (필터링 불가능)`, severity: 'error' });
            }
            if (ad.payType !== '협의' && !(ad.payAmount || ad.pay_amount)) {
                violations.push({ id: ad.id, type: 'DATA_INTEGRITY', message: `공고 '${adTitle}': 급여 타입이 설정되었으나 금액(payAmount) 정보가 0이거나 누락됨`, severity: 'warning' });
            }

            // [Check 6] 급여 타입 동기화 (UI_SYNC 확장)
            const dbPayType = ad.pay_type || opt.pay_type || opt.payType;
            if (dbPayType && dbPayType !== 'nego' && ad.payType === '협의') {
                violations.push({
                    id: ad.id,
                    type: 'UI_SYNC',
                    message: `공고 '${adTitle}': 급여 종류 동기화 누락 (DB: '${dbPayType}', UI: '협의'로 표시됨)`,
                    severity: 'error'
                });
            }
        });

        setAuditResults(violations);
    }, [ads, payments]);

    const fetchHealth = React.useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            // [DDR] 인프라 체크는 데이터 감사와 별개로 진행
            const res = await fetch('/api/admin/health', { method: 'POST' });
            const data = res.ok ? await res.json() : { status: 'unstable' };
            setHealth(data);
        } catch (err: any) {
            console.error('Health fetch error:', err);
            setHealth({ status: 'offline' });
        } finally {
            runAudit();
            setLoading(false);
        }
    }, [runAudit]);

    // [재검증] fetchHealth는 초기 마운트 시에만 실행하여 무한 루프 차단
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchHealth();
        }, 500); 
        return () => clearTimeout(timer);
    }, []); // 의존성 비움: 초기 1회만 실행


    // ads나 payments 데이터가 변경될 때만 감사 실행
    useEffect(() => {
        runAudit();
    }, [ads, payments, runAudit]);



    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* [CRITICAL HEADER] RED ALERT - 가장 먼저 눈에 띄게 배치 */}
            {auditResults.length > 0 && (
                <div className="bg-rose-600 border-4 border-rose-400 rounded-[32px] p-8 shadow-2xl shadow-rose-500/40 animate-pulse-gentle">
                    <div className="flex items-center gap-6 text-white">
                        <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center shrink-0 backdrop-blur-md">
                            <AlertCircle size={40} strokeWidth={3} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black mb-1">무결성 위반 탐지 ({auditResults.length}건)</h2>
                            <p className="font-bold opacity-90 text-sm">시스템 내부에서 데이터 오염이 적발되었습니다. 즉시 수정이 필요합니다.</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Rule Violation Detail List */}
            {auditResults.length > 0 && (
                <div className="grid grid-cols-1 gap-3">
                    {auditResults.map((v, i) => (
                        <div key={i} className="flex items-center justify-between p-5 bg-white rounded-2xl border-2 border-rose-100 shadow-sm">
                            <div className="flex items-center gap-3">
                                <span className={`w-2 h-8 rounded-full ${v.severity === 'error' ? 'bg-rose-500' : 'bg-amber-500'}`}></span>
                                <div>
                                    <div className="text-[10px] font-black text-rose-400 uppercase tracking-widest">CRITICAL VIOLATION</div>
                                    <div className="text-sm font-bold text-gray-800 tracking-tight">{v.message}</div>
                                </div>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-[10px] font-black ${v.severity === 'error' ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'}`}>
                                {v.type}
                            </span>
                        </div>
                    ))}
                </div>
            )}

                {/* 중복된 내부 헤더 도려냄 (v2.0.6) */}

            {
                loading && !health ? (
                    <div className="min-h-[300px] flex items-center justify-center">
                        <RefreshCw className="animate-spin text-indigo-500" size={32} />
                    </div>
                ) : error ? (
                    <div className="bg-rose-50 border border-rose-100 p-8 rounded-[32px] text-center">
                        <AlertCircle className="mx-auto text-rose-500 mb-4" size={48} />
                        <p className="text-rose-600 font-bold">{error}</p>
                        <button onClick={fetchHealth} className="mt-4 px-6 py-2 bg-rose-500 text-white rounded-xl font-bold">다시 시도</button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-6">
                        {/* Intelligent Verification Rules Section */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
                                    <ShieldCheck size={20} className="text-blue-500" />
                                    인텔리전트 검증 규칙 (Smart Rules)
                                </h3>
                                <span className="text-[10px] font-bold text-gray-400">v2.1.final</span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                {/* Rule: Hierarchy Standard [IMMUTABLE] */}
                                <div className="p-5 bg-white rounded-3xl border-2 border-green-100 shadow-sm space-y-3">
                                    <div className="flex items-center gap-2 mb-1">
                                        <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center text-green-500">
                                            <Server size={18} />
                                        </div>
                                        <h4 className="font-black text-gray-900">데이터 참조 계층 (Hierarchy)</h4>
                                    </div>
                                    <p className="text-xs font-bold text-gray-500 leading-relaxed">
                                        UI는 항상 **[Options 스냅샷]**을 최우선 참조합니다.<br />
                                        원본 상점 데이터가 변경되어도 광고 시점의 닉네임과 옵션을 영구 보존하여 데이터 정합성을 보장합니다.
                                    </p>
                                </div>

                                {/* Rule: Ad Tier Colors [IMMUTABLE] */}
                                <div className="p-5 bg-white rounded-3xl border-2 border-purple-100 shadow-sm space-y-3">
                                    <div className="flex items-center gap-2 mb-1">
                                        <div className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center text-purple-500">
                                            <Palette size={18} />
                                        </div>
                                        <h4 className="font-black text-gray-900">광고 등급별 불변 컬러</h4>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        {AD_TIER_STANDARDS.slice(0, 5).map((t, i) => (
                                            <div key={i} className="flex items-center gap-2 text-[10px] font-bold">
                                                <span className={`w-3 h-3 rounded-full ${t.tw}`}></span> {t.name.split(' ')[1].replace('(', '').replace(')', '')}: {t.name.split(' ')[0]}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Rule: Option Abbreviations [IMMUTABLE] */}
                                <div className="p-5 bg-white rounded-3xl border-2 border-indigo-100 shadow-sm space-y-3">
                                    <div className="flex items-center gap-2 mb-1">
                                        <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-500">
                                            <CheckCircle2 size={18} />
                                        </div>
                                        <h4 className="font-black text-gray-900">옵션 약어 표준 (Abbreviation)</h4>
                                    </div>
                                    <p className="text-xs font-bold text-gray-500 leading-relaxed">
                                        리스트 가독성을 위해 약어를 강제합니다:<br />
                                        {PAID_OPTION_STANDARDS.map((o, i) => (
                                            <React.Fragment key={i}>
                                                **{o.name}({o.abbr})**: <span className={o.tw.replace('bg-', 'text-')}>{o.tw}</span><br />
                                            </React.Fragment>
                                        ))}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* [New] Unified Technical Blueprint (Accordion System) */}
                        <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100 space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-1.5 h-6 bg-indigo-500 rounded-full"></div>
                                    <h3 className="text-lg font-black text-gray-900 italic tracking-tighter uppercase">Unified Technical Blueprint</h3>
                                </div>
                                <span className="text-[10px] font-black text-indigo-400 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100 uppercase tracking-widest">Single Source of Truth</span>
                            </div>

                            <div className="space-y-3">
                                {/* Section 0: UI Layering Standard (z-index) - 가장 눈에 띄게 격상 */}
                                <div className="border-4 border-rose-100 rounded-2xl overflow-hidden shadow-md hover:border-rose-200 transition-colors">
                                    <button
                                        onClick={() => setOpenSection(openSection === 'layers' ? null : 'layers')}
                                        className={`w-full px-6 py-5 flex items-center justify-between transition-colors ${openSection === 'layers' ? 'bg-rose-50/50' : 'bg-white hover:bg-rose-50/30'}`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-rose-500 text-white flex items-center justify-center shadow-lg shadow-rose-100">
                                                <Layout size={20} />
                                            </div>
                                            <div>
                                                <span className="block text-sm font-black text-slate-800 tracking-tight text-left">0. UI 레이어 계층 표준 (z-index Regulation)</span>
                                                <span className="text-[10px] font-bold text-rose-400 uppercase tracking-widest block text-left">Global Layering Protocol</span>
                                            </div>
                                        </div>
                                        {openSection === 'layers' ? <ChevronUp size={16} className="text-rose-500" /> : <ChevronDown size={16} className="text-slate-300" />}
                                    </button>
                                    {openSection === 'layers' && (
                                        <div className="p-8 bg-white border-t border-rose-50 animate-in slide-in-from-top-2 duration-300 space-y-6">
                                            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                                    <div className="text-[10px] font-black text-slate-400 mb-2 uppercase">Floating Toast</div>
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-xs font-black text-slate-900">FLOATING (알림팝업)</span>
                                                        <span className="text-slate-400 font-mono font-black text-lg">9000</span>
                                                    </div>
                                                </div>
                                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                                    <div className="text-[10px] font-black text-slate-400 mb-2 uppercase">Core Frame</div>
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-xs font-black text-slate-900">HEADER (상단 헤더)</span>
                                                        <span className="text-rose-500 font-mono font-black text-lg">10000</span>
                                                    </div>
                                                </div>
                                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                                    <div className="text-[10px] font-black text-slate-400 mb-2 uppercase">Ad Layout</div>
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-xs font-black text-slate-900">SIDEBAR (좌우 배너)</span>
                                                        <span className="text-rose-500 font-mono font-black text-lg">10001</span>
                                                    </div>
                                                </div>
                                                <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100">
                                                    <div className="text-[10px] font-black text-amber-500 mb-2 uppercase">Verify Gate</div>
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-xs font-black text-amber-900">VERIFICATION_GATE</span>
                                                        <span className="text-amber-600 font-mono font-black text-lg">11000</span>
                                                    </div>
                                                </div>
                                                <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100 ring-2 ring-rose-200">
                                                    <div className="text-[10px] font-black text-rose-400 mb-2 uppercase">System Modal</div>
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-xs font-black text-rose-900">MODAL (표준 팝업)</span>
                                                        <span className="text-rose-600 font-mono font-black text-xl underline decoration-rose-200">20000</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="bg-rose-50/50 p-5 rounded-2xl border border-rose-100">
                                                <h4 className="text-xs font-black text-rose-700 mb-2 flex items-center gap-2">
                                                    <AlertCircle size={14} /> 운영 절대 수칙 (Ironclad Rule)
                                                </h4>
                                                <p className="text-[11px] font-bold text-rose-600 leading-relaxed">
                                                    모든 팝업(MODAL)은 반드시 사이드바(`10001`)보다 높은 **`20000`** 수치를 유지해야 합니다.<br />
                                                    성인인증 게이트(VERIFICATION_GATE `11000`)는 헤더는 덮되, 시스템 모달보다는 낮게 유지합니다.<br />
                                                    관리자 페이지의 주요 모달은 오픈 시 반드시 배경 스크롤을 차단(`useBodyScrollLock`)해야 합니다.<br />
                                                    팝업 시 헤더나 사이드바가 노출되는 것은 시스템 보안 및 UI 무결성 결함으로 간주되어 즉각 수정 대상이 됩니다.
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Section 1: Ad Tiers */}
                                <div className="border border-slate-100 rounded-2xl overflow-hidden shadow-sm hover:border-indigo-100 transition-colors">
                                    <button
                                        onClick={() => setOpenSection(openSection === 'tiers' ? null : 'tiers')}
                                        className={`w-full px-6 py-4 flex items-center justify-between transition-colors ${openSection === 'tiers' ? 'bg-indigo-50/50' : 'bg-white hover:bg-gray-50'}`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center">
                                                <Zap size={18} />
                                            </div>
                                            <span className="text-sm font-black text-slate-800">1. 광고 등급 및 가중치 표준 (Ad Tiers)</span>
                                        </div>
                                        {openSection === 'tiers' ? <ChevronUp size={16} className="text-indigo-600" /> : <ChevronDown size={16} className="text-slate-300" />}
                                    </button>
                                    {openSection === 'tiers' && (
                                        <div className="p-6 bg-white border-t border-slate-50 animate-in slide-in-from-top-2 duration-300">
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                {AD_TIER_STANDARDS.map((tier, i) => (
                                                    <div key={i} className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-center">
                                                        <div className={`text-xs font-black mb-1 p-1 rounded font-mono ${tier.tw.replace('bg-', 'text-')}`}>{tier.id}</div>
                                                        <div className="text-[10px] font-bold text-slate-500">{tier.name}</div>
                                                        <div className="text-[10px] font-black text-indigo-500 mt-1">Alt: {tier.altId}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Section 2: Pay Badges */}
                                <div className="border border-slate-100 rounded-2xl overflow-hidden shadow-sm hover:border-indigo-100 transition-colors">
                                    <button
                                        onClick={() => setOpenSection(openSection === 'badges' ? null : 'badges')}
                                        className={`w-full px-6 py-4 flex items-center justify-between transition-colors ${openSection === 'badges' ? 'bg-indigo-50/50' : 'bg-white hover:bg-gray-50'}`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center">
                                                <CreditCard size={18} />
                                            </div>
                                            <span className="text-sm font-black text-slate-800">2. 급여 배지 스타일 가이드 (Pay Badges)</span>
                                        </div>
                                        {openSection === 'badges' ? <ChevronUp size={16} className="text-indigo-600" /> : <ChevronDown size={16} className="text-slate-300" />}
                                    </button>
                                    {openSection === 'badges' && (
                                        <div className="p-6 bg-white border-t border-slate-50 animate-in slide-in-from-top-2 duration-300">
                                            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                                {PAY_BADGE_STANDARDS.map((badge, i) => (
                                                    <div key={i} className="flex flex-col items-center">
                                                        <span className={`px-3 py-1 rounded text-[10px] font-black text-white ${badge.tw}`}>{badge.name}</span>
                                                        <span className="text-[10px] text-slate-400 mt-2 font-mono">{badge.tw}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Section 3: Option Abbreviations */}
                                <div className="border border-slate-100 rounded-2xl overflow-hidden shadow-sm hover:border-indigo-100 transition-colors">
                                    <button
                                        onClick={() => setOpenSection(openSection === 'options' ? null : 'options')}
                                        className={`w-full px-6 py-4 flex items-center justify-between transition-colors ${openSection === 'options' ? 'bg-indigo-50/50' : 'bg-white hover:bg-gray-50'}`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center">
                                                <CheckCircle2 size={18} />
                                            </div>
                                            <span className="text-sm font-black text-slate-800">3. 옵션 명칭 및 약어 매핑 (Abbreviations)</span>
                                        </div>
                                        {openSection === 'options' ? <ChevronUp size={16} className="text-indigo-600" /> : <ChevronDown size={16} className="text-slate-300" />}
                                    </button>
                                    {openSection === 'options' && (
                                        <div className="p-6 bg-white border-t border-slate-50 animate-in slide-in-from-top-2 duration-300">
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-4 gap-x-8">
                                                {PAID_OPTION_STANDARDS.map((opt, i) => (
                                                    <div key={i} className="flex items-center justify-between border-b border-slate-100 pb-2">
                                                        <div className="flex flex-col">
                                                            <span className="text-xs font-black">{opt.name}</span>
                                                            <span className="text-[10px] text-slate-400 font-mono italic">{opt.key} / {opt.dbKey}</span>
                                                        </div>
                                                        <div className="flex flex-col items-end">
                                                            <span className={`text-[10px] font-black px-2 py-0.5 rounded ${opt.tw.replace('bg-', 'text-').replace('text-white', 'text-slate-900')}`}>{opt.abbr}</span>
                                                            <span className="text-[9px] text-slate-400 font-mono mt-1">{opt.tw}</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Section 4: Data Normalization */}
                                <div className="border border-slate-100 rounded-2xl overflow-hidden shadow-sm hover:border-indigo-100 transition-colors">
                                    <button
                                        onClick={() => setOpenSection(openSection === 'normalization' ? null : 'normalization')}
                                        className={`w-full px-6 py-4 flex items-center justify-between transition-colors ${openSection === 'normalization' ? 'bg-indigo-50/50' : 'bg-white hover:bg-gray-50'}`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center">
                                                <RefreshCw size={18} />
                                            </div>
                                            <span className="text-sm font-black text-slate-800">4. 데이터 정규화 및 폴백 (Normalization)</span>
                                        </div>
                                        {openSection === 'normalization' ? <ChevronUp size={16} className="text-indigo-600" /> : <ChevronDown size={16} className="text-slate-300" />}
                                    </button>
                                    {openSection === 'normalization' && (
                                        <div className="p-6 bg-white border-t border-slate-50 animate-in slide-in-from-top-2 duration-300 space-y-4">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {NORMALIZATION_STANDARDS.map((norm, i) => (
                                                    <div key={i} className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                                                        <div className="flex justify-between mb-2">
                                                            <span className="text-[10px] font-black text-indigo-500 uppercase">{norm.target}</span>
                                                            <span className="text-[10px] font-mono text-slate-400">{norm.checkKey}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-[11px] font-bold text-slate-800">Null / Information Gap</span>
                                                            <span className="text-slate-400">→</span>
                                                            <span className="text-[11px] font-black text-indigo-600 italic">'{norm.to}'</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Section 5: Data Mapping (Detailed Schema) */}
                                <div className="border border-slate-100 rounded-2xl overflow-hidden shadow-sm hover:border-indigo-100 transition-colors">
                                    <button
                                        onClick={() => setOpenSection(openSection === 'mapping' ? null : 'mapping')}
                                        className={`w-full px-6 py-4 flex items-center justify-between transition-colors ${openSection === 'mapping' ? 'bg-indigo-50/50' : 'bg-white hover:bg-gray-50'}`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center">
                                                <Server size={18} />
                                            </div>
                                            <span className="text-sm font-black text-slate-800">5. 핵심 데이터 매핑 및 스키마 명세 (Data Mapping)</span>
                                        </div>
                                        {openSection === 'mapping' ? <ChevronUp size={16} className="text-indigo-600" /> : <ChevronDown size={16} className="text-slate-300" />}
                                    </button>
                                    {openSection === 'mapping' && (
                                        <div className="p-6 bg-white border-t border-slate-50 animate-in slide-in-from-top-2 duration-300">
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                                {DATA_MAPPING_STANDARDS.map((map, i) => (
                                                    <div key={i} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:shadow-md transition-all">
                                                        <div className="text-[10px] font-black text-indigo-500 mb-2 uppercase">{map.item}</div>
                                                        <div className="space-y-2">
                                                            <div className="flex justify-between items-center text-[11px]">
                                                                <span className="text-slate-400 font-bold">DB</span>
                                                                <code className="bg-indigo-100 px-2 py-0.5 rounded text-indigo-700 font-bold">{map.db}</code>
                                                            </div>
                                                            <div className="flex justify-between items-center text-[11px]">
                                                                <span className="text-slate-400 font-bold">UI</span>
                                                                <code className="bg-slate-200 px-2 py-0.5 rounded text-slate-600 font-bold">{map.ui}</code>
                                                            </div>
                                                        </div>
                                                        <div className="mt-3 pt-2 border-t border-slate-200 text-[10px] font-bold text-slate-400 leading-tight">
                                                            {map.required ? '✅ 필수 항목' : '⬜ 선택 항목'}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Section 6: User Protection Standard (Nickname Policy) */}
                                <div className="border border-slate-100 rounded-2xl overflow-hidden shadow-sm hover:border-indigo-100 transition-colors">
                                    <button
                                        onClick={() => setOpenSection(openSection === 'privacy' ? null : 'privacy')}
                                        className={`w-full px-6 py-4 flex items-center justify-between transition-colors ${openSection === 'privacy' ? 'bg-indigo-50/50' : 'bg-white hover:bg-gray-50'}`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center">
                                                <ShieldCheck size={18} />
                                            </div>
                                            <span className="text-sm font-black text-slate-800">6. 사용자 프라이버시 노출 정책 (Nickname Policy)</span>
                                        </div>
                                        {openSection === 'privacy' ? <ChevronUp size={16} className="text-indigo-600" /> : <ChevronDown size={16} className="text-slate-300" />}
                                    </button>
                                    {openSection === 'privacy' && (
                                        <div className="p-6 bg-white border-t border-slate-50 animate-in slide-in-from-top-2 duration-300 space-y-4">
                                            <div className="bg-indigo-50/50 p-5 rounded-2xl border border-indigo-100">
                                                <h4 className="text-xs font-black text-indigo-700 mb-3 flex items-center gap-2 underline underline-offset-4 decoration-indigo-200">개인정보 노출 원칙 (Privacy Protocol)</h4>
                                                <p className="text-[11px] font-bold text-slate-600 leading-relaxed text-left">
                                                    1. 모든 공고 및 커뮤니티에는 **[닉네임]**만 노출한다.<br />
                                                    2. 작성자의 실명(`user_name`) 또는 아이디는 프론트엔드 렌더링 영역에서 완전 배제한다.<br />
                                                    3. 게스트 및 닉네임 미설정 유저는 **'익명'**으로 강제 치환하여 데이터 유출을 차단한다.
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* [New] Additional Technical Specification Cards (Bottom) */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                             {/* 7. Ad Item Specification (List Cards) */}
                             <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100 space-y-6">
                                <h3 className="text-sm font-black text-gray-900 mb-6 flex items-center gap-2">
                                    <span className="w-1.5 h-6 bg-purple-500 rounded-full"></span>
                                    공고 아이콘 및 리스트 규격 (List Card Spec)
                                </h3>

                                <div className="space-y-4">
                                    {/* 7.1 Tier Icons Mapping — 현행 야사장 구독 플랜 우선 + legacy는 흐리게 */}
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="w-2 h-2 rounded-full bg-purple-400"></div>
                                            <h4 className="text-xs font-black text-slate-700">Tier Icons Mapping (PC/Mobile)</h4>
                                        </div>
                                        <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
                                            {AD_TIER_STANDARDS.filter(t => !t.legacy).map((t, i) => (
                                                <div key={i} className="flex flex-col items-center gap-1 p-2 bg-slate-50 rounded-lg">
                                                    <div className={`w-8 h-8 rounded-lg ${t.tw} flex items-center justify-center text-white`}>
                                                        <Zap size={16} />
                                                    </div>
                                                    <span className="text-[9px] font-black text-slate-500 uppercase">{t.id}</span>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="pt-2 mt-2 border-t border-dashed border-rose-200">
                                            <p className="text-[9px] font-black text-rose-400 mb-2 uppercase tracking-widest">Legacy (사용 중지)</p>
                                            <div className="grid grid-cols-3 md:grid-cols-5 gap-3 opacity-50">
                                                {AD_TIER_STANDARDS.filter(t => t.legacy).map((t, i) => (
                                                    <div key={i} className="flex flex-col items-center gap-1 p-2 bg-rose-50/30 rounded-lg border border-dashed border-rose-200">
                                                        <div className={`w-8 h-8 rounded-lg ${t.tw} flex items-center justify-center text-white`}>
                                                            <Zap size={16} />
                                                        </div>
                                                        <span className="text-[9px] font-black text-rose-400 uppercase">{t.id}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* 7.2 Job Category Fallback Icons */}
                                    <div className="space-y-3 pt-4 border-t border-slate-50">
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="w-2 h-2 rounded-full bg-indigo-400"></div>
                                            <h4 className="text-xs font-black text-slate-700">Category / Fallback UI</h4>
                                        </div>
                                        <div className="flex flex-wrap gap-4">
                                            <div className="flex items-center gap-2 px-3 py-2 bg-indigo-50 rounded-xl border border-indigo-100">
                                                <Layout size={14} className="text-indigo-600" />
                                                <span className="text-[10px] font-bold text-slate-600">Standard Card: Col-Span-2</span>
                                            </div>
                                            <div className="flex items-center gap-2 px-3 py-2 bg-rose-50 rounded-xl border border-rose-100">
                                                <AlertCircle size={14} className="text-rose-600" />
                                                <span className="text-[10px] font-bold text-slate-600">No Image: [Fallback] Logo</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* 7.3 paySuffixes 급여추가옵션 표시 규칙 ⭐ PROTECTED */}
                                    <div className="space-y-3 pt-4 border-t border-slate-50">
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                                            <h4 className="text-xs font-black text-slate-700">급여추가옵션 (paySuffixes) 표시 규칙</h4>
                                        </div>
                                        <div className="bg-blue-50/50 rounded-xl border border-blue-100 p-4 space-y-2">
                                            <p className="text-[10px] font-black text-blue-700 uppercase tracking-wider mb-2">⭐ Row3 표시 기준 (ShopCard.tsx)</p>
                                            <div className="space-y-1.5 text-[10px] font-bold text-slate-600 leading-relaxed">
                                                <div className="flex items-start gap-2">
                                                    <span className="text-blue-400 shrink-0">①</span>
                                                    <span><b>step4 편의사항 선택값</b>을 카드 Row3에 표시 — DB 경로: <span className="font-mono bg-white px-1 rounded border border-blue-100">options.paySuffixes</span></span>
                                                </div>
                                                <div className="flex items-start gap-2">
                                                    <span className="text-blue-400 shrink-0">②</span>
                                                    <span><b>4개 이하</b>: 정적 가로 나열 (flex row)</span>
                                                </div>
                                                <div className="flex items-start gap-2">
                                                    <span className="text-blue-400 shrink-0">③</span>
                                                    <span><b>5개 이상</b>: <span className="font-mono bg-white px-1 rounded border border-blue-100">keyword-marquee</span> 클래스로 무한 슬라이드 애니메이션 (배열 2회 반복)</span>
                                                </div>
                                                <div className="flex items-start gap-2">
                                                    <span className="text-blue-400 shrink-0">④</span>
                                                    <span>광고 상세 팝업(JobDetailContent)에서도 동일 paySuffixes 값을 급여 우측 3열 그리드로 표시</span>
                                                </div>
                                                <div className="flex items-start gap-2 pt-1 border-t border-blue-100">
                                                    <span className="text-rose-500 shrink-0">🚫</span>
                                                    <span className="text-rose-600"><b>paySuffixes를 고정 텍스트로 대체하거나 제거 금지</b> — 업체가 step4에서 선택한 값이 반드시 리스트·팝업 양쪽에 노출되어야 함</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* 8. Card Layout Blueprints */}
                            <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100 space-y-6">
                                <h3 className="text-sm font-black text-gray-900 mb-6 flex items-center gap-2">
                                    <span className="w-1.5 h-6 bg-amber-500 rounded-full"></span>
                                    카드 레이아웃 정교화 사양 (Card Blueprint)
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* 8.1 Platinum/Special Structure */}
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="w-2 h-2 rounded-full bg-amber-400"></div>
                                            <h4 className="text-xs font-black text-slate-700">Platinum / Special (Standard)</h4>
                                        </div>
                                        <div className="bg-white rounded-xl border-2 border-indigo-200 overflow-hidden shadow-indigo-100 shadow-lg">
                                            <div className="bg-indigo-600 h-2 w-full"></div>
                                            <div className="p-3 bg-indigo-50/30 text-[9px] font-bold text-slate-500 border-b border-indigo-100">Image (4:3) + Header Tag</div>
                                            <div className="p-3 space-y-1">
                                                <div className="bg-slate-100 h-3 w-4/5 rounded"></div>
                                                <div className="bg-slate-50 h-2 w-1/2 rounded"></div>
                                                <div className="flex gap-1 mt-2">
                                                    <div className="w-4 h-4 bg-indigo-100 rounded"></div>
                                                    <div className="w-4 h-4 bg-indigo-100 rounded"></div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* 8.3 Urgent Card Structure */}
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="w-2 h-2 rounded-full bg-red-400"></div>
                                            <h4 className="text-xs font-black text-slate-700">Urgent / Recommended Card</h4>
                                        </div>
                                        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                                            <div className="bg-slate-100 px-3 py-2 text-[10px] font-bold text-slate-500 border-b border-slate-200">No Image Structure</div>
                                            <div className="p-3 space-y-2 text-[11px]">
                                                <div className="flex justify-between text-slate-600 font-bold border-b pb-2"><span>1. Region (Detail)</span><span>Job (Detail)</span></div>
                                                <div className="text-slate-500">2. Nickname</div>
                                                <div className="bg-yellow-50 p-1 border border-yellow-100 rounded text-slate-800">
                                                    3. [Icon/TextBadge] + [Highlighter] + Title (Max 2 lines)
                                                </div>
                                                <div className="font-bold text-slate-700">4. [PayBadge] + Amount</div>
                                                <div className="text-slate-400 text-[10px]">5. Pay Options</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 9. Responsive & Fallback Logic (New) */}
                        <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100 space-y-6">
                            <h3 className="text-sm font-black text-gray-900 mb-6 flex items-center gap-2">
                                <span className="w-1.5 h-6 bg-teal-500 rounded-full"></span>
                                반응형 레이아웃 및 리소스 방어 로직 (Responsive & Fallback)
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* 9.1 Sidebar Grid Adaptation */}
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-2 h-2 rounded-full bg-teal-400"></div>
                                        <h4 className="text-xs font-black text-slate-700">Sidebar Grid Adaptation</h4>
                                    </div>
                                    <div className="bg-teal-50 rounded-xl p-4 border border-teal-100 space-y-2">
                                        <div className="flex justify-between text-[11px] items-center">
                                            <span className="text-slate-500 font-bold">Standard Page (No Sidebar)</span>
                                            <span className="bg-white px-2 py-1 rounded text-teal-600 font-mono font-bold border border-teal-200">Col-6 (PC)</span>
                                        </div>
                                        <div className="flex justify-between text-[11px] items-center">
                                            <span className="text-slate-500 font-bold">Sidebar Page (Job/Region)</span>
                                            <span className="bg-white px-2 py-1 rounded text-teal-600 font-mono font-bold border border-teal-200">Col-4 (PC)</span>
                                        </div>
                                        <div className="text-[10px] text-teal-600 font-bold mt-2 pt-2 border-t border-teal-200/50">
                                            * `hasSidebar` prop controls `AdSection` grid columns automatically.
                                        </div>
                                    </div>
                                </div>

                                {/* 9.2 Image Resource Defense */}
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-2 h-2 rounded-full bg-rose-400"></div>
                                        <h4 className="text-xs font-black text-slate-700">Image Resource Defense (Fallback)</h4>
                                    </div>
                                    <div className="bg-rose-50 rounded-xl p-4 border border-rose-100 space-y-2">
                                        <div className="flex justify-between text-[11px] items-center">
                                            <span className="text-slate-500 font-bold">Image Load Error</span>
                                            <span className="font-bold text-rose-500">Trigger `onError`</span>
                                        </div>
                                        <div className="flex justify-between text-[11px] items-center">
                                            <span className="text-slate-500 font-bold">Fallback UI</span>
                                            <span className="font-bold text-slate-700">[Icon] + [WorkType]</span>
                                        </div>
                                        <div className="text-[10px] text-rose-600 font-bold mt-2 pt-2 border-t border-rose-200/50">
                                            * Prevents broken image icons. Maintains layout integrity (4:3 aspect ratio).
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                         {/* 10. Integrated Inquiry System */}
                         <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100 space-y-6">
                            <h3 className="text-sm font-black text-gray-900 mb-6 flex items-center gap-2 text-left">
                                <span className="w-1.5 h-6 bg-slate-800 rounded-full"></span>
                                통합 문의 관리 시스템 (Inquiry System Architecture)
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* 10.1 List View Logic */}
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-2 h-2 rounded-full bg-slate-500"></div>
                                        <h4 className="text-xs font-black text-slate-700">List View Logic (2-Row)</h4>
                                    </div>
                                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3">
                                        <div className="flex items-start gap-3 p-2 bg-white rounded-lg border border-slate-100 shadow-sm">
                                            <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-400">Badge</div>
                                            <div className="flex-1 space-y-1 text-left">
                                                <div className="h-2 w-3/4 bg-slate-200 rounded"></div>
                                                <div className="h-1.5 w-1/2 bg-slate-100 rounded"></div>
                                            </div>
                                        </div>
                                        <ul className="text-[10px] text-slate-500 space-y-1 list-disc pl-4 text-left font-bold">
                                            <li><strong>Row 1</strong>: [Type Badge] + Title (Truncated)</li>
                                            <li><strong>Row 2</strong>: ShopName + UserID + Contact</li>
                                            <li><strong>Sort</strong>: Latest Activity (Created or Replied)</li>
                                        </ul>
                                    </div>
                                </div>

                                {/* 10.2 Detail View Logic */}
                                <div className="space-y-3 text-left">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                                        <h4 className="text-xs font-black text-slate-700">Detail View (Chat Thread)</h4>
                                    </div>
                                    <div className="bg-indigo-50/50 rounded-xl p-4 border border-indigo-100 space-y-3">
                                        <div className="space-y-2">
                                            <div className="flex justify-end"><div className="bg-indigo-100 text-indigo-800 text-[9px] px-2 py-1 rounded-lg font-bold">Admin Reply</div></div>
                                            <div className="flex justify-start"><div className="bg-white text-slate-700 text-[9px] px-2 py-1 rounded-lg border border-slate-200 font-bold">User Inquiry</div></div>
                                        </div>
                                        <ul className="text-[10px] text-slate-500 space-y-1 list-disc pl-4 font-bold">
                                            <li><strong>Thread</strong>: Grouped by `parent_id` or `partner_id`</li>
                                            <li><strong>Input</strong>: Fixed Bottom (Sticky)</li>
                                            <li><strong>Optimistic UI</strong>: Immediate update on send</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
        </div>
    );
};
