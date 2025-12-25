"use client";

import type { ApplicationData } from "@/schemas";

interface ApplicationTimelineProps {
  application: ApplicationData;
  submittedAt?: string;
}

interface TimelineStep {
  key: string;
  label: string;
  icon: string;
  completed?: boolean;
  current?: boolean;
  rejected?: boolean;
  moreInfo?: boolean;
}

export function ApplicationTimeline({ application, submittedAt }: ApplicationTimelineProps) {
  const getStatusSteps = (): TimelineStep[] => {
    const allSteps: TimelineStep[] = [
      { key: "submitted", label: "Submitted", icon: "✓" },
      { key: "review", label: "Under Review", icon: "⏳" },
      { key: "approved", label: "Approved", icon: "✓" },
      { key: "funded", label: "Funded", icon: "💰" },
    ];

    const status = application.status;
    let currentIndex = 0;

    if (status === "pending" || status === "new") currentIndex = 0;
    else if (status === "review") currentIndex = 1;
    else if (status === "approved") currentIndex = 2;
    else if (status === "rejected") {
      return [
        { key: "submitted", label: "Submitted", icon: "✓", completed: true },
        { key: "rejected", label: "Rejected", icon: "✗", completed: true, rejected: true },
      ];
    } else if (status === "more-info") {
      return [
        { key: "submitted", label: "Submitted", icon: "✓", completed: true },
        { key: "more-info", label: "More Info Needed", icon: "❗", completed: true, moreInfo: true },
      ];
    }

    return allSteps.map((step, index) => ({
      ...step,
      completed: index <= currentIndex,
      current: index === currentIndex,
    }));
  };

  const steps = getStatusSteps();

  const getDaysElapsed = () => {
    if (!submittedAt) return 0;
    const submitted = new Date(submittedAt);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - submitted.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-2xl border-2 border-neutral-200 dark:border-neutral-800 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-neutral-900 dark:text-white">Application Progress</h3>
        <div className="text-sm text-neutral-500 dark:text-neutral-400">
          {getDaysElapsed()} days since submission
        </div>
      </div>

      <div className="relative">
        {/* Progress Line */}
        <div className="absolute left-5 top-5 bottom-5 w-0.5 bg-neutral-200 dark:bg-neutral-800" />
        
        {/* Steps */}
        <div className="space-y-6">
          {steps.map((step, index) => (
            <div key={step.key} className="relative flex items-start gap-4">
              {/* Icon */}
              <div
                className={`relative z-10 flex items-center justify-center w-10 h-10 rounded-full border-2 font-semibold text-sm ${
                  step.rejected
                    ? "bg-danger-100 dark:bg-danger-900/30 border-danger-500 dark:border-danger-600 text-danger-700 dark:text-danger-300"
                    : step.moreInfo
                    ? "bg-warning-100 dark:bg-warning-900/30 border-warning-500 dark:border-warning-600 text-warning-700 dark:text-warning-300"
                    : step.completed
                    ? "bg-success-100 dark:bg-success-900/30 border-success-500 dark:border-success-600 text-success-700 dark:text-success-300"
                    : step.current
                    ? "bg-primary-100 dark:bg-primary-900/30 border-primary-500 dark:border-primary-600 text-primary-700 dark:text-primary-300 animate-pulse"
                    : "bg-neutral-100 dark:bg-neutral-800 border-neutral-300 dark:border-neutral-700 text-neutral-400 dark:text-neutral-600"
                }`}
              >
                {step.icon}
              </div>

              {/* Content */}
              <div className="flex-1 pt-1">
                <h4
                  className={`font-semibold ${
                    step.rejected
                      ? "text-danger-700 dark:text-danger-300"
                      : step.moreInfo
                      ? "text-warning-700 dark:text-warning-300"
                      : step.completed || step.current
                      ? "text-neutral-900 dark:text-white"
                      : "text-neutral-400 dark:text-neutral-600"
                  }`}
                >
                  {step.label}
                </h4>
                
                {step.key === "submitted" && submittedAt && (
                  <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                    {new Date(submittedAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                )}
                
                {step.key === "review" && step.current && (
                  <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                    Our team is reviewing your application
                  </p>
                )}
                
                {step.key === "approved" && step.current && (
                  <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                    Creating funding opportunity
                  </p>
                )}
                
                {step.rejected && application.rejectionReason && (
                  <div className="mt-2 p-3 bg-danger-50 dark:bg-danger-900/20 rounded-lg border border-danger-200 dark:border-danger-800">
                    <p className="text-sm text-danger-700 dark:text-danger-300">
                      {application.rejectionReason}
                    </p>
                    {application.rejectionAllowsResubmit !== false && (
                      <p className="text-xs text-danger-600 dark:text-danger-400 mt-1">
                        You can edit and resubmit your application
                      </p>
                    )}
                  </div>
                )}
                
                {step.moreInfo && application.adminMessage && (
                  <div className="mt-2 p-3 bg-warning-50 dark:bg-warning-900/20 rounded-lg border border-warning-200 dark:border-warning-800">
                    <p className="text-sm text-warning-700 dark:text-warning-300">
                      {application.adminMessage}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
