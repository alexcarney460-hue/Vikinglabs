import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { promises as fs } from 'node:fs';

import { listAdminProducts, upsertProductOverride } from './products-admin';

const DATA_DIR = path.join(process.cwd(), 'src', 'lib', 'data');
const FILE = path.join(DATA_DIR, 'product-overrides.json');

async function cleanup() {
  try {
    await fs.unlink(FILE);
  } catch {
    // ignore
  }
}

test('product overrides (file fallback)', async () => {
  const prevDb = process.env.DATABASE_URL;
  delete process.env.DATABASE_URL;
  await cleanup();

  const initial = await listAdminProducts();
  assert.ok(initial.length > 0);
  const first = initial[0];

  const ov = await upsertProductOverride({
    productId: first.id,
    enabled: false,
    price: 123.45,
    inventory: 7,
  });

  assert.equal(ov.productId, first.id);
  assert.equal(ov.enabled, false);
  assert.equal(ov.price, 123.45);
  assert.equal(ov.inventory, 7);

  const after = await listAdminProducts();
  const updated = after.find((p) => p.id === first.id)!;
  assert.equal(updated.enabled, false);
  assert.equal(updated.overridePrice, 123.45);
  assert.equal(updated.inventory, 7);

  await cleanup();
  if (prevDb) process.env.DATABASE_URL = prevDb;
});
