import React from 'react';
import { createClient } from '@supabase/supabase-js';
import RegionClient from '../../region/RegionClient';
import seoRegionsMaster from '@/lib/data/seo_regions_master.json';
import shadowRegionsData from '@/lib/data/Shadow_SEO_Regions.json';
import { Shop } from '@/types/shop';
import {
    isWorkTypeSlug,
    getNormalizedWorkTypeSlug,
    WORK_TYPE_INFO,
    WORK_TYPE_SLUGS,
    getRegionPayData,
} from '@/lib/data/work-type-guide';
import WorkTypeGuidePage from '@/components/guide/WorkTypeGuidePage';
import { slugify } from '@/utils/shopUtils';
import Link from 'next/link';

export const revalidate = 300; // 5분마다 ISR 갱신

export async function generateStaticParams() {
    return seoRegionsMaster.map((region) => ({
        region: slugify(region.id),
    }));
}

export async function generateMetadata({ params }: { params: Promise<{ region: string }> }) {
    const { region } = await params;
    const decodedRegionSlug = decodeURIComponent(region).normalize('NFC');

    const regionData = shadowRegionsData.find(r => slugify(r.id) === decodedRegionSlug) || {
        mainRegion: decodedRegionSlug.replace(/-/g, ' '),
        keywords: [`${decodedRegionSlug.replace(/-/g, ' ')} 알바`]
    };

    // [v3.6] AI 용어 배제 및 타겟 SEO(여자야간알바) 강화
    const regionName = regionData.mainRegion;
    const title = `${regionName} 여자야간알바·여자남성유흥알바·여자룸웨이터 전문 - 웨이터존`;
    const description = `${regionName} 지역 확실하게 검증된 고소득 남성유흥알바 정보를 알아보세요. 지역별 상세정보를 실시간으로 제공합니다.`;

    return {
        title,
        description,
        alternates: {
            canonical: `https://www.waiterzone.kr/coco/${encodeURIComponent(decodedRegionSlug)}`,
        },
        openGraph: {
            title,
            description,
            url: `https://www.waiterzone.kr/coco/${region}`,
            siteName: '웨이터존',
            images: [
                {
                    url: 'https://www.waiterzone.kr/og-image.png',
                    width: 1200,
                    height: 630,
                    alt: `${regionName} 여자야간알바 정보`,
                },
            ],
            type: 'website',
        },
        keywords: [...regionData.keywords, '여자야간알바', '여자남성유흥알바', '여자룸웨이터', '고수익알바', '남성유흥알바', '룸웨이터', '야간알바', '남성알바전문'],
    };
}

