
import React from 'react';
import { Metadata } from 'next';
import CommunityContent from './CommunityContent';

export const metadata: Metadata = {
    title: '커뮤니티 & 후기 - 웨이터존 (룸웨이터·노래방알바·남성유흥알바·고소득 남성알바 꿀팁)',
    description: '웨이터존 커뮤니티 소통방. 고수익 남성알바, 웨이터알바, 노래방알바 등의 생생한 후기와 야간알바 꿀팁을 공유하세요.',
    alternates: {
        canonical: 'https://www.waiterzone.kr/community',
    },
    openGraph: {
        title: '커뮤니티 & 후기 - 웨이터존',
        description: '형님들의 솔직한 알바 후기와 꿀팁, 고민상담. 익명 보장, 100% 리얼 후기.',
        url: 'https://www.waiterzone.kr/community',
        siteName: '웨이터존',
        type: 'website',
    },
};

export default function CommunityPage() {
    return <CommunityContent />;
}
