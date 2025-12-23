"use client";

import { useEffect, useState } from "react";
import { listDocs, type Doc } from "@junobuild/core";
import type { Notification } from "@/schemas";

/**
 * Custom hook to fetch and manage notifications
 */
export function useNotifications(userId: string | undefined) {
  const [notifications, setNotifications] = useState<Doc<Notification>[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = async () => {
    if (!userId) {
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const result = await listDocs<Notification>({
        collection: "notifications",
        filter: {
          order: {
            desc: true,
            field: "created_at",
          },
        },
      });

      if (result?.items) {
        // Filter notifications for current user
        const userNotifications = result.items.filter(
          (notif) => notif.data.userId === userId
        );

        // Sort by creation time (most recent first)
        userNotifications.sort((a, b) => Number(b.created_at) - Number(a.created_at));

        setNotifications(userNotifications);
        setUnreadCount(userNotifications.filter((n) => !n.data.read).length);
      }
    } catch (err) {
      console.error("Error fetching notifications:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch notifications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();

    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);

    return () => clearInterval(interval);
  }, [userId]);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    refetch: fetchNotifications,
  };
}
