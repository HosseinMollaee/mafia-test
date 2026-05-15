import Link from "next/link";
import { pool } from "../../lib/db";

type DbTestResult = {
  success: boolean;
  error: string | null;
  currentTime: string | null;
  pgVersion: string | null;
  dbName: string | null;
};

async function runDbTest(): Promise<DbTestResult> {
  let client;

  try {
    client = await pool.connect();

    const timeResult = await client.query<{ current_time: Date }>(
      "SELECT NOW() AS current_time"
    );
    const versionResult = await client.query<{ pg_version: string }>(
      "SELECT version() AS pg_version"
    );
    const dbNameResult = await client.query<{ db_name: string }>(
      "SELECT current_database() AS db_name"
    );

    return {
      success: true,
      error: null,
      currentTime: String(timeResult.rows[0]?.current_time ?? ""),
      pgVersion: versionResult.rows[0]?.pg_version ?? null,
      dbName: dbNameResult.rows[0]?.db_name ?? null,
    };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "خطای ناشناخته در اتصال به دیتابیس";
    return {
      success: false,
      error: message,
      currentTime: null,
      pgVersion: null,
      dbName: null,
    };
  } finally {
    client?.release();
  }
}

export default async function DbTestPage() {
  const result = await runDbTest();

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-200 px-4 py-12 dark:from-slate-900 dark:to-slate-800">
      <div className="w-full max-w-lg">
        <div
          className={`rounded-2xl border-2 p-8 shadow-lg ${
            result.success
              ? "border-emerald-300 bg-emerald-50 dark:border-emerald-700 dark:bg-emerald-950/40"
              : "border-red-300 bg-red-50 dark:border-red-700 dark:bg-red-950/40"
          }`}
        >
          <div className="mb-6 flex items-center gap-3">
            {result.success ? (
              <span
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-2xl text-white"
                aria-hidden
              >
                ✓
              </span>
            ) : (
              <span
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-red-500 text-2xl text-white"
                aria-hidden
              >
                ✕
              </span>
            )}
            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
              تست اتصال به PostgreSQL
            </h1>
          </div>

          {result.success ? (
            <div className="space-y-4 text-slate-700 dark:text-slate-200">
              <p className="text-lg font-semibold text-emerald-700 dark:text-emerald-400">
                اتصال با موفقیت برقرار شد
              </p>
              <dl className="space-y-3 rounded-xl bg-white/60 p-4 dark:bg-slate-900/50">
                <div>
                  <dt className="text-sm font-medium text-slate-500 dark:text-slate-400">
                    زمان فعلی دیتابیس
                  </dt>
                  <dd className="mt-1 font-mono text-sm">{result.currentTime}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-slate-500 dark:text-slate-400">
                    نسخه PostgreSQL
                  </dt>
                  <dd className="mt-1 break-all font-mono text-sm">
                    {result.pgVersion}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-slate-500 dark:text-slate-400">
                    نام دیتابیس
                  </dt>
                  <dd className="mt-1 font-mono text-sm">{result.dbName}</dd>
                </div>
              </dl>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-lg font-semibold text-red-700 dark:text-red-400">
                اتصال برقرار نشد
              </p>
              <p className="rounded-xl bg-white/60 p-4 font-mono text-sm leading-relaxed text-red-800 dark:bg-slate-900/50 dark:text-red-300">
                {result.error}
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                متغیرهای محیطی DATABASE_* را در فایل .env.local یا پنل پارس‌پک
                بررسی کنید.
              </p>
            </div>
          )}
        </div>

        <p className="mt-6 text-center">
          <Link
            href="/"
            className="text-sm text-slate-600 underline-offset-4 hover:underline dark:text-slate-400"
          >
            بازگشت به صفحه اصلی
          </Link>
        </p>
      </div>
    </main>
  );
}
