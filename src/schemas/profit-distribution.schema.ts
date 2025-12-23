import { z } from "zod";

/**
 * Profit Distribution Schema
 * Tracks profit distributions from investment opportunities to investors
 */

export const profitDistributionSchema = z.object({
  opportunityId: z.string().min(1, "Opportunity ID is required"),
  businessName: z.string().min(1, "Business name is required"),
  contractType: z.enum(["musharakah", "mudarabah", "murabaha", "ijarah"]),
  
  // Distribution details
  distributionPeriod: z.string().min(1, "Distribution period is required"), // e.g., "Q1 2024", "Jan 2024"
  totalProfitAmount: z.number().min(0, "Total profit amount must be positive"),
  distributionDate: z.number(), // Timestamp when distribution was processed
  
  // Distribution breakdown
  investorCount: z.number().min(1, "Must have at least one investor"),
  totalInvestedAmount: z.number().min(0, "Total invested amount must be positive"),
  
  // Status
  status: z.enum(["pending", "processing", "completed", "failed"]).default("pending"),
  
  // Metadata
  processedBy: z.string().optional(), // Admin user ID who processed
  notes: z.string().optional(),
  createdAt: z.number(),
  completedAt: z.number().optional(),
});

export type ProfitDistribution = z.infer<typeof profitDistributionSchema>;

/**
 * Individual Investor Distribution Schema
 * Tracks each investor's share in a profit distribution
 */
export const investorDistributionSchema = z.object({
  distributionId: z.string().min(1, "Distribution ID is required"),
  opportunityId: z.string().min(1, "Opportunity ID is required"),
  investorId: z.string().min(1, "Investor ID is required"),
  
  // Investment details
  investedAmount: z.number().min(0, "Invested amount must be positive"),
  investmentPercentage: z.number().min(0).max(100, "Percentage must be between 0 and 100"),
  
  // Profit details
  profitAmount: z.number().min(0, "Profit amount must be positive"),
  profitRate: z.number().min(0, "Profit rate must be positive"), // Actual percentage return
  
  // Status
  status: z.enum(["pending", "credited", "failed"]).default("pending"),
  
  // Metadata
  creditedAt: z.number().optional(),
  transactionId: z.string().optional(), // Reference to created transaction
  createdAt: z.number(),
});

export type InvestorDistribution = z.infer<typeof investorDistributionSchema>;
