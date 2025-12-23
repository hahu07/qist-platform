import { z } from "zod";

/**
 * Investor/Member Onboarding and Profile Schemas
 */

// Base fields common to all investor types
const baseInvestorFields = {
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Phone number must be at least 10 digits").max(15, "Phone number too long"),
  country: z.string().min(2, "Country is required"),
  riskProfile: z.enum(["conservative", "moderate", "aggressive"]).default("moderate"),
  businessPoolAllocation: z.number().min(0).max(100, "Must be between 0-100%").default(70),
  cryptoPoolAllocation: z.number().min(0).max(100, "Must be between 0-100%").default(30),
  kycStatus: z.enum(["pending", "in-review", "verified", "rejected"]).default("pending"),
  kycDocuments: z.array(z.string()).default([]),
  accredited: z.boolean().default(false),
  createdAt: z.bigint().optional(),
  updatedAt: z.bigint().optional(),
};

/**
 * Individual Investor Schema
 */
export const individualInvestorSchema = z.object({
  ...baseInvestorFields,
  investorType: z.literal("individual"),
  fullName: z.string().min(2, "Full name must be at least 2 characters").max(100),
  dateOfBirth: z.preprocess(
    (val) => val === "" ? undefined : val,
    z.string().regex(/^\d{2}-\d{2}-\d{4}$/, "Date must be DD-MM-YYYY format").optional()
  ),
  nationality: z.string().min(2, "Nationality is required"),
  idType: z.enum(["passport", "national-id", "drivers-license"]),
  idNumber: z.string().min(5, "ID number is required"),
  idExpiryDate: z.preprocess(
    (val) => val === "" ? undefined : val,
    z.string().regex(/^\d{2}-\d{2}-\d{4}$/, "Date must be DD-MM-YYYY format").optional()
  ),
  address: z.object({
    street: z.string().min(5, "Street address is required"),
    city: z.string().min(2, "City is required"),
    state: z.string().optional(),
    postalCode: z.string().optional(),
    country: z.string().min(2, "Country is required"),
  }),
  employmentStatus: z.enum(["employed", "self-employed", "retired", "unemployed", "student"]),
  employer: z.string().optional(),
  occupation: z.string().min(2, "Occupation is required"),
  sourceOfFunds: z.enum(["salary", "business-income", "investments", "inheritance", "savings", "other"]),
  isPoliticallyExposed: z.boolean().default(false),
  nextOfKin: z.object({
    fullName: z.string().min(2, "Next of kin name is required"),
    phone: z.string().min(10, "Phone number must be at least 10 digits").max(15, "Phone number too long"),
  }),
  agreeToTerms: z.boolean().refine(val => val === true, "Must agree to terms and conditions"),
  agreeToShariah: z.boolean().refine(val => val === true, "Must agree to Shariah compliance"),
});

/**
 * Corporate Entity Investor Schema  
 */
