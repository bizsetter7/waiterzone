'use client';

import React, { useState } from 'react';
import { useBrand } from '@/components/BrandProvider';
import { JobScamNoticeDetail } from './JobScamNoticeDetail';
import { CardPaymentNoticeDetail } from './CardPaymentNoticeDetail';
import { ResumeNoticeDetail } from './ResumeNoticeDetail';
import { EventOpenNoticeDetail } from './EventOpenNoticeDetail';
import { ChevronDown, Clock } from 'lucide-react';

const NOTICES = [
    {
        id: 11,
        title: '[이벤트] 웨이터존 오픈기념 상생지원 이벤트 및 이용안내',
        date: '2026-04-02',
        isNew: true,
        category: '이벤트',
        type: 'event-open'
    },
    {
        id: 10,
        title: '[필독] 취업사기 주의 — 피해 예방 가이드',
        date: '2026-03-19',
        isNew: true,
        category: '필독',
        type: 'job-scam',
    },
    {
        id: 9,
        title: '[필독] 광고 등록 시 금칙어 규정 및 게시물 운영 정책 안내',
        date: '2026-02-13',
        isNew: true,
        category: '필독',
        content: `광고 등록 및 수정 시 다음의 금칙어 규정을 반드시 준수해주시기 바랍니다.

1. 금칙어 및 제한 표현
- 욕설, 비속어 및 타인에게 불쾌감을 주는 표현
- 타 사이트 유도 및 직거래 권유 문구
- 근거 없는 허위 사실 및 과대 광고 (예: 전국 1위, 무조건 보장 등)
- 성매매 및 불법 행위를 암시하는 은어 및 단어

2. 게시물 운영 정책
- 동일한 내용의 광고를 중복 등록하는 도배 행위 금지
- 업소 정보와 무관한 이미지 및 내용 기재 금지
- 타 업소 비방 및 명예훼손성 발언 금지

위 규정을 위반할 경우, 광고 심사에서 거절되거나 예고 없이 게시물이 삭제될 수 있으며 이용 권한이 제한될 수 있습니다.
회원님들의 건강한 구인 환경을 위해 협조 부탁드립니다.`
    },
    {
        id: 8,
        title: '[중요] 카드 결제 서비스 종료 및 입금 방식 전환 안내',
        date: '2025-06-21',
        isNew: true,
        category: '공지',
        type: 'card-payment-end'
    },
    {
        id: 7,
        title: '[필독] 이력서 등록 시 주의사항 (허위사실 기재 금지 등)',
        date: '2026-02-07',
        isNew: true,
        category: '필독',
        type: 'rich-resume'
    },
    {
        id: 6,
        title: '[중요] 서비스 전면 개편 및 광고 상품 단가 확정 안내',
        date: '2026-01-27',
        isNew: true,
        category: '공지',
        content: `브랜드 통합 시스템 오픈과 함께 광고 상품의 단가가 확정되었습니다.
더욱 효율적인 구인 환경을 제공하기 위해 시스템이 전면 개편되었으니 이용에 참고하시기 바랍니다.
상세한 단가는 고객센터 > 광고안내 탭에서 확인하실 수 있습니다.`
    },
    {
        id: 5,
        title: '[안내] PC버전 사이드배너 광고 노출 시스템 도입 안내',
        date: '2026-01-25',
        isNew: true,
        category: '공지',
        content: `PC 버전 사용자를 위한 사이드 고정 배너 노출 시스템이 도입되었습니다.
스크롤을 내려도 사라지지 않는 고정형 배너로 더욱 높은 노출 효과를 경험해 보세요.`
    },
    {
        id: 4,
        title: '[공지] 남성 전용 1:1 실시간 채팅 상담 상담원 증설 안내',
        date: '2026-01-15',
        isNew: true,
        category: '공지',
        content: `회원님들의 안전하고 전문적인 상담을 위해 실시간 채팅 상담원을 대폭 증설하였습니다.
궁금하신 점은 언제든 1:1 상담을 통해 문의해 주세요.`
    },
    {
        id: 3,
        title: '[안내] 프리미엄 광고 "Grand Tier" 서비스 개편 및 혜택 안내',
        date: '2026-01-10',
        isNew: false,
        category: '점검',
        content: `최상위 광고 등급인 그랜드 티어(Grand Tier)의 혜택이 더욱 강화되었습니다.
메인 최상단 노출뿐만 아니라 전국 검색 결과 우선순위 적용 등 압도적인 혜택을 누려보세요.`
    },
];

