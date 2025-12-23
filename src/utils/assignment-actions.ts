/**
 * Assignment Actions and Utilities
 * Handles application assignment, workload management, and review queue operations
 */

import {
  setDoc,
  getDoc,
  listDocs,
  type Doc,
} from "@junobuild/core";
import {
  Assignment,
  AssignmentSchema,
  AdminProfile,
  AdminProfileSchema,
  ReviewQueueItem,
  AssignmentHistory,
  AssignmentHistorySchema,
  WorkloadStats,
} from "@/schemas";
import { createNotification } from "./notification-actions";

const ASSIGNMENTS_COLLECTION = "assignments";
const ADMIN_PROFILES_COLLECTION = "admin_profiles";
const ASSIGNMENT_HISTORY_COLLECTION = "assignment_history";

/**
 * Assign an application to an admin reviewer
 */
export async function assignApplication(params: {
  applicationId: string;
  assignedTo: string;
  assignedBy: string;
  priority?: "low" | "medium" | "high" | "urgent";
  dueDate?: number;
  notes?: string;
}): Promise<Assignment> {
  const now = Date.now();
  const assignmentId = `assign_${params.applicationId}_${now}`;

  // Calculate SLA due date if not provided (default: 3 business days = 72 hours)
  const dueDate = params.dueDate || now + 72 * 60 * 60 * 1000;

  const assignment: Assignment = {
    applicationId: params.applicationId,
    assignedTo: params.assignedTo,
    assignedBy: params.assignedBy,
    assignedAt: now,
    status: "pending",
    priority: params.priority || "medium",
    dueDate,
    notes: params.notes,
  };

  // Validate assignment data
  const validatedAssignment = AssignmentSchema.parse(assignment);

  // Save assignment
  await setDoc({
    collection: ASSIGNMENTS_COLLECTION,
    doc: {
      key: assignmentId,
      data: validatedAssignment,
    },
  });

  // Update admin workload
  await incrementAdminWorkload(params.assignedTo);

  // Log assignment history
  await logAssignmentHistory({
    applicationId: params.applicationId,
    timestamp: now,
    action: "assigned",
    toAssignee: params.assignedTo,
    performedBy: params.assignedBy,
  });

  // Create notification for assigned admin
  await createNotification(params.assignedTo, {
    type: "application_assigned",
    title: "New Application Assigned",
    message: `You have been assigned to review application ${params.applicationId}`,
    priority: params.priority === "urgent" ? "urgent" : "normal",
    actionUrl: `/admin/applications/${params.applicationId}`,
    metadata: {
      applicationId: params.applicationId,
      assignmentId,
    },
  });

  return validatedAssignment;
}

/**
 * Reassign an application to a different admin
 */
export async function reassignApplication(params: {
  assignmentId: string;
  fromAssignee: string;
  toAssignee: string;
  performedBy: string;
  reason?: string;
}): Promise<Assignment> {
  // Get current assignment
  const currentDoc = await getDoc({
    collection: ASSIGNMENTS_COLLECTION,
    key: params.assignmentId,
  });

  if (!currentDoc) {
    throw new Error("Assignment not found");
  }

  const currentAssignment = currentDoc.data as Assignment;
  const now = Date.now();

  // Update assignment
  const updatedAssignment: Assignment = {
    ...currentAssignment,
    assignedTo: params.toAssignee,
    status: "reassigned",
  };

  await setDoc({
    collection: ASSIGNMENTS_COLLECTION,
    doc: {
      key: params.assignmentId,
      data: updatedAssignment,
      version: currentDoc.version,
    },
  });

  // Create new assignment for new assignee
  const newAssignment = await assignApplication({
    applicationId: currentAssignment.applicationId,
    assignedTo: params.toAssignee,
    assignedBy: params.performedBy,
    priority: currentAssignment.priority,
    dueDate: currentAssignment.dueDate,
    notes: params.reason,
  });

  // Update workload counts
  await decrementAdminWorkload(params.fromAssignee);
  // incrementAdminWorkload is called in assignApplication

  // Log reassignment history
  await logAssignmentHistory({
    applicationId: currentAssignment.applicationId,
    timestamp: now,
    action: "reassigned",
    fromAssignee: params.fromAssignee,
    toAssignee: params.toAssignee,
    performedBy: params.performedBy,
    reason: params.reason,
  });

  // Notify both admins
  await createNotification(params.fromAssignee, {
    type: "application_reassigned",
    title: "Application Reassigned",
    message: `Application ${currentAssignment.applicationId} has been reassigned to another reviewer`,
    priority: "normal",
    metadata: {
      applicationId: currentAssignment.applicationId,
      assignmentId: params.assignmentId,
    },
  });

  await createNotification(params.toAssignee, {
    type: "application_assigned",
    title: "Application Reassigned to You",
    message: `Application ${currentAssignment.applicationId} has been reassigned to you`,
    priority: currentAssignment.priority === "urgent" ? "urgent" : "normal",
    actionUrl: `/admin/applications/${currentAssignment.applicationId}`,
    metadata: {
      applicationId: currentAssignment.applicationId,
      assignmentId: newAssignment.applicationId,
    },
  });

  return newAssignment;
}

