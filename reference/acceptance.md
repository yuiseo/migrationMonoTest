# 전체 인수 검증 (Acceptance)

5대 명제를 명령으로 확인한다. 각 항목은 개별 Phase의 Verify와 연결된다.

## A. 로컬 동시 구동 (Phase 3)
```bash
yarn dev    # main:3000, hub:3001
```
- `localhost:3000` → Cloud 홈 + 헤더 탭
- `localhost:3000/hub` → Hub 홈
- `localhost:3001/hub` → Hub 단독(basePath)
- `/debug` → getEnv() 값 출력

## B. 런타임 config 재빌드 없이 변경 — 명제 4 (Phase 4)
```bash
docker run --rm -p 3000:3000 -e DEPLOY_TARGET=aws    -e ENABLE_HUB=true  test/main:proto
docker run --rm -p 3000:3000 -e DEPLOY_TARGET=ncp -e ENABLE_HUB=false test/main:proto
```
- 같은 이미지. `/debug`의 DEPLOY_TARGET이 각각 aws/ncp.
- false일 때 `/hub` → 404, 헤더 Hub 탭 사라짐.

## C. 온프렘 청정성 — 명제 3 (Phase 4)
```bash
docker run --rm --entrypoint sh test/hub:proto -c \
  "grep -r 'CLOUD-ONLY-MARKER' /app/apps/hub/.next || echo 'CLEAN: no cloud code'"
```
- 기대: `CLEAN: no cloud code`.

## D. 셸 분리 / 이미지 2종 — 명제 2 (Phase 4)
```bash
docker images | grep test   # test/main, test/hub
```

## E. CI 통과 — 명제 5 (Phase 5)
- main push → verify + build-push(matrix 2) green, GHCR 푸시.
- vX.Y.Z 태그 → package-onprem이 `hub-*.tar.gz` 산출.

## F. 온프렘 기동 — (Phase 6)
```bash
cd deploy/onprem && docker compose up -d
curl -s localhost/hub/debug   # 200, DEPLOY_TARGET=onprem
```

## 명제 1 (단일 형상)
- 별도 명령 불필요. 구조적으로: 페이지 로직이 `packages/*-feature`에만 존재하고 `apps/*/pages`는 re-export 한 줄뿐임을 코드 리뷰로 확인.

---

**6개(A~F) + 명제 1 구조 확인이 모두 통과하면 프로토타입 완료.** 이후 본 마이그레이션에서 실제 제품 코드/auth/Orval/백엔드/멀티 레지스트리를 채운다.
