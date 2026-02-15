import { type Product } from '@/app/catalog/data';
import { getSql, hasPooledDatabase } from './db';
import { readJson, writeJson } from './storage';
import { listAllProducts } from './products-storage';
import { getSupabase } from './supabase';

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

async function ensureSupabaseTables() {
  const supabase = getSupabase();
  if (!supabase) return;
  
  try {
    // Create table if it doesn't exist by trying to select from it
    const { error } = await supabase.from('product_overrides').select('*').limit(1);
    
    if (error && error.code === 'PGRST116') {
      // Table doesn't exist, create it
      console.log('[ensureSupabaseTables] Creating product_overrides table...');
      // We can't create tables via supabase client, but we can try via RPC or raw SQL
      // For now, just log that it needs to be created manually
      console.error('[ensureSupabaseTables] Table does not exist. Please create it manually in Supabase.');
    }
  } catch (err) {
    console.error('[ensureSupabaseTables] Error:', err);
  }
}

function hasDatabase() {
  return hasPooledDatabase();
}

async function ensureTables() {
  const sql = await getSql();
  if (!sql) {
    console.log('[ensureTables] No database connection available');
    return;
  }
  try {
    console.log('[ensureTables] Creating table if not exists...');
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
    console.log('[ensureTables] Table ready');
  } catch (err) {
    console.error('[ensureTables] Error creating table:', err);
    throw err;
  }
}

export async function listProductOverrides(): Promise<Record<string, ProductOverride>> {
  // Try Supabase first
  const supabase = getSupabase();
  if (supabase) {
    console.log(`[listProductOverrides] Using Supabase`);
    try {
      const { data: rows, error } = await supabase.from('product_overrides').select('*');
      if (error) {
        console.error(`[listProductOverrides] Supabase query error:`, error);
        throw error;
      }

      const map: Record<string, ProductOverride> = {};
      for (const row of (rows || []) as any[]) {
        map[row.product_id] = {
          productId: row.product_id,
          enabled: Boolean(row.enabled),
          price: row.price === null ? null : Number(row.price),
          inventory: row.inventory === null ? null : Number(row.inventory),
          image: row.image || null,
          updatedAt: row.updated_at,
        };
      }
      console.log(`[listProductOverrides] Found ${Object.keys(map).length} overrides:`, Object.keys(map).slice(0, 5));
      if (Object.keys(map).includes('bpc-157')) {
        console.log(`[listProductOverrides] BPC-157 override:`, map['bpc-157']);
      }
      return map;
    } catch (err) {
      console.error(`[listProductOverrides] Supabase error:`, err);
      throw err;
    }
  }

  // Fallback to SQL
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

  console.log(`[listProductOverrides] Falling back to JSON file storage`);
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
  
  console.log(`[upsertProductOverride] Input:`, input);

  const now = new Date().toISOString();

  // Try Supabase first
  const supabase = getSupabase();
  if (supabase) {
    console.log(`[upsertProductOverride] Using Supabase`);
    try {
      const upsertData = {
        product_id: productId,
        enabled: input.enabled ?? true,
        price: input.price !== undefined ? input.price : null,
        inventory: input.inventory !== undefined ? input.inventory : null,
        image: input.image !== undefined ? input.image : null,
        updated_at: now,
      };
      
      console.log(`[upsertProductOverride] Upserting to Supabase:`, upsertData);
      
      const { error: upsertError } = await supabase.from('product_overrides').upsert(upsertData);
      if (upsertError) {
        console.error(`[upsertProductOverride] Upsert error:`, upsertError);
        throw upsertError;
      }

      console.log(`[upsertProductOverride] Upsert successful, fetching back...`);
      const { data: row, error } = await supabase.from('product_overrides').select('*').eq('product_id', productId).single();
      
      if (error) {
        console.error(`[upsertProductOverride] Fetch error:`, error);
        throw error;
      }
      
      console.log(`[upsertProductOverride] Fetched row:`, row);
      
      const result_obj = {
        productId: row.product_id,
        enabled: Boolean(row.enabled),
        price: row.price === null ? null : Number(row.price),
        inventory: row.inventory === null ? null : Number(row.inventory),
        image: row.image || null,
        updatedAt: row.updated_at,
      };
      console.log(`[upsertProductOverride] Supabase result:`, result_obj);
      return result_obj;
    } catch (err) {
      console.error(`[upsertProductOverride] Supabase error:`, err);
      throw err;
    }
  }

  // Fallback to SQL if available
  if (hasDatabase()) {
    const sql = await getSql();
    if (sql) {
      await ensureTables();
      console.log(`[upsertProductOverride] Using database`);
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
      const result_obj = {
        productId: row.productId,
        enabled: Boolean(row.enabled),
        price: row.price === null || row.price === undefined ? null : Number(row.price),
        inventory: row.inventory === null || row.inventory === undefined ? null : Number(row.inventory),
        image: row.image || null,
        updatedAt: new Date(row.updatedAt).toISOString(),
      };
      console.log(`[upsertProductOverride] Database result:`, result_obj);
      return result_obj;
    }
  }

  console.log(`[upsertProductOverride] Falling back to JSON file storage`);
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

  console.log(`[upsertProductOverride] Next value:`, next);
  store.overrides[productId] = next;
  await writeJson(STORAGE_FILE, store);
  console.log(`[upsertProductOverride] Wrote to storage`);
  return next;
}

export async function listAdminProducts(): Promise<AdminProduct[]> {
  const overrides = await listProductOverrides();
  const products = await listAllProducts();

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
