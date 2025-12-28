"use client";

import { ThemeToggle } from "@/components/theme-toggle";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authSubscribe } from "@junobuild/core";
import { getOnboardingStatus } from "@/utils/auth-redirect";

export default function InvestorOnboardingPage() {
  const [selectedType, setSelectedType] = useState<"individual" | "corporate" | null>(null);
  const [checking, setChecking] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = authSubscribe(async (user) => {
      if (user) {
        const status = await getOnboardingStatus(user);
        
        // If user has completed onboarding, redirect to dashboard
        if (status.completed && (status.userType === "individual" || status.userType === "corporate")) {
          router.push(status.dashboardUrl);
          return;
        }
      }
      setChecking(false);
    });

    return () => unsubscribe();
  }, [router]);

  const handleTypeSelection = (type: "individual" | "corporate") => {
    setSelectedType(type);
    // Navigate to appropriate form
    router.push(`/member/onboarding/${type}`);
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-950 dark:to-neutral-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary-600 mx-auto mb-4"></div>
          <p className="text-neutral-600 dark:text-neutral-400">Checking your profile...</p>
        </div>
      </div>
    );
  }

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
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="font-display font-bold text-4xl md:text-5xl text-neutral-900 dark:text-white mb-4">
            Welcome to AmanaTrade
          </h1>
          <p className="text-lg text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto">
            Join the Shariah-compliant investment platform. Choose your investor type to begin the onboarding process.
          </p>
        </div>

        {/* Type Selection Cards */}
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          {/* Individual Investor */}
          <button
            onClick={() => handleTypeSelection("individual")}
            className="group relative bg-white dark:bg-neutral-900 rounded-2xl border-[3px] border-black dark:border-neutral-700 shadow-[8px_8px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_#7888FF] hover:shadow-[12px_12px_0px_rgba(0,0,0,1)] dark:hover:shadow-[12px_12px_0px_#7888FF] active:translate-x-[8px] active:translate-y-[8px] active:shadow-none transition-all p-8 text-left"
          >
            <div className="flex items-start justify-between mb-6">
              <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center">
                <svg className="w-8 h-8 text-primary-600 dark:text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                <svg className="w-6 h-6 text-primary-600 dark:text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </div>
            </div>
            
            <h3 className="font-display font-bold text-2xl text-neutral-900 dark:text-white mb-3">
              Individual Investor
            </h3>
            <p className="text-neutral-600 dark:text-neutral-400 mb-6">
              Perfect for personal investors looking to grow their wealth through Shariah-compliant investments.
            </p>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-neutral-700 dark:text-neutral-300">
                <svg className="w-5 h-5 text-success-600 dark:text-success-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Simplified KYC process</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-neutral-700 dark:text-neutral-300">
                <svg className="w-5 h-5 text-success-600 dark:text-success-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Flexible investment amounts</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-neutral-700 dark:text-neutral-300">
                <svg className="w-5 h-5 text-success-600 dark:text-success-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Access to Business & Crypto pools</span>
              </div>
            </div>
          </button>

          {/* Corporate Entity */}
          <button
            onClick={() => handleTypeSelection("corporate")}
            className="group relative bg-white dark:bg-neutral-900 rounded-2xl border-[3px] border-black dark:border-neutral-700 shadow-[8px_8px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_#7888FF] hover:shadow-[12px_12px_0px_rgba(0,0,0,1)] dark:hover:shadow-[12px_12px_0px_#7888FF] active:translate-x-[8px] active:translate-y-[8px] active:shadow-none transition-all p-8 text-left"
          >
            <div className="flex items-start justify-between mb-6">
              <div className="w-16 h-16 bg-secondary-100 dark:bg-secondary-900/30 rounded-xl flex items-center justify-center">
                <svg className="w-8 h-8 text-secondary-600 dark:text-secondary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                <svg className="w-6 h-6 text-secondary-600 dark:text-secondary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </div>
            </div>
            
            <h3 className="font-display font-bold text-2xl text-neutral-900 dark:text-white mb-3">
              Corporate Entity
            </h3>
            <p className="text-neutral-600 dark:text-neutral-400 mb-6">
              For companies, trusts, foundations, and institutional investors seeking halal investment opportunities.
            </p>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-neutral-700 dark:text-neutral-300">
                <svg className="w-5 h-5 text-success-600 dark:text-success-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Enhanced due diligence</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-neutral-700 dark:text-neutral-300">
                <svg className="w-5 h-5 text-success-600 dark:text-success-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Higher investment limits</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-neutral-700 dark:text-neutral-300">
                <svg className="w-5 h-5 text-success-600 dark:text-success-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Dedicated account manager</span>
              </div>
            </div>
          </button>
        </div>

        {/* Info Section */}
        <div className="bg-white dark:bg-neutral-900 rounded-xl border-2 border-neutral-200 dark:border-neutral-800 p-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-primary-600 dark:text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h4 className="font-bold text-neutral-900 dark:text-white mb-2">
                What you'll need
              </h4>
              <ul className="text-sm text-neutral-600 dark:text-neutral-400 space-y-1">
                <li>• Valid government-issued ID (passport or national ID)</li>
                <li>• Proof of address (utility bill or bank statement)</li>
                <li>• For corporate: Company registration documents and beneficial owner information</li>
                <li>• Approximately 10-15 minutes to complete</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Back Button */}
        <div className="mt-8 text-center">
          <Link
            href="/onboarding"
            className="inline-flex items-center gap-2 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>Back to onboarding</span>
          </Link>
        </div>
      </main>
    </div>
  );
}
