import { z } from "zod";

/**
 * Message Schema
 * In-app messaging between admins and business owners
 */
export const MessageSchema = z.object({
  applicationId: z.string().min(1, "Application ID is required"),
  senderId: z.string().min(1, "Sender ID is required"),
  senderType: z.enum(["admin", "business"]),
  senderName: z.string().min(1).max(100),
  recipientId: z.string().min(1, "Recipient ID is required"),
  recipientType: z.enum(["admin", "business"]),
  subject: z.string().min(1).max(200).optional(),
  content: z.string().min(1).max(5000, "Message content is required"),
  attachments: z.array(z.object({
    filename: z.string(),
    downloadUrl: z.string().url(),
    fileSize: z.number().positive(),
    fileType: z.string(),
  })).default([]),
  isRead: z.boolean().default(false),
  readAt: z.number().int().positive().optional(),
  timestamp: z.number().int().positive(),
  threadId: z.string().optional(), // For grouping related messages
  inReplyTo: z.string().optional(), // Reference to parent message
  priority: z.enum(["normal", "high", "urgent"]).default("normal"),
  tags: z.array(z.string()).default([]), // e.g., ["document_request", "clarification", "follow_up"]
  isInternal: z.boolean().default(false), // Admin-only messages
});

export type Message = z.infer<typeof MessageSchema>;

/**
 * Message Thread Schema
 * Groups related messages together
 */
export const MessageThreadSchema = z.object({
  threadId: z.string().min(1),
  applicationId: z.string().min(1),
  subject: z.string().min(1).max(200),
  participants: z.array(z.object({
    userId: z.string(),
    userType: z.enum(["admin", "business"]),
    displayName: z.string(),
  })).min(2),
  messageCount: z.number().int().nonnegative().default(0),
  unreadCount: z.number().int().nonnegative().default(0),
  lastMessageAt: z.number().int().positive(),
  lastMessagePreview: z.string().max(200),
  status: z.enum(["active", "closed", "archived"]).default("active"),
  createdAt: z.number().int().positive(),
  closedAt: z.number().int().positive().optional(),
});

export type MessageThread = z.infer<typeof MessageThreadSchema>;

/**
 * Message Template Schema
 * Pre-defined message templates for common communications
 */
export const MessageTemplateSchema = z.object({
  templateId: z.string().min(1),
  name: z.string().min(1).max(100),
  category: z.enum([
    "approval",
    "rejection",
    "info_request",
    "document_request",
    "clarification",
    "conditional_approval",
    "follow_up",
    "welcome",
    "reminder",
  ]),
  subject: z.string().min(1).max(200),
  content: z.string().min(1).max(5000),
  variables: z.array(z.string()).default([]), // e.g., ["businessName", "amount", "deadline"]
  isActive: z.boolean().default(true),
  createdBy: z.string().min(1),
  createdAt: z.number().int().positive(),
  lastUsed: z.number().int().positive().optional(),
  usageCount: z.number().int().nonnegative().default(0),
});

export type MessageTemplate = z.infer<typeof MessageTemplateSchema>;

/**
 * Internal Note Schema
 * Admin-only notes/comments on applications (not visible to business)
 */
export const InternalNoteSchema = z.object({
  applicationId: z.string().min(1, "Application ID is required"),
  authorId: z.string().min(1, "Author ID is required"),
  authorName: z.string().min(1).max(100),
  content: z.string().min(1).max(2000, "Note content is required"),
  noteType: z.enum(["general", "risk_flag", "recommendation", "question", "decision"]).default("general"),
  mentions: z.array(z.string()).default([]), // User IDs of mentioned admins
  attachments: z.array(z.object({
    filename: z.string(),
    downloadUrl: z.string().url(),
  })).default([]),
  isPinned: z.boolean().default(false), // Pin important notes to top
  tags: z.array(z.string()).default([]),
  timestamp: z.number().int().positive(),
  editedAt: z.number().int().positive().optional(),
  parentNoteId: z.string().optional(), // For threaded discussions
  reactions: z.array(z.object({
    userId: z.string(),
    emoji: z.string(),
    timestamp: z.number().int().positive(),
  })).default([]),
});

export type InternalNote = z.infer<typeof InternalNoteSchema>;

/**
 * Notification Preferences Schema
 * User preferences for different types of notifications
 */
export const NotificationPreferencesSchema = z.object({
  userId: z.string().min(1),
  email: z.object({
    newApplication: z.boolean().default(true),
    applicationAssigned: z.boolean().default(true),
    newMessage: z.boolean().default(true),
    slaDueSoon: z.boolean().default(true),
    slaOverdue: z.boolean().default(true),
    mention: z.boolean().default(true),
    statusUpdate: z.boolean().default(false),
  }),
  inApp: z.object({
    newApplication: z.boolean().default(true),
    applicationAssigned: z.boolean().default(true),
    newMessage: z.boolean().default(true),
    slaDueSoon: z.boolean().default(true),
    slaOverdue: z.boolean().default(true),
    mention: z.boolean().default(true),
    statusUpdate: z.boolean().default(true),
  }),
  push: z.object({
    enabled: z.boolean().default(false),
    urgentOnly: z.boolean().default(true),
  }),
  quietHours: z.object({
    enabled: z.boolean().default(false),
    startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).optional(), // HH:MM format
    endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).optional(),
    timezone: z.string().default("Africa/Lagos"),
  }),
  updatedAt: z.number().int().positive(),
});

export type NotificationPreferences = z.infer<typeof NotificationPreferencesSchema>;

/**
 * Collaboration Request Schema
 * Request for second opinion or consultation from another admin
 */
export const CollaborationRequestSchema = z.object({
  applicationId: z.string().min(1),
  requesterId: z.string().min(1),
  requesterName: z.string().min(1),
  consultantId: z.string().min(1), // Admin being consulted
  requestType: z.enum(["second_opinion", "shariah_review", "risk_assessment", "financial_review", "legal_review"]),
  priority: z.enum(["normal", "high", "urgent"]).default("normal"),
  question: z.string().min(1).max(1000),
  context: z.string().max(2000).optional(),
  status: z.enum(["pending", "in_progress", "completed", "declined"]).default("pending"),
  response: z.string().max(2000).optional(),
  requestedAt: z.number().int().positive(),
  respondedAt: z.number().int().positive().optional(),
  dueDate: z.number().int().positive().optional(),
});

export type CollaborationRequest = z.infer<typeof CollaborationRequestSchema>;
