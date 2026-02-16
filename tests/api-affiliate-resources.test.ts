/**
 * Tests for /api/affiliate/resources endpoint
 * Validates resource kit assembly and authentication
 */

import { assembleResourceKit, buildTrackingLinks, buildDiscountCodes, buildCreativeAssetLibrary, buildBrandGuidelines, buildSecurityMeasures, buildPartnerSupport, buildTrackingGuidelines, buildSystemCapabilities, buildTierEligibility } from '@/lib/affiliate-resources';
import { AffiliateApplication } from '@/lib/affiliates';
import { AffiliateResourceKit } from '@/../types/affiliate-resources';

describe('Affiliate Resource Kit', () => {
  // Sample affiliate for testing
  const testAffiliate: AffiliateApplication = {
    id: 'test-aff-123',
    name: 'Test Affiliate',
    email: 'test@example.com',
    status: 'approved',
    code: 'TESTAFF123',
    signupCreditCents: 0,
    commissionRate: 0.1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  describe('buildTrackingLinks', () => {
    it('should generate three tracking links', () => {
      const links = buildTrackingLinks(testAffiliate);
      expect(links).toHaveLength(3);
    });

    it('should include main, shop, and research links', () => {
      const links = buildTrackingLinks(testAffiliate);
      const ids = links.map((l) => l.id);
      expect(ids).toContain('link-main-test-aff-123');
      expect(ids).toContain('link-shop-test-aff-123');
      expect(ids).toContain('link-research-test-aff-123');
    });

    it('should include affiliate code in URL', () => {
      const links = buildTrackingLinks(testAffiliate);
      links.forEach((link) => {
        expect(link.fullUrl).toContain('ref=TESTAFF123');
      });
    });

    it('should generate QR code', () => {
      const links = buildTrackingLinks(testAffiliate);
      expect(links[0].qrCode).toBeDefined();
      expect(links[0].qrCode).toContain('qrserver');
    });
  });

  describe('buildDiscountCodes', () => {
    it('should generate discount code', () => {
      const codes = buildDiscountCodes(testAffiliate);
      expect(codes).toHaveLength(1);
    });

    it('should set 10% discount rate', () => {
      const codes = buildDiscountCodes(testAffiliate);
      expect(codes[0].discountPercentage).toBe(10);
    });

    it('should be active by default', () => {
      const codes = buildDiscountCodes(testAffiliate);
      expect(codes[0].isActive).toBe(true);
    });
  });

  describe('buildSystemCapabilities', () => {
    it('should include all required capabilities', () => {
      const caps = buildSystemCapabilities();
      expect(caps.referralTracking).toBeDefined();
      expect(caps.clickAttribution).toBeDefined();
      expect(caps.codeBasedConversions).toBeDefined();
      expect(caps.commissionCalculations).toBeDefined();
      expect(caps.revenueValidation).toBeDefined();
      expect(caps.payoutReporting).toBeDefined();
    });

    it('should document referral tracking duration', () => {
      const caps = buildSystemCapabilities();
      expect(caps.referralTracking.trackingDuration).toBe('30 days');
    });

    it('should support multiple device types', () => {
      const caps = buildSystemCapabilities();
      expect(caps.referralTracking.supportedDevices).toContain('desktop');
      expect(caps.referralTracking.supportedDevices).toContain('mobile');
      expect(caps.referralTracking.supportedDevices).toContain('tablet');
    });

    it('should include commission structure', () => {
      const caps = buildSystemCapabilities();
      expect(caps.commissionCalculations.commissionStructure).toContain('10%');
      expect(caps.commissionCalculations.tieredCommission).toBe(true);
    });

    it('should list bonus opportunities', () => {
      const caps = buildSystemCapabilities();
      expect(caps.commissionCalculations.bonusOpportunities).toHaveLength(3);
    });
  });

  describe('buildTrackingGuidelines', () => {
    it('should include tracking link validation', () => {
      const guidelines = buildTrackingGuidelines();
      expect(guidelines.trackingLinkValidation).toBeDefined();
      expect(guidelines.trackingLinkValidation.domain).toBe('vikinglabs.co');
      expect(guidelines.trackingLinkValidation.trackingParameter).toBe('ref');
    });

    it('should provide discount code format', () => {
      const guidelines = buildTrackingGuidelines();
      expect(guidelines.discountCodeTracking).toBeDefined();
      expect(guidelines.discountCodeTracking.format).toContain('Alphanumeric');
    });

    it('should include best practices', () => {
      const guidelines = buildTrackingGuidelines();
      expect(guidelines.bestPractices.dosList).toHaveLength(8);
      expect(guidelines.bestPractices.dontsList).toHaveLength(8);
    });

    it('should provide practical examples', () => {
      const guidelines = buildTrackingGuidelines();
      expect(guidelines.bestPractices.examples).toHaveLength(3);
    });
  });

  describe('buildCreativeAssetLibrary', () => {
    it('should include all asset categories', () => {
      const library = buildCreativeAssetLibrary();
      expect(library.logos).toBeDefined();
      expect(library.productImages).toBeDefined();
      expect(library.lifestyleGraphics).toBeDefined();
      expect(library.promotionalBanners).toBeDefined();
      expect(library.educationalVisuals).toBeDefined();
      expect(library.videoContent).toBeDefined();
      expect(library.socialMediaCreatives).toBeDefined();
    });

    it('should include primary logo with variations', () => {
      const library = buildCreativeAssetLibrary();
      const primaryLogo = library.logos.find((l) => l.id === 'logo-primary');
      expect(primaryLogo).toBeDefined();
      expect(primaryLogo?.variations).toHaveLength(3);
    });

    it('should provide usage guidelines for logos', () => {
      const library = buildCreativeAssetLibrary();
      const logo = library.logos[0];
      expect(logo.guidelines).toBeDefined();
      expect(logo.guidelines.allowedColors).toBeDefined();
      expect(logo.guidelines.prohibitedModifications).toBeDefined();
    });

    it('should include product images', () => {
      const library = buildCreativeAssetLibrary();
      expect(library.productImages.length).toBeGreaterThan(0);
    });

    it('should include promotional banners with dimensions', () => {
      const library = buildCreativeAssetLibrary();
      expect(library.promotionalBanners.length).toBeGreaterThan(0);
      expect(library.promotionalBanners[0].dimensions).toBeDefined();
    });

    it('should include video content with duration', () => {
      const library = buildCreativeAssetLibrary();
      expect(library.videoContent.length).toBeGreaterThan(0);
      expect(library.videoContent[0].duration).toBeDefined();
    });

    it('should include social media creatives with platform info', () => {
      const library = buildCreativeAssetLibrary();
      expect(library.socialMediaCreatives.length).toBeGreaterThan(0);
      const igPost = library.socialMediaCreatives.find(
        (c) => c.platform === 'instagram'
      );
      expect(igPost).toBeDefined();
    });
  });

  describe('buildBrandGuidelines', () => {
    it('should include brand guidelines', () => {
      const guidelines = buildBrandGuidelines();
      expect(guidelines).toBeDefined();
      expect(guidelines.title).toContain('Brand Guidelines');
    });

    it('should prohibit modifications', () => {
      const guidelines = buildBrandGuidelines();
      expect(guidelines.modificationPolicy.prohibitedModifications).toHaveLength(
        5
      );
    });

    it('should list forbidden claims', () => {
      const guidelines = buildBrandGuidelines();
      expect(guidelines.misrepresentationPolicy.forbiddenClaims).toHaveLength(5);
    });

    it('should include compliance standards', () => {
      const guidelines = buildBrandGuidelines();
      expect(guidelines.complianceStandards).toHaveLength(3);
    });

    it('should list approved and forbidden channels', () => {
      const guidelines = buildBrandGuidelines();
      expect(guidelines.approvedChannels).toHaveLength(6);
      expect(guidelines.forbiddenUses).toHaveLength(7);
    });
  });

  describe('buildSecurityMeasures', () => {
    it('should include monitoring system', () => {
      const security = buildSecurityMeasures();
      expect(security.monitoring).toBeDefined();
      expect(security.monitoring.realTimeMonitoring).toBe(true);
    });

    it('should document fraud prevention', () => {
      const security = buildSecurityMeasures();
      expect(security.fraudPrevention).toBeDefined();
      expect(security.fraudPrevention.techniques).toHaveLength(8);
    });

    it('should include brand safety measures', () => {
      const security = buildSecurityMeasures();
      expect(security.brandSafety).toBeDefined();
      expect(security.brandSafety.prohibitedContent).toBeDefined();
    });

    it('should outline consequences for misuse', () => {
      const security = buildSecurityMeasures();
      expect(security.consequences).toBeDefined();
      expect(security.consequences.warningProcess).toBeDefined();
      expect(security.consequences.terminationPolicy).toBeDefined();
    });
  });

  describe('buildPartnerSupport', () => {
    it('should include multiple support channels', () => {
      const support = buildPartnerSupport();
      expect(support.supportChannels).toHaveLength(4);
    });

    it('should include email support', () => {
      const support = buildPartnerSupport();
      const emailChannel = support.supportChannels.find((c) => c.type === 'email');
      expect(emailChannel).toBeDefined();
      expect(emailChannel?.contactInfo).toContain('affiliates@vikinglabs.co');
    });

    it('should include available resources', () => {
      const support = buildPartnerSupport();
      expect(support.availableResources).toHaveLength(5);
    });

    it('should have response time target', () => {
      const support = buildPartnerSupport();
      expect(support.responseTimeTarget).toBe('24 hours');
    });
  });

  describe('buildTierEligibility', () => {
    it('should include all tier levels', () => {
      const tiers = buildTierEligibility();
      expect(tiers.bronze).toBeDefined();
      expect(tiers.silver).toBeDefined();
      expect(tiers.gold).toBeDefined();
      expect(tiers.platinum).toBeDefined();
    });

    it('should have increasing requirements per tier', () => {
      const tiers = buildTierEligibility();
      expect(tiers.bronze.minimumStats.monthlyConversions).toBe(0);
      expect(tiers.silver.minimumStats.monthlyConversions).toBe(50);
      expect(tiers.gold.minimumStats.monthlyConversions).toBe(250);
      expect(tiers.platinum.minimumStats.monthlyConversions).toBe(1000);
    });

    it('should offer tiered benefits', () => {
      const tiers = buildTierEligibility();
      expect(tiers.bronze.benefits).toHaveLength(4);
      expect(tiers.platinum.benefits).toHaveLength(8);
    });
  });

  describe('assembleResourceKit', () => {
    it('should assemble complete resource kit', () => {
      const kit = assembleResourceKit(testAffiliate);
      expect(kit).toBeDefined();
    });

    it('should include affiliate tracking section', () => {
      const kit = assembleResourceKit(testAffiliate);
      expect(kit.affiliateTracking).toBeDefined();
      expect(kit.affiliateTracking.trackingLinks).toBeDefined();
      expect(kit.affiliateTracking.discountCodes).toBeDefined();
      expect(kit.affiliateTracking.attribution).toBeDefined();
      expect(kit.affiliateTracking.analytics).toBeDefined();
    });

    it('should include system capabilities', () => {
      const kit = assembleResourceKit(testAffiliate);
      expect(kit.systemCapabilities).toBeDefined();
    });

    it('should include tracking guidelines', () => {
      const kit = assembleResourceKit(testAffiliate);
      expect(kit.trackingGuidelines).toBeDefined();
    });

    it('should include creative library', () => {
      const kit = assembleResourceKit(testAffiliate);
      expect(kit.creativeLibrary).toBeDefined();
    });

    it('should include brand guidelines', () => {
      const kit = assembleResourceKit(testAffiliate);
      expect(kit.brandGuidelines).toBeDefined();
    });

    it('should include custom assets section', () => {
      const kit = assembleResourceKit(testAffiliate);
      expect(kit.customAssets).toBeDefined();
      expect(kit.customAssets.requestProcess).toBeDefined();
      expect(kit.customAssets.eligibilityTiers).toBeDefined();
    });

    it('should include security measures', () => {
      const kit = assembleResourceKit(testAffiliate);
      expect(kit.security).toBeDefined();
    });

    it('should include support information', () => {
      const kit = assembleResourceKit(testAffiliate);
      expect(kit.support).toBeDefined();
    });

    it('should include metadata', () => {
      const kit = assembleResourceKit(testAffiliate);
      expect(kit.metadata).toBeDefined();
      expect(kit.metadata.affiliateId).toBe(testAffiliate.id);
      expect(kit.metadata.affiliateCode).toBe(testAffiliate.code);
      expect(kit.metadata.version).toBe('1.0.0');
    });

    it('should have proper structure for all 11 sections', () => {
      const kit = assembleResourceKit(testAffiliate);

      // Verify all 11 major sections
      const sections = [
        kit.affiliateTracking, // 1. Affiliate Tracking & API Infrastructure
        kit.systemCapabilities, // 2. What the Affiliate System Handles
        kit.trackingGuidelines, // 3. Tracking Accuracy & Attribution
        kit.creativeLibrary, // 4. Creative & Media Asset Library
        kit.brandGuidelines, // 5-8. Brand Guidelines (includes logos, products, videos, usage)
        kit.customAssets, // 9. Requesting Custom Assets
        kit.security, // 10. Platform Integrity & Security
        kit.support, // 11. Partner Support
        kit.metadata, // Metadata
      ];

      sections.forEach((section) => {
        expect(section).toBeDefined();
      });
    });
  });

  describe('Type Safety', () => {
    it('should return properly typed ResourceKit', () => {
      const kit: AffiliateResourceKit = assembleResourceKit(testAffiliate);
      expect(kit).toBeDefined();

      // Verify key types
      expect(Array.isArray(kit.affiliateTracking.trackingLinks)).toBe(true);
      expect(Array.isArray(kit.affiliateTracking.discountCodes)).toBe(true);
      expect(Array.isArray(kit.creativeLibrary.logos)).toBe(true);
      expect(kit.systemCapabilities).toBeInstanceOf(Object);
    });
  });

  describe('Content Completeness', () => {
    it('should include descriptions for all major sections', () => {
      const kit = assembleResourceKit(testAffiliate);

      expect(kit.systemCapabilities.referralTracking.description).toBeDefined();
      expect(
        kit.systemCapabilities.commissionCalculations.description
      ).toBeDefined();
      expect(kit.trackingGuidelines.bestPractices.title).toBeDefined();
      expect(kit.brandGuidelines.description).toBeDefined();
      expect(kit.security.monitoring.description).toBeDefined();
    });

    it('should provide actionable examples', () => {
      const kit = assembleResourceKit(testAffiliate);

      expect(kit.trackingGuidelines.bestPractices.examples).toHaveLength(3);
      expect(
        kit.trackingGuidelines.bestPractices.examples[0].correctExample
      ).toBeDefined();
      expect(
        kit.trackingGuidelines.bestPractices.examples[0].wrongExample
      ).toBeDefined();
    });

    it('should include contact information', () => {
      const kit = assembleResourceKit(testAffiliate);

      expect(kit.support.contactInformation.primaryEmail).toBeDefined();
      expect(kit.support.contactInformation.supportPortal).toBeDefined();
      expect(kit.support.contactInformation.discordServer).toBeDefined();
    });
  });
});
