import type { Adapter, AdapterAccount, AdapterSession, AdapterUser, VerificationToken } from 'next-auth/adapters';
import crypto from 'crypto';
import { readJson, writeJson } from '@/lib/storage';

type Db = {
  users: Array<AdapterUser & { role?: 'user' | 'admin' }>; // extend user
  accounts: AdapterAccount[];
  sessions: AdapterSession[];
  verificationTokens: VerificationToken[];
};

const FILENAME = 'authjs-db.json';

async function readDb(): Promise<Db> {
  return await readJson<Db>(FILENAME, { users: [], accounts: [], sessions: [], verificationTokens: [] });
}

async function writeDb(db: Db) {
  await writeJson(FILENAME, db);
}

function nowPlus(days: number) {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

export function jsonFileAdapter(): Adapter {
  return {
    async createUser(user: AdapterUser) {
      const db = await readDb();
      const newUser: AdapterUser & { role?: 'user' | 'admin' } = {
        id: crypto.randomUUID(),
        email: user.email,
        emailVerified: user.emailVerified ?? null,
        name: user.name ?? null,
        image: user.image ?? null,
        role: (user as any).role ?? 'user',
      };
      db.users.push(newUser);
      await writeDb(db);
      return newUser;
    },

    async getUser(id) {
      const db = await readDb();
      return db.users.find(u => u.id === id) ?? null;
    },

    async getUserByEmail(email) {
      const db = await readDb();
      return db.users.find(u => u.email?.toLowerCase() === email.toLowerCase()) ?? null;
    },

    async getUserByAccount({ provider, providerAccountId }) {
      const db = await readDb();
      const acc = db.accounts.find(a => a.provider === provider && a.providerAccountId === providerAccountId);
      if (!acc) return null;
      return db.users.find(u => u.id === acc.userId) ?? null;
    },

    async updateUser(user) {
      const db = await readDb();
      const idx = db.users.findIndex(u => u.id === user.id);
      if (idx === -1) throw new Error('User not found');
      db.users[idx] = { ...db.users[idx], ...user };
      await writeDb(db);
      return db.users[idx];
    },

    async deleteUser(userId) {
      const db = await readDb();
      db.users = db.users.filter(u => u.id !== userId);
      db.accounts = db.accounts.filter(a => a.userId !== userId);
      db.sessions = db.sessions.filter(s => s.userId !== userId);
      await writeDb(db);
    },

    async linkAccount(account: AdapterAccount) {
      const db = await readDb();
      db.accounts.push(account);
      await writeDb(db);
      return account;
    },

    async unlinkAccount(params: { provider: string; providerAccountId: string; }) {
      const { provider, providerAccountId } = params;
      const db = await readDb();
      db.accounts = db.accounts.filter(a => !(a.provider === provider && a.providerAccountId === providerAccountId));
      await writeDb(db);
    },

    async createSession(session) {
      const db = await readDb();
      db.sessions.push(session);
      await writeDb(db);
      return session;
    },

    async getSessionAndUser(sessionToken) {
      const db = await readDb();
      const session = db.sessions.find(s => s.sessionToken === sessionToken);
      if (!session) return null;
      const user = db.users.find(u => u.id === session.userId);
      if (!user) return null;
      return { session, user };
    },

    async updateSession(session) {
      const db = await readDb();
      const idx = db.sessions.findIndex(s => s.sessionToken === session.sessionToken);
      if (idx === -1) return null;
      db.sessions[idx] = { ...db.sessions[idx], ...session };
      await writeDb(db);
      return db.sessions[idx];
    },

    async deleteSession(sessionToken) {
      const db = await readDb();
      db.sessions = db.sessions.filter(s => s.sessionToken !== sessionToken);
      await writeDb(db);
    },

    async createVerificationToken(token) {
      const db = await readDb();
      // keep tokens small; expire in 1 day by default
      const t: VerificationToken = {
        identifier: token.identifier,
        token: token.token,
        expires: token.expires ?? nowPlus(1),
      };
      db.verificationTokens.push(t);
      await writeDb(db);
      return t;
    },

    async useVerificationToken(params) {
      const db = await readDb();
      const idx = db.verificationTokens.findIndex(
        t => t.identifier === params.identifier && t.token === params.token
      );
      if (idx === -1) return null;
      const [used] = db.verificationTokens.splice(idx, 1);
      await writeDb(db);
      return used;
    },
  };
}
