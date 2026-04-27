/**
 * [광고카드 이미지 생성기] /api/card/generate
 *
 * ✅ Node.js runtime 사용 (Edge runtime → resvg-wasm 불안정 → 0 bytes 현상)
 * ✅ 폰트: fs.readFileSync → public/fonts/NotoSansKR-Bold-Korean.woff2 (외부 CDN 의존 없음)
 * ✅ DB: supabase-js (Node.js 호환)
 *
 * Satori CSS 제약 (변경 불가):
 *   - overflow:hidden 금지
 *   - border 단축형 금지 → borderWidth/Style/Color 개별 사용
 *   - Fragment(<>...</>) 금지 → <div> 래퍼 사용
 *   - flex:1 → flexGrow:1
 *   - letterSpacing 반드시 문자열 ('0.5px')
 */

import { ImageResponse } from 'next/og';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Node.js runtime (Edge 아님 — resvg-wasm Edge 불안정)
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const W = 1080;
const H = 1080;
const BRAND_PINK  = '#E91E8C';
const GOLD        = '#F5C842';
const TELEGRAM_CS = '@waiterzone_cs_bot';

// ─── Supabase (Node.js runtime — supabase-js 정상 사용) ──────────────────────

function getSupabaseAdmin() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const key  = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

async function fetchShopFromDB(shopId: string): Promise<Record<string, any> | null> {
    if (!shopId) return null;
    try {
        const supabase = getSupabaseAdmin();
        const { data, error } = await supabase
            .from('shops')
            .select('id,nickname,name,region,work_region_sub,manager_phone,title,pay,pay_type,category,category_sub,options')
            .eq('id', Number(shopId))
            .single();
        if (error || !data) return null;
        return data;
    } catch {
        return null;
    }
}

// ─── 폰트 로딩 (fs.readFileSync — 100% 신뢰, 외부 네트워크 의존 없음) ─────────

function loadFont(): Buffer | null {
    try {
        // ⚠️ WOFF2 금지 — Next.js 15 번들 Satori가 'wOF2' 미지원 (Unsupported OpenType signature)
        // WOFF 포맷만 지원됨 (로컬 테스트 확인: 13206 bytes PNG 정상 생성)
        const fontPath = path.join(process.cwd(), 'public', 'fonts', 'NotoSansKR-Bold-Korean.woff');
        return fs.readFileSync(fontPath);
    } catch (e) {
        console.error('[card/generate] 폰트 로딩 실패:', e);
        return null;
    }
}

// ─── 배경 팔레트 (18종) ───────────────────────────────────────────────────────

const BG_MAP: Record<string, { bg?: string; grad?: string; dark: boolean }> = {
    white:              { bg: '#FFFFFF',  dark: false },
    'light-gray':       { bg: '#F4F4F5',  dark: false },
    beige:              { bg: '#F5F0E8',  dark: false },
    cream:              { bg: '#FFF8E7',  dark: false },
    'light-pink':       { bg: '#FFF0F5',  dark: false },
    'light-purple':     { bg: '#F8F0FF',  dark: false },
    navy:               { bg: '#1a1a2e',  dark: true  },
    black:              { bg: '#0D0D0D',  dark: true  },
    'grad-pink-purple': { grad: 'linear-gradient(135deg,#FF6B9D 0%,#9B59B6 100%)', dark: true  },
    'grad-gold-orange': { grad: 'linear-gradient(135deg,#F39C12 0%,#E74C3C 100%)', dark: true  },
    'grad-navy-blue':   { grad: 'linear-gradient(135deg,#1a1a2e 0%,#0F3460 100%)', dark: true  },
    'grad-emerald':     { grad: 'linear-gradient(135deg,#00C853 0%,#00BCD4 100%)', dark: true  },
    'grad-rose-coral':  { grad: 'linear-gradient(135deg,#FF1744 0%,#FF8A65 100%)', dark: true  },
    'grad-dark-gray':   { grad: 'linear-gradient(135deg,#2D3436 0%,#636E72 100%)', dark: true  },
    'dark-black':       { bg: '#0A0A0A',  dark: true  },
    'dark-navy':        { bg: '#0F1B35',  dark: true  },
    'dark-purple':      { bg: '#1A0A2E',  dark: true  },
    charcoal:           { bg: '#2C2C2C',  dark: true  },
};

