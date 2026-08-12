#!/usr/bin/env bash
# Per-boot runtime reconciliation for Papermark (Cloud Agent `start` phase).
# Starts PostgreSQL, applies pending migrations, and seeds the admin user(s).
# Everything here is idempotent and returns once the database is ready.
set -euo pipefail

cd "$(dirname "$0")/.."

log() { echo "[start] $*"; }

PG_VERSION="$(ls /usr/lib/postgresql | sort -V | tail -1)"

log "Starting PostgreSQL ${PG_VERSION}..."
sudo pg_ctlcluster "${PG_VERSION}" main start >/dev/null 2>&1 || true

log "Waiting for PostgreSQL to accept connections..."
for _ in $(seq 1 60); do
  if sudo -u postgres pg_isready -q; then break; fi
  sleep 1
done
sudo -u postgres pg_isready

log "Applying database migrations..."
npx prisma migrate deploy

log "Seeding administrator user(s)..."
npx tsx .cursor/seed-admin-users.ts

log "Start complete. Dev server is launched via the 'dev' terminal."
