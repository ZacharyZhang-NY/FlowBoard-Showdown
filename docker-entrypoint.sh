#!/bin/sh
set -e

echo "[entrypoint] Initializing database..."
mkdir -p data db/migrations

# Push schema to DB (works universally without migration files)
npx drizzle-kit push 2>&1 | head -20 || true

# Seed data
npx tsx db/seed.ts 2>&1 | head -5 || true

echo "[entrypoint] Starting Next.js on port 3000..."
exec npx next start -H 0.0.0.0 -p 3000
