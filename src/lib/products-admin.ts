import { products, type Product } from '@/app/catalog/data';
import { getSql, hasPooledDatabase } from './db';
import { readJson, writeJson } from './storage';

export type ProductOverride = {
  productId: string;
  enabled: boolean;
  price: number | null;
  inventory: number | null;
  image: string | null;
  updatedAt: string;
};

export type AdminProduct = Product & {
  enabled: boolean;
  inventory: number | null;
  adminPrice: number;
  basePrice: number;
  overridePrice: number | null;
  updatedAt?: string | null;
};

type Store = { overrides: Record<string, ProductOverride> };
const STORAGE_FILE = 'product-overrides.json';
const EMPTY_STORE: Store = { overrides: {} };

function hasDatabase() {
  return hasPooledDatabase();
}

async function ensureTables() {
  const sql = await getSql();
  if (!sql) return;
  await sql`
    CREATE TABLE IF NOT EXISTS product_overrides (
      product_id text PRIMARY KEY,
      enabled boolean NOT NULL DEFAULT true,
      price numeric NULL,
      inventory int NULL,
      image text NULL,
      updated_at timestamptz NOT NULL
    );
  `;
}

export async function listProductOverrides(): Promise<Record<string, ProductOverride>> {
  if (hasDatabase()) {
    const sql = await getSql();
    if (sql) {
      await ensureTables();
      const rows = await sql`
        SELECT product_id AS "productId",
               enabled,
               price,
               inventory,
               image,
               updated_at AS "updatedAt"
        FROM product_overrides
      `;

      const map: Record<string, ProductOverride> = {};
      for (const row of rows.rows as any[]) {
        map[row.productId] = {
          productId: row.productId,
          enabled: Boolean(row.enabled),
          price: row.price === null || row.price === undefined ? null : Number(row.price),
          inventory: row.inventory === null || row.inventory === undefined ? null : Number(row.inventory),
          image: row.image || null,
          updatedAt: new Date(row.updatedAt).toISOString(),
        };
      }
      return map;
    }
  }

  const store = await readJson<Store>(STORAGE_FILE, EMPTY_STORE);
  return store.overrides;
}

export async function upsertProductOverride(input: {
  productId: string;
  enabled?: boolean;
  price?: number | null;
  inventory?: number | null;
  image?: string | null;
}): Promise<ProductOverride> {
  const productId = input.productId;
  if (!productId) throw new Error('productId is required');

  const now = new Date().toISOString();

  if (hasDatabase()) {
    const sql = await getSql();
    if (sql) {
      await ensureTables();
      const result = await sql`
        INSERT INTO product_overrides (product_id, enabled, price, inventory, image, updated_at)
        VALUES (${productId}, COALESCE(${input.enabled ?? null}, true), ${input.price ?? null}, ${input.inventory ?? null}, ${input.image ?? null}, ${now})
        ON CONFLICT (product_id) DO UPDATE
          SET enabled = COALESCE(${input.enabled ?? null}, product_overrides.enabled),
              price = COALESCE(${input.price ?? null}, product_overrides.price),
              inventory = COALESCE(${input.inventory ?? null}, product_overrides.inventory),
              image = COALESCE(${input.image ?? null}, product_overrides.image),
              updated_at = ${now}
        RETURNING product_id AS "productId", enabled, price, inventory, image, updated_at AS "updatedAt"
      `;

      const row = result.rows[0] as any;
      return {
        productId: row.productId,
        enabled: Boolean(row.enabled),
        price: row.price === null || row.price === undefined ? null : Number(row.price),
        inventory: row.inventory === null || row.inventory === undefined ? null : Number(row.inventory),
        image: row.image || null,
        updatedAt: new Date(row.updatedAt).toISOString(),
      };
    }
  }

  const store = await readJson<Store>(STORAGE_FILE, EMPTY_STORE);
  const current = store.overrides[productId] ?? {
    productId,
    enabled: true,
    price: null,
    inventory: null,
    image: null,
    updatedAt: now,
  };

  const next: ProductOverride = {
    productId,
    enabled: input.enabled ?? current.enabled,
    price: input.price !== undefined ? input.price : current.price,
    inventory: input.inventory !== undefined ? input.inventory : current.inventory,
    image: input.image !== undefined ? input.image : current.image,
    updatedAt: now,
  };

  store.overrides[productId] = next;
  await writeJson(STORAGE_FILE, store);
  return next;
}

export async function listAdminProducts(): Promise<AdminProduct[]> {
  const overrides = await listProductOverrides();

  return products.map((p) => {
    const ov = overrides[p.id];
    const enabled = ov ? ov.enabled : true;
    const overridePrice = ov?.price ?? null;
    const inventory = ov?.inventory ?? null;
    const overrideImage = ov?.image ?? null;
    const adminPrice = overridePrice ?? p.price;

    return {
      ...p,
      enabled,
      inventory,
      image: overrideImage ?? p.image, // Use override image if set, otherwise default
      basePrice: p.price,
      overridePrice,
      adminPrice,
      updatedAt: ov?.updatedAt ?? null,
    };
  });
}
