# reference · 코딩 컨벤션

- 모든 워크스페이스 패키지 이름은 `@test/*`. import는 항상 패키지 이름으로(상대경로로 패키지 경계 넘지 말 것).
- **페이지 로직은 절대 `apps/*/pages`에 직접 작성하지 않는다(re-export만).** 로직은 feature 패키지에.
- `getServerSideProps`/`getStaticProps`는 **named re-export**로만 노출. `export *` 금지.
- 클라이언트에서 환경값은 `process.env.NEXT_PUBLIC_*` 금지 → 반드시 `getEnv()` 경유.
- GHCR 이미지/레포 경로는 **소문자**.
- TypeScript strict. `any`는 `runtime-config`의 `window.__ENV__` 캐스팅 등 불가피한 곳만.
- feature 패키지는 페이지를 subpath로 노출: `"exports": { "./pages/*": "./src/pages/*.tsx" }`.
- Node 22.18.0 이상. `engines` + `engine-strict`로 강제.
