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

    console.log('[Affiliate Apply] Received submission:', { name, email });

    if (!name) {
      console.log('[Affiliate Apply] Missing name');
      return NextResponse.json({ error: 'Name is required.' }, { status: 400 });
    }

    if (!email || !isEmail(email)) {
      console.log('[Affiliate Apply] Invalid email:', email);
      return NextResponse.json({ error: 'Valid email is required.' }, { status: 400 });
    }

    console.log('[Affiliate Apply] Creating application...');
    const application = await createAffiliateApplication({
      name,
      email,
      socialHandle: body?.socialHandle,
      audienceSize: body?.audienceSize,
      channels: body?.channels,
      notes: body?.notes,
    });

    console.log('[Affiliate Apply] Application created:', application.id);

    notifyAffiliateAdmin(application).catch((error) => {
      console.error('Affiliate admin notification failed', error);
    });

    return NextResponse.json({ id: application.id }, { status: 201 });
  } catch (error) {
    console.error('[Affiliate Apply] Error:', error);
    return NextResponse.json({ error: 'Unable to submit application.' }, { status: 500 });
  }
}
