import { z } from "zod";

/**
 * Revenue Report Schema
 * Defines validation rules for business revenue and financial reporting
 */
export const revenueReportSchema = z.object({
  // Report Identification
  applicationId: z.string().min(1, "Application ID is required"),
  reportingPeriod: z.enum(["monthly", "quarterly", "annual"], {
    message: "Invalid reporting period"
  }),
  periodStartDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)"),
  periodEndDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)"),
  
  // Financial Metrics
  totalRevenue: z.number()
    .nonnegative("Revenue cannot be negative"),
  totalExpenses: z.number()
    .nonnegative("Expenses cannot be negative"),
  netProfit: z.number(), // Can be negative (loss)
  
  // Revenue Breakdown (Optional)
  revenueBreakdown: z.object({
    salesRevenue: z.number().nonnegative().optional(),
    serviceRevenue: z.number().nonnegative().optional(),
    otherRevenue: z.number().nonnegative().optional(),
  }).optional(),
  
  // Expense Breakdown (Optional)
  expenseBreakdown: z.object({
    operatingExpenses: z.number().nonnegative().optional(),
    administrativeExpenses: z.number().nonnegative().optional(),
    marketingExpenses: z.number().nonnegative().optional(),
    otherExpenses: z.number().nonnegative().optional(),
  }).optional(),
  
  // Supporting Documents
  documents: z.array(z.object({
    name: z.string(),
    url: z.string().url("Invalid document URL"),
    type: z.enum(["financial_statement", "bank_statement", "invoice", "receipt", "audit_report", "other"]),
    uploadedAt: z.string(),
  })).default([]),
  
  // Profit Distribution (Calculated)
  profitDistribution: z.object({
    totalDistributable: z.number(),
    businessShare: z.number(),
    investorShare: z.number(),
    distributionPerInvestor: z.array(z.object({
      investorId: z.string(),
      investmentAmount: z.number(),
      profitShare: z.number(),
      percentage: z.number(),
    })),
  }).optional(),
  
  // Additional Information
  notes: z.string().max(2000, "Notes cannot exceed 2000 characters").optional(),
  performanceCommentary: z.string().max(1000, "Commentary cannot exceed 1000 characters").optional(),
  
  // Verification
  verified: z.boolean().default(false),
  verifiedBy: z.string().optional(), // Admin ID who verified
  verifiedAt: z.string().optional(),
  
  // Status
  status: z.enum(["draft", "submitted", "under_review", "approved", "rejected"]).default("draft"),
  submittedAt: z.string().optional(),
});

/**
 * Infer TypeScript type from schema
 */
export type RevenueReport = z.infer<typeof revenueReportSchema>;

/**
 * Partial schema for updates
 */
export const revenueReportUpdateSchema = revenueReportSchema.partial();

/**
 * Schema for creating new reports (without status/verification)
 */
export const revenueReportCreateSchema = revenueReportSchema.omit({ 
  status: true, 
  verified: true,
  verifiedBy: true,
  verifiedAt: true,
  submittedAt: true,
});

/**
 * Schema for profit distribution calculations
 */
export const profitDistributionSchema = z.object({
  contractType: z.enum(["murabaha", "musharaka", "mudaraba", "ijara", "istisna"]),
  netProfit: z.number(),
  totalInvestment: z.number().positive(),
  businessSharePercentage: z.number().min(0).max(100), // e.g., 60% for business
  investments: z.array(z.object({
    investorId: z.string(),
    amount: z.number().positive(),
  })),
});

export type ProfitDistribution = z.infer<typeof profitDistributionSchema>;
