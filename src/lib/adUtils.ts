import { Shop } from '@/types/shop';

/**
 * [수복] 공고 데이터 통합 정제 어댑터
 * DB의 날것(Raw) 데이터를 프론트엔드 UI 규격에 맞게 변환하고 정합성을 보장합니다.
 * 143~148번 공고 및 향후 신규 회원을 위한 마스터 로직입니다.
 */
export function enrichAdData(ad: any, userData: any[] = []): Shop {
    // 1. 프로필 매핑 (ad.user_id 및 ad.ownerId 지원)
    const profile = userData.find((p: any) => p?.id === (ad?.user_id || ad?.ownerId));
    
    // 2. 상호명 및 닉네임 폴백 (닉네임 없으면 상호명, 플레이스홀더는 무효 처리)
    const INVALID_NICK = ['닉네임', '관리자', '비즈니스 파트너', '', null, undefined];
    const shopName = profile?.business_name || ad?.name || ad?.shopName || ad?.shop_name || '';
    const rawNick = ad?.nickname;
    const profileNick = profile?.nickname;
    const nickname = (!INVALID_NICK.includes(rawNick) ? rawNick : null)
        || (!INVALID_NICK.includes(profileNick) ? profileNick : null)
        || shopName
        || '업체명 없음';

    // 3. 지역 결합 (대장님 지령: 지역 + 상세지역)
    const city = ad?.region || ad?.regionCity || ad?.work_region || '';
    const district = ad?.work_region_sub || ad?.regionGu || ad?.district || '';
    // [Fix] '경기도' + '수원' -> '경기도 수원'
    const fullRegion = `${city} ${district}`.trim() || '지역미지정';

    // 4. 급여 정보 정제
    let payAmount = Number(ad?.pay_amount || ad?.payAmount || ad?.pay || 0);
    let payType = ad?.pay_type || ad?.payType || '협의';
    
    // [Fix] '급여방식선택' 등 플레이스홀더 제거
    if (payType === '급여방식선택' || payType === '종류선택') {
        payType = (Number(ad.id) === 143 || Number(ad.id) === 145) ? '시급' : '협의';
    }

    // 5. 상세 내용 매핑 (content -> editorHtml)
    const content = ad?.content || ad?.description || ad?.options?.content || '';

    // 6. 지능형 키워드 생성 (상세지역+상호명 결합)
    const existingKeywords = ad?.keywords || ad?.options?.keywords || ad?.selectedKeywords || [];
    let keywords = existingKeywords;
    if (keywords.length === 0 && (city || district || shopName)) {
        const cleanRegion = (city + district).replace(/\s+/g, ''); // 경기도수원
        const industry = ad?.category || ad?.workType || '마사지';
        keywords = [
            `${cleanRegion} ${industry}`,
            shopName !== '비즈니스 파트너' ? `${cleanRegion} ${shopName}` : '',
            `${cleanRegion} 추천`,
            `초보가능`,
            `당일지급`
        ].filter(k => k && k.trim());
    }

    return {
        ...ad,
        id: String(ad.id),
        name: shopName,
        shopName: shopName,
        nickname: nickname,
        region: fullRegion, // [Fix] 결합된 지역 노출
        work_region_sub: district,
        pay: String(payAmount),
        pay_amount: payAmount,
        payType: payType,
        pay_type: payType,
        workType: ad?.workType || ad?.work_type || ad?.category || '일반',
        content: content,
        description: content,
        options: {
            ...(ad?.options || {}),
            keywords: keywords,
            // [우선순위]
            // 1. 어드민 승인 배너 (사이드바와 동일한 이미지를 등급별 리스트에도 표시 — 최우선)
            // 2. options.mediaUrl (별도 카드이미지 업로드)
            // 3. media_url (DB root 컬럼)
            // 4. 목업 전용 picsum (실제 광고에는 절대 미적용)
            mediaUrl:
                ad?.options?.mediaUrl ||
                ad?.media_url ||
                ((ad?.isMock || ad?.isRecovered) && (ad?.tier === 'grand' || ad?.tier === 'premium')
                    ? `https://picsum.photos/400/300?random=${ad.id}`
                    : undefined),
        },
        // 상세 팝업 바인딩용 필드 추가
        // [Fix] options.businessAddress 폴백 추가 — 등록 시 JSONB에 저장된 주소 우선 활용
        businessAddress: ad?.business_address || profile?.business_address || ad?.businessAddress || ad?.options?.businessAddress || ad?.options?.address || '',
        managerName: ad?.manager_name || profile?.full_name || ad?.managerName || '',
        managerPhone: ad?.manager_phone || profile?.phone || ad?.managerPhone || ad?.phone || '',
        // 어드민 회원ID 표시용 — username 우선, 없으면 이메일 앞자리, 없으면 빈값
        username: profile?.username || ad?.username || profile?.email?.split('@')[0] || '',
        isMock: !!ad.isMock || !!ad.isRecovered
    };
}

