# Test Web 아키텍처 프로토타입 — 명세 (분할판)

이 폴더는 큰 단일 명세를 **한 번에 한 파일씩 읽도록** 쪼갠 것이다. Claude Code는 전체를 한꺼번에 읽지 말고 아래 순서대로 **필요한 파일만** 열어 작업한다.

## 읽는 순서 / 컨텍스트 규칙

1. 먼저 `00-stack-and-scope.md`, `01-directory-structure.md` 두 개만 읽어 전체 그림을 잡는다.
2. 그 다음 **Phase를 0→6 순서로 하나씩** 진행한다. 각 Phase는 `phases/phase-N-*.md` **한 파일 + 그 파일이 가리키는 `reference/*` 한두 개**만 읽으면 된다.
3. 한 Phase의 **Verify가 통과하기 전에는 다음 Phase 파일을 열지 않는다.**
4. 모든 Phase가 끝나면 `acceptance.md`로 전체 인수 검증을 돌린다.

## 이 프로토타입이 증명할 5대 명제

1. **단일 형상** — 제품 코드는 `packages/`에 한 벌만 존재.
2. **셸 분리** — 같은 코드로 `apps/main`·`apps/hub` 두 산출물.
3. **온프렘 청정성** — `hub` 이미지에 cloud 코드가 물리적으로 없음.
4. **빌드 1회 + 런타임 주입** — 같은 이미지를 환경변수만 바꿔 다른 환경으로 기동(재빌드 X).
5. **CI/CD** — GitHub Actions가 두 이미지 빌드·푸시 + 릴리스 태그 시 온프렘 tarball 산출.

## 파일 맵

| 파일 | 내용 | 언제 읽나 |
|---|---|---|
| `00-stack-and-scope.md` | 기술스택(Node 22.18+), 범위 in/out | 시작 시 |
| `01-directory-structure.md` | 목표 디렉터리 트리 | 시작 시 |
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
| `acceptance.md` | 전체 인수 검증 A~F | 마지막 |

> 이 문서는 **프로토타입 스펙**이다. 제품 기능은 만들지 않는다. 각 페이지는 "이 라우트가 어느 이미지에서 사는가"와 "런타임 config가 흘러드는가"만 증명하는 최소 플레이스홀더다.
