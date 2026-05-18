import "server-only";
import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// اگر پارس‌پک خطای SignatureDoesNotMatch داد، معمولاً به‌خاطر endpoint نادرست
// یا forcePathStyle: false است — برای S3 سازگار (غیر آمازون) forcePathStyle باید true باشد
// و endpoint باید با https:// شروع شود.

function normalizeEndpoint(raw: string): string {
  const trimmed = raw.trim();
  if (trimmed.startsWith("https://") || trimmed.startsWith("http://")) {
    return trimmed;
  }
  return `https://${trimmed}`;
}

function getS3Client(): S3Client {
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

    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: fileName,
        Body: buffer,
        ContentType: contentType,
      })
    );
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "خطای ناشناخته در آپلود";
    throw new Error(`آپلود فایل ناموفق بود: ${message}`);
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

    return await getSignedUrl(client, command, { expiresIn: 3600 });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "خطای ناشناخته در ساخت آدرس";
    throw new Error(`ساخت آدرس موقت ناموفق بود: ${message}`);
  }
}
