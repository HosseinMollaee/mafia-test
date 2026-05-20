# syntax=docker/dockerfile:1

FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat openssl

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Font Awesome Pro: prefer vendor/fortawesome/ in repo (no npm.fontawesome.com).
# Optional FONTAWESOME_TOKEN only if vendor/ is missing.
ARG FONTAWESOME_TOKEN
ENV FONTAWESOME_TOKEN=${FONTAWESOME_TOKEN}

COPY package.json package-lock.json* ./
COPY prisma ./prisma
COPY vendor ./vendor
RUN if [ -f vendor/fortawesome/fontawesome-svg-core/package.json ]; then \
      echo "Using vendored Font Awesome Pro"; \
      npm ci; \
    elif [ -n "$FONTAWESOME_TOKEN" ]; then \
      cp .npmrc.example .npmrc && npm ci && rm -f .npmrc; \
    else \
      echo "ERROR: vendor/fortawesome/ missing. Run: node scripts/vendor-fontawesome.mjs" >&2; \
      exit 1; \
    fi

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Change this value in ParsPack build args to bust Docker layer cache when needed.
ARG CACHE_BUST=v6
ENV CACHE_BUST=${CACHE_BUST}

ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# PostgreSQL (pg): DATABASE_HOST, DATABASE_PORT, DATABASE_NAME, DATABASE_USER, DATABASE_PASSWORD
# Prisma: DATABASE_URL — set at container runtime via ParsPack panel

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Prisma schema, migrations, and CLI for migrate deploy at startup
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/prisma ./node_modules/prisma

COPY docker-entrypoint.sh ./
COPY --from=builder --chown=nextjs:nodejs /app/scripts ./scripts
RUN chmod +x docker-entrypoint.sh

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

ENTRYPOINT ["./docker-entrypoint.sh"]
