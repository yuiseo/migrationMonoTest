# Phase 3 · 앱 셸 (apps/main / apps/hub)

**목표**: 두 앱 셸을 만들고 re-export로 feature 페이지를 마운트한다. 런타임 config 주입(_document)을 배선한다. 로컬에서 두 앱이 동시에 뜨게 한다.
**참조**: `reference/runtime-config.md`(필수), `reference/gotchas.md`, `reference/conventions.md`.

## 공통 규칙
- `pages/*`는 **re-export 한 줄만**. 로직 작성 금지.
- `getServerSideProps`는 **named re-export**.

## apps/main

### `package.json`
```jsonc
{ "name": "@test/main", "version": "0.0.0", "private": true,
  "scripts": { "dev": "next dev -p 3000", "build": "next build", "start": "next start",
               "lint": "next lint", "type-check": "tsc --noEmit" },
  "dependencies": { "next": "^15", "react": "^18", "react-dom": "^18",
    "@test/ui": "*", "@test/shared": "*", "@test/api-client": "*",
    "@test/cloud-feature": "*", "@test/hub-feature": "*" } }
```

### `next.config.js`
```js
const path = require('path');
/** @type {import('next').NextConfig} */
module.exports = {
  reactStrictMode: true,
  output: 'standalone',
  outputFileTracingRoot: path.join(__dirname, '../../'),
  transpilePackages: ['@test/ui','@test/shared','@test/api-client',
    '@test/cloud-feature','@test/hub-feature'],
};
```

### 페이지 (re-export)
```tsx
// pages/index.tsx
export { default, getServerSideProps } from '@test/cloud-feature/pages/index';
// pages/debug.tsx
export { default, getServerSideProps } from '@test/cloud-feature/pages/debug';
// pages/hub/index.tsx
export { default, getServerSideProps } from '@test/hub-feature/pages/index';
// pages/hub/debug.tsx
export { default, getServerSideProps } from '@test/hub-feature/pages/debug';
```
> `index.tsx`는 cloud-feature에 getServerSideProps가 없으면 `export { default }`만. (Phase 2의 index에는 GSSP가 없으니 default만 re-export.)

### `pages/_app.tsx`
`@test/shared/providers`의 `AppProviders`로 감싼다.

### `pages/_document.tsx`
→ `reference/runtime-config.md`의 main용 그대로. script src = `/env-config.js`.

### `public/env-config.dev.js`
→ `reference/runtime-config.md` 참고(커밋).

### `tsconfig.json`
extends `../../tsconfig.base.json`, Next 플러그인 포함.

## apps/hub
apps/main과 동일하되 차이만:
- `package.json`: name `@test/hub`, dev 포트 `-p 3001`, **dependencies에서 `@test/cloud-feature` 제외**.
- `next.config.js`: `basePath: '/hub'`, transpilePackages에서 cloud-feature 제외.
- 페이지: hub-feature만 re-export (`pages/index.tsx`, `pages/debug.tsx`).
- `_document.tsx`: script src = `/hub/env-config.js`.

## Verify (= 인수 A)
```bash
yarn dev     # main:3000, hub:3001 동시 기동
```
브라우저 확인:
- `localhost:3000` → Cloud Home, 헤더에 Cloud/Hub 탭
- `localhost:3000/hub` → Hub Home (게이팅 통과)
- `localhost:3000/debug` → getEnv() 값(dev 폴백) 출력
- `localhost:3001/hub` → Hub 단독 (basePath 적용)
- `localhost:3001/hub/debug` → 동작

## Done-when
- 위 5개 URL이 기대대로 뜬다.
- `yarn turbo build` 두 앱 모두 성공(standalone 산출물 생성).

→ 통과하면 `phases/phase-4-docker.md`로.
