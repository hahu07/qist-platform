import { setDoc, listDocs, getDoc, type Doc } from "@junobuild/core";
import type { MemberMessage, MemberMessageType, MemberMessageAttachment, SendMemberMessageRequest, MemberMessageResponse } from "@/schemas";

/**
 * Send a message from platform to member
 */
export async function sendPlatformToMemberMessage(
  request: SendMemberMessageRequest,
  fromAdminId: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const messageId = `mmsg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const threadId = `mthread_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const message: MemberMessage = {
      messageId,
      threadId,
      from: "platform",
      to: request.to,
      fromName: "AmanaTrade Platform",
      toName: request.toName,
      memberName: request.toName,
      subject: request.subject,
      content: request.content,
      attachments: request.attachments || [],
      type: request.type,
      status: "sent",
      sentAt: new Date().toISOString(),
      relatedInvestmentId: request.relatedInvestmentId,
      relatedTransactionId: request.relatedTransactionId,
      isThreadStarter: true,
      threadMessageCount: 1,
    };

    await setDoc({
      collection: "member_messages",
      doc: {
        key: messageId,
        data: message,
      },
    });

    return { success: true, messageId };
  } catch (error) {
    console.error("Error sending message to member:", error);
    return { success: false, error: String(error) };
  }
}

/**
 * Get messages for a member
 */
export async function getMemberMessages(
  memberId: string
): Promise<Doc<MemberMessage>[]> {
  try {
    const result = await listDocs<MemberMessage>({
      collection: "member_messages",
      filter: {
        paginate: {
          limit: 1000,
        }
      }
    });

    const filtered = result.items.filter((msg) => {
      return msg.data.to === memberId || msg.data.from === memberId;
    });

    return filtered.sort((a, b) => {
      const dateA = new Date(a.data.sentAt).getTime();
      const dateB = new Date(b.data.sentAt).getTime();
      return dateB - dateA;
    });
  } catch (error) {
    console.error("Error fetching member messages:", error);
    return [];
  }
}

/**
 * Get all member messages (for admin view)
 */
export async function getAllMemberMessages(): Promise<Doc<MemberMessage>[]> {
  try {
    const result = await listDocs<MemberMessage>({
      collection: "member_messages",
    });

    return result.items.sort((a, b) => {
      const dateA = new Date(a.data.sentAt).getTime();
      const dateB = new Date(b.data.sentAt).getTime();
      return dateB - dateA;
    });
  } catch (error) {
    console.error("Error fetching all member messages:", error);
    return [];
  }
}

/**
 * Mark message as read
 */
export async function markMemberMessageAsRead(
  messageId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const docResult = await getDoc<MemberMessage>({
      collection: "member_messages",
      key: messageId,
    });

    if (!docResult) {
      return { success: false, error: "Message not found" };
    }

    const updatedMessage: MemberMessage = {
      ...docResult.data,
      status: "read",
      readAt: new Date().toISOString(),
    };

    await setDoc({
      collection: "member_messages",
      doc: {
        key: messageId,
        data: updatedMessage,
        version: docResult.version,
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Error marking member message as read:", error);
    return { success: false, error: "Failed to mark message as read" };
  }
}

/**
 * Send a message from member to admin/platform
 */
export async function sendMemberToAdminMessage(
  request: {
    subject: string;
    content: string;
    type?: MemberMessageType;
    attachments?: MemberMessageAttachment[];
    replyToMessageId?: string;
    replyToContent?: string;
    replyToSubject?: string;
    threadId?: string;
  },
  fromMemberId: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const messageId = `mmsg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    let threadId = request.threadId;
    let isThreadStarter = false;
    
    if (request.replyToMessageId && !threadId) {
      try {
        const originalDoc = await getDoc<MemberMessage>({
          collection: "member_messages",
          key: request.replyToMessageId,
        });
        if (originalDoc) {
          threadId = originalDoc.data.threadId;
        }
      } catch (e) {
        console.warn("Could not find original message for threadId", e);
      }
    }
    
    if (!threadId) {
      threadId = `mthread_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      isThreadStarter = true;
    }
    
    const message: MemberMessage = {
      messageId,
      threadId,
      from: fromMemberId,
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
      collection: "member_messages",
      doc: {
        key: messageId,
        data: message,
      }
    });

    return { success: true, messageId };
  } catch (error) {
    console.error("Error sending member message:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to send message" 
    };
  }
}

