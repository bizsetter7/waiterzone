# P9 웨이터존 (waiterzone) CLAUDE.md
> 최종 업데이트: 2026-04-28 | 작성자: 코부장

---

## 1. 프로젝트 개요

| 항목 | 내용 |
|------|------|
| 도메인 | https://www.waiterzone.kr |
| Vercel 프로젝트 | sunsujone (choco org) |
| GitHub | https://github.com/bizsetter7/waiterzone |
| Supabase | P2와 공유 (ronqwailyistjuyolmyh) |
| 브랜드 컬러 | #1e3a5f (다크 블루) |
| 타겟 | 남성 웨이터 알바 구직자 |

---

## 2. 기술 스택

- Next.js 15 (App Router)
- TypeScript (strict)
- Tailwind CSS
- Supabase (공유 DB — P2/P9/P10 동일)
- Vercel (배포)

---

## 3. 라우팅 구조 (핵심 — 절대 변경 금지)

```
/                     → 홈 (HomePortalClient.tsx)
/coco/[region]        → 지역 SEO 랜딩 페이지
/coco/[region]/[id]   → 광고 상세
/jobs                 → 구인 목록
/jobs/[id]            → 구인 상세
/region               → 지역 목록
/community            → 커뮤니티
/go/[slug]            → 단축 URL 리다이렉트
/admin/*              → 관리자 (어드민 이메일 체크)
```

**⚠️ 주의**: Footer/page.tsx의 링크는 반드시 `/coco/` 경로 사용. `/waiter/` 경로는 존재하지 않음!

---

## 4. P2 코코알바와의 차이점

| 구분 | P2 코코알바 | P9 웨이터존 |
|------|------------|------------|
| 도메인 | cocoalba.kr | waiterzone.kr |
| 브랜드 컬러 | 핑크 | 다크 블루 |
| 타겟 | 여성알바 (유흥) | 남성 웨이터 |
| DB | 공유 | 공유 (같은 Supabase) |
| shops.json | 실제 광고 데이터 | 빈 배열 `[]` (DB에서 로드) |

---

## 5. 절대 원칙 (MUST NOT)

1. **`next.config.ts`에 `ignoreBuildErrors: true` 절대 금지** — Antigravity 위반 이력 있음
2. **`middleware.ts`에 어드민 리다이렉트 추가 금지** — Vercel 무한루프 원인
3. **파일 전체 덮어쓰기 금지** — Edit 핀셋 수정만
4. **shops.json에 P2 광고데이터 절대 복사 금지** — `[]` 유지
5. **`/waiter/` 경로 링크 금지** — 존재하지 않는 라우트, `/coco/` 사용

---

## ⚡ 점프(JUMP) 시스템 정책 (M-060, 2026-05-02 확정 — 절대 일반화 금지)

| 플랜 | 즉시 무료 점프 | 매일 +1 자동 적립 | 자동 점프 (cron set/일) |
|------|------------|----------------|--------------------|
| 베이직 | - | - | - |
| 스탠다드 | - | - | - |
| 스페셜 | 10회 | - | 3회/일 |
| 디럭스 | 30회 | - | 6회/일 |
| **프리미엄** | **30회** | **+1회/일** | **8회/일** |

- **⚠️ 매일 +1 자동 적립은 프리미엄 한정** — 다른 플랜에 적용된다고 표기 절대 금지 (M-060)
- AuthProvider 표시: `user_jumps.subscription_balance` 단독 (package/auto 합산 금지)
- Cron 시간: `"0 15 * * *"` (UTC 15:00 = KST 00:00 자정) — `"0 0"`은 KST 09:00 (오답)
- 30일 단위 reset: 결제일 기준, subscription_balance를 즉시 무료 점프 값으로 reset
- 상세: `memory/jump_system_policy.md` (전사 마스터)

---

## 6. 배포 체크리스트

- [ ] `npx tsc --noEmit` → 에러 0개 확인
- [ ] `npm run build` → Exit code 0 확인
- [ ] Git push → Vercel 자동 배포 (~2분)
- [ ] www.waiterzone.kr 접속 확인
- [ ] /coco/서울 페이지 확인

---

## 7. Supabase 공유 DB 주의사항

- P2/P9/P10이 같은 Supabase 프로젝트 사용
- P9에서 보이는 광고는 P2 DB의 광고 (공유)
- 새 광고는 P2 어드민 또는 야사장(P5)에서 등록
- community_posts 테이블도 공유

---

## 8. 알려진 이슈 및 TODO

### 완료된 이슈
- [x] TS 빌드 에러 전면 수정 (work-type-guide.ts, Route exports, params Promise 등)
- [x] shops.json 초기화 (P2 광고 데이터 제거)
- [x] COCOALBA 브랜딩 잔재 제거
- [x] /waiter/ → /coco/ 라우팅 수정
- [x] Shadow_SEO_Master.json "(COCOALBA)" 제거

### 미완료 TODO
- [ ] 독립 Supabase 프로젝트 분리 (장기 계획 — 현재 공유)
- [ ] Supabase OAuth redirect URL: waiterzone.kr 등록 필요
- [ ] 트위터/X API 환경변수 설정 (TWITTER_API_KEY 등)
- [ ] IndexNow API 키 등록

---

## 9. 환경변수 (Vercel에 설정 필요)

```
NEXT_PUBLIC_SUPABASE_URL=       (P2와 공유)
NEXT_PUBLIC_SUPABASE_ANON_KEY=  (P2와 공유)
SUPABASE_SERVICE_ROLE_KEY=      (P2와 공유)
CRON_SECRET=                    (크론 보안키)
NEXT_PUBLIC_SITE_NAME=웨이터존
NEXT_PUBLIC_SITE_URL=https://www.waiterzone.kr
```

---

## 10. 코드다이어트 분석 결과 (2026-04-28)

### 수정 완료
- `Shadow_SEO_Master.json`: "웨이터존 (COCOALBA)" → "웨이터존"
- `Footer.tsx`: POPULAR_REGIONS 링크 /waiter/ → /coco/
- `page.tsx`: 내부 링크 /waiter/ → /coco/
- `TabPolicies.tsx`: waiterzone.co.kr → www.waiterzone.kr

### 안전하게 남겨둔 것 (의도적)
- `초코아이디어` 사업자 정보 (Footer, Policy): 실제 운영사 맞음 → 유지
- `/src/app/admin/*`: 관리자 기능 필요 → 유지
- Twitter/SNS 크론: 환경변수 없으면 503 반환 → 안전하게 유지
- P2 코드 구조 공유: 브랜드별 분기 처리 정상 동작

### 추가 검토 필요
- `/api/cron/band-post/route.ts`: URL 하드코딩 여부 확인
- `/api/cron/indexnow/route.ts`: waiterzone.kr URL 확인
