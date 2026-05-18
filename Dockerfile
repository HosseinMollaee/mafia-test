# syntax=docker/dockerfile:1

FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat openssl

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Font Awesome Pro — token only for this build stage (not copied to runner)
ARG FONTAWESOME_TOKEN
ENV FONTAWESOME_TOKEN=${FONTAWESOME_TOKEN}

COPY package.json package-lock.json* ./
COPY prisma ./prisma
COPY .npmrc.example .npmrc
RUN if [ -z "$FONTAWESOME_TOKEN" ]; then \
      echo "ERROR: FONTAWESOME_TOKEN is not set. Add it as a ParsPack build variable." >&2; \
      exit 1; \
    fi
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi
RUN rm -f .npmrc

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
