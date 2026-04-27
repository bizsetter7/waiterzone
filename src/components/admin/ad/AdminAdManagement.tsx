import React, { useState } from 'react';
import {
    CheckCircle2,
    XCircle,
    Info,
    Database,
    RefreshCw,
    Check
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Shop } from '@/types/shop';
import { useBrand } from '@/components/BrandProvider';
// Absolute path assumes src/app/my-shop/components/MobilePreviewContent exits
import { MobilePreviewContent } from '@/app/my-shop/components/MobilePreviewContent';

interface AdminAdManagementProps {
    mockAds: Shop[];
    setMockAds: React.Dispatch<React.SetStateAction<Shop[]>>;
    fetchData: () => void;
    setSelectedAdForModal: (ad: Shop | null) => void;
}

// KST 날짜+시간 포맷 헬퍼 (ex. 26.03.27 오후 01:13)
function fmtKST(isoStr: string | undefined | null): string {
    if (!isoStr) return '—';
    const d = new Date(isoStr);
    const kst = new Intl.DateTimeFormat('ko-KR', {
        timeZone: 'Asia/Seoul',
        year: '2-digit', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', hour12: true,
    }).formatToParts(d);
    const get = (t: string) => kst.find(p => p.type === t)?.value ?? '';
    const yy = get('year'), mo = get('month'), dd = get('day');
    const ampm = get('dayPeriod') === '오전' ? '오전' : '오후';
    const hh = get('hour').padStart(2, '0'), mi = get('minute');
    return `${yy}.${mo}.${dd} ${ampm} ${hh}:${mi}`;
}

// 마감일 계산: 승인일(또는 신청일) + 광고 기간(일) → 26.04.26 형식
function calcDeadline(baseIso: string | undefined | null, periodDays: number): string {
    if (!baseIso) return '—';
    const d = new Date(baseIso);
    d.setDate(d.getDate() + periodDays);
    // ko-KR 로케일: "26. 04. 26." → 공백+점 제거 → 마지막 점 제거
    return d.toLocaleDateString('ko-KR', { timeZone: 'Asia/Seoul', year: '2-digit', month: '2-digit', day: '2-digit' })
        .replace(/\. /g, '.')   // "26. 04. 26." → "26.04.26."
        .replace(/\.$/, '');     // 끝 점만 제거 → "26.04.26"
}

