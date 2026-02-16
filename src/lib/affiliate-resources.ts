/**
 * Viking Labs Affiliate Resource Kit Library
 * Comprehensive resources, templates, and guidelines for affiliates
 */

import {
  AffiliateResourceKit,
  UniqueTrackingLink,
  UniqueDiscountCode,
  ConversionAttribution,
  PerformanceAnalyticsDashboard,
  AffiliateSystemCapabilities,
  TrackingAccuracyGuidelines,
  CreativeAssetLibrary,
  BrandGuidelines,
  CustomAssetRequest,
  PlatformSecurityMeasures,
  PartnerSupport,
  TierEligibility,
} from '@/../types/affiliate-resources';
import { AffiliateApplication } from './affiliates';

/**
 * Build tracking links for an affiliate
 */
export function buildTrackingLinks(affiliate: AffiliateApplication): UniqueTrackingLink[] {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://vikinglabs.co';
  const code = affiliate.code || 'unknown';

  return [
    {
      id: `link-main-${affiliate.id}`,
      affiliateId: affiliate.id,
      code,
      baseUrl,
      fullUrl: `${baseUrl}?ref=${code}`,
      qrCode: `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(`${baseUrl}?ref=${code}`)}`,
      clicks: 0,
      conversions: 0,
      revenue: 0,
      createdAt: affiliate.createdAt,
      updatedAt: affiliate.updatedAt,
    },
    {
      id: `link-shop-${affiliate.id}`,
      affiliateId: affiliate.id,
      code,
      baseUrl: `${baseUrl}/catalog`,
      fullUrl: `${baseUrl}/catalog?ref=${code}`,
      clicks: 0,
      conversions: 0,
      revenue: 0,
      createdAt: affiliate.createdAt,
      updatedAt: affiliate.updatedAt,
    },
    {
      id: `link-research-${affiliate.id}`,
      affiliateId: affiliate.id,
      code,
      baseUrl: `${baseUrl}/research`,
      fullUrl: `${baseUrl}/research?ref=${code}`,
      clicks: 0,
      conversions: 0,
      revenue: 0,
      createdAt: affiliate.createdAt,
      updatedAt: affiliate.updatedAt,
    },
  ];
}

/**
 * Build discount codes for an affiliate
 */
export function buildDiscountCodes(affiliate: AffiliateApplication): UniqueDiscountCode[] {
  return [
    {
      id: `code-primary-${affiliate.id}`,
      affiliateId: affiliate.id,
      code: affiliate.code || 'VIKING10',
      discountPercentage: 10,
      maxUses: undefined,
      currentUses: 0,
      isActive: true,
      createdAt: affiliate.createdAt,
      updatedAt: affiliate.updatedAt,
    },
  ];
}

/**
 * Build conversion attribution system info
 */
export function buildConversionAttribution(affiliate: AffiliateApplication): ConversionAttribution {
  const code = affiliate.code || 'unknown';
  return {
    id: `attr-${affiliate.id}`,
    affiliateId: affiliate.id,
    method: 'both',
    conversionTrackingPixel: `https://vikinglabs.co/api/affiliate/pixel?aff=${code}`,
    apiEndpoint: `https://vikinglabs.co/api/affiliate/conversions`,
    webhookUrl: `https://your-domain.com/webhooks/affiliate-conversion`,
    testConversionUrl: `https://vikinglabs.co/api/affiliate/conversions?test=true&code=${code}`,
    documentation: `${process.env.NEXT_PUBLIC_SITE_URL}/affiliate-docs/conversion-tracking`,
  };
}

/**
 * Build performance analytics dashboard
 */
export function buildPerformanceAnalytics(affiliate: AffiliateApplication): PerformanceAnalyticsDashboard {
  return {
    totalClicks: 0,
    totalConversions: 0,
    conversionRate: 0,
    totalRevenue: 0,
    averageOrderValue: 0,
    commissionEarned: 0,
    commissionRate: affiliate.commissionRate || 0.1,
    topTrackingLink: undefined,
    topDiscountCode: undefined,
    recentConversions: [],
    dateRange: {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      end: new Date().toISOString(),
    },
  };
}

/**
 * Build system capabilities documentation
 */
