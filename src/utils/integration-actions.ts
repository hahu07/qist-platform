import { listDocs, setDoc, getDoc } from "@junobuild/core";
import {
  BulkOperation,
  ExportConfig,
  ExternalAPIConfig,
  APICallLog,
  CreditBureauResponse,
  KYCVerificationResponse,
  DocumentOCRResult,
  AutomatedWorkflow,
  ScheduledReport,
} from "@/schemas/integrations.schema";
import type { ApplicationData } from "@/schemas/application.schema";

/**
 * Execute bulk operation on multiple applications
 */
export async function executeBulkOperation(
  type: BulkOperation["type"],
  applicationIds: string[],
  userId: string,
  parameters?: Record<string, unknown>
): Promise<BulkOperation> {
  const operationId = `bulk_${type}_${Date.now()}`;
  const timestamp = Date.now();

  // Create operation record
  const operation: BulkOperation = {
    operationId,
    type,
    applicationIds,
    performedBy: userId,
    performedAt: timestamp,
    status: "processing",
    parameters,
    progress: {
      total: applicationIds.length,
      processed: 0,
      successful: 0,
      failed: 0,
    },
    results: [],
  };

  // Save initial operation state
  await setDoc({
    collection: "bulk_operations",
    doc: {
      key: operationId,
      data: operation,
    },
  });

  // Process each application
  const results: BulkOperation["results"] = [];
  
  for (const appId of applicationIds) {
    try {
      let success = false;
      let error: string | undefined;
      let data: unknown;

      switch (type) {
        case "approve":
          await updateApplicationStatus(appId, "approved", userId);
          success = true;
          break;

        case "reject":
          const reason = (parameters?.reason as string) || "Bulk rejection";
          await updateApplicationStatus(appId, "rejected", userId, reason);
          success = true;
          break;

        case "assign":
          const assigneeId = parameters?.assigneeId as string;
          if (!assigneeId) throw new Error("Assignee ID required");
          await assignApplication(appId, assigneeId, userId);
          success = true;
          break;

        case "update_status":
          const newStatus = parameters?.status as ApplicationData["status"];
          if (!newStatus) throw new Error("Status required");
          await updateApplicationStatus(appId, newStatus, userId);
          success = true;
          break;

        case "export":
          // Export will be handled separately
          success = true;
          break;

        case "archive":
          await archiveApplication(appId, userId);
          success = true;
          break;

        case "send_notification":
          const message = parameters?.message as string;
          await sendBulkNotification(appId, message || "Notification from admin");
          success = true;
          break;

        case "request_documents":
          const documents = parameters?.documents as string[];
          await requestDocuments(appId, documents || [], userId);
          success = true;
          break;

        default:
          throw new Error(`Unknown operation type: ${type}`);
      }

      results.push({ applicationId: appId, success, data });
      operation.progress.successful++;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      results.push({
        applicationId: appId,
        success: false,
        error: errorMessage,
      });
      operation.progress.failed++;
    }

    operation.progress.processed++;

    // Update progress periodically
    if (operation.progress.processed % 5 === 0 || operation.progress.processed === applicationIds.length) {
      await setDoc({
        collection: "bulk_operations",
        doc: {
          key: operationId,
          data: {
            ...operation,
            results,
            status: operation.progress.processed === applicationIds.length ? "completed" : "processing",
            completedAt: operation.progress.processed === applicationIds.length ? Date.now() : undefined,
          },
        },
      });
    }
  }

  // Final update
  operation.results = results;
  operation.status = operation.progress.failed === 0 ? "completed" : "partial";
  operation.completedAt = Date.now();

  await setDoc({
    collection: "bulk_operations",
    doc: {
      key: operationId,
      data: operation,
    },
  });

  return operation;
}

/**
 * Create and process export request
 */
export async function createExport(
  format: ExportConfig["format"],
  type: ExportConfig["type"],
  userId: string,
  filters?: Record<string, unknown>,
  options?: {
    columns?: string[];
    includeDocuments?: boolean;
    includeImages?: boolean;
    dateRange?: { start: number; end: number };
  }
): Promise<ExportConfig> {
  const exportId = `export_${type}_${Date.now()}`;
  const timestamp = Date.now();

  const exportConfig: ExportConfig = {
    exportId,
    format,
    type,
    filters,
    columns: options?.columns,
    includeDocuments: options?.includeDocuments || false,
    includeImages: options?.includeImages || false,
    dateRange: options?.dateRange,
    createdBy: userId,
    createdAt: timestamp,
    status: "pending",
  };

  await setDoc({
    collection: "exports",
    doc: {
      key: exportId,
      data: exportConfig,
    },
  });

  // In production, this would trigger background job
  // For now, simulate processing
  setTimeout(async () => {
    try {
      const data = await fetchDataForExport(type, filters, options?.dateRange);
      const fileUrl = await generateExportFile(format, data, options?.columns);
      const fileSize = await getFileSize(fileUrl);

      await setDoc({
        collection: "exports",
        doc: {
          key: exportId,
          data: {
            ...exportConfig,
            status: "completed",
            downloadUrl: fileUrl,
            fileSize,
            expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
          },
        },
      });
    } catch (error) {
      await setDoc({
        collection: "exports",
        doc: {
          key: exportId,
          data: {
            ...exportConfig,
            status: "failed",
          },
        },
      });
    }
  }, 100);

  return exportConfig;
}

