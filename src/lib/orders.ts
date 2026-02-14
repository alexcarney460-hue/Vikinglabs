import crypto from 'crypto';
import { getSupabase, hasSupabase } from './supabase';
import { getSql, hasPooledDatabase } from './db';
import { readJson, writeJson } from './storage';

export type OrderRecord = {
  id: string;
  provider: 'stripe' | 'coinbase';
  providerOrderId: string;
  email: string;
  amountCents: number;
  currency: string;
  autoship: boolean;
  items: unknown;
  createdAt: string;
};

type Store = { orders: OrderRecord[] };
const STORAGE_FILE = 'orders.json';
const EMPTY: Store = { orders: [] };

function hasDatabase() {
  return hasSupabase() || hasPooledDatabase();
}

export async function recordOrder(input: Omit<OrderRecord, 'id' | 'createdAt'>): Promise<OrderRecord> {
  const now = new Date().toISOString();
  const record: OrderRecord = {
    id: crypto.randomUUID(),
    createdAt: now,
    ...input,
  };

  // Try Supabase first
  const supabase = getSupabase();
  if (supabase) {
    const { error } = await supabase.from('orders').upsert({
      id: record.id,
      provider: record.provider,
      provider_order_id: record.providerOrderId,
      email: record.email,
      amount_cents: record.amountCents,
      currency: record.currency,
      autoship: record.autoship,
      items: record.items,
      created_at: record.createdAt,
    }, { onConflict: 'id' });
    if (!error) return record;
    console.error('[orders] Supabase insert error:', error.message);
  }

  // Fallback to @vercel/postgres
  if (hasPooledDatabase()) {
    const sql = await getSql();
    if (sql) {
      await sql`
        INSERT INTO orders
          (id, provider, provider_order_id, email, amount_cents, currency, autoship, items, created_at)
        VALUES
          (${record.id}, ${record.provider}, ${record.providerOrderId}, ${record.email}, ${record.amountCents}, ${record.currency}, ${record.autoship}, ${record.items as any}, ${record.createdAt})
        ON CONFLICT DO NOTHING
      `;
      return record;
    }
  }

  // Fallback to file storage
  const store = await readJson<Store>(STORAGE_FILE, EMPTY);
  store.orders.unshift(record);
  await writeJson(STORAGE_FILE, store);
  return record;
}

export async function listOrders(limit = 200): Promise<OrderRecord[]> {
  // Try Supabase first
  const supabase = getSupabase();
  if (supabase) {
    const { data, error } = await supabase
      .from('orders')
      .select('id, provider, provider_order_id, email, amount_cents, currency, autoship, items, created_at')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (!error && data) {
      return data.map((r: any) => ({
        id: r.id,
        provider: r.provider,
        providerOrderId: r.provider_order_id,
        email: r.email,
        amountCents: r.amount_cents,
        currency: r.currency,
        autoship: r.autoship,
        items: r.items,
        createdAt: r.created_at,
      }));
    }
    if (error) console.error('[orders] Supabase query error:', error.message);
  }

  // Fallback to @vercel/postgres
  if (hasPooledDatabase()) {
    const sql = await getSql();
    if (sql) {
      const rows = await sql`
        SELECT id, provider, provider_order_id AS "providerOrderId",
               email, amount_cents AS "amountCents", currency,
               autoship, items, created_at AS "createdAt"
        FROM orders ORDER BY created_at DESC LIMIT ${limit}
      `;
      return rows.rows as OrderRecord[];
    }
  }

  const store = await readJson<Store>(STORAGE_FILE, EMPTY);
  return store.orders.slice(0, limit);
}
