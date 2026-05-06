'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useBrand } from '@/components/BrandProvider';
import { useAuth } from '@/hooks/useAuth';
import {
    User, Building2, CheckCircle2, Loader2, Smartphone,
    ChevronDown, ChevronUp
} from 'lucide-react';
import { IdentityVerifyModal } from './IdentityVerifyModal';
import type { IdentityVerifyResult } from '@/types/identity-verify';

type Role = 'individual' | 'corporate';

// ─── 약관 텍스트 ──────────────────────────────────────────────────────────────
const TERMS_TEXT = `제 1 조 (목적)
본 약관은 웨이터존(이하 "회사"라 한다)가 제공하는 구인구직 관련 제반 서비스(이하 "서비스"라 함)의 이용과 관련하여 회사와 회원 간의 권리, 의무 및 책임사항, 기타 필요한 사항을 규정함을 목적으로 합니다.

제 2 조 (용어의 정의)
1. "회원"이라 함은 "회사"의 "서비스"에 접속하여 이 약관에 따라 "회사"와 이용계약을 체결하고 "회사"가 제공하는 "서비스"를 이용하는 고객을 말합니다.
2. "아이디(ID)"라 함은 회원의 식별과 서비스 이용을 위하여 회원이 정하고 회사가 승인하는 문자와 숫자의 조합을 말합니다.
3. "비밀번호"라 함은 회원이 부여받은 "아이디"와 일치되는 회원임을 확인하고 비밀보호를 위해 회원 자신이 정한 문자 또는 숫자의 조합을 말합니다.

제 3 조 (약관의 게시와 개정)
1. "회사"는 이 약관의 내용을 회원이 쉽게 알 수 있도록 서비스 초기 화면에 게시합니다.
2. "회사"는 관련법을 위배하지 않는 범위에서 이 약관을 개정할 수 있습니다.

제 4 조 (이용계약 체결)
이용계약은 회원이 되고자 하는 자가 약관의 내용에 동의한 다음 회원가입신청을 하고 회사가 이러한 신청에 대하여 승낙함으로써 체결됩니다.`;

const PRIVACY_TEXT = `1. 개인정보의 수집 및 이용 목적
회사는 다음의 목적을 위하여 개인정보를 처리합니다. 처리하고 있는 개인정보는 다음의 목적 이외의 용도로는 이용되지 않으며, 이용 목적이 변경되는 경우에는 개인정보 보호법 제18조에 따라 별도의 동의를 받는 등 필요한 조치를 이행할 예정입니다.
- 회원 가입 의사 확인, 회원제 서비스 제공에 따른 본인 식별/인증, 회원자격 유지/관리, 서비스 부정이용 방지

2. 수집하는 개인정보의 항목
- 필수항목: 아이디, 비밀번호, 이름, 휴대전화번호
- 선택항목: 이메일, 생년월일, 성별

3. 개인정보의 보유 및 이용기간
- 회원 탈퇴 시까지 (단, 관계 법령 위반에 따른 수사·조사 등이 진행 중인 경우에는 해당 수사·조사 종료 시까지)

4. 동의 거부 권리 및 불이익
정보주체는 개인정보 수집 및 이용에 대한 동의를 거부할 권리가 있습니다. 다만, 필수항목에 대한 동의를 거부할 경우 회원가입 및 서비스 이용이 제한될 수 있습니다.`;

// ─── 스텝 인디케이터 ──────────────────────────────────────────────────────────
const StepIndicator = ({ current, primary }: { current: 1 | 2 | 3; primary: string }) => {
    const steps = ['약관동의', '회원정보 입력', '가입완료'];
    return (
        <div className="flex items-center justify-center gap-0 mb-6">
            {steps.map((label, i) => {
                const n = i + 1;
                const done = n < current;
                const active = n === current;
                return (
                    <React.Fragment key={n}>
                        <div className="flex flex-col items-center">
                            <div
                                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black shadow"
                                style={{
                                    backgroundColor: done || active ? primary : '#374151',
                                    color: done || active ? '#fff' : '#9ca3af',
                                }}
                            >
                                {done ? <CheckCircle2 size={16} /> : n}
                            </div>
                            <span
                                className="text-[10px] mt-1 font-bold whitespace-nowrap"
                                style={{ color: active || done ? primary : '#6b7280' }}
                            >
                                {label}
                            </span>
                        </div>
                        {i < 2 && (
                            <div
                                className="h-px w-10 mx-1 mb-4"
                                style={{ backgroundColor: n < current ? primary : '#374151' }}
                            />
                        )}
                    </React.Fragment>
                );
            })}
        </div>
    );
};

