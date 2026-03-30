# Gauss Skills Hub Release Template

## Summary

- Release version:
- Commit:
- Date:
- Maintainer:

## Included Changes

- Public skill visibility controls:
  - public users can hide a skill from the detail page
  - admin can hide, restore, and delete a skill
- Offline Docker deployment:
  - amd64 application image
  - PostgreSQL image
  - `docker-compose.yml`
  - `.env.docker.example`
  - offline bundle build script

## Verification

- `npm test`
- `npm run lint`
- `npm run build`
- `npm run test:e2e -- tests/e2e/public-release.spec.ts tests/e2e/community-catalogue.spec.ts tests/e2e/skill-visibility-controls.spec.ts`
- `docker compose --env-file .env.docker.example config`
- `bash scripts/build-offline-docker-bundle.sh <version>`

## Offline Artifacts

- Offline bundle:
- SHA256:
- Docker bundle directory:

## Deployment Notes

- Target architecture: `amd64/x86_64`
- Requires: `Docker Engine` + `docker compose`
- Does not require standalone `Node.js` or `PostgreSQL`
- Update `.env` before first boot:
  - `POSTGRES_PASSWORD`
  - `ADMIN_PASSWORD`
  - `AUTH_SECRET`

## Internal Deployment Steps

```bash
tar -xzf gauss-skills-hub-docker-offline-<version>-amd64.tar.gz
cd gauss-skills-hub-docker-offline-<version>-amd64
docker load -i images.tar
cp .env.docker.example .env
docker compose up -d
docker compose logs -f app
```

## Rollback Notes

- Restore the previous offline bundle
- Reuse the existing Docker volumes if data should be preserved
- If a full rollback is needed, stop the current stack before loading the previous images
