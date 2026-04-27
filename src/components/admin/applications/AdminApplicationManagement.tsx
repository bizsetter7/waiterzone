'use client';
import React, { useEffect, useState } from 'react';
import { Flag, Trash2, CheckCircle, Eye, Phone, AlertTriangle, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface AdminApplicationManagementProps {
    fetchData: () => void;
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
    pending:  { label: '미확인', color: 'bg-yellow-100 text-yellow-700' },
    reviewed: { label: '확인됨', color: 'bg-blue-100 text-blue-700' },
    accepted: { label: '채용', color: 'bg-green-100 text-green-700' },
    rejected: { label: '거절', color: 'bg-slate-100 text-slate-500' },
    flagged:  { label: '🚨 신고됨', color: 'bg-red-100 text-red-700' },
};

export function AdminApplicationManagement({ fetchData }: AdminApplicationManagementProps) {
    const [applications, setApplications] = useState<any[]>([]);
    const [filter, setFilter] = useState<string>('all');
    const [selected, setSelected] = useState<any | null>(null);
    const [flagReason, setFlagReason] = useState('');
    const [loading, setLoading] = useState(true);

    const fetchApplications = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('applications')
            .select('*, shops(name, user_id)')
            .order('created_at', { ascending: false });
        if (!error && data) setApplications(data);
        setLoading(false);
    };

    useEffect(() => { fetchApplications(); }, []);

    const updateStatus = async (id: string, status: string, extra?: object) => {
        await supabase.from('applications').update({ status, updated_at: new Date().toISOString(), ...extra }).eq('id', id);
        await fetchApplications();
        if (selected?.id === id) setSelected((p: any) => ({ ...p, status, ...extra }));
    };

    const deleteApp = async (id: string) => {
        if (!confirm('지원 내역을 삭제하시겠습니까?')) return;
        await supabase.from('applications').delete().eq('id', id);
        await fetchApplications();
        if (selected?.id === id) setSelected(null);
    };

    const handleFlag = async (id: string) => {
        if (!flagReason.trim()) { alert('신고 사유를 입력해주세요.'); return; }
        await updateStatus(id, 'flagged', { is_flagged: true, flag_reason: flagReason });
        setFlagReason('');
    };

    const filtered = filter === 'all'
        ? applications
        : filter === 'flagged'
            ? applications.filter(a => a.is_flagged)
            : applications.filter(a => a.status === filter);

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
            <div className="flex justify-between items-end">
                <div>
                    <h3 className="text-2xl font-black text-slate-950 tracking-tighter">지원자 관리</h3>
                    <p className="text-sm text-slate-400 font-bold mt-1">온라인 지원 내역 및 불법 행위를 통제합니다.</p>
                </div>
                <div className="flex gap-2 flex-wrap justify-end">
                    {['all', 'pending', 'reviewed', 'accepted', 'rejected', 'flagged'].map(f => (
                        <button key={f} onClick={() => setFilter(f)}
                            className={`px-3 py-1 rounded-full text-[10px] font-black border transition-all ${filter === f ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-400 border-slate-200'}`}>
                            {f === 'all' ? '전체' : (STATUS_LABELS[f]?.label ?? f)}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[680px]">
                {/* List */}
                <div className="bg-white rounded-[40px] border border-slate-100 shadow-xl overflow-hidden flex flex-col">
                    <div className="p-5 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center">
                        <span className="text-xs font-black text-slate-500">{filtered.length}건</span>
                        <span className="text-[10px] font-bold text-red-500">{applications.filter(a => a.is_flagged).length}건 신고됨</span>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-2">
                        {loading ? (
                            <div className="flex items-center justify-center h-full text-slate-400 text-sm font-bold">로딩 중...</div>
                        ) : filtered.length === 0 ? (
                            <div className="flex items-center justify-center h-full text-slate-400 text-sm font-bold">내역이 없습니다.</div>
                        ) : filtered.map(app => (
                            <div key={app.id}
                                onClick={() => setSelected(app)}
                                className={`p-4 rounded-[20px] border cursor-pointer transition-all hover:shadow-md group relative ${selected?.id === app.id ? 'bg-slate-50 border-slate-200 ring-1 ring-slate-200' : 'bg-white border-slate-100'} ${app.is_flagged ? 'border-red-200 bg-red-50/30' : ''}`}>
                                <div className="flex items-start justify-between gap-2 mb-2">
                                    <div className="flex items-center gap-2">
                                        {app.is_flagged && <AlertTriangle size={12} className="text-red-500 shrink-0" />}
                                        <span className="text-sm font-black text-slate-900">{app.applicant_name || '이름없음'}</span>
                                        <span className="text-[10px] text-slate-400">{app.applicant_phone || '-'}</span>
                                    </div>
                                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${STATUS_LABELS[app.status]?.color ?? 'bg-slate-100 text-slate-500'}`}>
                                        {STATUS_LABELS[app.status]?.label ?? app.status}
                                    </span>
                                </div>
                                <div className="text-[10px] text-slate-500 font-medium">
                                    <span className="font-bold text-slate-700">{app.shops?.name || '업체명 없음'}</span>
                                    <span className="mx-2 text-slate-300">|</span>
                                    {new Date(app.created_at).toLocaleDateString()}
                                </div>
                                {app.message && (
                                    <p className="text-[10px] text-slate-400 mt-1 line-clamp-1">{app.message}</p>
                                )}
                                {app.is_flagged && app.flag_reason && (
                                    <p className="text-[9px] text-red-500 font-bold mt-1">사유: {app.flag_reason}</p>
                                )}
                                <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                    <button onClick={(e) => { e.stopPropagation(); deleteApp(app.id); }}
                                        className="p-1.5 bg-rose-50 text-rose-500 rounded-lg hover:bg-rose-100 transition">
                                        <Trash2 size={12} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Detail */}
                <div className="bg-slate-950 rounded-[40px] border border-slate-800 shadow-2xl overflow-hidden flex flex-col">
                    {selected ? (
                        <div className="flex flex-col h-full">
                            <div className="p-6 border-b border-white/5 flex justify-between items-start">
                                <div>
                                    <div className={`inline-block text-[9px] font-black px-2 py-0.5 rounded-full mb-2 ${STATUS_LABELS[selected.status]?.color ?? 'bg-slate-700 text-slate-300'}`}>
                                        {STATUS_LABELS[selected.status]?.label ?? selected.status}
                                    </div>
                                    <h3 className="text-xl font-black text-white">{selected.applicant_name || '이름없음'}</h3>
                                    <p className="text-slate-400 text-xs font-bold mt-1">{selected.shops?.name || '업체 없음'} · {new Date(selected.created_at).toLocaleString()}</p>
                                </div>
                                <button onClick={() => setSelected(null)} className="text-slate-600 hover:text-white transition"><X size={20} /></button>
                            </div>
                            <div className="flex-1 overflow-y-auto p-6 space-y-4">
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800">
                                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">이름</p>
                                        <p className="text-sm font-bold text-white">{selected.applicant_name || '-'}</p>
                                    </div>
                                    <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800">
                                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">연락처</p>
                                        <p className="text-sm font-bold text-white">{selected.applicant_phone || '-'}</p>
                                    </div>
                                    <div className="col-span-2 p-4 bg-slate-900 rounded-2xl border border-slate-800">
                                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">지원 메시지</p>
                                        <p className="text-sm font-medium text-slate-300 whitespace-pre-wrap">{selected.message || '(메시지 없음)'}</p>
                                    </div>
                                    {selected.is_flagged && (
                                        <div className="col-span-2 p-4 bg-red-950/30 rounded-2xl border border-red-900/30">
                                            <p className="text-[9px] font-black text-red-400 uppercase tracking-widest mb-1">신고 사유</p>
                                            <p className="text-sm font-medium text-red-300">{selected.flag_reason}</p>
                                        </div>
                                    )}
                                </div>

                                {/* Status Actions */}
                                <div className="space-y-2">
                                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">상태 변경</p>
                                    <div className="flex flex-wrap gap-2">
                                        {['reviewed', 'accepted', 'rejected'].map(s => (
                                            <button key={s} onClick={() => updateStatus(selected.id, s)}
                                                className={`px-3 py-1.5 rounded-xl text-[10px] font-black transition border ${selected.status === s ? 'bg-white text-slate-900 border-white' : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-600'}`}>
                                                {STATUS_LABELS[s]?.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Flag Section */}
                                <div className="space-y-2">
                                    <p className="text-[9px] font-black text-red-400 uppercase tracking-widest">🚨 불법/신고 처리</p>
                                    <input
                                        value={flagReason}
                                        onChange={e => setFlagReason(e.target.value)}
                                        placeholder="신고 사유 입력 (스팸, 음란, 협박 등)"
                                        className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-red-500/50"
                                    />
                                    <button onClick={() => handleFlag(selected.id)}
                                        className="w-full py-2 rounded-xl bg-red-600/20 text-red-400 border border-red-900/30 text-xs font-black hover:bg-red-600/30 transition flex items-center justify-center gap-2">
                                        <Flag size={12} /> 신고 처리 및 잠금
                                    </button>
                                </div>

                                <button onClick={() => deleteApp(selected.id)}
                                    className="w-full py-2 rounded-xl bg-slate-900 text-slate-500 border border-slate-800 text-xs font-black hover:text-rose-400 hover:border-rose-900/30 transition">
                                    지원 내역 영구 삭제
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-slate-600 p-12 text-center">
                            <Eye size={40} className="mb-4 text-slate-800" />
                            <p className="text-sm font-bold text-slate-500 opacity-50">목록에서 지원자를 선택하세요</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
