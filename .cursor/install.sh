#!/usr/bin/env bash
# Idempotent environment bootstrap for Papermark (Cloud Agent `install` phase).
# Prepares durable state: PostgreSQL system package, the local role/database,
# node dependencies, and a local-dev .env. Runtime reconciliation (starting the
# database, applying migrations, seeding the admin user) lives in start.sh.
set -euo pipefail

cd "$(dirname "$0")/.."

log() { echo "[install] $*"; }

# --- PostgreSQL (stable system dependency) ---------------------------------
if ! command -v pg_ctlcluster >/dev/null 2>&1; then
  log "Installing PostgreSQL..."
  sudo apt-get update -y
  sudo DEBIAN_FRONTEND=noninteractive apt-get install -y postgresql postgresql-contrib
fi

PG_VERSION="$(ls /usr/lib/postgresql | sort -V | tail -1)"
log "PostgreSQL version: ${PG_VERSION}"

# Bring the cluster up briefly so we can provision the role and database. The
# process itself is not expected to survive into a later boot (start.sh handles
# that); only the on-disk role/database are durable.
sudo pg_ctlcluster "${PG_VERSION}" main start >/dev/null 2>&1 || true
for _ in $(seq 1 30); do
  if sudo -u postgres pg_isready -q; then break; fi
  sleep 1
done

if ! sudo -u postgres psql -tAc "SELECT 1 FROM pg_roles WHERE rolname='papermark'" | grep -q 1; then
  log "Creating 'papermark' role..."
  sudo -u postgres psql -c "CREATE USER papermark WITH PASSWORD 'papermark' SUPERUSER;"
fi
if ! sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname='papermark'" | grep -q 1; then
  log "Creating 'papermark' database..."
  sudo -u postgres psql -c "CREATE DATABASE papermark OWNER papermark;"
fi

# --- Node dependencies (postinstall runs `prisma generate`) ----------------
log "Installing npm dependencies..."
npm ci

# --- Local-dev .env (only if absent) ---------------------------------------
# These are non-production, throwaway local values. The admin password hash is
# generated here (bcrypt) rather than committed. Dollar signs in the hash are
# escaped so Next.js's dotenv expansion preserves the literal value.
if [ ! -f .env ]; then
  log "Writing local-dev .env ..."
  DEV_ADMIN_EMAIL="${DEV_ADMIN_EMAIL:-admin@example.com}"
  DEV_ADMIN_PASSWORD="${DEV_ADMIN_PASSWORD:-Papermark123!}"
  ADMIN_HASH="$(node -e "console.log(require('bcryptjs').hashSync(process.env.P, 10))" P="$DEV_ADMIN_PASSWORD")"
  ADMIN_HASH_ESCAPED="$(printf '%s' "$ADMIN_HASH" | sed 's/\$/\\$/g')"
  cat > .env <<EOF
NEXTAUTH_SECRET=dev-local-superstrong-secret-please-change
NEXTAUTH_URL=http://localhost:3000

NEXT_PUBLIC_BASE_URL=http://localhost:3000
NEXT_PUBLIC_MARKETING_URL=http://localhost:3000
NEXT_PUBLIC_APP_BASE_HOST=localhost

POSTGRES_PRISMA_URL=postgresql://papermark:papermark@127.0.0.1:5432/papermark?schema=public
POSTGRES_URL_NON_POOLING=postgresql://papermark:papermark@127.0.0.1:5432/papermark?schema=public
POSTGRES_PRISMA_URL_NON_POOLING=postgresql://papermark:papermark@127.0.0.1:5432/papermark?schema=public

# Password-only administrator auth used by this fork. Log in at /login with:
#   email:    ${DEV_ADMIN_EMAIL}
#   password: ${DEV_ADMIN_PASSWORD}
ADMIN_EMAILS=${DEV_ADMIN_EMAIL}
ADMIN_PASSWORD_HASHES={"${DEV_ADMIN_EMAIL}":"${ADMIN_HASH_ESCAPED}"}

NEXT_PRIVATE_DOCUMENT_PASSWORD_KEY=dev-local-superstrong-document-secret
NEXT_PUBLIC_UPLOAD_TRANSPORT="vercel"
EOF
fi

log "Install complete."
