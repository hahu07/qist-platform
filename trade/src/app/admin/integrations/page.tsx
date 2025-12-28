"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { initSatellite } from "@junobuild/core";
import { listDocs } from "@junobuild/core";
import type { ApplicationData } from "@/schemas/application.schema";
import BulkOperations from "@/components/bulk-operations";
import ExportManager from "@/components/export-manager";
import IntegrationHub from "@/components/integration-hub";

export default function IntegrationsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"bulk" | "export" | "integrations" | "workflows">("bulk");
  const [applications, setApplications] = useState<Array<{ key: string; data: ApplicationData }>>([]);
  const [selectedApplications, setSelectedApplications] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState<string>("");

  useEffect(() => {
    (async () => await initSatellite({ workers: { auth: true } }))();
    loadApplications();
  }, []);

  const loadApplications = async () => {
    try {
      const result = await listDocs<ApplicationData>({
        collection: "business_applications",
        filter: {
          paginate: {
            limit: 100,
          },
        },
      });
      setApplications(result.items);
    } catch (error) {
      console.error("Failed to load applications:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleApplication = (appId: string) => {
    setSelectedApplications((prev) =>
      prev.includes(appId) ? prev.filter((id) => id !== appId) : [...prev, appId]
    );
  };

  const toggleAll = () => {
    if (selectedApplications.length === applications.length) {
      setSelectedApplications([]);
    } else {
      setSelectedApplications(applications.map((app) => app.key));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-900 dark:to-neutral-800 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push("/admin/business-applications")}
            className="mb-4 text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 font-medium flex items-center space-x-2"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            <span>Back to Applications</span>
          </button>

          <h1 className="text-4xl font-bold text-neutral-900 dark:text-white mb-2">
            Integrations & Automation
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400">
            External integrations, bulk operations, exports, and automated workflows
          </p>
        </div>

        {/* Tabs */}
        <div className="flex space-x-2 mb-6 border-b border-neutral-200 dark:border-neutral-700">
          <button
            onClick={() => setActiveTab("bulk")}
            className={`px-6 py-3 font-medium text-sm transition-colors ${
              activeTab === "bulk"
                ? "text-primary-600 border-b-2 border-primary-600"
                : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
            }`}
          >
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <span>Bulk Operations</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab("export")}
            className={`px-6 py-3 font-medium text-sm transition-colors ${
              activeTab === "export"
                ? "text-primary-600 border-b-2 border-primary-600"
                : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
            }`}
          >
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>Export Data</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab("integrations")}
            className={`px-6 py-3 font-medium text-sm transition-colors ${
              activeTab === "integrations"
                ? "text-primary-600 border-b-2 border-primary-600"
                : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
            }`}
          >
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span>External APIs</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab("workflows")}
            className={`px-6 py-3 font-medium text-sm transition-colors ${
              activeTab === "workflows"
                ? "text-primary-600 border-b-2 border-primary-600"
                : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
            }`}
          >
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
              </svg>
              <span>Automated Workflows</span>
            </div>
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === "bulk" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Application Selection */}
            <div className="lg:col-span-1">
              <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-sm p-6 border border-neutral-200 dark:border-neutral-700">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">
                    Select Applications
                  </h3>
                  <button
                    onClick={toggleAll}
                    className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                  >
                    {selectedApplications.length === applications.length ? "Deselect All" : "Select All"}
                  </button>
                </div>

                {isLoading ? (
                  <div className="text-center py-8 text-neutral-600 dark:text-neutral-400">
                    Loading applications...
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[600px] overflow-y-auto">
                    {applications.map((app) => (
                      <label
                        key={app.key}
                        className="flex items-start space-x-3 p-3 bg-neutral-50 dark:bg-neutral-900/50 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-900 cursor-pointer transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={selectedApplications.includes(app.key)}
                          onChange={() => toggleApplication(app.key)}
                          className="mt-1 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-neutral-900 dark:text-white truncate">
                            {app.data.businessName}
                          </div>
                          <div className="text-xs text-neutral-600 dark:text-neutral-400">
                            {app.data.industry} • {app.data.status}
                          </div>
                          <div className="text-xs text-neutral-500 dark:text-neutral-500">
                            ₦{app.data.requestedAmount.toLocaleString()}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                )}

                <div className="mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-700">
                  <div className="text-sm text-neutral-600 dark:text-neutral-400">
                    {selectedApplications.length} selected
                  </div>
                </div>
              </div>
            </div>

            {/* Bulk Operations */}
            <div className="lg:col-span-2">
              <BulkOperations
                selectedApplications={selectedApplications}
                onOperationComplete={() => {
                  loadApplications();
                  setSelectedApplications([]);
                }}
              />
            </div>
          </div>
        )}

        {activeTab === "export" && <ExportManager />}

        {activeTab === "integrations" && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-sm p-6 border border-neutral-200 dark:border-neutral-700">
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">
                Test External Integrations
              </h3>
              <div className="mb-4">
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Select Application
                </label>
                <select
                  value={selectedApp}
                  onChange={(e) => setSelectedApp(e.target.value)}
                  className="w-full px-4 py-2 border border-neutral-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">Select an application...</option>
                  {applications.map((app) => (
                    <option key={app.key} value={app.key}>
                      {app.data.businessName} - {app.data.industry}
                    </option>
                  ))}
                </select>
              </div>

              {selectedApp && (
                <IntegrationHub
                  applicationId={selectedApp}
                  applicantData={{
                    bvn: applications.find((app) => app.key === selectedApp)?.data.bvn || undefined,
                    name: applications.find((app) => app.key === selectedApp)?.data.businessName || "",
                    email: applications.find((app) => app.key === selectedApp)?.data.businessEmail || "",
                  }}
                />
              )}
            </div>
          </div>
        )}

        {activeTab === "workflows" && (
          <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-sm p-6 border border-neutral-200 dark:border-neutral-700">
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">
              Automated Workflows
            </h3>
            <div className="text-center py-12 text-neutral-600 dark:text-neutral-400">
              <svg
                className="w-16 h-16 mx-auto mb-4 text-neutral-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"
                />
              </svg>
              <p className="text-lg font-medium mb-2">Workflow Builder Coming Soon</p>
              <p className="text-sm">
                Create automated workflows with triggers, conditions, and actions
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
