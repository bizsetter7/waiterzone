'use client';

import React from 'react';
import { useBrand } from '@/components/BrandProvider';

export const TabPolicies = () => {
    const brand = useBrand();

    const sectionHeader = (title: string) => (
        <div className="flex items-center gap-3 mb-6 bg-slate-50/10 dark:bg-white/5 p-2 rounded-xl md:bg-white/40 md:p-4 md:rounded-2xl md:border md:border-gray-100/50 md:dark:border-gray-800/50">
            <div className="w-2 h-8 bg-[#f82b60] rounded-full"></div>
            <h3 className={`text-2xl font-black ${brand.theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{title}</h3>
        </div>
    );

    const boxClass = `p-8 rounded-[30px] border leading-relaxed text-[14px] font-medium space-y-5 ${brand.theme === 'dark' ? 'bg-gray-900/50 border-gray-800 text-gray-400' : 'bg-white border-gray-100 text-gray-600 shadow-sm'}`;
    const headClass = 'font-black text-gray-900 dark:text-white';
    const bodyClass = 'ml-2 text-gray-500';

    return (
        <div className="space-y-10">

            {/* ── 이용약관 ─────────────────────────── */}
            <section id="terms" className="scroll-mt-32">
                {sectionHeader('서비스 이용약관')}
                <div className={boxClass}>
                    <div>
                        <p className={`mb-1 ${headClass}`}>제 1조 (목적)</p>
                        <p className={bodyClass}>본 약관은 초코아이디어(이하 &quot;회사&quot;)가 운영하는 웨이터존(waiterzone.co.kr) 온라인 구인구직 플랫폼 및 관련 부가 서비스의 이용 조건과 절차, 회사와 회원 간의 권리·의무 및 책임 사항을 규정함을 목적으로 합니다.</p>
                    </div>
                    <div>
                        <p className={`mb-1 ${headClass}`}>제 2조 (정의)</p>
                        <p className={bodyClass}>
                            1. &quot;서비스&quot;란 회사가 제공하는 구인공고 등록, 이력서 등록, 광고 대행, 커뮤니티, 인재 매칭, 1:1 상담 등 일체의 기능을 말합니다.<br />
                            2. &quot;회원&quot;이란 본 약관에 동의하고 회원가입 절차를 완료한 자를 말하며, 개인회원과 기업(업체)회원으로 구분됩니다.<br />
                            3. &quot;기업회원&quot;이란 사업자등록증 등 적법한 영업 근거를 갖추고 구인공고를 등록하는 사업자를 말합니다.
                        </p>
                    </div>
                    <div>
                        <p className={`mb-1 ${headClass}`}>제 3조 (약관의 효력 및 변경)</p>
                        <p className={bodyClass}>
                            1. 본 약관은 서비스 화면에 게시하거나 기타 방법으로 공지함으로써 효력이 발생합니다.<br />
                            2. 회사는 합리적인 사유가 있는 경우 관련 법령을 위반하지 않는 범위 내에서 본 약관을 변경할 수 있으며, 변경 시 최소 7일 전 공지합니다. 중요한 변경 사항은 30일 전 공지합니다.
                        </p>
                    </div>
                    <div>
                        <p className={`mb-1 ${headClass}`}>제 4조 (서비스의 제공 및 변경)</p>
                        <p className={bodyClass}>
                            1. 회사는 구인공고 등록, 이력서 열람권 제공, 광고 상품 판매, 커뮤니티 운영 등의 서비스를 제공합니다.<br />
                            2. 회사는 서비스 품질 향상, 운영상·기술상의 필요에 따라 서비스 내용을 변경하거나 일시 중단할 수 있으며, 이 경우 사전 공지합니다.<br />
                            3. 광고 상품의 단가 및 정책은 회사 사정에 따라 변경될 수 있으며, 변경 시 공지사항을 통해 안내합니다.
                        </p>
                    </div>
                    <div>
                        <p className={`mb-1 ${headClass}`}>제 5조 (회원의 의무)</p>
                        <p className={bodyClass}>
                            1. 회원은 관계 법령, 본 약관 및 회사가 공지한 운영 정책을 준수하여야 합니다.<br />
                            2. 회원은 타인의 개인정보를 무단으로 수집·이용하거나 허위 정보를 등록하여서는 안 됩니다.<br />
                            3. 성매매, 불법 알선, 금칙어 등 법령 또는 공서양속에 반하는 내용을 게시하거나 유도하는 행위는 엄격히 금지됩니다.<br />
                            4. 위반 시 회사는 해당 게시물 삭제, 이용 정지, 영구 탈퇴 처리 등의 조치를 취할 수 있습니다.
                        </p>
                    </div>
                    <div>
                        <p className={`mb-1 ${headClass}`}>제 6조 (광고 서비스 및 환불 정책)</p>
                        <p className={bodyClass}>
                            1. 광고 상품은 결제 완료 후 기업회원 심사를 거쳐 등록됩니다.<br />
                            2. 광고 게재 중 사업자 귀책사유(금칙어, 허위정보 등)로 게시물이 삭제된 경우 환불되지 않습니다.<br />
                            3. 회사 귀책사유로 인한 서비스 장애 발생 시, 장애 시간에 해당하는 광고 기간을 연장하거나 환불합니다.
                        </p>
                    </div>
                    <div>
                        <p className={`mb-1 ${headClass}`}>제 7조 (면책 조항)</p>
                        <p className={bodyClass}>회사는 천재지변, 불가항력적 사유, 회원의 귀책사유로 인한 서비스 이용 장애에 대해 책임을 지지 않습니다. 또한 회원 간 거래 또는 면접 과정에서 발생하는 분쟁에 대해 회사는 중개 의무만을 부담하며 직접적인 책임은 지지 않습니다.</p>
                    </div>
                </div>
            </section>

            {/* ── 개인정보처리방침 ─────────────────── */}
            <section id="privacy" className="scroll-mt-32">
                {sectionHeader('개인정보처리방침')}
                <div className={boxClass}>
                    <p className="text-gray-500 italic">&quot;웨이터존&quot;는 「개인정보 보호법」 및 「정보통신망 이용촉진 및 정보보호 등에 관한 법률」에 따라 회원의 개인정보를 보호하고 이와 관련한 고충을 신속하게 처리하기 위해 아래와 같이 개인정보처리방침을 수립·공개합니다.</p>
                    <div>
                        <p className={`mb-1 ${headClass}`}>1. 수집하는 개인정보 항목</p>
                        <p className={bodyClass}>
                            • 개인회원: 닉네임, 이메일, 비밀번호(암호화), 지역 정보, 이력서 내용(선택)<br />
                            • 기업회원: 상호명, 대표자명, 사업자등록번호, 연락처, 업소 주소, 결제 정보<br />
                            • 공통: 서비스 이용 기록, 접속 IP, 쿠키, 기기 정보
                        </p>
                    </div>
                    <div>
                        <p className={`mb-1 ${headClass}`}>2. 개인정보의 수집 및 이용 목적</p>
                        <p className={bodyClass}>
                            • 회원 가입 및 관리, 본인 확인<br />
                            • 구인·구직 서비스 및 광고 서비스 제공<br />
                            • 고객 상담 및 민원 처리<br />
                            • 서비스 개선 및 신규 서비스 개발<br />
                            • 부정 이용 방지 및 보안 강화
                        </p>
                    </div>
                    <div>
                        <p className={`mb-1 ${headClass}`}>3. 개인정보의 보유 및 이용 기간</p>
                        <p className={bodyClass}>
                            원칙적으로 회원 탈퇴 시 지체 없이 파기하나, 관계 법령에 따라 아래 기간 동안 보관합니다.<br />
                            • 계약 또는 청약철회 기록: 5년 (전자상거래법)<br />
                            • 대금 결제 및 재화 공급 기록: 5년 (전자상거래법)<br />
                            • 소비자 불만 및 분쟁 처리 기록: 3년 (전자상거래법)<br />
                            • 접속 로그 기록: 3개월 (통신비밀보호법)
                        </p>
                    </div>
                    <div>
                        <p className={`mb-1 ${headClass}`}>4. 개인정보의 제3자 제공</p>
                        <p className={bodyClass}>회사는 원칙적으로 회원의 개인정보를 외부에 제공하지 않습니다. 다만, 회원의 사전 동의가 있거나 법령에 의한 요청이 있는 경우에 한해 제공합니다.</p>
                    </div>
                    <div>
                        <p className={`mb-1 ${headClass}`}>5. 개인정보 보호책임자</p>
                        <p className={bodyClass}>
                            책임자: 김대순, 고남우 (초코아이디어 대표)<br />
                            연락처: 1877-1442<br />
                            이메일: bizsetter7@gmail.com<br />
                            개인정보 관련 문의는 위 이메일 또는 고객센터(1877-1442)를 통해 접수할 수 있습니다.
                        </p>
                    </div>
                    <div>
                        <p className={`mb-1 ${headClass}`}>6. 쿠키 운영</p>
                        <p className={bodyClass}>회사는 서비스 개선 및 이용 편의를 위해 쿠키를 사용합니다. 회원은 브라우저 설정을 통해 쿠키 저장을 거부할 수 있으나, 이 경우 일부 서비스 이용이 제한될 수 있습니다.</p>
                    </div>
                </div>
            </section>

            {/* ── 청소년 보호정책 ──────────────────── */}
            <section id="youth" className="scroll-mt-32">
                {sectionHeader('청소년 보호정책')}
                <div className={boxClass}>
                    <p className="text-gray-500">웨이터존는 청소년이 건전한 환경에서 성장할 수 있도록 「청소년 보호법」 및 「정보통신망 이용촉진 및 정보보호 등에 관한 법률」에 따라 청소년 보호를 위한 정책을 수립하여 운영합니다.</p>
                    <div>
                        <p className={`mb-1 ${headClass}`}>1. 청소년 유해 매체물 지정 및 관리</p>
                        <p className={bodyClass}>
                            • 본 서비스는 성인 업소(유흥·단란·향락 등) 관련 구인구직 플랫폼으로, 만 18세 미만 청소년의 가입 및 이용을 엄격히 제한합니다.<br />
                            • 회원가입 시 성인 인증 절차를 통해 미성년자의 접근을 차단합니다.
                        </p>
                    </div>
                    <div>
                        <p className={`mb-1 ${headClass}`}>2. 청소년 유해정보 게시 금지</p>
                        <p className={bodyClass}>
                            • 청소년에게 유해한 음란물, 폭력적 콘텐츠, 불법 행위 유도 정보의 게시를 엄격히 금지합니다.<br />
                            • 위반 게시물은 발견 즉시 삭제하며, 해당 회원의 이용 자격을 정지하거나 영구 탈퇴 처리합니다.<br />
                            • 법령 위반 사항은 관계 기관에 신고합니다.
                        </p>
                    </div>
                    <div>
                        <p className={`mb-1 ${headClass}`}>3. 청소년 보호를 위한 기술적 조치</p>
                        <p className={bodyClass}>
                            • 기업회원 인증 시스템을 통해 사업자등록증 확인 후 공고 등록을 허용합니다.<br />
                            • AI 기반 금칙어 필터링 시스템을 운영하여 불법·유해 표현이 포함된 공고의 등록을 자동 차단합니다.<br />
                            • 관리자가 상시 모니터링하며, 신고된 게시물은 24시간 이내 조치합니다.
                        </p>
                    </div>
                    <div>
                        <p className={`mb-1 ${headClass}`}>4. 청소년 보호 책임자</p>
                        <p className={bodyClass}>
                            책임자: 김대순, 고남우 (초코아이디어 대표)<br />
                            연락처: 1877-1442<br />
                            이메일: bizsetter7@gmail.com<br />
                            청소년 보호와 관련한 불법·유해 정보 신고는 위 연락처 또는 1:1 문의를 통해 접수 가능합니다.
                        </p>
                    </div>
                    <div>
                        <p className={`mb-1 ${headClass}`}>5. 위반 시 처리 기준</p>
                        <p className={bodyClass}>
                            • 1차 위반: 게시물 삭제 및 경고<br />
                            • 2차 위반: 30일 이용 정지<br />
                            • 3차 이상 또는 중대 위반: 영구 이용 정지 및 관계 기관 신고
                        </p>
                    </div>
                </div>
            </section>
        </div>
    );
};
