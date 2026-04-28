'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { getUserPoints } from '@/lib/points';
import { supabase } from '@/lib/supabase';
import { Zap, MapPin, Users, AlertCircle, Check, ChevronDown } from 'lucide-react';

// 발송 가능 지역 목록
const REGION_OPTIONS = [
    { label: '서울 전체', value: '서울', group: '서울' },
    { label: '강남구', value: '강남구', group: '서울' },
    { label: '서초구', value: '서초구', group: '서울' },
    { label: '송파구', value: '송파구', group: '서울' },
    { label: '마포구', value: '마포구', group: '서울' },
    { label: '영등포구', value: '영등포구', group: '서울' },
    { label: '강서구', value: '강서구', group: '서울' },
    { label: '노원구', value: '노원구', group: '서울' },
    { label: '경기도 전체', value: '경기도', group: '경기' },
    { label: '수원시', value: '수원시', group: '경기' },
    { label: '성남시', value: '성남시', group: '경기' },
    { label: '용인시', value: '용인시', group: '경기' },
    { label: '고양시', value: '고양시', group: '경기' },
    { label: '부천시', value: '부천시', group: '경기' },
    { label: '인천 전체', value: '인천', group: '인천' },
    { label: '부산 전체', value: '부산', group: '부산' },
    { label: '대구 전체', value: '대구', group: '대구' },
    { label: '대전 전체', value: '대전', group: '대전' },
    { label: '광주 전체', value: '광주', group: '광주' },
    { label: '수도권 전체', value: '수도권', group: '광역' },
    { label: '전국', value: '전국', group: '광역' },
];

const POINT_BY_COUNT = (count: number) => {
    if (count <= 10) return 500;
    if (count <= 20) return 1000;
    if (count <= 30) return 1500;
    return 2000;
};

// SOS 예시 메시지
const QUICK_MESSAGES = [
    '지금 일 미친듯이 많음! 바로 출근 가능한 분 연락주세요!',
    '오늘 저녁 타임 급하게 구합니다. 페이 좋아요!',
    '지금 당장 출근 가능한 분! 특별 인센티브 있어요.',
    '오늘 손님 많아요. 빠른 연락 주세요!',
];

