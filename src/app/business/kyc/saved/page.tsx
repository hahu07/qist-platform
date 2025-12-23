"use client";

import Link from "next/link";

export default function KycSavedPage() {

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-primary-50/30 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-white dark:bg-neutral-900 rounded-2xl p-8 border-2 border-neutral-200 dark:border-neutral-800 shadow-xl text-center">
          {/* Success Icon */}
          <div className="w-20 h-20 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-primary-600 dark:text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>

          {/* Message */}
          <h1 className="font-display font-bold text-2xl text-neutral-900 dark:text-white mb-3">
            Documents Saved!
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400 mb-6">
            Your KYC documents have been saved successfully. You can continue uploading or submit them for review anytime from your dashboard.
          </p>

          {/* Reminder Box */}
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mb-6 text-left">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <p className="text-sm font-medium text-amber-800 dark:text-amber-200 mb-1">
                  Don't forget to submit!
                </p>
                <p className="text-xs text-amber-700 dark:text-amber-300">
                  Remember to submit your documents for review to complete your KYC verification.
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <Link
              href="/business/dashboard"
              className="block w-full px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white font-semibold rounded-lg transition-all shadow-md hover:shadow-lg"
            >
              Go to Dashboard
            </Link>
            <Link
              href="/business/kyc"
              className="block w-full px-6 py-3 border-2 border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 font-medium rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              Continue Uploading
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
