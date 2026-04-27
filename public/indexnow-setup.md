# IndexNow 키 설정 가이드

## 1단계: 키 생성
아래 명령어로 고유 키를 생성하세요:
```
node -e "console.log(require('crypto').randomUUID().replace(/-/g,''))"
```
예시: `a1b2c3d4e5f6789012345678901234ab`

## 2단계: 키 파일 생성
`public/{생성한키}.txt` 파일을 만들고 안에 키 값만 입력하세요.
파일 내용 예시:
```
a1b2c3d4e5f6789012345678901234ab
```

## 3단계: Vercel 환경변수 등록
Vercel Dashboard → Settings → Environment Variables:
```
INDEXNOW_KEY = a1b2c3d4e5f6789012345678901234ab
```

## 4단계: 검증
https://www.cocoalba.kr/{키}.txt 에 접속해서 키가 표시되면 완료.

## 참고
- IndexNow는 무료이며 Bing, Google 파트너 모두 자동 전파됩니다.
- 하루 최대 10,000 URL 제출 가능 (우리 사이트 기준 충분)