export const SosAlertView = ({ brand }: { brand: any }) => {
    const { user, userPoints: authPoints, userName } = useAuth();
    const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
    const [message, setMessage] = useState('');
    const [recipientCount, setRecipientCount] = useState<number | null>(null);
    const [pointCost, setPointCost] = useState(0);
    const [myPoints, setMyPoints] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [isCounting, setIsCounting] = useState(false);
    const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
    const [showRegionPicker, setShowRegionPicker] = useState(false);
    const [alertHistory, setAlertHistory] = useState<any[]>([]);
    const [hasActivePaidAd, setHasActivePaidAd] = useState<boolean | null>(null);

    // 내 포인트 조회 (useAuth 기본값 + 실시간 갱신)
    useEffect(() => {
        if (!user?.id) return;
        setMyPoints(authPoints ?? 0);
        const fetchPoints = async () => {
            try {
                const p = await getUserPoints(user.id);
                setMyPoints(p);
            } catch (err) {
                console.warn('Failed to fetch points:', err);
            }
        };
        fetchPoints();
    }, [user?.id, authPoints]);

    // 진행 중 유료공고 보유 여부 확인 (T1~T7 상품, status=active)
    useEffect(() => {
        if (!user?.id || user.id.startsWith('mock_')) {
            setHasActivePaidAd(true); // mock 유저는 제한 없음
            return;
        }

        const checkPaidAd = async () => {
            try {
                const { count } = await supabase
                    .from('shops')
                    .select('id', { count: 'exact', head: true })
                    .eq('user_id', user.id)
                    .eq('status', 'active')
                    .not('product_type', 'is', null);
                setHasActivePaidAd((count ?? 0) > 0);
            } catch (err) {
                setHasActivePaidAd(true);
            }
        };
        checkPaidAd();
    }, [user?.id]);

    // 지역 변경 시 수신자 수 조회
    const fetchRecipientCount = useCallback(async (regions: string[]) => {
        if (!regions.length) {
            setRecipientCount(null);
            setPointCost(0);
            return;
        }
        setIsCounting(true);
        try {
            const res = await fetch(`/api/sos/count?regions=${regions.map(encodeURIComponent).join(',')}`);
            const data = await res.json();
            const count = data.count ?? 0;
            setRecipientCount(count);
            setPointCost(POINT_BY_COUNT(count));
        } catch {
            setRecipientCount(0);
        } finally {
            setIsCounting(false);
        }
    }, []);

    useEffect(() => {
        fetchRecipientCount(selectedRegions);
    }, [selectedRegions, fetchRecipientCount]);

    // SOS 발송 이력 조회
    useEffect(() => {
        if (!user?.id) return;
        fetch(`/api/sos/history?shopId=${user.id}`)
            .then(r => r.json())
            .then(d => setAlertHistory(d.alerts ?? []))
            .catch(() => {});
    }, [user?.id]);

    const toggleRegion = (value: string) => {
        setSelectedRegions(prev =>
            prev.includes(value) ? prev.filter(r => r !== value) : [...prev, value]
        );
    };

    const handleSend = async () => {
        if (!user?.id) return alert('로그인이 필요합니다.');
        if (!selectedRegions.length) return alert('발송 지역을 선택해주세요.');
        if (!message.trim()) return alert('메시지를 입력해주세요.');
        if (message.length > 50) return alert('메시지는 50자 이내로 작성해주세요.');
        if (myPoints < pointCost) return alert(`포인트가 부족합니다.\n필요: ${pointCost}P / 보유: ${myPoints}P`);

        const confirmMsg = `SOS 긴급구인 알림을 발송합니다.\n\n` +
            `발송 지역: ${selectedRegions.join(', ')}\n` +
            `예상 수신: ${recipientCount ?? 0}명\n` +
            `차감 포인트: ${pointCost}P\n\n` +
            `메시지:\n"${message}"\n\n` +
            `발송하시겠습니까?`;

        if (!confirm(confirmMsg)) return;

        setIsLoading(true);
        setResult(null);
        try {
            const shopName = userName || '웨이터존 업소';

            const res = await fetch('/api/sos/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    shopId: user.id, // shopId = user.id (profiles.id, uuid) — shops 테이블의 id가 아님
                    shopName,
                    message: message.trim(),
                    regions: selectedRegions,
                }),
            });
            const data = await res.json();

            if (!res.ok) throw new Error(data.error || '발송 실패');

            setMyPoints(data.remainingPoints);
            setResult({
                success: true,
                message: `✅ 발송 완료! ${data.successCount}명에게 알림이 전송됐습니다. (${data.pointDeducted}P 차감)`,
            });
            setMessage('');
            setSelectedRegions([]);
        } catch (err: any) {
            setResult({ success: false, message: `❌ ${err.message}` });
        } finally {
            setIsLoading(false);
        }
    };

    const cardBg = brand.theme === 'dark' ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100';
    const textMain = brand.theme === 'dark' ? 'text-white' : 'text-gray-900';
    const textSub = brand.theme === 'dark' ? 'text-gray-400' : 'text-gray-500';

    // 이용 자격 미충족 시 잠금 화면
    if (hasActivePaidAd === false) {
        return (
            <div className={`p-6 rounded-2xl border shadow-sm text-center ${brand.theme === 'dark' ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'}`}>
                <div className="text-5xl mb-4">🔒</div>
                <h3 className={`text-lg font-black mb-2 ${brand.theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>SOS 긴급구인 이용 불가</h3>
                <p className={`text-sm font-bold mb-6 leading-relaxed ${brand.theme === 'dark' ? 'text-gray-300' : 'text-gray-900'}`}>
                    SOS 긴급구인은 유료광고진행중인 <br /> 
                    업체회원만 사용할 수 있습니다.
                </p>
                <button
                    onClick={() => window.dispatchEvent(new CustomEvent('setView', { detail: 'form' }))}
                    className="w-full py-3 bg-[#1e3a5f] text-white font-black rounded-2xl shadow-lg hover:bg-[#162d4a] transition"
                >
                    유료공고 등록하러 가기
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* 헤더 */}
            <div className={`p-5 rounded-2xl border shadow-sm ${cardBg}`}>
                <div className="flex items-center gap-3 mb-1">
                    <div className="w-10 h-10 rounded-xl bg-red-500 flex items-center justify-center">
                        <Zap size={20} className="text-white" />
                    </div>
                    <div>
                        <h2 className={`text-lg font-black ${textMain}`}>SOS 긴급구인 알림</h2>
                        <p className={`text-xs ${textSub}`}>알림 수신 동의 구직자에게 즉시 발송됩니다</p>
                    </div>
                    <div className="ml-auto text-right">
                        <p className={`text-xs ${textSub}`}>보유 포인트</p>
                        <p className={`text-lg font-black ${brand.theme === 'dark' ? 'text-yellow-400' : 'text-blue-600'}`}>
                            C {myPoints.toLocaleString()}
                        </p>
                    </div>
                </div>
            </div>

            {/* 지역 선택 */}
            <div className={`p-5 rounded-2xl border shadow-sm ${cardBg}`}>
                <div className="flex items-center gap-2 mb-3">
                    <MapPin size={16} className="text-red-500" />
                    <h3 className={`text-sm font-black ${textMain}`}>발송 지역 선택</h3>
                    <p className={`text-xs ${textSub} ml-auto`}>
                        경기권·지방은 타지역 구직자도 선택 가능
                    </p>
                </div>

                <button
                    onClick={() => setShowRegionPicker(!showRegionPicker)}
                    className={`w-full flex items-center justify-between p-3 rounded-xl border text-sm mb-2 transition ${
                        selectedRegions.length
                            ? 'border-red-300 bg-red-50 text-red-700'
                            : brand.theme === 'dark'
                                ? 'border-gray-700 bg-gray-800 text-gray-400'
                                : 'border-gray-200 bg-gray-50 text-gray-500'
                    }`}
                >
                    <span>
                        {selectedRegions.length
                            ? selectedRegions.join(', ')
                            : '지역을 선택하세요'}
                    </span>
                    <ChevronDown size={16} className={showRegionPicker ? 'rotate-180' : ''} />
                </button>

                {showRegionPicker && (
                    <div className={`p-3 rounded-xl border ${brand.theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                        {['광역', '서울', '경기', '인천', '부산', '대구', '대전', '광주'].map(group => {
                            const groupItems = REGION_OPTIONS.filter(r => r.group === group);
                            if (!groupItems.length) return null;
                            return (
                                <div key={group} className="mb-3">
                                    <p className={`text-[10px] font-bold mb-1.5 ${textSub}`}>{group}</p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {groupItems.map(r => (
                                            <button
                                                key={r.value}
                                                onClick={() => toggleRegion(r.value)}
                                                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                                                    selectedRegions.includes(r.value)
                                                        ? 'bg-red-500 text-white'
                                                        : brand.theme === 'dark'
                                                            ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                                            : 'bg-white text-gray-600 border border-gray-200 hover:border-red-300'
                                                }`}
                                            >
                                                {r.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* 수신자 수 표시 */}
                {selectedRegions.length > 0 && (
                    <div className="flex items-center gap-2 mt-2 p-3 rounded-xl bg-blue-50 border border-blue-100">
                        <Users size={16} className="text-blue-500" />
                        <span className="text-sm text-blue-700">
                            {isCounting ? (
                                '수신자 수 확인 중...'
                            ) : (
                                <>
                                    현재 알림 수신 동의 구직자{' '}
                                    <strong>{recipientCount ?? 0}명</strong>에게 발송 →{' '}
                                    <strong className="text-red-600">{pointCost}P 차감</strong>
                                </>
                            )}
                        </span>
                    </div>
                )}
            </div>

            {/* 메시지 작성 */}
            <div className={`p-5 rounded-2xl border shadow-sm ${cardBg}`}>
                <h3 className={`text-sm font-black ${textMain} mb-3`}>💬 긴급 메시지 작성</h3>

                {/* 빠른 예시 */}
                <div className="flex flex-wrap gap-1.5 mb-3">
                    {QUICK_MESSAGES.map((msg, i) => (
                        <button
                            key={i}
                            onClick={() => setMessage(msg)}
                            className={`px-2 py-1 rounded-lg text-[11px] transition ${
                                brand.theme === 'dark'
                                    ? 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                            }`}
                        >
                            예시 {i + 1}
                        </button>
                    ))}
                </div>

                <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value.slice(0, 50))}
                    placeholder="예) 지금 일 미친듯이 많음! 바로 출근 가능한 분 연락주세요!"
                    rows={3}
                    className={`w-full p-3 rounded-xl border text-sm resize-none ${
                        brand.theme === 'dark'
                            ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500'
                            : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'
                    }`}
                />
                <div className="flex justify-between items-center mt-1">
                    <p className={`text-xs ${textSub}`}>업소명은 자동으로 포함됩니다</p>
                    <p className={`text-xs ${message.length >= 45 ? 'text-red-500' : textSub}`}>
                        {message.length}/50자
                    </p>
                </div>
            </div>

            {/* 안내 */}
            <div className={`p-4 rounded-xl border ${brand.theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-amber-50 border-amber-200'}`}>
                <div className="flex gap-2">
                    <AlertCircle size={14} className="text-amber-500 mt-0.5 shrink-0" />
                    <div className={`text-xs ${brand.theme === 'dark' ? 'text-gray-400' : 'text-amber-700'} space-y-1`}>
                        <p>• 알림은 수신 동의 구직자에게만 발송됩니다</p>
                        <p>• 허위 SOS 발송은 해당 업소 공고 신고로 처리됩니다</p>
                        <p>• 발송 후 포인트는 환불되지 않습니다</p>
                        <p>• 1일 최대 5회까지 발송 가능합니다</p>
                    </div>
                </div>
            </div>

            {/* 결과 메시지 */}
            {result && (
                <div className={`p-4 rounded-xl flex items-center gap-2 ${
                    result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                }`}>
                    <Check size={16} className={result.success ? 'text-green-600' : 'text-red-500'} />
                    <p className={`text-sm font-bold ${result.success ? 'text-green-700' : 'text-red-600'}`}>
                        {result.message}
                    </p>
                </div>
            )}

            {/* 발송 버튼 */}
            <button
                onClick={handleSend}
                disabled={isLoading || !selectedRegions.length || !message.trim()}
                className={`w-full py-4 rounded-2xl font-black text-white text-base shadow-lg transition ${
                    isLoading || !selectedRegions.length || !message.trim()
                        ? 'bg-gray-300 cursor-not-allowed'
                        : 'bg-red-500 hover:bg-red-600 active:scale-[0.98]'
                }`}
            >
                {isLoading ? '발송 중...' : `🆘 SOS 발송하기 ${pointCost ? `(${pointCost}P)` : ''}`}
            </button>

            {/* 발송 이력 */}
            {alertHistory.length > 0 && (
                <div className={`p-5 rounded-2xl border shadow-sm ${cardBg}`}>
                    <h3 className={`text-sm font-black ${textMain} mb-3`}>📋 최근 발송 이력</h3>
                    <div className="space-y-2">
                        {alertHistory.slice(0, 5).map((alert: any) => (
                            <div
                                key={alert.id}
                                className={`p-3 rounded-xl text-xs ${
                                    brand.theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'
                                }`}
                            >
                                <div className="flex justify-between mb-1">
                                    <span className={`font-bold ${textMain}`}>{alert.message}</span>
                                    <span className="text-red-500 font-bold">-{alert.point_deducted}P</span>
                                </div>
                                <div className={`flex justify-between ${textSub}`}>
                                    <span>{alert.target_regions?.join(', ')}</span>
                                    <span>{alert.recipient_count}명 수신 · {new Date(alert.sent_at).toLocaleDateString()}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
