import { NextRequest } from "next/server";

export function requireMcToken(req: NextRequest) {
  const expected = process.env.MC_TOKEN;

  // If not configured, allow requests (easy local dev). Set MC_TOKEN in Vercel to lock down.
  if (!expected) return { ok: true as const };

  const got = req.headers.get("x-mc-token") || "";
  if (got !== expected) {
    return {
      ok: false as const,
      res: new Response(
        JSON.stringify({
          ok: false,
          error: { code: "UNAUTHORIZED", message: "Invalid X-MC-Token" }
        }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      )
    };
  }

  return { ok: true as const };
}
