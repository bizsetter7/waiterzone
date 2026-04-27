import React from 'react';
import { Metadata } from 'next';
import UpdatePasswordPage from './ChangePasswordClient';

export const metadata: Metadata = {
    title: '새 비밀번호 설정 - 웨이터존',
    robots: 'noindex, nofollow',
};

export default function Page() {
    return <UpdatePasswordPage />;
}
