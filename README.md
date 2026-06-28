# test-web — 단일 형상, 다중 환경 배포 아키텍처

> 코드는 모노레포에 한 벌(단일 형상)로 두고, 제품별 이미지 2종만 빌드해, 환경 차이(AWS·NCP·온프렘)는 **런타임 config**로 분기한다.

---

## 문제: 빌드 타임 config가 환경마다 이미지를 갈라놓는다

배포 환경이 늘어날수록 이미지가 환경 수만큼 갈라지는 근본 원인은 **"어디에 배포하는가(환경)"와 "무엇을 배포하는가(제품)"를 같은 레이어(빌드 타임 `.env`)에서 처리**하기 때문이다.

```
┌─────────────────────────────────────────┐  ┌─────────────────────────────────────────┐
│             현재 (AS-IS)                 │  │             목표 (TO-BE)                 │
│                                         │  │                                         │
│  단일 프로젝트                            │  │  모노레포 (단일 형상)                     │
│  Cloud + Hub (URL prefix) · 서버 1개    │  │  코드는 packages/*에 한 벌               │
│                │                        │  │         │              │                │
│                ▼                        │  │         ▼              ▼                │
│  .env boolean → 빌드 타임에 이미지에 박힘  │  │   main 이미지     hub 이미지             │
│  환경 설정 = 빌드 결과물                  │  │   cloud + hub     hub 단독              │
│     │          │          │             │  │         │              │                │
│     ▼          ▼          ▼             │  │         └──────┬───────┘                │
│  AWS 이미지  NCP 이미지  환경 N 이미지    │  │                ▼                        │
│  빌드 #1    빌드 #2    빌드 #N           │  │       런타임 config 주입                  │
│                                         │  │  같은 이미지 · 환경변수만 다르게 주입       │
└─────────────────────────────────────────┘  └─────────────────────────────────────────┘
```

**AS-IS의 문제점:**
- 형상(소스)은 하나인데 이미지는 환경 수만큼 갈라진다
- 온프렘에 Hub만 배포해야 하는데 cloud 코드까지 이미지에 포함된다
- 새 배포 환경이 생길 때마다 빌드 분기가 추가된다

---

## 핵심 원칙: 두 축을 분리한다

| 축 | 결정 시점 | 내용 |
|---|---|---|
| **제품 정체성** | 빌드 타임 | Hub인가 Cloud인가 — 어떤 코드가 번들에 포함되는가 |
| **배포 환경** | 런타임 | AWS·NCP·온프렘 — API 주소, 기능 토글, auth 엔드포인트 |

→ **Build once, configure at runtime.** 이미지는 제품 단위로 한 번 빌드하고, 환경 설정은 컨테이너 시작 시 주입한다.

---

## 목표 아키텍처

```
                    ┌─────────────────────────────────────────────────────┐
                    │              모노레포 (단일 형상)                      │
                    │           packages/* · 코드 1벌 · 공유 소스           │
                    └────────────────────┬────────────────────────────────┘
                                         │
                    ┌────────────────────┴────────────────────┐
                    │                                         │
                    ▼                                         ▼
         ┌──────────────────────┐               ┌──────────────────────┐
         │      apps/main       │               │      apps/hub        │
         │  cloud + hub 합본    │               │     hub 단독         │
         └──────────┬───────────┘               └──────────┬───────────┘
                    │                                       │
         ┌──────────┴──────────┐                           │
         │ ENABLE_HUB=true     │ ENABLE_HUB=false          │
         ▼                     ▼                           ▼
┌─────────────────┐  ┌─────────────────┐       ┌─────────────────────┐
│      AWS        │  │      NCP        │       │   고객사 온프렘      │
│  서버 1개       │  │  공공클라우드   │       │     Hub 전용        │
│  두 제품 노출   │  │  Cloud만        │       │                     │
└─────────────────┘  └─────────────────┘       └─────────────────────┘

  [main 이미지 계열]  [main 이미지 계열]         [hub 이미지 계열]

                   모든 환경 = 서버 1개 · 런타임 config 주입
```

**모든 환경 = 서버 1개 · 런타임 config 주입**

### 배포 매트릭스

| 환경 | 이미지 | 노출 제품 | 핵심 런타임 설정 |
|---|---|---|---|
| AWS | `main` | Cloud + Hub | `ENABLE_HUB=true` |
| NCP (공공클라우드) | `main` | Cloud | `ENABLE_HUB=false` |
| 고객사 온프렘 | `hub` | Hub | Hub 전용 이미지 |

이미지 **2종 × 런타임 config**로 모든 환경을 커버한다. 배포 대상이 늘어도 이미지는 늘어나지 않는다.

---

## 아키텍처 레이어

### 1. `packages/*` — 코드가 사는 곳 (단일 소스)
제품 페이지·로직·공용 컴포넌트는 전부 여기 한 번만 존재한다. 수정은 항상 이 레이어에서만 발생하고, 두 앱 셸에 자동 반영된다.

### 2. `apps/*` — 조합만 하는 셸
페이지 파일은 패키지를 가리키는 한 줄짜리 re-export다. 코드 중복이 없다.

```tsx
// apps/main/pages/hub/index.tsx
export { default, getServerSideProps } from '@test/hub-feature/pages/index';
```

