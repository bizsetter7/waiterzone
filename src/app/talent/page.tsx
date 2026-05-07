import React from 'react';
import { Metadata } from 'next';
import TalentClient from './TalentClient';

export const metadata: Metadata = {
    title: '인재정보(이력서) - 1위 남성알바 웨이터존 (룸웨이터·노래방알바·남성유흥알바)',
    description: '전국 고소득 남성알바 인재 정보. 룸웨이터, 노래방알바, 남성유흥알바 구직자들의 이력서를 확인하고 면접 제안을 보내세요. 당일지급 보장 업체 전용 서비스.',
    keywords: ['인재정보', '이력서조회', '남성알바구직', '남성유흥알바인재', '야간알바구직', '룸웨이터인재', '웨이터존'],
    robots: { index: false, follow: false },
    alternates: {
        canonical: 'https://www.waiterzone.kr/talent',
    },
    openGraph: {
        title: '인재정보(이력서) - 웨이터존',
        description: '실시간 남성알바 인재 리스트. 사장님을 위한 맞춤형 인력 관리 서비스.',
        url: 'https://www.waiterzone.kr/talent',
        siteName: '웨이터존',
        images: [{ url: 'https://www.waiterzone.kr/og-image.jpg', width: 1200, height: 630 }],
        type: 'website',
    },
};

export default function TalentPage() {
    return <TalentClient />;
}
