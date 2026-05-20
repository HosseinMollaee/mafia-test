import { getFontAwesomeReachReport } from "../../../lib/fontawesome-reach";

export const dynamic = "force-dynamic";

export async function GET() {
  const report = await getFontAwesomeReachReport();
  return Response.json(report);
}
