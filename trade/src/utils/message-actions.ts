/**
 * Messaging Actions and Utilities
 * Handles in-app messaging, internal notes, and collaboration requests
 */

import {
  setDoc,
  getDoc,
  listDocs,
  deleteDoc,
} from "@junobuild/core";
import {
  Message,
  MessageSchema,
  MessageThread,
  MessageThreadSchema,
  MessageTemplate,
  InternalNote,
  InternalNoteSchema,
  CollaborationRequest,
  CollaborationRequestSchema,
} from "@/schemas";
import { createNotification } from "./notification-actions";

const MESSAGES_COLLECTION = "messages";
const MESSAGE_THREADS_COLLECTION = "message_threads";
const MESSAGE_TEMPLATES_COLLECTION = "message_templates";
const INTERNAL_NOTES_COLLECTION = "internal_notes";
const COLLABORATION_REQUESTS_COLLECTION = "collaboration_requests";

/**
 * Send a message
 */
export async function sendMessage(params: {
  applicationId: string;
  senderId: string;
  senderType: "admin" | "business";
  senderName: string;
  recipientId: string;
  recipientType: "admin" | "business";
  subject?: string;
  content: string;
  threadId?: string;
  inReplyTo?: string;
  priority?: "normal" | "high" | "urgent";
  attachments?: Message["attachments"];
  isInternal?: boolean;
}): Promise<Message> {
  const now = Date.now();
  const messageId = `msg_${params.applicationId}_${now}`;

  // If no threadId provided, create one
  const threadId =
    params.threadId || `thread_${params.applicationId}_${Date.now()}`;

  const message: Message = {
    applicationId: params.applicationId,
    senderId: params.senderId,
    senderType: params.senderType,
    senderName: params.senderName,
    recipientId: params.recipientId,
    recipientType: params.recipientType,
    subject: params.subject,
    content: params.content,
    attachments: params.attachments || [],
    isRead: false,
    timestamp: now,
    threadId,
    inReplyTo: params.inReplyTo,
    priority: params.priority || "normal",
    tags: [],
    isInternal: params.isInternal || false,
  };

  // Validate message
  const validatedMessage = MessageSchema.parse(message);

  // Save message
  await setDoc({
    collection: MESSAGES_COLLECTION,
    doc: {
      key: messageId,
      data: validatedMessage,
    },
  });

  // Update or create thread
  await upsertMessageThread({
    threadId,
    applicationId: params.applicationId,
    subject: params.subject || "Application Discussion",
    participants: [
      {
        userId: params.senderId,
        userType: params.senderType,
        displayName: params.senderName,
      },
      {
        userId: params.recipientId,
        userType: params.recipientType,
        displayName: "Recipient", // Should be looked up in practice
      },
    ],
    lastMessageAt: now,
    lastMessagePreview: params.content.substring(0, 200),
  });

  // Create notification for recipient
  await createNotification(params.recipientId, {
    type: "new_message",
    title: "New Message",
    message: `${params.senderName} sent you a message: ${params.content.substring(0, 50)}...`,
    priority: params.priority === "urgent" ? "urgent" : "normal",
    actionUrl: `/admin/applications/${params.applicationId}?tab=messages`,
    metadata: {
      applicationId: params.applicationId,
      messageId,
      threadId,
    },
  });

  return validatedMessage;
}

/**
 * Mark message as read
 */
export async function markMessageAsRead(messageId: string): Promise<void> {
  const doc = await getDoc({
    collection: MESSAGES_COLLECTION,
    key: messageId,
  });

  if (!doc) return;

  const message = doc.data as Message;
  const updatedMessage: Message = {
    ...message,
    isRead: true,
    readAt: Date.now(),
  };

  await setDoc({
    collection: MESSAGES_COLLECTION,
    doc: {
      key: messageId,
      data: updatedMessage,
      version: doc.version,
    },
  });
}

/**
 * Get messages for an application
 */
export async function getApplicationMessages(
  applicationId: string,
  includeInternal: boolean = false
): Promise<Message[]> {
  const { items } = await listDocs({
    collection: MESSAGES_COLLECTION,
    filter: {
      matcher: {
        key: applicationId,
      },
    },
  });

  let messages = items.map((doc) => doc.data as Message);

  if (!includeInternal) {
    messages = messages.filter((m) => !m.isInternal);
  }

  return messages.sort((a, b) => a.timestamp - b.timestamp);
}

/**
 * Get messages in a thread
 */
