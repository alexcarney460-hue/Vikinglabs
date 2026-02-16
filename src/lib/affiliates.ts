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
    CREATE TABLE IF NOT EXISTS affiliate_conversions (
      id uuid PRIMARY KEY,
      affiliate_id uuid NOT NULL,
      order_id text NOT NULL,
      amount_cents int NOT NULL,
      commission_cents int NOT NULL,
      status text NOT NULL DEFAULT 'completed',
      created_at timestamptz NOT NULL
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS affiliate_payouts (
      id uuid PRIMARY KEY,
      affiliate_id uuid NOT NULL,
      amount_cents int NOT NULL,
      status text NOT NULL DEFAULT 'pending',
      reference text NULL,
      created_at timestamptz NOT NULL
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

async function generateAffiliateCode(socialHandle: string | null | undefined, name: string, email: string) {
  // Prefer social handle if provided, otherwise fallback to name
  let base = socialHandle?.trim() ? formatAffiliateCode(socialHandle) : buildAffiliateCodeSeed(name, email);
  
  // Try 100 variations with number suffix (001-100)
  for (let attempt = 1; attempt <= 100; attempt += 1) {
    const paddedNum = String(attempt).padStart(3, '0');
    const code = `${base}-${paddedNum}`.slice(0, 20);
    if (await isCodeAvailable(code)) return code;
  }
  
  // Fallback: random code
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
      SELECT name, email, code, social_handle
      FROM affiliate_applications
      WHERE id = ${input.id}
      LIMIT 1
    `;
    if (!currentRows.rows[0]) return null;

    const current = currentRows.rows[0] as { name: string; email: string; code: string | null; social_handle: string | null };
    let code: string | null = null;
    let approvedAt: string | null = null;
    let expiresAt: string | null = null;
    let declinedAt: string | null = null;
    let requestedInfoAt: string | null = null;

    if (desiredStatus === 'approved') {
      code = current.code || (await generateAffiliateCode(current.social_handle, current.name, current.email));
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
  const code = nextStatus === 'approved' && !current.code ? await generateAffiliateCode(current.socialHandle, current.name, current.email) : current.code;
  
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

/**
 * Dashboard Helper Functions for Approved Affiliates
 */

export async function getAffiliateById(id: string): Promise<AffiliateApplication | null> {
  if (!id) return null;

  const sql = await getDb();
  if (sql) {
    const result = await sql`
      SELECT id, name, email, social_handle, audience_size, channels, notes, status, code,
             signup_credit_cents, commission_rate, approved_at, expires_at, declined_at,
             requested_info_at, discord_user_id, created_at, updated_at
      FROM affiliate_applications
      WHERE id = ${id}
      LIMIT 1
    `;
    if (result.rows.length > 0) {
      return formatAffiliateRow(result.rows[0] as any);
    }
  }

  const store = await readJson<AffiliateStore>(STORAGE_FILE, EMPTY_STORE);
  return store.applications.find((app) => app.id === id) || null;
}

export async function getAffiliateByEmail(email: string): Promise<AffiliateApplication | null> {
  const normalized = normalizeInput(email);
  if (!normalized) return null;

  const sql = await getDb();
  if (sql) {
    const result = await sql`
      SELECT id, name, email, social_handle, audience_size, channels, notes, status, code,
             signup_credit_cents, commission_rate, approved_at, expires_at, declined_at,
             requested_info_at, discord_user_id, created_at, updated_at
      FROM affiliate_applications
      WHERE email = ${normalized} AND status = 'approved'
      LIMIT 1
    `;
    if (result.rows.length > 0) {
      return formatAffiliateRow(result.rows[0] as any);
    }
  }

  const store = await readJson<AffiliateStore>(STORAGE_FILE, EMPTY_STORE);
  return store.applications.find(
    (app) => app.email?.toLowerCase() === normalized && app.status === 'approved'
  ) || null;
}

export type AffiliateConversion = {
  id: string;
  orderId: string;
  amountCents: number;
  commissionCents: number;
  status: string;
  createdAt: string;
};

export async function listAffiliateConversions(affiliateId: string, limit = 50): Promise<AffiliateConversion[]> {
  const sql = await getDb();
  if (sql) {
    const result = await sql`
      SELECT id, order_id, amount_cents, commission_cents, status, created_at
      FROM affiliate_conversions
      WHERE affiliate_id = ${affiliateId}
      ORDER BY created_at DESC
      LIMIT ${limit}
    `;
    return (result.rows as any[]).map((r) => ({
      id: r.id,
      orderId: r.order_id,
      amountCents: r.amount_cents,
      commissionCents: r.commission_cents,
      status: r.status,
      createdAt: r.created_at,
    }));
  }

  const orderStore = await readJson<OrderAffiliateStore>(ORDER_STORAGE_FILE, EMPTY_ORDER_STORE);
  return orderStore.orders
    .filter((o) => o.affiliateId === affiliateId)
    .slice(0, limit)
    .map((o) => ({
      id: o.id,
      orderId: o.id,
      amountCents: o.amountCents ?? 0,
      commissionCents: Math.round((o.amountCents ?? 0) * 0.1), // default 10%
      status: 'completed',
      createdAt: o.createdAt,
    }));
}

export type AffiliatePayout = {
  id: string;
  amountCents: number;
  status: 'pending' | 'processing' | 'completed';
  reference?: string;
  createdAt: string;
};

export async function listAffiliatePayouts(affiliateId: string, limit = 20): Promise<AffiliatePayout[]> {
  const sql = await getDb();
  if (sql) {
    const result = await sql`
      SELECT id, amount_cents, status, reference, created_at
      FROM affiliate_payouts
      WHERE affiliate_id = ${affiliateId}
      ORDER BY created_at DESC
      LIMIT ${limit}
    `;
    return (result.rows as any[]).map((r) => ({
      id: r.id,
      amountCents: r.amount_cents,
      status: r.status,
      reference: r.reference,
      createdAt: r.created_at,
    }));
  }

  // No local storage for payouts yet
  return [];
}

export type AffiliateSummary = {
  affiliateId: string;
  name: string;
  email: string;
  code: string | null;
  commissionRate: number;
  totalSalesCents: number;
  totalCommissionCents: number;
  pendingCommissionCents: number;
  paidCommissionCents: number;
  last30dSalesCents: number;
  conversionCount: number;
};

export async function getAffiliateSummary(affiliateId: string): Promise<AffiliateSummary | null> {
  const app = await getAffiliateById(affiliateId);
  if (!app || app.status !== 'approved') return null;

  const conversions = await listAffiliateConversions(affiliateId, 1000);
  const now = Date.now();
  const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;

  const totalSalesCents = conversions.reduce((sum, c) => sum + c.amountCents, 0);
  const totalCommissionCents = conversions.reduce((sum, c) => sum + c.commissionCents, 0);

  const last30dSalesCents = conversions
    .filter((c) => new Date(c.createdAt).getTime() > thirtyDaysAgo)
    .reduce((sum, c) => sum + c.amountCents, 0);

  const payouts = await listAffiliatePayouts(affiliateId, 1000);
  const paidCommissionCents = payouts
    .filter((p) => p.status === 'completed')
    .reduce((sum, p) => sum + p.amountCents, 0);
  const pendingCommissionCents = totalCommissionCents - paidCommissionCents;

  return {
    affiliateId,
    name: app.name,
    email: app.email,
    code: app.code ?? null,
    commissionRate: app.commissionRate,
    totalSalesCents,
    totalCommissionCents,
    pendingCommissionCents: Math.max(0, pendingCommissionCents),
    paidCommissionCents,
    last30dSalesCents,
    conversionCount: conversions.length,
  };
}

function formatAffiliateRow(row: any): AffiliateApplication {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    socialHandle: row.social_handle,
    audienceSize: row.audience_size,
    channels: row.channels,
    notes: row.notes,
    status: row.status,
    code: row.code,
    signupCreditCents: row.signup_credit_cents,
    commissionRate: row.commission_rate,
    approvedAt: row.approved_at,
    expiresAt: row.expires_at,
    declinedAt: row.declined_at,
    requestedInfoAt: row.requested_info_at,
    discordUserId: row.discord_user_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
