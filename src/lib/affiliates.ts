import crypto from 'crypto';
import nodemailer from 'nodemailer';
import { sql } from '@vercel/postgres';
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
  approvedAt?: string | null;
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
  return Boolean(process.env.DATABASE_URL);
}

function normalizeInput(value?: string | null) {
  return value?.trim() || null;
}

async function isCodeAvailable(code: string) {
  if (hasDatabase()) {
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
    approvedAt: null,
    declinedAt: null,
    requestedInfoAt: null,
    discordUserId: null,
    createdAt: now,
    updatedAt: now,
  };

  if (hasDatabase()) {
    try {
      await sql`
        INSERT INTO affiliate_applications
        (id, name, email, social_handle, audience_size, channels, notes, status, code, signup_credit_cents, approved_at, declined_at, requested_info_at, discord_user_id, created_at, updated_at)
        VALUES
        (${record.id}, ${record.name}, ${record.email}, ${record.socialHandle}, ${record.audienceSize}, ${record.channels}, ${record.notes}, ${record.status}, ${record.code}, ${record.signupCreditCents}, ${record.approvedAt}, ${record.declinedAt}, ${record.requestedInfoAt}, ${record.discordUserId}, ${record.createdAt}, ${record.updatedAt})
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
  if (hasDatabase()) {
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
                 approved_at AS "approvedAt",
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
                 approved_at AS "approvedAt",
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

export async function getAffiliateByCode(code: string): Promise<AffiliateApplication | null> {
  const normalized = formatAffiliateCode(code);
  if (!normalized) return null;

  if (hasDatabase()) {
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
             approved_at AS "approvedAt",
             declined_at AS "declinedAt",
             requested_info_at AS "requestedInfoAt",
             discord_user_id AS "discordUserId",
             created_at AS "createdAt",
             updated_at AS "updatedAt"
      FROM affiliate_applications
      WHERE code = ${normalized}
      LIMIT 1
    `;
    return (rows.rows[0] as AffiliateApplication) || null;
  }

  const store = await readJson<AffiliateStore>(STORAGE_FILE, EMPTY_STORE);
  return store.applications.find((app) => app.code === normalized) || null;
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

  if (hasDatabase()) {
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
    let declinedAt: string | null = null;
    let requestedInfoAt: string | null = null;

    if (desiredStatus === 'approved') {
      code = current.code || (await generateAffiliateCode(current.name, current.email));
      approvedAt = now;
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
                approved_at AS "approvedAt",
                declined_at AS "declinedAt",
                requested_info_at AS "requestedInfoAt",
                discord_user_id AS "discordUserId",
                created_at AS "createdAt",
                updated_at AS "updatedAt"
    `;

    const updated = (result.rows[0] as AffiliateApplication) || null;

    if (updated && desiredStatus === 'approved') {
      await sendTelegramAdminAlert(
        `Affiliate approved: ${updated.name} (${updated.email})\nCode: ${updated.code || 'TBD'}\nSignup credit: $${(
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

  const updated: AffiliateApplication = {
    ...current,
    status: nextStatus,
    code,
    signupCreditCents: input.signupCreditCents ?? current.signupCreditCents,
    approvedAt: nextStatus === 'approved' ? now : current.approvedAt,
    declinedAt: nextStatus === 'declined' ? now : current.declinedAt,
    requestedInfoAt: nextStatus === 'needs_info' ? now : current.requestedInfoAt,
    discordUserId: input.discordUserId ?? current.discordUserId,
    updatedAt: now,
  };

  store.applications[idx] = updated;
  await writeJson(STORAGE_FILE, store);

  if (nextStatus === 'approved') {
    await sendTelegramAdminAlert(
      `Affiliate approved: ${updated.name} (${updated.email})\nCode: ${updated.code || 'TBD'}\nSignup credit: $${(
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

  if (hasDatabase()) {
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

  if (hasDatabase()) {
    await sql`
      INSERT INTO order_affiliates
      (id, provider, order_id, affiliate_id, code, amount_cents, currency, metadata, created_at)
      VALUES
      (${record.id}, ${record.provider}, ${record.orderId}, ${record.affiliateId}, ${record.code}, ${record.amountCents}, ${record.currency}, ${record.metadata ? JSON.stringify(record.metadata) : null}, ${record.createdAt})
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

  if (hasDatabase()) {
    const clicks = await sql.query(
      `
      SELECT affiliate_id AS "affiliateId", COUNT(*)::int AS clicks
      FROM affiliate_clicks
      WHERE affiliate_id = ANY($1::uuid[])
      GROUP BY affiliate_id
      `,
      [ids]
    );

    const orders = await sql.query(
      `
      SELECT affiliate_id AS "affiliateId",
             COUNT(*)::int AS orders,
             COALESCE(SUM(amount_cents), 0)::int AS "revenueCents"
      FROM order_affiliates
      WHERE affiliate_id = ANY($1::uuid[])
      GROUP BY affiliate_id
      `,
      [ids]
    );

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

  if (hasDatabase()) {
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
