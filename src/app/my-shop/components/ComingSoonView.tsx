import React from 'react';
import { Settings } from 'lucide-react';
import { useBrand } from '@/components/BrandProvider';

export const ComingSoonView = ({ title }: { title: string }) => {
    const brand = useBrand();
    return (
        <div className={`p-10 rounded-2xl border text-center flex flex-col items-center justify-center gap-4 min-h-[400px] ${brand.theme === 'dark' ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'}`}>
            <div className={`w-20 h-20 rounded-full flex items-center justify-center text-gray-400 ${brand.theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'}`}>
                <Settings size={32} />
            </div>
            <div>
                <h2 className={`text-xl font-black mb-1 ${brand.theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{title}</h2>
                <p className="text-gray-500 font-bold">서비스 준비 중입니다.</p>
            </div>
        </div>
    );
};
