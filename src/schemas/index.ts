/**
 * Centralized Schema Exports
 * Import schemas from here for consistency across the application
 */

// Business profile schemas
export {
  businessProfileSchema,
  businessKycDocumentSchema,
  businessKycDocumentTypes,
  requiredBusinessKycDocuments,
  businessKycDocumentLabels,
  type BusinessProfile,
  type BusinessKycDocument,
  type BusinessKycDocumentType,
} from "./business-profile.schema";

// Application schemas
export {
  applicationDataSchema,
  applicationUpdateSchema,
  applicationCreateSchema,
  applicationStatusSchema,
  type ApplicationData,
} from "./application.schema";

// Investor schemas
export {
  investorProfileSchema,
  individualInvestorSchema,
  corporateInvestorSchema,
  investorProfileUpdateSchema,
  investmentSchema,
  allocationRequestSchema,
  type InvestorProfile,
  type IndividualInvestor,
  type CorporateInvestor,
  type Investment,
  type AllocationRequest,
} from "./investor.schema";

// Opportunity schemas
export {
  opportunitySchema,
  investmentTransactionSchema,
  type OpportunityFormData,
  type InvestmentTransaction,
} from "./opportunity.schema";

// Revenue and financial schemas
export {
  revenueReportSchema,
  financialMetricsSchema,
  calculateProfitDistribution,
  calculateFinancialMetrics,
  type RevenueReport,
  type FinancialMetrics,
} from "./revenue.schema";

// Transaction schemas
export {
  transactionSchema,
  transactionTypeSchema,
  transactionStatusSchema,
  type Transaction,
  type TransactionType,
  type TransactionStatus,
} from "./transaction.schema";

// Notification schemas
export {
  notificationSchema,
  notificationPreferencesSchema,
  type Notification,
  type NotificationPreferences,
} from "./notification.schema";

// Document schemas
export {
  documentSchema,
  documentUploadSchema,
  uploadDocumentSchema,
  type Document,
  type DocumentUpload,
} from "./document.schema";

// Wallet schemas
export {
  walletSchema,
  depositRequestSchema,
  withdrawalRequestSchema,
  type Wallet,
  type DepositRequest,
  type WithdrawalRequest,
} from "./wallet.schema";

// Profit distribution schemas
export {
  profitDistributionSchema,
  investorDistributionSchema,
  type ProfitDistribution,
  type InvestorDistribution,
} from "./profit-distribution.schema";

// Phase 2: Assignment and workflow schemas
export {
  AssignmentSchema,
  AdminProfileSchema,
  ReviewQueueItemSchema,
  AssignmentHistorySchema,
  WorkloadStatsSchema,
  type Assignment,
  type AdminProfile,
  type ReviewQueueItem,
  type AssignmentHistory,
  type WorkloadStats,
} from "./assignment.schema";

export {
  AdminPermissionsSchema,
  RolePermissionsMap,
  AdminActionLogSchema,
  DualAuthorizationSchema,
  AdminSessionSchema,
  getPermissionsForRole,
  hasPermission,
  canApproveAmount,
  isWithinBusinessHours,
  canApproveHighValue,
  validateSeparationOfDuties,
  requiresDualAuthorization,
  type AdminPermissions,
  type AdminActionLog,
  type DualAuthorization,
  type AdminSession,
} from "./admin-roles.schema";

// Phase 2: Messaging and collaboration schemas
export {
  MessageSchema,
  MessageThreadSchema,
  MessageTemplateSchema,
  InternalNoteSchema,
  NotificationPreferencesSchema,
  CollaborationRequestSchema,
  type Message,
  type MessageThread,
  type MessageTemplate,
  type InternalNote,
  type CollaborationRequest,
} from "./message.schema";

// Phase 3: Analytics and intelligence schemas
export {
  ApplicationAnalyticsSchema,
  SearchFiltersSchema,
  AutomatedInsightSchema,
  BulkActionSchema,
  ApplicationComparisonSchema,
  type ApplicationAnalytics,
  type SearchFilters,
  type AutomatedInsight,
  type BulkAction,
  type ApplicationComparison,
} from "./analytics.schema";

// Phase 4: Integration and automation schemas
export {
  BulkOperationSchema,
  ExportConfigSchema,
  ExternalAPIConfigSchema,
  APICallLogSchema,
  CreditBureauResponseSchema,
  KYCVerificationResponseSchema,
  DocumentOCRResultSchema,
  AutomatedWorkflowSchema,
  ScheduledReportSchema,
  type BulkOperation,
  type ExportConfig,
  type ExternalAPIConfig,
  type APICallLog,
  type CreditBureauResponse,
  type KYCVerificationResponse,
  type DocumentOCRResult,
  type AutomatedWorkflow,
  type ScheduledReport,
} from "./integrations.schema";

// Platform message schemas
export {
  platformMessageSchema,
  financialReportReviewSchema,
  sendMessageSchema,
  messageResponseSchema,
  type PlatformMessage,
  type FinancialReportReview,
  type SendMessageRequest,
  type MessageResponse,
} from "./platform-message.schema";