export function buildSystemCapabilities(): AffiliateSystemCapabilities {
  return {
    referralTracking: {
      description:
        'Track all referrals from your unique links with precision. Our system attributes sales to the correct affiliate using last-click attribution with 30-day cookie window.',
      trackingDuration: '30 days',
      cookieDuration: 30 * 24 * 60 * 60 * 1000,
      supportedDevices: ['desktop', 'mobile', 'tablet'],
      crossDeviceTracking: false,
    },
    clickAttribution: {
      description:
        'Each click is automatically tracked and attributed. Our fraud detection system filters bot traffic and invalid clicks in real-time.',
      lastClickWins: true,
      multiTouchAttribution: false,
      attributionWindow: 30,
      conflictResolution:
        'Last-click attribution: final click before conversion receives credit',
    },
    codeBasedConversions: {
      description:
        'Discount codes provide an alternative tracking method. Customers using your code are automatically tracked and attributed to your account.',
      supportedCodeTypes: ['alphanumeric', 'personalized'],
      codeValidation: true,
      automatedCodeGeneration: true,
      customCodeGeneration: true,
    },
    commissionCalculations: {
      description:
        'Commissions are automatically calculated based on approved conversions. Standard rate is 10%, with opportunities for higher rates based on performance.',
      commissionStructure: 'Percentage-based: 10% baseline, up to 15% for top performers',
      tieredCommission: true,
      bonusOpportunities: [
        'Performance bonus: 5% extra for 100+ monthly sales',
        'Referral bonus: Recruit other affiliates and earn 5% of their commissions',
        'Seasonal bonus: Extra 2-3% during promotional periods',
      ],
      payoutFrequency: 'Monthly, on the 5th of each month',
    },
    revenueValidation: {
      description:
        'All orders are verified for legitimacy. Our advanced fraud detection system ensures valid transactions.',
      fraudDetection: true,
      orderVerification: true,
      chargebackProtection: true,
      validationMethods: [
        'IP verification',
        'Device fingerprinting',
        'Behavioral analysis',
        'Chargeback monitoring',
        'Manual review for high-value orders',
      ],
    },
    payoutReporting: {
      description:
        'Real-time reporting dashboard and detailed payment statements. Full transparency on every conversion and payout.',
      reportingFrequency: 'Daily updates, monthly statements',
      supportedPaymentMethods: ['Bank Transfer', 'PayPal', 'Stripe', 'Crypto'],
      minimumPayoutThreshold: 5000,
      payoutCurrency: 'USD',
      apiAccess: true,
    },
  };
}

/**
 * Build tracking accuracy guidelines
 */
