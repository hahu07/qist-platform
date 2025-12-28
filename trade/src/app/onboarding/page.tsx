"use client";

import { ThemeToggle } from "@/components/theme-toggle";
import { initSatellite, onAuthStateChange } from "@junobuild/core";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getAuthRedirectUrl } from "@/utils/auth-redirect";

export default function OnboardingPage() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    (async () => {
      await initSatellite({
        workers: {
          auth: true,
        },
      });

      // Check if user is authenticated and has completed onboarding
      const unsubscribe = onAuthStateChange(async (user) => {
        if (user) {
          const redirectUrl = await getAuthRedirectUrl(user);
          
          // If redirect is not to onboarding, user has already completed onboarding
          if (redirectUrl !== "/onboarding") {
            router.push(redirectUrl);
            return;
          }
        }
        setChecking(false);
      });

      return () => unsubscribe();
    })();
  }, [router]);

  const handleContinue = () => {
    if (selectedRole === "investor") {
      router.push("/member/onboarding");
    } else if (selectedRole === "business") {
      router.push("/business/onboarding/profile");
    }
  };

  // Show loading while checking auth status
  if (checking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-primary-50/30 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary-600 mx-auto mb-4"></div>
          <p className="text-neutral-600 dark:text-neutral-400">Checking your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-neutral-50 via-white to-primary-50/30 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md border-b border-neutral-200 dark:border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-primary-700 rounded-lg flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-xl">A</span>
              </div>
              <div>
                <h1 className="font-display font-bold text-xl text-neutral-900 dark:text-white">
                  AmanaTrade
                </h1>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 hidden sm:block">
                  Built on Trust, Powered by Blockchain
                </p>
              </div>
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="font-display font-bold text-4xl sm:text-5xl text-neutral-900 dark:text-white mb-4">
              Welcome to AmanaTrade
            </h1>
            <p className="text-xl text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto">
              Choose your path to begin your Islamic finance journey
            </p>
          </div>

          {/* Role Selection Cards */}
          <div className="grid md:grid-cols-2 gap-6 mb-12 max-w-4xl mx-auto">
            {/* Investor/Member Card */}
            <div
              onClick={() => setSelectedRole("investor")}
              className={`group cursor-pointer bg-gradient-to-br from-business-50 to-white dark:from-business-950/20 dark:to-neutral-900 rounded-2xl p-8 border-2 transition-all ${
                selectedRole === "investor"
                  ? "border-business-500 dark:border-business-500 shadow-xl scale-105"
                  : "border-business-200 dark:border-business-800 hover:border-business-400 dark:hover:border-business-600 shadow-lg hover:shadow-xl"
              }`}
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-business-100 dark:bg-business-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-business-600 dark:text-business-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="font-display font-bold text-2xl text-neutral-900 dark:text-white mb-3">
                  Investor/Member
                </h3>
                <p className="text-neutral-600 dark:text-neutral-400 mb-4 text-sm">
                  Earn halal returns by investing in vetted Shariah-compliant businesses through the Business Pool
                </p>
                <div className="space-y-2 text-sm text-neutral-600 dark:text-neutral-400">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-business-600 dark:text-business-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Browse investment opportunities</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-business-600 dark:text-business-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Track portfolio performance</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-business-600 dark:text-business-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Receive profit distributions</span>
                  </div>
                </div>
                {selectedRole === "investor" && (
                  <div className="mt-4 p-2 bg-business-100 dark:bg-business-900/30 rounded-lg">
                    <span className="text-xs font-medium text-business-700 dark:text-business-300">
                      ✓ Selected
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Business Card */}
            <div
              onClick={() => setSelectedRole("business")}
              className={`group cursor-pointer bg-gradient-to-br from-secondary-50 to-white dark:from-secondary-950/20 dark:to-neutral-900 rounded-2xl p-8 border-2 transition-all ${
                selectedRole === "business"
                  ? "border-secondary-500 dark:border-secondary-500 shadow-xl scale-105"
                  : "border-secondary-200 dark:border-secondary-800 hover:border-secondary-400 dark:hover:border-secondary-600 shadow-lg hover:shadow-xl"
              }`}
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-secondary-100 dark:bg-secondary-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-secondary-600 dark:text-secondary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <h3 className="font-display font-bold text-2xl text-neutral-900 dark:text-white mb-3">
                  Business
                </h3>
                <p className="text-neutral-600 dark:text-neutral-400 mb-4 text-sm">
                  Register your business profile to access Shariah-compliant financing opportunities
                </p>
                <div className="space-y-2 text-sm text-neutral-600 dark:text-neutral-400">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-secondary-600 dark:text-secondary-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Create business profile</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-secondary-600 dark:text-secondary-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Complete KYC verification</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-secondary-600 dark:text-secondary-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Access financing applications</span>
                  </div>
                </div>
                {selectedRole === "business" && (
                  <div className="mt-4 p-2 bg-secondary-100 dark:bg-secondary-900/30 rounded-lg">
                    <span className="text-xs font-medium text-secondary-700 dark:text-secondary-300">
                      ✓ Selected
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action Button */}
          {selectedRole && (
            <div className="text-center animate-fadeIn">
              <div className="mb-4 p-4 bg-primary-50 dark:bg-primary-950/20 border border-primary-200 dark:border-primary-800 rounded-xl max-w-2xl mx-auto">
                <p className="text-sm text-neutral-700 dark:text-neutral-300">
                  {selectedRole === "investor" && (
                    <>
                      <strong>Member Registration Required:</strong> Complete KYC verification to access investment opportunities (regulatory compliance).
                    </>
                  )}
                  {selectedRole === "waqf" && (
                    <>
                      <strong>Create Your Legacy:</strong> Set up your perpetual Waqf endowment and choose the causes you want to support forever.
                    </>
                  )}
                  {selectedRole === "business" && (
                    <>
                      <strong>Business Verification Required:</strong> Complete business registration and Shariah compliance documentation to apply for financing.
                    </>
                  )}
                </p>
              </div>
              <button 
                onClick={handleContinue}
                className="px-12 py-4 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-xl text-lg"
              >
                {selectedRole === "investor" && "Continue as Member"}
                {selectedRole === "waqf" && "Continue as Waqf Contributor"}
                {selectedRole === "business" && "Continue as Business"}
              </button>
              <p className="mt-4 text-sm text-neutral-500 dark:text-neutral-400">
                You'll be redirected to complete your profile and verification
              </p>
            </div>
          )}

          {/* Info Section */}
          <div className="mt-16 pt-12 border-t border-neutral-200 dark:border-neutral-800">
            <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <div className="text-center">
                <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-primary-600 dark:text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h4 className="font-semibold text-neutral-900 dark:text-white mb-2">Shariah Compliant</h4>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  All financing and investments verified by our Shariah board
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-primary-600 dark:text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h4 className="font-semibold text-neutral-900 dark:text-white mb-2">Blockchain Secured</h4>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  All data encrypted and stored on Internet Computer Protocol
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-primary-600 dark:text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h4 className="font-semibold text-neutral-900 dark:text-white mb-2">Fast & Transparent</h4>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  Real-time tracking of all transactions and impact metrics
                </p>
              </div>
            </div>
          </div>

          {/* Admin Access Link */}
          <div className="mt-8 text-center">
            <Link 
              href="/admin/dashboard" 
              className="inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-primary-600 dark:text-neutral-400 dark:hover:text-primary-400 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Platform Administrator Access
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
