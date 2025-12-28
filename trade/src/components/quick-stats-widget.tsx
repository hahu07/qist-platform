"use client";

import type { ApplicationData } from "@/schemas";

interface QuickStatsWidgetProps {
  application: ApplicationData | null;
  submittedAt?: string;
}

export function QuickStatsWidget({ application, submittedAt }: QuickStatsWidgetProps) {
  const getDaysElapsed = () => {
    if (!submittedAt) return 0;
    const submitted = new Date(submittedAt);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - submitted.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getStatusLabel = () => {
    if (!application) return "Not Applied";
    switch (application.status) {
      case "pending":
      case "new":
        return "Pending Review";
      case "review":
        return "Under Review";
      case "approved":
        return "Approved";
      case "rejected":
        return "Rejected";
      case "more-info":
        return "More Info Needed";
      default:
        return "Unknown";
    }
  };

  const getStatusColor = () => {
    if (!application) return "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400";
    switch (application.status) {
      case "approved":
        return "bg-success-100 dark:bg-success-900/30 text-success-700 dark:text-success-300";
      case "pending":
      case "new":
      case "review":
        return "bg-warning-100 dark:bg-warning-900/30 text-warning-700 dark:text-warning-300";
      case "rejected":
        return "bg-danger-100 dark:bg-danger-900/30 text-danger-700 dark:text-danger-300";
      case "more-info":
        return "bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300";
      default:
        return "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400";
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (!application) {
    return (
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border-2 border-neutral-200 dark:border-neutral-800 p-6">
        <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-4">Quick Stats</h3>
        <div className="text-center py-8">
          <p className="text-neutral-500 dark:text-neutral-400">No application data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-2xl border-2 border-neutral-200 dark:border-neutral-800 p-6">
      <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-6">Quick Stats</h3>
      
      <div className="grid grid-cols-2 gap-4">
        {/* Requested Amount */}
        <div className="bg-gradient-to-br from-primary-50 to-primary-100/50 dark:from-primary-900/20 dark:to-primary-900/10 rounded-xl p-4 border border-primary-200 dark:border-primary-800">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900/40 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-primary-600 dark:text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="text-xs font-medium text-primary-700 dark:text-primary-300 uppercase tracking-wider">Requested</span>
          </div>
          <p className="text-xl font-bold text-primary-900 dark:text-primary-100">{formatCurrency(application.requestedAmount)}</p>
        </div>

        {/* Application Status */}
        <div className="bg-gradient-to-br from-neutral-50 to-neutral-100/50 dark:from-neutral-800/50 dark:to-neutral-900/30 rounded-xl p-4 border border-neutral-200 dark:border-neutral-700">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-neutral-100 dark:bg-neutral-800 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-neutral-600 dark:text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="text-xs font-medium text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">Status</span>
          </div>
          <p className={`text-sm font-semibold px-3 py-1 rounded-lg inline-block ${getStatusColor()}`}>
            {getStatusLabel()}
          </p>
        </div>

        {/* Days Pending */}
        <div className="bg-gradient-to-br from-warning-50 to-warning-100/50 dark:from-warning-900/20 dark:to-warning-900/10 rounded-xl p-4 border border-warning-200 dark:border-warning-800">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-warning-100 dark:bg-warning-900/40 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-warning-600 dark:text-warning-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="text-xs font-medium text-warning-700 dark:text-warning-300 uppercase tracking-wider">Days Pending</span>
          </div>
          <p className="text-xl font-bold text-warning-900 dark:text-warning-100">{getDaysElapsed()}</p>
          <p className="text-xs text-warning-600 dark:text-warning-400 mt-1">
            {getDaysElapsed() > 5 ? "Review in progress" : "Recently submitted"}
          </p>
        </div>

        {/* Contract Type */}
        <div className="bg-gradient-to-br from-success-50 to-success-100/50 dark:from-success-900/20 dark:to-success-900/10 rounded-xl p-4 border border-success-200 dark:border-success-800">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-success-100 dark:bg-success-900/40 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-success-600 dark:text-success-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <span className="text-xs font-medium text-success-700 dark:text-success-300 uppercase tracking-wider">Contract</span>
          </div>
          <p className="text-sm font-bold text-success-900 dark:text-success-100 capitalize">
            {application.contractType || "Not specified"}
          </p>
          <p className="text-xs text-success-600 dark:text-success-400 mt-1">
            {application.fundingDuration || 12} months
          </p>
        </div>
      </div>
    </div>
  );
}
