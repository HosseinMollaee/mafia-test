import { getDatabaseEnvStatus } from "../../../lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const status = getDatabaseEnvStatus();

  return Response.json({
    ok: status.ok,
    missing: status.missing,
    configured: status.configured,
    nodeEnv: process.env.NODE_ENV ?? null,
  });
}
