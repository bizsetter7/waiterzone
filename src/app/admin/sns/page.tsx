'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import {
    Twitter, Send, Eye, Clock, Zap, CheckCircle2,
    XCircle, AlertCircle, RefreshCw, Copy, Edit3,
    Hash, MapPin, Briefcase, ChevronDown,
    Image as ImageIcon, Download, Database, Keyboard,
    Search,
} from 'lucide-react';
import { toast } from 'react-hot-toast';

// ─── 타입 ─────────────────────────────────────────────────────────────────────

interface PreviewData {
    type: string;
    text: string;
    charCount: number;
    todayRegion: { slug: string; name: string };
    todayWorkType: string;
    kstHour: number;
}

interface CronSlot {
    kst: string;
    type: string;
    utc: string;
}

// ─── 업종/지역 선택 옵션 ─────────────────────────────────────────────────────

const WORK_TYPES = ['룸웨이터', '텐프로', '쩜오알바', '텐카페', '노래주점', '노래방웨이터', '바알바', '마사지', '엔터'];

// 지역 그룹별 분류 (주요 유흥 상권 중심)
const REGION_GROUPS = [
    {
        group: '서울',
        regions: [
            { slug: '서울-강남구',    name: '강남' },
            { slug: '서울-서초구',    name: '서초·강남역' },
            { slug: '서울-마포구',    name: '홍대·마포' },
            { slug: '서울-영등포구',  name: '영등포·여의도' },
            { slug: '서울-용산구',    name: '이태원·용산' },
            { slug: '서울-중구',      name: '명동·을지로' },
            { slug: '서울-송파구',    name: '송파·잠실' },
            { slug: '서울-강서구',    name: '강서·발산' },
            { slug: '서울-성동구',    name: '성수·왕십리' },
            { slug: '서울-동대문구',  name: '동대문·청량리' },
            { slug: '서울-종로구',    name: '종로·광화문' },
            { slug: '서울-관악구',    name: '신림·관악' },
        ],
    },
    {
        group: '경기·인천',
        regions: [
            { slug: '경기-수원시',    name: '수원' },
            { slug: '경기-성남시',    name: '성남·분당' },
            { slug: '경기-부천시',    name: '부천' },
            { slug: '경기-고양시',    name: '고양·일산' },
            { slug: '경기-안양시',    name: '안양·평촌' },
            { slug: '경기-의정부시',  name: '의정부' },
            { slug: '경기-평택시',    name: '평택' },
            { slug: '경기-안산시',    name: '안산' },
            { slug: '경기-용인시',    name: '용인' },
            { slug: '경기-화성시',    name: '화성·동탄' },
            { slug: '인천',           name: '인천' },
        ],
    },
    {
        group: '부산·경남',
        regions: [
            { slug: '부산-해운대구',  name: '해운대' },
            { slug: '부산-부산진구',  name: '서면' },
            { slug: '부산-수영구',    name: '광안리' },
            { slug: '부산-중구',      name: '남포·중구' },
            { slug: '경남-창원시',    name: '창원' },
            { slug: '경남-진주시',    name: '진주' },
        ],
    },
    {
        group: '대전·충청',
        regions: [
            { slug: '대전-유성구',    name: '대전 유성' },
            { slug: '대전-중구',      name: '대전 중구' },
            { slug: '충남-천안시',    name: '천안' },
            { slug: '충북-청주시',    name: '청주' },
        ],
    },
    {
        group: '대구·경북',
        regions: [
            { slug: '대구-수성구',    name: '대구 수성' },
            { slug: '대구-중구',      name: '대구 동성로' },
            { slug: '경북-구미시',    name: '구미' },
            { slug: '경북-포항시',    name: '포항' },
        ],
    },
    {
        group: '광주·전라',
        regions: [
            { slug: '광주-서구',      name: '광주 상무' },
            { slug: '광주-동구',      name: '광주 충장로' },
            { slug: '전북-전주시',    name: '전주' },
            { slug: '전남-목포시',    name: '목포' },
        ],
    },
    {
        group: '기타',
        regions: [
            { slug: '울산',           name: '울산' },
            { slug: '강원-강릉시',    name: '강릉' },
            { slug: '강원-춘천시',    name: '춘천' },
            { slug: '제주',           name: '제주' },
        ],
    },
];

