"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { authSubscribe } from "@junobuild/core";
import { AssignmentManager } from "@/components/assignment-manager";
import { MessagingInterface } from "@/components/messaging-interface";
import { InternalNotes } from "@/components/internal-notes";
import type { AdminProfile } from "@/schemas";

export default function WorkflowPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"assignments" | "messages" | "notes">("assignments");
  const [selectedApplicationId, setSelectedApplicationId] = useState<string>("");

  useEffect(() => {
    const unsubscribe = authSubscribe((authUser) => {
      setUser(authUser);
      setLoading(false);

      if (!authUser) {
        router.push("/auth/signin");
      }
    });

    return () => unsubscribe();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-neutral-600 dark:text-neutral-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Mock admin profile - in production, fetch from Juno
  const adminProfile: AdminProfile = {
    userId: user.key,
    displayName: user.key.slice(0, 8),
    email: "admin@qist.com",
    role: "manager",
    approvalLimit: 10000000,
    maxWorkload: 10,
    currentWorkload: 0,
    specializations: ["technology", "healthcare"],
    isActive: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      {/* Header */}
      <div className="bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">
                Workflow & Collaboration
              </h1>
              <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                Manage assignments, communicate with stakeholders, and collaborate with team
              </p>
            </div>
            <button
              onClick={() => router.push("/admin/business-applications")}
              className="px-4 py-2 text-sm font-semibold text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white transition-colors"
            >
              ← Back to Applications
            </button>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8" aria-label="Tabs">
            <button
              onClick={() => setActiveTab("assignments")}
              className={`py-4 px-1 border-b-2 font-semibold text-sm transition-colors ${
                activeTab === "assignments"
                  ? "border-primary-600 text-primary-600 dark:text-primary-400"
                  : "border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300 dark:text-neutral-400 dark:hover:text-neutral-300"
              }`}
            >
              Assignment Management
            </button>
            <button
              onClick={() => setActiveTab("messages")}
              className={`py-4 px-1 border-b-2 font-semibold text-sm transition-colors ${
                activeTab === "messages"
                  ? "border-primary-600 text-primary-600 dark:text-primary-400"
                  : "border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300 dark:text-neutral-400 dark:hover:text-neutral-300"
              }`}
            >
              Messages & Communication
            </button>
            <button
              onClick={() => setActiveTab("notes")}
              className={`py-4 px-1 border-b-2 font-semibold text-sm transition-colors ${
                activeTab === "notes"
                  ? "border-primary-600 text-primary-600 dark:text-primary-400"
                  : "border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300 dark:text-neutral-400 dark:hover:text-neutral-300"
              }`}
            >
              Internal Notes
            </button>
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Application ID Input (for testing) */}
        <div className="mb-6 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-6">
          <label className="block text-sm font-semibold text-neutral-900 dark:text-white mb-2">
            Application ID (for testing):
          </label>
          <input
            type="text"
            value={selectedApplicationId}
            onChange={(e) => setSelectedApplicationId(e.target.value)}
            placeholder="Enter application ID..."
            className="w-full px-4 py-2.5 text-sm border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
          <p className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">
            In production, this would be automatically selected from the applications list
          </p>
        </div>

        {/* Tab Content */}
        {activeTab === "assignments" && (
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-6">
            {selectedApplicationId ? (
              <AssignmentManager
                applicationId={selectedApplicationId}
                currentAssignment={undefined}
                onAssignmentChange={(assignment) => {
                  console.log("Assignment changed:", assignment);
                }}
              />
            ) : (
              <div className="text-center py-12">
                <p className="text-neutral-500 dark:text-neutral-400">
                  Enter an application ID above to manage assignments
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === "messages" && (
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-6">
            {selectedApplicationId ? (
              <MessagingInterface
                applicationId={selectedApplicationId}
                currentUserId={user.key}
                currentUserType="admin"
                currentUserName={adminProfile.displayName}
                recipientId="business_owner_id" // In production, get from application
                recipientType="business"
              />
            ) : (
              <div className="text-center py-12">
                <p className="text-neutral-500 dark:text-neutral-400">
                  Enter an application ID above to view messages
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === "notes" && (
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-6">
            {selectedApplicationId ? (
              <InternalNotes
                applicationId={selectedApplicationId}
                currentUserId={user.key}
                currentUserName={adminProfile.displayName}
              />
            ) : (
              <div className="text-center py-12">
                <p className="text-neutral-500 dark:text-neutral-400">
                  Enter an application ID above to view internal notes
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
