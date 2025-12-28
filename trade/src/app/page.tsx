"use client";

import { AuthButton } from "@/components/auth-button";
import { ThemeToggle } from "@/components/theme-toggle";
import { initSatellite } from "@junobuild/core";
import { useEffect } from "react";
import Link from "next/link";

export default function Home() {
  useEffect(() => {
    (async () =>
      await initSatellite({
        workers: {
          auth: true,
        },
      }))();
  }, []);

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-neutral-50 via-white to-primary-50/30 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md border-b border-neutral-200 dark:border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
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
            </div>

            {/* Navigation Links */}
            <div className="hidden md:flex items-center gap-8">
              <a
                href="#features"
                className="text-sm font-medium text-neutral-600 dark:text-neutral-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
              >
                Features
              </a>
              <a
                href="#how-it-works"
                className="text-sm font-medium text-neutral-600 dark:text-neutral-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
              >
                How It Works
              </a>
              <a
                href="/about"
                className="text-sm font-medium text-neutral-600 dark:text-neutral-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
              >
                About
              </a>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <Link 
                href="/auth/signup?redirect=/onboarding"
                className="hidden sm:block px-4 py-2 text-sm font-semibold text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
              >
                Sign Up
              </Link>
              <AuthButton />
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Hero Content */}
          <div className="text-center max-w-4xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-100 dark:bg-primary-900/30 rounded-full mb-6">
              <span className="w-2 h-2 bg-primary-600 dark:bg-primary-400 rounded-full animate-pulse" />
              <span className="text-sm font-medium text-primary-700 dark:text-primary-300">
                Blockchain-Powered • 100% Shariah-Compliant
              </span>
            </div>

            <h2 className="font-display font-bold text-4xl sm:text-5xl lg:text-6xl text-neutral-900 dark:text-white mb-6 leading-tight">
              Ethical Investment
              <br />
              <span className="bg-gradient-to-r from-primary-600 to-business-600 bg-clip-text text-transparent">
                Meets Blockchain Innovation
              </span>
            </h2>

            <p className="text-lg sm:text-xl text-neutral-600 dark:text-neutral-300 mb-8 max-w-2xl mx-auto leading-relaxed">
              Where ethical investment meets blockchain innovation. Participate in Shariah-compliant business financing or invest in vetted halal crypto assets opportunities—all built on blockchain technology for complete transparency and immutability.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/auth/signup?redirect=/onboarding" className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 text-center">
                Become a Member
              </Link>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-16 max-w-5xl mx-auto">
            <div className="bg-white dark:bg-neutral-900 rounded-xl p-6 border border-neutral-200 dark:border-neutral-800 text-center">
              <div className="font-mono font-bold text-2xl sm:text-3xl text-primary-600 dark:text-primary-400 mb-1">
                $13M+
              </div>
              <div className="text-sm text-neutral-600 dark:text-neutral-400">
                Total AUM
              </div>
            </div>
            <div className="bg-white dark:bg-neutral-900 rounded-xl p-6 border border-neutral-200 dark:border-neutral-800 text-center">
              <div className="font-mono font-bold text-2xl sm:text-3xl text-neutral-900 dark:text-white mb-1">
                1,247
              </div>
              <div className="text-sm text-neutral-600 dark:text-neutral-400">
                Active Investors
              </div>
            </div>
            <div className="bg-white dark:bg-neutral-900 rounded-xl p-6 border border-neutral-200 dark:border-neutral-800 text-center">
              <div className="font-mono font-bold text-2xl sm:text-3xl text-neutral-900 dark:text-white mb-1">
                89
              </div>
              <div className="text-sm text-neutral-600 dark:text-neutral-400">
                Businesses Funded
              </div>
            </div>
            <div className="bg-white dark:bg-neutral-900 rounded-xl p-6 border border-neutral-200 dark:border-neutral-800 text-center">
              <div className="font-mono font-bold text-2xl sm:text-3xl text-success-600 dark:text-success-400 mb-1">
                100%
              </div>
              <div className="text-sm text-neutral-600 dark:text-neutral-400">
                Shariah Compliant
              </div>
            </div>
          </div>

          {/* Features Section */}
          <div id="features" className="mb-20">
            <div className="text-center mb-12">
              <h3 className="font-display font-bold text-3xl sm:text-4xl text-neutral-900 dark:text-white mb-4">
                Two Pools, One Platform
              </h3>
        
            </div>

            <div className="grid lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
              {/* Business Pool Card */}
              <div className="group relative bg-gradient-to-br from-business-50 to-white dark:from-business-950/20 dark:to-neutral-900 rounded-2xl p-8 border-2 border-business-200 dark:border-business-800 hover:border-business-400 dark:hover:border-business-600 transition-all shadow-lg hover:shadow-xl">
                <div className="absolute top-4 right-4 flex flex-col items-end gap-2">
                  <span className="px-3 py-1 bg-warning-100 dark:bg-warning-900/30 text-warning-700 dark:text-warning-300 text-xs font-semibold rounded-full shadow-sm">
                    Members Only
                  </span>
                  <svg className="w-12 h-12 text-business-200 dark:text-business-800" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5zm0 18c-3.86-.77-7-4.63-7-9V8.3l7-3.11v14.81z"/>
                  </svg>
                </div>

                <div className="mb-6">
                  <span className="inline-block px-3 py-1 bg-business-100 dark:bg-business-900/50 text-business-700 dark:text-business-300 rounded-full text-sm font-medium mb-4">
                    Investment
                  </span>
                  <h4 className="font-display font-bold text-2xl sm:text-3xl text-neutral-900 dark:text-white mb-3">
                    Business Pool
                  </h4>
                  <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed mb-3">
                    Invest in vetted Shariah-compliant businesses through Mudarabah partnerships. Your capital finances ethical businesses while earning halal returns through profit-sharing. Businesses seeking financing can apply regardless of membership status.
                  </p>
                  <p className="text-xs text-warning-700 dark:text-warning-400 font-medium italic">
                    * Investment currently member-only. SEC crowdfunding license application pending to extend investor access to the general public. Business financing applications open to all.
                  </p>
                </div>

                <div className="space-y-4 mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-business-100 dark:bg-business-900/30 flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-business-600 dark:text-business-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-neutral-900 dark:text-white">Expected Returns</div>
                      <div className="text-sm text-neutral-600 dark:text-neutral-400">12-18% annual ROI</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-business-100 dark:bg-business-900/30 flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-business-600 dark:text-business-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-neutral-900 dark:text-white">Minimum Investment</div>
                      <div className="text-sm text-neutral-600 dark:text-neutral-400">$100 to start</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-business-100 dark:bg-business-900/30 flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-business-600 dark:text-business-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-neutral-900 dark:text-white">Contract Types</div>
                      <div className="text-sm text-neutral-600 dark:text-neutral-400">Musharakah, Murabaha, Ijarah</div>
                    </div>
                  </div>
                </div>

                <Link href="/business/financing/apply" className="block w-full px-6 py-3 bg-business-600 hover:bg-business-700 text-white font-semibold rounded-xl transition-all shadow-md hover:shadow-lg text-center">
                  Apply for Business Financing
                </Link>
              </div>

              {/* Crypto Pool Card */}
              <div className="group relative bg-gradient-to-br from-crypto-50 to-white dark:from-crypto-950/20 dark:to-neutral-900 rounded-2xl p-8 border-2 border-crypto-200 dark:border-crypto-800 hover:border-crypto-400 dark:hover:border-crypto-600 transition-all shadow-lg hover:shadow-xl">
                <div className="absolute top-4 right-4 flex flex-col items-end gap-2">
                  <span className="px-3 py-1 bg-warning-100 dark:bg-warning-900/30 text-warning-700 dark:text-warning-300 text-xs font-semibold rounded-full shadow-sm">
                    Members Only
                  </span>
                  <svg className="w-12 h-12 text-crypto-200 dark:text-crypto-800" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                  </svg>
                </div>

                <div className="mb-6">
                  <span className="inline-block px-3 py-1 bg-crypto-100 dark:bg-crypto-900/50 text-crypto-700 dark:text-crypto-300 rounded-full text-sm font-medium mb-4">
                    Crypto assets
                  </span>
                  <h4 className="font-display font-bold text-2xl sm:text-3xl text-neutral-900 dark:text-white mb-3">
                    Crypto Pool
                  </h4>
                  <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed mb-3">
                    Members invest in carefully vetted halal cryptocurrency opportunities. Our Shariah board ensures all crypto investments comply with Islamic principles - no interest-bearing tokens, no haram sectors, complete transparency through blockchain technology.
                  </p>
                  <p className="text-xs text-warning-700 dark:text-warning-400 font-medium italic">
                    * Currently member-only. SEC crowdfunding license application pending to extend access to the general public.
                  </p>
                </div>

                <div className="space-y-4 mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-crypto-100 dark:bg-crypto-900/30 flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-crypto-600 dark:text-crypto-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-neutral-900 dark:text-white">Shariah Compliance</div>
                      <div className="text-sm text-neutral-600 dark:text-neutral-400">100% halal crypto only</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-crypto-100 dark:bg-crypto-900/30 flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-crypto-600 dark:text-crypto-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-neutral-900 dark:text-white">Vetted Opportunities</div>
                      <div className="text-sm text-neutral-600 dark:text-neutral-400">Carefully screened projects</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-crypto-100 dark:bg-crypto-900/30 flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-crypto-600 dark:text-crypto-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-neutral-900 dark:text-white">Minimum Investment</div>
                      <div className="text-sm text-neutral-600 dark:text-neutral-400">$100 to start</div>
                    </div>
                  </div>
                </div>

                <Link href="/onboarding" className="block w-full px-6 py-3 bg-crypto-600 hover:bg-crypto-700 text-white font-semibold rounded-xl transition-all shadow-md hover:shadow-lg text-center">
                  Sign Up to Invest
                </Link>
              </div>
            </div>
          </div>

          {/* How It Works */}
          <div id="how-it-works" className="mb-20 max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h3 className="font-display font-bold text-3xl sm:text-4xl text-neutral-900 dark:text-white mb-4">
                How It Works
              </h3>
              <p className="text-lg text-neutral-600 dark:text-neutral-400">
                From your investment to business financing—powered by blockchain transparency
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {/* Step 1 */}
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900/30 dark:to-primary-800/30 rounded-2xl flex items-center justify-center mx-auto mb-4 border-2 border-primary-300 dark:border-primary-700">
                  <span className="text-2xl font-bold text-primary-700 dark:text-primary-400">1</span>
                </div>
                <h4 className="font-display font-bold text-xl text-neutral-900 dark:text-white mb-2">
                  Members Invest
                </h4>
                <p className="text-neutral-600 dark:text-neutral-400 text-sm">
                  Members contribute to Business Pool (for returns) or Crypto Pool (for halal crypto investing). All transactions recorded on blockchain.
                </p>
              </div>

              {/* Step 2 */}
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-secondary-100 to-secondary-200 dark:from-secondary-900/30 dark:to-secondary-800/30 rounded-2xl flex items-center justify-center mx-auto mb-4 border-2 border-secondary-300 dark:border-secondary-700">
                  <span className="text-2xl font-bold text-secondary-700 dark:text-secondary-400">2</span>
                </div>
                <h4 className="font-display font-bold text-xl text-neutral-900 dark:text-white mb-2">
                  Platform Finances Businesses
                </h4>
                <p className="text-neutral-600 dark:text-neutral-400 text-sm">
                  Pool capital finances vetted Shariah-compliant businesses through Mudarabah, Murabaha, or Ijarah contracts. All due diligence transparent on-chain.
                </p>
              </div>

              {/* Step 3 */}
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-business-100 to-business-200 dark:from-business-900/30 dark:to-business-800/30 rounded-2xl flex items-center justify-center mx-auto mb-4 border-2 border-business-300 dark:border-business-700">
                  <span className="text-2xl font-bold text-business-700 dark:text-business-400">3</span>
                </div>
                <h4 className="font-display font-bold text-xl text-neutral-900 dark:text-white mb-2">
                  Returns & Impact
                </h4>
                <p className="text-neutral-600 dark:text-neutral-400 text-sm">
                  Business Pool members receive halal business-sharing returns. Crypto Pool generates returns through vetted cryptocurrency opportunities. All distributions tracked on blockchain.
                </p>
              </div>
            </div>

            {/* Blockchain Benefits */}
            <div className="mt-12 bg-gradient-to-r from-secondary-50 to-primary-50 dark:from-secondary-950/30 dark:to-primary-950/30 rounded-2xl p-8 border border-secondary-200 dark:border-secondary-800">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-secondary-600 dark:bg-secondary-500 rounded-xl flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-display font-bold text-xl text-neutral-900 dark:text-white mb-2">
                    Built on Internet Computer Protocol (ICP)
                  </h4>
                  <p className="text-neutral-600 dark:text-neutral-400 mb-4">
                    AmanaTrade runs entirely on blockchain infrastructure, ensuring complete decentralization, transparency, and data ownership. Every contract, transaction, and investment is cryptographically secured and immutable.
                  </p>
                  <div className="grid sm:grid-cols-3 gap-4">
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-primary-600 dark:text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-sm text-neutral-700 dark:text-neutral-300">Tamper-proof records</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-primary-600 dark:text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-sm text-neutral-700 dark:text-neutral-300">No intermediaries</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-primary-600 dark:text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-sm text-neutral-700 dark:text-neutral-300">Full data ownership</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* CTA Section */}
          <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-3xl p-8 sm:p-12 text-center">
            <h3 className="font-display font-bold text-3xl sm:text-4xl text-white mb-4">
              Ready to Get Started?
            </h3>
            <p className="text-lg text-primary-100 mb-6 max-w-2xl mx-auto">
              Join 1,247 members making a difference through ethical Islamic finance
            </p>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-800/50 rounded-lg mb-6">
              <svg className="w-5 h-5 text-primary-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span className="text-sm font-medium text-primary-100">
                Member access only. SEC crowdfunding license pending for public investment opportunities.
              </span>
            </div>
            <Link href="/onboarding" className="inline-block px-8 py-4 bg-white text-primary-700 font-semibold rounded-xl hover:bg-primary-50 transition-all shadow-lg">
              Become a Member
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-primary-700 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-xl">A</span>
                </div>
                <span className="font-display font-bold text-xl text-neutral-900 dark:text-white">AmanaTrade</span>
              </div>
              <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4 max-w-md leading-relaxed">
                AmanaTrade is the digital platform and trading name of AmanaTrader Cooperative Society, a cooperative society duly registered with the Ministry of Commerce, dedicated to advancing Shariah-compliant community investment through Business and Crypto pools.
              </p>
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
                  <svg className="w-4 h-4 text-secondary-600 dark:text-secondary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <span>Built on Internet Computer Protocol (ICP) blockchain</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
                  <svg className="w-4 h-4 text-secondary-600 dark:text-secondary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <span>SEC crowdfunding license application in process</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
                  <svg className="w-4 h-4 text-secondary-600 dark:text-secondary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <span>Registered with Minitry of Commerce</span>
                </div>
              </div>
              <div className="text-xs text-neutral-500 dark:text-neutral-500">
                © 2025 AmanaTrade. All rights reserved.
              </div>
            </div>

            <div>
              <h5 className="font-semibold text-neutral-900 dark:text-white mb-4">Platform</h5>
              <ul className="space-y-2 text-sm text-neutral-600 dark:text-neutral-400">
                <li><Link href="/onboarding" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">Business Pool</Link></li>
                <li><Link href="/onboarding" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">Crypto Pool</Link></li>
                <li><Link href="/onboarding" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">For Businesses</Link></li>
                <li><a href="#" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">Documentation</a></li>
              </ul>
            </div>

            <div>
              <h5 className="font-semibold text-neutral-900 dark:text-white mb-4">Company</h5>
              <ul className="space-y-2 text-sm text-neutral-600 dark:text-neutral-400">
                <li><a href="#" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">Shariah Board</a></li>
                <li><a href="#" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">Terms of Service</a></li>
              </ul>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
