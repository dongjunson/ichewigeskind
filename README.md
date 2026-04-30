# ich ewiges kind.

필름 사진 갤러리 웹사이트. Next.js 16 App Router에서 Google Drive 공유 폴더를 사진 저장소로 사용하고, 웹에서는 갤러리 그리드, 라이트박스, 개별 사진 공유 URL, Open Graph 미리보기를 제공한다.

---

## 기술 스택

| 영역 | 기술 |
|------|------|
| 프레임워크 | Next.js 16 App Router |
| 언어 | TypeScript, React 19 |
| 스타일 | Tailwind CSS |
| 애니메이션 | GSAP |
| 이미지 소스 | Google Drive API |
| 배포 | Vercel |

---

## 주요 기능

- Google Drive 폴더 안의 이미지를 `createdTime desc` 순서로 불러와 갤러리에 표시한다.
- 초기 페이지는 최근 30장을 서버에서 렌더링하고, 하단 `more` 버튼으로 다음 30장씩 추가 로딩한다.
- 이미지는 Drive 원본 URL을 클라이언트에 직접 노출하지 않고 `/api/gallery/image?id={fileId}` 서버 프록시를 통해 제공한다.
- 사진 클릭 시 `/photos/{googleDriveFileId}` 주소로 이동하며 라이트박스가 열린다.
- `/photos/{id}` 주소로 직접 들어와도 해당 사진 메타데이터를 Drive에서 조회해 라이트박스를 연다.
- 라이트박스에서 이전/다음 이동, ESC 닫기, 스와이프 이동, URL 복사를 지원한다.
- 사진 상세 URL을 메신저나 SNS에 붙여 넣으면 전용 Open Graph 이미지 URL이 미리보기로 설정된다.
- Drive API 호출량을 `/api/drive-usage`에서 확인할 수 있다.

---

## 로컬 개발

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경 변수 파일 만들기

`.env.example`을 참고해 `.env.local`을 만든다.

```bash
cp .env.example .env.local
```

### 3. 개발 서버 실행

```bash
npm run dev
```

개발 서버는 기본적으로 `http://localhost:3000`에서 열린다.

---

## Google Drive 공유 폴더 세팅

이 사이트는 Google Drive 폴더 하나를 갤러리의 원본 데이터베이스처럼 사용한다. 폴더에 이미지 파일을 추가하면 Drive API 목록 조회 결과에 포함되고, 웹에서는 최신순으로 노출된다.

### 지원 이미지 형식

현재 코드는 아래 MIME 타입만 갤러리 이미지로 인정한다.

- `image/jpeg`
- `image/png`
- `image/webp`
- `image/gif`

PDF, 동영상, HEIC 등은 목록에서 제외된다. HEIC 사진을 올릴 경우 JPEG/WebP 등 웹 호환 이미지로 변환해서 업로드하는 것을 권장한다.

### 폴더 ID 찾기

Google Drive 폴더 URL은 보통 아래 형태다.

```text
https://drive.google.com/drive/folders/1AbCdEfGhIjKlMnOpQrStUvWxYz
```

여기서 `1AbCdEfGhIjKlMnOpQrStUvWxYz` 부분이 `GOOGLE_DRIVE_FOLDER_ID`다.

### 권장 방식: 서비스 계정

운영 환경에서는 서비스 계정을 권장한다. 공개 폴더가 아니어도 동작하고, 이미지 프록시도 안정적으로 원본 파일을 읽을 수 있다.

1. Google Cloud Console에서 프로젝트를 만든다.
2. Google Drive API를 활성화한다.
3. IAM > Service Accounts에서 서비스 계정을 만든다.
4. 서비스 계정의 JSON 키를 생성해 다운로드한다.
5. Google Drive 갤러리 폴더를 서비스 계정 이메일에 공유한다.
   - 이메일 예: `gallery-reader@project-id.iam.gserviceaccount.com`
   - 권한은 읽기만 필요하면 Viewer로 충분하다.
6. `.env.local` 또는 Vercel 환경변수에 아래 값을 넣는다.

```env
GOOGLE_DRIVE_FOLDER_ID=your_folder_id_here
GOOGLE_SERVICE_ACCOUNT_JSON={"type":"service_account","project_id":"..."}
```

