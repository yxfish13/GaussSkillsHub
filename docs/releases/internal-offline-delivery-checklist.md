# Internal Offline Delivery Checklist

## Before Packaging

- Confirm `main` contains the intended release commit
- Run:
  - `npm test`
  - `npm run lint`
  - `npm run build`
  - `docker compose --env-file .env.docker.example config`
- Build the offline bundle:

```bash
bash scripts/build-offline-docker-bundle.sh <version>
```

## Files To Hand Off

- `release/gauss-skills-hub-docker-offline-<version>-amd64.tar.gz`
- `release/gauss-skills-hub-docker-offline-<version>-amd64.sha256`

Optional:

- `release/docker-offline/gauss-skills-hub-docker-offline-<version>-amd64/`

## What The Receiver Must Verify

```bash
sha256sum -c gauss-skills-hub-docker-offline-<version>-amd64.sha256
```

## What The Receiver Must Configure

- `POSTGRES_PASSWORD`
- `ADMIN_USERNAME`
- `ADMIN_PASSWORD`
- `AUTH_SECRET`
- `APP_PORT` if `3100` is occupied

## Internal Deployment Commands

```bash
tar -xzf gauss-skills-hub-docker-offline-<version>-amd64.tar.gz
cd gauss-skills-hub-docker-offline-<version>-amd64
docker load -i images.tar
cp .env.docker.example .env
docker compose up -d
docker compose logs -f app
```

## Acceptance Check

- `docker compose ps` shows `app` and `postgres` as running
- `curl -I http://127.0.0.1:<APP_PORT>/` returns `200`
- `curl -I http://127.0.0.1:<APP_PORT>/admin/login` returns `200`
- admin can log in with the configured credentials

## Post-Deployment Reminder

- Docker volumes hold the real data:
  - database volume
  - uploads volume
- Do not remove volumes during routine restart unless you explicitly want to destroy data
