'use client';

import { useState, useRef, useEffect } from 'react';
import { DETAILED_PRICING } from './constants';
import { ICONS } from '@/constants/job-options';

// [Total Reset] Robust Helper
const getValid = (v1: any, v2: any, defaultValue: any = '') => {
    const invalidValues = [null, undefined, '', 0, '0', '지역', '업종', '시급', '급여방식선택', '자유직종', '정보없음'];
    if (!invalidValues.includes(v1)) return v1;
    if (!invalidValues.includes(v2)) return v2;
    return defaultValue;
};

// ─── sessionStorage 드래프트 헬퍼 ───────────────────────────────────────────
// 목적: 탭 전환/Suspense 리마운트/탭 Discard 등으로 컴포넌트가 재생성되어도 폼 복구
const DRAFT_KEY = 'coco_ad_form_draft';

// userId를 넘기면 다른 사용자의 draft는 자동 파기 (상호명 등 타 계정 데이터 오염 방지)
const loadDraft = (userId?: string): Record<string, any> | null => {
    try {
        if (typeof window === 'undefined') return null;
        const raw = sessionStorage.getItem(DRAFT_KEY);
        if (!raw) return null;
        const d = JSON.parse(raw);
        if (!d?._active) return null;
        // userId가 있으면 draft 소유자 검증 — 다른 사용자 draft는 파기
        if (userId && d._userId && d._userId !== userId) {
            sessionStorage.removeItem(DRAFT_KEY);
            return null;
        }
        return d;
    } catch { return null; }
};

const saveDraft = (data: Record<string, any>, userId?: string) => {
    try {
        if (typeof window === 'undefined') return;
        sessionStorage.setItem(DRAFT_KEY, JSON.stringify({
            ...data,
            _active: true,
            ...(userId ? { _userId: userId } : {}),
        }));
    } catch {}
};

const clearDraft = () => {
    try {
        if (typeof window !== 'undefined') sessionStorage.removeItem(DRAFT_KEY);
    } catch {}
};
// ────────────────────────────────────────────────────────────────────────────

