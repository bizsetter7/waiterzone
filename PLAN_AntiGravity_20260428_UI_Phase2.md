# PLAN_AntiGravity_20260428_UI_Phase2.md
# P9 웨이터존 — UI 가시성 정비 Phase 2

> 작성: 코부장 | 2026-04-28
> 대상: P9 웨이터존 (`D:\토탈프로젝트\My-site\p9.웨이터존\waiterzone`)
> 브랜드 컬러: `#1e3a5f` (네이비 블루)
> 테마: `dark` (헤더 `bg-gray-900`)

---

## 절대 원칙
1. 파일 전체 덮어쓰기 금지 — Edit 핀셋 수정만
2. 완료 선언은 `npm run build` Exit code 0 확인 후
3. 수정 후 반드시 git commit & push

---

## 작업 A — BannerSidebar P2 광고 차단 (최우선)

### 문제
`src/components/BannerSidebar.tsx` line 161-174:
Supabase `shops` 테이블을 platform 필터 없이 **직접 조회**하고 있어,
HomePortalClient를 차단해도 사이드배너에 P2 코코알바 광고가 그대로 노출됨.

### 수정 대상
**파일**: `src/components/BannerSidebar.tsx`

현재 코드 (line 161-175):
```typescript
const [dbShops, setDbShops] = useState<any[]>([]);
useEffect(() => {
    if (isMobile) return; // 모바일 fetch 차단
    supabase
        .from('shops')
        .select('*')
        .eq('is_closed', false)
        .in('tier', ['grand', 'p1', 'premium', 'p2'])
        .order('updated_at', { ascending: false })
        .then(({ data }) => {
            if (data && data.length > 0) {
                setDbShops(data.map(shop => enrichAdData(shop, [])));
            }
        });
}, [isMobile]);
```

**수정 내용**:
```typescript
const [dbShops, setDbShops] = useState<any[]>([]);
useEffect(() => {
    // [임시] platform 컬럼 추가 전까지 웨이터존 자체 광고 없음 → 빈 상태
    // TODO: platform 컬럼 추가 후 .eq('platform', 'waiterzone') 필터 활성화
    setDbShops([]);
}, [isMobile]);
```

> **주의**: `useState<any[]>([])` 선언줄은 그대로 두고, `useEffect` 바디만 교체할 것.

---

## 작업 B — MainHeader nav 텍스트 가시성 (dark 테마)

### 문제
`src/components/common/MainHeader.tsx`:
헤더가 `bg-gray-900` (다크)인데 nav 텍스트들이 `text-slate-900` / `text-gray-900` (아주 어두운색) → 배경과 동화되어 보이지 않음.

**수정 대상**: `src/components/common/MainHeader.tsx`

### B-1. 어드민 "시스템 관리자" 텍스트
찾을 코드:
```tsx
<span className="text-xs font-black text-slate-900 group-hover:text-white">
    {isSimulated ? '어드민 복귀' : '시스템 관리자'}
</span>
```
수정:
```tsx
<span className="text-xs font-black text-slate-200 group-hover:text-white">
    {isSimulated ? '어드민 복귀' : '시스템 관리자'}
</span>
```

### B-2. Corporate "마이샵" 텍스트
찾을 코드:
```tsx
<div className="flex flex-col -space-y-0.5">
    <span className="text-[10px] font-bold text-gray-400">사장님</span>
    <span className="text-xs font-black text-gray-900">마이샵</span>
</div>
```
수정:
```tsx
<div className="flex flex-col -space-y-0.5">
    <span className="text-[10px] font-bold text-gray-400">사장님</span>
    <span className="text-xs font-black text-gray-100">마이샵</span>
</div>
```

### B-3. Individual "채용정보" + "마이페이지" 텍스트
찾을 코드:
```tsx
<Star size={16} className="text-gray-400 group-hover:text-amber-400" />
<span className="text-xs font-black text-gray-900">채용정보</span>
```
수정:
```tsx
<Star size={16} className="text-gray-400 group-hover:text-amber-400" />
<span className="text-xs font-black text-gray-100">채용정보</span>
```

찾을 코드:
```tsx
<span className="text-xs font-black text-gray-900">마이페이지</span>
```
수정:
```tsx
<span className="text-xs font-black text-gray-100">마이페이지</span>
```

### B-4. "로그아웃" 버튼
찾을 코드:
```tsx
<button onClick={handleLogout} className="text-xs font-bold text-gray-500 hover:text-red-600">로그아웃</button>
```
수정:
```tsx
<button onClick={handleLogout} className="text-xs font-bold text-gray-300 hover:text-red-400">로그아웃</button>
```

---

## 작업 C — JobListView 버튼 브랜딩

### 문제
`src/components/jobs/JobListView.tsx`:
- "광고신청" 버튼: `bg-blue-600` (밝은 파란색) → 웨이터존 네이비 테마와 불일치
- "내 보관함" / "더보기+" 버튼: `border-gray-200 text-gray-500` → dark 배경에서 안 보임

**수정 대상**: `src/components/jobs/JobListView.tsx`

### C-1. "광고신청" 버튼 색상
찾을 코드:
```tsx
className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 transition shadow-md hover:shadow-lg active:scale-95"
```
수정:
```tsx
className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-800 text-white hover:bg-blue-700 transition shadow-md hover:shadow-lg active:scale-95"
```

### C-2. "내 보관함" 버튼 가시성
찾을 코드:
```tsx
className="hidden md:flex items-center px-4 py-2 rounded-xl text-xs font-bold border border-gray-200 text-gray-500 hover:bg-gray-50 transition shadow-sm"
>
    <Star size={14} className="mr-1 text-amber-400" fill="currentColor" /> 내 보관함
```
수정:
```tsx
className="hidden md:flex items-center px-4 py-2 rounded-xl text-xs font-bold border border-gray-600 text-gray-300 hover:bg-gray-700 transition shadow-sm"
>
    <Star size={14} className="mr-1 text-amber-400" fill="currentColor" /> 내 보관함
```

### C-3. "더보기+" 버튼 가시성
찾을 코드 (두 번째 `border-gray-200 text-gray-500` 버튼 — "내 보관함" 바로 다음):
```tsx
className="hidden md:flex items-center px-4 py-2 rounded-xl text-xs font-bold border border-gray-200 text-gray-500 hover:bg-gray-50 transition shadow-sm"
>
    더보기 +
```
수정:
```tsx
className="hidden md:flex items-center px-4 py-2 rounded-xl text-xs font-bold border border-gray-600 text-gray-300 hover:bg-gray-700 transition shadow-sm"
>
    더보기 +
```

---

## 검증 체크리스트
- [ ] `npm run build` → Exit code 0
- [ ] 홈 사이드배너: P2 광고 사라지고 "입점문의" 슬롯만 표시
- [ ] 상단 nav (어드민 로그인 시): "시스템 관리자" 텍스트 보임
- [ ] 상단 nav (업체 로그인 시): "마이샵" 텍스트 보임
- [ ] 상단 nav (개인 로그인 시): "채용정보" / "마이페이지" 텍스트 보임
- [ ] "로그아웃" 텍스트 보임
- [ ] "광고신청" 버튼: 네이비 블루 (`bg-blue-800`)
- [ ] "내 보관함" / "더보기+" 버튼: dark 배경에서 선명히 보임
- [ ] git commit & push

---

**Antigravity AI Assistant**