export function buildTrackingGuidelines(): TrackingAccuracyGuidelines {
  return {
    trackingLinkValidation: {
      domain: 'vikinglabs.co',
      trackingParameter: 'ref',
      validationRules: [
        'Parameter must be exactly "ref" (case-sensitive)',
        'Value must match approved affiliate code',
        'URL must start with https://vikinglabs.co',
        'No parameter modification allowed',
      ],
      commonErrors: [
        'Using "?aff=" instead of "?ref="',
        'Adding extra parameters that corrupt tracking',
        'Using uppercase code when lowercase expected',
        'Modifying the URL after tracking parameter',
      ],
      testingUrl: 'https://vikinglabs.co/?ref=TESTCODE',
      expectedResponse: {
        trackedSuccessfully: true,
        affiliateCode: 'TESTCODE',
        timestamp: 'current_timestamp',
      },
    },
    discountCodeTracking: {
      format: 'Alphanumeric: 5-20 characters',
      validationRegex: '^[A-Z0-9]{5,20}$',
      caseInsensitive: false,
      maxLength: 20,
      trackingAccuracy: 0.99,
      testingSteps: [
        '1. Add discount code to checkout',
        '2. Complete purchase with test code',
        '3. Verify code appears in conversion report within 5 minutes',
        '4. Check commission calculation includes the conversion',
      ],
    },
    urlIntegrityGuidelines: {
      allowedParameters: ['ref', 'utm_source', 'utm_medium', 'utm_campaign'],
      prohibitedModifications: [
        'Do not shorten the URL in a way that removes tracking',
        'Do not add extra ref parameters',
        'Do not use URL encoding that alters the code',
      ],
      urlEncoding: 'UTF-8',
      maxUrlLength: 2048,
      redirectChains: 'Avoid redirect chains; use direct links only',
      validationChecklist: [
        'Link starts with https://vikinglabs.co',
        'ref parameter present and correct',
        'No double-encoding of special characters',
        'URL under 2048 characters',
        'No redirect chains',
      ],
    },
    bestPractices: {
      title: 'Best Practices for Affiliate Links & Codes',
      dosList: [
        'Use your unique tracking links in all promotional content',
        'Share the QR code for your tracking link on social media',
        'Promote your discount code prominently in email campaigns',
        'Use UTM parameters to track source of traffic',
        'Monitor your dashboard daily for real-time performance',
        'Test your tracking links before sharing',
        'Provide both link and code options to customers',
        'Be transparent that you benefit from purchases',
      ],
      dontsList: [
        'Never modify your tracking link',
        'Never claim links are "free" or "no commission"',
        'Never use misleading link text',
        'Never add tracking links to link shorteners without caution',
        'Never share others\' affiliate links',
        'Never use discount codes to generate false conversions',
        'Never make medical claims about products',
        'Never target minors or restricted audiences',
      ],
      examples: [
        {
          title: 'Email Signature',
          description: 'Professional way to include affiliate link',
          correctExample:
            'Check out Viking Labs for premium peptide research: https://vikinglabs.co?ref=YOURCODE (affiliate link)',
          wrongExample: 'Buy now: https://bit.ly/xxx (link may break)',
          explanation: 'Always use direct links and disclose affiliate relationship',
        },
        {
          title: 'Social Media Post',
          description: 'Effective social media promotion',
          correctExample:
            'I trust @VikingLabsco for peptide research. Use code YOURCODE for 10% off!',
          wrongExample: 'You need to buy this now!!!',
          explanation: 'Be authentic, mention benefits, provide clear code',
        },
        {
          title: 'Blog Post',
          description: 'Natural link integration in content',
          correctExample:
            'We recommend Viking Labs (https://vikinglabs.co?ref=YOURCODE) for their transparent sourcing.',
          wrongExample: 'Go to this site: [hidden redirect link]',
          explanation: 'Link should fit naturally in context and be transparent',
        },
      ],
      commonMistakes: [
        'Using tracking links that are too long for social media',
        'Not testing links before sending to audiences',
        'Posting outdated discount codes',
        'Mixing different tracking parameters on same link',
        'Failing to disclose affiliate relationship',
      ],
      performanceTips: [
        'Email campaigns convert best with discount codes',
        'Social media performs well with QR codes',
        'Blog content benefits from tracking links in recommendations',
        'Unique codes help with audience segment tracking',
        'Test different placements to find optimal conversion rates',
      ],
    },
  };
}

/**
 * Build creative asset library
 */
