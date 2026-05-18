import { getDatabaseEnvStatus } from "../../../lib/db";
import { getDatabaseEnvDebug } from "../../../lib/db-debug";

export const dynamic = "force-dynamic";

export async function GET() {
  const status = getDatabaseEnvStatus();
  const debug = await getDatabaseEnvDebug();

  return Response.json({
    ok: status.ok,
    missing: status.missing,
    configured: status.configured,
    hostHint: status.hostHint,
    debug,
    nodeEnv: process.env.NODE_ENV ?? null,
  });
}