// ─── 카드 데이터 타입 ─────────────────────────────────────────────────────────

interface CardData {
    nickname:    string;
    region:      string;
    subRegion:   string;
    phone:       string;
    title:       string;
    age:         string;
    payDisplay:  string;
    category:    string;
    categorySub: string;
    keywords:    string[];
}

// ─── 테마 ────────────────────────────────────────────────────────────────────

function makeTheme(isDark: boolean) {
    return {
        textPrimary: isDark ? '#FFFFFF'                : '#111827',
        textMuted:   isDark ? 'rgba(255,255,255,0.60)' : '#6B7280',
        pillBg:      isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.06)',
        pillBorderC: isDark ? 'rgba(255,255,255,0.22)' : 'rgba(0,0,0,0.14)',
        sectionBg:   isDark ? 'rgba(255,255,255,0.08)' : '#F3F4F6',
        dividerC:    isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.10)',
    };
}

// ─── Row3 키워드 폴백 ─────────────────────────────────────────────────────────

function buildKeywordFallback(region: string, workType: string): string[] {
    const clean   = region.replace(/[\[\]]/g, '').trim();
    const parts   = clean.split(/[-\s]+/);
    const display = parts[1] || parts[0] || '';
    return [
        `${display}${workType}알바`,
        `${display}여자남성유흥알바`,
        `${display}여자고수익알바`,
    ].filter(k => k.trim().length > 4);
}

// ─── 공통 서브 컴포넌트 ───────────────────────────────────────────────────────

function TopBar({ bg, text, textColor }: { bg: string; text: string; textColor: string }) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '14px 32px', backgroundColor: bg }}>
            <span style={{ fontSize: 22, color: textColor, fontWeight: 700 }}>{text}</span>
        </div>
    );
}

function BottomBar({ bg, textColor }: { bg: string; textColor: string }) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '14px 32px', backgroundColor: bg }}>
            <span style={{ fontSize: 19, color: textColor, fontWeight: 700 }}>
                여성 구인구직은 웨이터존 waiterzone.kr
            </span>
        </div>
    );
}

function ContactSection({ sectionBg, dividerC, textPrimary, textMuted }: {
    sectionBg: string; dividerC: string; textPrimary: string; textMuted: string;
}) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10, marginRight: 44, marginBottom: 16, marginLeft: 44, padding: '16px 24px', backgroundColor: sectionBg, borderRadius: 16 }}>
            <div style={{ display: 'flex', height: 1, backgroundColor: dividerC }} />
            {/* 좌: 웨이터존문의/@bot  ↔  우: 경고/안내 — 같은 행, 세로 중앙 정렬 */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <span style={{ fontSize: 18, color: BRAND_PINK, fontWeight: 700 }}>웨이터존문의</span>
                    <span style={{ fontSize: 22, color: BRAND_PINK, fontWeight: 800 }}>{TELEGRAM_CS}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3 }}>
                    <span style={{ fontSize: 14, color: textMuted }}>19세 미성년자 연락/출입금지</span>
                    <span style={{ fontSize: 17, color: textPrimary, fontWeight: 700 }}>&apos;웨이터존 통해 연락드렸어요&apos;라고 말씀해주세요</span>
                </div>
            </div>
        </div>
    );
}

function TitleBox({ title, sectionBg, textPrimary, fontSize = 42 }: {
    title: string; sectionBg: string; textPrimary: string; fontSize?: number;
}) {
    return (
        <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginTop: 0, marginRight: 44, marginBottom: 0, marginLeft: 44,
            padding: '24px 32px', backgroundColor: sectionBg, borderRadius: 20,
            flexGrow: 1, maxHeight: 280,
        }}>
            <span style={{ fontSize, fontWeight: 900, color: textPrimary, textAlign: 'center', lineHeight: 1.35 }}>
                {title || '신규 구인 공고'}
            </span>
        </div>
    );
}

