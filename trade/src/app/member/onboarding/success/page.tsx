"use client";

import { ThemeToggle } from "@/components/theme-toggle";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function OnboardingSuccessPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-950 dark:to-neutral-900">
      {/* Header */}
      <header className="border-b-2 border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary-600 dark:bg-primary-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">A</span>
              </div>
              <span className="font-display font-bold text-xl text-neutral-900 dark:text-white">
                AmanaTrade
              </span>
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          {/* Success Icon */}
          <div className="w-24 h-24 bg-success-100 dark:bg-success-900/30 rounded-full flex items-center justify-center mx-auto mb-8">
            <svg className="w-12 h-12 text-success-600 dark:text-success-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>

          {/* Success Message */}
          <h1 className="font-display font-bold text-4xl md:text-5xl text-neutral-900 dark:text-white mb-4">
            Application Submitted!
          </h1>
          <p className="text-lg text-neutral-600 dark:text-neutral-400 mb-4 max-w-2xl mx-auto">
            Thank you for completing your investor onboarding.
          </p>
          <div className="mb-12 p-4 bg-warning-50 dark:bg-warning-900/20 border-2 border-warning-500 dark:border-warning-600 rounded-xl max-w-2xl mx-auto">
            <p className="text-warning-900 dark:text-warning-100 font-semibold">
              📋 Next Step: Complete your KYC verification to unlock full investment access
            </p>
          </div>

          {/* What's Next Section */}
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border-2 border-neutral-200 dark:border-neutral-800 p-8 mb-8 text-left">
            <h2 className="font-bold text-2xl text-neutral-900 dark:text-white mb-6">
              What happens next?
            </h2>

            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-warning-100 dark:bg-warning-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="font-bold text-warning-600 dark:text-warning-400">1</span>
                </div>
                <div>
                  <h3 className="font-semibold text-neutral-900 dark:text-white mb-1">
                    Upload KYC Documents
                  </h3>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    Complete your identity verification by uploading required documents (ID, proof of address, selfie). This is required to access investment opportunities.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="font-bold text-primary-600 dark:text-primary-400">2</span>
                </div>
                <div>
                  <h3 className="font-semibold text-neutral-900 dark:text-white mb-1">
                    KYC Review Process
                  </h3>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    Our compliance team will verify your documents within 2-3 business days. You may receive requests for additional information if needed.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-success-100 dark:bg-success-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="font-bold text-success-600 dark:text-success-400">3</span>
                </div>
                <div>
                  <h3 className="font-semibold text-neutral-900 dark:text-white mb-1">
                    Start Investing
                  </h3>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    Once verified, you'll receive email notification and gain full access to browse and invest in Shariah-compliant opportunities.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Info */}
          <div className="bg-primary-50 dark:bg-primary-900/10 border-2 border-primary-200 dark:border-primary-800 rounded-xl p-6 mb-8">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-primary-600 dark:text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-neutral-900 dark:text-white mb-1">
                  Check Your Email
                </h3>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  We've sent a confirmation email with your application reference number. Please check your spam folder if you don't see it in your inbox.
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/member/kyc"
              className="w-full sm:w-auto px-8 py-4 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl transition-colors"
            >
              Complete KYC Verification →
            </Link>
            <Link
              href="/member/dashboard"
              className="w-full sm:w-auto px-8 py-4 border-2 border-neutral-300 dark:border-neutral-700 hover:border-neutral-400 dark:hover:border-neutral-600 text-neutral-700 dark:text-neutral-300 font-semibold rounded-xl transition-colors"
            >
              Skip for Now
            </Link>
          </div>

          {/* Contact Support */}
          <div className="mt-12 pt-8 border-t-2 border-neutral-200 dark:border-neutral-800">
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-2">
              Questions about your application?
            </p>
            <a
              href="mailto:support@amanatrade.com"
              className="text-primary-600 dark:text-primary-400 hover:underline font-semibold"
            >
              Contact Support →
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
