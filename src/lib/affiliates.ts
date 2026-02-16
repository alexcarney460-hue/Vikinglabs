import crypto from 'crypto';
import nodemailer from 'nodemailer';
import { getSql, hasPooledDatabase } from './db';
import { readJson, writeJson } from './storage';
import { sendTelegramAdminAlert } from './telegram';
import { sendDiscordAffiliateInvite } from './discord';
import { buildAffiliateCodeSeed, formatAffiliateCode } from './affiliate-utils';

export type AffiliateStatus = 'pending' | 'approved' | 'declined' | 'needs_info';

export type AffiliateApplication = {
  id: string;
  name: string;
  email: string;
  socialHandle?: string | null;
  audienceSize?: string | null;
  channels?: string | null;
  notes?: string | null;
  status: AffiliateStatus;
  code?: string | null;
  signupCreditCents: number;
  commissionRate: number;
  approvedAt?: string | null;
  expiresAt?: string | null;
  declinedAt?: string | null;
  requestedInfoAt?: string | null;
  discordUserId?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AffiliateStats = {
  affiliateId: string;
  clicks: number;
  orders: number;
  revenueCents: number;
};

export type AffiliateClick = {
  id: string;
  affiliateId?: string | null;
  code?: string | null;
  landingPath?: string | null;
  referrer?: string | null;
  userAgent?: string | null;
  createdAt: string;
};

export type OrderAffiliate = {
  id: string;
  provider: string;
  orderId: string;
  affiliateId?: string | null;
  code?: string | null;
  amountCents?: number | null;
  currency?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
};

type AffiliateStore = {
  applications: AffiliateApplication[];
};

type AffiliateClickStore = {
  clicks: AffiliateClick[];
};

type OrderAffiliateStore = {
  orders: OrderAffiliate[];
};

const STORAGE_FILE = 'affiliate-applications.json';
const CLICK_STORAGE_FILE = 'affiliate-clicks.json';
const ORDER_STORAGE_FILE = 'order-affiliates.json';
const EMPTY_STORE: AffiliateStore = { applications: [] };
const EMPTY_CLICK_STORE: AffiliateClickStore = { clicks: [] };
const EMPTY_ORDER_STORE: OrderAffiliateStore = { orders: [] };

function hasDatabase() {
  return hasPooledDatabase();
}

async function getDb() {
  if (!hasDatabase()) return null;
  return getSql();
}

export type AffiliateApiKey = {
  id: string;
  affiliateId: string;
  apiKeyHash: string;
  last4: string;
  scopes: string[];
  createdAt: string;
  rotatedAt?: string | null;
  revokedAt?: string | null;
};

export type TrackerStack = {
  id: string;
  affiliateId: string;
  name: string;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type TrackerEntry = {
  id: string;
  stackId: string;
  affiliateId: string;
  date: string;
  dosage?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
};

type AffiliateApiKeyStore = {
  keys: AffiliateApiKey[];
};

type TrackerStackStore = {
  stacks: TrackerStack[];
};

type TrackerEntryStore = {
  entries: TrackerEntry[];
};

const API_KEY_STORAGE = 'affiliate-api-keys.json';
const TRACKER_STACK_STORAGE = 'tracker-stacks.json';
const TRACKER_ENTRY_STORAGE = 'tracker-entries.json';
const EMPTY_API_KEY_STORE: AffiliateApiKeyStore = { keys: [] };
const EMPTY_TRACKER_STACK_STORE: TrackerStackStore = { stacks: [] };
const EMPTY_TRACKER_ENTRY_STORE: TrackerEntryStore = { entries: [] };

export async function ensureAffiliateTables() {
  const sql = await getSql();
  if (!sql) return;

  await sql`
    CREATE TABLE IF NOT EXISTS affiliate_applications (
      id uuid PRIMARY KEY,
      name text NOT NULL,
      email text NOT NULL,
      social_handle text NULL,
      audience_size text NULL,
      channels text NULL,
      notes text NULL,
      status text NOT NULL,
      code text NULL,
      signup_credit_cents int NOT NULL DEFAULT 0,
      commission_rate numeric NOT NULL DEFAULT 0.10,
      approved_at timestamptz NULL,
      expires_at timestamptz NULL,
      declined_at timestamptz NULL,
      requested_info_at timestamptz NULL,
      discord_user_id text NULL,
      created_at timestamptz NOT NULL,
      updated_at timestamptz NOT NULL
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS affiliate_clicks (
      id uuid PRIMARY KEY,
      affiliate_id uuid NULL,
      code text NULL,
      landing_path text NULL,
      referrer text NULL,
      user_agent text NULL,
      created_at timestamptz NOT NULL
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS order_affiliates (
      id uuid PRIMARY KEY,
      provider text NOT NULL,
      order_id text NOT NULL,
      affiliate_id uuid NULL,
      code text NULL,
      amount_cents int NULL,
      currency text NULL,
      metadata jsonb NULL,
      created_at timestamptz NOT NULL
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS affiliate_api_keys (
      id uuid PRIMARY KEY,
      affiliate_id uuid NOT NULL,
      api_key_hash text NOT NULL,
      last4 text NOT NULL,
      scopes text[] NOT NULL,
      created_at timestamptz NOT NULL,
      rotated_at timestamptz NULL,
      revoked_at timestamptz NULL
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS tracker_stacks (
      id uuid PRIMARY KEY,
      affiliate_id uuid NOT NULL,
      name text NOT NULL,
      notes text NULL,
      created_at timestamptz NOT NULL,
      updated_at timestamptz NOT NULL
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS tracker_entries (
      id uuid PRIMARY KEY,
      stack_id uuid NOT NULL,
      affiliate_id uuid NOT NULL,
      date text NOT NULL,
      dosage text NULL,
      notes text NULL,
      created_at timestamptz NOT NULL,
      updated_at timestamptz NOT NULL
    );
  `;
}

function normalizeInput(value?: string | null) {
  return value?.trim() || null;
}

async function isCodeAvailable(code: string) {
  const sql = await getDb();
  if (sql) {
    const result = await sql`
      SELECT id FROM affiliate_applications WHERE code = ${code} LIMIT 1
    `;
    return result.rows.length === 0;
  }

  const store = await readJson<AffiliateStore>(STORAGE_FILE, EMPTY_STORE);
  return !store.applications.some((app) => app.code === code);
}

async function generateAffiliateCode(name: string, email: string) {
  const base = buildAffiliateCodeSeed(name, email);
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const suffix = crypto.randomBytes(2).toString('hex').toUpperCase();
    const code = formatAffiliateCode(`${base}${suffix}`).slice(0, 12);
    if (await isCodeAvailable(code)) return code;
  }
  return formatAffiliateCode(crypto.randomBytes(4).toString('hex'));
}

export async function createAffiliateApplication(input: {
  name: string;
  email: string;
  socialHandle?: string | null;
  audienceSize?: string | null;
  channels?: string | null;
  notes?: string | null;
}): Promise<AffiliateApplication> {
  const now = new Date().toISOString();
  const record: AffiliateApplication = {
    id: crypto.randomUUID(),
    name: input.name.trim(),
    email: input.email.trim().toLowerCase(),
    socialHandle: normalizeInput(input.socialHandle),
    audienceSize: normalizeInput(input.audienceSize),
    channels: normalizeInput(input.channels),
    notes: normalizeInput(input.notes),
    status: 'pending',
    code: null,
    signupCreditCents: 0,
    commissionRate: 0.10, // Default 10% commission
    approvedAt: null,
    expiresAt: null,
    declinedAt: null,
    requestedInfoAt: null,
    discordUserId: null,
    createdAt: now,
    updatedAt: now,
  };

  const sql = await getDb();
  if (sql) {
    await ensureAffiliateTables();
    try {
      await sql`
        INSERT INTO affiliate_applications
        (id, name, email, social_handle, audience_size, channels, notes, status, code, signup_credit_cents, commission_rate, approved_at, expires_at, declined_at, requested_info_at, discord_user_id, created_at, updated_at)
        VALUES
        (${record.id}, ${record.name}, ${record.email}, ${record.socialHandle}, ${record.audienceSize}, ${record.channels}, ${record.notes}, ${record.status}, ${record.code}, ${record.signupCreditCents}, ${record.commissionRate}, ${record.approvedAt}, ${record.expiresAt}, ${record.declinedAt}, ${record.requestedInfoAt}, ${record.discordUserId}, ${record.createdAt}, ${record.updatedAt})
      `;
      return record;
    } catch (dbError) {
      console.error('Affiliate DB insert failed, falling back to file storage', dbError);
    }
  }

  const store = await readJson<AffiliateStore>(STORAGE_FILE, EMPTY_STORE);
  store.applications.unshift(record);
  await writeJson(STORAGE_FILE, store);
  return record;
}

export async function listAffiliateApplications(status?: AffiliateStatus): Promise<AffiliateApplication[]> {
  const sql = await getDb();
  if (sql) {
    await ensureAffiliateTables();
    const rows = status
      ? await sql`
          SELECT id,
                 name,
                 email,
                 social_handle AS "socialHandle",
                 audience_size AS "audienceSize",
                 channels,
                 notes,
                 status,
                 code,
                 signup_credit_cents AS "signupCreditCents",
                 commission_rate AS "commissionRate",
                 approved_at AS "approvedAt",
                 expires_at AS "expiresAt",
                 declined_at AS "declinedAt",
                 requested_info_at AS "requestedInfoAt",
                 discord_user_id AS "discordUserId",
                 created_at AS "createdAt",
                 updated_at AS "updatedAt"
          FROM affiliate_applications
          WHERE status = ${status}
          ORDER BY created_at DESC
        `
      : await sql`
          SELECT id,
                 name,
                 email,
                 social_handle AS "socialHandle",
                 audience_size AS "audienceSize",
                 channels,
                 notes,
                 status,
                 code,
                 signup_credit_cents AS "signupCreditCents",
                 commission_rate AS "commissionRate",
                 approved_at AS "approvedAt",
                 expires_at AS "expiresAt",
                 declined_at AS "declinedAt",
                 requested_info_at AS "requestedInfoAt",
                 discord_user_id AS "discordUserId",
                 created_at AS "createdAt",
                 updated_at AS "updatedAt"
          FROM affiliate_applications
          ORDER BY created_at DESC
        `;
    return rows.rows as AffiliateApplication[];
  }

  const store = await readJson<AffiliateStore>(STORAGE_FILE, EMPTY_STORE);
  const apps = store.applications;
  return status ? apps.filter(app => app.status === status) : apps;
}

export async function getAffiliateByCode(code: string, options?: { requireActive?: boolean }): Promise<AffiliateApplication | null> {
  const normalized = formatAffiliateCode(code);
  if (!normalized) return null;

  const sql = await getDb();
  let affiliate: AffiliateApplication | null = null;

  if (sql) {
    const rows = await sql`
      SELECT id,
             name,
             email,
             social_handle AS "socialHandle",
             audience_size AS "audienceSize",
             channels,
             notes,
             status,
             code,
             signup_credit_cents AS "signupCreditCents",
             commission_rate AS "commissionRate",
             approved_at AS "approvedAt",
             expires_at AS "expiresAt",
             declined_at AS "declinedAt",
             requested_info_at AS "requestedInfoAt",
             discord_user_id AS "discordUserId",
             created_at AS "createdAt",
             updated_at AS "updatedAt"
      FROM affiliate_applications
      WHERE code = ${normalized}
      LIMIT 1
    `;
    affiliate = (rows.rows[0] as AffiliateApplication) || null;
  } else {
    const store = await readJson<AffiliateStore>(STORAGE_FILE, EMPTY_STORE);
    affiliate = store.applications.find((app) => app.code === normalized) || null;
  }

  // Check if affiliate is active (approved and not expired)
  if (options?.requireActive && affiliate) {
    if (affiliate.status !== 'approved') return null;
    if (affiliate.expiresAt && new Date(affiliate.expiresAt) < new Date()) return null;
  }

  return affiliate;
}

export async function updateAffiliateApplication(input: {
  id: string;
  status?: AffiliateStatus;
  signupCreditCents?: number;
  discordUserId?: string | null;
  autoInvite?: boolean;
}): Promise<AffiliateApplication | null> {
  const now = new Date().toISOString();
  const desiredStatus = input.status;

  const sql = await getDb();
  if (sql) {
    const currentRows = await sql`
      SELECT name, email, code
      FROM affiliate_applications
      WHERE id = ${input.id}
      LIMIT 1
    `;
    if (!currentRows.rows[0]) return null;

    const current = currentRows.rows[0] as { name: string; email: string; code: string | null };
    let code: string | null = null;
    let approvedAt: string | null = null;
    let expiresAt: string | null = null;
    let declinedAt: string | null = null;
    let requestedInfoAt: string | null = null;

    if (desiredStatus === 'approved') {
      code = current.code || (await generateAffiliateCode(current.name, current.email));
      approvedAt = now;
      // Set expiry to 60 days from now
      const expiry = new Date();
      expiry.setDate(expiry.getDate() + 60);
      expiresAt = expiry.toISOString();
    } else if (desiredStatus === 'declined') {
      declinedAt = now;
    } else if (desiredStatus === 'needs_info') {
      requestedInfoAt = now;
    }

    const result = await sql`
      UPDATE affiliate_applications
      SET status = COALESCE(${desiredStatus}, status),
          code = COALESCE(${code}, code),
          signup_credit_cents = COALESCE(${input.signupCreditCents ?? null}, signup_credit_cents),
          approved_at = COALESCE(${approvedAt}, approved_at),
          expires_at = COALESCE(${expiresAt}, expires_at),
          declined_at = COALESCE(${declinedAt}, declined_at),
          requested_info_at = COALESCE(${requestedInfoAt}, requested_info_at),
          discord_user_id = COALESCE(${input.discordUserId ?? null}, discord_user_id),
          updated_at = ${now}
      WHERE id = ${input.id}
      RETURNING id,
                name,
                email,
                social_handle AS "socialHandle",
                audience_size AS "audienceSize",
                channels,
                notes,
                status,
                code,
                signup_credit_cents AS "signupCreditCents",
                commission_rate AS "commissionRate",
                approved_at AS "approvedAt",
                expires_at AS "expiresAt",
                declined_at AS "declinedAt",
                requested_info_at AS "requestedInfoAt",
                discord_user_id AS "discordUserId",
                created_at AS "createdAt",
                updated_at AS "updatedAt"
    `;

    const updated = (result.rows[0] as AffiliateApplication) || null;

    if (updated && desiredStatus === 'approved') {
      // Send email notification to the affiliate
      await notifyAffiliateApproval(updated).catch((error) => {
        console.error('Affiliate approval email failed', error);
      });

      await sendTelegramAdminAlert(
        `Affiliate approved: ${updated.name} (${updated.email})\nCode: ${updated.code || 'TBD'}\nExpires: ${updated.expiresAt ? new Date(updated.expiresAt).toLocaleDateString() : 'N/A'}\nSignup credit: $${(
          updated.signupCreditCents / 100
        ).toFixed(2)}`
      ).catch((error) => {
        console.error('Telegram affiliate approval notification failed', error);
      });

      if (input.autoInvite && updated.discordUserId) {
        sendDiscordAffiliateInvite({
          discordUserId: updated.discordUserId,
          affiliateName: updated.name,
          affiliateCode: updated.code || undefined,
        }).catch((error) => {
          console.error('Discord affiliate invite failed', error);
        });
      }
    }

    return updated;
  }

  const store = await readJson<AffiliateStore>(STORAGE_FILE, EMPTY_STORE);
  const idx = store.applications.findIndex(app => app.id === input.id);
  if (idx === -1) return null;

  const current = store.applications[idx];
  const nextStatus = desiredStatus ?? current.status;
  const code = nextStatus === 'approved' && !current.code ? await generateAffiliateCode(current.name, current.email) : current.code;
  
  let expiresAt = current.expiresAt;
  if (nextStatus === 'approved' && !current.approvedAt) {
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + 60);
    expiresAt = expiry.toISOString();
  }

  const updated: AffiliateApplication = {
    ...current,
    status: nextStatus,
    code,
    signupCreditCents: input.signupCreditCents ?? current.signupCreditCents,
    approvedAt: nextStatus === 'approved' ? now : current.approvedAt,
    expiresAt,
    declinedAt: nextStatus === 'declined' ? now : current.declinedAt,
    requestedInfoAt: nextStatus === 'needs_info' ? now : current.requestedInfoAt,
    discordUserId: input.discordUserId ?? current.discordUserId,
    updatedAt: now,
  };

  store.applications[idx] = updated;
  await writeJson(STORAGE_FILE, store);

  if (nextStatus === 'approved') {
    // Send email notification to the affiliate
    await notifyAffiliateApproval(updated).catch((error) => {
      console.error('Affiliate approval email failed', error);
    });

    await sendTelegramAdminAlert(
      `Affiliate approved: ${updated.name} (${updated.email})\nCode: ${updated.code || 'TBD'}\nExpires: ${updated.expiresAt ? new Date(updated.expiresAt).toLocaleDateString() : 'N/A'}\nSignup credit: $${(
        updated.signupCreditCents / 100
      ).toFixed(2)}`
    ).catch((error) => {
      console.error('Telegram affiliate approval notification failed', error);
    });

    if (input.autoInvite && updated.discordUserId) {
      sendDiscordAffiliateInvite({
        discordUserId: updated.discordUserId,
        affiliateName: updated.name,
        affiliateCode: updated.code || undefined,
      }).catch((error) => {
        console.error('Discord affiliate invite failed', error);
      });
    }
  }

  return updated;
}

