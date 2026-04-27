'use client';

import { useEffect } from 'react';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error('Global Error caught:', error);
    }, [error]);

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-4">
            <h2 className="text-2xl font-black text-gray-900 mb-2">오류가 발생했습니다</h2>
            <p className="text-gray-500 mb-6 max-w-md">
                죄송합니다. 예상치 못한 오류가 발생했습니다.<br />
                잠시 후 다시 시도해 주세요.
            </p>
            <div className="flex gap-3">
                <button
                    onClick={() => reset()}
                    className="px-6 py-2 bg-gray-900 text-white font-bold rounded-lg hover:bg-black transition-colors"
                >
                    다시 시도
                </button>
                <button
                    onClick={() => window.location.href = '/'}
                    className="px-6 py-2 bg-gray-100 text-gray-700 font-bold rounded-lg hover:bg-gray-200 transition-colors"
                >
                    홈으로 가기
                </button>
            </div>
            {process.env.NODE_ENV === 'development' && (
                <div className="mt-8 p-4 bg-red-50 text-red-700 rounded-lg text-left text-xs font-mono max-w-2xl overflow-auto w-full">
                    <p className="font-bold mb-1">{error.name}: {error.message}</p>
                    <pre>{error.stack}</pre>
                </div>
            )}
        </div>
    );
}
