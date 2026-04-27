'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Check, Upload, X, Search, Loader2, AlertCircle, Building2, Clock, CheckCircle2, XCircle, MapPin } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { JOB_CATEGORIES } from '@/constants/jobs';
import { formatBizNumber } from '../utils';

interface BusinessVerifySectionProps {
    brand: any;
    setView: (v: string) => void;
}

/**
 * 사업자 인증 신청 섹션
 * MemberInfoForm에서 분리된 독립 컴포넌트.
 * 자체적으로 Supabase 조회/저장, 파일 업로드를 처리합니다.
 */
export const BusinessVerifySection: React.FC<BusinessVerifySectionProps> = ({ brand, setView }) => {
    const { user } = useAuth();
    const isDark = brand?.theme === 'dark';

    const [bizData, setBizData] = useState({
        businessName: '',
        businessNumber: '',
        businessType: '',
        businessAddress: '',
        businessAddressDetail: '',
        managerPhone: '',
        kakao: '',
        line: '',
        telegram: '',
    });
    const [bizVerifyStatus, setBizVerifyStatus] = useState<'none' | 'pending' | 'approved' | 'rejected'>('none');
    const [bizDocFile, setBizDocFile] = useState<File | null>(null);
    const [bizFileUrl, setBizFileUrl] = useState<string | null>(null);
    const [bizNumberStatus, setBizNumberStatus] = useState<'idle' | 'loading' | 'valid' | 'invalid'>('idle');
    const [bizNumberText, setBizNumberText] = useState('');
    const [isSubmittingBiz, setIsSubmittingBiz] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!user?.id || user.id === 'guest') return;
        const load = async () => {
            const { data: profile } = await supabase
                .from('profiles')
                .select('business_name, business_number, business_type, business_address, business_address_detail, business_file_url, manager_phone, manager_kakao, manager_line, manager_telegram, business_verify_status')
                .eq('id', user.id)
                .single();
            if (profile) {
                const p = profile as any;
                setBizData({
                    businessName: p.business_name || '',
                    businessNumber: p.business_number || '',
                    businessType: p.business_type || '',
                    businessAddress: p.business_address || '',
                    businessAddressDetail: p.business_address_detail || '',
                    managerPhone: p.manager_phone || '',
                    kakao: p.manager_kakao || '',
                    line: p.manager_line || '',
                    telegram: p.manager_telegram || '',
                });
                setBizFileUrl(p.business_file_url || null);
                setBizVerifyStatus(p.business_verify_status || 'none');
            }
        };
        load();
    }, [user?.id]);

    const handleBizChange = (field: string, value: string) => {
        setBizData(prev => ({ ...prev, [field]: value }));
    };

    const handleBizNumberVerify = async () => {
        const raw = bizData.businessNumber.replace(/\D/g, '');
        if (raw.length !== 10) {
            setBizNumberStatus('invalid');
            setBizNumberText('10자리 사업자 등록번호를 입력해주세요.');
            return;
        }
        setBizNumberStatus('loading');
        try {
            const res = await fetch('/api/nts/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ businessNumber: raw }),
            });
            const data = await res.json();
            if (data.status === '정상') {
                setBizNumberStatus('valid');
                setBizNumberText('국세청 인증 완료 (계속사업자)');
            } else {
                setBizNumberStatus('invalid');
                setBizNumberText(data.message || '등록되지 않은 사업자번호입니다.');
            }
        } catch {
            setBizNumberStatus('invalid');
            setBizNumberText('조회 중 오류가 발생했습니다.');
        }
    };

    const uploadBizFile = async (file: File): Promise<string | null> => {
        if (!user?.id) return null;
        const ext = file.name.split('.').pop();
        const path = `${user.id}/${Date.now()}.${ext}`;
        const { error } = await supabase.storage.from('business-docs').upload(path, file, { upsert: true });
        if (error) { console.error('[uploadBizFile]', error.message); return null; }
        const { data } = supabase.storage.from('business-docs').getPublicUrl(path);
        return data?.publicUrl || null;
    };

    const handleBizSubmit = async () => {
        if (!bizData.businessName.trim()) { alert('상호명을 입력해주세요.'); return; }
        if (!bizData.businessType) { alert('업종을 선택해주세요.'); return; }
        if (!bizData.businessNumber.trim()) { alert('사업자등록번호를 입력해주세요.'); return; }
        if (!bizData.managerPhone.trim()) { alert('담당자 연락처를 입력해주세요.'); return; }
        if (!bizDocFile && !bizFileUrl) { alert('사업자등록증 파일을 첨부해주세요.'); return; }

        setIsSubmittingBiz(true);
        try {
            let fileUrl = bizFileUrl;
            if (bizDocFile) {
                fileUrl = await uploadBizFile(bizDocFile);
                if (!fileUrl) { alert('파일 업로드에 실패했습니다. 잠시 후 다시 시도해주세요.'); return; }
            }
            const { error } = await supabase.from('profiles').update({
                business_name: bizData.businessName,
                business_number: bizData.businessNumber.replace(/\D/g, ''),
                business_type: bizData.businessType,
                business_address: bizData.businessAddress || null,
                business_address_detail: bizData.businessAddressDetail || null,
                business_file_url: fileUrl,
                manager_phone: bizData.managerPhone,
                manager_kakao: bizData.kakao,
                manager_line: bizData.line,
                manager_telegram: bizData.telegram,
                business_verify_status: 'pending',
                business_verify_requested_at: new Date().toISOString(),
            }).eq('id', user!.id);
            if (error) throw error;
            setBizVerifyStatus('pending');
            setBizFileUrl(fileUrl);
            alert('사업자 인증 신청이 완료되었습니다.\n관리자 검토 후 승인 알림을 보내드립니다.');
            setView('dashboard');
        } catch (e: any) {
            alert('신청 중 오류: ' + (e.message || '잠시 후 다시 시도해주세요.'));
        } finally {
            setIsSubmittingBiz(false);
        }
    };

    const isBizApproved = bizVerifyStatus === 'approved';
    const isBizPending  = bizVerifyStatus === 'pending';
    const isBizRejected = bizVerifyStatus === 'rejected';

    const labelCls   = `block text-xs font-bold mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`;
    const bizInputCls = `w-full p-3 rounded-xl font-bold border transition outline-none focus:ring-2 focus:ring-blue-500/20 ${
        isDark ? 'bg-gray-800 border-gray-700 text-white focus:border-blue-500' : 'bg-white border-gray-200 text-gray-900 focus:border-blue-500'
    }`;

    return (
        <div className={`mt-2 rounded-[24px] border-2 overflow-hidden ${
            isBizApproved
                ? isDark ? 'border-green-800 bg-green-950/30' : 'border-green-200 bg-green-50/50'
                : isBizPending
                    ? isDark ? 'border-amber-800 bg-amber-950/30' : 'border-amber-200 bg-amber-50/50'
                    : isDark ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-gray-50/50'
        }`}>
            {/* 섹션 헤더 */}
            <div className={`p-5 flex items-center justify-between ${
                isBizApproved ? 'bg-green-500' : isBizPending ? 'bg-amber-500' : 'bg-gradient-to-r from-blue-600 to-indigo-600'
            } text-white`}>
                <div className="flex items-center gap-3">
                    <Building2 size={22} />
                    <div>
                        <h3 className="font-black text-base">사업자 인증</h3>
                        <p className="text-xs opacity-80 font-bold">
                            {isBizApproved ? '인증이 완료되었습니다. 공고 등록 시 자동으로 반영됩니다.' :
                                isBizPending ? '인증 신청이 접수되어 심사 중입니다. 최대 1~2 영업일 소요됩니다.' :
                                    isBizRejected ? '인증이 반려되었습니다. 서류를 확인하고 재신청해주세요.' :
                                        '사업자 정보를 등록하면 공고 등록 시 자동으로 반영됩니다.'}
                        </p>
                    </div>
                </div>
                <div>
                    {isBizApproved && <CheckCircle2 size={28} className="text-white opacity-80" />}
                    {isBizPending  && <Clock size={28} className="text-white opacity-80" />}
                    {isBizRejected && <XCircle size={28} className="text-white opacity-80" />}
                </div>
            </div>

            <div className="p-5 space-y-5">
                {/* 1행: 상호명 + 업종 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className={`${labelCls} flex items-center gap-1`}><span className="text-red-500">*</span> 상호명</label>
                        <input
                            type="text"
                            placeholder="사업자등록증의 상호명"
                            value={bizData.businessName}
                            onChange={(e) => handleBizChange('businessName', e.target.value)}
                            disabled={isBizApproved || isBizPending}
                            className={`${bizInputCls} ${(isBizApproved || isBizPending) ? 'opacity-60 cursor-not-allowed' : ''}`}
                        />
                    </div>
                    <div>
                        <label className={`${labelCls} flex items-center gap-1`}><span className="text-red-500">*</span> 업종</label>
                        <select
                            value={bizData.businessType}
                            onChange={(e) => handleBizChange('businessType', e.target.value)}
                            disabled={isBizApproved || isBizPending}
                            className={`${bizInputCls} ${(isBizApproved || isBizPending) ? 'opacity-60 cursor-not-allowed' : ''}`}
                        >
                            <option value="">업종선택</option>
                            {JOB_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                        </select>
                    </div>
                </div>

                {/* 2행: 사업자번호 + 파일첨부 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className={`${labelCls} flex items-center gap-1`}><span className="text-red-500">*</span> 사업자등록번호</label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                placeholder="000-00-00000"
                                value={bizData.businessNumber}
                                onChange={(e) => { handleBizChange('businessNumber', formatBizNumber(e.target.value)); setBizNumberStatus('idle'); }}
                                disabled={isBizApproved || isBizPending}
                                maxLength={12}
                                className={`${bizInputCls} flex-1 ${bizNumberStatus === 'invalid' ? 'border-red-400' : bizNumberStatus === 'valid' ? 'border-green-400' : ''} ${(isBizApproved || isBizPending) ? 'opacity-60 cursor-not-allowed' : ''}`}
                            />
                            {!isBizApproved && !isBizPending && (
                                <button
                                    type="button"
                                    onClick={handleBizNumberVerify}
                                    disabled={bizNumberStatus === 'loading'}
                                    className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black shrink-0 flex items-center gap-1 transition disabled:opacity-50"
                                >
                                    {bizNumberStatus === 'loading' ? <><Loader2 size={12} className="animate-spin" /> 조회중</> : <><Search size={12} /> 조회</>}
                                </button>
                            )}
                        </div>
                        {bizNumberStatus === 'valid'   && <p className="text-[10px] text-green-600 font-bold mt-1 flex items-center gap-1"><Check size={10} /> {bizNumberText}</p>}
                        {bizNumberStatus === 'invalid' && <p className="text-[10px] text-red-500 font-bold mt-1 flex items-center gap-1"><AlertCircle size={10} /> {bizNumberText}</p>}
                    </div>

                    <div>
                        <label className={`${labelCls} flex items-center gap-1`}>
                            <span className="text-red-500">*</span> 사업자등록증 첨부
                            <span className="font-normal text-gray-400 ml-1">(PDF/JPG/PNG)</span>
                        </label>
                        {isBizApproved || isBizPending ? (
                            <div className={`p-3 rounded-xl border font-bold text-sm flex items-center gap-2 ${isDark ? 'bg-gray-700 border-gray-600 text-gray-300' : 'bg-gray-100 border-gray-200 text-gray-600'}`}>
                                <FileIconSmall />
                                {bizFileUrl
                                    ? <a href={bizFileUrl} target="_blank" rel="noreferrer" className="text-blue-500 underline hover:text-blue-700 text-xs">첨부파일 확인</a>
                                    : '첨부됨'}
                            </div>
                        ) : (
                            <div>
                                {bizDocFile ? (
                                    <div className={`p-3 rounded-xl border flex items-center gap-2 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                                        <span className="text-xs font-bold text-green-600 truncate flex-1">{bizDocFile.name}</span>
                                        <button type="button" onClick={() => { setBizDocFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }} className="text-gray-400 hover:text-red-500"><X size={14} /></button>
                                    </div>
                                ) : bizFileUrl ? (
                                    <div className="flex items-center gap-2">
                                        <a href={bizFileUrl} target="_blank" rel="noreferrer" className="text-blue-500 underline hover:text-blue-700 text-xs font-bold">기존 파일 보기</a>
                                        <button type="button" onClick={() => fileInputRef.current?.click()} className={`px-3 py-2 border border-dashed rounded-xl text-xs font-bold flex items-center gap-1 transition ${isDark ? 'border-gray-600 text-gray-400 hover:bg-gray-700' : 'border-gray-300 text-gray-500 hover:bg-gray-50'}`}>
                                            <Upload size={12} /> 재업로드
                                        </button>
                                    </div>
                                ) : (
                                    <button type="button" onClick={() => fileInputRef.current?.click()} className={`w-full p-3 border border-dashed rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition ${isDark ? 'border-gray-600 text-gray-400 hover:bg-gray-700' : 'border-gray-300 text-gray-500 hover:bg-gray-50 hover:border-blue-400'}`}>
                                        <Upload size={14} /> 파일 선택
                                    </button>
                                )}
                                <input ref={fileInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={(e) => setBizDocFile(e.target.files?.[0] || null)} />
                            </div>
                        )}
                    </div>
                </div>

                {/* 3행: 사업장 주소 */}
                <div>
                    <label className={`${labelCls} flex items-center gap-1`}>
                        사업장 주소
                        <span className="text-gray-400 font-normal text-[10px] ml-1">(공고 지도에 반영)</span>
                    </label>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            placeholder="주소 검색 버튼을 눌러 입력하세요"
                            value={bizData.businessAddress}
                            readOnly
                            disabled={isBizApproved || isBizPending}
                            className={`${bizInputCls} flex-1 cursor-default bg-gray-50 ${(isBizApproved || isBizPending) ? 'opacity-60 cursor-not-allowed' : ''}`}
                        />
                        {!isBizApproved && !isBizPending && (
                            <button
                                type="button"
                                onClick={() => {
                                    const openPostcode = () => new (window as any).daum.Postcode({
                                        oncomplete: (data: any) => handleBizChange('businessAddress', data.roadAddress || data.jibunAddress),
                                    }).open();
                                    if ((window as any).daum?.Postcode) {
                                        openPostcode();
                                    } else {
                                        const script = document.createElement('script');
                                        script.src = 'https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js';
                                        script.onload = openPostcode;
                                        document.head.appendChild(script);
                                    }
                                }}
                                className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black shrink-0 flex items-center gap-1 transition"
                            >
                                <MapPin size={12} /> 주소 검색
                            </button>
                        )}
                    </div>
                    {bizData.businessAddress && (
                        <input
                            type="text"
                            placeholder="상세주소 입력 (예: 지하1층, 2호)"
                            value={bizData.businessAddressDetail || ''}
                            onChange={(e) => handleBizChange('businessAddressDetail', e.target.value)}
                            disabled={isBizApproved || isBizPending}
                            className={`${bizInputCls} mt-2 ${(isBizApproved || isBizPending) ? 'opacity-60 cursor-not-allowed' : ''}`}
                        />
                    )}
                </div>

                {/* 4행: 담당자 연락처 + 메신저 */}
                <div>
                    <label className={`${labelCls} flex items-center gap-1`}><span className="text-red-500">*</span> 담당자 연락처</label>
                    <input
                        type="text"
                        placeholder="010-0000-0000"
                        value={bizData.managerPhone}
                        onChange={(e) => handleBizChange('managerPhone', e.target.value)}
                        disabled={isBizApproved || isBizPending}
                        className={`${bizInputCls} ${(isBizApproved || isBizPending) ? 'opacity-60 cursor-not-allowed' : ''}`}
                    />
                </div>

                <div className="grid grid-cols-3 gap-3">
                    {([
                        { field: 'kakao',    label: '카카오톡 ID', color: 'text-yellow-600' },
                        { field: 'line',     label: '라인 ID',    color: 'text-green-600'  },
                        { field: 'telegram', label: '텔레그램 ID', color: 'text-blue-600'  },
                    ] as const).map(({ field, label, color }) => (
                        <div key={field}>
                            <label className={`block text-[10px] font-black mb-1.5 ${color}`}>{label}</label>
                            <input
                                type="text"
                                placeholder="ID"
                                value={bizData[field]}
                                onChange={(e) => handleBizChange(field, e.target.value)}
                                disabled={isBizApproved || isBizPending}
                                className={`w-full border rounded-lg p-2.5 text-xs font-bold outline-none ${isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200'} ${(isBizApproved || isBizPending) ? 'opacity-60 cursor-not-allowed' : ''}`}
                            />
                        </div>
                    ))}
                </div>

                {/* 액션 영역 */}
                {isBizApproved && (
                    <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-2xl">
                        <CheckCircle2 size={20} className="text-green-500 shrink-0" />
                        <div>
                            <p className="font-black text-green-700 text-sm">인증 완료</p>
                            <p className="text-xs text-green-600 font-bold">공고 등록 시 인증된 정보가 자동으로 반영됩니다.</p>
                        </div>
                        <button onClick={() => setBizVerifyStatus('none')} className="ml-auto text-[10px] text-gray-400 hover:text-gray-600 font-bold underline shrink-0">재신청</button>
                    </div>
                )}
                {isBizPending && (
                    <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-2xl">
                        <Clock size={20} className="text-amber-500 shrink-0" />
                        <div>
                            <p className="font-black text-amber-700 text-sm">심사 진행 중</p>
                            <p className="text-xs text-amber-600 font-bold">관리자 검토 후 최대 1~2 영업일 내 결과를 알려드립니다.</p>
                        </div>
                    </div>
                )}
                {(bizVerifyStatus === 'none' || isBizRejected) && (
                    <div className="pt-2">
                        {isBizRejected && (
                            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl mb-3">
                                <XCircle size={16} className="text-red-500 shrink-0" />
                                <p className="text-xs text-red-600 font-bold">인증이 반려되었습니다. 서류 재확인 후 다시 신청해주세요.</p>
                            </div>
                        )}
                        <button
                            onClick={handleBizSubmit}
                            disabled={isSubmittingBiz}
                            className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black text-sm hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/20 transition active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {isSubmittingBiz
                                ? <><Loader2 size={16} className="animate-spin" /> 신청 중...</>
                                : <><Building2 size={16} /> {isBizRejected ? '재신청하기' : '사업자 인증 신청하기'}</>}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

function FileIconSmall() {
    return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
        </svg>
    );
}
