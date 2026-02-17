import crypto from 'crypto';
import { getSql, hasPooledDatabase } from './db';
import { getSupabase } from './supabase';

export type DiscordInviteRecord = {
  id: string;
  userEmail: string;
  flowType: 'affiliate_welcome' | 'customer_first_purchase';
  discordInviteCode: string;
  createdAt: string;
  sentAt: string | null;
};

const API_BASE = 'https://discord.com/api/v10';

/**
 * Make authenticated request to Discord API
 */
async function discordRequest(path: string, options: RequestInit) {
  const token = process.env.DISCORD_BOT_TOKEN;
  if (!token) {
    throw new Error('DISCORD_BOT_TOKEN not configured');
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bot ${token}`,
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    const payload = await response.text();
    throw new Error(`Discord API error ${response.status}: ${payload}`);
  }

  return response.json().catch(() => ({}));
}

/**
 * Create a unique Discord invite for a specific user + flow
 * Attempts dynamic creation; falls back to stable link if API fails
 */
async function createUniqueDiscordInvite(flowType: 'affiliate_welcome' | 'customer_first_purchase'): Promise<string> {
  try {
    // Select channel based on flow type
    const channelId =
      flowType === 'affiliate_welcome'
        ? process.env.DISCORD_AFFILIATE_INVITE_CHANNEL_ID
        : process.env.DISCORD_CUSTOMER_INVITE_CHANNEL_ID;

    if (!channelId) {
      console.warn(
        `[createUniqueDiscordInvite] Channel ID not configured for flow: ${flowType}. Falling back to stable invite.`
      );
      return getFallbackDiscordInvite();
    }

    const invite = await discordRequest(`/channels/${channelId}/invites`, {
      method: 'POST',
      body: JSON.stringify({
        max_age: 0, // Never expires
        max_uses: 1, // Single-use
        temporary: false,
        unique: true,
      }),
    });

    if (!invite?.code) {
      console.warn('[createUniqueDiscordInvite] Discord API returned no invite code. Falling back to stable invite.');
      return getFallbackDiscordInvite();
    }

    return `https://discord.gg/${invite.code}`;
  } catch (error) {
    console.error('[createUniqueDiscordInvite] Error creating invite:', error);
    return getFallbackDiscordInvite();
  }
}

/**
 * Get the fallback (stable, reusable) Discord invite URL
 */
function getFallbackDiscordInvite(): string {
  const fallback = process.env.DISCORD_FALLBACK_INVITE_URL;
  if (!fallback) {
    console.error('[getFallbackDiscordInvite] DISCORD_FALLBACK_INVITE_URL not configured.');
    return 'https://discord.gg/vikinglabs'; // Hardcoded fallback
  }
  return fallback;
}

/**
 * Ensure discord_invite_records table exists
 */
async function ensureDiscordInviteTable() {
  const sql = await getSql();
  if (!sql) return;

  try {
    await sql`
      CREATE TABLE IF NOT EXISTS discord_invite_records (
        id uuid PRIMARY KEY,
        user_email text NOT NULL,
        flow_type text NOT NULL,
        discord_invite_code text NOT NULL,
        created_at timestamptz NOT NULL,
        sent_at timestamptz NULL,
        UNIQUE(user_email, flow_type)
      );
    `;
  } catch (error) {
    console.error('[ensureDiscordInviteTable] Error creating table:', error);
  }
}

/**
 * Get or create a Discord invite for a user+flow combination
 * Returns the invite URL (either unique or fallback)
 * Stores record in DB for idempotency and audit
 */
