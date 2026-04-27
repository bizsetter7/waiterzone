'use client';

import React from 'react';
import { useSearchParams } from 'next/navigation';
import { MessageCircle } from 'lucide-react';
import { UI_Z_INDEX } from '@/constants/ui';
import { Step1BasicInfo } from './components/form/steps/Step1BasicInfo';
import { Step2JobDetail } from './components/form/steps/Step2JobDetail';
import { Step3ProductSelect } from './components/form/steps/Step3ProductSelect';
import { Step4Extras } from './components/form/steps/Step4Extras';

import { BrandConfig } from '@/lib/brand-config';

interface AdFormProps {
    brand: BrandConfig;
    shopName: string; setShopName: (v: string) => void;
    shopAddress?: string; setShopAddress?: (v: string) => void;
    isVerified: boolean; setIsVerified: (v: boolean) => void;
    nickname: string; setNickname: (v: string) => void;
    managerName: string; setManagerName: (v: string) => void;
    managerPhone: string; setManagerPhone: (v: string) => void;
    messengers: { kakao: string; telegram: string }; setMessengers: (v: any) => void;
    title: string; setTitle: (v: string) => void;
    industryMain: string; setIndustryMain: (v: string) => void;
    industrySub: string; setIndustrySub: (v: string) => void;
    ageMin: number; setAgeMin: (v: number) => void;
    ageMax: number; setAgeMax: (v: number) => void;
    regionCity: string; setRegionCity: (v: string) => void;
    regionGu: string; setRegionGu: (v: string) => void;
    payType: string; handlePayTypeChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    payAmount: string; handlePayAmountChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    selectedKeywords: string[]; setSelectedKeywords: (v: string[]) => void;
    setShowDesignModal: (v: boolean) => void;
    setShowTemplateModal: (v: boolean) => void;
    editorRef: React.RefObject<HTMLDivElement | null>;
    handleEditorInteract: () => void;
    setIsEditorDirty: (v: boolean) => void;
    saveSelection: () => void;
    restoreSelection: () => void;
    syncEditorHtml: () => void;
    editorHtml: string;
    toolbarStatus: Record<string, boolean | string>;
    execCmd: (cmd: string, val?: string) => void;
    updateToolbarStatus: () => void;
    showFontMenu: boolean; setShowFontMenu: (v: boolean) => void;
    showFontSizeMenu: boolean; setShowFontSizeMenu: (v: boolean) => void;
    showForeColorMenu: boolean; setShowForeColorMenu: (v: boolean) => void;
    showHiliteColorMenu: boolean; setShowHiliteColorMenu: (v: boolean) => void;
    showEmojiMenu: boolean; setShowEmojiMenu: (v: boolean) => void;
    insertEmoji: (emoji: string) => void;
    selectedAdProduct: string | null; setSelectedAdProduct: (v: string | null) => void;
    selectedAdPeriod: number; setSelectedAdPeriod: (v: number) => void;
    paySuffixes: string[]; togglePaySuffix: (v: string) => void;
    borderOption: string; setBorderOption: (v: string) => void;
    borderPeriod: number; setBorderPeriod: (v: number) => void;
    selectedIcon: number | null; setSelectedIcon: (v: number | null) => void;
    iconPeriod: number; setIconPeriod: (v: number) => void;
    selectedHighlighter: number | null; setSelectedHighlighter: (v: number | null) => void;
    highlighterPeriod: number; setHighlighterPeriod: (v: number) => void;
    totalAmount: number;
    setExampleType: (v: string) => void;
    setShowExampleModal: (v: boolean) => void;
    onSave?: () => void;
    onPreview?: () => void;
    onBack?: () => void;
    isNewEntry?: boolean;
    isSaving?: boolean;
    mediaUrl: string; setMediaUrl: (v: string) => void;
}

// --- Internal Components ---
const StepIndicator = ({ currentStep, brand, isStep1Done, isStep2Done, isStep3Done, isStep4Done }: { currentStep: number, brand: any, isStep1Done: boolean, isStep2Done: boolean, isStep3Done: boolean, isStep4Done: boolean }) => {
    const steps = [
        { id: 1, label: '기본 정보', target: 'myshop-step-1', isDone: isStep1Done },
        { id: 2, label: '상세 내용', target: 'myshop-step-2', isDone: isStep2Done },
        { id: 3, label: '상품 선택', target: 'myshop-step-3', isDone: isStep3Done },
        { id: 4, label: '추가 옵션', target: 'myshop-step-4', isDone: isStep4Done },
    ];

    const scrollToStep = (id: string) => {
        const el = document.getElementById(id);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    };

    return (
        <div className={`sticky top-[56px] py-5 md:py-3 px-4 md:px-6 mb-4 backdrop-blur-md border-b flex items-center justify-between ${brand.theme === 'dark' ? 'bg-gray-950/80 border-gray-800' : 'bg-white/80 border-gray-100 shadow-sm'}`} style={{ zIndex: UI_Z_INDEX.STICKY + 10 }}>
            <div className="flex items-center gap-3 md:gap-8 overflow-x-auto no-scrollbar scrollbar-hide max-w-full" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                {steps.map((step) => {
                    const isActive = currentStep === step.id;
                    const isCompleted = !!step.isDone;
                    return (
                        <button
                            key={step.id}
                            onClick={() => scrollToStep(step.target)}
                            className="flex items-center gap-2 shrink-0 group transition-all"
                        >
                            <div className={`w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center text-[10px] md:text-sm font-black transition-all ${isActive ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30 scale-110' : isCompleted ? 'bg-green-500 text-white shadow-md' : 'bg-gray-100 text-gray-400'}`}>
                                {isCompleted ? <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg> : step.id}
                            </div>
                            <span className={`text-[10px] md:text-sm font-black whitespace-nowrap transition-colors ${isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-400'} group-hover:text-blue-500`}>
                                {step.label}
                            </span>
                            {step.id < 4 && <div className={`hidden md:block w-4 h-px ${isCompleted ? 'bg-green-200' : 'bg-gray-100'}`} />}
                        </button>
                    );
                })}
            </div>
            <div className="hidden md:flex items-center gap-4 text-[11px] font-bold text-gray-400">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500"></span>진행중</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500"></span>완료</span>
            </div>
        </div>
    );
};

