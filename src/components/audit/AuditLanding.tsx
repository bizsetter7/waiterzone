'use client';

import React from 'react';
import { ShieldCheck, Users, TrendingUp, CheckCircle, Mail, Phone, Lock, User, Smartphone, X } from 'lucide-react';
import { Footer } from '@/components/layout/Footer';

export const AuditLanding = () => {
    const [showVerifyModal, setShowVerifyModal] = React.useState(false);
    const [verifyStep, setVerifyStep] = React.useState<'select' | 'phone' | 'success'>('select');

    const handleOpenVerify = () => {
        setVerifyStep('select');
        setShowVerifyModal(true);
    };
    return (
        <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-blue-100 selection:text-blue-700">
            {/* Simple Top Navigation */}
            <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md border-b border-slate-100 z-50">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                            <ShieldCheck className="text-white" size={20} />
                        </div>
                        <span className="text-lg font-black tracking-tight text-slate-900 uppercase">초코파트너스</span>
                    </div>
                    <div className="hidden md:flex items-center gap-8 text-sm font-bold text-slate-500">
                        <a href="#about" className="hover:text-blue-600 transition-colors">서비스 소개</a>
                        <a href="#features" className="hover:text-blue-600 transition-colors">주요 기능</a>
                        <a href="#contact" className="hover:text-blue-600 transition-colors">고객 지원</a>
                    </div>
                    <button className="bg-slate-900 text-white px-5 py-2 rounded-full text-xs font-bold hover:bg-slate-800 transition-all">
                        파트너십 문의
                    </button>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="pt-32 pb-10 px-6">
                <div className="max-w-7xl mx-auto text-center">
                    <div className="inline-flex items-center gap-2 bg-blue-50 px-4 py-1.5 rounded-full border border-blue-100 mb-6">
                        <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">Next-Gen Business Solution</span>
                    </div>
                    <h1 className="text-4xl md:text-6xl font-black text-slate-900 mb-6 leading-[1.1] tracking-tight">
                        귀하의 성장을 위한<br />
                        <span className="text-blue-600">완벽한 비즈니스 파트너</span>
                    </h1>
                    <p className="text-lg text-slate-500 max-w-2xl mx-auto mb-10 leading-relaxed font-medium">
                        초코아이디어는 효율적인 인재 매칭과 전략적인 마케팅 솔루션을 제공하여
                        귀하의 비즈니스가 더 높은 곳으로 도약할 수 있도록 지원합니다.
                    </p>
                </div>
            </section>

            {/* [New] Simplified Login Box */}
            <section className="pb-20 px-6">
                <div className="max-w-md mx-auto bg-white rounded-3xl border border-slate-100 shadow-xl p-8 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-600 to-indigo-600" />
                    <div className="relative z-10">
                        <h2 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2">
                            <Lock size={18} className="text-blue-600" /> 파트너 로그인
                        </h2>
                        <div className="space-y-4">
                            <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    type="text"
                                    placeholder="아이디"
                                    className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-slate-400"
                                />
                            </div>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    type="password"
                                    placeholder="비밀번호"
                                    className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-slate-400"
                                />
                            </div>
                            <button className="w-full py-4 bg-blue-600 text-white font-black rounded-2xl shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all transform active:scale-[0.98]">
                                로그인하기
                            </button>
                            <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 px-1 pt-2">
                                <div className="flex gap-4">
                                    <span className="cursor-pointer hover:text-slate-600">아이디 찾기</span>
                                    <span className="cursor-pointer hover:text-slate-600">비밀번호 찾기</span>
                                </div>
                                <span className="text-blue-600 cursor-pointer">회원가입</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="py-20 bg-slate-50">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            {
                                icon: <Users size={24} />,
                                title: "스마트 매칭 시스템",
                                desc: "전문성을 가진 검증된 인력을 최적의 조건으로 연결해 드립니다."
                            },
                            {
                                icon: <TrendingUp size={24} />,
                                title: "실시간 마케팅 분석",
                                desc: "데이터 기반의 실시간 리포트를 통해 마케팅 성과를 극대화합니다."
                            },
                            {
                                icon: <CheckCircle size={24} />,
                                title: "전문가 지원 플랫폼",
                                desc: "비즈니스 운영에 필요한 각종 리소스와 전문 가이드를 제공합니다."
                            }
                        ].map((f, i) => (
                            <div key={i} className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all">
                                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-6">
                                    {f.icon}
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-4">{f.title}</h3>
                                <p className="text-slate-500 leading-relaxed">{f.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* [New] Business Verification System Section */}
            <section className="py-24 bg-white">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-black text-slate-900 mb-4">신뢰할 수 있는 파트너 시스템</h2>
                        <p className="text-slate-500 font-medium">초코아이디어는 투명하고 안전한 비즈니스 환경을 위해 엄격한 본인 및 계좌 인증 시스템을 준수합니다.</p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-12 items-center">
                        <div className="space-y-6">
                            {[
                                {
                                    icon: <Smartphone className="text-blue-600" />,
                                    title: "실명 본인 확인",
                                    desc: "국내 3대 통신사 및 사설 인증서를 통한 정확한 실명 확인 프로세스를 거칩니다."
                                },
                                {
                                    icon: <ShieldCheck className="text-blue-600" />,
                                    title: "개인정보 완벽 보호",
                                    desc: "모든 인증 단계는 보안 프로토콜을 준수하며, 정보는 철저히 암호화되어 관리됩니다."
                                }
                            ].map((item, idx) => (
                                <div key={idx} className="flex gap-5 p-6 rounded-2xl border border-slate-50 hover:border-blue-100 transition-all bg-slate-50/50">
                                    <div className="shrink-0 w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center">
                                        {item.icon}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-slate-900 mb-1">{item.title}</h4>
                                        <p className="text-sm text-slate-500 leading-relaxed">{item.desc}</p>
                                    </div>
                                </div>
                            ))}
                            <button
                                onClick={handleOpenVerify}
                                className="mt-4 px-8 py-4 bg-slate-900 text-white font-black rounded-2xl hover:bg-slate-800 transition-all"
                            >
                                인증 프로세스 미리보기
                            </button>
                        </div>
                        <div className="relative">
                            <div className="aspect-square bg-blue-600 rounded-[40px] rotate-3 relative overflow-hidden shadow-2xl">
                                <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-indigo-700 p-10 flex flex-col justify-between text-white -rotate-3">
                                    <div className="space-y-4">
                                        <div className="w-12 h-8 bg-yellow-400/90 rounded-md" />
                                        <div className="text-2xl font-mono tracking-widest uppercase">Business Partner</div>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="h-4 w-48 bg-white/20 rounded" />
                                        <div className="h-4 w-32 bg-white/20 rounded" />
                                        <div className="text-xl font-bold mt-4">Safe & Secure Payment</div>
                                    </div>
                                </div>
                            </div>
                            <div className="absolute -bottom-6 -left-6 bg-white p-6 rounded-3xl shadow-xl border border-slate-100 max-w-[200px]">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                                        <CheckCircle size={16} />
                                    </div>
                                    <span className="text-sm font-bold">인증 완료</span>
                                </div>
                                <div className="text-[11px] text-slate-400 leading-tight font-medium">실명 및 계좌 점검이 성공적으로 완료되었습니다.</div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Stats Section */}
            <section className="py-20 border-y border-slate-100">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                        {[
                            { label: "활성 파트너", val: "2,500+" },
                            { label: "누적 매칭 수", val: "48,000+" },
                            { label: "사용자 만족도", val: "99.2%" },
                            { label: "평균 매출 성장", val: "24.5%" }
                        ].map((s, i) => (
                            <div key={i}>
                                <div className="text-3xl font-black text-blue-600 mb-2">{s.val}</div>
                                <div className="text-sm font-bold text-slate-400 uppercase tracking-widest">{s.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Contact Section */}
            <section id="contact" className="py-20 px-6">
                <div className="max-w-3xl mx-auto bg-slate-900 rounded-3xl p-10 md:p-16 text-center text-white relative overflow-hidden">
                    <div className="relative z-10">
                        <h2 className="text-3xl font-black mb-6 italic">Ready to Scale Your Business?</h2>
                        <p className="text-slate-400 mb-10 font-medium leading-relaxed">
                            초코아이디어는 투명하고 효율적인 시장 환경을 조성하기 위해 최선을 다합니다.<br />
                            문의사항은 아래 연락처를 통해 언제든 전달 부탁드립니다.
                        </p>
                        <div className="flex flex-wrap justify-center gap-6 text-sm font-bold">
                            <div className="flex items-center gap-2">
                                <Mail size={16} className="text-blue-400" />
                                <span>bizsetter7@gmail.com</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Phone size={16} className="text-blue-400" />
                                <span>010.3838.4335</span>
                            </div>
                        </div>
                    </div>
                    {/* Decor Accent */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 blur-[100px] rounded-full -mr-32 -mt-32" />
                </div>
            </section>

            {/* Footer - 공식 Footer.tsx 컴포넌트 사용 (사업자 정보 일원화) */}
            <Footer />

            {/* [New] Verification Simulation Modal */}
            {showVerifyModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm">
                    <div className="bg-white w-full max-w-md rounded-[32px] overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-300">
                        {/* Modal Header */}
                        <div className="p-6 border-b border-slate-50 flex items-center justify-between">
                            <h3 className="font-black text-slate-900">비즈니스 파트너 인증</h3>
                            <button onClick={() => setShowVerifyModal(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                                <X size={20} className="text-slate-400" />
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="p-8">
                            {verifyStep === 'select' && (
                                <div className="space-y-4">
                                    <p className="text-sm text-slate-500 font-medium mb-6">진행하실 인증 절차를 선택해주세요.</p>
                                    <button
                                        onClick={() => setVerifyStep('phone')}
                                        className="w-full p-5 border-2 border-slate-50 bg-slate-50 hover:border-blue-600 hover:bg-blue-50 transition-all rounded-2xl flex items-center gap-4 group"
                                    >
                                        <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                                            <Smartphone className="text-blue-600" />
                                        </div>
                                        <div className="text-left">
                                            <div className="font-bold text-slate-900">휴대폰 실명 확인</div>
                                            <div className="text-xs text-slate-400 mt-0.5">본인 명의의 휴대폰으로 실명 확인</div>
                                        </div>
                                    </button>
                                </div>
                            )}

                            {verifyStep === 'phone' && (
                                <div className="space-y-6 text-center">
                                    <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Smartphone size={40} />
                                    </div>
                                    <h4 className="text-xl font-bold">휴대폰 본인 확인</h4>
                                    <p className="text-sm text-slate-500 leading-relaxed font-medium">통신사 인증을 통해 실명을 확인하고<br />보안 인증 과정을 진행합니다.</p>
                                    <div className="pt-4 space-y-3">
                                        <button onClick={() => setVerifyStep('success')} className="w-full py-4 bg-blue-600 text-white font-black rounded-2xl shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all">
                                            인증 요청 (시뮬레이션)
                                        </button>
                                        <button onClick={() => setVerifyStep('select')} className="w-full py-4 bg-slate-100 text-slate-500 font-bold rounded-2xl hover:bg-slate-200 transition-all">
                                            뒤로가기
                                        </button>
                                    </div>
                                </div>
                            )}


                            {verifyStep === 'success' && (
                                <div className="space-y-6 text-center">
                                    <div className="w-20 h-20 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <CheckCircle size={40} />
                                    </div>
                                    <h4 className="text-xl font-bold text-slate-900">검증 성공</h4>
                                    <p className="text-sm text-slate-500 leading-relaxed font-medium">사용자의 실명 및 계좌 정보가<br />금융 결제망과 일치합니다.</p>
                                    <button
                                        onClick={() => setShowVerifyModal(false)}
                                        className="w-full mt-6 py-4 bg-slate-900 text-white font-black rounded-2xl hover:bg-slate-800 transition-all"
                                    >
                                        확인 및 닫기
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
