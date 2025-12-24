import { z } from "zod";

/**
 * Admin Permissions Schema
 * Defines granular permissions for different admin operations
 */
export const AdminPermissionsSchema = z.object({
  canViewApplications: z.boolean().default(false),
  canReviewDueDiligence: z.boolean().default(false),
  canRequestChanges: z.boolean().default(false),
  canApprove: z.boolean().default(false),
  approvalLimit: z.number().nonnegative().default(0), // in Naira
  canAssignReviews: z.boolean().default(false),
  canManageAdmins: z.boolean().default(false),
  canAccessSystemConfig: z.boolean().default(false),
  canDistributeProfits: z.boolean().default(false),
  canViewReports: z.boolean().default(false),
  canExportData: z.boolean().default(false),
  canAccessAuditLogs: z.boolean().default(false),
  canManageInvestors: z.boolean().default(false),
});

export type AdminPermissions = z.infer<typeof AdminPermissionsSchema>;

/**
 * Role-based permissions mapping
 * Each role has predefined permissions that cannot be bypassed
 */
export const RolePermissionsMap: Record<string, AdminPermissions> = {
  viewer: {
    canViewApplications: true,
    canReviewDueDiligence: false,
    canRequestChanges: false,
    canApprove: false,
    approvalLimit: 0,
    canAssignReviews: false,
    canManageAdmins: false,
    canAccessSystemConfig: false,
    canDistributeProfits: false,
    canViewReports: true,
    canExportData: false,
    canAccessAuditLogs: false,
    canManageInvestors: false,
  },
  reviewer: {
    canViewApplications: true,
    canReviewDueDiligence: true,
    canRequestChanges: true,
    canApprove: false, // Reviewers can only review, not approve
    approvalLimit: 0,
    canAssignReviews: false,
    canManageAdmins: false,
    canAccessSystemConfig: false,
    canDistributeProfits: false,
    canViewReports: true,
    canExportData: true,
    canAccessAuditLogs: false,
    canManageInvestors: false,
  },
  approver: {
    canViewApplications: true,
    canReviewDueDiligence: true,
    canRequestChanges: true,
    canApprove: true,
    approvalLimit: 0, // Approvers can approve but without specific limit display
    canAssignReviews: false, // Approvers cannot assign reviews
    canManageAdmins: false,
    canAccessSystemConfig: false, // Approvers cannot access system config
    canDistributeProfits: false,
    canViewReports: true,
    canExportData: true,
    canAccessAuditLogs: true,
    canManageInvestors: true,
  },
  manager: {
    canViewApplications: true,
    canReviewDueDiligence: true,
    canRequestChanges: true,
    canApprove: true,
    approvalLimit: 100_000_000, // ₦100M
    canAssignReviews: true,
    canManageAdmins: true,
    canAccessSystemConfig: true,
    canDistributeProfits: true,
    canViewReports: true,
    canExportData: true,
    canAccessAuditLogs: true,
    canManageInvestors: true,
  },
  super_admin: {
    canViewApplications: true,
    canReviewDueDiligence: true,
    canRequestChanges: true,
    canApprove: true,
    approvalLimit: Infinity,
    canAssignReviews: true,
    canManageAdmins: true,
    canAccessSystemConfig: true,
    canDistributeProfits: true,
    canViewReports: true,
    canExportData: true,
    canAccessAuditLogs: true,
    canManageInvestors: true,
  },
};

/**
 * Get permissions for a given role
 */
export function getPermissionsForRole(role: string): AdminPermissions {
  return RolePermissionsMap[role] || RolePermissionsMap.viewer;
}

/**
 * Check if a role has permission for an action
 */
export function hasPermission(
  role: string,
  permission: keyof AdminPermissions
): boolean {
  const permissions = getPermissionsForRole(role);
  return permissions[permission] as boolean;
}

/**
 * Check if amount is within approval limit
 */
export function canApproveAmount(role: string, amount: number): boolean {
  const permissions = getPermissionsForRole(role);
  return permissions.canApprove && amount <= permissions.approvalLimit;
}

/**
 * Admin Action Log Schema
 * Records all administrative actions for audit trail
 */
