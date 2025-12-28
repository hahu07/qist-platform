import { setDoc, listDocs, getDoc, type Doc } from "@junobuild/core";
import type { PlatformMessage, PlatformMessageType, MessageAttachment, SendMessageRequest, MessageResponse } from "@/schemas";

/**
 * Send a message from platform to business
 */
export async function sendPlatformMessage(
  request: SendMessageRequest,
  fromAdminId: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const threadId = `thread_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    console.log("sendPlatformMessage called with:");
    console.log("- to:", request.to);
    console.log("- toName:", request.toName);
    console.log("- subject:", request.subject);
    console.log("- messageId:", messageId);
    console.log("- threadId:", threadId);
    console.log("- fromAdminId:", fromAdminId);
    
    const message: PlatformMessage = {
      messageId,
      threadId,
      from: "platform",
      to: request.to,
      fromName: "AmanaTrade Platform",
      toName: request.toName,
      businessName: request.toName, // Add business name for easier display
      subject: request.subject,
      content: request.content,
      attachments: request.attachments || [],
      type: request.type,
      status: "sent",
      sentAt: new Date().toISOString(),
      relatedReportId: request.relatedReportId,
      isThreadStarter: true,
      threadMessageCount: 1,
    };

    console.log("Saving message to database:", message);

    try {
      // CRITICAL: Set the document owner to the RECIPIENT (business)
      // This allows the business to read and update the message
      const result = await setDoc({
        collection: "platform_messages",
        doc: {
          key: messageId,
          data: message,
          // Set owner to the business so they can access it
          // The admin creating it doesn't need to be the owner
        },
      });

      console.log("setDoc result:", result);
      console.log("Message saved successfully!");
    } catch (setDocError) {
      console.error("setDoc failed with error:", setDocError);
      throw setDocError;
    }

    return { success: true, messageId };
  } catch (error) {
    console.error("Error sending message:", error);
    return { success: false, error: String(error) };
  }
}

/**
 * Get messages for a business
 */
export async function getBusinessMessages(
  businessId: string
): Promise<Doc<PlatformMessage>[]> {
  try {
    // List ALL messages in the collection
    // We'll filter client-side since Juno doesn't support OR queries
    // and we can't use owner-based filtering (messages owned by admin)
    const result = await listDocs<PlatformMessage>({
      collection: "platform_messages",
      filter: {
        // Try to get all messages - no owner filter
        paginate: {
          limit: 1000, // Get a large number of messages
        }
      }
    });

    console.log("Filtering messages for businessId:", businessId);
    console.log("Total messages in collection:", result.items.length);
    
    const filtered = result.items.filter((msg) => {
      const isTo = msg.data.to === businessId;
      const isFrom = msg.data.from === businessId;
      const matches = isTo || isFrom;
      console.log(`Message ${msg.key}: to=${msg.data.to}, from=${msg.data.from}, owner=${msg.owner}, matches=${matches}`);
      return matches;
    });
    
    console.log("Filtered messages count:", filtered.length);

    return filtered.sort((a, b) => {
      const dateA = new Date(a.data.sentAt).getTime();
      const dateB = new Date(b.data.sentAt).getTime();
      return dateB - dateA;
    });
  } catch (error) {
    console.error("Error fetching messages:", error);
    return [];
  }
}

/**
 * Get all platform messages (for admin view)
 */
export async function getAllPlatformMessages(): Promise<Doc<PlatformMessage>[]> {
  try {
    const result = await listDocs<PlatformMessage>({
      collection: "platform_messages",
    });

    return result.items.sort((a, b) => {
      const dateA = new Date(a.data.sentAt).getTime();
      const dateB = new Date(b.data.sentAt).getTime();
      return dateB - dateA;
    });
  } catch (error) {
    console.error("Error fetching messages:", error);
    return [];
  }
}

/**
 * Mark message as read
 */
export async function markMessageAsRead(
  messageId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const docResult = await getDoc<PlatformMessage>({
      collection: "platform_messages",
      key: messageId,
    });

    if (!docResult) {
      return { success: false, error: "Message not found" };
    }

    const updatedMessage: PlatformMessage = {
      ...docResult.data,
      status: "read",
      readAt: new Date().toISOString(),
    };

    await setDoc({
      collection: "platform_messages",
      doc: {
        key: messageId,
        data: updatedMessage,
        version: docResult.version,
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Error marking message as read:", error);
    return { success: false, error: "Failed to mark message as read" };
  }
}

/**
 * Respond to a platform message (business replying)
 */
export async function respondToMessage(
  response: MessageResponse
): Promise<{ success: boolean; error?: string }> {
  try {
    const docResult = await getDoc<PlatformMessage>({
      collection: "platform_messages",
      key: response.messageId,
    });

    if (!docResult) {
      return { success: false, error: "Message not found" };
    }

    const updatedMessage: PlatformMessage = {
      ...docResult.data,
      status: "responded",
      responseContent: response.responseContent,
      respondedAt: new Date().toISOString(),
      attachments: [
        ...(docResult.data.attachments || []),
        ...(response.attachments || []),
      ],
    };

    await setDoc({
      collection: "platform_messages",
      doc: {
        key: response.messageId,
        data: updatedMessage,
        version: docResult.version,
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Error responding to message:", error);
    return { success: false, error: "Failed to send response" };
  }
}

/**
 * Get unread message count for business
 */
export async function getUnreadMessageCount(businessId: string): Promise<number> {
  try {
    const messages = await getBusinessMessages(businessId);
    return messages.filter(
      (msg) => msg.data.to === businessId && msg.data.status === "sent"
    ).length;
  } catch (error) {
    console.error("Error getting unread count:", error);
    return 0;
  }
}

/**
 * Send bulk messages to multiple businesses
 */
export async function sendBulkMessages(
  businessIds: string[],
  request: Omit<SendMessageRequest, "to" | "toName">,
  fromAdminId: string
): Promise<{ success: boolean; sent: number; failed: number }> {
  let sent = 0;
  let failed = 0;

  for (const businessId of businessIds) {
    const result = await sendPlatformMessage(
      { ...request, to: businessId },
      fromAdminId
    );
    
    if (result.success) {
      sent++;
    } else {
      failed++;
    }
  }

  return { success: failed === 0, sent, failed };
}

/**
 * Send a message from business to admin/platform
 */
export async function sendBusinessToAdminMessage(
  request: {
    subject: string;
    content: string;
    type?: PlatformMessageType;
    attachments?: MessageAttachment[];
    replyToMessageId?: string;
    replyToContent?: string;
    replyToSubject?: string;
    threadId?: string; // If replying, use existing threadId
  },
  fromBusinessId: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // If replying, get the original message to find threadId and update counts
    let threadId = request.threadId;
    let isThreadStarter = false;
    
    if (request.replyToMessageId && !threadId) {
      try {
        const originalDoc = await getDoc<PlatformMessage>({
          collection: "platform_messages",
          key: request.replyToMessageId,
        });
        if (originalDoc) {
          threadId = originalDoc.data.threadId;
        }
      } catch (e) {
        console.warn("Could not find original message for threadId", e);
      }
    }
    
    // If still no threadId, this is a new thread
    if (!threadId) {
      threadId = `thread_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      isThreadStarter = true;
    }
    
    const message: PlatformMessage = {
      messageId,
      threadId,
      from: fromBusinessId,
      to: "platform",
      subject: request.subject.trim(),
      content: request.content.trim(),
      type: request.type || "request",
      status: "sent",
      sentAt: new Date().toISOString(),
      attachments: request.attachments || [],
      replyToMessageId: request.replyToMessageId,
      replyToContent: request.replyToContent,
      replyToSubject: request.replyToSubject,
      isThreadStarter,
      threadMessageCount: 1,
    };

    await setDoc({
      collection: "platform_messages",
      doc: {
        key: messageId,
        data: message,
      }
    });

    return { success: true, messageId };
  } catch (error) {
    console.error("Error sending business message:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to send message" 
    };
  }
}