export function buildCreativeAssetLibrary(): CreativeAssetLibrary {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://vikinglabs.co';

  return {
    logos: [
      {
        id: 'logo-primary',
        name: 'Viking Labs Primary Logo',
        description: 'Main brand logo with full color',
        category: 'brand',
        format: 'PNG',
        fileSize: 256000,
        downloadUrl: `${baseUrl}/assets/logos/viking-labs-primary.png`,
        previewUrl: `${baseUrl}/assets/logos/viking-labs-primary-preview.png`,
        usageRights: 'Approved affiliates only',
        createdAt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString(),
        variations: [
          {
            id: 'logo-primary-color',
            name: 'Full Color',
            description: 'Primary logo in full vibrant colors',
            color: 'full-color',
            background: 'transparent',
            downloadUrl: `${baseUrl}/assets/logos/logo-primary-color.png`,
            previewUrl: `${baseUrl}/assets/logos/logo-primary-color-preview.png`,
            dimensions: { width: 1000, height: 400 },
          },
          {
            id: 'logo-primary-white',
            name: 'White Version',
            description: 'Logo for dark backgrounds',
            color: 'white',
            background: 'transparent',
            downloadUrl: `${baseUrl}/assets/logos/logo-primary-white.png`,
            previewUrl: `${baseUrl}/assets/logos/logo-primary-white-preview.png`,
            dimensions: { width: 1000, height: 400 },
          },
          {
            id: 'logo-primary-black',
            name: 'Black Version',
            description: 'Logo for light backgrounds',
            color: 'black',
            background: 'transparent',
            downloadUrl: `${baseUrl}/assets/logos/logo-primary-black.png`,
            previewUrl: `${baseUrl}/assets/logos/logo-primary-black-preview.png`,
            dimensions: { width: 1000, height: 400 },
          },
        ],
        guidelines: {
          minimumSize: 100,
          clearSpace: 20,
          allowedColors: ['full-color', 'white', 'black'],
          prohibitedModifications: [
            'No stretching or distorting',
            'No rotating',
            'No adding drop shadows',
            'No color changes beyond approved variations',
          ],
          approvedUses: [
            'Website headers',
            'Email signatures',
            'Social media profiles',
            'Promotional materials',
            'Print collateral',
          ],
          forbiddenUses: [
            'Favicon without approval',
            'Distorted or artistic versions',
            'Mixed with competitor logos',
            'Endorsement claims',
          ],
        },
      },
      {
        id: 'logo-mark',
        name: 'Viking Labs Logo Mark',
        description: 'Standalone icon/symbol',
        category: 'brand',
        format: 'PNG',
        fileSize: 128000,
        downloadUrl: `${baseUrl}/assets/logos/viking-labs-mark.png`,
        previewUrl: `${baseUrl}/assets/logos/viking-labs-mark-preview.png`,
        usageRights: 'Approved affiliates only',
        createdAt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString(),
        variations: [
          {
            id: 'logo-mark-color',
            name: 'Color Mark',
            description: 'Icon in brand colors',
            color: 'brand-color',
            background: 'transparent',
            downloadUrl: `${baseUrl}/assets/logos/logo-mark-color.png`,
            previewUrl: `${baseUrl}/assets/logos/logo-mark-color-preview.png`,
            dimensions: { width: 512, height: 512 },
          },
        ],
        guidelines: {
          minimumSize: 32,
          clearSpace: 10,
          allowedColors: ['brand-color', 'white', 'black'],
          prohibitedModifications: [
            'No modifications to shape',
            'No outline additions',
          ],
          approvedUses: ['Favicon', 'Social media icons', 'Favicons'],
          forbiddenUses: ['Merchandise without approval'],
        },
      },
    ],
    productImages: [
      {
        id: 'product-peptide-basic',
        name: 'Peptide Compound - Product Shot',
        description: 'High-quality product photography on white background',
        category: 'product',
        format: 'PNG',
        fileSize: 2048000,
        downloadUrl: `${baseUrl}/assets/products/peptide-basic-shot.png`,
        previewUrl: `${baseUrl}/assets/products/peptide-basic-preview.png`,
        usageRights: 'Standard affiliate use',
        createdAt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString(),
        productName: 'Premium Peptide Research Compound',
        angles: ['front', 'side', 'top'],
        resolution: '4000x3000',
        background: 'white',
      },
      {
        id: 'product-lifestyle-1',
        name: 'Lifestyle - Lab Environment',
        description: 'Product in professional lab setting',
        category: 'lifestyle',
        format: 'JPG',
        fileSize: 4096000,
        downloadUrl: `${baseUrl}/assets/products/lifestyle-lab.jpg`,
        previewUrl: `${baseUrl}/assets/products/lifestyle-lab-preview.jpg`,
        usageRights: 'Standard affiliate use',
        createdAt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString(),
        productName: 'Professional Research Setting',
        angles: ['front'],
        resolution: '6000x4000',
        background: 'lifestyle',
      },
    ],
    lifestyleGraphics: [
      {
        id: 'graphic-research-1',
        name: 'Research Laboratory Graphic',
        description: 'Professional lab environment illustration',
        category: 'lifestyle',
        format: 'PNG',
        fileSize: 2048000,
        downloadUrl: `${baseUrl}/assets/graphics/research-lab.png`,
        previewUrl: `${baseUrl}/assets/graphics/research-lab-preview.png`,
        usageRights: 'Affiliate promotional use',
        createdAt: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString(),
        subCategory: 'Professional',
        targetAudience: 'Researchers, Scientists',
        resolution: '3000x2000',
        colorPalette: ['#1e293b', '#f59e0b', '#ffffff'],
      },
    ],
    promotionalBanners: [
      {
        id: 'banner-web-728x90',
        name: 'Web Banner 728x90',
        description: 'Standard web leaderboard banner',
        category: 'promotional',
        format: 'PNG',
        fileSize: 512000,
        downloadUrl: `${baseUrl}/assets/banners/web-728x90.png`,
        previewUrl: `${baseUrl}/assets/banners/web-728x90-preview.png`,
        usageRights: 'Website embedding',
        createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString(),
        dimensions: { width: 728, height: 90 },
        platform: 'Web',
        animationType: 'static',
        editable: false,
      },
      {
        id: 'banner-instagram-feed',
        name: 'Instagram Feed Post 1080x1080',
        description: 'Square format for Instagram feed',
        category: 'social',
        format: 'PNG',
        fileSize: 1024000,
        downloadUrl: `${baseUrl}/assets/banners/instagram-1080x1080.png`,
        previewUrl: `${baseUrl}/assets/banners/instagram-1080x1080-preview.png`,
        usageRights: 'Social media',
        createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString(),
        dimensions: { width: 1080, height: 1080 },
        platform: 'Instagram',
        animationType: 'static',
        editable: true,
        templateUrl: `${baseUrl}/templates/instagram-feed-template.psd`,
      },
    ],
    educationalVisuals: [
      {
        id: 'infographic-quality',
        name: 'Quality Testing Infographic',
        description: 'Visual explanation of our testing process',
        category: 'educational',
        format: 'PNG',
        fileSize: 2048000,
        downloadUrl: `${baseUrl}/assets/infographics/quality-testing.png`,
        previewUrl: `${baseUrl}/assets/infographics/quality-testing-preview.png`,
        usageRights: 'Educational sharing',
        createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString(),
        topic: 'Quality & Testing',
        complexity: 'intermediate',
      },
    ],
    videoContent: [
      {
        id: 'video-intro',
        name: 'Viking Labs Introduction Video',
        description: '1-minute brand introduction',
        category: 'brand',
        format: 'MP4',
        fileSize: 52428800,
        downloadUrl: `${baseUrl}/assets/videos/intro.mp4`,
        previewUrl: `${baseUrl}/assets/videos/intro-thumbnail.jpg`,
        usageRights: 'Social media sharing',
        createdAt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString(),
        duration: 60,
        resolution: '1920x1080',
        fps: 30,
        codec: 'H.264',
        subtitles: true,
        availableLanguages: ['en'],
        transcriptUrl: `${baseUrl}/transcripts/intro.txt`,
        thumbnailUrl: `${baseUrl}/assets/videos/intro-thumbnail.jpg`,
      },
    ],
    socialMediaCreatives: [
      {
        id: 'social-instagram-story',
        name: 'Instagram Story Template',
        description: 'Shareable story creative',
        category: 'social',
        format: 'PNG',
        fileSize: 1024000,
        downloadUrl: `${baseUrl}/assets/social/ig-story.png`,
        previewUrl: `${baseUrl}/assets/social/ig-story-preview.png`,
        usageRights: 'Social media',
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString(),
        platform: 'instagram',
        dimensions: { width: 1080, height: 1920 },
        estimatedEngagement: '3-5% engagement rate',
        hashtags: ['#VikingLabs', '#PeptideResearch', '#QualityMatters'],
        caption: 'Trust the science. Viking Labs: Lab-tested peptide research compounds.',
      },
    ],
  };
}

