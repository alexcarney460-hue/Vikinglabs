import { NextResponse } from 'next/server';
import { createAffiliateApplication, notifyAffiliateAdmin } from '@/lib/affiliates';

function isEmail(value: string) {
  return /.+@.+\..+/.test(value);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const name = (body?.name || '').trim();
    const email = (body?.email || '').trim();

    if (!name) {
      return NextResponse.json({ error: 'Name is required.' }, { status: 400 });
    }

    if (!email || !isEmail(email)) {
      return NextResponse.json({ error: 'Valid email is required.' }, { status: 400 });
    }

    const application = await createAffiliateApplication({
      name,
      email,
      socialHandle: body?.socialHandle,
      audienceSize: body?.audienceSize,
      channels: body?.channels,
      notes: body?.notes,
    });

    notifyAffiliateAdmin(application).catch((error) => {
      console.error('Affiliate admin notification failed', error);
    });

    return NextResponse.json({ id: application.id }, { status: 201 });
  } catch (error) {
    console.error('Affiliate apply error', error);
    return NextResponse.json({ error: 'Unable to submit application.' }, { status: 500 });
  }
}
