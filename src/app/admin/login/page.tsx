"use client";

import { ThemeToggle } from "@/components/theme-toggle";
import { initSatellite, signIn } from "@junobuild/core";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    (async () =>
      await initSatellite({
        workers: {
          auth: true,
        },
      }))();
  }, []);

  const handleAdminLogin = async () => {
    setIsLoading(true);
    try {
      await signIn({ internet_identity: {} });
      // After successful login, redirect to admin dashboard
      router.push("/admin/dashboard");
    } catch (error) {
      console.error("Admin login failed:", error);
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-neutral-900 via-neutral-950 to-primary-950">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary-600/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-secondary-600/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      {/* Navigation */}
      <nav className="relative z-10 border-b border-neutral-800/50 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-primary-700 rounded-lg flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-xl">A</span>
              </div>
              <div>
                <h1 className="font-display font-bold text-xl text-white">
                  AmanaTrade
                </h1>
                <p className="text-xs text-neutral-400 hidden sm:block">
                  Administrator Portal
                </p>
              </div>
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="relative z-10 flex items-center justify-center min-h-[calc(100vh-4rem)] px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md">
          {/* Login Card */}
          <div className="bg-white/5 dark:bg-white/5 backdrop-blur-xl rounded-2xl p-8 border border-neutral-700/50 shadow-2xl">
            {/* Icon */}
            <div className="w-20 h-20 bg-gradient-to-br from-primary-600 to-secondary-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl">
              <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>

            {/* Header */}
            <div className="text-center mb-8">
              <h2 className="font-display font-bold text-3xl text-white mb-2">
                Administrator Access
              </h2>
              <p className="text-neutral-400">
                Secure blockchain-based authentication
              </p>
            </div>

            {/* Login Button */}
            <button
              onClick={handleAdminLogin}
              disabled={isLoading}
              className="w-full px-6 py-4 bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-700 hover:to-secondary-700 disabled:from-neutral-600 disabled:to-neutral-700 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-3"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Authenticating...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  Sign In with Internet Identity
                </>
              )}
            </button>

            {/* Security Notice */}
            <div className="mt-6 p-4 bg-secondary-950/50 border border-secondary-800/50 rounded-xl">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-secondary-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="text-sm text-neutral-300 font-medium mb-1">
                    Administrator Only
                  </p>
                  <p className="text-xs text-neutral-400">
                    This portal is restricted to authorized platform administrators with verified blockchain identities. All access attempts are logged immutably on-chain.
                  </p>
                </div>
              </div>
            </div>

            {/* Capabilities */}
            <div className="mt-6 space-y-2">
              <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wide">
                Administrator Capabilities
              </p>
              <ul className="space-y-2">
                <li className="flex items-center gap-2 text-sm text-neutral-300">
                  <svg className="w-4 h-4 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Review and approve business financing applications
                </li>
                <li className="flex items-center gap-2 text-sm text-neutral-300">
                  <svg className="w-4 h-4 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Verify Shariah compliance documentation
                </li>
                <li className="flex items-center gap-2 text-sm text-neutral-300">
                  <svg className="w-4 h-4 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Manage investor allocation approvals
                </li>
                <li className="flex items-center gap-2 text-sm text-neutral-300">
                  <svg className="w-4 h-4 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Monitor platform performance and compliance
                </li>
                <li className="flex items-center gap-2 text-sm text-neutral-300">
                  <svg className="w-4 h-4 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Configure platform settings and parameters
                </li>
              </ul>
            </div>
          </div>

          {/* Back Link */}
          <div className="text-center mt-6">
            <Link
              href="/onboarding"
              className="inline-flex items-center gap-2 text-sm text-neutral-400 hover:text-white transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to User Onboarding
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
