#!/bin/sh

set -eu

mkdir -p /app/storage/uploads/covers /app/storage/uploads/bundles

echo "Waiting for PostgreSQL and applying schema..."
attempt=1
max_attempts=30

until npx prisma db push --skip-generate; do
  if [ "$attempt" -ge "$max_attempts" ]; then
    echo "Prisma schema sync failed after $max_attempts attempts."
    exit 1
  fi

  echo "Database not ready yet, retrying in 2 seconds... ($attempt/$max_attempts)"
  attempt=$((attempt + 1))
  sleep 2
done

echo "Seeding administrator account..."
npm run prisma:seed

echo "Starting Gauss Skills Hub on port ${PORT:-3100}..."
exec npm run start -- --hostname 0.0.0.0 --port "${PORT:-3100}"
