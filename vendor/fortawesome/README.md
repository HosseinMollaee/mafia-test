# Font Awesome Pro (vendored)

پوشهٔ `vendor/fortawesome/` کپی محلی پکیج‌های npm Pro است تا **استقرار Next.js روی پارس‌پک** بدون دسترسی به `npm.fontawesome.com` کار کند.

## یک‌بار روی لپ‌تاپ (با اینترنت و لایسنس Pro)

```powershell
cd e:\mafia-test
$env:FONTAWESOME_TOKEN = "توکن-npm-از-پنل-fontawesome"
node scripts/vendor-fontawesome.mjs
npm install
git add vendor/fortawesome package.json package-lock.json
git commit -m "chore: vendor Font Awesome Pro for ParsPack"
git push
```

توکن: [fontawesome.com → Account → Package Manager](https://fontawesome.com/account) → npm token.

## بعد از push

روی پارس‌پک **نیازی به `FONTAWESOME_TOKEN` یا `.npmrc` نیست** — `npm install` فقط از فایل‌های داخل ریپو استفاده می‌کند.

## به‌روزرسانی نسخه

نسخه‌ها در `scripts/vendor-fontawesome.mjs` (`FA_VERSION` و `REACT_FA_VERSION`) تنظیم شده‌اند. اسکریپت را دوباره اجرا کنید و `vendor/` را commit کنید.
