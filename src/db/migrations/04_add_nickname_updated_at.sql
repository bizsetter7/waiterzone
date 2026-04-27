-- Migration: 04_add_nickname_updated_at.sql
-- 닉네임 1일 1회 수정 제한을 위한 컬럼 추가
-- Run in Supabase SQL Editor

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS nickname_updated_at TIMESTAMPTZ DEFAULT NULL;

-- 기존 회원 중 닉네임이 있는 경우 현재 시각으로 초기화하지 않음
-- (처음 적용 시 모든 회원이 즉시 수정 가능해야 하므로 NULL 유지)

COMMENT ON COLUMN public.profiles.nickname_updated_at IS '닉네임 마지막 수정 시각 (1일 1회 제한용)';