export async function recordAffiliateClick(input: {
  affiliateId?: string | null;
  code?: string | null;
  landingPath?: string | null;
  referrer?: string | null;
  userAgent?: string | null;
}): Promise<void> {
  const now = new Date().toISOString();
  const record: AffiliateClick = {
    id: crypto.randomUUID(),
    affiliateId: input.affiliateId ?? null,
    code: input.code ?? null,
    landingPath: input.landingPath ?? null,
    referrer: input.referrer ?? null,
    userAgent: input.userAgent ?? null,
    createdAt: now,
  };

  const sql = await getDb();
  if (sql) {
    await ensureAffiliateTables();
    await sql`
      INSERT INTO affiliate_clicks
      (id, affiliate_id, code, landing_path, referrer, user_agent, created_at)
      VALUES
      (${record.id}, ${record.affiliateId}, ${record.code}, ${record.landingPath}, ${record.referrer}, ${record.userAgent}, ${record.createdAt})
    `;
    return;
  }

  const store = await readJson<AffiliateClickStore>(CLICK_STORAGE_FILE, EMPTY_CLICK_STORE);
  store.clicks.unshift(record);
  await writeJson(CLICK_STORAGE_FILE, store);
}

export async function recordOrderAffiliate(input: {
  provider: string;
  orderId: string;
  affiliateId?: string | null;
  code?: string | null;
  amountCents?: number | null;
  currency?: string | null;
  metadata?: Record<string, unknown> | null;
}): Promise<void> {
  const now = new Date().toISOString();
  const record: OrderAffiliate = {
    id: crypto.randomUUID(),
    provider: input.provider,
    orderId: input.orderId,
    affiliateId: input.affiliateId ?? null,
    code: input.code ?? null,
    amountCents: input.amountCents ?? null,
    currency: input.currency ?? null,
    metadata: input.metadata ?? null,
    createdAt: now,
  };

  const sql = await getDb();
  if (sql) {
    await ensureAffiliateTables();
    await sql`
      INSERT INTO order_affiliates
      (id, provider, order_id, affiliate_id, code, amount_cents, currency, metadata, created_at)
      VALUES
      (${record.id}, ${record.provider}, ${record.orderId}, ${record.affiliateId}, ${record.code}, ${record.amountCents}, ${record.currency}, ${record.metadata ? JSON.stringify(record.metadata) : null}::jsonb, ${record.createdAt})
    `;
    return;
  }

  const store = await readJson<OrderAffiliateStore>(ORDER_STORAGE_FILE, EMPTY_ORDER_STORE);
  store.orders.unshift(record);
  await writeJson(ORDER_STORAGE_FILE, store);
}

