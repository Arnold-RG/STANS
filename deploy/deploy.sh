#!/usr/bin/env bash
# Pull the latest STANS image and replace the running container.
# Usage: STANS_IMAGE=ghcr.io/arnold-rg/stans:latest ./deploy/deploy.sh
set -euo pipefail

STANS_IMAGE="${STANS_IMAGE:-ghcr.io/arnold-rg/stans:latest}"

docker pull "$STANS_IMAGE"
docker stop stans-app >/dev/null 2>&1 || true
docker rm stans-app >/dev/null 2>&1 || true
docker run -d \
  --name stans-app \
  --restart=always \
  --health-cmd="wget -q --spider http://127.0.0.1/health || exit 1" \
  --health-interval=30s \
  --health-timeout=5s \
  --health-retries=3 \
  -p 127.0.0.1:8080:80 \
  "$STANS_IMAGE"

docker image prune -f
docker ps --filter name=stans-app
echo "STANS is running at http://127.0.0.1:8080"
