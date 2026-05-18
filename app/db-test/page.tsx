import Link from "next/link";
import {
  getDatabaseEnvStatus,
  getDbErrorMessage,
  getPool,
  resetPool,
} from "../../lib/db";
import { getDatabaseEnvDebug, type DatabaseEnvDebug } from "../../lib/db-debug";
import { APP_VERSION } from "../../lib/version";

export const dynamic = "force-dynamic";

type DbTestResult = {
  success: boolean;
  error: string | null;
  currentTime: string | null;
  pgVersion: string | null;
  dbName: string | null;
  envStatus: ReturnType<typeof getDatabaseEnvStatus>;
  envDebug: DatabaseEnvDebug;
};

async function runDbTest(): Promise<DbTestResult> {
  resetPool();
  const envStatus = getDatabaseEnvStatus();
  const envDebug = await getDatabaseEnvDebug();

  if (!envStatus.ok) {
    return {
      success: false,
      error: `متغیرهای محیطی در کانتینر یافت نشد: ${envStatus.missing.join("، ")}`,
      currentTime: null,
      pgVersion: null,
      dbName: null,
      envStatus,
      envDebug,
    };
  }

  let client;

  try {
    client = await getPool().connect();

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
      envStatus,
      envDebug,
    };
  } catch (err) {
    return {
      success: false,
      error: getDbErrorMessage(err),
      currentTime: null,
      pgVersion: null,
      dbName: null,
      envStatus,
      envDebug,
    };
  } finally {
    client?.release();
  }
}

export default async function DbTestPage() {
  const result = await runDbTest();

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-200 px-4 py-12 dark:from-slate-900 dark:to-slate-800">
      <div className="w-full max-w-xl">
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
            <div className="space-y-4">
              <p className="text-lg font-semibold text-red-700 dark:text-red-400">
                اتصال برقرار نشد
              </p>
              <p className="rounded-xl bg-white/60 p-4 font-mono text-sm leading-relaxed text-red-800 dark:bg-slate-900/50 dark:text-red-300">
                {result.error}
              </p>
            </div>
          )}

          <EnvDebugPanel debug={result.envDebug} />
        </div>

        <p className="mt-6 space-y-2 text-center">
          <span className="block font-mono text-xs text-slate-500 dark:text-slate-400">
            نسخهٔ استقرار: {APP_VERSION}
          </span>
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

function EnvDebugPanel({ debug }: { debug: DatabaseEnvDebug }) {
  return (
    <div className="mt-4 space-y-3 rounded-xl border border-slate-200 bg-white/80 p-4 text-sm dark:border-slate-700 dark:bg-slate-900/50">
      <p className="font-semibold text-slate-800 dark:text-slate-100">
        مقادیر واقعی در کانتینر (رمز مخفی)
      </p>
      <dl className="space-y-2 font-mono text-xs break-all">
        {Object.entries(debug.variables).map(([key, value]) => (
          <div key={key} className="grid grid-cols-[9rem_1fr] gap-2">
            <dt className="text-slate-500">{key}</dt>
            <dd className="text-slate-800 dark:text-slate-200">{value}</dd>
          </div>
        ))}
      </dl>

      <div className="border-t border-slate-200 pt-3 dark:border-slate-700">
        <p className="mb-1 font-medium text-slate-700 dark:text-slate-300">
          نتیجهٔ DNS برای host
        </p>
        {debug.dns.error ? (
          <p className="font-mono text-xs text-red-600">{debug.dns.error}</p>
        ) : debug.dns.addresses.length > 0 ? (
          <p className="font-mono text-xs text-slate-700 dark:text-slate-200">
            {debug.dns.hostname} → {debug.dns.addresses.join(", ")}
          </p>
        ) : (
          <p className="text-xs text-slate-500">بدون نتیجه</p>
        )}
        <p className="mt-2 font-mono text-xs text-slate-600 dark:text-slate-400">
          هدف اتصال: {debug.connectionTarget.host}:
          {debug.connectionTarget.port} / {debug.connectionTarget.database} (
          {debug.connectionTarget.user})
        </p>
      </div>

      <DatabaseUrlPanel validation={debug.urlValidation} />

      {debug.warnings.length > 0 && (
        <ul className="space-y-2 border-t border-amber-200 pt-3 text-amber-950 dark:border-amber-800 dark:text-amber-100">
          {debug.warnings.map((warning) => (
            <li key={warning} className="list-inside list-disc">
              {warning}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function DatabaseUrlPanel({
  validation,
}: {
  validation: DatabaseEnvDebug["urlValidation"];
}) {
  const statusStyles = {
    match: "border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-100",
    mismatch:
      "border-red-300 bg-red-50 text-red-900 dark:border-red-700 dark:bg-red-950/40 dark:text-red-100",
    not_set:
      "border-slate-200 bg-slate-50 text-slate-800 dark:border-slate-600 dark:bg-slate-900/40 dark:text-slate-200",
    incomplete_parts:
      "border-amber-300 bg-amber-50 text-amber-950 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-100",
    invalid_env_url:
      "border-red-300 bg-red-50 text-red-900 dark:border-red-700 dark:bg-red-950/40 dark:text-red-100",
  };

  const statusLabel = {
    match: "✓ هم‌خوان",
    mismatch: "✕ ناهم‌خوان",
    not_set: "— تنظیم نشده",
    incomplete_parts: "؟ ناقص",
    invalid_env_url: "✕ نامعتبر",
  };

  return (
    <div
      className={`rounded-lg border p-3 ${statusStyles[validation.status]}`}
    >
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <p className="font-semibold">بررسی DATABASE_URL</p>
        <span className="text-xs font-medium">{statusLabel[validation.status]}</span>
      </div>
      <p className="text-xs leading-relaxed">{validation.message}</p>

      <dl className="mt-3 space-y-2 font-mono text-xs break-all">
        <div>
          <dt className="text-slate-500 dark:text-slate-400">DATABASE_URL (env)</dt>
          <dd>{validation.envUrlMasked ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-slate-500 dark:text-slate-400">
            URL ساخته‌شده از پارامترها
          </dt>
          <dd>{validation.builtUrlMasked}</dd>
        </div>
      </dl>

      {validation.details.length > 0 && (
        <ul className="mt-2 space-y-1 text-xs">
          {validation.details.map((detail) => (
            <li key={detail} className="list-inside list-disc">
              {detail}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
