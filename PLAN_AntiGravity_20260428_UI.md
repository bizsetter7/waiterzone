# PLAN_AntiGravity_20260428_UI.md
# P9 웨이터존 — UI 브랜딩 정비 & P2 광고 차단

> 작성: 코부장 | 2026-04-28
> 대상: P9 웨이터존 (`D:\토탈프로젝트\My-site\p9.웨이터존\waiterzone`)
> 브랜드 컬러: `#1e3a5f` (네이비 블루)

---

## 절대 원칙
1. 파일 전체 덮어쓰기 금지 — Edit 핀셋 수정만
2. 완료 선언은 `npm run build` Exit code 0 확인 후
3. 수정 후 반드시 git commit & push

---

## 작업 A — P2 광고 임시 차단 (최우선)

### 문제
`src/app/HomePortalClient.tsx`가 Supabase `shops` 테이블을 platform 필터 없이 전체 쿼리.
P2 코코알바 광고가 웨이터존에 그대로 노출됨.

### 수정 대상
**파일**: `src/app/HomePortalClient.tsx`

현재 코드 (useEffect 내부):
```typescript
const { data, error } = await supabase
  .from('shops')
  .select('*')
  .eq('is_closed', false)
  .order('updated_at', { ascending: false });

setDbShops(!error && data ? data : []);
```

**수정 내용**: platform 컬럼 추가 전까지 빈 배열 고정
```typescript
// [임시] platform 컬럼 추가 전까지 웨이터존 자체 광고 없음 → 빈 상태 표시
// TODO: platform 컬럼 추가 후 .eq('platform', 'waiterzone') 필터 활성화
setDbShops([]);
```

> **주의**: useEffect 내부의 fetchShops 함수 전체를 위 한 줄로 교체하는 게 아니라,
> `fetchShops` 함수 바디에서 Supabase 호출 부분을 `setDbShops([])` 한 줄로 대체할 것.

---

## 작업 B — HeroSection 핑크 gradient → 블루 glow

### 문제
`src/components/home/HeroSection.tsx`:
```
rgba(219,39,119,0.1)  ← P2 코코알바 핑크색 잔재
```

### 수정 대상
**파일**: `src/components/home/HeroSection.tsx`

찾을 코드:
```tsx
<div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(219,39,119,0.1),transparent_70%)]" />
```

수정:
```tsx
<div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(30,58,95,0.25),transparent_70%)]" />
```
> `rgba(30,58,95,0.25)` = 웨이터존 네이비 (#1e3a5f) glow

---

## 작업 C — "광고신청" 버튼 색상 조정

### 문제
`src/components/common/AdSection.tsx` line 79:
`bg-blue-600` 은 밝은 파란색 — 웨이터존 네이비 테마와 미스매치

### 수정 대상
**파일**: `src/components/common/AdSection.tsx`

현재:
```tsx
className="px-3 py-1.5 md:px-4 md:py-2 text-xs md:text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all flex items-center gap-1"
```

수정:
```tsx
className="px-3 py-1.5 md:px-4 md:py-2 text-xs md:text-sm font-bold bg-blue-800 hover:bg-blue-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all flex items-center gap-1"
```

---

## 작업 D — "공고 더보기" 버튼 가시성 개선

### 문제
`src/components/common/AdSection.tsx`:
다크 배경에서 `border-gray-700 text-gray-300` — 가시성 낮음

### 수정 대상
**파일**: `src/components/common/AdSection.tsx`

현재:
```tsx
className={`px-6 py-3 rounded-xl border-2 font-bold text-sm flex items-center gap-2 transition-all ${isDark ? 'border-gray-700 text-gray-300 hover:bg-gray-800' : 'border-gray-200 text-gray-500 hover:bg-gray-50 hover:border-gray-300'}`}
```

수정:
```tsx
className={`px-6 py-3 rounded-xl border-2 font-bold text-sm flex items-center gap-2 transition-all ${isDark ? 'border-blue-700 text-blue-300 hover:bg-blue-900/30 hover:border-blue-500' : 'border-blue-300 text-blue-600 hover:bg-blue-50 hover:border-blue-400'}`}
```

---

## 검증 체크리스트
- [ ] `npm run build` → Exit code 0
- [ ] 홈 화면: 광고 빈 상태(Empty State) 정상 표시
- [ ] HeroSection: 핑크 glow 사라지고 블루 glow로 교체됨
- [ ] "광고신청" 버튼: 네이비 블루 색상
- [ ] "공고 더보기" 버튼: 다크 배경에서 파란색 테두리로 선명하게 보임
- [ ] git commit & push

---

**Antigravity AI Assistant**
