"use client";

import { useState, useEffect, useRef } from "react";
import {
  Message,
  MessageThread,
  MessageTemplate,
} from "@/schemas";
import {
  sendMessage,
  markMessageAsRead,
  getApplicationMessages,
  getUserMessageThreads,
  sendMessageFromTemplate,
  listMessageTemplates,
} from "@/utils/message-actions";

interface MessagingInterfaceProps {
  applicationId: string;
  currentUserId: string;
  currentUserType: "admin" | "business";
  currentUserName: string;
  recipientId?: string;
  recipientType?: "admin" | "business";
}

export function MessagingInterface({
  applicationId,
  currentUserId,
  currentUserType,
  currentUserName,
  recipientId,
  recipientType,
}: MessagingInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [subject, setSubject] = useState("");
  const [priority, setPriority] = useState<Message["priority"]>("normal");
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadMessages();
    loadTemplates();
    // Refresh messages every 30 seconds
    const interval = setInterval(loadMessages, 30000);
    return () => clearInterval(interval);
  }, [applicationId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadMessages = async () => {
    try {
      const msgs = await getApplicationMessages(applicationId, true);
      setMessages(msgs);

      // Mark unread messages as read
      for (const msg of msgs) {
        if (msg.recipientId === currentUserId && !msg.isRead) {
          await markMessageAsRead(
            `msg_${msg.applicationId}_${msg.timestamp}`
          );
        }
      }
    } catch (err) {
      console.error("Failed to load messages:", err);
    }
  };

  const loadTemplates = async () => {
    try {
      const tmpl = await listMessageTemplates();
      setTemplates(tmpl);
    } catch (err) {
      console.error("Failed to load templates:", err);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !recipientId) return;

    setLoading(true);
    try {
      await sendMessage({
        applicationId,
        senderId: currentUserId,
        senderType: currentUserType,
        senderName: currentUserName,
        recipientId,
        recipientType: recipientType!,
        subject: subject || undefined,
        content: newMessage,
        priority,
      });

      setNewMessage("");
      setSubject("");
      setPriority("normal");
      await loadMessages();
    } catch (err) {
      console.error("Failed to send message:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleUseTemplate = async (templateId: string) => {
    const template = templates.find((t) => t.templateId === templateId);
    if (!template || !recipientId) return;

    setLoading(true);
    try {
      // Extract variables from template content
      const variableMatches = template.content.match(/\{\{(\w+)\}\}/g) || [];
      const variables: Record<string, string> = {};

      // For demo, provide placeholder values
      // In production, show a form to collect these values
      for (const match of variableMatches) {
        const varName = match.replace(/\{\{|\}\}/g, "");
        variables[varName] = `[${varName.toUpperCase()}]`;
      }

      await sendMessageFromTemplate({
        templateId,
        applicationId,
        senderId: currentUserId,
        senderType: currentUserType,
        senderName: currentUserName,
        recipientId,
        recipientType: recipientType!,
        variables,
      });

      setShowTemplates(false);
      setSelectedTemplate("");
      await loadMessages();
    } catch (err) {
      console.error("Failed to send template message:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="flex flex-col h-[600px] border border-neutral-200 dark:border-neutral-700 rounded-xl overflow-hidden">
      {/* Messages Header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white p-4 border-b border-primary-700">
        <h3 className="text-lg font-bold">Messages</h3>
        <p className="text-sm opacity-90">Application #{applicationId}</p>
      </div>

      {/* Messages List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-neutral-50 dark:bg-neutral-900">
        {messages.length === 0 ? (
          <div className="text-center text-neutral-500 dark:text-neutral-400 py-8">
            No messages yet. Start the conversation!
          </div>
        ) : (
          messages.map((msg, index) => {
            const isCurrentUser = msg.senderId === currentUserId;
            const isInternal = msg.isInternal;

            return (
              <div
                key={index}
                className={`flex ${isCurrentUser ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[70%] rounded-xl p-4 ${
                    isInternal
                      ? "bg-amber-50 dark:bg-amber-900/20 border border-amber-300 dark:border-amber-800"
                      : isCurrentUser
                      ? "bg-primary-600 text-white"
                      : "bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700"
                  }`}
                >
                  {/* Message Header */}
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-bold text-sm">
                        {msg.senderName}
                        {isInternal && (
                          <span className="ml-2 text-xs bg-amber-500 text-white px-2 py-1">
                            INTERNAL
                          </span>
                        )}
                      </p>
                      <p
                        className={`text-xs ${
                          isCurrentUser && !isInternal
                            ? "text-white/75"
                            : "text-neutral-500 dark:text-neutral-400"
                        }`}
                      >
                        {formatTimestamp(msg.timestamp)}
                      </p>
                    </div>
                    {msg.priority !== "normal" && (
                      <span
                        className={`text-xs px-2 py-1 font-bold uppercase ${
                          msg.priority === "urgent"
                            ? "bg-red-500 text-white"
                            : "bg-amber-500 text-white"
                        }`}
                      >
                        {msg.priority}
                      </span>
                    )}
                  </div>

                  {/* Subject */}
                  {msg.subject && (
                    <p className="font-bold mb-2">{msg.subject}</p>
                  )}

                  {/* Content */}
                  <p className="whitespace-pre-wrap">{msg.content}</p>

                  {/* Attachments */}
                  {msg.attachments && msg.attachments.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-neutral-200 dark:border-neutral-700">
                      <p className="text-xs font-bold mb-2">Attachments:</p>
                      {msg.attachments.map((att, i) => (
                        <a
                          key={i}
                          href={att.downloadUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block text-sm underline hover:no-underline"
                        >
                          📎 {att.filename} ({(att.fileSize / 1024).toFixed(1)}KB)
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      {recipientId && (
        <div className="p-4 bg-white dark:bg-neutral-800 border-t border-neutral-200 dark:border-neutral-700">
          {/* Templates Toggle */}
          <div className="mb-3">
            <button
              onClick={() => setShowTemplates(!showTemplates)}
              className="text-sm font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400"
            >
              {showTemplates ? "Hide" : "Show"} Message Templates
            </button>
          </div>

          {/* Template Selector */}
          {showTemplates && (
            <div className="mb-3 p-3 bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg">
              <label className="block text-sm font-semibold mb-2 text-neutral-900 dark:text-white">
                Quick Templates:
              </label>
              <div className="flex flex-wrap gap-2">
                {templates.map((tmpl) => (
                  <button
                    key={tmpl.templateId}
                    onClick={() => handleUseTemplate(tmpl.templateId)}
                    disabled={loading}
                    className="px-3 py-1.5 text-xs bg-primary-600 hover:bg-primary-700 disabled:bg-neutral-400 text-white font-semibold rounded-lg transition-all"
                  >
                    {tmpl.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Priority & Subject */}
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-xs font-semibold mb-1 text-neutral-900 dark:text-white">Priority:</label>
              <select
                value={priority}
                onChange={(e) =>
                  setPriority(e.target.value as Message["priority"])
                }
                disabled={loading}
                className="w-full px-3 py-2 text-sm border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1 text-neutral-900 dark:text-white">
                Subject (Optional):
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                disabled={loading}
                placeholder="Message subject..."
                className="w-full px-3 py-2 text-sm border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Message Text Area */}
          <textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            disabled={loading}
            placeholder="Type your message..."
            rows={3}
            className="w-full px-4 py-3 text-sm border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none mb-3"
          />

          {/* Send Button */}
          <button
            onClick={handleSendMessage}
            disabled={loading || !newMessage.trim()}
            className="w-full px-6 py-3 bg-primary-600 hover:bg-primary-700 disabled:bg-neutral-400 disabled:cursor-not-allowed text-white font-semibold rounded-xl shadow-sm hover:shadow-md transition-all"
          >
            {loading ? "Sending..." : "Send Message"}
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * Message Threads List Component
 * Shows all message threads for a user
 */
export function MessageThreadsList({
  userId,
  onThreadSelect,
}: {
  userId: string;
  onThreadSelect?: (thread: MessageThread) => void;
}) {
  const [threads, setThreads] = useState<MessageThread[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadThreads();
    const interval = setInterval(loadThreads, 30000);
    return () => clearInterval(interval);
  }, [userId]);

  const loadThreads = async () => {
    try {
      const userThreads = await getUserMessageThreads(userId);
      setThreads(userThreads);
    } catch (err) {
      console.error("Failed to load threads:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 text-center border-[3px] border-black dark:border-lavender-blue-200">
        Loading conversations...
      </div>
    );
  }

  if (threads.length === 0) {
    return (
      <div className="p-6 text-center border-[3px] border-black dark:border-lavender-blue-200 text-gray-500 dark:text-gray-400">
        No conversations yet
      </div>
    );
  }

  return (
    <div className="space-y-2 border-[3px] border-black dark:border-lavender-blue-200 p-4">
      {threads.map((thread) => (
        <button
          key={thread.threadId}
          onClick={() => onThreadSelect?.(thread)}
          className="w-full text-left p-4 bg-white dark:bg-gray-800 hover:bg-lavender-blue-50 dark:hover:bg-lavender-blue-900 border-[3px] border-black dark:border-lavender-blue-200 shadow-[4px_4px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_#7888FF] transition-all active:translate-x-[4px] active:translate-y-[4px] active:shadow-none"
        >
          <div className="flex justify-between items-start mb-2">
            <p className="font-bold">{thread.subject}</p>
            {thread.unreadCount > 0 && (
              <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                {thread.unreadCount}
              </span>
            )}
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            {thread.lastMessagePreview}
          </p>
          <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-500">
            <span>{thread.messageCount} messages</span>
            <span>
              {new Date(thread.lastMessageAt).toLocaleDateString()}
            </span>
          </div>
        </button>
      ))}
    </div>
  );
}
