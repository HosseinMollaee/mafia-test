import "server-only";
import { setDefaultResultOrder } from "node:dns";
import { lookup } from "node:dns/promises";

setDefaultResultOrder("ipv4first");

function runtimeEnv(name: string): string | undefined {
  const value = process.env[name];
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function parseEndpointHost(endpoint: string): string | null {
  const trimmed = endpoint.trim();
  try {
    const withScheme = trimmed.startsWith("http") ? trimmed : `https://${trimmed}`;
    return new URL(withScheme).hostname;
  } catch {
    return null;
  }
}

export type StorageEnvDebug = {
  variables: Record<string, string>;
  endpoint: {
    raw: string;
    normalized: string;
    hostname: string;
  };
  dns: {
    hostname: string;
    addresses: string[];
    error: string | null;
  };
  warnings: string[];
};

export async function getStorageEnvDebug(): Promise<StorageEnvDebug> {
  const rawEndpoint = runtimeEnv("S3_ENDPOINT") ?? "";
  const normalized = rawEndpoint
    ? rawEndpoint.startsWith("http")
      ? rawEndpoint
      : `https://${rawEndpoint}`
    : "";
  const hostname = rawEndpoint ? (parseEndpointHost(rawEndpoint) ?? "") : "";

  const variables: Record<string, string> = {
    S3_ENDPOINT: rawEndpoint || "(خالی)",
    S3_BUCKET: runtimeEnv("S3_BUCKET") ?? "(خالی)",
    S3_ACCESS_KEY: runtimeEnv("S3_ACCESS_KEY") ? "****" : "(خالی)",
    S3_SECRET_KEY: runtimeEnv("S3_SECRET_KEY") ? "****" : "(خالی)",
  };

  let addresses: string[] = [];
  let dnsError: string | null = null;

  if (hostname) {
    try {
      const results = await lookup(hostname, { all: true });
      addresses = results.map((entry) => entry.address);
    } catch (err) {
      dnsError = err instanceof Error ? err.message : String(err);
    }
  }

  const warnings: string[] = [];

  if (!rawEndpoint) {
    warnings.push("S3_ENDPOINT تنظیم نشده است.");
  } else if (!rawEndpoint.startsWith("https://")) {
    warnings.push(
      "S3_ENDPOINT بهتر است با https:// شروع شود، مثلاً https://c397086.parspack.net"
    );
  }

  if (rawEndpoint.includes("/")) {
    const path = new URL(
      rawEndpoint.startsWith("http") ? rawEndpoint : `https://${rawEndpoint}`
    ).pathname;
    if (path && path !== "/") {
      warnings.push(
        "مسیر (path) در S3_ENDPOINT نباید باشد؛ فقط آدرس پایه از پنل، بدون نام باکت."
      );
    }
  }

  if (dnsError?.includes("EAI_AGAIN")) {
    warnings.push(
      "DNS موقت شکست خورده (EAI_AGAIN). دوباره تلاش کنید؛ اگر در کانتینر پارس‌پک هستید redeploy کنید یا DNS سرور را بررسی کنید."
    );
  }

  if (dnsError?.includes("ENOTFOUND")) {
    warnings.push(
      "نام host در S3_ENDPOINT پیدا نشد. مقدار را از پنل فضای ابری کپی کنید (مثل c123456.parspack.net)."
    );
  }

  return {
    variables,
    endpoint: {
      raw: rawEndpoint || "(خالی)",
      normalized: normalized || "(خالی)",
      hostname: hostname || "(خالی)",
    },
    dns: {
      hostname: hostname || "(خالی)",
      addresses,
      error: dnsError,
    },
    warnings,
  };
}
