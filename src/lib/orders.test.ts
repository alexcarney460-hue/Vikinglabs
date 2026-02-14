import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { promises as fs } from 'node:fs';

import { listOrders, recordOrder } from './orders';

const DATA_DIR = path.join(process.cwd(), 'src', 'lib', 'data');
const FILE = path.join(DATA_DIR, 'orders.json');

async function cleanup() {
  try {
    await fs.unlink(FILE);
  } catch {
    // ignore
  }
}

test('orders record/list (file fallback)', async () => {
  const prevDb = process.env.DATABASE_URL;
  delete process.env.DATABASE_URL;
  await cleanup();

  await recordOrder({
    provider: 'stripe',
    providerOrderId: 'sess_123',
    email: 'test@example.com',
    amountCents: 999,
    currency: 'usd',
    autoship: false,
    items: { cart: [] },
  });

  const orders = await listOrders(10);
  assert.equal(orders.length, 1);
  assert.equal(orders[0].providerOrderId, 'sess_123');

  await cleanup();
  if (prevDb) process.env.DATABASE_URL = prevDb;
});