/** 2열 정보 블록 — 라벨 + 값을 세로로 쌓는 대형 카드 */
function InfoBlock({ label, value, labelColor, valueColor, blockBg, accentBg, accent = false }: {
    label: string; value: string;
    labelColor: string; valueColor: string;
    blockBg: string; accentBg?: string; accent?: boolean;
}) {
    const bg = accent && accentBg ? accentBg : blockBg;
    return (
        <div style={{
            display: 'flex', flexDirection: 'column', flexGrow: 1, flexBasis: '0',
            padding: '14px 20px', backgroundColor: bg, borderRadius: 14, gap: 3,
        }}>
            <span style={{ fontSize: 17, color: labelColor, fontWeight: 600 }}>{label}</span>
            <span style={{ fontSize: 26, color: valueColor, fontWeight: 800, lineHeight: 1.2 }}>{value || '—'}</span>
        </div>
    );
}

/** 해시태그 키워드 한 줄 row */
function KwRow({ keywords, pillBg, textColor }: { keywords: string[]; pillBg: string; textColor: string }) {
    if (!keywords.length) return null;
    return (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'nowrap', marginTop: 0, marginRight: 44, marginBottom: 0, marginLeft: 44 }}>
            {keywords.slice(0, 5).map((kw, i) => (
                <div key={i} style={{ display: 'flex', padding: '6px 18px', backgroundColor: pillBg, borderRadius: 100 }}>
                    <span style={{ fontSize: 17, color: textColor, fontWeight: 600 }}>{`#${kw.replace(/^#/, '')}`}</span>
                </div>
            ))}
        </div>
    );
}

// ─── 템플릿 렌더링 ───────────────────────────────────────────────────────────