export function useAdFormState(userId?: string) {
    // --- Lazy 초기화: 컴포넌트 리마운트 시 sessionStorage 드래프트로 폼 복원 ---
    // userId가 있으면 다른 사용자의 draft는 자동 파기
    const draft = loadDraft(userId);

    // --- Form States ---
    const [shopName, setShopName] = useState(() => draft?.shopName || '');
    const [shopAddress, setShopAddress] = useState(() => draft?.shopAddress || '');
    const [isVerified, setIsVerified] = useState(false);
    const [nickname, setNickname] = useState(() => draft?.nickname || '');

    // Manager Info
    const [managerName, setManagerName] = useState(() => draft?.managerName || '');
    const [managerPhone, setManagerPhone] = useState(() => draft?.managerPhone || '');
    const [messengers, setMessengers] = useState(() => draft?.messengers || { kakao: '', line: '', telegram: '' });

    // Recruitment Info
    const [title, setTitle] = useState(() => draft?.title || '');

    // Region
    const [regionCity, setRegionCity] = useState(() => draft?.regionCity || '');
    const [regionGu, setRegionGu] = useState(() => draft?.regionGu || '');
    const [addressDetail, setAddressDetail] = useState(() => draft?.addressDetail || '');

    // Industry
    const [industryMain, setIndustryMain] = useState(() => draft?.industryMain || '');
    const [industrySub, setIndustrySub] = useState(() => draft?.industrySub || '');

    // Age
    const [ageMin, setAgeMin] = useState(() => draft?.ageMin ?? 20);
    const [ageMax, setAgeMax] = useState(() => draft?.ageMax ?? 35);

    // Pay
    const [payType, setPayType] = useState(() => draft?.payType || '급여방식선택');
    const [payAmount, setPayAmount] = useState(() => draft?.payAmount || '0');
    const [mediaUrl, setMediaUrl] = useState(() => draft?.mediaUrl || '');

    const [selectedKeywords, setSelectedKeywords] = useState<string[]>(() => draft?.selectedKeywords || []);

    // Editor State
    const editorRef = useRef<HTMLDivElement>(null);
    const selectionRange = useRef<Range | null>(null);
    const [isEditorDirty, setIsEditorDirty] = useState(() => !!(draft?.editorHtml));
    const [editorHtml, setEditorHtml] = useState(() => draft?.editorHtml || '');

    // 드래프트 editorHtml → editorRef DOM에 복원 (ref는 lazy 초기화 불가 → useEffect로 처리)
    useEffect(() => {
        if (draft?.editorHtml && editorRef.current && !editorRef.current.innerHTML) {
            editorRef.current.innerHTML = draft.editorHtml;
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const [toolbarStatus, setToolbarStatus] = useState({
        isBold: false,
        isItalic: false,
        isUnderline: false,
        textAlign: 'left',
        currentFont: 'Pretendard',
        currentFontSize: '16px',
        currentForeColor: '#000000',
        currentHiliteColor: 'transparent'
    });

    const [showFontMenu, setShowFontMenu] = useState(false);
    const [showFontSizeMenu, setShowFontSizeMenu] = useState(false);
    const [showForeColorMenu, setShowForeColorMenu] = useState(false);
    const [showHiliteColorMenu, setShowHiliteColorMenu] = useState(false);
    const [showEmojiMenu, setShowEmojiMenu] = useState(false);

    // Sync Editor HTML
    const syncEditorHtml = () => {
        if (editorRef.current) {
            setEditorHtml(editorRef.current.innerHTML);
            setIsEditorDirty(true);
        }
    };

    // Update Toolbar Status based on selection
    const updateToolbarStatus = () => {
        const sel = window.getSelection();
        let fontSize = '16px';
        let foreColor = '#000000';
        let hiliteColor = 'transparent';
        let fontName = 'Pretendard';

        if (sel && sel.rangeCount > 0) {
            const range = sel.getRangeAt(0);
            const parent = range.commonAncestorContainer.nodeType === 1
                ? range.commonAncestorContainer as HTMLElement
                : range.commonAncestorContainer.parentElement;

            if (parent) {
                const style = window.getComputedStyle(parent);
                fontSize = parent.style.fontSize || style.fontSize;
                foreColor = parent.style.color || style.color;
                // 배경색은 여러 속성이 가능하므로 실젯값 확인
                hiliteColor = parent.style.backgroundColor || style.backgroundColor;
                fontName = (parent.style.fontFamily || style.fontFamily).replace(/"/g, '').split(',')[0];
            }
        }

        setToolbarStatus({
            isBold: document.queryCommandState('bold'),
            isItalic: document.queryCommandState('italic'),
            isUnderline: document.queryCommandState('underline'),
            textAlign: document.queryCommandValue('justifyLeft') === 'true' ? 'left' :
                document.queryCommandValue('justifyCenter') === 'true' ? 'center' :
                    document.queryCommandValue('justifyRight') === 'true' ? 'right' : 'left',
            currentFont: fontName || 'Pretendard',
            currentFontSize: fontSize || '16px',
            currentForeColor: foreColor || '#000000',
            currentHiliteColor: hiliteColor || 'transparent'
        });
    };

    const saveSelection = () => {
        const sel = window.getSelection();
        if (sel && sel.rangeCount > 0) {
            // [Fix] cloneRange() — live reference 저장 시 removeAllRanges() 후 무효화 방지 (2026-03-22)
            selectionRange.current = sel.getRangeAt(0).cloneRange();
        }
    };

    const restoreSelection = () => {
        if (selectionRange.current) {
            const sel = window.getSelection();
            if (sel) {
                sel.removeAllRanges();
                sel.addRange(selectionRange.current);
            }
        }
    };

    // Ad Selection (lazy 초기화로 드래프트 복원)
    const [selectedAdProduct, setSelectedAdProduct] = useState<string | null>(() => draft?.selectedAdProduct || null);
    const [selectedAdPeriod, setSelectedAdPeriod] = useState<30 | 60 | 90>(() => draft?.selectedAdPeriod || 30);
    const [selectedIcon, setSelectedIcon] = useState<number | null>(() => draft?.selectedIcon || null);
    const [iconPeriod, setIconPeriod] = useState<30 | 60 | 90 | 0>(() => draft?.iconPeriod || 0);
    const [selectedHighlighter, setSelectedHighlighter] = useState<number | null>(() => draft?.selectedHighlighter || null);
    const [highlighterPeriod, setHighlighterPeriod] = useState<30 | 60 | 90 | 0>(() => draft?.highlighterPeriod || 0);
    const [paySuffixes, setPaySuffixes] = useState<string[]>(() => draft?.paySuffixes || []);
    const [borderOption, setBorderOption] = useState<'none' | 'color' | 'glow' | 'sparkle' | 'rainbow'>(() => draft?.borderOption || 'none');
    const [borderPeriod, setBorderPeriod] = useState<30 | 60 | 90 | 0>(() => draft?.borderPeriod || 0);
    const [totalAmount, setTotalAmount] = useState(0);

    const resetAdStates = () => {
        clearDraft(); // [Fix] 저장/리셋 시 드래프트 삭제
        setShopName('');
        setIsVerified(false);
        setNickname('');
        setManagerName('');
        setManagerPhone('');
        setMessengers({ kakao: '', line: '', telegram: '' });
        setTitle('');
        setRegionCity('');
        setRegionGu('');
        setAddressDetail('');
        setIndustryMain('');
        setIndustrySub('');
        setAgeMin(20);
        setAgeMax(35);
        setPayType('급여방식선택');
        setPayAmount('0');
        setMediaUrl('');
        setSelectedKeywords([]);

        // Editor Reset
        setIsEditorDirty(false);
        setEditorHtml('');
        if (editorRef.current) {
            editorRef.current.innerHTML = '';
        }

        // [Fix] Reset all paid options to StandardsGuard defaults to ensure clean UI
        setSelectedAdProduct(null);
        setSelectedAdPeriod(30);
        setSelectedIcon(null);
        setIconPeriod(0);
        setSelectedHighlighter(null);
        setHighlighterPeriod(0);
        setPaySuffixes([]);
        setBorderOption('none');
        setBorderPeriod(0);
        setTotalAmount(0);
    };

    // Total Amount Calculation
    useEffect(() => {
        let total = 0;
        if (selectedAdProduct) {
            const product = DETAILED_PRICING.find(p => p.id === selectedAdProduct);
            if (product) {
                const key = `d${selectedAdPeriod}` as keyof typeof product;
                total += product[key] as number;
            }
        }
        if (selectedIcon && iconPeriod > 0) {
            total += iconPeriod === 30 ? 30000 : iconPeriod === 60 ? 55000 : 70000;
        }
        if (selectedHighlighter && highlighterPeriod > 0) {
            total += highlighterPeriod === 30 ? 30000 : highlighterPeriod === 60 ? 55000 : 70000;
        }
        if (borderOption !== 'none' && borderPeriod > 0) {
            total += borderPeriod === 30 ? 30000 : borderPeriod === 60 ? 55000 : 70000;
        }
        if (paySuffixes.length > 1) {
            total += (paySuffixes.length - 1) * 5000;
        }
        setTotalAmount(total);
    }, [selectedAdProduct, selectedAdPeriod, selectedIcon, iconPeriod, selectedHighlighter, highlighterPeriod, paySuffixes, borderOption, borderPeriod]);

    const isDirty = (
        shopName !== '' ||
        managerName !== '' ||
        managerPhone !== '' ||
        messengers.kakao !== '' || messengers.line !== '' || messengers.telegram !== '' ||
        title !== '' ||
        industryMain !== '' ||
        industrySub !== '' ||
        ageMin !== 20 ||
        ageMax !== 35 ||
        regionCity !== '' ||
        regionGu !== '' ||
        payType !== '급여방식선택' ||
        payAmount !== '0' ||
        isEditorDirty ||
        selectedKeywords.length > 0 ||
        selectedAdProduct !== null ||
        selectedAdPeriod !== 30 ||
        paySuffixes.length > 0 ||
        borderOption !== 'none' ||
        selectedIcon !== null ||
        selectedHighlighter !== null
    );

    // [Fix] 폼이 dirty할 때 sessionStorage에 자동 저장 (탭 전환/리마운트 후 복원용)
    // 300ms 디바운스: 한글 IME 조합 문자가 확정되기 전에 저장되는 문제 방지
    const draftTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    useEffect(() => {
        if (!isDirty) return;
        if (draftTimerRef.current) clearTimeout(draftTimerRef.current);
        draftTimerRef.current = setTimeout(() => {
            saveDraft({
                shopName, shopAddress, nickname, managerName, managerPhone, messengers,
                title, regionCity, regionGu, addressDetail,
                industryMain, industrySub, ageMin, ageMax,
                payType, payAmount, mediaUrl, selectedKeywords,
                editorHtml,
                selectedAdProduct, selectedAdPeriod,
                selectedIcon, iconPeriod,
                selectedHighlighter, highlighterPeriod,
                paySuffixes, borderOption, borderPeriod,
            }, userId);
        }, 300);
        return () => { if (draftTimerRef.current) clearTimeout(draftTimerRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        shopName, shopAddress, nickname, managerName, managerPhone, messengers,
        title, regionCity, regionGu, addressDetail,
        industryMain, industrySub, ageMin, ageMax,
        payType, payAmount, mediaUrl, selectedKeywords,
        editorHtml,
        selectedAdProduct, selectedAdPeriod,
        selectedIcon, iconPeriod,
        selectedHighlighter, highlighterPeriod,
        paySuffixes, borderOption, borderPeriod,
    ]);

    const loadAdData = (ad: any) => {
        if (!ad) return;
        // [Fix] 기존 광고 수정 시 이전 세션 드래프트가 덮어쓰는 버그 방지
        // 드래프트는 신규 등록용 — 기존 광고 수정은 항상 DB 데이터를 기준으로 시작
        clearDraft();

        const opts = ad.options || {};

        // [Total Reset] Robust Loading Logic using getValid
        const norm = {
            shopName: getValid(ad.name || ad.shopName, opts.shopName, '상호명 없음'),
            nickname: getValid(ad.nickname, opts.nickname, ''),
            managerName: getValid(ad.manager_name || ad.managerName, opts.managerName, ''),
            managerPhone: getValid(ad.manager_phone || ad.phone || ad.managerPhone, opts.managerPhone, ''),
            kakao: getValid(ad.kakao_id || ad.kakao, opts.kakao || opts.messengers?.kakao, ''),
            telegram: getValid(ad.telegram_id || ad.telegram, opts.telegram || opts.messengers?.telegram, ''),
            line: getValid(ad.line_id || ad.line, opts.line || opts.messengers?.line, ''),
            content: getValid(ad.content, opts.content || opts.editorHtml || ad.jobContent, ''),
            title: getValid(ad.title, opts.title || ad.jobTitle, ''),
            regionCity: getValid(ad.region || ad.regionCity || ad.work_region, opts.regionCity, ''),
            regionGu: getValid(ad.regionGu || ad.work_region_sub, opts.regionGu, ''),
            addressDetail: getValid(ad.work_address || ad.addressDetail, opts.addressDetail, ''),
            category: getValid(ad.category || ad.industryMain, opts.category, ''),
            industrySub: getValid(ad.category_sub || ad.categorySub, opts.categorySub || opts.industrySub, ''),
            payType: getValid(ad.pay_type || ad.payType, opts.payType, '급여방식선택'),
            payAmount: String(getValid(ad.pay_amount || ad.payAmount || ad.pay, opts.payAmount, '0')),
            ageMin: ad.age_min || ad.ageMin || opts.ageMin || 20,
            ageMax: ad.age_max || ad.ageMax || opts.ageMax || 35,
            mediaUrl: getValid(ad.media_url || ad.mediaUrl, opts.mediaUrl || opts.media_url, ''),
            keywords: opts.keywords || ad.keywords || [],
            productType: ad.tier || ad.productType || opts.product_type || ad.ad_type || null,
            productPeriod: opts.product_period || ad.productPeriod || 30,
            icon: (() => {
                const raw = opts.icon || ad.icon || null;
                if (!raw) return null;
                // [Fix] 이모지 문자열 → 숫자 ID 정규화 (레거시 DB 데이터 호환)
                const found = ICONS.find(i => String(i.id) === String(raw) || i.icon === String(raw));
                return found ? found.id : null;
            })(),
            icon_period: opts.icon_period || ad.icon_period || 0,
            highlighter: opts.highlighter || ad.highlighter || null,
            highlighter_period: opts.highlighter_period || ad.highlighter_period || 0,
            border: opts.border || opts.border_option || ad.border || 'none',
            border_period: opts.border_period || ad.border_period || 0,
            pay_suffixes: opts.pay_suffixes || opts.paySuffixes || ad.pay_suffixes || ad.paySuffixes || []
        };

        // Apply to States
        setShopName(norm.shopName);
        setNickname(norm.nickname);
        setManagerName(norm.managerName);
        setManagerPhone(norm.managerPhone);
        setMessengers({
            kakao: norm.kakao,
            telegram: norm.telegram,
            line: norm.line
        });

        setTitle(norm.title);
        setIndustryMain(norm.category);
        setIndustrySub(norm.industrySub);
        const REGION_ALIAS: Record<string, string> = {
            '경기': '경기도', '강원': '강원도', '경남': '경상남도', '경북': '경상북도',
            '전남': '전라남도', '전북': '전라북도', '충남': '충청남도', '충북': '충청북도',
            '제주': '제주도',
        };
        setRegionCity(REGION_ALIAS[norm.regionCity] || norm.regionCity);
        setRegionGu(norm.regionGu);
        setAddressDetail(norm.addressDetail);

        setAgeMin(norm.ageMin);
        setAgeMax(norm.ageMax);

        setPayType(norm.payType);
        setPayAmount(norm.payAmount);
        setMediaUrl(norm.mediaUrl);

        // Editor
        setEditorHtml(norm.content);
        if (editorRef.current) {
            editorRef.current.innerHTML = norm.content;
        }

        setSelectedKeywords(norm.keywords);
        setSelectedAdProduct(norm.productType);
        setSelectedAdPeriod(norm.productPeriod);

        setSelectedIcon(norm.icon);
        setIconPeriod(norm.icon_period);
        setSelectedHighlighter(norm.highlighter);
        setHighlighterPeriod(norm.highlighter_period);
        setBorderOption(norm.border as any);
        setBorderPeriod(norm.border_period);
        setPaySuffixes(norm.pay_suffixes);
    };

    return {
        shopName, setShopName, shopAddress, setShopAddress, isVerified, setIsVerified, nickname, setNickname,
        managerName, setManagerName,
        managerPhone, setManagerPhone, messengers, setMessengers, title, setTitle,
        regionCity, setRegionCity, regionGu, setRegionGu, addressDetail, setAddressDetail,
        industryMain, setIndustryMain, industrySub, setIndustrySub, ageMin, setAgeMin,
        ageMax, setAgeMax, payType, setPayType,
        payAmount, setPayAmount,
        mediaUrl, setMediaUrl,
        selectedKeywords, setSelectedKeywords, editorRef, selectionRange, isEditorDirty, setIsEditorDirty,
        editorHtml, setEditorHtml, syncEditorHtml, updateToolbarStatus, saveSelection, restoreSelection,
        toolbarStatus, setToolbarStatus, showFontMenu, setShowFontMenu, showFontSizeMenu, setShowFontSizeMenu,
        showForeColorMenu, setShowForeColorMenu, showHiliteColorMenu, setShowHiliteColorMenu,
        showEmojiMenu, setShowEmojiMenu, selectedAdProduct, setSelectedAdProduct,
        selectedAdPeriod, setSelectedAdPeriod, selectedIcon, setSelectedIcon, iconPeriod, setIconPeriod,
        selectedHighlighter, setSelectedHighlighter, highlighterPeriod, setHighlighterPeriod,
        paySuffixes, setPaySuffixes, borderOption, setBorderOption, borderPeriod, setBorderPeriod,
        totalAmount, setTotalAmount, resetAdStates, loadAdData, isDirty
    };
}
