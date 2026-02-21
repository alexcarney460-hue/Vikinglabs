import { NextRequest } from "next/server";
import { requireMcToken } from "../../_lib/mcAuth";

/**
 * Robust boolean coercion helper
 * Handles: true, "true", 1, "1" => true
 *          false, "false", 0, "0" => false
 *          undefined/null => false
 */
function coerceBool(raw: any): boolean {
  if (raw === true || raw === 1) return true;
  if (typeof raw === 'string') {
    const lower = raw.toLowerCase().trim();
    if (lower === 'true' || lower === '1') return true;
  }
  return false;
}

export async function POST(req: NextRequest) {
  const auth = requireMcToken(req);
  if (!auth.ok) return auth.res;

  let body: any = {};
  const contentType = req.headers.get('content-type') || '';

  // Try JSON first
  try {
    body = await req.json();
  } catch {
    // Fallback: try text then parse
    try {
      const text = await req.text();
      if (text) {
        body = JSON.parse(text);
      }
    } catch {
      body = {};
    }
  }

  const dryRunRaw = body?.dryRun;
  const dryRun = coerceBool(dryRunRaw);

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
    debug: {
      contentType,
      dryRunRaw,
      dryRunRawType: typeof dryRunRaw,
      bodyKeys: Object.keys(body),
    },
    fingerprint: "creatives_generate_src_v1",
  });
}


