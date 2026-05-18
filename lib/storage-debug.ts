import "server-only";
import { HeadBucketCommand } from "@aws-sdk/client-s3";
import { setDefaultResultOrder } from "node:dns";
import { lookup } from "node:dns/promises";
import {
  getParsPackBucketHintFromEndpoint,
  parseEndpointHost,
} from "./storage-config";
import { getS3Client } from "./storage";

setDefaultResultOrder("ipv4first");

function runtimeEnv(name: string): string | undefined {
  const value = process.env[name];
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

export type StorageEnvDebug = {
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
  const bucketHint = rawEndpoint
    ? getParsPackBucketHintFromEndpoint(rawEndpoint)
    : null;
  const configuredBucket = runtimeEnv("S3_BUCKET") ?? "";
  const bucketMatchesHint = bucketHint
    ? configuredBucket.toLowerCase() === bucketHint.toLowerCase()
    : null;

  const variables: Record<string, string> = {
    S3_ENDPOINT: rawEndpoint || "(خالی)",
    S3_BUCKET: configuredBucket || "(خالی)",
    S3_BUCKET_HINT_FROM_ENDPOINT: bucketHint ?? "(شناسایی نشد)",
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
    try {
      const path = new URL(
        rawEndpoint.startsWith("http") ? rawEndpoint : `https://${rawEndpoint}`
      ).pathname;
      if (path && path !== "/") {
        warnings.push(
          "مسیر (path) در S3_ENDPOINT نباید باشد؛ فقط آدرس پایه از پنل، بدون نام باکت."
        );
      }
    } catch {
      /* ignore invalid URL */
    }
  }

  if (dnsError?.includes("EAI_AGAIN")) {
    warnings.push(
      "DNS موقت شکست خورده (EAI_AGAIN). دوباره تلاش کنید یا redeploy کنید."
    );
  }

  if (dnsError?.includes("ENOTFOUND")) {
    warnings.push(
      "نام host در S3_ENDPOINT پیدا نشد. مقدار را از پنل فضای ابری کپی کنید."
    );
  }

  if (bucketHint && configuredBucket && !bucketMatchesHint) {
    warnings.push(
      `S3_BUCKET برابر «${configuredBucket}» است؛ در API پارس‌پک باید «${bucketHint}» باشد (همان کد endpoint). Access Denied معمولاً از همین اشتباه است.`
    );
  }

  let headBucketOk = false;
  let headBucketError: string | null = null;

  if (configuredBucket && rawEndpoint && !dnsError) {
    try {
      await getS3Client().send(
        new HeadBucketCommand({ Bucket: configuredBucket })
      );
      headBucketOk = true;
    } catch (err) {
      headBucketError = err instanceof Error ? err.message : String(err);
      if (/access denied/i.test(headBucketError) && bucketHint) {
        warnings.push(
          `HeadBucket برای «${configuredBucket}» رد شد. S3_BUCKET را به «${bucketHint}» تغییر دهید و redeploy کنید.`
        );
      }
    }
  }

  return {
    variables,
    endpoint: {
      raw: rawEndpoint || "(خالی)",
      normalized: normalized || "(خالی)",
      hostname: hostname || "(خالی)",
      bucketHint,
    },
    bucket: {
      configured: configuredBucket || "(خالی)",
      matchesEndpointHint: bucketMatchesHint,
      headBucket: { ok: headBucketOk, error: headBucketError },
    },
    dns: {
      hostname: hostname || "(خالی)",
      addresses,
      error: dnsError,
    },
    warnings,
  };
}
