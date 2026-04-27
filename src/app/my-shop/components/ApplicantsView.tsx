'use client';
import React, { useEffect, useState } from 'react';
import { Phone, MessageSquare, CheckCircle, XCircle, AlertTriangle, User, ChevronLeft } from 'lucide-react';
import { useBrand } from '@/components/BrandProvider';
import { supabase } from '@/lib/supabase';

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
    pending:  { label: '미확인', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
    reviewed: { label: '확인됨', color: 'bg-blue-100 text-blue-700 border-blue-200' },
    accepted: { label: '채용', color: 'bg-green-100 text-green-700 border-green-200' },
    rejected: { label: '거절', color: 'bg-slate-100 text-slate-500 border-slate-200' },
    flagged:  { label: '신고됨', color: 'bg-red-100 text-red-700 border-red-200' },
};

interface ApplicantsViewProps {
    setView: (v: any) => void;
    userName?: string;
    userId?: string;
    onOpenMenu?: () => void;
}

export const ApplicantsView = ({ setView, userName = '', userId = '', onOpenMenu }: ApplicantsViewProps) => {
    const brand = useBrand();
    const [applications, setApplications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState<any | null>(null);
    const [filter, setFilter] = useState<string>('all');

    useEffect(() => {
        if (!userId) { setLoading(false); return; }
        fetchApplications();
    }, [userId]);

    const fetchApplications = async () => {
        setLoading(true);
        // 내 광고(shops)의 shop_id와 연결된 applications 조회
        const { data: shops } = await supabase.from('shops').select('id, name').eq('user_id', userId);
        const shopNameMap = Object.fromEntries((shops || []).map(s => [String(s.id), s.name]));

        const { data } = await supabase
            .from('applications')
            .select('*')
            .eq('owner_user_id', userId)
            .order('created_at', { ascending: false });

        if (data) {
            // shop 이름 매핑
            const enriched = data.map(app => ({
                ...app,
                shopName: shopNameMap[String(app.shop_id)] || app.shop_name || '공고 없음',
            }));
            setApplications(enriched);
        }
        setLoading(false);
    };

    const updateStatus = async (id: string, status: string) => {
        await supabase.from('applications').update({ status, updated_at: new Date().toISOString() }).eq('id', id);
        setApplications(prev => prev.map(a => a.id === id ? { ...a, status } : a));
        if (selected?.id === id) setSelected((p: any) => ({ ...p, status }));
    };

    const handleFlag = async (id: string) => {
        const reason = prompt('신고 사유를 입력하세요 (스팸, 허위지원 등):');
        if (!reason) return;
        await supabase.from('applications').update({ status: 'flagged', is_flagged: true, flag_reason: reason }).eq('id', id);
        await fetchApplications();
        setSelected(null);
    };

    const filtered = filter === 'all' ? applications : applications.filter(a => a.status === filter);

    const isDark = brand.theme === 'dark';
    const card = `rounded-[20px] border ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'}`;

    return (
        <div className="space-y-4 md:space-y-6">
            {/* Header */}
            <div className={`relative p-5 md:p-6 ${card}`}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center text-white ${isDark ? 'bg-gray-800' : 'bg-blue-600'}`}>
                            <User size={20} />
                        </div>
                        <div>
                            <h2 className={`text-lg md:text-xl font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>온라인 지원자 관리</h2>
                            <p className={`text-xs font-bold ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>총 {applications.length}명 지원</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        {['all', 'pending', 'reviewed', 'accepted', 'rejected'].map(f => (
                            <button key={f} onClick={() => setFilter(f)}
                                className={`px-2.5 py-1 rounded-full text-[9px] font-black border transition-all hidden md:block ${filter === f ? 'bg-gray-900 text-white border-gray-900' : `${isDark ? 'border-gray-700 text-gray-400' : 'border-gray-200 text-gray-400'}`}`}>
                                {f === 'all' ? '전체' : (STATUS_LABELS[f]?.label ?? f)}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Content */}
            {loading ? (
                <div className={`p-12 rounded-2xl border text-center ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'}`}>
                    <p className="text-gray-400 font-bold text-sm">불러오는 중...</p>
                </div>
            ) : filtered.length === 0 ? (
                <div className={`p-12 rounded-2xl border text-center ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'}`}>
                    <User size={40} className="mx-auto text-gray-300 mb-3" />
                    <p className="text-gray-400 font-bold">아직 온라인 지원자가 없습니다.</p>
                    <p className="text-gray-300 text-xs mt-1">지원자가 공고에서 지원하면 여기에 표시됩니다.</p>
                </div>
            ) : selected ? (
                // Detail View
                <div className={`p-6 rounded-[24px] border ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'}`}>
                    <button onClick={() => setSelected(null)} className={`flex items-center gap-1 text-xs font-bold mb-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        <ChevronLeft size={14} /> 목록으로
                    </button>
                    <div className="space-y-4">
                        <div className="flex items-start justify-between">
                            <div>
                                <h3 className={`text-xl font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>{selected.applicant_name || '이름없음'}</h3>
                                <p className={`text-xs font-bold mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{selected.shopName} · {new Date(selected.created_at).toLocaleString()}</p>
                            </div>
                            <span className={`text-[10px] font-black px-2.5 py-1 rounded-full border ${STATUS_LABELS[selected.status]?.color}`}>
                                {STATUS_LABELS[selected.status]?.label}
                            </span>
                        </div>
                        <div className={`p-4 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}>
                            <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>연락처</p>
                            <p className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{selected.applicant_phone || '-'}</p>
                        </div>
                        {selected.message && (
                            <div className={`p-4 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}>
                                <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>지원 메시지</p>
                                <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'} whitespace-pre-wrap`}>{selected.message}</p>
                            </div>
                        )}
                        <div className="grid grid-cols-2 gap-2">
                            <a href={`tel:${selected.applicant_phone}`}
                                className="py-3 rounded-xl bg-[#f82b60] text-white text-xs font-black flex items-center justify-center gap-1.5 hover:opacity-90 transition">
                                <Phone size={14} /> 전화하기
                            </a>
                            <button onClick={() => { window.dispatchEvent(new CustomEvent('open-note-modal', { detail: { receiver: selected.applicant_name } })); }}
                                className={`py-3 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 border transition ${isDark ? 'bg-gray-800 border-gray-700 text-gray-300' : 'bg-gray-50 border-gray-200 text-gray-600'}`}>
                                <MessageSquare size={14} /> 쪽지보내기
                            </button>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => updateStatus(selected.id, 'reviewed')}
                                className={`flex-1 py-2 rounded-xl text-[10px] font-black border transition ${selected.status === 'reviewed' ? 'bg-blue-600 text-white border-blue-600' : `${isDark ? 'border-gray-700 text-gray-400' : 'border-gray-200 text-gray-500'}`}`}>
                                확인됨
                            </button>
                            <button onClick={() => updateStatus(selected.id, 'accepted')}
                                className={`flex-1 py-2 rounded-xl text-[10px] font-black border transition ${selected.status === 'accepted' ? 'bg-green-600 text-white border-green-600' : `${isDark ? 'border-gray-700 text-gray-400' : 'border-gray-200 text-gray-500'}`}`}>
                                채용
                            </button>
                            <button onClick={() => updateStatus(selected.id, 'rejected')}
                                className={`flex-1 py-2 rounded-xl text-[10px] font-black border transition ${selected.status === 'rejected' ? 'bg-slate-700 text-white border-slate-700' : `${isDark ? 'border-gray-700 text-gray-400' : 'border-gray-200 text-gray-500'}`}`}>
                                거절
                            </button>
                            <button onClick={() => handleFlag(selected.id)}
                                className="py-2 px-3 rounded-xl text-[10px] font-black border border-red-200 text-red-500 hover:bg-red-50 transition">
                                <AlertTriangle size={12} />
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                // List View
                <div className="space-y-2">
                    {filtered.map(app => (
                        <div key={app.id} onClick={() => setSelected(app)}
                            className={`p-4 rounded-[20px] border cursor-pointer transition-all hover:shadow-md ${isDark ? 'bg-gray-900 border-gray-800 hover:border-gray-700' : 'bg-white border-gray-100 hover:border-gray-200'}`}>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${isDark ? 'bg-gray-800' : 'bg-blue-50'}`}>
                                        <User size={16} className={isDark ? 'text-gray-400' : 'text-blue-500'} />
                                    </div>
                                    <div>
                                        <p className={`text-sm font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>{app.applicant_name || '이름없음'}</p>
                                        <p className={`text-[10px] font-bold ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{app.shopName} · {new Date(app.created_at).toLocaleDateString()}</p>
                                    </div>
                                </div>
                                <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${STATUS_LABELS[app.status]?.color}`}>
                                    {STATUS_LABELS[app.status]?.label}
                                </span>
                            </div>
                            {app.message && (
                                <p className={`text-[10px] mt-2 line-clamp-1 pl-12 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{app.message}</p>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