- `apps/main`: cloud-feature + hub-feature 마운트 → AWS, NCP 배포
- `apps/hub`: hub-feature만 마운트 → 온프렘 배포 (cloud 코드는 처음부터 없음)

### 3. 이미지 — 셸별로 빌드
단일 `Dockerfile`에서 `--build-arg APP=main|hub`으로 두 이미지를 산출한다. `turbo prune`으로 해당 앱의 의존성만 잘라 standalone 빌드한다.

### 4. 런타임 config 주입

```
컨테이너 시작
     │
     ▼
entrypoint.sh
 환경변수 수신 (API_BASE_URL, ENABLE_HUB 등)
     │
     ▼
env-config.js 생성
 window.__ENV__ = { API_BASE_URL: "...", ... }
     │
     ▼
_document.tsx <script src="/env-config.js">
     │
     ▼
getEnv("KEY")
 서버: process.env.KEY
 클라이언트: window.__ENV__.KEY
```

`NEXT_PUBLIC_*`는 빌드 타임에 인라인되어 런타임에 변경 불가능하다. `getEnv()`가 이 한계를 우회한다.

---

## 온프렘 청정성 (Hub 이미지)

`apps/hub`는 `hub-feature`만 import하므로, hub 이미지에는 cloud 코드가 **빌드 단계부터 포함되지 않는다.** "제거했다"가 아니라 "원래 없다"는 점에서, 온프렘처럼 감사(audit) 대상이 되는 환경에서 더 강한 보장이 된다.

---

## 빌드 & CI

```
build.yml (main 브랜치 push)          build-onprem.yml (릴리스 태그 push)
─────────────────────────────         ──────────────────────────────────────
  verify                                verify
  type-check + build (@test/main)       type-check + build (@test/hub)
       │                                     │
       ▼                                     ▼
  build-push                            build-push
  test/main 이미지 → GHCR               test/hub 이미지 → GHCR
                                             │
                                             ▼
                                        package-onprem
                                        이미지 tarball 아티팩트 산출
                                        (폐쇄망: docker load로 적재)
```

- cloud와 onprem 워크플로우를 **분리** — 트리거·산출물·의존 패키지가 다르기 때문
- 온프렘용 tarball: 폐쇄망 환경에서 `docker load`로 적재 가능

---

## 디렉터리 구조

```
test-web/
├─ apps/
│  ├─ main/          # cloud + hub → AWS, NCP
│  └─ hub/           # hub 단독 → 온프렘
├─ packages/
│  ├─ cloud-feature/ # Cloud 페이지/로직
│  ├─ hub-feature/   # Hub 페이지/로직
│  ├─ ui/            # 공용 컴포넌트
│  ├─ auth/          # 인증
│  ├─ api-client/    # API 클라이언트
│  └─ shared/        # 런타임 config (getEnv)
├─ deploy/onprem/
│  ├─ docker-compose.yml
│  └─ nginx.conf
├─ Dockerfile        # ARG APP=main|hub
└─ .github/workflows/
   ├─ build.yml          # cloud CI
   └─ build-onprem.yml   # onprem CI
```

---

## 마이그레이션 전략 (점진적)

1. **런타임 config 도입** — 빌드 타임 config를 런타임 주입으로 교체. "환경마다 이미지가 갈라지는" 문제가 사라진다.
2. **모노레포 재배치** — `apps/`, `packages/` 구조 도입, 공유 코드를 패키지로 추출.
3. **빌드 타깃 분리** — `apps/main`/`apps/hub`로 이미지 산출 분리.

---

## 프로토타입 명세 읽는 순서

이 레포는 위 아키텍처의 프로토타입 검증용이다. Claude Code 작업 시 아래 순서로 읽는다.

| 파일 | 내용 | 언제 읽나 |
|---|---|---|
| `reference/00-stack-and-scope.md` | 기술스택(Node 22.18+), 범위 in/out | 시작 시 |
| `reference/01-directory-structure.md` | 목표 디렉터리 트리 | 시작 시 |
| `phases/phase-0-scaffold.md` | 모노레포 루트 스캐폴드 | Phase 0 |
| `phases/phase-1-shared-ui.md` | `shared`, `ui`, `auth`, `api-client` | Phase 1 |
| `phases/phase-2-feature-packages.md` | `cloud-feature`, `hub-feature` + 게이팅 | Phase 2 |
| `phases/phase-3-app-shells.md` | `apps/main`, `apps/hub` 셸 | Phase 3 |
| `phases/phase-4-docker.md` | Dockerfile, entrypoint | Phase 4 |
| `phases/phase-5-cicd.md` | GitHub Actions | Phase 5 |
| `phases/phase-6-onprem.md` | 온프렘 docker-compose | Phase 6 |
| `reference/runtime-config.md` | 런타임 config 메커니즘 상세 | Phase 1·3에서 참조 |
| `reference/conventions.md` | 코딩 컨벤션 | 전 단계 공통 |
| `reference/gotchas.md` | 틀리기 쉬운 7가지 | Phase 3·4에서 참조 |
| `reference/acceptance.md` | 전체 인수 검증 A~F | 마지막 |