function renderCard(data: CardData, template: string, bgKey: string) {
    const bgDef = BG_MAP[bgKey] ?? BG_MAP.white;
    const { dark: isDark } = bgDef;
    const t   = makeTheme(isDark);
    const rootStyle: React.CSSProperties = bgDef.grad
        ? { display: 'flex', flexDirection: 'column', width: W, height: H, backgroundImage: bgDef.grad }
        : { display: 'flex', flexDirection: 'column', width: W, height: H, backgroundColor: bgDef.bg ?? '#FFFFFF' };

    const WATERMARK = '여성 구인구직은 웨이터존 waiterzone.kr';

    // 지역 한 줄 표시 (region · subRegion)
    const regionLine = data.region + (data.subRegion ? ` · ${data.subRegion}` : '');

    // InfoBlock 공통 색상
    const ibLabelColor = t.textMuted;
    const ibValueColor = t.textPrimary;
    const ibBg         = t.sectionBg;
    const ibAccentBg   = isDark ? 'rgba(233,30,140,0.22)' : 'rgba(233,30,140,0.09)';

    // ── Template A: 기본형 ────────────────────────────────────────────────────
    if (template === 'A') {
        return (
            <div style={rootStyle}>
                <TopBar bg={BRAND_PINK} text={WATERMARK} textColor="#FFFFFF" />

                {/* 헤더: 업체명 + 지역·연락처 */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '28px 44px 18px' }}>
                    <span style={{ fontSize: 66, fontWeight: 900, color: t.textPrimary }}>{data.nickname}</span>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                        <span style={{ fontSize: 22, fontWeight: 700, color: t.textPrimary }}>{regionLine}</span>
                        {data.phone
                            ? <span style={{ fontSize: 26, color: BRAND_PINK, fontWeight: 800 }}>{data.phone}</span>
                            : null}
                    </div>
                </div>

                {/* 공고 제목 박스 */}
                <TitleBox title={data.title} sectionBg={t.sectionBg} textPrimary={t.textPrimary} />

                {/* 정보 블록 2열 */}
                <div style={{ display: 'flex', flexDirection: 'column', padding: '16px 44px 10px', gap: 10 }}>
                    <div style={{ display: 'flex', gap: 10 }}>
                        <InfoBlock label="나이" value={data.age} labelColor={ibLabelColor} valueColor={ibValueColor} blockBg={ibBg} />
                        <InfoBlock label="급여" value={data.payDisplay} labelColor={ibLabelColor} valueColor={BRAND_PINK} blockBg={ibBg} accentBg={ibAccentBg} accent />
                    </div>
                    <div style={{ display: 'flex', gap: 10 }}>
                        <InfoBlock label="업종" value={data.category} labelColor={ibLabelColor} valueColor={ibValueColor} blockBg={ibBg} />
                        <InfoBlock label="세부업종" value={data.categorySub} labelColor={ibLabelColor} valueColor={ibValueColor} blockBg={ibBg} />
                    </div>
                </div>

                {/* 해시태그 키워드 */}
                <KwRow keywords={data.keywords} pillBg={t.pillBg} textColor={t.textMuted} />

                <ContactSection sectionBg={t.sectionBg} dividerC={t.dividerC} textPrimary={t.textPrimary} textMuted={t.textMuted} />
                <BottomBar bg={isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)'} textColor={t.textMuted} />
            </div>
        );
    }

    // ── Template B: 강조형 (급여 대형) ────────────────────────────────────────
    if (template === 'B') {
        return (
            <div style={rootStyle}>
                <TopBar bg={BRAND_PINK} text={WATERMARK} textColor="#FFFFFF" />

                {/* 헤더 */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '26px 44px 16px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <span style={{ fontSize: 62, fontWeight: 900, color: t.textPrimary }}>{data.nickname}</span>
                        <span style={{ fontSize: 22, color: t.textMuted }}>{regionLine}</span>
                    </div>
                    {data.phone
                        ? <div style={{ display: 'flex', padding: '12px 28px', backgroundColor: BRAND_PINK, borderRadius: 100 }}>
                            <span style={{ fontSize: 26, color: '#fff', fontWeight: 800 }}>{data.phone}</span>
                          </div>
                        : null}
                </div>

                {/* 급여 대형 배너 */}
                {data.payDisplay
                    ? <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 0, marginRight: 44, marginBottom: 0, marginLeft: 44, padding: '18px 32px', backgroundColor: BRAND_PINK, borderRadius: 18 }}>
                        <span style={{ fontSize: 38, color: '#FFFFFF', fontWeight: 900 }}>{data.payDisplay}</span>
                      </div>
                    : null}

                {/* 공고 제목 */}
                <TitleBox title={data.title} sectionBg={t.sectionBg} textPrimary={t.textPrimary} fontSize={40} />

                {/* 정보 블록 */}
                <div style={{ display: 'flex', flexDirection: 'column', padding: '14px 44px 10px', gap: 10 }}>
                    <div style={{ display: 'flex', gap: 10 }}>
                        <InfoBlock label="나이" value={data.age} labelColor={ibLabelColor} valueColor={ibValueColor} blockBg={ibBg} />
                        <InfoBlock label="업종" value={data.category} labelColor={ibLabelColor} valueColor={ibValueColor} blockBg={ibBg} />
                        <InfoBlock label="세부업종" value={data.categorySub} labelColor={ibLabelColor} valueColor={ibValueColor} blockBg={ibBg} />
                    </div>
                </div>

                <KwRow keywords={data.keywords} pillBg={t.pillBg} textColor={t.textMuted} />
                <ContactSection sectionBg={t.sectionBg} dividerC={t.dividerC} textPrimary={t.textPrimary} textMuted={t.textMuted} />
                <BottomBar bg={isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)'} textColor={t.textMuted} />
            </div>
        );
    }

    // ── Template C: 프리미엄 (골드) ───────────────────────────────────────────
    if (template === 'C') {
        return (
            <div style={rootStyle}>
                <TopBar bg={GOLD} text="[ 여성 구인구직은 웨이터존 waiterzone.kr ]" textColor="#1a1a2e" />

                {/* 헤더 */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '28px 44px 16px' }}>
                    <span style={{ fontSize: 64, fontWeight: 900, color: t.textPrimary }}>{data.nickname}</span>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                        <span style={{ fontSize: 22, fontWeight: 700, color: t.textPrimary }}>{regionLine}</span>
                        {data.phone ? <span style={{ fontSize: 26, color: GOLD, fontWeight: 800 }}>{data.phone}</span> : null}
                    </div>
                </div>

                <div style={{ display: 'flex', height: 3, backgroundColor: GOLD, marginTop: 0, marginRight: 44, marginBottom: 0, marginLeft: 44 }} />

                <TitleBox title={data.title} sectionBg={t.sectionBg} textPrimary={t.textPrimary} fontSize={40} />

                {/* 정보 블록 (골드 테마) */}
                <div style={{ display: 'flex', flexDirection: 'column', padding: '16px 44px 10px', gap: 10 }}>
                    <div style={{ display: 'flex', gap: 10 }}>
                        <InfoBlock label="나이" value={data.age} labelColor={ibLabelColor} valueColor={ibValueColor} blockBg={ibBg} />
                        <InfoBlock label="급여" value={data.payDisplay} labelColor={'#1a1a2e'} valueColor={'#1a1a2e'} blockBg={GOLD} />
                    </div>
                    <div style={{ display: 'flex', gap: 10 }}>
                        <InfoBlock label="업종" value={data.category} labelColor={ibLabelColor} valueColor={ibValueColor} blockBg={ibBg} />
                        <InfoBlock label="세부업종" value={data.categorySub} labelColor={ibLabelColor} valueColor={ibValueColor} blockBg={ibBg} />
                    </div>
                </div>

                <KwRow keywords={data.keywords} pillBg={t.pillBg} textColor={t.textMuted} />
                <ContactSection sectionBg={t.sectionBg} dividerC={t.dividerC} textPrimary={t.textPrimary} textMuted={t.textMuted} />
                <TopBar bg={GOLD} text="[ 여성 구인구직은 웨이터존 waiterzone.kr ]" textColor="#1a1a2e" />
            </div>
        );
    }

    // ── Template D: 미니멀 ────────────────────────────────────────────────────
    return (
        <div style={rootStyle}>
            <TopBar bg={BRAND_PINK} text={WATERMARK} textColor="#FFFFFF" />

            {/* 헤더 — 중앙 정렬 */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '36px 52px 20px', gap: 8 }}>
                <span style={{ fontSize: 68, fontWeight: 900, color: t.textPrimary }}>{data.nickname}</span>
                <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                    <span style={{ fontSize: 22, color: t.textMuted }}>{regionLine}</span>
                    {data.phone ? <span style={{ fontSize: 24, color: BRAND_PINK, fontWeight: 800 }}>{data.phone}</span> : null}
                </div>
            </div>

            <div style={{ display: 'flex', height: 2, backgroundColor: t.dividerC, marginTop: 0, marginRight: 80, marginBottom: 0, marginLeft: 80 }} />

            {/* 타이틀 — 중앙 */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexGrow: 1, maxHeight: 260, padding: '28px 80px' }}>
                <span style={{ fontSize: 44, fontWeight: 900, color: t.textPrimary, textAlign: 'center', lineHeight: 1.35 }}>
                    {data.title || '신규 구인 공고'}
                </span>
            </div>

            <div style={{ display: 'flex', height: 2, backgroundColor: t.dividerC, marginTop: 0, marginRight: 80, marginBottom: 0, marginLeft: 80 }} />

            {/* 정보 블록 — 중앙 */}
            <div style={{ display: 'flex', flexDirection: 'column', padding: '14px 60px 10px', gap: 10 }}>
                <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                    <InfoBlock label="나이" value={data.age} labelColor={ibLabelColor} valueColor={ibValueColor} blockBg={ibBg} />
                    <InfoBlock label="급여" value={data.payDisplay} labelColor={ibLabelColor} valueColor={BRAND_PINK} blockBg={ibBg} accentBg={ibAccentBg} accent />
                    <InfoBlock label="업종" value={data.category} labelColor={ibLabelColor} valueColor={ibValueColor} blockBg={ibBg} />
                </div>
            </div>

            <KwRow keywords={data.keywords} pillBg={t.pillBg} textColor={t.textMuted} />
            <ContactSection sectionBg={t.sectionBg} dividerC={t.dividerC} textPrimary={t.textPrimary} textMuted={t.textMuted} />
            <BottomBar bg={isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)'} textColor={t.textMuted} />
        </div>
    );
}

