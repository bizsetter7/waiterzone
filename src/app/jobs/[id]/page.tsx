import React from 'react';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import shopsData from '@/lib/data/shops.json';
import { Shop } from '@/types/shop';
import { generateSEOKeywords } from '@/utils/shopUtils';
import ShopDetailView from '@/components/jobs/ShopDetailView';

// Force dynamic rendering for now if data is mutable, or static params if static
export const dynamic = 'force-dynamic';

interface Props {
    params: {
        id: string;
    };
}

// 1. Generate Metadata for SEO
export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const shop = (shopsData as Shop[]).find((s) => s.id === params.id);

    if (!shop) {
        return {
            title: '채용정보를 찾을 수 없습니다 - 웨이터존',
        };
    }

    const regionName = shop.region?.replace(/[\[\]]/g, '').split(' ')[0] || '전국';
    const districtName = shop.region?.replace(/[\[\]]/g, '').split(' ')[1] || '';
    const category = shop.workType || shop.category || '룸웨이터';
    
    // [v3.6] AI 용어 배제 및 타겟 SEO(여자남성유흥알바) 강화
    const cleanTitle = (shop.title || '')
        .replace(/엔터프라이즈|인재솔루션|인재알바/g, '고수익알바');
    
    const pageTitle = `${shop.name} - ${regionName} ${districtName} 여자야간알바·여자남성유흥알바 전문 | 웨이터존`;
    const description = `${regionName} ${districtName} 위치한 ${shop.name}의 ${category} 상세정보. ${cleanTitle} 급여: ${shop.pay || '당일지급'}. 확실하게 검증된 고소득 남성유흥알바 정보를 확인하세요.`;

    return {
        title: pageTitle,
        description,
        keywords: [...generateSEOKeywords(shop.region), '여자야간알바', '여자남성유흥알바', '여자룸웨이터', '고수익알바', '야간알바', '당일지급', '엔터알바'],
        openGraph: {
            title: `${shop.name} 채용정보 - 웨이터존`,
            description,
            url: `https://waiterzone.kr/jobs/${params.id}`,
            siteName: '웨이터존',
            type: 'article',
        },
    };
}

// 2. Page Component
export default function JobDetailPage({ params }: Props) {
    const shop = (shopsData as Shop[]).find((s) => s.id === params.id);

    if (!shop) {
        notFound();
    }

    const regionName = shop.region?.replace(/[\[\]]/g, '').split(' ')[0] || '전국';
    const districtName = shop.region?.replace(/[\[\]]/g, '').split(' ')[1] || '';
    const category = shop.workType || shop.category || '룸웨이터';

    // [v3.5] 구글 잡스(JobPosting) 및 SEO 스키마 설계
    const webPageSchema = {
        "@context": "https://schema.org",
        "@type": "WebPage",
        "name": `${shop.name} - ${regionName} 채용정보`,
        "description": `${shop.name}에서 ${category} 파트를 채용합니다.`,
        "url": `https://waiterzone.kr/jobs/${params.id}`,
        "publisher": { "@type": "Organization", "name": "웨이터존" }
    };

    const breadcrumbSchema = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "홈", "item": "https://waiterzone.kr" },
            { "@type": "ListItem", "position": 2, "name": "채용정보", "item": "https://waiterzone.kr/jobs" },
            { "@type": "ListItem", "position": 3, "name": `${shop.name} 채용`, "item": `https://waiterzone.kr/jobs/${params.id}` }
        ]
    };

    const jobPostingSchema = {
        "@context": "https://schema.org",
        "@type": "JobPosting",
        "title": `[${regionName}] ${shop.name} 여자야간알바·여자남성유흥알바 채용 - 웨이터존`,
        "description": `${shop.title || shop.content || '상세정보 참조'}`
            .replace(/엔터프라이즈|인재솔루션|인재알바/g, '고수익알바'),
        "identifier": {
            "@type": "PropertyValue",
            "name": "WAITERZONE",
            "value": shop.id
        },
        "datePosted": shop.created_at || "2026-03-01T00:00:00Z",
        "validThrough": shop.deadline || "2026-12-31T23:59:59Z",
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
                "addressLocality": regionName,
                "addressRegion": "KR",
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
        <div className="w-full min-h-screen bg-gray-50 flex justify-center">
            {/* SEO Scripts */}
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageSchema) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jobPostingSchema) }} />
            
            <div className="w-full max-w-2xl bg-white shadow-lg min-h-screen">
                <ShopDetailView shop={shop} />
            </div>
        </div>
    );
}