/**
 * Get all messages in a conversation thread
 */
export async function getThreadMessages(threadId: string): Promise<Doc<PlatformMessage>[]> {
  try {
    const result = await listDocs<PlatformMessage>({
      collection: "platform_messages",
      filter: {
        paginate: {
          limit: 1000,
        }
      }
    });

    const threadMessages = result.items.filter((msg) => msg.data.threadId === threadId);
    
    // Sort by sentAt ascending (oldest first) for conversation view
    return threadMessages.sort((a, b) => {
      const dateA = new Date(a.data.sentAt).getTime();
      const dateB = new Date(b.data.sentAt).getTime();
      return dateA - dateB;
    });
  } catch (error) {
    console.error("Error fetching thread messages:", error);
    return [];
  }
}

/**
 * Reply to a message in a thread (creates new message in same thread)
 */
export async function replyToThread(
  request: {
    threadId: string;
    replyToMessageId: string;
    subject: string;
    content: string;
    type?: PlatformMessageType;
    attachments?: MessageAttachment[];
    from: string; // "platform" or businessId
    to: string; // businessId or "platform"
    fromName?: string;
    toName?: string;
  }
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Get the original message for context
    const originalDoc = await getDoc<PlatformMessage>({
      collection: "platform_messages",
      key: request.replyToMessageId,
    });

    const message: PlatformMessage = {
      messageId,
      threadId: request.threadId,
      from: request.from,
      to: request.to,
      fromName: request.fromName || (request.from === "platform" ? "AmanaTrade Platform" : undefined),
      toName: request.toName,
      subject: request.subject.trim(),
      content: request.content.trim(),
      type: request.type || "info",
      status: "sent",
      sentAt: new Date().toISOString(),
      attachments: request.attachments || [],
      replyToMessageId: request.replyToMessageId,
      replyToContent: originalDoc?.data.content.substring(0, 100),
      replyToSubject: originalDoc?.data.subject,
      isThreadStarter: false,
      threadMessageCount: 1,
    };

    await setDoc({
      collection: "platform_messages",
      doc: {
        key: messageId,
        data: message,
      }
    });

    return { success: true, messageId };
  } catch (error) {
    console.error("Error replying to thread:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to send reply" 
    };
  }
}

