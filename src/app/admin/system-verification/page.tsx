'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Shop } from '@/types/shop';
import {
    AlertTriangle, CheckCircle, RefreshCcw, ExternalLink, Shield
} from 'lucide-react';
import { slugify } from '@/utils/shopUtils';
import { HealthDashboard } from '@/components/admin/HealthDashboard';
import { StandardsGuardView } from '@/app/admin/components/StandardsGuardView';

const EMPTY_COMP_VAL: any[] = []; // [재검증] 무한 루프 방지용 고정 상수


export default function SystemVerificationPage() {
    const [shops, setShops] = useState<Shop[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'issue'>('issue');

    const fetchShops = async () => {
        setLoading(true);
        const { data } = await supabase
            .from('shops')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(100);
        if (data) setShops(data as unknown as Shop[]);
        setLoading(false);
    };

    useEffect(() => { fetchShops(); }, []);

    const checkTitleIssue = (title: string | null | undefined, name: string | null | undefined) => {
        const text = title || name || '';
        return text.length > 26;
    };

    const filteredShops = filter === 'issue'
        ? shops.filter(s => checkTitleIssue(s.title || '', s.name))
        : shops;

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-10">
            {/* 헤더 */}
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
                    <span className="w-3 h-8 bg-red-600 rounded-full"></span>
                    시스템 검증 센터
                </h1>
            </div>

            {/* [NEW] 통합 기술 표준 정보 (v2.0.6) */}
            <div className="mb-10">
                <StandardsGuardView ads={EMPTY_COMP_VAL} payments={EMPTY_COMP_VAL} />
            </div>

            {/* 실시간 헬스 대시보드 */}
            <HealthDashboard />

            {/* 공고 제목 26자 규격 검증 */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
                        <Shield size={18} className="text-red-500" /> 공고 제목 규격 검증 (26자)
                    </h2>
                    <button onClick={fetchShops} className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-xl hover:bg-gray-200 transition font-bold text-sm">
                        <RefreshCcw size={16} /> 새로고침
                    </button>
                </div>

                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="flex-1 bg-red-50 p-4 rounded-xl border border-red-100">
                            <h3 className="text-red-700 font-black text-lg mb-1">규격 위반 의심 {(shops || []).filter(s => checkTitleIssue(s.title || '', s.name)).length}건)</h3>
                            <p className="text-red-900/70 text-sm font-bold">제목 길이 26자 초과 (모바일/PC 1줄 초과 위험)</p>
                        </div>
                        <div className="flex-1 bg-green-50 p-4 rounded-xl border border-green-100">
                            <h3 className="text-green-700 font-black text-lg mb-1">정상 규격 {(shops || []).filter(s => !checkTitleIssue(s.title || '', s.name)).length}건)</h3>
                            <p className="text-green-900/70 text-sm font-bold">제목 길이 26자 이내 안전</p>
                        </div>
                    </div>
                    <div className="flex gap-2 mb-4">
                        <button onClick={() => setFilter('issue')} className={`px-4 py-2 rounded-lg font-bold text-sm transition ${filter === 'issue' ? 'bg-red-600 text-white shadow-md' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>위반 의심 항목만 보기</button>
                        <button onClick={() => setFilter('all')} className={`px-4 py-2 rounded-lg font-bold text-sm transition ${filter === 'all' ? 'bg-gray-800 text-white shadow-md' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>전체 보기</button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50 border-y border-gray-200 text-gray-500 text-xs uppercase tracking-wider">
                                    <th className="p-3 font-black w-[80px]">상태</th>
                                    <th className="p-3 font-black w-[200px]">상점/공고명</th>
                                    <th className="p-3 font-black">제목 (Length)</th>
                                    <th className="p-3 font-black w-[100px]">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {loading ? (
                                    <tr><td colSpan={4} className="p-8 text-center text-gray-400">Loading...</td></tr>
                                ) : filteredShops.length === 0 ? (
                                    <tr><td colSpan={4} className="p-8 text-center text-gray-400 font-bold">발견된 문제가 없습니다! Perfect! 🎉</td></tr>
                                ) : (
                                    filteredShops.map(shop => {
                                        const title = shop.title || shop.name;
                                        const isIssue = checkTitleIssue(title, shop.name);
                                        return (
                                            <tr key={shop.id} className={`hover:bg-gray-50 transition ${isIssue ? 'bg-red-50/30' : ''}`}>
                                                <td className="p-3">
                                                    {isIssue ? (
                                                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 text-[10px] font-black rounded-full"><AlertTriangle size={12} /> 위반</span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-[10px] font-black rounded-full"><CheckCircle size={12} /> 정상</span>
                                                    )}
                                                </td>
                                                <td className="p-3">
                                                    <div className="font-bold text-sm text-gray-900 line-clamp-1">{shop.name}</div>
                                                    <div className="text-[10px] text-gray-400 font-mono">{String(shop.id).split('-')[0]}...</div>
                                                </td>
                                                <td className="p-3">
                                                    <div className={`font-bold text-sm mb-0.5 line-clamp-1 break-all ${isIssue ? 'text-red-600' : 'text-gray-700'}`}>{title || '제목 없음'}</div>
                                                    <div className={`text-[10px] font-mono font-bold ${isIssue ? 'text-red-500' : 'text-gray-400'}`}>Length: {title?.length || 0} / 26</div>
                                                </td>
                                                <td className="p-3">
                                                    <a href={`/coco/${slugify(shop.region)}/${shop.id}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-600 hover:bg-gray-50 hover:text-blue-600 transition">
                                                        <ExternalLink size={14} /> 확인
                                                    </a>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-xs text-gray-500 leading-relaxed font-bold mt-4">
                    * 이 페이지는 운영자가 공고 제목의 길이를 모니터링하기 위해 생성되었습니다.<br />
                    * [공고등록 페이지]에서는 최대 26자로 입력이 제한되므로, 신규 공고는 안전합니다.<br />
                    * 기존 공고 중 26자를 초과하는 건에 대해서는 &apos;위반&apos;으로 표시되며, 필요 시 수동으로 수정 요청을 해야 합니다.
                </div>
            </div>
        </div>
    );
}
