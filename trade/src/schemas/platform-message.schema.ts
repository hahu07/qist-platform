import { z } from "zod";

/**
 * Platform Message Schema
 * For communication between platform (admin) and businesses
 */
export const platformMessageSchema = z.object({
  messageId: z.string(),
  threadId: z.string(), // Groups related messages together in a conversation
  from: z.string(), // "platform" or businessId
  to: z.string(),   // businessId or "platform"
  fromName: z.string().optional(), // Display name for UI
  toName: z.string().optional(),
  subject: z.string().min(1, "Subject is required"),
  content: z.string().min(1, "Message content is required"),
  attachments: z.array(z.string()).optional().default([]),
  type: z.enum(["info", "request", "warning", "urgent"]).default("info"),
  status: z.enum(["sent", "read", "responded"]).default("sent"),
  sentAt: z.string(),
  readAt: z.string().optional(),
  responseContent: z.string().optional(), // DEPRECATED: Use threaded replies instead
  respondedAt: z.string().optional(),
  relatedReportId: z.string().optional(), // Link to financial report if relevant
  businessName: z.string().optional(), // For admin view
  replyToMessageId: z.string().optional(), // ID of message being replied to
  replyToContent: z.string().optional(), // Preview of original message content
  replyToSubject: z.string().optional(), // Original message subject
  isThreadStarter: z.boolean().optional().default(false), // True for the first message in a thread
  threadMessageCount: z.number().optional().default(1), // Total messages in this thread
});

export type PlatformMessage = z.infer<typeof platformMessageSchema>;

// Export type for message type
export type PlatformMessageType = "info" | "request" | "warning" | "urgent";

// Export type for message attachments
export type MessageAttachment = string;

/**
 * Enhanced Financial Report Schema
 * Extends existing revenue report with admin review workflow
 */
export const financialReportReviewSchema = z.object({
  status: z.enum(["submitted", "under_review", "approved", "revision_requested"]).default("submitted"),
  reviewedBy: z.string().optional(), // Admin userId
  reviewedAt: z.string().optional(),
  adminNotes: z.string().optional(), // Feedback from platform
  revisionNotes: z.string().optional(), // What needs to be fixed
  approvedAmount: z.number().optional(), // Verified revenue amount
});

export type FinancialReportReview = z.infer<typeof financialReportReviewSchema>;

/**
 * Message Send Request Schema
 * For creating new messages
 */
export const sendMessageSchema = z.object({
  to: z.string().min(1, "Recipient is required"),
  toName: z.string().optional(),
  subject: z.string().min(3, "Subject must be at least 3 characters"),
  content: z.string().min(10, "Message must be at least 10 characters"),
  type: z.enum(["info", "request", "warning", "urgent"]).default("info"),
  attachments: z.array(z.string()).optional(),
  relatedReportId: z.string().optional(),
});

export type SendMessageRequest = z.infer<typeof sendMessageSchema>;

/**
 * Message Response Schema
 * For businesses replying to platform messages
 */
export const messageResponseSchema = z.object({
  messageId: z.string(),
  responseContent: z.string().min(10, "Response must be at least 10 characters"),
  attachments: z.array(z.string()).optional(),
});

export type MessageResponse = z.infer<typeof messageResponseSchema>;
