import Link from "next/link";
import { APP_VERSION } from "../lib/version";

export const dynamic = "force-dynamic";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 bg-gradient-to-br from-slate-50 to-slate-200 px-4 dark:from-slate-900 dark:to-slate-800">
      <h1 className="text-center text-4xl font-semibold tracking-tight text-slate-800 dark:text-slate-100 md:text-5xl">
        سلام از پارس‌پک
      </h1>
      <div className="flex flex-col items-center gap-4">
        <Link
          href="/db-test"
          className="rounded-lg bg-slate-800 px-6 py-3 text-sm font-medium text-white transition hover:bg-slate-700 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
        >
          تست اتصال به دیتابیس
        </Link>
        <Link
          href="/prisma-test"
          className="rounded-lg bg-slate-800 px-6 py-3 text-sm font-medium text-white transition hover:bg-slate-700 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
        >
          تست Prisma و Migration
        </Link>
        <Link
          href="/storage-test"
          className="rounded-lg bg-slate-800 px-6 py-3 text-sm font-medium text-white transition hover:bg-slate-700 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
        >
          تست فضای ابری
        </Link>
        <Link
          href="/dexie-test"
          className="rounded-lg bg-slate-800 px-6 py-3 text-sm font-medium text-white transition hover:bg-slate-700 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
        >
          تست منطق آفلاین
        </Link>
        <Link
          href="/sms-test"
          className="rounded-lg bg-slate-800 px-6 py-3 text-sm font-medium text-white transition hover:bg-slate-700 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
        >
          تست ارسال پیامک
        </Link>
        <Link
          href="/fontawesome-test"
          className="rounded-lg bg-slate-800 px-6 py-3 text-sm font-medium text-white transition hover:bg-slate-700 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
        >
          تست Font Awesome Pro
        </Link>
        <Link
          href="/fontawesome-reach"
          className="rounded-lg bg-slate-800 px-6 py-3 text-sm font-medium text-white transition hover:bg-slate-700 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
        >
          تست دسترسی npm.fontawesome.com
        </Link>
        <Link
          href="/fonts-test"
          className="rounded-lg bg-slate-800 px-6 py-3 text-sm font-medium text-white transition hover:bg-slate-700 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
        >
          تست فونت‌های فارسی
        </Link>
      </div>
      <p className="font-mono text-xs text-slate-500 dark:text-slate-400">
        نسخهٔ استقرار: {APP_VERSION}
      </p>
    </main>
  );
}
