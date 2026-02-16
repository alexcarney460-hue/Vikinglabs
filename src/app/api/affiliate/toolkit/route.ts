import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authjs/options';
import { getAffiliateByEmail } from '@/lib/affiliates';

export const dynamic = 'force-dynamic';

// Inline toolkit manifest to avoid file I/O during build
const TOOLKIT_MANIFEST = {
  version: '1.0',
  brandAssets: [
    {
      id: 'logo-primary',
      name: 'Viking Labs Logo (Primary)',
      description: 'Full-color Viking Labs logo',
      filename: 'logo-primary.png',
      type: 'image/png',
    },
    {
      id: 'logo-white',
      name: 'Viking Labs Logo (White)',
      description: 'White logo for dark backgrounds',
      filename: 'logo-white.png',
      type: 'image/png',
    },
    {
      id: 'logo-mark',
      name: 'Viking Labs Mark',
      description: 'Shield mark only (icon)',
      filename: 'logo-mark.png',
      type: 'image/png',
    },
  ],
  colorPalette: {
    primary: '#f59e0b',
    dark: '#1e293b',
    light: '#f1f5f9',
    accent: '#fbbf24',
  },
  templates: [
    {
      id: 'instagram-caption',
      name: 'Instagram Caption',
      category: 'social',
      content:
        '🧪 Peptide research just got serious.\n\nVikingLabs.co is the lab-grade resource for premium peptide compounds. Discreet shipping. Verified quality. Zero hype.\n\nGet 10% off your first order with code: [YOUR_CODE]\n\nLink in bio 🔗',
    },
    {
      id: 'facebook-post',
      name: 'Facebook Post',
      category: 'social',
      content:
        'Looking for reliable peptide research compounds?\n\nViking Labs delivers premium, lab-tested products with transparent sourcing. Fast, discreet shipping and a team that actually cares.\n\nTrust the lab-grade standard: vikinglabs.co\n\nAffiliate? Get your custom code and earn 10% on every sale.',
    },
    {
      id: 'short-bio',
      name: 'Short Bio',
      category: 'bio',
      content:
        'I recommend Viking Labs for premium peptide research compounds. Lab-grade quality, transparent sourcing, and trusted shipping. Use my code for 10% off.',
    },
    {
      id: 'email-intro',
      name: 'Email Intro Template',
      category: 'email',
      content:
        'Subject: Premium Peptide Research Compounds\n\nHey [Name],\n\nI\'ve been using Viking Labs for research compounds, and they\'re legit. Lab-tested, transparent, fast shipping.\n\nThey\'re running an affiliate program if you want to earn on sales. Here\'s my link if you want to check them out:\n\n[YOUR_AFFILIATE_LINK]\n\nUse code [YOUR_CODE] for 10% off.\n\nTalk soon,\n[Your Name]',
    },
  ],
  guidelines: {
    do: [
      'Link to vikinglabs.co with your affiliate code',
      'Mention lab-grade quality and testing',
      'Highlight fast, discreet shipping',
      'Use authentic testimonials from your audience',
      'Provide your unique discount code',
    ],
    dont: [
      'Make medical claims or suggest health benefits',
      'Imply peptides treat, cure, or prevent disease',
      'Target minors or restricted audiences',
      'Spam or use aggressive tactics',
      'Mislead about product source or quality',
    ],
    bannedWords: [
      'cure',
      'treat',
      'prevent',
      'medical',
      'therapeutic',
      'prescription',
      'FDA approved',
      'miracle',
      'breakthrough',
    ],
  },
};

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

    const manifest = TOOLKIT_MANIFEST;

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
