'use client';

import React, { useState, useRef, useEffect } from 'react';
import { FileText, Check, Search, AlertCircle, Upload, X, ChevronDown, Loader2, ShieldCheck } from 'lucide-react';
import { JOB_CATEGORIES } from '@/constants/jobs';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { formatBizNumber } from '../../../utils';

interface Step1Props {
    brand: any;
    shopName: string;
    setShopName: (v: string) => void;
    shopAddress?: string;
    setShopAddress?: (v: string) => void;
    isVerified: boolean;
    setIsVerified: (v: boolean) => void;
    nickname: string;
    setNickname: (v: string) => void;
    industryMain: string;
    setIndustryMain: (v: string) => void;
    managerName: string;
    setManagerName: (v: string) => void;
    managerPhone: string;
    setManagerPhone: (v: string) => void;
    messengers: any;
    setMessengers: (v: any) => void;
}

export const Step1BasicInfo: React.FC<Step1Props> = ({
    brand, shopName, setShopName, shopAddress = '', setShopAddress,
    isVerified, setIsVerified,
    nickname, setNickname, industryMain, setIndustryMain,
    managerName, setManagerName, managerPhone, setManagerPhone,
    messengers, setMessengers
}) => {
    const { user, userType } = useAuth();
    const [bizNumber, setBizNumber] = useState('');
    const [bizStatus, setBizStatus] = useState<'idle' | 'loading' | 'valid' | 'invalid' | 'closed' | 'suspended'>('idle');
    const [bizStatusText, setBizStatusText] = useState('');
    const [bizDocFile, setBizDocFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // [사업자 인증] 인증된 프로필에서 자동 반영
    const [bizProfile, setBizProfile] = useState<any>(null);

    useEffect(() => {
        if (!user?.id || userType !== 'corporate') return;

        const loadBizProfile = async () => {
            const { data } = await supabase
                .from('profiles')
                .select('business_name, business_number, business_type, business_address, manager_phone, manager_kakao, manager_line, manager_telegram, business_verified, business_verify_status, full_name')
                .eq('id', user.id)
                .single();

            if (data && (data as any).business_verified) {
                const p = data as any;
                setBizProfile(p);

                // 인증된 정보를 폼에 자동 반영
                // [Fix] 상호명은 프로필 값으로 항상 덮어쓰기
                if (p.business_name) setShopName(p.business_name);
                // [Fix] 업종(business_type)은 Step1에 표시만 (bizProfile에 보관) — industryMain(공고 직종)과 분리
                if (!shopAddress && p.business_address && setShopAddress) setShopAddress(p.business_address);
                if (!managerName && p.full_name) setManagerName(p.full_name);
                if (!managerPhone && p.manager_phone) setManagerPhone(p.manager_phone);
                if ((!messengers.kakao && !messengers.line && !messengers.telegram) &&
                    (p.manager_kakao || p.manager_line || p.manager_telegram)) {
                    setMessengers({
                        kakao: p.manager_kakao || '',
                        line: p.manager_line || '',
                        telegram: p.manager_telegram || '',
                    });
                }
                // 사업자 번호를 로컬 state에 표시
                if (p.business_number) {
                    setBizNumber(formatBizNumber(p.business_number));
                    setBizStatus('valid');
                    setBizStatusText('인증된 사업자 (관리자 승인 완료)');
                    setIsVerified(true);
                }
            }
        };

        loadBizProfile();
    }, [user?.id, userType]);

    // 인증된 사업자인지 여부
    const isCertified = bizProfile?.business_verified === true;

    const handleVerify = async () => {
        const raw = bizNumber.replace(/\D/g, '');
        if (raw.length !== 10) {
            setBizStatus('invalid');
            setBizStatusText('10자리 사업자 등록번호를 입력해주세요.');
            return;
        }
        setBizStatus('loading');
        try {
            const res = await fetch('/api/nts/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ businessNumber: raw }),
            });
            const data = await res.json();
            if (data.status === '정상') {
                setBizStatus('valid');
                setBizStatusText(data.statusText || '계속사업자');
                setIsVerified(true);
            } else if (data.status === '휴업') {
                setBizStatus('suspended');
                setBizStatusText('휴업 사업자입니다. 광고 등록이 불가합니다.');
                setIsVerified(false);
            } else if (data.status === '폐업') {
                setBizStatus('closed');
                setBizStatusText('폐업 사업자입니다. 광고 등록이 불가합니다.');
                setIsVerified(false);
            } else {
                setBizStatus('invalid');
                setBizStatusText(data.message || '국세청에 등록되지 않은 사업자번호입니다.');
                setIsVerified(false);
            }
        } catch {
            setBizStatus('invalid');
            setBizStatusText('조회 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
            setIsVerified(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        setBizDocFile(file);
    };

    const isDark = brand.theme === 'dark';
    const inputCls = `w-full border rounded-lg p-2 text-sm font-bold outline-none focus:ring-2 ${isDark ? 'bg-gray-800 border-gray-700 text-white focus:ring-blue-900/50' : 'bg-gray-50 border-gray-200 text-black focus:ring-blue-400/40'}`;
    const labelCls = `block text-xs font-black mb-1.5 ${isDark ? 'text-gray-400' : 'text-black'}`;

    return (
        <section id="myshop-step-1" className={`p-2 md:p-5 rounded-[32px] shadow-lg border-2 overflow-hidden ${isDark ? 'bg-gradient-to-br from-blue-950 via-gray-900 to-gray-950 border-blue-900/50' : 'bg-gradient-to-br from-blue-50 via-white to-cyan-50 border-blue-200'}`}>
            <div className="bg-gradient-to-r from-blue-600 via-cyan-500 to-blue-600 text-white p-4 rounded-2xl mb-3 md:mb-6 shadow-xl text-center md:text-left">
                <h2 className="font-black text-lg md:text-xl flex items-center justify-center md:justify-start gap-2">
                    <FileText size={24} className="text-white" />
                    STEP 1: 기본 정보 입력
                </h2>
                <p className="text-[13px] font-bold opacity-90 mt-1">업소 정보와 담당자 연락처를 정확히 입력해주세요.</p>
            </div>

            <div className="space-y-4">
                {/* ── 사업자 기본 정보 ── */}
                <div className={`p-3 md:p-4 rounded-2xl shadow-sm border ${isDark ? 'bg-gray-900/50 border-gray-800' : 'bg-white/80 backdrop-blur-sm border-gray-100'}`}>
                    <h2 className="font-black text-gray-800 mb-3 md:mb-4 flex items-center gap-2 text-sm">
                        <span className="w-1.5 h-4 bg-purple-500 rounded-full"></span>
                        사업자 기본 정보
                        {isCertified && (
                            <span className="ml-auto flex items-center gap-1 px-2.5 py-1 bg-green-100 text-green-700 rounded-full text-[10px] font-black">
                                <ShieldCheck size={12} /> 인증된 사업자
                            </span>
                        )}
                    </h2>
                    {isCertified && (
                        <div className="mb-3 px-3 py-2 bg-green-50 border border-green-200 rounded-xl text-[11px] text-green-700 font-bold flex items-center gap-2">
                            <ShieldCheck size={13} className="shrink-0" />
                            회원정보에 등록된 인증 사업자 정보가 자동으로 반영되었습니다. 광고 닉네임만 별도 설정하세요.
                        </div>
                    )}

                    {/* 1행: 상호명 + 업종선택 */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 mb-3 md:mb-4">
                        {/* 상호명 */}
                        <div>
                            <label className={labelCls}><span className="text-red-500 mr-1">*</span>상호명</label>
                            <input
                                type="text"
                                placeholder="사업자등록증의 상호명을 입력하세요"
                                value={shopName}
                                onChange={(e) => setShopName(e.target.value)}
                                className={`${inputCls} ${isVerified ? 'opacity-60 cursor-not-allowed' : ''}`}
                                readOnly={isVerified}
                            />
                        </div>

                        {/* 업종선택 — 인증된 사업자: 사업자 인증 업종 표시(read-only), 미인증: 직접 선택 */}
                        <div>
                            <label className={labelCls}><span className="text-red-500 mr-1">*</span>업종선택</label>
                            {isCertified && bizProfile?.business_type ? (
                                // [Fix] 인증된 사업자 업종은 프로필 값으로 고정 표시 (industryMain/공고 직종과 무관)
                                <div className={`${inputCls} opacity-60 cursor-not-allowed flex items-center justify-between`}>
                                    <span>{bizProfile.business_type}</span>
                                    <span className="text-[10px] text-gray-400 font-bold">인증 업종</span>
                                </div>
                            ) : (
                                <div className="relative">
                                    <select
                                        value={industryMain}
                                        onChange={(e) => setIndustryMain(e.target.value)}
                                        className={`${inputCls} appearance-none pr-8 cursor-pointer`}
                                    >
                                        <option value="">업종선택</option>
                                        {JOB_CATEGORIES.map(cat => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                    <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* 2행: 사업자번호 + 등록증첨부 + 광고닉네임 (3열) */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
                        {/* 사업자등록번호 */}
                        <div>
                            <div className="flex items-center gap-1.5 mb-1.5">
                                <label className="text-xs font-black shrink-0" style={{color: isDark ? '#9ca3af' : '#000'}}><span className="text-red-500 mr-1">*</span>사업자등록번호</label>
                                <span className="text-gray-400 text-[10px] font-bold">※사업자 미인증시 등록불가</span>
                            </div>
                            {isVerified ? (
                                <div>
                                    <div className="py-2 bg-green-50 border border-green-200 rounded-lg text-green-700 text-xs font-bold flex items-center justify-center gap-1.5 mb-1">
                                        <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center text-white shrink-0"><Check size={12} strokeWidth={3} /></div>
                                        {bizNumber} 인증완료
                                    </div>
                                    {!isCertified && (
                                        <button type="button" onClick={() => { setIsVerified(false); setBizStatus('idle'); setBizDocFile(null); }} className="text-xs text-gray-400 hover:text-gray-600 font-bold underline">재입력</button>
                                    )}
                                </div>
                            ) : (
                                <div>
                                    <div className="flex gap-1.5 mb-1">
                                        <input
                                            type="text"
                                            placeholder="000-00-00000"
                                            value={bizNumber}
                                            onChange={(e) => { setBizNumber(formatBizNumber(e.target.value)); setBizStatus('idle'); }}
                                            maxLength={12}
                                            className={`${inputCls} ${bizStatus === 'invalid' ? 'border-red-400' : ''}`}
                                        />
                                        <button
                                            type="button"
                                            onClick={handleVerify}
                                            disabled={bizStatus === 'loading'}
                                            className="px-2.5 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg text-[11px] font-black flex items-center gap-1 shrink-0 transition whitespace-nowrap"
                                        >
                                            {bizStatus === 'loading'
                                                ? <><Loader2 size={12} className="animate-spin" /> 조회중</>
                                                : <><Search size={12} /> 조회</>
                                            }
                                        </button>
                                    </div>
                                    {(bizStatus === 'invalid' || bizStatus === 'closed' || bizStatus === 'suspended') && (
                                        <p className="flex items-center gap-1 text-red-500 text-[10px] font-bold"><AlertCircle size={11} /> {bizStatusText}</p>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* 사업자등록증 첨부 */}
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <label className={`${labelCls} mb-0 shrink-0`}><span className="text-red-500 mr-1">*</span>사업자등록증 첨부</label>
                                {isCertified ? (
                                    <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg border text-xs font-bold shrink-0 bg-green-50 border-green-200 text-green-700">
                                        <Check size={11} strokeWidth={3} /> 인증완료
                                    </div>
                                ) : bizDocFile ? (
                                    <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border text-xs font-bold shrink-0 ${isDark ? 'bg-gray-800 border-gray-700 text-green-400' : 'bg-green-50 border-green-200 text-green-700'}`}>
                                        <span className="truncate max-w-[80px]">{bizDocFile.name}</span>
                                        <button type="button" onClick={() => { setBizDocFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }} className="text-gray-400 hover:text-red-500 transition shrink-0"><X size={12} /></button>
                                    </div>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        className={`px-2.5 py-1 border border-dashed rounded-lg text-[11px] font-bold flex items-center gap-1 shrink-0 transition ${isDark ? 'bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-700' : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50 hover:border-blue-400'}`}
                                    >
                                        <Upload size={12} /> 파일 선택
                                    </button>
                                )}
                            </div>
                            {!isCertified && <p className="text-[10px] text-gray-500 font-bold">사업자등록증 / 직업소개사업등록증 / 영업허가증 中 택1</p>}
                            <input ref={fileInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={handleFileChange} />
                        </div>

                        {/* 사업장 주소 - 회원정보에서만 수정 가능 */}
                        <div>
                            <label className={labelCls}>
                                사업장 주소
                                <span className="ml-1 text-[9px] text-gray-400 font-normal">(회원정보수정에서 변경)</span>
                            </label>
                            <input
                                type="text"
                                placeholder="회원정보수정 &gt; 사업장 주소에서 입력하세요"
                                value={shopAddress}
                                readOnly
                                className={`${inputCls} opacity-60 cursor-not-allowed bg-gray-50`}
                            />
                        </div>

                        {/* 광고 닉네임 */}
                        <div>
                            <label className={labelCls}>광고별 닉네임<span className="ml-1 text-[9px] text-blue-500 font-bold">(공고별 수정 가능)</span></label>
                            <input
                                type="text"
                                placeholder="광고에 표시될 닉네임"
                                value={nickname}
                                onChange={(e) => setNickname(e.target.value)}
                                className={inputCls}
                            />
                        </div>
                    </div>
                </div>

                {/* ── 담당자 정보 ── */}
                <div className={`p-3 md:p-4 rounded-2xl shadow-sm border ${isDark ? 'bg-gray-900/50 border-gray-800' : 'bg-white/80 backdrop-blur-sm border-gray-100'}`}>
                    <h2 className="font-black text-gray-800 mb-3 md:mb-4 flex items-center gap-2 text-sm">
                        <span className="w-1.5 h-4 bg-blue-500 rounded-full"></span>
                        담당자 정보
                        {isCertified && (
                            <span className="ml-auto text-[10px] text-green-600 font-bold flex items-center gap-1">
                                <ShieldCheck size={11} /> 인증된 정보 자동 반영
                            </span>
                        )}
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 mb-3">
                        <div>
                            <label className={labelCls}><span className="text-red-500 mr-1">*</span>담당자</label>
                            <input
                                type="text"
                                placeholder="김실장"
                                value={managerName}
                                onChange={(e) => setManagerName(e.target.value)}
                                className={`${inputCls} opacity-60 cursor-not-allowed`}
                                readOnly
                            />
                        </div>
                        <div>
                            <label className={labelCls}>
                                <span className="text-red-500 mr-1">*</span>담당자 연락처
                                {isCertified && <span className="ml-1 text-[9px] text-blue-500 font-bold">(공고별 수정 가능)</span>}
                            </label>
                            <input
                                type="text"
                                placeholder="010-0000-0000"
                                value={managerPhone}
                                onChange={(e) => setManagerPhone(e.target.value)}
                                className={inputCls}
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                        <div>
                            <label className="block text-[10px] font-black mb-1.5 text-yellow-600">
                                카톡 {isCertified && <span className="text-[8px] text-blue-400">(공고별)</span>}
                            </label>
                            <input type="text" placeholder="ID" value={messengers.kakao} onChange={(e) => setMessengers({ ...messengers, kakao: e.target.value })} className={`w-full border rounded-lg p-2 text-xs font-bold outline-none ${isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200'}`} />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black mb-1.5 text-green-600">
                                라인 {isCertified && <span className="text-[8px] text-blue-400">(공고별)</span>}
                            </label>
                            <input type="text" placeholder="ID" value={messengers.line} onChange={(e) => setMessengers({ ...messengers, line: e.target.value })} className={`w-full border rounded-lg p-2 text-xs font-bold outline-none ${isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200'}`} />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black mb-1.5 text-blue-600">
                                텔레 {isCertified && <span className="text-[8px] text-blue-400">(공고별)</span>}
                            </label>
                            <input type="text" placeholder="ID" value={messengers.telegram} onChange={(e) => setMessengers({ ...messengers, telegram: e.target.value })} className={`w-full border rounded-lg p-2 text-xs font-bold outline-none ${isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200'}`} />
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};
