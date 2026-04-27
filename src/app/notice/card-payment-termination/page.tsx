import React from 'react';
import { Metadata } from 'next';
import TerminationClient from './TerminationClient';

export const metadata: Metadata = {
    title: '카드 결제 서비스 종료 안내 - 웨이터존 공지사항',
    description: '웨이터존 카드 결제 서비스 종료 및 무통장 입금 방식 전환 안내입니다. 서비스 이용에 참고하시기 바랍니다.',
    alternates: {
        canonical: 'https://www.waiterzone.kr/notice/card-payment-termination',
    },
    openGraph: {
        title: '카드 결제 서비스 종료 안내 - 웨이터존',
        description: '결제 시스템 정책 변경에 따른 카드 결제 종료 안내입니다.',
        url: 'https://www.waiterzone.kr/notice/card-payment-termination',
        images: [{ url: 'https://www.waiterzone.kr/og-image.jpg' }],
    },
};

export default function CardNoticePage() {
    return <TerminationClient />;
}
