/**
 * Viking Labs API Resource Kit Types
 * Comprehensive type definitions for affiliate resources
 */

/**
 * Tracking Infrastructure Types
 */
export interface UniqueTrackingLink {
  id: string;
  affiliateId: string;
  code: string;
  baseUrl: string;
  fullUrl: string;
  qrCode?: string;
  clicks: number;
  conversions: number;
  revenue: number;
  createdAt: string;
  updatedAt: string;
}

export interface UniqueDiscountCode {
  id: string;
  affiliateId: string;
  code: string;
  discountPercentage: number;
  maxUses?: number;
  currentUses: number;
  expiresAt?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ConversionAttribution {
  id: string;
  affiliateId: string;
  method: 'tracking_link' | 'discount_code' | 'both';
  conversionTrackingPixel?: string;
  apiEndpoint: string;
  webhookUrl?: string;
  testConversionUrl: string;
  documentation: string;
}

export interface PerformanceAnalyticsDashboard {
  totalClicks: number;
  totalConversions: number;
  conversionRate: number;
  totalRevenue: number;
  averageOrderValue: number;
  commissionEarned: number;
  commissionRate: number;
  topTrackingLink?: UniqueTrackingLink;
  topDiscountCode?: UniqueDiscountCode;
  recentConversions: ConversionRecord[];
  dateRange: {
    start: string;
    end: string;
  };
}

export interface ConversionRecord {
  id: string;
  timestamp: string;
  source: 'tracking_link' | 'discount_code';
  orderId: string;
  amount: number;
  currency: string;
}

/**
 * Affiliate System Functionality Types
 */
export interface AffiliateSystemCapabilities {
  referralTracking: ReferralTrackingCapability;
  clickAttribution: ClickAttributionCapability;
  codeBasedConversions: CodeBasedConversionCapability;
  commissionCalculations: CommissionCalculationCapability;
  revenueValidation: RevenueValidationCapability;
  payoutReporting: PayoutReportingCapability;
}

export interface ReferralTrackingCapability {
  description: string;
  trackingDuration: string;
  cookieDuration: number;
  supportedDevices: string[];
  crossDeviceTracking: boolean;
}

export interface ClickAttributionCapability {
  description: string;
  lastClickWins: boolean;
  multiTouchAttribution: boolean;
  attributionWindow: number;
  conflictResolution: string;
}

export interface CodeBasedConversionCapability {
  description: string;
  supportedCodeTypes: string[];
  codeValidation: boolean;
  automatedCodeGeneration: boolean;
  customCodeGeneration: boolean;
}

export interface CommissionCalculationCapability {
  description: string;
  commissionStructure: string;
  tieredCommission: boolean;
  bonusOpportunities: string[];
  payoutFrequency: string;
}

export interface RevenueValidationCapability {
  description: string;
  fraudDetection: boolean;
  orderVerification: boolean;
  chargebackProtection: boolean;
  validationMethods: string[];
}

export interface PayoutReportingCapability {
  description: string;
  reportingFrequency: string;
  supportedPaymentMethods: string[];
  minimumPayoutThreshold: number;
  payoutCurrency: string;
  apiAccess: boolean;
}

/**
 * Tracking Accuracy & Attribution Types
 */
export interface TrackingAccuracyGuidelines {
  trackingLinkValidation: TrackingLinkValidation;
  discountCodeTracking: DiscountCodeTrackingGuideline;
  urlIntegrityGuidelines: UrlIntegrityGuideline;
  bestPractices: BestPracticesGuide;
}

export interface TrackingLinkValidation {
  domain: string;
  trackingParameter: string;
  validationRules: string[];
  commonErrors: string[];
  testingUrl: string;
  expectedResponse: Record<string, unknown>;
}

export interface DiscountCodeTrackingGuideline {
  format: string;
  validationRegex: string;
  caseInsensitive: boolean;
  maxLength: number;
  trackingAccuracy: number;
  testingSteps: string[];
}

export interface UrlIntegrityGuideline {
  allowedParameters: string[];
  prohibitedModifications: string[];
  urlEncoding: string;
  maxUrlLength: number;
  redirectChains: string;
  validationChecklist: string[];
}

export interface BestPracticesGuide {
  title: string;
  dosList: string[];
  dontsList: string[];
  examples: BestPracticeExample[];
  commonMistakes: string[];
  performanceTips: string[];
}

export interface BestPracticeExample {
  title: string;
  description: string;
  correctExample: string;
  wrongExample: string;
  explanation: string;
}

/**
 * Creative & Media Asset Library Types
 */
export interface CreativeAssetLibrary {
  logos: LogoAsset[];
  productImages: ProductImageAsset[];
  lifestyleGraphics: LifestyleGraphicAsset[];
  promotionalBanners: PromotionalBannerAsset[];
  educationalVisuals: EducationalVisualAsset[];
  videoContent: VideoAsset[];
  socialMediaCreatives: SocialMediaCreativeAsset[];
}

export interface BaseAsset {
  id: string;
  name: string;
  description: string;
  category: string;
  format: string;
  fileSize: number;
  downloadUrl: string;
  previewUrl: string;
  usageRights: string;
  createdAt: string;
  updatedAt: string;
}

export interface LogoAsset extends BaseAsset {
  format: 'PNG' | 'SVG' | 'PDF';
  variations: LogoVariation[];
  guidelines: LogoUsageGuideline;
}

export interface LogoVariation {
  id: string;
  name: string;
  description: string;
  color: string;
  background: 'transparent' | 'white' | 'black' | 'color';
  downloadUrl: string;
  previewUrl: string;
  dimensions?: {
    width: number;
    height: number;
  };
}

export interface LogoUsageGuideline {
  minimumSize: number;
  clearSpace: number;
  allowedColors: string[];
  prohibitedModifications: string[];
  approvedUses: string[];
  forbiddenUses: string[];
}

export interface ProductImageAsset extends BaseAsset {
  productName: string;
  angles: string[];
  resolution: string;
  background: 'white' | 'lifestyle' | 'transparent';
}

export interface LifestyleGraphicAsset extends BaseAsset {
  subCategory: string;
  targetAudience: string;
  resolution: string;
  colorPalette: string[];
}

export interface PromotionalBannerAsset extends BaseAsset {
  dimensions: {
    width: number;
    height: number;
  };
  platform: string;
  animationType?: 'static' | 'gif' | 'video';
  editable: boolean;
  templateUrl?: string;
}

export interface EducationalVisualAsset extends BaseAsset {
  topic: string;
  complexity: 'beginner' | 'intermediate' | 'advanced';
  duration?: number;
  infographicData?: Record<string, unknown>;
}

export interface VideoAsset extends BaseAsset {
  duration: number;
  resolution: string;
  fps: number;
  codec: string;
  subtitles: boolean;
  availableLanguages: string[];
  transcriptUrl?: string;
  thumbnailUrl: string;
}

export interface SocialMediaCreativeAsset extends BaseAsset {
  platform: 'instagram' | 'facebook' | 'twitter' | 'linkedin' | 'tiktok';
  dimensions: {
    width: number;
    height: number;
  };
  estimatedEngagement: string;
  hashtags: string[];
  caption?: string;
}

/**
 * Brand Guidelines Types
 */
export interface BrandGuidelines {
  title: string;
  description: string;
  officialAssetUsageOnly: boolean;
  modificationPolicy: ModificationPolicy;
  misrepresentationPolicy: MisrepresentationPolicy;
  complianceStandards: ComplianceStandard[];
  approvedChannels: string[];
  forbiddenUses: string[];
}

export interface ModificationPolicy {
  allowedModifications: string[];
  prohibitedModifications: string[];
  resizingRules: string;
  colorAdjustmentRules: string;
  textOverlayRules: string;
  approvalProcess: string;
}

export interface MisrepresentationPolicy {
  description: string;
  forbiddenClaims: string[];
  forbiddenImplications: string[];
  complianceChecklist: string[];
  reportingMisuse: string;
}

export interface ComplianceStandard {
  name: string;
  description: string;
  requirement: string;
  verification: string;
}

/**
 * Custom Asset Request Types
 */
export interface CustomAssetRequest {
  id: string;
  affiliateId: string;
  affiliateTier: 'bronze' | 'silver' | 'gold' | 'platinum';
  requestType: 'landing_page' | 'co_branded' | 'exclusive_material' | 'custom_creative';
  title: string;
  description: string;
  requirements: string;
  targetAudience: string;
  deadline?: string;
  status: 'pending' | 'approved' | 'in_progress' | 'completed' | 'declined';
  tierEligibility: TierEligibility;
  reviewProcess: ReviewProcess;
  approvalTimeline: ApprovalTimeline;
  createdAt: string;
  updatedAt: string;
}

export interface TierEligibility {
  minimumTier: string;
  minimumStats: {
    monthlyConversions: number;
    monthlyRevenue: number;
    accountAge: string;
  };
  requirements: string[];
  benefits: string[];
}

export interface ReviewProcess {
  description: string;
  reviewers: number;
  steps: string[];
  estimatedDuration: string;
  revisions: number;
  feedbackChannels: string[];
}

export interface ApprovalTimeline {
  submittalToInitialReview: string;
  revisionTurnaround: string;
  finalApprovalDelivery: string;
  expressOption?: string;
}

/**
 * Platform Security Types
 */
export interface PlatformSecurityMeasures {
  monitoring: MonitoringSystem;
  fraudPrevention: FraudPreventionSystem;
  brandSafety: BrandSafetyMeasures;
  consequences: ConsequencesForMisuse;
}

export interface MonitoringSystem {
  description: string;
  realTimeMonitoring: boolean;
  fraudDetection: string;
  complianceChecking: string;
  alertSystem: string;
  investigationProcess: string;
}

export interface FraudPreventionSystem {
  description: string;
  techniques: string[];
  botDetection: boolean;
  invalidTrafficFiltering: boolean;
  chargbackProtection: boolean;
  preventionStrategies: string[];
}

export interface BrandSafetyMeasures {
  description: string;
  prohibitedContent: string[];
  prohibitedAssociations: string[];
  monitoringMethods: string[];
  enforcementActions: string[];
}

export interface ConsequencesForMisuse {
  warningProcess: string;
  suspensionPolicy: string;
  terminationPolicy: string;
  legalAction: string;
  blacklistPolicy: string;
}

/**
 * Partner Support Types
 */
export interface PartnerSupport {
  supportChannels: SupportChannel[];
  contactInformation: ContactInformation;
  availableResources: AvailableResource[];
  responseTimeTarget: string;
  dedicatedAccountManager?: boolean;
}

export interface SupportChannel {
  type: 'email' | 'phone' | 'chat' | 'ticketing' | 'discord';
  name: string;
  contactInfo: string;
  availableHours: string;
  expectedResponseTime: string;
}

export interface ContactInformation {
  primaryEmail: string;
  supportPortal: string;
  phoneNumber?: string;
  discordServer?: string;
  weeklyOfficeHours?: string;
}

export interface AvailableResource {
  id: string;
  title: string;
  type: 'documentation' | 'tutorial' | 'faq' | 'webinar' | 'case_study';
  url: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Complete API Resource Kit Response
 */
export interface AffiliateResourceKit {
  // Core Infrastructure
  affiliateTracking: {
    trackingLinks: UniqueTrackingLink[];
    discountCodes: UniqueDiscountCode[];
    attribution: ConversionAttribution;
    analytics: PerformanceAnalyticsDashboard;
  };

  // System Capabilities
  systemCapabilities: AffiliateSystemCapabilities;

  // Tracking Best Practices
  trackingGuidelines: TrackingAccuracyGuidelines;

  // Media Library
  creativeLibrary: CreativeAssetLibrary;

  // Brand Standards
  brandGuidelines: BrandGuidelines;

  // Custom Requests
  customAssets: {
    requestProcess: CustomAssetRequest;
    eligibilityTiers: Record<string, TierEligibility>;
  };

  // Security & Compliance
  security: PlatformSecurityMeasures;

  // Support
  support: PartnerSupport;

  // Metadata
  metadata: {
    version: string;
    lastUpdated: string;
    affiliateId: string;
    affiliateCode: string;
    documentationUrl: string;
    apiVersion: string;
  };
}

/**
 * API Response Wrapper
 */
export interface ResourceKitResponse {
  ok: boolean;
  data?: AffiliateResourceKit;
  error?: string;
  timestamp: string;
}
