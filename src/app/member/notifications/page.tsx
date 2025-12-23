"use client";

import { ThemeToggle } from "@/components/theme-toggle";
import { AuthButton } from "@/components/auth-button";
import { initSatellite, onAuthStateChange } from "@junobuild/core";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useNotifications } from "@/hooks/useNotifications";
import { markNotificationAsRead, markAllNotificationsAsRead } from "@/utils/notification-actions";
import type { Notification } from "@/schemas";
import type { Doc } from "@junobuild/core";

type User = {
  key: string;
} | null | undefined;

export default function NotificationsPage() {
  const [user, setUser] = useState<User>(undefined);
  const [filter, setFilter] = useState<string>("all");
  const router = useRouter();
  const { notifications, unreadCount, loading, refetch } = useNotifications(user?.key);

  useEffect(() => {
    (async () => await initSatellite({ workers: { auth: true } }))();
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChange((authUser) => {
      setUser(authUser);
    });

    return () => unsubscribe();
  }, [router]);

  const handleNotificationClick = async (notification: Doc<Notification>) => {
    if (!notification.data.read && notification.version) {
      await markNotificationAsRead(notification.key, notification.version);
      refetch();
    }

    if (notification.data.actionUrl) {
      router.push(notification.data.actionUrl);
    }
  };

  const handleMarkAllAsRead = async () => {
    const unreadNotifs = notifications
      .filter((n) => !n.data.read)
      .map((n) => ({ key: n.key, version: n.version }));

    if (unreadNotifs.length > 0) {
      await markAllNotificationsAsRead(unreadNotifs);
      refetch();
    }
  };

  const getNotificationIcon = (type: string) => {
    const icons = {
      profit_distribution: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
      new_opportunity: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
      investment_milestone: "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6",
      kyc_update: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
      deposit_confirmed: "M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z",
      withdrawal_processed: "M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z",
      business_update: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4",
      investment_maturity: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
      system_announcement: "M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z",
    };
    return icons[type as keyof typeof icons] || icons.system_announcement;
  };

  const getNotificationColor = (type: string) => {
    const colors = {
      profit_distribution: "from-business-600 to-business-700",
      new_opportunity: "from-primary-600 to-primary-700",
      investment_milestone: "from-success-600 to-success-700",
      kyc_update: "from-purple-600 to-purple-700",
      deposit_confirmed: "from-success-600 to-success-700",
      withdrawal_processed: "from-success-600 to-success-700",
      business_update: "from-blue-600 to-blue-700",
      investment_maturity: "from-warning-600 to-warning-700",
      system_announcement: "from-neutral-600 to-neutral-700",
    };
    return colors[type as keyof typeof colors] || colors.system_announcement;
  };

  const formatNotificationTime = (timestamp: bigint | undefined): string => {
    if (!timestamp) return "Just now";
    
    const date = new Date(Number(timestamp) / 1000000);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString("en-NG", { month: "short", day: "numeric", year: "numeric" });
  };

  const filteredNotifications = notifications.filter((n) => {
    if (filter === "all") return true;
    if (filter === "unread") return !n.data.read;
    return n.data.type === filter;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-neutral-50 to-white dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-neutral-600 dark:text-neutral-400">Loading notifications...</p>
        </div>
      </div>
    );
  }

  if (user === null) {
    router.push("/auth/signin");
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-neutral-50 to-white dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950">
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl border-b border-neutral-200 dark:border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/member/dashboard" className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span className="font-medium">Back to Dashboard</span>
            </Link>
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <AuthButton />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-white mb-2">Notifications</h1>
          <p className="text-neutral-600 dark:text-neutral-400">Stay updated with your investments and platform activities</p>
        </div>

        <div className="bg-white dark:bg-neutral-900 rounded-2xl border-2 border-neutral-200 dark:border-neutral-800 shadow-lg overflow-hidden">
          <div className="p-4 border-b-2 border-neutral-200 dark:border-neutral-800 bg-gradient-to-br from-white to-neutral-50 dark:from-neutral-900 dark:to-neutral-900/50">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setFilter("all")}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filter === "all"
                      ? "bg-primary-600 text-white"
                      : "bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700"
                  }`}
                >
                  All ({notifications.length})
                </button>
                <button
                  onClick={() => setFilter("unread")}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filter === "unread"
                      ? "bg-primary-600 text-white"
                      : "bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700"
                  }`}
                >
                  Unread ({unreadCount})
                </button>
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="px-4 py-2 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-lg text-sm font-medium transition-colors"
                >
                  Mark All Read
                </button>
              )}
            </div>
          </div>

          <div className="divide-y divide-neutral-200 dark:divide-neutral-800">
            {filteredNotifications.length === 0 ? (
              <div className="p-12 text-center">
                <div className="w-20 h-20 bg-neutral-100 dark:bg-neutral-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-10 h-10 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                </div>
                <p className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">
                  {filter === "unread" ? "No unread notifications" : "No notifications yet"}
                </p>
                <p className="text-sm text-neutral-500">
                  {filter === "unread" ? "You're all caught up!" : "You'll see updates about your investments here"}
                </p>
              </div>
            ) : (
              filteredNotifications.map((notification) => (
                <div
                  key={notification.key}
                  onClick={() => handleNotificationClick(notification)}
                  className={`p-6 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors cursor-pointer ${
                    notification.data.read ? "opacity-60" : ""
                  }`}
                >
                  <div className="flex gap-4">
                    <div className={`w-12 h-12 bg-gradient-to-br ${getNotificationColor(notification.data.type)} rounded-xl flex items-center justify-center flex-shrink-0`}>
                      <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={getNotificationIcon(notification.data.type)} />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <h3 className="font-bold text-base text-neutral-900 dark:text-white">{notification.data.title}</h3>
                        {!notification.data.read && (
                          <span className="w-2 h-2 bg-primary-600 rounded-full flex-shrink-0 mt-2"></span>
                        )}
                      </div>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-3 leading-relaxed">
                        {notification.data.message}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-neutral-500 dark:text-neutral-500">
                        <span className="font-medium">{formatNotificationTime(notification.created_at)}</span>
                        {notification.data.priority === "high" || notification.data.priority === "urgent" ? (
                          <span className={`px-2 py-1 rounded ${
                            notification.data.priority === "urgent"
                              ? "bg-error-100 dark:bg-error-900/30 text-error-700 dark:text-error-300"
                              : "bg-warning-100 dark:bg-warning-900/30 text-warning-700 dark:text-warning-300"
                          } font-medium`}>
                            {notification.data.priority}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
