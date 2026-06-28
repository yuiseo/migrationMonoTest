# Phase 1 · 공유 패키지 (shared / ui / auth / api-client)

**목표**: 런타임 config, 공용 Header(ProductNav), 스텁 패키지를 세운다.
**참조**: `reference/runtime-config.md`, `reference/conventions.md`.

## packages/shared

### `package.json`
```jsonc
{ "name": "@test/shared", "version": "0.0.0", "private": true,
  "exports": { "./runtime-config": "./src/runtime-config.ts", "./providers": "./src/providers.tsx" },
  "dependencies": { "@tanstack/react-query": "^5", "jotai": "^2", "zod": "^3" } }
```

### `src/runtime-config.ts`
→ `reference/runtime-config.md`의 `getEnv()` 구현을 그대로 사용.

### `src/providers.tsx`
React Query `QueryClientProvider` + Jotai `Provider`로 children을 감싸는 컴포넌트 하나(`AppProviders`)만. (프로토타입은 배선 증명용이라 최소 구현.)

## packages/ui

### `package.json`
```jsonc
{ "name": "@test/ui", "version": "0.0.0", "private": true,
  "exports": { ".": "./src/index.tsx" },
  "dependencies": { "@test/shared": "*" } }
```

### `src/index.tsx` — Header + ProductNav
요건:
- `Header`는 두 제품 탭(Cloud / Hub)을 보여준다.
- **soft/hard 구분**: 같은 앱 내 이동은 `next/link`, 제품 경계를 넘는 이동은 `<a href>`.
- Hub 탭은 `getEnv().ENABLE_HUB === true`일 때만 렌더.
- prop `currentProduct: 'cloud' | 'hub'`로 현재 위치 표시.

```tsx
import Link from 'next/link';
import { getEnv } from '@test/shared/runtime-config';

export function Header({ currentProduct }: { currentProduct: 'cloud' | 'hub' }) {
  const showSecurehub = getEnv().ENABLE_HUB;
  return (
    <header style={{ display: 'flex', gap: 16, padding: 12, borderBottom: '1px solid #ccc' }}>
      {/* 같은 앱(main) 내 cloud 라우트는 soft, hub는 다른 앱일 수 있어 hard */}
      <Link href="/">Cloud</Link>
      {showSecurehub && <a href="/hub">Hub</a>}
      <span style={{ marginLeft: 'auto', opacity: 0.6 }}>현재: {currentProduct}</span>
    </header>
  );
}
```

## packages/auth (스텁)
### `package.json`
```jsonc
{ "name": "@test/auth", "version": "0.0.0", "private": true, "exports": { ".": "./src/index.ts" } }
```
### `src/index.ts`
```ts
// 프로토타입 스텁. 본 마이그레이션에서 실제 로그인/회원 로직으로 채운다.
export const AUTH_STUB = true;
```

## packages/api-client (fetch 래퍼 1개)
### `package.json`
```jsonc
{ "name": "@test/api-client", "version": "0.0.0", "private": true,
  "exports": { ".": "./src/index.ts" }, "dependencies": { "@test/shared": "*" } }
```
### `src/index.ts`
```ts
import { getEnv } from '@test/shared/runtime-config';
export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${getEnv().API_BASE_URL}${path}`);
  if (!res.ok) throw new Error(`api ${res.status}`);
  return res.json() as Promise<T>;
}
```

각 패키지에 `tsconfig.json`(extends `../../tsconfig.base.json`)을 둔다.

## Verify
```bash
yarn turbo type-check     # 모든 패키지 타입 통과
```

## Done-when
- 네 패키지 모두 type-check 통과.
- `@test/shared/runtime-config`에서 `getEnv` import가 해석된다.

→ 통과하면 `phases/phase-2-feature-packages.md`로.
