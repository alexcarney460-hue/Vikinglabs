import { NextRequest } from "next/server";
import { requireMcToken } from "../../_lib/mcAuth";

export async function POST(req: NextRequest) {
  const auth = requireMcToken(req);
  if (!auth.ok) return auth.res;

  const body = await req.json().catch(() => ({}));

  return Response.json({
    ok: true,
    received: body ?? null,
    ts: new Date().toISOString()
  });
}



