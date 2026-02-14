import { promises as fs } from 'fs';
import path from 'path';

// Simple JSON-file storage for MVP.
// In production, replace with Postgres/KV.

// NOTE: Vercel serverless filesystem is read-only except for /tmp.
// Use /tmp for any ephemeral JSON-file storage to avoid ENOENT on mkdir.
const DATA_DIR = process.env.VERCEL ? path.join('/tmp', 'vikinglabs-data') : path.join(process.cwd(), 'src', 'lib', 'data');

async function ensureDir() {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

export async function readJson<T>(filename: string, fallback: T): Promise<T> {
  await ensureDir();
  const filePath = path.join(DATA_DIR, filename);
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    return JSON.parse(raw) as T;
  } catch (err: any) {
    if (err?.code === 'ENOENT') return fallback;
    throw err;
  }
}

export async function writeJson<T>(filename: string, data: T): Promise<void> {
  await ensureDir();
  const filePath = path.join(DATA_DIR, filename);
  const tmpPath = filePath + '.tmp';
  await fs.writeFile(tmpPath, JSON.stringify(data, null, 2), 'utf8');
  await fs.rename(tmpPath, filePath);
}
