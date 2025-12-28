import { z } from "zod";

/**
 * Bulk Operations Schema
 * For batch processing of applications
 */
export const BulkOperationSchema = z.object({
  operationId: z.string().min(1),
  type: z.enum([
    "approve",
    "reject",
    "assign",
    "update_status",
    "export",
    "archive",
    "send_notification",
    "request_documents"
  ]),
  applicationIds: z.array(z.string().min(1)).min(1).max(50), // Max 50 at once
  performedBy: z.string().min(1),
  performedAt: z.number().int().positive(),
  status: z.enum(["queued", "processing", "completed", "failed", "partial"]),
  parameters: z.record(z.string(), z.unknown()).optional(),
  progress: z.object({
    total: z.number().int().nonnegative(),
    processed: z.number().int().nonnegative(),
    successful: z.number().int().nonnegative(),
    failed: z.number().int().nonnegative(),
  }),
  results: z.array(z.object({
    applicationId: z.string(),
    success: z.boolean(),
    error: z.string().optional(),
    data: z.unknown().optional(),
  })).default([]),
  completedAt: z.number().int().positive().optional(),
  errorMessage: z.string().optional(),
});

export type BulkOperation = z.infer<typeof BulkOperationSchema>;

/**
 * Export Configuration Schema
 */
export const ExportConfigSchema = z.object({
  exportId: z.string().min(1),
  format: z.enum(["csv", "excel", "pdf", "json"]),
  type: z.enum([
    "applications",
    "analytics",
    "transactions",
    "reports",
    "audit_log"
  ]),
  filters: z.record(z.string(), z.unknown()).optional(),
  columns: z.array(z.string()).optional(), // Selected columns
  includeDocuments: z.boolean().default(false),
  includeImages: z.boolean().default(false),
  dateRange: z.object({
    start: z.number().int().positive(),
    end: z.number().int().positive(),
  }).optional(),
  createdBy: z.string().min(1),
  createdAt: z.number().int().positive(),
  status: z.enum(["pending", "processing", "completed", "failed"]),
  downloadUrl: z.string().url().optional(),
  expiresAt: z.number().int().positive().optional(),
  fileSize: z.number().nonnegative().optional(),
});

export type ExportConfig = z.infer<typeof ExportConfigSchema>;

/**
 * External API Integration Schema
 */
export const ExternalAPIConfigSchema = z.object({
  apiId: z.string().min(1),
  provider: z.enum([
    "credit_bureau",
    "kyc_provider",
    "bank_verification",
    "company_registry",
    "tax_authority",
    "ocr_service",
    "email_service",
    "sms_service"
  ]),
  endpoint: z.string().url(),
  method: z.enum(["GET", "POST", "PUT", "DELETE"]),
  headers: z.record(z.string(), z.string()).optional(),
  authentication: z.object({
    type: z.enum(["api_key", "bearer_token", "oauth2", "basic"]),
    credentials: z.record(z.string(), z.string()),
  }),
  rateLimit: z.object({
    requestsPerMinute: z.number().int().positive(),
    requestsPerDay: z.number().int().positive().optional(),
  }).optional(),
  timeout: z.number().int().positive().default(30000), // milliseconds
  retryPolicy: z.object({
    maxRetries: z.number().int().nonnegative().default(3),
    backoffMultiplier: z.number().positive().default(2),
    initialDelay: z.number().int().positive().default(1000),
  }).optional(),
  isActive: z.boolean().default(true),
  createdAt: z.number().int().positive(),
  updatedAt: z.number().int().positive(),
});

export type ExternalAPIConfig = z.infer<typeof ExternalAPIConfigSchema>;

/**
 * API Call Log Schema
 */
export const APICallLogSchema = z.object({
  logId: z.string().min(1),
  apiId: z.string().min(1),
  provider: z.string(),
  endpoint: z.string(),
  method: z.string(),
  requestBody: z.unknown().optional(),
  responseStatus: z.number().int(),
  responseBody: z.unknown().optional(),
  duration: z.number().nonnegative(), // milliseconds
  success: z.boolean(),
  errorMessage: z.string().optional(),
  timestamp: z.number().int().positive(),
  applicationId: z.string().optional(),
  userId: z.string().optional(),
});

export type APICallLog = z.infer<typeof APICallLogSchema>;

/**
 * Credit Bureau Response Schema
 */
export const CreditBureauResponseSchema = z.object({
  requestId: z.string().min(1),
  applicantId: z.string().min(1),
  bvn: z.string(),
  creditScore: z.number().int().min(300).max(850),
  creditRating: z.enum(["A", "B", "C", "D", "E"]),
  reportDate: z.number().int().positive(),
  accountSummary: z.object({
    totalAccounts: z.number().int().nonnegative(),
    activeAccounts: z.number().int().nonnegative(),
    closedAccounts: z.number().int().nonnegative(),
    defaultedAccounts: z.number().int().nonnegative(),
  }),
  creditHistory: z.array(z.object({
    lender: z.string(),
    accountType: z.string(),
    openDate: z.number().int().positive(),
    status: z.string(),
    balance: z.number().nonnegative(),
    monthlyPayment: z.number().nonnegative().optional(),
    lastPaymentDate: z.number().int().positive().optional(),
  })),
  enquiries: z.array(z.object({
    date: z.number().int().positive(),
    institution: z.string(),
    purpose: z.string(),
  })),
  riskFlags: z.array(z.string()),
  recommendation: z.string().optional(),
});

