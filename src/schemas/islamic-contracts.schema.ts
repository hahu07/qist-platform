/**
 * Islamic Financing Contract Type Definitions
 * 
 * This module provides TypeScript types and Zod schemas for all Islamic financing
 * contract types supported by the platform. Each contract type has unique terms,
 * calculations, and reporting requirements.
 */

import { z } from "zod";

/**
 * Base Contract Type Enum
 */
export const islamicContractType = z.enum([
  "murabaha",    // Cost-plus sale
  "mudarabah",   // Profit-sharing partnership
  "musharakah",  // Joint venture partnership
  "ijarah",      // Leasing
  "salam",       // Forward purchase
]);

export type IslamicContractType = z.infer<typeof islamicContractType>;

/**
 * Base fields common to all contract types
 */
export const baseContractTermsSchema = z.object({
  contractType: islamicContractType,
  amount: z.number().positive("Amount must be positive"),
  duration: z.number().int().positive("Duration must be positive in months"),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

/**
 * Murabaha (Cost-Plus Financing) Contract Terms
 * 
 * Asset purchase where the financier buys the asset and sells it to the client
 * at cost plus a disclosed profit markup. Payment can be immediate or deferred.
 */
export const murabahaTermsSchema = baseContractTermsSchema.extend({
  contractType: z.literal("murabaha"),
  
  // Pricing
  costPrice: z.number().positive("Cost price must be positive"),
  sellingPrice: z.number().positive("Selling price must be positive"),
  profitAmount: z.number().positive("Profit amount must be positive"),
  profitRate: z.number().min(0).max(100, "Profit rate must be between 0 and 100%"),
  
  // Payment Structure
  paymentStructure: z.enum(["installment", "lump-sum", "deferred"]).default("installment"),
  installmentFrequency: z.enum(["monthly", "quarterly", "semi-annual", "annual"]).default("monthly"),
  numberOfInstallments: z.number().int().positive().optional(),
  installmentAmount: z.number().positive().optional(),
  
  // Additional Terms
  defermentPeriod: z.number().int().min(0).default(0), // Grace period in months
  earlySettlementDiscount: z.number().min(0).max(100).default(0), // Percentage
  latePaymentPenalty: z.enum(["charity", "none"]).default("charity"), // Islamic: goes to charity
  
  // Asset Information
  assetDescription: z.string().min(10, "Asset description required"),
  assetCost: z.number().positive("Asset cost must be positive"),
});

export type MurabahaTerms = z.infer<typeof murabahaTermsSchema>;

/**
 * Mudarabah (Profit-Sharing Partnership) Contract Terms
 * 
 * Partnership where one party provides capital (Rabb-ul-Maal) and the other
 * provides expertise/labor (Mudarib). Profits shared per agreed ratio, losses
 * borne by capital provider only.
 */
export const mudarabahTermsSchema = baseContractTermsSchema.extend({
  contractType: z.literal("mudarabah"),
  
  // Capital Structure
  capitalAmount: z.number().positive("Capital amount must be positive"),
  capitalProvider: z.string().min(1, "Capital provider (investor) ID required"),
  mudarib: z.string().min(1, "Mudarib (entrepreneur) ID required"),
  
  // Profit Sharing
  investorProfitShare: z.number().min(0).max(100, "Investor share must be 0-100%"),
  mudaribProfitShare: z.number().min(0).max(100, "Mudarib share must be 0-100%"),
  
  // Expected Returns (projections only)
  expectedAnnualReturn: z.number().min(0).max(100),
  expectedReturnRate: z.number().min(0).max(100), // Alias for expectedAnnualReturn
  projectedProfit: z.number().min(0),
  
  // Loss Terms
  lossDistribution: z.literal("capital-provider-only").default("capital-provider-only"),
  
  // Management & Restrictions
  managementFee: z.number().min(0).default(0), // Percentage or fixed amount
  performanceIncentive: z.number().min(0).optional(), // Performance-based bonus
  mudaribAuthority: z.enum(["full", "restricted", "limited"]).default("full"),
  capitalGuarantee: z.boolean().default(false), // Non-Islamic if true
  restrictedActivities: z.array(z.string()).optional(), // What business cannot do
  reportingFrequency: z.enum(["monthly", "quarterly", "annual"]).default("quarterly"),
  
  // Business Details
  businessActivity: z.string().min(10, "Business activity description required"),
  businessPlan: z.string().min(100, "Business plan required"),
  useOfFunds: z.string().min(50, "Detailed use of funds required"),
  
  // Profit Distribution
  profitCalculationMethod: z.enum(["net", "gross", "IRR"]).default("net"),
  profitDistributionFrequency: z.enum(["monthly", "quarterly", "annual"]).default("quarterly"),
});

export type MudarabahTerms = z.infer<typeof mudarabahTermsSchema>;

/**
 * Musharakah (Joint Venture Partnership) Contract Terms
 * 
 * Partnership where both parties contribute capital and share profits/losses
 * according to agreed ratios. Profit sharing can differ from capital ratio,
 * but loss sharing must match capital contribution.
 */
export const musharakahTermsSchema = baseContractTermsSchema.extend({
  contractType: z.literal("musharakah"),
  
  // Capital Contributions
  totalCapital: z.number().positive("Total capital must be positive"),
  party1Capital: z.number().positive("Party 1 capital must be positive"),
  party2Capital: z.number().positive("Party 2 capital must be positive"),
  party1Id: z.string().min(1, "Party 1 ID required"),
  party2Id: z.string().min(1, "Party 2 ID required"),
  party1Name: z.string().optional(), // Display name for party 1
  party2Name: z.string().optional(), // Display name for party 2
  
  // Capital Ratios (must add to 100%)
  party1CapitalRatio: z.number().min(0).max(100),
  party2CapitalRatio: z.number().min(0).max(100),
  
  // Profit Sharing (can differ from capital ratio)
  party1ProfitShare: z.number().min(0).max(100),
  party2ProfitShare: z.number().min(0).max(100),
  
  // Loss Sharing (must match capital ratio - Shariah requirement)
  party1LossShare: z.number().min(0).max(100),
  party2LossShare: z.number().min(0).max(100),
  
  // Management
  managementStructure: z.enum(["joint", "party1", "party2", "third-party"]).default("joint"),
  managementFee: z.number().min(0).default(0),
  
  // Expected Returns
  expectedAnnualReturn: z.number().min(0).max(100),
  projectedProfit: z.number().min(0),
  
  // Business Details
  partnershipType: z.enum(["general", "limited", "diminishing"]).default("general"),
  businessPurpose: z.string().min(20, "Business purpose required"),
  
  // Profit & Distribution
  profitCalculationMethod: z.enum(["net", "gross", "IRR"]).default("net"),
  profitDistributionFrequency: z.enum(["monthly", "quarterly", "annual"]).default("quarterly"),
  
  // Exit Strategy
  exitMechanism: z.enum(["buyout", "liquidation", "ipo", "other"]).optional(),
  exitStrategy: z.string().optional(), // Detailed exit plan
  capitalWithdrawalTerms: z.string().optional(), // When/how partners can withdraw
  minimumHoldingPeriod: z.number().int().min(0).optional(), // months
  
  // Governance
  decisionMaking: z.enum(["unanimous", "majority", "proportional"]).default("majority"),
  reportingFrequency: z.enum(["monthly", "quarterly", "annual"]).default("quarterly"),
});

export type MusharakahTerms = z.infer<typeof musharakahTermsSchema>;

/**
 * Ijarah (Leasing) Contract Terms
 * 
 * Asset leasing where the lessor retains ownership and the lessee pays
 * rent. Can include purchase option at end (Ijarah Muntahia Bittamleek).
 */
export const ijarahTermsSchema = baseContractTermsSchema.extend({
  contractType: z.literal("ijarah"),
  
  // Asset Information
  assetDescription: z.string().min(10, "Asset description required"),
  assetValue: z.number().positive("Asset value must be positive"),
  assetCategory: z.string().min(1, "Asset category required"),
  assetType: z.string().optional(), // Alias for assetCategory
  assetCondition: z.enum(["new", "used", "refurbished"]).default("new"),
  
  // Lease Terms
  monthlyRental: z.number().positive("Monthly rental must be positive"),
  totalRentalPayments: z.number().positive("Total rental payments must be positive"),
  leaseTerm: z.number().int().positive().optional(), // Lease period in months (derived from duration)
  leaseType: z.enum(["operating", "finance", "sale-leaseback"]).default("operating"),
  rentalFrequency: z.enum(["monthly", "quarterly", "semi-annual", "annual"]).default("monthly"),
  
  // Purchase Option (Ijarah Muntahia Bittamleek)
  purchaseOptionIncluded: z.boolean().default(false),
  purchaseOption: z.boolean().optional(), // Alias for purchaseOptionIncluded
  residualValue: z.number().min(0).optional(), // Price to purchase at end
  purchasePrice: z.number().min(0).optional(), // Alias for residualValue
  purchaseOptionDate: z.string().optional(),
  
  // Maintenance & Insurance
  maintenanceResponsibility: z.enum(["lessor", "lessee", "shared"]).default("lessor"),
  maintenanceCost: z.number().min(0).default(0),
  insuranceRequired: z.boolean().default(true),
  insuranceRequirement: z.boolean().optional(), // Alias for insuranceRequired
  insuranceCost: z.number().min(0).default(0),
  insurancePremiumPayer: z.enum(["lessor", "lessee", "shared"]).optional(),
  
  // Penalties & Defaults
  latePaymentPenalty: z.enum(["charity", "none"]).default("charity"),
  securityDeposit: z.number().min(0).default(0),
  earlyTerminationAllowed: z.boolean().default(false),
  earlyTerminationPenalty: z.number().min(0).default(0), // Percentage
  
  // Renewal & Sublease
  renewalOption: z.boolean().default(false),
  subleaseAllowed: z.boolean().default(false),
  
  // Depreciation (for accounting)
  depreciationMethod: z.enum(["straight-line", "declining-balance"]).default("straight-line"),
  estimatedUsefulLife: z.number().int().positive().optional(), // years
});

export type IjarahTerms = z.infer<typeof ijarahTermsSchema>;

/**
 * Salam (Forward Purchase) Contract Terms
 * 
 * Advance payment for future delivery of commodities. Typically used for
 * agricultural products or commodities with standardized specifications.
 */
export const salamTermsSchema = baseContractTermsSchema.extend({
  contractType: z.literal("salam"),
  
  // Commodity Specifications
  commodityType: z.string().min(1, "Commodity type required"),
  commodityDescription: z.string().min(20, "Commodity description required"),
  quantity: z.number().positive("Quantity must be positive"),
  unit: z.string().min(1, "Unit of measurement required"),
  qualitySpecifications: z.array(z.string()).min(1, "Quality specifications required"),
  qualityGrade: z.enum(["premium", "standard", "basic"]).default("standard"),
  packagingRequirements: z.string().optional(),
  
  // Pricing
  advancePayment: z.number().positive("Advance payment must be positive"),
  spotPrice: z.number().positive("Spot price must be positive"),
  agreedPrice: z.number().positive("Agreed price must be positive"),
  deliveryValue: z.number().positive("Delivery value must be positive"),
  
  // Delivery Terms
  deliveryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
  deliveryPeriod: z.number().int().positive("Delivery period in days required"),
  deliveryLocation: z.string().min(5, "Delivery location required"),
  deliveryMethod: z.string().optional(),
  paymentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
  
  // Quality & Inspection
  inspectionRequired: z.boolean().default(true),
  qualityStandards: z.string().optional(),
  
  // Default & Penalties
  defaultPenalty: z.enum(["charity", "replacement", "refund"]).default("replacement"),
  lateDeliveryPenalty: z.number().min(0).default(0), // Percentage per day
  lateFee: z.number().min(0).default(0),
  
  // Collateral & Guarantees
  collateralType: z.string().optional(),
  collateralValue: z.number().min(0).optional(),
  thirdPartyGuarantee: z.boolean().default(false),
  guarantorDetails: z.string().optional(),
  
  // Purpose
  purpose: z.string().min(20, "Purpose of Salam contract required"),
});

export type SalamTerms = z.infer<typeof salamTermsSchema>;

/**
 * Union type for all contract terms
 */
export type ContractTerms = 
  | MurabahaTerms 
  | MudarabahTerms 
  | MusharakahTerms 
  | IjarahTerms 
  | SalamTerms;

/**
 * Type guard functions
 */
export function isMurabahaTerms(terms: ContractTerms): terms is MurabahaTerms {
  return terms.contractType === "murabaha";
}

export function isMudarabahTerms(terms: ContractTerms): terms is MudarabahTerms {
  return terms.contractType === "mudarabah";
}

export function isMusharakahTerms(terms: ContractTerms): terms is MusharakahTerms {
  return terms.contractType === "musharakah";
}

export function isIjarahTerms(terms: ContractTerms): terms is IjarahTerms {
  return terms.contractType === "ijarah";
}

export function isSalamTerms(terms: ContractTerms): terms is SalamTerms {
  return terms.contractType === "salam";
}

/**
 * Contract Type Display Names
 */
export const contractTypeNames: Record<IslamicContractType, string> = {
  murabaha: "Murabaha (Cost-Plus Financing)",
  mudarabah: "Mudarabah (Profit-Sharing Partnership)",
  musharakah: "Musharakah (Joint Venture Partnership)",
  ijarah: "Ijarah (Leasing)",
  salam: "Salam (Forward Purchase)",
};

/**
 * Contract Type Descriptions
 */
export const contractTypeDescriptions: Record<IslamicContractType, string> = {
  murabaha: "Asset purchase with disclosed markup. Suitable for asset acquisition with fixed repayment terms.",
  mudarabah: "Capital provider and entrepreneur partnership. Profits shared per ratio, losses borne by capital provider.",
  musharakah: "Joint venture where both parties contribute capital. Profits shared per agreement, losses per capital ratio.",
  ijarah: "Asset leasing with option to purchase. Lessor retains ownership, lessee pays rental.",
  salam: "Advance payment for future commodity delivery. Typically for agricultural products or standardized goods.",
};

/**
 * Validation helper to ensure profit/loss shares add up to 100%
 */
export function validateRatios(terms: MudarabahTerms | MusharakahTerms): boolean {
  if ('investorProfitShare' in terms) {
    // Mudarabah
    return terms.investorProfitShare + terms.mudaribProfitShare === 100;
  } else {
    // Musharakah
    const capitalRatioValid = 
      Math.abs((terms.party1CapitalRatio + terms.party2CapitalRatio) - 100) < 0.01;
    const profitRatioValid = 
      Math.abs((terms.party1ProfitShare + terms.party2ProfitShare) - 100) < 0.01;
    const lossRatioValid = 
      Math.abs((terms.party1LossShare + terms.party2LossShare) - 100) < 0.01;
    
    // Shariah requirement: loss ratio must match capital ratio
    const lossMatchesCapital =
      Math.abs(terms.party1LossShare - terms.party1CapitalRatio) < 0.01 &&
      Math.abs(terms.party2LossShare - terms.party2CapitalRatio) < 0.01;
    
    return capitalRatioValid && profitRatioValid && lossRatioValid && lossMatchesCapital;
  }
}
