# ich ewiges kind.

필름 사진 갤러리 웹사이트. Next.js 16 App Router + Google Drive 연동.

---

## 기술 스택

| 영역 | 기술 |
|------|------|
| 프레임워크 | Next.js 16 (App Router) |
| 언어 | TypeScript |
| 스타일 | Tailwind CSS |
| 애니메이션 | GSAP |
| 이미지 소스 | Google Drive API |

---

## 개발 방법 및 순서

### 1. 프로젝트 셋업

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
```

### 2. 환경 변수 설정

`.env.example`을 참고해 `.env.local`을 생성하고 아래 변수를 설정한다.

| 변수 | 설명 | 필수 |
|------|------|------|
| `GOOGLE_DRIVE_FOLDER_ID` | 갤러리 이미지가 있는 Drive 폴더 ID | ✅ |
| `GOOGLE_SERVICE_ACCOUNT_JSON` | 서비스 계정 JSON (한 줄, minified) | 옵션 A |
| `GOOGLE_DRIVE_API_KEY` | Drive API 키 (공개 폴더용) | 옵션 B |

- **옵션 A (권장)**  
  서비스 계정 JSON 사용. 폴더를 서비스 계정 이메일에 공유(Editor)하고, JSON 전체를 한 줄로 붙여넣기.
- **옵션 B**  
  API 키 + 공개 폴더. 폴더가 "링크가 있는 모든 사용자"로 공유되어 있어야 함.

### 3. 데이터 플로우 (처리 순서)

```
1. page.tsx (서버)
   └─ getGalleryImages() 호출
      └─ lib/gallery.ts
         └─ unstable_cache(5분) → Drive API → 이미지 메타데이터 목록

2. Hero: images 중 랜덤 1장 → initialSrc
3. Gallery: images 전체 → initialItems

4. 이미지 표시
   └─ src: /api/gallery/image?id={fileId}
      └─ app/api/gallery/image/route.ts
         └─ Drive API (alt=media) → 이미지 바이트 스트림 반환
```

- 갤러리 목록은 **`unstable_cache`(5분)** 로 캐시됨.
- 실제 이미지 요청은 **`/api/gallery/image`** 프록시를 통해 처리됨.

### 4. 주요 파일 구조

```
app/
├── page.tsx              # 홈: getGalleryImages → Hero, Gallery에 전달
├── api/gallery/
│   ├── route.ts          # 클라이언트 폴백용 목록 API
│   └── image/route.ts    # 이미지 프록시 (Drive → 응답)
components/
├── hero.tsx              # 배경 랜덤, GSAP 텍스트 애니메이션
├── gallery.tsx           # 그리드, 클릭 뷰어, IntersectionObserver
└── footer.tsx
lib/
└── gallery.ts            # Drive API + unstable_cache
```

---

## 핵심 포인트

### 이미지 로딩 & 캐시

- **목록 캐시**  
  `lib/gallery.ts`에서 `unstable_cache`로 5분간 캐시.
- **이미지 캐시**  
  `/api/gallery/image`에서 `Cache-Control`로 캐시:
  - `max-age=86400` (브라우저 24시간)
  - `s-maxage=604800` (CDN 7일)
  - `stale-while-revalidate=86400`
- **우선 로딩**  
  Hero와 갤러리 상단 6장에 `priority`, `fetchPriority="high"`.

### Hero 배경

- **랜덤 선택**  
  매 요청마다 `Math.random()`으로 다른 이미지 선택.
- **캐시 미적용**  
  `page.tsx`에 `export const dynamic = "force-dynamic"` 설정 → 정적 캐시 없음.
- **애니메이션**  
  GSAP로 서브타이틀·타이틀 부드럽게 등장 (fade-in, translateY, blur 해제).

### 갤러리

- **서버 데이터**  
  `initialItems`로 서버에서 받은 데이터로 바로 렌더링.
- **지연 로딩**  
  보이는 항목만 IntersectionObserver로 렌더링.
- **이미지 뷰어**  
  모달, 키보드(ESC, ←/→)로 이전/다음 이미지 이동.

### Next.js 이미지 설정

- `next.config.mjs`의 `images.localPatterns`에 `/api/gallery/image` 등록 (쿼리 스트링 허용).

---

## 스크립트

| 명령 | 설명 |
|------|------|
| `npm run dev` | 개발 서버 (Turbopack) |
| `npm run build` | 프로덕션 빌드 |
| `npm run start` | 프로덕션 서버 |
| `npm run lint` | ESLint 실행 |
