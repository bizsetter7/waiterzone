export const isPreRelease = false; // [화이트셀 해제] 실전 PRODUCTION 모드 상시 활성화

export const SERVICE_INFO = {
  TITLE: isPreRelease ? '웨이터존 B2B | 맞춤형 인재 매칭 솔루션' : '웨이터존 | 여성전문 고소득 알바 No.1',
  DESCRIPTION: isPreRelease 
    ? '기업 성공을 위한 최적의 인재 매칭 B2B 솔루션입니다. 검증된 파트너 네트워크를 제공합니다.' 
    : '지역 기반 100% 실명 인증, 가장 확실하고 안전한 고소득 알바 매칭 플랫폼.',
};
