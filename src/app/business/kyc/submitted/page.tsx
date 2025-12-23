"use client";

import Link from "next/link";

export default function KycSubmittedPage() {

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-primary-50/30 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-white dark:bg-neutral-900 rounded-2xl p-8 border-2 border-neutral-200 dark:border-neutral-800 shadow-xl text-center">
          {/* Success Icon */}
          <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>

          {/* Message */}
          <h1 className="font-display font-bold text-2xl text-neutral-900 dark:text-white mb-3">
            KYC Submitted for Review!
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400 mb-6">
            Your KYC documents have been successfully submitted to our admin team for verification.
          </p>

          {/* Info Box */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6 text-left">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-1">
                  What happens next?
                </p>
                <ul className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
                  <li>• Admin team will review your documents</li>
                  <li>• Review typically takes 2-3 business days</li>
                  <li>• You'll be notified of the outcome via email</li>
                  <li>• Check your dashboard for KYC approval status</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Status Notice */}
          <div className="bg-neutral-50 dark:bg-neutral-800 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                KYC Status: Under Review
              </span>
            </div>
            <p className="text-xs text-neutral-600 dark:text-neutral-400">
              Your dashboard will show "Pending KYC Approval" status
            </p>
          </div>

          {/* Actions */}
          <Link
            href="/business/dashboard"
            className="block w-full px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white font-semibold rounded-lg transition-all shadow-md hover:shadow-lg"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
