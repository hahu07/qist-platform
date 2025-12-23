/**
 * Analytics and Intelligence Actions
 * Phase 3: Generate insights, analytics, and automated recommendations
 */

import { listDocs, type Doc } from "@junobuild/core";
import type {
  ApplicationData,
  ApplicationAnalytics,
  SearchFilters,
  AutomatedInsight,
  Assignment,
} from "@/schemas";

/**
 * Generate application analytics for a time period
 */
export async function generateApplicationAnalytics(
  periodStart: number,
  periodEnd: number
): Promise<ApplicationAnalytics> {
  try {
    // Fetch all applications in period
    const { items: applications } = await listDocs<ApplicationData>({
      collection: "business_applications",
      filter: {
        order: {
          desc: true,
          field: "created_at",
        },
      },
    });

    // Filter by date range
    const periodApplications = applications.filter((app) => {
      const createdAt = Number(app.created_at) / 1000000; // Convert nanoseconds to milliseconds
      return createdAt >= periodStart && createdAt <= periodEnd;
    });

    // Calculate volume metrics
    const totalApplications = periodApplications.length;
    const newApplications = periodApplications.filter(
      (app) => app.data.status === "new"
    ).length;
    const pendingApplications = periodApplications.filter(
      (app) => app.data.status === "review"
    ).length;
    const approvedApplications = periodApplications.filter(
      (app) => app.data.status === "approved"
    ).length;
    const rejectedApplications = periodApplications.filter(
      (app) => app.data.status === "rejected"
    ).length;

    // Calculate approval rate
    const approvalRate =
      approvedApplications + rejectedApplications > 0
        ? (approvedApplications / (approvedApplications + rejectedApplications)) * 100
        : 0;

    // Calculate average approval time (mock - would need timestamps in production)
    const averageApprovalTime = 48; // hours
    const medianApprovalTime = 36;

    // Calculate financial metrics
    const totalRequestedAmount = periodApplications.reduce(
      (sum, app) => sum + (app.data.requestedAmount || 0),
      0
    );
    const approvedApps = periodApplications.filter(
      (app) => app.data.status === "approved"
    );
    const totalApprovedAmount = approvedApps.reduce(
      (sum, app) => sum + (app.data.requestedAmount || 0),
      0
    );
    const averageRequestAmount =
      totalApplications > 0 ? totalRequestedAmount / totalApplications : 0;
    const averageApprovedAmount =
      approvedApplications > 0 ? totalApprovedAmount / approvedApplications : 0;

    // Calculate quality metrics
    const scoresSum = periodApplications.reduce(
      (sum, app) => sum + (app.data.dueDiligenceScore || 0),
      0
    );
    const averageDueDiligenceScore =
      totalApplications > 0 ? scoresSum / totalApplications : 0;

    // Risk distribution (mock - would need actual risk assessment data)
    const riskDistribution = {
      low: Math.floor(totalApplications * 0.3),
      medium: Math.floor(totalApplications * 0.5),
      high: Math.floor(totalApplications * 0.2),
    };

    // Industry breakdown
    const industryMap = new Map<
      string,
      { count: number; approvals: number; totalAmount: number }
    >();
    periodApplications.forEach((app) => {
      const industry = app.data.industry;
      const existing = industryMap.get(industry) || {
        count: 0,
        approvals: 0,
        totalAmount: 0,
      };
      existing.count++;
      if (app.data.status === "approved") existing.approvals++;
      existing.totalAmount += app.data.requestedAmount || 0;
      industryMap.set(industry, existing);
    });

    const industryBreakdown = Array.from(industryMap.entries()).map(
      ([industry, data]) => ({
        industry,
        count: data.count,
        approvalRate: data.count > 0 ? (data.approvals / data.count) * 100 : 0,
        totalAmount: data.totalAmount,
      })
    );

    // Contract type breakdown
    const contractTypeMap = new Map<
      string,
      { count: number; totalAmount: number }
    >();
    periodApplications.forEach((app) => {
      const contractType = app.data.contractType;
      const existing = contractTypeMap.get(contractType) || {
        count: 0,
        totalAmount: 0,
      };
      existing.count++;
      existing.totalAmount += app.data.requestedAmount || 0;
      contractTypeMap.set(contractType, existing);
    });

    const contractTypeBreakdown = Array.from(contractTypeMap.entries()).map(
      ([contractType, data]) => ({
        contractType,
        count: data.count,
        totalAmount: data.totalAmount,
      })
    );

    // SLA compliance (mock - would need actual SLA tracking)
    const slaCompliance = {
      onTime: Math.floor(totalApplications * 0.7),
      delayed: Math.floor(totalApplications * 0.2),
      breached: Math.floor(totalApplications * 0.1),
      complianceRate: 70,
    };

    // Admin performance (mock - would need actual assignment data)
    const adminPerformance = [
      {
        adminId: "admin_001",
        adminName: "Admin User",
        reviewedCount: Math.floor(totalApplications * 0.4),
        approvalRate: 65,
        averageReviewTime: 42,
        workloadUtilization: 80,
      },
    ];

    return {
      periodStart,
      periodEnd,
      totalApplications,
      newApplications,
      pendingApplications,
      approvedApplications,
      rejectedApplications,
      approvalRate,
      averageApprovalTime,
      medianApprovalTime,
      totalRequestedAmount,
      totalApprovedAmount,
      averageRequestAmount,
      averageApprovedAmount,
      averageDueDiligenceScore,
      riskDistribution,
      industryBreakdown,
      contractTypeBreakdown,
      slaCompliance,
      adminPerformance,
      generatedAt: Date.now(),
    };
  } catch (error) {
    console.error("Error generating analytics:", error);
    throw new Error("Failed to generate analytics");
  }
}

