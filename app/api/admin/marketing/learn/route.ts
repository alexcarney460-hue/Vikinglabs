import { NextRequest } from "next/server";
import { requireMcToken } from "../_lib/mcAuth";

export async function POST(req: NextRequest) {
  const auth = requireMcToken(req);
  if (!auth.ok) return auth.res;

  const body = await req.json().catch(() => ({}));
  const dryRun = !!(body as any)?.dryRun;

  return Response.json({
    ok: true,
    dryRun,
    insights: [
      { key: "hook_style", suggestion: "Lead with outcome in first 1.5 seconds." },
      { key: "cta", suggestion: "Pin comment with affiliate link + discount code." }
    ],
    ts: new Date().toISOString()
  });
}