export type CreditBureauResponse = z.infer<typeof CreditBureauResponseSchema>;

/**
 * KYC Verification Response Schema
 */
export const KYCVerificationResponseSchema = z.object({
  verificationId: z.string().min(1),
  applicantId: z.string().min(1),
  verificationType: z.enum([
    "bvn",
    "nin",
    "drivers_license",
    "passport",
    "company_registration",
    "tax_id"
  ]),
  status: z.enum(["verified", "failed", "pending", "manual_review"]),
  verifiedAt: z.number().int().positive(),
  details: z.object({
    fullName: z.string(),
    dateOfBirth: z.string().optional(),
    address: z.string().optional(),
    phoneNumber: z.string().optional(),
    email: z.string().email().optional(),
    nationality: z.string().optional(),
    photoUrl: z.string().url().optional(),
  }),
  matchScore: z.number().min(0).max(100), // Percentage match
  discrepancies: z.array(z.string()),
  rawResponse: z.unknown().optional(),
});

export type KYCVerificationResponse = z.infer<typeof KYCVerificationResponseSchema>;

/**
 * Document OCR Result Schema
 */
export const DocumentOCRResultSchema = z.object({
  ocrId: z.string().min(1),
  documentId: z.string().min(1),
  documentType: z.string(),
  processedAt: z.number().int().positive(),
  confidence: z.number().min(0).max(100),
  extractedData: z.record(z.string(), z.unknown()),
  detectedFields: z.array(z.object({
    fieldName: z.string(),
    value: z.string(),
    confidence: z.number().min(0).max(100),
    boundingBox: z.object({
      x: z.number(),
      y: z.number(),
      width: z.number(),
      height: z.number(),
    }).optional(),
  })),
  validationErrors: z.array(z.string()),
  requiresManualReview: z.boolean(),
  rawResponse: z.unknown().optional(),
});

export type DocumentOCRResult = z.infer<typeof DocumentOCRResultSchema>;

/**
 * Automated Workflow Schema
 */
export const AutomatedWorkflowSchema = z.object({
  workflowId: z.string().min(1),
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  trigger: z.enum([
    "application_submitted",
    "document_uploaded",
    "status_changed",
    "amount_threshold",
    "time_based",
    "manual"
  ]),
  conditions: z.array(z.object({
    field: z.string(),
    operator: z.enum(["equals", "not_equals", "greater_than", "less_than", "contains", "in"]),
    value: z.unknown(),
  })),
  actions: z.array(z.object({
    type: z.enum([
      "send_notification",
      "assign_reviewer",
      "request_documents",
      "update_status",
      "create_task",
      "call_api",
      "generate_report"
    ]),
    parameters: z.record(z.string(), z.unknown()),
    delay: z.number().int().nonnegative().optional(), // delay in seconds
  })),
  isActive: z.boolean().default(true),
  priority: z.number().int().min(1).max(10).default(5),
  createdBy: z.string().min(1),
  createdAt: z.number().int().positive(),
  updatedAt: z.number().int().positive(),
  lastTriggered: z.number().int().positive().optional(),
  executionCount: z.number().int().nonnegative().default(0),
});

export type AutomatedWorkflow = z.infer<typeof AutomatedWorkflowSchema>;

/**
 * Scheduled Report Schema
 */
export const ScheduledReportSchema = z.object({
  reportId: z.string().min(1),
  name: z.string().min(1).max(100),
  reportType: z.enum([
    "daily_summary",
    "weekly_analytics",
    "monthly_performance",
    "quarterly_review",
    "custom"
  ]),
  schedule: z.object({
    frequency: z.enum(["daily", "weekly", "monthly", "quarterly"]),
    dayOfWeek: z.number().int().min(0).max(6).optional(), // 0 = Sunday
    dayOfMonth: z.number().int().min(1).max(31).optional(),
    hour: z.number().int().min(0).max(23).default(9), // 9 AM
    timezone: z.string().default("Africa/Lagos"),
  }),
  recipients: z.array(z.string().email()).min(1),
  format: z.enum(["pdf", "excel", "html"]),
  includeCharts: z.boolean().default(true),
  filters: z.record(z.string(), z.unknown()).optional(),
  isActive: z.boolean().default(true),
  createdBy: z.string().min(1),
  createdAt: z.number().int().positive(),
  lastRun: z.number().int().positive().optional(),
  nextRun: z.number().int().positive().optional(),
});

export type ScheduledReport = z.infer<typeof ScheduledReportSchema>;