/**
 * Complete an assignment (when review is done)
 */
export async function completeAssignment(
  assignmentId: string,
  performedBy: string
): Promise<Assignment> {
  const doc = await getDoc({
    collection: ASSIGNMENTS_COLLECTION,
    key: assignmentId,
  });

  if (!doc) {
    throw new Error("Assignment not found");
  }

  const assignment = doc.data as Assignment;
  const now = Date.now();
  const reviewDuration = now - assignment.assignedAt;

  const completedAssignment: Assignment = {
    ...assignment,
    status: "completed",
    completedAt: now,
    reviewDuration,
  };

  await setDoc({
    collection: ASSIGNMENTS_COLLECTION,
    doc: {
      key: assignmentId,
      data: completedAssignment,
      version: doc.version,
    },
  });

  // Update admin workload
  await decrementAdminWorkload(assignment.assignedTo);

  // Update admin performance metrics
  await updateAdminPerformanceMetrics(assignment.assignedTo, reviewDuration);

  // Log completion
  await logAssignmentHistory({
    applicationId: assignment.applicationId,
    timestamp: now,
    action: "completed",
    performedBy,
  });

  return completedAssignment;
}

/**
 * Get assignments for a specific admin
 */
export async function getAdminAssignments(
  adminId: string,
  status?: Assignment["status"]
): Promise<Assignment[]> {
  const { items } = await listDocs({
    collection: ASSIGNMENTS_COLLECTION,
    filter: {
      matcher: {
        key: adminId, // This is a simplified filter - in production use proper matching
      },
    },
  });

  const assignments = items.map((doc) => doc.data as Assignment);

  if (status) {
    return assignments.filter((a) => a.status === status && a.assignedTo === adminId);
  }

  return assignments.filter((a) => a.assignedTo === adminId);
}

/**
 * Get unassigned applications (review queue)
 */
export async function getReviewQueue(): Promise<ReviewQueueItem[]> {
  // This would query applications that don't have assignments
  // In a real implementation, you'd query the applications collection
  // and cross-reference with assignments
  
  // Placeholder implementation
  return [];
}

/**
 * Get workload statistics for all admins
 */
export async function getWorkloadStats(): Promise<WorkloadStats> {
  const { items: adminDocs } = await listDocs({
    collection: ADMIN_PROFILES_COLLECTION,
  });

  const { items: assignmentDocs } = await listDocs({
    collection: ASSIGNMENTS_COLLECTION,
  });

  const assignments = assignmentDocs.map((doc) => doc.data as Assignment);
  const activeAssignments = assignments.filter((a) => 
    a.status === "pending" || a.status === "in_review"
  );

  const adminWorkloads = adminDocs.map((doc) => {
    const admin = doc.data as AdminProfile;
    const assigned = activeAssignments.filter(
      (a) => a.assignedTo === admin.userId
    ).length;
    const capacity = admin.maxWorkload;
    const utilizationRate = capacity > 0 ? (assigned / capacity) * 100 : 0;

    return {
      adminId: admin.userId,
      displayName: admin.displayName,
      assigned,
      capacity,
      utilizationRate,
    };
  });

  const now = Date.now();
  const overdueSLA = activeAssignments.filter(
    (a) => a.dueDate && a.dueDate < now
  ).length;

  // Calculate average wait time for unassigned applications
  const unassignedCount = 0; // Would come from applications query
  const averageWaitTime = 0; // Would be calculated from application submission times

  return {
    totalApplications: assignments.length,
    unassigned: unassignedCount,
    inReview: activeAssignments.filter((a) => a.status === "in_review").length,
    completed: assignments.filter((a) => a.status === "completed").length,
    overdueSLA,
    averageWaitTime,
    adminWorkloads,
  };
}

