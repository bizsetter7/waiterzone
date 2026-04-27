import React, { useMemo } from 'react';
import { ICONS } from '@/constants/job-options';

interface IconBadgeProps {
    iconId?: number | string | null;
    className?: string; // 추가적인 클래스 (크기 조절 등)
    showName?: boolean;  // 아이콘 이름도 같이 보여줄지 여부 (상세 모달용)
    textOnly?: boolean;  // 텍스트만 배지형으로 표시 (모바일 카드용)
}

/**
 * 🎨 IconBadge
 * 공고 제목 좌측 또는 상세 모달에서 사용되는 표준 아이콘 렌더링 컴포넌트
 */
export const IconBadge: React.FC<IconBadgeProps> = ({ iconId, className = "text-[12px]", showName = false, textOnly = false }) => {
    // [Refactor] Direct lookup to avoid circular dependency via shopUtils
    // shopUtils -> job-options -> ICONS -> IconBadge (if imported)
    // Now: IconBadge -> job-options -> ICONS (cleaner)
    const iconObj = useMemo(() => {
        if (!iconId) return null;
        // 1순위: ID 매칭 (정상 저장된 경우: options.icon = 9)
        const byId = ICONS.find(icon => String(icon.id) === String(iconId));
        if (byId) return byId;
        // 2순위: 이모지 문자 직접 매칭 (레거시: options.icon = "⚡")
        const byChar = ICONS.find(icon => icon.icon === String(iconId));
        if (byChar) return byChar;
        // 3순위: 유효한 이모지/문자열이면 임시 객체로 직접 렌더링
        const strId = String(iconId);
        if (strId && strId !== 'null' && strId !== 'undefined' && strId !== '0' && isNaN(Number(strId))) {
            return { id: strId, name: strId, icon: strId };
        }
        return null;
    }, [iconId]);

    if (!iconObj) return null;

    // [New] Custom Badge for 'NEW' (Red background, White text)
    if (iconObj.icon === 'NEW') {
        // textOnly 모드에서도 일관된 디자인 적용 (단, showName일 때는 별도 처리)
        const baseStyle = "inline-flex items-center justify-center px-1.5 h-[18px] bg-red-600 text-white text-[9px] font-black rounded-[6px] tracking-tighter shrink-0 align-middle shadow-sm animate-seesaw";

        if (showName) {
            return (
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-red-50 text-red-600 rounded-xl border border-red-100 shadow-sm shrink-0">
                    <span className="text-[10px] font-black bg-red-600 text-white px-1 h-[14px] flex items-center rounded-[4px] animate-seesaw">NEW</span>
                    <span className="text-[10px] font-black uppercase tracking-tight">{iconObj.name}</span>
                </div>
            );
        }

        // Default & TextOnly (Use custom badge style)
        return (
            <span className={`${className} ${baseStyle}`}>
                NEW
            </span>
        );
    }

    if (textOnly) {
        return (
            <span className="inline-flex items-center justify-center px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded-[4px] border border-blue-100 text-[10px] font-black tracking-tighter shrink-0 align-middle mr-1 h-[18px]">
                {iconObj.name}
            </span>
        );
    }

    if (showName) {
        return (
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-600 rounded-xl border border-blue-100 shadow-sm shrink-0">
                <span className="text-lg animate-seesaw inline-block origin-bottom">{iconObj.icon}</span>
                <span className="text-[10px] font-black uppercase tracking-tight">{iconObj.name}</span>
            </div>
        );
    }

    return (
        // [Fix] color:'initial' — 부모(h4)에 rainbow 형광펜(color:transparent) 적용 시 이모지가 투명해지는 문제 방지
        <span className={`${className} shrink-0 align-middle animate-seesaw`} style={{ color: 'initial' }}>
            {iconObj.icon}
        </span>
    );
};
