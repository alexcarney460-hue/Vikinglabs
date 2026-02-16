import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authjs/options';
import { getAffiliateByEmail } from '@/lib/affiliates';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getServerSession(authOptions);
  const userEmail = session?.user?.email as string | undefined;

  if (!session?.user || !userEmail) {
    return NextResponse.json(
      { ok: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    // Check if user is an approved affiliate
    const affiliate = await getAffiliateByEmail(userEmail);
    if (!affiliate) {
      return NextResponse.json(
        { ok: false, error: 'Not an approved affiliate' },
        { status: 403 }
      );
    }

    // Load toolkit manifest
    const manifest = await import('@/public/affiliate-toolkit/manifest.json')
      .then((m) => m.default)
      .catch(() => null);

    if (!manifest) {
      return NextResponse.json(
        { ok: false, error: 'Toolkit not found' },
        { status: 404 }
      );
    }

    // Inject affiliate code into templates
    const enrichedTemplates = manifest.templates.map((t: any) => ({
      ...t,
      content: t.content.replace(/\[YOUR_CODE\]/g, affiliate.code || '[CODE]'),
      contentWithLink: t.content
        .replace(/\[YOUR_CODE\]/g, affiliate.code || '[CODE]')
        .replace(/\[YOUR_AFFILIATE_LINK\]/g, `${process.env.NEXT_PUBLIC_SITE_URL || 'https://vikinglabs.co'}?ref=${affiliate.code || 'code'}`),
    }));

    return NextResponse.json({
      ok: true,
      toolkit: {
        ...manifest,
        templates: enrichedTemplates,
        affiliateCode: affiliate.code,
      },
    });
  } catch (error) {
    console.error('[affiliate/toolkit] Error:', error);
    return NextResponse.json(
      { ok: false, error: 'Failed to fetch toolkit' },
      { status: 500 }
    );
  }
}
