import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

export const ExampleModal = React.memo(({ show, type, onClose, brand }: any) => {
    const [mounted, setMounted] = useState(false);
    useEffect(() => { setMounted(true); }, []);

    if (!show || !mounted) return null;
    const examples = {
        step2_card: { title: '광고 카드 노출 예시', img: '/images/examples/capture1.jpg', desc: '남들과는 다른 다양한 추가옵션으로\n시선을 사로 잡으세요!' },
        step2_list: { title: '리스트/줄광고 노출 예시', img: '/images/examples/capture2.jpg', desc: '남들과는 다른 다양한 추가옵션으로\n시선을 사로 잡으세요!' },
        step4_pay: { title: '급여 옵션 카드 예시', img: '/images/guide/광고카드 상세 예시.jpg', desc: '강조된 급여 옵션 노출 예시입니다.' },
        step4_effect: { title: '강조 효과 (테두리/Glow) 예시', img: '/images/guide/홈페이지 메인페이지(특수_그랜드_프리미엄).jpg', desc: '테두리 및 Glow 특수 효과 노출 예시입니다.' },
        step4_icon: { title: '10종 아이콘 종류 및 예시', img: '/images/guide/리스트 광고 표시 예시.jpg', desc: '광고 신뢰도를 높이는 10종의 아이콘 예시입니다.' },
        step4_hl: { title: '8가지 컬러 형광펜 예시', img: '/images/guide/홈페이지 페이지(리스트광고).jpg', desc: '타이틀을 돋보이게 하는 8가지 컬러 형광펜 예시입니다.' }
    };
    const cur = (examples as any)[type] || examples.step2_card;
    return createPortal(
        <div className="fixed inset-0 z-[20000] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />
            <div className={`relative w-full max-w-md rounded-[32px] overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200 ${brand.theme === 'dark' ? 'bg-gray-900 border border-gray-800' : 'bg-white'}`}>
                <div className={`p-5 border-b flex justify-between items-center ${brand.theme === 'dark' ? 'border-gray-800' : 'border-gray-100'}`}>
                    <h3 className={`text-lg font-black ${brand.theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{cur.title}</h3>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition"><X size={20} /></button>
                </div>
                <div className="p-4 max-h-[60vh] overflow-y-auto bg-white flex items-center justify-center relative min-h-[200px]">
                    <img src={cur.img} alt={cur.title} className="max-w-full h-auto rounded-xl shadow-lg border border-gray-100" />
                </div>
                <div className="p-6 bg-white space-y-4">
                    <p className={`text-sm font-bold text-center leading-relaxed whitespace-pre-line ${brand.theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>{cur.desc}</p>
                    <button onClick={onClose} className="w-full py-4 bg-gray-900 text-white font-black rounded-2xl hover:bg-black transition">확인했습니다</button>
                </div>
            </div>
        </div>,
        document.body
    );
});
ExampleModal.displayName = 'ExampleModal';
