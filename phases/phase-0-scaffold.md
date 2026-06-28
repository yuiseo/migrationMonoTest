# Phase 0 · 모노레포 스캐폴드

**목표**: yarn workspaces + turbo 골격을 세우고 `yarn install`이 도는 상태를 만든다.

## 만들 파일

### `package.json` (루트)
```jsonc
{
  "name": "test-web",
  "private": true,
  "workspaces": ["apps/*", "packages/*"],
  "packageManager": "yarn@1.22.22",
  "engines": { "node": ">=22.18.0" },
  "scripts": {
    "dev": "turbo dev",
    "build": "turbo build",
    "lint": "turbo lint",
    "type-check": "turbo type-check"
  },
  "devDependencies": { "turbo": "^2.0.0", "typescript": "^5.5.0" }
}
```

### `.yarnrc`
```
engine-strict true
```

### `turbo.json`
```jsonc
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": { "dependsOn": ["^build"], "outputs": [".next/**", "!.next/cache/**"] },
    "dev": { "cache": false, "persistent": true },
    "lint": {},
    "type-check": {}
  }
}
```

### `tsconfig.base.json`
```jsonc
{
  "compilerOptions": {
    "target": "ES2022", "lib": ["dom", "dom.iterable", "ES2022"],
    "module": "ESNext", "moduleResolution": "Bundler",
    "strict": true, "esModuleInterop": true, "skipLibCheck": true,
    "jsx": "preserve", "noEmit": true, "resolveJsonModule": true,
    "isolatedModules": true, "forceConsistentCasingInFileNames": true
  }
}
```

### `.gitignore`
```
node_modules
.next
.turbo
out
*.tar.gz
apps/*/public/env-config.js
```

## Verify
```bash
node -v                    # v22.18.0 이상
yarn install               # 성공
yarn turbo run --help      # turbo 동작
```

## Done-when
- `yarn install`이 에러 없이 끝난다.
- 22.18.0 미만 Node에서 install이 `engine-strict`로 실패한다(원하면 확인).

→ 통과하면 `phases/phase-1-shared-ui.md`로.
