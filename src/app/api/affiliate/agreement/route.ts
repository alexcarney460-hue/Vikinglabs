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
  title: 'Viking Labs Partner Commission Scale & Agreement',
  version: '1.0',
  effectiveDate: '2026-02-16',
  sections: [
    {
      id: 'program-overview',
      title: 'Program Overview',
      content: 'The Viking Labs Partner Program rewards approved affiliates, influencers, and referral partners based on verified referred sales. This commission structure is designed to provide scalable earning opportunities for partners, maintain long-term program stability, ensure fair and transparent attribution, and protect against fraud, abuse, and misuse.',
      details: 'Net Referred Revenue is defined as successfully captured payments minus refunds, chargebacks, reversals, and invalid transactions.',
    },
    {
      id: 'commission-tiers',
      title: 'Commission Tiers',
      content: 'Partner commission rates are determined by rolling 30-day referred revenue performance.',
      subsections: [
        {
          title: 'Tier 1 — Starter Partner',
          details: {
            monthlyRevenue: '$10,000 – $24,999',
            commissionRate: '10%',
            benefits: [
              'Unique affiliate tracking link',
              'Unique partner discount code',
              'Standard customer discount eligibility',
              'Standard monthly payout cycle',
            ],
          },
        },
        {
          title: 'Tier 2 — Growth Partner',
          details: {
            monthlyRevenue: '$25,000 – $74,999',
            commissionRate: '14%',
            benefits: [
              'Increased commission rate',
              'Eligibility for promotional incentives',
              'Standard monthly payout cycle',
            ],
          },
        },
        {
          title: 'Tier 3 — Scale Partner',
          details: {
            monthlyRevenue: '$75,000 – $149,999',
            commissionRate: '18%',
            benefits: [
              'Enhanced earnings structure',
              'Discount flexibility up to approved limits',
              'Eligibility for bonus campaigns',
              'Standard monthly payout cycle',
            ],
          },
        },
        {
          title: 'Tier 4 — Elite Partner',
          details: {
            monthlyRevenue: '$150,000 – $249,999',
            commissionRate: '21%',
            benefits: [
              'Priority support consideration',
              'Custom landing page eligibility',
              'Quarterly bonus eligibility',
              'Inventory priority consideration',
              'NET-7 PAYOUT ELIGIBILITY (subject to approval)',
            ],
          },
        },
        {
          title: 'Tier 5 — Apex Partner',
          details: {
            monthlyRevenue: '$250,000+',
            commissionRate: '23%',
            benefits: [
              'Maximum commission tier',
              'Custom promotional opportunities',
              'Exclusive campaign eligibility',
              'Highest payout priority',
              'NET-7 PAYOUT ELIGIBILITY (subject to approval)',
            ],
          },
        },
      ],
    },
    {
      id: 'revenue-attribution',
      title: 'Revenue Attribution',
      content: 'Commissions are credited exclusively on qualifying purchases made through approved affiliate tracking links or approved partner discount codes. Viking Labs reserves the right to apply last-touch or blended attribution models where necessary. All attribution determinations are final.',
    },
    {
      id: 'commission-calculation',
      title: 'Commission Calculation',
      content: 'Commissions are based on verified Net Referred Revenue only.',
      details: {
        excluded: [
          'Refunded transactions',
          'Chargebacks',
          'Fraudulent or suspicious transactions',
          'Reversed payments',
          'Self-referred purchases',
          'Invalid or manipulated orders',
        ],
        note: 'Viking Labs reserves the right to adjust commissions retroactively.',
      },
    },
    {
      id: 'payout-terms',
      title: 'Payout Terms',
      content: 'Standard payout cycle is monthly. Accelerated payout eligibility is available for Tier 4 and Tier 5 partners with NET-7 payouts upon approval.',
      details: {
        requirements: [
          'Account standing review',
          'Traffic quality validation',
          'Fraud-risk assessment',
        ],
        note: 'Commissions are not considered earned until transactions are successfully verified and cleared.',
      },
    },
    {
      id: 'discount-code-policy',
      title: 'Discount Code Policy',
      content: 'Default customer discount eligibility varies by tier. Tier 1-2 receive standard discount levels, while Tier 3+ have expanded discount eligibility (approval required).',
      details: 'Unauthorized discounting or code misuse is prohibited. Improper discount practices may result in commission reversals or termination from the program.',
    },
    {
      id: 'partner-agreement-terms',
      title: 'Partner Agreement & Terms',
      content: 'Participation in the Viking Labs Partner Program constitutes acceptance of comprehensive terms and conditions.',
      subsections: [
        {
          title: 'Compliance & Representation',
          details: [
            'Provide truthful, non-misleading promotional content',
            'Avoid medical or therapeutic claims',
            'Comply with applicable advertising regulations',
            'Follow platform-specific policies',
            'Represent Viking Labs professionally',
          ],
        },
        {
          title: 'Prohibited Activities',
          details: [
            'Self-referrals or indirect self-purchases',
            'Misleading or deceptive promotions',
            'Unauthorized advertising methods',
            'Fraudulent transactions',
            'Artificial traffic generation',
            'Misrepresentation of products or policies',
          ],
        },
        {
          title: 'Abuse Prevention & Program Integrity',
          details: {
            selfReferrals: 'Commissions will not be paid on purchases made by the partner, associated persons, employees, controlled accounts, or any party acting on behalf of the partner.',
            discountAbuse: 'Prohibited behaviors include publishing codes on coupon sites, misrepresenting codes as public offers, unauthorized discount stacking, and artificial conversion manipulation.',
            paidAdvertising: 'Partners may not run paid advertisements using Viking Labs brand names, trademarked product names, or brand variations without approval.',
            fraudulentTransactions: 'Commissions are void for transactions involving stolen payment methods, refund manipulation, fake orders, artificial traffic, or any abusive activity.',
            trafficQuality: 'Partners must not generate traffic via bots, spam, forced clicks, or incentivized purchases without approval.',
            orderValidation: 'All commissions remain pending until validated. Viking Labs may adjust or revoke commissions due to refunds, chargebacks, payment reversals, fraud detection, or policy violations.',
          },
        },
        {
          title: 'Commission Integrity',
          details: 'Viking Labs reserves the right to reverse commissions resulting from invalid transactions, fraud indicators, abuse patterns, or policy violations. All commission decisions are final.',
        },
        {
          title: 'Payment & Liability Limitations',
          details: [
            'Earnings are performance-based and not guaranteed',
            'Viking Labs is not liable for indirect losses',
            'Commission eligibility requires full compliance',
          ],
        },
        {
          title: 'Suspension & Termination Rights',
          details: 'Viking Labs may suspend or terminate participation at any time for fraud or abuse risk, policy violations, brand protection concerns, or unacceptable promotional practices. Unpaid commissions may be forfeited at Viking Labs discretion.',
        },
        {
          title: 'Program Modifications',
          details: 'Viking Labs reserves the right to modify commission rates, tier thresholds, program rules, and partner benefits. Continued participation constitutes acceptance of updates.',
        },
      ],
    },
    {
      id: 'enforcement-authority',
      title: 'Enforcement & Authority',
      content: 'Viking Labs maintains sole authority over attribution decisions, commission calculations, fraud determinations, policy enforcement, and program interpretation.',
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