`GOOGLE_SERVICE_ACCOUNT_JSON`은 JSON 전체를 한 줄 문자열로 넣는다. Vercel Environment Variables에는 줄바꿈이 포함된 원본 JSON을 그대로 넣어도 동작할 수 있지만, 복사 과정에서 깨지는 것을 줄이려면 minified JSON 한 줄을 권장한다.

### 대안 방식: API Key + 공개 폴더

폴더를 공개해도 되는 경우에는 API Key 방식도 사용할 수 있다. 다만 Google Drive 공유 정책, resource key, 파일 권한에 따라 403이 발생할 수 있어 서비스 계정보다 불안정하다.

1. Google Cloud Console에서 Google Drive API를 활성화한다.
2. API Key를 생성한다.
3. Drive 폴더 공유 설정을 `Anyone with the link can view`로 설정한다.
4. `.env.local` 또는 Vercel 환경변수에 아래 값을 넣는다.

```env
GOOGLE_DRIVE_FOLDER_ID=your_folder_id_here
GOOGLE_DRIVE_API_KEY=your_api_key_here
```

공유 URL에 `resourcekey=0-xxxx`가 붙어 있다면 아래 변수도 추가한다.

```env
GOOGLE_DRIVE_RESOURCE_KEY=0-xxxx
```

### 환경 변수 목록

| 변수 | 설명 | 필수 여부 |
|------|------|-----------|
| `GOOGLE_DRIVE_FOLDER_ID` | 갤러리 원본 Google Drive 폴더 ID | 필수 |
| `GOOGLE_SERVICE_ACCOUNT_JSON` | 서비스 계정 JSON. 권장 인증 방식 | 옵션 A |
| `GOOGLE_DRIVE_API_KEY` | 공개 폴더 접근용 Drive API Key | 옵션 B |
| `GOOGLE_DRIVE_RESOURCE_KEY` | resource key가 붙은 공개 폴더용 추가 키 | 옵션 |
| `DRIVE_USAGE_ACCESS_KEY` | 프로덕션에서 `/api/drive-usage` 조회를 보호하는 Bearer 토큰 | 옵션 |
| `NEXT_PUBLIC_SITE_URL` | 공유 메타데이터의 절대 URL 기준 도메인 | 권장 |
| `SITE_URL` | 서버 전용 사이트 URL fallback | 옵션 |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | GA4 측정 ID. 현재 코드는 layout에 고정 ID도 포함 | 옵션 |

`NEXT_PUBLIC_SITE_URL`은 공유 미리보기 품질을 위해 운영에서 설정하는 것을 권장한다.

```env
NEXT_PUBLIC_SITE_URL=https://your-domain.com
```

이 값이 없으면 Vercel의 `VERCEL_PROJECT_PRODUCTION_URL` 또는 `VERCEL_URL`을 사용하고, 로컬에서는 `http://localhost:3000`을 사용한다.

---

## Vercel 배포 설정

`vercel.json`은 Next.js 프로젝트로 인식되도록 설정하고, 사진 상세 URL 직접 접근을 위해 `/photos/:id` rewrite를 명시한다.

```json
{
  "installCommand": "npm install",
  "framework": "nextjs",
  "rewrites": [
    {
      "source": "/photos/:id",
      "destination": "/photos/:id"
    }
  ]
}
```

Vercel Project Settings > Environment Variables에 로컬 `.env.local`과 같은 값을 등록한다. 최소 구성은 아래 중 하나다.

서비스 계정 방식:

```env
GOOGLE_DRIVE_FOLDER_ID=...
GOOGLE_SERVICE_ACCOUNT_JSON=...
NEXT_PUBLIC_SITE_URL=https://your-domain.com
```

API Key 방식:

```env
GOOGLE_DRIVE_FOLDER_ID=...
GOOGLE_DRIVE_API_KEY=...
GOOGLE_DRIVE_RESOURCE_KEY=...
NEXT_PUBLIC_SITE_URL=https://your-domain.com
```

---

## 데이터 플로우

### 홈 갤러리 목록

