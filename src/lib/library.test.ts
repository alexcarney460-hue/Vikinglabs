import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { promises as fs } from 'node:fs';

import { createLibraryArticle, deleteLibraryArticle, listLibraryArticles } from './library';

const DATA_DIR = path.join(process.cwd(), 'src', 'lib', 'data');
const FILE = path.join(DATA_DIR, 'library-articles.json');

async function cleanup() {
  try {
    await fs.unlink(FILE);
  } catch {
    // ignore
  }
}

test('library CRUD (file fallback)', async () => {
  const prevDb = process.env.DATABASE_URL;
  delete process.env.DATABASE_URL;
  await cleanup();

  const created = await createLibraryArticle({
    title: 'Test Article',
    summary: 'Hello world',
    tags: ['A', 'B'],
    publicUrl: '/research/test.pdf',
  });

  assert.equal(created.title, 'Test Article');
  assert.equal(created.slug, 'test-article');

  const listed1 = await listLibraryArticles();
  assert.equal(listed1.length, 1);

  const ok = await deleteLibraryArticle(created.id);
  assert.equal(ok, true);

  const listed2 = await listLibraryArticles();
  assert.equal(listed2.length, 0);

  await cleanup();
  if (prevDb) process.env.DATABASE_URL = prevDb;
});
