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
