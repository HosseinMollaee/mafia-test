"use client";

import Link from "next/link";
import { useState } from "react";

type SendState =
  | { status: "idle" }
  | { status: "sending" }
  | { status: "success" }
  | { status: "error"; message: string };

export default function SmsTestPage() {
  const [phone, setPhone] = useState("");
  const [sendState, setSendState] = useState<SendState>({ status: "idle" });

  async function handleSend() {
    const trimmed = phone.trim();

    if (!trimmed) {
      setSendState({
        status: "error",
        message: "لطفاً شماره موبایل را وارد کنید.",
      });
      return;
    }

    setSendState({ status: "sending" });

    try {
      const response = await fetch("/api/send-sms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: trimmed }),
      });

      const data = (await response.json()) as {
        success: boolean;
        error?: string;
      };

      if (!response.ok || !data.success) {
        setSendState({
          status: "error",
          message: data.error ?? "ارسال پیامک ناموفق بود.",
        });
        return;
      }

      setSendState({ status: "success" });
    } catch {
      setSendState({
        status: "error",
        message: "خطا در ارتباط با سرور. اتصال شبکه را بررسی کنید.",
      });
    }
  }

  return (
    <main
      dir="rtl"
      className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-200 px-4 py-12 dark:from-slate-900 dark:to-slate-800"
    >
      <div className="w-full max-w-xl">
        <h1 className="mb-6 text-center text-2xl font-bold text-slate-800 dark:text-slate-100">
          تست ارسال پیامک کاوه‌نگار
        </h1>

        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-lg dark:border-slate-700 dark:bg-slate-900">
          <label
            htmlFor="phone"
            className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300"
          >
            شماره موبایل (مثال: 09123456789)
          </label>
          <input
            id="phone"
            type="tel"
            inputMode="numeric"
            autoComplete="tel"
            placeholder="09123456789"
            value={phone}
            onChange={(e) => {
              setPhone(e.target.value);
              if (sendState.status !== "idle" && sendState.status !== "sending") {
                setSendState({ status: "idle" });
              }
            }}
            disabled={sendState.status === "sending"}
            className="mb-6 w-full rounded-lg border border-slate-300 bg-slate-50 px-4 py-3 text-left font-mono text-sm tracking-wide disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800"
            dir="ltr"
          />

          <button
            type="button"
            onClick={handleSend}
            disabled={sendState.status === "sending"}
            className="w-full rounded-lg bg-slate-800 px-6 py-3 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
          >
            {sendState.status === "sending" ? "در حال ارسال..." : "ارسال کد تست"}
          </button>

          {sendState.status === "sending" && (
            <p className="mt-4 text-center text-sm text-slate-600 dark:text-slate-400">
              در حال ارسال...
            </p>
          )}

          {sendState.status === "success" && (
            <div className="mt-6 rounded-2xl border-2 border-emerald-300 bg-emerald-50 p-6 dark:border-emerald-700 dark:bg-emerald-950/40">
              <div className="flex items-center gap-3">
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-xl text-white"
                  aria-hidden
                >
                  ✓
                </span>
                <p className="text-lg font-semibold text-emerald-700 dark:text-emerald-400">
                  پیامک ارسال شد، موبایلت رو چک کن
                </p>
              </div>
            </div>
          )}

          {sendState.status === "error" && (
            <div className="mt-6 rounded-2xl border-2 border-red-300 bg-red-50 p-6 dark:border-red-700 dark:bg-red-950/40">
              <div className="mb-3 flex items-center gap-3">
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-500 text-xl text-white"
                  aria-hidden
                >
                  ✕
                </span>
                <p className="text-lg font-semibold text-red-700 dark:text-red-400">
                  ارسال ناموفق
                </p>
              </div>
              <p className="rounded-xl bg-white/60 p-4 font-mono text-sm leading-relaxed text-red-800 dark:bg-slate-900/50 dark:text-red-300">
                {sendState.message}
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
