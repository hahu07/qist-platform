"use client";

import Link from "next/link";
import { useState } from "react";

interface KYCAlertProps {
  kycStatus: "pending" | "in-review" | "verified" | "rejected";
}

export function KYCAlert({ kycStatus }: KYCAlertProps) {
  const [showStatusModal, setShowStatusModal] = useState(false);
  // Don't show alert if KYC is verified
  if (kycStatus === "verified") {
    return null;
  }

  // Alert messages and styles based on status
  const alertConfig = {
    pending: {
      title: "Complete Your KYC Verification",
      message: "Your account access is limited. Please complete KYC verification to start investing.",
      buttonText: "Complete KYC Now",
      buttonHref: "/member/kyc",
      bgColor: "bg-warning-50 dark:bg-warning-900/20",
      borderColor: "border-warning-500 dark:border-warning-600",
      textColor: "text-warning-900 dark:text-warning-100",
      buttonColor: "bg-warning-600 hover:bg-warning-700",
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ),
    },
    "in-review": {
      title: "KYC Documents Under Review",
      message: "We're reviewing your KYC documents. This typically takes 2-3 business days. You'll be notified once approved.",
      buttonText: "View Status",
      buttonHref: "/member/kyc",
      bgColor: "bg-primary-50 dark:bg-primary-900/20",
      borderColor: "border-primary-500 dark:border-primary-600",
      textColor: "text-primary-900 dark:text-primary-100",
      buttonColor: "bg-primary-600 hover:bg-primary-700",
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <circle className="opacity-25" cx="12" cy="12" r="10" strokeWidth="4"></circle>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    rejected: {
      title: "KYC Verification Rejected",
      message: "Unfortunately, your KYC documents were not approved. Please review the feedback and resubmit with corrected documents.",
      buttonText: "Resubmit Documents",
      buttonHref: "/member/kyc",
      bgColor: "bg-error-50 dark:bg-error-900/20",
      borderColor: "border-error-500 dark:border-error-600",
      textColor: "text-error-900 dark:text-error-100",
      buttonColor: "bg-error-600 hover:bg-error-700",
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
  };

  const config = alertConfig[kycStatus];

  return (
    <div className={`${config.bgColor} border-l-4 ${config.borderColor} rounded-lg p-6 mb-6 shadow-sm`}>
      <div className="flex items-start gap-4">
        <div className={`flex-shrink-0 ${config.textColor}`}>
          {config.icon}
        </div>
        
        <div className="flex-1">
          <h3 className={`font-bold text-lg ${config.textColor} mb-2`}>
            {config.title}
          </h3>
          <p className={`${config.textColor} opacity-90 mb-4`}>
            {config.message}
          </p>
          
          <div className="flex items-center gap-3">
            {kycStatus === "in-review" ? (
              <button
                onClick={() => setShowStatusModal(true)}
                className={`inline-flex items-center gap-2 px-6 py-3 ${config.buttonColor} text-white font-semibold rounded-lg shadow-md transition-all hover:shadow-lg`}
              >
                {config.buttonText}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
            ) : (
              <Link
                href={config.buttonHref}
                className={`inline-flex items-center gap-2 px-6 py-3 ${config.buttonColor} text-white font-semibold rounded-lg shadow-md transition-all hover:shadow-lg`}
              >
                {config.buttonText}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            )}
            
            {kycStatus === "pending" && (
              <Link
                href="/member/dashboard"
                className="text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors underline"
              >
                I'll do this later
              </Link>
            )}
          </div>
        </div>

        {kycStatus === "pending" && (
          <button
            onClick={() => {
              // Store dismissal in localStorage
              localStorage.setItem('kyc-alert-dismissed', 'true');
              // This component would need to re-render, parent should handle state
            }}
            className="flex-shrink-0 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors"
            aria-label="Dismiss"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Progress Indicator for in-review */}
      {kycStatus === "in-review" && (
        <div className="mt-4 pt-4 border-t border-primary-200 dark:border-primary-800">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className={config.textColor}>Verification Progress</span>
            <span className={`${config.textColor} font-semibold`}>Processing...</span>
          </div>
          <div className="w-full bg-primary-200 dark:bg-primary-900/40 rounded-full h-2 overflow-hidden">
            <div className="bg-primary-600 h-full rounded-full animate-pulse" style={{ width: "65%" }}></div>
          </div>
        </div>
      )}

      {/* Status Modal */}
      {showStatusModal && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border-2 border-neutral-200 dark:border-neutral-800 max-w-md w-full shadow-2xl">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-neutral-900 dark:text-white">
                  KYC Verification Status
                </h3>
                <button
                  onClick={() => setShowStatusModal(false)}
                  className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-primary-600 dark:text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-neutral-900 dark:text-white mb-1">
                      Documents Received
                    </p>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">
                      Your KYC documents have been successfully submitted and are under review.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-primary-600 dark:bg-primary-400 rounded-full animate-pulse"></div>
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-neutral-900 dark:text-white mb-1">
                      Currently Under Review
                    </p>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">
                      Our compliance team is verifying your information. This typically takes 2-3 business days.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 opacity-50">
                  <div className="flex-shrink-0 w-8 h-8 bg-neutral-100 dark:bg-neutral-800 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-neutral-900 dark:text-white mb-1">
                      Verification Complete
                    </p>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">
                      You'll receive a notification once your KYC is approved.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 p-4 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  <span className="font-semibold text-neutral-900 dark:text-white">Note:</span> You'll receive an email notification once the verification is complete. In the meantime, you can browse investment opportunities but cannot invest until KYC is approved.
                </p>
              </div>

              <button
                onClick={() => setShowStatusModal(false)}
                className="mt-6 w-full px-4 py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg transition-colors"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
