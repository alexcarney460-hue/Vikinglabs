const PREFIXES = ['vikingladb', 'VIKINGLADB'];

function pickEnv(suffix: string) {
  for (const prefix of PREFIXES) {
    const key = `${prefix}_${suffix}`;
    const value = process.env[key];
    if (value) return value;
  }
  return undefined;
}

// Map prefixed Prisma/Vercel DB envs to standard names if missing.
export function ensureDatabaseEnv() {
  const dbUrl = process.env.DATABASE_URL || pickEnv('POSTGRES_URL') || pickEnv('DATABASE_URL');
  const postgresUrl = process.env.POSTGRES_URL || pickEnv('POSTGRES_URL');
  const prismaUrl = process.env.POSTGRES_PRISMA_URL || process.env.PRISMA_DATABASE_URL || pickEnv('PRISMA_DATABASE_URL') || pickEnv('POSTGRES_PRISMA_URL');

  if (!process.env.DATABASE_URL && dbUrl) process.env.DATABASE_URL = dbUrl;
  if (!process.env.POSTGRES_URL && postgresUrl) process.env.POSTGRES_URL = postgresUrl;
  if (!process.env.POSTGRES_PRISMA_URL && prismaUrl) process.env.POSTGRES_PRISMA_URL = prismaUrl;
}
