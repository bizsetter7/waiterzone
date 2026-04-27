// [Total Reset] Robust Helper
// 빈 문자열, null, undefined, 기본값(0, '지역', '업종') 등을 걸러내고 실제 유효한 데이터를 우선 선택합니다.
const getValid = (v1: any, v2: any, defaultValue: any = '') => {
    const invalidValues = [null, undefined, '', '지역', '업종', '시급', '급여방식선택', '자유직종', '정보없음'];
    if (!invalidValues.includes(v1)) return v1;
    if (!invalidValues.includes(v2)) return v2;
    return defaultValue;
};

// [Total Reset] Number Helper (0을 유효값으로 보되, 더 큰 값을 우선하거나 Snapshot 우선)
const getValidNum = (n1: any, n2: any, defaultValue: number = 0) => {
    const val1 = (n1 !== undefined && n1 !== null && n1 !== '') ? Number(n1) : -1;
    const val2 = (n2 !== undefined && n2 !== null && n2 !== '') ? Number(n2) : -1;
    if (val1 > val2) return val1;
    if (val2 >= 0) return val2;
    return defaultValue;
};

export const normalizeAd = (ad: any) => {
    if (!ad) return null;
    const opt = ad.options || {};

    // [Total Reset] Polyfill Mapping
    // 어떤 필드명을 쓰더라도 데이터가 존재하도록 상호 매핑하며,
    // root 컬럼이 비어있으면 options Snapshot에서 즉시 복구합니다.
    const normalized = {
        id: ad.id,
        user_id: ad.user_id || ad.options?.user_id || '',
        created_at: ad.created_at || '',
        // 제목
        title: getValid(ad.title, opt.title, '제목 없음'),
        jobTitle: getValid(ad.title, opt.title, '제목 없음'),

        // 닉네임 / 관리자명 — 기본값은 상호명으로 폴백 (절대 '관리자' 노출 금지)
        nickname: getValid(ad.nickname, opt.nickname, ad.name || opt.shopName || ''),
        managerNickname: getValid(ad.nickname, opt.nickname, ad.name || opt.shopName || ''),
        managerName: getValid(ad.manager_name || ad.managerName, opt.managerName, ''),

        // 상호명
        name: getValid(ad.name || ad.shopName, opt.shopName, '상호명 없음'),
        shopName: getValid(ad.name || ad.shopName, opt.shopName, '상호명 없음'),

        // 연락처
        managerPhone: getValid(ad.manager_phone || ad.phone || ad.managerPhone, opt.managerPhone, ''),
        phone: getValid(ad.manager_phone || ad.phone || ad.managerPhone, opt.managerPhone, ''),
        kakao: getValid(ad.kakao_id || ad.kakao, opt.kakao || opt.messengers?.kakao, ''),
        telegram: getValid(ad.telegram_id || ad.telegram, opt.telegram || opt.messengers?.telegram, ''),
        line: getValid(ad.line_id || ad.line, opt.line || opt.messengers?.line, ''),
        messengers: {
            kakao: getValid(ad.kakao_id || ad.kakao, opt.kakao || opt.messengers?.kakao, ''),
            telegram: getValid(ad.telegram_id || ad.telegram, opt.telegram || opt.messengers?.telegram, ''),
            line: getValid(ad.line_id || ad.line, opt.line || opt.messengers?.line, '')
        },

        // 지역
        regionCity: getValid(opt.regionCity, ad.regionCity || ad.work_region || (typeof ad.region === 'string' ? ad.region.split(' ')[0] : null), '지역'),
        work_region: getValid(opt.regionCity, ad.regionCity || ad.work_region || (typeof ad.region === 'string' ? ad.region.split(' ')[0] : null), '지역'),
        regionGu: getValid(opt.regionGu, ad.regionGu || ad.work_region_sub, ''),
        work_region_sub: getValid(opt.regionGu, ad.regionGu || ad.work_region_sub, ''),
        addressDetail: getValid(opt.addressDetail, ad.work_address || ad.addressDetail, ''),
        work_address: getValid(opt.addressDetail, ad.work_address || ad.addressDetail, ''),

        // 업종 — workType은 category_sub(세부업종)로 매핑 (SideAdCard Row2 우측에 표시됨)
        category: getValid(ad.category || ad.industryMain, opt.category || opt.industryMain, '업종'),
        industryMain: getValid(ad.category || ad.industryMain, opt.category || opt.industryMain, '업종'),
        categorySub: getValid(ad.category_sub || ad.categorySub || ad.industrySub, opt.categorySub || opt.industrySub, ''),
        industrySub: getValid(ad.category_sub || ad.categorySub || ad.industrySub, opt.categorySub || opt.industrySub, ''),
        // workType — BannerSidebar SideAdCard/InnerSidebarCarousel CarouselCard에서 사용
        workType: getValid(ad.work_type || ad.workType || ad.category_sub, opt.industrySub || opt.categorySub || opt.workType, ''),
        work_type: getValid(ad.work_type || ad.workType || ad.category_sub, opt.industrySub || opt.categorySub || opt.workType, ''),

        // 급여
        payType: getValid(ad.pay_type || ad.payType, opt.payType, '시급'),
        pay_type: getValid(ad.pay_type || ad.payType, opt.payType, '시급'),
        payAmount: getValidNum(ad.pay_amount || ad.payAmount || ad.pay, opt.payAmount, 0),
        pay_amount: getValidNum(ad.pay_amount || ad.payAmount || ad.pay, opt.payAmount, 0),
        pay: getValidNum(ad.pay_amount || ad.payAmount || ad.pay, opt.payAmount, 0),

        // 본문 및 기타
        content: getValid(ad.content, opt.content || opt.editorHtml || ad.jobContent, ''),
        jobContent: getValid(ad.content, opt.content || opt.editorHtml || ad.jobContent, ''),
        description: getValid(ad.content, opt.content || opt.editorHtml || ad.jobContent, ''),
        deadline: ad.deadline || opt.deadline || '',
        status: ad.status || opt.status || '진행중',
        rejection_reason: ad.rejection_reason || opt.rejection_reason || '',

        // region — BannerSidebar SideAdCard에서 ad.region으로 직접 사용
        region: getValid(ad.region, opt.regionCity, ''),

        // 미디어 URL — 카드 썸네일용 (banner_image_url과 별도)
        mediaUrl: getValid(ad.media_url || ad.mediaUrl, opt.mediaUrl, ''),
        media_url: getValid(ad.media_url || ad.mediaUrl, opt.mediaUrl, ''),

        // 배너 슬롯 (migration 06 이후 반영)
        banner_position: ad.banner_position || null,
        banner_image_url: ad.banner_image_url || null,
        banner_media_type: ad.banner_media_type || 'image',
        banner_status: ad.banner_status || null,

        // 상품 및 디자인 옵션
        productType: ad.tier || ad.productType || ad.product_type || opt.product_type || ad.ad_type || 'p1',
        tier: ad.tier || ad.productType || ad.product_type || opt.product_type || ad.ad_type || 'p1',
        ad_type: ad.tier || ad.productType || ad.product_type || opt.product_type || ad.ad_type || 'p1',

        selectedIcon: opt.icon || ad.selectedIcon || ad.icon || null,
        selectedHighlighter: opt.highlighter || ad.selectedHighlighter || ad.highlighter || null,
        borderOption: opt.border || ad.borderOption || ad.border || 'none',
        // [Critical Fix] Ensure both camelCase and snake_case are handled
        paySuffixes: opt.pay_suffixes || opt.paySuffixes || ad.pay_suffixes || ad.paySuffixes || [],

        // 카운터 (중요 필드) - 월이 바뀌었으면 0으로 리셋하여 반환 (Fallback: updated_at)
        edit_count: (() => {
            const now = new Date();
            const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
            const count = getValidNum(ad.edit_count, opt.edit_count, 0);

            let month = ad.last_edit_month || opt.last_edit_month;

            // [Smart Recovery] If monthly tracker is missing but updated_at is this month, recover the count
            if (!month && ad.updated_at) {
                try {
                    const updatedDate = new Date(ad.updated_at);
                    const updatedMonth = `${updatedDate.getFullYear()}-${String(updatedDate.getMonth() + 1).padStart(2, '0')}`;
                    if (updatedMonth === currentMonth) {
                        month = currentMonth;
                    }
                } catch (e) { /* ignore invalid date */ }
            }

            return month === currentMonth ? Number(count) : 0;
        })(),
        last_edit_month: ad.last_edit_month || opt.last_edit_month || '',

        // 원본 옵션 보관
        options: opt,
        isMock: ad.isMock || String(ad.id).startsWith('AD_MOCK_')
    };

    return normalized;
};

