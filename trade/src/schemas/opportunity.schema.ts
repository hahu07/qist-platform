import { z } from "zod";

/**
 * Investment Opportunity Schema
 * Created when admin approves a business application
 */
export const opportunitySchema = z.object({
  // Reference to approved business application
  applicationId: z.string().min(1, "Application ID is required"),
  businessId: z.string().min(1, "Business ID is required"),
  
  // Business Information
  businessName: z.string().min(2, "Business name is required"),
  industry: z.string().min(1, "Industry is required"),
  description: z.string().min(50, "Description must be at least 50 characters"),
  
  // Additional Business Details
  businessBackground: z.string().min(100, "Business background must be at least 100 characters").optional(),
  yearsInBusiness: z.number().int().min(0).optional(),
  teamSize: z.number().int().min(1).optional(),
  location: z.string().optional(),
  
  // Risk Assessment
  riskRating: z.enum(["low", "moderate", "high"]).default("moderate"),
  riskFactors: z.array(z.string()).optional(),
  mitigationStrategies: z.array(z.string()).optional(),
  
  // Use of Funds
  useOfFunds: z.array(z.object({
    category: z.string(),
    amount: z.number(),
    percentage: z.number()
  })).optional(),
  
  // Financial Metrics
  projectedRevenue: z.number().optional(),
  currentRevenue: z.number().optional(),
  profitMargin: z.number().optional(),
  
  // Funding Details
  fundingGoal: z.number().positive("Funding goal must be positive"),
  currentFunding: z.number().min(0, "Current funding cannot be negative").default(0),
  minimumInvestment: z.number().positive("Minimum investment must be positive"),
  
  // Contract Terms
  contractType: z.enum(["musharakah", "mudarabah", "murabaha", "ijarah"]),
  expectedReturnMin: z.number().positive("Expected return must be positive"),
  expectedReturnMax: z.number().positive("Expected return must be positive"),
  termMonths: z.number().int().positive("Term must be positive"),
  
  // Campaign Settings
  campaignDeadline: z.string().regex(/^\d{2}-\d{2}-\d{4}$/, "Date must be in DD-MM-YYYY format"),
  featured: z.boolean().default(false),
  status: z.enum(["active", "funded", "expired", "cancelled"]).default("active"),
  
  // Tracking
  investorCount: z.number().int().min(0).default(0),
  createdAt: z.string().regex(/^\d{2}-\d{2}-\d{4}$/, "Date must be in DD-MM-YYYY format"),
  approvedBy: z.string().min(1, "Admin ID is required"),
});

export type OpportunityFormData = z.infer<typeof opportunitySchema>;

/**
 * Investment Transaction Schema
 * Created when a member invests in an opportunity
 */
export const investmentTransactionSchema = z.object({
  // Investor Information
  investorId: z.string().min(1, "Investor ID is required"),
  investorType: z.enum(["individual", "corporate"]),
  
  // Opportunity Reference
  opportunityId: z.string().min(1, "Opportunity ID is required"),
  applicationId: z.string().min(1, "Application ID is required"),
  businessId: z.string().min(1, "Business ID is required"),
  businessName: z.string().min(1, "Business name is required"),
  
  // Investment Details
  amount: z.number().positive("Investment amount must be positive"),
  contractType: z.enum(["musharakah", "mudarabah", "murabaha", "ijarah"]),
  
  // Terms
  expectedReturnMin: z.number().positive(),
  expectedReturnMax: z.number().positive(),
  termMonths: z.number().int().positive(),
  
  // Tracking
  status: z.enum(["pending", "active", "completed", "defaulted"]).default("active"),
  transactionDate: z.string().regex(/^\d{2}-\d{2}-\d{4}$/, "Date must be in DD-MM-YYYY format"),
  
  // Performance (updated over time)
  actualReturn: z.number().optional(),
  lastDistribution: z.string().regex(/^\d{2}-\d{2}-\d{4}$/, "Date must be in DD-MM-YYYY format").optional(),
  performanceStatus: z.enum(["performing-well", "on-track", "needs-attention"]).optional(),
});

export type InvestmentTransaction = z.infer<typeof investmentTransactionSchema>;
