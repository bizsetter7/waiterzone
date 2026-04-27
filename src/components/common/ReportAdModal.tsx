'use client';

import { useState } from 'react';

const REASONS = [
    '사업자 정보와 실제 근무지 불일치',
    '부당한 대우',
    '허위/과장 광고',
    '비허가/불법 업소 의심',
    '기타',
];

interface Props {
    onClose: () => void;
}

export const ReportAdModal = ({ onClose }: Props) => {
    const [reason, setReason] = useState('');
    const [detail, setDetail] = useState('');
    const [contact, setContact] = useState('');
    const [loading, setLoading] = useState(false);
    const [done, setDone] = useState(false);

    const handleSubmit = async () => {
        if (!reason) { alert('신고 사유를 선택해주세요.'); return; }
        setLoading(true);
        try {
            const res = await fetch('/api/report/ad', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reason, detail, contact }),
            });
            if (res.ok) setDone(true);
            else alert('신고 접수 중 오류가 발생했습니다. 다시 시도해주세요.');
        } finally {
            setLoading(false);
        }
    };

    if (done) return (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/50">
            <div className="bg-white rounded-2xl p-8 max-w-sm w-full mx-4 text-center">
                <p className="text-lg font-black text-gray-900 mb-2">신고가 접수되었습니다.</p>
                <p className="text-sm text-gray-500 mb-6">검토 후 신속하게 조치하겠습니다.</p>
                <button onClick={onClose} className="w-full py-3 bg-gray-900 text-white rounded-xl font-bold hover:bg-gray-700 transition-colors">확인</button>
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/50" onClick={onClose}>
            <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                {/* 헤더 */}
                <div className="flex items-center gap-2 mb-3">
                    <span className="text-orange-500 text-xl">▲</span>
                    <h2 className="text-lg font-black text-gray-900">공고 신고하기</h2>
                </div>
                <p className="text-xs text-gray-500 mb-5 leading-relaxed">
                    사업자 정보와 실제 근무지가 다르거나, 부당한 대우 등의 문제가 있는 경우 신고해주세요.
                    신고가 일정 횟수 이상 누적된 업소는 공고가 비공개 처리됩니다.
                </p>

                {/* 신고 사유 */}
                <p className="text-sm font-bold text-gray-900 mb-3">신고 사유 <span className="text-red-500">*</span></p>
                <div className="space-y-2 mb-5">
                    {REASONS.map(r => (
                        <label key={r} className="flex items-center gap-3 border border-gray-200 rounded-xl px-4 py-3 cursor-pointer hover:border-gray-400 transition-colors">
                            <input type="radio" name="reason" value={r} checked={reason === r} onChange={() => setReason(r)} className="accent-gray-900" />
                            <span className="text-sm text-gray-700">{r}</span>
                        </label>
                    ))}
                </div>

                {/* 상세 내용 */}
                <p className="text-sm font-bold text-gray-900 mb-2">상세 내용</p>
                <textarea
                    value={detail}
                    onChange={e => setDetail(e.target.value)}
                    placeholder="신고 내용을 상세히 입력해주세요."
                    className="w-full border border-gray-200 rounded-xl p-3 text-sm resize-none h-24 mb-4 focus:outline-none focus:border-gray-400 transition-colors"
                />

                {/* 연락처 */}
                <p className="text-sm font-bold text-gray-900 mb-2">연락처 (선택)</p>
                <input
                    value={contact}
                    onChange={e => setContact(e.target.value)}
                    placeholder="처리 결과 안내를 원하시면 연락처를 입력해주세요."
                    className="w-full border border-gray-200 rounded-xl p-3 text-sm mb-5 focus:outline-none focus:border-gray-400 transition-colors"
                />

                {/* 버튼 */}
                <div className="flex gap-3">
                    <button onClick={onClose} className="flex-1 py-3 border border-gray-200 rounded-xl font-bold text-gray-700 hover:bg-gray-50 transition-colors">취소</button>
                    <button onClick={handleSubmit} disabled={loading} className="flex-1 py-3 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 disabled:opacity-50 transition-colors">
                        {loading ? '접수 중...' : '신고하기'}
                    </button>
                </div>
            </div>
        </div>
    );
};
