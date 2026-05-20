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
