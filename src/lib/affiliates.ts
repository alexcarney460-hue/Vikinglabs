import crypto from 'crypto';
import nodemailer from 'nodemailer';
import { sql } from '@vercel/postgres';
import { readJson, writeJson } from './storage';

export type AffiliateStatus = 'pending' | 'approved' | 'declined';

export type AffiliateApplication = {
  id: string;
  name: string;
  email: string;
  socialHandle?: string | null;
  audienceSize?: string | null;
  channels?: string | null;
  notes?: string | null;
  status: AffiliateStatus;
  createdAt: string;
  updatedAt: string;
};

type AffiliateStore = {
  applications: AffiliateApplication[];
};

const STORAGE_FILE = 'affiliate-applications.json';
const EMPTY_STORE: AffiliateStore = { applications: [] };

function hasDatabase() {
  return Boolean(process.env.DATABASE_URL);
}

function normalizeInput(value?: string | null) {
  return value?.trim() || null;
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
    createdAt: now,
    updatedAt: now,
  };

  if (hasDatabase()) {
    await sql`
      INSERT INTO affiliate_applications
      (id, name, email, social_handle, audience_size, channels, notes, status, created_at, updated_at)
      VALUES
      (${record.id}, ${record.name}, ${record.email}, ${record.socialHandle}, ${record.audienceSize}, ${record.channels}, ${record.notes}, ${record.status}, ${record.createdAt}, ${record.updatedAt})
    `;
    return record;
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

export async function updateAffiliateStatus(id: string, status: AffiliateStatus): Promise<AffiliateApplication | null> {
  const now = new Date().toISOString();

  if (hasDatabase()) {
    const result = await sql`
      UPDATE affiliate_applications
      SET status = ${status}, updated_at = ${now}
      WHERE id = ${id}
      RETURNING id,
                name,
                email,
                social_handle AS "socialHandle",
                audience_size AS "audienceSize",
                channels,
                notes,
                status,
                created_at AS "createdAt",
                updated_at AS "updatedAt"
    `;
    return (result.rows[0] as AffiliateApplication) || null;
  }

  const store = await readJson<AffiliateStore>(STORAGE_FILE, EMPTY_STORE);
  const idx = store.applications.findIndex(app => app.id === id);
  if (idx === -1) return null;
  store.applications[idx] = {
    ...store.applications[idx],
    status,
    updatedAt: now,
  };
  await writeJson(STORAGE_FILE, store);
  return store.applications[idx];
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
