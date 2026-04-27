import shopsData from '@/lib/data/shops.json';
import { Shop } from '@/types/shop';
// JobDetailContent replaced by ShopDetailView (imported below)
import { Metadata } from 'next';
import { slugify } from '@/utils/shopUtils';
import { generateShopImageAlt } from '@/lib/imageUtils';
import shadowRegionsData from '@/lib/data/Shadow_SEO_Regions.json';
import {
    isWorkTypeSlug,
    getNormalizedWorkTypeSlug,
    WORK_TYPE_INFO,
    WORK_TYPE_SLUGS,
    getRegionPayData,
} from '@/lib/data/work-type-guide';
import WorkTypeGuidePage from '@/components/guide/WorkTypeGuidePage';
import ShopDetailView from '@/components/jobs/ShopDetailView';
import { supabase } from '@/lib/supabase';

interface Props {
    params: Promise<{ region: string; id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { id, region } = await params;
    const decodedId = decodeURIComponent(id).normalize('NFC');
    const decodedRegionSlug = decodeURIComponent(region).normalize('NFC');

    // ── 업종 가이드 페이지 메타데이터 ──
    const normalizedSlug = getNormalizedWorkTypeSlug(decodedId);
    if (normalizedSlug) {
        const workTypeInfo = WORK_TYPE_INFO[normalizedSlug];
        const regionData = shadowRegionsData.find(r => slugify(r.id) === decodedRegionSlug);
        const regionName = regionData?.mainRegion ?? decodedRegionSlug;
        const title = `${regionName} ${workTypeInfo.name} 완전 가이드 2026 — 평균 급여·용어·FAQ | 웨이터존`;
        const description = `${regionName} ${workTypeInfo.name} 평균 TC·시급·일급 정보와 업종 특징, 초보자 FAQ를 한눈에 확인하세요. 웨이터존 검증 업소 공고도 바로 확인 가능합니다.`;
        return {
            title,
            description,
            keywords: [
                `${regionName} ${normalizedSlug}`,
                `${regionName} ${workTypeInfo.name}`,
                `${normalizedSlug} 급여`,
                `${regionName} 남성유흥알바`,
                `${regionName} 야간알바`,
                `${regionName} 당일지급알바`,
                `${regionName} 웨이터알바`,
                `${regionName} 고수익알바`,
                '남성알바', '야간알바', '고수익알바', '당일지급', '남성유흥알바',
                '20대웨이터알바', '30대웨이터알바', '단기알바', '주말알바',
            ],
            openGraph: {
                title,
                description,
                url: `https://www.waiterzone.kr/coco/${encodeURIComponent(decodedRegionSlug)}/${encodeURIComponent(normalizedSlug)}`,
                siteName: '웨이터존',
                images: [{ url: 'https://www.waiterzone.kr/og-image.jpg', width: 1200, height: 630, alt: '웨이터존' }],
                type: 'website',
            },
            alternates: {
                canonical: `https://www.waiterzone.kr/coco/${encodeURIComponent(decodedRegionSlug)}/${encodeURIComponent(normalizedSlug)}`,
            },
        };
    }

    // ── 광고 상세 페이지 메타데이터 ──
    let shop: Shop | null = (shopsData as Shop[]).find((s) => s.id === decodedId) || null;

    if (!shop) {
        // Supabase에서 추가 확인
        const { data } = await supabase
            .from('shops')
            .select('*, businesses(waiterzone_tier)')
            .eq('id', decodedId)
            .single();
        
        if (data) {
            shop = {
                ...data,
                tier: data.businesses?.waiterzone_tier || data.tier || 'basic'
            } as any;
        }
    }

    if (!shop) {
        return {
            title: '업소를 찾을 수 없습니다 - 웨이터존',
            robots: { index: false, follow: false },
        };
    }

    // 콘텐츠가 없는 thin 페이지 → noindex (크롤 예산 보호 + 품질 신호 유지)
    const hasTitle = (shop.title || '').trim().length > 4;
    const hasDesc = (shop.description || '').trim().length > 20;
    const isThinContent = !hasTitle && !hasDesc;

    if (isThinContent) {
        return {
            title: `${shop.name} - 웨이터존`,
            robots: { index: false, follow: true },
        };
    }

    // [SEO 무결성] 지역 데이터에서 강제로 Shadow SEO(하이엔드) 키워드 추출
    const shadowRegionData = shadowRegionsData.find(r => slugify(r.id) === decodedRegionSlug) || {
        mainRegion: decodedRegionSlug.replace(/-/g, ' '),
        keywords: [`${decodedRegionSlug.replace(/-/g, ' ')} 남성알바`, '고수익알바', '남성유흥알바']
    };

    const title = `${shop.name} - ${shadowRegionData.mainRegion} 최고의 ${shadowRegionData.keywords[0]} | 웨이터존`;
    const description = `${shadowRegionData.mainRegion} ${shop.name}에서 함께할 가족을 찾습니다. ${shop.payType || ''} ${shop.pay} 이상. 확실한 고수익과 안전을 보장합니다. 지금 바로 확인하세요.`;

    return {
        title,
        description,
        openGraph: {
            title,
            description,
            url: `https://www.waiterzone.kr/coco/${encodeURIComponent(slugify(shop.region))}/${shop.id}`,
            images: shop.options?.mediaUrl ? [
                {
                    url: shop.options.mediaUrl,
                    width: 1200,
                    height: 630,
                    alt: shop.name || '업소 이미지',
                },
            ] : [
                {
                    url: 'https://www.waiterzone.kr/og-image.png',
                    width: 1200,
                    height: 630,
                    alt: '웨이터존',
                },
            ],
            type: 'website',
        },
        alternates: {
            canonical: `https://www.waiterzone.kr/coco/${encodeURIComponent(slugify(shop.region))}/${shop.id}`,
        },
        keywords: [shop.name || '', ...shadowRegionData.keywords, '남성알바', '고수익알바', '당일지급', '야간알바', '텐프로'],
    };
}

export async function generateStaticParams() {
    // 1. 기존 광고 상세 페이지
    const shopParams = (shopsData as Shop[]).map((shop) => ({
        region: slugify(shop.region || '전체'),
        id: shop.id.toString(),
    }));

    // 2. 지역×업종 가이드 랜딩 페이지 (예: /coco/서울/룸웨이터)
    const guideParams = shadowRegionsData.flatMap((regionData) =>
        WORK_TYPE_SLUGS.map((workType) => ({
            region: slugify(regionData.id),
            id: workType,
        }))
    );

    return [...shopParams, ...guideParams];
}

export default async function ShopDetailPage({ params }: Props) {
    const { id, region } = await params;
    const decodedId = decodeURIComponent(id).normalize('NFC');
    const decodedRegionSlug = decodeURIComponent(region).normalize('NFC');

    // ── 업종 가이드 페이지 렌더링 ──
    const normalizedId = getNormalizedWorkTypeSlug(decodedId);
    if (normalizedId) {
        const workTypeInfo = WORK_TYPE_INFO[normalizedId];
        const regionData = shadowRegionsData.find(r => slugify(r.id) === decodedRegionSlug);
        const regionName = regionData?.mainRegion ?? decodedRegionSlug;
        const regionPayData = getRegionPayData(decodedRegionSlug);

        // [SEO 튜닝] FAQ와 Breadcrumb 등의 주소 포맷 일관성 유지
        const faqSchema = {
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: workTypeInfo.faqs.map((f) => ({
                '@type': 'Question',
                name: f.q.replace('{region}', regionName),
                acceptedAnswer: {
                    '@type': 'Answer',
                    text: f.a.replace('{region}', regionName),
                },
            })),
        };

        const breadcrumbSchema = {
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
                { '@type': 'ListItem', position: 1, name: '홈', item: 'https://www.waiterzone.kr' },
                { '@type': 'ListItem', position: 2, name: `${regionName} 알바`, item: `https://www.waiterzone.kr/coco/${decodedRegionSlug}` },
                { '@type': 'ListItem', position: 3, name: `${regionName} ${workTypeInfo.name}`, item: `https://www.waiterzone.kr/coco/${decodedRegionSlug}/${normalizedId}` },
            ],
        };

        return (
            <>
                <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
                <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
                <WorkTypeGuidePage
                    regionSlug={decodedRegionSlug}
                    regionName={regionName}
                    workTypeSlug={normalizedId}
                    workTypeInfo={workTypeInfo}
                    regionPayData={regionPayData}
                />
            </>
        );
    }

