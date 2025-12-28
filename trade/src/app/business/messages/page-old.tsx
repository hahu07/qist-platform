"use client";

import { ThemeToggle } from "@/components/theme-toggle";
import { AuthButton } from "@/components/auth-button";
import { initSatellite, onAuthStateChange, listDocs, uploadFile, setDoc, type Doc } from "@junobuild/core";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { BusinessProfile } from "@/schemas";
import toast from "react-hot-toast";
import { logger } from "@/utils/logger";
import { validateFileWithPreset } from "@/utils/file-validation";
import { getBusinessMessages, markMessageAsRead, respondToMessage, sendBusinessToAdminMessage } from "@/utils/platform-message-actions";

type User = {
  key: string;
} | null | undefined;

type PlatformMessage = {
  messageId: string;
  from: string;
  to: string;
  fromName?: string;
  toName?: string;
  subject: string;
  content: string;
  attachments?: string[];
  type: "info" | "request" | "warning" | "urgent";
  status: "sent" | "read" | "responded";
  sentAt: string;
  readAt?: string;
  responseContent?: string;
  respondedAt?: string;
  relatedReportId?: string;
  businessName?: string;
  replyToMessageId?: string;
  replyToContent?: string;
  replyToSubject?: string;
};

export default function BusinessMessagesPage() {
  const [user, setUser] = useState<User>(undefined);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<Doc<PlatformMessage>[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<Doc<PlatformMessage> | null>(null);
  const [responseContent, setResponseContent] = useState("");
  const [responding, setResponding] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [responseAttachments, setResponseAttachments] = useState<string[]>([]);
  const [showComposeForm, setShowComposeForm] = useState(false);
  const [newMessageSubject, setNewMessageSubject] = useState("");
  const [newMessageContent, setNewMessageContent] = useState("");
  const [newMessageType, setNewMessageType] = useState<"info" | "request" | "warning" | "urgent">("info");
  const [newMessageAttachments, setNewMessageAttachments] = useState<string[]>([]);
  const [sending, setSending] = useState(false);
  const [replyToMessage, setReplyToMessage] = useState<Doc<PlatformMessage> | null>(null);
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
    if (!user) return;
    
    setLoading(true);
    try {
      // Get business profile to find the profile key (document key in business_profiles collection)
      const profileResult = await listDocs<BusinessProfile>({
        collection: "business_profiles",
      });
      
      console.log("User key:", user.key);
      console.log("All profiles:", profileResult.items.map(p => ({ key: p.key, owner: p.owner, name: p.data.businessName })));
      
      // Find the profile owned by this user OR where user.key IS the profile key
      let myProfile = profileResult.items.find(p => p.owner === user.key);
      
      if (!myProfile) {
        // Fallback: check if user.key is itself a profile key
        myProfile = profileResult.items.find(p => p.key === user.key);
      }
      
      if (!myProfile) {
        console.log("No business profile found for user:", user.key);
        toast.error("Business profile not found. Please complete your business profile setup.");
        setMessages([]);
        setLoading(false);
        return;
      }
      
      const businessProfileKey = myProfile.key;
      console.log("Business profile key:", businessProfileKey);
      
      // Load messages using the business profile key
      const msgs = await getBusinessMessages(businessProfileKey);
      console.log("Loaded messages for business profile:", businessProfileKey, "Count:", msgs.length);
      msgs.forEach(msg => {
        console.log("Message:", msg.key, "From:", msg.data.from, "To:", msg.data.to, "Subject:", msg.data.subject);
      });
      setMessages(msgs);
    } catch (error) {
      logger.error("Error loading messages:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectMessage = async (message: Doc<PlatformMessage>) => {
    setSelectedMessage(message);
    
    // Mark as read if not already
    if (message.data.status === "sent" && message.data.to === user?.key) {
      await markMessageAsRead(message.key);
      // Refresh messages
      await loadMessages();
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const file = e.target.files[0];

    // Validate file using centralized utility
    const validation = validateFileWithPreset(file, "message");
    if (!validation.isValid) {
      toast.error(validation.error || "Invalid file");
      return;
    }

    setUploadingFile(true);
    try {
      const result = await uploadFile({
        collection: "message_attachments",
        data: file,
      });

      setResponseAttachments([...responseAttachments, result.downloadUrl]);
    } catch (error) {
      logger.error("Error uploading file:", error);
      toast.error("Failed to upload file. Please try again.");
    } finally {
      setUploadingFile(false);
    }
  };

  const handleSendResponse = async () => {
    if (!selectedMessage || !responseContent.trim()) return;

    setResponding(true);
    try {
      const result = await respondToMessage({
        messageId: selectedMessage.key,
        responseContent,
        attachments: responseAttachments,
      });

      if (result.success) {
        setResponseContent("");
        setResponseAttachments([]);
        await loadMessages();
        // Refresh selected message
        const updated = messages.find(m => m.key === selectedMessage.key);
        if (updated) setSelectedMessage(updated);
      } else {
        toast.error(result.error || "Failed to send response");
      }
    } catch (error) {
      logger.error("Error sending response:", error);
      toast.error("Failed to send response. Please try again.");
    } finally {
      setResponding(false);
    }
  };

  const handleSendNewMessage = async () => {
    if (!user || !newMessageSubject.trim() || !newMessageContent.trim()) return;

    setSending(true);
    try {
      // Get business profile to use profile key as sender
      const profileResult = await listDocs<BusinessProfile>({
        collection: "business_profiles",
      });
      
      const myProfile = profileResult.items.find(p => p.owner === user.key);
      if (!myProfile) {
        toast.error("Business profile not found");
        setSending(false);
        return;
      }
      
      const result = await sendBusinessToAdminMessage(
        {
          subject: newMessageSubject,
          content: newMessageContent,
          type: newMessageType,
          attachments: newMessageAttachments,
          replyToMessageId: replyToMessage?.key,
          replyToContent: replyToMessage?.data.content.substring(0, 100),
          replyToSubject: replyToMessage?.data.subject,
        },
        myProfile.key  // Use business profile key instead of user key
      );

      if (result.success) {
        toast.success("Message sent successfully!");
        setNewMessageSubject("");
        setNewMessageContent("");
        setNewMessageType("info");
        setNewMessageAttachments([]);
        setReplyToMessage(null);
        setShowComposeForm(false);
        await loadMessages();
      } else {
        toast.error(result.error || "Failed to send message");
      }
    } catch (error) {
      logger.error("Error sending message:", error);
      toast.error("Failed to send message. Please try again.");
    } finally {
      setSending(false);
    }
  };

  const handleComposeFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const file = e.target.files[0];

    const validation = validateFileWithPreset(file, "message");
    if (!validation.isValid) {
      toast.error(validation.error || "Invalid file");
      return;
    }

    setUploadingFile(true);
    try {
      const result = await uploadFile({
        collection: "message_attachments",
        data: file,
      });

      setNewMessageAttachments([...newMessageAttachments, result.downloadUrl]);
      toast.success("File attached");
    } catch (error) {
      logger.error("Error uploading file:", error);
      toast.error("Failed to upload file. Please try again.");
    } finally {
      setUploadingFile(false);
    }
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

  const unreadCount = messages.filter(
    (msg) => msg.data.to === user?.key && msg.data.status === "sent"
  ).length;

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
              <Link href="/business/dashboard" className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-blue-600 bg-clip-text text-transparent hover:from-primary-700 hover:to-blue-700 transition-all">
                AmanaTrade
              </Link>
              <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">Platform Messages</p>
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Message List */}
          <div className="lg:col-span-1 bg-white dark:bg-neutral-900 rounded-2xl border-2 border-neutral-200 dark:border-neutral-800 overflow-hidden">
            <div className="p-4 bg-gradient-to-r from-primary-50 to-blue-50 dark:from-primary-900/20 dark:to-blue-900/20 border-b border-neutral-200 dark:border-neutral-700">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                  <svg className="w-5 h-5 text-primary-600 dark:text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Messages
                  {unreadCount > 0 && (
                    <span className="ml-auto bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                      {unreadCount}
                    </span>
                  )}
                </h2>
              </div>
              <button
                onClick={() => setShowComposeForm(true)}
                className="w-full bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Compose Message
              </button>
            </div>

            <div className="divide-y divide-neutral-200 dark:divide-neutral-700 max-h-[600px] overflow-y-auto">
              {messages.length === 0 ? (
                <div className="p-8 text-center">
                  <svg className="w-16 h-16 text-neutral-300 dark:text-neutral-700 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                  <p className="text-neutral-600 dark:text-neutral-400 text-sm">No messages yet</p>
                </div>
              ) : (
                messages.map((msg) => (
                  <button
                    key={msg.key}
                    onClick={() => handleSelectMessage(msg)}
                    className={`w-full p-4 text-left hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors ${
                      selectedMessage?.key === msg.key ? "bg-primary-50 dark:bg-primary-900/20" : ""
                    } ${
                      msg.data.to === user?.key && msg.data.status === "sent" ? "font-semibold" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-1 rounded-full border ${getMessageTypeStyles(msg.data.type)}`}>
                          {msg.data.type.toUpperCase()}
                        </span>
                        {msg.data.from === user?.key ? (
                          <span className="text-xs text-blue-600 dark:text-blue-400">← Sent to Admin</span>
                        ) : (
                          <span className="text-xs text-green-600 dark:text-green-400">→ From Admin</span>
                        )}
                        {msg.data.replyToMessageId && (
                          <span className="inline-flex items-center gap-1 text-xs text-purple-600 dark:text-purple-400">
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                            </svg>
                            Reply
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-neutral-500 dark:text-neutral-400">
                        {new Date(msg.data.sentAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-neutral-900 dark:text-white mb-1">
                      {msg.data.subject}
                    </p>
                    <p className="text-xs text-neutral-600 dark:text-neutral-400 line-clamp-2">
                      {msg.data.content}
                    </p>
                    {msg.data.to === user?.key && msg.data.status === "sent" && (
                      <div className="mt-2">
                        <span className="inline-flex items-center gap-1 text-xs text-primary-600 dark:text-primary-400">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <circle cx="10" cy="10" r="3" />
                          </svg>
                          Unread
                        </span>
                      </div>
                    )}
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Message Detail */}
          <div className="lg:col-span-2 bg-white dark:bg-neutral-900 rounded-2xl border-2 border-neutral-200 dark:border-neutral-800 overflow-hidden">
            {selectedMessage ? (
              <div className="flex flex-col h-[700px]">
                {/* Message Header */}
                <div className="p-4 bg-gradient-to-r from-primary-50 to-blue-50 dark:from-primary-900/20 dark:to-blue-900/20 border-b border-neutral-200 dark:border-neutral-700">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`text-xs px-2 py-1 rounded-full border ${getMessageTypeStyles(selectedMessage.data.type)}`}>
                          {selectedMessage.data.type.toUpperCase()}
                        </span>
                        <span className="text-xs text-neutral-500 dark:text-neutral-400">
                          {new Date(selectedMessage.data.sentAt).toLocaleString()}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-neutral-900 dark:text-white">
                        {selectedMessage.data.subject}
                      </h3>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                        From: {selectedMessage.data.fromName || "AmanaTrade Platform"}
                      </p>
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

                  <div className="prose dark:prose-invert max-w-none">
                    <p className="whitespace-pre-wrap text-neutral-800 dark:text-neutral-200">
                      {selectedMessage.data.content}
                    </p>
                  </div>

                  {selectedMessage.data.attachments && selectedMessage.data.attachments.length > 0 && (
                    <div className="mt-6">
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
                    <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                      <div className="flex items-center gap-2 mb-2">
                        <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-sm font-semibold text-green-800 dark:text-green-300">Your Response</span>
                        <span className="text-xs text-green-600 dark:text-green-400 ml-auto">
                          {selectedMessage.data.respondedAt && new Date(selectedMessage.data.respondedAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm text-green-800 dark:text-green-300 whitespace-pre-wrap">
                        {selectedMessage.data.responseContent}
                      </p>
                    </div>
                  )}
                </div>

                {/* Response Form */}
                {selectedMessage.data.to === user?.key && selectedMessage.data.status !== "responded" && (
                  <div className="p-4 border-t border-neutral-200 dark:border-neutral-700">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">Send Response</h4>
                      <button
                        onClick={() => {
                          setReplyToMessage(selectedMessage);
                          setNewMessageSubject(`Re: ${selectedMessage.data.subject}`);
                          setShowComposeForm(true);
                        }}
                        className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-sm font-medium rounded-lg hover:bg-primary-200 dark:hover:bg-primary-900/50 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                        </svg>
                        Reply as New Message
                      </button>
                    </div>
                    <div className="relative">
                      <textarea
                        value={responseContent}
                        onChange={(e) => setResponseContent(e.target.value)}
                        placeholder="Type your response..."
                        rows={4}
                        className={`w-full px-4 py-3 bg-white dark:bg-neutral-800 border ${
                          responseContent.length > 0 && responseContent.length < 10
                            ? "border-red-500"
                            : "border-neutral-300 dark:border-neutral-700"
                        } rounded-lg text-neutral-900 dark:text-white placeholder-neutral-500 dark:placeholder-neutral-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all resize-none`}
                      />
                      <div className="mt-1 flex items-center justify-between">
                        <span className={`text-xs ${
                          responseContent.length > 0 && responseContent.length < 10
                            ? "text-red-500"
                            : "text-neutral-500 dark:text-neutral-400"
                        }`}>
                          {responseContent.length}/10,000 (min: 10)
                        </span>
                        {responseContent.length > 0 && responseContent.length < 10 && (
                          <span className="text-xs text-red-500">Response must be at least 10 characters</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between mt-3">
                      <div>
                        <input
                          type="file"
                          id="response-file"
                          onChange={handleFileUpload}
                          disabled={uploadingFile}
                          className="hidden"
                        />
                        <label
                          htmlFor="response-file"
                          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                            uploadingFile
                              ? "bg-neutral-100 dark:bg-neutral-800 text-neutral-400 dark:text-neutral-600 cursor-not-allowed"
                              : "bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 cursor-pointer"
                          }`}
                        >
                          {uploadingFile ? (
                            <>
                              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              <span>Uploading...</span>
                            </>
                          ) : (
                            <>
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                              </svg>
                              <span>Attach File</span>
                            </>
                          )}
                        </label>
                        {responseAttachments.length > 0 && (
                          <span className="ml-2 text-xs text-neutral-600 dark:text-neutral-400">
                            {responseAttachments.length} file(s) attached
                          </span>
                        )}
                      </div>
                      
                      <button
                        onClick={handleSendResponse}
                        disabled={responding || !responseContent.trim() || responseContent.length < 10 || responseContent.length > 10000}
                        title={
                          responseContent.length < 10 && responseContent.length > 0
                            ? "Response must be at least 10 characters"
                            : responseContent.length > 10000
                            ? "Response must not exceed 10,000 characters"
                            : ""
                        }
                        className="px-6 py-2 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white font-semibold rounded-lg transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {responding ? "Sending..." : "Send Response"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center h-[700px]">
                <div className="text-center">
                  <svg className="w-20 h-20 text-neutral-300 dark:text-neutral-700 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <p className="text-neutral-600 dark:text-neutral-400">Select a message to view</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Compose Message Modal */}
        {showComposeForm && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border-2 border-neutral-200 dark:border-neutral-800 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="p-6 border-b border-neutral-200 dark:border-neutral-700 flex items-center justify-between">
                <h3 className="text-xl font-bold text-neutral-900 dark:text-white">
                  {replyToMessage ? 'Reply to Message' : 'Compose Message to Platform'}
                </h3>
                <button
                  onClick={() => {
                    setShowComposeForm(false);
                    setNewMessageSubject("");
                    setNewMessageContent("");
                    setNewMessageType("info");
                    setNewMessageAttachments([]);
                    setReplyToMessage(null);
                  }}
                  className="text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-4">
                {/* Reply Context */}
                {replyToMessage && (
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-2 border-blue-200 dark:border-blue-800">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                        </svg>
                        <span className="text-sm font-semibold text-blue-900 dark:text-blue-300">
                          Replying to:
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          setReplyToMessage(null);
                          setNewMessageSubject("");
                        }}
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
                        title="Clear reply"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    <div className="ml-7">
                      <p className="text-sm font-medium text-blue-800 dark:text-blue-300">
                        {replyToMessage.data.subject}
                      </p>
                      <p className="text-xs text-blue-700 dark:text-blue-400 mt-1 line-clamp-2">
                        {replyToMessage.data.content}
                      </p>
                      <p className="text-xs text-blue-600 dark:text-blue-500 mt-2">
                        From: {replyToMessage.data.fromName || 'Platform'} • {new Date(replyToMessage.data.sentAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                )}

                {/* Message Type */}
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
                    Message Type
                  </label>
                  <select
                    value={newMessageType}
                    onChange={(e) => setNewMessageType(e.target.value as any)}
                    className="w-full px-4 py-2 bg-white dark:bg-neutral-800 border-2 border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="info">Information</option>
                    <option value="request">Request</option>
                    <option value="warning">Warning</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                {/* Subject */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                      Subject
                    </label>
                    <span className={`text-xs ${
                      newMessageSubject.length < 3 || newMessageSubject.length > 200
                        ? 'text-red-600 dark:text-red-400'
                        : 'text-neutral-500 dark:text-neutral-400'
                    }`}>
                      {newMessageSubject.length}/200 (min: 3)
                    </span>
                  </div>
                  <input
                    type="text"
                    value={newMessageSubject}
                    onChange={(e) => setNewMessageSubject(e.target.value)}
                    placeholder="Enter message subject..."
                    maxLength={200}
                    className={`w-full px-4 py-2 bg-white dark:bg-neutral-800 border-2 rounded-lg text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                      newMessageSubject.length > 0 && (newMessageSubject.length < 3 || newMessageSubject.length > 200)
                        ? 'border-red-500 dark:border-red-500'
                        : 'border-neutral-200 dark:border-neutral-700'
                    }`}
                  />
                  {newMessageSubject.length > 0 && newMessageSubject.length < 3 && (
                    <p className="text-xs text-red-600 dark:text-red-400 mt-1">Subject must be at least 3 characters</p>
                  )}
                </div>

                {/* Content */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                      Message Content
                    </label>
                    <span className={`text-xs ${
                      newMessageContent.length < 10 || newMessageContent.length > 10000
                        ? 'text-red-600 dark:text-red-400'
                        : 'text-neutral-500 dark:text-neutral-400'
                    }`}>
                      {newMessageContent.length}/10,000 (min: 10)
                    </span>
                  </div>
                  <textarea
                    value={newMessageContent}
                    onChange={(e) => setNewMessageContent(e.target.value)}
                    placeholder="Enter your message here..."
                    rows={8}
                    maxLength={10000}
                    className={`w-full px-4 py-2 bg-white dark:bg-neutral-800 border-2 rounded-lg text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none ${
                      newMessageContent.length > 0 && (newMessageContent.length < 10 || newMessageContent.length > 10000)
                        ? 'border-red-500 dark:border-red-500'
                        : 'border-neutral-200 dark:border-neutral-700'
                    }`}
                  />
                  {newMessageContent.length > 0 && newMessageContent.length < 10 && (
                    <p className="text-xs text-red-600 dark:text-red-400 mt-1">Message must be at least 10 characters</p>
                  )}
                </div>

                {/* File Attachments */}
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
                    Attachments
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      id="compose-file-input"
                      onChange={handleComposeFileUpload}
                      className="hidden"
                      disabled={uploadingFile || newMessageAttachments.length >= 5}
                    />
                    <label
                      htmlFor="compose-file-input"
                      className={`inline-flex items-center gap-2 px-4 py-2 bg-neutral-100 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg text-sm font-medium transition-colors ${
                        uploadingFile || newMessageAttachments.length >= 5
                          ? "opacity-50 cursor-not-allowed"
                          : "hover:bg-neutral-200 dark:hover:bg-neutral-700 cursor-pointer"
                      }`}
                    >
                      {uploadingFile ? (
                        <>
                          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span>Uploading...</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                          </svg>
                          <span>Attach File</span>
                        </>
                      )}
                    </label>
                    {newMessageAttachments.length > 0 && (
                      <span className="text-xs text-neutral-600 dark:text-neutral-400">
                        {newMessageAttachments.length} file(s) attached (max 5)
                      </span>
                    )}
                  </div>

                  {/* Attachment List */}
                  {newMessageAttachments.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {newMessageAttachments.map((url, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-2 bg-neutral-50 dark:bg-neutral-800 rounded-lg"
                        >
                          <div className="flex items-center gap-2">
                            <svg className="w-4 h-4 text-primary-600 dark:text-primary-400" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M8 4a3 3 0 00-3 3v4a5 5 0 0010 0V7a1 1 0 112 0v4a7 7 0 11-14 0V7a5 5 0 0110 0v4a3 3 0 11-6 0V7a1 1 0 012 0v4a1 1 0 102 0V7a3 3 0 00-3-3z" clipRule="evenodd" />
                            </svg>
                            <span className="text-xs text-neutral-700 dark:text-neutral-300">
                              Attachment {idx + 1}
                            </span>
                          </div>
                          <button
                            onClick={() => {
                              setNewMessageAttachments(newMessageAttachments.filter((_, i) => i !== idx));
                            }}
                            className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-6 border-t border-neutral-200 dark:border-neutral-700 flex items-center justify-end gap-3">
                <button
                  onClick={() => {
                    setShowComposeForm(false);
                    setNewMessageSubject("");
                    setNewMessageContent("");
                    setNewMessageType("info");
                    setNewMessageAttachments([]);
                  }}
                  className="px-6 py-2 bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-semibold rounded-lg hover:bg-neutral-300 dark:hover:bg-neutral-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendNewMessage}
                  disabled={
                    sending || 
                    newMessageSubject.trim().length < 3 || 
                    newMessageSubject.length > 200 ||
                    newMessageContent.trim().length < 10 || 
                    newMessageContent.length > 10000
                  }
                  className="px-6 py-2 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white font-semibold rounded-lg transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  title={
                    newMessageSubject.trim().length < 3 ? "Subject must be at least 3 characters" :
                    newMessageContent.trim().length < 10 ? "Message must be at least 10 characters" :
                    ""
                  }
                >
                  {sending ? "Sending..." : "Send Message"}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
