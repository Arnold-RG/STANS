# STANS DevOps Guide

This repository packages the Smart Traffic-Aware Navigation System as a production-ready static site: a multi-stage Docker image, GitHub Actions CI/CD, host-side TLS, and optional infrastructure automation.

## Architecture

```
Browser
  -> Host Nginx :443 (Let's Encrypt)
  -> STANS container :80 (Alpine Nginx + React build)
```

TLS terminates on the host. The container only serves HTTP on port 80 and is bound to loopback in production.

## Part 1: Local app

```bash
npm install
npm run dev
```

The Vite dev server listens on port 8080. Production build:

```bash
npm run build
```

## Part 2: Containerization

Multi-stage `Dockerfile`:

1. `node:22-alpine` installs dependencies and runs `npm run build`
2. `nginx:1.27-alpine` copies only `/app/dist` and the SPA Nginx config

The final image has no Node runtime and no development dependencies.

```bash
docker build -t stans-app .
docker run --restart=always -p 8080:80 stans-app
```

Open http://localhost:8080. Client-side routes such as `/classic` and `/docs` are rewritten to `index.html`. Health endpoint: http://localhost:8080/health

Compose equivalent:

```bash
docker compose up --build
```

## Part 3: CI/CD

Workflow: `.github/workflows/deploy.yml`

On every push or pull request to `main`:

1. Install dependencies and verify `npm run build`
2. On push to `main`, build the image and push it to GitHub Container Registry
3. If SSH secrets exist, pull the new image on the server and recreate the container

### GitHub Secrets

| Secret | Required | Purpose |
| --- | --- | --- |
| `GITHUB_TOKEN` | Automatic | Push to GHCR |
| `DOCKERHUB_USERNAME` | Optional | Also push to Docker Hub |
| `DOCKERHUB_TOKEN` | Optional | Docker Hub access token |
| `SSH_HOST` | Optional | Production server IP or hostname |
| `SSH_USER` | Optional | SSH username |
| `SSH_PRIVATE_KEY` | Optional | Private key for deploy |
| `SSH_PORT` | Optional | Defaults to 22 |
| `GHCR_TOKEN` | Optional | PAT with `read:packages` for private pulls |

Create secrets:

```bash
gh secret set DOCKERHUB_USERNAME
gh secret set DOCKERHUB_TOKEN
gh secret set SSH_HOST
gh secret set SSH_USER
gh secret set SSH_PRIVATE_KEY < ~/.ssh/stans_deploy
```

After the first GHCR push, make the package public so the server can pull without a token:

```bash
gh api --method PATCH -H "Accept: application/vnd.github+json" \
  /user/packages/container/stans/visibility \
  -f visibility=public
```

## Part 4: Production server

On Ubuntu:

```bash
sudo DOMAIN=stans.example.com EMAIL=you@example.com ./deploy/setup-server.sh
```

The script:

- Installs Docker and host Nginx
- Opens UFW ports 22, 80, and 443 only
- Runs `stans-app` with `--restart=always` on `127.0.0.1:8080`
- Issues a Let's Encrypt certificate with Certbot when `DOMAIN` and `EMAIL` are set

Manual equivalent:

```bash
docker pull ghcr.io/arnold-rg/stans:latest
docker run -d --name stans-app --restart=always -p 127.0.0.1:8080:80 ghcr.io/arnold-rg/stans:latest
sudo certbot --nginx -d stans.example.com
sudo ufw allow 22 && sudo ufw allow 80 && sudo ufw allow 443 && sudo ufw enable
```

## Stretch goals

### Monitoring and logging

```bash
docker compose -f docker-compose.monitoring.yml up -d
```

- Prometheus: http://127.0.0.1:9090
- Grafana: http://127.0.0.1:3000
- Loki + Promtail collect container logs
- cAdvisor and Node Exporter expose container and host metrics

Change the Grafana password with `GRAFANA_ADMIN_PASSWORD`.

### Health checks

The image includes a Docker `HEALTHCHECK` against `/health`. Kubernetes manifests add liveness and readiness probes. Failed containers restart because of `--restart=always`.

### Load balancing

```bash
docker compose -f docker-compose.ha.yml up --build
```

Two app replicas sit behind Nginx.

### Infrastructure as Code

Terraform (AWS EC2 + security group):

```bash
cd infra/terraform
cp terraform.tfvars.example terraform.tfvars
terraform init
terraform plan
terraform apply
```

Ansible:

```bash
cp infra/ansible/inventory.example.ini infra/ansible/inventory.ini
ansible-playbook -i infra/ansible/inventory.ini infra/ansible/playbook.yml
```

### Kubernetes

```bash
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/
```

This deploys two replicas, a ClusterIP service, TLS ingress, and an HPA.

## Security defaults

- Alpine-based, non-root Nginx process
- Host firewall limited to 22/80/443
- TLS on the host, HTTP-only container
- Security headers on both container and host Nginx
- Image SBOM and provenance generated in CI
- Trivy, npm audit, Gitleaks, Checkov, and OpenSSF Scorecard run as extra workflows
