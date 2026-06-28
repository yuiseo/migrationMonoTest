# Phase 5 · GitHub Actions (GHCR)

**목표**: 한 파이프라인에서 두 이미지를 빌드·푸시(GHCR)하고, 릴리스 태그 시 온프렘 tarball을 산출한다.
**참조**: `reference/gotchas.md`(9번 소문자).

GHCR는 `GITHUB_TOKEN`으로 인증되어 외부 시크릿 없이 동작한다.

## `.github/workflows/build.yml`
```yaml
name: build-and-push
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
      - run: yarn turbo run lint type-check build --cache-dir=.turbo

  build-push:
    needs: verify
    runs-on: ubuntu-latest
    strategy:
      fail-fast: false
      matrix: { app: [main, hub] }
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
          build-args: APP=${{ matrix.app }}
          push: true
          tags: |
            ${{ env.REGISTRY }}/${{ steps.meta.outputs.repo }}/${{ matrix.app }}:${{ steps.meta.outputs.version }}
            ${{ env.REGISTRY }}/${{ steps.meta.outputs.repo }}/${{ matrix.app }}:latest
          cache-from: type=gha,scope=${{ matrix.app }}
          cache-to: type=gha,mode=max,scope=${{ matrix.app }}

  package-onprem:
    needs: build-push
    if: startsWith(github.ref, 'refs/tags/')
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
- `turbo prune` + `type=gha` 캐시 + `scope=${{ matrix.app }}`로, 한 제품만 고쳐도 다른 이미지 빌드는 캐시 통과.
- 온프렘 tarball은 **릴리스 태그일 때만** 산출.
- 본 마이그레이션에서 ECR/NCP로 보낼 땐 로그인 step과 태그를 추가(같은 `main` 산출물에 태그 여러 개 달아 멀티 푸시).

## Verify (= 인수 E)
- `main` 브랜치 push → `verify` + `build-push`(2개) green, GHCR에 `main`/`hub` 푸시.
- `vX.Y.Z` 태그 push → `package-onprem`이 `hub-*.tar.gz` 아티팩트 생성.

→ 통과하면 `phases/phase-6-onprem.md`로.