    // ── 광고 상세 페이지 렌더링 ──
    let shop: Shop | null = (shopsData as Shop[]).find((s) => s.id === decodedId) || null;

    if (!shop) {
        // Supabase에서 추가 확인 (업체 티어 포함)
        const { data, error } = await supabase
            .from('shops')
            .select(`
                *,
                businesses (
                    waiterzone_tier
                )
            `)
            .eq('id', decodedId)
            .maybeSingle();
        
        if (data) {
            shop = {
                ...data,
                tier: (data as any).businesses?.waiterzone_tier || data.tier || 'basic'
            } as any;
        } else if (!error) {
            // businesses가 없는 레거시 또는 일반 광고 대응
            const { data: legacyData } = await supabase
                .from('shops')
                .select('*')
                .eq('id', decodedId)
                .maybeSingle();
            if (legacyData) shop = legacyData as any;
        }
    }

    if (!shop) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px]">
                <p className="text-gray-500">정보가 존재하지 않는 업소입니다.</p>
            </div>
        );
    }

    // [JSON-LD 매핑] 잡포스팅(JobPosting) 스키마 강화 (SEO STEP 3 — 2026-04-03)
    const shadowRegionData = shadowRegionsData.find(r => slugify(r.id) === decodedRegionSlug);
    const mainKeyword = shadowRegionData ? shadowRegionData.keywords[0] : '남성알바';

    // ── datePosted: 실제 등록일 우선, 없으면 오늘
    const rawDatePosted = shop.created_at || shop.adStartDate || shop.date || shop.updatedAt;
    const datePosted = rawDatePosted
        ? new Date(rawDatePosted).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0];

    // ── validThrough: 실제 만료일 우선, 없으면 등록일+30일
    const rawValidThrough = shop.adEndDate || shop.deadline;
    const validThrough = rawValidThrough
        ? new Date(rawValidThrough).toISOString().split('T')[0]
        : (() => {
            const d = new Date(datePosted);
            d.setDate(d.getDate() + 30);
            return d.toISOString().split('T')[0];
        })();

    // ── employmentType: payType 기반 동적 매핑
    const employmentTypeMap: Record<string, string> = {
        '시급': 'PART_TIME',
        '일급': 'PER_DIEM',
        '월급': 'FULL_TIME',
        '주급': 'FULL_TIME',
        'TC': 'CONTRACTOR',
    };
    const employmentType = shop.payType ? (employmentTypeMap[shop.payType] ?? 'OTHER') : 'OTHER';

    // ── baseSalary value: 숫자만 추출, 최소값 보장
    const salaryRaw = shop.pay ? shop.pay.replace(/[^0-9]/g, '') : '';
    const salaryValue = salaryRaw.length > 0 ? salaryRaw : '50000';
    const salaryUnit = shop.payType === '시급' ? 'HOUR' : shop.payType === '일급' ? 'DAY' : 'MONTH';

    // ── jobBenefits: options.icons + options.keywords 조합
    const benefitParts: string[] = [];
    if (shop.options?.icons && shop.options.icons.length > 0) {
        benefitParts.push(...shop.options.icons);
    }
    if (shop.options?.keywords && shop.options.keywords.length > 0) {
        benefitParts.push(...shop.options.keywords);
    }
    if (shop.keywords && shop.keywords.length > 0) {
        benefitParts.push(...shop.keywords);
    }
    const jobBenefits = benefitParts.length > 0 ? benefitParts.join(', ') : undefined;

    // ── description: 실 광고 내용 우선, 없으면 기본 문구
    const jobDescription = (shop.description && shop.description.trim().length > 10)
        ? shop.description.trim()
        : `${shop.name}에서 ${mainKeyword}를 모집합니다. ${shop.payType || ''} ${shop.pay} 이상 보장. 최고의 대우와 확실한 수익을 약속드립니다.`;

    // ── title: 실 광고 제목 우선
    const jobTitle = (shop.title && shop.title.trim().length > 2)
        ? `${shop.title.trim()} — ${shop.name}`
        : `${shop.name} - ${mainKeyword} 모집`;

    const jsonLd = {
        "@context": "https://schema.org/",
        "@type": "JobPosting",
        "title": jobTitle,
        "description": jobDescription,
        "hiringOrganization": {
            "@type": "Organization",
            "name": shop.name,
            "sameAs": `https://www.waiterzone.kr/coco/${slugify(shop.region)}/${shop.id}`
        },
        "employmentType": employmentType,
        "datePosted": datePosted,
        "validThrough": validThrough,
        "occupationalCategory": shop.workType || mainKeyword,
        "workHours": shop.workTime || undefined,
        "qualifications": shop.age ? `${shop.age} 지원 가능` : '나이 무관, 경험 무관',
        ...(jobBenefits ? { "jobBenefits": jobBenefits } : {}),
        "jobLocation": {
            "@type": "Place",
            "address": {
                "@type": "PostalAddress",
                "streetAddress": shop.businessAddress || shop.work_region_sub || shop.district || undefined,
                "addressLocality": shop.city || shop.district || shop.region,
                "addressRegion": shop.regionCity || shop.region,
                "addressCountry": "KR",
                ...(shop.businessAddress ? { "postalCode": "00000" } : {})
            }
        },
        "baseSalary": {
            "@type": "MonetaryAmount",
            "currency": "KRW",
            "value": {
                "@type": "QuantitativeValue",
                "value": salaryValue,
                "unitText": salaryUnit
            }
        },
        // [이미지 SEO] ImageObject — 구글 이미지 검색 + Discover 최적화
        ...((shop.media_url || shop.banner_image_url) ? {
            "image": {
                "@type": "ImageObject",
                "url": shop.banner_image_url || shop.media_url,
                "width": 1200,
                "height": 1200,
                "caption": generateShopImageAlt({
                    region:     shop.region,
                    work_type:  shop.workType || shop.category,
                    pay:        shop.pay,
                    pay_type:   shop.payType,
                    pay_amount: shop.payAmount,
                }),
                "representativeOfPage": true
            }
        } : {})
    };

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <ShopDetailView shop={shop} />
        </>
    );
}
