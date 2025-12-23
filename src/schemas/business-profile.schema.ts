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
  
  // Account Status
  accountStatus: z.enum(["active", "suspended", "closed"]).default("active"),
  
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
  "certificate-of-incorporation",
  "tax-identification-number",
  "memorandum-of-association",
  "articles-of-association",
  "directors-list",
  "shareholders-list",
  "proof-of-business-address",
  "bank-account-details",
  "director-id-front",
  "director-id-back",
  "utility-bill",
  "business-license",
  "status-report",
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
  "certificate-of-incorporation": "Certificate of Incorporation",
  "tax-identification-number": "Tax Identification Number (TIN)",
  "memorandum-of-association": "Memorandum of Association",
  "articles-of-association": "Articles of Association",
  "directors-list": "List of Directors",
  "shareholders-list": "List of Shareholders",
  "proof-of-business-address": "Proof of Business Address",
  "bank-account-details": "Bank Account Details",
  "director-id-front": "Director's ID (Front)",
  "director-id-back": "Director's ID (Back)",
  "utility-bill": "Utility Bill",
  "business-license": "Business License/Permit",
  "status-report": "Status Report (CAC)",
  "other": "Other Document"
};
