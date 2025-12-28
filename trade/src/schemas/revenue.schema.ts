import { z } from "zod";

/**
 * Revenue Report Schema
 * For businesses to submit periodic financial reports
 */
export const revenueReportSchema = z.object({
  // Business identification
  applicationId: z.string().min(1, "Application ID required"),
  businessName: z.string().min(2, "Business name required"),
  contractType: z.enum(["murabaha", "musharaka", "mudaraba", "ijara", "istisna"]).optional(),
  
  // Reporting period
  reportingPeriod: z.enum(["monthly", "quarterly", "annually"], {
    message: "Invalid reporting period"
  }),
  periodStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)"),
  periodEnd: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)"),
  
  // Financial data
  totalRevenue: z.number()
    .nonnegative("Revenue cannot be negative"),
  totalExpenses: z.number()
    .nonnegative("Expenses cannot be negative"),
  netProfit: z.number(), // Can be negative (loss)
  grossProfit: z.number(),
  operatingExpenses: z.number().nonnegative(),
  
  // Additional metrics
  cashFlow: z.number().optional(),
  assets: z.number().nonnegative().optional(),
  liabilities: z.number().nonnegative().optional(),
  
  // Breakdown (optional)
  revenueBreakdown: z.object({
    productSales: z.number().optional(),
    serviceSales: z.number().optional(),
    other: z.number().optional(),
  }).optional(),
  
  expenseBreakdown: z.object({
    salaries: z.number().optional(),
    rent: z.number().optional(),
    utilities: z.number().optional(),
    marketing: z.number().optional(),
    other: z.number().optional(),
  }).optional(),
  
  // Supporting documents
  documents: z.array(z.object({
    name: z.string(),
    url: z.string().url(),
    type: z.enum(["financial_statement", "bank_statement", "invoice", "receipt", "audit_report", "other"]),
    uploadDate: z.string(),
  })).default([]),
  
  // Notes and explanations
  notes: z.string().max(2000, "Notes too long").optional(),
  significantEvents: z.string().max(1000, "Description too long").optional(),
  
  // Contract-Specific Fields
  // Murabaha (Cost-Plus Financing)
  murabahaDetails: z.object({
    assetCost: z.number().nonnegative().optional(),
    markupAmount: z.number().nonnegative().optional(),
    installmentsPaid: z.number().int().nonnegative().optional(),
    installmentsRemaining: z.number().int().nonnegative().optional(),
    remainingBalance: z.number().nonnegative().optional(),
    paymentStatus: z.enum(["on-time", "delayed", "defaulted"]).optional(),
  }).optional(),
  
  // Mudaraba (Trust Financing)
  mudarabaDetails: z.object({
    capitalProvided: z.number().nonnegative().optional(),
    investorProfitShare: z.number().min(0).max(100).optional(),
    mudaribProfitShare: z.number().min(0).max(100).optional(),
    actualInvestorProfit: z.number().optional(),
    actualMudaribProfit: z.number().optional(),
    managementPerformance: z.enum(["excellent", "good", "satisfactory", "poor"]).optional(),
    businessActivities: z.string().max(500).optional(),
  }).optional(),
  
  // Musharaka (Partnership)
  musharakahDetails: z.object({
    party1Capital: z.number().nonnegative().optional(),
    party2Capital: z.number().nonnegative().optional(),
    party1ProfitShare: z.number().min(0).max(100).optional(),
    party2ProfitShare: z.number().min(0).max(100).optional(),
    actualParty1Profit: z.number().optional(),
    actualParty2Profit: z.number().optional(),
    partnershipActivities: z.string().max(500).optional(),
    buyoutProgress: z.number().min(0).max(100).optional(), // For diminishing musharaka
  }).optional(),
  
  // Ijara (Leasing)
  ijaraDetails: z.object({
    assetValue: z.number().nonnegative().optional(),
    monthlyRental: z.number().nonnegative().optional(),
    rentalsPaid: z.number().int().nonnegative().optional(),
    rentalsRemaining: z.number().int().nonnegative().optional(),
    assetDepreciation: z.number().nonnegative().optional(),
    maintenanceCosts: z.number().nonnegative().optional(),
    assetCondition: z.enum(["excellent", "good", "fair", "poor"]).optional(),
    purchaseOptionExercised: z.boolean().optional(),
  }).optional(),
  
  // Salam/Istisna (Forward Sales/Manufacturing)
  salamDetails: z.object({
    commodityDescription: z.string().max(500).optional(),
    advancePaymentReceived: z.number().nonnegative().optional(),
    productionProgress: z.number().min(0).max(100).optional(),
    deliveryStatus: z.enum(["not-started", "in-progress", "partial", "completed", "delayed"]).optional(),
    quantityOrdered: z.number().nonnegative().optional(),
    quantityDelivered: z.number().nonnegative().optional(),
    qualityCompliance: z.enum(["compliant", "minor-issues", "major-issues"]).optional(),
    productionCosts: z.number().nonnegative().optional(),
  }).optional(),
  
  // Status and audit
  status: z.enum(["draft", "submitted", "under_review", "approved", "rejected"]).default("draft"),
  submittedAt: z.string().optional(),
  reviewedAt: z.string().optional(),
  reviewedBy: z.string().optional(),
  reviewNotes: z.string().optional(),
  
  // Verification
  certifiedBy: z.string().optional(), // Business owner name
  certificationDate: z.string().optional(),
  isAudited: z.boolean().default(false),
  auditorName: z.string().optional(),
});

