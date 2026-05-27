# App Router - AI Agent 지침서

## 모듈 역할

Next.js 15 App Router 기반 페이지 및 레이아웃 정의. 현재 단일 페이지(`/`) 구조이며, 클라이언트 사이드 렌더링을 사용한다.

## 의존성 관계

- `@/components/*` — UI 컴포넌트 import
- `@/hooks/useMemos` — 메모 상태 관리 훅
- `@/types/memo` — 메모 타입 정의

## Tech Stack & Constraints

- Next.js App Router (pages 디렉토리 아님)
- 현재 모든 페이지는 `'use client'` 클라이언트 컴포넌트
- SSR/SSG 미사용 (LocalStorage 의존으로 인해)

## 파일 구조

```
app/
├── api/
│   └── summarize/
│       └── route.ts  # AI 요약 API Route (POST /api/summarize, Gemini SDK 호출)
├── favicon.ico        # 파비콘
├── globals.css        # 전역 스타일 (Tailwind)
├── layout.tsx         # 루트 레이아웃
└── page.tsx           # 메인 페이지 (/)
```

## 환경 변수

| 변수명 | 설명 | 사용 위치 |
|--------|------|-----------|
| `GEMINI_API_KEY` | Google Gemini API 키 ([발급](https://aistudio.google.com/apikey)) | `app/api/summarize/route.ts` (서버 전용) |

- `.env.example` 파일에 템플릿이 제공됨
- 실제 키는 `.env.local`에 작성 (`.gitignore`로 추적 제외)

## Implementation Patterns

### 새 페이지 추가 시

```tsx
'use client'

import { useMemos } from '@/hooks/useMemos'
// 필요한 컴포넌트 import

export default function NewPage() {
  const { memos, loading } = useMemos()

  if (loading) return <div>Loading...</div>

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 콘텐츠 */}
    </div>
  )
}
```

### 레이아웃 수정 시

- `layout.tsx`에서 전역 HTML 구조 정의
- `globals.css`에서 Tailwind 기본 설정 및 커스텀 스타일

## Local Golden Rules

### Do's

- 새 페이지 생성 시 폴더 기반 라우팅 사용 (예: `app/settings/page.tsx`)
- 메타데이터는 `layout.tsx` 또는 개별 페이지에서 `metadata` export로 정의
- 로딩 상태 UI 항상 제공

### Don'ts

- Server Components에서 LocalStorage 접근 시도 금지
- `pages/` 디렉토리 사용 금지 (App Router 전용)
- `getServerSideProps`, `getStaticProps` 사용 금지 (레거시 패턴)
- API Route에서 `NEXT_PUBLIC_` 접두사로 API 키 노출 금지 (서버 전용 환경 변수 사용)

## 자주 발생하는 실수

1. `'use client'` 누락으로 인한 hydration 에러
2. useState 초기값에서 LocalStorage 직접 접근 (SSR 에러 유발)
3. 서버 컴포넌트에서 브라우저 API 호출
