import { getSql, hasPooledDatabase } from './db';
import { readJson, writeJson } from './storage';
import { products as defaultProducts, type Product } from '@/app/catalog/data';

type Store = { products: Product[] };
const STORAGE_FILE = 'products-custom.json';
const EMPTY_STORE: Store = { products: [] };

function hasDatabase() {
  return hasPooledDatabase();
}

async function ensureTables() {
  const sql = await getSql();
  if (!sql) return;
  await sql`
    CREATE TABLE IF NOT EXISTS products (
      id text PRIMARY KEY,
      slug text NOT NULL UNIQUE,
      name text NOT NULL,
      price numeric NOT NULL,
      category text NOT NULL,
      image text NOT NULL,
      description text NOT NULL,
      research text NOT NULL,
      created_at timestamptz NOT NULL DEFAULT NOW()
    );
  `;
}

export async function listAllProducts(): Promise<Product[]> {
  const customProducts = await listCustomProducts();
  // Merge default products with custom, custom products can override defaults by ID
  const mergedMap = new Map<string, Product>();
  
  for (const p of defaultProducts) {
    mergedMap.set(p.id, p);
  }
  
  for (const p of customProducts) {
    mergedMap.set(p.id, p);
  }
  
  return Array.from(mergedMap.values());
}

async function listCustomProducts(): Promise<Product[]> {
  if (hasDatabase()) {
    const sql = await getSql();
    if (sql) {
      await ensureTables();
      const rows = await sql`
        SELECT id, slug, name, price, category, image, description AS desc, research
        FROM products
        ORDER BY created_at DESC
      `;
      return rows.rows as Product[];
    }
  }

  const store = await readJson<Store>(STORAGE_FILE, EMPTY_STORE);
  return store.products;
}

export async function createProduct(input: {
  id: string;
  slug: string;
  name: string;
  price: number;
  category: Product['category'];
  image: string;
  desc: string;
  research: string;
}): Promise<Product> {
  // Validate required fields
  if (!input.id || !input.slug || !input.name || !input.price || !input.category) {
    throw new Error('Missing required fields');
  }

  // Check if product already exists
  const existing = await listAllProducts();
  if (existing.some(p => p.id === input.id)) {
    throw new Error('Product ID already exists');
  }
  if (existing.some(p => p.slug === input.slug)) {
    throw new Error('Product slug already exists');
  }

  const product: Product = {
    id: input.id,
    slug: input.slug,
    name: input.name,
    price: input.price,
    category: input.category,
    image: input.image,
    desc: input.desc,
    research: input.research,
  };

  if (hasDatabase()) {
    const sql = await getSql();
    if (sql) {
      await ensureTables();
      await sql`
        INSERT INTO products (id, slug, name, price, category, image, description, research)
        VALUES (${product.id}, ${product.slug}, ${product.name}, ${product.price}, ${product.category}, ${product.image}, ${product.desc}, ${product.research})
      `;
      return product;
    }
  }

  const store = await readJson<Store>(STORAGE_FILE, EMPTY_STORE);
  store.products.push(product);
  await writeJson(STORAGE_FILE, store);
  return product;
}

export async function updateProduct(id: string, updates: Partial<Omit<Product, 'id'>>): Promise<Product> {
  if (hasDatabase()) {
    const sql = await getSql();
    if (sql) {
      await ensureTables();
      
      // For now, build individual UPDATE queries per field (simpler approach)
      // @vercel/postgres doesn't support dynamic SET clauses easily
      
      if (Object.keys(updates).length === 0) {
        throw new Error('No fields to update');
      }

      // Fetch current product first
      const current = await sql`
        SELECT id, slug, name, price, category, image, description AS desc, research
        FROM products
        WHERE id = ${id}
      `;

      if (current.count === 0) {
        throw new Error('Product not found');
      }

      // Merge updates with current
      const merged = { ...current.rows[0], ...updates };
      
      // Update all fields
      const result = await sql`
        UPDATE products 
        SET slug = ${merged.slug},
            name = ${merged.name},
            price = ${merged.price},
            category = ${merged.category},
            image = ${merged.image},
            description = ${merged.desc},
            research = ${merged.research}
        WHERE id = ${id}
        RETURNING id, slug, name, price, category, image, description AS desc, research
      `;

      return result.rows[0] as Product;
    }
  }

  const store = await readJson<Store>(STORAGE_FILE, EMPTY_STORE);
  const index = store.products.findIndex(p => p.id === id);
  
  if (index === -1) {
    throw new Error('Product not found');
  }

  store.products[index] = { ...store.products[index], ...updates };
  await writeJson(STORAGE_FILE, store);
  return store.products[index];
}
