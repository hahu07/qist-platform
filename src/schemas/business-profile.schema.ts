import { z } from "zod";

/**
 * Business Profile Schema
 * Represents a business account on the platform (separate from financing applications)
 */

export const businessProfileSchema = z.object({
  // Business Identity
  businessName: z.string().min(2, "Business name must be at least 2 characters"),
  businessEmail: z.string().email("Invalid email address"),
  businessPhone: z.string().min(10, "Phone number must be at least 10 digits"),
  registrationNumber: z.string().min(1, "Registration number is required"),
  
  // Business Type
  businessType: z.enum([
    "sole-proprietorship",
    "partnership",
    "limited-liability",
    "corporation",
    "cooperative",
    "non-profit"
  ]),
  
  industry: z.enum([
    "agriculture",
    "manufacturing",
    "retail",
    "services",
    "technology",
    "healthcare",
    "education",
    "construction",
    "hospitality",
    "transportation",
    "real-estate",
    "other"
  ]),
  
  // Business Details
  yearEstablished: z.number().min(1800).max(new Date().getFullYear()),
  numberOfEmployees: z.number().min(0),
  annualRevenue: z.number().min(0).optional(),
  
  // Location
  businessAddress: z.string().min(5, "Address must be at least 5 characters"),
  city: z.string().min(2, "City is required"),
  state: z.string().min(2, "State is required"),
  country: z.string().min(2, "Country is required"),
  
  // Contact Person
  contactPersonName: z.string().min(2, "Contact person name is required"),
  contactPersonPosition: z.string().min(2, "Position is required"),
  
  // KYC Status
  kycStatus: z.enum(["pending", "in-review", "verified", "rejected"]).default("pending"),
  kycDocumentsUploaded: z.boolean().default(false),
  kycSubmittedAt: z.string().optional(),
  kycVerifiedAt: z.string().optional(),
  kycRejectionReason: z.string().optional(),
  kycRejectionAllowsResubmit: z.boolean().optional(), // If false, user cannot resubmit
  
  // Account Status
  accountStatus: z.enum(["pending-approval", "active", "suspended", "closed"]).default("active"),
  
  // Timestamps
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type BusinessProfile = z.infer<typeof businessProfileSchema>;

/**
 * Business KYC Document Types
 */
export const businessKycDocumentTypes = [
  "business-registration-certificate",
  "memorandum-of-association",
  "proof-of-business-address",
  "status-report",
  "business-license",
  "other"
] as const;

export type BusinessKycDocumentType = typeof businessKycDocumentTypes[number];

/**
 * Business KYC Document Schema
 */
export const businessKycDocumentSchema = z.object({
  businessId: z.string().min(1, "Business ID is required"),
  documentType: z.enum(businessKycDocumentTypes),
  fileName: z.string().min(1, "File name is required"),
  fileUrl: z.string().url("Invalid file URL"),
  fileSize: z.number().positive(),
  mimeType: z.string(),
  uploadedAt: z.string(),
  status: z.enum(["pending", "verified", "rejected"]).default("pending"),
  reviewedAt: z.string().optional(),
  reviewedBy: z.string().optional(),
  rejectionReason: z.string().optional(),
  rejectionAllowsResubmit: z.boolean().optional(), // If false, permanent rejection
});

export type BusinessKycDocument = z.infer<typeof businessKycDocumentSchema>;

/**
 * Required documents for business KYC verification
 */
export const requiredBusinessKycDocuments: BusinessKycDocumentType[] = [
  "business-registration-certificate",
  "memorandum-of-association",
  "proof-of-business-address",
  "status-report"
];

/**
 * Document type labels for UI display
 */
export const businessKycDocumentLabels: Record<BusinessKycDocumentType, string> = {
  "business-registration-certificate": "Business Registration Certificate (CAC/BN)",
  "memorandum-of-association": "Memorandum of Association",
  "proof-of-business-address": "Proof of Business Address",
  "status-report": "Status Report (CAC)",
  "business-license": "Business License/Permit",
  "other": "Other Document"
};

/**
 * KYC Rejection Reasons
 */
export const kycRejectionReasons = {
  // Resubmittable reasons (document quality/completeness issues)
  resubmittable: [
    { value: "unclear-document", label: "Document is unclear or unreadable" },
    { value: "incomplete-information", label: "Document has incomplete information" },
    { value: "expired-document", label: "Document has expired" },
    { value: "wrong-document-type", label: "Wrong document type uploaded" },
    { value: "name-mismatch", label: "Name on document doesn't match profile" },
    { value: "partial-document", label: "Only partial document uploaded" },
  ],
  // Permanent rejection reasons (eligibility/authenticity issues)
  permanent: [
    { value: "fraudulent-document", label: "Document appears fraudulent or forged" },
    { value: "business-not-registered", label: "Business not found in official registry" },
    { value: "business-suspended", label: "Business registration is suspended" },
    { value: "ineligible-business-type", label: "Business type not eligible for platform" },
    { value: "sanctioned-entity", label: "Business or owners are sanctioned" },
    { value: "duplicate-registration", label: "Business already registered with different account" },
  ]
} as const;
