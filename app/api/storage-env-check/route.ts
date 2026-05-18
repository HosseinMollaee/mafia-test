import { getStorageEnvDebug } from "../../../lib/storage-debug";

export const dynamic = "force-dynamic";

export async function GET() {
  const debug = await getStorageEnvDebug();
  const configured = Boolean(
    process.env.S3_ENDPOINT?.trim() &&
      process.env.S3_ACCESS_KEY?.trim() &&
      process.env.S3_SECRET_KEY?.trim() &&
      process.env.S3_BUCKET?.trim()
  );

  return Response.json({
    ok: configured && !debug.dns.error && debug.dns.addresses.length > 0,
    configured,
    debug,
  });
}
