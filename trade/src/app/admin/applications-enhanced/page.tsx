"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { initSatellite } from "@junobuild/core";
import { AssignmentManager, WorkloadDashboard } from "@/components/assignment-manager";
import { MessagingInterface } from "@/components/messaging-interface";
import { InternalNotes, CollaborationRequests } from "@/components/internal-notes";
import { ThemeToggle } from "@/components/theme-toggle";

/**
 * Enhanced Admin Applications Page - Phase 2
 * Integrates assignment management, messaging, and collaboration features
 */
export default function EnhancedAdminApplicationsPage() {
  const router = useRouter();
  const [activeView, setActiveView] = useState<"applications" | "workload" | "collaboration">("applications");
  const [selectedApplicationId, setSelectedApplicationId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"details" | "assignment" | "messages" | "notes" | "due-diligence">("details");

  // Mock current user (would come from auth in real app)
  const currentUser = {
    id: "admin_001",
    name: "Admin User",
    type: "admin" as const,
  };

  useEffect(() => {
    (async () => await initSatellite({ workers: { auth: true } }))();
  }, []);

  return (
    <div className="min-h-screen bg-lavender-blue-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b-[3px] border-black dark:border-lavender-blue-200 shadow-[0_8px_0px_rgba(0,0,0,1)] dark:shadow-[0_8px_0px_#7888FF]">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Link
                href="/admin/dashboard"
                className="text-2xl font-bold text-lavender-blue-600 dark:text-lavender-blue-400"
              >
                QIST Admin
              </Link>
              <span className="text-sm px-3 py-1 bg-lavender-blue-600 text-white font-bold">
                PHASE 2
              </span>
            </div>
            <div className="flex items-center gap-4">
              <ThemeToggle />
              <Link
                href="/admin/dashboard"
                className="px-4 py-2 bg-lavender-blue-600 hover:bg-lavender-blue-700 text-white font-bold border-[3px] border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all"
              >
                Dashboard
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* View Selector */}
        <div className="flex gap-3 mb-6">
          <button
            onClick={() => setActiveView("applications")}
            className={`px-6 py-3 font-bold border-[3px] border-black transition-all ${
              activeView === "applications"
                ? "bg-lavender-blue-600 text-white shadow-none translate-x-[4px] translate-y-[4px]"
                : "bg-white dark:bg-gray-800 hover:bg-lavender-blue-50 shadow-[8px_8px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_#7888FF]"
            } active:translate-x-[4px] active:translate-y-[4px] active:shadow-none`}
          >
            📋 Applications
          </button>
          <button
            onClick={() => setActiveView("workload")}
            className={`px-6 py-3 font-bold border-[3px] border-black transition-all ${
              activeView === "workload"
                ? "bg-lavender-blue-600 text-white shadow-none translate-x-[4px] translate-y-[4px]"
                : "bg-white dark:bg-gray-800 hover:bg-lavender-blue-50 shadow-[8px_8px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_#7888FF]"
            } active:translate-x-[4px] active:translate-y-[4px] active:shadow-none`}
          >
            📊 Workload
          </button>
          <button
            onClick={() => setActiveView("collaboration")}
            className={`px-6 py-3 font-bold border-[3px] border-black transition-all ${
              activeView === "collaboration"
                ? "bg-lavender-blue-600 text-white shadow-none translate-x-[4px] translate-y-[4px]"
                : "bg-white dark:bg-gray-800 hover:bg-lavender-blue-50 shadow-[8px_8px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_#7888FF]"
            } active:translate-x-[4px] active:translate-y-[4px] active:shadow-none`}
          >
            🤝 Collaboration
          </button>
        </div>

        {/* Workload Dashboard View */}
        {activeView === "workload" && (
          <div className="space-y-6">
            <WorkloadDashboard />
          </div>
        )}

        {/* Collaboration View */}
        {activeView === "collaboration" && (
          <div className="space-y-6">
            <CollaborationRequests userId={currentUser.id} userName={currentUser.name} />
          </div>
        )}

        {/* Applications View */}
        {activeView === "applications" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Applications List */}
            <div className="lg:col-span-1 space-y-4">
              <div className="border-[3px] border-black dark:border-lavender-blue-200 bg-white dark:bg-gray-800 p-4 shadow-[8px_8px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_#7888FF]">
                <h2 className="text-xl font-bold mb-4">Applications</h2>
                
                {/* Demo application list - in production, fetch from database */}
                <div className="space-y-2">
                  {["APP001", "APP002", "APP003"].map((appId) => (
                    <button
                      key={appId}
                      onClick={() => setSelectedApplicationId(appId)}
                      className={`w-full text-left p-4 border-[3px] border-black dark:border-lavender-blue-200 transition-all ${
                        selectedApplicationId === appId
                          ? "bg-lavender-blue-600 text-white shadow-none translate-x-[4px] translate-y-[4px]"
                          : "bg-white dark:bg-gray-800 hover:bg-lavender-blue-50 shadow-[4px_4px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_#7888FF]"
                      } active:translate-x-[4px] active:translate-y-[4px] active:shadow-none`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-bold">{appId}</p>
                          <p className="text-sm opacity-75">
                            Tech Startup Ltd.
                          </p>
                        </div>
                        <span className="px-2 py-1 text-xs bg-amber-500 text-white font-bold">
                          PENDING
                        </span>
                      </div>
                      <p className="text-sm mt-2 opacity-75">
                        ₦5,000,000 - Murabaha
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Application Details */}
            {selectedApplicationId ? (
              <div className="lg:col-span-2 space-y-6">
                {/* Tab Navigation */}
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: "details", label: "📄 Details" },
                    { id: "assignment", label: "👤 Assignment" },
                    { id: "messages", label: "💬 Messages" },
                    { id: "notes", label: "📝 Notes" },
                    { id: "due-diligence", label: "✅ Due Diligence" },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`px-4 py-2 font-bold border-[3px] border-black text-sm transition-all ${
                        activeTab === tab.id
                          ? "bg-lavender-blue-600 text-white shadow-none translate-x-[2px] translate-y-[2px]"
                          : "bg-white dark:bg-gray-800 hover:bg-lavender-blue-50 shadow-[4px_4px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_#7888FF]"
                      } active:translate-x-[2px] active:translate-y-[2px] active:shadow-none`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Tab Content */}
                <div>
                  {activeTab === "details" && (
                    <div className="border-[3px] border-black dark:border-lavender-blue-200 bg-white dark:bg-gray-800 p-6 shadow-[8px_8px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_#7888FF]">
                      <h3 className="text-xl font-bold mb-4">
                        Application Details
                      </h3>
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Business Name:
                          </p>
                          <p className="font-bold">Tech Startup Ltd.</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Contract Type:
                          </p>
                          <p className="font-bold">Murabaha (Cost-Plus Financing)</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Requested Amount:
                          </p>
                          <p className="font-bold text-2xl text-lavender-blue-600">
                            ₦5,000,000
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Status:
                          </p>
                          <span className="px-3 py-1 bg-amber-500 text-white font-bold">
                            PENDING REVIEW
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === "assignment" && (
                    <AssignmentManager
                      applicationId={selectedApplicationId}
                      currentAssignment={undefined}
                      onAssignmentChange={(assignment) => {
                        console.log("Assignment updated:", assignment);
                      }}
                    />
                  )}

                  {activeTab === "messages" && (
                    <MessagingInterface
                      applicationId={selectedApplicationId}
                      currentUserId={currentUser.id}
                      currentUserType={currentUser.type}
                      currentUserName={currentUser.name}
                      recipientId="business_001"
                      recipientType="business"
                    />
                  )}

                  {activeTab === "notes" && (
                    <InternalNotes
                      applicationId={selectedApplicationId}
                      currentUserId={currentUser.id}
                      currentUserName={currentUser.name}
                    />
                  )}

                  {activeTab === "due-diligence" && (
                    <div className="border-[3px] border-black dark:border-lavender-blue-200 bg-white dark:bg-gray-800 p-6 shadow-[8px_8px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_#7888FF]">
                      <h3 className="text-xl font-bold mb-4">
                        Due Diligence Checklist
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        Due diligence checklist feature coming soon. This will integrate with the existing due diligence interface from the original admin dashboard.
                      </p>
                      <Link
                        href="/admin/business-applications"
                        className="inline-block mt-4 px-6 py-3 bg-lavender-blue-600 hover:bg-lavender-blue-700 text-white font-bold border-[3px] border-black shadow-[8px_8px_0px_rgba(0,0,0,1)] active:translate-x-[8px] active:translate-y-[8px] active:shadow-none transition-all"
                      >
                        Go to Full Applications Page
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="lg:col-span-2 border-[3px] border-black dark:border-lavender-blue-200 bg-white dark:bg-gray-800 p-12 text-center shadow-[8px_8px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_#7888FF]">
                <p className="text-xl text-gray-500 dark:text-gray-400">
                  Select an application to view details
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Info Banner */}
      <div className="fixed bottom-6 right-6 max-w-md bg-lavender-blue-600 text-white p-4 border-[3px] border-black shadow-[8px_8px_0px_rgba(0,0,0,1)]">
        <p className="font-bold mb-2">🚀 Phase 2 Features Active</p>
        <ul className="text-sm space-y-1">
          <li>✅ Application Assignment</li>
          <li>✅ Review Queue Management</li>
          <li>✅ In-App Messaging</li>
          <li>✅ Internal Notes</li>
          <li>✅ Collaboration Requests</li>
        </ul>
      </div>
    </div>
  );
}