/**
 * Auto-assign application to admin with lowest workload
 */
export async function autoAssignApplication(params: {
  applicationId: string;
  assignedBy: string;
  priority?: Assignment["priority"];
  requiredSpecialization?: string;
}): Promise<Assignment> {
  const { items: adminDocs } = await listDocs({
    collection: ADMIN_PROFILES_COLLECTION,
  });

  let eligibleAdmins = adminDocs
    .map((doc) => doc.data as AdminProfile)
    .filter((admin) => admin.isActive);

  // Filter by specialization if required
  if (params.requiredSpecialization) {
    eligibleAdmins = eligibleAdmins.filter((admin) =>
      admin.specializations?.includes(params.requiredSpecialization!)
    );
  }

  if (eligibleAdmins.length === 0) {
    throw new Error("No eligible admins available for assignment");
  }

  // Sort by current workload (ascending) and assign to admin with lowest workload
  eligibleAdmins.sort((a, b) => a.currentWorkload - b.currentWorkload);
  const selectedAdmin = eligibleAdmins[0];

  // Check if admin is at capacity
  if (selectedAdmin.currentWorkload >= selectedAdmin.maxWorkload) {
    throw new Error("All admins are at maximum capacity");
  }

  return assignApplication({
    applicationId: params.applicationId,
    assignedTo: selectedAdmin.userId,
    assignedBy: params.assignedBy,
    priority: params.priority,
  });
}

/**
 * Check SLA status for an assignment
 */
export function checkSLAStatus(assignment: Assignment): "on_time" | "due_soon" | "overdue" {
  if (!assignment.dueDate) return "on_time";

  const now = Date.now();
  const timeRemaining = assignment.dueDate - now;
  const hoursRemaining = timeRemaining / (60 * 60 * 1000);

  if (timeRemaining < 0) return "overdue";
  if (hoursRemaining < 24) return "due_soon";
  return "on_time";
}

/**
 * Send SLA alert notifications
 */
export async function sendSLAAlerts(): Promise<void> {
  const { items } = await listDocs({
    collection: ASSIGNMENTS_COLLECTION,
  });

  const now = Date.now();

  for (const doc of items) {
    const assignment = doc.data as Assignment;
    
    if (assignment.status === "completed") continue;
    if (!assignment.dueDate) continue;

    const slaStatus = checkSLAStatus(assignment);

    if (slaStatus === "due_soon") {
      await createNotification(assignment.assignedTo, {
        type: "sla_due_soon",
        title: "SLA Deadline Approaching",
        message: `Application ${assignment.applicationId} review is due within 24 hours`,
        priority: "high",
        actionUrl: `/admin/applications/${assignment.applicationId}`,
        metadata: {
          applicationId: assignment.applicationId,
          assignmentId: doc.key,
        },
      });
    } else if (slaStatus === "overdue") {
      await createNotification(assignment.assignedTo, {
        type: "sla_overdue",
        title: "SLA Deadline Exceeded",
        message: `Application ${assignment.applicationId} review is overdue`,
        priority: "urgent",
        actionUrl: `/admin/applications/${assignment.applicationId}`,
        metadata: {
          applicationId: assignment.applicationId,
          assignmentId: doc.key,
        },
      });

      // Notify assignedBy (manager) about overdue assignment
      await createNotification(assignment.assignedBy, {
        type: "sla_overdue",
        title: "Assignment Overdue",
        message: `Assignment for application ${assignment.applicationId} is overdue`,
        priority: "high",
        actionUrl: `/admin/applications/${assignment.applicationId}`,
        metadata: {
          applicationId: assignment.applicationId,
          assignmentId: doc.key,
          reviewerId: assignment.assignedTo,
        },
      });
    }
  }
}

// Helper functions

