#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
RELEASE_ROOT="$ROOT_DIR/release"
DOCKER_RELEASE_ROOT="$RELEASE_ROOT/docker-offline"
APP_IMAGE="gauss-skills-hub-app:offline-amd64"
POSTGRES_IMAGE="postgres:15-alpine"
RELEASE_VERSION="${1:-${RELEASE_VERSION:-$(date +%Y%m%d)}}"
BUNDLE_NAME="gauss-skills-hub-docker-offline-${RELEASE_VERSION}-amd64"
RELEASE_DIR="$DOCKER_RELEASE_ROOT/$BUNDLE_NAME"
ARCHIVE_PATH="$RELEASE_ROOT/${BUNDLE_NAME}.tar.gz"
ARCHIVE_SHA_PATH="$RELEASE_ROOT/${BUNDLE_NAME}.sha256"

mkdir -p "$RELEASE_DIR"
rm -rf "$RELEASE_DIR"/*

echo "Building application image: $APP_IMAGE"
docker build --platform linux/amd64 -t "$APP_IMAGE" "$ROOT_DIR"

echo "Pulling database image: $POSTGRES_IMAGE"
docker pull --platform linux/amd64 "$POSTGRES_IMAGE"

echo "Saving Docker images to $RELEASE_DIR/images.tar"
docker save -o "$RELEASE_DIR/images.tar" "$APP_IMAGE" "$POSTGRES_IMAGE"

cp "$ROOT_DIR/docker-compose.yml" "$RELEASE_DIR/docker-compose.yml"
cp "$ROOT_DIR/.env.docker.example" "$RELEASE_DIR/.env.docker.example"
cp "$ROOT_DIR/README-docker.md" "$RELEASE_DIR/README-docker.md"

cat > "$RELEASE_DIR/RELEASE-METADATA.txt" <<EOF
bundle_name=$BUNDLE_NAME
release_version=$RELEASE_VERSION
app_image=$APP_IMAGE
postgres_image=$POSTGRES_IMAGE
created_at_utc=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
EOF

(
  cd "$RELEASE_DIR"
  sha256sum .env.docker.example README-docker.md docker-compose.yml images.tar RELEASE-METADATA.txt > SHA256SUMS
)

rm -f "$ARCHIVE_PATH"
rm -f "$ARCHIVE_SHA_PATH"
tar -C "$DOCKER_RELEASE_ROOT" -czf "$ARCHIVE_PATH" "$BUNDLE_NAME"
sha256sum "$ARCHIVE_PATH" > "$ARCHIVE_SHA_PATH"

echo
echo "Offline Docker bundle created:"
echo "  $RELEASE_DIR"
echo "  $RELEASE_DIR/images.tar"
echo "  $ARCHIVE_PATH"
echo "  $ARCHIVE_SHA_PATH"