/**
 * 결제 내역 데이터를 정규화합니다.
 */
export const normalizePayment = (p: any, defaultUserName: string = '관리자') => {
    const adMetadata = p.metadata || {};
    const opt = adMetadata.options || p.options || {};

    // [Fix] Flat mapping with snapshot priority
    const finalAdObject = {
        id: p.shop_id || p.shopId,
        title: opt.title || adMetadata.adTitle || adMetadata.title || p.desc || p.description || '구인 공고',
        nickname: opt.nickname || adMetadata.nickname || p.nickname || defaultUserName,
        name: opt.shopName || adMetadata.shopName || p.shopName || defaultUserName,
        payType: opt.payType || adMetadata.pay_type || adMetadata.payType || '시급',
        payAmount: opt.payAmount || adMetadata.pay_amount || adMetadata.payAmount || 0,
        content: opt.content || opt.editorHtml || adMetadata.content || adMetadata.editorHtml || '',
        regionCity: opt.regionCity || adMetadata.work_region || '지역',
        regionGu: opt.regionGu || adMetadata.work_region_sub || '',
        category: opt.category || adMetadata.category || '업종',
        categorySub: opt.categorySub || adMetadata.category_sub || '',
        deadline: opt.deadline || adMetadata.deadline || p.deadline || '',
        status: opt.status || adMetadata.status || p.status || 'pending',
        approved_at: p.approved_at || adMetadata.approved_at || '',
        options: opt,
        productType: opt.product_type || adMetadata.ad_type || '그랜드'
    };

    return {
        id: p.id,
        amount: p.amount || 0,
        price: (() => {
            const val = p.price ?? p.amount;
            if (val === undefined || val === null) return '0원';
            return `${Number(val).toLocaleString()}원`;
        })(),
        method: p.method,
        status: p.status,
        date: p.created_at || new Date().toISOString(),
        description: p.description,
        type: opt.product_type || adMetadata.ad_type || p.ad_type || 'AD',
        nickname: finalAdObject.nickname,
        adTitle: finalAdObject.title,
        adObject: finalAdObject
    };
};