```text
app/page.tsx
  -> getInitialGalleryPage()
    -> lib/gallery.ts
      -> Google Drive files.list
      -> 최근 30장 + nextPageToken 반환
  -> Hero, LatestShowcase, Gallery에 initial data 전달
```

Drive 목록 조회 조건:

- `GOOGLE_DRIVE_FOLDER_ID` 안에 있는 파일
- 지원 이미지 MIME 타입
- `trashed=false`
- `createdTime desc`
- `pageSize=30`

### more 버튼

```text
components/gallery.tsx
  -> GET /api/gallery?pageToken=...
    -> app/api/gallery/route.ts
      -> Google Drive files.list
      -> 다음 30장 + nextPageToken 반환
```

클라이언트에서는 이미 로드한 ID를 기준으로 중복 이미지를 제거한 뒤 뒤에 붙인다.

### 이미지 표시

```text
<Image src="/api/gallery/image?id={fileId}" />
또는 라이트박스 <img src="/api/gallery/image?id={fileId}" />
  -> app/api/gallery/image/route.ts
    -> Google Drive files.get alt=media
    -> 이미지 바이트 스트림 반환
```

이미지 API는 먼저 서비스 계정으로 시도하고, 서비스 계정 설정이 없으면 API Key 방식으로 시도한다.

### 사진 상세 URL

```text
/photos/{fileId}
  -> app/photos/[id]/page.tsx
    -> getGalleryImageById(fileId)
      -> Google Drive files.get metadata
    -> Gallery initialSelectedImage로 주입
    -> 라이트박스 열린 상태로 렌더링
```

따라서 홈에서 아직 `more`로 불러오지 않은 사진도, Drive file ID만 맞으면 `/photos/{id}` 직접 접근으로 열 수 있다.

### 공유 미리보기 메타데이터

`/photos/{id}`는 `generateMetadata()`에서 해당 파일의 Drive 메타데이터를 조회하고 아래 메타 태그를 생성한다.

- `og:title`
- `og:url`
- `og:image`
- `og:image:width`
- `og:image:height`
- `og:image:type`
- `twitter:card`
- `twitter:image`

`og:image`와 `twitter:image`는 `/photos/{fileId}/opengraph-image`의 절대 URL을 사용한다. 이 라우트는 Drive 이미지 바이트를 바로 프록시하므로, 공유 URL을 메신저, Slack, KakaoTalk, X 등에 붙여 넣으면 해당 사진이 안정적인 미리보기 이미지로 사용된다. 공유 타이틀은 개별 파일명이 아니라 사이트 기본 타이틀인 `ichewigeskind — Film Photography Journal`로 고정한다.

---

## 캐시 정책

| 대상 | 위치 | 정책 |
|------|------|------|
| 초기 갤러리 목록 | `lib/gallery.ts` | `unstable_cache`, revalidate 60초 |
| 개별 사진 메타데이터 | `lib/gallery.ts` | `unstable_cache`, revalidate 60초 |
| Hero 랜덤 이미지 | `app/page.tsx`, `app/photos/[id]/page.tsx` | `unstable_cache`, revalidate 300초 |
| 이미지 바이트 | `app/api/gallery/image/route.ts` | 브라우저 1일, CDN 7일, stale 1일 |

이미지 응답 헤더:

```text
Cache-Control: public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400
```

---

## 주요 파일 구조

```text
app/
├── page.tsx
├── photos/
│   └── [id]/page.tsx          # 사진 상세 URL, OG/Twitter 메타데이터
├── api/
│   ├── gallery/
│   │   ├── route.ts           # 추가 목록 로딩 API
│   │   └── image/route.ts     # Drive 이미지 프록시
│   └── drive-usage/route.ts   # Drive API 사용량 통계
components/
├── gallery.tsx                # 그리드, 라이트박스, URL 복사, 라우팅
├── hero.tsx                   # 랜딩 Hero
├── latest-showcase.tsx        # Hero 안 최신 사진 쇼케이스
└── footer.tsx
lib/
├── gallery.ts                 # Drive 목록/메타데이터 조회, 캐시
└── drive-monitor.ts           # Drive API 사용량 모니터
```

---

