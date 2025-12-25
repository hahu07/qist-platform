import { z } from "zod";

/**
 * Business Application Schema (Enhanced for Onboarding)
 * Defines validation rules for business financing applications
 */
export const applicationDataSchema = z.object({
  // Basic Business Information
  businessName: z.string().min(2, "Business name must be at least 2 characters").max(100),
  businessType: z.enum(["sole_proprietorship", "partnership", "llc", "corporation", "cooperative", "other"], {
    message: "Invalid business type"
  }),
  registrationNumber: z.string().min(3, "Registration number required").max(50),
  bvn: z.string().min(11, "BVN must be 11 digits").max(11, "BVN must be 11 digits").regex(/^\d{11}$/, "BVN must be 11 digits"),
  businessEmail: z.string().email("Invalid email address"),
  businessPhone: z.string().min(10, "Valid phone number required"),
  businessAddress: z.string().min(10, "Address required"),
  
  // Legacy contact fields (for backward compatibility)
  contactEmail: z.string().email("Invalid email address").optional(),
  contactPhone: z.string().regex(/^\+?[1-9]\d{1,14}$/, "Invalid phone number format").optional(),
  
  // Financing Details
  contractType: z.enum(["murabaha", "musharaka", "mudaraba", "ijara", "istisna"], {
    message: "Invalid contract type"
  }),
  contractTerms: z.any().optional(), // Contract-specific terms (Murabaha, Mudarabah, Musharakah, Ijarah, or Salam)
  requestedAmount: z.number()
    .positive("Amount must be positive"),
  fundingDuration: z.number()
    .int("Duration must be a whole number")
    .min(1, "Duration must be at least 1 month")
    .max(120, "Duration cannot exceed 120 months"),
  fundingPurpose: z.string().min(20, "Purpose must be at least 20 characters").max(1000),
  
  // Business Operations
  industry: z.string().min(2, "Industry is required").max(100),
  yearsInOperation: z.number()
    .int("Years must be a whole number")
    .min(0, "Years cannot be negative")
    .max(200, "Invalid years in operation"),
  annualRevenue: z.number()
    .nonnegative("Revenue cannot be negative"),
  numberOfEmployees: z.number()
    .int("Number of employees must be a whole number")
    .nonnegative("Employees cannot be negative"),
  businessDescription: z.string().min(50, "Description must be at least 50 characters").max(2000),
  
  // Legacy fields (for backward compatibility)
  amount: z.number().positive().optional(),
  duration: z.number().int().optional(),
  purpose: z.string().optional(),
  
  // System fields
  status: z.enum(["pending", "new", "review", "approved", "rejected", "more-info"]).default("pending"),
  pool: z.enum(["business", "crypto"]).optional(),
  documents: z.union([
    z.array(z.string().url("Invalid document URL")),
    z.object({
      bankStatements: z.array(z.string()).optional(),
      directorsPhotos: z.array(z.string()).optional(),
      auditedStatements: z.array(z.string()).optional(),
      directorsIDs: z.array(z.string()).optional(),
      collateralDocuments: z.array(z.string()).optional(),
    })
  ]).optional(),
  
  // Admin feedback and resubmission
  adminMessage: z.string().optional(),
  rejectionReason: z.string().optional(),
  rejectionAllowsResubmit: z.boolean().optional(), // If false, application cannot be resubmitted
  requestedAt: z.string().optional(),
  resubmittedAt: z.string().optional(),
  
  // Due Diligence
  dueDiligence: z.object({
    financial: z.object({
      statementsReviewed: z.boolean(),
      bankAccountVerified: z.boolean(),
      cashFlowAnalyzed: z.boolean(),
      debtRatioAcceptable: z.boolean(),
      profitabilityConfirmed: z.boolean(),
    }),
    legal: z.object({
      registrationConfirmed: z.boolean(),
      licensesValid: z.boolean(),
      taxCompliance: z.boolean(),
      regulatoryApprovals: z.boolean(),
    }),
    identity: z.object({
      bvnVerified: z.boolean(),
      idDocumentsValid: z.boolean(),
      backgroundCheckComplete: z.boolean(),
      ownershipConfirmed: z.boolean(),
    }),
    operational: z.object({
      businessViable: z.boolean(),
      industryAnalysis: z.boolean(),
      businessModelSound: z.boolean(),
      marketPositionStrong: z.boolean(),
    }),
    collateral: z.object({
      valuationComplete: z.boolean(),
      titleVerified: z.boolean(),
      insuranceConfirmed: z.boolean(),
      encumbrancesChecked: z.boolean(),
    }),
    shariah: z.object({
      halalActivities: z.boolean(),
      noInterestOperations: z.boolean(),
      noProhibitedSectors: z.boolean(),
    }),
  }).optional(),
  dueDiligenceNotes: z.string().optional(),
  riskRating: z.enum(['low', 'moderate', 'high']).optional(),
  dueDiligenceScore: z.number().optional(),
  reviewedBy: z.string().optional(),
  reviewedAt: z.string().optional(),
  
  // Document verification fields
  documentsSubmitted: z.boolean().optional(),
  documentsSubmittedAt: z.string().optional(),
  documentsVerified: z.boolean().optional(),
  documentsVerifiedAt: z.string().optional(),
  documentsStatus: z.enum(["pending", "uploaded", "in-review", "verified", "rejected"]).optional(),
});

/**
 * Infer TypeScript type from schema
 */
export type ApplicationData = z.infer<typeof applicationDataSchema>;

/**
 * Partial schema for updates (all fields optional)
 */
export const applicationUpdateSchema = applicationDataSchema.partial();

/**
 * Schema for creating new applications (without status)
 */
export const applicationCreateSchema = applicationDataSchema.omit({ status: true });

/**
 * Schema for status updates only
 */
export const applicationStatusSchema = z.object({
  status: z.enum(["new", "review", "approved", "rejected", "more-info"]),
});

/**
 * Application Rejection Reasons
 */
export const applicationRejectionReasons = {
  // Resubmittable reasons (fixable issues)
  resubmittable: [
    { value: "incomplete-documentation", label: "Incomplete or missing documentation" },
    { value: "unclear-financials", label: "Financial statements are unclear or need clarification" },
    { value: "insufficient-collateral-docs", label: "Collateral documentation is insufficient" },
    { value: "business-plan-unclear", label: "Business plan or purpose needs more detail" },
    { value: "requested-amount-high", label: "Requested amount too high - resubmit with lower amount" },
    { value: "duration-too-long", label: "Funding duration too long - resubmit with shorter term" },
  ],
  // Permanent rejection reasons (eligibility issues)
  permanent: [
    { value: "business-ineligible", label: "Business type not eligible for Islamic financing" },
    { value: "non-shariah-compliant", label: "Business activities not Shariah-compliant" },
    { value: "poor-credit-history", label: "Unacceptable credit history or default records" },
    { value: "insufficient-revenue", label: "Annual revenue too low for requested amount" },
    { value: "fraudulent-information", label: "Fraudulent or false information detected" },
    { value: "duplicate-application", label: "Duplicate application with existing approval" },
    { value: "kyc-permanently-rejected", label: "KYC verification permanently rejected" },
  ]
} as const;