// ─── 카드 데이터 빌드 ─────────────────────────────────────────────────────────

function buildCardData(params: URLSearchParams, shop?: Record<string, any>): CardData {
    const src = shop ?? {};

    const rawNick   = (src.nickname || params.get('nickname') || src.name || params.get('name') || '업체명').trim();
    const nickname  = rawNick.length > 10 ? rawNick.slice(0, 10) + '...' : rawNick;
    const region    = (src.region          || params.get('region')    || '').replace(/[\[\]]/g, '').trim();
    const subRegion = (src.work_region_sub || params.get('subRegion') || '').trim();
    const phone     = (src.manager_phone   || params.get('phone')     || '').trim();
    const title     = (src.title           || params.get('title')     || '').trim();

    const ageMin = String(src.options?.ageMin || params.get('ageMin') || '');
    const ageMax = String(src.options?.ageMax || params.get('ageMax') || '');
    const age    = ageMin && ageMax ? `${ageMin}~${ageMax}세` : ageMin ? `${ageMin}세 이상` : '';

    const payType = src.pay_type || params.get('payType') || '';
    const payRaw  = String(src.pay || params.get('pay') || '').trim();
    const payNum  = Number(payRaw.replace(/[^0-9]/g, ''));
    const payDisplay = payRaw
        ? payRaw === '면접후결정'
            ? '면접 후 결정+α'
            : `${payType ? payType + ' ' : ''}${isNaN(payNum) || payNum === 0 ? payRaw : payNum.toLocaleString() + '원'}+α`
        : '';

    const category    = (src.category     || params.get('category')    || '').trim();
    const categorySub = (src.category_sub || params.get('categorySub') || '').trim();

    const paySuffixes: string[] = Array.isArray(src.options?.paySuffixes) ? src.options.paySuffixes
        : (params.get('paySuffixes') || '').split(',').map((s: string) => s.trim()).filter(Boolean);
    const optKws: string[] = Array.isArray(src.options?.keywords) ? src.options.keywords
        : (params.get('keywords') || '').split(',').map((s: string) => s.trim()).filter(Boolean);
    const userKws = [...paySuffixes, ...optKws].filter(Boolean);
    const workType = src.category || params.get('workType') || '룸웨이터';
    const keywords = userKws.length > 0 ? userKws : buildKeywordFallback(region, workType);

    return { nickname, region, subRegion, phone, title, age, payDisplay, category, categorySub, keywords };
}

