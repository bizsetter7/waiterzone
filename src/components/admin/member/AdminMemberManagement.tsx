import React, { useState } from 'react';
import { Search, Unlock, Lock, XCircle, TrendingUp, Zap, Coins, Send } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
import { AdminAdRegistrationModal } from '../ad/AdminAdRegistrationModal';

interface AdminMemberManagementProps {
    users: any[];
    mockUsers: any[]; // Fallback or mixed usage
    fetchData: () => void;
}

export function AdminMemberManagement({ users, mockUsers, fetchData }: AdminMemberManagementProps) {
    const [filter, setFilter] = useState<'all' | 'corporate' | 'individual'>('all');
    const [search, setSearch] = useState('');
    const [selectedUser, setSelectedUser] = useState<any | null>(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [isAdModalOpen, setIsAdModalOpen] = useState(false);
    const [adTargetUser, setAdTargetUser] = useState<any | null>(null);
    const [pointAmount, setPointAmount] = useState('');
    const [pointNote, setPointNote] = useState('');
    const [isGrantingPoint, setIsGrantingPoint] = useState(false);

    // 모달 오픈 시 배경 스크롤 차단 (회원상세 또는 광고등록)
    useBodyScrollLock(isDetailModalOpen || isAdModalOpen);

    const handleUserToggleStatus = async (userId: string, currentStatus: string) => {
        const newStatus = currentStatus === 'blocked' ? 'active' : 'blocked';
        const confirmMsg = newStatus === 'blocked' ? '이 회원을 차단하시겠습니까?' : '이 회원의 차단을 해제하시겠습니까?';

        if (!confirm(confirmMsg)) return;

        try {
            const { error } = await supabase
                .from('profiles')
                .update({ status: newStatus, updated_at: new Date().toISOString() })
                .eq('id', userId);

            if (error) throw error;

            alert(`회원 상태가 ${newStatus === 'blocked' ? '차단' : '활성'}으로 변경되었습니다.`);
            fetchData(); // Refresh
            if (selectedUser?.id === userId) {
                setSelectedUser((prev: any) => ({ ...prev, status: newStatus }));
            }
        } catch (err: any) {
            console.error('User status update error:', err);
            alert('상태 업데이트 실패: ' + (err.message || '알 수 없는 오류'));
        }
    };
 
    const handleUserToggleType = async (userId: string, currentType: string) => {
        const newType = currentType === 'corporate' ? 'individual' : 'corporate';
        const confirmMsg = `회원 유형을 ${newType === 'corporate' ? '기업' : '개인'}회원으로 변경하시겠습니까?`;

        if (!confirm(confirmMsg)) return;

        try {
            const { error } = await supabase
                .from('profiles')
                .update({ user_type: newType, updated_at: new Date().toISOString() })
                .eq('id', userId);

            if (error) throw error;

            alert(`회원 유형이 ${newType === 'corporate' ? '기업' : '개인'}회원으로 변경되었습니다.`);
            fetchData(); // Refresh list
            if (selectedUser?.id === userId) {
                setSelectedUser((prev: any) => ({ ...prev, user_type: newType, type: newType }));
            }
        } catch (err: any) {
            console.error('User type update error:', err);
            alert('유형 업데이트 실패: ' + (err.message || '알 수 없는 오류'));
        }
    };

    const handleGrantPoint = async () => {
        if (!selectedUser?.id) return;
        const amount = parseInt(pointAmount);
        if (isNaN(amount) || amount === 0) { alert('올바른 포인트 금액을 입력하세요.'); return; }
        if (!confirm(`${selectedUser.name || selectedUser.full_name || '회원'}님께 ${amount}P를 ${amount > 0 ? '지급' : '차감'}하시겠습니까?`)) return;
        setIsGrantingPoint(true);
        try {
            const res = await fetch('/api/admin/grant-points', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    userId: selectedUser.id, 
                    amount,
                    reason: pointNote || 'ADMIN_GRANT' // 사유가 없으면 기본값 사용
                }),
            });
            const result = await res.json();
            if (result.success) {
                alert(`${amount}P ${amount > 0 ? '지급' : '차감'} 완료! 현재 잔액: ${result.newTotal}P`);
                setPointAmount('');
                setPointNote('');
                fetchData();
            } else {
                alert('포인트 처리 실패: ' + (result.message || '오류 발생'));
            }
        } catch (err: any) {
            alert('포인트 처리 실패: ' + (err.message || '네트워크 오류'));
        } finally {
            setIsGrantingPoint(false);
        }
    };

    // mockUsers 폴백 완전 제거 — DB 로딩 중 유령 데이터 노출 방지
    // users가 비어있을 때는 빈 배열 유지 (로딩 스피너 또는 "데이터 없음" 표시)
    const effectiveUsers = users || [];
    const filteredUsers = effectiveUsers
        .filter(u => {
            if (filter === 'all') return true;
            const role = u.role || '';
            const userType = u.user_type || '';
            if (filter === 'corporate') return role === 'corporate' || userType === 'corporate';
            // 개인회원: 신규(individual) + 구형(employee) 둘 다 포함, admin 제외
            if (filter === 'individual') return (role === 'individual' || role === 'employee') && role !== 'admin';
            return false;
        })
        .filter(u => !search ||
            (u.name || u.full_name || '').toLowerCase().includes(search.toLowerCase()) ||
            (u.business_name || '').toLowerCase().includes(search.toLowerCase()) ||
            (u.username || u.loginId || u.email || '').toLowerCase().includes(search.toLowerCase()) ||
            (u.phone || '').includes(search) ||
            (u.business_number || '').includes(search)
        );

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
            <div className="flex justify-between items-end mb-2">
                <div>
                    <h3 className="text-2xl font-black text-slate-950 tracking-tighter">통합 회원 관리 (CRM)</h3>
                    <p className="text-sm text-slate-400 font-bold mt-1">
                        악성 유저 차단 및 회원 등급을 관리합니다.
                    </p>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => setFilter('all')} className={`px-3 py-1 rounded-full text-[10px] font-black border transition-all ${filter === 'all' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-400 border-slate-200'}`}>전체</button>
                    <button onClick={() => setFilter('corporate')} className={`px-3 py-1 rounded-full text-[10px] font-black border transition-all ${filter === 'corporate' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-400 border-slate-200'}`}>기업회원</button>
                    <button onClick={() => setFilter('individual')} className={`px-3 py-1 rounded-full text-[10px] font-black border transition-all ${filter === 'individual' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-400 border-slate-200'}`}>개인회원</button>
                </div>
            </div>

            <div className="bg-white rounded-[40px] border border-slate-100 shadow-xl shadow-slate-200/20 overflow-hidden">
                <div className="p-6 border-b border-slate-50 flex gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="상호명, 실명, 아이디, 전화번호, 사업자번호 검색..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-slate-50 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                        />
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[800px]">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100">
                                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">회원정보</th>
                                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">연락처/유입</th>
                                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">상태/등급</th>
                                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">가입일</th>
                                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">제어</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredUsers.length > 0 ? (
                                filteredUsers.map((user) => (
                                    <tr key={user.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                                        <td className="px-8 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${user.status === 'blocked' ? 'bg-slate-100 text-slate-400' : 'bg-blue-50 text-blue-600'}`}>
                                                    {user.status === 'blocked' ? '🚫' : '👤'}
                                                </div>
                                                <div>
                                                    <div className="text-sm font-black text-slate-900">
                                                        {user.business_name || user.name || user.full_name || '이름없음'}
                                                        {user.business_name && (user.name || user.full_name) && (
                                                            <span className="ml-1 text-[10px] font-bold text-slate-400">({user.name || user.full_name})</span>
                                                        )}
                                                    </div>
                                                    <div className="text-[10px] font-bold text-slate-400">@{user.username || user.loginId || user.email?.split('@')[0] || '-'} · {user.nickname || '닉네임없음'}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-4">
                                            <div className="text-xs font-bold text-slate-600">{user.phone || '-'}</div>
                                            <div className="text-[10px] text-slate-400">{user.email}</div>
                                            <div className="text-[9px] text-blue-400 mt-1">유입: {user.referrer || '직접'}</div>
                                        </td>
                                        <td className="px-8 py-4">
                                            <span className={`px-2 py-0.5 rounded-md text-[9px] font-black ${user.status === 'blocked' ? 'bg-slate-100 text-slate-400' : 'bg-green-100 text-green-600'}`}>
                                                {user.status === 'blocked' ? '차단됨' : '활동중'}
                                            </span>
                                            <span className="ml-2 text-[10px] font-bold text-slate-500">
                                                {user.role === 'admin' ? '관리자' : (user.role === 'corporate' || user.type === 'corporate' ? '기업회원' : '개인회원')}
                                            </span>
                                            {/* [Admin Feature] Show Ad Count if possible (simplified badge) */}
                                            <span className="ml-2 px-1.5 py-0.5 bg-indigo-50 text-indigo-500 rounded text-[9px] font-black">Ad: {user.ad_count || 0}</span>
                                        </td>
                                        <td className="px-8 py-4">
                                            <div className="text-[11px] font-bold text-slate-500">{new Date(user.joinDate || user.created_at).toLocaleDateString()}</div>
                                            <div className="text-[9px] text-slate-300">{new Date(user.joinDate || user.created_at).toLocaleTimeString()}</div>
                                        </td>
                                        <td className="px-8 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => {
                                                        setSelectedUser(user);
                                                        setIsDetailModalOpen(true);
                                                    }}
                                                    className="text-[10px] font-black text-blue-600 hover:underline"
                                                >
                                                    상세정보
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        // 사업자 정보 자동반영 — AdminAdRegistrationModal User 인터페이스에 맞게 전달
                                                        setAdTargetUser({
                                                            id: user.id,
                                                            name: user.full_name || user.name,
                                                            full_name: user.full_name,
                                                            phone: user.phone || user.manager_phone,
                                                            nickname: user.nickname,
                                                            business_name: user.business_name,
                                                            business_number: user.business_number,
                                                            manager_kakao: user.manager_kakao,
                                                            manager_telegram: user.manager_telegram,
                                                        });
                                                        setIsAdModalOpen(true);
                                                    }}
                                                    className="flex items-center gap-1 px-2.5 py-1.5 bg-blue-600 text-white rounded-lg text-[10px] font-black hover:bg-blue-700 transition active:scale-95 shadow-sm shadow-blue-100"
                                                >
                                                    <Zap size={12} fill="currentColor" /> 광고등록
                                                </button>
                                                <button
                                                    onClick={() => handleUserToggleType(user.id, user.user_type || user.type || 'individual')}
                                                    className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-all"
                                                    title="회원 유형 전환 (기업/개인)"
                                                >
                                                    <TrendingUp size={14} />
                                                </button>
                                                <button
                                                    onClick={() => handleUserToggleStatus(user.id, user.status)}
                                                    className={`p-1.5 rounded-lg transition-all ${user.status === 'blocked' ? 'bg-green-50 text-green-600 hover:bg-green-100' : 'bg-rose-50 text-rose-600 hover:bg-rose-100'}`}
                                                    title={user.status === 'blocked' ? '차단 해제' : '회원 차단'}
                                                >
                                                    {user.status === 'blocked' ? <Unlock size={14} /> : <Lock size={14} />}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="px-8 py-20 text-center text-slate-400 text-xs font-bold">
                                        검색 결과가 없습니다.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* User Detail Modal */}
            {selectedUser && isDetailModalOpen && (
                <div className="fixed inset-0 z-[10020] flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-slate-950/40 backdrop-blur-md animate-in fade-in duration-300"
                        onClick={() => setIsDetailModalOpen(false)}
                    />
                    <div className="bg-white w-full max-w-lg rounded-[32px] md:rounded-[40px] shadow-2xl relative z-10 overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
                        <div className="p-6 md:p-8 border-b border-slate-50 flex justify-between items-center shrink-0">
                            <div className="flex items-center gap-3 md:gap-4">
                                <div className={`w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center text-xl md:text-2xl ${selectedUser.status === 'blocked' ? 'bg-slate-100 text-slate-400' : 'bg-blue-50 text-blue-600'}`}>
                                    {selectedUser.status === 'blocked' ? '🚫' : '👤'}
                                </div>
                                <div className="min-w-0">
                                    <span className="bg-slate-900 text-white text-[8px] md:text-[9px] px-2 py-0.5 rounded-md font-black uppercase mb-0.5 md:mb-1 inline-block">CRM Profile Detail</span>
                                    <h3 className="text-lg md:text-xl font-black text-slate-950 tracking-tighter truncate">{selectedUser.name || selectedUser.full_name || '이름없음'}</h3>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => {
                                        setAdTargetUser({
                                            id: selectedUser.id,
                                            name: selectedUser.full_name || selectedUser.name,
                                            full_name: selectedUser.full_name,
                                            phone: selectedUser.phone || selectedUser.manager_phone,
                                            nickname: selectedUser.nickname,
                                            business_name: selectedUser.business_name,
                                            business_number: selectedUser.business_number,
                                            manager_kakao: selectedUser.manager_kakao,
                                            manager_telegram: selectedUser.manager_telegram,
                                        });
                                        setIsAdModalOpen(true);
                                    }}
                                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-black hover:bg-blue-700 transition active:scale-95 shadow-lg shadow-blue-100"
                                >
                                    <Zap size={14} fill="currentColor" /> 광고 등록하기
                                </button>
                                <button onClick={() => setIsDetailModalOpen(false)} className="p-2 text-slate-300 hover:text-slate-950 transition-colors">
                                    <XCircle size={24} />
                                </button>
                            </div>
                        </div>
                        <div className="p-8 space-y-6 overflow-y-auto custom-scrollbar">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                    <p className="text-[10px] font-black text-slate-400 uppercase mb-1 tracking-widest">Login ID / Email</p>
                                    <p className="text-sm font-bold text-slate-900 text-wrap break-all">{selectedUser.username || selectedUser.loginId || selectedUser.email || '-'}</p>
                                </div>
                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                    <p className="text-[10px] font-black text-slate-400 uppercase mb-1 tracking-widest">Phone Number</p>
                                    <p className="text-sm font-bold text-slate-900">{selectedUser.phone || '전화번호 없음'}</p>
                                </div>
                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                    <p className="text-[10px] font-black text-slate-400 uppercase mb-1 tracking-widest">Member Type</p>
                                    <p className="text-sm font-bold text-slate-900">
                                        {selectedUser.role === 'admin' ? '관리자 (최고 권한)' : (selectedUser.role === 'corporate' || selectedUser.type === 'corporate' ? '기업회원 (사장님)' : '개인회원 (구직자)')}
                                    </p>
                                </div>
                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                    <p className="text-[10px] font-black text-slate-400 uppercase mb-1 tracking-widest">Join Date</p>
                                    <p className="text-sm font-bold text-slate-900">{new Date(selectedUser.created_at || selectedUser.joinDate).toLocaleDateString()}</p>
                                </div>
                                <div className="col-span-2 p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100">
                                    <p className="text-[10px] font-black text-indigo-400 uppercase mb-1 tracking-widest">Points Balance</p>
                                    <p className="text-sm font-bold text-indigo-900">{Number(selectedUser.points || 0).toLocaleString()} <span className="text-xs text-indigo-500">P</span></p>
                                </div>
                            </div>

                            <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                                <h4 className="text-xs font-black text-slate-900 mb-4 flex items-center gap-2">
                                    <TrendingUp size={14} className="text-blue-500" /> 활동 및 유입 경로 정보
                                </h4>
                                <div className="flex items-center justify-between text-xs font-bold text-slate-500 py-2 border-b border-slate-200/50">
                                    <span>유입 경로</span>
                                    <span className="text-slate-900">{selectedUser.referrer || '직접 유입'}</span>
                                </div>
                                {/* 활동 로그 예시 */}
                                <div className="mt-4 space-y-2">
                                    {selectedUser.statusHistory?.map((log: string, idx: number) => (
                                        <div key={idx} className="text-[10px] text-slate-400 font-medium">
                                            • {log}
                                        </div>
                                    ))}
                                    {!selectedUser.statusHistory && (
                                        <div className="text-[10px] text-slate-400 font-medium">
                                            • 최근 활동 기록이 없습니다.
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* 포인트 수동 지급 */}
                            <div className="p-5 bg-amber-50 rounded-2xl border border-amber-100">
                                <h4 className="text-xs font-black text-amber-700 mb-3 flex items-center gap-2">
                                    <Send size={14} /> 포인트 수동 지급 / 차감
                                </h4>
                                <div className="space-y-2">
                                    <div className="flex gap-2">
                                        <input
                                            type="number"
                                            placeholder="금액 (음수=차감)"
                                            value={pointAmount}
                                            onChange={e => setPointAmount(e.target.value)}
                                            className="w-32 px-3 py-2 text-xs font-bold rounded-xl border border-amber-200 bg-white focus:outline-none focus:border-amber-400"
                                        />
                                        <input
                                            type="text"
                                            placeholder="지급/차감 사유 (예: 이벤트 당첨)"
                                            value={pointNote}
                                            onChange={e => setPointNote(e.target.value)}
                                            className="flex-1 px-3 py-2 text-xs font-bold rounded-xl border border-amber-200 bg-white focus:outline-none focus:border-amber-400"
                                        />
                                    </div>
                                    <button
                                        onClick={handleGrantPoint}
                                        disabled={isGrantingPoint}
                                        className="w-full py-2.5 bg-amber-500 text-white text-xs font-black rounded-xl hover:bg-amber-600 transition flex items-center justify-center gap-1.5 disabled:opacity-50 shadow-md shadow-amber-200"
                                    >
                                        <Send size={12} /> {isGrantingPoint ? '처리 중...' : '지급 실행'}
                                    </button>
                                </div>
                                <p className="text-[9px] text-amber-600 font-bold mt-2">* 양수는 지급, 음수는 차감으로 처리됩니다.</p>
                            </div>

                            <div className="pt-4 border-t border-slate-50 space-y-3">
                                <button
                                    onClick={() => handleUserToggleType(selectedUser.id, selectedUser.user_type || selectedUser.type || 'individual')}
                                    className="w-full py-3.5 rounded-2xl text-sm font-black bg-indigo-500 text-white shadow-lg shadow-indigo-100 hover:bg-indigo-600 transition-all active:scale-95 flex items-center justify-center gap-2"
                                >
                                    <TrendingUp size={18} />
                                    회원 유형 전환 ({ (selectedUser.user_type || selectedUser.type) === 'corporate' ? '기업 → 개인' : '개인 → 기업' })
                                </button>
                                <button
                                    onClick={() => handleUserToggleStatus(selectedUser.id, selectedUser.status)}
                                    className={`w-full py-3.5 rounded-2xl text-sm font-black shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 ${selectedUser.status === 'blocked' ? 'bg-green-500 text-white shadow-green-200 hover:bg-green-600' : 'bg-rose-500 text-white shadow-rose-200 hover:bg-rose-600'}`}
                                >
                                    {selectedUser.status === 'blocked' ? <><Unlock size={18} /> 차단 해제 및 계정 복구</> : <><Lock size={18} /> 회원 영구 차단 및 접속 제한</>}
                                </button>
                                <p className="text-[10px] text-center text-slate-400 font-bold mt-2">
                                    * 차단 시 해당 회원은 즉시 로그아웃되며 접속이 제한됩니다.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Admin Ad Registration Modal */}
            {isAdModalOpen && adTargetUser && (
                <AdminAdRegistrationModal
                    user={adTargetUser}
                    onClose={() => {
                        setIsAdModalOpen(false);
                        setAdTargetUser(null);
                    }}
                    fetchData={fetchData}
                />
            )}
        </div>
    );
}
