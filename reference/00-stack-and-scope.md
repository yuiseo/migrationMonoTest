# 00 · 기술 스택 & 범위

## 기술 스택 (버전 고정)

| 항목 | 버전/선택 |
|---|---|
| Node | **22.18.0 이상** (LTS 22.x) |
| 패키지 매니저 | **yarn 1.22.x (classic)** · 워크스페이스 |
| 모노레포 빌드 | turbo ^2 |
| 프레임워크 | Next.js 15 (**Pages Router**) |
| 언어 | TypeScript ^5.5 (strict) |
| 상태/검증 | React Query, Jotai, Zod (shared에서 Provider만 배선) |
| 컨테이너 | Docker (multi-stage, `output: 'standalone'`) |
| CI | GitHub Actions, 레지스트리 = GHCR(`ghcr.io`) |

### Node 22.18.0 "이상" 강제
- 루트 `package.json`에 `"engines": { "node": ">=22.18.0" }`.
- yarn은 `.yarnrc`에 `engine-strict true` → 미달 버전에서 install 실패.
- `setup-node: '22'`, `node:22-alpine`은 최신 22.x(>22.18.0)를 받으므로 floor 자연 충족.
- **이번 의도는 "이상"이므로 특정 버전으로 핀하지 않는다.** (고정이 필요해지면 `.nvmrc`=`22.18.0`, `node:22.18.0-alpine`, CI=`'22.18.0'`.)

### Yarn Berry로 갈 경우
`.yarnrc.yml`에 `nodeLinker: node-modules`를 두고, 문서 내 모든 `yarn install --frozen-lockfile`을 `yarn install --immutable`로 치환. 그 외 동일. (기본은 Yarn Classic 1.x 기준)

---

## 범위

### In scope (만드는 것)
- yarn workspaces 모노레포 골격 (turbo)
- 공유 패키지: `shared`, `ui`, `cloud-feature`, `hub-feature`
- 앱 셸 2개: `apps/main`(cloud+hub), `apps/hub`(hub 단독)
- re-export 셸 패턴(페이지 로직은 패키지에만)
- 런타임 config 주입(`env-config.js` + `getEnv()`)
- `ENABLE_HUB` 플래그 게이팅
- 단일 `Dockerfile`(`ARG APP`)
- GitHub Actions(GHCR 푸시 + 온프렘 tarball)
- 온프렘 `docker-compose.yml`

### Out of scope (만들지 않는 것)
- 실제 인증/회원 로직 (`auth`는 빈 스텁)
- Orval 실제 API 클라이언트 (`api-client`는 `fetch` 래퍼 1개)
- 실제 백엔드/DB (compose의 api/db는 placeholder 이미지)
- 실제 제품 UI/기능
- AWS ALB/리버스 프록시, k8s/Helm
- 멀티 레지스트리(ECR/NCP) — 프로토타입은 GHCR 단일로 충분