## Drive API 사용량 모니터

| 항목 | 설명 |
|------|------|
| 추적 대상 | `files.list`, `files.get` |
| 통계 조회 | `GET /api/drive-usage` |
| 프로덕션 인증 | `DRIVE_USAGE_ACCESS_KEY` 설정 시 `Authorization: Bearer <key>` 필요 |
| 개발 모드 | 각 호출 시 콘솔 로그 출력 |
| 주의 | in-memory 집계라 서버 재시작 시 초기화 |

예시:

```bash
curl -H "Authorization: Bearer $DRIVE_USAGE_ACCESS_KEY" \
  https://your-domain.com/api/drive-usage
```

---

## 운영 체크리스트

- Drive 폴더에 서비스 계정 이메일이 공유되어 있는지 확인한다.
- Vercel에 `GOOGLE_DRIVE_FOLDER_ID`와 인증 변수가 설정되어 있는지 확인한다.
- `NEXT_PUBLIC_SITE_URL`을 실제 운영 도메인으로 설정한다.
- `/api/gallery`가 이미지 목록을 반환하는지 확인한다.
- `/api/gallery/image?id={fileId}`가 `content-type: image/jpeg` 또는 실제 이미지 타입으로 응답하는지 확인한다.
- `/photos/{fileId}`가 새로고침/직접 접근에서 200으로 열리는지 확인한다.
- 공유 미리보기 디버거에서 `og:image`가 `/photos/{fileId}/opengraph-image`인지 확인한다.

공유 미리보기는 플랫폼별 캐시가 강하다. 이미지나 메타데이터를 수정한 뒤에도 Slack, KakaoTalk, Facebook 등에서 이전 미리보기가 보일 수 있다. 이 경우 각 플랫폼의 URL debugger 또는 캐시 갱신 도구를 사용한다.

---

## 문제 해결

### 갤러리가 비어 있음

- `GOOGLE_DRIVE_FOLDER_ID`가 맞는지 확인한다.
- Drive 폴더에 지원 이미지 형식의 파일이 있는지 확인한다.
- 서비스 계정 이메일에 폴더가 공유되어 있는지 확인한다.
- API Key 방식이라면 폴더가 `Anyone with the link can view`인지 확인한다.

### 이미지 목록은 보이지만 원본 이미지가 안 열림

- 서비스 계정 방식이면 `GOOGLE_SERVICE_ACCOUNT_JSON`이 깨지지 않았는지 확인한다.
- API Key 방식이면 개별 파일도 공개 접근 가능한지 확인한다.
- `/api/gallery/image?id={fileId}`를 직접 열어 응답 상태와 `content-type`을 확인한다.

### `/photos/{id}`가 404

- `{id}`가 Google Drive file ID인지 확인한다. 폴더 ID나 공유 URL 전체가 아니라 파일 ID여야 한다.
- 해당 파일이 설정한 `GOOGLE_DRIVE_FOLDER_ID` 폴더 안에 있는지 확인한다.
- 지원 이미지 MIME 타입인지 확인한다.
- Vercel 배포라면 최신 커밋이 배포되었는지 확인한다.

### 공유 미리보기가 기본 이미지로 뜸

- `NEXT_PUBLIC_SITE_URL`이 실제 공개 도메인인지 확인한다.
- `/photos/{id}` HTML에 `og:image`가 있는지 확인한다.
- `og:image` URL이 외부에서 접근 가능한지 확인한다.
- 플랫폼 캐시를 초기화한다.

### `zlib.bytesRead` deprecation warning

Next.js/Turbopack 개발 모드에서 발생하는 알려진 Node.js deprecation warning이다. 운영 이미지 로딩이나 Vercel 배포 동작에는 영향을 주지 않는다.

---

## 스크립트

| 명령 | 설명 |
|------|------|
| `npm run dev` | 개발 서버 실행 |
| `npm run build` | 프로덕션 빌드 |
| `npm run start` | 프로덕션 서버 실행 |
| `npm run lint` | Biome lint 실행 |
| `npm run lint:fix` | Biome lint 자동 수정 |
| `npm run format` | Biome format 적용 |
| `npm run check` | Biome check 적용 |
