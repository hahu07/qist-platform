"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";

export default function BusinessSuccessPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary-50 via-white to-secondary-100/30 dark:from-neutral-950 dark:via-neutral-900 dark:to-secondary-950/20 flex items-center justify-center px-4 py-12">
      <div className="max-w-2xl w-full">
        {/* Success Card */}
        <div className="bg-white dark:bg-neutral-800 rounded-2xl shadow-xl border border-neutral-200 dark:border-neutral-700 p-8 md:p-12 text-center">
          {/* Success Icon */}
          <div className="w-20 h-20 bg-gradient-to-br from-secondary-500 to-secondary-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
            <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <h1 className="font-display font-bold text-3xl md:text-4xl text-neutral-900 dark:text-white mb-4">
            Application Submitted Successfully!
          </h1>
          
          <p className="text-lg text-neutral-600 dark:text-neutral-400 mb-8">
            Thank you for applying for Shariah-compliant financing
          </p>

          <div className="bg-secondary-50 dark:bg-secondary-950/20 border border-secondary-200 dark:border-secondary-800 rounded-xl p-6 mb-8">
            <p className="text-neutral-700 dark:text-neutral-300 mb-2">
              Your financing application has been received and is now under review by our team.
            </p>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              A confirmation email with your application reference number and next steps has been sent to <span className="font-semibold">your registered email</span>.
            </p>
          </div>

          {/* What Happens Next */}
          <div className="text-left mb-8">
            <h2 className="font-display font-bold text-xl text-neutral-900 dark:text-white mb-4 text-center">
              Application Review Process
            </h2>
            
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-secondary-100 dark:bg-secondary-900/30 rounded-full flex items-center justify-center">
                    <span className="font-bold text-secondary-700 dark:text-secondary-300">1</span>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-neutral-900 dark:text-white mb-1">
                    Document Upload (24 hours)
                  </h3>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    You'll receive a secure upload link via email to submit required documents: business registration, financial statements (2 years), business plan, and tax returns.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-secondary-100 dark:bg-secondary-900/30 rounded-full flex items-center justify-center">
                    <span className="font-bold text-secondary-700 dark:text-secondary-300">2</span>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-neutral-900 dark:text-white mb-1">
                    Initial Review (3-5 business days)
                  </h3>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    Our financing team will evaluate your application, financial health, and business viability. We may contact you for additional information.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-secondary-100 dark:bg-secondary-900/30 rounded-full flex items-center justify-center">
                    <span className="font-bold text-secondary-700 dark:text-secondary-300">3</span>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-neutral-900 dark:text-white mb-1">
                    Shariah Compliance Verification (2-3 days)
                  </h3>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    Our Shariah board will verify that your business activities and the proposed financing structure comply with Islamic principles.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-secondary-100 dark:bg-secondary-900/30 rounded-full flex items-center justify-center">
                    <span className="font-bold text-secondary-700 dark:text-secondary-300">4</span>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-neutral-900 dark:text-white mb-1">
                    Final Decision & Contract
                  </h3>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    If approved, you'll receive financing terms and a contract for review. Our team will schedule a meeting to discuss details and answer questions.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-secondary-100 dark:bg-secondary-900/30 rounded-full flex items-center justify-center">
                    <span className="font-bold text-secondary-700 dark:text-secondary-300">5</span>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-neutral-900 dark:text-white mb-1">
                    Funding Disbursement
                  </h3>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    Upon contract signing and final verification, funds will be disbursed directly to your business account (typically 2-3 business days).
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Estimated Timeline */}
          <div className="bg-primary-50 dark:bg-primary-950/20 border border-primary-200 dark:border-primary-800 rounded-lg p-4 mb-8">
            <div className="flex items-center justify-center gap-2 mb-2">
              <svg className="w-5 h-5 text-primary-600 dark:text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="font-semibold text-neutral-900 dark:text-white">
                Estimated Total Timeline
              </h3>
            </div>
            <p className="text-2xl font-bold text-secondary-700 dark:text-secondary-300">
              10-14 Business Days
            </p>
            <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1">
              From document submission to funding (if approved)
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/business/dashboard"
              className="px-8 py-3 border-2 border-neutral-300 dark:border-neutral-600 text-neutral-700 dark:text-neutral-300 font-semibold rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors text-center"
            >
              Go to Dashboard
            </Link>
            <Link
              href="/business/documents"
              className="px-8 py-3 bg-gradient-to-r from-secondary-600 to-secondary-700 hover:from-secondary-700 hover:to-secondary-800 text-white font-semibold rounded-lg transition-all shadow-lg hover:shadow-xl text-center"
            >
              Upload Documents
            </Link>
          </div>

          {/* Additional Info */}
          <div className="mt-8 pt-6 border-t border-neutral-200 dark:border-neutral-700">
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-2">
              Need to update your application or have questions?
            </p>
            <Link href="/contact" className="text-secondary-600 dark:text-secondary-400 hover:underline font-medium">
              Contact Our Financing Team →
            </Link>
          </div>
        </div>

        {/* Tips Card */}
        <div className="mt-6 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="text-sm text-yellow-800 dark:text-yellow-200">
              <p className="font-semibold mb-1">Pro Tips for Faster Processing</p>
              <ul className="list-disc list-inside space-y-1 text-yellow-700 dark:text-yellow-300">
                <li>Upload all required documents promptly when you receive the link</li>
                <li>Ensure financial statements are up-to-date and audited (if applicable)</li>
                <li>Respond quickly to any information requests from our team</li>
                <li>Keep your contact information updated for smooth communication</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
