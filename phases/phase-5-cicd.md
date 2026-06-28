# Phase 5 · GitHub Actions (GHCR)

**목표**: cloud(main)와 onprem(hub) 빌드를 **별도 워크플로우**로 분리하여 독립적으로 운영한다.
**참조**: `reference/gotchas.md`(9번 소문자).

GHCR는 `GITHUB_TOKEN`으로 인증되어 외부 시크릿 없이 동작한다.

## 워크플로우 분리 이유

cloud와 onprem은 포함하는 패키지가 다르기 때문에 빌드 단위도 분리한다.

| 워크플로우 | 대상 이미지 | 트리거 | 포함 패키지 |
|---|---|---|---|
| `build.yml` | `main` | main 브랜치 push, 태그 | cloud-feature + hub-feature |
| `build-onprem.yml` | `hub` | 태그, 수동(workflow_dispatch) | hub-feature **만** |

## `.github/workflows/build.yml` (cloud)

```yaml
name: build-cloud
on:
  push:
    branches: [main]
    tags: ['v*.*.*']
  workflow_dispatch:
permissions:
  contents: read
  packages: write
env:
  NODE_VERSION: '22'
  REGISTRY: ghcr.io

jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '22', cache: yarn }
      - run: yarn install --frozen-lockfile
      - uses: actions/cache@v4
        with: { path: .turbo, key: turbo-${{ github.sha }}, restore-keys: turbo- }
      - run: yarn turbo run lint type-check build --filter=@test/main --cache-dir=.turbo

  build-push:
    needs: verify
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - id: meta
        run: |
          if [[ "${GITHUB_REF}" == refs/tags/* ]]; then V="${GITHUB_REF#refs/tags/}";
          else V="edge-${GITHUB_SHA::7}"; fi
          echo "version=${V}" >> "$GITHUB_OUTPUT"
          echo "repo=${GITHUB_REPOSITORY,,}" >> "$GITHUB_OUTPUT"
      - uses: docker/setup-buildx-action@v3
      - uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      - uses: docker/build-push-action@v6
        with:
          context: .
          file: ./Dockerfile
          build-args: APP=main
          push: true
          tags: |
            ${{ env.REGISTRY }}/${{ steps.meta.outputs.repo }}/main:${{ steps.meta.outputs.version }}
            ${{ env.REGISTRY }}/${{ steps.meta.outputs.repo }}/main:latest
          cache-from: type=gha,scope=main
          cache-to: type=gha,mode=max,scope=main
```

## `.github/workflows/build-onprem.yml` (onprem)

```yaml
name: build-onprem
on:
  push:
    tags: ['v*.*.*']
  workflow_dispatch:
permissions:
  contents: read
  packages: write
env:
  NODE_VERSION: '22'
  REGISTRY: ghcr.io

jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '22', cache: yarn }
      - run: yarn install --frozen-lockfile
      - uses: actions/cache@v4
        with: { path: .turbo, key: turbo-onprem-${{ github.sha }}, restore-keys: turbo-onprem- }
      - run: yarn turbo run lint type-check build --filter=@test/hub --cache-dir=.turbo

  build-push:
    needs: verify
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - id: meta
        run: |
          V="${GITHUB_REF#refs/tags/}"
          echo "version=${V}" >> "$GITHUB_OUTPUT"
          echo "repo=${GITHUB_REPOSITORY,,}" >> "$GITHUB_OUTPUT"
      - uses: docker/setup-buildx-action@v3
      - uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      - uses: docker/build-push-action@v6
        with:
          context: .
          file: ./Dockerfile
          build-args: APP=hub
          push: true
          tags: |
            ${{ env.REGISTRY }}/${{ steps.meta.outputs.repo }}/hub:${{ steps.meta.outputs.version }}
            ${{ env.REGISTRY }}/${{ steps.meta.outputs.repo }}/hub:latest
          cache-from: type=gha,scope=hub
          cache-to: type=gha,mode=max,scope=hub

  package-onprem:
    needs: build-push
    runs-on: ubuntu-latest
    permissions: { contents: read, packages: read }
    steps:
      - uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      - run: |
          V="${GITHUB_REF#refs/tags/}"; REPO="${GITHUB_REPOSITORY,,}"
          IMG="ghcr.io/${REPO}/hub:${V}"
          docker pull "$IMG"
          docker save "$IMG" | gzip > "hub-${V}.tar.gz"
          echo "VERSION=${V}" >> "$GITHUB_ENV"
      - uses: actions/upload-artifact@v4
        with:
          name: hub-onprem-${{ env.VERSION }}
          path: hub-*.tar.gz
          retention-days: 30
```

## 설계 포인트
- cloud는 매 push마다, onprem은 릴리스 태그 또는 수동으로만 빌드.
- 각 워크플로우의 `verify`는 해당 앱(`--filter`)만 검증해 불필요한 빌드를 제거.
- `type=gha` 캐시를 `scope`로 분리해 두 워크플로우가 캐시를 공유하지 않음.
- onprem tarball은 릴리스 태그일 때만 산출.

## Verify (= 인수 E)
- `main` 브랜치 push → `build-cloud` 워크플로우 green, GHCR에 `main` 이미지 푸시.
- `vX.Y.Z` 태그 push → `build-cloud` + `build-onprem` 모두 green, `hub-*.tar.gz` 아티팩트 생성.

→ 통과하면 `phases/phase-6-onprem.md`로.