/**
 * Advanced search and filter applications
 */
export async function searchApplications(
  filters: SearchFilters
): Promise<{ items: Doc<ApplicationData>[]; totalCount: number }> {
  try {
    // Fetch all applications
    const { items: allApplications } = await listDocs<ApplicationData>({
      collection: "business_applications",
      filter: {
        order: {
          desc: filters.sortOrder === "desc",
          field: "created_at",
        },
      },
    });

    // Apply filters
    let filtered = allApplications;

    // Text search
    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(
        (app) =>
          app.data.businessName.toLowerCase().includes(term) ||
          app.data.industry.toLowerCase().includes(term) ||
          app.data.registrationNumber.toLowerCase().includes(term)
      );
    }

    // Status filter
    if (filters.statuses && filters.statuses.length > 0) {
      filtered = filtered.filter((app) =>
        filters.statuses!.includes(app.data.status)
      );
    }

    // Amount range
    if (filters.minAmount !== undefined) {
      filtered = filtered.filter(
        (app) => (app.data.requestedAmount || 0) >= filters.minAmount!
      );
    }
    if (filters.maxAmount !== undefined) {
      filtered = filtered.filter(
        (app) => (app.data.requestedAmount || 0) <= filters.maxAmount!
      );
    }

    // Date range
    if (filters.startDate !== undefined) {
      filtered = filtered.filter(
        (app) => Number(app.created_at) / 1000000 >= filters.startDate!
      );
    }
    if (filters.endDate !== undefined) {
      filtered = filtered.filter(
        (app) => Number(app.created_at) / 1000000 <= filters.endDate!
      );
    }

    // Industry filter
    if (filters.industries && filters.industries.length > 0) {
      filtered = filtered.filter((app) =>
        filters.industries!.includes(app.data.industry)
      );
    }

    // Contract type filter
    if (filters.contractTypes && filters.contractTypes.length > 0) {
      filtered = filtered.filter((app) =>
        filters.contractTypes!.includes(app.data.contractType)
      );
    }

    // Due diligence score range
    if (filters.minDueDiligenceScore !== undefined) {
      filtered = filtered.filter(
        (app) =>
          (app.data.dueDiligenceScore || 0) >= filters.minDueDiligenceScore!
      );
    }
    if (filters.maxDueDiligenceScore !== undefined) {
      filtered = filtered.filter(
        (app) =>
          (app.data.dueDiligenceScore || 0) <= filters.maxDueDiligenceScore!
      );
    }

    // Years in operation range
    if (filters.minYearsInOperation !== undefined) {
      filtered = filtered.filter(
        (app) => app.data.yearsInOperation >= filters.minYearsInOperation!
      );
    }
    if (filters.maxYearsInOperation !== undefined) {
      filtered = filtered.filter(
        (app) => app.data.yearsInOperation <= filters.maxYearsInOperation!
      );
    }

    // Sorting
    if (filters.sortBy) {
      filtered = filtered.sort((a, b) => {
        let aVal: any;
        let bVal: any;

        switch (filters.sortBy) {
          case "business_name":
            aVal = a.data.businessName.toLowerCase();
            bVal = b.data.businessName.toLowerCase();
            break;
          case "requested_amount":
            aVal = a.data.requestedAmount || 0;
            bVal = b.data.requestedAmount || 0;
            break;
          case "due_diligence_score":
            aVal = a.data.dueDiligenceScore || 0;
            bVal = b.data.dueDiligenceScore || 0;
            break;
          case "status":
            aVal = a.data.status;
            bVal = b.data.status;
            break;
          default:
            aVal = a.created_at;
            bVal = b.created_at;
        }

        if (filters.sortOrder === "asc") {
          return aVal > bVal ? 1 : -1;
        } else {
          return aVal < bVal ? 1 : -1;
        }
      });
    }

    // Pagination
    const totalCount = filtered.length;
    const startIndex = (filters.page - 1) * filters.pageSize;
    const endIndex = startIndex + filters.pageSize;
    const paginatedItems = filtered.slice(startIndex, endIndex);

    return {
      items: paginatedItems,
      totalCount,
    };
  } catch (error) {
    console.error("Error searching applications:", error);
    throw new Error("Failed to search applications");
  }
}

/**
 * Generate automated insights for an application
 */
