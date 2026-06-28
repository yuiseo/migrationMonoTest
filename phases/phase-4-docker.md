# Phase 4 · Docker (단일 Dockerfile + entrypoint)

**목표**: `ARG APP`으로 두 앱을 모두 빌드하는 단일 Dockerfile을 만들고, 런타임 config 주입을 검증한다.
**참조**: `reference/gotchas.md`(6,7번 특히), `reference/runtime-config.md`.

## `Dockerfile` (루트)
```dockerfile
# syntax=docker/dockerfile:1
ARG APP

FROM node:22-alpine AS base       # 22.18.0+ (22-alpine 태그가 충족)
RUN apk add --no-cache libc6-compat
WORKDIR /app

FROM base AS pruner
ARG APP
RUN npm i -g turbo@^2
COPY . .
RUN turbo prune "@test/${APP}" --docker

FROM base AS builder
ARG APP
COPY --from=pruner /app/out/json/ .
RUN yarn install --frozen-lockfile
COPY --from=pruner /app/out/full/ .
RUN yarn turbo build --filter="@test/${APP}"

FROM base AS runner
ARG APP
ENV NODE_ENV=production APP=${APP}
RUN addgroup -S nodejs && adduser -S nextjs -G nodejs
COPY --from=builder /app/apps/${APP}/.next/standalone ./
COPY --from=builder /app/apps/${APP}/.next/static  ./apps/${APP}/.next/static
COPY --from=builder /app/apps/${APP}/public         ./apps/${APP}/public
COPY --from=builder /app/apps/${APP}/entrypoint.sh  ./entrypoint.sh
RUN chmod +x ./entrypoint.sh && chown -R nextjs:nodejs /app
USER nextjs
EXPOSE 3000
ENV PORT=3000
ENTRYPOINT ["./entrypoint.sh"]
```

## `apps/main/entrypoint.sh` 와 `apps/hub/entrypoint.sh`
두 파일 동일(APP 환경변수로 경로 해석):
```sh
#!/bin/sh
set -e
cat > /app/apps/${APP}/public/env-config.js <<EOF
window.__ENV__ = {
  API_BASE_URL: "${API_BASE_URL:-http://localhost:8080}",
  AUTH_BASE_URL: "${AUTH_BASE_URL:-http://localhost:8080/auth}",
  DEPLOY_TARGET: "${DEPLOY_TARGET:-local}",
  ENABLE_HUB: "${ENABLE_HUB:-true}"
};
EOF
exec node apps/${APP}/server.js
```

## `.dockerignore` (루트)
```
**/node_modules
**/.next
**/.turbo
.git
deploy
out
*.tar.gz
```

## Verify

**빌드 (컨텍스트 = 루트 `.`)**
```bash
docker build -f Dockerfile --build-arg APP=main      -t test/main:proto .
docker build -f Dockerfile --build-arg APP=hub -t test/hub:proto .
docker images | grep test      # 두 이미지 존재 (= 인수 D)
```

**런타임 config가 재빌드 없이 바뀜 (= 인수 B)**
```bash
docker run --rm -p 3000:3000 -e DEPLOY_TARGET=aws    -e ENABLE_HUB=true  test/main:proto
#   /debug → DEPLOY_TARGET=aws, /hub → 200
docker run --rm -p 3000:3000 -e DEPLOY_TARGET=ncp -e ENABLE_HUB=false test/main:proto
#   /debug → DEPLOY_TARGET=ncp, /hub → 404, 헤더 Hub 탭 사라짐
```
두 실행은 **같은 이미지**다.

**온프렘 청정성 (= 인수 C)**
```bash
docker run --rm --entrypoint sh test/hub:proto -c \
  "grep -r 'CLOUD-ONLY-MARKER' /app/apps/hub/.next || echo 'CLEAN: no cloud code'"
# 기대 출력: CLEAN: no cloud code
```

## Done-when
- 인수 B, C, D 모두 통과.

→ 통과하면 `phases/phase-5-cicd.md`로.
