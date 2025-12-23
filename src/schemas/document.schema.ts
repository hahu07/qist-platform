import { z } from "zod";

/**
 * Document Schema for file management
 */
export const documentSchema = z.object({
  userId: z.string().min(1, "User ID required"),
  documentType: z.enum([
    "kyc_id",
    "kyc_proof_of_address",
    "kyc_business_registration",
    "investment_certificate",
    "contract_agreement",
    "tax_statement",
    "profit_distribution_receipt",
    "bank_statement",
    "other"
  ]),
  fileName: z.string().min(1, "File name required"),
  fileSize: z.number().positive("File size must be positive").max(10 * 1024 * 1024, "File size must be less than 10MB"),
  mimeType: z.string().refine(
    (type) => ['application/pdf', 'image/jpeg', 'image/png'].includes(type),
    { message: "Invalid MIME type. Only PDF, JPG, and PNG files are allowed" }
  ),
  storageUrl: z.string().url("Invalid storage URL"),
  relatedEntityId: z.string().optional(), // Investment ID, Application ID, etc.
  relatedEntityType: z.enum(["investment", "application", "transaction", "kyc", "profile"]).optional(),
  status: z.enum(["pending", "verified", "rejected", "archived"]).default("pending"),
  uploadedAt: z.bigint().optional(),
  verifiedAt: z.bigint().optional(),
  verifiedBy: z.string().optional(),
  metadata: z.object({
    description: z.string().optional(),
    tags: z.array(z.string()).optional(),
    version: z.number().optional(),
    expiresAt: z.bigint().optional(), // For documents with expiration dates
  }).optional(),
});

export type Document = z.infer<typeof documentSchema>;

/**
 * Document Upload Request Schema
 */
export const documentUploadSchema = z.object({
  documentType: z.enum([
    "kyc_id",
    "kyc_proof_of_address",
    "kyc_business_registration",
    "investment_certificate",
    "contract_agreement",
    "tax_statement",
    "profit_distribution_receipt",
    "bank_statement",
    "other"
  ]),
  relatedEntityId: z.string().optional(),
  relatedEntityType: z.enum(["investment", "application", "transaction", "kyc", "profile"]).optional(),
  description: z.string().max(500).optional(),
  tags: z.array(z.string()).optional(),
});

export type DocumentUpload = z.infer<typeof documentUploadSchema>;

/**
 * Upload Document Schema for file validation before upload
 */
export const uploadDocumentSchema = z.object({
  fileName: z.string().min(1, "File name required"),
  fileSize: z.number().positive("File size must be positive").max(10 * 1024 * 1024, "File size must be less than 10MB"),
  mimeType: z.string().refine(
    (type) => ['application/pdf', 'image/jpeg', 'image/png'].includes(type),
    { message: "Only PDF, JPG, and PNG files are allowed" }
  ),
  documentType: z.enum([
    "kyc_id",
    "kyc_proof_of_address",
    "kyc_business_registration",
    "investment_certificate",
    "contract_agreement",
    "tax_statement",
    "profit_distribution_receipt",
    "bank_statement",
    "other"
  ]),
  description: z.string().max(500, "Description must be 500 characters or less").optional(),
});