// ─── 약관 아이템 (접기/펼치기 + 체크박스) ────────────────────────────────────
const AgreementItem = ({
    id, label, checked, onChange, required, children
}: {
    id: string; label: string; checked: boolean; onChange: (v: boolean) => void;
    required?: boolean; children?: React.ReactNode;
}) => {
    const [open, setOpen] = useState(false);
    return (
        <div className="bg-white rounded-xl overflow-hidden border border-gray-200">
            <div className="flex items-center gap-3 p-3">
                <input
                    type="checkbox" id={id} checked={checked}
                    onChange={(e) => onChange(e.target.checked)}
                    className="w-4 h-4 rounded shrink-0"
                    style={{ accentColor: 'var(--brand-primary)' }}
                />
                <label htmlFor={id} className="flex-1 text-sm font-bold text-gray-800 cursor-pointer">
                    {required && <span className="text-[#1e3a5f] mr-1">[필수]</span>}
                    {label}
                </label>
                {children && (
                    <button type="button" onClick={() => setOpen(!open)} className="text-gray-400 hover:text-gray-600 transition p-1">
                        {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                )}
            </div>
            {open && children && (
                <div className="px-3 pb-3">
                    <div className="h-28 overflow-y-auto bg-gray-50 rounded-lg p-3 text-[11px] text-gray-500 leading-relaxed whitespace-pre-line border border-gray-100">
                        {children}
                    </div>
                </div>
            )}
        </div>
    );
};

// ─── 성별 버튼 ────────────────────────────────────────────────────────────────
const GenderSelect = ({
    value, onChange, primary, disabled
}: { value: string; onChange: (v: string) => void; primary: string; disabled?: boolean }) => (
    <div className="flex gap-2">
        {['남성', '여성'].map((g) => (
            <button
                key={g} type="button"
                disabled={disabled}
                onClick={() => !disabled && onChange(g)}
                className="flex-1 py-3 rounded-xl text-sm font-bold border-2 transition-all disabled:opacity-60"
                style={{
                    borderColor: value === g ? primary : '#e5e7eb',
                    backgroundColor: value === g ? `${primary}11` : '#f9fafb',
                    color: value === g ? primary : '#6b7280',
                }}
            >
                {g}
            </button>
        ))}
    </div>
);

// ─── 폼 필드 래퍼 ─────────────────────────────────────────────────────────────
const Field = ({
    label, required, hint, children
}: { label: string; required?: boolean; hint?: string; children: React.ReactNode }) => (
    <div className="space-y-1.5">
        <label className="text-xs font-black text-gray-600">
            {label} {required && <span className="text-red-500">*</span>}
            {hint && <span className="text-gray-400 font-medium ml-1">({hint})</span>}
        </label>
        {children}
    </div>
);

const Input = ({ className = '', ...props }: React.InputHTMLAttributes<HTMLInputElement>) => (
    <input
        {...props}
        className={`w-full p-3 rounded-xl border border-gray-200 bg-white text-gray-900 text-sm font-medium placeholder:text-gray-400 focus:outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-200 disabled:opacity-60 disabled:bg-gray-100 ${className}`}
    />
);

// ─── 본인인증 버튼 블록 ───────────────────────────────────────────────────────
const VerifyBlock = ({
    verified, verifyResult, onOpen, primary
}: {
    verified: boolean; verifyResult: IdentityVerifyResult | null;
    onOpen: () => void; primary: string;
}) => (
    <div className="border-2 border-dashed rounded-xl p-4 space-y-3"
        style={{ borderColor: verified ? '#22c55e' : '#d1d5db' }}>
        {verified && verifyResult ? (
            <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-green-500 shrink-0" />
                <span className="text-xs font-bold text-green-600">
                    {verifyResult.name}님 본인인증 완료
                </span>
            </div>
        ) : (
            <p className="text-xs text-gray-500 font-medium">
                아래 버튼을 눌러 본인인증을 완료해주세요.
            </p>
        )}
        <button
            type="button" onClick={onOpen}
            className="w-full py-3.5 rounded-xl flex items-center justify-center gap-2 text-white font-black text-sm shadow-lg active:scale-[0.98] transition-all"
            style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)' }}
        >
            <Smartphone size={18} />
            휴대폰 인증
        </button>
    </div>
);