export const TabNotice = () => {
    const brand = useBrand();
    const [expandedNotice, setExpandedNotice] = useState<number | null>(null);

    return (
        <div className="space-y-2 md:space-y-3">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                    <div className="w-1 h-7 bg-[#1e3a5f] rounded-full shrink-0" />
                    <h3 className={`text-2xl font-black ${brand.theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>공지사항</h3>
                </div>
                <span className={`text-xs px-3 py-1 rounded-full font-black ${brand.theme === 'dark' ? 'bg-gray-700 text-gray-100' : 'bg-gray-100 text-gray-600'}`}>총 {NOTICES.length}건</span>
            </div>
            {NOTICES.map((notice, idx) => (
                <div key={notice.id} className={`${idx !== NOTICES.length - 1 ? (brand.theme === 'dark' ? 'border-b border-gray-700' : 'border-b border-gray-100') : ''}`}>
                    <div
                        onClick={() => setExpandedNotice(expandedNotice === notice.id ? null : notice.id)}
                        className={`p-3 md:p-4 px-4 md:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer transition-colors ${brand.theme === 'dark' ? 'hover:bg-gray-700/50' : 'hover:bg-gray-50'} ${expandedNotice === notice.id ? (brand.theme === 'dark' ? 'bg-gray-700/30' : 'bg-gray-50/50') : ''}`}
                    >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                            <span className={`w-12 h-6 flex items-center justify-center shrink-0 rounded text-[10px] font-black ${notice.category === '필독' ? 'bg-red-600 text-white' : notice.category === '공지' ? 'bg-gray-900 text-white' : notice.category === '점검' ? 'bg-gray-400 text-white' : 'bg-[#1e3a5f] text-white'}`}>
                                {notice.category}
                            </span>
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                                <span className={`text-[14px] md:text-[15px] font-black line-clamp-2 ${notice.isNew ? (brand.theme === 'dark' ? 'text-gray-100' : 'text-gray-900') : (brand.theme === 'dark' ? 'text-gray-300' : 'text-gray-800')}`}>
                                    {notice.title}
                                </span>
                                {notice.isNew && <span className="w-1.5 h-1.5 bg-red-600 rounded-full shrink-0 animate-pulse"></span>}
                            </div>
                        </div>
                        <div className="flex items-center justify-between sm:justify-end gap-4">
                            <span className="text-xs text-gray-600 font-bold flex items-center gap-1.5">
                                <Clock size={16} /> {notice.date}
                            </span>
                            <div className={`transition-transform duration-300 ${expandedNotice === notice.id ? 'rotate-180 text-[#1e3a5f]' : 'text-gray-300'}`}>
                                <ChevronDown size={20} />
                            </div>
                        </div>
                    </div>
                    {expandedNotice === notice.id && (
                        <div className={`p-4 md:p-8 pt-2 border-t text-[14px] md:text-[15px] leading-loose font-bold whitespace-pre-wrap animate-in slide-in-from-top-2 duration-300 ${brand.theme === 'dark' ? 'bg-gray-900/50 border-gray-700 text-gray-300' : 'bg-gray-50 border-gray-100 text-gray-800'}`}>
                            {notice.type === 'rich-resume' ? (
                                <ResumeNoticeDetail />
                            ) : notice.type === 'card-payment-end' ? (
                                <CardPaymentNoticeDetail />
                            ) : notice.type === 'job-scam' ? (
                                <JobScamNoticeDetail />
                            ) : notice.type === 'event-open' ? (
                                <EventOpenNoticeDetail />
                            ) : (
                                notice.content
                            )}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};
