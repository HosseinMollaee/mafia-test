# پیکربندی‌های استخراج‌شده از mafia-test

## ۱. مدیریت وابستگی‌ها

### ۱.۱ فایل package.json

```json
{
  "name": "parspack-next-starter",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev --turbopack",
    "prebuild": "node scripts/check-fontawesome-vendor.mjs",
    "build": "prisma generate && next build",
    "start": "next start",
    "lint": "next lint",
    "db:migrate:deploy": "prisma migrate deploy",
    "vendor:fontawesome": "node scripts/vendor-fontawesome.mjs",
    "check:fontawesome-vendor": "node scripts/check-fontawesome-vendor.mjs"
  },
  "dependencies": {
    "@aws-sdk/client-s3": "^3.1048.0",
    "@aws-sdk/s3-request-presigner": "^3.1048.0",
    "@fortawesome/fontawesome-svg-core": "file:vendor/fortawesome/fontawesome-svg-core",
    "@fortawesome/pro-light-svg-icons": "file:vendor/fortawesome/pro-light-svg-icons",
    "@fortawesome/pro-regular-svg-icons": "file:vendor/fortawesome/pro-regular-svg-icons",
    "@fortawesome/sharp-duotone-solid-svg-icons": "file:vendor/fortawesome/sharp-duotone-solid-svg-icons",
    "@fortawesome/pro-solid-svg-icons": "file:vendor/fortawesome/pro-solid-svg-icons",
    "@fortawesome/react-fontawesome": "file:vendor/fortawesome/react-fontawesome",
    "@prisma/client": "^6.8.2",
    "prisma": "^6.8.2",
    "dexie": "^4.0.11",
    "dexie-react-hooks": "^1.1.7",
    "next": "^15.3.2",
    "pg": "^8.20.0",
    "react": "^19.1.0",
    "react-dom": "^19.1.0",
    "server-only": "^0.0.1"
  },
  "devDependencies": {
    "@eslint/eslintrc": "^3.3.1",
    "@types/node": "^20.17.46",
    "@types/pg": "^8.20.0",
    "@types/react": "^19.1.4",
    "@types/react-dom": "^19.1.5",
    "autoprefixer": "^10.4.21",
    "eslint": "^9.26.0",
    "eslint-config-next": "^15.3.2",
    "postcss": "^8.5.3",
    "tailwindcss": "^3.4.17",
    "typescript": "^5.8.3"
  }
}
```

### ۱.۲ فایل package-lock.json (فقط نسخه‌های اصلی)

```json
{
  "next": "15.5.18",
  "react": "19.2.6",
  "react-dom": "19.2.6",
  "typescript": "5.9.3",
  "tailwindcss": "3.4.19",
  "@prisma/client": "6.8.2",
  "prisma": "6.8.2",
  "pg": "8.20.0",
  "@types/pg": "8.20.0",
  "dexie": "4.0.11",
  "dexie-react-hooks": "1.1.7",
  "@aws-sdk/client-s3": "3.1048.0",
  "@aws-sdk/s3-request-presigner": "3.1048.0",
  "@fortawesome (vendored file: dependencies)": {
    "fontawesome-svg-core": "6.7.2",
    "pro-light-svg-icons": "6.7.2",
    "pro-regular-svg-icons": "6.7.2",
    "pro-solid-svg-icons": "6.7.2",
    "sharp-duotone-solid-svg-icons": "6.7.2",
    "react-fontawesome": "3.1.1"
  },
  "note": "پکیج‌های @fortawesome در package.json با file:vendor/... تعریف شده‌اند؛ نسخه از vendor/*/package.json"
}
```

### ۱.۳ فایل .npmrc (با مخفی‌سازی توکن)

```
; ParsPack build env may have HOME=/home/app (not writable).
; Force npm cache/log/prefix into writable temp directory.
cache=/tmp/.npm-cache
prefix=/tmp/.npm-prefix
logs-dir=/tmp/.npm-logs

fund=false
audit=false
update-notifier=false
```

## ۲. کانتینرسازی و استقرار

### ۲.۱ فایل Dockerfile

```dockerfile
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
```

### ۲.۲ فایل .dockerignore

```
node_modules
.next
.git
npm-debug.log*
.env*.local
.vercel
coverage
```

### ۲.۳ فایل‌های دیگه‌ی استقرار

#### DEPLOY_NOTES.md

```markdown
# راهنمای استقرار Prisma روی پارس‌پک

این پروژه از **همان دیتابیس PostgreSQL موجود** (`mafiatest`) استفاده می‌کند. متغیرهای قبلی `pg` (`DATABASE_HOST` و …) را حذف نکنید؛ صفحهٔ `/db-test` به آن‌ها وابسته است.

## ۱. متغیر `DATABASE_URL` در پنل پارس‌پک

در سرویس اپلیکیشن، متغیر محیطی جدید اضافه کنید:

| متغیر | مقدار |
|--------|--------|
| `DATABASE_URL` | رشتهٔ اتصال Prisma (پایین) |

### قالب

```
postgresql://USER:PASSWORD@HOST:5432/DBNAME
```

### مقادیر این پروژه

| جزء | مقدار |
|-----|--------|
| USER | `server` |
| DBNAME | `mafiatest` |
| HOST | `app-postgresql-mafia-test` (نام کوتاه سرویس داخلی، نه دامنهٔ عمومی) |
| PORT | `5432` (داخل رشتهٔ URL؛ جدا از `DATABASE_PORT` برای pg) |
| PASSWORD | همان رمزی که در `DATABASE_PASSWORD` دارید |

### نمونهٔ نهایی (رمز را جایگزین کنید)

```
postgresql://server:YOUR_URL_ENCODED_PASSWORD@app-postgresql-mafia-test:5432/mafiatest
```

**مهم:** فقط از شبکهٔ داخلی پارس‌پک وصل شوید. `HOST` باید نام کوتاه سرویس PostgreSQL باشد (`app-postgresql-mafia-test`)، نه آدرس عمومی اینترنت.

---

## ۲. URL-encode کردن رمز عبور

اگر رمز کاراکترهای خاص دارد (مثلاً `!` یا `=`)، باید در `DATABASE_URL` **encode** شوند؛ در غیر این صورت Prisma اتصال را اشتباه parse می‌کند.

| کاراکتر | encode شده |
|---------|------------|
| `!` | `%21` |
| `=` | `%3D` |
| `@` | `%40` |
| `#` | `%23` |
| `%` | `%25` |
| `:` | `%3A` (در بخش رمز، اگر در رمز باشد) |
| `/` | `%2F` |
| `?` | `%3F` |
| `&` | `%26` |

### مثال

فرض کنید رمز واقعی این است:

```
MyP@ss!word=secret
```

فقط **بخش PASSWORD** را encode کنید (نه کل URL):

| بخش خام | encode شده |
|---------|------------|
| `MyP@ss!word=secret` | `MyP%40ss%21word%3Dsecret` |

`DATABASE_URL` نهایی:

```
postgresql://server:MyP%40ss%21word%3Dsecret@app-postgresql-mafia-test:5432/mafiatest
```

