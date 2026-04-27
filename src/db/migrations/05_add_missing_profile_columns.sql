-- Migration: 05_add_missing_profile_columns.sql
-- 회원 관리에 필요한 profiles 누락 컬럼 일괄 추가
-- Run in Supabase SQL Editor

-- role 동기화: 라이브 DB 트리거가 user_type만 쓰는 경우 role도 동일값으로 보정
-- (이미 user_type=corporate인데 role=individual인 기존 회원 일괄 보정)
UPDATE public.profiles
SET role = user_type
WHERE user_type IS NOT NULL
  AND user_type != ''
  AND (role IS NULL OR role = 'individual')
  AND user_type != 'individual';

-- username 비어있는 기존 회원 보정 (auth.users 이메일 앞부분으로 복구)
UPDATE public.profiles p
SET username = split_part(u.email, '@', 1)
FROM auth.users u
WHERE p.id = u.id
  AND (p.username IS NULL OR p.username = '');

-- 앞으로 가입 시 role/user_type 동기화 보장을 위해 role도 user_type 값으로 기본값 설정
-- (트리거가 없어도 일관성 유지)

-- 개인정보 컬럼
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS gender TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS contact_email TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS address TEXT;

-- 탈퇴 처리 컬럼
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_withdrawn BOOLEAN DEFAULT FALSE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS withdrawn_at TIMESTAMPTZ DEFAULT NULL;

-- 본인인증 CI (중복가입 방지용, 인덱스 추가)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS identity_ci TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_identity_ci ON public.profiles(identity_ci) WHERE identity_ci IS NOT NULL;

-- 잔액 관련 컬럼 (AuthProvider credit_balance, jump_balance 조회 대응)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS credit_balance INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS jump_balance INTEGER DEFAULT 0;

-- 성인인증 완료된 사용자 표시 (기존 migration 01과 IF NOT EXISTS로 안전 병행)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_adult_verified BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN public.profiles.phone IS '개인 연락처';
COMMENT ON COLUMN public.profiles.gender IS '성별 (M/F/U)';
COMMENT ON COLUMN public.profiles.contact_email IS '연락용 이메일';
COMMENT ON COLUMN public.profiles.is_withdrawn IS '탈퇴 여부';
COMMENT ON COLUMN public.profiles.withdrawn_at IS '탈퇴 처리 일시';
COMMENT ON COLUMN public.profiles.identity_ci IS '본인인증 CI (중복가입 방지)';
COMMENT ON COLUMN public.profiles.credit_balance IS '크레딧 잔액';
COMMENT ON COLUMN public.profiles.jump_balance IS '점프 잔액';
