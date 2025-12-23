"use client";

import { ThemeToggle } from "@/components/theme-toggle";
import { AuthButton } from "@/components/auth-button";
import { initSatellite, onAuthStateChange, setDoc, listDocs, uploadFile, type Doc } from "@junobuild/core";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { revenueReportSchema, calculateFinancialMetrics, type RevenueReport, type FinancialMetrics, type ApplicationData } from "@/schemas";
import { validateData } from "@/utils/validation";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";

type User = {
  key: string;
} | null | undefined;

export default function BusinessReportingPage() {
  const [user, setUser] = useState<User>(undefined);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [applicationId, setApplicationId] = useState<string | null>(null);
  const [businessName, setBusinessName] = useState<string>("");
  const [reports, setReports] = useState<Doc<RevenueReport>[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [documentsVerified, setDocumentsVerified] = useState<boolean>(false);
  const router = useRouter();

  // Form state
  const [formData, setFormData] = useState<Partial<RevenueReport>>({
    reportingPeriod: "monthly",
    periodStart: "",
    periodEnd: "",
    totalRevenue: 0,
    totalExpenses: 0,
    netProfit: 0,
    grossProfit: 0,
    operatingExpenses: 0,
    documents: [],
    status: "draft",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    (async () => await initSatellite({ workers: { auth: true } }))();
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChange((authUser) => {
      setUser(authUser);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (user && user !== null) {
      fetchBusinessData();
    }
  }, [user]);

  const fetchBusinessData = async () => {
    if (!user || user === null) return;

    try {
      setLoading(true);

      // Fetch business application
      const applicationResult = await listDocs<ApplicationData>({
        collection: "business_applications",
      });

      // Try multiple matching strategies
      let userApplication = applicationResult.items.find(
        (app) => app.key === user.key
      );

      // Fallback: check if owner matches user key
      if (!userApplication) {
        userApplication = applicationResult.items.find(
          (app) => app.owner === user.key
        );
      }

      if (userApplication) {
        setApplicationId(userApplication.key);
        setBusinessName(userApplication.data.businessName);
        setDocumentsVerified(userApplication.data.documentsVerified || false);

        // Fetch revenue reports
        const reportsResult = await listDocs<RevenueReport>({
          collection: "revenue_reports",
        });

        const businessReports = reportsResult.items
          .filter((report) => report.data.applicationId === userApplication.key)
          .sort((a, b) => {
            const dateA = new Date(a.data.periodEnd).getTime();
            const dateB = new Date(b.data.periodEnd).getTime();
            return dateB - dateA;
          });

        setReports(businessReports);
      } else {
        router.push("/business/onboarding/profile");
      }
    } catch (error) {
      console.error("Error fetching business data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof RevenueReport, value: any) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };
      
      // Auto-calculate net profit
      if (field === "totalRevenue" || field === "totalExpenses") {
        const revenue = field === "totalRevenue" ? value : prev.totalRevenue || 0;
        const expenses = field === "totalExpenses" ? value : prev.totalExpenses || 0;
        updated.netProfit = revenue - expenses;
      }
      
      return updated;
    });

    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingDoc(true);

      const result = await uploadFile({
        collection: "financial_documents",
        data: file,
      });

      const newDoc = {
        name: file.name,
        url: result.downloadUrl,
        type: "financial_statement" as const,
        uploadDate: new Date().toISOString(),
      };

      setFormData((prev) => ({
        ...prev,
        documents: [...(prev.documents || []), newDoc],
      }));
    } catch (error) {
      console.error("Error uploading file:", error);
      alert("Failed to upload file");
    } finally {
      setUploadingDoc(false);
    }
  };

  const handleSubmit = async () => {
    if (!applicationId) return;

    const dataToValidate = {
      ...formData,
      applicationId,
      businessName,
      status: "submitted",
      submittedAt: new Date().toISOString(),
    };

    const validation = validateData(revenueReportSchema, dataToValidate);
    if (!validation.success) {
      setErrors(validation.errors);
      return;
    }

    setSaving(true);
    try {
      await setDoc({
        collection: "revenue_reports",
        doc: {
          key: `report_${Date.now()}`,
          data: validation.data as RevenueReport,
        },
      });

      alert("Revenue report submitted successfully!");
      setShowForm(false);
      setFormData({
        reportingPeriod: "monthly",
        periodStart: "",
        periodEnd: "",
        totalRevenue: 0,
        totalExpenses: 0,
        netProfit: 0,
        grossProfit: 0,
        operatingExpenses: 0,
        documents: [],
        status: "draft",
      });
      fetchBusinessData();
    } catch (error) {
      console.error("Error submitting report:", error);
      alert("Failed to submit report");
    } finally {
      setSaving(false);
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

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-NG", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-success-100 dark:bg-success-900/30 text-success-700 dark:text-success-300";
      case "submitted":
      case "under_review":
        return "bg-warning-100 dark:bg-warning-900/30 text-warning-700 dark:text-warning-300";
      case "rejected":
        return "bg-error-100 dark:bg-error-900/30 text-error-700 dark:text-error-300";
      default:
        return "bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300";
    }
  };

  const getChartData = () => {
    return reports.slice(0, 6).reverse().map(report => ({
      period: report.data.periodEnd.slice(0, 7), // YYYY-MM
      revenue: report.data.totalRevenue,
      profit: report.data.netProfit,
      expenses: report.data.totalExpenses,
    }));
  };

  const calculateAggregates = () => {
    if (reports.length === 0) return { totalRevenue: 0, totalProfit: 0, avgMargin: 0 };
    
    const totalRevenue = reports.reduce((sum, r) => sum + r.data.totalRevenue, 0);
    const totalProfit = reports.reduce((sum, r) => sum + r.data.netProfit, 0);
    const avgMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;
    
    return { totalRevenue, totalProfit, avgMargin };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-primary-50/30 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-neutral-600 dark:text-neutral-400">Loading revenue reports...</p>
        </div>
      </div>
    );
  }

  const chartData = getChartData();
  const aggregates = calculateAggregates();

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl border-b border-neutral-200 dark:border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Link href="/business/dashboard" className="flex items-center gap-2">
                <div className="w-8 h-8 bg-primary-600 dark:bg-primary-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">A</span>
                </div>
                <span className="text-lg font-bold text-neutral-900 dark:text-white hidden sm:inline">AmanaTrade</span>
              </Link>
              <span className="text-neutral-400">|</span>
              <span className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Revenue Reporting</span>
            </div>
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <AuthButton />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          <Link
            href="/business/dashboard"
            className="px-4 py-2 bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 font-semibold rounded-lg border-2 border-neutral-200 dark:border-neutral-800 whitespace-nowrap transition-all"
          >
            Dashboard
          </Link>
          <Link
            href="/business/reporting"
            className="px-4 py-2 bg-primary-600 text-white font-semibold rounded-lg whitespace-nowrap"
          >
            Revenue Reports
          </Link>
          <Link
            href="/business/documents"
            className="px-4 py-2 bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 font-semibold rounded-lg border-2 border-neutral-200 dark:border-neutral-800 whitespace-nowrap transition-all"
          >
            Documents
          </Link>
        </div>

        {/* Page Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-neutral-900 dark:text-white mb-2">Revenue Reporting</h1>
            <p className="text-neutral-600 dark:text-neutral-400">{businessName}</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            disabled={!documentsVerified}
            className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl border-2 border-primary-700 shadow-lg transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {showForm ? "Cancel" : "+ New Report"}
          </button>
        </div>

        {/* Document Verification Blocking Banner */}
        {!documentsVerified && (
          <div className="bg-error-50 dark:bg-error-900/20 border-2 border-error-200 dark:border-error-800 rounded-xl p-6 mb-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-error-100 dark:bg-error-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-error-600 dark:text-error-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-error-900 dark:text-error-200 mb-2">Revenue Reporting Unavailable</h3>
                <p className="text-error-700 dark:text-error-300 mb-4">
                  You must complete document verification before you can submit revenue reports. Please upload and verify all required documents first.
                </p>
                <Link
                  href="/business/documents"
                  className="inline-flex items-center px-4 py-2 bg-error-600 hover:bg-error-700 text-white font-semibold rounded-lg transition-all"
                >
                  Complete Document Verification →
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white dark:bg-neutral-900 rounded-xl border-2 border-neutral-200 dark:border-neutral-800 p-6">
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-1">Total Revenue</p>
            <p className="text-2xl font-bold text-neutral-900 dark:text-white">
              {formatCurrency(aggregates.totalRevenue)}
            </p>
            <p className="text-xs text-neutral-500 mt-1">{reports.length} reports</p>
          </div>
          <div className="bg-white dark:bg-neutral-900 rounded-xl border-2 border-neutral-200 dark:border-neutral-800 p-6">
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-1">Total Profit</p>
            <p className={`text-2xl font-bold ${aggregates.totalProfit >= 0 ? 'text-success-600' : 'text-error-600'}`}>
              {formatCurrency(aggregates.totalProfit)}
            </p>
            <p className="text-xs text-neutral-500 mt-1">Net profit</p>
          </div>
          <div className="bg-white dark:bg-neutral-900 rounded-xl border-2 border-neutral-200 dark:border-neutral-800 p-6">
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-1">Avg Profit Margin</p>
            <p className="text-2xl font-bold text-business-600 dark:text-business-400">
              {aggregates.avgMargin.toFixed(1)}%
            </p>
            <p className="text-xs text-neutral-500 mt-1">All periods</p>
          </div>
        </div>

        {/* Performance Chart */}
        {chartData.length > 0 && (
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border-2 border-neutral-200 dark:border-neutral-800 p-6 mb-6">
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-4">Revenue & Profit Trend</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
                <XAxis dataKey="period" stroke="#6B7280" style={{ fontSize: '12px' }} />
                <YAxis stroke="#6B7280" style={{ fontSize: '12px' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1F2937',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#F9FAFB'
                  }}
                  formatter={(value: number | undefined) => value ? formatCurrency(value) : 'N/A'}
                />
                <Line type="monotone" dataKey="revenue" stroke="#3B82F6" strokeWidth={2} name="Revenue" />
                <Line type="monotone" dataKey="profit" stroke="#10B981" strokeWidth={2} name="Profit" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* New Report Form */}
        {showForm && (
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border-2 border-neutral-200 dark:border-neutral-800 p-6 mb-6">
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-6">Submit Revenue Report</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Reporting Period */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Reporting Period
                </label>
                <select
                  value={formData.reportingPeriod}
                  onChange={(e) => handleInputChange("reportingPeriod", e.target.value)}
                  className="w-full px-4 py-2 border-2 border-neutral-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="annually">Annually</option>
                </select>
              </div>

              {/* Period Start */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Period Start *
                </label>
                <input
                  type="date"
                  value={formData.periodStart}
                  onChange={(e) => handleInputChange("periodStart", e.target.value)}
                  className="w-full px-4 py-2 border-2 border-neutral-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                {errors.periodStart && <p className="text-error-600 text-sm mt-1">{errors.periodStart}</p>}
              </div>

              {/* Period End */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Period End *
                </label>
                <input
                  type="date"
                  value={formData.periodEnd}
                  onChange={(e) => handleInputChange("periodEnd", e.target.value)}
                  className="w-full px-4 py-2 border-2 border-neutral-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                {errors.periodEnd && <p className="text-error-600 text-sm mt-1">{errors.periodEnd}</p>}
              </div>

              {/* Total Revenue */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Total Revenue (₦) *
                </label>
                <input
                  type="number"
                  value={formData.totalRevenue}
                  onChange={(e) => handleInputChange("totalRevenue", parseFloat(e.target.value) || 0)}
                  className="w-full px-4 py-2 border-2 border-neutral-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                {errors.totalRevenue && <p className="text-error-600 text-sm mt-1">{errors.totalRevenue}</p>}
              </div>

              {/* Total Expenses */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Total Expenses (₦) *
                </label>
                <input
                  type="number"
                  value={formData.totalExpenses}
                  onChange={(e) => handleInputChange("totalExpenses", parseFloat(e.target.value) || 0)}
                  className="w-full px-4 py-2 border-2 border-neutral-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                {errors.totalExpenses && <p className="text-error-600 text-sm mt-1">{errors.totalExpenses}</p>}
              </div>

              {/* Gross Profit */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Gross Profit (₦) *
                </label>
                <input
                  type="number"
                  value={formData.grossProfit}
                  onChange={(e) => handleInputChange("grossProfit", parseFloat(e.target.value) || 0)}
                  className="w-full px-4 py-2 border-2 border-neutral-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              {/* Operating Expenses */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Operating Expenses (₦) *
                </label>
                <input
                  type="number"
                  value={formData.operatingExpenses}
                  onChange={(e) => handleInputChange("operatingExpenses", parseFloat(e.target.value) || 0)}
                  className="w-full px-4 py-2 border-2 border-neutral-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              {/* Net Profit (Auto-calculated) */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Net Profit (Auto-calculated)
                </label>
                <div className="px-4 py-3 bg-neutral-100 dark:bg-neutral-800 border-2 border-neutral-300 dark:border-neutral-700 rounded-lg">
                  <span className={`text-lg font-bold ${formData.netProfit && formData.netProfit >= 0 ? 'text-success-600' : 'text-error-600'}`}>
                    {formatCurrency(formData.netProfit || 0)}
                  </span>
                </div>
              </div>

              {/* Notes */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Notes & Explanations
                </label>
                <textarea
                  value={formData.notes || ""}
                  onChange={(e) => handleInputChange("notes", e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 border-2 border-neutral-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Add any context or explanations..."
                />
              </div>

              {/* Document Upload */}
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-3">
                  Required Supporting Documents *
                </label>
                
                {/* Document Requirements Checklist */}
                <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <p className="text-sm font-semibold text-blue-900 dark:text-blue-200 mb-2">
                    {formData.reportingPeriod === "monthly" ? "Monthly" : "Quarterly"} Report Requirements:
                  </p>
                  <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-300">
                    {formData.reportingPeriod === "monthly" ? (
                      <>
                        <li className="flex items-start gap-2">
                          <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          <span>Monthly Financial Statement (P&L)</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          <span>Bank Statement (for this month)</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          <span>Revenue Breakdown Report</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          <span>Expense Report (categorized)</span>
                        </li>
                      </>
                    ) : (
                      <>
                        <li className="flex items-start gap-2">
                          <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          <span>Quarterly Financial Statement (3 months P&L)</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          <span>Balance Sheet (end of quarter)</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          <span>Cash Flow Statement</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          <span>Bank Statements (all 3 months)</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          <span>Revenue & Expense Analysis</span>
                        </li>
                      </>
                    )}
                  </ul>
                  <p className="text-xs text-blue-700 dark:text-blue-400 mt-3 italic">
                    💡 Tip: Combine all documents into a single PDF or upload multiple files
                  </p>
                </div>

                {/* File Upload */}
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <input
                      type="file"
                      id="report-file-upload"
                      onChange={handleFileUpload}
                      disabled={uploadingDoc}
                      accept=".pdf,.xlsx,.xls,.doc,.docx"
                      multiple
                      className="hidden"
                    />
                    <label
                      htmlFor="report-file-upload"
                      className={`flex-1 px-4 py-3 border-2 border-dashed rounded-lg text-center cursor-pointer transition-all ${
                        uploadingDoc
                          ? "border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 cursor-not-allowed"
                          : "border-primary-300 dark:border-primary-700 bg-primary-50 dark:bg-primary-900/20 hover:bg-primary-100 dark:hover:bg-primary-900/30"
                      }`}
                    >
                      <div className="flex items-center justify-center gap-2">
                        {uploadingDoc ? (
                          <>
                            <svg className="animate-spin w-5 h-5 text-neutral-600 dark:text-neutral-400" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Uploading...</span>
                          </>
                        ) : (
                          <>
                            <svg className="w-5 h-5 text-primary-600 dark:text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                            <span className="text-sm font-semibold text-primary-700 dark:text-primary-300">
                              Click to upload or drag and drop
                            </span>
                          </>
                        )}
                      </div>
                      <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1">
                        PDF, Excel, Word (Max 10MB each)
                      </p>
                    </label>
                  </div>

                  {/* Uploaded Documents List */}
                  {formData.documents && formData.documents.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                        Uploaded Documents ({formData.documents.length})
                      </p>
                      {formData.documents.map((doc, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-3 bg-success-50 dark:bg-success-900/20 rounded-lg border border-success-200 dark:border-success-800"
                        >
                          <div className="flex items-center gap-2">
                            <svg className="w-5 h-5 text-success-600 dark:text-success-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            <div>
                              <p className="text-sm font-medium text-success-900 dark:text-success-200">{doc.name}</p>
                              <p className="text-xs text-success-700 dark:text-success-400">
                                Uploaded {new Date(doc.uploadDate).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <a
                            href={doc.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs px-3 py-1 bg-success-600 hover:bg-success-700 text-white rounded-lg transition-colors"
                          >
                            View
                          </a>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Warning if no documents */}
                  {(!formData.documents || formData.documents.length === 0) && (
                    <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                      <div className="flex items-start gap-2">
                        <svg className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        <p className="text-sm text-amber-800 dark:text-amber-300">
                          <strong>Required:</strong> You must upload all supporting documents before submitting the report.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleSubmit}
                disabled={saving || !formData.documents || formData.documents.length === 0}
                className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl border-2 border-primary-700 shadow-lg transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? "Submitting..." : "Submit Report"}
              </button>
              <button
                onClick={() => setShowForm(false)}
                className="px-6 py-3 bg-neutral-200 hover:bg-neutral-300 dark:bg-neutral-700 dark:hover:bg-neutral-600 text-neutral-900 dark:text-white font-semibold rounded-xl border-2 border-neutral-300 dark:border-neutral-600 transition-all"
              >
                Cancel
              </button>
            </div>
            {(!formData.documents || formData.documents.length === 0) && (
              <p className="text-sm text-error-600 dark:text-error-400 mt-2 flex items-center gap-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                Please upload required documents to enable submission
              </p>
            )}
          </div>
        )}

        {/* Reports List */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border-2 border-neutral-200 dark:border-neutral-800 p-6">
          <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-4">Report History</h2>
          {reports.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-neutral-100 dark:bg-neutral-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-neutral-600 dark:text-neutral-400">No reports yet</p>
              <p className="text-sm text-neutral-500 mt-1">Submit your first revenue report to get started</p>
            </div>
          ) : (
            <div className="space-y-4">
              {reports.map((report) => {
                const margin = report.data.totalRevenue > 0 
                  ? ((report.data.netProfit / report.data.totalRevenue) * 100).toFixed(1)
                  : "0";
                
                return (
                  <div
                    key={report.key}
                    className="p-4 bg-neutral-50 dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-neutral-900 dark:text-white">
                            {formatDate(report.data.periodStart)} - {formatDate(report.data.periodEnd)}
                          </h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(report.data.status)}`}>
                            {report.data.status}
                          </span>
                        </div>
                        <p className="text-sm text-neutral-600 dark:text-neutral-400 capitalize">
                          {report.data.reportingPeriod} Report
                        </p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-xs text-neutral-600 dark:text-neutral-400 mb-1">Revenue</p>
                        <p className="font-mono font-semibold text-neutral-900 dark:text-white">
                          {formatCurrency(report.data.totalRevenue)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-neutral-600 dark:text-neutral-400 mb-1">Expenses</p>
                        <p className="font-mono font-semibold text-neutral-900 dark:text-white">
                          {formatCurrency(report.data.totalExpenses)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-neutral-600 dark:text-neutral-400 mb-1">Net Profit</p>
                        <p className={`font-mono font-semibold ${report.data.netProfit >= 0 ? 'text-success-600' : 'text-error-600'}`}>
                          {formatCurrency(report.data.netProfit)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-neutral-600 dark:text-neutral-400 mb-1">Margin</p>
                        <p className={`font-mono font-semibold ${parseFloat(margin) >= 0 ? 'text-success-600' : 'text-error-600'}`}>
                          {margin}%
                        </p>
                      </div>
                    </div>

                    {report.data.documents && report.data.documents.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-neutral-200 dark:border-neutral-700">
                        <p className="text-xs text-neutral-600 dark:text-neutral-400 mb-2">Documents ({report.data.documents.length})</p>
                        <div className="flex flex-wrap gap-2">
                          {report.data.documents.map((doc, idx) => (
                            <a
                              key={idx}
                              href={doc.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs px-2 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded hover:bg-primary-200 dark:hover:bg-primary-900/50"
                            >
                              📄 {doc.name}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Admin Feedback */}
                    {(report.data as any).adminNotes && (
                      <div className="mt-3 pt-3 border-t border-neutral-200 dark:border-neutral-700">
                        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                          <div className="flex items-start gap-2">
                            <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <div className="flex-1">
                              <p className="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-1">
                                Platform Feedback
                              </p>
                              <p className="text-sm text-blue-700 dark:text-blue-400 whitespace-pre-wrap">
                                {(report.data as any).adminNotes}
                              </p>
                              {(report.data as any).reviewedAt && (
                                <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                                  Reviewed: {new Date((report.data as any).reviewedAt).toLocaleString()}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {(report.data as any).status === "revision_requested" && (report.data as any).revisionNotes && (
                      <div className="mt-3 pt-3 border-t border-neutral-200 dark:border-neutral-700">
                        <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                          <div className="flex items-start gap-2">
                            <svg className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            <div className="flex-1">
                              <p className="text-sm font-semibold text-amber-800 dark:text-amber-300 mb-1">
                                Revision Required
                              </p>
                              <p className="text-sm text-amber-700 dark:text-amber-400 whitespace-pre-wrap">
                                {(report.data as any).revisionNotes}
                              </p>
                              <button
                                onClick={() => {
                                  // Populate form with existing data for revision
                                  setFormData({
                                    ...report.data,
                                    status: "draft",
                                  });
                                  setShowForm(true);
                                }}
                                className="mt-2 text-xs px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors"
                              >
                                Revise Report
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
