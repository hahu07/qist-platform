"use client";

import { useEffect, useState } from "react";
import { initSatellite } from "@junobuild/core";
import { ExportConfig } from "@/schemas/integrations.schema";
import { createExport } from "@/utils/integration-actions";

export default function ExportManager() {
  const [format, setFormat] = useState<ExportConfig["format"]>("excel");
  const [type, setType] = useState<ExportConfig["type"]>("applications");
  const [includeDocuments, setIncludeDocuments] = useState(false);
  const [includeImages, setIncludeImages] = useState(false);
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [isProcessing, setIsProcessing] = useState(false);
  const [exports, setExports] = useState<ExportConfig[]>([]);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    (async () => await initSatellite({ workers: { auth: true } }))();
  }, []);

  const availableColumns: Record<ExportConfig["type"], string[]> = {
    applications: [
      "businessName",
      "contactPerson",
      "email",
      "phone",
      "requestedAmount",
      "contractType",
      "status",
      "industry",
      "submittedAt",
      "reviewedBy",
    ],
    analytics: [
      "totalApplications",
      "averageAmount",
      "approvalRate",
      "processingTime",
      "industry",
      "riskLevel",
    ],
    transactions: [
      "transactionId",
      "amount",
      "type",
      "status",
      "timestamp",
      "reference",
    ],
    reports: [
      "reportType",
      "generatedAt",
      "generatedBy",
      "parameters",
    ],
    audit_log: [
      "action",
      "userId",
      "timestamp",
      "resource",
      "changes",
    ],
  };

  const handleCreateExport = async () => {
    setIsProcessing(true);
    setError("");

    try {
      const filters: Record<string, unknown> = {};
      
      if (dateRange.start && dateRange.end) {
        filters.dateRange = {
          start: new Date(dateRange.start).getTime(),
          end: new Date(dateRange.end).getTime(),
        };
      }

      const exportConfig = await createExport(
        format,
        type,
        "current_user_id", // Replace with actual user ID
        filters,
        {
          columns: selectedColumns.length > 0 ? selectedColumns : undefined,
          includeDocuments,
          includeImages,
          dateRange: dateRange.start && dateRange.end ? {
            start: new Date(dateRange.start).getTime(),
            end: new Date(dateRange.end).getTime(),
          } : undefined,
        }
      );

      setExports([exportConfig, ...exports]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Export creation failed");
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleColumn = (column: string) => {
    setSelectedColumns((prev) =>
      prev.includes(column)
        ? prev.filter((c) => c !== column)
        : [...prev, column]
    );
  };

  return (
    <div className="space-y-6">
      {/* Export Configuration */}
      <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-sm p-6 border border-neutral-200 dark:border-neutral-700">
        <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">
          Create Export
        </h3>

        <div className="space-y-4">
          {/* Format & Type */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                Format
              </label>
              <select
                value={format}
                onChange={(e) => setFormat(e.target.value as ExportConfig["format"])}
                className="w-full px-4 py-2 border border-neutral-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="csv">CSV</option>
                <option value="excel">Excel</option>
                <option value="pdf">PDF</option>
                <option value="json">JSON</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                Data Type
              </label>
              <select
                value={type}
                onChange={(e) => {
                  setType(e.target.value as ExportConfig["type"]);
                  setSelectedColumns([]);
                }}
                className="w-full px-4 py-2 border border-neutral-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="applications">Applications</option>
                <option value="analytics">Analytics</option>
                <option value="transactions">Transactions</option>
                <option value="reports">Reports</option>
                <option value="audit_log">Audit Log</option>
              </select>
            </div>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                className="w-full px-4 py-2 border border-neutral-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                End Date
              </label>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                className="w-full px-4 py-2 border border-neutral-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Column Selection */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Select Columns (optional - leave empty for all)
            </label>
            <div className="grid grid-cols-3 gap-2 max-h-40 overflow-y-auto p-3 border border-neutral-200 dark:border-neutral-700 rounded-lg">
              {availableColumns[type].map((column) => (
                <label
                  key={column}
                  className="flex items-center space-x-2 text-sm text-neutral-700 dark:text-neutral-300 cursor-pointer hover:text-primary-600"
                >
                  <input
                    type="checkbox"
                    checked={selectedColumns.includes(column)}
                    onChange={() => toggleColumn(column)}
                    className="rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span>{column}</span>
                </label>
              ))}
            </div>
            {selectedColumns.length > 0 && (
              <p className="mt-2 text-xs text-neutral-600 dark:text-neutral-400">
                {selectedColumns.length} columns selected
              </p>
            )}
          </div>

          {/* Options */}
          <div className="space-y-2">
            <label className="flex items-center space-x-2 text-sm text-neutral-700 dark:text-neutral-300 cursor-pointer">
              <input
                type="checkbox"
                checked={includeDocuments}
                onChange={(e) => setIncludeDocuments(e.target.checked)}
                className="rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
              />
              <span>Include Documents</span>
            </label>

            <label className="flex items-center space-x-2 text-sm text-neutral-700 dark:text-neutral-300 cursor-pointer">
              <input
                type="checkbox"
                checked={includeImages}
                onChange={(e) => setIncludeImages(e.target.checked)}
                className="rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
              />
              <span>Include Images</span>
            </label>
          </div>

          <button
            onClick={handleCreateExport}
            disabled={isProcessing}
            className="w-full px-6 py-3 bg-primary-600 hover:bg-primary-700 disabled:bg-neutral-400 text-white font-medium rounded-xl transition-colors"
          >
            {isProcessing ? "Creating Export..." : "Create Export"}
          </button>

          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}
        </div>
      </div>

      {/* Recent Exports */}
      {exports.length > 0 && (
        <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-sm p-6 border border-neutral-200 dark:border-neutral-700">
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">
            Recent Exports
          </h3>

          <div className="space-y-3">
            {exports.map((exp) => (
              <div
                key={exp.exportId}
                className="flex items-center justify-between p-4 bg-neutral-50 dark:bg-neutral-900/50 rounded-lg border border-neutral-200 dark:border-neutral-700"
              >
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <div className={`w-2 h-2 rounded-full ${
                      exp.status === "completed" ? "bg-green-500" :
                      exp.status === "failed" ? "bg-red-500" :
                      "bg-yellow-500 animate-pulse"
                    }`} />
                    <div>
                      <p className="text-sm font-medium text-neutral-900 dark:text-white">
                        {exp.type.replace("_", " ").toUpperCase()} Export
                      </p>
                      <p className="text-xs text-neutral-600 dark:text-neutral-400">
                        {exp.format.toUpperCase()} • {new Date(exp.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {exp.status === "completed" && exp.downloadUrl && (
                    <>
                      <span className="text-xs text-neutral-600 dark:text-neutral-400">
                        {exp.fileSize ? `${(exp.fileSize / 1024).toFixed(0)} KB` : ""}
                      </span>
                      <a
                        href={exp.downloadUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors"
                      >
                        Download
                      </a>
                    </>
                  )}
                  {exp.status === "processing" && (
                    <span className="text-sm text-yellow-600 dark:text-yellow-400">
                      Processing...
                    </span>
                  )}
                  {exp.status === "failed" && (
                    <span className="text-sm text-red-600 dark:text-red-400">
                      Failed
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
