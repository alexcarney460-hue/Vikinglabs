import crypto from 'crypto';
import { getSql, hasPooledDatabase } from './db';
import { readJson, writeJson } from './storage';

export type LibraryArticle = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  tags: string[];
  publicUrl?: string | null;
  productSlug?: string | null;
  createdAt: string;
  updatedAt: string;
};

type LibraryStore = { articles: LibraryArticle[] };

const STORAGE_FILE = 'library-articles.json';
const EMPTY_STORE: LibraryStore = { articles: [] };

function hasDatabase() {
  return hasPooledDatabase();
}

async function ensureTables() {
  const sql = await getSql();
  if (!sql) return;
  await sql`
    CREATE TABLE IF NOT EXISTS library_articles (
      id uuid PRIMARY KEY,
      slug text UNIQUE NOT NULL,
      title text NOT NULL,
      summary text NOT NULL,
      tags text[] NOT NULL DEFAULT ARRAY[]::text[],
      public_url text NULL,
      product_slug text NULL,
      created_at timestamptz NOT NULL,
      updated_at timestamptz NOT NULL
    );
  `;
}

function normalizeSlug(input: string) {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

function normalizeTags(tags: string[]) {
  return tags
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, 12);
}

export async function listLibraryArticles(): Promise<LibraryArticle[]> {
  if (hasDatabase()) {
    const sql = await getSql();
    if (sql) {
      await ensureTables();
      const rows = await sql`
        SELECT id,
               slug,
               title,
               summary,
               tags,
               public_url AS "publicUrl",
               product_slug AS "productSlug",
               created_at AS "createdAt",
               updated_at AS "updatedAt"
        FROM library_articles
        ORDER BY created_at DESC
      `;
      return rows.rows as LibraryArticle[];
    }
  }

  const store = await readJson<LibraryStore>(STORAGE_FILE, EMPTY_STORE);
  return store.articles;
}

export async function createLibraryArticle(input: {
  slug?: string;
  title: string;
  summary: string;
  tags?: string[];
  publicUrl?: string | null;
  productSlug?: string | null;
}): Promise<LibraryArticle> {
  const now = new Date().toISOString();
  const title = input.title.trim();
  if (!title) throw new Error('Title is required');

  const summary = input.summary.trim();
  if (!summary) throw new Error('Summary is required');

  const slug = normalizeSlug(input.slug?.trim() || title);
  if (!slug) throw new Error('Slug is required');

  const record: LibraryArticle = {
    id: crypto.randomUUID(),
    slug,
    title,
    summary,
    tags: normalizeTags(input.tags ?? []),
    publicUrl: input.publicUrl?.trim() || null,
    productSlug: input.productSlug?.trim() || null,
    createdAt: now,
    updatedAt: now,
  };

  if (hasDatabase()) {
    const sql = await getSql();
    if (sql) {
      await ensureTables();
      const inserted = await sql`
        INSERT INTO library_articles
          (id, slug, title, summary, tags, public_url, product_slug, created_at, updated_at)
        VALUES
          (${record.id}, ${record.slug}, ${record.title}, ${record.summary}, string_to_array(${record.tags.join(',')}, ',')::text[], ${record.publicUrl}, ${record.productSlug}, ${record.createdAt}, ${record.updatedAt})
        RETURNING id,
                  slug,
                  title,
                  summary,
                  tags,
                  public_url AS "publicUrl",
                  product_slug AS "productSlug",
                  created_at AS "createdAt",
                  updated_at AS "updatedAt"
      `;
      return inserted.rows[0] as LibraryArticle;
    }
  }

  const store = await readJson<LibraryStore>(STORAGE_FILE, EMPTY_STORE);
  if (store.articles.some((a) => a.slug === record.slug)) {
    throw new Error('Slug already exists');
  }
  store.articles.unshift(record);
  await writeJson(STORAGE_FILE, store);
  return record;
}

export async function deleteLibraryArticle(id: string): Promise<boolean> {
  if (!id) return false;

  if (hasDatabase()) {
    const sql = await getSql();
    if (sql) {
      await ensureTables();
      const result = await sql`DELETE FROM library_articles WHERE id = ${id} RETURNING id`;
      return result.rows.length > 0;
    }
  }

  const store = await readJson<LibraryStore>(STORAGE_FILE, EMPTY_STORE);
  const before = store.articles.length;
  store.articles = store.articles.filter((a) => a.id !== id);
  await writeJson(STORAGE_FILE, store);
  return store.articles.length !== before;
}
