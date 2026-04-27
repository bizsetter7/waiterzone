'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { CalendarDays, CheckCircle2, ChevronLeft, ChevronRight, Flame, Sparkles } from 'lucide-react';
import { useBrand } from '@/components/BrandProvider';
import { supabase } from '@/lib/supabase';
import { updatePoints } from '@/lib/points';

// ─── 유틸: 해당 월의 달력 데이터 생성 ──────────────────────────────────
function buildCalendarMatrix(year: number, month: number): (number | null)[][] {
    const firstDay = new Date(year, month, 1).getDay(); // 0=일
    const lastDate = new Date(year, month + 1, 0).getDate();
    const weeks: (number | null)[][] = [];
    let week: (number | null)[] = Array(firstDay).fill(null);

    for (let d = 1; d <= lastDate; d++) {
        week.push(d);
        if (week.length === 7) { weeks.push(week); week = []; }
    }
    if (week.length > 0) {
        while (week.length < 7) week.push(null);
        weeks.push(week);
    }
    return weeks;
}

// ─── 메인 컴포넌트 ──────────────────────────────────────────────────────
export function AttendanceView({ userId }: { userId: string }) {
    const brand = useBrand();
    const isDark = brand.theme === 'dark';

    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    const [viewYear, setViewYear] = useState(today.getFullYear());
    const [viewMonth, setViewMonth] = useState(today.getMonth()); // 0-indexed
    const [attendedDates, setAttendedDates] = useState<Set<string>>(new Set());
    const [isLoading, setIsLoading] = useState(true);
    const [isChecking, setIsChecking] = useState(false);
    const isCheckingRef = useRef(false); // [BUG-FIX] 레이스 컨디션 방지용 ref (state 업데이트 비동기 한계 보완)
    const [streak, setStreak] = useState(0);

    // ─── 이번 달 출석 로그 불러오기 ─────────────────────────────────────
    const fetchAttendance = useCallback(async () => {
        if (!userId) return;
        setIsLoading(true);
        try {
            // [BUG-FIX] KST 보정: 로컬 월 시작~끝을 toISOString()으로 UTC 변환 (문자열 직접 포맷은 Supabase가 UTC로 해석)
            const lastDay = new Date(viewYear, viewMonth + 1, 0).getDate();
            const from = new Date(viewYear, viewMonth, 1, 0, 0, 0).toISOString();
            const to   = new Date(viewYear, viewMonth, lastDay, 23, 59, 59).toISOString();

            const { data } = await supabase
                .from('point_logs')
                .select('created_at')
                .eq('user_id', userId)
                .eq('reason', 'ATTENDANCE_CHECK')
                .gte('created_at', from)
                .lte('created_at', to);

            // [BUG-FIX] UTC→로컬 변환: DB created_at은 UTC, todayStr은 로컬(KST) 기준 → 변환 후 비교
            const dates = new Set<string>(
                (data || []).map((row: any) => {
                    const d = new Date(row.created_at);
                    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                })
            );
            setAttendedDates(dates);
        } catch (e) {
            console.error('Attendance fetch error:', e);
        } finally {
            setIsLoading(false);
        }
    }, [userId, viewYear, viewMonth]);

    // ─── 연속 출석 스트릭 계산 ───────────────────────────────────────────
    const fetchStreak = useCallback(async () => {
        if (!userId) return;
        try {
            const { data } = await supabase
                .from('point_logs')
                .select('created_at')
                .eq('user_id', userId)
                .eq('reason', 'ATTENDANCE_CHECK')
                .order('created_at', { ascending: false })
                .limit(60);

            if (!data || data.length === 0) { setStreak(0); return; }

            const uniqueDays = [...new Set(data.map((r: any) => r.created_at.substring(0, 10)))];
            let count = 0;
            let cursor = new Date(today);
            for (const day of uniqueDays) {
                const cursorStr = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}-${String(cursor.getDate()).padStart(2, '0')}`;
                if (day === cursorStr) {
                    count++;
                    cursor.setDate(cursor.getDate() - 1);
                } else break;
            }
            setStreak(count);
        } catch (e) {
            console.error('Streak fetch error:', e);
        }
    }, [userId]);

    useEffect(() => {
        fetchAttendance();
    }, [fetchAttendance]);

    useEffect(() => {
        fetchStreak();
    }, [fetchStreak, attendedDates]);

    // ─── 출석체크 실행 ───────────────────────────────────────────────────
    const handleCheckIn = async () => {
        // [BUG-FIX] ref로 즉각 잠금 — state 업데이트 비동기 딜레이로 인한 연타 중복 방지
        if (!userId || attendedDates.has(todayStr) || isCheckingRef.current) return;
        isCheckingRef.current = true;
        setIsChecking(true);
        try {
            const result = await updatePoints(userId, 'ATTENDANCE_CHECK');
            if (result.success) {
                setAttendedDates(prev => new Set([...prev, todayStr]));
                setStreak(prev => prev + 1);
                alert('🎉 출석체크 완료! +3P 적립되었습니다.');
            } else {
                // 서버에서 409 (이미 출석) 반환 시 UI 상태도 완료로 동기화
                if ((result as any).alreadyChecked) {
                    setAttendedDates(prev => new Set([...prev, todayStr]));
                    alert('오늘 이미 출석체크를 완료했습니다.');
                } else {
                    throw new Error(result.error || '포인트 지급 실패');
                }
            }
        } catch (e: any) {
            alert(`출석체크 실패: ${e.message}`);
        } finally {
            isCheckingRef.current = false;
            setIsChecking(false);
        }
    };

    // ─── 달력 네비게이션 ────────────────────────────────────────────────
    const goPrev = () => {
        if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
        else setViewMonth(m => m - 1);
    };
    const goNext = () => {
        const nowMonth = today.getMonth();
        const nowYear = today.getFullYear();
        if (viewYear > nowYear || (viewYear === nowYear && viewMonth >= nowMonth)) return;
        if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
        else setViewMonth(m => m + 1);
    };

    const matrix = buildCalendarMatrix(viewYear, viewMonth);
    const isCurrentMonth = viewYear === today.getFullYear() && viewMonth === today.getMonth();
    const todayChecked = attendedDates.has(todayStr);
    const thisMonthCount = attendedDates.size;

    return (
        <div className={`space-y-5 animate-in fade-in duration-300`}>
            {/* 헤더 카드 */}
            <div className={`p-6 md:p-8 rounded-[32px] border shadow-sm ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-blue-50'}`}>
                <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center shrink-0">
                        <CalendarDays size={24} className="text-[#f82b60]" />
                    </div>
                    <div>
                        <h2 className="text-xl md:text-2xl font-black">출석체크</h2>
                        <p className={`text-sm font-bold mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                            매일 출석하고 포인트를 모아보세요!
                        </p>
                    </div>
                </div>

                {/* 통계 배지 */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                    <div className={`p-4 rounded-2xl flex items-center gap-3 ${isDark ? 'bg-gray-800' : 'bg-rose-50'}`}>
                        <Flame size={20} className="text-orange-500" />
                        <div>
                            <p className="text-xs font-bold text-gray-500">연속 출석</p>
                            <p className="text-xl font-black text-orange-500">{streak}<span className="text-sm ml-0.5">일</span></p>
                        </div>
                    </div>
                    <div className={`p-4 rounded-2xl flex items-center gap-3 ${isDark ? 'bg-gray-800' : 'bg-blue-50'}`}>
                        <Sparkles size={20} className="text-blue-500" />
                        <div>
                            <p className="text-xs font-bold text-gray-500">이번 달 출석</p>
                            <p className="text-xl font-black text-blue-500">{thisMonthCount}<span className="text-sm ml-0.5">일</span></p>
                        </div>
                    </div>
                </div>

                {/* 출석 버튼 */}
                {isCurrentMonth && (
                    <button
                        onClick={handleCheckIn}
                        disabled={todayChecked || isChecking}
                        className={`w-full py-5 rounded-[24px] font-black text-lg transition-all ${
                            todayChecked
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                : 'bg-gradient-to-r from-[#f82b60] to-pink-400 text-white shadow-xl shadow-rose-200 hover:brightness-110 active:scale-[0.98]'
                        }`}
                    >
                        {todayChecked
                            ? '✅ 오늘 출석 완료!'
                            : isChecking ? '출석 중...' : '📅 오늘 출석하기 +3P'}
                    </button>
                )}
            </div>

            {/* 달력 카드 */}
            <div className={`p-5 md:p-8 rounded-[32px] border shadow-sm ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'}`}>
                {/* 달력 헤더 */}
                <div className="flex items-center justify-between mb-6">
                    <button
                        onClick={goPrev}
                        className={`p-2.5 rounded-xl transition-colors ${isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <span className="font-black text-lg">
                        {viewYear}년 {viewMonth + 1}월
                    </span>
                    <button
                        onClick={goNext}
                        disabled={isCurrentMonth}
                        className={`p-2.5 rounded-xl transition-colors disabled:opacity-30 ${isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}
                    >
                        <ChevronRight size={20} />
                    </button>
                </div>

                {/* 요일 헤더 */}
                <div className="grid grid-cols-7 mb-2">
                    {['일', '월', '화', '수', '목', '금', '토'].map((d, i) => (
                        <div
                            key={d}
                            className={`text-center text-[11px] font-black py-1 ${
                                i === 0 ? 'text-rose-400' : i === 6 ? 'text-blue-400' : 'text-gray-400'
                            }`}
                        >
                            {d}
                        </div>
                    ))}
                </div>

                {/* 날짜 그리드 */}
                {isLoading ? (
                    <div className="flex items-center justify-center py-16">
                        <div className="w-8 h-8 border-4 border-rose-200 border-t-[#f82b60] rounded-full animate-spin" />
                    </div>
                ) : (
                    <div className="space-y-1">
                        {matrix.map((week, wi) => (
                            <div key={wi} className="grid grid-cols-7">
                                {week.map((day, di) => {
                                    if (!day) return <div key={di} />;
                                    const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                                    const isToday = dateStr === todayStr;
                                    const isAttended = attendedDates.has(dateStr);
                                    const isFuture = new Date(dateStr) > today;

                                    return (
                                        <div
                                            key={di}
                                            className={`relative flex flex-col items-center justify-center aspect-square rounded-xl mx-0.5 my-0.5 transition-all text-sm font-black
                                                ${isAttended ? 'bg-rose-500 text-white shadow-md shadow-rose-200' : ''}
                                                ${isToday && !isAttended ? 'ring-2 ring-[#f82b60] ring-offset-1' : ''}
                                                ${isFuture ? 'opacity-30' : ''}
                                                ${di === 0 && !isAttended ? 'text-rose-400' : ''}
                                                ${di === 6 && !isAttended ? 'text-blue-400' : ''}
                                            `}
                                        >
                                            {isAttended ? (
                                                <CheckCircle2 size={18} className="text-white" strokeWidth={2.5} />
                                            ) : (
                                                <span>{day}</span>
                                            )}
                                            {isToday && !isAttended && (
                                                <div className="absolute bottom-1 w-1 h-1 rounded-full bg-[#f82b60]" />
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        ))}
                    </div>
                )}

                {/* 범례 */}
                <div className="flex items-center gap-4 mt-5 pt-4 border-t border-gray-100 dark:border-gray-800">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-gray-400">
                        <div className="w-4 h-4 rounded-md bg-rose-500 flex items-center justify-center">
                            <CheckCircle2 size={10} className="text-white" />
                        </div>
                        출석 완료
                    </div>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-gray-400">
                        <div className="w-4 h-4 rounded-md border-2 border-[#f82b60]" />
                        오늘
                    </div>
                </div>
            </div>
        </div>
    );
}
