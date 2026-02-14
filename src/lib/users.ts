import crypto from 'crypto';
import { readJson, writeJson } from './storage';
import type { UserRole } from './auth';

export type StoredUser = {
  id: string;
  email: string;
  name?: string;
  role: UserRole;
  passwordHash: string; // scrypt
  passwordSalt: string;
  createdAt: number;
};

type UsersFile = {
  users: StoredUser[];
};

const FILENAME = 'users.json';

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export async function ensureBootstrapAdmin() {
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminEmail || !adminPassword) return;

  const data = await readJson<UsersFile>(FILENAME, { users: [] });
  const existing = data.users.find(u => u.email === adminEmail);
  if (existing) return;

  const { hash, salt } = await hashPassword(adminPassword);
  data.users.push({
    id: crypto.randomUUID(),
    email: adminEmail,
    name: 'Admin',
    role: 'admin',
    passwordHash: hash,
    passwordSalt: salt,
    createdAt: Date.now(),
  });
  await writeJson(FILENAME, data);
}

export async function listUsers(): Promise<StoredUser[]> {
  const data = await readJson<UsersFile>(FILENAME, { users: [] });
  return data.users;
}

export async function findUserByEmail(email: string): Promise<StoredUser | undefined> {
  const e = normalizeEmail(email);
  const users = await listUsers();
  return users.find(u => u.email === e);
}

export async function createUser(params: { email: string; password: string; name?: string; role?: UserRole; }): Promise<StoredUser> {
  const email = normalizeEmail(params.email);
  const existing = await findUserByEmail(email);
  if (existing) throw new Error('Email already registered');

  const { hash, salt } = await hashPassword(params.password);
  const user: StoredUser = {
    id: crypto.randomUUID(),
    email,
    name: params.name?.trim() || undefined,
    role: params.role ?? 'user',
    passwordHash: hash,
    passwordSalt: salt,
    createdAt: Date.now(),
  };

  const data = await readJson<UsersFile>(FILENAME, { users: [] });
  data.users.push(user);
  await writeJson(FILENAME, data);
  return user;
}

export async function verifyPassword(user: StoredUser, password: string): Promise<boolean> {
  const hash = await scrypt(password, user.passwordSalt);
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(user.passwordHash, 'hex'));
}

async function scrypt(password: string, salt: string): Promise<string> {
  return await new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, 64, { N: 16384, r: 8, p: 1 }, (err, derivedKey) => {
      if (err) reject(err);
      else resolve(derivedKey.toString('hex'));
    });
  });
}

export async function hashPassword(password: string): Promise<{ hash: string; salt: string }> {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = await scrypt(password, salt);
  return { hash, salt };
}
