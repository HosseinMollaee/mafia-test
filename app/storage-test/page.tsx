"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

type UploadState =
  | { status: "idle" }
  | { status: "uploading" }
  | { status: "success"; url: string; fileName: string }
  | { status: "error"; message: string };

type StorageEnvCheck = {
  ok: boolean;
  configured: boolean;
  debug: {
    variables: Record<string, string>;
    endpoint: {
      raw: string;
      normalized: string;
      hostname: string;
      bucketHint: string | null;
    };
    bucket: {
      configured: string;
      matchesEndpointHint: boolean | null;
      headBucket: { ok: boolean; error: string | null };
    };
    dns: { hostname: string; addresses: string[]; error: string | null };
    warnings: string[];
  };
};

export default function StorageTestPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadState, setUploadState] = useState<UploadState>({
    status: "idle",
  });
  const previewRef = useRef<string | null>(null);
  const [envCheck, setEnvCheck] = useState<StorageEnvCheck | null>(null);

  useEffect(() => {
    fetch("/api/storage-env-check")
      .then((res) => res.json())
      .then((data: StorageEnvCheck) => setEnvCheck(data))
      .catch(() => setEnvCheck(null));
  }, []);

  useEffect(() => {
    if (!selectedFile) {
      if (previewRef.current) {
        URL.revokeObjectURL(previewRef.current);
        previewRef.current = null;
      }
      setPreviewUrl(null);
      return;
    }

    const objectUrl = URL.createObjectURL(selectedFile);
    previewRef.current = objectUrl;
    setPreviewUrl(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
      previewRef.current = null;
    };
  }, [selectedFile]);

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    setSelectedFile(file);
    setUploadState({ status: "idle" });
  }

  async function handleUpload() {
    if (!selectedFile) {
      setUploadState({
        status: "error",
        message: "لطفاً ابتدا یک عکس انتخاب کنید.",
      });
      return;
    }

    setUploadState({ status: "uploading" });

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const response = await fetch("/api/upload-test", {
        method: "POST",
        body: formData,
      });

      const data = (await response.json()) as {
        success: boolean;
        url?: string;
        fileName?: string;
        error?: string;
      };

      if (!response.ok || !data.success || !data.url) {
        setUploadState({
          status: "error",
          message: data.error ?? "آپلود ناموفق بود.",
        });
        return;
      }

      setUploadState({
        status: "success",
        url: data.url,
        fileName: data.fileName ?? "",
      });
    } catch {
      setUploadState({
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
          تست فضای ابری پارس‌پک
        </h1>

        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-lg dark:border-slate-700 dark:bg-slate-900">
          <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
            انتخاب عکس (JPEG، PNG یا WebP — حداکثر ۵ مگابایت)
          </label>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileChange}
            className="mb-4 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm file:ml-4 file:rounded-md file:border-0 file:bg-slate-200 file:px-4 file:py-2 file:text-sm file:font-medium dark:border-slate-600 dark:bg-slate-800 dark:file:bg-slate-700"
          />

          {previewUrl && (
            <div className="mb-6">
              <p className="mb-2 text-sm font-medium text-slate-600 dark:text-slate-400">
                پیش‌نمایش (قبل از آپلود)
              </p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewUrl}
                alt="پیش‌نمایش عکس انتخاب‌شده"
                className="max-h-64 w-full rounded-xl border border-slate-200 object-contain dark:border-slate-600"
              />
            </div>
          )}

          <button
            type="button"
            onClick={handleUpload}
            disabled={!selectedFile || uploadState.status === "uploading"}
            className="w-full rounded-lg bg-slate-800 px-6 py-3 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
          >
            {uploadState.status === "uploading"
              ? "در حال آپلود..."
              : "آپلود به فضای ابری"}
          </button>

          {uploadState.status === "uploading" && (
            <p className="mt-4 text-center text-sm text-slate-600 dark:text-slate-400">
              در حال آپلود به پارس‌پک...
            </p>
          )}

          {uploadState.status === "success" && (
            <div className="mt-6 rounded-2xl border-2 border-emerald-300 bg-emerald-50 p-6 dark:border-emerald-700 dark:bg-emerald-950/40">
              <div className="mb-4 flex items-center gap-3">
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-xl text-white"
                  aria-hidden
                >
                  ✓
                </span>
                <p className="text-lg font-semibold text-emerald-700 dark:text-emerald-400">
                  آپلود و دانلود موفق بود
                </p>
              </div>
              <p className="mb-3 text-sm text-slate-600 dark:text-slate-400">
                عکس زیر از فضای ابری (با آدرس موقت) بارگذاری شده است:
              </p>
              <p className="mb-3 break-all font-mono text-xs text-slate-500">
                {uploadState.fileName}
              </p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={uploadState.url}
                alt="عکس دانلود‌شده از فضای ابری"
                className="max-h-80 w-full rounded-xl border border-emerald-200 object-contain dark:border-emerald-800"
              />
            </div>
          )}

          {uploadState.status === "error" && (
            <div className="mt-6 rounded-2xl border-2 border-red-300 bg-red-50 p-6 dark:border-red-700 dark:bg-red-950/40">
              <div className="mb-3 flex items-center gap-3">
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-500 text-xl text-white"
                  aria-hidden
                >
                  ✕
                </span>
                <p className="text-lg font-semibold text-red-700 dark:text-red-400">
                  عملیات ناموفق
                </p>
              </div>
              <p className="rounded-xl bg-white/60 p-4 font-mono text-sm leading-relaxed text-red-800 dark:bg-slate-900/50 dark:text-red-300">
                {uploadState.message}
              </p>
            </div>
          )}
        </div>

        {envCheck && <StorageDebugPanel check={envCheck} />}

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

function StorageDebugPanel({ check }: { check: StorageEnvCheck }) {
  const { debug } = check;

  return (
    <div className="mt-6 rounded-xl border border-slate-200 bg-white/80 p-4 text-sm dark:border-slate-700 dark:bg-slate-900/50">
      <p className="mb-2 font-semibold text-slate-800 dark:text-slate-100">
        تشخیص DNS در سرور (رمز مخفی)
      </p>
      <dl className="space-y-2 font-mono text-xs break-all">
        {Object.entries(debug.variables).map(([key, value]) => (
          <div key={key} className="grid grid-cols-[7rem_1fr] gap-2">
            <dt className="text-slate-500">{key}</dt>
            <dd className="text-slate-800 dark:text-slate-200">{value}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-3 border-t border-slate-200 pt-3 dark:border-slate-700">
        <p className="mb-1 font-medium text-slate-700 dark:text-slate-300">
          نتیجهٔ DNS برای endpoint
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
          endpoint نرمال‌شده: {debug.endpoint.normalized}
        </p>
        {debug.endpoint.bucketHint && (
          <p className="mt-2 font-mono text-xs text-slate-600 dark:text-slate-400">
            نام باکت پیشنهادی (از endpoint): {debug.endpoint.bucketHint}
          </p>
        )}
      </div>
      <div className="mt-3 border-t border-slate-200 pt-3 dark:border-slate-700">
        <p className="mb-1 font-medium text-slate-700 dark:text-slate-300">
          دسترسی به باکت (HeadBucket)
        </p>
        {debug.bucket.headBucket.ok ? (
          <p className="text-xs text-emerald-700 dark:text-emerald-400">
            باکت «{debug.bucket.configured}» در دسترس است
          </p>
        ) : debug.bucket.headBucket.error ? (
          <p className="font-mono text-xs text-red-600">
            {debug.bucket.headBucket.error}
          </p>
        ) : (
          <p className="text-xs text-slate-500">بررسی نشده</p>
        )}
        {debug.bucket.matchesEndpointHint === false && (
          <p className="mt-2 text-xs text-amber-800 dark:text-amber-200">
            S3_BUCKET با شناسه endpoint هم‌خوان نیست.
          </p>
        )}
      </div>
      {debug.warnings.length > 0 && (
        <ul className="mt-3 space-y-2 border-t border-amber-200 pt-3 text-amber-950 dark:border-amber-800 dark:text-amber-100">
          {debug.warnings.map((warning) => (
            <li key={warning} className="list-inside list-disc text-xs">
              {warning}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