### encode در مرورگر (DevTools Console)

```javascript
encodeURIComponent("رمز-واقعی-شما")
```

خروجی را بین `server:` و `@app-postgresql-mafia-test` قرار دهید.

---

## ۳. Migration در زمان استارت کانتینر

Migration در **دو مسیر** اجرا می‌شود (هر کدام که اول فرصت داشته باشد):

1. `docker-entrypoint.sh` → `node scripts/run-prisma-migrate.mjs`
2. **fallback:** `instrumentation.ts` هنگام بالا آمدن Next.js (اگر پارس‌پک `ENTRYPOINT` را نادیده بگیرد و مستقیم `node server.js` بزند)

Migration روی **سرور پارس‌پک** اجرا می‌شود، نه روی لپ‌تاپ. برای توسعهٔ محلی از `migrate dev` استفاده نکنید مگر بدانید چه می‌کنید؛ در استقرار فقط `migrate deploy` استفاده می‌شود.

### خطای «TestConnection does not exist»

یعنی `migrate deploy` هنوز روی دیتابیس فعلی اجرا نشده:

1. یک **deploy جدید** بزنید (بعد از push آخرین کد).
2. در لاگ کانتینer دنبال `Prisma migration completed successfully` بگردید.
3. صفحهٔ `/prisma-test` بخش «وضعیت Migration» را ببینید — اگر `_prisma_migrations` هم «وجود ندارد» است، migration اصلاً اجرا نشده.
4. اگر `_prisma_migrations` هست ولی `TestConnection` نیست، احتمالاً `DATABASE_URL` به دیتابیس دیگری اشاره می‌کند.

جدول جدید: `TestConnection` — به جداول و داده‌های قبلی دست نمی‌زند.

---

## ۴. تشخیص موفقیت migration از لاگ پارس‌پک

بعد از deploy، لاگ کانتینer اپلیکیشن را باز کنید.

### موفق

باید خطوطی شبیه این ببینید:

```
=== Prisma migrate deploy (ParsPack startup) ===
...
Applying migration `20260518120000_init_test_connection`
...
=== Prisma migration completed successfully ===
=== Starting Next.js ===
```

اگر migration قبلاً اعمال شده باشد:

```
No pending migrations to apply.
```

و سپس:

```
=== Prisma migration completed successfully ===
```

### ناموفق

```
=== ERROR: Prisma migrate deploy failed — check DATABASE_URL and database reachability ===
```

یا خطای Prisma/PostgreSQL (مثلاً authentication failed، connection refused، invalid URL).

**اقدام:** مقدار `DATABASE_URL`، encode رمز، و دسترسی داخلی به `app-postgresql-mafia-test:5432` را بررسی کنید.

---

## ۵. تست بعد از استقرار

1. `/db-test` — باید مثل قبل سبز باشد (اتصال `pg`).
2. `/prisma-test` — باید سبز باشد، رکورد جدید بسازد و لیست `TestConnection` را نشان دهد.

اگر `/db-test` سبز و `/prisma-test` قرمز است، تقریباً همیشه مشکل از `DATABASE_URL` (فرمت یا encode رمز) است، نه از دیتابیس خام.

---

## ۶. Font Awesome Pro (Next.js پارس‌پک)

سرور build پارس‌پک به `npm.fontawesome.com` دسترسی ندارد. پکیج‌های Pro در `vendor/fortawesome/` commit می‌شوند.

**یک‌بار لوکال:**

```powershell
$env:FONTAWESOME_TOKEN = "توکن-npm"
node scripts/vendor-fontawesome.mjs
npm install
git add vendor/fortawesome package.json package-lock.json
git commit -m "chore: vendor Font Awesome Pro"
git push
```

بعد از push، deploy جدید بزنید. در پنل پارس‌پک **نیازی به `FONTAWESOME_TOKEN` نیست**.

جزئیات: `vendor/fortawesome/README.md`
```

#### PRISMA_SETUP.md

_فایل PRISMA_SETUP.md در این ریپو وجود ندارد؛ راهنمای Prisma در DEPLOY_NOTES.md است._

#### README.md

```markdown
# پارس‌پک — شروع Next.js