// ─── Route Handler ────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
    const { searchParams } = request.nextUrl;
    const shopId   = searchParams.get('shopId')    ?? '';
    const template = (searchParams.get('template') ?? 'A').toUpperCase();
    const bg       = searchParams.get('bg')         ?? 'white';

    // 폰트 로딩 (fs.readFileSync — 동기, 100% 신뢰)
    const fontBuffer = loadFont();
    if (!fontBuffer) {
        return NextResponse.json({ error: '폰트 로딩 실패 — public/fonts/NotoSansKR-Bold-Korean.woff2 확인 필요' }, { status: 500 });
    }

    // DB 조회
    const shopData = shopId ? await fetchShopFromDB(shopId) : null;
    const cardData = buildCardData(searchParams, shopData ?? undefined);

    const fonts = [{
        name: 'NotoSansKR',
        data: fontBuffer,
        weight: 700 as const,
        style: 'normal' as const,
    }];

    try {
        return new ImageResponse(
            renderCard(cardData, template, bg),
            { width: W, height: H, fonts }
        );
    } catch (err: any) {
        console.error('[card/generate] Satori 렌더링 실패:', err?.message ?? err);
        return NextResponse.json(
            { error: 'Satori 렌더링 실패', detail: err?.message ?? String(err) },
            { status: 500 }
        );
    }
}