export default function AdForm(props: AdFormProps) {
    const searchParams = useSearchParams();
    const viewParam = searchParams.get('view');
    const { brand } = props;
    const [currentStep, setCurrentStep] = React.useState(1);

    // [Logic] Calculate Step Completion Status - [Strict Validation]
    // Step 1: 기본 정보 (상호명, 성함, 번호가 모두 유효해야 함)
    const isStep1Done = !!(props.shopName && props.shopName !== '상호명 없음' && props.managerName && props.managerName !== '관리자' && props.managerPhone);

    // Step 2: 상세 내용 (제목, 업종, 지역, 급여방식이 모두 선택/입력되어야 함)
    const isStep2Done = !!(
        props.title && props.title !== '제목 없음' &&
        props.industryMain && props.industryMain !== '업종' &&
        props.regionCity && props.regionCity !== '지역' &&
        props.payType && props.payType !== '급여방식선택' &&
        (props.payType === '협의' || (props.payAmount && props.payAmount !== '0' && props.payAmount !== ''))
    );

    // Step 3: 상품 선택 (p1~p7 + p7e 이벤트 베이직 인정)
    const isStep3Done = !!(props.selectedAdProduct && (/^p[1-7]$/.test(props.selectedAdProduct) || props.selectedAdProduct === 'p7e'));

    // Step 4: 추가 옵션 (아이콘, 형광펜, 키워드, 테두리 중 하나라도 '실제로' 선택된 경우만 완료)
    const isStep4Done = !!(
        (props.selectedKeywords && props.selectedKeywords.length > 0) ||
        props.selectedIcon !== null ||
        props.selectedHighlighter !== null ||
        (props.borderOption && props.borderOption !== 'none')
    );

    // [Fix] Force Reset Step 3/4 states on New Entry to ensure clean UI
    // Done at render level if isNewEntry is true to prevent any flickering
    React.useEffect(() => {
        if (props.isNewEntry) {
            props.setSelectedAdProduct(null);
            // [New] Also reset scroll to ensure user starts at the top
            window.scrollTo({ top: 0, behavior: 'instant' });
        }
    }, [props.isNewEntry]);

    // [Safety] If in New Entry mode but somehow a product is selected without interaction, force null
    // (This handles weird race conditions or state leakage from previous edited ads)
    if (props.isNewEntry && props.selectedAdProduct && !props.title) {
        // This is a defensive check; if we have a product but the mandatory title is missing in a "New" form, 
        // it's likely leaked state.
        // props.setSelectedAdProduct(null); // Careful with infinite loops, better to let useEffect handle it
    }

    // [Feature] Track active step on scroll (Intelligent Detection via BoundingRect)
    React.useEffect(() => {
        const handleScroll = () => {
            const steps = [
                { id: 1, el: document.getElementById('myshop-step-1') },
                { id: 2, el: document.getElementById('myshop-step-2') },
                { id: 3, el: document.getElementById('myshop-step-3') },
                { id: 4, el: document.getElementById('myshop-step-4') }
            ];

            let activeStep = 1;
            const threshold = 160; // Offset for header height

            steps.forEach(step => {
                if (step.el && !props.isSaving) {
                    const rect = step.el.getBoundingClientRect();
                    // If the top of the element is within view (with offset), it's potentially active
                    if (rect.top <= threshold + 50) {
                        activeStep = step.id;
                    }
                }
            });

            setCurrentStep(activeStep);
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        handleScroll(); // Initial check
        return () => window.removeEventListener('scroll', handleScroll);
    }, [isStep1Done, isStep2Done, isStep3Done]);

    return (
        <div className="w-full max-w-[1120px] mx-auto space-y-2 md:space-y-5 pb-8 pt-0 px-2 md:px-3 xl:px-0 relative mb-3">
            {/* Sticky Step Progress */}
            <StepIndicator
                currentStep={currentStep}
                brand={brand}
                isStep1Done={isStep1Done}
                isStep2Done={isStep2Done}
                isStep3Done={isStep3Done}
                isStep4Done={isStep4Done}
            />

            {/* Recruitment Registration Header */}
            <div className={`p-4 md:p-5 rounded-[24px] md:rounded-[32px] border shadow-sm ${brand.theme === 'dark' ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'} `}>
                <div className="flex items-start gap-2 md:gap-4 mb-0.5 md:mb-2 text-left">
                    <div className="w-1.5 h-6 md:w-2 md:h-8 bg-blue-500 rounded-full shrink-0"></div>
                    <h1 className={`text-xl md:text-3xl font-black ${brand.theme === 'dark' ? 'text-white' : 'text-gray-900'} `}>채용공고등록</h1>
                </div>
                <p className={`${brand.theme === 'dark' ? 'text-gray-300' : 'text-gray-900'} font-bold text-[11px] md:text-base ml-0 leading-tight md:leading-normal`}>
                    <span className="mr-0.5 text-blue-500 font-extrabold">*</span> 표시 항목은 필수 입력입니다. 정확히 입력해주세요.
                </p>
                <p className={`${brand.theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} font-bold text-[10px] md:text-sm ml-0 mt-0.5`}>
                    작성시, 우측 상단의 &apos;예시 보기&apos;를 참고해주세요!
                </p>
            </div>

            <Step1BasicInfo {...props} />
            <Step2JobDetail {...props} setShowTemplateModal={props.setShowTemplateModal} />

            <Step3ProductSelect {...props} isNewEntry={props.isNewEntry} />
            <Step4Extras
                {...props}
                isNewEntry={props.isNewEntry}
                selectedKeywords={props.selectedKeywords}
                setSelectedKeywords={props.setSelectedKeywords}
                selectedAdProduct={props.selectedAdProduct}
                setExampleType={props.setExampleType}
                setShowExampleModal={props.setShowExampleModal}
            />

            {/* Total Amount Display (Redesigned matching Capture 1/2) */}
            <div className="max-w-[900px] mx-auto w-full px-4 md:px-0 mt-5">
                <div className="bg-[#e0007b] text-white py-3 px-4 md:p-8 rounded-[24px] shadow-xl flex flex-col md:flex-row items-center justify-between gap-3 md:gap-6 overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                    <div className="text-center md:text-left z-10 shrink-0">
                        <div className="font-black text-base md:text-xl">결제는 PC와 모바일 모두 가능합니다.</div>
                        <div className="text-[10px] md:text-xs opacity-80 mt-1 font-bold">모든 광고 상품은 결제 및 심사 후 즉시 자동 적용되어 노출됩니다.</div>
                    </div>
                    <div className="flex flex-col md:flex-row items-center gap-2 md:gap-8 w-full md:w-auto z-10">
                        <div className="font-black text-base md:text-lg whitespace-nowrap opacity-90">총 신청 금액</div>
                        <div className="bg-white/20 border border-white/20 p-2 md:p-5 rounded-2xl min-w-[180px] md:min-w-[240px] text-center shadow-inner">
                            <span className="text-2xl md:text-5xl font-black tracking-tighter">{props.totalAmount.toLocaleString()}원</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Sticky Bottom Navigation — 가격 포함 */}
            <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-gray-100 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] pointer-events-none" style={{ zIndex: UI_Z_INDEX.NAV_BOTTOM + 20 }}>
                <div className="max-w-[640px] mx-auto pointer-events-auto">
                    {/* 가격 행 (상품 선택 시만 표시) */}
                    {props.totalAmount > 0 && (
                        <div className="flex items-center justify-between px-4 pt-2.5 pb-0">
                            <span className="text-[10px] font-bold text-gray-400">총 신청 금액</span>
                            <span className="text-base font-black text-[#e0007b] tracking-tight">
                                {props.totalAmount.toLocaleString()}원
                            </span>
                        </div>
                    )}
                    {/* 버튼 행 */}
                    <div className="flex flex-row gap-2 p-3">
                        <button
                            type="button"
                            onClick={() => props.onPreview?.()}
                            className="flex-1 py-3 rounded-2xl bg-slate-800 text-white font-black text-xs hover:bg-slate-900 transition flex items-center justify-center gap-1 shadow-lg active:scale-95 whitespace-nowrap"
                        >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                            보기
                        </button>
                        <button
                            onClick={() => props.onBack?.()}
                            className="flex-1 py-3 rounded-2xl bg-white text-gray-500 font-black text-xs hover:bg-gray-50 transition shadow-sm border border-gray-200 active:scale-95 whitespace-nowrap"
                        >
                            취소
                        </button>
                        <button
                            onClick={() => props.onSave?.()}
                            className="flex-[2] py-3 bg-gradient-to-r from-blue-500 to-rose-600 text-white font-black text-xs md:text-sm rounded-2xl flex items-center justify-center gap-1.5 shadow-xl shadow-blue-500/20 active:scale-[0.98] transition-all hover:brightness-110 whitespace-nowrap"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                            저장 및 심사
                        </button>
                    </div>
                </div>
            </div>
            <style jsx global>{`
                .scrollbar-hide::-webkit-scrollbar { display: none; }
                .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
        </div>
    );
}
