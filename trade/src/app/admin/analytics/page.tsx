"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { authSubscribe, listDocs, type Doc } from "@junobuild/core";
import { generateApplicationAnalytics, getTrendingMetrics, searchApplications, generateInsights } from "@/utils/analytics-actions";
import type { ApplicationAnalytics, ApplicationData, AutomatedInsight, SearchFilters } from "@/schemas";
import Link from "next/link";

export default function AnalyticsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<ApplicationAnalytics | null>(null);
  const [applications, setApplications] = useState<Doc<ApplicationData>[]>([]);
  const [insights, setInsights] = useState<AutomatedInsight[]>([]);
  const [periodDays, setPeriodDays] = useState(30);
  const [activeView, setActiveView] = useState<"overview" | "trends" | "insights" | "search">("overview");

  // Search filters
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([]);
  const [minAmount, setMinAmount] = useState<string>("");
  const [maxAmount, setMaxAmount] = useState<string>("");

  useEffect(() => {
    const unsubscribe = authSubscribe((authUser) => {
      setUser(authUser);
      setLoading(false);

      if (!authUser) {
        router.push("/auth/signin");
      }
    });

    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user, periodDays]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load applications
      const { items } = await listDocs<ApplicationData>({
        collection: "business_applications",
      });
      setApplications(items);

      // Generate analytics
      const periodEnd = Date.now();
      const periodStart = periodEnd - periodDays * 24 * 60 * 60 * 1000;
      const analyticsData = await generateApplicationAnalytics(periodStart, periodEnd);
      setAnalytics(analyticsData);

      // Generate insights for recent applications
      const recentApps = items.slice(0, 5);
      const allInsights: AutomatedInsight[] = [];
      for (const app of recentApps) {
        const appInsights = await generateInsights(app.key, app.data);
        allInsights.push(...appInsights);
      }
      setInsights(allInsights.slice(0, 10)); // Show top 10 insights
    } catch (error) {
      console.error("Error loading analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    try {
      setLoading(true);
      const filters: SearchFilters = {
        searchTerm: searchTerm || undefined,
        statuses: selectedStatuses.length > 0 ? selectedStatuses as any : undefined,
        industries: selectedIndustries.length > 0 ? selectedIndustries : undefined,
        minAmount: minAmount ? parseFloat(minAmount) : undefined,
        maxAmount: maxAmount ? parseFloat(maxAmount) : undefined,
        sortBy: "created_at",
        sortOrder: "desc",
        page: 1,
        pageSize: 20,
      };

      const { items } = await searchApplications(filters);
      setApplications(items);
    } catch (error) {
      console.error("Error searching:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !analytics) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-neutral-600 dark:text-neutral-400">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const trendingData = getTrendingMetrics(applications, periodDays);

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      {/* Header */}
      <div className="bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">
                Analytics & Intelligence
              </h1>
              <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                Insights, trends, and intelligent recommendations
              </p>
            </div>
            <div className="flex items-center gap-3">
              <select
                value={periodDays}
                onChange={(e) => setPeriodDays(parseInt(e.target.value))}
                className="px-3 py-2 text-sm border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white"
              >
                <option value={7}>Last 7 days</option>
                <option value={30}>Last 30 days</option>
                <option value={90}>Last 90 days</option>
                <option value={365}>Last year</option>
              </select>
              <Link
                href="/admin/business-applications"
                className="px-4 py-2 text-sm font-semibold text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white transition-colors"
              >
                ← Back to Applications
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8" aria-label="Tabs">
            {[
              { id: "overview", label: "Overview", icon: "📊" },
              { id: "trends", label: "Trends", icon: "📈" },
              { id: "insights", label: "Insights", icon: "🤖" },
              { id: "search", label: "Advanced Search", icon: "🔍" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveView(tab.id as any)}
                className={`py-4 px-1 border-b-2 font-semibold text-sm transition-colors flex items-center gap-2 ${
                  activeView === tab.id
                    ? "border-primary-600 text-primary-600 dark:text-primary-400"
                    : "border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300 dark:text-neutral-400 dark:hover:text-neutral-300"
                }`}
              >
                <span>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeView === "overview" && analytics && (
          <div className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Total Applications</span>
                  <span className="text-2xl">📋</span>
                </div>
                <p className="text-3xl font-bold text-neutral-900 dark:text-white">{analytics.totalApplications}</p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                  {analytics.newApplications} new this period
                </p>
              </div>

              <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Approval Rate</span>
                  <span className="text-2xl">✅</span>
                </div>
                <p className="text-3xl font-bold text-success-600 dark:text-success-400">
                  {analytics.approvalRate.toFixed(1)}%
                </p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                  {analytics.approvedApplications} approved
                </p>
              </div>

              <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Total Funded</span>
                  <span className="text-2xl">💰</span>
                </div>
                <p className="text-3xl font-bold text-primary-600 dark:text-primary-400">
                  ₦{(analytics.totalApprovedAmount / 1000000).toFixed(1)}M
                </p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                  Avg ₦{(analytics.averageApprovedAmount / 1000).toFixed(0)}K
                </p>
              </div>

              <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Avg Review Time</span>
                  <span className="text-2xl">⏱️</span>
                </div>
                <p className="text-3xl font-bold text-neutral-900 dark:text-white">
                  {analytics.averageApprovalTime.toFixed(0)}h
                </p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                  Median: {analytics.medianApprovalTime}h
                </p>
              </div>
            </div>

            {/* Industry Breakdown */}
            <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-6">
              <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-4">Industry Breakdown</h3>
              <div className="space-y-3">
                {analytics.industryBreakdown.slice(0, 5).map((industry) => (
                  <div key={industry.industry} className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-neutral-900 dark:text-white capitalize">
                          {industry.industry.replace("_", " ")}
                        </span>
                        <span className="text-sm text-neutral-600 dark:text-neutral-400">
                          {industry.count} applications • {industry.approvalRate.toFixed(0)}% approved
                        </span>
                      </div>
                      <div className="w-full bg-neutral-200 dark:bg-neutral-700 rounded-full h-2">
                        <div
                          className="bg-primary-600 h-2 rounded-full"
                          style={{ width: `${industry.approvalRate}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Risk Distribution */}
            <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-6">
              <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-4">Risk Distribution</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-success-50 dark:bg-success-900/20 rounded-xl">
                  <p className="text-3xl font-bold text-success-600 dark:text-success-400">
                    {analytics.riskDistribution.low}
                  </p>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">Low Risk</p>
                </div>
                <div className="text-center p-4 bg-warning-50 dark:bg-warning-900/20 rounded-xl">
                  <p className="text-3xl font-bold text-warning-600 dark:text-warning-400">
                    {analytics.riskDistribution.medium}
                  </p>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">Medium Risk</p>
                </div>
                <div className="text-center p-4 bg-error-50 dark:bg-error-900/20 rounded-xl">
                  <p className="text-3xl font-bold text-error-600 dark:text-error-400">
                    {analytics.riskDistribution.high}
                  </p>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">High Risk</p>
                </div>
              </div>
            </div>

            {/* SLA Compliance */}
            <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-6">
              <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-4">SLA Compliance</h3>
              <div className="flex items-center gap-8">
                <div className="flex-1">
                  <p className="text-4xl font-bold text-neutral-900 dark:text-white">
                    {analytics.slaCompliance.complianceRate}%
                  </p>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">Overall Compliance Rate</p>
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-success-600 dark:text-success-400">On Time</span>
                    <span className="font-semibold">{analytics.slaCompliance.onTime}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-warning-600 dark:text-warning-400">Delayed</span>
                    <span className="font-semibold">{analytics.slaCompliance.delayed}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-error-600 dark:text-error-400">Breached</span>
                    <span className="font-semibold">{analytics.slaCompliance.breached}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeView === "trends" && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-6">
              <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-4">Applications Over Time</h3>
              <div className="h-64 flex items-end justify-between gap-2">
                {trendingData.map((data, idx) => {
                  const maxCount = Math.max(...trendingData.map((d) => d.count), 1);
                  const height = (data.count / maxCount) * 100;
                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center">
                      <div
                        className="w-full bg-primary-600 rounded-t-lg transition-all hover:bg-primary-700"
                        style={{ height: `${height}%` }}
                        title={`${data.date}: ${data.count} applications, ₦${(data.amount / 1000000).toFixed(1)}M`}
                      ></div>
                      {idx % Math.floor(trendingData.length / 7) === 0 && (
                        <span className="text-xs text-neutral-500 dark:text-neutral-400 mt-2">
                          {new Date(data.date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {activeView === "insights" && (
          <div className="space-y-4">
            <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-6">
              <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-4">Automated Insights</h3>
              {insights.length === 0 ? (
                <p className="text-neutral-500 dark:text-neutral-400 text-center py-8">
                  No insights generated yet
                </p>
              ) : (
                <div className="space-y-3">
                  {insights.map((insight) => (
                    <div
                      key={insight.insightId}
                      className={`p-4 rounded-lg border-l-4 ${
                        insight.severity === "critical"
                          ? "bg-error-50 dark:bg-error-900/20 border-error-600"
                          : insight.severity === "high"
                          ? "bg-warning-50 dark:bg-warning-900/20 border-warning-600"
                          : insight.severity === "medium"
                          ? "bg-amber-50 dark:bg-amber-900/20 border-amber-600"
                          : "bg-primary-50 dark:bg-primary-900/20 border-primary-600"
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">
                            {insight.type === "risk_alert"
                              ? "⚠️"
                              : insight.type === "opportunity"
                              ? "💡"
                              : insight.type === "recommendation"
                              ? "🎯"
                              : insight.type === "compliance"
                              ? "📋"
                              : "🔍"}
                          </span>
                          <h4 className="font-semibold text-neutral-900 dark:text-white">{insight.title}</h4>
                        </div>
                        <span className="text-xs px-2 py-1 bg-neutral-200 dark:bg-neutral-700 rounded-full">
                          {insight.confidence}% confidence
                        </span>
                      </div>
                      <p className="text-sm text-neutral-700 dark:text-neutral-300 mb-2">{insight.description}</p>
                      {insight.suggestedAction && (
                        <p className="text-sm text-primary-600 dark:text-primary-400 font-medium">
                          💡 {insight.suggestedAction}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeView === "search" && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-6">
              <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-4">Advanced Search & Filters</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by business name, industry, or registration..."
                  className="px-4 py-2.5 text-sm border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                />
                
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={minAmount}
                    onChange={(e) => setMinAmount(e.target.value)}
                    placeholder="Min amount"
                    className="flex-1 px-4 py-2.5 text-sm border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                  />
                  <input
                    type="number"
                    value={maxAmount}
                    onChange={(e) => setMaxAmount(e.target.value)}
                    placeholder="Max amount"
                    className="flex-1 px-4 py-2.5 text-sm border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              <button
                onClick={handleSearch}
                disabled={loading}
                className="w-full px-6 py-3 bg-primary-600 hover:bg-primary-700 disabled:bg-neutral-400 text-white font-semibold rounded-xl shadow-sm hover:shadow-md transition-all"
              >
                {loading ? "Searching..." : "Search Applications"}
              </button>
            </div>

            {/* Search Results */}
            <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-6">
              <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-4">
                Search Results ({applications.length})
              </h3>
              <div className="space-y-3">
                {applications.map((app) => (
                  <div
                    key={app.key}
                    className="p-4 border border-neutral-200 dark:border-neutral-700 rounded-lg hover:border-primary-500 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-neutral-900 dark:text-white">{app.data.businessName}</h4>
                        <p className="text-sm text-neutral-600 dark:text-neutral-400">
                          {app.data.industry} • ₦{(app.data.requestedAmount || 0).toLocaleString()}
                        </p>
                      </div>
                      <span
                        className={`px-3 py-1 text-xs font-semibold rounded-full ${
                          app.data.status === "approved"
                            ? "bg-success-100 dark:bg-success-900/30 text-success-700 dark:text-success-300"
                            : app.data.status === "rejected"
                            ? "bg-error-100 dark:bg-error-900/30 text-error-700 dark:text-error-300"
                            : "bg-warning-100 dark:bg-warning-900/30 text-warning-700 dark:text-warning-300"
                        }`}
                      >
                        {app.data.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
