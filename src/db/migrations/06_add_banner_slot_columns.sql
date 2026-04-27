-- ============================================================
-- Migration 06: 배너 슬롯 컬럼 추가
-- 대상 테이블: public.shops
-- 작성일: 2026-04-10
-- 목적:
--   - 그랜드/프리미엄: 좌우 사이드배너 슬롯 지정
--   - 디럭스/스페셜: 업종별/지역별 내부 사이드바 슬롯 지정
--   - 업체 업로드 후 관리자 승인 플로우 지원
--   - GIF/영상 배너 타입 구분
-- ============================================================

-- 1. 배너 슬롯 위치
--    'left'  : 좌측 사이드배너 (그랜드 세트 중 좌측 / 프리미엄 단독)
--    'right' : 우측 사이드배너 (그랜드 세트 중 우측 / 프리미엄 단독)
--    'both'  : 좌+우 동시 (그랜드 세트 전용 — left/right 한번에 배정)
--    'inner' : 업종별/지역별 내부 사이드바 (디럭스/스페셜)
--    NULL    : 배너 슬롯 없음 (광고 목록만 노출)
ALTER TABLE public.shops
  ADD COLUMN IF NOT EXISTS banner_position TEXT DEFAULT NULL;

-- 2. 배너 전용 이미지/영상 URL
--    shops.media_url (카드 목록 썸네일) 과 별도 관리
--    이 URL이 배너 슬롯에 실제 표시됨
ALTER TABLE public.shops
  ADD COLUMN IF NOT EXISTS banner_image_url TEXT DEFAULT NULL;

-- 3. 배너 미디어 타입
--    'image' : 정적 이미지 (JPG/PNG/WebP) — 기본값
--    'gif'   : 애니메이션 GIF
--    'video' : 짧은 영상 (MP4, autoplay loop muted)
ALTER TABLE public.shops
  ADD COLUMN IF NOT EXISTS banner_media_type TEXT DEFAULT 'image';

-- 4. 배너 승인 상태 (업체 업로드 후 관리자 검토용)
--    NULL              : 배너 미신청 상태
--    'pending_banner'  : 업체가 이미지 업로드 후 승인 대기 중
--    'approved'        : 관리자 승인 완료 → 슬롯에 즉시 반영
--    'rejected'        : 관리자 반려
ALTER TABLE public.shops
  ADD COLUMN IF NOT EXISTS banner_status TEXT DEFAULT NULL;

-- 5. 인덱스 — 슬롯 조회 성능 최적화
CREATE INDEX IF NOT EXISTS idx_shops_banner_position
  ON public.shops(banner_position)
  WHERE banner_position IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_shops_banner_status
  ON public.shops(banner_status)
  WHERE banner_status IS NOT NULL;

-- 6. CHECK 제약 (유효한 값만 허용)
ALTER TABLE public.shops
  DROP CONSTRAINT IF EXISTS chk_banner_position;
ALTER TABLE public.shops
  ADD CONSTRAINT chk_banner_position
    CHECK (banner_position IS NULL OR banner_position IN ('left', 'right', 'both', 'inner'));

ALTER TABLE public.shops
  DROP CONSTRAINT IF EXISTS chk_banner_media_type;
ALTER TABLE public.shops
  ADD CONSTRAINT chk_banner_media_type
    CHECK (banner_media_type IN ('image', 'gif', 'video'));

ALTER TABLE public.shops
  DROP CONSTRAINT IF EXISTS chk_banner_status;
ALTER TABLE public.shops
  ADD CONSTRAINT chk_banner_status
    CHECK (banner_status IS NULL OR banner_status IN ('pending_banner', 'approved', 'rejected'));

-- ============================================================
-- 적용 확인 쿼리
-- ============================================================
-- SELECT column_name, data_type, column_default
-- FROM information_schema.columns
-- WHERE table_name = 'shops'
--   AND column_name LIKE 'banner%'
-- ORDER BY column_name;