export default async function CocoRegionPage({ params }: { params: Promise<{ region: string }> }) {
    const { region } = await params;
    const decodedRegionSlug = decodeURIComponent(region).normalize('NFC');

    // [P3 독립성] 클라이언트 렌더링에 넘기는 ID는 sanitized된 seo_regions_master 사용 가능
    // (클라이언트 텍스트 렌더링은 심사용으로 정화된 텍스트가 나와도 브라우저 렌더링 됨)
    // 단, 검색 엔진이 긁어가는 JSON-LD에는 완벽한 하이엔드 데이터를 삽입
    const shadowRegionData = shadowRegionsData.find(r => slugify(r.id) === decodedRegionSlug);
    const initialRegion = shadowRegionData ? shadowRegionData.id : decodedRegionSlug.replace(/-/g, ' ');

    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { data } = await supabase
        .from('shops')
        .select('*')
        .eq('is_closed', false)
        .order('created_at', { ascending: false })
        .limit(500);

    const shops: Shop[] = (data || []).map((ad: any) => ({
        ...ad,
        workType: ad.work_type || ad.category || ad.options?.category || '',
        region: ad.region || ad.work_region || ad.options?.regionCity || '',
        name: ad.name || ad.shop_name || '',
        title: ad.title || '',
        phone: ad.phone || ad.manager_phone || '',
        kakao: ad.kakao || ad.kakao_id || ad.options?.kakao || '',
        telegram: ad.telegram || ad.telegram_id || ad.options?.telegram || '',
        pay: String(ad.pay_amount || ad.options?.payAmount || 0),
        is_placeholder: false,
        url: '',
        site: '',
    }));

    const regionName = shadowRegionData ? shadowRegionData.mainRegion : decodedRegionSlug.replace(/-/g, ' ');
    const kw0 = shadowRegionData?.keywords[0] || `${regionName} 룸웨이터`;
    const kw1 = shadowRegionData?.keywords[1] || `${regionName} 남성유흥알바`;

    // [JSON-LD 1] WebPage - 타겟 키워드 고도화
    const webPageSchema = {
        "@context": "https://schema.org",
        "@type": "WebPage",
        "name": `${regionName} 여자야간알바·여자남성유흥알바 전문 - 웨이터존`,
        "description": `${regionName} 지역 검증된 ${kw0}, ${kw1} 상세정보를 실시간으로 확인하세요.`,
        "url": `https://www.waiterzone.kr/coco/${region}`,
        "publisher": { "@type": "Organization", "name": "웨이터존", "url": "https://www.waiterzone.kr" }
    };

    // [JSON-LD 2] BreadcrumbList
    const breadcrumbSchema = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "홈", "item": "https://www.waiterzone.kr" },
            { "@type": "ListItem", "position": 2, "name": "지역별 채용", "item": "https://www.waiterzone.kr/region" },
            { "@type": "ListItem", "position": 3, "name": `${regionName} 채용`, "item": `https://www.waiterzone.kr/coco/${region}` }
        ]
    };

    // [JSON-LD 3] FAQPage — 확실하게 검증된 업소정보만을 제공
    const faqSchema = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [
            {
                "@type": "Question",
                "name": `${regionName} 고소득알바 평균 일당은 얼마인가요?`,
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": `${regionName} 기준 야간알바 평균 일당은 업종과 경력에 따라 20만원~50만원 수준입니다. 여자룸웨이터·노래방알바 등 인기 업종의 상세정보를 웨이터존에서 확인하실 수 있습니다.`
                }
            },
            {
                "@type": "Question",
                "name": `${regionName} ${kw0} 당일지급 가능한 곳이 있나요?`,
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": `네, 웨이터존에 등록된 ${regionName} 업체 대부분이 당일지급을 원칙으로 합니다. 공고 상세내용에서 급여 조건과 지급 방식을 확인하고, 1:1 문의로 바로 상담받으실 수 있도록 안내해 드립니다.`
                }
            },
            {
                "@type": "Question",
                "name": `${regionName} 처음 여자야간알바 시작하면 어떻게 되나요?`,
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": `웨이터존는 처음 시작하는 분들을 위해 검증된 업체 정보를 제공합니다. 공고 상세정보 확인 후 면접 및 업무 안내 순으로 진행되며, 궁금한 점은 웨이터존 고객센터(1877-1442)에서 상담 가능합니다.`
                }
            },
            {
                "@type": "Question",
                "name": `${regionName}에서 숙식제공 알바도 찾을 수 있나요?`,
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": `네, 웨이터존에는 숙식제공 조건의 ${regionName} 업체들이 등록되어 있습니다. 필터에서 '숙식제공' 조건을 선택하면 해당 업체만 모아볼 수 있습니다.`
                }
            },
            {
                "@type": "Question",
                "name": `${regionName} 노래방알바(노래빠) 일당은 얼마인가요?`,
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": `${regionName} 노래방알바(노래주점 도우미)의 일당은 보통 15만원~30만원 수준입니다. 노래방알바는 룸웨이터 대비 진입 난이도가 낮고 처음 시작하는 분들에게 인기 있는 업종입니다. 웨이터존에서 ${regionName} 노래주점 알바 공고를 무료로 확인하실 수 있습니다.`
                }
            },
            {
                "@type": "Question",
                "name": `노래방알바와 룸웨이터의 차이는 무엇인가요?`,
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": `노래방알바(노래주점)는 노래방 도우미 형태로 손님과 함께 즐거운 시간을 보내는 서비스를 제공하며, 룸웨이터(룸싸롱)는 고급 룸에서 전문적인 서비스를 제공하는 형태입니다. 노래방알바는 진입 장벽이 낮고, 룸웨이터는 수입이 더 높은 편입니다.`
                }
            }
        ]
    };

    // [SEO 튜닝] 오늘 날짜를 보정하여 구글에 최신 정보임을 알림
    const today = new Date();
    const isoDate = today.toISOString().split('T')[0] + 'T00:00:00Z';

    // [JSON-LD 4] JobPosting - 엔터알바 제거 및 브랜드 정격화
    const jobPostingSchema = {
        "@context": "https://schema.org",
        "@type": "JobPosting",
        "title": `[${regionName}] 노래방알바·남성유흥알바·마사지·엔터 정보 플랫폼 웨이터존`,
        "description": `${regionName} 지역 1등 고소득 남성알바 정보를 실시간 확인하세요. 엔터, 노래주점, 마사지 등 대한민국 프리미엄 고수익 알바 정보를 안전하게 제공합니다.`,
        "identifier": {
            "@type": "PropertyValue",
            "name": "WAITERZONE",
            "value": `REGION_ADS_${region}`
        },
        "datePosted": isoDate,
        "validThrough": "2026-12-31T23:59:59Z",
        "employmentType": "FULL_TIME",
        "hiringOrganization": {
            "@type": "Organization",
            "name": "WAITERZONE",
            "sameAs": "https://waiterzone.kr"
        },
        "jobLocation": {
            "@type": "Place",
            "address": {
                "@type": "PostalAddress",
                "streetAddress": `${regionName} 중심상업로 및 번화가 일대`,
                "addressLocality": regionName,
                "addressRegion": "KR",
                "postalCode": "16450", // 수원 팔달구 기준 기본값 (GSC 경고 방지)
                "addressCountry": "KR"
            }
        },
        "baseSalary": {
            "@type": "MonetaryAmount",
            "currency": "KRW",
            "value": {
                "@type": "QuantitativeValue",
                "value": 500000,
                "unitText": "DAY"
            }
        }
    };

    return (
        <>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageSchema) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jobPostingSchema) }} />
            <RegionClient shops={shops} initialRegion={initialRegion} regionSlug={decodedRegionSlug} />

            {/* ── 지역×업종 가이드 링크 그리드 (서버사이드 렌더링 — 내부 링크 SEO) ── */}
            <nav
                aria-label={`${regionName} 업종별 알바 가이드`}
                className="max-w-5xl mx-auto px-4 pb-10 pt-4"
            >
                <h2 className="text-sm font-bold text-gray-500 mb-3">
                    📍 {regionName} 업종별 알바 가이드
                </h2>
                <div className="flex flex-wrap gap-2">
                    {WORK_TYPE_SLUGS.map((slug) => (
                        <Link
                            key={slug}
                            href={`/coco/${encodeURIComponent(decodedRegionSlug)}/${slug}`}
                            className="px-3 py-1.5 rounded-full bg-white border border-gray-200 text-xs text-gray-600 hover:border-pink-300 hover:text-pink-600 hover:bg-pink-50 transition-colors shadow-sm"
                        >
                            {regionName} {WORK_TYPE_INFO[slug].name.replace(/\s*\(.*\)$/, '')}
                        </Link>
                    ))}
                </div>
            </nav>
        </>
    );
}
