#!/bin/sh
set -e

echo "=== Prisma migrate deploy (ParsPack startup) ==="
if node ./node_modules/prisma/build/index.js migrate deploy; then
  echo "=== Prisma migration completed successfully ==="
else
  echo "=== ERROR: Prisma migrate deploy failed — check DATABASE_URL and database reachability ===" >&2
  exit 1
fi

echo "=== Starting Next.js ==="
exec node server.js
