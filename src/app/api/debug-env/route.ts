import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    SUPABASE_URL: !!process.env.SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    SUPABASE_ANON_KEY: !!process.env.SUPABASE_ANON_KEY,
    NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    POSTGRES_URL: !!process.env.POSTGRES_URL,
    DATABASE_URL: !!process.env.DATABASE_URL,
    ADMIN_EMAIL: !!process.env.ADMIN_EMAIL,
    NEXTAUTH_SECRET: !!process.env.NEXTAUTH_SECRET,
    SMTP_HOST: !!process.env.SMTP_HOST,
    SMTP_USER: !!process.env.SMTP_USER,
    SMTP_PASS: !!process.env.SMTP_PASS,
    SMTP_PORT: !!process.env.SMTP_PORT,
    SMTP_SECURE: !!process.env.SMTP_SECURE,
    RESEND_API_KEY: !!process.env.RESEND_API_KEY,
  });
}
