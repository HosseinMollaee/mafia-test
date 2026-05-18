import Link from "next/link";
import { getPrismaErrorMessage, prisma } from "../../lib/prisma";
import { APP_VERSION } from "../../lib/version";

export const dynamic = "force-dynamic";

type TestConnectionRow = {
  id: number;
  label: string;
  createdAt: Date;
};

type PrismaTestResult = {
  success: boolean;
  error: string | null;
  databaseUrlConfigured: boolean;
  records: TestConnectionRow[];
  totalCount: number;
  createdLabel: string | null;
};

async function runPrismaTest(): Promise<PrismaTestResult> {
  const databaseUrlConfigured = Boolean(process.env.DATABASE_URL?.trim());

  if (!databaseUrlConfigured) {
    return {
      success: false,
      error: "متغیر محیطی DATABASE_URL در کانتینر تنظیم نشده است.",
      databaseUrlConfigured: false,
      records: [],
      totalCount: 0,
      createdLabel: null,
    };
  }

  const createdLabel = `تست ${new Date().toISOString()}`;

  try {
    await prisma.testConnection.create({
      data: { label: createdLabel },
    });

    const [records, totalCount] = await Promise.all([
      prisma.testConnection.findMany({
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
      prisma.testConnection.count(),
    ]);

    return {
      success: true,
      error: null,
      databaseUrlConfigured: true,
      records,
      totalCount,
      createdLabel,
    };
  } catch (err) {
    return {
      success: false,
      error: getPrismaErrorMessage(err),
      databaseUrlConfigured: true,
      records: [],
      totalCount: 0,
      createdLabel: null,
    };
  }
}

export default async function PrismaTestPage() {
  const result = await runPrismaTest();

  return (
    <main
      dir="rtl"
      className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-200 px-4 py-12 dark:from-slate-900 dark:to-slate-800"
    >
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
              تست Prisma و Migration
            </h1>
          </div>

          {result.success ? (
            <div className="space-y-4 text-slate-700 dark:text-slate-200">
              <p className="text-lg font-semibold text-emerald-700 dark:text-emerald-400">
                Prisma با موفقیت به دیتابیس متصل شد
              </p>
              <dl className="space-y-3 rounded-xl bg-white/60 p-4 dark:bg-slate-900/50">
                <div>
                  <dt className="text-sm font-medium text-slate-500 dark:text-slate-400">
                    آخرین رکورد ثبت‌شده
                  </dt>
                  <dd className="mt-1 font-mono text-sm">{result.createdLabel}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-slate-500 dark:text-slate-400">
                    تعداد کل رکوردها
                  </dt>
                  <dd className="mt-1 font-mono text-sm">{result.totalCount}</dd>
                </div>
              </dl>

              {result.records.length > 0 && (
                <div className="rounded-xl bg-white/60 p-4 dark:bg-slate-900/50">
                  <p className="mb-3 text-sm font-medium text-slate-500 dark:text-slate-400">
                    آخرین رکوردها (حداکثر ۲۰ مورد)
                  </p>
                  <ul className="space-y-2 font-mono text-xs">
                    {result.records.map((row) => (
                      <li
                        key={row.id}
                        className="rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-700"
                      >
                        <span className="text-slate-500">#{row.id}</span>{" "}
                        {row.label}
                        <span className="mt-1 block text-slate-400">
                          {row.createdAt.toISOString()}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-lg font-semibold text-red-700 dark:text-red-400">
                تست Prisma ناموفق بود
              </p>
              <p className="rounded-xl bg-white/60 p-4 font-mono text-sm leading-relaxed text-red-800 dark:bg-slate-900/50 dark:text-red-300">
                {result.error}
              </p>
              {!result.databaseUrlConfigured && (
                <p className="text-sm text-red-700 dark:text-red-400">
                  در پنل پارس‌پک متغیر DATABASE_URL را با اتصال داخلی (نام کوتاه
                  سرویس) تنظیم کنید. جزئیات در DEPLOY_NOTES.md
                </p>
              )}
            </div>
          )}

          <div className="mt-4 rounded-xl border border-slate-200 bg-white/80 p-4 text-sm dark:border-slate-700 dark:bg-slate-900/50">
            <p className="font-semibold text-slate-800 dark:text-slate-100">
              وضعیت متغیر محیطی
            </p>
            <p className="mt-1 font-mono text-xs text-slate-600 dark:text-slate-400">
              DATABASE_URL:{" "}
              {result.databaseUrlConfigured ? "تنظیم شده (مقدار نمایش داده نمی‌شود)" : "یافت نشد"}
            </p>
          </div>
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
