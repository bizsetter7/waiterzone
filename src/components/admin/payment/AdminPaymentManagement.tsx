import React, { useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { Search, Filter, FileText, ExternalLink, Calendar, CheckCircle2, Clock, AlertCircle, Layout, Zap } from 'lucide-react';

import { Shop } from '@/types/shop';

interface AdminPaymentManagementProps {
    payments: any[];
    ads: Shop[];
    fetchData: () => void;
    setSelectedAdForModal: (ad: Shop | null) => void;
}

export function AdminPaymentManagement({ payments, ads, fetchData, setSelectedAdForModal }: AdminPaymentManagementProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed'>('all');
    const [typeFilter, setTypeFilter] = useState<'all' | 'AD' | 'SOS' | 'JUMP' | 'OPTION'>('all');
    const [recoverShopId, setRecoverShopId] = useState('');
    const [recoverResult, setRecoverResult] = useState<string | null>(null);
    const [isRecovering, setIsRecovering] = useState(false);

    const handleRecoverPayment = async () => {
        if (!recoverShopId.trim()) return;
        setIsRecovering(true);
        setRecoverResult(null);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;
            const res = await fetch('/api/admin/recover-payment', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                },
                body: JSON.stringify({ shopId: recoverShopId.trim() })
            });
            const data = await res.json();
            if (data.success) {
                setRecoverResult(`✅ ${data.message || data.action}`);
                fetchData();
            } else {
                setRecoverResult(`❌ ${data.error || '실패'}`);
            }
        } catch (e: any) {
            setRecoverResult(`❌ 네트워크 오류: ${e.message}`);
        } finally {
            setIsRecovering(false);
        }
    };

    // [Filtering Logic]
    const filteredPayments = useMemo(() => {
        return payments.filter(pay => {
            const matchesStatus = statusFilter === 'all' || pay.status === statusFilter;
            const matchesType = typeFilter === 'all' || pay.pay_type === typeFilter;
            
            const searchLower = searchTerm.toLowerCase();
            const matchesSearch = !searchTerm || 
                (String(pay.id) || '').toLowerCase().includes(searchLower) ||
                (String(pay.shop_id) || '').toLowerCase().includes(searchLower) ||
                (pay.metadata?.adTitle || '').toLowerCase().includes(searchLower) ||
                (pay.metadata?.shopName || '').toLowerCase().includes(searchLower) ||
                (pay.profiles?.username || '').toLowerCase().includes(searchLower) ||
                (pay.profiles?.nickname || '').toLowerCase().includes(searchLower) ||
                (pay.profiles?.full_name || '').toLowerCase().includes(searchLower) ||
                (pay.profiles?.business_name || '').toLowerCase().includes(searchLower) ||
                (pay.profiles?.business_number || '').includes(searchLower) ||
                (pay.user_id || '').toLowerCase().includes(searchLower);

            return matchesStatus && matchesType && matchesSearch;
        });
    }, [payments, searchTerm, statusFilter, typeFilter]);

    const handlePaymentConfirm = async (paymentId: string, shopId: string) => {
        if (!confirm('입금을 확인하셨습니까? 승인 시 광고가 즉시 게시될 수 있습니다.')) return;

        try {
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;

            const res = await fetch('/api/admin/update-shop-status', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                },
                body: JSON.stringify({
                    adId: shopId,
                    status: 'active',
                    adData: ads.find((a: Shop) => String(a.id) === String(shopId)) || { id: shopId }
                })
            });

            const result = await res.json();
            if (!res.ok || !result.success) throw new Error(result.error || '결제 승인 실패');

            alert('결제 승인 및 광고 게시 처리가 완료되었습니다.');
            fetchData();
        } catch (err: any) {
            console.error('Payment confirmation error:', err);
            alert(`오류가 발생했습니다: ${err.message || '알 수 없는 오류'}`);
        }
    };

    const handlePointGrant = async (paymentId: string, userId: string, metadata: any) => {
        const isPoint = metadata?.type === 'point_charge';
        const typeLabel = isPoint ? '포인트' : '점프 서비스';
        const amount = isPoint ? metadata?.points : metadata?.count;
        if (!confirm(`${typeLabel} ${amount?.toLocaleString()}${isPoint ? 'P' : '회'} 지급하시겠습니까?`)) return;

        try {
            const now = new Date().toISOString();
            const { error: payError } = await supabase
                .from('payments')
                .update({ status: 'completed' }) // payments 테이블에 updated_at 컬럼 없음
                .eq('id', paymentId);
            if (payError) throw payError;

            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;

            const grantRes = await fetch('/api/admin/grant-balance', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                },
                body: JSON.stringify({
                    userId,
                    amount: Number(amount),
                    type: isPoint ? 'points' : 'jump_balance',
                }),
            });
            const grantData = await grantRes.json();
            if (!grantRes.ok || !grantData.success) throw new Error(grantData.error || '지급 실패');

            alert(`${typeLabel} 지급 완료!`);
            fetchData();
        } catch (err) {
            console.error('Point grant error:', err);
            alert('오류가 발생했습니다.');
        }
    };

    const formatPrice = (priceInWon: number) => {
        if (priceInWon >= 10000 && priceInWon % 10000 === 0) return `${priceInWon / 10000}만원`;
        return `${priceInWon.toLocaleString()}원`;
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
            {/* Header & Stats Summary */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h3 className="text-3xl font-black text-slate-950 tracking-tighter flex items-center gap-3">
                        통합결제내역관리 <span className="text-blue-600 text-sm font-black bg-blue-50 px-3 py-1 rounded-full uppercase tracking-widest">Finance Hub</span>
                    </h3>
                    <p className="text-sm text-slate-400 font-bold mt-1">
                        광고, SOS, 점프 등 모든 유료 트래픽 결제 내역을 사업자 정보 기반으로 정밀 관리합니다.
                    </p>
                </div>
            </div>

            {/* 긴급 결제 수복 패널 */}
            <div className="bg-amber-50 border border-amber-200 rounded-[24px] px-6 py-4 flex flex-col md:flex-row items-start md:items-center gap-3">
                <div className="flex items-center gap-2 shrink-0">
                    <AlertCircle size={14} className="text-amber-600" />
                    <span className="text-[11px] font-black text-amber-700 uppercase tracking-widest">결제수복</span>
                </div>
                <div className="flex items-center gap-2 flex-1 w-full">
                    <input
                        type="number"
                        placeholder="공고 No. 입력 (예: 149)"
                        value={recoverShopId}
                        onChange={(e) => setRecoverShopId(e.target.value)}
                        className="pl-3 pr-2 py-2 bg-white border border-amber-200 rounded-xl text-xs font-bold w-40 focus:ring-2 focus:ring-amber-300 outline-none"
                    />
                    <button
                        onClick={handleRecoverPayment}
                        disabled={isRecovering || !recoverShopId}
                        className="px-4 py-2 bg-amber-500 text-white text-[10px] font-black rounded-xl hover:bg-amber-600 transition disabled:opacity-40"
                    >
                        {isRecovering ? '수복 중...' : '수복 실행'}
                    </button>
                    {recoverResult && (
                        <span className={`text-[11px] font-bold ${recoverResult.startsWith('✅') ? 'text-green-600' : 'text-red-500'}`}>
                            {recoverResult}
                        </span>
                    )}
                </div>
            </div>

            {/* Filter Bar */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm shadow-slate-200/20">
                <div className="md:col-span-2 relative">
                    <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                        type="text" 
                        placeholder="상호명, 사업자번호, 회원 ID로 검색..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-500/20 transition-all"
                    />
                </div>
                <div className="relative">
                    <Filter size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <select 
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as any)}
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-500/20 appearance-none"
                    >
                        <option value="all">모든 상태</option>
                        <option value="pending">입금대기 / 검토</option>
                        <option value="completed">결제 / 지급완료</option>
                    </select>
                </div>
                <div className="relative">
                    <Layout size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <select 
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value as any)}
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-500/20 appearance-none"
                    >
                        <option value="all">모든 유형</option>
                        <option value="AD">일반 광고 (AD)</option>
                        <option value="SOS">SOS 발송</option>
                        <option value="JUMP">점프 서비스</option>
                        <option value="OPTION">옵션 신청</option>
                    </select>
                </div>
            </div>

            {/* List Table */}
            <div className="bg-white rounded-[40px] border border-slate-100 shadow-2xl shadow-slate-200/10 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[1000px]">
                        <thead>
                            <tr className="bg-slate-900 border-b border-slate-800">
                                <th className="px-4 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] w-[220px]">유형 / 결제정보</th>
                                <th className="px-4 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">사업자</th>
                                <th className="px-4 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">금액 / 수단</th>
                                <th className="px-4 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] whitespace-nowrap">상태</th>
                                <th className="px-4 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] whitespace-nowrap">일시</th>
                                <th className="px-4 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">관리</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filteredPayments.length > 0 ? (
                                filteredPayments.map((pay) => (
                                    <tr key={pay.id} className="hover:bg-blue-50/20 transition-all group">
                                        <td className="px-4 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${
                                                    pay.pay_type === 'SOS' ? 'bg-orange-100 text-orange-600' :
                                                    pay.pay_type === 'JUMP' ? 'bg-purple-100 text-purple-600' :
                                                    'bg-blue-100 text-blue-600'
                                                }`}>
                                                    {pay.pay_type === 'SOS' ? <Zap size={13} /> : pay.pay_type === 'JUMP' ? <Zap size={13} /> : <FileText size={13} />}
                                                </div>
                                                <div className="min-w-0">
                                                    <div
                                                        className="text-[12px] font-black text-slate-900 group-hover:text-blue-600 cursor-pointer transition-colors hover:underline underline-offset-2 line-clamp-2 break-all"
                                                        onClick={() => {
                                                            const adId = pay.shop_id || pay.metadata?.shop_id || pay.metadata?.ad_no;
                                                            if (adId) {
                                                                const ad = ads.find(a => String(a.id) === String(adId));
                                                                if (ad) setSelectedAdForModal(ad);
                                                                else alert('해당 광고의 상세 데이터를 찾을 수 없습니다.');
                                                            }
                                                        }}
                                                    >
                                                        {(() => {
                                                            const adId = pay.shop_id || pay.metadata?.shop_id || pay.metadata?.ad_no;
                                                            const matchedAd = ads.find(a => String(a.id) === String(adId));
                                                            return matchedAd?.title || pay.metadata?.adTitle || pay.metadata?.reason || pay.description || '시스템 결제';
                                                        })()}
                                                    </div>
                                                    <div className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                                                        <span className="text-blue-500 font-black uppercase">{pay.pay_type}</span> • No.{pay.shop_id || '—'}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="text-[11px] font-black text-slate-800 flex items-center gap-1.5">
                                                {(() => {
                                                    const adId = pay.shop_id || pay.metadata?.shop_id || pay.metadata?.ad_no;
                                                    const matchedAd = ads.find(a => String(a.id) === String(adId));
                                                    return matchedAd?.name || pay.profiles?.business_name || pay.profiles?.full_name || pay.metadata?.shopName || pay.metadata?.shop_name || '업체명 미확인';
                                                })()}
                                                {pay.profiles?.business_file_url && (
                                                    <a href={pay.profiles.business_file_url} target="_blank" rel="noreferrer" title="사업자등록증 확인">
                                                        <ExternalLink size={10} className="text-blue-400 hover:text-blue-600" />
                                                    </a>
                                                )}
                                            </div>
                                            <div className="text-[10px] text-blue-600 font-black font-mono mt-0.5 flex items-center gap-1">
                                                <span className="bg-blue-50 px-1 rounded-sm text-[9px]">ID</span>
                                                {pay.profiles?.username || pay.metadata?.username || '계정 미확인'}
                                            </div>
                                            <div className="text-[9px] text-slate-400 font-medium">
                                                {pay.profiles?.business_number ? `SN: ${pay.profiles.business_number}` : ''}
                                            </div>
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="text-sm font-black text-slate-900 tabular-nums whitespace-nowrap">{formatPrice(pay.amount)}</div>
                                            <div className="text-[9px] text-slate-500 font-bold uppercase tracking-wider whitespace-nowrap">{pay.method || 'Points/Manual'}</div>
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap">
                                            <div className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black whitespace-nowrap ${
                                                pay.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                                            }`}>
                                                {pay.status === 'completed' ? <CheckCircle2 size={10} /> : <Clock size={10} />}
                                                {pay.status === 'completed' ? '완료' : '대기중'}
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap">
                                            <div className="text-[11px] font-bold text-slate-500 flex items-center gap-1.5 whitespace-nowrap">
                                                <Calendar size={10} />
                                                {new Date(pay.created_at).toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit' })}
                                                {' '}
                                                {new Date(pay.created_at).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                            {pay.status === 'completed' && (
                                                <div className="text-[10px] text-green-600 font-bold flex items-center gap-1 whitespace-nowrap mt-0.5">
                                                    <CheckCircle2 size={9} />
                                                    승인완료
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-4 py-4 text-right">
                                            {pay.status !== 'completed' && (
                                                <button
                                                    onClick={() => (pay.pay_type === 'JUMP' || pay.metadata?.type === 'point_charge' || pay.metadata?.type === 'jump_charge') ? handlePointGrant(pay.id, pay.user_id, pay.metadata) : handlePaymentConfirm(pay.id, pay.shop_id)}
                                                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-[10px] font-black rounded-xl hover:bg-blue-700 transition shadow-lg shadow-blue-100"
                                                >
                                                    승인 실행
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="px-8 py-32 text-center">
                                        <div className="flex flex-col items-center gap-3 text-slate-300">
                                            <AlertCircle size={40} strokeWidth={1} />
                                            <p className="text-xs font-bold uppercase tracking-widest">No matching financial records found.</p>
                                        </div>
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
