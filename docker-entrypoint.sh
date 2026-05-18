#!/bin/sh
set -e

node scripts/run-prisma-migrate.mjs

echo "=== Starting Next.js ==="
exec node server.js
