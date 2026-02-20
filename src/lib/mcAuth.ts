// Minimal MC token auth helper (strict in prod, permissive in dev)
export function validateMCAuth(headers: Record<string, string | undefined>, env: string | undefined = process.env.NODE_ENV) {
  const tokenHeader = (headers['x-mc-token'] || headers['X-MC-Token'] || '').toString();
  const mcToken = process.env.MC_TOKEN;
  const isProd = (process.env.VERCEL_ENV === 'production' || env === 'production');
  if (isProd) {
    if (!mcToken || !tokenHeader) return { ok: false, code: 401, json: { error: 'Unauthorized: missing MC token' } };
    if (tokenHeader !== mcToken) return { ok: false, code: 401, json: { error: 'Unauthorized: invalid MC token' } };
  } else {
    // dev: allow if MC_TOKEN not set, otherwise require match
    if (mcToken && tokenHeader && tokenHeader !== mcToken) return { ok: false, code: 401, json: { error: 'Unauthorized: invalid MC token (dev)' } };
  }
  return { ok: true };
}
