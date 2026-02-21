import { NextRequest } from "next/server";
import { requireMcToken } from "../../_lib/mcAuth";

export async function POST(req: NextRequest) {
  const auth = requireMcToken(req);
  if (!auth.ok) return auth.res;

  const body = await req.json().catch(() => ({}));
  const payload = (body as any)?.payload ?? (body as any)?.text ?? body ?? null;

  return Response.json({
    ok: true,
    ingested:
      typeof payload === "string" ? payload.slice(0, 2000) : payload,
    ts: new Date().toISOString()
  });
}




