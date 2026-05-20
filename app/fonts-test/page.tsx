"use client";

import Link from "next/link";

const SAMPLE_TEXT =
  "فونت‌های لایسنس‌شدهٔ فان مافیا — ۱۲۳۴۵۶۷۸۹۰. این یک متن نمونه برای بررسی خوانایی، اعداد فارسی و فاصله‌گذاری است.";

function WeightRow({
  label,
  className,
}: {
  label: string;
  className: string;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-600 dark:bg-slate-800">
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
          {label}
        </span>
        <span className="font-mono text-xs text-slate-500 dark:text-slate-400">
          {className}
        </span>
      </div>
      <p className={`text-base leading-8 text-slate-800 dark:text-slate-100 ${className}`}>
        {SAMPLE_TEXT}
      </p>
    </div>
  );
}

export default function FontsTestPage() {
  return (
    <main className="flex min-h-screen flex-col items-center gap-8 bg-gradient-to-br from-slate-50 to-slate-200 px-4 py-10 dark:from-slate-900 dark:to-slate-800">
      <div className="flex w-full max-w-3xl flex-col items-center gap-4 text-center">
        <h1 className="text-3xl font-semibold text-slate-800 dark:text-slate-100">
          تست فونت‌های فارسی (IRANYekanX / IRANSansDN)
        </h1>
        <div className="w-full rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 dark:border-emerald-700 dark:bg-emerald-950 dark:text-emerald-100">
          فونت پیش‌فرض پروژه: <span className="font-semibold">IRANYekanX</span> — برای
          آیکن‌ها فونت/سیستم جداگانه (مثل Asam یا SVG) باید خودِ کامپوننت تعیین کند.
        </div>
      </div>

      <section className="w-full max-w-3xl">
        <h2 className="mb-4 text-lg font-medium text-slate-700 dark:text-slate-200">
          IRANYekanX (پیش‌فرض)
        </h2>
        <div className="grid gap-4">
          <WeightRow label="Thin (100)" className="font-thin" />
          <WeightRow label="UltraLight (200)" className="font-extralight" />
          <WeightRow label="Light (300)" className="font-light" />
          <WeightRow label="Regular (400)" className="font-normal" />
          <WeightRow label="Medium (500)" className="font-medium" />
          <WeightRow label="DemiBold (600)" className="font-semibold" />
          <WeightRow label="Bold (700)" className="font-bold" />
          <WeightRow label="ExtraBold (800)" className="font-extrabold" />
          <WeightRow label="Black (900)" className="font-black" />
        </div>
      </section>

      <section className="w-full max-w-3xl">
        <h2 className="mb-4 text-lg font-medium text-slate-700 dark:text-slate-200">
          IRANSansDN (کلاس `font-iransansdn`)
        </h2>
        <div className="grid gap-4 font-iransansdn">
          <WeightRow label="Light (300)" className="font-light" />
          <WeightRow label="Regular (400)" className="font-normal" />
          <WeightRow label="Bold (700)" className="font-bold" />
        </div>
      </section>

      <section className="w-full max-w-3xl">
        <h2 className="mb-4 text-lg font-medium text-slate-700 dark:text-slate-200">
          فرم تست (ورودی/دکمه)
        </h2>
        <div className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-600 dark:bg-slate-800">
          <input
            className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none ring-0 focus:border-slate-400 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
            defaultValue="متن ورودی: ۱۲۳۴۵۶۷۸۹۰"
          />
          <button
            type="button"
            className="w-fit rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
          >
            دکمهٔ نمونه
          </button>
        </div>
      </section>

      <Link
        href="/"
        className="text-sm text-slate-600 underline hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
      >
        بازگشت به صفحهٔ اصلی
      </Link>
    </main>
  );
}