پروژه ساده [Next.js 15](https://nextjs.org/) با TypeScript، Tailwind CSS و App Router؛ آماده برای استقرار روی [پارس‌پک](https://parspack.com/).

این ساختار معادل اجرای `create-next-app` با گزینه‌های زیر است:

`TypeScript` · `ESLint` · `Tailwind` · بدون پوشهٔ `src/` · `App Router` · `--turbopack` در اسکریپت dev · بدون import alias

```bash
npx create-next-app@15 . --typescript --eslint --tailwind --no-src-dir --app --turbopack --no-import-alias
```

## پیش‌نیاز

- Node.js 20 یا جدیدتر
- npm (یا pnpm / yarn)
- **Font Awesome Pro:** پوشهٔ `vendor/fortawesome/` باید در ریپو باشد (یک‌بار با اسکریپت زیر ساخته و commit می‌شود)

## Font Awesome Pro (استقرار پارس‌پک / Next.js)

سرور build پارس‌پک معمولاً به `npm.fontawesome.com` دسترسی ندارد. پکیج‌های Pro داخل ریپو **vendor** می‌شوند تا `npm install` فقط از فایل‌های محلی استفاده کند.

**یک‌بار روی لپ‌تاپ** (با اینترنت و لایسنس Pro):

```powershell
$env:FONTAWESOME_TOKEN = "توکن-npm-از-fontawesome.com/account"
node scripts/vendor-fontawesome.mjs
npm install
git add vendor/fortawesome package.json package-lock.json
git commit -m "chore: vendor Font Awesome Pro"
git push
```

جزئیات: [`vendor/fortawesome/README.md`](vendor/fortawesome/README.md). روی پارس‌پک **نیازی به `FONTAWESOME_TOKEN` در پنل نیست**.

## نصب و اجرا

```bash
npm install
npm run dev
```

سپس مرورگر را روی [http://localhost:3000](http://localhost:3000) باز کنید.

## اسکریپت‌ها

| دستور | توضیح |
|--------|--------|
| `npm run dev` | اجرای توسعه با Turbopack |
| `npm run build` | ساخت نسخه production |
| `npm run start` | اجرای سرور production (بعد از build) |
| `npm run lint` | اجرای ESLint |
| `npm run vendor:fontawesome` | دانلود Pro به `vendor/fortawesome/` (فقط لوکال) |
| `npm run check:fontawesome-vendor` | بررسی وجود vendor قبل از build |

## استقرار Next.js روی پارس‌پک

1. نوع اپ: **Next.js** (طبق پنل شما).
2. `package.json` و `package-lock.json` در روت `context_dir` باشند.
3. پوشهٔ `vendor/fortawesome/` حتماً push شده باشد.
4. `prisma` در `dependencies` است تا `prisma generate` در `npm run build` روی پارس‌پک کار کند.
5. پورت اپ: **3000** (یا مطابق `PORT` در کد).

## راست‌چین (RTL) و فارسی

در `app/layout.tsx` مقدارهای `lang="fa"` و `dir="rtl"` برای ریشهٔ سند تنظیم شده‌اند.

## استقرار با Docker (پارس‌پک)

1. در روت پروژه، فایل `Dockerfile` قرار دارد و خروجی `standalone` در `next.config.ts` فعال است.
2. ایمیج را بسازید:

   ```bash
   docker build -t parspack-next-starter .
   docker run -p 3000:3000 parspack-next-starter
   ```

3. در پنل پارس‌پک، نوع استقرار **Docker** را انتخاب کنید و پورت سرویس را با پورت اپلیکیشن (پیش‌فرض **3000**) هماهنگ کنید. در صورت نیاز، متغیر محیطی `PORT` را مطابق مستندات پارس‌پک تنظیم کنید.

برای اطلاعات بیشتر: [مستندات Docker پارس‌پک](https://docs.parspack.com/paas/building-the-application/docker/docker-container/).

## ساختار پروژه

- `app/` — مسیر App Router (`layout.tsx`, `page.tsx`, استایل سراسری)
- `public/` — فایل‌های استاتیک
- `next.config.ts` — تنظیمات Next.js (شامل `output: "standalone"` برای Docker)

## یادداشت

فایل `package-lock.json` در ریپو قرار دارد؛ با `npm ci` یا `npm install` همان نسخه‌های قفل‌شده نصب می‌شوند. وابستگی‌ها از رجیستری npm گرفته می‌شوند (CDN جداگانه برای اجرای اپ لازم نیست).
```

## ۳. تنظیمات Next.js و TypeScript

### ۳.۱ next.config.ts

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  outputFileTracingIncludes: {
    "/*": [
      "./prisma/**/*",
      "./scripts/**/*",
      "./node_modules/prisma/**/*",
      "./node_modules/.prisma/**/*",
      "./node_modules/@prisma/client/**/*",
    ],
  },
};

export default nextConfig;
```

### ۳.۲ tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ]
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

### ۳.۳ tailwind.config.ts

```typescript
import type { Config } from "tailwindcss";
import defaultTheme from "tailwindcss/defaultTheme";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        // Use licensed Persian fonts as the global default.
        // Icon fonts (if any) should set their own font-family and won't be affected.
        sans: [
          "IRANYekanX",
          "IRANSansDN",
          ...defaultTheme.fontFamily.sans,
        ],
        iransansdn: ["IRANSansDN", "IRANYekanX", ...defaultTheme.fontFamily.sans],
        mono: ["IRANYekanX", "IRANSansDN"],
      },
    },
  },
  plugins: [],
};

export default config;
```

### ۳.۴ postcss.config.mjs

```javascript
/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};

export default config;
```

## ۴. Prisma

### ۴.۱ prisma/schema.prisma

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model TestConnection {
  id        Int      @id @default(autoincrement())
  label     String
  createdAt DateTime @default(now())
}
```

### ۴.۲ ساختار پوشه‌ی prisma/migrations

```
prisma/migrations/
├── migration_lock.toml
└── 20260518120000_init_test_connection/
    └── migration.sql
```

#### prisma/migrations/20260518120000_init_test_connection/migration.sql

```sql
-- CreateTable
CREATE TABLE "TestConnection" (
    "id" SERIAL NOT NULL,
    "label" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TestConnection_pkey" PRIMARY KEY ("id")
);
```

### ۴.۳ prisma/migrations/migration_lock.toml

```toml
# Please do not edit this file manually
# It should be added in your version-control system (i.e. Git)
provider = "postgresql"
```

## ۵. لایه‌های سرویس (پوشه‌ی lib)

### lib/database-url-check.ts

```typescript
import "server-only";

function runtimeEnv(name: string): string | undefined {
  const value = process.env[name];
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

export type ParsedPostgresUrl = {
  host: string;
  port: string;
  database: string;
  user: string;
  password: string;
};

export type DatabaseUrlValidation = {
  envUrlSet: boolean;
  envUrlMasked: string | null;
  builtUrlMasked: string;
  /** null = DATABASE_URL not set in env */
  consistent: boolean | null;
  status: "match" | "mismatch" | "not_set" | "incomplete_parts" | "invalid_env_url";
  message: string;
  details: string[];
};

export function maskDatabaseUrl(url: string): string {
  try {
    const normalized = url.trim().replace(/^postgres:\/\//i, "postgresql://");
    const parsed = new URL(normalized);
    if (parsed.password) parsed.password = "****";
    return parsed.toString();
  } catch {
    return url.replace(/:([^:@/]+)@/, ":****@");
  }
}

export function buildDatabaseUrlFromParts(
  host: string,
  port: number,
  database: string,
  user: string,
  password: string
): string {
  const userEnc = encodeURIComponent(user);
  const passEnc = encodeURIComponent(password);
  const dbEnc = encodeURIComponent(database);
  return `postgresql://${userEnc}:${passEnc}@${host}:${port}/${dbEnc}`;
}

export function parsePostgresUrl(url: string): ParsedPostgresUrl | null {
  try {
    const normalized = url.trim().replace(/^postgres:\/\//i, "postgresql://");
    const parsed = new URL(normalized);

    if (parsed.protocol !== "postgresql:") {
      return null;
    }

    return {
      host: parsed.hostname,
      port: parsed.port || "5432",
      database: decodeURIComponent(parsed.pathname.replace(/^\//, "")),
      user: decodeURIComponent(parsed.username),
      password: decodeURIComponent(parsed.password),
    };
  } catch {
    return null;
  }
}

function fieldMismatch(
  label: string,
  fromUrl: string,
  fromParts: string
): string | null {
  if (fromUrl === fromParts) return null;
  return `${label}: در DATABASE_URL «${fromUrl}» و در پارامتر جدا «${fromParts}»`;
}

export function validateDatabaseUrl(): DatabaseUrlValidation {
  const host = runtimeEnv("DATABASE_HOST");
  const port = Number(runtimeEnv("DATABASE_PORT") ?? "5432");
  const database = runtimeEnv("DATABASE_NAME");
  const user = runtimeEnv("DATABASE_USER");
  const password = runtimeEnv("DATABASE_PASSWORD");
  const envUrl = runtimeEnv("DATABASE_URL");

  const partsComplete = Boolean(host && database && user && password);

  if (!partsComplete) {
    return {
      envUrlSet: Boolean(envUrl),
      envUrlMasked: envUrl ? maskDatabaseUrl(envUrl) : null,
      builtUrlMasked: "(پارامترها کامل نیست)",
      consistent: null,
      status: "incomplete_parts",
      message: "برای ساخت URL، HOST، NAME، USER و PASSWORD لازم است.",
      details: [],
    };
  }

  const builtUrl = buildDatabaseUrlFromParts(
    host!,
    port,
    database!,
    user!,
    password!
  );
  const builtUrlMasked = maskDatabaseUrl(builtUrl);

  if (!envUrl) {
    return {
      envUrlSet: false,
      envUrlMasked: null,
      builtUrlMasked,
      consistent: null,
      status: "not_set",
      message:
        "DATABASE_URL در env تنظیم نشده؛ اتصال فعلی از پارامترهای جداگانه است (درست است).",
      details: [
        "URL پیشنهادی بر اساس پارامترهای فعلی (فقط برای مقایسهٔ دستی):",
        builtUrlMasked,
      ],
    };
  }

  const parsed = parsePostgresUrl(envUrl);
  if (!parsed) {
    return {
      envUrlSet: true,
      envUrlMasked: maskDatabaseUrl(envUrl),
      builtUrlMasked,
      consistent: false,
      status: "invalid_env_url",
      message: "فرمت DATABASE_URL نامعتبر است.",
      details: [],
    };
  }

  const details: string[] = [];
  const mismatches = [
    fieldMismatch("host", parsed.host, host!),
    fieldMismatch("port", parsed.port, String(port)),
    fieldMismatch("database", parsed.database, database!),
    fieldMismatch("user", parsed.user, user!),
  ].filter((item): item is string => item !== null);

  const passwordMatch = parsed.password === password;
  if (!passwordMatch) {
    details.push("password: مقدار DATABASE_URL با DATABASE_PASSWORD یکسان نیست");
  }

  details.push(...mismatches);

  const consistent = mismatches.length === 0 && passwordMatch;

  if (consistent) {
    return {
      envUrlSet: true,
      envUrlMasked: maskDatabaseUrl(envUrl),
      builtUrlMasked,
      consistent: true,
      status: "match",
      message: "DATABASE_URL با پارامترهای جداگانه هم‌خوان است.",
      details: [],
    };
  }

  return {
    envUrlSet: true,
    envUrlMasked: maskDatabaseUrl(envUrl),
    builtUrlMasked,
    consistent: false,
    status: "mismatch",
    message: "DATABASE_URL با پارامترهای HOST/PORT/NAME/USER/PASSWORD هم‌خوان نیست.",
    details,
  };
}
```

### lib/db-debug.ts

```typescript
import "server-only";
import { lookup } from "node:dns/promises";
import {
  maskDatabaseUrl,
  validateDatabaseUrl,
  type DatabaseUrlValidation,
} from "./database-url-check";

function runtimeEnv(name: string): string | undefined {
  const value = process.env[name];
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

export type DatabaseEnvDebug = {
  variables: Record<string, string>;
  dns: {
    hostname: string;
    addresses: string[];
    error: string | null;
  };
  connectionTarget: {
    host: string;
    port: number;
    database: string;
    user: string;
  };
  warnings: string[];
  urlValidation: DatabaseUrlValidation;
};

export async function getDatabaseEnvDebug(): Promise<DatabaseEnvDebug> {
  const host = runtimeEnv("DATABASE_HOST") ?? "";
  const port = Number(runtimeEnv("DATABASE_PORT") ?? "5432");
  const database = runtimeEnv("DATABASE_NAME") ?? "";
  const user = runtimeEnv("DATABASE_USER") ?? "";

  const envUrl = runtimeEnv("DATABASE_URL");

  const variables: Record<string, string> = {
    DATABASE_HOST: host || "(خالی)",
    DATABASE_PORT: String(port),
    DATABASE_NAME: database || "(خالی)",
    DATABASE_USER: user || "(خالی)",
    DATABASE_PASSWORD: runtimeEnv("DATABASE_PASSWORD") ? "****" : "(خالی)",
    DATABASE_URL: envUrl ? maskDatabaseUrl(envUrl) : "(تنظیم نشده)",
  };

  let addresses: string[] = [];
  let dnsError: string | null = null;

  if (host) {
    try {
      const results = await lookup(host, { all: true });
      addresses = results.map((entry) =>
        entry.family === 6 ? entry.address : entry.address
      );
    } catch (err) {
      dnsError = err instanceof Error ? err.message : String(err);
    }
  }

  const warnings: string[] = [];

  if (/\.apps\.[^.]+\.abrhapaas\.com$/i.test(host)) {
    warnings.push(
      "DATABASE_HOST به آدرس عمومی apps.* اشاره می‌کند. این دامنه معمولاً برای مرورگر/HTTP است و روی پورت 5432 باز نیست. مقدار را به نام کوتاه سرویس عوض کنید: app-postgresql-mafia-test"
    );
  }

  if (addresses.some((ip) => ip.startsWith("192.168."))) {
    warnings.push(
      `نام host به IP داخلی (${addresses.join(", ")}) resolve می‌شود. اگر ECONNREFUSED می‌گیرید، از نام سرویس داخلی (بدون .apps....) استفاده کنید، نه دامنهٔ عمومی.`
    );
  }

  return {
    variables,
    dns: {
      hostname: host,
      addresses,
      error: dnsError,
    },
    connectionTarget: { host, port, database, user },
    warnings,
    urlValidation: validateDatabaseUrl(),
  };
}
```

### lib/db.ts

```typescript
import "server-only";
import { Pool, type PoolConfig } from "pg";

const globalForDb = globalThis as unknown as {
  pool: Pool | undefined;
};

/** Read env at runtime (avoids Next.js inlining undefined at Docker build time). */
function runtimeEnv(name: string): string | undefined {
  const value = process.env[name];
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

const REQUIRED_ENV_KEYS = [
  "DATABASE_HOST",
  "DATABASE_NAME",
  "DATABASE_USER",
  "DATABASE_PASSWORD",
] as const;

export type DatabaseHostHint = {
  masked: string;
  looksLikePodIp: boolean;
};

export type DatabaseEnvStatus = {
  ok: boolean;
  missing: string[];
  configured: Record<string, boolean>;
  hostHint: DatabaseHostHint | null;
};

function maskHost(host: string): string {
  if (host.length <= 12) return host;
  return `${host.slice(0, 6)}…${host.slice(-6)}`;
}

export function getDatabaseHostHint(): DatabaseHostHint | null {
  const host = runtimeEnv("DATABASE_HOST");
  if (!host) return null;

  const looksLikePodIp = /^\d{1,3}(\.\d{1,3}){3}$/.test(host);

  return {
    masked: maskHost(host),
    looksLikePodIp,
  };
}

export function getDatabaseEnvStatus(): DatabaseEnvStatus {
  const configured = {
    DATABASE_HOST: Boolean(runtimeEnv("DATABASE_HOST")),
    DATABASE_PORT: Boolean(runtimeEnv("DATABASE_PORT") ?? "5432"),
    DATABASE_NAME: Boolean(runtimeEnv("DATABASE_NAME")),
    DATABASE_USER: Boolean(runtimeEnv("DATABASE_USER")),
    DATABASE_PASSWORD: Boolean(runtimeEnv("DATABASE_PASSWORD")),
  };

  const missing = REQUIRED_ENV_KEYS.filter((key) => !configured[key]);

  return {
    ok: missing.length === 0,
    missing: [...missing],
    configured,
    hostHint: getDatabaseHostHint(),
  };
}

function getPoolConfig(): PoolConfig {
  const envStatus = getDatabaseEnvStatus();
  if (!envStatus.ok) {
    throw new Error(
      `متغیرهای محیطی تنظیم نشده‌اند: ${envStatus.missing.join("، ")}`
    );
  }

  return {
    host: runtimeEnv("DATABASE_HOST"),
    port: Number(runtimeEnv("DATABASE_PORT") ?? "5432"),
    database: runtimeEnv("DATABASE_NAME"),
    user: runtimeEnv("DATABASE_USER"),
    password: runtimeEnv("DATABASE_PASSWORD"),
    ssl: false,
  };
}

export function getConnectionTarget() {
  return {
    host: runtimeEnv("DATABASE_HOST") ?? "",
    port: Number(runtimeEnv("DATABASE_PORT") ?? "5432"),
    database: runtimeEnv("DATABASE_NAME") ?? "",
    user: runtimeEnv("DATABASE_USER") ?? "",
  };
}

/** Pool is created on first use so runtime env vars from ParsPack are available. */
export function getPool(): Pool {
  if (!globalForDb.pool) {
    globalForDb.pool = new Pool(getPoolConfig());
  }
  return globalForDb.pool;
}

/** After changing env vars in ParsPack, restart the app so a new pool is created. */
export function resetPool(): void {
  void globalForDb.pool?.end();
  globalForDb.pool = undefined;
}

export function getDbErrorMessage(err: unknown): string {
  if (err instanceof Error && err.message.trim()) {
    return err.message;
  }
  if (typeof err === "string" && err.trim()) {
    return err;
  }
  if (err && typeof err === "object" && "message" in err) {
    const msg = String((err as { message: unknown }).message);
    if (msg.trim()) return msg;
  }
  return "خطای ناشناخته در اتصال به دیتابیس";
}
```

### lib/offline-db.ts

```typescript
import Dexie, { type EntityTable } from "dexie";

export interface GameSession {
  id?: number;
  deckNumber: number;
  playerName: string;
  role: string;
  createdAt: Date;
}

class MafiaOfflineDB extends Dexie {
  gameSession!: EntityTable<GameSession, "id">;

  constructor() {
    super("MafiaOfflineDB");
    this.version(1).stores({
      gameSession: "++id, deckNumber, playerName, role, createdAt",
    });
  }
}

let db: MafiaOfflineDB | null = null;

function getDb(): MafiaOfflineDB {
  if (typeof window === "undefined") {
    throw new Error("IndexedDB فقط در مرورگر در دسترس است.");
  }
  if (!db) {
    db = new MafiaOfflineDB();
  }
  return db;
}

export function isIndexedDBAvailable(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  try {
    return typeof indexedDB !== "undefined" && indexedDB !== null;
  } catch {
    return false;
  }
}

export async function addSession(
  data: Omit<GameSession, "id">
): Promise<number> {
  const id = await getDb().gameSession.add(data);
  if (typeof id !== "number") {
    throw new Error("ثبت نشست آفلاین ناموفق بود (id نامعتبر).");
  }
  return id;
}

export async function getAllSessions(): Promise<GameSession[]> {
  return getDb().gameSession.orderBy("createdAt").reverse().toArray();
}

export async function clearAllSessions(): Promise<void> {
  await getDb().gameSession.clear();
}

export async function countSessions(): Promise<number> {
  return getDb().gameSession.count();
}
```

### lib/prisma-migration-status.ts

```typescript
import "server-only";
import { prisma } from "./prisma";

export type PrismaMigrationStatus = {
  migrationsTableExists: boolean;
  appliedMigrations: string[];
  testConnectionTableExists: boolean;
  hint: string | null;
};

export async function getPrismaMigrationStatus(): Promise<PrismaMigrationStatus> {
  let migrationsTableExists = false;
  let appliedMigrations: string[] = [];
  let testConnectionTableExists = false;

  try {
    const rows = await prisma.$queryRaw<{ migration_name: string }[]>`
      SELECT migration_name
      FROM "_prisma_migrations"
      WHERE rolled_back_at IS NULL
      ORDER BY finished_at DESC
    `;
    migrationsTableExists = true;
    appliedMigrations = rows.map((row) => row.migration_name);
  } catch {
    migrationsTableExists = false;
  }

  try {
    const tableRows = await prisma.$queryRaw<{ exists: boolean }[]>`
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name = 'TestConnection'
      ) AS exists
    `;
    testConnectionTableExists = Boolean(tableRows[0]?.exists);
  } catch {
    testConnectionTableExists = false;
  }

  let hint: string | null = null;
  if (!testConnectionTableExists) {
    if (!migrationsTableExists) {
      hint =
        "جدول _prisma_migrations هم وجود ندارد — migrate deploy هنوز روی این دیتابیس اجرا نشده. یک deploy جدید بزنید و در لاگ پارس‌پک عبارت «Prisma migration completed successfully» را ببینید.";
    } else if (appliedMigrations.length === 0) {
      hint =
        "جدول migration خالی است — migrate deploy ناقص مانده. کانتینر را ری‌استارت کنید یا لاگ استارت را بررسی کنید.";
    } else {
      hint =
        "برخی migrationها ثبت شده‌اند اما TestConnection وجود ندارد — ممکن است DATABASE_URL به دیتابیس دیگری اشاره کند.";
    }
  }

  return {
    migrationsTableExists,
    appliedMigrations,
    testConnectionTableExists,
    hint,
  };
}
```

### lib/prisma.ts

```typescript
import "server-only";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export function getPrismaErrorMessage(err: unknown): string {
  if (err instanceof Error && err.message.trim()) {
    return err.message;
  }
  if (typeof err === "string" && err.trim()) {
    return err;
  }
  if (err && typeof err === "object" && "message" in err) {
    const msg = String((err as { message: unknown }).message);
    if (msg.trim()) return msg;
  }
  return "خطای ناشناخته در Prisma";
}
```

### lib/sms.ts

```typescript
export type SmsResult =
  | { success: true; message: string }
  | { success: false; error: string };

export async function sendVerificationCode(
  phone: string,
  code: string
): Promise<SmsResult> {
  const apiKey = process.env.KAVENEGAR_API_KEY;
  const template = process.env.KAVENEGAR_TEMPLATE;

  if (!apiKey) {
    return {
      success: false,
      error: "متغیر محیطی KAVENEGAR_API_KEY تنظیم نشده است.",
    };
  }

  if (!template) {
    return {
      success: false,
      error: "متغیر محیطی KAVENEGAR_TEMPLATE تنظیم نشده است.",
    };
  }

  const url = new URL(
    `https://api.kavenegar.com/v1/${encodeURIComponent(apiKey)}/verify/lookup.json`
  );
  url.searchParams.set("receptor", phone);
  url.searchParams.set("token", code);
  url.searchParams.set("template", template);

  try {
    const response = await fetch(url.toString(), { method: "GET" });
    const data = (await response.json()) as {
      return?: { status?: number; message?: string };
    };

    const status = data.return?.status;
    const message = data.return?.message ?? "پاسخ نامعتبر از کاوه‌نگار";

    if (response.ok && status === 200) {
      return { success: true, message };
    }

    return {
      success: false,
      error: `کاوه‌نگار [${status ?? response.status}]: ${message}`,
    };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "خطای ناشناخته در ارتباط با کاوه‌نگار";
    return { success: false, error: message };
  }
}
```

### lib/storage-config.ts

```typescript
/** نام باکت S3 در پارس‌پک معمولاً همان شناسهٔ c123456 در endpoint است. */

export function parseEndpointHost(endpoint: string): string | null {
  const trimmed = endpoint.trim();
  try {
    const withScheme = trimmed.startsWith("http") ? trimmed : `https://${trimmed}`;
    return new URL(withScheme).hostname;
  } catch {
    return null;
  }
}

export function getParsPackBucketHintFromEndpoint(endpoint: string): string | null {
  const host = parseEndpointHost(endpoint);
  if (!host) return null;
  const match = host.match(/^(c\d+)\.parspack\.net$/i);
  return match?.[1] ?? null;
}
```

### lib/storage-debug.ts

```typescript
import "server-only";
import { HeadBucketCommand } from "@aws-sdk/client-s3";
import { setDefaultResultOrder } from "node:dns";
import { lookup } from "node:dns/promises";
import {
  getParsPackBucketHintFromEndpoint,
  parseEndpointHost,
} from "./storage-config";
import { getS3Client } from "./storage";

setDefaultResultOrder("ipv4first");

function runtimeEnv(name: string): string | undefined {
  const value = process.env[name];
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

export type StorageEnvDebug = {
  variables: Record<string, string>;
  endpoint: {
    raw: string;
    normalized: string;
    hostname: string;
    bucketHint: string | null;
  };
  bucket: {
    configured: string;
    matchesEndpointHint: boolean | null;
    headBucket: { ok: boolean; error: string | null };
  };
  dns: {
    hostname: string;
    addresses: string[];
    error: string | null;
  };
  warnings: string[];
};

export async function getStorageEnvDebug(): Promise<StorageEnvDebug> {
  const rawEndpoint = runtimeEnv("S3_ENDPOINT") ?? "";
  const normalized = rawEndpoint
    ? rawEndpoint.startsWith("http")
      ? rawEndpoint
      : `https://${rawEndpoint}`
    : "";
  const hostname = rawEndpoint ? (parseEndpointHost(rawEndpoint) ?? "") : "";
  const bucketHint = rawEndpoint
    ? getParsPackBucketHintFromEndpoint(rawEndpoint)
    : null;
  const configuredBucket = runtimeEnv("S3_BUCKET") ?? "";
  const bucketMatchesHint = bucketHint
    ? configuredBucket.toLowerCase() === bucketHint.toLowerCase()
    : null;

  const variables: Record<string, string> = {
    S3_ENDPOINT: rawEndpoint || "(خالی)",
    S3_BUCKET: configuredBucket || "(خالی)",
    S3_BUCKET_HINT_FROM_ENDPOINT: bucketHint ?? "(شناسایی نشد)",
    S3_ACCESS_KEY: runtimeEnv("S3_ACCESS_KEY") ? "****" : "(خالی)",
    S3_SECRET_KEY: runtimeEnv("S3_SECRET_KEY") ? "****" : "(خالی)",
  };

  let addresses: string[] = [];
  let dnsError: string | null = null;

  if (hostname) {
    try {
      const results = await lookup(hostname, { all: true });
      addresses = results.map((entry) => entry.address);
    } catch (err) {
      dnsError = err instanceof Error ? err.message : String(err);
    }
  }

  const warnings: string[] = [];

  if (!rawEndpoint) {
    warnings.push("S3_ENDPOINT تنظیم نشده است.");
  } else if (!rawEndpoint.startsWith("https://")) {
    warnings.push(
      "S3_ENDPOINT بهتر است با https:// شروع شود، مثلاً https://c397086.parspack.net"
    );
  }

  if (rawEndpoint.includes("/")) {
    try {
      const path = new URL(
        rawEndpoint.startsWith("http") ? rawEndpoint : `https://${rawEndpoint}`
      ).pathname;
      if (path && path !== "/") {
        warnings.push(
          "مسیر (path) در S3_ENDPOINT نباید باشد؛ فقط آدرس پایه از پنل، بدون نام باکت."
        );
      }
    } catch {
      /* ignore invalid URL */
    }
  }

  if (dnsError?.includes("EAI_AGAIN")) {
    warnings.push(
      "DNS موقت شکست خورده (EAI_AGAIN). دوباره تلاش کنید یا redeploy کنید."
    );
  }

  if (dnsError?.includes("ENOTFOUND")) {
    warnings.push(
      "نام host در S3_ENDPOINT پیدا نشد. مقدار را از پنل فضای ابری کپی کنید."
    );
  }

  if (bucketHint && configuredBucket && !bucketMatchesHint) {
    warnings.push(
      `S3_BUCKET برابر «${configuredBucket}» است؛ در API پارس‌پک باید «${bucketHint}» باشد (همان کد endpoint). Access Denied معمولاً از همین اشتباه است.`
    );
  }

  let headBucketOk = false;
  let headBucketError: string | null = null;

  if (configuredBucket && rawEndpoint && !dnsError) {
    try {
      await getS3Client().send(
        new HeadBucketCommand({ Bucket: configuredBucket })
      );
      headBucketOk = true;
    } catch (err) {
      headBucketError = err instanceof Error ? err.message : String(err);
      if (/access denied/i.test(headBucketError) && bucketHint) {
        warnings.push(
          `HeadBucket برای «${configuredBucket}» رد شد. S3_BUCKET را به «${bucketHint}» تغییر دهید و redeploy کنید.`
        );
      }
    }
  }

  return {
    variables,
    endpoint: {
      raw: rawEndpoint || "(خالی)",
      normalized: normalized || "(خالی)",
      hostname: hostname || "(خالی)",
      bucketHint,
    },
    bucket: {
      configured: configuredBucket || "(خالی)",
      matchesEndpointHint: bucketMatchesHint,
      headBucket: { ok: headBucketOk, error: headBucketError },
    },
    dns: {
      hostname: hostname || "(خالی)",
      addresses,
      error: dnsError,
    },
    warnings,
  };
}
```

### lib/storage.ts

```typescript
import "server-only";
import {
  GetObjectCommand,
  ObjectCannedACL,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getParsPackBucketHintFromEndpoint } from "./storage-config";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { setDefaultResultOrder } from "node:dns";

// اگر پارس‌پک خطای SignatureDoesNotMatch داد، معمولاً به‌خاطر endpoint نادرست
// یا forcePathStyle: false است — برای S3 سازگار (غیر آمازون) forcePathStyle باید true باشد
// و endpoint باید با https:// شروع شود.
//
// EAI_AGAIN = شکست موقت DNS برای host در S3_ENDPOINT (مثلاً c397086.parspack.net).
// endpoint را از پنل کپی کنید؛ نام باکت را در S3_BUCKET بگذارید، نه در URL.
setDefaultResultOrder("ipv4first");

const TRANSIENT_NETWORK = /EAI_AGAIN|ENOTFOUND|ETIMEDOUT|ECONNRESET|ECONNREFUSED/i;

async function withTransientRetry<T>(fn: () => Promise<T>): Promise<T> {
  const delays = [0, 400, 1200];
  let lastError: unknown;

  for (const delay of delays) {
    if (delay > 0) {
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      const message = err instanceof Error ? err.message : String(err);
      if (!TRANSIENT_NETWORK.test(message)) {
        throw err;
      }
    }
  }

  throw lastError;
}

function formatStorageError(err: unknown, action: string): Error {
  const raw = err instanceof Error ? err.message : String(err);

  if (raw.includes("EAI_AGAIN")) {
    const host = process.env.S3_ENDPOINT?.trim() ?? "S3_ENDPOINT";
    return new Error(
      `${action}: نام سرور فضای ابری resolve نشد (DNS موقت: EAI_AGAIN). ` +
        `مقدار S3_ENDPOINT را بررسی کنید (مثلاً https://c397086.parspack.net بدون مسیر باکت). ` +
        `اگر روی پارس‌پک deploy کرده‌اید، یک‌بار redeploy کنید یا چند ثانیه بعد دوباره آپلود کنید. host: ${host}`
    );
  }

  if (raw.includes("ENOTFOUND")) {
    return new Error(
      `${action}: آدرس S3_ENDPOINT اشتباه است یا در DNS وجود ندارد. مقدار را از پنل فضای ابری کپی کنید.`
    );
  }

  if (/access denied/i.test(raw)) {
    const endpoint = process.env.S3_ENDPOINT?.trim() ?? "";
    const bucket = process.env.S3_BUCKET?.trim() ?? "";
    const hint = endpoint ? getParsPackBucketHintFromEndpoint(endpoint) : null;
    let extra =
      " کلید دسترسی (Access/Secret) را از همان فضای ابری در پنل کپی کنید.";
    if (hint && bucket && bucket !== hint) {
      extra =
        ` S3_BUCKET احتمالاً باید «${hint}» باشد (نه «${bucket}») — در مستندات پارس‌پک bucketName همان شناسهٔ endpoint است.`;
    } else if (hint) {
      extra = ` نام باکت S3 باید «${hint}» باشد.${extra}`;
    }
    return new Error(`${action}: دسترسی رد شد (Access Denied).${extra}`);
  }

  return new Error(`${action}: ${raw}`);
}

function normalizeEndpoint(raw: string): string {
  const trimmed = raw.trim();
  if (trimmed.startsWith("https://") || trimmed.startsWith("http://")) {
    return trimmed;
  }
  return `https://${trimmed}`;
}

export function getS3Client(): S3Client {
  const endpoint = process.env.S3_ENDPOINT;
  const accessKeyId = process.env.S3_ACCESS_KEY;
  const secretAccessKey = process.env.S3_SECRET_KEY;

  if (!endpoint || !accessKeyId || !secretAccessKey) {
    throw new Error(
      "متغیرهای محیطی S3 تنظیم نشده‌اند (S3_ENDPOINT، S3_ACCESS_KEY، S3_SECRET_KEY)"
    );
  }

  return new S3Client({
    endpoint: normalizeEndpoint(endpoint),
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
    region: "us-east-1",
    forcePathStyle: true,
  });
}

function getBucket(): string {
  const bucket = process.env.S3_BUCKET;
  if (!bucket) {
    throw new Error("متغیر محیطی S3_BUCKET تنظیم نشده است");
  }
  return bucket;
}

export async function uploadFile(
  buffer: Buffer,
  fileName: string,
  contentType: string
): Promise<void> {
  try {
    const client = getS3Client();
    const bucket = getBucket();

    await withTransientRetry(() =>
      client.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: fileName,
          Body: buffer,
          ContentType: contentType,
          ACL: ObjectCannedACL.private,
        })
      )
    );
  } catch (err) {
    throw formatStorageError(err, "آپلود فایل ناموفق بود");
  }
}

export async function getFileUrl(fileName: string): Promise<string> {
  try {
    const client = getS3Client();
    const bucket = getBucket();

    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: fileName,
    });

    return await withTransientRetry(() =>
      getSignedUrl(client, command, { expiresIn: 3600 })
    );
  } catch (err) {
    throw formatStorageError(err, "ساخت آدرس موقت ناموفق بود");
  }
}
```

### lib/version.ts

```typescript
/** Bump when deploying so you can verify ParsPack picked up the new build. */
export const APP_VERSION = "v8-database-url-check";
```

## ۶. تنظیمات فونت

### ۶.۱ روش لود کردن فونت

فونت‌ها با **next/font استفاده نشده‌اند**. تعریف `@font-face` در `app/globals.css` و فایل‌های `public/fonts/`؛ کلاس `font-sans` در `app/layout.tsx` از Tailwind (خانوادهٔ IRANYekanX / IRANSansDN) استفاده می‌کند.

#### app/layout.tsx

```tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "پارس‌پک",
  description: "استقرار Next.js روی پارس‌پک",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl">
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
```

#### app/globals.css (بخش @font-face)

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@font-face {
  font-family: "IRANYekanX";
  src: url("/fonts/iranyekanx/IRANYekanX-Thin.woff2") format("woff2");
  font-weight: 100;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: "IRANYekanX";
  src: url("/fonts/iranyekanx/IRANYekanX-UltraLight.woff2") format("woff2");
  font-weight: 200;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: "IRANYekanX";
  src: url("/fonts/iranyekanx/IRANYekanX-Light.woff2") format("woff2");
  font-weight: 300;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: "IRANYekanX";
  src: url("/fonts/iranyekanx/IRANYekanX-Regular.woff2") format("woff2");
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: "IRANYekanX";
  src: url("/fonts/iranyekanx/IRANYekanX-Medium.woff2") format("woff2");
  font-weight: 500;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: "IRANYekanX";
  src: url("/fonts/iranyekanx/IRANYekanX-DemiBold.woff2") format("woff2");
  font-weight: 600;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: "IRANYekanX";
  src: url("/fonts/iranyekanx/IRANYekanX-Bold.woff2") format("woff2");
  font-weight: 700;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: "IRANYekanX";
  src: url("/fonts/iranyekanx/IRANYekanX-ExtraBold.woff2") format("woff2");
  font-weight: 800;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: "IRANYekanX";
  src: url("/fonts/iranyekanx/IRANYekanX-Black.woff2") format("woff2");
  font-weight: 900;
  font-style: normal;
  font-display: swap;
}

@font-face {
  font-family: "IRANSansDN";
  src: url("/fonts/iransansdn/iransansdnweblight.woff2") format("woff2");
  font-weight: 300;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: "IRANSansDN";
  src: url("/fonts/iransansdn/iransansdnweb.woff2") format("woff2");
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: "IRANSansDN";
  src: url("/fonts/iransansdn/iransansdnwebbold.woff2") format("woff2");
  font-weight: 700;
  font-style: normal;
  font-display: swap;
}

html,
body {
  height: 100%;
}
```

#### tailwind.config.ts (fontFamily)

```typescript
import type { Config } from "tailwindcss";
import defaultTheme from "tailwindcss/defaultTheme";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        // Use licensed Persian fonts as the global default.
        // Icon fonts (if any) should set their own font-family and won't be affected.
        sans: [
          "IRANYekanX",
          "IRANSansDN",
          ...defaultTheme.fontFamily.sans,
        ],
        iransansdn: ["IRANSansDN", "IRANYekanX", ...defaultTheme.fontFamily.sans],
        mono: ["IRANYekanX", "IRANSansDN"],
      },
    },
  },
  plugins: [],
};

export default config;
```

### ۶.۲ ساختار پوشه‌ی فونت

```text
public/fonts/iransansdn/
public/fonts/iransansdn/iransansdnweb.woff2
public/fonts/iransansdn/iransansdnwebbold.woff2
public/fonts/iransansdn/iransansdnweblight.woff2
public/fonts/iranyekanx/
public/fonts/iranyekanx/IRANYekanX-Black.woff2
public/fonts/iranyekanx/IRANYekanX-Bold.woff2
public/fonts/iranyekanx/IRANYekanX-DemiBold.woff2
public/fonts/iranyekanx/IRANYekanX-ExtraBlack.woff2
public/fonts/iranyekanx/IRANYekanX-ExtraBold.woff2
public/fonts/iranyekanx/IRANYekanX-Heavy.woff2
public/fonts/iranyekanx/IRANYekanX-Light.woff2
public/fonts/iranyekanx/IRANYekanX-Medium.woff2
public/fonts/iranyekanx/IRANYekanX-Regular.woff2
public/fonts/iranyekanx/IRANYekanX-Thin.woff2
public/fonts/iranyekanx/IRANYekanX-UltraLight.woff2
```

## ۷. متغیرهای محیطی

### ۷.۱ فایل .env.example

```env
DATABASE_HOST=
DATABASE_PORT=5432
DATABASE_NAME=
DATABASE_USER=
DATABASE_PASSWORD=

# Prisma — اتصال واحد به همان دیتابیس PostgreSQL
DATABASE_URL=
# فرمت Prisma: postgresql://USER:PASSWORD@HOST:5432/DBNAME
# از نام کوتاه سرویس داخلی پارس‌پک استفاده شود، نه دامنهٔ عمومی

# از پنل فضای ابری؛ فقط host با https، بدون نام باکت در مسیر
# مثال: https://c397086.parspack.net
S3_ENDPOINT=
S3_ACCESS_KEY=
S3_SECRET_KEY=
# معمولاً همان کد endpoint، مثلاً c397086 (نه نام نمایشی پنل)
S3_BUCKET=

KAVENEGAR_API_KEY=
KAVENEGAR_TEMPLATE=

# Font Awesome Pro — فقط برای یک‌بار اجرای scripts/vendor-fontawesome.mjs روی لپ‌تاپ
# (پارس‌پک به npm.fontawesome.com وصل نمی‌شود؛ پکیج‌ها در vendor/fortawesome/ commit می‌شوند)
FONTAWESOME_TOKEN=
```

### ۷.۲ لیست متغیرهای تنظیم‌شده روی پارس‌پک

```text
- DATABASE_HOST
- DATABASE_PORT
- DATABASE_NAME
- DATABASE_USER
- DATABASE_PASSWORD
- DATABASE_URL
- S3_ENDPOINT
- S3_ACCESS_KEY
- S3_SECRET_KEY
- S3_BUCKET
- KAVENEGAR_API_KEY
- KAVENEGAR_TEMPLATE

# اختیاری / فقط لوکال:
- FONTAWESOME_TOKEN (فقط برای vendor-fontawesome.mjs؛ روی پارس‌پک لازم نیست)
- PRISMA_MIGRATE_ON_STARTUP=false (غیرفعال کردن fallback در instrumentation)
- PORT (پیش‌فرض 3000 در Docker)
- CACHE_BUST (build arg Docker)
```

## ۸. فایل .gitignore

```
# See https://help.github.com/articles/ignoring-files/ for more about ignoring files.

# dependencies
/node_modules
/.pnp
.pnp.*
.yarn/*
!.yarn/patches
!.yarn/plugins
!.yarn/releases
!.yarn/versions

# testing
/coverage

# next.js
/.next/
/out/

# production
/build

# misc
.DS_Store
*.pem

# debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*
.pnpm-debug.log*

# env files (do not commit secrets)
.env
.env*.local

# npm — do NOT commit tokens; keep local overrides separate.
# We commit a safe `.npmrc` for ParsPack builds (cache/prefix in /tmp).
.npmrc.local
.npmrc.*.local

# temp folder while running scripts/vendor-fontawesome.mjs
.tmp-fontawesome-vendor/
/.tmp-fonts/

# vercel
.vercel

# typescript
*.tsbuildinfo
```

## ۹. مشکلاتی که برخوردیم و راه‌حل‌هاشون

**مشکل:** build پارس‌پک به npm.fontawesome.com دسترسی ندارد  
**علت:** شبکهٔ build محدود است  
**راه‌حل:** پکیج‌های Pro در `vendor/fortawesome/` vendored و در `package.json` با `file:` لینک شده‌اند؛ `prebuild` وجود vendor را چک می‌کند

**مشکل:** Prisma — جدول TestConnection وجود ندارد  
**علت:** `migrate deploy` روی دیتابیس فعلی اجرا نشده یا `DATABASE_URL` اشتباه  
**راه‌حل:** `docker-entrypoint.sh` + fallback `instrumentation.ts`؛ راهنما در DEPLOY_NOTES.md

**مشکل:** اتصال pg با ECONNREFUSED یا timeout  
**علت:** `DATABASE_HOST` به دامنهٔ عمومی `apps.*.abrhapaas.com` اشاره می‌کند  
**راه‌حل:** استفاده از نام کوتاه سرویس داخلی (`app-postgresql-mafia-test`)

**مشکل:** Prisma با رمز دارای کاراکتر خاص fail می‌شود  
**علت:** parse نادرست URL  
**راه‌حل:** `encodeURIComponent` روی بخش password در `DATABASE_URL` (مستند در DEPLOY_NOTES.md)

**مشکل:** S3 Access Denied یا EAI_AGAIN  
**علت:** `S3_BUCKET` با شناسهٔ endpoint یکی نیست؛ DNS موقت  
**راه‌حل:** `S3_BUCKET` = کد endpoint (مثلاً c397086)؛ `forcePathStyle: true`؛ retry در `lib/storage.ts`

**مشکل:** npm در ParsPack با HOME غیرقابل‌نوشتن  
**علت:** `HOME=/home/app`  
**راه‌حل:** `.npmrc` با cache/prefix/logs در `/tmp`

**مشکل:** پارس‌پک ENTRYPOINT را نادیده می‌گیرد  
**علت:** بعضی تنظیمات استقرار مستقیم `node server.js` می‌زنند  
**راه‌حل:** `instrumentation.ts` به‌عنوان fallback برای migrate deploy

