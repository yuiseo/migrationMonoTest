# 01 · 목표 디렉터리 구조

```
test-web/
├─ apps/
│  ├─ main/                          # cloud + hub → AWS, ncp
│  │  ├─ pages/
│  │  │  ├─ _app.tsx
│  │  │  ├─ _document.tsx            # /env-config.js 주입
│  │  │  ├─ index.tsx                # re-export → cloud-feature
│  │  │  ├─ debug.tsx                # re-export → cloud-feature/debug
│  │  │  └─ hub/
│  │  │     ├─ index.tsx             # re-export → hub-feature (게이팅 대상)
│  │  │     └─ debug.tsx
│  │  ├─ public/env-config.dev.js    # 로컬 dev 폴백(커밋)
│  │  ├─ entrypoint.sh
│  │  ├─ next.config.js
│  │  ├─ tsconfig.json
│  │  └─ package.json                # name: @test/main
│  └─ hub/                     # hub 단독 → 온프렘
│     ├─ pages/
│     │  ├─ _app.tsx
│     │  ├─ _document.tsx            # /hub/env-config.js 주입
│     │  ├─ index.tsx                # re-export → hub-feature
│     │  └─ debug.tsx
│     ├─ public/env-config.dev.js
│     ├─ entrypoint.sh
│     ├─ next.config.js              # basePath '/hub'
│     ├─ tsconfig.json
│     └─ package.json                # name: @test/hub
├─ packages/
│  ├─ cloud-feature/                 # @test/cloud-feature
│  │  ├─ src/pages/{index,debug}.tsx
│  │  └─ package.json
│  ├─ hub-feature/             # @test/hub-feature
│  │  ├─ src/pages/{index,debug}.tsx
│  │  └─ package.json
│  ├─ ui/                            # @test/ui — Header, ProductNav
│  │  ├─ src/index.tsx
│  │  └─ package.json
│  ├─ shared/                        # @test/shared — runtime-config, providers
│  │  ├─ src/{runtime-config,providers}.tsx
│  │  └─ package.json
│  ├─ auth/                          # 스텁(빈 export)
│  │  ├─ src/index.ts
│  │  └─ package.json
│  └─ api-client/                    # fetch 래퍼 1개
│     ├─ src/index.ts
│     └─ package.json
├─ deploy/onprem/
│  ├─ docker-compose.yml
│  └─ .env.example
├─ .github/workflows/build.yml
├─ Dockerfile                        # ARG APP 공용
├─ .dockerignore
├─ .yarnrc                           # engine-strict true
├─ turbo.json
├─ tsconfig.base.json
├─ yarn.lock
└─ package.json                      # workspaces 선언 + engines
```

## 네이밍 규칙
- 모든 워크스페이스 패키지: `@test/*`.
- import는 항상 패키지 이름으로. 상대경로로 패키지 경계를 넘지 않는다.