export async function getDiscordInviteUrl(params: {
  flowType: 'affiliate_welcome' | 'customer_first_purchase';
  userEmail: string;
}): Promise<string> {
  const { flowType, userEmail } = params;
  const normalizedEmail = userEmail.toLowerCase().trim();

  if (!normalizedEmail) {
    console.warn('[getDiscordInviteUrl] Missing email. Returning fallback invite.');
    return getFallbackDiscordInvite();
  }

  // Try Supabase first
  const supabase = getSupabase();
  if (supabase) {
    try {
      // Check if we already created an invite for this user+flow
      const { data: existing, error: queryError } = await supabase
        .from('discord_invite_records')
        .select('discord_invite_code')
        .eq('user_email', normalizedEmail)
        .eq('flow_type', flowType)
        .limit(1)
        .single();

      if (!queryError && existing) {
        console.log(`[getDiscordInviteUrl] Reusing existing invite for ${normalizedEmail} (${flowType})`);
        // Mark as sent if not already
        try {
          await supabase
            .from('discord_invite_records')
            .update({ sent_at: new Date().toISOString() })
            .eq('user_email', normalizedEmail)
            .eq('flow_type', flowType)
            .is('sent_at', null);
        } catch (error) {
          // Ignore errors
        }
        return `https://discord.gg/${existing.discord_invite_code}`;
      }

      // Create new invite
      const inviteUrl = await createUniqueDiscordInvite(flowType);
      const code = inviteUrl.split('/').pop() || 'fallback';
      const now = new Date().toISOString();

      const { error: insertError } = await supabase.from('discord_invite_records').insert({
        id: crypto.randomUUID(),
        user_email: normalizedEmail,
        flow_type: flowType,
        discord_invite_code: code,
        created_at: now,
        sent_at: now,
      });

      if (insertError) {
        console.error('[getDiscordInviteUrl] Supabase insert error:', insertError);
        // Still return the invite URL, even if tracking failed
      }

      return inviteUrl;
    } catch (error) {
      console.error('[getDiscordInviteUrl] Supabase error:', error);
      // Fall through to SQL
    }
  }

  // Fallback to @vercel/postgres
  const sql = await getSql();
  if (sql && hasPooledDatabase()) {
    try {
      await ensureDiscordInviteTable();

      // Check if invite already created for this user+flow
      const existing = await sql`
        SELECT discord_invite_code FROM discord_invite_records
        WHERE user_email = ${normalizedEmail} AND flow_type = ${flowType}
        LIMIT 1
      `;

      if (existing.rows.length > 0) {
        console.log(`[getDiscordInviteUrl] Reusing existing invite for ${normalizedEmail} (${flowType})`);
        // Mark as sent
        await sql`
          UPDATE discord_invite_records
          SET sent_at = ${new Date().toISOString()}
          WHERE user_email = ${normalizedEmail} AND flow_type = ${flowType} AND sent_at IS NULL
        `;
        return `https://discord.gg/${existing.rows[0].discord_invite_code}`;
      }

      // Create new invite
      const inviteUrl = await createUniqueDiscordInvite(flowType);
      const code = inviteUrl.split('/').pop() || 'fallback';
      const now = new Date().toISOString();

      await sql`
        INSERT INTO discord_invite_records
        (id, user_email, flow_type, discord_invite_code, created_at, sent_at)
        VALUES
        (${crypto.randomUUID()}, ${normalizedEmail}, ${flowType}, ${code}, ${now}, ${now})
        ON CONFLICT (user_email, flow_type) DO UPDATE SET sent_at = ${now}
      `;

      return inviteUrl;
    } catch (error) {
      console.error('[getDiscordInviteUrl] SQL error:', error);
      // Fall through to fallback
    }
  }

  console.warn('[getDiscordInviteUrl] No database available. Returning fallback invite.');
  return getFallbackDiscordInvite();
}

/**
 * Check if we've already sent a Discord invite to this user for this flow
 */
export async function hasDiscordInviteBeenSent(params: {
  userEmail: string;
  flowType: 'affiliate_welcome' | 'customer_first_purchase';
}): Promise<boolean> {
  const { userEmail, flowType } = params;
  const normalizedEmail = userEmail.toLowerCase().trim();

  const supabase = getSupabase();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('discord_invite_records')
        .select('id')
        .eq('user_email', normalizedEmail)
        .eq('flow_type', flowType)
        .not('sent_at', 'is', null)
        .limit(1)
        .single();

      if (!error && data) return true;
    } catch (error) {
      console.error('[hasDiscordInviteBeenSent] Supabase error:', error);
    }
  }

  const sql = await getSql();
  if (sql) {
    try {
      const result = await sql`
        SELECT id FROM discord_invite_records
        WHERE user_email = ${normalizedEmail}
        AND flow_type = ${flowType}
        AND sent_at IS NOT NULL
        LIMIT 1
      `;
      return result.rows.length > 0;
    } catch (error) {
      console.error('[hasDiscordInviteBeenSent] SQL error:', error);
    }
  }

  return false;
}
