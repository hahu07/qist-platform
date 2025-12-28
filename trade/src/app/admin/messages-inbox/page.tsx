"use client";

import { ThemeToggle } from "@/components/theme-toggle";
import { AuthButton } from "@/components/auth-button";
import { initSatellite, onAuthStateChange, getDoc, type Doc } from "@junobuild/core";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getAllPlatformMessages } from "@/utils/platform-message-actions";
import type { PlatformMessage } from "@/schemas";
import toast from "react-hot-toast";

type User = {
  key: string;
} | null | undefined;

type MessageFilter = "all" | "sent" | "read" | "responded" | "urgent";

export default function AdminMessagesInboxPage() {
  const [user, setUser] = useState<User>(undefined);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<Doc<PlatformMessage>[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<Doc<PlatformMessage> | null>(null);
  const [filter, setFilter] = useState<MessageFilter>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const router = useRouter();

  useEffect(() => {
    (async () => await initSatellite({ workers: { auth: true } }))();
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChange((authUser) => {
      setUser(authUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/signin");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      loadMessages();
    }
  }, [user]);

  const loadMessages = async () => {
    setLoading(true);
    try {
      const msgs = await getAllPlatformMessages();
      
      // Enrich messages with business names
      const enrichedMessages = await Promise.all(
        msgs.map(async (msg) => {
          // If message is from a business (not from platform), fetch business name
          if (msg.data.from !== "platform" && !msg.data.businessName) {
            try {
              const businessProfile = await getDoc<any>({
                collection: "business_profiles",
                key: msg.data.from,
              });
              
              if (businessProfile) {
                return {
                  ...msg,
                  data: {
                    ...msg.data,
                    businessName: businessProfile.data.businessName || "Business",
                  },
                };
              }
            } catch (err) {
              console.log("Could not fetch business name for:", msg.data.from);
            }
          }
          return msg;
        })
      );
      
      setMessages(enrichedMessages);
    } catch (error) {
      console.error("Error loading messages:", error);
      toast.error("Failed to load messages");
    } finally {
      setLoading(false);
    }
  };

  const getFilteredMessages = () => {
    let filtered = messages;

    // Apply status filter
    if (filter !== "all") {
      if (filter === "urgent") {
        filtered = filtered.filter((msg) => msg.data.type === "urgent");
      } else {
        filtered = filtered.filter((msg) => msg.data.status === filter);
      }
    }

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (msg) =>
          msg.data.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
          msg.data.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
          msg.data.toName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          msg.data.businessName?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  };

  const getMessageTypeStyles = (type: string) => {
    switch (type) {
      case "urgent":
        return "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-red-300 dark:border-red-700";
      case "warning":
        return "bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-700";
      case "request":
        return "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-700";
      default:
        return "bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-300 border-neutral-300 dark:border-neutral-700";
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "sent":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-xs font-medium rounded-full">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
              <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
            </svg>
            Sent
          </span>
        );
      case "read":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 text-xs font-medium rounded-full">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
              <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
            </svg>
            Read
          </span>
        );
      case "responded":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 text-xs font-medium rounded-full">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Responded
          </span>
        );
      default:
        return null;
    }
  };

  const filteredMessages = getFilteredMessages();
  const stats = {
    total: messages.length,
    sent: messages.filter((m) => m.data.status === "sent" && !m.data.readAt).length,
    read: messages.filter((m) => m.data.readAt && m.data.status !== "responded").length,
    responded: messages.filter((m) => m.data.status === "responded").length,
    urgent: messages.filter((m) => m.data.type === "urgent" && m.data.status !== "responded").length,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-primary-50/30 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-neutral-600 dark:text-neutral-400">Loading messages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-primary-50/30 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950">
      {/* Header */}
      <header className="bg-white/80 dark:bg-neutral-900/80 backdrop-blur-sm border-b border-neutral-200 dark:border-neutral-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <Link href="/admin/dashboard" className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-blue-600 bg-clip-text text-transparent hover:from-primary-700 hover:to-blue-700 transition-all">
                AmanaTrade Admin
              </Link>
              <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">Messages Inbox</p>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/admin/business-messages"
                className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg transition-colors"
              >
                Send Message
              </Link>
              <ThemeToggle />
              <AuthButton />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation */}
        <div className="mb-6">
          <Link
            href="/admin/dashboard"
            className="inline-flex items-center gap-2 text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Dashboard
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <button
            onClick={() => setFilter("all")}
            className={`p-4 rounded-xl border-2 transition-all ${
              filter === "all"
                ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20"
                : "border-neutral-200 dark:border-neutral-800 hover:border-primary-300 dark:hover:border-primary-700"
            }`}
          >
            <div className="text-2xl font-bold text-neutral-900 dark:text-white">{stats.total}</div>
            <div className="text-sm text-neutral-600 dark:text-neutral-400">Total Messages</div>
          </button>

          <button
            onClick={() => setFilter("sent")}
            className={`p-4 rounded-xl border-2 transition-all ${
              filter === "sent"
                ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                : "border-neutral-200 dark:border-neutral-800 hover:border-blue-300 dark:hover:border-blue-700"
            }`}
          >
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.sent}</div>
            <div className="text-sm text-neutral-600 dark:text-neutral-400">Sent</div>
          </button>

          <button
            onClick={() => setFilter("read")}
            className={`p-4 rounded-xl border-2 transition-all ${
              filter === "read"
                ? "border-amber-500 bg-amber-50 dark:bg-amber-900/20"
                : "border-neutral-200 dark:border-neutral-800 hover:border-amber-300 dark:hover:border-amber-700"
            }`}
          >
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">{stats.read}</div>
            <div className="text-sm text-neutral-600 dark:text-neutral-400">Read</div>
          </button>

          <button
            onClick={() => setFilter("responded")}
            className={`p-4 rounded-xl border-2 transition-all ${
              filter === "responded"
                ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                : "border-neutral-200 dark:border-neutral-800 hover:border-green-300 dark:hover:border-green-700"
            }`}
          >
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.responded}</div>
            <div className="text-sm text-neutral-600 dark:text-neutral-400">Responded</div>
          </button>

          <button
            onClick={() => setFilter("urgent")}
            className={`p-4 rounded-xl border-2 transition-all ${
              filter === "urgent"
                ? "border-red-500 bg-red-50 dark:bg-red-900/20"
                : "border-neutral-200 dark:border-neutral-800 hover:border-red-300 dark:hover:border-red-700"
            }`}
          >
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.urgent}</div>
            <div className="text-sm text-neutral-600 dark:text-neutral-400">Urgent</div>
          </button>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search messages by subject, content, or business name..."
              className="w-full px-4 py-3 pl-12 bg-white dark:bg-neutral-900 border-2 border-neutral-200 dark:border-neutral-800 rounded-xl text-neutral-900 dark:text-white placeholder-neutral-500 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <svg
              className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Message List */}
          <div className="lg:col-span-1 bg-white dark:bg-neutral-900 rounded-2xl border-2 border-neutral-200 dark:border-neutral-800 overflow-hidden">
            <div className="p-4 bg-gradient-to-r from-primary-50 to-blue-50 dark:from-primary-900/20 dark:to-blue-900/20 border-b border-neutral-200 dark:border-neutral-700">
              <h2 className="text-lg font-bold text-neutral-900 dark:text-white">
                {filter === "all" ? "All Messages" : filter.charAt(0).toUpperCase() + filter.slice(1)} ({filteredMessages.length})
              </h2>
            </div>

            <div className="divide-y divide-neutral-200 dark:divide-neutral-700 max-h-[700px] overflow-y-auto">
              {filteredMessages.length === 0 ? (
                <div className="p-8 text-center">
                  <svg className="w-16 h-16 text-neutral-300 dark:text-neutral-700 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                  <p className="text-neutral-600 dark:text-neutral-400 text-sm">No messages found</p>
                </div>
              ) : (
                filteredMessages.map((msg) => (
                  <button
                    key={msg.key}
                    onClick={() => setSelectedMessage(msg)}
                    className={`w-full p-4 text-left hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors ${
                      selectedMessage?.key === msg.key ? "bg-primary-50 dark:bg-primary-900/20" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-xs px-2 py-1 rounded-full border ${getMessageTypeStyles(msg.data.type)}`}>
                          {msg.data.type.toUpperCase()}
                        </span>
                        {msg.data.replyToMessageId && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs font-medium rounded-full border border-purple-300 dark:border-purple-700">
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                            </svg>
                            Reply
                          </span>
                        )}
                        {msg.data.from !== "platform" && msg.data.responseContent && !msg.data.replyToMessageId && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs font-medium rounded-full border border-green-300 dark:border-green-700">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                            </svg>
                            Replied
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-neutral-500 dark:text-neutral-400 whitespace-nowrap">
                        {new Date(msg.data.sentAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-neutral-900 dark:text-white mb-1">
                      {msg.data.from === "platform" ? (
                        <span>To: {msg.data.toName || msg.data.businessName || "Business"}</span>
                      ) : (
                        <span>From: {msg.data.businessName || "Business"}</span>
                      )}
                    </p>
                    <p className="text-sm text-neutral-900 dark:text-white mb-1 line-clamp-1">
                      {msg.data.subject}
                    </p>
                    <p className="text-xs text-neutral-600 dark:text-neutral-400 line-clamp-2 mb-2">
                      {msg.data.content}
                    </p>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(msg.data.status)}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Message Detail */}
          <div className="lg:col-span-2 bg-white dark:bg-neutral-900 rounded-2xl border-2 border-neutral-200 dark:border-neutral-800 overflow-hidden">
            {selectedMessage ? (
              <div className="flex flex-col h-[750px]">
                {/* Message Header */}
                <div className="p-6 bg-gradient-to-r from-primary-50 to-blue-50 dark:from-primary-900/20 dark:to-blue-900/20 border-b border-neutral-200 dark:border-neutral-700">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`text-xs px-2 py-1 rounded-full border ${getMessageTypeStyles(selectedMessage.data.type)}`}>
                          {selectedMessage.data.type.toUpperCase()}
                        </span>
                        {getStatusBadge(selectedMessage.data.status)}
                      </div>
                      <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-2">
                        {selectedMessage.data.subject}
                      </h3>
                      <div className="flex items-center gap-4 text-sm text-neutral-600 dark:text-neutral-400">
                        <span>
                          {selectedMessage.data.from === "platform" ? (
                            <span>To: <span className="font-semibold">{selectedMessage.data.toName || selectedMessage.data.businessName || "Business"}</span></span>
                          ) : (
                            <span>From: <span className="font-semibold">{selectedMessage.data.businessName || "Business"}</span></span>
                          )}
                        </span>
                        <span>•</span>
                        <span>{new Date(selectedMessage.data.sentAt).toLocaleString()}</span>
                      </div>
                      {selectedMessage.data.readAt && (
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                          Read at: {new Date(selectedMessage.data.readAt).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Message Content */}
                <div className="flex-1 overflow-y-auto p-6">
                  {/* Reply Context */}
                  {selectedMessage.data.replyToMessageId && (
                    <div className="mb-6 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border-l-4 border-purple-500 dark:border-purple-400">
                      <div className="flex items-center gap-2 mb-2">
                        <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                        </svg>
                        <span className="text-xs font-semibold text-purple-700 dark:text-purple-300">
                          In reply to: {selectedMessage.data.replyToSubject || 'Previous message'}
                        </span>
                      </div>
                      {selectedMessage.data.replyToContent && (
                        <p className="text-sm text-purple-800 dark:text-purple-300 italic pl-6">
                          "{selectedMessage.data.replyToContent}..."
                        </p>
                      )}
                    </div>
                  )}

                  <div className="prose dark:prose-invert max-w-none mb-6">
                    <h4 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
                      {selectedMessage.data.replyToMessageId ? 'Reply Message' : 'Original Message'}
                    </h4>
                    <p className="whitespace-pre-wrap text-neutral-800 dark:text-neutral-200 text-sm leading-relaxed">
                      {selectedMessage.data.content}
                    </p>
                  </div>

                  {selectedMessage.data.attachments && selectedMessage.data.attachments.length > 0 && (
                    <div className="mb-6">
                      <h4 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-3">Attachments</h4>
                      <div className="space-y-2">
                        {selectedMessage.data.attachments.map((url: string, idx: number) => (
                          <a
                            key={idx}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
                          >
                            <svg className="w-5 h-5 text-primary-600 dark:text-primary-400" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M8 4a3 3 0 00-3 3v4a5 5 0 0010 0V7a1 1 0 112 0v4a7 7 0 11-14 0V7a5 5 0 0110 0v4a3 3 0 11-6 0V7a1 1 0 012 0v4a1 1 0 102 0V7a3 3 0 00-3-3z" clipRule="evenodd" />
                            </svg>
                            <span className="text-sm text-neutral-700 dark:text-neutral-300">Attachment {idx + 1}</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedMessage.data.responseContent && (
                    <div className="p-5 bg-green-50 dark:bg-green-900/20 rounded-xl border-2 border-green-200 dark:border-green-800">
                      <div className="flex items-center gap-2 mb-3">
                        <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                        </svg>
                        <span className="text-sm font-bold text-green-800 dark:text-green-300">Business Response</span>
                        {selectedMessage.data.respondedAt && (
                          <span className="text-xs text-green-600 dark:text-green-400 ml-auto">
                            {new Date(selectedMessage.data.respondedAt).toLocaleString()}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-green-800 dark:text-green-300 whitespace-pre-wrap leading-relaxed">
                        {selectedMessage.data.responseContent}
                      </p>
                    </div>
                  )}

                  {!selectedMessage.data.responseContent && selectedMessage.data.status !== "sent" && (
                    <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                      <p className="text-sm text-amber-800 dark:text-amber-300">
                        <svg className="w-4 h-4 inline mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                        Message has been read but no response yet.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-[750px]">
                <div className="text-center">
                  <svg className="w-20 h-20 text-neutral-300 dark:text-neutral-700 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <p className="text-neutral-600 dark:text-neutral-400">Select a message to view details</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