export type RevenueReport = z.infer<typeof revenueReportSchema>;

/**
 * Profit Distribution Schema
 * Calculates profit sharing for investors based on contract type
 */
export const profitDistributionSchema = z.object({
  // Reference
  applicationId: z.string().min(1),
  revenueReportId: z.string().min(1),
  opportunityId: z.string().min(1),
  
  // Period
  distributionPeriod: z.string(), // e.g., "2024-Q1"
  periodStart: z.string(),
  periodEnd: z.string(),
  
  // Totals
  totalProfit: z.number(),
  totalDistributableProfit: z.number(), // After expenses, fees
  totalInvestment: z.number().positive(),
  
  // Business share
  businessShare: z.number(),
  businessSharePercentage: z.number().min(0).max(100),
  
  // Investor allocations
  investorAllocations: z.array(z.object({
    investorId: z.string(),
    investmentAmount: z.number().positive(),
    investmentPercentage: z.number().min(0).max(100),
    profitShare: z.number(),
    profitSharePercentage: z.number().min(0).max(100),
    status: z.enum(["pending", "approved", "paid", "failed"]),
    paidAt: z.string().optional(),
    transactionId: z.string().optional(),
  })),
  
  // Contract details
  contractType: z.enum(["murabaha", "musharaka", "mudaraba", "ijara", "istisna"]),
  profitSharingRatio: z.string(), // e.g., "60:40" (business:investors)
  
  // Calculation method
  calculationMethod: z.enum(["proportional", "fixed_ratio", "tiered"]),
  calculationNotes: z.string().optional(),
  
  // Status
  status: z.enum(["calculated", "approved", "processing", "completed", "failed"]).default("calculated"),
  approvedBy: z.string().optional(),
  approvedAt: z.string().optional(),
  processedAt: z.string().optional(),
  
  // Audit trail
  createdAt: z.string(),
  createdBy: z.string(),
});

export type ProfitDistribution = z.infer<typeof profitDistributionSchema>;

/**
 * Financial Metrics Schema
 * Calculated metrics for business performance
 */
export const financialMetricsSchema = z.object({
  applicationId: z.string(),
  periodStart: z.string(),
  periodEnd: z.string(),
  
  // Profitability ratios
  profitMargin: z.number(), // (Net Profit / Revenue) * 100
  grossProfitMargin: z.number(), // (Gross Profit / Revenue) * 100
  operatingMargin: z.number(), // (Operating Income / Revenue) * 100
  
  // Growth metrics
  revenueGrowth: z.number().optional(), // % change from previous period
  profitGrowth: z.number().optional(),
  
  // Efficiency metrics
  returnOnInvestment: z.number(), // (Net Profit / Total Investment) * 100
  assetTurnover: z.number().optional(), // Revenue / Assets
  
  // Liquidity (if data available)
  currentRatio: z.number().optional(), // Assets / Liabilities
  
  // Performance indicators
  revenuePerEmployee: z.number().optional(),
  averageMonthlyRevenue: z.number(),
  averageMonthlyProfit: z.number(),
  
  // Trend
  trend: z.enum(["improving", "stable", "declining"]),
  trendConfidence: z.number().min(0).max(100),
});

export type FinancialMetrics = z.infer<typeof financialMetricsSchema>;

/**
 * Helper function to calculate profit distribution
 */
export function calculateProfitDistribution(
  contractType: string,
  netProfit: number,
  totalInvestment: number,
  investments: Array<{ investorId: string; amount: number }>,
  profitSharingRatio: { business: number; investors: number }
): ProfitDistribution["investorAllocations"] {
  const distributableProfit = netProfit * (profitSharingRatio.investors / 100);
  
  return investments.map(investment => {
    const investmentPercentage = (investment.amount / totalInvestment) * 100;
    const profitShare = distributableProfit * (investmentPercentage / 100);
    const profitSharePercentage = (profitShare / netProfit) * 100;
    
    return {
      investorId: investment.investorId,
      investmentAmount: investment.amount,
      investmentPercentage,
      profitShare,
      profitSharePercentage,
      status: "pending" as const,
    };
  });
}

/**
 * Helper function to calculate financial metrics
 */
export function calculateFinancialMetrics(
  revenue: number,
  expenses: number,
  netProfit: number,
  grossProfit: number,
  totalInvestment: number,
  previousRevenue?: number,
  previousProfit?: number
): Partial<FinancialMetrics> {
  const profitMargin = revenue > 0 ? (netProfit / revenue) * 100 : 0;
  const grossProfitMargin = revenue > 0 ? (grossProfit / revenue) * 100 : 0;
  const operatingMargin = revenue > 0 ? ((revenue - expenses) / revenue) * 100 : 0;
  const returnOnInvestment = totalInvestment > 0 ? (netProfit / totalInvestment) * 100 : 0;
  
  const revenueGrowth = previousRevenue 
    ? ((revenue - previousRevenue) / previousRevenue) * 100 
    : undefined;
  const profitGrowth = previousProfit 
    ? ((netProfit - previousProfit) / previousProfit) * 100 
    : undefined;
  
  let trend: "improving" | "stable" | "declining" = "stable";
  if (revenueGrowth !== undefined) {
    trend = revenueGrowth > 5 ? "improving" : revenueGrowth < -5 ? "declining" : "stable";
  }
  
  return {
    profitMargin,
    grossProfitMargin,
    operatingMargin,
    returnOnInvestment,
    revenueGrowth,
    profitGrowth,
    trend,
    trendConfidence: 75,
  };
}