export async function generateInsights(
  applicationId: string,
  applicationData: ApplicationData
): Promise<AutomatedInsight[]> {
  const insights: AutomatedInsight[] = [];
  const timestamp = Date.now();

  // Risk alert: High requested amount with low years in operation
  if (
    (applicationData.requestedAmount || 0) > 10000000 &&
    applicationData.yearsInOperation < 2
  ) {
    insights.push({
      insightId: `insight_${applicationId}_high_risk_${timestamp}`,
      applicationId,
      type: "risk_alert",
      severity: "high",
      title: "High Amount Request from New Business",
      description: `Business requesting ₦${(applicationData.requestedAmount || 0).toLocaleString()} with only ${applicationData.yearsInOperation} year(s) of operation. Consider enhanced due diligence and higher profit-sharing rate.`,
      affectedFields: ["requestedAmount", "yearsInOperation"],
      suggestedAction:
        "Request additional financial documentation and consider 15%+ profit-sharing rate",
      confidence: 85,
      source: "rule_engine",
      createdAt: timestamp,
    });
  }

  // Opportunity: Low debt-to-equity with good revenue
  if (applicationData.requestedAmount && applicationData.requestedAmount > 5000000) {
    insights.push({
      insightId: `insight_${applicationId}_opportunity_${timestamp}`,
      applicationId,
      type: "opportunity",
      severity: "low",
      title: "Large Funding Request",
      description: `Funding request of ₦${applicationData.requestedAmount.toLocaleString()} indicates significant business needs. Good candidate for Musharakah partnership.`,
      affectedFields: ["requestedAmount"],
      suggestedAction: "Consider offering Musharakah with competitive profit-sharing terms",
      confidence: 78,
      source: "pattern_detection",
      createdAt: timestamp,
    });
  }

  // Anomaly: Missing critical documents
  if (applicationData.documentsStatus === "pending") {
    insights.push({
      insightId: `insight_${applicationId}_compliance_${timestamp}`,
      applicationId,
      type: "compliance",
      severity: "medium",
      title: "Document Verification Pending",
      description:
        "KYC documents are still pending verification. Cannot proceed with approval until all documents are validated.",
      affectedFields: ["documentsStatus"],
      suggestedAction: "Request business to complete document upload or verify pending documents",
      confidence: 100,
      source: "rule_engine",
      createdAt: timestamp,
    });
  }

  // Pattern: Industry-specific recommendation
  if (applicationData.industry === "agriculture" && applicationData.yearsInOperation >= 3) {
    insights.push({
      insightId: `insight_${applicationId}_recommendation_${timestamp}`,
      applicationId,
      type: "recommendation",
      severity: "info",
      title: "Salam Contract Opportunity",
      description:
        "Established agricultural business with 3+ years operation. Consider Salam (forward sale) contract for seasonal financing needs.",
      affectedFields: ["industry", "yearsInOperation"],
      suggestedAction: "Discuss Salam contract terms with business for crop/harvest financing",
      confidence: 72,
      source: "pattern_detection",
      createdAt: timestamp,
    });
  }

  // Risk: Low due diligence score
  if (applicationData.dueDiligenceScore && applicationData.dueDiligenceScore < 50) {
    insights.push({
      insightId: `insight_${applicationId}_risk_score_${timestamp}`,
      applicationId,
      type: "risk_alert",
      severity: "critical",
      title: "Low Due Diligence Score",
      description: `Due diligence score of ${applicationData.dueDiligenceScore}% is below acceptable threshold. Multiple concerns identified during review.`,
      affectedFields: ["dueDiligenceScore"],
      suggestedAction:
        "Reject application or require substantial additional documentation and enhanced monitoring",
      confidence: 92,
      source: "rule_engine",
      createdAt: timestamp,
    });
  }

  return insights;
}

/**
 * Compare multiple applications side-by-side
 */
export async function compareApplications(
  applicationIds: string[]
): Promise<Doc<ApplicationData>[]> {
  try {
    const applications: Doc<ApplicationData>[] = [];

    // Fetch all applications
    const { items: allApplications } = await listDocs<ApplicationData>({
      collection: "business_applications",
    });

    // Filter to only requested IDs
    for (const id of applicationIds) {
      const app = allApplications.find((a) => a.key === id);
      if (app) {
        applications.push(app);
      }
    }

    return applications;
  } catch (error) {
    console.error("Error comparing applications:", error);
    throw new Error("Failed to compare applications");
  }
}

/**
 * Get trending metrics (applications over time)
 */
export function getTrendingMetrics(
  applications: Doc<ApplicationData>[],
  days: number = 30
): { date: string; count: number; amount: number }[] {
  const now = Date.now();
  const startDate = now - days * 24 * 60 * 60 * 1000;

  const dailyMetrics = new Map<string, { count: number; amount: number }>();

  applications.forEach((app) => {
    const createdAt = Number(app.created_at) / 1000000;
    if (createdAt >= startDate) {
      const date = new Date(createdAt).toISOString().split("T")[0];
      const existing = dailyMetrics.get(date) || { count: 0, amount: 0 };
      existing.count++;
      existing.amount += app.data.requestedAmount || 0;
      dailyMetrics.set(date, existing);
    }
  });

  return Array.from(dailyMetrics.entries())
    .map(([date, metrics]) => ({ date, ...metrics }))
    .sort((a, b) => a.date.localeCompare(b.date));
}
