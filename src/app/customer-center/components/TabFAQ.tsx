'use client';

import React, { useState } from 'react';
import { useBrand } from '@/components/BrandProvider';
import { ChevronUp, ChevronDown } from 'lucide-react';

const FAQS = [
    { id: 1, question: '광고비 결제는 어떻게 하나요?', answer: '현재 무통장 입금과 카드 결제를 지원하고 있습니다. 마이페이지 > 광고관리에서 결제 수단을 선택해주세요.' },
    { id: 2, question: '게시글이 삭제되었어요.', answer: '커뮤니티 운영 정책에 위반되는 게시글(욕설, 비방, 광고 등)은 관리자에 의해 예고 없이 삭제될 수 있습니다.' },
    { id: 3, question: '비밀번호를 잊어버렸어요.', answer: '로그인 화면 하단의 &quot;비밀번호 찾기&quot;를 이용해주세요. 이메일 인증 후 재설정이 가능합니다.' },
    { id: 4, question: '업소 회원 승인은 얼마나 걸리나요?', answer: '사업자등록증 제출 후 영업일 기준 24시간 이내에 승인 처리가 완료됩니다.' },
    { id: 5, question: '이력서 열람권이 무엇인가요?', answer: '광고를 등록한 사장님들께 제공되는 혜택으로, 구직자들의 이력서를 사전에 확인하고 개별 면접 제의를 할 수 있는 권한입니다.' },
    { id: 6, question: '광고 연장은 어떻게 하나요?', answer: '야사장(yasajang.kr) 마이샵 > 구독 관리에서 갱신 요청을 하시면 됩니다. 만료 30일 전부터 연장 신청이 가능하며, 무통장 입금 확인 후 자동으로 기간이 연장됩니다.' },
    { id: 7, question: '점프(JUMP)란 무엇인가요?', answer: '점프는 내 광고를 플랫폼 최상단으로 즉시 이동시키는 기능입니다. 야사장 마이샵에서 "점프하기" 버튼을 누르면 1회 차감되어 실시간으로 최상단에 노출됩니다. 스페셜/디럭스/프리미엄 구독 시 무료 점프가 지급되며, 프리미엄은 매일 +1회 추가 적립됩니다.' },
    { id: 8, question: '플랜(구독 플랜)을 변경하고 싶어요.', answer: '현재 구독 만료 후 새 플랜으로 재신청하는 방식으로 변경 가능합니다. 업그레이드가 필요하신 경우 1:1 문의를 통해 문의해 주시면 안내해 드립니다.' },
    { id: 9, question: '환불은 가능한가요?', answer: '광고 게시 전(심사 대기 중) 취소 시에는 전액 환불이 가능합니다. 광고 게시 시작 후에는 잔여 기간에 대한 부분 환불이 원칙이나, 환불 정책 상세는 운영 정책 탭에서 확인하시거나 1:1 문의를 이용해 주세요.' },
    { id: 10, question: '광고 게시를 일시 중단하고 싶어요.', answer: '광고 일시 중단은 야사장 어드민 또는 1:1 문의를 통해 요청 가능합니다. 게시 중단 기간 동안에도 구독 기간은 계속 차감되며, 재게시 시 즉시 노출 재개됩니다.' },
];

export const TabFAQ = () => {
    const brand = useBrand();
    const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
                <div className="w-1 h-7 bg-[#1e3a5f] rounded-full shrink-0" />
                <h3 className={`text-2xl font-black ${brand.theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>자주 묻는 질문</h3>
            </div>
            <div className="space-y-4">
                {FAQS.map(faq => (
                    <div key={faq.id} className={`rounded-[28px] shadow-sm border overflow-hidden transition-all ${brand.theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                        <button
                            onClick={() => setExpandedFaq(expandedFaq === faq.id ? null : faq.id)}
                            className={`w-full p-7 flex items-center justify-between text-left transition-colors ${brand.theme === 'dark' ? 'hover:bg-gray-700/50' : 'hover:bg-gray-50'}`}
                        >
                            <span className={`font-black text-[15px] flex gap-4 pr-4 ${brand.theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                <span className="text-[#1e3a5f]">Q.</span> {faq.question}
                            </span>
                            {expandedFaq === faq.id ? <ChevronUp size={24} className={brand.theme === 'dark' ? 'text-white' : 'text-gray-900'} /> : <ChevronDown size={24} className="text-gray-400" />}
                        </button>
                        {expandedFaq === faq.id && (
                            <div className={`p-8 border-t text-[15px] leading-loose font-bold ${brand.theme === 'dark' ? 'bg-gray-900/50 border-gray-700 text-gray-300' : 'bg-gray-50 border-gray-100 text-gray-800'}`}>
                                {faq.answer}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};