/**
 * anyAdToShop: any 타입 광고 객체 → JobDetailContent 전달용 Shop 타입으로 변환
 * my-shop AdDetailModal, admin modal 등 모든 팝업에서 공통 사용
 */
export function anyAdToShop(ad: any): Shop {
    if (!ad) return {} as Shop;
    
    const opt = ad?.options || {};
    const INVALID_NICK = ['닉네임', '관리자', '비즈니스 파트너', '', null, undefined];
    const shopName = ad?.name || opt?.shopName || ad?.shopName || ad?.shop_name || ad?.shop_title || '';
    const rawNick = ad?.nickname ?? opt?.nickname;
    const nickname = (!INVALID_NICK.includes(rawNick) ? rawNick : null) || shopName || '업체명 없음';

    // 지역 중복 방지 (경기도 수원시 수원시 → 경기도 수원시)
    const regionCity = ad?.regionCity || opt?.regionCity || ad?.region || '';
    const regionGu = ad?.regionGu || opt?.regionGu || ad?.work_region_sub || '';
    // regionCity가 이미 regionGu를 포함하고 있으면 regionGu 생략
    const region = regionCity && regionGu && String(regionCity).includes(String(regionGu))
        ? String(regionCity).trim()
        : regionCity && regionGu
            ? `${regionCity} ${regionGu}`.trim()
            : regionCity || regionGu || '지역미기재';

    return {
        ...ad,
        id: String(ad.id || ''),
        name: shopName,
        shopName: shopName,
        nickname: nickname,
        region,
        work_region_sub: regionGu,
        workType: ad?.workType || ad?.work_type || opt?.category || ad?.category || '일반',
        category: ad?.category || opt?.industryMain || opt?.jobCategory || ad?.workType || '',
        category_sub: ad?.category_sub || opt?.categorySub || opt?.industrySub || ad?.categorySub || '',
        categorySub: ad?.category_sub || opt?.categorySub || opt?.industrySub || ad?.categorySub || '',
        pay: String(
            Number(ad?.pay_amount || ad?.payAmount || opt?.payAmount || ad?.pay || 0)
        ),
        pay_amount: Number(ad?.pay_amount || ad?.payAmount || opt?.payAmount || ad?.pay || 0),
        payType: ad?.payType || ad?.pay_type || opt?.payType || '협의',
        pay_type: ad?.payType || ad?.pay_type || opt?.payType || '협의',
        tier: ad?.tier || opt?.selectedAdProduct || ad?.productType || ad?.product_type || 'p7',
        title: ad?.title || opt?.title || '',
        content: ad?.content || ad?.description || opt?.content || opt?.editorHtml || '',
        description: ad?.content || ad?.description || opt?.content || opt?.editorHtml || '',
        options: {
            ...opt,
            paySuffixes: ad?.paySuffixes || opt?.paySuffixes || opt?.pay_suffixes || [],
            keywords: ad?.keywords || opt?.keywords || opt?.selectedKeywords || [],
            icon: opt?.icon || opt?.selectedIcon || ad?.selectedIcon,
            highlighter: opt?.highlighter || opt?.selectedHighlighter || ad?.selectedHighlighter,
            mediaUrl: opt?.mediaUrl,
        },
        managerName: ad?.managerName || ad?.manager_name || opt?.managerName || '',
        managerPhone: ad?.managerPhone || ad?.manager_phone || opt?.managerPhone || ad?.phone || '',
        businessAddress: ad?.businessAddress || ad?.business_address || opt?.businessAddress || opt?.address || '',
    } as Shop;
}
