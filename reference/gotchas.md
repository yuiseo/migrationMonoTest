# reference · 알려진 함정 (사전 경고)

1. **`outputFileTracingRoot` 누락** → standalone 컨테이너가 워크스페이스 의존성을 못 찾고 런타임 크래시. 반드시 모노레포 루트로 지정.
2. **`transpilePackages` 누락** → import하는 워크스페이스 패키지를 빠뜨리면 빌드 실패. 앱이 쓰는 `@test/*`를 모두 나열.
3. **`_document`에서 `next/script`(afterInteractive)로 env-config 로드** → 앱 번들보다 늦게 떠서 초기 `window.__ENV__` undefined. 반드시 일반 `<script>`.
4. **hub 앱의 script src를 `/env-config.js`로 둠** → basePath 때문에 404. `/hub/env-config.js` 사용.
5. **dev에서 `env-config.js` 미생성** → `getEnv()` 폴백(DEV_FALLBACK) 없으면 흰 화면. 폴백 필수.
6. **alpine에서 standalone 실행 시 `libc6-compat` 누락** → 네이티브 모듈 로드 에러. Dockerfile base에 `apk add --no-cache libc6-compat`.
7. **Docker build 컨텍스트를 앱 폴더로 잡음** → `turbo prune`이 모노레포 루트를 못 봄. 컨텍스트는 항상 `.`(루트).

추가:
8. **`getServerSideProps`를 `export *`로 재노출** → Next 정적 분석이 못 잡아 SSR 데이터 패칭이 빠짐. named re-export만.
9. **GHCR 이미지 경로 대문자** → 푸시 실패. `${GITHUB_REPOSITORY,,}`로 소문자화.
