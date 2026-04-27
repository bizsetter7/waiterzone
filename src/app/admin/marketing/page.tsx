'use client';

import React, { useState, cloneElement } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getMarketingTargets, updateMarketingTarget, sendCampaignMessage, uploadMarketingTargets, deleteMarketingTarget, deleteMarketingTargets, getUploadHistory, removeMarketingTargetLink, deleteUploadBatch, updateUploadBatchName, MarketingTarget } from '@/services/marketingService';
import { Send, Users, Filter, Plus, MessageSquare, RefreshCw, Upload, FileDown, Trash2, ArrowUpDown, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ExternalLink, X, Edit2, CheckSquare, AlertCircle, Megaphone, Zap, WifiOff, Wifi } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { REGION_DATA, INDUSTRY_DATA } from '@/constants/marketing-data';

// --- Local Components ---
const MarketingStatCard = ({ label, value, unit, icon, color }: { label: string, value: string | number, unit: string, icon: React.ReactNode, color: 'blue' | 'emerald' | 'indigo' | 'rose' }) => {
    const colorMap = {
        blue: 'from-blue-600/10 to-blue-600/5 text-blue-600 border-blue-100/50',
        emerald: 'from-emerald-600/10 to-emerald-600/5 text-emerald-600 border-emerald-100/50',
        indigo: 'from-indigo-600/10 to-indigo-600/5 text-indigo-600 border-indigo-100/50',
        rose: 'from-rose-600/10 to-rose-600/5 text-rose-600 border-rose-100/50'
    };

    const iconBg = {
        blue: 'bg-blue-600',
        emerald: 'bg-emerald-600',
        indigo: 'bg-indigo-600',
        rose: 'bg-rose-600'
    };

    return (
        <div className={`p-6 rounded-[32px] border bg-gradient-to-br ${colorMap[color]} backdrop-blur-sm shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group overflow-hidden relative`}>
            <div className="absolute -right-4 -bottom-4 w-20 h-20 opacity-5 group-hover:opacity-10 transition-opacity">
                {cloneElement(icon as React.ReactElement<any>, { size: 80 })}
            </div>
            <div className="relative z-10 flex items-center gap-4">
                <div className={`p-3 rounded-2xl ${iconBg[color]} text-white shadow-lg shadow-current/20 transition-transform group-hover:scale-110`}>
                    {cloneElement(icon as React.ReactElement<any>, { size: 20 })}
                </div>
                <div>
                    <p className="text-[11px] font-black uppercase tracking-widest opacity-60 mb-0.5">{label}</p>
                    <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-black text-slate-900">{value.toLocaleString()}</span>
                        <span className="text-xs font-bold text-slate-400">{unit}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default function MarketingPage() {
    const queryClient = useQueryClient();
    const [page, setPage] = useState(1);
    const [filters, setFilters] = useState({
        region_city: '',
        region_gu: '',
        industry: '',
        industry_detail: '',
        status: '',
        search: '',
        is_adult: '',
        batch_id: '' // 회차별 필터 추가
    });
    const [isUploading, setIsUploading] = useState(false);
    const [uploadResult, setUploadResult] = useState<{ total: number, count: number, duplicates: number } | null>(null);
    const [sortConfig, setSortConfig] = useState<{ key: string, asc: boolean }>({ key: 'created_at', asc: false });
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    // --- Queries ---
    const { data, isLoading, refetch } = useQuery({
        queryKey: ['marketing-targets', page, filters, sortConfig],
        queryFn: () => getMarketingTargets({
            page,
            limit: 20,
            ...filters,
            orderBy: sortConfig.key,
            orderAsc: sortConfig.asc
        }),
    });

    const { data: uploadHistory } = useQuery({
        queryKey: ['marketing-upload-history'],
        queryFn: () => getUploadHistory(),
    });

    // 카카오 연결 상태 확인
    const { data: kakaoStatus } = useQuery({
        queryKey: ['kakao-status'],
        queryFn: async () => {
            const res = await fetch('/api/marketing/kakao');
            return res.json() as Promise<{ connected: boolean; isMock: boolean; message: string }>;
        },
        staleTime: 1000 * 60 * 5, // 5분 캐시
    });

    // 발송 시 전체 타겟 fetch (현재 필터 기준 전체, 페이지 무관)
    const fetchAllTargets = async () => {
        return getMarketingTargets({
            ...filters,
            page: 1,
            limit: 10000,
            orderBy: sortConfig.key,
            orderAsc: sortConfig.asc,
        });
    };

    // --- Mutations ---
    const sendMutation = useMutation({
        mutationFn: async (campaign: { title: string; message_content: string; channel: "sms" | "lms" | "kakao" | "telegram" }) => {
            const allData = await fetchAllTargets();
            if (!allData?.data || allData.data.length === 0) throw new Error('발송 대상이 없습니다.');
            return sendCampaignMessage(campaign, allData.data);
        },
        onSuccess: () => {
            toast.success('캠페인 발송이 완료되었습니다!');
            setShowSendModal(false);
            queryClient.invalidateQueries({ queryKey: ['marketing-campaigns'] });
        },
        onError: (err: Error) => {
            toast.error(`발송 실패: ${err.message}`);
        }
    });

    // --- UI State ---
    const [showSendModal, setShowSendModal] = useState(false);
    const [campaignForm, setCampaignForm] = useState({
        title: '',
        message: '',
        channel: 'sms'
    });

    // --- Handlers ---
    const handleFilterChange = (key: string, value: string) => {
        setFilters(prev => {
            const next = { ...prev, [key]: value };
            // Reset dependent filters
            if (key === 'region_city') next.region_gu = '';
            if (key === 'industry') next.industry_detail = '';
            return next;
        });
        setPage(1); // Reset to page 1 on filter
    };

    const handleDownloadTemplate = async () => {
        const XLSX = await import('xlsx');
        const ws = XLSX.utils.json_to_sheet([
            {
                '이름': '홍길동',
                '전화번호': '010-1234-5678',
                '전화번호2': '010-5678-1234',
                '업체명': '강남스타일',
                '업종': '룸웨이터',
                '상세업종': '퍼블릭',
                '시도': '서울',
                '군구': '강남구',
                '유입경로': '네이버'
            }
        ]);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "업로드양식");
        XLSX.writeFile(wb, "마케팅_타겟_업로드_양식.xlsx");
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!confirm(`'${file.name}' 파일을 업로드 하시겠습니까?`)) {
            e.target.value = ''; // Reset input
            return;
        }

        setIsUploading(true);
        try {
            const result = await uploadMarketingTargets(file);
            setUploadResult({
                total: result.total,
                count: result.count,
                duplicates: result.duplicates
            });
            toast.success('업로드 완료!');
            refetch(); // Refresh list
            queryClient.invalidateQueries({ queryKey: ['marketing-upload-history'] });
        } catch (error) {
            console.error('Upload failed:', error);
            toast.error(`업로드 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleSort = (key: string) => {
        setSortConfig(prev => ({
            key,
            asc: prev.key === key ? !prev.asc : false
        }));
    };

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`'${name}' 대상을 삭제하시겠습니까?`)) return;

        try {
            await deleteMarketingTarget(id);
            toast.success('삭제되었습니다.');
            setSelectedIds(prev => prev.filter(curr => curr !== id));
            refetch();
        } catch (error) {
            toast.error(`삭제 실패: ${error instanceof Error ? error.message : '삭제 실패'}`);
        }
    };

    const handleRemoveLink = async (id: string, url: string) => {
        if (!confirm('이 수집 경로 링크를 삭제하시겠습니까?')) return;

        try {
            await removeMarketingTargetLink(id, url);
            toast.success('링크가 삭제되었습니다.');

            // Local cache update to prevent jumpy UI/refetch
            queryClient.setQueryData(['marketing-targets', page, filters, sortConfig], (old: { data: MarketingTarget[]; count: number } | undefined) => {
                if (!old) return old;
                return {
                    ...old,
                    data: old.data.map((t: MarketingTarget) =>
                        t.id === id
                            ? { ...t, source_urls: (t.source_urls || []).filter(u => u !== url) }
                            : t
                    )
                };
            });
        } catch (error) {
            toast.error(`링크 삭제 실패: ${error instanceof Error ? error.message : '오류 발생'}`);
        }
    };

    const handleQuickEdit = async (id: string, field: string, label: string, currentVal: string) => {
        const newVal = prompt(`${label}을(를) 수정하시겠습니까?`, currentVal);
        if (newVal === null || newVal === currentVal) return;

        try {
            await updateMarketingTarget(id, { [field]: newVal });
            toast.success('수정되었습니다.');

            // Local cache update to prevent jumpy UI/refetch
            queryClient.setQueryData(['marketing-targets', page, filters, sortConfig], (old: { data: MarketingTarget[]; count: number } | undefined) => {
                if (!old) return old;
                return {
                    ...old,
                    data: old.data.map((t: MarketingTarget) =>
                        t.id === id ? { ...t, [field]: newVal } : t
                    )
                };
            });
        } catch (error) {
            toast.error(`수정 실패: ${error instanceof Error ? error.message : '오류 발생'}`);
        }
    };

    const handleDeleteBatch = async () => {
        const batchId = filters.batch_id;
        if (!batchId) return;

        const batch = uploadHistory?.find((h: { id: string; filename: string }) => h.id === batchId);
        const fileName = batch?.filename || '해당 회차';

        if (!confirm(`'${fileName}' 업로드 회차와 연결된 모든 데이터를 삭제하시겠습니까?`)) return;

        try {
            await deleteUploadBatch(batchId);
            toast.success('해당 회차 데이터가 모두 삭제되었습니다.');
            handleFilterChange('batch_id', '');
            queryClient.invalidateQueries({ queryKey: ['marketing-upload-history'] });
            refetch();
        } catch (error) {
            toast.error(`삭제 실패: ${error instanceof Error ? error.message : '오류 발생'}`);
        }
    };

    const handleRenameBatch = async () => {
        const batchId = filters.batch_id;
        if (!batchId) return;

        const batch = uploadHistory?.find((h: { id: string; filename: string }) => h.id === batchId);
        const currentName = batch?.filename || '';
        const newName = prompt('회차 이름을 변경하시겠습니까?', currentName);

        if (!newName || newName === currentName) return;

        try {
            await updateUploadBatchName(batchId, newName);
            toast.success('이름이 변경되었습니다.');
            queryClient.invalidateQueries({ queryKey: ['marketing-upload-history'] });
        } catch (error) {
            toast.error(`이름 변경 실패: ${error instanceof Error ? error.message : '오류 발생'}`);
        }
    };

    const handleBulkDelete = async () => {
        if (selectedIds.length === 0) return;
        if (!confirm(`선택한 ${selectedIds.length}개의 대상을 삭제하시겠습니까?`)) return;

        try {
            await deleteMarketingTargets(selectedIds);
            toast.success('삭제되었습니다.');
            setSelectedIds([]);
            refetch();
        } catch (error) {
            toast.error(`삭제 실패: ${error instanceof Error ? error.message : '오류 발생'}`);
        }
    };

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            const allIds = data?.data.map(t => t.id) || [];
            setSelectedIds(allIds);
        } else {
            setSelectedIds([]);
        }
    };

    const handleSelectToggle = (id: string) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(curr => curr !== id) : [...prev, id]
        );
    };

    const handleSendSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const mockLabel = (campaignForm.channel === 'kakao' && kakaoStatus?.isMock) ? ' [Mock 모드]' : '';
        if (!confirm(`필터 조건에 해당하는 전체 ${data?.count || 0}명에게 ${campaignForm.channel.toUpperCase()} 메시지를 발송합니다.${mockLabel}\n\n계속하시겠습니까?`)) return;

        sendMutation.mutate({
            title: campaignForm.title,
            message_content: campaignForm.message,
            channel: campaignForm.channel as "sms" | "lms" | "kakao" | "telegram"
        });
    };

    return (
        <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-6 border-b border-slate-200/60">
                <div className="space-y-1">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-rose-500 rounded-2xl shadow-lg shadow-rose-500/20">
                            <Megaphone className="text-white" size={24} />
                        </div>
                        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                            마케팅 자동화 센터
                        </h1>
                    </div>
                    <p className="text-slate-500 text-sm font-bold mt-1 ml-11">
                        초정밀 타겟팅 기반 실시간 캠페인 관리 시스템
                    </p>
                </div>
                <div className="flex items-center gap-3 ml-11 md:ml-0">
                    {/* 카카오 연결 상태 배지 */}
                    <div className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-black border ${kakaoStatus?.connected ? 'bg-yellow-50 border-yellow-200 text-yellow-700' : 'bg-slate-100 border-slate-200 text-slate-400'}`}
                        title={kakaoStatus?.message}>
                        {kakaoStatus?.connected
                            ? <><Wifi size={13} /> 카카오 연결됨</>
                            : <><WifiOff size={13} /> 카카오 미연결</>
                        }
                    </div>

                    <button
                        onClick={() => refetch()}
                        className="p-2.5 text-slate-400 hover:text-blue-600 rounded-xl hover:bg-blue-50 transition-all border border-transparent hover:border-blue-100"
                        title="데이터 동기화"
                    >
                        <RefreshCw size={20} className={isLoading ? 'animate-spin text-blue-500' : ''} />
                    </button>

                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        accept=".xlsx, .xls, .csv"
                        className="hidden"
                    />

                    <div className="flex items-center bg-white rounded-2xl p-1 shadow-sm border border-slate-200">
                        <button
                            onClick={handleDownloadTemplate}
                            className="p-2 text-slate-400 hover:text-emerald-600 rounded-xl hover:bg-emerald-50 transition-all"
                            title="표준 양식 다운로드"
                        >
                            <FileDown size={20} />
                        </button>
                        <div className="w-[1px] h-6 bg-slate-100 mx-1"></div>
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isUploading}
                            className="flex items-center gap-2 px-5 py-2.5 text-slate-700 rounded-xl font-black text-sm hover:bg-slate-50 transition-all disabled:opacity-50"
                        >
                            {isUploading ? <RefreshCw size={16} className="animate-spin" /> : <Upload size={18} className="text-blue-500" />}
                            데이터 벌크 업로드
                        </button>
                    </div>

                    <button
                        onClick={() => setShowSendModal(true)}
                        className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl font-black text-sm hover:bg-black transition-all shadow-xl shadow-slate-900/10 hover:shadow-slate-900/20 active:scale-95"
                    >
                        <Send size={18} className="text-blue-400" />
                        캠페인 통합 발송
                    </button>
                </div>
            </div>

            {/* Smart Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <MarketingStatCard
                    label="잠재 고객 타겟"
                    value={data?.count || 0}
                    unit="명"
                    icon={<Users size={20} />}
                    color="blue"
                />
                <MarketingStatCard
                    label="실시간 전환율"
                    value={0}
                    unit="%"
                    icon={<Zap size={20} />}
                    color="emerald"
                />
                <MarketingStatCard
                    label="발송 성공"
                    value={0}
                    unit="건"
                    icon={<CheckSquare size={20} />}
                    color="indigo"
                />
                <MarketingStatCard
                    label="이슈 발생"
                    value={0}
                    unit="건"
                    icon={<AlertCircle size={20} />}
                    color="rose"
                />
            </div>

            {/* Filters */}
            <div className="bg-white/80 backdrop-blur-md p-5 rounded-[32px] border border-slate-200 shadow-sm flex flex-wrap gap-4 items-center relative z-20">
                <div className="flex items-center gap-2 text-slate-400 text-xs font-black uppercase tracking-wider mr-2">
                    <Filter size={16} className="text-blue-500" /> Advanced Filters
                </div>

                <div className="flex flex-wrap gap-3 flex-1">
                    {/* 1. Region Filter */}
                    <div className="flex gap-2">
                        <select
                            className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all cursor-pointer"
                            value={filters.region_city}
                            onChange={(e) => handleFilterChange('region_city', e.target.value)}
                        >
                            <option value="">전체 시/도</option>
                            {Object.keys(REGION_DATA).map(city => (
                                <option key={city} value={city}>{city}</option>
                            ))}
                        </select>
                        {filters.region_city && (
                            <select
                                className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none animate-in fade-in zoom-in-95 duration-200 cursor-pointer"
                                value={filters.region_gu}
                                onChange={(e) => handleFilterChange('region_gu', e.target.value)}
                            >
                                <option value="">전체 시/구/군</option>
                                {REGION_DATA[filters.region_city]?.map(gu => (
                                    <option key={gu} value={gu}>{gu}</option>
                                ))}
                            </select>
                        )}
                    </div>

                    {/* 2. Industry Filter */}
                    <div className="flex gap-2">
                        <select
                            className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all cursor-pointer"
                            value={filters.industry}
                            onChange={(e) => handleFilterChange('industry', e.target.value)}
                        >
                            <option value="">전체 1차 업종</option>
                            {Object.keys(INDUSTRY_DATA).map(ind => (
                                <option key={ind} value={ind}>{ind}</option>
                            ))}
                        </select>
                        {filters.industry && (
                            <select
                                className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none animate-in fade-in zoom-in-95 duration-200 cursor-pointer"
                                value={filters.industry_detail}
                                onChange={(e) => handleFilterChange('industry_detail', e.target.value)}
                            >
                                <option value="">전체 2차 업종</option>
                                {INDUSTRY_DATA[filters.industry]?.map(detail => (
                                    <option key={detail} value={detail}>{detail}</option>
                                ))}
                            </select>
                        )}
                    </div>

                    <select
                        className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black focus:border-slate-900 outline-none transition-all cursor-pointer"
                        value={filters.status}
                        onChange={(e) => handleFilterChange('status', e.target.value)}
                    >
                        <option value="">전체 상태</option>
                        <option value="new">신규 (NEW)</option>
                        <option value="contacted">접촉 (CONTACT)</option>
                        <option value="converted">전환 (DONE)</option>
                    </select>

                    <div className="flex items-center gap-1 group/batch">
                        <select
                            className="px-4 py-2 bg-slate-900 text-white border-none rounded-xl text-xs font-black focus:ring-4 focus:ring-slate-900/10 outline-none max-w-[180px] transition-all cursor-pointer"
                            value={filters.batch_id}
                            onChange={(e) => handleFilterChange('batch_id', e.target.value)}
                        >
                            <option value="">전체 업로드 회차</option>
                            {uploadHistory?.map((h: { id: string; created_at: string; filename: string; unique_count: number }) => (
                                <option key={h.id} value={h.id}>
                                    {new Date(h.created_at).toLocaleDateString()} - {h.filename} ({h.unique_count}건)
                                </option>
                            ))}
                        </select>
                        {filters.batch_id && (
                            <div className="flex gap-1 opacity-0 group-hover/batch:opacity-100 transition-opacity">
                                <button
                                    onClick={handleRenameBatch}
                                    className="p-2 bg-white text-slate-500 rounded-xl border border-slate-200 hover:text-blue-600 transition-all shadow-sm"
                                    title="이 회차 이름 변경"
                                >
                                    <Edit2 size={14} />
                                </button>
                                <button
                                    onClick={handleDeleteBatch}
                                    className="p-2 bg-white text-rose-500 rounded-xl border border-slate-200 hover:bg-rose-50 transition-all shadow-sm"
                                    title="이 회차 데이터 전체 삭제"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-3 ml-auto border-l border-slate-200 pl-4">
                    {selectedIds.length > 0 && (
                        <button
                            onClick={handleBulkDelete}
                            className="px-4 py-2 bg-rose-500 text-white rounded-xl text-xs font-black flex items-center gap-2 hover:bg-rose-600 transition-all shadow-lg shadow-rose-500/20 active:scale-95 border-none"
                        >
                            <Trash2 size={14} />
                            선택 삭제 ({selectedIds.length})
                        </button>
                    )}

                    <div className="relative">
                        <input
                            type="text"
                            placeholder="이름, 업체명 검색..."
                            className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none w-56 transition-all"
                            value={filters.search}
                            onChange={(e) => handleFilterChange('search', e.target.value)}
                        />
                        <Users size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    </div>
                </div>
            </div>

            {/* Table Area */}
            <div className="bg-white rounded-[40px] border border-slate-200 shadow-[0_8px_30px_rgb(0,0,0,0.02)] overflow-hidden min-h-[500px] flex flex-col relative z-10 transition-all">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse table-fixed">
                        <thead className="bg-slate-950 text-slate-400 text-[10px] font-black uppercase tracking-[0.1em] text-center border-b border-slate-900">
                            <tr>
                                <th className="p-5 w-[60px]">
                                    <div className="flex justify-center">
                                        <input
                                            type="checkbox"
                                            className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-blue-500 focus:ring-blue-500/20 cursor-pointer"
                                            onChange={handleSelectAll}
                                            checked={data?.data.length !== 0 && selectedIds.length === data?.data.length}
                                        />
                                    </div>
                                </th>
                                <th className="p-5 w-[70px]">No.</th>
                                <th className="p-5 w-[110px]">
                                    <button onClick={() => handleSort('status')} className="flex items-center justify-center gap-1.5 hover:text-white transition-colors mx-auto">
                                        Status {sortConfig.key === 'status' ? (sortConfig.asc ? <ChevronUp size={12} /> : <ChevronDown size={12} />) : <ArrowUpDown size={12} />}
                                    </button>
                                </th>
                                <th className="p-5 text-left w-[220px]">
                                    <button onClick={() => handleSort('name')} className="flex items-center gap-1.5 hover:text-white transition-colors">
                                        Lead Info {sortConfig.key === 'name' ? (sortConfig.asc ? <ChevronUp size={12} /> : <ChevronDown size={12} />) : <ArrowUpDown size={12} />}
                                    </button>
                                </th>
                                <th className="p-5 text-left w-[160px]">Direct SNS</th>
                                <th className="p-5 text-left">
                                    <button onClick={() => handleSort('shop_name')} className="flex items-center gap-1.5 hover:text-white transition-colors">
                                        Business Details {sortConfig.key === 'shop_name' ? (sortConfig.asc ? <ChevronUp size={12} /> : <ChevronDown size={12} />) : <ArrowUpDown size={12} />}
                                    </button>
                                </th>
                                <th className="p-5 text-left w-[160px]">Geography</th>
                                <th className="p-5 text-left w-[140px]">Source</th>
                                <th className="p-5 w-[130px]">
                                    <button onClick={() => handleSort('created_at')} className="flex items-center justify-center gap-1.5 hover:text-white transition-colors mx-auto">
                                        Acquired {sortConfig.key === 'created_at' ? (sortConfig.asc ? <ChevronUp size={12} /> : <ChevronDown size={12} />) : <ArrowUpDown size={12} />}
                                    </button>
                                </th>
                                <th className="p-5 w-[80px]">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-sm font-bold text-slate-700">
                            {isLoading ? (
                                <tr><td colSpan={10} className="p-20 text-center">
                                    <RefreshCw size={32} className="animate-spin text-blue-500 mx-auto mb-4 opacity-20" />
                                    <p className="text-slate-400 font-black">데이터 인텔리전스 로드 중...</p>
                                </td></tr>
                            ) : data?.data.length === 0 ? (
                                <tr><td colSpan={10} className="p-20 text-center">
                                    <div className="bg-slate-50 w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-slate-100">
                                        <Users size={24} className="text-slate-300" />
                                    </div>
                                    <p className="text-slate-400 font-black italic">매칭되는 잠재 고객 데이터가 없습니다.</p>
                                </td></tr>
                            ) : (
                                data?.data.map((target: MarketingTarget, index: number) => (
                                    <tr key={target.id} className={`hover:bg-blue-50/30 transition-all group text-center border-l-4 ${selectedIds.includes(target.id) ? 'bg-blue-50/50 border-blue-500' : 'border-transparent hover:border-blue-500/30'}`}>
                                        <td className="p-5">
                                            <input
                                                type="checkbox"
                                                className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600/20 cursor-pointer"
                                                checked={selectedIds.includes(target.id)}
                                                onChange={() => handleSelectToggle(target.id)}
                                            />
                                        </td>
                                        <td className="p-5 text-[10px] font-black text-slate-400 font-mono italic">
                                            {String((page - 1) * 20 + index + 1).padStart(3, '0')}
                                        </td>
                                        <td className="p-5">
                                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${target.status === 'new' ? 'bg-blue-100 text-blue-600' :
                                                target.status === 'contacted' ? 'bg-amber-100 text-amber-600' :
                                                    target.status === 'converted' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'
                                                }`}>
                                                {target.status}
                                            </span>
                                        </td>
                                        <td className="p-5 text-left">
                                            <div
                                                className="font-black text-slate-900 flex items-center gap-1.5 cursor-pointer hover:text-blue-600 group/field text-sm tracking-tight"
                                                onClick={() => handleQuickEdit(target.id, 'name', '이름', target.name || '')}
                                            >
                                                {target.name && target.name !== 'Unknown' ? target.name : target.shop_name || 'Anonymous Lead'}
                                                <Edit2 size={12} className="opacity-0 group-hover/field:opacity-100 transition-opacity text-slate-300" />
                                                {target.is_adult && (
                                                    <span className="px-1.5 py-0.5 rounded-md bg-rose-500 text-white text-[9px] flex items-center justify-center font-black shadow-sm shadow-rose-500/20">19+</span>
                                                )}
                                            </div>
                                            <div
                                                className="text-xs text-slate-400 font-black tracking-tighter cursor-pointer hover:text-blue-600 flex items-center gap-1 mt-1 group/p1"
                                                onClick={() => handleQuickEdit(target.id, 'phone_number', '기본 연락처', target.phone_number || '')}
                                            >
                                                <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                                                {target.phone_number}
                                                <Edit2 size={10} className="opacity-0 group-hover/p1:opacity-100 text-slate-300" />
                                            </div>
                                        </td>
                                        <td className="p-5 text-left">
                                            <div className="flex flex-col gap-2">
                                                <div
                                                    className={`text-[10px] font-black px-2.5 py-1 rounded-xl w-fit cursor-pointer group/field flex items-center gap-1.5 transition-all ${target.kakao_id ? 'text-amber-700 bg-amber-50 border border-amber-100 shadow-sm' : 'text-slate-300 bg-slate-50/50 border border-dashed border-slate-200'}`}
                                                    onClick={() => handleQuickEdit(target.id, 'kakao_id', '카카오 ID', target.kakao_id || '')}
                                                >
                                                    <span className="w-3.5 h-3.5 bg-amber-400 rounded-md text-[8px] flex items-center justify-center text-slate-900">K</span>
                                                    {target.kakao_id || 'NOT LINKED'}
                                                    <Edit2 size={10} className="opacity-0 group-hover/field:opacity-100" />
                                                </div>
                                                <div
                                                    className={`text-[10px] font-black px-2.5 py-1 rounded-xl w-fit cursor-pointer group/field flex items-center gap-1.5 transition-all ${target.telegram_id ? 'text-blue-700 bg-blue-50 border border-blue-100 shadow-sm' : 'text-slate-300 bg-slate-50/50 border border-dashed border-slate-200'}`}
                                                    onClick={() => handleQuickEdit(target.id, 'telegram_id', '텔레그램 ID', target.telegram_id || '')}
                                                >
                                                    <span className="w-3.5 h-3.5 bg-blue-500 rounded-md text-[8px] flex items-center justify-center text-white italic">T</span>
                                                    {target.telegram_id || 'NOT LINKED'}
                                                    <Edit2 size={10} className="opacity-0 group-hover/field:opacity-100" />
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-5 text-left">
                                            <div
                                                className="font-black text-slate-800 max-w-[180px] truncate cursor-pointer hover:text-blue-600 group/field flex items-center gap-1.5 text-sm tracking-tight"
                                                title={target.shop_name || undefined}
                                                onClick={() => handleQuickEdit(target.id, 'shop_name', '업체명', target.shop_name || '')}
                                            >
                                                {target.shop_name || '-'}
                                                <Edit2 size={12} className="opacity-0 group-hover/field:opacity-100 text-slate-300" />
                                            </div>
                                            <div
                                                className="text-[11px] text-slate-400 font-bold truncate cursor-pointer hover:text-blue-600 group/field2 flex items-center gap-1 mt-1 uppercase tracking-wider"
                                                onClick={() => handleQuickEdit(target.id, 'industry', '직종', target.industry || '')}
                                            >
                                                {target.industry || 'General Industry'}
                                                <Edit2 size={10} className="opacity-0 group-hover/field2:opacity-100 text-slate-300" />
                                            </div>
                                        </td>
                                        <td className="p-5 text-[11px] font-black text-slate-600 text-left leading-relaxed">
                                            <div className="flex items-center gap-1.5">
                                                <span className="w-1.5 h-1.5 bg-slate-200 rounded-full"></span>
                                                {target.region_city} {target.region_gu}
                                            </div>
                                        </td>
                                        <td className="p-5 text-[10px] text-slate-400 text-left">
                                            <div className="flex flex-wrap gap-1.5">
                                                {target.source_urls && target.source_urls.length > 0 ? (
                                                    target.source_urls.map((url: string, i: number) => (
                                                        <div key={i} className="group/link flex items-center gap-0 bg-slate-50 text-[10px] text-slate-500 rounded-xl border border-slate-200 transition-all hover:border-blue-300 hover:bg-white shadow-sm overflow-hidden">
                                                            <a
                                                                href={url.startsWith('http') ? url : `https://${url}`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="flex items-center gap-1 px-2.5 py-1 font-black hover:text-blue-600"
                                                            >
                                                                LINK{i + 1}
                                                                <ExternalLink size={10} />
                                                            </a>
                                                            <button
                                                                onClick={(e) => { e.preventDefault(); handleRemoveLink(target.id, url); }}
                                                                className="px-2 py-1 border-l border-slate-200 text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-colors"
                                                                title="수집 출처 삭제"
                                                            >
                                                                <X size={10} />
                                                            </button>
                                                        </div>
                                                    ))
                                                ) : (
                                                    target.source_url ? (
                                                        <a
                                                            href={target.source_url.startsWith('http') ? target.source_url : `https://${target.source_url}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 text-[10px] text-slate-600 font-black hover:text-blue-600 hover:bg-white rounded-xl border border-slate-200 transition-all shadow-sm"
                                                        >
                                                            DIRECT SOURCE
                                                            <ExternalLink size={10} />
                                                        </a>
                                                    ) : <span className="text-[10px] font-bold text-slate-300 italic">SYSTEM SYNC</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-5 text-[11px] font-black text-slate-400 italic">
                                            {new Date(target.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="p-5">
                                            <button
                                                onClick={() => handleDelete(target.id, target.name || target.shop_name || 'Lead')}
                                                className="p-2.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-2xl transition-all border border-slate-50 hover:border-rose-100"
                                                title="데이터 폐기"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>

                    {/* Pagination */}
                    <div className="bg-slate-50/50 px-8 py-6 flex items-center justify-between border-t border-slate-100">
                        <div className="text-xs text-slate-400 font-black uppercase tracking-widest flex items-center gap-3">
                            <span className="bg-slate-200 text-slate-500 px-2 py-0.5 rounded-md text-[9px]">TOTAL {data?.count || 0}</span>
                            Showing {Math.min((page - 1) * 20 + 1, data?.count || 0)} - {Math.min(page * 20, data?.count || 0)}
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setPage(1)}
                                disabled={page === 1}
                                className="p-2.5 rounded-2xl border border-slate-200 bg-white text-slate-400 hover:bg-slate-50 hover:text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
                            >
                                <ChevronsLeft size={18} />
                            </button>
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="p-2.5 rounded-2xl border border-slate-200 bg-white text-slate-400 hover:bg-slate-50 hover:text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
                            >
                                <ChevronLeft size={18} />
                            </button>

                            <div className="flex items-center gap-1.5 px-2">
                                {(() => {
                                    const totalPages = Math.ceil((data?.count || 0) / 20);
                                    const maxVisible = 5;
                                    let start = Math.max(1, page - Math.floor(maxVisible / 2));
                                    const end = Math.min(totalPages, start + maxVisible - 1);

                                    if (end - start + 1 < maxVisible) {
                                        start = Math.max(1, end - maxVisible + 1);
                                    }

                                    return Array.from({ length: end - start + 1 }, (_, i) => {
                                        const pageNum = start + i;
                                        return (
                                            <button
                                                key={pageNum}
                                                onClick={() => setPage(pageNum)}
                                                className={`w-10 h-10 rounded-2xl text-xs font-black transition-all ${page === pageNum
                                                    ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/30 ring-4 ring-blue-500/10'
                                                    : 'bg-white text-slate-400 border border-slate-200 hover:border-slate-300 hover:text-slate-600'
                                                    }`}
                                            >
                                                {pageNum}
                                            </button>
                                        );
                                    });
                                })()}
                            </div>

                            <button
                                onClick={() => setPage(p => Math.min(Math.ceil((data?.count || 0) / 20), p + 1))}
                                disabled={page >= Math.ceil((data?.count || 0) / 20)}
                                className="p-2.5 rounded-2xl border border-slate-200 bg-white text-slate-400 hover:bg-slate-50 hover:text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
                            >
                                <ChevronRight size={18} />
                            </button>
                            <button
                                onClick={() => setPage(Math.ceil((data?.count || 0) / 20))}
                                disabled={page >= Math.ceil((data?.count || 0) / 20)}
                                className="p-2.5 rounded-2xl border border-slate-200 bg-white text-slate-400 hover:bg-slate-50 hover:text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
                            >
                                <ChevronsRight size={18} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Send Modal */}
                {showSendModal && (
                    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-sm">
                        <div className="bg-white w-full max-w-lg rounded-[40px] shadow-2xl p-8 space-y-8 animate-in fade-in zoom-in-95 duration-300 border border-slate-200">
                            <div className="space-y-2">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-600 rounded-xl shadow-lg shadow-blue-500/20 text-white">
                                        <Send size={20} />
                                    </div>
                                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">캠페인 통합 발송</h3>
                                </div>
                                <p className="text-slate-500 text-sm font-bold ml-11">
                                    현재 필터 기준 <span className="text-blue-600 font-black">{(data?.count || 0).toLocaleString()}명 전체</span>에게 즉시 전송합니다.
                                </p>
                            </div>

                            <form onSubmit={handleSendSubmit} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Campaign Title</label>
                                    <input
                                        required
                                        className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-black focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all placeholder:text-slate-300"
                                        placeholder="예: 2024년 동절기 특별 프로모션"
                                        value={campaignForm.title}
                                        onChange={(e) => setCampaignForm({ ...campaignForm, title: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Delivery Channel</label>
                                    <div className="flex gap-2 p-1 bg-slate-50 rounded-2xl border border-slate-200">
                                        {[
                                            { label: 'SMS', value: 'sms' },
                                            { label: 'LMS', value: 'lms' },
                                            { label: 'Kakao', value: 'kakao' },
                                            { label: 'Telegram', value: 'telegram', disabled: true },
                                        ].map(ch => (
                                            <label key={ch.value} className={`flex-1 px-3 py-2.5 rounded-xl text-center text-[11px] font-black transition-all relative
                                                ${ch.disabled ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}
                                                ${campaignForm.channel === ch.value ? 'bg-slate-950 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600 hover:bg-white'}`}>
                                                <input
                                                    type="radio" className="hidden"
                                                    name="channel"
                                                    value={ch.value}
                                                    disabled={ch.disabled}
                                                    checked={campaignForm.channel === ch.value}
                                                    onChange={(e) => setCampaignForm({ ...campaignForm, channel: e.target.value })}
                                                />
                                                {ch.label}
                                            </label>
                                        ))}
                                    </div>
                                    {/* 카카오 미연결 경고 */}
                                    {campaignForm.channel === 'kakao' && kakaoStatus?.isMock && (
                                        <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-xl text-xs font-bold text-yellow-700">
                                            <WifiOff size={14} className="shrink-0 mt-0.5" />
                                            <span>카카오 채널 미연결 상태입니다. Mock 모드로 실행됩니다.<br />
                                                <span className="font-black">Vercel 환경변수</span>에 KAKAO_SENDER_KEY · KAKAO_APP_KEY · KAKAO_TEMPLATE_CODE를 설정하면 즉시 활성화됩니다.
                                            </span>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Message Content</label>
                                    <div className="relative">
                                        <textarea
                                            required
                                            rows={6}
                                            className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-3xl text-sm font-bold focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none resize-none transition-all placeholder:text-slate-300"
                                            placeholder="전달하고자 하는 핵심 전략을 입력하세요..."
                                            value={campaignForm.message}
                                            onChange={(e) => setCampaignForm({ ...campaignForm, message: e.target.value })}
                                        />
                                        <div className="absolute bottom-4 right-4 text-[10px] text-slate-400 font-bold bg-white/50 px-2 py-1 rounded-lg backdrop-blur-sm border border-slate-100">
                                            {campaignForm.message.length} <span className="opacity-50">/ 2,000 chars</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowSendModal(false)}
                                        className="py-4 bg-white border border-slate-200 text-slate-600 rounded-2xl font-black text-sm hover:bg-slate-50 transition-all active:scale-95"
                                    >
                                        취소
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={sendMutation.isPending}
                                        className="py-4 bg-slate-950 text-white rounded-2xl font-black text-sm hover:bg-black transition-all shadow-xl shadow-slate-950/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 active:scale-95"
                                    >
                                        {sendMutation.isPending ? <RefreshCw size={18} className="animate-spin" /> : <Send size={18} className="text-blue-400" />}
                                        전략 캠페인 발송
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Upload Result Modal */}
                {uploadResult && (
                    <div className="fixed inset-0 z-[10005] bg-slate-950/80 flex items-center justify-center p-4 backdrop-blur-md">
                        <div className="bg-white w-full max-w-sm rounded-[40px] shadow-2xl p-10 text-center space-y-8 animate-in slide-in-from-bottom-8 duration-500 border border-slate-100">
                            <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                                <CheckSquare size={40} />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-2xl font-black text-slate-900 tracking-tight">Bulk Upload Success</h3>
                                <p className="text-slate-400 text-xs font-bold leading-relaxed">잠재 고객 데이터 인텔리전스 분석이<br />성공적으로 완료되었습니다.</p>
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                                <div className="p-4 bg-slate-50 rounded-3xl border border-slate-100">
                                    <p className="text-[9px] font-black text-slate-300 uppercase mb-1 tracking-widest">Total</p>
                                    <p className="text-xl font-black text-slate-900">{uploadResult.total}</p>
                                </div>
                                <div className="p-4 bg-blue-50 rounded-3xl border border-blue-100/50">
                                    <p className="text-[9px] font-black text-blue-400 uppercase mb-1 tracking-widest">New</p>
                                    <p className="text-xl font-black text-blue-600">{uploadResult.count}</p>
                                </div>
                                <div className="p-4 bg-rose-50 rounded-3xl border border-rose-100/50">
                                    <p className="text-[9px] font-black text-rose-400 uppercase mb-1 tracking-widest">Dup</p>
                                    <p className="text-xl font-black text-rose-600">{uploadResult.duplicates}</p>
                                </div>
                            </div>

                            <div className="bg-slate-50 p-4 rounded-2xl flex items-start gap-3 text-left border border-slate-100">
                                <AlertCircle size={18} className="text-slate-400 shrink-0 mt-0.5" />
                                <p className="text-[10px] text-slate-400 font-bold leading-relaxed">
                                    동일한 식별값(전화번호)을 가진 데이터는 최신 정보로 병합되었으며, 시스템 안정성을 위해 중복된 레코드는 제거되었습니다.
                                </p>
                            </div>

                            <button
                                onClick={() => setUploadResult(null)}
                                className="w-full py-5 bg-slate-950 text-white rounded-3xl font-black hover:bg-black transition-all shadow-2xl shadow-slate-950/30 active:scale-95"
                            >
                                대시보드로 돌아가기
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
