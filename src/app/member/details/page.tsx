"use client";

import { ThemeToggle } from "@/components/theme-toggle";
import { AuthButton } from "@/components/auth-button";
import { initSatellite, onAuthStateChange, getDoc, listDocs, type Doc } from "@junobuild/core";
import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import type { Investment, Transaction } from "@/schemas";

type User = {
  key: string;
} | null | undefined;

function InvestmentDetailsPageContent() {
  const [user, setUser] = useState<User>(undefined);
  const [investment, setInvestment] = useState<Doc<Investment> | null>(null);
  const [contractType, setContractType] = useState<string>("Musharakah");
  const [transactions, setTransactions] = useState<Doc<Transaction>[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();
  const investmentId = searchParams.get('id');

  useEffect(() => {
    (async () => await initSatellite({ workers: { auth: true } }))();
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChange((authUser) => {
      setUser(authUser);
    });

    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    if (user && user !== null && investmentId) {
      fetchInvestmentData();
    }
  }, [user, investmentId]);

  const fetchInvestmentData = async () => {
    if (!user || user === null || !investmentId) return;

    try {
      setLoading(true);

      const investmentDoc = await getDoc<Investment>({
        collection: "investments",
        key: investmentId,
      });

      if (!investmentDoc) {
        router.push("/member/dashboard");
        return;
      }

      setInvestment(investmentDoc);

      // Fetch contract type from application
      try {
        const applicationDoc = await getDoc({
          collection: "applications",
          key: investmentDoc.data.applicationId,
        });

        if (applicationDoc) {
          const appData = applicationDoc.data as any;
          setContractType(appData.contractType || "Musharakah");
        }
      } catch (err) {
        console.error("Error fetching application details:", err);
      }

      const transactionsResult = await listDocs<Transaction>({
        collection: "transactions",
        filter: {},
      });

      if (transactionsResult && transactionsResult.items) {
        const investmentTransactions = transactionsResult.items.filter(
          (t) => t.data.reference === investmentId
        );
        investmentTransactions.sort((a, b) => Number(b.created_at) - Number(a.created_at));
        setTransactions(investmentTransactions);
      }
    } catch (error) {
      console.error("Error fetching investment data:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (timestamp: bigint | undefined): string => {
    if (!timestamp) return "N/A";
    const date = new Date(Number(timestamp) / 1000000);
    return date.toLocaleDateString("en-NG", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-neutral-50 to-white dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-neutral-600 dark:text-neutral-400">Loading investment details...</p>
        </div>
      </div>
    );
  }

  if (!investment) {
    return null;
  }

  const roi = investment.data.amount > 0
    ? (((investment.data.actualReturn || investment.data.expectedReturn || 0) / investment.data.amount) * 100).toFixed(2)
    : "0.00";

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-neutral-50 to-white dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950">
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl border-b border-neutral-200 dark:border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/member/dashboard" className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span className="font-medium">Back to Dashboard</span>
            </Link>
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <AuthButton />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-gradient-to-br from-white to-neutral-50 dark:from-neutral-900 dark:to-neutral-900/50 rounded-2xl border-2 border-neutral-200 dark:border-neutral-800 p-6 md:p-8 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-neutral-900 dark:text-white mb-2">
                Investment Details
              </h1>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                Investment ID: {investmentId}
              </p>
            </div>
            <div className="flex gap-2">
              <Link
                href={`/member/performance?id=${investmentId}`}
                className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-semibold transition-colors"
              >
                View Performance
              </Link>
              <span className={`px-3 py-2 rounded-lg text-sm font-semibold ${
                investment.data.status === "active"
                  ? "bg-success-100 dark:bg-success-900/30 text-success-700 dark:text-success-300"
                  : investment.data.status === "completed"
                  ? "bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300"
                  : "bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300"
              }`}>
                {investment.data.status.toUpperCase()}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-neutral-800 rounded-xl p-6 border border-neutral-200 dark:border-neutral-700">
              <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-1">Investment Amount</p>
              <p className="text-2xl font-bold text-neutral-900 dark:text-white">
                {formatCurrency(investment.data.amount)}
              </p>
            </div>
            <div className="bg-white dark:bg-neutral-800 rounded-xl p-6 border border-neutral-200 dark:border-neutral-700">
              <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-1">Expected Returns</p>
              <p className="text-2xl font-bold text-success-600 dark:text-success-400">
                {formatCurrency(investment.data.expectedReturn || 0)}
              </p>
            </div>
            <div className="bg-white dark:bg-neutral-800 rounded-xl p-6 border border-neutral-200 dark:border-neutral-700">
              <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-1">ROI</p>
              <p className="text-2xl font-bold text-business-600 dark:text-business-400">
                {roi}%
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border-2 border-neutral-200 dark:border-neutral-800 p-6">
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-4">Investment Information</h2>
            <div className="space-y-4">
              <div className="flex justify-between py-2 border-b border-neutral-200 dark:border-neutral-800">
                <span className="text-neutral-600 dark:text-neutral-400">Pool Type</span>
                <span className="font-semibold text-neutral-900 dark:text-white capitalize">
                  {investment.data.pool} Pool
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-neutral-200 dark:border-neutral-800">
                <span className="text-neutral-600 dark:text-neutral-400">Contract Type</span>
                <span className="font-semibold text-neutral-900 dark:text-white capitalize">
                  {contractType}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-neutral-200 dark:border-neutral-800">
                <span className="text-neutral-600 dark:text-neutral-400">Investment Date</span>
                <span className="font-semibold text-neutral-900 dark:text-white">
                  {formatDate(investment.created_at)}
                </span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-neutral-600 dark:text-neutral-400">Status</span>
                <span className="font-semibold text-neutral-900 dark:text-white capitalize">
                  {investment.data.status}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-neutral-900 rounded-2xl border-2 border-neutral-200 dark:border-neutral-800 p-6">
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-4">Returns Overview</h2>
            <div className="space-y-4">
              <div className="flex justify-between py-2 border-b border-neutral-200 dark:border-neutral-800">
                <span className="text-neutral-600 dark:text-neutral-400">Expected Return</span>
                <span className="font-semibold text-neutral-900 dark:text-white">
                  {formatCurrency(investment.data.expectedReturn || 0)}
                </span>
              </div>
              {investment.data.actualReturn !== undefined && investment.data.actualReturn > 0 && (
                <div className="flex justify-between py-2 border-b border-neutral-200 dark:border-neutral-800">
                  <span className="text-neutral-600 dark:text-neutral-400">Actual Return</span>
                  <span className="font-semibold text-success-600 dark:text-success-400">
                    {formatCurrency(investment.data.actualReturn)}
                  </span>
                </div>
              )}
              <div className="flex justify-between py-2 border-b border-neutral-200 dark:border-neutral-800">
                <span className="text-neutral-600 dark:text-neutral-400">Total Value</span>
                <span className="font-semibold text-neutral-900 dark:text-white">
                  {formatCurrency(investment.data.amount + (investment.data.actualReturn || investment.data.expectedReturn || 0))}
                </span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-neutral-600 dark:text-neutral-400">ROI</span>
                <span className="font-semibold text-business-600 dark:text-business-400">
                  {roi}%
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-900 rounded-2xl border-2 border-neutral-200 dark:border-neutral-800 p-6">
          <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-6">Transaction History</h2>
          
          {transactions.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-neutral-100 dark:bg-neutral-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-neutral-400 dark:text-neutral-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-neutral-600 dark:text-neutral-400">No transactions yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-neutral-200 dark:border-neutral-800">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-neutral-700 dark:text-neutral-300">Date</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-neutral-700 dark:text-neutral-300">Type</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-neutral-700 dark:text-neutral-300">Amount</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-neutral-700 dark:text-neutral-300">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((transaction) => (
                    <tr key={transaction.key} className="border-b border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                      <td className="py-3 px-4 text-sm text-neutral-900 dark:text-white">
                        {formatDate(transaction.created_at)}
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 text-xs font-medium rounded capitalize">
                          {transaction.data.type}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm font-semibold text-neutral-900 dark:text-white">
                        {formatCurrency(transaction.data.amount)}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded capitalize ${
                          transaction.data.status === "completed"
                            ? "bg-success-100 dark:bg-success-900/30 text-success-700 dark:text-success-300"
                            : transaction.data.status === "pending"
                            ? "bg-warning-100 dark:bg-warning-900/30 text-warning-700 dark:text-warning-300"
                            : "bg-error-100 dark:bg-error-900/30 text-error-700 dark:text-error-300"
                        }`}>
                          {transaction.data.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default function InvestmentDetailsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-white via-neutral-50 to-white dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-neutral-600 dark:text-neutral-400">Loading investment details...</p>
        </div>
      </div>
    }>
      <InvestmentDetailsPageContent />
    </Suspense>
  );
}