export const corporateInvestorSchema = z.object({
  ...baseInvestorFields,
  investorType: z.literal("corporate"),
  companyName: z.string().min(2, "Company name is required").max(200),
  legalEntityType: z.enum([
    "private-limited",
    "public-limited", 
    "partnership",
    "llc",
    "trust",
    "foundation",
    "cooperative",
    "other"
  ]),
  registrationNumber: z.string().min(3, "Registration number is required"),
  registrationCountry: z.string().min(2, "Registration country is required"),
  incorporationDate: z.string().regex(/^\d{2}-\d{2}-\d{4}$/, "Date must be DD-MM-YYYY format"),
  registeredAddress: z.object({
    street: z.string().min(5, "Street address is required"),
    city: z.string().min(2, "City is required"),
    state: z.string().optional(),
    postalCode: z.string().optional(),
    country: z.string().min(2, "Country is required"),
  }),
  businessAddress: z.object({
    street: z.string().min(5, "Street address is required"),
    city: z.string().min(2, "City is required"),
    state: z.string().optional(),
    postalCode: z.string().optional(),
    country: z.string().min(2, "Country is required"),
  }).optional(),
  industry: z.string().min(2, "Industry is required"),
  businessDescription: z.string().min(10, "Business description required").max(500),
  taxId: z.string().optional(),
  numberOfEmployees: z.enum(["1-10", "11-50", "51-200", "201-500", "500+"]).optional(),
  annualRevenue: z.enum([
    "0-100000",
    "100000-500000",
    "500000-1000000",
    "1000000-5000000",
    "5000000-10000000",
    "10000000+"
  ]).optional(),
  // Authorized representative/signatory
  authorizedRepresentative: z.object({
    fullName: z.string().min(2, "Representative name is required"),
    title: z.string().min(2, "Title is required"),
    email: z.string().email("Invalid email address"),
    phone: z.string().min(10, "Phone number must be at least 10 digits").max(15, "Phone number too long"),
    idType: z.enum(["passport", "national-id"]),
    idNumber: z.string().min(5, "ID number is required"),
    dateOfBirth: z.preprocess(
      (val) => val === "" ? undefined : val,
      z.string().regex(/^\d{2}-\d{2}-\d{4}$/, "Date must be DD-MM-YYYY format").optional()
    ),
    nationality: z.string().min(2, "Nationality is required"),
    isPoliticallyExposed: z.boolean().default(false),
  }),
  // Beneficial owners (UBO - Ultimate Beneficial Owners with 25%+ ownership)
  beneficialOwners: z.array(z.object({
    fullName: z.string().min(2, "Name is required"),
    dateOfBirth: z.preprocess(
      (val) => val === "" ? undefined : val,
      z.string().regex(/^\d{2}-\d{2}-\d{4}$/, "Date must be DD-MM-YYYY format").optional()
    ),
    nationality: z.string().min(2, "Nationality is required"),
    ownershipPercentage: z.number().min(25, "Must own at least 25%").max(100),
    idType: z.enum(["passport", "national-id"]),
    idNumber: z.string().min(5, "ID number is required"),
    isPoliticallyExposed: z.boolean().default(false),
  })).min(1, "At least one beneficial owner is required"),
  sourceOfFunds: z.enum(["operating-revenue", "retained-earnings", "investments", "loans", "grants", "other"]).optional(),
  agreeToTerms: z.boolean().refine(val => val === true, "Must agree to terms and conditions"),
  agreeToShariah: z.boolean().refine(val => val === true, "Must agree to Shariah compliance"),
});

/**
 * Union type for all investor profiles
 */
export const investorProfileSchema = z.discriminatedUnion("investorType", [
  individualInvestorSchema,
  corporateInvestorSchema,
]);

/**
 * Investor profile update schema (partial updates)
 */
export const investorProfileUpdateSchema = z.union([
  individualInvestorSchema.partial(),
  corporateInvestorSchema.partial(),
]);

/**
 * Investment/Portfolio Schema
 */
export const investmentSchema = z.object({
  investorId: z.string().min(1, "Investor ID required"),
  applicationId: z.string().min(1, "Application ID required"),
  amount: z.number().positive("Amount must be positive").int(),
  pool: z.enum(["business", "crypto"]),
  allocationDate: z.bigint().optional(),
  status: z.enum(["pending", "active", "completed", "cancelled"]).default("pending"),
  expectedReturn: z.number().optional(),
  actualReturn: z.number().optional(),
});

/**
 * Allocation Request Schema
 */
export const allocationRequestSchema = z.object({
  investorId: z.string().min(1, "Investor ID required"),
  applicationId: z.string().min(1, "Application ID required"),
  requestedAmount: z.number().positive("Amount must be positive").int(),
  pool: z.enum(["business", "crypto"]),
  status: z.enum(["pending", "approved", "rejected"]).default("pending"),
  notes: z.string().max(500).optional(),
});

export type IndividualInvestor = z.infer<typeof individualInvestorSchema>;
export type CorporateInvestor = z.infer<typeof corporateInvestorSchema>;
export type InvestorProfile = z.infer<typeof investorProfileSchema>;
export type Investment = z.infer<typeof investmentSchema>;
export type AllocationRequest = z.infer<typeof allocationRequestSchema>;
