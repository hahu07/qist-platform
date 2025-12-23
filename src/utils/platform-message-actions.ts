import { setDoc, listDocs, getDoc, type Doc } from "@junobuild/core";
import type { PlatformMessage, SendMessageRequest, MessageResponse } from "@/schemas";

/**
 * Send a message from platform to business
 */
export async function sendPlatformMessage(
  request: SendMessageRequest,
  fromAdminId: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const message: PlatformMessage = {
      messageId,
      from: "platform",
      to: request.to,
      fromName: "AmanaTrade Platform",
      toName: request.toName,
      subject: request.subject,
      content: request.content,
      attachments: request.attachments || [],
      type: request.type,
      status: "sent",
      sentAt: new Date().toISOString(),
      relatedReportId: request.relatedReportId,
    };

    await setDoc({
      collection: "platform_messages",
      doc: {
        key: messageId,
        data: message,
      },
    });

    return { success: true, messageId };
  } catch (error) {
    console.error("Error sending message:", error);
    return { success: false, error: "Failed to send message" };
  }
}

/**
 * Get messages for a business
 */
export async function getBusinessMessages(
  businessId: string
): Promise<Doc<PlatformMessage>[]> {
  try {
    const result = await listDocs<PlatformMessage>({
      collection: "platform_messages",
    });

    return result.items
      .filter((msg) => msg.data.to === businessId || msg.data.from === businessId)
      .sort((a, b) => {
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
