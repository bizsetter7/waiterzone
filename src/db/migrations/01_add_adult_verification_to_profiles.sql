-- profiles 테이블에 성인인증 및 회원 정보 컬럼 추가
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_adult_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS nickname TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS birth_date DATE;

-- RLS 정책 업데이트 (본인 프로필은 본인이 수정 가능하도록)
CREATE POLICY "Users can update own profile" ON profiles 
FOR UPDATE USING (auth.uid() = id);