export const AdminActionLogSchema = z.object({
  adminId: z.string().min(1, "Admin ID required"),
  adminName: z.string().min(1),
  adminRole: z.enum(["viewer", "reviewer", "approver", "manager", "super_admin"]),
  action: z.enum([
    "view_application",
    "review_application",
    "approve_application",
    "reject_application",
    "request_changes",
    "assign_reviewer",
    "reassign_reviewer",
    "update_due_diligence",
    "distribute_profit",
    "create_admin",
    "update_admin",
    "deactivate_admin",
    "export_data",
    "access_audit_logs",
    "update_system_config",
  ]),
  targetCollection: z.string().optional(),
  targetId: z.string().optional(),
  targetName: z.string().optional(),
  metadata: z.record(z.string(), z.any()).optional(),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
  timestamp: z.number().int().positive(),
  success: z.boolean().default(true),
  errorMessage: z.string().optional(),
});

export type AdminActionLog = z.infer<typeof AdminActionLogSchema>;

/**
 * Dual Authorization Request Schema
 * For high-value applications requiring two approvals
 */
export const DualAuthorizationSchema = z.object({
  applicationId: z.string().min(1),
  requestedAmount: z.number().positive(),
  primaryApproverId: z.string().min(1),
  primaryApprovalAt: z.number().int().positive(),
  primaryApprovalNotes: z.string().optional(),
  secondaryApproverId: z.string().optional(),
  secondaryApprovalAt: z.number().int().positive().optional(),
  secondaryApprovalNotes: z.string().optional(),
  status: z.enum(["pending_secondary", "approved", "rejected"]).default("pending_secondary"),
  requiredBy: z.number().int().positive(), // SLA deadline
  createdAt: z.number().int().positive(),
  updatedAt: z.number().int().positive(),
});

export type DualAuthorization = z.infer<typeof DualAuthorizationSchema>;

/**
 * Admin Session Schema
 * Tracks active admin sessions for security
 */
export const AdminSessionSchema = z.object({
  adminId: z.string().min(1),
  sessionId: z.string().min(1),
  loginAt: z.number().int().positive(),
  lastActivityAt: z.number().int().positive(),
  ipAddress: z.string(),
  userAgent: z.string(),
  isActive: z.boolean().default(true),
  logoutAt: z.number().int().positive().optional(),
});

export type AdminSession = z.infer<typeof AdminSessionSchema>;

/**
 * Time-based restriction check
 * Prevents high-value approvals during off-hours
 */
export function isWithinBusinessHours(): boolean {
  const now = new Date();
  const hour = now.getHours();
  const day = now.getDay();
  
  // Weekend check (Saturday = 6, Sunday = 0)
  if (day === 0 || day === 6) {
    return false;
  }
  
  // Business hours: 6 AM to 10 PM
  return hour >= 6 && hour < 22;
}

/**
 * Check if high-value approval is allowed
 */
export function canApproveHighValue(amount: number): {
  allowed: boolean;
  reason?: string;
} {
  const highValueThreshold = 10_000_000; // ₦10M
  
  if (amount <= highValueThreshold) {
    return { allowed: true };
  }
  
  if (!isWithinBusinessHours()) {
    return {
      allowed: false,
      reason: "High-value approvals (>₦10M) are restricted to business hours (Mon-Fri, 6 AM - 10 PM)",
    };
  }
  
  return { allowed: true };
}

/**
 * Separation of duties check
 * Ensures reviewer and approver are different people
 */
export function validateSeparationOfDuties(
  reviewerId: string,
  approverId: string
): { valid: boolean; reason?: string } {
  if (reviewerId === approverId) {
    return {
      valid: false,
      reason: "Separation of duties violation: Reviewer cannot approve their own review",
    };
  }
  
  return { valid: true };
}

/**
 * Dual authorization requirement check
 */
export function requiresDualAuthorization(
  amount: number,
  primaryApproverRole: string
): boolean {
  const dualAuthThreshold = 50_000_000; // ₦50M
  
  // Amounts over ₦50M always require dual authorization
  if (amount > dualAuthThreshold) {
    return true;
  }
  
  // Reviewers need secondary approval for amounts over ₦5M
  if (primaryApproverRole === "reviewer" && amount > 5_000_000) {
    return true;
  }
  
  return false;
}
