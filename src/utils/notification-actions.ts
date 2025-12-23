import { setDoc } from "@junobuild/core";
import type { Notification } from "@/schemas";

/**
 * Create a new notification
 */
export async function createNotification(
  userId: string,
  notification: Omit<Notification, "userId" | "read" | "createdAt">
): Promise<{ success: boolean; error?: string }> {
  try {
    const now = BigInt(Date.now() * 1000000); // Convert to nanoseconds

    await setDoc({
      collection: "notifications",
      doc: {
        key: `notif_${userId}_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        data: {
          ...notification,
          userId,
          read: false,
          priority: notification.priority || "normal",
          createdAt: now,
        },
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Error creating notification:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create notification",
    };
  }
}

/**
 * Mark notification as read
 */
export async function markNotificationAsRead(
  notificationKey: string,
  version: bigint
): Promise<{ success: boolean; error?: string }> {
  try {
    const now = BigInt(Date.now() * 1000000);

    await setDoc({
      collection: "notifications",
      doc: {
        key: notificationKey,
        data: {
          read: true,
          readAt: now,
        },
        version,
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Error marking notification as read:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update notification",
    };
  }
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllNotificationsAsRead(
  notifications: Array<{ key: string; version?: bigint }>
): Promise<{ success: boolean; error?: string }> {
  try {
    const now = BigInt(Date.now() * 1000000);

    await Promise.all(
      notifications.map((notif) =>
        setDoc({
          collection: "notifications",
          doc: {
            key: notif.key,
            data: {
              read: true,
              readAt: now,
            },
            version: notif.version,
          },
        })
      )
    );

    return { success: true };
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update notifications",
    };
  }
}

/**
 * Notification creators for different event types
 */

export async function notifyProfitDistribution(
  userId: string,
  amount: number,
  businessName: string,
  investmentId: string
) {
  return createNotification(userId, {
    type: "profit_distribution",
    title: "Profit Distribution Received",
    message: `You've received ₦${amount.toLocaleString()} from ${businessName}.`,
    priority: "high",
    actionUrl: `/member/details?id=${investmentId}`,
    metadata: {
      investmentId,
      amount,
    },
  });
}

export async function notifyNewOpportunity(
  userId: string,
  opportunityTitle: string,
  expectedReturn: string,
  opportunityId: string
) {
  return createNotification(userId, {
    type: "new_opportunity",
    title: "New Investment Opportunity",
    message: `${opportunityTitle} is now accepting investments. Expected return: ${expectedReturn}.`,
    priority: "normal",
    actionUrl: `/member/dashboard#opportunity-${opportunityId}`,
    metadata: {
      opportunityId,
    },
  });
}

export async function notifyInvestmentMilestone(
  userId: string,
  milestone: string,
  details: string
) {
  return createNotification(userId, {
    type: "investment_milestone",
    title: milestone,
    message: details,
    priority: "normal",
  });
}

export async function notifyKYCUpdate(
  userId: string,
  status: "verified" | "rejected" | "in-review",
  details: string
) {
  return createNotification(userId, {
    type: "kyc_update",
    title: `KYC Status: ${status.charAt(0).toUpperCase() + status.slice(1).replace("-", " ")}`,
    message: details,
    priority: status === "verified" ? "high" : "urgent",
    actionUrl: "/member/kyc",
  });
}

export async function notifyDepositConfirmed(
  userId: string,
  amount: number,
  transactionId: string
) {
  return createNotification(userId, {
    type: "deposit_confirmed",
    title: "Deposit Confirmed",
    message: `Your deposit of ₦${amount.toLocaleString()} has been confirmed and added to your wallet.`,
    priority: "high",
    actionUrl: "/member/wallet",
    metadata: {
      amount,
      transactionId,
    },
  });
}

export async function notifyWithdrawalProcessed(
  userId: string,
  amount: number,
  transactionId: string
) {
  return createNotification(userId, {
    type: "withdrawal_processed",
    title: "Withdrawal Processed",
    message: `Your withdrawal of ₦${amount.toLocaleString()} has been processed successfully.`,
    priority: "high",
    actionUrl: "/member/wallet",
    metadata: {
      amount,
      transactionId,
    },
  });
}

export async function notifyInvestmentMaturity(
  userId: string,
  investmentId: string,
  businessName: string,
  daysRemaining: number
) {
  return createNotification(userId, {
    type: "investment_maturity",
    title: "Investment Maturity Reminder",
    message: `Your investment in ${businessName} will mature in ${daysRemaining} days.`,
    priority: "normal",
    actionUrl: `/member/details?id=${investmentId}`,
    metadata: {
      investmentId,
    },
  });
}

export async function notifyBusinessUpdate(
  userId: string,
  investmentId: string,
  businessName: string,
  updateTitle: string,
  updateMessage: string
) {
  return createNotification(userId, {
    type: "business_update",
    title: `Update: ${businessName}`,
    message: `${updateTitle} - ${updateMessage}`,
    priority: "normal",
    actionUrl: `/member/details?id=${investmentId}`,
    metadata: {
      investmentId,
    },
  });
}

export async function notifySystemAnnouncement(
  userId: string,
  title: string,
  message: string,
  priority: "low" | "normal" | "high" | "urgent" = "normal"
) {
  return createNotification(userId, {
    type: "system_announcement",
    title,
    message,
    priority,
  });
}
