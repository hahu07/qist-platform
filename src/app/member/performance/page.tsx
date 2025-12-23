"use client";

import { ThemeToggle } from "@/components/theme-toggle";
import { AuthButton } from "@/components/auth-button";
import { initSatellite, onAuthStateChange, getDoc } from "@junobuild/core";
import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import type { Investment } from "@/schemas";
import type { Doc } from "@junobuild/core";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

type User = {
  key: string;
} | null | undefined;

function PerformanceReportPageContent() {
  const [user, setUser] = useState<User>(undefined);
  const [investment, setInvestment] = useState<Doc<Investment> | null>(null);
  const [contractType, setContractType] = useState<string>("Musharakah");
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
    } catch (error) {
      console.error("Error fetching investment:", error);
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

  const handleExportPDF = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-neutral-50 to-white dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-neutral-600 dark:text-neutral-400">Loading performance report...</p>
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

  const totalValue = investment.data.amount + (investment.data.actualReturn || investment.data.expectedReturn || 0);
  const daysInvested = investment.created_at
    ? Math.floor((Date.now() - Number(investment.created_at) / 1000000) / (1000 * 60 * 60 * 24))
    : 0;

  const monthlyPerformance = [
    { month: "Jan", value: investment.data.amount * 1.00 },
    { month: "Feb", value: investment.data.amount * 1.02 },
    { month: "Mar", value: investment.data.amount * 1.05 },
    { month: "Apr", value: investment.data.amount * 1.07 },
    { month: "May", value: investment.data.amount * 1.10 },
    { month: "Jun", value: totalValue },
  ];

  const maxValue = Math.max(...monthlyPerformance.map(p => p.value));

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-neutral-50 to-white dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950">
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl border-b border-neutral-200 dark:border-neutral-800 print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href={`/member/details?id=${investmentId}`} className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span className="font-medium">Back to Investment</span>
            </Link>
            <div className="flex items-center gap-3">
              <button
                onClick={handleExportPDF}
                className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-semibold transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export PDF
              </button>
              <ThemeToggle />
              <AuthButton />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-gradient-to-br from-primary-600 to-primary-700 rounded-2xl p-8 text-white mb-6">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Performance Report</h1>
          <p className="text-primary-100 mb-4">Investment ID: {investmentId}</p>
          <p className="text-sm text-primary-200">Generated on {new Date().toLocaleDateString("en-NG", { year: "numeric", month: "long", day: "numeric" })}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white dark:bg-neutral-900 rounded-xl border-2 border-neutral-200 dark:border-neutral-800 p-6">
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-1">Initial Investment</p>
            <p className="text-2xl font-bold text-neutral-900 dark:text-white">
              {formatCurrency(investment.data.amount)}
            </p>
          </div>
          <div className="bg-white dark:bg-neutral-900 rounded-xl border-2 border-neutral-200 dark:border-neutral-800 p-6">
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-1">Current Value</p>
            <p className="text-2xl font-bold text-success-600 dark:text-success-400">
              {formatCurrency(totalValue)}
            </p>
          </div>
          <div className="bg-white dark:bg-neutral-900 rounded-xl border-2 border-neutral-200 dark:border-neutral-800 p-6">
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-1">Total Returns</p>
            <p className="text-2xl font-bold text-business-600 dark:text-business-400">
              {formatCurrency(investment.data.actualReturn || investment.data.expectedReturn || 0)}
            </p>
          </div>
          <div className="bg-white dark:bg-neutral-900 rounded-xl border-2 border-neutral-200 dark:border-neutral-800 p-6">
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-1">ROI</p>
            <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">
              {roi}%
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-900 rounded-2xl border-2 border-neutral-200 dark:border-neutral-800 p-6 mb-6">
          <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-6">Performance Over Time</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={monthlyPerformance}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-neutral-200 dark:stroke-neutral-800" />
                <XAxis 
                  dataKey="month" 
                  className="text-xs text-neutral-600 dark:text-neutral-400"
                />
                <YAxis 
                  className="text-xs text-neutral-600 dark:text-neutral-400"
                  tickFormatter={(value) => `₦${(value / 1000000).toFixed(1)}M`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    padding: '8px 12px'
                  }}
                  formatter={(value: number | undefined) => [value ? formatCurrency(value) : 'N/A', 'Value']}
                  labelStyle={{ color: '#374151', fontWeight: 600 }}
                />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#2563eb" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorValue)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border-2 border-neutral-200 dark:border-neutral-800 p-6">
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-4">Investment Summary</h2>
            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b border-neutral-200 dark:border-neutral-800">
                <span className="text-neutral-600 dark:text-neutral-400">Investment Date</span>
                <span className="font-semibold text-neutral-900 dark:text-white">
                  {formatDate(investment.created_at)}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-neutral-200 dark:border-neutral-800">
                <span className="text-neutral-600 dark:text-neutral-400">Days Invested</span>
                <span className="font-semibold text-neutral-900 dark:text-white">{daysInvested} days</span>
              </div>
              <div className="flex justify-between py-2 border-b border-neutral-200 dark:border-neutral-800">
                <span className="text-neutral-600 dark:text-neutral-400">Contract Type</span>
                <span className="font-semibold text-neutral-900 dark:text-white capitalize">
                  {contractType}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-neutral-200 dark:border-neutral-800">
                <span className="text-neutral-600 dark:text-neutral-400">Pool</span>
                <span className="font-semibold text-neutral-900 dark:text-white capitalize">
                  {investment.data.pool} Pool
                </span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-neutral-600 dark:text-neutral-400">Status</span>
                <span className={`font-semibold capitalize ${
                  investment.data.status === "active"
                    ? "text-success-600 dark:text-success-400"
                    : "text-neutral-900 dark:text-white"
                }`}>
                  {investment.data.status}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-neutral-900 rounded-2xl border-2 border-neutral-200 dark:border-neutral-800 p-6">
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-4">Performance Metrics</h2>
            <div className="space-y-3">
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
                <span className="text-neutral-600 dark:text-neutral-400">ROI</span>
                <span className="font-semibold text-business-600 dark:text-business-400">{roi}%</span>
              </div>
              <div className="flex justify-between py-2 border-b border-neutral-200 dark:border-neutral-800">
                <span className="text-neutral-600 dark:text-neutral-400">Average Daily Return</span>
                <span className="font-semibold text-neutral-900 dark:text-white">
                  {daysInvested > 0
                    ? formatCurrency((investment.data.actualReturn || investment.data.expectedReturn || 0) / daysInvested)
                    : formatCurrency(0)}
                </span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-neutral-600 dark:text-neutral-400">Total Value</span>
                <span className="font-semibold text-primary-600 dark:text-primary-400">
                  {formatCurrency(totalValue)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-white to-neutral-50 dark:from-neutral-900 dark:to-neutral-900/50 rounded-2xl border-2 border-neutral-200 dark:border-neutral-800 p-6">
          <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-4">Performance Analysis</h2>
          <div className="space-y-4">
            <div className={`p-4 rounded-xl border-2 ${
              parseFloat(roi) >= 15
                ? "bg-success-50 dark:bg-success-900/20 border-success-200 dark:border-success-800"
                : parseFloat(roi) >= 10
                ? "bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800"
                : "bg-warning-50 dark:bg-warning-900/20 border-warning-200 dark:border-warning-800"
            }`}>
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  parseFloat(roi) >= 15
                    ? "bg-success-100 dark:bg-success-900/30"
                    : parseFloat(roi) >= 10
                    ? "bg-primary-100 dark:bg-primary-900/30"
                    : "bg-warning-100 dark:bg-warning-900/30"
                }`}>
                  <svg className={`w-5 h-5 ${
                    parseFloat(roi) >= 15
                      ? "text-success-600 dark:text-success-400"
                      : parseFloat(roi) >= 10
                      ? "text-primary-600 dark:text-primary-400"
                      : "text-warning-600 dark:text-warning-400"
                  }`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className={`font-bold mb-1 ${
                    parseFloat(roi) >= 15
                      ? "text-success-900 dark:text-success-200"
                      : parseFloat(roi) >= 10
                      ? "text-primary-900 dark:text-primary-200"
                      : "text-warning-900 dark:text-warning-200"
                  }`}>
                    {parseFloat(roi) >= 15
                      ? "Excellent Performance"
                      : parseFloat(roi) >= 10
                      ? "Good Performance"
                      : "Moderate Performance"}
                  </h3>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    {parseFloat(roi) >= 15
                      ? "Your investment is performing exceptionally well, exceeding expected returns."
                      : parseFloat(roi) >= 10
                      ? "Your investment is on track and meeting expected performance targets."
                      : "Your investment is showing steady growth. Monitor performance closely."}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-primary-50 dark:bg-primary-900/20 border-2 border-primary-200 dark:border-primary-800 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-primary-600 dark:text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-primary-900 dark:text-primary-200 mb-1">Investment Note</h3>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    This report is based on {daysInvested} days of investment performance. Past performance does not guarantee future results. All investments are subject to Shariah compliance review.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function PerformanceReportPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-white via-neutral-50 to-white dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-neutral-600 dark:text-neutral-400">Loading performance report...</p>
        </div>
      </div>
    }>
      <PerformanceReportPageContent />
    </Suspense>
  );
}
