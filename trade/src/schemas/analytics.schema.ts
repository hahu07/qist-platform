import { z } from "zod";

/**
 * Application Analytics Schema
 * Aggregated metrics for application review performance
 */
export const ApplicationAnalyticsSchema = z.object({
  // Time period
  periodStart: z.number().int().positive(),
  periodEnd: z.number().int().positive(),
  
  // Volume metrics
  totalApplications: z.number().int().nonnegative().default(0),
  newApplications: z.number().int().nonnegative().default(0),
  pendingApplications: z.number().int().nonnegative().default(0),
  approvedApplications: z.number().int().nonnegative().default(0),
  rejectedApplications: z.number().int().nonnegative().default(0),
  
  // Approval metrics
  approvalRate: z.number().min(0).max(100).default(0), // percentage
  averageApprovalTime: z.number().nonnegative().default(0), // in hours
  medianApprovalTime: z.number().nonnegative().default(0),
  
  // Financial metrics
  totalRequestedAmount: z.number().nonnegative().default(0),
  totalApprovedAmount: z.number().nonnegative().default(0),
  averageRequestAmount: z.number().nonnegative().default(0),
  averageApprovedAmount: z.number().nonnegative().default(0),
  
  // Quality metrics
  averageDueDiligenceScore: z.number().min(0).max(100).default(0),
  averageCreditRating: z.string().optional(),
  riskDistribution: z.object({
    low: z.number().int().nonnegative().default(0),
    medium: z.number().int().nonnegative().default(0),
    high: z.number().int().nonnegative().default(0),
  }).default({ low: 0, medium: 0, high: 0 }),
  
  // Industry breakdown
  industryBreakdown: z.array(z.object({
    industry: z.string(),
    count: z.number().int().nonnegative(),
    approvalRate: z.number().min(0).max(100),
    totalAmount: z.number().nonnegative(),
  })).default([]),
  
  // Contract type breakdown
  contractTypeBreakdown: z.array(z.object({
    contractType: z.string(),
    count: z.number().int().nonnegative(),
    totalAmount: z.number().nonnegative(),
  })).default([]),
  
  // SLA compliance
  slaCompliance: z.object({
    onTime: z.number().int().nonnegative().default(0),
    delayed: z.number().int().nonnegative().default(0),
    breached: z.number().int().nonnegative().default(0),
    complianceRate: z.number().min(0).max(100).default(0),
  }).default({ onTime: 0, delayed: 0, breached: 0, complianceRate: 0 }),
  
  // Admin performance
  adminPerformance: z.array(z.object({
    adminId: z.string(),
    adminName: z.string(),
    reviewedCount: z.number().int().nonnegative(),
    approvalRate: z.number().min(0).max(100),
    averageReviewTime: z.number().nonnegative(),
    workloadUtilization: z.number().min(0).max(100),
  })).default([]),
  
  generatedAt: z.number().int().positive(),
});

export type ApplicationAnalytics = z.infer<typeof ApplicationAnalyticsSchema>;

/**
 * Advanced Search Filters Schema
 */
export const SearchFiltersSchema = z.object({
  // Text search
  searchTerm: z.string().optional(),
  
  // Status filters
  statuses: z.array(z.enum([
    "new",
    "review",
    "approved",
    "rejected",
    "more-info",
    "pending"
  ])).optional(),
  
  // Amount range
  minAmount: z.number().nonnegative().optional(),
  maxAmount: z.number().nonnegative().optional(),
  
  // Date range
  startDate: z.number().int().positive().optional(),
  endDate: z.number().int().positive().optional(),
  
  // Industry
  industries: z.array(z.string()).optional(),
  
  // Contract type
  contractTypes: z.array(z.enum([
    "murabaha",
    "mudaraba",
    "musharaka",
    "ijara",
    "istisna"
  ])).optional(),
  
  // Risk level
  riskLevels: z.array(z.enum(["low", "medium", "high"])).optional(),
  
  // Due diligence score range
  minDueDiligenceScore: z.number().min(0).max(100).optional(),
  maxDueDiligenceScore: z.number().min(0).max(100).optional(),
  
  // Years in operation
  minYearsInOperation: z.number().nonnegative().optional(),
  maxYearsInOperation: z.number().nonnegative().optional(),
  
  // Assigned admin
  assignedToAdmins: z.array(z.string()).optional(),
  
  // Has documents
  hasDocuments: z.boolean().optional(),
  
  // Sorting
  sortBy: z.enum([
    "created_at",
    "requested_amount",
    "due_diligence_score",
    "business_name",
    "status"
  ]).default("created_at"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
  
  // Pagination
  page: z.number().int().positive().default(1),
  pageSize: z.number().int().positive().min(1).max(100).default(20),
});

export type SearchFilters = z.infer<typeof SearchFiltersSchema>;

/**
 * Automated Insight Schema
 * AI-generated insights and recommendations
 */
export const AutomatedInsightSchema = z.object({
  insightId: z.string().min(1),
  applicationId: z.string().min(1),
  type: z.enum([
    "risk_alert",
    "opportunity",
    "anomaly",
    "recommendation",
    "pattern",
    "compliance"
  ]),
  severity: z.enum(["info", "low", "medium", "high", "critical"]),
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(1000),
  affectedFields: z.array(z.string()).default([]),
  suggestedAction: z.string().max(500).optional(),
  confidence: z.number().min(0).max(100).default(0), // AI confidence score
  source: z.enum(["rule_engine", "ml_model", "pattern_detection", "manual"]),
  metadata: z.record(z.string(), z.unknown()).optional(),
  createdAt: z.number().int().positive(),
  acknowledgedAt: z.number().int().positive().optional(),
  acknowledgedBy: z.string().optional(),
  resolution: z.string().max(500).optional(),
});

export type AutomatedInsight = z.infer<typeof AutomatedInsightSchema>;

/**
 * Bulk Action Schema
 */
export const BulkActionSchema = z.object({
  actionId: z.string().min(1),
  actionType: z.enum([
    "approve",
    "reject",
    "assign",
    "update_status",
    "export",
    "archive"
  ]),
  applicationIds: z.array(z.string().min(1)).min(1),
  performedBy: z.string().min(1),
  performedAt: z.number().int().positive(),
  parameters: z.record(z.string(), z.unknown()).optional(),
  results: z.object({
    successful: z.number().int().nonnegative().default(0),
    failed: z.number().int().nonnegative().default(0),
    errors: z.array(z.object({
      applicationId: z.string(),
      error: z.string(),
    })).default([]),
  }).optional(),
  status: z.enum(["pending", "in_progress", "completed", "failed"]),
});

export type BulkAction = z.infer<typeof BulkActionSchema>;

/**
 * Application Comparison Schema
 */
export const ApplicationComparisonSchema = z.object({
  applications: z.array(z.string().min(1)).min(2).max(5), // Compare 2-5 applications
  metrics: z.array(z.enum([
    "requested_amount",
    "due_diligence_score",
    "years_in_operation",
    "employees",
    "revenue",
    "risk_level",
    "approval_time"
  ])),
  comparedAt: z.number().int().positive(),
  comparedBy: z.string().min(1),
});

export type ApplicationComparison = z.infer<typeof ApplicationComparisonSchema>;