/**
 * Build brand guidelines
 */
export function buildBrandGuidelines(): BrandGuidelines {
  return {
    title: 'Viking Labs Brand Guidelines',
    description:
      'Official brand usage standards for approved affiliates. Adherence ensures brand integrity and your compliance.',
    officialAssetUsageOnly: true,
    modificationPolicy: {
      allowedModifications: [],
      prohibitedModifications: [
        'Stretching or distorting logos',
        'Changing colors outside approved variations',
        'Adding effects like shadows, glows, or outlines',
        'Rotating or flipping logos',
        'Removing parts of the logo',
      ],
      resizingRules: 'Maintain aspect ratio. Minimum size is specified per asset.',
      colorAdjustmentRules: 'Only use provided color variations. No custom color adjustments.',
      textOverlayRules: 'No text should cover or obscure the logo',
      approvalProcess:
        'Contact support@vikinglabs.co for exceptions (usually not approved)',
    },
    misrepresentationPolicy: {
      description:
        'Strict policy against misrepresenting Viking Labs products or business relationship',
      forbiddenClaims: [
        'Products cure or treat diseases',
        'Products are FDA approved',
        'Products are prescribed by doctors',
        'Unsubstantiated efficacy claims',
        'Claims about medical benefits',
      ],
      forbiddenImplications: [
        'Implying products are pharmaceuticals',
        'Suggesting guaranteed results',
        'Claiming products are regulated by health authorities',
        'Implying endorsement by medical professionals',
      ],
      complianceChecklist: [
        'No health claims without scientific backing',
        'Disclose affiliate relationship clearly',
        'No targeting of minors',
        'No marketing to restricted jurisdictions',
        'Compliance with local advertising laws',
      ],
      reportingMisuse: 'Report violations to legal@vikinglabs.co with evidence',
    },
    complianceStandards: [
      {
        name: 'FTC Disclosure',
        description: 'Federal Trade Commission endorsement guidelines',
        requirement:
          'Clearly disclose your affiliate relationship with prominent #ad or similar',
        verification: 'Affiliate must include clear disclosure in all promotional content',
      },
      {
        name: 'GDPR Compliance',
        description: 'European data protection regulations',
        requirement:
          'Respect privacy laws when collecting customer data. Use approved tracking only.',
        verification: 'Regular compliance audits of affiliate promotional methods',
      },
      {
        name: 'Brand Safety',
        description: 'Protect brand reputation',
        requirement: 'No association with prohibited content or audiences',
        verification: 'Monitoring of affiliate channels for brand safety violations',
      },
    ],
    approvedChannels: [
      'Personal websites and blogs',
      'Email marketing (opt-in lists only)',
      'Social media posts (Instagram, TikTok, YouTube, Facebook)',
      'YouTube reviews and unboxings',
      'Podcasts and audio content',
      'Reddit (with proper disclosure)',
    ],
    forbiddenUses: [
      'Native advertising without clear disclosure',
      'Misleading clickbait titles',
      'Impersonating Viking Labs staff',
      'Unauthorized use of founder name/image',
      'Paid search ads without approval',
      'Spamming or unsolicited emails',
      'Trademark bidding without approval',
    ],
  };
}

