import React from 'react';
import {
    Users,
    Eye,
    Megaphone,
    TrendingUp,
} from 'lucide-react';
import AdminCharts from '@/app/admin/components/AdminCharts';
import { AdminTab } from '@/components/admin/AdminSidebar';

interface AdminStatsOverviewProps {
    stats: {
        totalRevenue: number;
        activeAds: number;
        newUserToday: number;
        totalUsers: number;
    };
    userStats: any[];
    adStats: any[];
    setActiveTab: (tab: AdminTab) => void;
}

export function AdminStatsOverview({ stats, userStats, adStats, setActiveTab }: AdminStatsOverviewProps) {
    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
            {/* Intelligent Stats Cluster */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                <StatCard
                    title="누적 예상 매출"
                    value={`${stats.totalRevenue.toLocaleString()} 원`}
                    trend="+12.5%"
                    icon={<TrendingUp size={24} />}
                    color="blue"
                    onClick={() => alert('누적 성과 리포트 페이지로 이동합니다. (v2.6 예정)')}
                />
                <StatCard
                    title="활성 광고 슬롯"
                    value={stats.activeAds.toLocaleString()}
                    trend={`+${stats.activeAds}`}
                    icon={<Megaphone size={24} />}
                    color="pink"
                    onClick={() => setActiveTab('ads')}
                />
                <StatCard
                    title="전체 회원 수"
                    value={`${stats.totalUsers.toLocaleString()} 명`}
                    trend={`오늘 +${stats.newUserToday}`}
                    icon={<Users size={24} />}
                    color="slate"
                    onClick={() => setActiveTab('users')}
                />
                <StatCard
                    title="전체 트래픽(UV)"
                    value="84.2 K"
                    trend="+5.4%"
                    icon={<Eye size={24} />}
                    color="indigo"
                    onClick={() => alert('실시간 트래픽 히트맵 로드 중.. (v2.7 예정)')}
                />
            </div>

            {/* [New] Intelligent Analytics Charts */}
            <AdminCharts userStats={userStats} adStats={adStats} />
        </div>
    );
}

function StatCard({ title, value, trend, icon, color, onClick }: { title: string, value: string, trend: string, icon: React.ReactNode, color: 'blue' | 'pink' | 'slate' | 'indigo', onClick?: () => void }) {
    const colorStyles = {
        blue: 'from-blue-600/10 to-blue-600/5 text-blue-600 border-blue-100/50 shadow-blue-500/5',
        pink: 'from-blue-600/10 to-blue-600/5 text-blue-600 border-blue-100/50 shadow-blue-500/5',
        slate: 'from-slate-600/10 to-slate-600/5 text-slate-600 border-slate-200/50 shadow-slate-500/5',
        indigo: 'from-indigo-600/10 to-indigo-600/5 text-indigo-600 border-indigo-100/50 shadow-indigo-500/5'
    };

    const iconBg = {
        blue: 'bg-blue-600 text-white shadow-blue-500/30',
        pink: 'bg-blue-600 text-white shadow-blue-500/30',
        slate: 'bg-slate-800 text-white shadow-slate-500/30',
        indigo: 'bg-indigo-600 text-white shadow-indigo-500/30'
    };

    return (
        <div
            onClick={onClick}
            className={`
                relative p-7 rounded-[32px] border bg-gradient-to-br transition-all cursor-pointer group overflow-hidden
                hover:shadow-[0_20px_40px_-12px_rgba(0,0,0,0.1)] hover:-translate-y-2 active:scale-95
                ${colorStyles[color]} backdrop-blur-sm
            `}
        >
            {/* Background Accent */}
            <div className="absolute -right-4 -bottom-4 w-24 h-24 opacity-5 group-hover:opacity-10 transition-opacity">
                {React.cloneElement(icon as React.ReactElement<any>, { size: 96 })}
            </div>

            <div className="relative z-10 space-y-4">
                <div className="flex justify-between items-center">
                    <div className={`p-3.5 rounded-2xl ${iconBg[color]} transition-transform group-hover:scale-110 group-hover:rotate-6`}>
                        {React.cloneElement(icon as React.ReactElement<any>, { size: 22 })}
                    </div>
                    <div className={`
                        flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black
                        ${trend.includes('+') ? 'bg-emerald-100/50 text-emerald-600' : 'bg-rose-100/50 text-rose-600'}
                    `}>
                        {trend.includes('+') ? '▲' : '▼'} {trend.replace('+', '').replace('-', '')}
                    </div>
                </div>

                <div>
                    <h3 className="text-slate-500 text-[11px] font-black uppercase tracking-widest mb-1 opacity-70 group-hover:opacity-100 transition-opacity">
                        {title}
                    </h3>
                    <div className="flex items-baseline gap-1">
                        <p className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight transition-all group-hover:text-black">
                            {value.split(' ')[0]}
                        </p>
                        <span className="text-xs font-bold text-slate-400">{value.split(' ')[1] || ''}</span>
                    </div>
                </div>
            </div>

            {/* Subtle Bottom Glow on Hover */}
            <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-current to-transparent opacity-0 group-hover:opacity-30 transition-opacity ${color === 'blue' ? 'text-blue-500' : color === 'pink' ? 'text-blue-500' : color === 'indigo' ? 'text-indigo-500' : 'text-slate-500'}`}></div>
        </div>
    );
}
