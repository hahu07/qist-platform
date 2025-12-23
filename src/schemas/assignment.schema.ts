import { z } from "zod";

/**
 * Application Assignment Schema
 * Tracks which admin is assigned to review which application
 */
export const AssignmentSchema = z.object({
  applicationId: z.string().min(1, "Application ID is required"),
  assignedTo: z.string().min(1, "Assignee ID is required"), // Admin principal/user ID
  assignedBy: z.string().min(1, "Assigner ID is required"), // Admin who made the assignment
  assignedAt: z.number().int().positive("Assigned timestamp is required"),
  status: z.enum(["pending", "in_review", "completed", "reassigned"]).default("pending"),
  priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
  dueDate: z.number().int().positive().optional(), // SLA deadline timestamp
  notes: z.string().max(1000).optional(), // Assignment notes
  completedAt: z.number().int().positive().optional(),
  reviewDuration: z.number().int().nonnegative().optional(), // in milliseconds
});

export type Assignment = z.infer<typeof AssignmentSchema>;

/**
 * Admin Profile Schema
 * Represents an admin user with their review permissions and limits
 */
export const AdminProfileSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  displayName: z.string().min(1).max(100, "Display name is required"),
  email: z.string().email("Valid email is required"),
  role: z.enum(["viewer", "reviewer", "approver", "manager", "super_admin"]),
  approvalLimit: z.number().nonnegative().default(0), // Maximum amount they can approve (in Naira)
  department: z.string().max(100).optional(),
  phoneNumber: z.string().max(20).optional(),
  isActive: z.boolean().default(true),
  specializations: z.array(z.string()).default([]), // e.g., ["agriculture", "tech", "manufacturing"]
  currentWorkload: z.number().int().nonnegative().default(0), // Current assigned applications count
  maxWorkload: z.number().int().positive().default(10), // Maximum concurrent assignments
  performanceMetrics: z.object({
    totalReviewed: z.number().int().nonnegative().default(0),
    averageReviewTime: z.number().nonnegative().default(0), // in hours
    approvalRate: z.number().min(0).max(100).default(0), // percentage
    qualityScore: z.number().min(0).max(100).default(0), // 0-100 score
  }).optional(),
  createdAt: z.number().int().positive(),
  updatedAt: z.number().int().positive(),
});

export type AdminProfile = z.infer<typeof AdminProfileSchema>;

/**
 * Review Queue Item Schema
 * Represents an item in the review queue with priority and metadata
 */
export const ReviewQueueItemSchema = z.object({
  applicationId: z.string().min(1),
  businessName: z.string().min(1),
  contractType: z.enum(["murabaha", "musharaka", "mudaraba", "ijara", "salam", "istisna"]),
  requestedAmount: z.number().positive(),
  submittedAt: z.number().int().positive(),
  priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
  slaStatus: z.enum(["on_time", "due_soon", "overdue"]).default("on_time"),
  assignedTo: z.string().optional(), // null if unassigned
  assignedAt: z.number().int().positive().optional(),
  tags: z.array(z.string()).default([]), // e.g., ["high_risk", "first_time", "resubmission"]
  requiresSecondOpinion: z.boolean().default(false),
  requiresShariahReview: z.boolean().default(false),
});

export type ReviewQueueItem = z.infer<typeof ReviewQueueItemSchema>;

/**
 * Assignment History Entry Schema
 * Tracks the history of assignments for an application
 */
export const AssignmentHistorySchema = z.object({
  applicationId: z.string().min(1),
  timestamp: z.number().int().positive(),
  action: z.enum(["assigned", "reassigned", "unassigned", "completed", "escalated"]),
  fromAssignee: z.string().optional(), // For reassignments
  toAssignee: z.string().optional(),
  performedBy: z.string().min(1), // Admin who performed the action
  reason: z.string().max(500).optional(),
});

export type AssignmentHistory = z.infer<typeof AssignmentHistorySchema>;

/**
 * Workload Statistics Schema
 * Real-time workload statistics for the admin team
 */
export const WorkloadStatsSchema = z.object({
  totalApplications: z.number().int().nonnegative(),
  unassigned: z.number().int().nonnegative(),
  inReview: z.number().int().nonnegative(),
  completed: z.number().int().nonnegative(),
  overdueSLA: z.number().int().nonnegative(),
  averageWaitTime: z.number().nonnegative(), // hours
  adminWorkloads: z.array(z.object({
    adminId: z.string(),
    displayName: z.string(),
    assigned: z.number().int().nonnegative(),
    capacity: z.number().int().nonnegative(),
    utilizationRate: z.number().min(0).max(100), // percentage
  })),
});

export type WorkloadStats = z.infer<typeof WorkloadStatsSchema>;
