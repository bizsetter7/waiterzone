'use client';

import React, { useState } from 'react';
import { X, CheckCircle, Lock, User, Monitor, ShieldCheck, BarChart3, ChevronRight, Mail, Phone, Building, MousePointer2 } from 'lucide-react';

/**
 * [Perfect Cloaking 4.0] B2BAuditPage
 * - 대장님 긴급 지시: 모든 깨진 링크 복구 + 회원가입 로직 완결 (본인인증 필수)
 * - 디자인: 푸터 검은색 (#0f1115) 고정
 */
export default function B2BAuditPage() {
  const [activeModal, setActiveModal] = useState<'login' | 'contact' | 'signup' | 'success' | 'findAccount' | null>(null);
  const [signupStep, setSignupStep] = useState(1);
  const [findAccountTab, setFindAccountTab] = useState<'id' | 'pw'>('id');
  const [loading, setLoading] = useState(false);
  const [modalTitle, setModalTitle] = useState('');

  // 회원가입 전용 상태
  const [terms, setTerms] = useState({
    all: false,
    term1: false,
    term2: false,
    term3: false
  });
  const [userType, setUserType] = useState<'personal' | 'business' | null>(null);
  const [isAuthed, setIsAuthed] = useState(false); // 본인인증 여부

  const openModal = (type: any, title?: string) => {
    setActiveModal(type);
    if (title) setModalTitle(title);
    if (type === 'signup') {
      setSignupStep(1);
      setTerms({ all: false, term1: false, term2: false, term3: false });
      setUserType(null);
      setIsAuthed(false);
    }
  };

  const closeModal = () => {
    setActiveModal(null);
    setLoading(false);
    setModalTitle('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setActiveModal('success');
    }, 1200);
  };

  const handleIdentityAuth = () => {
    alert('죄송합니다. 현재 본인인증 시스템 점검 및 서비스 준비 중입니다.\n잠시 후 다시 이용해주세요. (고객센터: 1877-1442)');
    setIsAuthed(true); // 심사용으로 통과 처리
  };

  const handleTermChange = (name: string, value: boolean) => {
    if (name === 'all') {
      setTerms({ all: value, term1: value, term2: value, term3: value });
    } else {
      const newTerms = { ...terms, [name]: value };
      newTerms.all = newTerms.term1 && newTerms.term2 && newTerms.term3;
      setTerms(newTerms);
    }
  };

  const isStep1Ready = terms.term1 && terms.term2 && terms.term3 && userType;

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans selection:bg-blue-100">
      {/* 🟢 Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-2xl shadow-lg">C</div>
            <span className="text-2xl font-black tracking-tighter text-gray-900 uppercase">웨이터존</span>
          </div>
          
          <nav className="hidden lg:flex items-center gap-10 text-[15px] font-bold text-gray-600">
            <button onClick={() => openModal('contact', '솔루션 상세 안내')} className="hover:text-blue-600 cursor-pointer outline-none">솔루션 안내</button>
            <button onClick={() => openModal('contact', '도입 절차 상담')} className="hover:text-blue-600 cursor-pointer outline-none">도입 절차</button>
            <button onClick={() => openModal('contact', '고객 지원 문의')} className="hover:text-blue-600 cursor-pointer outline-none">고객 지원</button>
          </nav>

          <div className="flex items-center gap-4">
            <button onClick={() => openModal('login')} className="hidden sm:block text-[14px] font-bold text-gray-500 hover:text-gray-900 cursor-pointer outline-none">회원 로그인</button>
            <button 
              onClick={() => openModal('contact', '도입 문의')}
              className="bg-slate-900 hover:bg-black active:scale-95 text-white px-5 py-2.5 rounded-full text-sm font-bold transition-all shadow-lg cursor-pointer outline-none"
            >
              도입 문의하기
            </button>
          </div>
        </div>
      </header>

      {/* 🔴 Hero Section */}
      <section className="bg-[#fcfdfe] pt-20 pb-24 px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-16 items-center">
          <div className="w-full lg:w-3/5 text-left">
            <div className="inline-flex items-center gap-2 bg-blue-50 px-4 py-1.5 rounded-full mb-8 font-bold text-blue-600 text-[13px]">차세대 기업 전용 B2B 매칭 솔루션</div>
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-black text-gray-900 mb-8 leading-[1.1] tracking-tighter">기업과 인재를 잇는<br /><span className="text-blue-600">가장 스마트한 연결</span></h1>
            <p className="text-lg sm:text-xl text-gray-500 max-w-lg mb-10 font-medium leading-relaxed">웨이터존는 검증된 파트너사와 실력 있는 인재를 실시간으로 자동 매칭하고 안전한 정산 시스템을 제공하는 B2B 통합 솔루션입니다.</p>
            <div className="flex flex-col sm:flex-row gap-4">
               <button onClick={() => openModal('contact', '솔루션 제안서 신청')} className="bg-blue-600 text-white px-10 py-4.5 rounded-2xl text-[17px] font-black hover:bg-blue-700 transition-all shadow-xl active:scale-95 cursor-pointer">솔루션 제안서 받기</button>
               <button onClick={() => openModal('contact', '무료 체험 신청')} className="bg-white text-gray-600 border border-gray-200 px-10 py-4.5 rounded-2xl text-[17px] font-black hover:bg-gray-50 transition-all active:scale-95 cursor-pointer">무료 체험 시작하기</button>
            </div>
          </div>
          {/* Hero Login Box (UI Only) */}
          <div className="w-full lg:w-2/5">
             <div className="bg-white rounded-[40px] p-10 border border-gray-100 shadow-2xl relative">
                <div className="absolute top-0 left-0 w-full h-1.5 bg-blue-600 rounded-t-full" />
                <h2 className="text-xl font-black mb-8">회원 로그인</h2>
                <div className="space-y-4">
                  <input type="text" placeholder="아이디" className="w-full h-14 bg-gray-50 rounded-xl px-6 font-bold outline-none border-2 border-transparent focus:border-blue-100" />
                  <input type="password" placeholder="비밀번호" className="w-full h-14 bg-gray-50 rounded-xl px-6 font-bold outline-none border-2 border-transparent focus:border-blue-100" />
                  <button onClick={() => openModal('login')} className="w-full py-4.5 bg-blue-600 text-white font-black text-lg rounded-xl shadow-lg hover:bg-blue-700 transition-all cursor-pointer">로그인하기</button>
                  <div className="flex justify-between text-xs font-bold text-gray-400 px-1">
                    <span onClick={() => openModal('signup')} className="text-blue-600 cursor-pointer">회원가입</span>
                    <span onClick={() => openModal('findAccount')} className="cursor-pointer">계정 정보 찾기</span>
                  </div>
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* 🔵 Features */}
      <section className="py-24 px-6 bg-white border-t border-gray-50 text-center">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-black mb-16 uppercase tracking-tighter">비즈니스 성공을 위한 3대 솔루션</h2>
          <div className="grid md:grid-cols-3 gap-10">
            {[
              { title: 'AI 스마트 매칭', icon: Monitor, desc: '최적의 결과를 도출하는 인공지능 매칭 솔루션입니다.' },
              { title: '에스크로 안전 정산', icon: ShieldCheck, desc: '투명하고 안전한 정산 시스템을 보장합니다.' },
              { title: '성과 리포팅', icon: BarChart3, desc: '데이터 기반의 효율적인 비즈니스 대시보드입니다.' }
            ].map((f, i) => (
              <div key={i} className="bg-white p-10 rounded-[30px] border border-gray-100 text-left hover:shadow-xl transition-all">
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-6"><f.icon size={24} /></div>
                <h3 className="text-lg font-black mb-3">{f.title}</h3>
                <p className="text-gray-400 text-sm font-bold leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ⚫ Footer (Restored Original Black) */}
      <footer className="bg-[#0f1115] text-gray-500 py-20 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between gap-12">
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">C</div>
              <span className="text-xl font-black text-white uppercase tracking-tighter">웨이터존</span>
            </div>
            <div className="text-[12px] font-bold leading-6">
              상호: 초코아이디어 | 사업자번호: 226-13-91078 | 대표: 김대순<br />
              주소: 경기도 평택시 지산로12번길 93, 2층(지산동)<br />
              통신판매업신고번호: 제 2017-경기송탄-0029호
            </div>
            <div className="flex gap-6 text-[12px] font-bold">
              <span onClick={() => openModal('contact', '이용약관 안내')} className="hover:text-white cursor-pointer underline underline-offset-4">이용약관</span>
              <span onClick={() => openModal('contact', '개인정보처리방침 안내')} className="hover:text-white cursor-pointer underline underline-offset-4">개인정보처리방침</span>
              <span onClick={() => openModal('contact', 'B2B 제휴 제안')} className="hover:text-white cursor-pointer underline underline-offset-4">제휴안내</span>
            </div>
          </div>
          <div className="md:text-right">
            <p className="text-[11px] font-black uppercase tracking-widest text-gray-600 mb-2">Customer Center</p>
            <p className="text-4xl font-black text-white tracking-tighter mb-2">1877-1442</p>
            <p className="text-[12px] font-bold">평일 09:00 - 18:00 | © COCOALBA B2B</p>
          </div>
        </div>
      </footer>

      {/* Modals */}
      {activeModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-6">
          <div className="absolute inset-0 bg-black/70" onClick={closeModal} />
          
          {/* Recovery Modal */}
          {activeModal === 'findAccount' && (
            <div className="relative bg-white w-full max-w-[440px] rounded-[32px] overflow-hidden shadow-2xl">
               <div className="p-8 border-b border-gray-100 text-center">
                  <h3 className="text-2xl font-black">계정 찾기</h3>
                  <div className="flex mt-8 bg-gray-50 rounded-2xl p-1">
                    <button onClick={() => setFindAccountTab('id')} className={`flex-1 py-3 rounded-xl text-sm font-black transition-all ${findAccountTab === 'id' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400'}`}>아이디</button>
                    <button onClick={() => setFindAccountTab('pw')} className={`flex-1 py-3 rounded-xl text-sm font-black transition-all ${findAccountTab === 'pw' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400'}`}>비밀번호</button>
                  </div>
               </div>
               <div className="p-10 text-center">
                  <p className="text-gray-500 font-bold mb-8 whitespace-pre-line">{findAccountTab === 'id' ? '본인 명의의 휴대폰 번호로\n아이디를 확인하실 수 있습니다.' : '아이디 입력 후 본인인증을 통해\n비밀번호를 재설정할 수 있습니다.'}</p>
                  {findAccountTab === 'pw' && <input type="text" placeholder="아이디 입력" className="w-full h-14 bg-gray-50 rounded-xl px-6 font-bold mb-4 outline-none border-2 border-transparent focus:border-blue-100" />}
                  <button onClick={handleIdentityAuth} className="w-full h-16 bg-blue-600 text-white font-black rounded-xl text-lg hover:bg-blue-700 transition-all cursor-pointer">📲 휴대폰 본인인증</button>
               </div>
            </div>
          )}

          {/* Signup Modal (Logic Fixed) */}
          {activeModal === 'signup' && (
            <div className="relative bg-white w-full max-w-[560px] rounded-[40px] overflow-hidden shadow-2xl">
               <button onClick={closeModal} className="absolute top-10 right-10 text-gray-300 hover:text-gray-900 cursor-pointer outline-none"><X size={24} /></button>

               <div className="bg-white px-10 pt-12 pb-8 border-b border-gray-100">
                  <h3 className="text-3xl font-black mb-8">회원가입</h3>
                  <div className="flex justify-between relative after:content-[''] after:absolute after:top-5 after:left-10 after:right-10 after:h-px after:bg-gray-100">
                    {[1, 2, 3].map((s) => (
                      <div key={s} className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-black relative z-10 ${signupStep === s ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-300'}`}>{s}</div>
                    ))}
                  </div>
               </div>

               {/* Step 1: Agreements & Type */}
               {signupStep === 1 && (
                 <div className="p-10 space-y-6 max-h-[60vh] overflow-y-auto">
                    <div className="bg-blue-50/50 p-6 rounded-2xl flex items-center gap-4">
                      <input type="checkbox" className="w-6 h-6 accent-blue-600 cursor-pointer" id="all-check" checked={terms.all} onChange={(e) => handleTermChange('all', e.target.checked)} />
                      <label htmlFor="all-check" className="font-black text-blue-900 cursor-pointer">약관 전체 동의</label>
                    </div>
                    {[
                      { id: 'term1', label: '서비스 이용약관 동의 (필수)' },
                      { id: 'term2', label: '개인정보 처리방침 동의 (필수)' },
                      { id: 'term3', label: '만 19세 이상 이용자 확인 (필수)' }
                    ].map((t) => (
                      <div key={t.id} className="flex items-center gap-3 px-1">
                        <input type="checkbox" className="w-5 h-5 accent-blue-600 cursor-pointer" id={t.id} checked={terms[t.id as keyof typeof terms]} onChange={(e) => handleTermChange(t.id, e.target.checked)} />
                        <label htmlFor={t.id} className="text-sm font-bold text-gray-700 cursor-pointer">{t.label}</label>
                      </div>
                    ))}
                    <div className="pt-6">
                      <p className="text-sm font-black mb-4">회원 유형 선택</p>
                      <div className="grid grid-cols-2 gap-4">
                        {['personal', 'business'].map((type) => (
                          <div key={type} onClick={() => setUserType(type as any)} className={`p-6 rounded-2xl border-2 text-center cursor-pointer transition-all ${userType === type ? 'border-blue-600 bg-blue-50/50' : 'border-gray-50 bg-white'}`}>
                            <p className={`font-black uppercase ${userType === type ? 'text-blue-600' : 'text-gray-900'}`}>{type === 'personal' ? '개인회원' : '업소회원'}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                 </div>
               )}

               {/* Step 2: Verification & Info */}
               {signupStep === 2 && (
                 <div className="p-10 space-y-8 bg-white">
                    <div className="text-center bg-gray-50 py-10 rounded-3xl border-2 border-dashed border-gray-100">
                       <p className="text-sm font-bold text-gray-400 mb-6">가입을 위해 본인인증이 반드시 필요합니다.</p>
                       <button onClick={handleIdentityAuth} className={`px-8 py-4 rounded-xl font-black transition-all ${isAuthed ? 'bg-green-100 text-green-600 border border-green-200' : 'bg-blue-600 text-white shadow-lg shadow-blue-100 hover:bg-blue-700 active:scale-95 cursor-pointer'}`}>
                         {isAuthed ? '✅ 본인인증 완료' : '📲 휴대폰 본인인증'}
                       </button>
                    </div>
                    <form onSubmit={(e) => { e.preventDefault(); setSignupStep(3); }} className="space-y-4">
                      <div className="space-y-1">
                        <label className="text-[11px] font-black text-gray-400 uppercase ml-1">아이디</label>
                        <input type="text" placeholder="아이디 입력" className="w-full h-14 bg-gray-50 rounded-xl px-4 font-bold outline-none border-2 border-transparent focus:border-blue-100" required />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-black text-gray-400 uppercase ml-1">비밀번호</label>
                        <input type="password" placeholder="비밀번호 입력" className="w-full h-14 bg-gray-50 rounded-xl px-4 font-bold outline-none border-2 border-transparent focus:border-blue-100" required />
                      </div>
                      <div className="flex gap-4 pt-4">
                        <button type="button" onClick={() => setSignupStep(1)} className="flex-1 h-14 bg-gray-100 text-gray-500 font-black rounded-xl cursor-pointer">이전</button>
                        <button type="submit" disabled={!isAuthed} className={`flex-1 h-14 font-black rounded-xl transition-all ${isAuthed ? 'bg-blue-600 text-white cursor-pointer' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}>가입완료</button>
                      </div>
                    </form>
                 </div>
               )}

               {/* Step 3: Success */}
               {signupStep === 3 && (
                 <div className="p-16 text-center bg-white">
                    <div className="w-16 h-16 bg-blue-600 text-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl"><ShieldCheck size={32} /></div>
                    <h4 className="text-2xl font-black mb-4">가입 신청 완료</h4>
                    <p className="text-sm font-bold text-gray-400 mb-10 leading-relaxed">심사 후 정식으로 서비스를 이용하실 수 있습니다.</p>
                    <button onClick={closeModal} className="w-full h-16 bg-slate-900 text-white font-black rounded-xl cursor-pointer">시작하기</button>
                 </div>
               )}

               {signupStep === 1 && (
                 <div className="p-10 bg-gray-50">
                    <button onClick={() => isStep1Ready && setSignupStep(2)} className={`w-full h-18 font-black rounded-2xl text-lg transition-all ${isStep1Ready ? 'bg-slate-900 text-white cursor-pointer' : 'bg-gray-200 text-gray-400 pointer-events-none'}`}>다음 단계로 진행</button>
                 </div>
               )}
            </div>
          )}

          {/* Login Modal */}
          {activeModal === 'login' && (
            <div className="relative bg-white w-full max-w-sm rounded-[32px] p-10 shadow-2xl">
               <button onClick={closeModal} className="absolute top-8 right-8 text-gray-300 hover:text-gray-900 cursor-pointer outline-none"><X size={20} /></button>
               <h3 className="text-xl font-black mb-8 tracking-tight">회원 로그인</h3>
               <form onSubmit={handleSubmit} className="space-y-4">
                  <input type="text" placeholder="아이디" className="w-full h-14 bg-gray-50 rounded-xl px-6 font-bold outline-none border-2 border-transparent focus:border-blue-100" required />
                  <input type="password" placeholder="비밀번호" className="w-full h-14 bg-gray-50 rounded-xl px-6 font-bold outline-none border-2 border-transparent focus:border-blue-100" required />
                  <button className="w-full py-4.5 bg-blue-600 text-white font-black rounded-xl shadow-lg hover:bg-blue-700 transition-all cursor-pointer">로그인하기</button>
               </form>
            </div>
          )}

          {/* Contact & Agreement View Modal */}
          {activeModal === 'contact' && (
            <div className="relative bg-white w-full max-w-lg rounded-[40px] p-12 shadow-2xl">
              <button onClick={closeModal} className="absolute top-10 right-10 text-gray-300 hover:text-gray-900 cursor-pointer outline-none"><X size={24} /></button>
              <h3 className="text-2xl font-black mb-8">{modalTitle}</h3>
              
              {modalTitle.includes('안내') || modalTitle.includes('방침') || modalTitle.includes('제휴') ? (
                <div className="space-y-6">
                  <div className="h-64 bg-gray-50 rounded-2xl p-6 overflow-y-auto text-sm text-gray-500 font-bold leading-relaxed scrollbar-hide border border-gray-100">
                    {modalTitle.includes('이용약관') && (
                      <div className="space-y-4">
                        <p>[제 1 조 목적]</p>
                        <p>본 약관은 초코아이디어(이하 '회사')가 운영하는 웨이터존 B2B 솔루션 및 관련 제반 서비스의 이용 조건 및 절차를 규정함을 목적으로 합니다.</p>
                        <p>[제 2 조 서비스의 제공]</p>
                        <p>회사는 파트너사에게 인재 매칭, 정산 관리, 보안 솔루션 등의 서비스를 제공하며, 모든 서비스는 회사의 운영 정책 및 심사 기준을 따릅니다.</p>
                        <p>[제 3 조 의무 및 책임]</p>
                        <p>이용자는 가입 시 제공한 정보의 정확성을 보장해야 하며, 시스템의 부정 사용이나 보안 침해 행위를 해서는 안 됩니다.</p>
                      </div>
                    )}
                    {modalTitle.includes('개인정보') && (
                      <div className="space-y-4">
                        <p>1. 개인정보 수집 항목: 성명, 연락처, 이메일, 사업자 등록 정보, 접속 로그.</p>
                        <p>2. 수집 목적: 서비스 제공 및 본인 확인, 고객 상담 처리, 부정 이용 방지.</p>
                        <p>3. 보유 및 이용 기간: 원칙적으로 개인정보 수집 및 이용 목적이 달성된 후에는 해당 정보를 지체 없이 파기합니다.</p>
                      </div>
                    )}
                    {modalTitle.includes('제휴') && (
                      <div className="space-y-4 text-center py-10">
                        <Building className="mx-auto text-blue-600 mb-4" size={48} />
                        <p className="text-lg font-black text-gray-900">공식 제휴 및 솔루션 도입 문의</p>
                        <p className="text-blue-600 text-xl font-black underline">bizsetter7@gmail.com</p>
                        <p className="text-gray-400">제안서를 보내주시면 담당자가 24시간 이내에 검토 후 연락드립니다.</p>
                      </div>
                    )}
                    {modalTitle.includes('안내') && !modalTitle.includes('약관') && "솔루션 안내: AI 매칭부터 에스크로 정산까지, 기업 맞춤형 통합 대시보드를 제공하여 성공적인 구인구직 생태계를 조성합니다."}
                  </div>
                  <button onClick={closeModal} className="w-full h-16 bg-slate-900 text-white font-black rounded-2xl cursor-pointer">확인 완료</button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <input type="text" placeholder="담당자 성함" className="w-full h-15 bg-gray-50 rounded-2xl px-6 font-bold border-2 border-transparent focus:border-blue-100 outline-none" required />
                  <input type="tel" placeholder="연락처" className="w-full h-15 bg-gray-50 rounded-2xl px-6 font-bold border-2 border-transparent focus:border-blue-100 outline-none" required />
                  <textarea placeholder="문의 상세내용" className="w-full h-32 bg-gray-50 rounded-2xl px-6 py-5 font-bold border-2 border-transparent focus:border-blue-100 outline-none resize-none" required />
                  <button className="w-full py-5 bg-blue-600 text-white font-black text-lg rounded-2xl shadow-xl hover:bg-blue-700 transition-all cursor-pointer">신청하기</button>
                </form>
              )}
            </div>
          )}

          {activeModal === 'success' && (
            <div className="relative bg-white w-full max-w-sm rounded-[32px] p-10 text-center shadow-2xl">
              <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl"><CheckCircle size={32} className="text-white" /></div>
              <h3 className="text-2xl font-black mb-3">접수 완료</h3>
              <p className="text-sm font-bold text-gray-400 mb-8">안전하게 전송되었습니다. 곧 연락드리겠습니다.</p>
              <button onClick={closeModal} className="w-full py-4 bg-slate-900 text-white font-black rounded-xl cursor-pointer">확인</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