/**
 * Get all messages in a conversation thread
 */
export async function getMemberThreadMessages(threadId: string): Promise<Doc<MemberMessage>[]> {
  try {
    const result = await listDocs<MemberMessage>({
      collection: "member_messages",
      filter: {
        paginate: {
          limit: 1000,
        }
      }
    });

    const threadMessages = result.items.filter((msg) => msg.data.threadId === threadId);
    
    return threadMessages.sort((a, b) => {
      const dateA = new Date(a.data.sentAt).getTime();
      const dateB = new Date(b.data.sentAt).getTime();
      return dateA - dateB;
    });
  } catch (error) {
    console.error("Error fetching member thread messages:", error);
    return [];
  }
}

/**
 * Reply to a member message in a thread
 */
export async function replyToMemberThread(
  request: {
    threadId: string;
    replyToMessageId: string;
    subject: string;
    content: string;
    type?: MemberMessageType;
    attachments?: MemberMessageAttachment[];
    from: string;
    to: string;
    fromName?: string;
    toName?: string;
  }
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const messageId = `mmsg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const originalDoc = await getDoc<MemberMessage>({
      collection: "member_messages",
      key: request.replyToMessageId,
    });

    const message: MemberMessage = {
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
      collection: "member_messages",
      doc: {
        key: messageId,
        data: message,
      }
    });

    return { success: true, messageId };
  } catch (error) {
    console.error("Error replying to member thread:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to send reply" 
    };
  }
}

/**
 * Get member conversation threads (grouped messages)
 */
export async function getMemberConversationThreads(
  userId: string,
  isAdmin: boolean = false
): Promise<Array<{ thread: Doc<MemberMessage>; messageCount: number; lastMessage: Doc<MemberMessage> }>> {
  try {
    const messages = isAdmin ? await getAllMemberMessages() : await getMemberMessages(userId);
    
    const threadsMap = new Map<string, Doc<MemberMessage>[]>();
    
    messages.forEach((msg) => {
      const threadId = msg.data.threadId;
      if (!threadsMap.has(threadId)) {
        threadsMap.set(threadId, []);
      }
      threadsMap.get(threadId)!.push(msg);
    });
    
    const threads = Array.from(threadsMap.entries()).map(([threadId, msgs]) => {
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
    
    return threads.sort((a, b) => {
      const dateA = new Date(a.lastMessage.data.sentAt).getTime();
      const dateB = new Date(b.lastMessage.data.sentAt).getTime();
      return dateB - dateA;
    });
  } catch (error) {
    console.error("Error fetching member conversation threads:", error);
    return [];
  }
}

/**
 * Get unread message count for member
 */
export async function getUnreadMemberMessageCount(memberId: string): Promise<number> {
  try {
    const messages = await getMemberMessages(memberId);
    return messages.filter(
      (msg) => msg.data.to === memberId && msg.data.status === "sent"
    ).length;
  } catch (error) {
    console.error("Error getting unread member message count:", error);
    return 0;
  }
}

/**
 * Send bulk messages to multiple members
 */
export async function sendBulkMemberMessages(
  memberIds: string[],
  request: Omit<SendMemberMessageRequest, "to" | "toName">,
  fromAdminId: string
): Promise<{ success: boolean; sent: number; failed: number }> {
  let sent = 0;
  let failed = 0;

  for (const memberId of memberIds) {
    const result = await sendPlatformToMemberMessage(
      { ...request, to: memberId },
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
