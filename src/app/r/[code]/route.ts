import { NextRequest, NextResponse } from 'next/server';
import { getAffiliateByCode, recordAffiliateClick } from '@/lib/affiliates';
import { AFFILIATE_COOKIE_MAX_AGE, AFFILIATE_COOKIE_NAME } from '@/lib/affiliate-cookies';

export async function GET(req: NextRequest, context: { params: { code: string } }) {
  const code = context?.params?.code;
  const origin = req.nextUrl.origin;

  if (!code) {
    return NextResponse.redirect(origin);
  }

  const affiliate = await getAffiliateByCode(code);

  if (affiliate) {
    const landingPath = '/';
    await recordAffiliateClick({
      affiliateId: affiliate.id,
      code: affiliate.code || code,
      landingPath,
      referrer: req.headers.get('referer') ?? null,
      userAgent: req.headers.get('user-agent') ?? null,
    }).catch((error) => {
      console.error('Affiliate click record failed', error);
    });

    const response = NextResponse.redirect(`${origin}/?ref=${affiliate.code}`);
    response.cookies.set({
      name: AFFILIATE_COOKIE_NAME,
      value: affiliate.code || code,
      maxAge: AFFILIATE_COOKIE_MAX_AGE,
      path: '/',
      httpOnly: false,
      sameSite: 'lax',
    });
    return response;
  }

  return NextResponse.redirect(origin);
}
