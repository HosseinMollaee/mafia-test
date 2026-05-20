import Link from "next/link";
import {
  getFontAwesomeReachReport,
  type FontAwesomeReachReport,
  type RegistryProbe,
} from "../../lib/fontawesome-reach";
import { APP_VERSION } from "../../lib/version";

export const dynamic = "force-dynamic";

function registryOk(probe: RegistryProbe): boolean {
  return probe.reachable;
}

export default async function FontAwesomeReachPage() {
  const report = await getFontAwesomeReachReport();
  const faOk = registryOk(report.fontAwesomeRegistry);

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-200 px-4 py-12 dark:from-slate-900 dark:to-slate-800">
      <div className="w-full max-w-2xl">
        <div
          className={`rounded-2xl border-2 p-8 shadow-lg ${
            faOk
              ? "border-emerald-300 bg-emerald-50 dark:border-emerald-700 dark:bg-emerald-950/40"
              : "border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-950/40"
          }`}
        >
          <div className="mb-6 flex items-center gap-3">
            <span
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-2xl text-white ${
                faOk ? "bg-emerald-500" : "bg-amber-500"
              }`}
              aria-hidden
            >
              {faOk ? "✓" : "!"}
            </span>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
              دسترسی سرور به npm.fontawesome.com
            </h1>
          </div>

          <p className="mb-6 text-sm leading-relaxed text-slate-700 dark:text-slate-200">
            {report.interpretation}
          </p>

          <RegistryPanel
            title="Font Awesome registry"
            probe={report.fontAwesomeRegistry}
            hint="وضعیت 401 یا 200 یعنی HTTPS به سرور رسیده است."
          />

          <RegistryPanel
            title="npm عمومی (مقایسه)"
            probe={report.npmPublicRegistry}
            hint="اگر FA باز باشد ولی اینجا خطا باشد، فقط بعضی دامنه‌ها allowlist شده‌اند."
          />

          <VendorPanel report={report} />

          <dl className="mt-4 space-y-2 rounded-xl border border-slate-200 bg-white/60 p-4 text-xs font-mono dark:border-slate-700 dark:bg-slate-900/50">
            <div className="grid grid-cols-[10rem_1fr] gap-2">
              <dt className="text-slate-500">زمان تست</dt>
              <dd className="text-slate-800 dark:text-slate-200">{report.checkedAt}</dd>
            </div>
            <div className="grid grid-cols-[10rem_1fr] gap-2">
              <dt className="text-slate-500">NODE_ENV</dt>
              <dd className="text-slate-800 dark:text-slate-200">
                {report.nodeEnv ?? "—"}
              </dd>
            </div>
            <div className="grid grid-cols-[10rem_1fr] gap-2">
              <dt className="text-slate-500">FONTAWESOME_TOKEN</dt>
              <dd className="text-slate-800 dark:text-slate-200">
                {report.fontAwesomeTokenConfigured ? "تنظیم شده" : "تنظیم نشده"}
              </dd>
            </div>
          </dl>
        </div>

        <p className="mt-6 space-y-2 text-center">
          <span className="block font-mono text-xs text-slate-500 dark:text-slate-400">
            نسخهٔ استقرار: {APP_VERSION}
          </span>
          <Link
            href="/api/fontawesome-reach"
            className="block text-sm text-slate-600 underline-offset-4 hover:underline dark:text-slate-400"
          >
            JSON خام: /api/fontawesome-reach
          </Link>
          <Link
            href="/"
            className="block text-sm text-slate-600 underline-offset-4 hover:underline dark:text-slate-400"
          >
            بازگشت به صفحه اصلی
          </Link>
        </p>
      </div>
    </main>
  );
}

function RegistryPanel({
  title,
  probe,
  hint,
}: {
  title: string;
  probe: RegistryProbe;
  hint: string;
}) {
  const ok = probe.reachable;

  return (
    <section
      className={`mb-4 rounded-xl border p-4 ${
        ok
          ? "border-emerald-200 bg-white/80 dark:border-emerald-800 dark:bg-slate-900/50"
          : "border-red-200 bg-white/80 dark:border-red-800 dark:bg-slate-900/50"
      }`}
    >
      <h2 className="mb-2 font-semibold text-slate-800 dark:text-slate-100">{title}</h2>
      <p className="mb-3 font-mono text-xs break-all text-slate-600 dark:text-slate-400">
        {probe.url}
      </p>
      {ok ? (
        <p className="text-lg font-semibold text-emerald-700 dark:text-emerald-400">
          در دسترس — HTTP {probe.status} {probe.statusText ?? ""}
        </p>
      ) : (
        <p className="text-lg font-semibold text-red-700 dark:text-red-400">
          در دسترس نیست
        </p>
      )}
      {probe.error && (
        <p className="mt-2 font-mono text-sm text-red-800 dark:text-red-300">
          {probe.error}
        </p>
      )}
      <p className="mt-2 text-xs text-slate-500">{hint}</p>
      <p className="mt-1 font-mono text-xs text-slate-500">
        زمان پاسخ: {probe.elapsedMs} ms
      </p>
    </section>
  );
}

function VendorPanel({ report }: { report: FontAwesomeReachReport }) {
  const { vendor } = report;

  return (
    <section className="mb-4 rounded-xl border border-slate-200 bg-white/80 p-4 dark:border-slate-700 dark:bg-slate-900/50">
      <h2 className="mb-2 font-semibold text-slate-800 dark:text-slate-100">
        vendor/fortawesome در image
      </h2>
      {vendor.complete ? (
        <p className="text-emerald-700 dark:text-emerald-400">
          کامل است — build بدون npm.fontawesome.com هم کار می‌کند.
        </p>
      ) : (
        <>
          <p className="text-red-700 dark:text-red-400">ناقص است</p>
          <ul className="mt-2 list-inside list-disc font-mono text-xs text-slate-700 dark:text-slate-300">
            {vendor.missing.map((d) => (
              <li key={d}>{d}</li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