export async function getThreadMessages(threadId: string): Promise<Message[]> {
  const { items } = await listDocs({
    collection: MESSAGES_COLLECTION,
    filter: {
      matcher: {
        key: threadId,
      },
    },
  });

  const messages = items.map((doc) => doc.data as Message);
  return messages.sort((a, b) => a.timestamp - b.timestamp);
}

/**
 * Get unread message count for a user
 */
export async function getUnreadMessageCount(userId: string): Promise<number> {
  const { items } = await listDocs({
    collection: MESSAGES_COLLECTION,
    filter: {
      matcher: {
        key: userId,
      },
    },
  });

  const messages = items.map((doc) => doc.data as Message);
  return messages.filter((m) => m.recipientId === userId && !m.isRead).length;
}

/**
 * Create or update message thread
 */
async function upsertMessageThread(params: {
  threadId: string;
  applicationId: string;
  subject: string;
  participants: MessageThread["participants"];
  lastMessageAt: number;
  lastMessagePreview: string;
}): Promise<MessageThread> {
  const existingDoc = await getDoc({
    collection: MESSAGE_THREADS_COLLECTION,
    key: params.threadId,
  });

  let thread: MessageThread;

  if (existingDoc) {
    const existing = existingDoc.data as MessageThread;
    thread = {
      ...existing,
      messageCount: existing.messageCount + 1,
      lastMessageAt: params.lastMessageAt,
      lastMessagePreview: params.lastMessagePreview,
    };
  } else {
    thread = {
      threadId: params.threadId,
      applicationId: params.applicationId,
      subject: params.subject,
      participants: params.participants,
      messageCount: 1,
      unreadCount: 1,
      lastMessageAt: params.lastMessageAt,
      lastMessagePreview: params.lastMessagePreview,
      status: "active",
      createdAt: params.lastMessageAt,
    };
  }

  const validated = MessageThreadSchema.parse(thread);

  await setDoc({
    collection: MESSAGE_THREADS_COLLECTION,
    doc: {
      key: params.threadId,
      data: validated,
      version: existingDoc?.version,
    },
  });

  return validated;
}

/**
 * Get message threads for a user
 */
export async function getUserMessageThreads(
  userId: string
): Promise<MessageThread[]> {
  const { items } = await listDocs({
    collection: MESSAGE_THREADS_COLLECTION,
  });

  const threads = items
    .map((doc) => doc.data as MessageThread)
    .filter((thread) =>
      thread.participants.some((p) => p.userId === userId)
    )
    .sort((a, b) => b.lastMessageAt - a.lastMessageAt);

  return threads;
}

/**
 * Send message using template
 */
export async function sendMessageFromTemplate(params: {
  templateId: string;
  applicationId: string;
  senderId: string;
  senderType: "admin" | "business";
  senderName: string;
  recipientId: string;
  recipientType: "admin" | "business";
  variables: Record<string, string>;
}): Promise<Message> {
  const templateDoc = await getDoc({
    collection: MESSAGE_TEMPLATES_COLLECTION,
    key: params.templateId,
  });

  if (!templateDoc) {
    throw new Error("Template not found");
  }

  const template = templateDoc.data as MessageTemplate;

  // Replace variables in subject and content
  let subject = template.subject;
  let content = template.content;

  for (const [key, value] of Object.entries(params.variables)) {
    const placeholder = `{{${key}}}`;
    subject = subject.replace(new RegExp(placeholder, "g"), value);
    content = content.replace(new RegExp(placeholder, "g"), value);
  }

  // Update template usage stats
  await setDoc({
    collection: MESSAGE_TEMPLATES_COLLECTION,
    doc: {
      key: params.templateId,
      data: {
        ...template,
        lastUsed: Date.now(),
        usageCount: template.usageCount + 1,
      },
      version: templateDoc.version,
    },
  });

  return sendMessage({
    applicationId: params.applicationId,
    senderId: params.senderId,
    senderType: params.senderType,
    senderName: params.senderName,
    recipientId: params.recipientId,
    recipientType: params.recipientType,
    subject,
    content,
  });
}

/**
 * Create internal note (admin-only)
 */