/**
 * Call external API with logging and retry logic
 */
export async function callExternalAPI<T = unknown>(
  apiConfig: ExternalAPIConfig,
  endpoint: string,
  data?: unknown,
  applicationId?: string,
  userId?: string
): Promise<T> {
  const logId = `api_log_${Date.now()}`;
  const startTime = Date.now();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...apiConfig.headers,
  };

  // Add authentication
  switch (apiConfig.authentication.type) {
    case "api_key":
      headers["X-API-Key"] = apiConfig.authentication.credentials.apiKey;
      break;
    case "bearer_token":
      headers["Authorization"] = `Bearer ${apiConfig.authentication.credentials.token}`;
      break;
    case "basic":
      const credentials = btoa(
        `${apiConfig.authentication.credentials.username}:${apiConfig.authentication.credentials.password}`
      );
      headers["Authorization"] = `Basic ${credentials}`;
      break;
  }

  let attempt = 0;
  const maxRetries = apiConfig.retryPolicy?.maxRetries || 3;
  let lastError: Error | null = null;

  while (attempt <= maxRetries) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), apiConfig.timeout);

      const response = await fetch(`${apiConfig.endpoint}${endpoint}`, {
        method: apiConfig.method,
        headers,
        body: data ? JSON.stringify(data) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const duration = Date.now() - startTime;
      const responseBody = await response.json();

      // Log the API call
      const log: APICallLog = {
        logId,
        apiId: apiConfig.apiId,
        provider: apiConfig.provider,
        endpoint,
        method: apiConfig.method,
        requestBody: data,
        responseStatus: response.status,
        responseBody,
        duration,
        success: response.ok,
        errorMessage: response.ok ? undefined : responseBody.error || "API call failed",
        timestamp: Date.now(),
        applicationId,
        userId,
      };

      await setDoc({
        collection: "api_logs",
        doc: {
          key: logId,
          data: log,
        },
      });

      if (!response.ok) {
        throw new Error(`API call failed: ${response.status} ${response.statusText}`);
      }

      return responseBody as T;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error("Unknown error");
      attempt++;

      if (attempt <= maxRetries) {
        const delay = (apiConfig.retryPolicy?.initialDelay || 1000) * 
                     Math.pow(apiConfig.retryPolicy?.backoffMultiplier || 2, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  // All retries failed
  const duration = Date.now() - startTime;
  await setDoc({
    collection: "api_logs",
    doc: {
      key: logId,
      data: {
        logId,
        apiId: apiConfig.apiId,
        provider: apiConfig.provider,
        endpoint,
        method: apiConfig.method,
        requestBody: data,
        responseStatus: 0,
        duration,
        success: false,
        errorMessage: lastError?.message || "All retries failed",
        timestamp: Date.now(),
        applicationId,
        userId,
      },
    },
  });

  throw lastError || new Error("API call failed after all retries");
}

/**
 * Fetch credit bureau report
 */
export async function fetchCreditReport(
  applicantId: string,
  bvn: string,
  userId: string
): Promise<CreditBureauResponse> {
  // Get credit bureau API config
  const apiConfig = await getAPIConfig("credit_bureau");

  const response = await callExternalAPI<CreditBureauResponse>(
    apiConfig,
    "/credit-report",
    { bvn, applicantId },
    applicantId,
    userId
  );

  // Save credit report
  await setDoc({
    collection: "credit_reports",
    doc: {
      key: `credit_${applicantId}_${Date.now()}`,
      data: response,
    },
  });

  return response;
}

/**
 * Verify KYC details
 */
export async function verifyKYC(
  applicantId: string,
  verificationType: KYCVerificationResponse["verificationType"],
  identificationNumber: string,
  userId: string
): Promise<KYCVerificationResponse> {
  const apiConfig = await getAPIConfig("kyc_provider");

  const response = await callExternalAPI<KYCVerificationResponse>(
    apiConfig,
    "/verify",
    {
      applicantId,
      verificationType,
      identificationNumber,
    },
    applicantId,
    userId
  );

  // Save verification result
  await setDoc({
    collection: "kyc_verifications",
    doc: {
      key: `kyc_${applicantId}_${Date.now()}`,
      data: response,
    },
  });

  return response;
}

/**
 * Process document with OCR
 */
export async function processDocumentOCR(
  documentId: string,
  documentType: string,
  documentUrl: string,
  applicationId?: string
): Promise<DocumentOCRResult> {
  const apiConfig = await getAPIConfig("ocr_service");

  const response = await callExternalAPI<DocumentOCRResult>(
    apiConfig,
    "/process",
    {
      documentId,
      documentType,
      documentUrl,
    },
    applicationId
  );

  // Save OCR result
  await setDoc({
    collection: "ocr_results",
    doc: {
      key: `ocr_${documentId}_${Date.now()}`,
      data: response,
    },
  });

  return response;
}

/**
 * Execute automated workflow
 */
export async function executeWorkflow(
  workflow: AutomatedWorkflow,
  applicationId: string,
  applicationData: ApplicationData
): Promise<void> {
  // Check if conditions are met
  const conditionsMet = workflow.conditions.every((condition) => {
    const fieldValue = getFieldValue(applicationData, condition.field);
    return evaluateCondition(fieldValue, condition.operator, condition.value);
  });

  if (!conditionsMet) {
    return;
  }

  // Execute actions sequentially
  for (const action of workflow.actions) {
    const delay = action.delay || 0;
    if (delay > 0) {
      await new Promise(resolve => setTimeout(resolve, delay * 1000));
    }

    try {
      switch (action.type) {
        case "send_notification":
          await sendBulkNotification(
            applicationId,
            action.parameters.message as string
          );
          break;

        case "assign_reviewer":
          await assignApplication(
            applicationId,
            action.parameters.reviewerId as string,
            workflow.createdBy
          );
          break;

        case "request_documents":
          await requestDocuments(
            applicationId,
            action.parameters.documents as string[],
            workflow.createdBy
          );
          break;

        case "update_status":
          await updateApplicationStatus(
            applicationId,
            action.parameters.status as ApplicationData["status"],
            workflow.createdBy
          );
          break;

        case "create_task":
          // Create task logic
          break;

        case "call_api":
          const apiConfig = await getAPIConfig(action.parameters.provider as ExternalAPIConfig["provider"]);
          await callExternalAPI(
            apiConfig,
            action.parameters.endpoint as string,
            action.parameters.data
          );
          break;

        case "generate_report":
          // Generate report logic
          break;
      }
    } catch (error) {
      console.error(`Workflow action failed: ${action.type}`, error);
      // Continue with other actions even if one fails
    }
  }

  // Update workflow execution stats
  await setDoc({
    collection: "workflows",
    doc: {
      key: workflow.workflowId,
      data: {
        ...workflow,
        lastTriggered: Date.now(),
        executionCount: workflow.executionCount + 1,
      },
    },
  });
}

/**
 * Schedule report generation
 */
export async function scheduleReport(
  reportConfig: Omit<ScheduledReport, "reportId" | "createdAt" | "nextRun">,
  userId: string
): Promise<ScheduledReport> {
  const reportId = `report_${Date.now()}`;
  const nextRun = calculateNextRun(reportConfig.schedule);

  const report: ScheduledReport = {
    ...reportConfig,
    reportId,
    createdBy: userId,
    createdAt: Date.now(),
    nextRun,
  };

  await setDoc({
    collection: "scheduled_reports",
    doc: {
      key: reportId,
      data: report,
    },
  });

  return report;
}

/**
 * Helper: Get API configuration
 */
async function getAPIConfig(provider: ExternalAPIConfig["provider"]): Promise<ExternalAPIConfig> {
  const configs = await listDocs<ExternalAPIConfig>({
    collection: "api_configs",
  });

  const activeConfig = configs.items.find(
    (item) => item.data.provider === provider && item.data.isActive
  );

  if (!activeConfig) {
    throw new Error(`No active API configuration found for provider: ${provider}`);
  }

  return activeConfig.data;
}

/**
 * Helper: Update application status
 */
async function updateApplicationStatus(
  applicationId: string,
  status: ApplicationData["status"],
  userId: string,
  notes?: string
): Promise<void> {
  const doc = await getDoc<ApplicationData>({
    collection: "business_applications",
    key: applicationId,
  });

  if (!doc) throw new Error("Application not found");

  await setDoc({
    collection: "business_applications",
    doc: {
      key: applicationId,
      data: {
        ...doc.data,
        status,
        dueDiligenceNotes: notes || doc.data.dueDiligenceNotes,
        reviewedBy: userId,
        reviewedAt: Date.now().toString(),
      },
      version: doc.version,
    },
  });
}

/**
 * Helper: Assign application to reviewer
 */
async function assignApplication(
  applicationId: string,
  assigneeId: string,
  assignedBy: string
): Promise<void> {
  await setDoc({
    collection: "assignments",
    doc: {
      key: `assignment_${applicationId}_${Date.now()}`,
      data: {
        assignmentId: `assignment_${applicationId}_${Date.now()}`,
        applicationId,
        assigneeId,
        assignedBy,
        assignedAt: Date.now(),
        status: "pending",
        priority: "medium",
        type: "review",
      },
    },
  });
}

/**
 * Helper: Archive application
 */
async function archiveApplication(applicationId: string, userId: string): Promise<void> {
  await updateApplicationStatus(applicationId, "rejected", userId, "Archived by bulk operation");
}

/**
 * Helper: Send bulk notification
 */
async function sendBulkNotification(applicationId: string, message: string): Promise<void> {
  await setDoc({
    collection: "notifications",
    doc: {
      key: `notification_${applicationId}_${Date.now()}`,
      data: {
        notificationId: `notification_${applicationId}_${Date.now()}`,
        userId: applicationId,
        type: "system",
        title: "Bulk Operation Notification",
        message,
        isRead: false,
        createdAt: Date.now(),
      },
    },
  });
}

/**
 * Helper: Request documents
 */
async function requestDocuments(
  applicationId: string,
  documents: string[],
  requestedBy: string
): Promise<void> {
  for (const docType of documents) {
    await setDoc({
      collection: "notifications",
      doc: {
        key: `doc_request_${applicationId}_${Date.now()}`,
        data: {
          notificationId: `doc_request_${applicationId}_${Date.now()}`,
          userId: applicationId,
          type: "document_request",
          title: "Document Required",
          message: `Please upload: ${docType}`,
          isRead: false,
          createdAt: Date.now(),
        },
      },
    });
  }
}

/**
 * Helper: Fetch data for export
 */
async function fetchDataForExport(
  type: ExportConfig["type"],
  filters?: Record<string, unknown>,
  dateRange?: { start: number; end: number }
): Promise<unknown[]> {
  // Implementation would fetch data based on type and filters
  return [];
}

/**
 * Helper: Generate export file
 */
async function generateExportFile(
  format: ExportConfig["format"],
  data: unknown[],
  columns?: string[]
): Promise<string> {
  // Implementation would generate file and return URL
  return `https://example.com/exports/file.${format}`;
}

/**
 * Helper: Get file size
 */
async function getFileSize(url: string): Promise<number> {
  // Implementation would check file size
  return 1024000; // 1MB
}

/**
 * Helper: Get field value from nested object
 */
function getFieldValue(obj: Record<string, unknown>, path: string): unknown {
  return path.split(".").reduce((acc, part) => {
    return acc && typeof acc === "object" ? (acc as Record<string, unknown>)[part] : undefined;
  }, obj as unknown);
}

/**
 * Helper: Evaluate condition
 */
function evaluateCondition(
  fieldValue: unknown,
  operator: string,
  compareValue: unknown
): boolean {
  switch (operator) {
    case "equals":
      return fieldValue === compareValue;
    case "not_equals":
      return fieldValue !== compareValue;
    case "greater_than":
      return Number(fieldValue) > Number(compareValue);
    case "less_than":
      return Number(fieldValue) < Number(compareValue);
    case "contains":
      return String(fieldValue).includes(String(compareValue));
    case "in":
      return Array.isArray(compareValue) && compareValue.includes(fieldValue);
    default:
      return false;
  }
}

/**
 * Helper: Calculate next run time
 */
function calculateNextRun(schedule: ScheduledReport["schedule"]): number {
  const now = new Date();
  const next = new Date(now);

  switch (schedule.frequency) {
    case "daily":
      next.setDate(next.getDate() + 1);
      break;
    case "weekly":
      const daysUntilNext = ((schedule.dayOfWeek || 0) - next.getDay() + 7) % 7 || 7;
      next.setDate(next.getDate() + daysUntilNext);
      break;
    case "monthly":
      next.setMonth(next.getMonth() + 1);
      if (schedule.dayOfMonth) {
        next.setDate(schedule.dayOfMonth);
      }
      break;
    case "quarterly":
      next.setMonth(next.getMonth() + 3);
      break;
  }

  next.setHours(schedule.hour, 0, 0, 0);
  return next.getTime();
}
