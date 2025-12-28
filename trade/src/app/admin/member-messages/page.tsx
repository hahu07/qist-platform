"use client";

import { ThemeToggle } from "@/components/theme-toggle";
import { AuthButton } from "@/components/auth-button";
import { initSatellite, onAuthStateChange, listDocs, type Doc } from "@junobuild/core";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { InvestorProfile, MemberMessageType } from "@/schemas";
import toast from "react-hot-toast";
import { sendPlatformToMemberMessage, sendBulkMemberMessages } from "@/utils/member-message-actions";

type User = {
  key: string;
} | null | undefined;

export default function AdminMemberMessagesPage() {
  const [user, setUser] = useState<User>(undefined);
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState<Doc<InvestorProfile>[]>([]);
  const [selectedMember, setSelectedMember] = useState<string>("");
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [messageType, setMessageType] = useState<MemberMessageType>("info");
  const [sending, setSending] = useState(false);
  const [bulkMode, setBulkMode] = useState(false);
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set());
  const router = useRouter();

  // Helper function to get member display name
  const getMemberName = (profile: InvestorProfile): string => {
    if (profile.investorType === "individual") {
      return profile.fullName;
    } else {
      return profile.companyName;
    }
  };

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
      loadMembers();
    }
  }, [user]);

  const loadMembers = async () => {
    try {
      // Fetch from both individual and corporate investor profile collections
      const [individualResult, corporateResult] = await Promise.all([
        listDocs<InvestorProfile>({
          collection: "individual_investor_profiles",
        }).catch(() => ({ items: [] })),
        listDocs<InvestorProfile>({
          collection: "corporate_investor_profiles",
        }).catch(() => ({ items: [] }))
      ]);

      // Combine both results
      const allMembers = [...individualResult.items, ...corporateResult.items];
      
      // Sort by creation date or name
      allMembers.sort((a, b) => {
        const nameA = getMemberName(a.data);
        const nameB = getMemberName(b.data);
        return nameA.localeCompare(nameB);
      });

      setMembers(allMembers);
    } catch (error) {
      console.error("Error loading members:", error);
      toast.error("Failed to load members");
    }
  };

  const handleSendMessage = async () => {
    if (!user || !subject.trim() || !content.trim()) return;
    
    if (subject.length < 3 || subject.length > 200) {
      toast.error("Subject must be between 3 and 200 characters");
      return;
    }
    
    if (content.length < 10 || content.length > 10000) {
      toast.error("Message must be between 10 and 10,000 characters");
      return;
    }

    if (!bulkMode && !selectedMember) {
      toast.error("Please select a member");
      return;
    }

    if (bulkMode && selectedMembers.size === 0) {
      toast.error("Please select at least one member");
      return;
    }

    setSending(true);
    try {
      if (bulkMode) {
        const result = await sendBulkMemberMessages(
          Array.from(selectedMembers),
          { subject, content, type: messageType, attachments: [] },
          user.key
        );
        
        if (result.success) {
          toast.success(`Successfully sent to ${result.sent} member(s)`);
          setSubject("");
          setContent("");
          setSelectedMembers(new Set());
        } else {
          toast.error(`Sent to ${result.sent}, failed for ${result.failed} member(s)`);
        }
      } else {
        const member = members.find(m => m.key === selectedMember);
        const result = await sendPlatformToMemberMessage(
          {
            to: selectedMember,
            toName: member ? getMemberName(member.data) : "Member",
            subject,
            content,
            type: messageType,
            attachments: [],
          },
          user.key
        );

        if (result.success) {
          toast.success("Message sent successfully");
          setSubject("");
          setContent("");
          setSelectedMember("");
        } else {
          toast.error(result.error || "Failed to send message");
        }
      }
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const toggleMemberSelection = (memberId: string) => {
    const newSelected = new Set(selectedMembers);
    if (newSelected.has(memberId)) {
      newSelected.delete(memberId);
    } else {
      newSelected.add(memberId);
    }
    setSelectedMembers(newSelected);
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <h1 className="text-xl font-bold text-neutral-900 dark:text-white">Send Message to Members</h1>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/admin/member-conversations"
                className="px-4 py-2 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 font-semibold rounded-lg transition-colors"
              >
                View Conversations
              </Link>
              <ThemeToggle />
              <AuthButton />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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

        <div className="bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-800 shadow-sm p-6">
          {/* Bulk Mode Toggle */}
          <div className="mb-6">
            <label className="inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={bulkMode}
                onChange={(e) => {
                  setBulkMode(e.target.checked);
                  setSelectedMember("");
                  setSelectedMembers(new Set());
                }}
                className="sr-only peer"
              />
              <div className="relative w-11 h-6 bg-neutral-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-neutral-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-neutral-600 peer-checked:bg-primary-600"></div>
              <span className="ms-3 text-sm font-medium text-neutral-900 dark:text-neutral-300">
                Send to Multiple Members
              </span>
            </label>
          </div>

          {/* Recipient Selection */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
              {bulkMode ? "Select Members" : "Select Member"}
            </label>
            {bulkMode ? (
              <div className="max-h-48 overflow-y-auto border border-neutral-300 dark:border-neutral-700 rounded-lg p-2 space-y-1">
                {members.length === 0 ? (
                  <p className="text-sm text-neutral-500 dark:text-neutral-400 p-2">No members found</p>
                ) : (
                  members.map((member) => (
                    <label key={member.key} className="flex items-center p-2 hover:bg-neutral-50 dark:hover:bg-neutral-800 rounded cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedMembers.has(member.key)}
                        onChange={() => toggleMemberSelection(member.key)}
                        className="w-4 h-4 text-primary-600 bg-neutral-100 border-neutral-300 rounded focus:ring-primary-500 dark:focus:ring-primary-600 dark:ring-offset-neutral-800 focus:ring-2 dark:bg-neutral-700 dark:border-neutral-600"
                      />
                      <span className="ml-2 text-sm text-neutral-900 dark:text-white">
                        {getMemberName(member.data)}
                      </span>
                    </label>
                  ))
                )}
              </div>
            ) : (
              <select
                value={selectedMember}
                onChange={(e) => setSelectedMember(e.target.value)}
                className="w-full px-4 py-3 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">Select a member...</option>
                {members.map((member) => (
                  <option key={member.key} value={member.key}>
                    {getMemberName(member.data)}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Message Type */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
              Message Type
            </label>
            <select
              value={messageType}
              onChange={(e) => setMessageType(e.target.value as MemberMessageType)}
              className="w-full px-4 py-3 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="info">Info</option>
              <option value="request">Request</option>
              <option value="warning">Warning</option>
              <option value="urgent">Urgent</option>
              <option value="investment">Investment Update</option>
              <option value="transaction">Transaction Related</option>
            </select>
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
              (!bulkMode && !selectedMember) || 
              (bulkMode && selectedMembers.size === 0)
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
            {sending ? "Sending..." : bulkMode ? `Send to ${selectedMembers.size} Member(s)` : "Send Message"}
          </button>
        </div>
      </main>
    </div>
  );
}
