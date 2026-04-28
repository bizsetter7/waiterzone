import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, User, ChevronRight } from 'lucide-react';
import { useBrand } from '@/components/BrandProvider';
import { INDUSTRY_DATA, REGION_DATA, PAY_TYPES } from '../constants';
import { supabase } from '@/lib/supabase';
import { updatePoints } from '@/lib/points';

/** Supabase 세션 토큰을 가져와 Authorization 헤더 반환 */
async function getAuthHeaders(): Promise<Record<string, string>> {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
            return {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.access_token}`,
            };
        }
    } catch { /* ignore */ }
    return { 'Content-Type': 'application/json' };
}

export const ResumeForm = ({ setView, onOpenMenu, authUser, editData }: { setView: (v: any) => void, onOpenMenu?: () => void, authUser: any, editData?: any }) => {
    const brand = useBrand();
    const router = useRouter();

    // User Info State — 닉네임은 읽기 전용 (내 정보수정에서 변경)
    const [userName, setUserName] = useState(editData?.nickname || authUser?.nickname || authUser?.name || '회원님');
    const [userId, setUserId] = useState(authUser?.id || '');
    // 프로필 사진 — localStorage 'personal_profile_image' 연동
    const [profileImage, setProfileImage] = useState<string | null>(() => {
        if (typeof window !== 'undefined') return localStorage.getItem('personal_profile_image');
        return null;
    });

    // Form States
    const [title, setTitle] = useState(editData?.title || '');
    const [content, setContent] = useState(editData?.content || '');
    const [payAmount, setPayAmount] = useState(editData?.pay_amount ? Number(editData.pay_amount).toLocaleString() : '0');
    const [selectedIndustryMain, setSelectedIndustryMain] = useState(editData?.industry_main || '');
    const [selectedIndustrySub, setSelectedIndustrySub] = useState(editData?.industry_sub || '');
    const [selectedRegionMain, setSelectedRegionMain] = useState(editData?.region_main || '');
    const [selectedRegionSub, setSelectedRegionSub] = useState(editData?.region_sub || '');
    const [payType, setPayType] = useState(editData?.pay_type || '시급');
    const [gender, setGender] = useState(editData?.gender || '남성');
    const [birthYear, setBirthYear] = useState(editData?.birth_date?.split('-')[0] || '2000');
    const [birthMonth, setBirthMonth] = useState(editData?.birth_date?.split('-')[1]?.replace(/^0/, '') || '1');
    const [birthDay, setBirthDay] = useState(editData?.birth_date?.split('-')[2]?.replace(/^0/, '') || '1');

    // Contact State
    const [contactMethod, setContactMethod] = useState(editData?.contact_method || '');
    const [contactValue, setContactValue] = useState(editData?.contact_value || '');

    useEffect(() => {
        if (authUser) {
            setUserId(authUser.id);
            // 닉네임은 항상 authUser에서 가져옴 (직접 수정 불가)
            setUserName(authUser.nickname || authUser.name || '회원님');
        }
    }, [authUser]);

    // 프로필 이미지 업데이트 이벤트 수신 (사이드바에서 변경 시 동기화)
    useEffect(() => {
        const handler = () => {
            const saved = localStorage.getItem('personal_profile_image');
            setProfileImage(saved || null);
        };
        window.addEventListener('profile-image-updated', handler);
        return () => window.removeEventListener('profile-image-updated', handler);
    }, []);

    const handleSaveResume = async () => {
        if (!title.trim()) { alert('이력서 제목을 입력해주세요.'); return; }
        if (!selectedIndustryMain || !selectedIndustrySub) { alert('희망 분야를 선택해주세요.'); return; }
        if (!selectedRegionMain || !selectedRegionSub) { alert('희망 지역을 선택해주세요.'); return; }
        if (!content.trim()) { alert('자기소개를 입력해주세요.'); return; }

        const resumeData: any = {
            id: editData?.id || `mock_${Date.now()}`,
            user_id: userId,
            title,
            content,
            gender,
            birth_date: `${birthYear}-${birthMonth.padStart(2, '0')}-${birthDay.padStart(2, '0')}`,
            industry_main: selectedIndustryMain,
            industry_sub: selectedIndustrySub,
            region_main: selectedRegionMain,
            region_sub: selectedRegionSub,
            pay_type: payType,
            pay_amount: parseInt(payAmount.replace(/,/g, ''), 10) || 0,
            contact_method: contactMethod,
            contact_value: contactValue
        };

        if (!editData) {
            resumeData.created_at = new Date().toISOString();
        }

        try {
            let error: any = null;
            const isGuestOrMock = userId === 'guest' || (editData?.id && String(editData.id).startsWith('mock_'));

            if (!isGuestOrMock) {
                // 서버 API 통해 저장 (RLS 우회) — Bearer 토큰 포함
                const authHeaders = await getAuthHeaders();
                const res = await fetch('/api/resumes/save', {
                    method: 'POST',
                    headers: authHeaders,
                    body: JSON.stringify({
                        action: editData?.id ? 'update' : 'insert',
                        resumeData,
                        resumeId: editData?.id,
                    }),
                });
                const result = await res.json();
                if (!res.ok || !result.success) {
                    error = { message: result.error || '서버 오류', code: 'API_ERROR' };
                }
            } else {
                // 게스트/목업 → 로컬 스토리지 폴백
                error = { message: 'guest_mode', code: 'GUEST' };
            }

            if (error) {
                console.error("Resume Save Error:", error.message, error.code);
                const isGuestMode = error.message === 'guest_mode';

                if (isGuestMode || isGuestOrMock) {
                    // 로컬 스토리지 업데이트
                    const existingResumes = JSON.parse(localStorage.getItem('coco_mock_resumes') || '[]');
                    const targetId = editData?.id;
                    const targetCreatedAt = editData?.created_at;

                    if (targetCreatedAt || targetId) {
                        const idx = existingResumes.findIndex((r: any) =>
                            (targetCreatedAt && String(r.created_at) === String(targetCreatedAt)) ||
                            (targetId && String(r.id) === String(targetId)) ||
                            (targetId && String(r.created_at) === String(targetId))
                        );
                        if (idx !== -1) {
                            existingResumes[idx] = { ...existingResumes[idx], ...resumeData };
                        } else {
                            existingResumes.unshift(resumeData);
                        }
                    } else {
                        existingResumes.unshift(resumeData);
                    }
                    localStorage.setItem('coco_mock_resumes', JSON.stringify(existingResumes));
                    alert('이력서 수정이 완료되었습니다!');
                    setView('dashboard');
                    window.dispatchEvent(new CustomEvent('resume-updated'));
                    return;
                }
                alert('저장 중 오류가 발생했습니다: ' + error.message);
                return;
            }

            // [Gamification] Award points for FIRST-TIME resume registration
            if (!editData && !isGuestOrMock) {
                try {
                    // Check if this is truly the first resume for this user
                    const { count } = await supabase
                        .from('resumes')
                        .select('*', { count: 'exact', head: true })
                        .eq('user_id', userId);
                    
                    // If count is 1 (the one we just inserted), award points
                    if (count === 1) {
                        await updatePoints(userId, 'RESUME_UPLOAD');
                    }
                } catch (e) {
                    console.error("Failed to award points:", e);
                }
            }

            alert(editData ? '이력서 수정이 완료되었습니다!' : '이력서 등록이 완료되었습니다!');
            setView('dashboard');
            window.dispatchEvent(new CustomEvent('resume-updated'));
        } catch (err) {
            console.error("Critical Save Error:", err);
            alert('오류가 발생했습니다.');
        }
    };

    const handleContactMethodChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const method = e.target.value;
        setContactMethod(method);
        if (method === 'phone') {
            setContactValue('010-0000-0000');
        } else if (method === 'site_msg') {
            setContactValue('site_msg');
        } else {
            setContactValue('');
        }
    };

    const handlePayAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/[^0-9]/g, '');
        if (value) {
            setPayAmount(Number(value).toLocaleString());
        } else {
            setPayAmount('');
        }
    };

    return (
        <div className={`space-y-6 animate-in fade-in slide-in-from-right-4 duration-500 pb-20`}>

            {/* Warning Banner */}
            <div
                onClick={() => router.push('/customer-center?tab=notice')}
                className="w-full bg-red-50 border border-red-100 rounded-2xl p-4 flex items-center justify-between cursor-pointer hover:bg-red-100/50 transition group"
            >
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm text-red-500 border border-red-100 shrink-0">
                        <AlertTriangle size={20} fill="currentColor" strokeWidth={0} />
                    </div>
                    <div>
                        <div className="text-[10px] font-bold text-gray-500 leading-none mb-1">이력서 등록 시</div>
                        <div className="text-sm font-black text-red-500 tracking-tight whitespace-nowrap">구직자 주의사항!</div>
                    </div>
                </div>
                <div className="text-[11px] font-bold text-gray-400 flex items-center gap-1 text-right leading-tight group-hover:text-red-500 transition">
                    자세히 <br /> 보기 <ChevronRight size={14} />
                </div>
            </div>

            <header
                className="flex flex-col gap-4 mb-4"
            >
                <div className={`p-6 sm:rounded-[32px] shadow-sm border relative mt-0 ${brand.theme === 'dark' ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'} `}>
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <h2 className={`text-xl md:text-2xl font-black flex items-center gap-3 ${brand.theme === 'dark' ? 'text-white' : 'text-gray-950'}`}>
                            <span className="w-2 h-8 bg-blue-500 rounded-full hidden md:block"></span>
                            이력서 등록
                        </h2>
                        <div className="text-xs font-bold text-gray-400">MY PERSONAL HISTORY</div>
                    </div>
                </div>
            </header>

            <div className={`p-6 rounded-[32px] border shadow-sm ${brand.theme === 'dark' ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'}`}>
                <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-100 dark:border-gray-800">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1">
                        <h2 className={`text-xl font-black whitespace-nowrap ${brand.theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                            나의 이력서 등록
                        </h2>
                        <div className="text-[10px] sm:text-xs font-bold text-gray-400 whitespace-nowrap">MY PERSONAL HISTORY</div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-8 mb-8">
                    {/* Photo Area — 마이페이지에서 업로드한 프로필 사진 반영 */}
                    <div className="md:col-span-3 flex flex-col items-center sm:items-stretch gap-2">
                        <div className="w-28 sm:w-full aspect-square sm:aspect-[3/4] rounded-lg border-2 border-dashed flex items-center justify-center bg-gray-50 text-gray-300 overflow-hidden">
                            {profileImage ? (
                                <img src={profileImage} alt="프로필 사진" className="w-full h-full object-cover" />
                            ) : (
                                <User size={32} className="opacity-20" />
                            )}
                        </div>
                        <p className="text-[10px] text-gray-400 text-center leading-tight">
                            마이페이지 &gt; 사진 등록/수정에서<br/>변경할 수 있습니다.
                        </p>
                    </div>

                    {/* Basic Info Fields */}
                    <div className="md:col-span-9 space-y-4">
                        <div className="flex flex-col sm:grid sm:grid-cols-12 items-start sm:items-center gap-1 sm:gap-0">
                            <label className="sm:col-span-3 text-xs font-bold text-gray-500">아이디</label>
                            <div className="sm:col-span-9 text-sm font-bold truncate w-full">{authUser?.username || authUser?.email?.replace('@waiterzone.kr', '') || authUser?.nickname || 'guest'}</div>
                        </div>
                        <div className="flex flex-col sm:grid sm:grid-cols-12 items-start sm:items-center gap-1 sm:gap-0">
                            <label className="sm:col-span-3 text-xs font-bold text-gray-500">이름(닉네임)</label>
                            <div className="sm:col-span-9 flex items-center gap-2 w-full">
                                <div className={`flex-1 border rounded p-1.5 text-xs font-bold min-w-0 ${brand.theme === 'dark' ? 'bg-gray-800 border-gray-700 text-gray-300' : 'bg-gray-50 border-gray-200 text-gray-700'}`}>
                                    {userName}
                                </div>
                                <span className="text-[10px] text-gray-400 whitespace-nowrap shrink-0">내 정보수정에서 변경</span>
                            </div>
                        </div>
                        <div className="flex flex-col sm:grid sm:grid-cols-12 items-start sm:items-center gap-1 sm:gap-0">
                            <label className="sm:col-span-3 text-xs font-bold text-gray-500">성별/생년월일 <span className="text-red-500">*</span></label>
                            <div className="sm:col-span-9 flex flex-wrap gap-2 items-center w-full">
                                <select value={gender} onChange={(e) => setGender(e.target.value)} className="border border-gray-300 rounded p-1.5 text-xs font-bold bg-white text-gray-700 outline-none flex-shrink-0">
                                    <option>남성</option>
                                    <option>여성</option>
                                </select>
                                <div className="flex items-center gap-1 flex-1 min-w-[200px]">
                                    <input type="number" value={birthYear} onChange={(e) => setBirthYear(e.target.value)} className="w-[60px] border border-gray-300 rounded p-1.5 text-xs text-center outline-none" /> <span className="text-xs">년</span>
                                    <input type="number" value={birthMonth} onChange={(e) => setBirthMonth(e.target.value)} className="w-[45px] border border-gray-300 rounded p-1.5 text-xs text-center outline-none" /> <span className="text-xs">월</span>
                                    <input type="number" value={birthDay} onChange={(e) => setBirthDay(e.target.value)} className="w-[45px] border border-gray-300 rounded p-1.5 text-xs text-center outline-none" /> <span className="text-xs">일</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-col sm:grid sm:grid-cols-12 items-start sm:items-center gap-1 sm:gap-0">
                            <label className="sm:col-span-3 text-xs font-bold text-gray-500">연락방법 <span className="text-red-500">*</span></label>
                            <div className="sm:col-span-9 space-y-2 w-full">
                                <select
                                    value={contactMethod}
                                    onChange={handleContactMethodChange}
                                    className="w-full border border-gray-300 rounded p-1.5 text-xs font-bold bg-white text-gray-700 outline-none"
                                >
                                    <option value="">연락방법 선택</option>
                                    <option value="phone">휴대폰 (안심번호)</option>
                                    <option value="kakao">카카오톡</option>
                                    <option value="line">라인</option>
                                    <option value="telegram">텔레그램</option>
                                    <option value="site_msg">사이트 메세지</option>
                                </select>

                                {contactMethod === 'phone' && (
                                    <>
                                        <input type="text" value={contactValue} readOnly className="w-full bg-gray-100 border border-gray-300 rounded p-1.5 text-[11px] text-gray-500 font-bold outline-none" />
                                        <p className="text-[10px] text-blue-500 leading-tight">* 안심번호를 선택하면 입력하신 전화번호는 노출되지 않습니다.</p>
                                    </>
                                )}

                                {['kakao', 'line', 'telegram'].includes(contactMethod) && (
                                    <input
                                        type="text"
                                        value={contactValue}
                                        onChange={(e) => setContactValue(e.target.value)}
                                        placeholder={`${contactMethod === 'kakao' ? '카카오톡' : contactMethod === 'line' ? '라인' : '텔레그램'} ID를 입력해주세요`}
                                        className={`w-full border rounded p-1.5 text-[11px] font-bold outline-none focus:border-blue-500 ${brand.theme === 'dark' ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                                    />
                                )}

                                {contactMethod === 'site_msg' && (
                                    <div className="w-full bg-gray-50 border border-gray-200 rounded p-2 text-[10px] text-gray-500 text-center font-bold">
                                        구직자에게 사이트 내 쪽지로 연락을 받습니다. <br /> (연락처 비공개)
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="border-t border-dashed border-gray-200 my-6"></div>

                <div className="space-y-6">
                    <div>
                        <label className="block text-xs font-black mb-2 flex items-center gap-1"><span className="w-1.5 h-3 bg-red-400 rounded-full"></span> 이력서 제목 <span className="text-red-500">*</span></label>
                        <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="제목을 입력하세요" className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm font-bold outline-none focus:border-blue-500" />
                    </div>
                    <div>
                        <label className="block text-xs font-black mb-2 flex items-center gap-1"><span className="w-1.5 h-3 bg-blue-400 rounded-full"></span> 희망 급여</label>
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                            <select
                                value={payType}
                                onChange={(e) => setPayType(e.target.value)}
                                className="border border-gray-300 rounded-lg p-2.5 text-xs font-bold bg-white text-gray-700 outline-none flex-shrink-0"
                            >
                                {PAY_TYPES.map(type => (
                                    <option key={type} value={type}>{type}</option>
                                ))}
                            </select>
                            <div className="relative flex-1">
                                <input
                                    type="text"
                                    value={payAmount}
                                    onChange={handlePayAmountChange}
                                    className="w-full bg-white border border-gray-200 rounded-lg p-2.5 pr-8 text-sm font-bold outline-none focus:border-blue-500"
                                    placeholder="금액 입력"
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">원</span>
                            </div>
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-black mb-2 flex items-center gap-1"><span className="w-1.5 h-3 bg-purple-400 rounded-full"></span> 희망 분야 <span className="text-red-500">*</span></label>
                        <div className="flex gap-2">
                            <select
                                value={selectedIndustryMain}
                                onChange={(e) => {
                                    setSelectedIndustryMain(e.target.value);
                                    setSelectedIndustrySub('');
                                }}
                                className="w-full border border-gray-300 rounded p-2 text-xs font-bold bg-white text-gray-700 outline-none"
                            >
                                <option value="">1차 업종 선택</option>
                                {Object.keys(INDUSTRY_DATA).map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                            <select
                                value={selectedIndustrySub}
                                onChange={(e) => setSelectedIndustrySub(e.target.value)}
                                className="w-full border border-gray-300 rounded p-2 text-xs font-bold bg-white text-gray-700 outline-none"
                                disabled={!selectedIndustryMain}
                            >
                                <option value="">2차 업종 선택</option>
                                {selectedIndustryMain && INDUSTRY_DATA[selectedIndustryMain]?.map(sub => (
                                    <option key={sub} value={sub}>{sub}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-black mb-2 flex items-center gap-1"><span className="w-1.5 h-3 bg-green-400 rounded-full"></span> 업무 가능 지역 <span className="text-red-500">*</span></label>
                        <div className="flex gap-2">
                            <select
                                value={selectedRegionMain}
                                onChange={(e) => {
                                    setSelectedRegionMain(e.target.value);
                                    setSelectedRegionSub('');
                                }}
                                className="w-full border border-gray-300 rounded p-2 text-xs font-bold bg-white text-gray-700 outline-none"
                            >
                                <option value="">지역 선택</option>
                                {Object.keys(REGION_DATA).map(region => (
                                    <option key={region} value={region}>{region}</option>
                                ))}
                            </select>
                            <select
                                value={selectedRegionSub}
                                onChange={(e) => setSelectedRegionSub(e.target.value)}
                                className="w-full border border-gray-300 rounded p-2 text-xs font-bold bg-white text-gray-700 outline-none"
                                disabled={!selectedRegionMain}
                            >
                                <option value="">세부 지역 선택</option>
                                {selectedRegionMain && REGION_DATA[selectedRegionMain]?.map(sub => (
                                    <option key={sub} value={sub}>{sub}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-black mb-2 flex items-center gap-1"><span className="w-1.5 h-3 bg-orange-400 rounded-full"></span> 자기소개 <span className="text-red-500">*</span></label>
                        <textarea value={content} onChange={(e) => setContent(e.target.value)} className="w-full h-48 bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm font-bold outline-none focus:border-blue-500 resize-none" placeholder="내용을 입력하세요"></textarea>
                    </div>
                </div>

                {/* Form Actions */}
                <div className="mt-8 flex justify-center gap-3">
                    <button onClick={() => setView('dashboard')} className="px-6 py-3 rounded-xl bg-gray-100 text-gray-500 font-bold hover:bg-gray-200 transition whitespace-nowrap shrink-0">취소</button>
                    <button onClick={handleSaveResume} className="px-8 py-3 rounded-xl bg-[#1e3a5f] text-white font-black hover:bg-[#162d4a] transition shadow-lg active:scale-95 whitespace-nowrap">이력서 등록완료</button>
                </div>
            </div>
        </div>
    );
};