/**
 * Build tier eligibility information
 */
export function buildTierEligibility(): Record<string, TierEligibility> {
  return {
    bronze: {
      minimumTier: 'Any new affiliate',
      minimumStats: {
        monthlyConversions: 0,
        monthlyRevenue: 0,
        accountAge: '30 days',
      },
      requirements: ['Account approved', 'Signed agreement', 'Active promotion'],
      benefits: [
        'Standard asset library access',
        'Tracking links and discount codes',
        '10% base commission',
        'Email support',
      ],
    },
    silver: {
      minimumTier: '50+ monthly conversions',
      minimumStats: {
        monthlyConversions: 50,
        monthlyRevenue: 15000,
        accountAge: '90 days',
      },
      requirements: [
        '50+ monthly conversions for 2 months',
        'Good compliance record',
        'Responsive to communications',
      ],
      benefits: [
        'All Bronze benefits',
        'Custom discount code options',
        '11% commission',
        'Priority email support',
        'Monthly performance calls',
      ],
    },
    gold: {
      minimumTier: '250+ monthly conversions',
      minimumStats: {
        monthlyConversions: 250,
        monthlyRevenue: 75000,
        accountAge: '6 months',
      },
      requirements: [
        '250+ monthly conversions for 3 months',
        'Excellent compliance',
        'Consistent high performance',
      ],
      benefits: [
        'All Silver benefits',
        'Custom landing page',
        'Co-branded materials',
        '12% commission + performance bonuses',
        'Dedicated account manager',
        'Quarterly strategy calls',
        'Access to new products early',
      ],
    },
    platinum: {
      minimumTier: '1000+ monthly conversions',
      minimumStats: {
        monthlyConversions: 1000,
        monthlyRevenue: 300000,
        accountAge: '12 months',
      },
      requirements: [
        '1000+ monthly conversions for 3 months',
        'Perfect compliance record',
        'Strategic partnership level engagement',
      ],
      benefits: [
        'All Gold benefits',
        'Exclusive co-branded content',
        'Custom API integration',
        'Up to 15% base commission + unlimited bonuses',
        'Executive-level support',
        'Monthly strategy sessions',
        'Invitation to annual partner summit',
        'Co-marketing opportunities',
      ],
    },
  };
}

