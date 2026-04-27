'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Check, X, Building2, Search } from 'lucide-react';

export function AdminYasajangManagement() {
    const [businesses, setBusinesses] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchBusinesses = async () => {
        setIsLoading(true);
        // 클라이언트에서 일단 anon으로 조회 시도 (RLS 정책에 따라 admin은 보일 수 있음)
        // 만약 RLS로 막히면 API를 하나 더 파야 하지만 지시서상 리뷰 API만 명시됨
        const { data, error } = await supabase
            .from('businesses')
            .select('*')
            .eq('status', 'pending')
            .order('created_at', { ascending: false });

        if (!error && data) {
            setBusinesses(data);
        } else {
            console.error('Failed to fetch businesses:', error);
        }
        setIsLoading(false);
    };

    useEffect(() => {
        fetchBusinesses();
    }, []);

    const handleAction = async (id: string, action: 'approve' | 'reject') => {
        if (!confirm(`정말로 이 업소를 ${action === 'approve' ? '승인' : '반려'} 처리하시겠습니까?`)) return;

        try {
            const { data: sessionData } = await supabase.auth.getSession();
            const token = sessionData.session?.access_token;
            
            const res = await fetch('/api/admin/yasajang-review', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                },
                body: JSON.stringify({ businessId: id, action })
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.error || '처리 실패');
            }

            alert('처리되었습니다.');
            fetchBusinesses(); // 새로고침
        } catch (error: any) {
            alert(error.message);
        }
    };

    if (isLoading) {
        return <div className="p-10 text-center text-slate-400 font-bold">로딩 중...</div>;
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <div>
                        <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                            <Building2 className="text-pink-500" />
                            야사장 입점 신청 관리
                        </h2>
                        <p className="text-xs text-slate-500 mt-1">야사장(P5) 플랫폼에서 들어온 신규 업소 입점 신청을 심사합니다.</p>
                    </div>
                    <div className="text-sm font-bold text-slate-500 bg-white px-4 py-2 rounded-xl border shadow-sm">
                        대기 중 <span className="text-pink-600 ml-1">{businesses.length}</span>건
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-100 text-xs font-black text-slate-500 uppercase tracking-widest">
                                <th className="p-4 whitespace-nowrap">업소명 / 주소</th>
                                <th className="p-4 whitespace-nowrap">대표자명</th>
                                <th className="p-4 whitespace-nowrap">연락처</th>
                                <th className="p-4 whitespace-nowrap">플랜</th>
                                <th className="p-4 whitespace-nowrap">신청일시</th>
                                <th className="p-4 whitespace-nowrap text-center">심사 액션</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {businesses.map((biz) => (
                                <tr key={biz.id} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="p-4">
                                        <p className="font-bold text-slate-900 text-sm">{biz.name}</p>
                                        <p className="text-xs text-slate-500 mt-0.5 max-w-xs truncate">{biz.address || '-'}</p>
                                    </td>
                                    <td className="p-4">
                                        <p className="font-bold text-slate-700 text-sm">{biz.manager_name || '미입력'}</p>
                                    </td>
                                    <td className="p-4">
                                        <p className="font-bold text-slate-700 text-sm">{biz.phone || biz.manager_phone || '-'}</p>
                                    </td>
                                    <td className="p-4">
                                        <span className="px-2.5 py-1 bg-pink-100 text-pink-700 rounded-lg text-xs font-black">
                                            {biz.waiterzone_tier || '기본 플랜'}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <p className="text-xs font-bold text-slate-500">
                                            {new Date(biz.created_at).toLocaleString('ko-KR')}
                                        </p>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button 
                                                onClick={() => handleAction(biz.id, 'approve')}
                                                className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center hover:bg-emerald-500 hover:text-white transition-colors"
                                                title="승인"
                                            >
                                                <Check size={16} />
                                            </button>
                                            <button 
                                                onClick={() => handleAction(biz.id, 'reject')}
                                                className="w-8 h-8 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-colors"
                                                title="반려"
                                            >
                                                <X size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {businesses.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="p-12 text-center text-slate-400">
                                        <div className="w-16 h-16 mx-auto bg-slate-50 rounded-full flex items-center justify-center mb-3">
                                            <Building2 className="text-slate-300" size={24} />
                                        </div>
                                        <p className="font-bold">대기 중인 입점 신청이 없습니다.</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
