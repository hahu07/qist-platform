"use client";

import { ThemeToggle } from "@/components/theme-toggle";
import { AuthButton } from "@/components/auth-button";
import { initSatellite, onAuthStateChange } from "@junobuild/core";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { PlatformMessage } from "@/schemas";
import type { Doc } from "@junobuild/core";
import toast from "react-hot-toast";
import { getConversationThreads, getThreadMessages, replyToThread } from "@/utils/platform-message-actions";

type User = {
  key: string;
} | null | undefined;

export default function BusinessConversationsPage() {
  const [user, setUser] = useState<User>(undefined);
  const [loading, setLoading] = useState(true);
  const [threads, setThreads] = useState<Array<{thread: Doc<PlatformMessage>; messageCount: number; lastMessage: Doc<PlatformMessage>}>>([]);
  const [selectedThread, setSelectedThread] = useState<{thread: Doc<PlatformMessage>; messageCount: number; lastMessage: Doc<PlatformMessage>} | null>(null);
  const [threadMessages, setThreadMessages] = useState<Doc<PlatformMessage>[]>([]);
  const [replyContent, setReplyContent] = useState("");
  const [sending, setSending] = useState(false);
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
      loadThreads();
    }
  }, [user]);

  const loadThreads = async () => {
    if (!user) return;
    try {
      const conversationThreads = await getConversationThreads(user.key, false);
      setThreads(conversationThreads);
    } catch (error) {
      console.error("Error loading threads:", error);
      toast.error("Failed to load conversations");
    }
  };

  const loadThreadMessages = async (threadId: string) => {
    try {
      const messages = await getThreadMessages(threadId);
      setThreadMessages(messages);
    } catch (error) {
      console.error("Error loading thread messages:", error);
      toast.error("Failed to load conversation messages");
    }
  };

  const handleSelectThread = async (thread: {thread: Doc<PlatformMessage>; messageCount: number; lastMessage: Doc<PlatformMessage>}) => {
    setSelectedThread(thread);
    await loadThreadMessages(thread.thread.data.threadId);
  };

  const handleSendReply = async () => {
    if (!user || !selectedThread || !replyContent.trim()) return;
    if (replyContent.length < 10 || replyContent.length > 10000) {
      toast.error("Message must be between 10 and 10,000 characters");
      return;
    }

    setSending(true);
    try {
      const lastMsg = threadMessages[threadMessages.length - 1];
      const result = await replyToThread({
        threadId: selectedThread.thread.data.threadId,
        replyToMessageId: lastMsg.key,
        subject: `Re: ${selectedThread.thread.data.subject}`,
        content: replyContent,
        type: "request",
        from: user.key,
        to: "platform",
      });

      if (result.success) {
        toast.success("Reply sent successfully");
        setReplyContent("");
        await loadThreadMessages(selectedThread.thread.data.threadId);
        await loadThreads();
      } else {
        toast.error(result.error || "Failed to send reply");
      }
    } catch (error) {
      console.error("Error sending reply:", error);
      toast.error("Failed to send reply");
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      {/* Header */}
      <header className="bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <svg className="w-6 h-6 text-primary-600 dark:text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
              <h1 className="text-xl font-bold text-neutral-900 dark:text-white">Conversations</h1>
            </div>
            <div className="flex items-center gap-4">
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
            href="/business/dashboard"
            className="inline-flex items-center gap-2 text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Dashboard
          </Link>
        </div>

        {/* Conversations Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Thread List */}
          <div className="lg:col-span-1 bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-800 shadow-sm">
            <div className="p-4 border-b border-neutral-200 dark:border-neutral-700">
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
                Your Conversations ({threads.length})
              </h2>
            </div>
            <div className="divide-y divide-neutral-200 dark:divide-neutral-700 max-h-[600px] overflow-y-auto">
              {threads.length === 0 ? (
                <div className="p-8 text-center text-neutral-500 dark:text-neutral-400">
                  <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                  <p className="text-sm">No conversations yet</p>
                </div>
              ) : (
                threads.map((thread) => (
                  <button
                    key={thread.thread.key}
                    onClick={() => handleSelectThread(thread)}
                    className={`w-full p-4 text-left hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors ${
                      selectedThread?.thread.key === thread.thread.key
                        ? "bg-primary-50 dark:bg-primary-900/20"
                        : ""
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-neutral-900 dark:text-white text-sm line-clamp-1">
                        {thread.thread.data.subject}
                      </h3>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                        {thread.messageCount}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-600 dark:text-neutral-400 line-clamp-2 mb-2">
                      {thread.lastMessage.data.content}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-neutral-500 dark:text-neutral-500">
                        {new Date(thread.lastMessage.data.sentAt).toLocaleDateString()}
                      </span>
                      <span className="text-xs text-neutral-500 dark:text-neutral-500">
                        {thread.lastMessage.data.from === "platform" ? "From Admin" : "You"}
                      </span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Conversation View */}
          <div className="lg:col-span-2">
            {selectedThread ? (
              <div className="bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-800 shadow-sm">
                {/* Thread Header */}
                <div className="p-6 border-b border-neutral-200 dark:border-neutral-700">
                  <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-2">
                    {selectedThread.thread.data.subject}
                  </h2>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    {threadMessages.length} {threadMessages.length === 1 ? "message" : "messages"} in this conversation
                  </p>
                </div>

                {/* Messages */}
                <div className="p-6 space-y-4 max-h-[500px] overflow-y-auto">
                  {threadMessages.map((msg, idx) => {
                    const isFromAdmin = msg.data.from === "platform";
                    return (
                      <div key={msg.key} className={`flex ${isFromAdmin ? "justify-start" : "justify-end"}`}>
                        <div className={`max-w-[80%] ${isFromAdmin ? "bg-neutral-100 dark:bg-neutral-800" : "bg-primary-100 dark:bg-primary-900/30"} rounded-lg p-4`}>
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`text-xs font-semibold ${isFromAdmin ? "text-neutral-700 dark:text-neutral-300" : "text-primary-700 dark:text-primary-300"}`}>
                              {isFromAdmin ? "AmanaTrade Platform" : "You"}
                            </span>
                            <span className="text-xs text-neutral-500 dark:text-neutral-500">
                              {new Date(msg.data.sentAt).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-sm text-neutral-900 dark:text-white whitespace-pre-wrap">
                            {msg.data.content}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Reply Form */}
                <div className="p-6 border-t border-neutral-200 dark:border-neutral-700">
                  <div className="relative">
                    <textarea
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      placeholder="Type your reply..."
                      rows={4}
                      className={`w-full px-4 py-3 bg-white dark:bg-neutral-800 border ${
                        replyContent.length > 0 && (replyContent.length < 10 || replyContent.length > 10000)
                          ? "border-red-500"
                          : "border-neutral-300 dark:border-neutral-700"
                      } rounded-lg text-neutral-900 dark:text-white placeholder-neutral-500 dark:placeholder-neutral-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all resize-none`}
                    />
                    <div className="mt-2 flex items-center justify-between">
                      <span className={`text-xs ${
                        replyContent.length > 0 && (replyContent.length < 10 || replyContent.length > 10000)
                          ? "text-red-500"
                          : "text-neutral-500 dark:text-neutral-400"
                      }`}>
                        {replyContent.length}/10,000 (min: 10)
                      </span>
                      {replyContent.length > 0 && replyContent.length < 10 && (
                        <span className="text-xs text-red-500">Message must be at least 10 characters</span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={handleSendReply}
                    disabled={sending || !replyContent.trim() || replyContent.length < 10 || replyContent.length > 10000}
                    className="mt-4 w-full px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white font-semibold rounded-lg transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {sending ? "Sending..." : "Send Reply"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-800 shadow-sm p-12 text-center">
                <svg className="w-16 h-16 text-neutral-300 dark:text-neutral-700 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
                <p className="text-neutral-600 dark:text-neutral-400">Select a conversation to view messages</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