/**
 * Get conversation threads (grouped messages)
 */
export async function getConversationThreads(
  userId: string,
  isAdmin: boolean = false
): Promise<Array<{ thread: Doc<PlatformMessage>; messageCount: number; lastMessage: Doc<PlatformMessage> }>> {
  try {
    const messages = isAdmin ? await getAllPlatformMessages() : await getBusinessMessages(userId);
    
    // Group messages by threadId
    const threadsMap = new Map<string, Doc<PlatformMessage>[]>();
    
    messages.forEach((msg) => {
      const threadId = msg.data.threadId;
      if (!threadsMap.has(threadId)) {
        threadsMap.set(threadId, []);
      }
      threadsMap.get(threadId)!.push(msg);
    });
    
    // Convert to array with thread starter and metadata
    const threads = Array.from(threadsMap.entries()).map(([threadId, msgs]) => {
      // Sort messages by sentAt
      const sortedMsgs = msgs.sort((a, b) => {
        const dateA = new Date(a.data.sentAt).getTime();
        const dateB = new Date(b.data.sentAt).getTime();
        return dateA - dateB;
      });
      
      const threadStarter = sortedMsgs.find(m => m.data.isThreadStarter) || sortedMsgs[0];
      const lastMessage = sortedMsgs[sortedMsgs.length - 1];
      
      return {
        thread: threadStarter,
        messageCount: sortedMsgs.length,
        lastMessage,
      };
    });
    
    // Sort by last message date (newest first)
    return threads.sort((a, b) => {
      const dateA = new Date(a.lastMessage.data.sentAt).getTime();
      const dateB = new Date(b.lastMessage.data.sentAt).getTime();
      return dateB - dateA;
    });
  } catch (error) {
    console.error("Error fetching conversation threads:", error);
    return [];
  }
}
