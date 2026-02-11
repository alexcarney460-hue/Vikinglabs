import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export function GET() {
  try {
    const dir = path.join(process.cwd(), 'public', 'products');
    const files = fs.readdirSync(dir).filter(f => f.match(/\.(png|webp|jpg|jpeg)$/i));
    return NextResponse.json({ ok: true, files });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
