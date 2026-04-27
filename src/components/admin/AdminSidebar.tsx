'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    LayoutDashboard,
    Users,
    MessageSquare,
    Settings,
    ShieldCheck,
    Zap,
    Megaphone,
    Twitter,
    Database,
    CreditCard,
    XCircle,
    LogOut,
    Building2,
    ClipboardList,
    Lock,
    Eye,
    EyeOff,
    CheckCircle,
    Image as ImageIcon,
} from 'lucide-react';
// ── 비밀번호 변경 모달 ─────────────────────────────────────────
function AdminChangePasswordModal({ onClose }: { onClose: () => void }) {
    const [email, setEmail] = useState('');
    const [currentPw, setCurrentPw] = useState('');
    const [newPw, setNewPw] = useState('');
    const [confirmPw, setConfirmPw] = useState('');
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isDone, setIsDone] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!email) { setError('이메일을 입력해주세요.'); return; }
        if (!currentPw) { setError('현재 비밀번호를 입력해주세요.'); return; }
        if (newPw.length < 6) { setError('새 비밀번호는 6자 이상이어야 합니다.'); return; }
        if (newPw !== confirmPw) { setError('새 비밀번호가 일치하지 않습니다.'); return; }

        setIsLoading(true);
        try {
            const res = await fetch('/api/admin/change-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, currentPassword: currentPw, newPassword: newPw }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || '변경 실패');
            setIsDone(true);
            setTimeout(onClose, 2000);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[20000] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
                <div className="flex items-center gap-3 mb-5">
                    <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center">
                        <Lock size={16} className="text-white" />
                    </div>
                    <h2 className="text-white font-black text-lg">어드민 비밀번호 변경</h2>
                    <button onClick={onClose} className="ml-auto text-slate-500 hover:text-white transition">
                        <XCircle size={20} />
                    </button>
                </div>

                {isDone ? (
                    <div className="text-center py-6">
                        <CheckCircle size={40} className="text-emerald-400 mx-auto mb-3" />
                        <p className="text-emerald-400 font-black">비밀번호가 변경되었습니다!</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                        <div>
                            <label className="block text-xs font-black text-slate-400 mb-1.5 uppercase tracking-wider">어드민 이메일</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="admin@example.com"
                                className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500/30"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-black text-slate-400 mb-1.5 uppercase tracking-wider">현재 비밀번호</label>
                            <div className="relative">
                                <input
                                    type={showCurrent ? 'text' : 'password'}
                                    value={currentPw}
                                    onChange={(e) => setCurrentPw(e.target.value)}
                                    placeholder="현재 비밀번호 입력"
                                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-3 text-sm font-bold pr-10 outline-none focus:ring-2 focus:ring-blue-500/30"
                                    required
                                />
                                <button type="button" onClick={() => setShowCurrent(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">
                                    {showCurrent ? <EyeOff size={15} /> : <Eye size={15} />}
                                </button>
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-black text-slate-400 mb-1.5 uppercase tracking-wider">새 비밀번호</label>
                            <div className="relative">
                                <input
                                    type={showNew ? 'text' : 'password'}
                                    value={newPw}
                                    onChange={(e) => setNewPw(e.target.value)}
                                    placeholder="6자 이상"
                                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-3 text-sm font-bold pr-10 outline-none focus:ring-2 focus:ring-blue-500/30"
                                    required
                                />
                                <button type="button" onClick={() => setShowNew(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">
                                    {showNew ? <EyeOff size={15} /> : <Eye size={15} />}
                                </button>
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-black text-slate-400 mb-1.5 uppercase tracking-wider">새 비밀번호 확인</label>
                            <div className="relative">
                                <input
                                    type={showConfirm ? 'text' : 'password'}
                                    value={confirmPw}
                                    onChange={(e) => setConfirmPw(e.target.value)}
                                    placeholder="동일하게 입력"
                                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-3 text-sm font-bold pr-10 outline-none focus:ring-2 focus:ring-blue-500/30"
                                    required
                                />
                                <button type="button" onClick={() => setShowConfirm(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">
                                    {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                                </button>
                            </div>
                        </div>
                        {confirmPw && newPw !== confirmPw && (
                            <p className="text-xs font-bold text-red-400">비밀번호가 일치하지 않습니다.</p>
                        )}
                        {error && <p className="text-xs font-bold text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">{error}</p>}
                        <div className="flex gap-3 mt-1">
                            <button type="button" onClick={onClose} className="flex-1 py-3 bg-slate-800 text-slate-400 rounded-xl font-black text-sm hover:bg-slate-700 transition">취소</button>
                            <button type="submit" disabled={isLoading} className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-black text-sm hover:bg-blue-500 transition disabled:opacity-50">
                                {isLoading ? '변경 중...' : '변경하기'}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}

export type AdminTab = 'stats' | 'ads' | 'users' | 'inquiry' | 'messages' | 'seo' | 'payments' | 'health' | 'marketing' | 'business' | 'applications' | 'banner' | 'sns' | 'yasajang';

interface AdminSidebarProps {
    activeTab: AdminTab | string;
    counts?: {
        ads?: number;
        inquiries?: number;
        payments?: number;
        business?: number;
        applications?: number;
        health?: number;
        banner?: number;
        yasajang?: number;
    };
    onNavigate: (tab: AdminTab) => void;
    className?: string;
}

interface AdminMobileSidebarProps extends AdminSidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

const NavItem = ({ icon, label, active, badge, onClick }: { icon: React.ReactNode, label: string, active?: boolean, badge?: number, onClick?: () => void }) => {
    return (
        <button
            onClick={onClick}
            className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-2xl font-black text-sm transition-all ${active ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/20' : 'text-slate-500 hover:bg-slate-900 hover:text-white'
                }`}
        >
            <div className="flex items-center gap-3">
                <div className={`shrink-0 ${active ? 'text-white' : 'text-slate-600 opacity-60'}`}>
                    {icon}
                </div>
                <span>{label}</span>
            </div>
            {badge !== undefined && badge > 0 && (
                <span className={`px-1.5 py-0.5 rounded-lg text-[9px] font-black ${active ? 'bg-white text-blue-600' : 'bg-blue-500 text-white'}`}>
                    {badge}
                </span>
            )}
        </button>
    );
};

export const AdminSidebar = ({ activeTab, counts, onNavigate, className = '' }: AdminSidebarProps) => {
    const router = useRouter();
    const [showPwModal, setShowPwModal] = useState(false);

    const handleNav = (tab: AdminTab) => {
        if (tab === 'marketing') {
            router.push('/admin/marketing');
        } else if (tab === 'sns') {
            router.push('/admin/sns');
        } else {
            onNavigate(tab);
        }
    };

    return (
        <>
        <aside className={`hidden md:flex w-64 bg-slate-950 text-white flex-col border-r border-slate-900 z-[10001] sticky top-0 min-h-screen shrink-0 ${className}`}>
            <div className="p-6 border-b border-slate-900">
                <h1 className="text-xl font-black text-blue-400 tracking-tighter">COCO ADMIN</h1>
                <p className="text-[10px] text-slate-500 mt-1 uppercase font-bold tracking-widest">Master Control Hub</p>
            </div>
            <nav className="flex-1 p-4 space-y-2 overflow-y-auto custom-scrollbar">
                <NavItem
                    icon={<LayoutDashboard size={20} />}
                    label="대시보드"
                    active={activeTab === 'stats'}
                    onClick={() => handleNav('stats')}
                />
                <NavItem
                    icon={<Zap size={20} />}
                    label="광고 심사 관리"
                    active={activeTab === 'ads'}
                    badge={counts?.ads}
                    onClick={() => handleNav('ads')}
                />
                <NavItem
                    icon={<CreditCard size={20} />}
                    label="결제 내역 관리"
                    active={activeTab === 'payments'}
                    badge={counts?.payments}
                    onClick={() => handleNav('payments')}
                />
                <NavItem
                    icon={<MessageSquare size={20} />}
                    label="통합 문의 관리"
                    active={activeTab === 'inquiry'}
                    badge={counts?.inquiries}
                    onClick={() => handleNav('inquiry')}
                />
                <NavItem
                    icon={<Users size={20} />}
                    label="회원 관리"
                    active={activeTab === 'users'}
                    onClick={() => handleNav('users')}
                />
                <NavItem
                    icon={<Building2 size={20} className="text-amber-400" />}
                    label="사업자 인증 심사"
                    active={activeTab === 'business'}
                    badge={counts?.business}
                    onClick={() => handleNav('business')}
                />
                <NavItem
                    icon={<ClipboardList size={20} className="text-emerald-400" />}
                    label="지원자 관리"
                    active={activeTab === 'applications'}
                    badge={counts?.applications}
                    onClick={() => handleNav('applications')}
                />
                <NavItem
                    icon={<ImageIcon size={20} className="text-purple-400" />}
                    label="배너 슬롯 관리"
                    active={activeTab === 'banner'}
                    badge={counts?.banner}
                    onClick={() => handleNav('banner')}
                />
                <NavItem
                    icon={<Building2 size={20} className="text-pink-500" />}
                    label="야사장 입점"
                    active={activeTab === 'yasajang'}
                    badge={counts?.yasajang}
                    onClick={() => handleNav('yasajang')}
                />
                <NavItem
                    icon={<Megaphone size={20} />}
                    label="마케팅 자동화"
                    active={activeTab === 'marketing'}
                    onClick={() => router.push('/admin/marketing')}
                />
                <NavItem
                    icon={<Twitter size={20} className="text-sky-400" />}
                    label="SNS 자동화"
                    active={activeTab === 'sns'}
                    onClick={() => router.push('/admin/sns')}
                />
                <NavItem
                    icon={<ShieldCheck size={20} className="text-emerald-500" />}
                    label="시스템 검증 센터"
                    active={activeTab === 'health'}
                    badge={counts?.health}
                    onClick={() => router.push('/admin/system-verification')}
                />
                <NavItem
                    icon={<Settings size={20} />}
                    label="헬스 모니터"
                    active={activeTab === 'seo'}
                    onClick={() => handleNav('seo')}
                />
                <div className="pt-6 mt-6 border-t border-slate-900 space-y-2">
                    <button
                        onClick={() => setShowPwModal(true)}
                        className="w-full flex items-center gap-3 px-4 py-3 text-slate-400 font-black text-sm hover:bg-slate-900 hover:text-blue-400 rounded-2xl transition-all"
                    >
                        <Lock size={18} /> 비밀번호 변경
                    </button>
                    <button onClick={() => router.push('/')} className="w-full flex items-center gap-3 px-4 py-3 text-slate-500 font-bold text-sm hover:bg-slate-900 rounded-xl transition-all">
                        <LogOut size={18} /> 홈페이지로 이동
                    </button>
                </div>
            </nav>
        </aside>
        {showPwModal && <AdminChangePasswordModal onClose={() => setShowPwModal(false)} />}
        </>
    );
};

export const AdminMobileSidebar = ({ activeTab, counts, onNavigate, isOpen, onClose }: AdminMobileSidebarProps) => {
    const router = useRouter();
    const [showPwModal, setShowPwModal] = useState(false);

    if (!isOpen) return null;

    const handleNav = (tab: AdminTab) => {
        if (tab === 'marketing') {
            router.push('/admin/marketing');
        } else if (tab === 'sns') {
            router.push('/admin/sns');
        } else {
            onNavigate(tab);
        }
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[10005] md:hidden">
            <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={onClose} />
            <aside className="absolute right-0 top-0 bottom-0 w-[280px] bg-slate-950 border-l border-slate-900 p-6 pt-16 flex flex-col animate-in slide-in-from-right duration-300">
                <div className="flex justify-between items-center mb-10">
                    <div>
                        <h1 className="text-xl font-black text-blue-400 tracking-tighter">COCO ADMIN</h1>
                        <p className="text-[10px] text-slate-500 mt-1 uppercase font-bold tracking-widest">Navigation Menu</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-900 rounded-full transition-colors">
                        <XCircle className="text-slate-400" />
                    </button>
                </div>
                <nav className="flex-1 space-y-3 overflow-y-auto custom-scrollbar">
                    <NavItem
                        icon={<LayoutDashboard size={20} />}
                        label="대시보드"
                        active={activeTab === 'stats'}
                        onClick={() => handleNav('stats')}
                    />
                    <NavItem
                        icon={<Zap size={20} />}
                        label="광고 심사 관리"
                        active={activeTab === 'ads'}
                        badge={counts?.ads}
                        onClick={() => handleNav('ads')}
                    />
                    <NavItem
                        icon={<CreditCard size={20} />}
                        label="결제 관리"
                        active={activeTab === 'payments'}
                        badge={counts?.payments}
                        onClick={() => handleNav('payments')}
                    />
                    <NavItem
                        icon={<MessageSquare size={20} />}
                        label="통합 문의 관리"
                        active={activeTab === 'inquiry'}
                        badge={counts?.inquiries}
                        onClick={() => handleNav('inquiry')}
                    />
                    <NavItem
                        icon={<Users size={20} />}
                        label="회원 관리"
                        active={activeTab === 'users'}
                        onClick={() => handleNav('users')}
                    />
                    <NavItem
                        icon={<Building2 size={20} className="text-amber-400" />}
                        label="사업자 인증 심사"
                        active={activeTab === 'business'}
                        badge={counts?.business}
                        onClick={() => handleNav('business')}
                    />
                    <NavItem
                        icon={<ImageIcon size={20} className="text-purple-400" />}
                        label="배너 슬롯 관리"
                        active={activeTab === 'banner'}
                        badge={counts?.banner}
                        onClick={() => handleNav('banner')}
                    />
                    <NavItem
                        icon={<Building2 size={20} className="text-pink-500" />}
                        label="야사장 입점"
                        active={activeTab === 'yasajang'}
                        badge={counts?.yasajang}
                        onClick={() => handleNav('yasajang')}
                    />
                    <NavItem
                        icon={<Megaphone size={20} />}
                        label="마케팅 자동화"
                        active={activeTab === 'marketing'}
                        onClick={() => router.push('/admin/marketing')}
                    />
                    <NavItem
                        icon={<Twitter size={20} className="text-sky-400" />}
                        label="SNS 자동화"
                        active={activeTab === 'sns'}
                        onClick={() => { router.push('/admin/sns'); onClose(); }}
                    />
                    <NavItem
                        icon={<ShieldCheck size={20} className="text-emerald-500" />}
                        label="시스템 검증 센터"
                        active={activeTab === 'health'}
                        badge={counts?.health}
                        onClick={() => { router.push('/admin/system-verification'); onClose(); }}
                    />
                    <NavItem
                        icon={<Settings size={20} />}
                        label="헬스 모니터"
                        active={activeTab === 'seo'}
                        onClick={() => handleNav('seo')}
                    />
                    <div className="pt-6 border-t border-slate-900 space-y-2 mt-6">
                        <button
                            onClick={() => { setShowPwModal(true); }}
                            className="w-full flex items-center gap-3 px-4 py-3 text-slate-400 font-black text-sm hover:bg-slate-900 hover:text-blue-400 rounded-2xl transition-all"
                        >
                            <Lock size={18} /> 비밀번호 변경
                        </button>
                        <button onClick={() => { router.push('/'); onClose(); }} className="w-full flex items-center gap-3 px-4 py-3 text-slate-400 font-bold text-sm hover:bg-slate-900 rounded-xl transition-all">
                            <LogOut size={18} /> 홈페이지로 이동
                        </button>
                    </div>
                </nav>
            </aside>
            {showPwModal && <AdminChangePasswordModal onClose={() => setShowPwModal(false)} />}
        </div>
    );
};