const TWEET_TYPES = [
    { value: 'new_job',     label: '신규 구인 공고', icon: '🆕' },
    { value: 'salary_info', label: '지역 시세 정보', icon: '📊' },
    { value: 'guide',       label: '가이드 콘텐츠',  icon: '💡' },
];

// ─── 메인 컴포넌트 ────────────────────────────────────────────────────────────

export default function SnsManagementPage() {
    const router = useRouter();
    const { user, isLoggedIn } = useAuth();

    const [preview, setPreview]         = useState<PreviewData | null>(null);
    const [cronSlots, setCronSlots]     = useState<CronSlot[]>([]);
    const [configured, setConfigured]   = useState<boolean | null>(null);
    const [loading, setLoading]         = useState(true);

    // 수동 발행 상태
    const [manualText, setManualText]   = useState('');
    const [selectedType, setSelectedType] = useState('guide');
    const [selectedRegion, setSelectedRegion] = useState('서울-강남구');
    const [selectedWT, setSelectedWT]   = useState('룸웨이터');
    const allRegions = REGION_GROUPS.flatMap(g => g.regions);
    const [generating, setGenerating]   = useState(false);
    const [posting, setPosting]         = useState(false);
    const [lastResult, setLastResult]   = useState<{ ok: boolean; id?: string; error?: string } | null>(null);

    // ── 광고카드 생성기 상태 ──────────────────────────────────────────────────
    const [cardMode, setCardMode]         = useState<'db' | 'manual'>('db');
    const [cardTemplate, setCardTemplate] = useState<'A' | 'B' | 'C' | 'D'>('A');
    const [cardBg, setCardBg]             = useState('white');
    const [cardShopId, setCardShopId]     = useState('');
    const [cardShopSearch, setCardShopSearch] = useState('');
    const [cardShopList, setCardShopList] = useState<{ id: number; nickname: string; name: string; region: string }[]>([]);
    const [cardSearching, setCardSearching] = useState(false);
    const [cardPreviewUrl, setCardPreviewUrl] = useState('');
    const [selectedShopData, setSelectedShopData] = useState<{ nickname: string; region: string } | null>(null);
    // 수동 입력 필드
    const [cardFields, setCardFields] = useState({
        nickname: '', region: '', subRegion: '', phone: '',
        title: '', ageMin: '', ageMax: '',
        payType: '일급', pay: '', category: '', categorySub: '', keywords: '',
    });

    const CARD_BG_PALETTE: { key: string; label: string; preview: string }[] = [
        { key: 'white',          label: '화이트',     preview: '#FFFFFF' },
        { key: 'light-gray',     label: '라이트그레이', preview: '#F4F4F5' },
        { key: 'beige',          label: '베이지',     preview: '#F5F0E8' },
        { key: 'cream',          label: '크림',       preview: '#FFF8E7' },
        { key: 'light-pink',     label: '핑크(연)',   preview: '#FFF0F5' },
        { key: 'light-purple',   label: '퍼플(연)',   preview: '#F8F0FF' },
        { key: 'navy',           label: '네이비',     preview: '#1a1a2e' },
        { key: 'black',          label: '블랙',       preview: '#0D0D0D' },
        { key: 'grad-pink-purple', label: '핑크→퍼플', preview: 'linear-gradient(135deg,#FF6B9D,#9B59B6)' },
        { key: 'grad-gold-orange', label: '골드→오렌지', preview: 'linear-gradient(135deg,#F39C12,#E74C3C)' },
        { key: 'grad-navy-blue',   label: '네이비→블루', preview: 'linear-gradient(135deg,#1a1a2e,#0F3460)' },
        { key: 'grad-emerald',     label: '에메랄드',  preview: 'linear-gradient(135deg,#00C853,#00BCD4)' },
        { key: 'grad-rose-coral',  label: '로즈→코랄', preview: 'linear-gradient(135deg,#FF1744,#FF8A65)' },
        { key: 'grad-dark-gray',   label: '다크그레이', preview: 'linear-gradient(135deg,#2D3436,#636E72)' },
        { key: 'dark-black',     label: '딥블랙',     preview: '#0A0A0A' },
        { key: 'dark-navy',      label: '다크네이비',  preview: '#0F1B35' },
        { key: 'dark-purple',    label: '다크퍼플',   preview: '#1A0A2E' },
        { key: 'charcoal',       label: '차콜',       preview: '#2C2C2C' },
    ];

    // 업소 검색 (DB 모드)
    const searchShops = async () => {
        if (!cardShopSearch.trim()) return;
        setCardSearching(true);
        try {
            const res = await fetch(`/api/admin/shops/search?q=${encodeURIComponent(cardShopSearch)}`, {
                headers: getAuthHeader(),
            });
            const data = await res.json();
            if (data.ok) setCardShopList(data.shops ?? []);
            else toast.error('업소 검색 실패');
        } catch { toast.error('업소 검색 오류'); }
        finally { setCardSearching(false); }
    };

    // 미리보기 URL 생성
    const buildPreviewUrl = () => {
        const params = new URLSearchParams({ template: cardTemplate, bg: cardBg });
        if (cardMode === 'db' && cardShopId) {
            params.set('shopId', cardShopId);
        } else {
            Object.entries(cardFields).forEach(([k, v]) => { if (v) params.set(k, v); });
        }
        return `/api/card/generate?${params.toString()}`;
    };

    const handleCardPreview = () => {
        const url = buildPreviewUrl();
        setCardPreviewUrl(url + `&_t=${Date.now()}`); // 캐시 방지
    };

    // SEO 파일명 생성 — 지역-업체명-업종-구인공고.png
    const buildSeoFilename = (): string => {
        const clean = (s: string) =>
            s.replace(/[\[\]【】()（）#\s]/g, '-')
             .replace(/-+/g, '-')
             .replace(/^-|-$/g, '')
             .trim();

        let nickname = '';
        let region   = '';
        let category = '';

        if (cardMode === 'db' && selectedShopData) {
            nickname = clean(selectedShopData.nickname);
            region   = clean(selectedShopData.region);
        } else if (cardMode === 'manual') {
            nickname = clean(cardFields.nickname);
            region   = clean(cardFields.region);
            category = clean(cardFields.category);
        }

        const parts = [region, nickname, category, '구인공고'].filter(Boolean);
        return `${parts.join('-')}.png`;
    };

    const handleCardDownload = async () => {
        const url = buildPreviewUrl();
        try {
            const res = await fetch(url);
            const blob = await res.blob();
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = buildSeoFilename();
            a.click();
            URL.revokeObjectURL(a.href);
            toast.success('카드 다운로드 완료!');
        } catch { toast.error('다운로드 실패'); }
    };

    // ── 인증 헤더 ──────────────────────────────────────────────────────────────
    const getAuthHeader = useCallback((): Record<string, string> => {
        const token = (user as any)?.access_token ?? (user as any)?.session?.access_token ?? '';
        return token ? { Authorization: `Bearer ${token}` } : {};
    }, [user]);

    // ── 미리보기 로드 ─────────────────────────────────────────────────────────
    const loadPreview = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/sns/preview', {
                headers: { ...getAuthHeader(), 'Content-Type': 'application/json' },
            });
            const data = await res.json();
            if (data.ok) {
                setPreview(data.preview);
                setCronSlots(data.nextSlots ?? []);
                setConfigured(data.twitterConfigured);
            }
        } catch (e) {
            toast.error('미리보기 로드 실패');
        } finally {
            setLoading(false);
        }
    }, [getAuthHeader]);

    useEffect(() => { loadPreview(); }, [loadPreview]);

    // ── 트윗 텍스트 자동 생성 ─────────────────────────────────────────────────
    const generateTweet = async () => {
        setGenerating(true);
        try {
            const res = await fetch('/api/admin/sns/preview', {
                method: 'POST',
                headers: { ...getAuthHeader(), 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type:       selectedType,
                    regionSlug: selectedRegion,
                    workType:   selectedWT,
                }),
            });
            const data = await res.json();
            if (data.ok) {
                setManualText(data.text);
                toast.success('트윗 생성 완료');
            }
        } catch (e) {
            toast.error('트윗 생성 실패');
        } finally {
            setGenerating(false);
        }
    };

    // ── 수동 발행 ──────────────────────────────────────────────────────────────
    const handlePost = async () => {
        if (!manualText.trim()) { toast.error('트윗 내용을 입력하거나 생성하세요'); return; }
        if (!confirm('지금 즉시 Twitter에 게시하시겠습니까?')) return;

        setPosting(true);
        setLastResult(null);
        try {
            const res = await fetch('/api/admin/sns/manual-post', {
                method: 'POST',
                headers: { ...getAuthHeader(), 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: manualText }),
            });
            const data = await res.json();
            if (data.ok) {
                setLastResult({ ok: true, id: data.tweetId });
                toast.success(`트윗 발행 완료! ID: ${data.tweetId}`);
                setManualText('');
            } else {
                setLastResult({ ok: false, error: data.error });
                toast.error(data.error ?? '발행 실패');
            }
        } catch (e: any) {
            setLastResult({ ok: false, error: e.message });
            toast.error('발행 실패');
        } finally {
            setPosting(false);
        }
    };

    // ── 크론 수동 실행 ────────────────────────────────────────────────────────
    const runCron = async () => {
        if (!confirm('크론 파이프라인을 지금 즉시 실행하시겠습니까?')) return;
        try {
            const cronSecret = prompt('CRON_SECRET 입력:');
            if (!cronSecret) return;
            const res = await fetch('/api/cron/twitter-post', {
                headers: { Authorization: `Bearer ${cronSecret}` },
            });
            const data = await res.json();
            if (data.ok) {
                toast.success(`자동 트윗 발행 완료! (${data.tweetType})`);
            } else {
                toast.error(data.error ?? data.message ?? '크론 실행 실패');
            }
        } catch (e: any) {
            toast.error(e.message);
        }
    };

    // ── 문자 수 카운터 ────────────────────────────────────────────────────────
    const charCount = [...manualText.replace(/https?:\/\/\S+/g, '?'.repeat(23))].length;
    const isOver = charCount > 280;

    return (
        <div className="min-h-screen bg-slate-950 text-white p-6">
            <div className="max-w-4xl mx-auto space-y-6">

                {/* 헤더 */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-sky-500/20 rounded-xl">
                            <Twitter size={24} className="text-sky-400" />
                        </div>
                        <div>
                            <h1 className="text-xl font-black text-white">SNS 자동화 관리</h1>
                            <p className="text-xs text-slate-400">Twitter/X 자동 발행 파이프라인</p>
                        </div>
                    </div>
                    <button onClick={loadPreview} className="p-2 hover:bg-slate-800 rounded-xl transition-colors">
                        <RefreshCw size={16} className="text-slate-400" />
                    </button>
                </div>

                {/* Twitter 설정 상태 */}
                <div className={`flex items-center gap-3 p-4 rounded-2xl border ${
                    configured === null ? 'bg-slate-800/50 border-slate-700' :
                    configured ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-red-500/10 border-red-500/30'
                }`}>
                    {configured === null ? <AlertCircle size={18} className="text-slate-400" /> :
                     configured ? <CheckCircle2 size={18} className="text-emerald-400" /> :
                     <XCircle size={18} className="text-red-400" />}
                    <div>
                        <p className={`font-bold text-sm ${configured ? 'text-emerald-300' : configured === false ? 'text-red-300' : 'text-slate-300'}`}>
                            Twitter API {configured ? '연결됨' : configured === false ? '미설정' : '확인 중...'}
                        </p>
                        {configured === false && (
                            <p className="text-xs text-slate-400 mt-0.5">
                                Vercel 환경변수에 TWITTER_API_KEY, TWITTER_API_SECRET, TWITTER_ACCESS_TOKEN, TWITTER_ACCESS_SECRET 를 등록하세요
                            </p>
                        )}
                    </div>
                </div>

                {/* 크론 스케줄 */}
                <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5">
                    <div className="flex items-center gap-2 mb-4">
                        <Clock size={16} className="text-slate-400" />
                        <h2 className="font-black text-sm text-slate-300">자동 발행 스케줄 (KST)</h2>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {cronSlots.map((slot) => {
                            const icons: Record<string, string> = { new_job: '🆕', salary_info: '📊', guide: '💡' };
                            return (
                                <div key={slot.kst} className="bg-slate-800 rounded-xl p-3 text-center">
                                    <p className="text-lg font-black text-white">{slot.kst}</p>
                                    <p className="text-xs text-slate-400 mt-0.5">{icons[slot.type]} {slot.type === 'new_job' ? '신규공고' : slot.type === 'salary_info' ? '시세정보' : '가이드'}</p>
                                </div>
                            );
                        })}
                    </div>
                    <button
                        onClick={runCron}
                        className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 bg-slate-700 hover:bg-slate-600 rounded-xl text-sm font-bold text-slate-300 transition-colors"
                    >
                        <Zap size={14} /> 크론 지금 실행 (테스트)
                    </button>
                </div>

                {/* 자동 생성 미리보기 */}
                {preview && (
                    <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <Eye size={16} className="text-slate-400" />
                                <h2 className="font-black text-sm text-slate-300">다음 자동 트윗 미리보기</h2>
                            </div>
                            <span className="text-xs px-2 py-0.5 bg-sky-500/20 text-sky-400 rounded-full font-bold">
                                {preview.type === 'new_job' ? '신규공고' : preview.type === 'salary_info' ? '시세정보' : '가이드'}
                            </span>
                        </div>
                        <div className="bg-slate-800 rounded-xl p-4 font-mono text-sm text-slate-200 whitespace-pre-wrap leading-relaxed">
                            {preview.text}
                        </div>
                        <div className="flex items-center justify-between mt-2">
                            <p className={`text-xs font-bold ${preview.charCount > 280 ? 'text-red-400' : 'text-slate-500'}`}>
                                {preview.charCount} / 280자
                            </p>
                            <button
                                onClick={() => { setManualText(preview.text); toast.success('편집창에 복사됨'); }}
                                className="flex items-center gap-1 text-xs text-slate-400 hover:text-white transition-colors"
                            >
                                <Copy size={12} /> 편집창으로 복사
                            </button>
                        </div>
                    </div>
                )}

                {/* 수동 발행 */}
                <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5 space-y-4">
                    <div className="flex items-center gap-2">
                        <Edit3 size={16} className="text-slate-400" />
                        <h2 className="font-black text-sm text-slate-300">수동 트윗 발행</h2>
                    </div>

                    {/* 자동 생성 옵션 */}
                    <div className="grid grid-cols-3 gap-3">
                        {/* 트윗 타입 */}
                        <div>
                            <label className="text-xs text-slate-500 font-bold mb-1.5 block">콘텐츠 타입</label>
                            <select
                                value={selectedType}
                                onChange={e => setSelectedType(e.target.value)}
                                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white appearance-none"
                            >
                                {TWEET_TYPES.map(t => (
                                    <option key={t.value} value={t.value}>{t.icon} {t.label}</option>
                                ))}
                            </select>
                        </div>
                        {/* 지역 */}
                        <div>
                            <label className="text-xs text-slate-500 font-bold mb-1.5 block flex items-center gap-1">
                                <MapPin size={10} /> 지역
                            </label>
                            <select
                                value={selectedRegion}
                                onChange={e => setSelectedRegion(e.target.value)}
                                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white appearance-none"
                            >
                                {REGION_GROUPS.map(g => (
                                    <optgroup key={g.group} label={`── ${g.group} ──`}>
                                        {g.regions.map(r => (
                                            <option key={r.slug} value={r.slug}>{r.name}</option>
                                        ))}
                                    </optgroup>
                                ))}
                            </select>
                        </div>
                        {/* 업종 */}
                        <div>
                            <label className="text-xs text-slate-500 font-bold mb-1.5 block flex items-center gap-1">
                                <Briefcase size={10} /> 업종
                            </label>
                            <select
                                value={selectedWT}
                                onChange={e => setSelectedWT(e.target.value)}
                                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white appearance-none"
                            >
                                {WORK_TYPES.map(w => (
                                    <option key={w} value={w}>{w}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <button
                        onClick={generateTweet}
                        disabled={generating}
                        className="w-full flex items-center justify-center gap-2 py-2.5 bg-slate-700 hover:bg-sky-600 disabled:opacity-50 rounded-xl text-sm font-bold text-white transition-colors"
                    >
                        {generating ? <RefreshCw size={14} className="animate-spin" /> : <Hash size={14} />}
                        {generating ? '생성 중...' : '트윗 자동 생성'}
                    </button>

                    {/* 텍스트 편집 */}
                    <div className="relative">
                        <textarea
                            value={manualText}
                            onChange={e => setManualText(e.target.value)}
                            placeholder="트윗 내용을 입력하거나 위에서 자동 생성하세요..."
                            rows={8}
                            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white font-mono resize-none focus:outline-none focus:border-sky-500 transition-colors"
                        />
                        <span className={`absolute bottom-3 right-3 text-xs font-bold ${isOver ? 'text-red-400' : 'text-slate-500'}`}>
                            {charCount}/280
                        </span>
                    </div>

                    {/* 클립보드 복사 버튼 (수동 게시용) */}
                    <button
                        onClick={() => {
                            if (!manualText.trim()) { toast.error('먼저 트윗을 생성하세요'); return; }
                            navigator.clipboard.writeText(manualText).then(() => {
                                toast.success('복사 완료! X(트위터) 앱에 붙여넣기 하세요 🐦');
                            });
                        }}
                        disabled={!manualText.trim()}
                        className="w-full flex items-center justify-center gap-2 py-3.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl font-black text-white transition-colors shadow-lg shadow-emerald-500/20"
                    >
                        <Copy size={16} />
                        📋 클립보드 복사 (X 앱에 붙여넣기)
                    </button>

                    {/* X 바로가기 */}
                    {manualText.trim() && (
                        <a
                            href="https://twitter.com/intent/tweet"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full flex items-center justify-center gap-2 py-2.5 bg-sky-500/20 hover:bg-sky-500/30 border border-sky-500/40 rounded-xl text-sm font-bold text-sky-300 transition-colors"
                        >
                            <Send size={14} /> X(트위터) 열기 → 붙여넣기 후 게시
                        </a>
                    )}

                    {/* 발행 버튼 (API 직접 발행 — 크레딧 필요) */}
                    <button
                        onClick={handlePost}
                        disabled={posting || !configured || isOver}
                        className="w-full flex items-center justify-center gap-2 py-2.5 bg-slate-700 hover:bg-slate-600 disabled:opacity-30 disabled:cursor-not-allowed rounded-xl text-sm font-bold text-slate-300 transition-colors"
                    >
                        {posting ? <RefreshCw size={14} className="animate-spin" /> : <Send size={14} />}
                        {posting ? '발행 중...' : 'API 직접 발행 (크레딧 필요)'}
                    </button>

                    {/* 결과 */}
                    {lastResult && (
                        <div className={`flex items-center gap-3 p-3 rounded-xl ${lastResult.ok ? 'bg-emerald-500/10 border border-emerald-500/30' : 'bg-red-500/10 border border-red-500/30'}`}>
                            {lastResult.ok
                                ? <CheckCircle2 size={16} className="text-emerald-400" />
                                : <XCircle size={16} className="text-red-400" />}
                            <p className={`text-sm font-bold ${lastResult.ok ? 'text-emerald-300' : 'text-red-300'}`}>
                                {lastResult.ok ? `발행 완료! Tweet ID: ${lastResult.id}` : `실패: ${lastResult.error}`}
                            </p>
                        </div>
                    )}
                </div>

                {/* IndexNow 섹션 */}
                <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5">
                    <div className="flex items-center gap-2 mb-3">
                        <Zap size={16} className="text-yellow-400" />
                        <h2 className="font-black text-sm text-slate-300">Google IndexNow (즉시 색인)</h2>
                    </div>
                    <p className="text-xs text-slate-400 mb-4">
                        신규/수정 광고 URL을 Google·Bing에 즉시 색인 요청합니다. 6시간마다 자동 실행됩니다.
                    </p>
                    <button
                        onClick={async () => {
                            try {
                                const cronSecret = prompt('CRON_SECRET 입력:');
                                if (!cronSecret) return;
                                const res = await fetch('/api/cron/indexnow', {
                                    headers: { Authorization: `Bearer ${cronSecret}` },
                                });
                                const data = await res.json();
                                if (data.ok) toast.success(`${data.submitted}개 URL 색인 요청 완료`);
                                else toast.error(data.error ?? data.message ?? '실패');
                            } catch (e: any) {
                                toast.error(e.message);
                            }
                        }}
                        className="flex items-center gap-2 px-4 py-2.5 bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/30 rounded-xl text-sm font-bold text-yellow-300 transition-colors"
                    >
                        <Zap size={14} /> IndexNow 지금 실행
                    </button>
                </div>

                {/* ──────────────────────────────────────────────────────────── */}
                {/* 광고카드 생성기                                              */}
                {/* ──────────────────────────────────────────────────────────── */}
                <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5 space-y-5">
                    <div className="flex items-center gap-2">
                        <ImageIcon size={16} className="text-pink-400" />
                        <h2 className="font-black text-sm text-slate-300">광고카드 생성기</h2>
                        <span className="text-xs px-2 py-0.5 bg-pink-500/20 text-pink-400 rounded-full font-bold">1080×1080 PNG</span>
                    </div>

                    {/* 모드 토글 */}
                    <div className="flex gap-2">
                        {(['db', 'manual'] as const).map(m => (
                            <button key={m} onClick={() => setCardMode(m)}
                                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold transition-colors ${cardMode === m ? 'bg-pink-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>
                                {m === 'db' ? <Database size={13} /> : <Keyboard size={13} />}
                                {m === 'db' ? 'DB 자동' : '수동 입력'}
                            </button>
                        ))}
                    </div>

                    {/* DB 자동 모드 */}
                    {cardMode === 'db' && (
                        <div className="space-y-3">
                            <div className="flex gap-2">
                                <input
                                    value={cardShopSearch}
                                    onChange={e => setCardShopSearch(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && searchShops()}
                                    placeholder="업소명으로 검색..."
                                    className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-pink-500"
                                />
                                <button onClick={searchShops} disabled={cardSearching}
                                    className="flex items-center gap-1 px-4 py-2 bg-slate-700 hover:bg-pink-600 rounded-xl text-sm font-bold text-slate-300 hover:text-white transition-colors disabled:opacity-50">
                                    {cardSearching ? <RefreshCw size={13} className="animate-spin" /> : <Search size={13} />}
                                    검색
                                </button>
                            </div>
                            {cardShopList.length > 0 && (
                                <div className="bg-slate-800 rounded-xl divide-y divide-slate-700 max-h-40 overflow-y-auto">
                                    {cardShopList.map(s => (
                                        <button key={s.id} onClick={() => { setCardShopId(String(s.id)); setCardShopList([]); setCardShopSearch(`[#${s.id}] ${s.nickname || s.name}`); setSelectedShopData({ nickname: s.nickname || s.name, region: s.region }); toast.success(`${s.nickname || s.name} 선택됨`); }}
                                            className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-slate-700 text-left transition-colors">
                                            <span className="text-sm text-white font-bold">{s.nickname || s.name}</span>
                                            <span className="text-xs text-slate-400">{s.region} · #{s.id}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                            {cardShopId && (
                                <p className="text-xs text-emerald-400 font-bold">✅ Shop ID {cardShopId} 선택됨</p>
                            )}
                        </div>
                    )}

                    {/* 수동 입력 모드 */}
                    {cardMode === 'manual' && (
                        <div className="grid grid-cols-2 gap-3">
                            {[
                                { key: 'nickname',    label: '업소별칭', placeholder: '10자 이내 권장' },
                                { key: 'region',      label: '지역',     placeholder: '서울-강남구' },
                                { key: 'subRegion',   label: '부지역',   placeholder: '강남역 인근' },
                                { key: 'phone',       label: '전화번호', placeholder: '010-0000-0000' },
                                { key: 'title',       label: '공고제목', placeholder: '이번 주 신규 모집' },
                                { key: 'category',    label: '업종',     placeholder: '룸웨이터' },
                                { key: 'categorySub', label: '세부업종', placeholder: '풀살롱' },
                                { key: 'pay',         label: '급여',     placeholder: '300000' },
                            ].map(f => (
                                <div key={f.key}>
                                    <label className="text-xs text-slate-500 font-bold mb-1 block">{f.label}</label>
                                    <input value={(cardFields as any)[f.key]} onChange={e => setCardFields(prev => ({ ...prev, [f.key]: e.target.value }))}
                                        placeholder={f.placeholder}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-pink-500" />
                                </div>
                            ))}
                            <div>
                                <label className="text-xs text-slate-500 font-bold mb-1 block">나이 범위</label>
                                <div className="flex gap-2">
                                    <input value={cardFields.ageMin} onChange={e => setCardFields(p => ({ ...p, ageMin: e.target.value }))} placeholder="20" className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-pink-500" />
                                    <span className="text-slate-500 self-center">~</span>
                                    <input value={cardFields.ageMax} onChange={e => setCardFields(p => ({ ...p, ageMax: e.target.value }))} placeholder="40" className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-pink-500" />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs text-slate-500 font-bold mb-1 block">급여 방식</label>
                                <select value={cardFields.payType} onChange={e => setCardFields(p => ({ ...p, payType: e.target.value }))} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white">
                                    {['일급','시급','TC','월급','면접후결정'].map(t => <option key={t}>{t}</option>)}
                                </select>
                            </div>
                            <div className="col-span-2">
                                <label className="text-xs text-slate-500 font-bold mb-1 block">키워드 (Row 3, 쉼표 구분 — 비우면 자동 생성)</label>
                                <input value={cardFields.keywords} onChange={e => setCardFields(p => ({ ...p, keywords: e.target.value }))}
                                    placeholder="당일지급, 초보환영, 숙식제공 (비우면 지역+업종 자동 생성)"
                                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-pink-500" />
                            </div>
                        </div>
                    )}

                    {/* 템플릿 선택 */}
                    <div>
                        <label className="text-xs text-slate-500 font-bold mb-2 block">템플릿</label>
                        <div className="flex gap-2">
                            {(['A','B','C','D'] as const).map(t => (
                                <button key={t} onClick={() => setCardTemplate(t)}
                                    className={`flex-1 py-3 rounded-xl font-black text-sm transition-colors ${cardTemplate === t ? 'bg-pink-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>
                                    {t === 'A' ? '기본형' : t === 'B' ? '강조형' : t === 'C' ? '프리미엄' : '미니멀'}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* 배경 팔레트 */}
                    <div>
                        <label className="text-xs text-slate-500 font-bold mb-2 block">배경 ({cardBg})</label>
                        <div className="flex flex-wrap gap-2">
                            {CARD_BG_PALETTE.map(p => (
                                <button key={p.key} onClick={() => setCardBg(p.key)} title={p.label}
                                    className={`w-8 h-8 rounded-full transition-all ${cardBg === p.key ? 'ring-2 ring-pink-400 ring-offset-2 ring-offset-slate-900 scale-110' : 'hover:scale-105'}`}
                                    style={{ background: p.preview }} />
                            ))}
                        </div>
                    </div>

                    {/* 생성 / 다운로드 버튼 */}
                    <div className="flex gap-3">
                        <button onClick={handleCardPreview}
                            className="flex-1 flex items-center justify-center gap-2 py-3 bg-pink-600 hover:bg-pink-500 rounded-xl font-black text-white transition-colors">
                            <ImageIcon size={15} /> 미리보기 생성
                        </button>
                        {cardPreviewUrl && (
                            <button onClick={handleCardDownload}
                                className="flex items-center gap-2 px-5 py-3 bg-emerald-600 hover:bg-emerald-500 rounded-xl font-black text-white transition-colors shadow-lg shadow-emerald-500/20">
                                <Download size={15} /> PNG 저장
                            </button>
                        )}
                    </div>

                    {/* 미리보기 */}
                    {cardPreviewUrl && (
                        <div className="space-y-2">
                            <p className="text-xs text-slate-500 font-bold">미리보기 (실제 PNG 1080×1080)</p>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={cardPreviewUrl} alt="광고카드 미리보기" className="w-full rounded-2xl border border-slate-700" />
                        </div>
                    )}
                </div>

                {/* 전략 가이드 */}
                <div className="bg-slate-900/50 rounded-2xl border border-slate-800/50 p-5">
                    <h2 className="font-black text-sm text-slate-400 mb-3">📌 운영 전략</h2>
                    <div className="space-y-2 text-xs text-slate-500">
                        <p>• <strong className="text-slate-400">포화 해시태그 금지</strong> — #야간알바 #남성유흥알바는 10분 내 피드에서 묻힘</p>
                        <p>• <strong className="text-slate-400">롱테일 해시태그 사용</strong> — #강남룸웨이터 #수원텐카페 등 지역+업종 조합</p>
                        <p>• <strong className="text-slate-400">정보성 콘텐츠 우선</strong> — 구인공고 직접 노출보다 팁/시세 정보가 제재 리스크 낮음</p>
                        <p>• <strong className="text-slate-400">일 4회 자동 발행</strong> — 08:00 / 12:00 / 18:00 / 22:00 KST</p>
                    </div>
                </div>

            </div>
        </div>
    );
}