/**
 * Build security measures documentation
 */
export function buildSecurityMeasures(): PlatformSecurityMeasures {
  return {
    monitoring: {
      description:
        'Continuous real-time monitoring of all affiliate activity and conversions',
      realTimeMonitoring: true,
      fraudDetection:
        'AI-powered detection of fraudulent traffic patterns, bot activity, and invalid clicks',
      complianceChecking:
        'Automated scanning of affiliate promotional content for policy violations',
      alertSystem: 'Immediate alerts to trust and safety team on suspicious activity',
      investigationProcess:
        'Thorough investigation of flagged activity with affiliate cooperation',
    },
    fraudPrevention: {
      description: 'Multi-layered fraud prevention system to protect program integrity',
      techniques: [
        'IP geolocation verification',
        'Device fingerprinting',
        'Behavioral pattern analysis',
        'Click velocity analysis',
        'Conversion velocity analysis',
        'Bot detection algorithms',
        'Chargeback monitoring',
        'Refund pattern analysis',
      ],
      botDetection: true,
      invalidTrafficFiltering: true,
      chargbackProtection: true,
      preventionStrategies: [
        'Decline conversions from known fraud IPs',
        'Flag unusual click/conversion ratios',
        'Require manual review for high-value orders',
        'Monitor for click fraud patterns',
        'Track repeat offenders globally',
      ],
    },
    brandSafety: {
      description: 'Protecting Viking Labs brand from association with prohibited content',
      prohibitedContent: [
        'Hate speech or discrimination',
        'Explicit sexual content',
        'Illegal activities',
        'Violence or harm',
        'Misinformation or false claims',
      ],
      prohibitedAssociations: [
        'Promotion alongside competitor products',
        'Adult content websites',
        'Gambling or casino sites',
        'Illegal substance promotion',
        'Scam or fraudulent content',
      ],
      monitoringMethods: [
        'Manual review of promotional content',
        'Automated URL scanning',
        'Social media monitoring',
        'Complaint-based investigation',
        'Periodic affiliate audits',
      ],
      enforcementActions: [
        'Warning notice (first violation)',
        'Temporary suspension (second violation)',
        'Permanent termination (severe violation)',
        'Legal action for significant damages',
      ],
    },
    consequences: {
      warningProcess:
        'Written notice of violation with 30-day cure period. Opportunity to respond.',
      suspensionPolicy:
        'Account suspended for 30-60 days pending review. No commissions accrued during suspension.',
      terminationPolicy:
        'Permanent account termination with forfeiture of pending commissions in cases of severe fraud or repeated violations.',
      legalAction:
        'Legal pursuit of damages in cases of significant fraud, trademark misuse, or brand damage.',
      blacklistPolicy:
        'Confirmed fraudsters added to permanent industry blacklist. Re-application permanently denied.',
    },
  };
}

/**
 * Build partner support information
 */
