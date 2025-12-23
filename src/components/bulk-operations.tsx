"use client";

import { useEffect, useState } from "react";
import { initSatellite } from "@junobuild/core";
import { BulkOperation } from "@/schemas/integrations.schema";
import { executeBulkOperation } from "@/utils/integration-actions";

interface BulkOperationsProps {
  selectedApplications: string[];
  onOperationComplete?: () => void;
}

export default function BulkOperations({
  selectedApplications,
  onOperationComplete,
}: BulkOperationsProps) {
  const [operation, setOperation] = useState<string>("");
  const [parameters, setParameters] = useState<Record<string, string>>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentOperation, setCurrentOperation] = useState<BulkOperation | null>(null);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    (async () => await initSatellite({ workers: { auth: true } }))();
  }, []);

  const handleExecute = async () => {
    if (!operation || selectedApplications.length === 0) {
      setError("Please select an operation and applications");
      return;
    }

    setIsProcessing(true);
    setError("");

    try {
      const result = await executeBulkOperation(
        operation as BulkOperation["type"],
        selectedApplications,
        "current_user_id", // Replace with actual user ID
        parameters
      );

      setCurrentOperation(result);

      if (onOperationComplete) {
        onOperationComplete();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Operation failed");
    } finally {
      setIsProcessing(false);
    }
  };

  const getOperationParameters = () => {
    switch (operation) {
      case "reject":
        return (
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Rejection Reason
            </label>
            <textarea
              value={parameters.reason || ""}
              onChange={(e) => setParameters({ ...parameters, reason: e.target.value })}
              className="w-full px-4 py-2 border border-neutral-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              rows={3}
              placeholder="Enter rejection reason..."
            />
          </div>
        );

      case "assign":
        return (
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Assignee ID
            </label>
            <input
              type="text"
              value={parameters.assigneeId || ""}
              onChange={(e) => setParameters({ ...parameters, assigneeId: e.target.value })}
              className="w-full px-4 py-2 border border-neutral-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Enter reviewer ID..."
            />
          </div>
        );

      case "update_status":
        return (
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              New Status
            </label>
            <select
              value={parameters.status || ""}
              onChange={(e) => setParameters({ ...parameters, status: e.target.value })}
              className="w-full px-4 py-2 border border-neutral-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">Select status...</option>
              <option value="new">New</option>
              <option value="review">Under Review</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="pending">Pending</option>
              <option value="more-info">More Info Needed</option>
            </select>
          </div>
        );

      case "send_notification":
        return (
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Message
            </label>
            <textarea
              value={parameters.message || ""}
              onChange={(e) => setParameters({ ...parameters, message: e.target.value })}
              className="w-full px-4 py-2 border border-neutral-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              rows={3}
              placeholder="Enter notification message..."
            />
          </div>
        );

      case "request_documents":
        return (
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Documents (comma-separated)
            </label>
            <input
              type="text"
              value={parameters.documents || ""}
              onChange={(e) => setParameters({ ...parameters, documents: e.target.value })}
              className="w-full px-4 py-2 border border-neutral-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="e.g., bank_statement, tax_clearance..."
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Operation Selection */}
      <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-sm p-6 border border-neutral-200 dark:border-neutral-700">
        <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">
          Bulk Operations
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Selected Applications: {selectedApplications.length}
            </label>
            <div className="text-xs text-neutral-600 dark:text-neutral-400">
              {selectedApplications.slice(0, 3).join(", ")}
              {selectedApplications.length > 3 && ` ... and ${selectedApplications.length - 3} more`}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Operation
            </label>
            <select
              value={operation}
              onChange={(e) => {
                setOperation(e.target.value);
                setParameters({});
              }}
              className="w-full px-4 py-2 border border-neutral-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">Select operation...</option>
              <option value="approve">Approve All</option>
              <option value="reject">Reject All</option>
              <option value="assign">Assign to Reviewer</option>
              <option value="update_status">Update Status</option>
              <option value="send_notification">Send Notification</option>
              <option value="request_documents">Request Documents</option>
              <option value="archive">Archive</option>
            </select>
          </div>

          {getOperationParameters()}

          <button
            onClick={handleExecute}
            disabled={isProcessing || !operation || selectedApplications.length === 0}
            className="w-full px-6 py-3 bg-primary-600 hover:bg-primary-700 disabled:bg-neutral-400 text-white font-medium rounded-xl transition-colors"
          >
            {isProcessing ? "Processing..." : `Execute on ${selectedApplications.length} applications`}
          </button>

          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}
        </div>
      </div>

      {/* Progress Display */}
      {currentOperation && (
        <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-sm p-6 border border-neutral-200 dark:border-neutral-700">
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">
            Operation Progress
          </h3>

          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-neutral-600 dark:text-neutral-400">Status:</span>
              <span className={`font-medium ${
                currentOperation.status === "completed" ? "text-green-600" :
                currentOperation.status === "failed" ? "text-red-600" :
                currentOperation.status === "partial" ? "text-yellow-600" :
                "text-blue-600"
              }`}>
                {currentOperation.status.toUpperCase()}
              </span>
            </div>

            <div>
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-neutral-600 dark:text-neutral-400">Progress:</span>
                <span className="font-medium text-neutral-900 dark:text-white">
                  {currentOperation.progress.processed} / {currentOperation.progress.total}
                </span>
              </div>
              <div className="w-full bg-neutral-200 dark:bg-neutral-700 rounded-full h-2">
                <div
                  className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${(currentOperation.progress.processed / currentOperation.progress.total) * 100}%`,
                  }}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {currentOperation.progress.successful}
                </div>
                <div className="text-xs text-neutral-600 dark:text-neutral-400">Successful</div>
              </div>
              <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {currentOperation.progress.failed}
                </div>
                <div className="text-xs text-neutral-600 dark:text-neutral-400">Failed</div>
              </div>
              <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {currentOperation.progress.total - currentOperation.progress.processed}
                </div>
                <div className="text-xs text-neutral-600 dark:text-neutral-400">Remaining</div>
              </div>
            </div>

            {/* Results */}
            {currentOperation.results.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-neutral-900 dark:text-white mb-2">
                  Results:
                </h4>
                <div className="max-h-60 overflow-y-auto space-y-2">
                  {currentOperation.results.map((result, index) => (
                    <div
                      key={index}
                      className={`p-3 rounded-lg text-sm ${
                        result.success
                          ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800"
                          : "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs text-neutral-600 dark:text-neutral-400">
                          {result.applicationId.slice(0, 12)}...
                        </span>
                        <span className={`font-medium ${
                          result.success ? "text-green-600" : "text-red-600"
                        }`}>
                          {result.success ? "✓ Success" : "✗ Failed"}
                        </span>
                      </div>
                      {result.error && (
                        <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                          {result.error}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
