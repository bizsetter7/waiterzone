import React, { useState } from 'react';
import {
    MessageSquare,
    Save,
    Send,
    Paperclip,
    PenBox,
    X,
    User,
    Megaphone,
    Loader2
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { NoteService } from '@/lib/noteService';

interface AdminInquiryManagementProps {
    inquiries: any[];
    messages: any[];
    fetchData: () => Promise<void>;
    profiles?: any[]; // profiles 배열로 UUID → 닉네임 매핑
}

export function AdminInquiryManagement({ inquiries, messages, fetchData, profiles = [] }: AdminInquiryManagementProps) {
    // profiles 배열에서 userId로 프로필 빠르게 조회
    const getProfileByUserId = (userId: string | undefined) => {
        if (!userId) return null;
        return profiles.find(p => p.id === userId) || null;
    };
    const [activeTab, setActiveTab] = useState<'all' | 'inquiry' | 'message'>('all');
    const [inquiryFilter, setInquiryFilter] = useState<string>('전체');
    const [selectedInquiry, setSelectedInquiry] = useState<any | null>(null);
    const [inquiryThread, setInquiryThread] = useState<any[]>([]);
    const [inquiryReply, setInquiryReply] = useState('');

    const ADMIN_ALIASES_LIST = ['시스템 관리자', '운영자', '관리자', 'admin', '마스터관리자', 'admin_user', 'Admin', '운영팀', '[관리자]'];

    const [editingWriterName, setEditingWriterName] = useState(false);
    const [tempWriterName, setTempWriterName] = useState('');
    const [isUpdatingWriter, setIsUpdatingWriter] = useState(false);
    const [memberProfile, setMemberProfile] = useState<any | null>(null);
    const [showBroadcast, setShowBroadcast] = useState(false);
    const [broadcastMsg, setBroadcastMsg] = useState('');
    const [isBroadcasting, setIsBroadcasting] = useState(false);

    const handleBroadcast = async () => {
        if (!broadcastMsg.trim()) { alert('메시지 내용을 입력하세요.'); return; }
        if (!confirm(`전체 회원에게 쪽지를 발송하시겠습니까?\n\n"${broadcastMsg}"`)) return;
        setIsBroadcasting(true);
        try {
            const { data: users, error } = await supabase
                .from('profiles')
                .select('id, username')
                .neq('role', 'admin');
            if (error) throw error;
            if (!users || users.length === 0) { alert('발송할 회원이 없습니다.'); return; }

            // messages 실제 컬럼: sender_id/sender_name/receiver_id/receiver_name/content/status/is_read/created_at
            // from/to 컬럼 없음 — sender_name/receiver_name 사용
            const msgs = users.map(u => ({
                sender_id: 'admin',
                sender_name: '운영팀',
                receiver_id: u.id,
                receiver_name: u.username || u.id,
                content: broadcastMsg,
                is_read: false,
                created_at: new Date().toISOString(),
            }));

            // 50건씩 배치 insert
            for (let i = 0; i < msgs.length; i += 50) {
                const { error: batchErr } = await supabase.from('messages').insert(msgs.slice(i, i + 50));
                if (batchErr) throw batchErr;
            }
            alert(`전체 ${users.length}명에게 쪽지 발송 완료!`);
            setBroadcastMsg('');
            setShowBroadcast(false);
            fetchData();
        } catch (err: any) {
            alert('발송 실패: ' + (err.message || '오류'));
        } finally {
            setIsBroadcasting(false);
        }
    };

    const handleViewMember = async (userId: string) => {
        if (!userId) return;
        // profiles prop 배열 우선 조회 (빠름), 없으면 DB 조회
        const cached = getProfileByUserId(userId);
        if (cached) { setMemberProfile(cached); return; }
        const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
        if (data) setMemberProfile(data);
        else alert('회원 정보를 찾을 수 없습니다.');
    };

    const handleWriterNameUpdate = async () => {
        if (!selectedInquiry || !tempWriterName.trim() || tempWriterName === selectedInquiry.writer_name) {
            setEditingWriterName(false);
            return;
        }

        setIsUpdatingWriter(true);
        try {
            const { error } = await supabase
                .from('inquiries')
                .update({ writer_name: tempWriterName.trim() })
                .eq('id', selectedInquiry.id);

            if (error) throw error;

            // Local update to avoid full re-fetch if possible, though fetchData is safer
            selectedInquiry.writer_name = tempWriterName.trim();
            setEditingWriterName(false);
            await fetchData();
            alert('작성자 이름이 수정되었습니다.');
        } catch (error) {
            console.error('Error updating writer name:', error);
            alert('수정 중 오류가 발생했습니다.');
        } finally {
            setIsUpdatingWriter(false);
        }
    };

    const handleMessageDelete = async (id: string) => {
        if (!confirm('정말 삭제하시겠습니까? (복구 불가)')) return;

        try {
            // Optimistic update
            setInquiryThread(prev => prev.filter(m => m.id !== id));

            // Supabase Delete
            await NoteService.deleteNote(id);
            // Also try deleting from inquiries if it's an inquiry type (fallback handled by service or separate call?)
            // NoteService.deleteNote deletes from 'messages'. 
            // If it's an inquiry, we might need direct supabase call as in original code.
            // Original code: await supabase.from('inquiries').delete().eq('id', messageId);
            const { error } = await supabase.from('inquiries').delete().eq('id', id);
            if (error && error.code !== 'PGRST116') console.error('Inquiry delete error', error); // Ignore if not found

            await fetchData();
            if (selectedInquiry?.id === id) setSelectedInquiry(null);
        } catch (error) {
            console.error('Delete failed:', error);
            alert('삭제 실패');
        }
    };

    const handleInquiryStatusUpdate = async (id: string, newStatus: string, reply?: string) => {
        if (selectedInquiry?.groupType === 'message') {
            alert('메시지는 상태를 변경할 수 없습니다.');
            return;
        }

        if (!confirm('상태를 변경하시겠습니까?')) return;

        try {
            const updateData: any = { status: newStatus };
            if (newStatus === 'completed' && reply) {
                updateData.reply_content = reply;
                updateData.replied_at = new Date().toISOString();

                const { error: replyInsertError } = await supabase
                    .from('inquiries')
                    .insert({
                        parent_id: selectedInquiry.parent_id || selectedInquiry.id,
                        writer_name: '운영팀',
                        title: `Re: ${selectedInquiry.title}`,
                        content: reply,
                        type: selectedInquiry.type,
                        contact: 'Administrator',
                        status: 'completed',
                        created_at: new Date().toISOString()
                    });

                if (replyInsertError) throw replyInsertError;
            }

            const { error } = await supabase
                .from('inquiries')
                .update(updateData)
                .eq('id', id);

            if (error) throw error;

            // Re-fetch thread
            const threadId = selectedInquiry.parent_id || selectedInquiry.id;
            const { data: threadData } = await supabase
                .from('inquiries')
                .select('*')
                .or(`id.eq.${threadId},parent_id.eq.${threadId}`)
                .order('created_at', { ascending: true });

            if (threadData) setInquiryThread(threadData);

            await fetchData();
            setSelectedInquiry((prev: any) => ({ ...prev, status: newStatus }));

            alert(newStatus === 'completed' ? '답변이 등록되었습니다.' : '상태가 변경되었습니다.');
        } catch (error) {
            console.error('Update failed:', error);
            alert('오류가 발생했습니다.');
        }
    };

    return (
        <>
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20 max-w-[1600px] mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[700px]">
                {/* Message List */}
                <div className="bg-white rounded-[40px] border border-slate-100 shadow-xl overflow-hidden flex flex-col">
                    <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                        <div className="flex items-center gap-3">
                            <h3 className="text-lg font-black text-slate-900">통합 문의 관리</h3>
                            <button
                                onClick={() => setShowBroadcast(true)}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white text-[10px] font-black rounded-xl hover:bg-indigo-700 transition"
                            >
                                <Megaphone size={12} /> 전체 쪽지
                            </button>
                        </div>
                        <div className="flex bg-slate-100 p-1 rounded-lg gap-1">
                            {(['all', 'inquiry', 'message'] as const).map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => {
                                        setActiveTab(tab);
                                        if (tab !== 'inquiry') setInquiryFilter('전체');
                                    }}
                                    className={`px-3 py-1.5 rounded-md text-[11px] font-black transition-all ${activeTab === tab ? 'bg-white text-slate-900 shadow-sm ring-1 ring-black/5' : 'text-slate-400 hover:text-slate-600'}`}
                                >
                                    {tab === 'all' ? '전체' : (tab === 'inquiry' ? '1:1 문의' : '쪽지')}
                                </button>
                            ))}
                        </div>
                        <span className="bg-indigo-50 text-indigo-600 px-2.5 py-1 rounded-lg text-[10px] font-black border border-indigo-100">
                            {inquiries.length + messages.length}건
                        </span>
                    </div>

                    {/* Inquiry Type Filter */}
                    {activeTab === 'inquiry' && (
                        <div className="px-6 pb-4 flex gap-2 overflow-x-auto scrollbar-hide">
                            {['전체', '입금확인문의', '배너문의', '주문형광고문의', '기간연장문의', '개인회원문의', '제휴문의', '광고 상품', '채용 관련', '신고/정책', '기타문의'].map((filter) => (
                                <button
                                    key={filter}
                                    onClick={() => setInquiryFilter(filter)}
                                    className={`px-3 py-1.5 rounded-full text-[10px] font-bold border transition-all whitespace-nowrap ${inquiryFilter === filter
                                        ? 'bg-slate-800 text-white border-slate-800'
                                        : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                                        }`}
                                >
                                    {filter}
                                </button>
                            ))}
                        </div>
                    )}
                    <div className="flex-1 overflow-y-auto p-4 space-y-2">
                        {/* List Construction */}
                        {([
                            // 1. Inquiries
                            ...(activeTab === 'all' || activeTab === 'inquiry' ? inquiries
                                .filter(inq => inquiryFilter === '전체' || inq.type === inquiryFilter)
                                .map(inq => ({ ...inq, groupType: 'inquiry', sortDate: new Date(inq.created_at) })) : []),
                            // 2. Messages
                            ...(activeTab === 'all' || activeTab === 'message' ? (inquiryFilter === '전체' ? Object.values(messages.reduce((acc: any, msg: any) => {
                                const isFromAdmin = ADMIN_ALIASES_LIST.includes(msg.from) || ADMIN_ALIASES_LIST.includes(msg.sender_name) || msg.sender_id === 'admin-uuid-placeholder';
                                const partnerName = isFromAdmin ? msg.to : (msg.from || msg.sender_name);
                                const partnerId = isFromAdmin ? msg.receiver_id : msg.sender_id;
                                const uniqueKey = partnerId ? `id_${partnerId}` : `name_${partnerName}`;

                                if (!acc[uniqueKey]) {
                                    acc[uniqueKey] = {
                                        ...msg,
                                        groupType: 'message',
                                        count: 0,
                                        latestMsg: msg,
                                        allMsgs: [],
                                        sender: partnerName,
                                        sender_id: partnerId,
                                        unreadCount: 0
                                    };
                                }
                                acc[uniqueKey].count++;
                                acc[uniqueKey].allMsgs.push(msg);

                                const isToAdmin = ADMIN_ALIASES_LIST.includes(msg.to) || ADMIN_ALIASES_LIST.includes(msg.receiver_name) || msg.receiver_id === 'admin-uuid-placeholder';
                                if (!msg.is_read && isToAdmin) acc[uniqueKey].unreadCount++;

                                if (new Date(msg.created_at) > new Date(acc[uniqueKey].latestMsg.created_at)) {
                                    acc[uniqueKey].latestMsg = msg;
                                }
                                return acc;
                            }, {})).map((g: any) => ({
                                ...g,
                                ...g.latestMsg,
                                count: g.count,
                                unreadCount: g.unreadCount,
                                sortDate: new Date(g.latestMsg.created_at)
                            })) : []) : [])
                        ] as any[])
                            .sort((a, b) => b.sortDate.getTime() - a.sortDate.getTime())
                            .map((item) => (
                                <div
                                    key={`${item.groupType}-${item.id}`}
                                    onClick={async () => {
                                        if (item.groupType === 'inquiry') {
                                            setSelectedInquiry({
                                                ...item,
                                                sender: item.contact,
                                                date: new Date(item.created_at).toLocaleString()
                                            });
                                            const threadId = item.parent_id || item.id;
                                            const { data } = await supabase
                                                .from('inquiries')
                                                .select('*')
                                                .or(`id.eq.${threadId},parent_id.eq.${threadId}`)
                                                .order('created_at', { ascending: true });
                                            setInquiryThread(data || []);
                                        } else {
                                            const partnerKey = item.sender || item.from;
                                            const partnerId = item.sender_id || item.targetUserId;

                                            const threadMessages = messages
                                                .filter(m => {
                                                    const isFromAdmin = ADMIN_ALIASES_LIST.includes(m.from) || ADMIN_ALIASES_LIST.includes(m.sender_name) || m.sender_id === 'admin-uuid-placeholder';
                                                    const mPartnerName = isFromAdmin ? m.to : (m.from || m.sender_name);
                                                    const mPartnerId = isFromAdmin ? m.receiver_id : m.sender_id;

                                                    if (partnerId && mPartnerId && String(mPartnerId) === String(partnerId)) return true;
                                                    if (mPartnerName === partnerKey) return true;
                                                    return false;
                                                })
                                                .sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

                                            const finalThread = threadMessages.length > 0 ? threadMessages : [item.latestMsg || item];

                                            const unreadMsgIds = threadMessages
                                                .filter(m => {
                                                    const isToAdmin = ADMIN_ALIASES_LIST.includes(m.to) || ADMIN_ALIASES_LIST.includes(m.receiver_name) || m.receiver_id === 'admin-uuid-placeholder';
                                                    return !m.is_read && isToAdmin;
                                                })
                                                .map(m => m.id);

                                            if (unreadMsgIds.length > 0) {
                                                NoteService.markMessagesAsRead(unreadMsgIds).catch(console.error);
                                                // Optimistic update for unread count not strictly necessary if we refetch, 
                                                // but for immediate UI feedback we might want to trigger a refresh
                                                fetchData();
                                            }

                                            setSelectedInquiry({
                                                ...item,
                                                type: 'message',
                                                sender: partnerKey,
                                                contact: partnerKey,
                                                shop_name: item.shop_name || '정보 없음',
                                                date: item.created_at,
                                                targetUserId: partnerId,
                                                content: item.latestMsg?.content || item.content
                                            });
                                            setInquiryThread(finalThread.map(m => ({
                                                ...m,
                                                writer_name: ADMIN_ALIASES_LIST.includes(m.from) ? '운영팀' : m.from,
                                                created_at: m.created_at
                                            })));
                                        }
                                    }}
                                    className={`p-4 rounded-[24px] border transition-all cursor-pointer relative group hover:shadow-lg ${selectedInquiry?.sender === item.sender || selectedInquiry?.id === item.id ? 'bg-slate-50 border-slate-200 ring-1 ring-slate-200' : 'bg-white border-slate-100 hover:border-slate-200'}`}
                                >
                                    {/* 1. Header Row */}
                                    <div className="flex items-start gap-2 mb-3 pr-24 relative">
                                        <span className={`px-2 py-1 rounded-md text-[9px] font-black shrink-0 ${item.groupType === 'inquiry' ? 'bg-slate-900 text-white' : 'bg-indigo-500 text-white'}`}>
                                            {item.groupType === 'inquiry' ? item.type : '쪽지'}
                                        </span>
                                        <h4 className="text-xs font-bold text-slate-800 line-clamp-1 flex-1 pt-0.5">
                                            {item.groupType === 'inquiry' ? item.title : (item.latestMsg?.content || item.content || '(내용 없음)')}
                                        </h4>
                                    </div>

                                    {/* 2. Info Row */}
                                    {(() => {
                                        const userId = item.user_id || item.sender_id;
                                        const profile = getProfileByUserId(userId);
                                        const displayNick = profile?.nickname || profile?.full_name || item.writer_name || item.sender || '정보 없음';
                                        const displayId = profile?.username || (userId ? `${userId.substring(0, 8)}…` : '-');
                                        return (
                                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-slate-500 font-medium pl-1">
                                                <span className="font-bold text-slate-700">{displayNick}</span>
                                                <span className="w-px h-3 bg-slate-200" />
                                                {userId ? (
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleViewMember(userId); }}
                                                        className="text-blue-500 hover:text-blue-700 hover:underline font-bold flex items-center gap-1"
                                                    >
                                                        <User size={10} />
                                                        {displayId}
                                                    </button>
                                                ) : <span className="text-slate-400">-</span>}
                                                <span className="w-px h-3 bg-slate-200" />
                                                <span>{item.contact || '-'}</span>
                                            </div>
                                        );
                                    })()}

                                    {/* Absolute Right */}
                                    <div className="absolute top-4 right-4 text-right">
                                        <div className="text-[9px] font-bold text-slate-400 mb-1">
                                            {new Date(item.created_at).toLocaleDateString()} <span className="text-slate-300">|</span> {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                        <div className={`text-[9px] font-black uppercase tracking-wider inline-block px-2 py-0.5 rounded-full border ${item.status === 'completed' ? 'bg-green-50 text-green-600 border-green-100' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                                            {item.status === 'completed' ? '답변완료' : '답변전'}
                                        </div>
                                    </div>

                                    {/* Hover Action */}
                                    <div className="absolute bottom-3 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleMessageDelete(item.id);
                                            }}
                                            className="px-2.5 py-1 bg-rose-50 text-rose-500 rounded-lg text-[9px] font-bold hover:bg-rose-100 transition border border-rose-100"
                                        >
                                            삭제
                                        </button>
                                    </div>
                                </div>
                            ))}
                    </div>
                </div>

                {/* Viewer */}
                <div className="hidden lg:flex bg-slate-950 rounded-[40px] border border-slate-800 shadow-2xl overflow-hidden flex-col h-full relative">
                    {selectedInquiry ? (
                        <div className="flex-1 flex flex-col min-h-0 bg-slate-950 relative z-10">
                            {/* Header */}
                            <div className="p-8 pb-6 shrink-0 border-b border-white/5 bg-white/[0.02]">
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="px-3 py-1 rounded-lg bg-indigo-500/20 text-indigo-300 text-xs font-black border border-indigo-500/30">
                                                {selectedInquiry.type === 'message' ? '쪽지 문의' : selectedInquiry.type}
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="flex items-center gap-1.5 group relative">
                                                    {editingWriterName ? (
                                                        <div className="flex items-center gap-2">
                                                            <input
                                                                type="text"
                                                                value={tempWriterName}
                                                                onChange={(e) => setTempWriterName(e.target.value)}
                                                                className="px-2 py-1 bg-slate-800 border border-indigo-500 rounded text-xs text-white outline-none focus:ring-2 focus:ring-indigo-500/50"
                                                                autoFocus
                                                                onKeyDown={(e) => {
                                                                    if (e.key === 'Enter') handleWriterNameUpdate();
                                                                    if (e.key === 'Escape') setEditingWriterName(false);
                                                                }}
                                                            />
                                                            <button
                                                                onClick={handleWriterNameUpdate}
                                                                disabled={isUpdatingWriter}
                                                                className="text-indigo-400 hover:text-indigo-300 disabled:opacity-50"
                                                            >
                                                                <Save size={14} />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <>
                                                            <button
                                                                onClick={() => handleViewMember(selectedInquiry.user_id || selectedInquiry.targetUserId)}
                                                                className="text-xs font-black text-slate-400 uppercase tracking-widest hover:text-indigo-400 transition-colors underline-offset-2 hover:underline"
                                                            >
                                                                {(() => {
                                                                    const uid = selectedInquiry.user_id || selectedInquiry.targetUserId;
                                                                    const p = getProfileByUserId(uid);
                                                                    return p?.nickname || p?.full_name || selectedInquiry.writer_name || selectedInquiry.sender || 'Unknown';
                                                                })()}
                                                                {(() => {
                                                                    const uid = selectedInquiry.user_id || selectedInquiry.targetUserId;
                                                                    const p = getProfileByUserId(uid);
                                                                    return p?.username ? <span className="text-indigo-400/60 ml-1 normal-case tracking-normal">@{p.username}</span> : null;
                                                                })()}
                                                            </button>
                                                            <button
                                                                onClick={() => {
                                                                    setTempWriterName(selectedInquiry.writer_name || '');
                                                                    setEditingWriterName(true);
                                                                }}
                                                                className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-indigo-400 transition-all"
                                                            >
                                                                <PenBox size={10} />
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                                <span className="text-slate-800 font-bold">•</span>
                                                <span className="text-xs font-bold text-slate-500">
                                                    {new Date(selectedInquiry.created_at || selectedInquiry.date).toLocaleString()}
                                                </span>
                                            </div>
                                        </div>
                                        <h2 className="text-2xl font-black text-white tracking-tight leading-snug">
                                            {selectedInquiry.title || selectedInquiry.sender || '제목 없음'}
                                        </h2>
                                    </div>
                                    <div className={`px-4 py-2 rounded-xl text-xs font-black border uppercase tracking-wider shrink-0 ${selectedInquiry.status === 'completed' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'}`}>
                                        {selectedInquiry.type === 'message' ? '대화 중' : (selectedInquiry.status === 'completed' ? '답변완료' : '접수됨')}
                                    </div>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="flex-1 overflow-y-auto px-8 py-6 custom-scrollbar space-y-8 bg-slate-950">
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-slate-700" />
                                        <span className="text-xs font-black text-slate-500 uppercase tracking-widest">Inquiry Details</span>
                                    </div>
                                    <div className="text-base font-medium text-slate-300 leading-loose whitespace-pre-wrap pl-4 border-l-2 border-slate-800">
                                        {selectedInquiry.content || '(내용 없음)'}
                                    </div>
                                    {selectedInquiry.file_url && (() => {
                                        try {
                                            const files = JSON.parse(selectedInquiry.file_url);
                                            if (Array.isArray(files) && files.length > 0) {
                                                return (
                                                    <div className="mt-4 pt-4 border-t border-white/5 pl-4">
                                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Attachments</p>
                                                        <div className="flex flex-wrap gap-2">
                                                            {files.map((url: string, idx: number) => (
                                                                <a
                                                                    key={idx}
                                                                    href={url}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="flex items-center gap-2 px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-[11px] font-bold text-slate-400 hover:text-white hover:border-slate-700 transition"
                                                                >
                                                                    <Paperclip size={12} />
                                                                    <span>파일 {idx + 1}</span>
                                                                </a>
                                                            ))}
                                                        </div>
                                                    </div>
                                                );
                                            }
                                        } catch (e) { return null; }
                                    })()}
                                </div>

                                {inquiryThread.length > 0 && (
                                    <div className="space-y-4 pl-4 border-l-2 border-slate-800/50 ml-4 pb-4">
                                        {inquiryThread.filter(msg => msg.id !== selectedInquiry.id).map((msg, idx) => {
                                            const isCustomer = msg.writer_name !== '운영팀';
                                            return (
                                                <div key={msg.id || idx} className={`flex ${isCustomer ? 'justify-start' : 'justify-end'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                                                    <div className="max-w-[90%] space-y-1">
                                                        <div className={`flex items-center gap-2 ${isCustomer ? 'justify-start' : 'justify-end'}`}>
                                                            <span className="text-[9px] font-black text-slate-600 uppercase tracking-tighter">
                                                                {isCustomer ? 'RE: 고객' : 'RE: 운영팀'} • {new Date(msg.created_at).toLocaleString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false })}
                                                            </span>
                                                        </div>
                                                        <div className={`p-4 rounded-2xl text-sm font-medium leading-relaxed whitespace-pre-wrap border shadow-sm ${isCustomer
                                                            ? 'bg-slate-900 text-slate-300 border-slate-800'
                                                            : 'bg-indigo-900/30 text-indigo-100 border-indigo-500/20'
                                                            }`}>
                                                            {msg.content}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* Input */}
                            <div className="p-8 pt-4 shrink-0 mt-auto">
                                <div className="bg-slate-900 p-2 rounded-[32px] border border-slate-800 shadow-xl">
                                    <textarea
                                        value={inquiryReply}
                                        onChange={(e) => setInquiryReply(e.target.value)}
                                        placeholder="답변 내용을 입력해 주세요..."
                                        className="w-full bg-transparent p-6 h-16 text-white resize-none focus:outline-none placeholder:text-slate-600 custom-scrollbar text-sm font-medium"
                                    />
                                    <div className="flex justify-end gap-3 px-4 pb-4">
                                        <button
                                            onClick={() => handleMessageDelete(selectedInquiry.id)}
                                            className="px-6 py-3 bg-slate-950 text-slate-500 rounded-2xl text-xs font-black hover:bg-rose-950 hover:text-rose-500 transition border border-slate-800"
                                        >
                                            삭제
                                        </button>
                                        <button
                                            onClick={async () => {
                                                if (!inquiryReply.trim()) return alert('내용을 입력해주세요.');
                                                try {
                                                    if (selectedInquiry.type === 'message') {
                                                        const targetUser = selectedInquiry.sender || selectedInquiry.from;
                                                        const targetUserId = selectedInquiry.targetUserId || selectedInquiry.sender_id;
                                                        if (!targetUser) return alert('수신자 정보가 없습니다.');

                                                        const result = await NoteService.sendNote(inquiryReply, '관리자', targetUser, undefined, targetUserId);
                                                        const newMsg = {
                                                            id: result?.id || 'temp_' + Date.now(),
                                                            content: inquiryReply,
                                                            writer_name: '운영팀',
                                                            created_at: new Date().toISOString(),
                                                            from: '관리자',
                                                            to: targetUser
                                                        };
                                                        setInquiryThread(prev => [...prev, newMsg]);
                                                        setInquiryReply('');
                                                        fetchData(); // Sync with global
                                                    } else {
                                                        handleInquiryStatusUpdate(selectedInquiry.id, 'completed', inquiryReply);
                                                        setInquiryReply('');
                                                    }
                                                } catch (e: any) {
                                                    console.error(e);
                                                    alert('전송 실패: ' + e.message);
                                                }
                                            }}
                                            className="px-8 py-3 bg-indigo-600 text-white rounded-2xl text-sm font-black hover:bg-indigo-500 transition shadow-lg shadow-indigo-900/50 flex items-center gap-2"
                                        >
                                            {selectedInquiry.type === 'message' ? <Send size={16} /> : <Save size={16} />}
                                            {selectedInquiry.type === 'message' ? '전송' : '답변 저장'}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-slate-600">
                            <div className="w-24 h-24 bg-slate-900 rounded-[40px] flex items-center justify-center mb-6 text-slate-800 border border-slate-800 shadow-inner">
                                <MessageSquare size={40} />
                            </div>
                            <h4 className="text-xl font-black text-slate-400 mb-2 mt-4 tracking-tighter italic opacity-50">Select a Message</h4>
                            <p className="text-sm font-bold opacity-30 text-slate-500">목록에서 문의를 선택하여 상세 내용을 확인하세요.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>

        {/* Member Info Popup */}
        {memberProfile && (
            <div className="fixed inset-0 z-[10030] flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-md" onClick={() => setMemberProfile(null)} />
                <div className="bg-white w-full max-w-md rounded-[32px] shadow-2xl relative z-10 overflow-hidden animate-in zoom-in-95 duration-300">
                    <div className="p-6 border-b border-slate-50 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-xl">👤</div>
                            <div>
                                <span className="bg-slate-900 text-white text-[8px] px-2 py-0.5 rounded-md font-black uppercase inline-block mb-1">CRM Profile</span>
                                <h3 className="text-lg font-black text-slate-950">{memberProfile.full_name || '이름없음'}</h3>
                            </div>
                        </div>
                        <button onClick={() => setMemberProfile(null)} className="p-2 text-slate-300 hover:text-slate-700 transition">
                            <X size={22} />
                        </button>
                    </div>
                    <div className="p-6 grid grid-cols-2 gap-3">
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                            <p className="text-[10px] font-black text-slate-400 uppercase mb-1 tracking-widest">닉네임</p>
                            <p className="text-sm font-bold text-slate-900 break-all">{memberProfile.nickname || memberProfile.full_name || '-'}</p>
                        </div>
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                            <p className="text-[10px] font-black text-slate-400 uppercase mb-1 tracking-widest">Login ID</p>
                            <p className="text-sm font-bold text-slate-900 break-all">{memberProfile.username || '-'}</p>
                        </div>
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                            <p className="text-[10px] font-black text-slate-400 uppercase mb-1 tracking-widest">Phone</p>
                            <p className="text-sm font-bold text-slate-900">{memberProfile.phone || '-'}</p>
                        </div>
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                            <p className="text-[10px] font-black text-slate-400 uppercase mb-1 tracking-widest">Member Type</p>
                            <p className="text-sm font-bold text-slate-900">
                                {memberProfile.role === 'admin' ? '관리자' : (memberProfile.role === 'corporate' ? '기업회원 (사장님)' : '개인회원 (구직자)')}
                            </p>
                        </div>
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                            <p className="text-[10px] font-black text-slate-400 uppercase mb-1 tracking-widest">Join Date</p>
                            <p className="text-sm font-bold text-slate-900">{new Date(memberProfile.created_at).toLocaleDateString()}</p>
                        </div>
                        <div className="col-span-2 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                            <p className="text-[10px] font-black text-slate-400 uppercase mb-1 tracking-widest">Email</p>
                            <p className="text-sm font-bold text-slate-900 break-all">{memberProfile.contact_email || memberProfile.email || '-'}</p>
                        </div>
                        <div className="col-span-2 p-4 bg-blue-50 rounded-2xl border border-blue-100">
                            <p className="text-[10px] font-black text-blue-400 uppercase mb-1 tracking-widest">UUID</p>
                            <p className="text-[11px] font-mono text-blue-700 break-all">{memberProfile.id}</p>
                        </div>
                    </div>
                </div>
            </div>
        )}
        {/* Broadcast Message Modal */}
        {showBroadcast && (
            <div className="fixed inset-0 z-[10030] flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-slate-950/50 backdrop-blur-md" onClick={() => setShowBroadcast(false)} />
                <div className="bg-white w-full max-w-md rounded-[32px] shadow-2xl relative z-10 overflow-hidden animate-in zoom-in-95 duration-300">
                    <div className="p-6 border-b border-slate-50 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center">
                                <Megaphone size={20} className="text-indigo-600" />
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-slate-900">전체 회원 쪽지 발송</h3>
                                <p className="text-[10px] text-slate-400 font-bold">관리자 역할 제외 전체 회원에게 발송됩니다.</p>
                            </div>
                        </div>
                        <button onClick={() => setShowBroadcast(false)} className="p-2 text-slate-300 hover:text-slate-700 transition"><X size={22} /></button>
                    </div>
                    <div className="p-6 space-y-4">
                        <textarea
                            value={broadcastMsg}
                            onChange={e => setBroadcastMsg(e.target.value)}
                            placeholder="전체 회원에게 전달할 메시지를 입력하세요..."
                            rows={5}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium focus:outline-none focus:border-indigo-400 resize-none"
                        />
                        <div className="flex gap-3">
                            <button onClick={() => setShowBroadcast(false)} className="flex-1 py-3 rounded-2xl bg-slate-100 text-slate-500 text-sm font-black hover:bg-slate-200 transition">취소</button>
                            <button
                                onClick={handleBroadcast}
                                disabled={isBroadcasting || !broadcastMsg.trim()}
                                className="flex-1 py-3 rounded-2xl bg-indigo-600 text-white text-sm font-black hover:bg-indigo-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {isBroadcasting ? <><Loader2 size={16} className="animate-spin" /> 발송중...</> : <><Send size={16} /> 전체 발송</>}
                            </button>
                        </div>
                        <p className="text-[10px] text-slate-400 font-bold text-center">⚠️ 발송 후 취소 불가. 수신자가 많을 경우 시간이 걸릴 수 있습니다.</p>
                    </div>
                </div>
            </div>
        )}
        </>
    );
}
