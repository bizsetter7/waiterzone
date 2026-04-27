import React from 'react';
import { Metadata } from 'next';
import ScamNoticeClient from './ScamNoticeClient';

export const metadata: Metadata = {
    title: '취업 사기 유형 및 예방 수칙 - 웨이터존 안전 가이드',
    description: '남성알바 구인구직 시 주의해야 할 취업 사기 유형과 안전한 구직을 위한 필수 예방 수칙을 안내해 드립니다.',
    alternates: {
        canonical: 'https://www.waiterzone.kr/notice/job-scam',
    },
    openGraph: {
        title: '취업 사기 예방 안내 - 웨이터존',
        description: '안전한 야간알바 구직을 위한 필수 체크리스트.',
        url: 'https://www.waiterzone.kr/notice/job-scam',
        images: [{ url: 'https://www.waiterzone.kr/og-image.jpg' }],
    },
};

export default function JobScamNoticePage() {
    return <ScamNoticeClient />;
}
