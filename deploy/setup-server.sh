#!/usr/bin/env bash
# Bootstrap an Ubuntu/Debian host for STANS production deployment.
# Usage: sudo DOMAIN=stans.example.com EMAIL=ops@example.com ./deploy/setup-server.sh
set -euo pipefail

DOMAIN="${DOMAIN:-}"
EMAIL="${EMAIL:-}"
STANS_IMAGE="${STANS_IMAGE:-ghcr.io/arnold-rg/stans:latest}"

if [[ "$(id -u)" -ne 0 ]]; then
  echo "Run this script as root (sudo)." >&2
  exit 1
fi

export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get install -y ca-certificates curl gnupg ufw nginx

if ! command -v docker >/dev/null 2>&1; then
  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
  chmod a+r /etc/apt/keyrings/docker.asc
  # shellcheck disable=SC1091
  echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" \
    > /etc/apt/sources.list.d/docker.list
  apt-get update -y
  apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
fi

systemctl enable --now docker

ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

mkdir -p /var/www/certbot

docker pull "$STANS_IMAGE"
docker rm -f stans-app >/dev/null 2>&1 || true
docker run -d \
  --name stans-app \
  --restart=always \
  -p 127.0.0.1:8080:80 \
  "$STANS_IMAGE"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [[ -n "$DOMAIN" ]]; then
  sed "s/DOMAIN/${DOMAIN}/g" "${SCRIPT_DIR}/host-nginx.conf.template" \
    > /etc/nginx/sites-available/stans
  ln -sfn /etc/nginx/sites-available/stans /etc/nginx/sites-enabled/stans
  rm -f /etc/nginx/sites-enabled/default
  nginx -t
  systemctl reload nginx

  apt-get install -y certbot python3-certbot-nginx
  if [[ -n "$EMAIL" ]]; then
    certbot --nginx --non-interactive --agree-tos -m "$EMAIL" -d "$DOMAIN"
  else
    echo "EMAIL is empty. Skipping Certbot. Run: certbot --nginx -d ${DOMAIN}"
  fi
else
  echo "DOMAIN is empty. Container is running on 127.0.0.1:8080. Configure host Nginx + Certbot next."
fi

docker ps --filter name=stans-app
echo "Server bootstrap complete. Firewall allows 22, 80, and 443 only."