// ═══════════════════════════════════════════════════════════════════════════════
export const SignupPage = () => {
    const brand = useBrand();
    const router = useRouter();
    const { signUp } = useAuth();
    const primary = brand.primaryColor;

    // ── 공통 상태 ──
    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [role, setRole] = useState<Role>('individual');

    // ── STEP1 약관 ──
    const [agreeAll, setAgreeAll] = useState(false);
    const [agreeTerms, setAgreeTerms] = useState(false);
    const [agreePrivacy, setAgreePrivacy] = useState(false);
    const [agreeAge, setAgreeAge] = useState(false);

    const syncAll = (v: boolean) => {
        setAgreeAll(v); setAgreeTerms(v); setAgreePrivacy(v); setAgreeAge(v);
    };
    const recomputeAll = (terms: boolean, privacy: boolean, age: boolean) => {
        setAgreeAll(terms && privacy && age);
    };

    // ── 본인인증 ──
    const [showModal, setShowModal] = useState(false);
    const [verifyResult, setVerifyResult] = useState<IdentityVerifyResult | null>(null);
    const verified = !!verifyResult?.success;

    // ── 개인회원 폼 ──
    const [iId, setIId] = useState('');
    const [iIdChecked, setIIdChecked] = useState(false);
    const [iPw, setIPw] = useState('');
    const [iPwConfirm, setIPwConfirm] = useState('');
    const [iName, setIName] = useState('');
    const [iBirth, setIBirth] = useState('');
    const [iGender, setIGender] = useState('');
    const [iNickname, setINickname] = useState('');
    const [iPhone, setIPhone] = useState('');
    const [iEmail, setIEmail] = useState('');
    const [iSms, setISms] = useState(false);

    // ── 업체회원 폼 ──
    const [cId, setCId] = useState('');
    const [cIdChecked, setCIdChecked] = useState(false);
    const [cPw, setCPw] = useState('');
    const [cPwConfirm, setCPwConfirm] = useState('');
    const [cManager, setCManager] = useState('');
    const [cBirth, setCBirth] = useState('');
    const [cGender, setCGender] = useState('');
    const [cPhone, setCPhone] = useState('');
    const [cEmail, setCEmail] = useState('');

    const [isLoading, setIsLoading] = useState(false);

    // ── 컴포넌트 마운트 시 항상 최상단 ──
    useEffect(() => {
        // 브라우저 스크롤 자동복원 비활성화
        if ('scrollRestoration' in history) {
            history.scrollRestoration = 'manual';
        }
        // 여러 방법으로 강제 최상단
        window.scrollTo(0, 0);
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
    }, []);

    // ── 본인인증 완료 처리 (이름/생년월일/성별 자동입력 → 수정 불가, 보안 강화) ──
    const handleVerified = (result: IdentityVerifyResult) => {
        setVerifyResult(result);
        setShowModal(false);

        // 인증된 실명/생년월일/성별을 자동입력하고 수정 불가 처리
        if (result.name) {
            setIName(result.name);
            setCManager(result.name);
        }
        if (result.birthdate) {
            setIBirth(result.birthdate);
            setCBirth(result.birthdate);
        }
        if (result.gender) {
            const g = result.gender === 'M' ? '남성' : result.gender === 'F' ? '여성' : '';
            setIGender(g);
            setCGender(g);
        }
    };

    // ── 스텝 전환 공통 (항상 최상단에서 시작) ──
    const goStep = (n: 1 | 2 | 3) => {
        setStep(n);
        window.scrollTo(0, 0);
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
    };

    // ── STEP1 → STEP2 ──
    const goStep2 = () => {
        if (!agreeTerms || !agreePrivacy || !agreeAge) {
            alert('필수 약관에 모두 동의해주세요.');
            return;
        }
        goStep(2);
    };

    // ── 아이디 중복확인 (실제 API 연동) ──
    const [isCheckingId, setIsCheckingId] = useState(false);
    const checkId = async (id: string, setChecked: (v: boolean) => void) => {
        if (!id.trim()) { alert('아이디를 입력해주세요.'); return; }
        if (id.length < 4) { alert('아이디는 4자 이상이어야 합니다.'); return; }
        if (!/^[a-zA-Z0-9]+$/.test(id)) { alert('아이디는 영문/숫자만 사용 가능합니다.'); return; }
        setIsCheckingId(true);
        try {
            const res = await fetch(`/api/auth/check-username?id=${encodeURIComponent(id)}`);
            const data = await res.json();
            if (data.available) {
                alert(`"${id}" 은(는) 사용 가능한 아이디입니다.`);
                setChecked(true);
            } else {
                alert(data.message || '이미 사용 중인 아이디입니다.');
                setChecked(false);
            }
        } catch {
            alert('중복확인 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
        } finally {
            setIsCheckingId(false);
        }
    };

    // ── 최종 가입 제출 ──
    const handleSubmit = async () => {
        if (role === 'individual') {
            if (!verified) { alert('본인인증을 먼저 완료해주세요.'); return; }
            if (!iIdChecked) { alert('아이디 중복확인을 완료해주세요.'); return; }
            if (!iId || !iPw || !iPwConfirm) { alert('필수 항목을 모두 입력해주세요.'); return; }
            if (iPw !== iPwConfirm) { alert('비밀번호가 일치하지 않습니다.'); return; }
            if (!/^(?=.*[a-zA-Z])(?=.*[0-9])(?=.*[!@#$%^&*]).{8,}$/.test(iPw)) { alert('비밀번호는 8자 이상, 영문+숫자+특수문자(!@#$%^&*)를 모두 포함해야 합니다.'); return; }
            if (!iNickname) { alert('닉네임을 입력해주세요.'); return; }
            if (!iEmail) { alert('로그인 이메일을 입력해주세요. (가입 후 이 이메일로 로그인합니다.)'); return; }
        } else {
            if (!cIdChecked) { alert('아이디 중복확인을 완료해주세요.'); return; }
            if (!cId || !cPw || !cPwConfirm) { alert('필수 항목을 모두 입력해주세요.'); return; }
            if (cPw !== cPwConfirm) { alert('비밀번호가 일치하지 않습니다.'); return; }
            if (!/^(?=.*[a-zA-Z])(?=.*[0-9])(?=.*[!@#$%^&*]).{8,}$/.test(cPw)) { alert('비밀번호는 8자 이상, 영문+숫자+특수문자(!@#$%^&*)를 모두 포함해야 합니다.'); return; }
            if (!verified) { alert('담당자 본인인증을 먼저 완료해주세요.'); return; }
            if (!cEmail) { alert('로그인 이메일을 입력해주세요. (가입 후 이 이메일로 로그인합니다.)'); return; }
        }

        setIsLoading(true);
        try {
            const username = role === 'individual' ? iId : cId;
            const pw = role === 'individual' ? iPw : cPw;
            // [FIXED] auth.email = 실제 이메일(contact_email) 사용 — fake @waiterzone.kr 제거
            const contactEmail = role === 'individual' ? iEmail : cEmail;
            await signUp(contactEmail, pw, {
                name: role === 'individual' ? iName : cManager,
                nickname: role === 'individual' ? iNickname : undefined,
                role,
                phone: role === 'individual' ? iPhone : cPhone,
                birthdate: role === 'individual' ? iBirth : cBirth,
                gender: role === 'individual' ? iGender : cGender,
                identity_ci: verifyResult?.ci,
                username,
                contact_email: contactEmail,
            });
            goStep(3);
        } catch (err: any) {
            const msg = err.message || '다시 시도해주세요.';
            const isAlreadyRegistered = msg.includes('이미 사용 중인 아이디') || msg.toLowerCase().includes('already registered');
            const isDuplicateIdentity = msg.includes('동일한 회원정보로');
            if (isAlreadyRegistered) {
                alert('이미 사용 중인 아이디입니다. 다른 아이디를 선택해주세요.');
                if (role === 'individual') { setIId(''); setIIdChecked(false); }
                else { setCId(''); setCIdChecked(false); }
            } else if (isDuplicateIdentity) {
                alert('동일한 회원정보로 이미 가입되어있습니다.\n기존 계정으로 로그인하거나 아이디찾기를 이용해주세요.');
            } else {
                alert(`회원가입 실패: ${msg}`);
            }
        } finally {
            setIsLoading(false);
        }
    };

    const gradStyle = { background: `linear-gradient(135deg, ${primary} 0%, ${primary}bb 100%)` };

    // ══════════════════════════════════════════════════════════════════════
    return (
        <div className="min-h-screen bg-transparent py-8 px-4">
            <div className="max-w-md mx-auto">
                <StepIndicator current={step} primary={primary} />

                {/* ───────────────── STEP 1: 약관동의 ───────────────── */}
                {step === 1 && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
                        <div className="rounded-2xl p-5 text-center text-white font-black text-lg" style={gradStyle}>
                            회원가입 약관 동의
                        </div>

                        {/* 전체동의 */}
                        <div className="bg-white rounded-xl p-3 border border-gray-200">
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="checkbox" checked={agreeAll}
                                    onChange={(e) => syncAll(e.target.checked)}
                                    className="w-4 h-4 rounded"
                                    style={{ accentColor: primary }}
                                />
                                <span className="text-sm font-black text-gray-900">정책 약관에 동의합니다</span>
                            </label>
                        </div>

                        <AgreementItem
                            id="terms" label="이용약관 동의" required
                            checked={agreeTerms}
                            onChange={(v) => { setAgreeTerms(v); recomputeAll(v, agreePrivacy, agreeAge); }}
                        >
                            {TERMS_TEXT}
                        </AgreementItem>

                        <AgreementItem
                            id="privacy" label="개인정보 처리방침 동의" required
                            checked={agreePrivacy}
                            onChange={(v) => { setAgreePrivacy(v); recomputeAll(agreeTerms, v, agreeAge); }}
                        >
                            {PRIVACY_TEXT}
                        </AgreementItem>

                        <AgreementItem
                            id="age" label="만 19세 이상입니다" required
                            checked={agreeAge}
                            onChange={(v) => { setAgreeAge(v); recomputeAll(agreeTerms, agreePrivacy, v); }}
                        />

                        {/* 회원 유형 선택 */}
                        <div className="bg-white rounded-2xl p-4 border border-gray-200 space-y-3">
                            <p className="text-sm font-black text-gray-700 text-center">회원 유형을 선택해주세요</p>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    type="button" onClick={() => setRole('individual')}
                                    className="py-5 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all"
                                    style={{
                                        borderColor: role === 'individual' ? primary : '#e5e7eb',
                                        backgroundColor: role === 'individual' ? `${primary}11` : '#f9fafb',
                                    }}
                                >
                                    <div className="w-12 h-12 rounded-xl flex items-center justify-center"
                                        style={{ backgroundColor: role === 'individual' ? `${primary}22` : '#e5e7eb' }}>
                                        <User size={24} style={{ color: role === 'individual' ? primary : '#9ca3af' }} />
                                    </div>
                                    <div className="text-center">
                                        <p className="text-xs font-black text-gray-800">개인(구직)회원</p>
                                        <p className="text-[10px] text-gray-500 mt-0.5">이력서등록가능</p>
                                    </div>
                                </button>
                                <button
                                    type="button" onClick={() => setRole('corporate')}
                                    className="py-5 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all"
                                    style={{
                                        borderColor: role === 'corporate' ? primary : '#e5e7eb',
                                        backgroundColor: role === 'corporate' ? `${primary}11` : '#f9fafb',
                                    }}
                                >
                                    <div className="w-12 h-12 rounded-xl flex items-center justify-center"
                                        style={{ backgroundColor: role === 'corporate' ? `${primary}22` : '#e5e7eb' }}>
                                        <Building2 size={24} style={{ color: role === 'corporate' ? primary : '#9ca3af' }} />
                                    </div>
                                    <div className="text-center">
                                        <p className="text-xs font-black text-gray-800">업체(구인)회원</p>
                                        <p className="text-[10px] text-gray-500 mt-0.5">채용공고등록가능</p>
                                    </div>
                                </button>
                            </div>
                        </div>

                        <button
                            type="button" onClick={goStep2}
                            disabled={!agreeTerms || !agreePrivacy || !agreeAge}
                            className="w-full py-4 rounded-2xl text-white font-black text-sm shadow-xl active:scale-[0.98] transition-all disabled:opacity-40"
                            style={{ backgroundColor: agreeTerms && agreePrivacy && agreeAge ? primary : '#6b7280' }}
                        >
                            다음 단계
                        </button>
                    </div>
                )}

                {/* ───────────────── STEP 2: 개인(구직)회원 ───────────────── */}
                {step === 2 && role === 'individual' && (
                    <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-300">
                        <div className="rounded-2xl p-5 text-center text-white" style={gradStyle}>
                            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-2">
                                <User size={24} />
                            </div>
                            <p className="font-black text-base">개인(구직)회원 가입</p>
                            <p className="text-xs text-white/70 mt-0.5">구직자/이력서등록가능</p>
                        </div>

                        {/* 아이디 */}
                        <Field label="아이디" required>
                            <div className="flex gap-2">
                                <Input placeholder="4~20자의 영문/숫자" value={iId}
                                    onChange={(e) => { setIId(e.target.value); setIIdChecked(false); }} />
                                <button type="button" onClick={() => checkId(iId, setIIdChecked)}
                                    disabled={isCheckingId}
                                    className="shrink-0 px-3 py-2 rounded-xl text-xs font-black text-white whitespace-nowrap disabled:opacity-60"
                                    style={{ backgroundColor: iIdChecked ? '#22c55e' : primary }}>
                                    {isCheckingId ? '확인중...' : iIdChecked ? '확인됨' : '중복확인'}
                                </button>
                            </div>
                        </Field>

                        <Field label="비밀번호" required>
                            <Input type="password" placeholder="6자 이상, 영문/숫자/특수기호 조합 포함"
                                value={iPw} onChange={(e) => setIPw(e.target.value)} />
                        </Field>

                        <Field label="비밀번호 확인" required>
                            <Input type="password" placeholder="비밀번호를 다시 입력하세요"
                                value={iPwConfirm} onChange={(e) => setIPwConfirm(e.target.value)} />
                            {iPwConfirm && iPw !== iPwConfirm && (
                                <p className="text-[11px] text-red-400 font-bold mt-1">비밀번호가 일치하지 않습니다.</p>
                            )}
                        </Field>

                        <Field label="이름" required>
                            <Input placeholder={verified ? '' : '본인인증 후 자동 입력'}
                                value={iName} disabled={verified}
                                onChange={(e) => setIName(e.target.value)} />
                        </Field>

                        <Field label="생년월일" required hint="예: 1990-01-01">
                            <Input placeholder={verified ? '' : '본인인증 후 자동 입력'}
                                value={iBirth} disabled={verified}
                                onChange={(e) => setIBirth(e.target.value)} />
                        </Field>

                        <Field label="성별" required>
                            <GenderSelect value={iGender} onChange={setIGender} primary={primary}
                                disabled={verified} />
                        </Field>

                        <Field label="닉네임" required hint="닉네임은 1일 1회만 수정됩니다">
                            <Input placeholder="2~10자의 닉네임 입력" value={iNickname}
                                onChange={(e) => setINickname(e.target.value)} />
                        </Field>

                        {/* 휴대폰 번호 + 본인인증 인라인 */}
                        <Field label="휴대폰 번호" required>
                            <div className="flex gap-2">
                                <Input placeholder="010-0000-0000" value={iPhone}
                                    disabled={verified && !!iPhone}
                                    onChange={(e) => setIPhone(e.target.value)} />
                                <button type="button" onClick={() => {
                                    if (!iPhone.trim()) { alert('휴대폰 번호를 먼저 입력해주세요.'); return; }
                                    setShowModal(true);
                                }}
                                    className="shrink-0 px-3 py-2 rounded-xl text-xs font-black text-white whitespace-nowrap transition-all"
                                    style={{ backgroundColor: verified ? '#22c55e' : primary }}>
                                    {verified ? '인증완료' : '본인인증'}
                                </button>
                            </div>
                            {verified && verifyResult && (
                                <p className="text-[10px] text-green-600 font-bold mt-1 flex items-center gap-1">
                                    <CheckCircle2 size={10} /> {verifyResult.name}님 본인인증 완료
                                </p>
                            )}
                            {!verified && (
                                <p className="text-[10px] text-red-400 font-bold mt-1">* 가입 전 반드시 본인인증이 필요합니다.</p>
                            )}
                        </Field>

                        {/* 이메일 — 로그인 계정으로 사용 (필수) */}
                        <Field label="로그인 이메일" required hint="가입 후 이 이메일로 로그인합니다 — 실제 사용 중인 이메일을 입력하세요">
                            <Input type="email" placeholder="example@gmail.com"
                                value={iEmail} onChange={(e) => setIEmail(e.target.value)} required />
                        </Field>

                        {/* SMS 수신 동의 */}
                        <label className="flex items-start gap-3 cursor-pointer p-3 rounded-xl bg-gray-50 border border-gray-200">
                            <input type="checkbox" checked={iSms} onChange={(e) => setISms(e.target.checked)}
                                className="w-4 h-4 mt-0.5 shrink-0" style={{ accentColor: primary }} />
                            <span className="text-xs text-gray-700 font-medium leading-relaxed">
                                <span className="font-bold">SMS수신을 동의합니다.</span><br />
                                <span className="text-gray-500">수신체크 시 보다 이용이 편리해집니다.</span>
                            </span>
                        </label>

                        <div className="flex gap-3 pt-2">
                            <button type="button" onClick={() => goStep(1)}
                                className="flex-1 py-4 rounded-2xl border border-gray-300 text-gray-600 font-bold text-sm">
                                이전
                            </button>
                            <button type="button" onClick={handleSubmit} disabled={isLoading}
                                className="flex-[2] py-4 rounded-2xl text-white font-black text-sm shadow-xl active:scale-[0.98] transition-all disabled:opacity-50"
                                style={{ backgroundColor: primary }}>
                                {isLoading ? <Loader2 className="animate-spin mx-auto" size={20} /> : '본인인증 후 가입 진행'}
                            </button>
                            <button type="button" onClick={() => router.push('/?page=login')}
                                className="flex-1 py-4 rounded-2xl border border-gray-300 text-gray-600 font-bold text-sm">
                                취소
                            </button>
                        </div>
                    </div>
                )}

                {/* ───────────────── STEP 2: 업체(구인)회원 ───────────────── */}
                {step === 2 && role === 'corporate' && (
                    <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-300">
                        <div className="rounded-2xl p-5 text-center text-white" style={gradStyle}>
                            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-2">
                                <Building2 size={24} />
                            </div>
                            <p className="font-black text-base">업체(구인)회원 가입</p>
                            <p className="text-xs text-white/70 mt-0.5">채용공고등록/이력서열람가능</p>
                        </div>

                        {/* ── 계정 정보 ── */}
                        <div className="bg-white rounded-2xl p-4 space-y-3 border border-gray-200">
                            <p className="text-xs font-black text-gray-500 flex items-center gap-2">
                                <span className="w-1 h-4 rounded-full inline-block" style={{ backgroundColor: primary }} />
                                계정 정보
                            </p>
                            <Field label="아이디" required>
                                <div className="flex gap-2">
                                    <Input placeholder="4~20자의 영문/숫자" value={cId}
                                        onChange={(e) => { setCId(e.target.value); setCIdChecked(false); }} />
                                    <button type="button" onClick={() => checkId(cId, setCIdChecked)}
                                        disabled={isCheckingId}
                                        className="shrink-0 px-3 py-2 rounded-xl text-xs font-black text-white whitespace-nowrap disabled:opacity-60"
                                        style={{ backgroundColor: cIdChecked ? '#22c55e' : primary }}>
                                        {isCheckingId ? '확인중...' : cIdChecked ? '확인됨' : '중복확인'}
                                    </button>
                                </div>
                            </Field>
                            <Field label="비밀번호" required>
                                <Input type="password" placeholder="6자 이상, 영문/숫자/특수기호 조합 포함"
                                    value={cPw} onChange={(e) => setCPw(e.target.value)} />
                            </Field>
                            <Field label="비밀번호 확인" required>
                                <Input type="password" placeholder="비밀번호를 다시 입력하세요"
                                    value={cPwConfirm} onChange={(e) => setCPwConfirm(e.target.value)} />
                                {cPwConfirm && cPw !== cPwConfirm && (
                                    <p className="text-[11px] text-red-500 font-bold mt-1">비밀번호가 일치하지 않습니다.</p>
                                )}
                            </Field>
                            <Field label="로그인 이메일" required hint="가입 후 이 이메일로 로그인합니다 — 실제 사용 중인 이메일을 입력하세요">
                                <Input type="email" placeholder="example@gmail.com"
                                    value={cEmail} onChange={(e) => setCEmail(e.target.value)} required />
                            </Field>
                        </div>

                        {/* ── 담당자 정보 ── */}
                        <div className="bg-white rounded-2xl p-4 space-y-3 border border-gray-200">
                            <p className="text-xs font-black text-gray-500 flex items-center gap-2">
                                <span className="w-1 h-4 rounded-full inline-block" style={{ backgroundColor: primary }} />
                                담당자 정보
                            </p>

                            <Field label="담당자(성함)" required>
                                <Input placeholder={verified ? '' : '본인인증 후 자동 입력'}
                                    value={cManager} disabled={verified}
                                    onChange={(e) => setCManager(e.target.value)} />
                            </Field>
                            <Field label="생년월일" required hint="예: 1990-01-01">
                                <Input placeholder={verified ? '' : '본인인증 후 자동 입력'}
                                    value={cBirth} disabled={verified}
                                    onChange={(e) => setCBirth(e.target.value)} />
                            </Field>
                            <Field label="성별">
                                <GenderSelect value={cGender} onChange={setCGender} primary={primary}
                                    disabled={verified} />
                            </Field>

                            {/* 휴대폰 번호 + 본인인증 인라인 */}
                            <Field label="핸드폰" required>
                                <div className="flex gap-2">
                                    <Input placeholder="010-0000-0000" value={cPhone}
                                        disabled={verified && !!cPhone}
                                        onChange={(e) => setCPhone(e.target.value)} />
                                    <button type="button" onClick={() => {
                                        if (!cPhone.trim()) { alert('휴대폰 번호를 먼저 입력해주세요.'); return; }
                                        setShowModal(true);
                                    }}
                                        className="shrink-0 px-3 py-2 rounded-xl text-xs font-black text-white whitespace-nowrap transition-all"
                                        style={{ backgroundColor: verified ? '#22c55e' : primary }}>
                                        {verified ? '인증완료' : '본인인증'}
                                    </button>
                                </div>
                                {verified && verifyResult && (
                                    <p className="text-[10px] text-green-600 font-bold mt-1 flex items-center gap-1">
                                        <CheckCircle2 size={10} /> {verifyResult.name}님 본인인증 완료
                                    </p>
                                )}
                                {!verified && (
                                    <p className="text-[10px] text-red-400 font-bold mt-1">* 가입 전 반드시 본인인증이 필요합니다.</p>
                                )}
                            </Field>
                        </div>

                        {/* ── 사업자 인증 안내 ── */}
                        <div className="rounded-2xl p-4 border space-y-1"
                            style={{ borderColor: `${primary}44`, backgroundColor: `${primary}10` }}>
                            <p className="text-[11px] font-black" style={{ color: primary }}>※ 안내</p>
                            <p className="text-[11px] leading-relaxed" style={{ color: `${primary}cc` }}>
                                공고등록 시, 유효한 사업자정보인증이 필요합니다.<br />
                                가입 후 마이페이지 &gt; 사업자인증을 등록 바랍니다.<br />
                                인증등록 후 24시간 이내 관리자 승인을 통해 반영되며,<br />
                                광고등록 시 제공정보로만 서비스가 활용됩니다.
                            </p>
                        </div>

                        {/* SMS 수신 동의 */}
                        <label className="flex items-start gap-3 cursor-pointer p-3 rounded-xl bg-gray-50 border border-gray-200">
                            <input type="checkbox" className="w-4 h-4 mt-0.5 shrink-0" style={{ accentColor: primary }} />
                            <span className="text-xs text-gray-700 font-medium leading-relaxed">
                                <span className="font-bold">SMS수신을 동의합니다.</span><br />
                                <span className="text-gray-500">수신체크 시 보다 이용이 편리해집니다.</span>
                            </span>
                        </label>

                        <div className="flex gap-3 pt-2">
                            <button type="button" onClick={() => goStep(1)}
                                className="flex-1 py-4 rounded-2xl border border-gray-300 text-gray-600 font-bold text-sm">
                                이전
                            </button>
                            <button type="button" onClick={handleSubmit} disabled={isLoading}
                                className="flex-[2] py-4 rounded-2xl text-white font-black text-sm shadow-xl active:scale-[0.98] transition-all disabled:opacity-50"
                                style={{ backgroundColor: primary }}>
                                {isLoading ? <Loader2 className="animate-spin mx-auto" size={20} /> : '본인인증 후 가입 진행'}
                            </button>
                            <button type="button" onClick={() => router.push('/?page=login')}
                                className="flex-1 py-4 rounded-2xl border border-gray-300 text-gray-600 font-bold text-sm">
                                취소
                            </button>
                        </div>
                    </div>
                )}

                {/* ───────────────── STEP 3: 가입완료 ───────────────── */}
                {step === 3 && (
                    <div className="text-center py-16 space-y-6 animate-in zoom-in duration-500">
                        <div className="w-20 h-20 bg-green-950 rounded-full flex items-center justify-center mx-auto">
                            <CheckCircle2 size={40} className="text-green-400" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-white mb-2">회원가입 완료!</h2>
                            <p className="text-gray-400 text-sm leading-relaxed">
                                {brand.displayName}의 회원이 되신 것을 환영합니다.<br />
                                이제부터 다양한 서비스를 이용하실 수 있습니다.
                            </p>
                        </div>
                        <button onClick={() => router.push('/my-shop')}
                            className="w-full py-4 rounded-2xl text-white font-black text-sm shadow-xl active:scale-[0.98] transition-all"
                            style={{ backgroundColor: primary }}>
                            마이샵으로 바로 가기
                        </button>
                    </div>
                )}
            </div>

            {showModal && (
                <IdentityVerifyModal
                    onClose={() => setShowModal(false)}
                    onVerified={handleVerified}
                />
            )}
        </div>
    );
};
