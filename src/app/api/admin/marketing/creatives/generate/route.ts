import { NextRequest } from "next/server";
import { requireMcToken } from "../../_lib/mcAuth";

export async function POST(req: NextRequest) {
  const auth = requireMcToken(req);
  if (!auth.ok) return auth.res;

  const body = await req.json().catch(() => ({}));

  const raw = (body as any)?.dryRun;
  const dryRun =
    raw === true ||
    raw === "true" ||
    raw === 1 ||
    raw === "1";

  return Response.json({
    ok: true,
    dryRun,
    created: [
      {
        id: `creative_${Date.now()}`,
        status: dryRun ? "simulated" : "queued",
        platform: "instagram",
      },
    ],
    ts: new Date().toISOString(),
  });
}


