"use client";

import { ThemeToggle } from "@/components/theme-toggle";
import { AuthButton } from "@/components/auth-button";
import { initSatellite, onAuthStateChange, listDocs, uploadFile, type Doc } from "@junobuild/core";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { BusinessProfile } from "@/schemas";
import { sendPlatformMessage, getAllPlatformMessages, sendBulkMessages } from "@/utils/platform-message-actions";

type User = {
  key: string;
} | null | undefined;

export default function AdminBusinessMessagingPage() {
  const [user, setUser] = useState<User>(undefined);
  const [loading, setLoading] = useState(true);
  const [businesses, setBusinesses] = useState<Doc<BusinessProfile>[]>([]);
  const [selectedBusiness, setSelectedBusiness] = useState<string | null>(null);
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [messageType, setMessageType] = useState<"info" | "request" | "warning" | "urgent">("info");
  const [sending, setSending] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [attachments, setAttachments] = useState<string[]>([]);
  const [bulkMode, setBulkMode] = useState(false);
  const [selectedBusinesses, setSelectedBusinesses] = useState<Set<string>>(new Set());
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
      loadBusinesses();
    }
  }, [user]);

  const loadBusinesses = async () => {
    setLoading(true);
    try {
      const result = await listDocs<BusinessProfile>({ 
        collection: "business_profiles"
      });
      // Filter for verified businesses only
      const verifiedBusinesses = result.items.filter(b => b.data.kycStatus === "verified");
      
      console.log("Loaded businesses:", verifiedBusinesses.length);
      verifiedBusinesses.forEach(biz => {
        console.log(`Business: ${biz.data.businessName}, key: ${biz.key}, owner: ${biz.owner}`);
      });
      
      setBusinesses(verifiedBusinesses);
    } catch (error) {
      console.error("Error loading businesses:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    setUploadingFile(true);
    try {
      const file = e.target.files[0];
      const result = await uploadFile({
        collection: "message_attachments",
        data: file,
      });

      setAttachments([...attachments, result.downloadUrl]);
    } catch (error) {
      console.error("Error uploading file:", error);
      alert("Failed to upload file");
    } finally {
      setUploadingFile(false);
    }
  };

  const handleSendMessage = async () => {
    if (!user || !subject.trim() || !content.trim()) return;

    if (!bulkMode && !selectedBusiness) {
      alert("Please select a business");
      return;
    }

    if (bulkMode && selectedBusinesses.size === 0) {
      alert("Please select at least one business");
      return;
    }

    setSending(true);
    try {
      if (bulkMode) {
        // Use business profile keys directly as recipient IDs
        const recipientIds: string[] = Array.from(selectedBusinesses);
        
        const result = await sendBulkMessages(
          recipientIds,
          { subject, content, type: messageType, attachments },
          user.key
        );

        if (result.success) {
          alert(`Messages sent to ${result.sent} businesses successfully!`);
        } else {
          alert(`Sent to ${result.sent} businesses, ${result.failed} failed`);
        }
      } else {
        const selectedBiz = businesses.find(b => b.key === selectedBusiness);
        if (!selectedBiz) {
          alert("Selected business not found");
          return;
        }
        
        console.log("Sending message to business:");
        console.log("- Business profile key:", selectedBiz.key);
        console.log("- Business owner field:", selectedBiz.owner);
        console.log("- Business name:", selectedBiz.data.businessName);
        
        // Use the business profile KEY (not owner) as the recipient
        // This is the document ID in the business_profiles collection
        const recipientId = selectedBiz.key;
        console.log("- Using recipient ID (profile key):", recipientId);
        
        const result = await sendPlatformMessage(
          {
            to: recipientId,
            toName: selectedBiz.data.businessName,
            subject,
            content,
            type: messageType,
            attachments,
          },
          user.key
        );

        if (result.success) {
          alert("Message sent successfully!");
        } else {
          alert(result.error || "Failed to send message");
        }
      }

      // Reset form
      setSubject("");
      setContent("");
      setAttachments([]);
      setMessageType("info");
      setSelectedBusiness(null);
      setSelectedBusinesses(new Set());
    } catch (error) {
      console.error("Error sending message:", error);
      alert("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const toggleBusinessSelection = (businessId: string) => {
    const newSelection = new Set(selectedBusinesses);
    if (newSelection.has(businessId)) {
      newSelection.delete(businessId);
    } else {
      newSelection.add(businessId);
    }
    setSelectedBusinesses(newSelection);
  };

  const selectAll = () => {
    setSelectedBusinesses(new Set(businesses.map(b => b.key)));
  };

  const clearSelection = () => {
    setSelectedBusinesses(new Set());
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-primary-50/30 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950">
      <header className="bg-white/80 dark:bg-neutral-900/80 backdrop-blur-sm border-b border-neutral-200 dark:border-neutral-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <Link href="/admin/dashboard" className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-blue-600 bg-clip-text text-transparent hover:from-primary-700 hover:to-blue-700 transition-all">
                AmanaTrade Admin
              </Link>
              <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">Business Messaging</p>
            </div>
            <div className="flex items-center gap-4">
              <ThemeToggle />
              <AuthButton />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Link href="/admin/dashboard" className="inline-flex items-center gap-2 text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Dashboard
          </Link>
        </div>

        <div className="bg-white dark:bg-neutral-900 rounded-2xl border-2 border-neutral-200 dark:border-neutral-800 p-6 max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-6">Send Message to Business</h2>

          {/* Bulk Mode Toggle */}
          <div className="mb-6 p-4 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={bulkMode}
                onChange={(e) => {
                  setBulkMode(e.target.checked);
                  if (!e.target.checked) {
                    setSelectedBusinesses(new Set());
                  } else {
                    setSelectedBusiness(null);
                  }
                }}
                className="w-5 h-5 text-primary-600 rounded focus:ring-2 focus:ring-primary-500"
              />
              <div>
                <p className="font-semibold text-neutral-900 dark:text-white">Bulk Messaging Mode</p>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">Send message to multiple businesses at once</p>
              </div>
            </label>
          </div>

          {/* Business Selection */}
          {!bulkMode ? (
            <div className="mb-6">
              <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
                Select Business
              </label>
              <select
                value={selectedBusiness || ""}
                onChange={(e) => setSelectedBusiness(e.target.value)}
                className="w-full px-4 py-3 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">Choose a business...</option>
                {businesses.map((business) => (
                  <option key={business.key} value={business.key}>
                    {business.data.businessName}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                  Select Businesses ({selectedBusinesses.size} selected)
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={selectAll}
                    className="text-xs px-3 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded hover:bg-primary-200 dark:hover:bg-primary-900/50"
                  >
                    Select All
                  </button>
                  <button
                    onClick={clearSelection}
                    className="text-xs px-3 py-1 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700"
                  >
                    Clear
                  </button>
                </div>
              </div>
              <div className="max-h-60 overflow-y-auto border border-neutral-300 dark:border-neutral-700 rounded-lg p-3 space-y-2">
                {businesses.map((business) => (
                  <label
                    key={business.key}
                    className="flex items-center gap-3 p-2 hover:bg-neutral-50 dark:hover:bg-neutral-800 rounded cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedBusinesses.has(business.key)}
                      onChange={() => toggleBusinessSelection(business.key)}
                      className="w-4 h-4 text-primary-600 rounded focus:ring-2 focus:ring-primary-500"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-neutral-900 dark:text-white">{business.data.businessName}</p>
                      <p className="text-xs text-neutral-600 dark:text-neutral-400">{business.data.industry || "N/A"}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Message Type */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
              Message Type
            </label>
            <div className="grid grid-cols-4 gap-3">
              {(["info", "request", "warning", "urgent"] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setMessageType(type)}
                  className={`px-4 py-3 rounded-lg font-semibold text-sm transition-all ${
                    messageType === type
                      ? type === "urgent"
                        ? "bg-red-600 text-white shadow-lg"
                        : type === "warning"
                        ? "bg-amber-600 text-white shadow-lg"
                        : type === "request"
                        ? "bg-blue-600 text-white shadow-lg"
                        : "bg-primary-600 text-white shadow-lg"
                      : "bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700"
                  }`}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Subject */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
              Subject
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Message subject..."
              className={`w-full px-4 py-3 bg-white dark:bg-neutral-800 border ${
                subject.length > 0 && (subject.length < 3 || subject.length > 200)
                  ? "border-red-500"
                  : "border-neutral-300 dark:border-neutral-700"
              } rounded-lg text-neutral-900 dark:text-white placeholder-neutral-500 focus:ring-2 focus:ring-primary-500 focus:border-transparent`}
            />
            <div className="mt-1 flex items-center justify-between">
              <span className={`text-xs ${
                subject.length > 0 && (subject.length < 3 || subject.length > 200)
                  ? "text-red-500"
                  : "text-neutral-500 dark:text-neutral-400"
              }`}>
                {subject.length}/200 (min: 3)
              </span>
              {subject.length > 0 && subject.length < 3 && (
                <span className="text-xs text-red-500">Subject must be at least 3 characters</span>
              )}
              {subject.length > 200 && (
                <span className="text-xs text-red-500">Subject must not exceed 200 characters</span>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
              Message Content
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Type your message..."
              rows={8}
              className={`w-full px-4 py-3 bg-white dark:bg-neutral-800 border ${
                content.length > 0 && (content.length < 10 || content.length > 10000)
                  ? "border-red-500"
                  : "border-neutral-300 dark:border-neutral-700"
              } rounded-lg text-neutral-900 dark:text-white placeholder-neutral-500 focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none`}
            />
            <div className="mt-1 flex items-center justify-between">
              <span className={`text-xs ${
                content.length > 0 && (content.length < 10 || content.length > 10000)
                  ? "text-red-500"
                  : "text-neutral-500 dark:text-neutral-400"
              }`}>
                {content.length}/10,000 (min: 10)
              </span>
              {content.length > 0 && content.length < 10 && (
                <span className="text-xs text-red-500">Message must be at least 10 characters</span>
              )}
              {content.length > 10000 && (
                <span className="text-xs text-red-500">Message must not exceed 10,000 characters</span>
              )}
            </div>
          </div>

          {/* Attachments */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
              Attachments
            </label>
            <div className="flex items-center gap-3">
              <input
                type="file"
                id="message-file"
                onChange={handleFileUpload}
                className="hidden"
              />
              <label
                htmlFor="message-file"
                className="inline-flex items-center gap-2 px-4 py-2 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
                {uploadingFile ? "Uploading..." : "Attach File"}
              </label>
              {attachments.length > 0 && (
                <span className="text-sm text-neutral-600 dark:text-neutral-400">
                  {attachments.length} file(s) attached
                </span>
              )}
            </div>
            {attachments.length > 0 && (
              <div className="mt-2 space-y-1">
                {attachments.map((url, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs text-neutral-600 dark:text-neutral-400">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8 4a3 3 0 00-3 3v4a5 5 0 0010 0V7a1 1 0 112 0v4a7 7 0 11-14 0V7a5 5 0 0110 0v4a3 3 0 11-6 0V7a1 1 0 012 0v4a1 1 0 102 0V7a3 3 0 00-3-3z" clipRule="evenodd" />
                    </svg>
                    Attachment {idx + 1}
                    <button
                      onClick={() => setAttachments(attachments.filter((_, i) => i !== idx))}
                      className="ml-auto text-red-600 hover:text-red-700"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Send Button */}
          <button
            onClick={handleSendMessage}
            disabled={
              sending || 
              !subject.trim() || 
              !content.trim() || 
              subject.length < 3 || 
              subject.length > 200 || 
              content.length < 10 || 
              content.length > 10000 || 
              (!bulkMode && !selectedBusiness) || 
              (bulkMode && selectedBusinesses.size === 0)
            }
            title={
              subject.length > 0 && subject.length < 3
                ? "Subject must be at least 3 characters"
                : subject.length > 200
                ? "Subject must not exceed 200 characters"
                : content.length > 0 && content.length < 10
                ? "Message must be at least 10 characters"
                : content.length > 10000
                ? "Message must not exceed 10,000 characters"
                : ""
            }
            className="w-full px-6 py-4 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white font-bold text-lg rounded-lg transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {sending ? "Sending..." : bulkMode ? `Send to ${selectedBusinesses.size} Businesses` : "Send Message"}
          </button>
        </div>
      </main>
    </div>
  );
}
