import "server-only";
import {
  GetObjectCommand,
  ObjectCannedACL,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getParsPackBucketHintFromEndpoint } from "./storage-config";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { setDefaultResultOrder } from "node:dns";

// اگر پارس‌پک خطای SignatureDoesNotMatch داد، معمولاً به‌خاطر endpoint نادرست
// یا forcePathStyle: false است — برای S3 سازگار (غیر آمازون) forcePathStyle باید true باشد
// و endpoint باید با https:// شروع شود.
//
// EAI_AGAIN = شکست موقت DNS برای host در S3_ENDPOINT (مثلاً c397086.parspack.net).
// endpoint را از پنل کپی کنید؛ نام باکت را در S3_BUCKET بگذارید، نه در URL.
setDefaultResultOrder("ipv4first");

const TRANSIENT_NETWORK = /EAI_AGAIN|ENOTFOUND|ETIMEDOUT|ECONNRESET|ECONNREFUSED/i;

async function withTransientRetry<T>(fn: () => Promise<T>): Promise<T> {
  const delays = [0, 400, 1200];
  let lastError: unknown;

  for (const delay of delays) {
    if (delay > 0) {
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      const message = err instanceof Error ? err.message : String(err);
      if (!TRANSIENT_NETWORK.test(message)) {
        throw err;
      }
    }
  }

  throw lastError;
}

function formatStorageError(err: unknown, action: string): Error {
  const raw = err instanceof Error ? err.message : String(err);

  if (raw.includes("EAI_AGAIN")) {
    const host = process.env.S3_ENDPOINT?.trim() ?? "S3_ENDPOINT";
    return new Error(
      `${action}: نام سرور فضای ابری resolve نشد (DNS موقت: EAI_AGAIN). ` +
        `مقدار S3_ENDPOINT را بررسی کنید (مثلاً https://c397086.parspack.net بدون مسیر باکت). ` +
        `اگر روی پارس‌پک deploy کرده‌اید، یک‌بار redeploy کنید یا چند ثانیه بعد دوباره آپلود کنید. host: ${host}`
    );
  }

  if (raw.includes("ENOTFOUND")) {
    return new Error(
      `${action}: آدرس S3_ENDPOINT اشتباه است یا در DNS وجود ندارد. مقدار را از پنل فضای ابری کپی کنید.`
    );
  }

  if (/access denied/i.test(raw)) {
    const endpoint = process.env.S3_ENDPOINT?.trim() ?? "";
    const bucket = process.env.S3_BUCKET?.trim() ?? "";
    const hint = endpoint ? getParsPackBucketHintFromEndpoint(endpoint) : null;
    let extra =
      " کلید دسترسی (Access/Secret) را از همان فضای ابری در پنل کپی کنید.";
    if (hint && bucket && bucket !== hint) {
      extra =
        ` S3_BUCKET احتمالاً باید «${hint}» باشد (نه «${bucket}») — در مستندات پارس‌پک bucketName همان شناسهٔ endpoint است.`;
    } else if (hint) {
      extra = ` نام باکت S3 باید «${hint}» باشد.${extra}`;
    }
    return new Error(`${action}: دسترسی رد شد (Access Denied).${extra}`);
  }

  return new Error(`${action}: ${raw}`);
}

function normalizeEndpoint(raw: string): string {
  const trimmed = raw.trim();
  if (trimmed.startsWith("https://") || trimmed.startsWith("http://")) {
    return trimmed;
  }
  return `https://${trimmed}`;
}

export function getS3Client(): S3Client {
  const endpoint = process.env.S3_ENDPOINT;
  const accessKeyId = process.env.S3_ACCESS_KEY;
  const secretAccessKey = process.env.S3_SECRET_KEY;

  if (!endpoint || !accessKeyId || !secretAccessKey) {
    throw new Error(
      "متغیرهای محیطی S3 تنظیم نشده‌اند (S3_ENDPOINT، S3_ACCESS_KEY، S3_SECRET_KEY)"
    );
  }

  return new S3Client({
    endpoint: normalizeEndpoint(endpoint),
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
    region: "us-east-1",
    forcePathStyle: true,
  });
}

function getBucket(): string {
  const bucket = process.env.S3_BUCKET;
  if (!bucket) {
    throw new Error("متغیر محیطی S3_BUCKET تنظیم نشده است");
  }
  return bucket;
}

export async function uploadFile(
  buffer: Buffer,
  fileName: string,
  contentType: string
): Promise<void> {
  try {
    const client = getS3Client();
    const bucket = getBucket();

    await withTransientRetry(() =>
      client.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: fileName,
          Body: buffer,
          ContentType: contentType,
          ACL: ObjectCannedACL.private,
        })
      )
    );
  } catch (err) {
    throw formatStorageError(err, "آپلود فایل ناموفق بود");
  }
}

export async function getFileUrl(fileName: string): Promise<string> {
  try {
    const client = getS3Client();
    const bucket = getBucket();

    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: fileName,
    });

    return await withTransientRetry(() =>
      getSignedUrl(client, command, { expiresIn: 3600 })
    );
  } catch (err) {
    throw formatStorageError(err, "ساخت آدرس موقت ناموفق بود");
  }
}
