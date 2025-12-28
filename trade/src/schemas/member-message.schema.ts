import { z } from "zod";

/**
 * Member Message Schema
 * For communication between platform (admin) and members/investors
 */
export const memberMessageSchema = z.object({
  messageId: z.string(),
  threadId: z.string(), // Groups related messages together in a conversation
  from: z.string(), // "platform" or memberId
  to: z.string(),   // memberId or "platform"
  fromName: z.string().optional(), // Display name for UI
  toName: z.string().optional(),
  subject: z.string().min(1, "Subject is required"),
  content: z.string().min(1, "Message content is required"),
  attachments: z.array(z.string()).optional().default([]),
  type: z.enum(["info", "request", "warning", "urgent", "investment", "transaction"]).default("info"),
  status: z.enum(["sent", "read", "responded"]).default("sent"),
  sentAt: z.string(),
  readAt: z.string().optional(),
  responseContent: z.string().optional(), // DEPRECATED: Use threaded replies instead
  respondedAt: z.string().optional(),
  relatedInvestmentId: z.string().optional(), // Link to investment if relevant
  relatedTransactionId: z.string().optional(), // Link to transaction if relevant
  memberName: z.string().optional(), // For admin view
  replyToMessageId: z.string().optional(), // ID of message being replied to
  replyToContent: z.string().optional(), // Preview of original message content
  replyToSubject: z.string().optional(), // Original message subject
  isThreadStarter: z.boolean().optional().default(false), // True for the first message in a thread
  threadMessageCount: z.number().optional().default(1), // Total messages in this thread
});

export type MemberMessage = z.infer<typeof memberMessageSchema>;

// Export type for message type
export type MemberMessageType = "info" | "request" | "warning" | "urgent" | "investment" | "transaction";

// Export type for message attachments
export type MemberMessageAttachment = string;

/**
 * Request types for sending messages
 */
export const sendMemberMessageRequestSchema = z.object({
  to: z.string(),
  toName: z.string().optional(),
  subject: z.string().min(3, "Subject must be at least 3 characters").max(200, "Subject must not exceed 200 characters"),
  content: z.string().min(10, "Message must be at least 10 characters").max(10000, "Message must not exceed 10,000 characters"),
  type: z.enum(["info", "request", "warning", "urgent", "investment", "transaction"]).default("info"),
  attachments: z.array(z.string()).optional().default([]),
  relatedInvestmentId: z.string().optional(),
  relatedTransactionId: z.string().optional(),
});

export type SendMemberMessageRequest = z.infer<typeof sendMemberMessageRequestSchema>;

export const memberMessageResponseSchema = z.object({
  messageId: z.string(),
  responseContent: z.string().min(10, "Response must be at least 10 characters").max(10000, "Response must not exceed 10,000 characters"),
  attachments: z.array(z.string()).optional().default([]),
});

export type MemberMessageResponse = z.infer<typeof memberMessageResponseSchema>;
