# Phase 6 · 온프렘 패키징 (docker-compose)

**목표**: 고객사가 받아서 `docker compose up`만 하면 Hub가 뜨는 실행 묶음을 만든다. (프로토타입은 web만 실제, api/db는 placeholder.)

## `deploy/onprem/docker-compose.yml`
```yaml
services:
  hub-web:
    image: ghcr.io/OWNER/REPO/hub:1.0.0   # 릴리스 시 태그 갱신
    environment:
      DEPLOY_TARGET: onprem
      API_BASE_URL: http://hub-api:8080
      AUTH_BASE_URL: http://hub-api:8080/auth
      ENABLE_HUB: "true"
    ports: ["80:3000"]
    depends_on: [hub-api]
    restart: unless-stopped

  hub-api:                  # 프로토타입 placeholder
    image: hashicorp/http-echo
    command: ["-text=hub-api placeholder"]
    restart: unless-stopped

  db:                             # 프로토타입 placeholder
    image: postgres:16
    environment:
      POSTGRES_PASSWORD: changeme
    volumes: ["hub-data:/var/lib/postgresql/data"]
    restart: unless-stopped

volumes:
  hub-data:
```

## `deploy/onprem/.env.example`
```
# 고객사가 채우는 값 (compose에서 env_file로 연결하거나 환경변수로 주입)
API_BASE_URL=http://hub-api:8080
AUTH_BASE_URL=http://hub-api:8080/auth
DEPLOY_TARGET=onprem
ENABLE_HUB=true
```

## 에어갭(폐쇄망) 납품 흐름
CI(`package-onprem`)가 만든 tarball을 고객사가 인터넷 없이 적재:
```bash
docker load < hub-1.0.0.tar.gz
docker compose up -d
```

## Verify (= 인수 F)
```bash
cd deploy/onprem
# 로컬에서 검증 시 image를 test/hub:proto로 바꿔도 됨
docker compose up -d
curl -s localhost/hub/debug    # 200, DEPLOY_TARGET=onprem
docker compose down
```

## Done-when
- compose로 hub-web이 떠서 `/hub/debug`가 onprem 값으로 응답.

→ 끝나면 `../acceptance.md`로 전체 인수 검증.
