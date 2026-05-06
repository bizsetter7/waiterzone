'use client';

import React, { useState, useEffect } from 'react';
import { Check, X, Building2, FileText, Phone, MessageCircle, Clock, RefreshCw, ChevronDown } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface BizRequest {
    id: string;
    username: string;
    full_name: string;
    business_name: string;
    business_number: string;
    business_type: string;
    business_file_url: string | null;
    manager_phone: string;
    manager_kakao: string;
    manager_line: string;
    manager_telegram: string;
    business_verify_status: string;
    business_verify_requested_at: string;
    business_verified_at: string | null;
}

export function BusinessVerifyView() {
    const [requests, setRequests] = useState<BizRequest[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<'pending' | 'approved' | 'rejected'>('pending');
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [rejectReason, setRejectReason] = useState('');
    const [rejectTargetId, setRejectTargetId] = useState<string | null>(null);
    const [expandedId, setExpandedId] = useState<string | null>(null);

    const fetchRequests = async () => {
        setIsLoading(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;
            const res = await fetch(`/api/admin/business-verify?status=${statusFilter}`, {
                headers: token ? { 'Authorization': `Bearer ${token}` } : undefined,
            });
            const json = await res.json();
            setRequests(json.data || []);
        } catch (e) {
            console.error('fetch error', e);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, [statusFilter]);

    const handleApprove = async (id: string) => {
        if (!confirm('사업자 인증을 승인하시겠습니까? 해당 회원에게 승인 알림이 발송됩니다.')) return;
        setProcessingId(id);
        try {
            const { data: { session: approveSession } } = await supabase.auth.getSession();
            const approveToken = approveSession?.access_token;
            const res = await fetch('/api/admin/business-verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...(approveToken ? { 'Authorization': `Bearer ${approveToken}` } : {}) },
                body: JSON.stringify({ profileId: id, action: 'approve' }),
            });
            const json = await res.json();
            if (json.success) {
                alert('승인 완료! 회원에게 알림이 발송되었습니다.');
                fetchRequests();
            } else {
                alert('오류: ' + json.error);
            }
        } catch (e) {
            alert('오류가 발생했습니다.');
        } finally {
            setProcessingId(null);
        }
    };

    const handleRejectConfirm = async () => {
        if (!rejectTargetId) return;
        setProcessingId(rejectTargetId);
        try {
            const { data: { session: rejectSession } } = await supabase.auth.getSession();
            const rejectToken = rejectSession?.access_token;
            const res = await fetch('/api/admin/business-verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...(rejectToken ? { 'Authorization': `Bearer ${rejectToken}` } : {}) },
                body: JSON.stringify({ profileId: rejectTargetId, action: 'reject', rejectReason }),
            });
            const json = await res.json();
            if (json.success) {
                alert('반려 처리 완료. 회원에게 반려 알림이 발송되었습니다.');
                setRejectTargetId(null);
                setRejectReason('');
                fetchRequests();
            } else {
                alert('오류: ' + json.error);
            }
        } catch (e) {
            alert('오류가 발생했습니다.');
        } finally {
            setProcessingId(null);
        }
    };

    const statusBadge = (status: string) => {
        if (status === 'pending') return <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-[10px] font-black">심사중</span>;
        if (status === 'approved') return <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-[10px] font-black">승인완료</span>;
        if (status === 'rejected') return <span className="px-2 py-0.5 bg-red-100 text-red-600 rounded-full text-[10px] font-black">반려됨</span>;
        return null;
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* 헤더 */}
            <div className="bg-slate-950 rounded-[32px] p-8 text-white border border-slate-800">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                            <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest">Business Verification</span>
                        </div>
                        <h3 className="text-2xl font-black tracking-tighter">사업자 인증 심사</h3>
                        <p className="text-slate-400 text-sm font-bold mt-1">기업회원의 사업자 인증 요청을 심사하고 승인합니다.</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="flex bg-slate-900 rounded-2xl p-1 border border-slate-800">
                            {(['pending', 'approved', 'rejected'] as const).map(s => (
                                <button
                                    key={s}
                                    onClick={() => setStatusFilter(s)}
                                    className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${statusFilter === s ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                                >
                                    {s === 'pending' ? '심사중' : s === 'approved' ? '승인완료' : '반려됨'}
                                </button>
                            ))}
                        </div>
                        <button
                            onClick={fetchRequests}
                            className="p-2.5 bg-slate-900 border border-slate-800 rounded-2xl text-slate-400 hover:text-white transition"
                        >
                            <RefreshCw size={16} />
                        </button>
                    </div>
                </div>
            </div>

            {/* 목록 */}
            {isLoading ? (
                <div className="text-center py-20 text-slate-400 font-bold">불러오는 중...</div>
            ) : requests.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-[32px] border border-slate-100">
                    <Building2 size={40} className="text-slate-200 mx-auto mb-3" />
                    <p className="text-slate-400 font-bold text-sm">
                        {statusFilter === 'pending' ? '대기중인 인증 요청이 없습니다.' :
                            statusFilter === 'approved' ? '승인된 인증 내역이 없습니다.' :
                                '반려된 인증 내역이 없습니다.'}
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {requests.map(req => (
                        <div key={req.id} className="bg-white rounded-[24px] border border-slate-100 shadow-sm overflow-hidden">
                            {/* 요약 행 */}
                            <div
                                className="p-5 flex flex-col md:flex-row items-start md:items-center gap-4 cursor-pointer hover:bg-slate-50 transition"
                                onClick={() => setExpandedId(expandedId === req.id ? null : req.id)}
                            >
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        {statusBadge(req.business_verify_status)}
                                        <span className="text-xs text-slate-400 font-bold">
                                            {new Date(req.business_verify_requested_at).toLocaleString('ko-KR')}
                                        </span>
                                    </div>
                                    <p className="font-black text-slate-900 text-sm">{req.business_name || '상호명 없음'}</p>
                                    <p className="text-xs text-slate-400 font-bold">{req.username} · {req.full_name} · {req.business_number}</p>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    {statusFilter === 'pending' && (
                                        <>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleApprove(req.id); }}
                                                disabled={processingId === req.id}
                                                className="flex items-center gap-1.5 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-xl text-xs font-black transition disabled:opacity-50"
                                            >
                                                <Check size={14} />
                                                승인
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setRejectTargetId(req.id); setRejectReason(''); }}
                                                disabled={processingId === req.id}
                                                className="flex items-center gap-1.5 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl text-xs font-black transition disabled:opacity-50"
                                            >
                                                <X size={14} />
                                                반려
                                            </button>
                                        </>
                                    )}
                                    <ChevronDown
                                        size={16}
                                        className={`text-slate-400 transition-transform ${expandedId === req.id ? 'rotate-180' : ''}`}
                                    />
                                </div>
                            </div>

                            {/* 상세 정보 (펼침) */}
                            {expandedId === req.id && (
                                <div className="border-t border-slate-100 p-5 bg-slate-50/50">
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                        <div>
                                            <p className="text-[10px] text-slate-400 font-black mb-1 flex items-center gap-1"><Building2 size={10} /> 업종</p>
                                            <p className="font-bold text-slate-700">{req.business_type || '-'}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-slate-400 font-black mb-1 flex items-center gap-1"><Phone size={10} /> 담당자 연락처</p>
                                            <p className="font-bold text-slate-700">{req.manager_phone || '-'}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-slate-400 font-black mb-1 flex items-center gap-1"><MessageCircle size={10} /> 메신저</p>
                                            <p className="font-bold text-slate-700 text-xs">
                                                {[req.manager_kakao && `카톡: ${req.manager_kakao}`, req.manager_line && `라인: ${req.manager_line}`, req.manager_telegram && `텔레: ${req.manager_telegram}`].filter(Boolean).join(' / ') || '-'}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-slate-400 font-black mb-1 flex items-center gap-1"><FileText size={10} /> 첨부 서류</p>
                                            {req.business_file_url ? (
                                                <a
                                                    href={req.business_file_url}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="text-blue-500 font-bold underline hover:text-blue-700 text-xs"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    파일 열기
                                                </a>
                                            ) : (
                                                <p className="font-bold text-slate-400 text-xs">첨부 없음</p>
                                            )}
                                        </div>
                                    </div>
                                    {req.business_verified_at && (
                                        <p className="text-[10px] text-green-600 font-bold mt-3 flex items-center gap-1">
                                            <Clock size={10} /> 승인일시: {new Date(req.business_verified_at).toLocaleString('ko-KR')}
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* 반려 사유 모달 */}
            {rejectTargetId && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[10020] p-4">
                    <div className="bg-white rounded-[32px] p-8 max-w-md w-full shadow-2xl">
                        <h3 className="text-lg font-black text-slate-900 mb-2">인증 반려</h3>
                        <p className="text-sm text-slate-500 font-bold mb-4">반려 사유를 입력하면 회원에게 알림으로 전달됩니다.</p>
                        <textarea
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            placeholder="예: 사업자등록증 파일이 불명확합니다. 선명한 파일로 재첨부해주세요."
                            className="w-full border border-slate-200 rounded-xl p-3 text-sm font-bold outline-none focus:border-blue-400 resize-none"
                            rows={3}
                        />
                        <div className="flex gap-3 mt-5">
                            <button
                                onClick={() => { setRejectTargetId(null); setRejectReason(''); }}
                                className="flex-1 py-3 rounded-2xl bg-slate-100 text-slate-500 font-black text-sm transition hover:bg-slate-200"
                            >
                                취소
                            </button>
                            <button
                                onClick={handleRejectConfirm}
                                disabled={processingId !== null}
                                className="flex-1 py-3 rounded-2xl bg-red-500 text-white font-black text-sm transition hover:bg-red-600 disabled:opacity-50"
                            >
                                반려 처리
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
