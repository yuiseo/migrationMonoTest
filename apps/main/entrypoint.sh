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
