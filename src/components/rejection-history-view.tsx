"use client";

import { useState, useEffect } from "react";
import type { Doc } from "@junobuild/core";
import type { ApplicationData } from "@/schemas";
import { applicationRejectionReasons } from "@/schemas";

interface RejectionHistoryEntry {
  timestamp: string;
  reason: string;
  message?: string;
  allowsResubmit: boolean;
  resubmittedAt?: string;
}

interface RejectionHistoryViewProps {
  application: Doc<ApplicationData>;
}

export function RejectionHistoryView({ application }: RejectionHistoryViewProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [history, setHistory] = useState<RejectionHistoryEntry[]>([]);

  useEffect(() => {
    // Build rejection history from application data
    const entries: RejectionHistoryEntry[] = [];

    if (application.data.status === "rejected" && application.data.rejectionReason) {
      entries.push({
        timestamp: application.updated_at 
          ? new Date(Number(application.updated_at) / 1000000).toISOString()
          : new Date().toISOString(),
        reason: application.data.rejectionReason,
        message: application.data.adminMessage,
        allowsResubmit: application.data.rejectionAllowsResubmit !== false,
        resubmittedAt: application.data.resubmittedAt,
      });
    }

    // In a full implementation, you would query a separate rejection_history collection
    // For now, we show the current rejection if it exists
    setHistory(entries);
  }, [application]);

  if (history.length === 0) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-2xl border-2 border-neutral-200 dark:border-neutral-800 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-neutral-900 dark:text-white">
          Rejection History ({history.length})
        </h3>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 flex items-center gap-1"
        >
          {isExpanded ? "Hide" : "View"} Details
          <svg
            className={`w-4 h-4 transition-transform ${isExpanded ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {isExpanded && (
        <div className="space-y-4">
          {history.map((entry, index) => (
            <div
              key={index}
              className={`p-4 rounded-xl border-2 ${
                entry.allowsResubmit
                  ? "bg-warning-50 dark:bg-warning-900/20 border-warning-200 dark:border-warning-800"
                  : "bg-danger-50 dark:bg-danger-900/20 border-danger-200 dark:border-danger-800"
              }`}
            >
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      entry.allowsResubmit
                        ? "bg-warning-100 dark:bg-warning-900/40"
                        : "bg-danger-100 dark:bg-danger-900/40"
                    }`}
                  >
                    <svg
                      className={`w-5 h-5 ${
                        entry.allowsResubmit
                          ? "text-warning-600 dark:text-warning-400"
                          : "text-danger-600 dark:text-danger-400"
                      }`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </div>
                  <div>
                    <p
                      className={`font-bold ${
                        entry.allowsResubmit
                          ? "text-warning-900 dark:text-warning-100"
                          : "text-danger-900 dark:text-danger-100"
                      }`}
                    >
                      Rejection #{history.length - index}
                    </p>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">
                      {new Date(entry.timestamp).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>

                <span
                  className={`px-3 py-1 text-xs font-bold rounded-full whitespace-nowrap ${
                    entry.allowsResubmit
                      ? "bg-warning-200 dark:bg-warning-800 text-warning-800 dark:text-warning-200"
                      : "bg-danger-200 dark:bg-danger-800 text-danger-800 dark:text-danger-200"
                  }`}
                >
                  {entry.allowsResubmit ? "Can Resubmit" : "Permanent"}
                </span>
              </div>

              <div className="space-y-3">
                <div>
                  <p className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1">
                    Rejection Reason
                  </p>
                  <p
                    className={`text-sm font-medium ${
                      entry.allowsResubmit
                        ? "text-warning-800 dark:text-warning-200"
                        : "text-danger-800 dark:text-danger-200"
                    }`}
                  >
                    {entry.reason}
                  </p>
                </div>

                {entry.message && (
                  <div>
                    <p className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1">
                      Admin Message
                    </p>
                    <p className="text-sm text-neutral-700 dark:text-neutral-300">{entry.message}</p>
                  </div>
                )}

                {entry.resubmittedAt && (
                  <div className="pt-3 border-t border-warning-300 dark:border-warning-700">
                    <div className="flex items-center gap-2 text-success-700 dark:text-success-300">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <p className="text-sm font-medium">
                        Resubmitted on{" "}
                        {new Date(entry.resubmittedAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}

          {history.length === 0 && (
            <p className="text-center text-neutral-500 dark:text-neutral-400 py-4">
              No rejection history found
            </p>
          )}
        </div>
      )}

      {!isExpanded && history.length > 0 && (
        <div className="text-sm text-neutral-600 dark:text-neutral-400">
          Your application has been rejected {history.length} time{history.length !== 1 ? "s" : ""}. Click
          "View Details" to see the full history.
        </div>
      )}
    </div>
  );
}

interface RejectionSummaryBadgeProps {
  application: Doc<ApplicationData>;
}

export function RejectionSummaryBadge({ application }: RejectionSummaryBadgeProps) {
  if (application.data.status !== "rejected") return null;

  const isResubmittable = application.data.rejectionAllowsResubmit !== false;

  return (
    <div
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold ${
        isResubmittable
          ? "bg-warning-100 dark:bg-warning-900/30 text-warning-800 dark:text-warning-300 border-2 border-warning-300 dark:border-warning-700"
          : "bg-danger-100 dark:bg-danger-900/30 text-danger-800 dark:text-danger-300 border-2 border-danger-300 dark:border-danger-700"
      }`}
    >
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
      <span>
        Application Rejected
        {isResubmittable && " - Can Resubmit"}
      </span>
    </div>
  );
}
