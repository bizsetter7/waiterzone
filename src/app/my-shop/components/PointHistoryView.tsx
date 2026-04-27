'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Coins, AlertCircle, ShoppingBag, Zap, CreditCard, MessageSquare, UserPlus, FileText, CalendarCheck } from 'lucide-react';
import { useBrand } from '@/components/BrandProvider';

export function PointHistoryView({ userId }: { userId: string }) {
    const brand = useBrand();
    const isDark = brand.theme === 'dark';
    const [logs, setLogs] = useState<any[]>([]);
    const [filter, setFilter] = useState('all'); // all, today, week, month, 3months
    const [loading, setLoading] = useState(true);

    const fetchLogs = async () => {
        if (!userId) {
            setLoading(false);
            return;
        }
        setLoading(true);
        
        let query = supabase
            .from('point_logs')
            .select('*')
            .eq('user_id', userId);
        
        // Date Filtering Logic
        if (filter !== 'all') {
            const now = new Date();
            let startDate = new Date();
            
            if (filter === 'today') {
                startDate.setHours(0, 0, 0, 0);
            } else if (filter === 'week') {
                startDate.setDate(now.getDate() - 7);
            } else if (filter === 'month') {
                startDate.setMonth(now.getMonth() - 1);
            } else if (filter === '3months') {
                startDate.setMonth(now.getMonth() - 3);
            }
            
            query = query.gte('created_at', startDate.toISOString());
        }
        
        const { data, error } = await query.order('created_at', { ascending: false });
        
        if (!error && data) {
            setLogs(data);
        }
        setLoading(true); // Artificial delay or just state management
        setTimeout(() => setLoading(false), 300);
    };

    useEffect(() => {
        fetchLogs();
    }, [userId, filter]);

    const getIcon = (reason: string) => {
        switch (reason) {
            case 'JOIN': return <UserPlus size={16} className="text-blue-500" />;
            case 'RESUME_UPLOAD': return <FileText size={16} className="text-purple-500" />;
            case 'COMMUNITY_POST': return <MessageSquare size={16} className="text-green-500" />;
            case 'COMMUNITY_COMMENT': return <MessageSquare size={16} className="text-emerald-500" />;
            case 'ATTENDANCE_CHECK': return <CalendarCheck size={16} className="text-rose-500" />;
            case 'SHOP_JUMP': return <Zap size={16} className="text-amber-500" />;
            case 'COUPON_EXCHANGE': return <ShoppingBag size={16} className="text-rose-500" />;
            default: return <CreditCard size={16} className="text-gray-400" />;
        }
    };

    const getReasonLabel = (log: any) => {
        if (log.note && !log.note.startsWith('[COCO]')) return log.note;
        
        switch (log.reason) {
            case 'JOIN': return '회원가입 축하 포인트';
            case 'RESUME_UPLOAD': return '이력서 등록 혜택';
            case 'COMMUNITY_POST': return '커뮤니티 글 작성';
            case 'COMMUNITY_COMMENT': return '커뮤니티 댓글 작성';
            case 'ATTENDANCE_CHECK': return '일일 출석체크';
            case 'SHOP_JUMP': return '공고 최상단 점프';
            case 'COUPON_EXCHANGE': return '상품권 교환 신청';
            case 'SOS_SEND_SMALL':
            case 'SOS_SEND_MEDIUM':
            case 'SOS_SEND_LARGE':
            case 'SOS_SEND_XLARGE': return 'SOS 긴급구인 발송';
            case 'ADMIN_GRANT': return (log.amount || 0) > 0 ? '관리자 지급' : '관리자 차감';
            default: return log.reason || '포인트 변동';
        }
    };

    // Helper for Grouping by Month
    const groupLogsByMonth = (logs: any[]) => {
        const groups: { [key: string]: any[] } = {};
        logs.forEach(log => {
            const date = new Date(log.created_at);
            const monthKey = `${date.getFullYear()}년 ${String(date.getMonth() + 1).padStart(2, '0')}월`;
            if (!groups[monthKey]) groups[monthKey] = [];
            groups[monthKey].push(log);
        });
        return groups;
    };

    const groupedLogs = groupLogsByMonth(logs);

    return (
        <div className={`p-6 md:p-10 rounded-[32px] border shadow-sm ${isDark ? 'bg-gray-950 border-gray-800 text-white' : 'bg-white border-blue-50 text-gray-900'}`}>
            {/* Header and Filter */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center shrink-0">
                        <Coins size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl md:text-2xl font-black">포인트 및 점프 내역</h2>
                        <p className={`text-sm font-bold mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>적립 및 사용된 포인트의 히스토리입니다.</p>
                    </div>
                </div>
                
                {/* Filter Tabs */}
                <div className="flex items-center gap-1 bg-gray-50 dark:bg-gray-900 p-1 rounded-xl overflow-x-auto no-scrollbar">
                    {[
                        { id: 'all', label: '전체' },
                        { id: 'today', label: '오늘' },
                        { id: 'week', label: '1주' },
                        { id: 'month', label: '1개월' },
                        { id: '3months', label: '3개월' },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setFilter(tab.id)}
                            className={`px-3 py-1.5 rounded-lg text-[11px] font-black transition-all whitespace-nowrap ${
                                filter === tab.id
                                    ? 'bg-white dark:bg-gray-800 text-blue-600 shadow-sm'
                                    : 'text-gray-400 hover:text-gray-600'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* List Section */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                    <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin" />
                    <p className="text-gray-400 font-bold">내역을 불러오는 중...</p>
                </div>
            ) : Object.keys(groupedLogs).length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-3xl">
                    <AlertCircle size={40} className="text-gray-200 mb-3" />
                    <p className="text-gray-400 font-bold">해당 기간의 내역이 없습니다.</p>
                </div>
            ) : (
                <div className="space-y-8">
                    {Object.keys(groupedLogs).map((month) => (
                        <div key={month} className="space-y-4">
                            {/* Monthly Divider */}
                            <div className="flex items-center gap-3">
                                <div className="h-px flex-1 bg-gray-100 dark:bg-gray-800"></div>
                                <span className="text-[11px] font-black text-gray-400 bg-gray-50 dark:bg-gray-950 px-3 py-1 rounded-full border border-gray-100 dark:border-gray-800 uppercase tracking-tighter">
                                    {month}
                                </span>
                                <div className="h-px flex-1 bg-gray-100 dark:bg-gray-800"></div>
                            </div>
                            
                            {/* Monthly List */}
                            <div className="space-y-3">
                                {groupedLogs[month].map((log) => (
                                    <div key={log.id} className={`flex items-center justify-between p-4 md:p-5 rounded-2xl border transition-all hover:shadow-md ${isDark ? 'bg-gray-900 border-gray-800 hover:border-gray-700' : 'bg-gray-50/50 border-gray-100 hover:border-blue-100'}`}>
                                        <div className="flex items-center gap-4">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isDark ? 'bg-gray-800' : 'bg-white shadow-sm'}`}>
                                                {getIcon(log.reason)}
                                            </div>
                                            <div className="space-y-0.5 min-w-0">
                                                <h3 className="font-black text-[14px] md:text-[15px] truncate">{getReasonLabel(log)}</h3>
                                                <p className="text-[10px] font-bold text-gray-400 leading-tight">
                                                    {(() => {
                                                        const d = new Date(log.created_at);
                                                        const dateStr = d.toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit', timeZone: 'Asia/Seoul' });
                                                        const timeStr = d.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Seoul' });
                                                        return (
                                                            <>
                                                                {dateStr} <br /> {timeStr}
                                                            </>
                                                        );
                                                    })()}
                                                </p>
                                            </div>
                                        </div>
                                        <div className={`text-base md:text-lg font-black shrink-0 ml-2 ${log.amount > 0 ? 'text-blue-600' : 'text-rose-500'}`}>
                                            {log.amount > 0 ? '+' : ''}{log.amount.toLocaleString()} <span className="text-[10px] md:text-xs">P</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
