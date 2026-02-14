import crypto from 'crypto';
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
  return hasPooledDatabase();
}

async function ensureTables() {
  const sql = await getSql();
  if (!sql) return;
  await sql`
    CREATE TABLE IF NOT EXISTS orders (
      id uuid PRIMARY KEY,
      provider text NOT NULL,
      provider_order_id text NOT NULL,
      email text NOT NULL,
      amount_cents int NOT NULL,
      currency text NOT NULL,
      autoship boolean NOT NULL DEFAULT false,
      items jsonb NULL,
      created_at timestamptz NOT NULL
    );
    CREATE INDEX IF NOT EXISTS orders_created_at_idx ON orders (created_at DESC);
    CREATE INDEX IF NOT EXISTS orders_provider_order_id_idx ON orders (provider_order_id);
  `;
}

export async function recordOrder(input: Omit<OrderRecord, 'id' | 'createdAt'>): Promise<OrderRecord> {
  const now = new Date().toISOString();
  const record: OrderRecord = {
    id: crypto.randomUUID(),
    createdAt: now,
    ...input,
  };

  if (hasDatabase()) {
    const sql = await getSql();
    if (sql) {
      await ensureTables();
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

  const store = await readJson<Store>(STORAGE_FILE, EMPTY);
  store.orders.unshift(record);
  await writeJson(STORAGE_FILE, store);
  return record;
}

export async function listOrders(limit = 200): Promise<OrderRecord[]> {
  if (hasDatabase()) {
    const sql = await getSql();
    if (sql) {
      await ensureTables();
      const rows = await sql`
        SELECT id,
               provider,
               provider_order_id AS "providerOrderId",
               email,
               amount_cents AS "amountCents",
               currency,
               autoship,
               items,
               created_at AS "createdAt"
        FROM orders
        ORDER BY created_at DESC
        LIMIT ${limit}
      `;
      return rows.rows as OrderRecord[];
    }
  }

  const store = await readJson<Store>(STORAGE_FILE, EMPTY);
  return store.orders.slice(0, limit);
}