export function buildPartnerSupport(): PartnerSupport {
  return {
    supportChannels: [
      {
        type: 'email',
        name: 'Support Email',
        contactInfo: 'affiliates@vikinglabs.co',
        availableHours: 'Business hours (Mon-Fri, 9AM-6PM PST)',
        expectedResponseTime: '24 hours',
      },
      {
        type: 'ticketing',
        name: 'Support Portal',
        contactInfo: 'https://support.vikinglabs.co/affiliates',
        availableHours: '24/7 access',
        expectedResponseTime: '24 hours',
      },
      {
        type: 'discord',
        name: 'Discord Community',
        contactInfo: 'https://discord.gg/vikinglabs',
        availableHours: '24/7 community access',
        expectedResponseTime: '4 hours (community support)',
      },
      {
        type: 'phone',
        name: 'Phone Support (Gold+ only)',
        contactInfo: '+1-206-XXX-XXXX',
        availableHours: 'Business hours, by appointment',
        expectedResponseTime: 'Same business day',
      },
    ],
    contactInformation: {
      primaryEmail: 'affiliates@vikinglabs.co',
      supportPortal: 'https://support.vikinglabs.co/affiliates',
      phoneNumber: '+1-206-XXX-XXXX',
      discordServer: 'https://discord.gg/vikinglabs',
      weeklyOfficeHours: 'Tuesdays 2-3PM PST (open Q&A)',
    },
    availableResources: [
      {
        id: 'guide-getting-started',
        title: 'Getting Started as an Affiliate',
        type: 'documentation',
        url: 'https://vikinglabs.co/docs/affiliate-getting-started',
        description:
          'Complete beginner guide covering account setup, first promotion, and common questions',
        createdAt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'tutorial-tracking-setup',
        title: 'Setting Up Tracking Links',
        type: 'tutorial',
        url: 'https://vikinglabs.co/docs/tracking-setup',
        description: 'Step-by-step video tutorial for setting up and testing tracking links',
        createdAt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'faq-commissions',
        title: 'Commission Questions FAQ',
        type: 'faq',
        url: 'https://vikinglabs.co/docs/faq-commissions',
        description:
          'Answers to common questions about commission rates, calculations, and payouts',
        createdAt: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'webinar-advanced-tactics',
        title: 'Advanced Promotion Tactics',
        type: 'webinar',
        url: 'https://vikinglabs.co/docs/webinar-advanced',
        description:
          'Expert-led webinar covering advanced strategies to maximize conversions',
        createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'case-study-success',
        title: 'Affiliate Success Case Study',
        type: 'case_study',
        url: 'https://vikinglabs.co/docs/case-study-success',
        description:
          'Real case study of an affiliate who grew from 50 to 1000+ monthly conversions',
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ],
    responseTimeTarget: '24 hours',
    dedicatedAccountManager: false,
  };
}

/**
 * Assemble complete resource kit
 */
export function assembleResourceKit(affiliate: AffiliateApplication): AffiliateResourceKit {
  return {
    affiliateTracking: {
      trackingLinks: buildTrackingLinks(affiliate),
      discountCodes: buildDiscountCodes(affiliate),
      attribution: buildConversionAttribution(affiliate),
      analytics: buildPerformanceAnalytics(affiliate),
    },
    systemCapabilities: buildSystemCapabilities(),
    trackingGuidelines: buildTrackingGuidelines(),
    creativeLibrary: buildCreativeAssetLibrary(),
    brandGuidelines: buildBrandGuidelines(),
    customAssets: {
      requestProcess: {
        id: `custom-request-${affiliate.id}`,
        affiliateId: affiliate.id,
        affiliateTier: 'bronze',
        requestType: 'landing_page',
        title: 'Custom Asset Request Process',
        description:
          'Submit custom asset requests to receive co-branded materials and custom designs',
        requirements: 'Detailed specifications of desired assets',
        targetAudience: 'Your specific audience demographics',
        status: 'pending',
        tierEligibility: buildTierEligibility().silver,
        reviewProcess: {
          description:
            'All custom asset requests go through a review process to ensure brand compliance and quality standards',
          reviewers: 2,
          steps: [
            'Initial submission and requirements clarification',
            'Design brief development',
            'Mockup creation (1-2 rounds)',
            'Final design approval',
            'Asset delivery',
          ],
          estimatedDuration: '2-3 weeks',
          revisions: 2,
          feedbackChannels: [
            'Email',
            'Support portal',
            'Scheduled calls for complex requests',
          ],
        },
        approvalTimeline: {
          submittalToInitialReview: '2-3 business days',
          revisionTurnaround: '5-7 business days',
          finalApprovalDelivery: '1-2 business days',
          expressOption: 'Available for Gold+ tiers (72-hour turnaround)',
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      eligibilityTiers: buildTierEligibility(),
    },
    security: buildSecurityMeasures(),
    support: buildPartnerSupport(),
    metadata: {
      version: '1.0.0',
      lastUpdated: new Date().toISOString(),
      affiliateId: affiliate.id,
      affiliateCode: affiliate.code || 'unknown',
      documentationUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/docs/affiliate-resources`,
      apiVersion: 'v1',
    },
  };
}