export async function listAffiliateStats(ids: string[]): Promise<Record<string, AffiliateStats>> {
  const map: Record<string, AffiliateStats> = {};
  ids.forEach((id) => {
    map[id] = { affiliateId: id, clicks: 0, orders: 0, revenueCents: 0 };
  });

  if (ids.length === 0) return map;

  const sql = await getDb();
  if (sql) {
    await ensureAffiliateTables();
    const idsArray = ids.filter(Boolean);
    const clicks = await sql`
      SELECT affiliate_id AS "affiliateId", COUNT(*)::int AS clicks
      FROM affiliate_clicks
      WHERE affiliate_id = ANY(${idsArray}::uuid[])
      GROUP BY affiliate_id
    `;
    const orders = await sql`
      SELECT affiliate_id AS "affiliateId",
             COUNT(*)::int AS orders,
             COALESCE(SUM(amount_cents), 0)::int AS "revenueCents"
      FROM order_affiliates
      WHERE affiliate_id = ANY(${idsArray}::uuid[])
      GROUP BY affiliate_id
    `;

    for (const row of clicks.rows as Array<{ affiliateId: string; clicks: number }>) {
      if (map[row.affiliateId]) map[row.affiliateId].clicks = row.clicks;
    }
    for (const row of orders.rows as Array<{ affiliateId: string; orders: number; revenueCents: number }>) {
      if (map[row.affiliateId]) {
        map[row.affiliateId].orders = row.orders;
        map[row.affiliateId].revenueCents = row.revenueCents;
      }
    }
    return map;
  }

  const clickStore = await readJson<AffiliateClickStore>(CLICK_STORAGE_FILE, EMPTY_CLICK_STORE);
  const orderStore = await readJson<OrderAffiliateStore>(ORDER_STORAGE_FILE, EMPTY_ORDER_STORE);
  ids.forEach((id) => {
    const clicks = clickStore.clicks.filter((click) => click.affiliateId === id).length;
    const orders = orderStore.orders.filter((order) => order.affiliateId === id);
    map[id] = {
      affiliateId: id,
      clicks,
      orders: orders.length,
      revenueCents: orders.reduce((sum, order) => sum + (order.amountCents ?? 0), 0),
    };
  });

  return map;
}