async function incrementAdminWorkload(adminId: string): Promise<void> {
  const doc = await getDoc({
    collection: ADMIN_PROFILES_COLLECTION,
    key: adminId,
  });

  if (!doc) return;

  const admin = doc.data as AdminProfile;
  const updatedAdmin: AdminProfile = {
    ...admin,
    currentWorkload: admin.currentWorkload + 1,
    updatedAt: Date.now(),
  };

  await setDoc({
    collection: ADMIN_PROFILES_COLLECTION,
    doc: {
      key: adminId,
      data: updatedAdmin,
      version: doc.version,
    },
  });
}

async function decrementAdminWorkload(adminId: string): Promise<void> {
  const doc = await getDoc({
    collection: ADMIN_PROFILES_COLLECTION,
    key: adminId,
  });

  if (!doc) return;

  const admin = doc.data as AdminProfile;
  const updatedAdmin: AdminProfile = {
    ...admin,
    currentWorkload: Math.max(0, admin.currentWorkload - 1),
    updatedAt: Date.now(),
  };

  await setDoc({
    collection: ADMIN_PROFILES_COLLECTION,
    doc: {
      key: adminId,
      data: updatedAdmin,
      version: doc.version,
    },
  });
}

async function updateAdminPerformanceMetrics(
  adminId: string,
  reviewDuration: number
): Promise<void> {
  const doc = await getDoc({
    collection: ADMIN_PROFILES_COLLECTION,
    key: adminId,
  });

  if (!doc) return;

  const admin = doc.data as AdminProfile;
  const metrics = admin.performanceMetrics || {
    totalReviewed: 0,
    averageReviewTime: 0,
    approvalRate: 0,
    qualityScore: 0,
  };

  const reviewTimeInHours = reviewDuration / (60 * 60 * 1000);
  const totalReviewed = metrics.totalReviewed + 1;
  const averageReviewTime =
    (metrics.averageReviewTime * metrics.totalReviewed + reviewTimeInHours) /
    totalReviewed;

  const updatedAdmin: AdminProfile = {
    ...admin,
    performanceMetrics: {
      ...metrics,
      totalReviewed,
      averageReviewTime,
    },
    updatedAt: Date.now(),
  };

  await setDoc({
    collection: ADMIN_PROFILES_COLLECTION,
    doc: {
      key: adminId,
      data: updatedAdmin,
      version: doc.version,
    },
  });
}

async function logAssignmentHistory(
  entry: Omit<AssignmentHistory, "">
): Promise<void> {
  const validated = AssignmentHistorySchema.parse(entry);
  const historyId = `history_${entry.applicationId}_${entry.timestamp}`;

  await setDoc({
    collection: ASSIGNMENT_HISTORY_COLLECTION,
    doc: {
      key: historyId,
      data: validated,
    },
  });
}

/**
 * Get assignment history for an application
 */
export async function getAssignmentHistory(
  applicationId: string
): Promise<AssignmentHistory[]> {
  const { items } = await listDocs({
    collection: ASSIGNMENT_HISTORY_COLLECTION,
    filter: {
      matcher: {
        key: applicationId,
      },
    },
  });

  const history = items.map((doc) => doc.data as AssignmentHistory);
  return history.sort((a, b) => b.timestamp - a.timestamp);
}

/**
 * Create or update admin profile
 */
export async function upsertAdminProfile(
  profile: AdminProfile
): Promise<AdminProfile> {
  const validated = AdminProfileSchema.parse(profile);

  await setDoc({
    collection: ADMIN_PROFILES_COLLECTION,
    doc: {
      key: profile.userId,
      data: validated,
    },
  });

  return validated;
}

/**
 * Get admin profile
 */
export async function getAdminProfile(
  userId: string
): Promise<AdminProfile | null> {
  const doc = await getDoc({
    collection: ADMIN_PROFILES_COLLECTION,
    key: userId,
  });

  return doc ? (doc.data as AdminProfile) : null;
}

/**
 * List all admin profiles
 */
export async function listAdminProfiles(
  activeOnly: boolean = false
): Promise<AdminProfile[]> {
  const { items } = await listDocs({
    collection: ADMIN_PROFILES_COLLECTION,
  });

  const profiles = items.map((doc) => doc.data as AdminProfile);

  if (activeOnly) {
    return profiles.filter((p) => p.isActive);
  }

  return profiles;
}
