import { NextResponse, NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authjs/options';
import {
  getAffiliateByEmail,
  getAffiliateReferredRevenue,
  calculateAffiliateTier,
  getTierCommissionRate,
} from '@/lib/affiliates';
import { hasUserEmail } from '@/lib/session-guards';

export const dynamic = 'force-dynamic';

const PARTNERSHIP_AGREEMENT = {
  title: 'Viking Labs Affiliate Partnership Agreement',
  version: '1.0',
  effectiveDate: '2025-02-16',
  sections: [
    {
      id: 'tier-structure',
      title: 'Commission Tier Structure',
      content: 'Our affiliate program is structured with performance-based tiers that reward your success. Your commission rate is determined by your 30-day referred revenue.',
      subsections: [
        {
          title: 'Tier 1 - Entry Level',
          details: {
            commissionRate: '10%',
            threshold: '$0 - $499',
            description: 'Initial tier for all approved affiliates',
          },
        },
        {
          title: 'Tier 2 - Growth',
          details: {
            commissionRate: '14%',
            threshold: '$500 - $1,999',
            description: 'Achieved after 30 days of consistent performance',
          },
        },
        {
          title: 'Tier 3 - Professional',
          details: {
            commissionRate: '18%',
            threshold: '$2,000 - $4,999',
            description: 'Recognized for sustained professional partnership',
          },
        },
        {
          title: 'Tier 4 - Elite',
          details: {
            commissionRate: '21%',
            threshold: '$5,000 - $9,999',
            description: 'Top-tier partnership benefits',
          },
        },
        {
          title: 'Tier 5 - Platinum',
          details: {
            commissionRate: '23%',
            threshold: '$10,000+',
            description: 'Maximum tier reserved for exceptional partners',
          },
        },
      ],
    },
    {
      id: 'revenue-attribution',
      title: 'Revenue Attribution Rules',
      content: 'Revenue is attributed to affiliates through our tracking system which uses affiliate codes and referral links.',
      subsections: [
        {
          title: 'Attribution Window',
          details: {
            period: '30 days',
            description: 'Customers have 30 days from their first click to make a purchase and receive attribution to your affiliate account.',
          },
        },
        {
          title: 'Valid Transactions',
          details: {
            criteria: [
              'Customer must originate from your unique affiliate link or code',
              'Purchase must be completed through the referral',
              'Customer must not be an existing customer within 90 days prior',
              'Transaction must clear payment processing (no chargebacks or refunds)',
            ],
          },
        },
        {
          title: 'Excluded Transactions',
          details: {
            criteria: [
              'Refunded orders (commissions are reversed)',
              'Fraudulent or suspicious transactions',
              'Orders from customers using prohibited marketing methods',
              'Direct orders placed without affiliate tracking',
            ],
          },
        },
      ],
    },
    {
      id: 'payout-timing',
      title: 'Payout Timing & Methods',
      content: 'We process affiliate commissions reliably and transparently.',
      subsections: [
        {
          title: 'Standard Payout',
          details: {
            frequency: 'Monthly',
            timing: 'Processed by the 15th of the following month',
            minimumThreshold: '$25',
            description: 'Earnings below $25 carry forward to the next month.',
          },
        },
        {
          title: 'Net-7 Option',
          details: {
            frequency: 'Every 7 days',
            timing: 'Processed weekly, 7 days after the week closes',
            minimumThreshold: '$100',
            description: 'Available for high-performing affiliates with minimum weekly earnings of $100.',
          },
        },
        {
          title: 'Payment Methods',
          details: {
            methods: [
              'Bank Transfer (ACH/Wire)',
              'Cryptocurrency (Bitcoin, Ethereum)',
              'PayPal',
              'Stripe Connect',
            ],
            description: 'Choose your preferred payment method during payout configuration.',
          },
        },
      ],
    },
    {
      id: 'discount-code-guidelines',
      title: 'Discount Code & Promotional Guidelines',
      content: 'When sharing discount codes or special promotions with your audience, follow these guidelines.',
      subsections: [
        {
          title: 'Code Usage',
          details: {
            rules: [
              'You may create discount codes for your specific audience segments',
              'Codes must be transparently disclosed as "affiliate offers" or "partner promotions"',
              'Do not misrepresent the source or nature of discounts',
              'Maximum discount depth is 20% unless specifically approved',
            ],
          },
        },
        {
          title: 'Prohibited Practices',
          details: {
            prohibited: [
              'Stacking multiple affiliate discounts without full disclosure',
              'Creating fake reviews or testimonials to drive code usage',
              'Misleading claims about product benefits or efficacy',
              'Using discount codes to game tier calculations',
            ],
          },
        },
      ],
    },
    {
      id: 'partner-standards',
      title: 'Partner Standards & Brand Alignment',
      content: 'We partner with affiliates who share our commitment to integrity, scientific accuracy, and respect for our communities.',
      subsections: [
        {
          title: 'Content Standards',
          details: {
            requirements: [
              'Content must be factually accurate and scientifically supported',
              'Claims about peptide research and benefits must be properly contextualized',
              'Avoid making medical claims or recommending products for human consumption',
              'Maintain professional, laboratory-grade aesthetic consistent with Viking Labs branding',
              'Respect the research community and maintain ethical standards',
            ],
          },
        },
        {
          title: 'Audience Integrity',
          details: {
            requirements: [
              'Promote only to engaged, relevant audiences',
              'Avoid mass distribution or spam tactics',
              'Maintain authenticity in your platform and recommendations',
              'Build community, not just sales volume',
            ],
          },
        },
        {
          title: 'Transparency',
          details: {
            requirements: [
              'Always disclose your affiliate relationship with Viking Labs',
              'Use FTC-compliant disclosure statements (#ad, #affiliate, etc.)',
              'Provide honest opinions - negative feedback is valued when constructive',
              'Clearly separate personal opinions from factual product information',
            ],
          },
        },
      ],
    },
    {
      id: 'prohibited-activities',
      title: 'Prohibited Activities',
      content: 'To maintain program integrity, the following activities are strictly prohibited.',
      subsections: [
        {
          title: 'Marketing Violations',
          details: {
            prohibited: [
              'Bidding on Viking Labs brand name or trademarked terms in paid search',
              'Purchasing competitor brand terms to redirect to Viking Labs',
              'Misleading advertising or false claims about our products',
              'Email spam, unsolicited mass messaging, or harassment',
              'Forum manipulation, astroturfing, or fake reviews',
            ],
          },
        },
        {
          title: 'Fraud & Deception',
          details: {
            prohibited: [
              'Creating fake customer accounts to generate false conversions',
              'Manipulating tracking cookies or referral links',
              'Generating traffic through malware, browser hijacking, or forced redirects',
              'Misrepresenting product origins or safety',
            ],
          },
        },
        {
          title: 'Regulatory Violations',
          details: {
            prohibited: [
              'Promoting for human consumption in jurisdictions where prohibited',
              'Violating FDA, DEA, or local regulatory requirements',
              'Marketing to minors or restricted audiences',
              'Non-compliance with FTC disclosure requirements',
            ],
          },
        },
        {
          title: 'Consequences',
          details: {
            description:
              'Violations result in account suspension, forfeiture of pending commissions, and potential legal action. Repeat violations lead to permanent ban from the program.',
          },
        },
      ],
    },
    {
      id: 'commission-validation',
      title: 'Commission Validation & Dispute Process',
      content: 'We validate all commissions for accuracy and integrity.',
      subsections: [
        {
          title: 'Automatic Validation',
          details: {
            process: [
              'All transactions are checked against fraud detection systems',
              'Payment processor confirmation is required before commission posting',
              'Duplicate transactions are identified and deduplicated',
              'Suspicious patterns trigger manual review',
            ],
          },
        },
        {
          title: 'Dispute Resolution',
          details: {
            process: [
              '1. Contact support with specific transaction details (Order ID, Date, Amount)',
              '2. We conduct a 5-7 day investigation',
              '3. Provide findings and evidence to you within 10 business days',
              '4. If still unresolved, escalate to leadership team for final decision',
            ],
            timeline: '30 days from purchase date to file disputes (after that, corrections are not guaranteed)',
          },
        },
      ],
    },
    {
      id: 'program-policies',
      title: 'Program Policies & Conduct',
      content: 'Additional policies governing participation in the affiliate program.',
      subsections: [
        {
          title: 'Account Termination',
          details: {
            reasons: [
              'Violation of any terms in this agreement',
              'Inactivity for 90+ days without approval',
              'Engagement in prohibited marketing activities',
              'Legal or regulatory non-compliance',
            ],
          },
        },
        {
          title: 'Intellectual Property',
          details: {
            requirements: [
              'You may use Viking Labs logos and marketing materials as provided',
              'Modification of brand assets requires written approval',
              'You retain rights to your original content (reviews, guides, etc.)',
              'Viking Labs retains all rights to product intellectual property',
            ],
          },
        },
        {
          title: 'Data & Privacy',
          details: {
            requirements: [
              'Commission data is confidential - do not publicly disclose earnings',
              'Customer data shared via affiliate API must comply with privacy laws',
              'You are responsible for GDPR/CCPA compliance in your promotions',
              'Do not sell or share customer data obtained through affiliate links',
            ],
          },
        },
        {
          title: 'Modifications',
          details: {
            details: 'Viking Labs reserves the right to modify commission rates, tiers, and program terms with 30 days notice. Affiliates will be notified via email of material changes.',
          },
        },
      ],
    },
    {
      id: 'support-resources',
      title: 'Support & Resources',
      content: 'We provide resources to help you succeed.',
      subsections: [
        {
          title: 'Affiliate Dashboard',
          details: {
            features: [
              'Real-time sales and conversion tracking',
              'Commission and tier status',
              'Marketing materials and toolkit access',
              'Performance analytics and insights',
            ],
          },
        },
        {
          title: 'API Access',
          details: {
            features: [
              'Retrieve real-time affiliate stats and performance data',
              'Track conversions and sales programmatically',
              'Integrate affiliate dashboard into your own tools',
              'Access comprehensive documentation',
            ],
          },
        },
        {
          title: 'Marketing Toolkit',
          details: {
            includes: [
              'Product images and video assets',
              'Email templates and copy',
              'Social media graphics and templates',
              'Educational content about peptides',
              'Competitor research and positioning guides',
            ],
          },
        },
        {
          title: 'Contact & Support',
          details: {
            support: 'Email support@vikinglabs.co for partnership questions, disputes, or technical issues. We aim to respond within 24-48 hours.',
          },
        },
      ],
    },
  ],
};

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!hasUserEmail(session)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const email = session?.user?.email;
    if (!email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const affiliate = await getAffiliateByEmail(email);
    if (!affiliate) {
      return NextResponse.json({ error: 'Affiliate not found' }, { status: 404 });
    }

    // Only approved affiliates can view the agreement
    if (affiliate.status !== 'approved') {
      return NextResponse.json(
        { error: 'Only approved affiliates can view the partnership agreement' },
        { status: 403 }
      );
    }

    // Calculate current tier and commission rate
    const referredRevenue = await getAffiliateReferredRevenue(affiliate.id, 30);
    const currentTier = calculateAffiliateTier(referredRevenue);
    const commissionRate = getTierCommissionRate(currentTier);

    return NextResponse.json({
      agreement: PARTNERSHIP_AGREEMENT,
      affiliate: {
        id: affiliate.id,
        code: affiliate.code,
        currentTier,
        commissionRate,
        referredRevenue30Days: referredRevenue,
      },
    });
  } catch (error) {
    console.error('[GET /api/affiliate/agreement]', error);
    return NextResponse.json(
      { error: 'Failed to fetch partnership agreement' },
      { status: 500 }
    );
  }
}