export async function exportAffiliatePayoutsCsv(options?: { start?: string; end?: string }) {
  const start = options?.start ? new Date(options.start).toISOString() : null;
  const end = options?.end ? new Date(options.end).toISOString() : null;

  const sql = await getDb();
  if (sql) {
    const rows = await sql`
      SELECT apps.id AS "affiliateId",
             apps.name,
             apps.email,
             apps.code,
             COUNT(orders.id)::int AS "orderCount",
             COALESCE(SUM(orders.amount_cents), 0)::int AS "revenueCents"
      FROM affiliate_applications apps
      LEFT JOIN order_affiliates orders
        ON orders.affiliate_id = apps.id
        AND (${start}::timestamptz IS NULL OR orders.created_at >= ${start})
        AND (${end}::timestamptz IS NULL OR orders.created_at <= ${end})
      WHERE apps.status = 'approved'
      GROUP BY apps.id
      ORDER BY apps.created_at DESC
    `;

    return rows.rows as Array<{
      affiliateId: string;
      name: string;
      email: string;
      code: string | null;
      orderCount: number;
      revenueCents: number;
    }>;
  }

  const store = await readJson<AffiliateStore>(STORAGE_FILE, EMPTY_STORE);
  const orderStore = await readJson<OrderAffiliateStore>(ORDER_STORAGE_FILE, EMPTY_ORDER_STORE);
  const approved = store.applications.filter((app) => app.status === 'approved');

  return approved.map((app) => {
    const orders = orderStore.orders.filter((order) => {
      if (order.affiliateId !== app.id) return false;
      if (start && order.createdAt < start) return false;
      if (end && order.createdAt > end) return false;
      return true;
    });

    return {
      affiliateId: app.id,
      name: app.name,
      email: app.email,
      code: app.code ?? null,
      orderCount: orders.length,
      revenueCents: orders.reduce((sum, order) => sum + (order.amountCents ?? 0), 0),
    };
  });
}

