"use client";

import { ThemeToggle } from "@/components/theme-toggle";
import { AuthButton } from "@/components/auth-button";
import { initSatellite } from "@junobuild/core";
import { useEffect } from "react";
import Link from "next/link";

export default function AboutPage() {
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

            {/* Navigation Links */}
            <div className="hidden md:flex items-center gap-8">
              <Link
                href="/#features"
                className="text-sm font-medium text-neutral-600 dark:text-neutral-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
              >
                Features
              </Link>
              <Link
                href="/#how-it-works"
                className="text-sm font-medium text-neutral-600 dark:text-neutral-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
              >
                How It Works
              </Link>
              <Link
                href="/about"
                className="text-sm font-medium text-primary-600 dark:text-primary-400 transition-colors"
              >
                About
              </Link>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <AuthButton />
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-100 dark:bg-primary-900/30 rounded-full mb-6">
              <span className="text-sm font-medium text-primary-700 dark:text-primary-300">
                Our Story
              </span>
            </div>
            <h1 className="font-display font-bold text-4xl sm:text-5xl lg:text-6xl text-neutral-900 dark:text-white mb-6">
              About AmanaTrade
            </h1>
            <p className="text-xl text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto">
              Digital platform of AmanaTrader Cooperative Society - Empowering ethical investing through blockchain technology
            </p>
          </div>

          {/* Mission Statement */}
          <div className="bg-gradient-to-br from-primary-50 to-white dark:from-primary-950/20 dark:to-neutral-900 rounded-2xl p-8 sm:p-12 border-2 border-primary-200 dark:border-primary-800 mb-16">
            <h2 className="font-display font-bold text-2xl sm:text-3xl text-neutral-900 dark:text-white mb-6 text-center">
              Our Mission
            </h2>
            <p className="text-lg text-neutral-700 dark:text-neutral-300 leading-relaxed text-center max-w-3xl mx-auto">
              As the digital trading name of AmanaTrader Cooperative Society—a cooperative society duly registered —our mission is to democratize access to Shariah-compliant investing by leveraging blockchain technology. We are creating a transparent, ethical, and member-owned financial ecosystem that empowers both business investment and halal cryptocurrency opportunities.
            </p>
          </div>

          {/* The Problem */}
          <section className="mb-16">
            <h2 className="font-display font-bold text-3xl text-neutral-900 dark:text-white mb-6">
              The Challenge We're Solving
            </h2>
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="w-12 h-12 bg-error-100 dark:bg-error-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-error-600 dark:text-error-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-display font-semibold text-xl text-neutral-900 dark:text-white mb-2">
                    Limited Access to Shariah-Compliant Financing
                  </h3>
                  <p className="text-neutral-600 dark:text-neutral-400">
                    Muslim entrepreneurs and businesses struggle to find ethical, interest-free financing options that align with Islamic principles. Traditional Islamic banks are often inaccessible or bureaucratic.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-12 h-12 bg-error-100 dark:bg-error-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-error-600 dark:text-error-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-display font-semibold text-xl text-neutral-900 dark:text-white mb-2">
                    Lack of Transparency in Traditional Finance
                  </h3>
                  <p className="text-neutral-600 dark:text-neutral-400">
                    Conventional crowdfunding and investment platforms lack the transparency and immutability needed to build trust, especially for Shariah-compliant transactions.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Our Solution */}
          <section className="mb-16">
            <h2 className="font-display font-bold text-3xl text-neutral-900 dark:text-white mb-6">
              Our Solution
            </h2>
            <div className="bg-white dark:bg-neutral-900 rounded-2xl p-8 border border-neutral-200 dark:border-neutral-800">
            <p className="text-lg text-neutral-700 dark:text-neutral-300 leading-relaxed mb-6">
              AmanaTrade serves as the digital platform of AmanaTrader Cooperative Society. Built on blockchain technology, we combine two distinct investment pools in one transparent, decentralized platform. Our crowdfunding license application is currently in process with the Securities and Exchange Commission to extend investment opportunities to the general public:
            </p>              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div className="p-6 bg-business-50 dark:bg-business-950/20 rounded-xl border-2 border-business-200 dark:border-business-800">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-display font-bold text-xl text-neutral-900 dark:text-white">
                      💼 Business Pool
                    </h3>
                    <span className="px-2 py-1 bg-warning-100 dark:bg-warning-900/30 text-warning-700 dark:text-warning-300 text-xs font-medium rounded-full">
                      Members Only
                    </span>
                  </div>
                  <p className="text-neutral-600 dark:text-neutral-400 mb-2">
                    Members invest capital that the platform uses to finance vetted Shariah-compliant businesses through Mudarabah partnerships. Businesses receive funding via Musharakah (equity partnership), Murabaha (trade financing), or Ijarah (leasing) contracts. Investors earn halal profit-sharing returns as businesses succeed. Any business can apply for financing, regardless of membership status.
                  </p>
                  <p className="text-xs text-warning-700 dark:text-warning-400 font-medium">
                    ⚠️ Investment currently member-only. SEC crowdfunding license application pending for public investor access. Business financing applications open to all.
                  </p>
                </div>

                <div className="p-6 bg-crypto-50 dark:bg-crypto-950/20 rounded-xl border-2 border-crypto-200 dark:border-crypto-800">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-display font-bold text-xl text-neutral-900 dark:text-white">
                      🔹 Crypto Pool
                    </h3>
                    <span className="px-2 py-1 bg-warning-100 dark:bg-warning-900/30 text-warning-700 dark:text-warning-300 text-xs font-medium rounded-full">
                      Members Only
                    </span>
                  </div>
                  <p className="text-neutral-600 dark:text-neutral-400 mb-2">
                    Members invest in carefully vetted halal cryptocurrency opportunities. Our Shariah board ensures all crypto investments comply with Islamic principles - no interest-bearing tokens, no haram sectors, complete transparency through blockchain technology.
                  </p>
                  <p className="text-xs text-warning-700 dark:text-warning-400 font-medium">
                    ⚠️ Currently member-only. SEC crowdfunding license application pending for public access.
                  </p>
                </div>
              </div>

              <div className="bg-secondary-50 dark:bg-secondary-950/30 rounded-xl p-6 border border-secondary-200 dark:border-secondary-800">
                <h4 className="font-display font-semibold text-lg text-neutral-900 dark:text-white mb-3 flex items-center gap-2">
                  <svg className="w-6 h-6 text-secondary-600 dark:text-secondary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  Blockchain-Powered Transparency
                </h4>
                <p className="text-neutral-700 dark:text-neutral-300">
                  Every transaction, contract, and investment is recorded on the Internet Computer Protocol blockchain, ensuring complete immutability, transparency, and decentralized ownership. No intermediaries. No hidden fees. Total trust.
                </p>
              </div>
            </div>
          </section>

          {/* Core Values */}
          <section className="mb-16">
            <h2 className="font-display font-bold text-3xl text-neutral-900 dark:text-white mb-6">
              Our Core Values
            </h2>
            <div className="grid sm:grid-cols-2 gap-6">
              <div className="p-6 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800">
                <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-primary-600 dark:text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="font-display font-bold text-xl text-neutral-900 dark:text-white mb-2">
                  Shariah Compliance
                </h3>
                <p className="text-neutral-600 dark:text-neutral-400">
                  100% adherence to Islamic principles. Every transaction is vetted by our Shariah advisory board.
                </p>
              </div>

              <div className="p-6 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800">
                <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-primary-600 dark:text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </div>
                <h3 className="font-display font-bold text-xl text-neutral-900 dark:text-white mb-2">
                  Radical Transparency
                </h3>
                <p className="text-neutral-600 dark:text-neutral-400">
                  Blockchain technology ensures every transaction is visible, verifiable, and immutable.
                </p>
              </div>

              <div className="p-6 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800">
                <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-primary-600 dark:text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <h3 className="font-display font-bold text-xl text-neutral-900 dark:text-white mb-2">
                  Member Ownership
                </h3>
                <p className="text-neutral-600 dark:text-neutral-400">
                  As a cooperative society, members collectively own and govern the platform - ensuring decisions serve community interests.
                </p>
              </div>

              <div className="p-6 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800">
                <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-primary-600 dark:text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="font-display font-bold text-xl text-neutral-900 dark:text-white mb-2">
                  Global Accessibility
                </h3>
                <p className="text-neutral-600 dark:text-neutral-400">
                  Breaking barriers to Islamic finance for Muslims worldwide, regardless of geography or wealth.
                </p>
              </div>
            </div>
          </section>

          {/* Technology Stack */}
          <section className="mb-16">
            <h2 className="font-display font-bold text-3xl text-neutral-900 dark:text-white mb-6">
              Built on Cutting-Edge Technology
            </h2>
            <div className="bg-gradient-to-br from-secondary-50 to-primary-50 dark:from-secondary-950/30 dark:to-primary-950/30 rounded-2xl p-8 border-2 border-secondary-200 dark:border-secondary-800">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-16 h-16 bg-secondary-600 dark:bg-secondary-500 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-display font-bold text-2xl text-neutral-900 dark:text-white mb-3">
                    Internet Computer Protocol (ICP)
                  </h3>
                  <p className="text-neutral-700 dark:text-neutral-300 mb-4">
                    AmanaTrade runs entirely on the Internet Computer blockchain - a revolutionary platform that enables full-stack decentralized applications at web speed.
                  </p>
                </div>
              </div>

              <div className="grid sm:grid-cols-3 gap-4">
                <div className="p-4 bg-white dark:bg-neutral-900 rounded-lg">
                  <h4 className="font-semibold text-neutral-900 dark:text-white mb-2">⚡ Web Speed</h4>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">Instant transactions without gas fees</p>
                </div>
                <div className="p-4 bg-white dark:bg-neutral-900 rounded-lg">
                  <h4 className="font-semibold text-neutral-900 dark:text-white mb-2">🔒 Secure</h4>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">Cryptographic security and data ownership</p>
                </div>
                <div className="p-4 bg-white dark:bg-neutral-900 rounded-lg">
                  <h4 className="font-semibold text-neutral-900 dark:text-white mb-2">♾️ Scalable</h4>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">Unlimited growth capacity</p>
                </div>
              </div>
            </div>
          </section>

          {/* Team/Vision */}
          <section className="mb-16">
            <h2 className="font-display font-bold text-3xl text-neutral-900 dark:text-white mb-6 text-center">
              Our Vision for the Future
            </h2>
            <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl p-8 sm:p-12 text-white text-center">
              <p className="text-xl sm:text-2xl font-display font-semibold mb-6">
                "To become the global standard for Shariah-compliant investment and ethical finance"
              </p>
              <div className="grid sm:grid-cols-3 gap-6 mt-8">
                <div>
                  <div className="text-4xl font-bold mb-2">$200M+</div>
                  <div className="text-primary-100">Total AUM by Year 5</div>
                </div>
                <div>
                  <div className="text-4xl font-bold mb-2">500K+</div>
                  <div className="text-primary-100">Beneficiaries Impacted</div>
                </div>
                <div>
                  <div className="text-4xl font-bold mb-2">5 Countries</div>
                  <div className="text-primary-100">Global Presence</div>
                </div>
              </div>
            </div>
          </section>

          {/* CTA */}
          <div className="text-center">
            <h3 className="font-display font-bold text-2xl sm:text-3xl text-neutral-900 dark:text-white mb-4">
              Join Our Mission
            </h3>
            <p className="text-lg text-neutral-600 dark:text-neutral-400 mb-6">
              Be part of the future of ethical Islamic finance
            </p>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-warning-50 dark:bg-warning-900/20 border border-warning-200 dark:border-warning-700 rounded-lg mb-6">
              <svg className="w-4 h-4 text-warning-600 dark:text-warning-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm text-warning-700 dark:text-warning-300">
                Member-only access. SEC crowdfunding license application in process for public investment opportunities.
              </span>
            </div>
            <Link
              href="/"
              className="inline-block px-8 py-4 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-xl"
            >
              Become a Member
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center text-sm text-neutral-600 dark:text-neutral-400">
            <p>© 2025 AmanaTrade. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