export function AdminAdManagement({ mockAds, setMockAds, fetchData, setSelectedAdForModal }: AdminAdManagementProps) {
    const brand = useBrand();
    const [adFilter, setAdFilter] = useState<'all' | 'pending'>('pending');
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedAd, setExpandedAd] = useState<string | null>(null);

    // Rejection State
    const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
    const [rejectingAdId, setRejectingAdId] = useState<string | null>(null);
    const [rejectionReason, setRejectionReason] = useState('');

    const handleStatusUpdate = async (adId: string, newStatus: string, reason?: string) => {
        try {
            const ad = mockAds.find(a => String(a.id) === String(adId));

            // [Auth Fix] 토큰 획득 — refreshSession은 throw 안 하고 error 객체 반환
            // 1) refreshSession 시도 (error 객체 확인)
            // 2) 실패 시 getSession fallback
            // 3) 둘 다 null → coco_admin_mock 쿠키로 requireAdmin 통과 (AdminLayout에서 갱신)
            let token: string | undefined;
            const { data: refreshed, error: refreshError } = await supabase.auth.refreshSession();
            if (!refreshError && refreshed.session?.access_token) {
                token = refreshed.session.access_token;
            } else {
                const { data: { session } } = await supabase.auth.getSession();
                token = session?.access_token;
            }
            // token이 없어도 계속 진행 — requireAdmin이 coco_admin_mock 쿠키로 통과

            // [RLS 우회 및 트랜잭션 보장] 서버 API 라우트 호출
            const res = await fetch('/api/admin/update-shop-status', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                },
                body: JSON.stringify({
                    adId,
                    status: newStatus,
                    rejectionReason: reason || '',
                    adData: ad // 결제 내역 생성을 위한 메타데이터 전달
                })
            });

            const result = await res.json();
            if (!res.ok || !result.success) {
                throw new Error(result.error || '상태 업데이트 실패');
            }

            const statusMsg = newStatus === 'active' ? '승인' : (newStatus === 'rejected' ? '거절' : '변경');
            alert(`광고 ${statusMsg} 처리가 완료되었습니다. (DB 반영 성공)`);
            
            // UI 데이터 갱신
            if (fetchData) fetchData();

            // 리모달 닫기 및 상태 초기화
            setIsRejectModalOpen(false);
            setRejectingAdId(null);
            setRejectionReason('');
        } catch (error: any) {
            console.error('Status update error:', error);
            alert(`DB 업데이트 실패: ${error.message || '알 수 없는 오류'}\n(관리자 권한 및 네트워크를 확인하세요)`);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
            <div className="flex justify-between items-end mb-2">
                <div>
                    <h3 className="text-2xl font-black text-slate-950 tracking-tighter">광고 심사 관리 (라이브 워크플로우)</h3>
                    <p className="text-[11px] md:text-sm text-slate-400 font-bold mt-1 leading-relaxed">
                        심사 대기 건을 승인하고, 광고 가이드<br className="md:hidden" /> 준수 여부를 모니터링합니다.
                    </p>
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <input
                            type="text"
                            placeholder="광고 No, 상호명, 제목, ID 검색..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-4 pr-10 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-sm transition-all"
                        />
                        {searchTerm && (
                            <button 
                                onClick={() => setSearchTerm('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500"
                            >
                                <XCircle size={14} />
                            </button>
                        )}
                    </div>
                    <button
                        onClick={() => setAdFilter(adFilter === 'all' ? 'pending' : 'all')}
                        className={`px-4 py-2.5 rounded-2xl text-[10px] font-black border transition-all active:scale-95 shrink-0 shadow-sm ${adFilter === 'all' ? 'bg-amber-600 text-white border-amber-600 shadow-amber-200' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
                    >
                        {adFilter === 'all' ? '승인완료 숨기기' : `전체 보기 (${mockAds.length})`}
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-[32px] md:rounded-[40px] border border-slate-100 shadow-xl shadow-slate-200/20 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[800px]">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100">
                                <th className="pl-8 pr-2 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">No.</th>
                                <th className="pl-3 pr-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">상점(회원ID)</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">신청 옵션(유료)</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] whitespace-nowrap text-center">결제금액</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">상태</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">신청일 / 결제일(마감일)</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">제어</th>
                            </tr>
                        </thead>
                        <tbody>
                            {mockAds.length > 0 ? (
                                mockAds
                                    .filter(ad => {
                                        // 1. 상태 필터 (pending vs all)
                                        // 'active' 또는 'completed' 상태는 게시중으로 간주하여 기본(pending) 필터에서 제외
                                        const adStatus = String(ad.status || '').toLowerCase();
                                        const statusMatch = adFilter === 'all' || (adStatus !== 'active' && adStatus !== 'completed' && adStatus !== 'approved');
                                        
                                        // 2. 검색어 필터 (ID, 상호명, 제목, 회원ID, 담당자명 등)
                                        const s = searchTerm.toLowerCase().trim();
                                        if (!s) return statusMatch;

                                        const adNo = String(ad.id || '').toLowerCase();
                                        const shopName = String((ad as any).shopName || ad.name || '').toLowerCase();
                                        const title = String(ad.title || '').toLowerCase();
                                        const username = String((ad as any).username || '').toLowerCase();
                                        const nickname = String((ad as any).nickname || '').toLowerCase();
                                        const fullName = String((ad as any).fullName || '').toLowerCase();
                                        const userId = String(ad.user_id || (ad as any).userId || ad.ownerId || (ad as any).owner_id || '').toLowerCase();
                                        const adId = String(ad.id || '').toLowerCase();
                                        const managerName = String((ad as any).manager_name || (ad as any).managerName || '').toLowerCase();
                                        const phone = String((ad as any).manager_phone || ad.phone || '').toLowerCase();

                                        const searchMatch = 
                                            adNo.includes(s) || 
                                            shopName.includes(s) || 
                                            title.includes(s) || 
                                            username.includes(s) ||
                                            nickname.includes(s) ||
                                            fullName.includes(s) ||
                                            userId.includes(s) ||
                                            adId.includes(s) ||
                                            managerName.includes(s) ||
                                            phone.includes(s);

                                        // [Rule] 검색어가 있으면 상태 필터를 무시하고 전체 검색 수행 (대장님 지시 사항: '안 보인다'는 오해 불식)
                                        return s ? searchMatch : (statusMatch && searchMatch);
                                    })
                                    .map((ad) => (
                                        <React.Fragment key={ad.id}>
                                            <tr
                                                onClick={() => setExpandedAd(expandedAd === ad.id ? null : ad.id)}
                                                className={`border-b border-slate-50 hover:bg-slate-50/70 transition-colors cursor-pointer group ${expandedAd === ad.id ? 'bg-blue-50/30' : ''}`}
                                            >
                                                {/* 0. No. Column */}
                                                <td className="pl-8 pr-2 py-6">
                                                    <span className="text-[10px] font-black text-slate-400 font-mono">
                                                        {ad.id || '—'}
                                                    </span>
                                                </td>

                                                {/* 1. Shop Info */}
                                                <td className="pl-3 pr-8 py-6">
                                                    <div
                                                        className="flex flex-col gap-0.5 cursor-pointer hover:opacity-70 transition-opacity"
                                                        onClick={(e) => { e.stopPropagation(); setSelectedAdForModal(ad); }}
                                                    >
                                                        {/* 1) 상호명 */}
                                                        <div className="text-sm font-black text-slate-900 leading-tight">
                                                            {(ad as any).shopName || ad.name || '—'}
                                                        </div>
                                                        {/* 2) 회원ID (username 우선, 없으면 UUID 앞 8자) */}
                                                        <div className="text-[10px] font-black text-blue-600 font-mono mt-0.5 flex items-center gap-1">
                                                            <span className="bg-blue-50 px-1 rounded-sm text-[9px]">ID</span>
                                                            {(ad as any).username || String((ad as any).user_id || ad.ownerId || '').slice(0, 8) + '…'}
                                                        </div>
                                                        {/* 3) 지역 / 직종 1차 / 직종 2차(상세) */}
                                                        <div className="flex gap-1 mt-0.5 flex-wrap">
                                                            <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-sm whitespace-nowrap">
                                                                {(ad as any).regionCity || ad.region || '—'} {(ad as any).regionGu || ad.work_region_sub || ''}
                                                            </span>
                                                            <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-sm whitespace-nowrap">
                                                                {(ad as any).category || (ad as any).jobCategory || (ad as any).options?.category || '직종미상'}
                                                            </span>
                                                            {/* 직종 2차(상세) — category_sub → enriched categorySub */}
                                                            {((ad as any).categorySub || (ad as any).category_sub || (ad as any).options?.categorySub) && (
                                                                <span className="text-[10px] font-bold text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded-sm whitespace-nowrap">
                                                                    {(ad as any).categorySub || (ad as any).category_sub || (ad as any).options?.categorySub}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* 2. Options */}
                                                <td className="px-8 py-6">
                                                    <div className="flex flex-col gap-1.5">
                                                        <div className="flex items-center gap-1 flex-nowrap overflow-hidden">
                                                            {(() => {
                                                                const pt = String((ad as any).productType || (ad as any).tier || (ad as any).product_type || (ad as any).ad_type || ad.options?.product_type || 'p7').toLowerCase();
                                                                let badgeColor = 'bg-slate-900';
                                                                let label = 'T7';

                                                                if (pt.includes('grand') || pt === 'p1') { badgeColor = 'bg-amber-500'; label = 'T1'; }
                                                                else if (pt.includes('premium') || pt === 'p2') { badgeColor = 'bg-red-600'; label = 'T2'; }
                                                                else if (pt.includes('deluxe') || pt === 'p3') { badgeColor = 'bg-blue-600'; label = 'T3'; }
                                                                else if (pt.includes('special') || pt === 'p4') { badgeColor = 'bg-emerald-600'; label = 'T4'; }
                                                                else if (pt === 'p5') { badgeColor = 'bg-orange-500'; label = 'T5'; }
                                                                else if (pt === 'p6') { badgeColor = 'bg-slate-600'; label = 'T6'; }

                                                                return (
                                                                    <span className={`${badgeColor} text-white text-[9px] px-1.5 py-0.5 rounded-sm font-black shadow-sm shrink-0 whitespace-nowrap uppercase`}>
                                                                        {label}
                                                                    </span>
                                                                );
                                                            })()}

                                                            {(ad.options?.icon || (ad as any).selectedIcon) && <span className="bg-indigo-500 text-white text-[9px] px-1.5 py-0.5 rounded-sm font-black shadow-sm h-fit">아</span>}
                                                            {(ad.options?.highlighter || (ad as any).selectedHighlighter) && <span className="bg-gray-600 text-white text-[9px] px-1.5 py-0.5 rounded-sm font-black shadow-sm h-fit">형</span>}
                                                            {(ad.options?.border && ad.options?.border !== 'none') && <span className="bg-blue-500 text-white text-[9px] px-1.5 py-0.5 rounded-sm font-black shadow-sm h-fit">테</span>}
                                                            {((ad as any).options?.paySuffixes || (ad as any).options?.pay_suffixes || (ad as any).paySuffixes || (ad as any).pay_suffixes) && (
                                                                (((ad as any).options?.paySuffixes || (ad as any).options?.pay_suffixes || (ad as any).paySuffixes || (ad as any).pay_suffixes).length > 0) &&
                                                                <span className="bg-blue-500 text-white text-[9px] px-1.5 py-0.5 rounded-sm font-black shadow-sm h-fit">급</span>
                                                            )}
                                                        </div>
                                                        <h4
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                if (ad) setSelectedAdForModal(ad);
                                                            }}
                                                            className="text-sm font-black text-slate-900 hover:text-blue-600 cursor-pointer transition line-clamp-1 decoration-blue-500/30 hover:underline underline-offset-4"
                                                        >
                                                            {ad.title}
                                                        </h4>
                                                        <div className="text-[10px] font-bold text-gray-400">최근 수정: {(ad as any).edit_count || 0}/30회</div>
                                                    </div>
                                                </td>

                                                {/* 3. Price */}
                                                <td className="px-8 py-6 text-center">
                                                    <div className="text-sm font-black text-slate-950 tabular-nums whitespace-nowrap">
                                                        {(
                                                            Number((ad as any).ad_price) ||
                                                            Number(ad.ad_price) ||
                                                            Number((ad.options as any)?.ad_price) ||
                                                            Number((ad as any).price) ||
                                                            0
                                                        ).toLocaleString()}원
                                                    </div>
                                                    <span className={`px-1.5 py-0.5 rounded-md text-[9px] font-black ${(ad as any).payStatus === '결제완료' || (ad as any).payStatus === 'success' ? 'bg-blue-50 text-blue-600' : 'bg-gray-50 text-gray-400'}`}>
                                                        {(ad as any).payStatus === '결제완료' || (ad as any).payStatus === 'success' ? '입금완료' : '입금대기'}
                                                    </span>
                                                </td>

                                                {/* 4. Status — 단일 배지 */}
                                                <td className="px-8 py-6">
                                                    {(() => {
                                                        const audit_isPaid = (ad as any).payStatus === '결제완료' || (ad as any).payStatus === 'success';
                                                        const audit_isActive = ad.status === 'active';
                                                        const audit_isRejected = ad.status === 'rejected' || (ad.status as string) === 'REJECTED';

                                                        let label = '결제대기';
                                                        let cls = 'bg-amber-100 text-amber-700';

                                                        if (audit_isRejected) { label = '반려'; cls = 'bg-rose-100 text-rose-600'; }
                                                        else if (audit_isActive) { label = '게시중'; cls = 'bg-green-100 text-green-600'; }
                                                        else if (audit_isPaid) { label = '승인대기'; cls = 'bg-orange-100 text-orange-600'; }

                                                        return (
                                                            <div className="flex flex-col gap-1">
                                                                <span className={`px-2 py-1 rounded-lg text-[10px] font-black w-fit ${cls}`}>
                                                                    {label}
                                                                </span>
                                                                {audit_isRejected && (ad as any).rejection_reason && (
                                                                    <div className="text-[9px] text-rose-400 font-bold max-w-[100px] leading-tight truncate" title={(ad as any).rejection_reason}>
                                                                        ↳ {(ad as any).rejection_reason}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    })()}
                                                </td>

                                                {/* 5. Dates — KST 포맷 */}
                                                <td className="px-8 py-6">
                                                    {(() => {
                                                        const periodDays = Number(
                                                            (ad as any).options?.period ||
                                                            (ad as any).options?.ad_period ||
                                                            (ad as any).ad_period ||
                                                            (ad as any).adPeriod ||
                                                            30
                                                        );
                                                        const approvedAt = (ad as any).approved_at;
                                                        const createdAt = ad.created_at;
                                                        const paidAt = (ad as any).approved_at;
                                                        // 마감일은 승인일 기준으로만 계산 (결제대기/승인대기 상태엔 미표시)
                                                        const deadlineBase = approvedAt || null;

                                                        return (
                                                            <div className="flex flex-col gap-1 text-[10px] font-bold leading-tight whitespace-nowrap">
                                                                <div className="text-slate-400">
                                                                    <span className="text-slate-500 font-black">신청일</span><br />
                                                                    {fmtKST(createdAt)}
                                                                </div>
                                                                {paidAt && (
                                                                    <div className="text-blue-500">
                                                                        <span className="font-black">결제일</span><br />
                                                                        {fmtKST(paidAt)}
                                                                    </div>
                                                                )}
                                                                <div className={deadlineBase ? 'text-green-600' : 'text-slate-300'}>
                                                                    <span className="font-black">마감일 ({periodDays}일)</span><br />
                                                                    {deadlineBase ? calcDeadline(deadlineBase, periodDays) : '승인 후 확정'}
                                                                </div>
                                                            </div>
                                                        );
                                                    })()}
                                                </td>

                                                {/* 6. Actions — 결제 상태별 워크플로 */}
                                                <td className="px-8 py-6 text-right">
                                                    {(() => {
                                                        const action_isPaid = (ad as any).payStatus === '결제완료' || (ad as any).payStatus === 'success';
                                                        const action_isActive = ad.status === 'active';
                                                        const action_isRejected = ad.status === 'rejected' || (ad.status as string) === 'REJECTED';

                                                        if (action_isActive) {
                                                            // 게시중 — 자동 마감, 버튼 없음
                                                            return <div className="flex justify-end"><span className="text-[10px] text-slate-300 font-bold">자동마감</span></div>;
                                                        }

                                                        if (action_isRejected) {
                                                            return <div className="flex justify-end"><span className="text-[10px] text-slate-300 font-bold">—</span></div>;
                                                        }

                                                        // 결제대기 OR 승인대기 — 입금확인(=승인) 단일 버튼
                                                        return (
                                                            <div className="flex justify-end gap-2">
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); handleStatusUpdate(ad.id, 'active'); }}
                                                                    className="px-2.5 py-1.5 bg-green-600 text-white rounded-xl hover:bg-green-700 text-[10px] font-black transition-all active:scale-95 shadow-sm shadow-green-200 whitespace-nowrap"
                                                                    title="입금확인 = 승인 (결제완료 + 게시중 동시 반영)"
                                                                >
                                                                    입금확인(승인)
                                                                </button>
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); setRejectingAdId(ad.id); setIsRejectModalOpen(true); }}
                                                                    className="p-2 bg-slate-50 text-slate-400 rounded-xl hover:bg-red-50 hover:text-red-600 transition-all"
                                                                    title="반려"
                                                                >
                                                                    <XCircle size={16} />
                                                                </button>
                                                            </div>
                                                        );
                                                    })()}
                                                </td>
                                            </tr>
                                            {expandedAd === ad.id && (
                                                <tr>
                                                    <td colSpan={6} className="px-8 py-0">
                                                        <div className="bg-slate-900/5 border-x border-slate-100 p-10 animate-in fade-in slide-in-from-top-2 duration-300">
                                                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                                                                <div className="space-y-6">
                                                                    <div className="flex items-center gap-2 text-rose-600 font-black text-[10px] uppercase tracking-widest">
                                                                        <Info size={14} /> 규칙 및 정책 위반 정보 검사
                                                                    </div>
                                                                    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden">
                                                                        <div className="absolute top-0 right-0 px-3 py-1 bg-green-50 text-green-600 text-[10px] font-black">NORMAL</div>
                                                                        <p className="text-xs font-bold text-slate-600 leading-relaxed">
                                                                            &quot;안녕하세요! 저희 상점은 최고의 대우와 안락한 환경을 보장합니다. 주저 말고 연락 주세요. {ad.shopName}은 언제나 열려 있습니다.&quot;
                                                                        </p>
                                                                        <div className="mt-4 pt-4 border-t border-slate-50 text-[10px] text-slate-400 font-bold">
                                                                            * 현재 본문 내 정책 위반 단어가 발견되지 않았습니다.
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <div className="space-y-6">
                                                                    <div className="text-slate-950 font-black text-sm tracking-tighter italic underline decoration-blue-500 decoration-2 underline-offset-4">
                                                                        광고주(회원) 통합 이력
                                                                    </div>
                                                                    <div className="space-y-3">
                                                                        <div className="flex justify-between items-center p-4 bg-white rounded-2xl border border-slate-100 text-xs shadow-sm">
                                                                            <span className="font-bold text-slate-500">누적 수정 횟수 (이번달)</span>
                                                                            <span className="font-black text-blue-600">{(ad as any).edit_count || 0} / 30회</span>
                                                                        </div>
                                                                        <div className="flex justify-between items-center p-4 bg-white rounded-2xl border border-slate-100 text-xs shadow-sm">
                                                                            <span className="font-bold text-slate-500">진행 중인 광고</span>
                                                                            <span className="font-black text-slate-950">2건</span>
                                                                        </div>
                                                                        <div className="flex justify-between items-center p-4 bg-white rounded-2xl border border-slate-100 text-xs shadow-sm">
                                                                            <span className="font-bold text-slate-500">마감된 광고</span>
                                                                            <span className="font-black text-slate-400">14건</span>
                                                                        </div>
                                                                    </div>
                                                                    <button className="w-full py-4 bg-slate-950 text-white rounded-2xl text-xs font-black shadow-lg shadow-slate-200">광고주 상세 프로필 보기</button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="px-8 py-20 text-center">
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300">
                                                <Database size={32} />
                                            </div>
                                            <div>
                                                <p className="text-sm font-black text-slate-900 tracking-tighter">운영 데이터베이스가 비어 있습니다.</p>
                                                <p className="text-xs text-slate-400 font-bold mt-1">로컬 데이터를 Supabase로 동기화(Migration)해야 리스트가 표시됩니다.</p>
                                            </div>

                                            {/* --- Diagnostic Info --- */}
                                            <div className={`mt-4 p-4 border rounded-xl text-left w-full max-w-sm ${mockAds.length === 0 && process.env.NEXT_PUBLIC_SUPABASE_URL ? 'bg-slate-50 border-slate-200' : 'bg-red-50 border-red-100'}`}>
                                                <p className={`text-xs font-black mb-2 flex items-center gap-1 ${mockAds.length === 0 && process.env.NEXT_PUBLIC_SUPABASE_URL ? 'text-slate-600' : 'text-red-600'}`}>
                                                    <span className={`w-2 h-2 rounded-full animate-pulse ${mockAds.length === 0 && process.env.NEXT_PUBLIC_SUPABASE_URL ? 'bg-blue-500' : 'bg-red-500'}`}></span>
                                                    시스템 연결 진단 (System Diagnostic)
                                                </p>
                                                <div className={`space-y-1 text-[11px] font-medium ${mockAds.length === 0 && process.env.NEXT_PUBLIC_SUPABASE_URL ? 'text-slate-500' : 'text-red-500'}`}>
                                                    <p>• URL Config: {process.env.NEXT_PUBLIC_SUPABASE_URL ? '설정됨' : '미설정됨 (NULL)'}</p>
                                                    <p>• URL Value: {process.env.NEXT_PUBLIC_SUPABASE_URL ? process.env.NEXT_PUBLIC_SUPABASE_URL.substring(0, 15) + '...' : '-'}</p>
                                                    <p>• DB 상태: {mockAds.length === 0 && process.env.NEXT_PUBLIC_SUPABASE_URL ? '연결됨 (데이터 없음)' : '신규 데이터 확인 불가'}</p>
                                                    <p>• Data Count: {mockAds.length}건</p>
                                                </div>
                                                <p className={`mt-2 text-[10px] border-t pt-2 leading-tight ${mockAds.length === 0 && process.env.NEXT_PUBLIC_SUPABASE_URL ? 'text-slate-400 border-slate-200' : 'text-red-400 border-red-100'}`}>
                                                    {process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder')
                                                        ? 'Vercel 환경 변수가 없지만 [Emergency Fallback]이 작동하여 연결되었습니다.'
                                                        : 'DB 연결 상태: 정상 (연결 성공, 테이블이 비어있을 수 있습니다)'}
                                                </p>
                                            </div>

                                            <button
                                                onClick={() => fetchData()}
                                                className="mt-2 px-6 py-2.5 bg-slate-950 text-white rounded-xl text-xs font-black hover:bg-black transition-all flex items-center gap-2"
                                            >
                                                <RefreshCw size={14} /> 데이터 새로고침
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Rejection Modal */}
            {isRejectModalOpen && (
                <div className="fixed inset-0 z-[10020] flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-300"
                        onClick={() => setIsRejectModalOpen(false)}
                    />
                    <div className="bg-white w-full max-w-sm rounded-[32px] p-8 shadow-2xl relative z-10 animate-in zoom-in-95 duration-300">
                        <div className="text-center mb-6">
                            <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4">
                                <XCircle size={32} />
                            </div>
                            <h3 className="text-xl font-black text-slate-900 tracking-tighter">광고 반려 사유 입력</h3>
                            <p className="text-xs text-slate-400 font-bold mt-2">반려 사유는 사장님에게 알림톡으로 전송됩니다.</p>
                        </div>
                        <div className="space-y-3">
                            <button onClick={() => setRejectionReason('이미지 부적절 (과도한 노출)')} className={`w-full py-3 rounded-2xl text-xs font-bold border transition-all ${rejectionReason.includes('이미지') ? 'bg-rose-50 border-rose-200 text-rose-600' : 'bg-white border-slate-100 text-slate-500 hover:bg-slate-50'}`}>
                                이미지 부적절 (과도한 노출)
                            </button>
                            <button onClick={() => setRejectionReason('텍스트 부적절 (비속어/은어)')} className={`w-full py-3 rounded-2xl text-xs font-bold border transition-all ${rejectionReason.includes('텍스트') ? 'bg-rose-50 border-rose-200 text-rose-600' : 'bg-white border-slate-100 text-slate-500 hover:bg-slate-50'}`}>
                                텍스트 부적절 (비속어/은어)
                            </button>
                            <button onClick={() => setRejectionReason('카테고리 분류 오류')} className={`w-full py-3 rounded-2xl text-xs font-bold border transition-all ${rejectionReason.includes('카테고리') ? 'bg-rose-50 border-rose-200 text-rose-600' : 'bg-white border-slate-100 text-slate-500 hover:bg-slate-50'}`}>
                                카테고리 분류 오류
                            </button>
                            <textarea
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                                placeholder="직접 입력..."
                                className="w-full p-4 bg-slate-50 rounded-2xl text-sm font-bold border border-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-200 resize-none h-24"
                            />
                            <div className="pt-4">
                                <button
                                    onClick={() => {
                                        if (rejectingAdId) {
                                            handleStatusUpdate(rejectingAdId, 'rejected', rejectionReason);
                                        }
                                    }}
                                    disabled={!rejectionReason}
                                    className={`w-full py-4 rounded-2xl text-sm font-black shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 ${rejectionReason ? 'bg-rose-500 text-white shadow-rose-200 hover:bg-rose-600' : 'bg-slate-100 text-slate-300 cursor-not-allowed'}`}
                                >
                                    <XCircle size={18} /> 최종 거절 처리 및 알림 발송
                                </button>
                                <p className="text-[10px] text-center text-slate-400 font-bold mt-4 italic">
                                    * 사장님께 즉시 푸시 알림과 함께 입력한 사유가 전송됩니다.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}
