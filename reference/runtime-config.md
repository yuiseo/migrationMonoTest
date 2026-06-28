# reference · 런타임 config 메커니즘

**문제**: Pages Router에서 `NEXT_PUBLIC_*`는 빌드 타임에 클라이언트 번들로 인라인되어 런타임 변경 불가.
**해법**: 컨테이너 시작 시 `entrypoint.sh`가 환경변수로 `public/env-config.js`를 생성 → `_document`에서 앱 번들보다 먼저 로드 → 접근자 `getEnv()`가 읽음. 서버 사이드는 `process.env` 직접 사용.

## getEnv() 접근자 (`packages/shared/src/runtime-config.ts`)

```ts
export type RuntimeEnv = {
  API_BASE_URL: string;
  AUTH_BASE_URL: string;
  DEPLOY_TARGET: string;       // aws | ncp | onprem | local
  ENABLE_HUB: boolean;
};

const DEV_FALLBACK: RuntimeEnv = {
  API_BASE_URL: 'http://localhost:8080',
  AUTH_BASE_URL: 'http://localhost:8080/auth',
  DEPLOY_TARGET: 'local',
  ENABLE_HUB: true,
};

export function getEnv(): RuntimeEnv {
  if (typeof window !== 'undefined') {
    const w = (window as any).__ENV__;
    if (w) return { ...w, ENABLE_HUB: String(w.ENABLE_HUB) === 'true' };
    return DEV_FALLBACK; // dev에서 env-config.js 미주입 시
  }
  if (!process.env.API_BASE_URL) return DEV_FALLBACK;
  return {
    API_BASE_URL: process.env.API_BASE_URL!,
    AUTH_BASE_URL: process.env.AUTH_BASE_URL!,
    DEPLOY_TARGET: process.env.DEPLOY_TARGET ?? 'local',
    ENABLE_HUB: (process.env.ENABLE_HUB ?? 'true') === 'true',
  };
}
```

## _document 주입

```tsx
// apps/main/pages/_document.tsx
import { Html, Head, Main, NextScript } from 'next/document';
export default function Document() {
  return (
    <Html>
      <Head>
        {/* 앱 번들보다 먼저 로드되어야 함. next/script(afterInteractive) 쓰지 말 것 */}
        <script src="/env-config.js" />
      </Head>
      <body><Main /><NextScript /></body>
    </Html>
  );
}
```

**hub 앱은 basePath 때문에 src가 다르다:**
```tsx
<script src="/hub/env-config.js" />
```
(basePath `'/hub'`이면 `public/`이 `/hub/*`로 서빙되므로.)

## 로컬 dev 폴백 (`public/env-config.dev.js`, 커밋)

dev에선 컨테이너가 없어 `entrypoint.sh`가 안 돈다. 아래를 커밋해두고 `getEnv()`의 DEV_FALLBACK이 받친다.

```js
// public/env-config.dev.js  (참고용; 실제로는 getEnv의 DEV_FALLBACK이 동작)
window.__ENV__ = { API_BASE_URL: "http://localhost:8080",
  AUTH_BASE_URL: "http://localhost:8080/auth", DEPLOY_TARGET: "local", ENABLE_HUB: "true" };
```
> 운영에선 `entrypoint.sh`가 만든 `env-config.js`가 우선. dev에서 `env-config.js`가 없으면 404가 뜨지만 `getEnv()`가 폴백하므로 동작에는 지장 없다. (원하면 `_document`에서 dev일 때 `.dev.js`를 로드하도록 분기해도 됨.)

## 클라이언트에서 환경값 사용 규칙
- `process.env.NEXT_PUBLIC_*` **금지**.
- 반드시 `getEnv()` 경유.
