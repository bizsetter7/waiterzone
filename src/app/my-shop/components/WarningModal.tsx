import React from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle } from 'lucide-react';

interface ModalProps {
    brand: any;
    onClose: () => void;
}

interface WarningModalProps extends ModalProps {
    onConfirm: () => void;
}

export const WarningModal: React.FC<WarningModalProps> = ({ brand, onClose, onConfirm }) => {
    if (typeof document === 'undefined') return null;
    return createPortal(
        <div className="fixed inset-0 z-[20000] flex items-center justify-center bg-black/70 p-4 backdrop-blur-md">
            <div className={`rounded-[32px] shadow-2xl max-w-sm w-full p-8 text-center space-y-6 transform animate-in fade-in zoom-in duration-200 ${brand.theme === 'dark' ? 'bg-gray-900 border border-gray-800' : 'bg-white'}`}>
                <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-2 border-4 shadow-sm ${brand.theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-blue-50 border-white'}`}>
                    <AlertTriangle size={40} className="text-blue-500" />
                </div>
                <h3 className={`text-2xl font-black tracking-tight ${brand.theme === 'dark' ? 'text-white' : 'text-black'}`}>게시글 작성 전 필독! 📢</h3>
                <div className={`text-left text-[13px] p-6 rounded-2xl space-y-3 leading-relaxed border font-bold ${brand.theme === 'dark' ? 'bg-gray-800/50 text-gray-300 border-gray-700' : 'bg-gray-50/80 text-gray-700 border-gray-100'}`}>
                    <p className="flex gap-3">
                        <span className="text-blue-500 font-black shrink-0">1.</span>
                        <span>월 수정횟수는 <strong className={`${brand.theme === 'dark' ? 'text-white' : 'text-black'} font-black`}>30회</strong> 입니다.</span>
                    </p>
                    <p className="flex gap-3">
                        <span className="text-blue-500 font-black shrink-0">2.</span>
                        <span>금칙어 사용 시 <strong className={`${brand.theme === 'dark' ? 'text-white' : 'text-black'} font-black`}>통보 없이 삭제</strong>될 수 있습니다.</span>
                    </p>
                    <p className="flex gap-3">
                        <span className="text-blue-500 font-black shrink-0">3.</span>
                        <span>본문 내용은 <strong className={`${brand.theme === 'dark' ? 'text-white' : 'text-black'} font-black`}>1000자 이내</strong>로 작성해주세요.</span>
                    </p>
                </div>
                <div className="grid grid-cols-2 gap-3 pt-2">
                    <button onClick={onClose} className={`py-4 rounded-xl border-2 font-bold transition-colors ${brand.theme === 'dark' ? 'border-gray-800 text-gray-500 hover:bg-gray-800' : 'border-gray-100 text-gray-500 hover:bg-gray-50'}`}>취소</button>
                    <button onClick={onConfirm} className="py-4 rounded-xl bg-[#ff3399] text-white font-bold hover:opacity-90 transition-opacity shadow-lg shadow-blue-100/10">확인 후 작성</button>
                </div>
            </div>
        </div>,
        document.body
    );
};
