export const JOB_CATEGORY_MAP: Record<string, string[]> = {
    '룸웨이터': ['퍼블릭', '가라오케', '클럽', '룸싸롱'],
    '노래주점': ['웨이터', '미씨', 'TC'],
    '텐프로/쩜오': ['텐프로', '쩜오', '텐카페'],
    '요정': ['요정'],
    '바(Bar)': ['정바', '룸바', '토킹바', '섹시바', '라이브바'],
    '엔터': ['인터넷BJ'],
    '다방': ['다방'],
    '카페': ['카페'],
    '마사지': ['휴게마사지', '아로마마사지', '피부마사지', '에스테틱', '스포츠마사지', '기타마사지'],
    '기타': ['기타업종', '직업소개소', '회원제업소', '해외'],
};

export const JOB_CATEGORIES = Object.keys(JOB_CATEGORY_MAP);
export const ALL_JOB_TYPES = Object.values(JOB_CATEGORY_MAP).flat();
