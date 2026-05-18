"use client";

import Link from "next/link";
import { useLiveQuery } from "dexie-react-hooks";
import { useCallback, useEffect, useState } from "react";
import {
  addSession,
  clearAllSessions,
  countSessions,
  getAllSessions,
  isIndexedDBAvailable,
  type GameSession,
} from "../../lib/offline-db";

const ROLES = ["شهروند", "مافیا", "دکتر", "کارآگاه", "اسنایپر"] as const;
const NAMES = ["علی", "سارا", "رضا", "مینا", "حسین", "نازنین", "امیر", "لیلا"];

function randomItem<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("fa-IR", {
    dateStyle: "short",
    timeStyle: "medium",
  }).format(date);
}

export default function DexieTestPage() {
  const [idbOk, setIdbOk] = useState<boolean | null>(null);
  const [status, setStatus] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [showList, setShowList] = useState(false);

  useEffect(() => {
    setIdbOk(isIndexedDBAvailable());
  }, []);

  const sessionCount = useLiveQuery(
    () => (isIndexedDBAvailable() ? countSessions() : Promise.resolve(0)),
    [],
    0
  );

  const sessions = useLiveQuery(
    () =>
      isIndexedDBAvailable() && showList
        ? getAllSessions()
        : Promise.resolve([] as GameSession[]),
    [showList],
    [] as GameSession[]
  );

  const handleAddSample = useCallback(async () => {
    setStatus(null);
    try {
      const id = await addSession({
        deckNumber: Math.floor(Math.random() * 52) + 1,
        playerName: randomItem(NAMES),
        role: randomItem(ROLES),
        createdAt: new Date(),
      });
      setStatus({
        type: "success",
        message: `رکورد نمونه با شناسه ${id} ذخیره شد.`,
      });
    } catch (err) {
      setStatus({
        type: "error",
        message:
          err instanceof Error
            ? err.message
            : "خطا در ذخیرهٔ رکورد. IndexedDB را بررسی کنید.",
      });
    }
  }, []);

  const handleShowAll = useCallback(() => {
    setStatus(null);
    setShowList(true);
    setStatus({
      type: "success",
      message: "لیست رکوردها از IndexedDB خوانده شد (به‌روزرسانی زنده).",
    });
  }, []);

  const handleClearAll = useCallback(async () => {
    setStatus(null);
    try {
      await clearAllSessions();
      setShowList(false);
      setStatus({
        type: "success",
        message: "همهٔ رکوردها پاک شدند.",
      });
    } catch (err) {
      setStatus({
        type: "error",
        message:
          err instanceof Error ? err.message : "خطا در پاک‌سازی جدول.",
      });
    }
  }, []);

  const handleSimulateSync = useCallback(async () => {
    setStatus(null);
    try {
      const all = await getAllSessions();
      const payload = all.map((s) => ({
        id: s.id,
        deckNumber: s.deckNumber,
        playerName: s.playerName,
        role: s.role,
        createdAt: s.createdAt.toISOString(),
      }));
      console.log("[Dexie sync simulation] Payload ready for server:", payload);
      console.log(
        `[Dexie sync simulation] ${payload.length} session(s) would be sent.`
      );
      setStatus({
        type: "success",
        message: `${payload.length} رکورد برای سینک در کنسول مرورگر (F12) چاپ شد.`,
      });
    } catch (err) {
      setStatus({
        type: "error",
        message:
          err instanceof Error
            ? err.message
            : "خطا در خواندن داده‌ها برای سینک.",
      });
    }
  }, []);

  if (idbOk === false) {
    return (
      <main
        dir="rtl"
        className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-200 px-4 py-12 dark:from-slate-900 dark:to-slate-800"
      >
        <div className="w-full max-w-xl rounded-2xl border-2 border-red-300 bg-red-50 p-8 shadow-lg dark:border-red-700 dark:bg-red-950/40">
          <p className="text-lg font-semibold text-red-700 dark:text-red-400">
            IndexedDB در دسترس نیست
          </p>
          <p className="mt-3 text-sm leading-relaxed text-red-800 dark:text-red-300">
            مرورگر شما به IndexedDB دسترسی ندارد (مثلاً حالت ناشناس با
            محدودیت، یا تنظیمات حریم خصوصی). منطق آفلاین Dexie بدون IndexedDB
            کار نمی‌کند. یک پنجرهٔ عادی باز کنید یا محدودیت ذخیره‌سازی را
            بردارید.
          </p>
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

  return (
    <main
      dir="rtl"
      className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-200 px-4 py-12 dark:from-slate-900 dark:to-slate-800"
    >
      <div className="w-full max-w-xl">
        <h1 className="mb-2 text-center text-2xl font-bold text-slate-800 dark:text-slate-100">
          تست Dexie.js — منطق آفلاین
        </h1>
        <p className="mb-6 text-center text-sm text-slate-600 dark:text-slate-400">
          برای تست ماندگاری، چند رکورد اضافه کن، مرورگر را ببند و دوباره باز
          کن؛ باید رکوردها سر جایشان باشند.
        </p>

        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-lg dark:border-slate-700 dark:bg-slate-900">
          <p className="mb-6 rounded-xl bg-slate-100 px-4 py-3 text-center text-sm font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-200">
            تعداد کل رکوردها:{" "}
            <span className="font-mono text-lg">{sessionCount ?? "…"}</span>
          </p>

          <div className="mb-6 space-y-3 rounded-xl bg-slate-50 p-4 dark:bg-slate-800/50">
            <button
              type="button"
              onClick={handleAddSample}
              className="w-full rounded-lg bg-slate-800 px-6 py-3 text-sm font-medium text-white transition hover:bg-slate-700 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
            >
              افزودن رکورد نمونه
            </button>
            <button
              type="button"
              onClick={handleShowAll}
              className="w-full rounded-lg border border-slate-300 bg-white px-6 py-3 text-sm font-medium text-slate-800 transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
            >
              نمایش همه
            </button>
            <button
              type="button"
              onClick={handleClearAll}
              className="w-full rounded-lg border border-red-200 bg-red-50 px-6 py-3 text-sm font-medium text-red-800 transition hover:bg-red-100 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300 dark:hover:bg-red-950/60"
            >
              پاک کردن همه
            </button>
            <button
              type="button"
              onClick={handleSimulateSync}
              className="w-full rounded-lg border border-emerald-300 bg-emerald-50 px-6 py-3 text-sm font-medium text-emerald-900 transition hover:bg-emerald-100 dark:border-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-200 dark:hover:bg-emerald-950/60"
            >
              شبیه‌سازی پایان بازی و سینک نتیجه
            </button>
          </div>

          {status && (
            <div
              className={`mb-6 rounded-2xl border-2 p-6 ${
                status.type === "success"
                  ? "border-emerald-300 bg-emerald-50 dark:border-emerald-700 dark:bg-emerald-950/40"
                  : "border-red-300 bg-red-50 dark:border-red-700 dark:bg-red-950/40"
              }`}
            >
              <div className="flex items-center gap-3">
                <span
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xl text-white ${
                    status.type === "success" ? "bg-emerald-500" : "bg-red-500"
                  }`}
                  aria-hidden
                >
                  {status.type === "success" ? "✓" : "✕"}
                </span>
                <p
                  className={`text-lg font-semibold ${
                    status.type === "success"
                      ? "text-emerald-700 dark:text-emerald-400"
                      : "text-red-700 dark:text-red-400"
                  }`}
                >
                  {status.type === "success" ? "موفق" : "ناموفق"}
                </p>
              </div>
              <p
                className={`mt-3 text-sm leading-relaxed ${
                  status.type === "success"
                    ? "text-emerald-800 dark:text-emerald-300"
                    : "text-red-800 dark:text-red-300"
                }`}
              >
                {status.message}
              </p>
            </div>
          )}

          {showList && sessions && sessions.length > 0 && (
            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
              <table className="w-full text-right text-sm">
                <thead className="bg-slate-100 dark:bg-slate-800">
                  <tr>
                    <th className="px-3 py-2 font-medium">شناسه</th>
                    <th className="px-3 py-2 font-medium">دک</th>
                    <th className="px-3 py-2 font-medium">بازیکن</th>
                    <th className="px-3 py-2 font-medium">نقش</th>
                    <th className="px-3 py-2 font-medium">زمان</th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.map((row) => (
                    <tr
                      key={row.id}
                      className="border-t border-slate-200 dark:border-slate-700"
                    >
                      <td className="px-3 py-2 font-mono">{row.id}</td>
                      <td className="px-3 py-2 font-mono">{row.deckNumber}</td>
                      <td className="px-3 py-2">{row.playerName}</td>
                      <td className="px-3 py-2">{row.role}</td>
                      <td className="px-3 py-2 font-mono text-xs">
                        {formatDate(row.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {showList && sessions && sessions.length === 0 && (
            <p className="text-center text-sm text-slate-500">
              هنوز رکوردی ذخیره نشده است.
            </p>
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
