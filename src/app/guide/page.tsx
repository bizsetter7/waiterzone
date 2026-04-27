import React from 'react';
import { Metadata } from 'next';
import GuideClient from './GuideClient';

export const metadata: Metadata = {
    title: '이용가이드 - 웨이터존 (룸웨이터·노래방알바·남성유흥알바 초보 가이드)',
    description: '남성알바 구인구직 1위 웨이터존 이용 방법. 룸웨이터, 노래방알바, 남성유흥알바를 안전하고 현명하게 구하는 팁과 고객센터 이용 안내.',
    keywords: ['웨이터존가이드', '남성유흥알바가이드', '야간알바꿀팁', '초보알바가이드', '노래방알바팁', '룸웨이터팁'],
    alternates: {
        canonical: 'https://www.waiterzone.kr/guide',
    },
    openGraph: {
        title: '이용가이드 - 웨이터존',
        description: '남성알바 성공을 위한 첫걸음, 웨이터존 이용 가이드를 확인해보세요.',
        url: 'https://www.waiterzone.kr/guide',
        siteName: '웨이터존',
        images: [{ url: 'https://www.waiterzone.kr/og-image.jpg', width: 1200, height: 630 }],
        type: 'website',
    },
};

export default function GuidePage() {
    return <GuideClient />;
}