export async function createInternalNote(params: {
  applicationId: string;
  authorId: string;
  authorName: string;
  content: string;
  noteType?: InternalNote["noteType"];
  mentions?: string[];
  attachments?: InternalNote["attachments"];
  isPinned?: boolean;
  tags?: string[];
  parentNoteId?: string;
}): Promise<InternalNote> {
  const now = Date.now();
  const noteId = `note_${params.applicationId}_${now}`;

  const note: InternalNote = {
    applicationId: params.applicationId,
    authorId: params.authorId,
    authorName: params.authorName,
    content: params.content,
    noteType: params.noteType || "general",
    mentions: params.mentions || [],
    attachments: params.attachments || [],
    isPinned: params.isPinned || false,
    tags: params.tags || [],
    timestamp: now,
    parentNoteId: params.parentNoteId,
    reactions: [],
  };

  const validated = InternalNoteSchema.parse(note);

  await setDoc({
    collection: INTERNAL_NOTES_COLLECTION,
    doc: {
      key: noteId,
      data: validated,
    },
  });

  // Notify mentioned admins
  if (params.mentions && params.mentions.length > 0) {
    for (const mentionedUserId of params.mentions) {
      await createNotification(mentionedUserId, {
        type: "mention",
        title: "You Were Mentioned",
        message: `${params.authorName} mentioned you in a note: ${params.content.substring(0, 50)}...`,
        priority: "normal",
        actionUrl: `/admin/applications/${params.applicationId}?tab=notes`,
        metadata: {
          applicationId: params.applicationId,
          mentionedBy: params.authorId,
        },
      });
    }
  }

  return validated;
}

/**
 * Update internal note
 */
export async function updateInternalNote(
  noteId: string,
  updates: Partial<Pick<InternalNote, "content" | "isPinned" | "tags">>
): Promise<InternalNote> {
  const doc = await getDoc({
    collection: INTERNAL_NOTES_COLLECTION,
    key: noteId,
  });

  if (!doc) {
    throw new Error("Note not found");
  }

  const note = doc.data as InternalNote;
  const updatedNote: InternalNote = {
    ...note,
    ...updates,
    editedAt: Date.now(),
  };

  const validated = InternalNoteSchema.parse(updatedNote);

  await setDoc({
    collection: INTERNAL_NOTES_COLLECTION,
    doc: {
      key: noteId,
      data: validated,
      version: doc.version,
    },
  });

  return validated;
}

/**
 * Add reaction to internal note
 */
export async function addNoteReaction(
  noteId: string,
  userId: string,
  emoji: string
): Promise<InternalNote> {
  const doc = await getDoc({
    collection: INTERNAL_NOTES_COLLECTION,
    key: noteId,
  });

  if (!doc) {
    throw new Error("Note not found");
  }

  const note = doc.data as InternalNote;
  
  // Check if user already reacted with this emoji
  const existingReaction = note.reactions.find(
    (r) => r.userId === userId && r.emoji === emoji
  );

  if (existingReaction) {
    // Remove reaction if it exists
    note.reactions = note.reactions.filter(
      (r) => !(r.userId === userId && r.emoji === emoji)
    );
  } else {
    // Add new reaction
    note.reactions.push({
      userId,
      emoji,
      timestamp: Date.now(),
    });
  }

  await setDoc({
    collection: INTERNAL_NOTES_COLLECTION,
    doc: {
      key: noteId,
      data: note,
      version: doc.version,
    },
  });

  return note;
}

/**
 * Get internal notes for an application
 */
export async function getApplicationNotes(
  applicationId: string
): Promise<InternalNote[]> {
  const { items } = await listDocs({
    collection: INTERNAL_NOTES_COLLECTION,
    filter: {
      matcher: {
        key: applicationId,
      },
    },
  });

  const notes = items.map((doc) => doc.data as InternalNote);
  
  // Sort: pinned notes first, then by timestamp (newest first)
  return notes.sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return b.timestamp - a.timestamp;
  });
}

/**
 * Delete internal note
 */
export async function deleteInternalNote(noteId: string): Promise<void> {
  const doc = await getDoc({
    collection: INTERNAL_NOTES_COLLECTION,
    key: noteId,
  });

  if (!doc) return;

  await deleteDoc({
    collection: INTERNAL_NOTES_COLLECTION,
    doc: doc,
  });
}

/**
 * Create collaboration request (second opinion, consultation)
 */
