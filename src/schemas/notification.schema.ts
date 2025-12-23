import { z } from "zod";

/**
 * Notification Schema
 */
export const notificationSchema = z.object({
  userId: z.string().min(1, "User ID required"),
  type: z.enum([
    "profit_distribution",
    "new_opportunity",
    "investment_milestone",
    "kyc_update",
    "deposit_confirmed",
    "withdrawal_processed",
    "investment_maturity",
    "business_update",
    "system_announcement",
    // Phase 2: Admin workflow notifications
    "application_assigned",
    "application_reassigned",
    "new_message",
    "message_received",
    "mention",
    "collaboration_request",
    "second_opinion_requested",
    "sla_due_soon",
    "sla_overdue",
    "application_escalated",
    "review_completed",
    "status_changed",
  ]),
  title: z.string().min(1, "Title required").max(200),
  message: z.string().min(1, "Message required").max(1000),
  read: z.boolean().default(false),
  priority: z.enum(["low", "normal", "high", "urgent"]).default("normal"),
  actionUrl: z.string().optional(), // URL to navigate when clicked
  metadata: z.object({
    investmentId: z.string().optional(),
    opportunityId: z.string().optional(),
    amount: z.number().optional(),
    transactionId: z.string().optional(),
    // Phase 2: Admin workflow metadata
    applicationId: z.string().optional(),
    assignmentId: z.string().optional(),
    messageId: z.string().optional(),
    threadId: z.string().optional(),
    mentionedBy: z.string().optional(),
    requesterId: z.string().optional(),
    reviewerId: z.string().optional(),
  }).optional(),
  createdAt: z.bigint().optional(),
  readAt: z.bigint().optional(),
});

export type Notification = z.infer<typeof notificationSchema>;

/**
 * Notification Preferences Schema
 */
export const notificationPreferencesSchema = z.object({
  userId: z.string().min(1, "User ID required"),
  emailNotifications: z.boolean().default(true),
  smsNotifications: z.boolean().default(false),
  pushNotifications: z.boolean().default(true),
  channels: z.object({
    profitDistribution: z.boolean().default(true),
    newOpportunities: z.boolean().default(true),
    investmentMilestones: z.boolean().default(true),
    kycUpdates: z.boolean().default(true),
    deposits: z.boolean().default(true),
    withdrawals: z.boolean().default(true),
    businessUpdates: z.boolean().default(true),
    systemAnnouncements: z.boolean().default(true),
    // Phase 2: Admin workflow notification channels
    applicationAssigned: z.boolean().default(true),
    newMessages: z.boolean().default(true),
    mentions: z.boolean().default(true),
    collaborationRequests: z.boolean().default(true),
    slaAlerts: z.boolean().default(true),
    statusChanges: z.boolean().default(false),
  }),
  frequency: z.enum(["realtime", "daily", "weekly"]).default("realtime"),
  quietHours: z.object({
    enabled: z.boolean().default(false),
    startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).default("22:00"),
    endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).default("08:00"),
  }),
  updatedAt: z.bigint().optional(),
});

export type NotificationPreferences = z.infer<typeof notificationPreferencesSchema>;
