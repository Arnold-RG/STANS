#!/bin/bash
set -euxo pipefail

export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get install -y ca-certificates curl gnupg ufw nginx

install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
chmod a+r /etc/apt/keyrings/docker.asc
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" \
  > /etc/apt/sources.list.d/docker.list
apt-get update -y
apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
systemctl enable --now docker
usermod -aG docker ubuntu

ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

docker pull ${container_image}
docker rm -f stans-app || true
docker run -d --name stans-app --restart=always -p 127.0.0.1:8080:80 ${container_image}

DOMAIN="${domain}"
EMAIL="${email}"

if [ -n "$DOMAIN" ]; then
  cat >/etc/nginx/sites-available/stans <<NGINX
upstream stans_app { server 127.0.0.1:8080; }
server {
    listen 80;
    server_name $DOMAIN;
    location / { proxy_pass http://stans_app; proxy_set_header Host \$host; proxy_set_header X-Forwarded-Proto \$scheme; }
}
NGINX
  ln -sfn /etc/nginx/sites-available/stans /etc/nginx/sites-enabled/stans
  rm -f /etc/nginx/sites-enabled/default
  nginx -t && systemctl reload nginx

  apt-get install -y certbot python3-certbot-nginx
  if [ -n "$EMAIL" ]; then
    certbot --nginx --non-interactive --agree-tos -m "$EMAIL" -d "$DOMAIN" || true
  fi
fi