export async function createCollaborationRequest(params: {
  applicationId: string;
  requesterId: string;
  requesterName: string;
  consultantId: string;
  requestType: CollaborationRequest["requestType"];
  priority?: CollaborationRequest["priority"];
  question: string;
  context?: string;
  dueDate?: number;
}): Promise<CollaborationRequest> {
  const now = Date.now();
  const requestId = `collab_${params.applicationId}_${now}`;

  const request: CollaborationRequest = {
    applicationId: params.applicationId,
    requesterId: params.requesterId,
    requesterName: params.requesterName,
    consultantId: params.consultantId,
    requestType: params.requestType,
    priority: params.priority || "normal",
    question: params.question,
    context: params.context,
    status: "pending",
    requestedAt: now,
    dueDate: params.dueDate,
  };

  const validated = CollaborationRequestSchema.parse(request);

  await setDoc({
    collection: COLLABORATION_REQUESTS_COLLECTION,
    doc: {
      key: requestId,
      data: validated,
    },
  });

  // Notify consultant
  await createNotification(params.consultantId, {
    type: "collaboration_request",
    title: "Collaboration Request",
    message: `${params.requesterName} requests your ${params.requestType.replace("_", " ")} for application ${params.applicationId}`,
    priority: params.priority === "urgent" ? "urgent" : "high",
    actionUrl: `/admin/applications/${params.applicationId}?tab=collaboration`,
    metadata: {
      applicationId: params.applicationId,
      requesterId: params.requesterId,
    },
  });

  return validated;
}

/**
 * Respond to collaboration request
 */
export async function respondToCollaborationRequest(
  requestId: string,
  response: string,
  status: "completed" | "declined"
): Promise<CollaborationRequest> {
  const doc = await getDoc({
    collection: COLLABORATION_REQUESTS_COLLECTION,
    key: requestId,
  });

  if (!doc) {
    throw new Error("Collaboration request not found");
  }

  const request = doc.data as CollaborationRequest;
  const now = Date.now();

  const updatedRequest: CollaborationRequest = {
    ...request,
    status,
    response,
    respondedAt: now,
  };

  const validated = CollaborationRequestSchema.parse(updatedRequest);

  await setDoc({
    collection: COLLABORATION_REQUESTS_COLLECTION,
    doc: {
      key: requestId,
      data: validated,
      version: doc.version,
    },
  });

  // Notify requester
  await createNotification(request.requesterId, {
    type: "collaboration_request",
    title: `Collaboration Request ${status === "completed" ? "Completed" : "Declined"}`,
    message: `Response to your ${request.requestType.replace("_", " ")} request: ${response.substring(0, 100)}...`,
    priority: "normal",
    actionUrl: `/admin/applications/${request.applicationId}?tab=collaboration`,
    metadata: {
      applicationId: request.applicationId,
      reviewerId: request.consultantId,
    },
  });

  return validated;
}

/**
 * Get collaboration requests for a user
 */
export async function getUserCollaborationRequests(
  userId: string,
  status?: CollaborationRequest["status"]
): Promise<CollaborationRequest[]> {
  const { items } = await listDocs({
    collection: COLLABORATION_REQUESTS_COLLECTION,
  });

  let requests = items
    .map((doc) => doc.data as CollaborationRequest)
    .filter(
      (req) => req.consultantId === userId || req.requesterId === userId
    );

  if (status) {
    requests = requests.filter((req) => req.status === status);
  }

  return requests.sort((a, b) => b.requestedAt - a.requestedAt);
}

/**
 * Create a message template
 */
export async function createMessageTemplate(params: {
  name: string;
  category: MessageTemplate["category"];
  subject: string;
  content: string;
  variables?: string[];
  createdBy: string;
}): Promise<MessageTemplate> {
  const now = Date.now();
  const templateId = `template_${now}`;

  const template: MessageTemplate = {
    templateId,
    name: params.name,
    category: params.category,
    subject: params.subject,
    content: params.content,
    variables: params.variables || [],
    isActive: true,
    createdBy: params.createdBy,
    createdAt: now,
    usageCount: 0,
  };

  await setDoc({
    collection: MESSAGE_TEMPLATES_COLLECTION,
    doc: {
      key: templateId,
      data: template,
    },
  });

  return template;
}

/**
 * List message templates by category
 */
export async function listMessageTemplates(
  category?: MessageTemplate["category"]
): Promise<MessageTemplate[]> {
  const { items } = await listDocs({
    collection: MESSAGE_TEMPLATES_COLLECTION,
  });

  let templates = items
    .map((doc) => doc.data as MessageTemplate)
    .filter((t) => t.isActive);

  if (category) {
    templates = templates.filter((t) => t.category === category);
  }

  return templates.sort((a, b) => b.usageCount - a.usageCount);
}