export async function notifyAffiliateApproval(application: AffiliateApplication) {
  if (!application.email || !application.code) {
    console.warn('Affiliate approval notification skipped: Missing email or code.');
    return;
  }

  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) {
    console.warn('Affiliate approval notification skipped: SMTP credentials not configured.');
    return;
  }

  const port = Number(process.env.SMTP_PORT || 587);
  const secure = process.env.SMTP_SECURE === 'true';
  const from = process.env.AFFILIATE_EMAIL || 'affiliates@vikinglabs.co';
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://vikinglabs.co';
  const signupCredit = (application.signupCreditCents / 100).toFixed(2);
  const expiryDate = application.expiresAt ? new Date(application.expiresAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Not specified';

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  });

  const referralUrl = `${siteUrl}/r/${application.code}`;
  const dashboardUrl = `${siteUrl}/account/affiliates`;

  const subject = `Welcome to Viking Labs Affiliate Program!`;
  const text = `Congratulations ${application.name}!\n\nYour affiliate application has been approved! 🎉\n\nYour Affiliate Code: ${application.code}\nValid Until: ${expiryDate}\nYour Referral Link: ${referralUrl}\n${application.signupCreditCents > 0 ? `Signup Credit: $${signupCredit}\n` : ''}\nCommission Rate: ${(application.commissionRate * 100).toFixed(0)}%\n\nHow It Works:\n1. Share your referral link with your audience\n2. When someone clicks your link and makes a purchase, you earn ${(application.commissionRate * 100).toFixed(0)}% commission\n3. Track your performance at: ${dashboardUrl}\n\nYour referral link is: ${referralUrl}\n\nShare this link on your social media, in your content, or anywhere your audience hangs out. Every purchase made through your link will be attributed to you.\n\nView your affiliate dashboard to track:\n- Click stats\n- Sales attributed to you\n- Revenue earned\n- Commission accumulated\n\nNote: Your affiliate code expires on ${expiryDate}. Contact us if you'd like to renew.\n\nThank you for partnering with Viking Labs!\n\nBest regards,\nViking Labs Affiliate Team`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #1e293b;">Congratulations ${application.name}! 🎉</h2>
      <p style="color: #475569; font-size: 16px; line-height: 1.6;">
        Your affiliate application has been <strong>approved</strong>!
      </p>
      
      <div style="background: #f8fafc; border-left: 4px solid #10b981; padding: 16px; margin: 24px 0;">
        <p style="margin: 0; font-size: 14px; color: #64748b;">Your Affiliate Code</p>
        <p style="margin: 8px 0 0 0; font-size: 24px; font-weight: bold; color: #1e293b;">${application.code}</p>
        <p style="margin: 8px 0 0 0; font-size: 12px; color: #64748b;">Valid until: ${expiryDate}</p>
      </div>
      
      <div style="background: #dbeafe; border-left: 4px solid #3b82f6; padding: 16px; margin: 24px 0;">
        <p style="margin: 0; font-size: 14px; color: #1e40af;">Commission Rate</p>
        <p style="margin: 8px 0 0 0; font-size: 20px; font-weight: bold; color: #1e40af;">${(application.commissionRate * 100).toFixed(0)}%</p>
      </div>
      
      ${application.signupCreditCents > 0 ? `
      <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 24px 0;">
        <p style="margin: 0; font-size: 14px; color: #92400e;">Signup Credit</p>
        <p style="margin: 8px 0 0 0; font-size: 20px; font-weight: bold; color: #92400e;">$${signupCredit}</p>
      </div>
      ` : ''}
      
      <h3 style="color: #1e293b; margin-top: 32px;">How It Works:</h3>
      <ol style="color: #475569; line-height: 1.8;">
        <li>Share your referral link with your audience</li>
        <li>When someone clicks your link and makes a purchase, you earn ${(application.commissionRate * 100).toFixed(0)}% commission</li>
        <li>Track your performance in real-time</li>
        <li>Withdraw your earnings once you reach the minimum threshold</li>
      </ol>
      
      <div style="margin: 32px 0;">
        <p style="color: #64748b; font-size: 14px; margin-bottom: 8px;">Your Referral Link:</p>
        <a href="${referralUrl}" style="display: inline-block; background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
          ${referralUrl}
        </a>
      </div>
      
      <div style="margin: 32px 0;">
        <a href="${dashboardUrl}" style="display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
          View Your Dashboard
        </a>
      </div>
      
      <div style="background: #f1f5f9; padding: 16px; border-radius: 8px; margin-top: 32px;">
        <p style="margin: 0; font-size: 14px; color: #64748b;">
          <strong>Track Everything:</strong> Click stats, sales, revenue earned, commission accumulated, and more in your affiliate dashboard.
        </p>
      </div>
      
      <div style="background: #fef2f2; padding: 16px; border-radius: 8px; margin-top: 16px; border: 1px solid #fecaca;">
        <p style="margin: 0; font-size: 12px; color: #991b1b;">
          ⏰ <strong>Important:</strong> Your affiliate code expires on ${expiryDate}. Contact us before expiration to discuss renewal.
        </p>
      </div>
      
      <p style="color: #475569; margin-top: 32px; line-height: 1.6;">
        Thank you for partnering with Viking Labs!
      </p>
      
      <p style="color: #64748b; font-size: 14px; margin-top: 24px;">
        Best regards,<br>
        <strong>Viking Labs Affiliate Team</strong>
      </p>
    </div>
  `;

  await transporter.sendMail({
    to: application.email,
    from,
    subject,
    text,
    html,
  });
}

export async function notifyAffiliateAdmin(application: AffiliateApplication) {
  const adminEmail = (process.env.AFFILIATE_ADMIN_EMAIL || process.env.ADMIN_EMAIL || '').trim();
  if (!adminEmail) {
    console.warn('Affiliate admin notification skipped: ADMIN_EMAIL not set.');
    return;
  }

  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) {
    console.warn('Affiliate admin notification skipped: SMTP credentials not configured.');
    return;
  }

  const port = Number(process.env.SMTP_PORT || 587);
  const secure = process.env.SMTP_SECURE === 'true';
  const from = process.env.SMTP_FROM || adminEmail;

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  });

  const subject = `New affiliate application — ${application.name}`;
  const text = `A new affiliate application was submitted.\n\nName: ${application.name}\nEmail: ${application.email}\nHandle: ${application.socialHandle || 'N/A'}\nAudience: ${application.audienceSize || 'N/A'}\nChannels: ${application.channels || 'N/A'}\nNotes: ${application.notes || 'N/A'}\nSubmitted: ${application.createdAt}\nID: ${application.id}`;

  await transporter.sendMail({
    to: adminEmail,
    from,
    subject,
    text,
  });
}

// ===== Affiliate API Key Management =====

function hashApiKey(key: string): string {
  return crypto.createHash('sha256').update(key).digest('hex');
}

export async function createAffiliateApiKey(affiliateId: string): Promise<{ key: string; keyRecord: AffiliateApiKey }> {
  const now = new Date().toISOString();
  const rawKey = `sk_${crypto.randomBytes(32).toString('hex')}`;
  const keyHash = hashApiKey(rawKey);
  const last4 = rawKey.slice(-4);
  const scopes = ['shopping_read', 'sales_read', 'assets_read', 'tracker_rw'];

  const record: AffiliateApiKey = {
    id: crypto.randomUUID(),
    affiliateId,
    apiKeyHash: keyHash,
    last4,
    scopes,
    createdAt: now,
  };

  const sql = await getDb();
  if (sql) {
    await ensureAffiliateTables();
    try {
      await sql`
        INSERT INTO affiliate_api_keys
        (id, affiliate_id, api_key_hash, last4, scopes, created_at)
        VALUES
        (${record.id}, ${affiliateId}, ${keyHash}, ${last4}, ${scopes}, ${now})
      `;
      return { key: rawKey, keyRecord: record };
    } catch (dbError) {
      console.error('API key creation DB failed, falling back to file storage', dbError);
    }
  }

  const store = await readJson<AffiliateApiKeyStore>(API_KEY_STORAGE, EMPTY_API_KEY_STORE);
  store.keys.unshift(record);
  await writeJson(API_KEY_STORAGE, store);

  return { key: rawKey, keyRecord: record };
}

export async function getAffiliateApiKeyByHash(hash: string): Promise<AffiliateApiKey | null> {
  const sql = await getDb();
  if (sql) {
    const rows = await sql`
      SELECT id, affiliate_id AS "affiliateId", api_key_hash AS "apiKeyHash", last4, scopes, 
             created_at AS "createdAt", rotated_at AS "rotatedAt", revoked_at AS "revokedAt"
      FROM affiliate_api_keys
      WHERE api_key_hash = ${hash} AND revoked_at IS NULL
      LIMIT 1
    `;
    return (rows.rows[0] as AffiliateApiKey) || null;
  }

  const store = await readJson<AffiliateApiKeyStore>(API_KEY_STORAGE, EMPTY_API_KEY_STORE);
  return store.keys.find((k) => k.apiKeyHash === hash && !k.revokedAt) || null;
}

export async function getAffiliateApiKeyByAffiliateId(affiliateId: string): Promise<AffiliateApiKey | null> {
  const sql = await getDb();
  if (sql) {
    const rows = await sql`
      SELECT id, affiliate_id AS "affiliateId", api_key_hash AS "apiKeyHash", last4, scopes, 
             created_at AS "createdAt", rotated_at AS "rotatedAt", revoked_at AS "revokedAt"
      FROM affiliate_api_keys
      WHERE affiliate_id = ${affiliateId} AND revoked_at IS NULL
      ORDER BY created_at DESC
      LIMIT 1
    `;
    return (rows.rows[0] as AffiliateApiKey) || null;
  }

  const store = await readJson<AffiliateApiKeyStore>(API_KEY_STORAGE, EMPTY_API_KEY_STORE);
  const active = store.keys.filter((k) => k.affiliateId === affiliateId && !k.revokedAt);
  return active[active.length - 1] || null;
}

export async function revokeAffiliateApiKey(affiliateId: string): Promise<boolean> {
  const now = new Date().toISOString();
  const sql = await getDb();

  if (sql) {
    const result = await sql`
      UPDATE affiliate_api_keys
      SET revoked_at = ${now}
      WHERE affiliate_id = ${affiliateId} AND revoked_at IS NULL
      RETURNING id
    `;
    return result.rows.length > 0;
  }

  const store = await readJson<AffiliateApiKeyStore>(API_KEY_STORAGE, EMPTY_API_KEY_STORE);
  const idx = store.keys.findIndex((k) => k.affiliateId === affiliateId && !k.revokedAt);
  if (idx === -1) return false;

  store.keys[idx].revokedAt = now;
  await writeJson(API_KEY_STORAGE, store);
  return true;
}

// ===== Tracker Stacks =====

export async function createTrackerStack(affiliateId: string, name: string, notes?: string): Promise<TrackerStack> {
  const now = new Date().toISOString();
  const record: TrackerStack = {
    id: crypto.randomUUID(),
    affiliateId,
    name,
    notes: notes || null,
    createdAt: now,
    updatedAt: now,
  };

  const sql = await getDb();
  if (sql) {
    await ensureAffiliateTables();
    try {
      await sql`
        INSERT INTO tracker_stacks (id, affiliate_id, name, notes, created_at, updated_at)
        VALUES (${record.id}, ${affiliateId}, ${name}, ${notes || null}, ${now}, ${now})
      `;
      return record;
    } catch (dbError) {
      console.error('Tracker stack creation DB failed, falling back to file storage', dbError);
    }
  }

  const store = await readJson<TrackerStackStore>(TRACKER_STACK_STORAGE, EMPTY_TRACKER_STACK_STORE);
  store.stacks.unshift(record);
  await writeJson(TRACKER_STACK_STORAGE, store);

  return record;
}

export async function getTrackerStacks(affiliateId: string): Promise<TrackerStack[]> {
  const sql = await getDb();
  if (sql) {
    const rows = await sql`
      SELECT id, affiliate_id AS "affiliateId", name, notes, created_at AS "createdAt", updated_at AS "updatedAt"
      FROM tracker_stacks
      WHERE affiliate_id = ${affiliateId}
      ORDER BY created_at DESC
    `;
    return rows.rows as TrackerStack[];
  }

  const store = await readJson<TrackerStackStore>(TRACKER_STACK_STORAGE, EMPTY_TRACKER_STACK_STORE);
  return store.stacks.filter((s) => s.affiliateId === affiliateId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function updateTrackerStack(stackId: string, affiliateId: string, updates: { name?: string; notes?: string }): Promise<TrackerStack | null> {
  const now = new Date().toISOString();
  const sql = await getDb();

  if (sql) {
    const result = await sql`
      UPDATE tracker_stacks
      SET name = COALESCE(${updates.name || null}, name),
          notes = COALESCE(${updates.notes || null}, notes),
          updated_at = ${now}
      WHERE id = ${stackId} AND affiliate_id = ${affiliateId}
      RETURNING id, affiliate_id AS "affiliateId", name, notes, created_at AS "createdAt", updated_at AS "updatedAt"
    `;
    return (result.rows[0] as TrackerStack) || null;
  }

  const store = await readJson<TrackerStackStore>(TRACKER_STACK_STORAGE, EMPTY_TRACKER_STACK_STORE);
  const idx = store.stacks.findIndex((s) => s.id === stackId && s.affiliateId === affiliateId);
  if (idx === -1) return null;

  if (updates.name) store.stacks[idx].name = updates.name;
  if (updates.notes !== undefined) store.stacks[idx].notes = updates.notes;
  store.stacks[idx].updatedAt = now;

  await writeJson(TRACKER_STACK_STORAGE, store);
  return store.stacks[idx];
}

export async function deleteTrackerStack(stackId: string, affiliateId: string): Promise<boolean> {
  const sql = await getDb();

  if (sql) {
    const result = await sql`
      DELETE FROM tracker_stacks
      WHERE id = ${stackId} AND affiliate_id = ${affiliateId}
    `;
    return result.count > 0;
  }

  const store = await readJson<TrackerStackStore>(TRACKER_STACK_STORAGE, EMPTY_TRACKER_STACK_STORE);
  const idx = store.stacks.findIndex((s) => s.id === stackId && s.affiliateId === affiliateId);
  if (idx === -1) return false;

  store.stacks.splice(idx, 1);
  await writeJson(TRACKER_STACK_STORAGE, store);
  return true;
}

// ===== Tracker Entries =====

export async function createTrackerEntry(
  stackId: string,
  affiliateId: string,
  date: string,
  dosage?: string,
  notes?: string
): Promise<TrackerEntry> {
  const now = new Date().toISOString();
  const record: TrackerEntry = {
    id: crypto.randomUUID(),
    stackId,
    affiliateId,
    date,
    dosage: dosage || null,
    notes: notes || null,
    createdAt: now,
    updatedAt: now,
  };

  const sql = await getDb();
  if (sql) {
    await ensureAffiliateTables();
    try {
      await sql`
        INSERT INTO tracker_entries (id, stack_id, affiliate_id, date, dosage, notes, created_at, updated_at)
        VALUES (${record.id}, ${stackId}, ${affiliateId}, ${date}, ${dosage || null}, ${notes || null}, ${now}, ${now})
      `;
      return record;
    } catch (dbError) {
      console.error('Tracker entry creation DB failed, falling back to file storage', dbError);
    }
  }

  const store = await readJson<TrackerEntryStore>(TRACKER_ENTRY_STORAGE, EMPTY_TRACKER_ENTRY_STORE);
  store.entries.unshift(record);
  await writeJson(TRACKER_ENTRY_STORAGE, store);

  return record;
}

export async function getTrackerEntries(stackId: string, affiliateId: string): Promise<TrackerEntry[]> {
  const sql = await getDb();
  if (sql) {
    const rows = await sql`
      SELECT id, stack_id AS "stackId", affiliate_id AS "affiliateId", date, dosage, notes, 
             created_at AS "createdAt", updated_at AS "updatedAt"
      FROM tracker_entries
      WHERE stack_id = ${stackId} AND affiliate_id = ${affiliateId}
      ORDER BY date DESC
    `;
    return rows.rows as TrackerEntry[];
  }

  const store = await readJson<TrackerEntryStore>(TRACKER_ENTRY_STORAGE, EMPTY_TRACKER_ENTRY_STORE);
  return store.entries
    .filter((e) => e.stackId === stackId && e.affiliateId === affiliateId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export async function updateTrackerEntry(
  entryId: string,
  affiliateId: string,
  updates: { date?: string; dosage?: string; notes?: string }
): Promise<TrackerEntry | null> {
  const now = new Date().toISOString();
  const sql = await getDb();

  if (sql) {
    const result = await sql`
      UPDATE tracker_entries
      SET date = COALESCE(${updates.date || null}, date),
          dosage = COALESCE(${updates.dosage || null}, dosage),
          notes = COALESCE(${updates.notes || null}, notes),
          updated_at = ${now}
      WHERE id = ${entryId} AND affiliate_id = ${affiliateId}
      RETURNING id, stack_id AS "stackId", affiliate_id AS "affiliateId", date, dosage, notes, 
                created_at AS "createdAt", updated_at AS "updatedAt"
    `;
    return (result.rows[0] as TrackerEntry) || null;
  }

  const store = await readJson<TrackerEntryStore>(TRACKER_ENTRY_STORAGE, EMPTY_TRACKER_ENTRY_STORE);
  const idx = store.entries.findIndex((e) => e.id === entryId && e.affiliateId === affiliateId);
  if (idx === -1) return null;

  if (updates.date) store.entries[idx].date = updates.date;
  if (updates.dosage !== undefined) store.entries[idx].dosage = updates.dosage;
  if (updates.notes !== undefined) store.entries[idx].notes = updates.notes;
  store.entries[idx].updatedAt = now;

  await writeJson(TRACKER_ENTRY_STORAGE, store);
  return store.entries[idx];
}

export async function deleteTrackerEntry(entryId: string, affiliateId: string): Promise<boolean> {
  const sql = await getDb();

  if (sql) {
    const result = await sql`
      DELETE FROM tracker_entries
      WHERE id = ${entryId} AND affiliate_id = ${affiliateId}
    `;
    return result.count > 0;
  }

  const store = await readJson<TrackerEntryStore>(TRACKER_ENTRY_STORAGE, EMPTY_TRACKER_ENTRY_STORE);
  const idx = store.entries.findIndex((e) => e.id === entryId && e.affiliateId === affiliateId);
  if (idx === -1) return false;

  store.entries.splice(idx, 1);
  await writeJson(TRACKER_ENTRY_STORAGE, store);
  return true;
}
