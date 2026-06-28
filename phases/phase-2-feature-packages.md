# Phase 2 · feature 패키지 (cloud-feature / hub-feature)

**목표**: 제품 페이지 로직을 패키지에 둔다. `/`와 `/debug` 두 페이지씩. hub는 `ENABLE_HUB` 게이팅 포함.
**참조**: `reference/runtime-config.md`, `reference/conventions.md`.

## packages/cloud-feature

### `package.json`
```jsonc
{ "name": "@test/cloud-feature", "version": "0.0.0", "private": true,
  "exports": { "./pages/*": "./src/pages/*.tsx" },
  "dependencies": { "@test/ui": "*", "@test/shared": "*" } }
```

### `src/pages/index.tsx`
```tsx
import { Header } from '@test/ui';
// CLOUD-ONLY-MARKER: 이 문자열은 hub 이미지에서 절대 grep되면 안 된다 (acceptance C)
export default function CloudHome() {
  return (<div><Header currentProduct="cloud" /><main>Cloud Home (prototype)</main></div>);
}
```

### `src/pages/debug.tsx`
```tsx
import type { GetServerSideProps } from 'next';
import { Header } from '@test/ui';
import { getEnv } from '@test/shared/runtime-config';
export const getServerSideProps: GetServerSideProps = async () => ({ props: { env: getEnv() } });
export default function CloudDebug({ env }: { env: any }) {
  return (<div><Header currentProduct="cloud" />
    <pre>{JSON.stringify(env, null, 2)}</pre></div>);
}
```

## packages/hub-feature

### `package.json`
```jsonc
{ "name": "@test/hub-feature", "version": "0.0.0", "private": true,
  "exports": { "./pages/*": "./src/pages/*.tsx" },
  "dependencies": { "@test/ui": "*", "@test/shared": "*" } }
```

### `src/pages/index.tsx` — **게이팅 포함**
```tsx
import type { GetServerSideProps } from 'next';
import { Header } from '@test/ui';
import { getEnv } from '@test/shared/runtime-config';
export const getServerSideProps: GetServerSideProps = async () => {
  if (!getEnv().ENABLE_HUB) return { notFound: true }; // 플래그 off → 404
  return { props: { now: new Date().toISOString() } };
};
export default function HubHome({ now }: { now: string }) {
  return (<div><Header currentProduct="hub" /><main>Hub Home — {now}</main></div>);
}
```

### `src/pages/debug.tsx`
cloud-feature의 debug와 동일 구조, `currentProduct="hub"`, 그리고 getServerSideProps 상단에 동일한 ENABLE_HUB 게이팅 추가.

각 패키지에 `tsconfig.json`(extends base).

## Verify
```bash
yarn turbo type-check
```

## Done-when
- 두 패키지 type-check 통과.
- `@test/cloud-feature/pages/index` 같은 subpath import가 해석된다.
- cloud-feature에 `CLOUD-ONLY-MARKER` 문자열이 존재(나중에 acceptance C에서 사용).

→ 통과하면 `phases/phase-3-app-shells.md`로.
