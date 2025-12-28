"use client";

import { ThemeToggle } from "@/components/theme-toggle";
import { AuthButton } from "@/components/auth-button";
import { initSatellite, onAuthStateChange, listDocs, setDoc, type Doc } from "@junobuild/core";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { RevenueReport, ApplicationData } from "@/schemas";
import { MurabahaReportFields } from "@/components/reporting/murabaha-report-fields";
import { MudarabaReportFields } from "@/components/reporting/mudaraba-report-fields";
import { MusharakahReportFields } from "@/components/reporting/musharakah-report-fields";
import { IjaraReportFields } from "@/components/reporting/ijara-report-fields";
import { SalamReportFields } from "@/components/reporting/salam-report-fields";

type User = {
  key: string;
} | null | undefined;

export default function AdminFinancialReportsPage() {
  const [user, setUser] = useState<User>(undefined);
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<Doc<RevenueReport>[]>([]);
  const [businesses, setBusinesses] = useState<Map<string, string>>(new Map());
  const [selectedReport, setSelectedReport] = useState<Doc<RevenueReport> | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [revisionNotes, setRevisionNotes] = useState("");
  const [updating, setUpdating] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const router = useRouter();

  useEffect(() => {
    (async () => await initSatellite({ workers: { auth: true } }))();
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChange((authUser) => {
      setUser(authUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/signin");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      loadReports();
    }
  }, [user]);

  const loadReports = async () => {
    setLoading(true);
    try {
      const [reportsResult, applicationsResult] = await Promise.all([
        listDocs<RevenueReport>({ collection: "revenue_reports" }),
        listDocs<ApplicationData>({ collection: "business_applications" }),
      ]);

      const businessMap = new Map<string, string>();
      applicationsResult.items.forEach((app) => {
        businessMap.set(app.key, app.data.businessName);
      });

      setBusinesses(businessMap);
      setReports(reportsResult.items.sort((a, b) => {
        const dateA = new Date((a.data as any).submittedAt || a.created_at).getTime();
        const dateB = new Date((b.data as any).submittedAt || b.created_at).getTime();
        return dateB - dateA;
      }));
    } catch (error) {
      console.error("Error loading reports:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (status: "approved" | "revision_requested" | "under_review") => {
    if (!selectedReport || !user) return;

    setUpdating(true);
    try {
      const updatedData: any = {
        ...selectedReport.data,
        status,
        reviewedBy: user.key,
        reviewedAt: new Date().toISOString(),
      };

      if (adminNotes.trim()) {
        updatedData.adminNotes = adminNotes;
      }

      if (status === "revision_requested" && revisionNotes.trim()) {
        updatedData.revisionNotes = revisionNotes;
      }

      await setDoc({
        collection: "revenue_reports",
        doc: {
          key: selectedReport.key,
          data: updatedData,
          version: selectedReport.version,
        },
      });

      alert(`Report ${status === "approved" ? "approved" : status === "revision_requested" ? "sent back for revision" : "marked under review"} successfully!`);
      setAdminNotes("");
      setRevisionNotes("");
      setSelectedReport(null);
      await loadReports();
    } catch (error) {
      console.error("Error updating report:", error);
      alert("Failed to update report");
    } finally {
      setUpdating(false);
    }
  };

  const filteredReports = filterStatus === "all" 
    ? reports 
    : reports.filter(r => (r.data as any).status === filterStatus || (!((r.data as any).status) && filterStatus === "submitted"));

  const pendingCount = reports.filter(r => {
    const status = (r.data as any).status || "submitted";
    return status === "submitted" || status === "under_review";
  }).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-primary-50/30 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950">
      <header className="bg-white/80 dark:bg-neutral-900/80 backdrop-blur-sm border-b border-neutral-200 dark:border-neutral-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <Link href="/admin/dashboard" className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-blue-600 bg-clip-text text-transparent hover:from-primary-700 hover:to-blue-700 transition-all">
                AmanaTrade Admin
              </Link>
              <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">Financial Reports Review</p>
            </div>
            <div className="flex items-center gap-4">
              <ThemeToggle />
              <AuthButton />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Link href="/admin/dashboard" className="inline-flex items-center gap-2 text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Dashboard
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white dark:bg-neutral-900 rounded-xl p-4 border-2 border-neutral-200 dark:border-neutral-800">
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-1">Total Reports</p>
            <p className="text-2xl font-bold text-neutral-900 dark:text-white">{reports.length}</p>
          </div>
          <div className="bg-white dark:bg-neutral-900 rounded-xl p-4 border-2 border-amber-200 dark:border-amber-800">
            <p className="text-sm text-amber-600 dark:text-amber-400 mb-1">Pending Review</p>
            <p className="text-2xl font-bold text-amber-900 dark:text-amber-100">{pendingCount}</p>
          </div>
          <div className="bg-white dark:bg-neutral-900 rounded-xl p-4 border-2 border-green-200 dark:border-green-800">
            <p className="text-sm text-green-600 dark:text-green-400 mb-1">Approved</p>
            <p className="text-2xl font-bold text-green-900 dark:text-green-100">
              {reports.filter(r => (r.data as any).status === "approved").length}
            </p>
          </div>
          <div className="bg-white dark:bg-neutral-900 rounded-xl p-4 border-2 border-red-200 dark:border-red-800">
            <p className="text-sm text-red-600 dark:text-red-400 mb-1">Revision Requested</p>
            <p className="text-2xl font-bold text-red-900 dark:text-red-100">
              {reports.filter(r => (r.data as any).status === "revision_requested").length}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-neutral-900 rounded-xl p-4 border-2 border-neutral-200 dark:border-neutral-800 mb-6">
          <div className="flex flex-wrap gap-2">
            {["all", "submitted", "under_review", "approved", "revision_requested"].map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                  filterStatus === status
                    ? "bg-primary-600 text-white shadow-lg"
                    : "bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700"
                }`}
              >
                {status.replace("_", " ").replace(/\b\w/g, l => l.toUpperCase())}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Reports List */}
          <div className="lg:col-span-1 bg-white dark:bg-neutral-900 rounded-2xl border-2 border-neutral-200 dark:border-neutral-800 overflow-hidden">
            <div className="p-4 bg-gradient-to-r from-primary-50 to-blue-50 dark:from-primary-900/20 dark:to-blue-900/20 border-b border-neutral-200 dark:border-neutral-700">
              <h2 className="text-lg font-bold text-neutral-900 dark:text-white">
                Financial Reports ({filteredReports.length})
              </h2>
            </div>

            <div className="divide-y divide-neutral-200 dark:divide-neutral-700 max-h-[700px] overflow-y-auto">
              {filteredReports.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-neutral-600 dark:text-neutral-400 text-sm">No reports found</p>
                </div>
              ) : (
                filteredReports.map((report) => (
                  <button
                    key={report.key}
                    onClick={() => setSelectedReport(report)}
                    className={`w-full p-4 text-left hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors ${
                      selectedReport?.key === report.key ? "bg-primary-50 dark:bg-primary-900/20" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <p className="font-semibold text-neutral-900 dark:text-white text-sm">
                        {businesses.get(report.data.applicationId) || "Unknown Business"}
                      </p>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        (report.data as any).status === "approved" ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300" :
                        (report.data as any).status === "revision_requested" ? "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300" :
                        (report.data as any).status === "under_review" ? "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300" :
                        "bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300"
                      }`}>
                        {((report.data as any).status || "submitted").replace("_", " ")}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-600 dark:text-neutral-400 mb-1">
                      {report.data.periodStart} - {report.data.periodEnd}
                    </p>
                    <div className="flex items-center gap-3 text-xs">
                      <span className="text-green-600 dark:text-green-400">
                        ₦{report.data.totalRevenue.toLocaleString()}
                      </span>
                      <span className="text-neutral-400">•</span>
                      <span className="text-neutral-600 dark:text-neutral-400">
                        Profit: ₦{report.data.netProfit.toLocaleString()}
                      </span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Report Detail */}
          <div className="lg:col-span-2 bg-white dark:bg-neutral-900 rounded-2xl border-2 border-neutral-200 dark:border-neutral-800 overflow-hidden">
            {selectedReport ? (
              <div className="flex flex-col h-[800px]">
                <div className="p-6 bg-gradient-to-r from-primary-50 to-blue-50 dark:from-primary-900/20 dark:to-blue-900/20 border-b border-neutral-200 dark:border-neutral-700">
                  <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-2">
                    {businesses.get(selectedReport.data.applicationId) || "Unknown Business"}
                  </h3>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    {selectedReport.data.periodStart} - {selectedReport.data.periodEnd} • {selectedReport.data.reportingPeriod}
                  </p>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                  {/* Financial Summary */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="p-4 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                      <p className="text-xs text-neutral-600 dark:text-neutral-400 mb-1">Revenue</p>
                      <p className="text-lg font-bold text-neutral-900 dark:text-white">
                        ₦{selectedReport.data.totalRevenue.toLocaleString()}
                      </p>
                    </div>
                    <div className="p-4 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                      <p className="text-xs text-neutral-600 dark:text-neutral-400 mb-1">Expenses</p>
                      <p className="text-lg font-bold text-neutral-900 dark:text-white">
                        ₦{selectedReport.data.totalExpenses.toLocaleString()}
                      </p>
                    </div>
                    <div className="p-4 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                      <p className="text-xs text-neutral-600 dark:text-neutral-400 mb-1">Net Profit</p>
                      <p className={`text-lg font-bold ${selectedReport.data.netProfit >= 0 ? "text-green-600" : "text-red-600"}`}>
                        ₦{selectedReport.data.netProfit.toLocaleString()}
                      </p>
                    </div>
                    <div className="p-4 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                      <p className="text-xs text-neutral-600 dark:text-neutral-400 mb-1">Margin</p>
                      <p className={`text-lg font-bold ${
                        (selectedReport.data.netProfit / selectedReport.data.totalRevenue * 100) >= 0 ? "text-green-600" : "text-red-600"
                      }`}>
                        {(selectedReport.data.netProfit / selectedReport.data.totalRevenue * 100).toFixed(1)}%
                      </p>
                    </div>
                  </div>

                  {/* Documents */}
                  {selectedReport.data.documents && selectedReport.data.documents.length > 0 && (
                    <div className="mb-6">
                      <h4 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-3">Supporting Documents</h4>
                      <div className="space-y-2">
                        {selectedReport.data.documents.map((doc, idx) => (
                          <a
                            key={idx}
                            href={doc.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
                          >
                            <svg className="w-5 h-5 text-primary-600 dark:text-primary-400" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M8 4a3 3 0 00-3 3v4a5 5 0 0010 0V7a1 1 0 112 0v4a7 7 0 11-14 0V7a5 5 0 0110 0v4a3 3 0 11-6 0V7a1 1 0 012 0v4a1 1 0 102 0V7a3 3 0 00-3-3z" clipRule="evenodd" />
                            </svg>
                            <span className="text-sm text-neutral-700 dark:text-neutral-300">{doc.name}</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Contract-Specific Details */}
                  {selectedReport.data.contractType && (
                    <div className="mb-6">
                      <h4 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-3">
                        Islamic Finance Contract Details
                      </h4>
                      {selectedReport.data.contractType === "murabaha" && selectedReport.data.murabahaDetails && (
                        <div className="bg-lavender-blue-50 dark:bg-lavender-blue-900/10 rounded-lg border-2 border-lavender-blue-200 dark:border-lavender-blue-800 p-4">
                          <p className="text-xs font-semibold text-lavender-blue-600 dark:text-lavender-blue-400 mb-3">
                            MURABAHA (Cost-Plus Financing)
                          </p>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="text-neutral-600 dark:text-neutral-400">Asset Cost</p>
                              <p className="font-bold text-neutral-900 dark:text-white">
                                ₦{selectedReport.data.murabahaDetails.assetCost?.toLocaleString() || "N/A"}
                              </p>
                            </div>
                            <div>
                              <p className="text-neutral-600 dark:text-neutral-400">Markup Amount</p>
                              <p className="font-bold text-neutral-900 dark:text-white">
                                ₦{selectedReport.data.murabahaDetails.markupAmount?.toLocaleString() || "N/A"}
                              </p>
                            </div>
                            <div>
                              <p className="text-neutral-600 dark:text-neutral-400">Installments Paid</p>
                              <p className="font-bold text-neutral-900 dark:text-white">
                                {selectedReport.data.murabahaDetails.installmentsPaid || 0}
                              </p>
                            </div>
                            <div>
                              <p className="text-neutral-600 dark:text-neutral-400">Remaining Installments</p>
                              <p className="font-bold text-neutral-900 dark:text-white">
                                {selectedReport.data.murabahaDetails.installmentsRemaining || 0}
                              </p>
                            </div>
                            <div>
                              <p className="text-neutral-600 dark:text-neutral-400">Remaining Balance</p>
                              <p className="font-bold text-neutral-900 dark:text-white">
                                ₦{selectedReport.data.murabahaDetails.remainingBalance?.toLocaleString() || "N/A"}
                              </p>
                            </div>
                            <div>
                              <p className="text-neutral-600 dark:text-neutral-400">Payment Status</p>
                              <p className="font-bold text-neutral-900 dark:text-white capitalize">
                                {selectedReport.data.murabahaDetails.paymentStatus || "N/A"}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {selectedReport.data.contractType === "mudaraba" && selectedReport.data.mudarabaDetails && (
                        <div className="bg-lavender-blue-50 dark:bg-lavender-blue-900/10 rounded-lg border-2 border-lavender-blue-200 dark:border-lavender-blue-800 p-4">
                          <p className="text-xs font-semibold text-lavender-blue-600 dark:text-lavender-blue-400 mb-3">
                            MUDARABA (Trust Financing)
                          </p>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="text-neutral-600 dark:text-neutral-400">Capital Provided</p>
                              <p className="font-bold text-neutral-900 dark:text-white">
                                ₦{selectedReport.data.mudarabaDetails.capitalProvided?.toLocaleString() || "N/A"}
                              </p>
                            </div>
                            <div>
                              <p className="text-neutral-600 dark:text-neutral-400">Management Performance</p>
                              <p className="font-bold text-neutral-900 dark:text-white capitalize">
                                {selectedReport.data.mudarabaDetails.managementPerformance || "N/A"}
                              </p>
                            </div>
                            <div>
                              <p className="text-neutral-600 dark:text-neutral-400">Investor Profit Share</p>
                              <p className="font-bold text-neutral-900 dark:text-white">
                                {selectedReport.data.mudarabaDetails.investorProfitShare || 0}%
                              </p>
                            </div>
                            <div>
                              <p className="text-neutral-600 dark:text-neutral-400">Mudarib Profit Share</p>
                              <p className="font-bold text-neutral-900 dark:text-white">
                                {selectedReport.data.mudarabaDetails.mudaribProfitShare || 0}%
                              </p>
                            </div>
                            <div>
                              <p className="text-neutral-600 dark:text-neutral-400">Actual Investor Profit</p>
                              <p className="font-bold text-green-600 dark:text-green-400">
                                ₦{selectedReport.data.mudarabaDetails.actualInvestorProfit?.toLocaleString() || "N/A"}
                              </p>
                            </div>
                            <div>
                              <p className="text-neutral-600 dark:text-neutral-400">Actual Mudarib Profit</p>
                              <p className="font-bold text-green-600 dark:text-green-400">
                                ₦{selectedReport.data.mudarabaDetails.actualMudaribProfit?.toLocaleString() || "N/A"}
                              </p>
                            </div>
                            {selectedReport.data.mudarabaDetails.businessActivities && (
                              <div className="col-span-2">
                                <p className="text-neutral-600 dark:text-neutral-400 mb-1">Business Activities</p>
                                <p className="text-sm text-neutral-800 dark:text-neutral-200">
                                  {selectedReport.data.mudarabaDetails.businessActivities}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {selectedReport.data.contractType === "musharaka" && selectedReport.data.musharakahDetails && (
                        <div className="bg-lavender-blue-50 dark:bg-lavender-blue-900/10 rounded-lg border-2 border-lavender-blue-200 dark:border-lavender-blue-800 p-4">
                          <p className="text-xs font-semibold text-lavender-blue-600 dark:text-lavender-blue-400 mb-3">
                            MUSHARAKA (Partnership)
                          </p>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="text-neutral-600 dark:text-neutral-400">Partner 1 Capital</p>
                              <p className="font-bold text-neutral-900 dark:text-white">
                                ₦{selectedReport.data.musharakahDetails.party1Capital?.toLocaleString() || "N/A"}
                              </p>
                            </div>
                            <div>
                              <p className="text-neutral-600 dark:text-neutral-400">Partner 2 Capital</p>
                              <p className="font-bold text-neutral-900 dark:text-white">
                                ₦{selectedReport.data.musharakahDetails.party2Capital?.toLocaleString() || "N/A"}
                              </p>
                            </div>
                            <div>
                              <p className="text-neutral-600 dark:text-neutral-400">Partner 1 Profit Share</p>
                              <p className="font-bold text-neutral-900 dark:text-white">
                                {selectedReport.data.musharakahDetails.party1ProfitShare || 0}%
                              </p>
                            </div>
                            <div>
                              <p className="text-neutral-600 dark:text-neutral-400">Partner 2 Profit Share</p>
                              <p className="font-bold text-neutral-900 dark:text-white">
                                {selectedReport.data.musharakahDetails.party2ProfitShare || 0}%
                              </p>
                            </div>
                            <div>
                              <p className="text-neutral-600 dark:text-neutral-400">Actual Partner 1 Profit</p>
                              <p className="font-bold text-green-600 dark:text-green-400">
                                ₦{selectedReport.data.musharakahDetails.actualParty1Profit?.toLocaleString() || "N/A"}
                              </p>
                            </div>
                            <div>
                              <p className="text-neutral-600 dark:text-neutral-400">Actual Partner 2 Profit</p>
                              <p className="font-bold text-green-600 dark:text-green-400">
                                ₦{selectedReport.data.musharakahDetails.actualParty2Profit?.toLocaleString() || "N/A"}
                              </p>
                            </div>
                            {selectedReport.data.musharakahDetails.buyoutProgress !== undefined && (
                              <div>
                                <p className="text-neutral-600 dark:text-neutral-400">Buyout Progress</p>
                                <p className="font-bold text-neutral-900 dark:text-white">
                                  {selectedReport.data.musharakahDetails.buyoutProgress}%
                                </p>
                              </div>
                            )}
                            {selectedReport.data.musharakahDetails.partnershipActivities && (
                              <div className="col-span-2">
                                <p className="text-neutral-600 dark:text-neutral-400 mb-1">Partnership Activities</p>
                                <p className="text-sm text-neutral-800 dark:text-neutral-200">
                                  {selectedReport.data.musharakahDetails.partnershipActivities}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {selectedReport.data.contractType === "ijara" && selectedReport.data.ijaraDetails && (
                        <div className="bg-lavender-blue-50 dark:bg-lavender-blue-900/10 rounded-lg border-2 border-lavender-blue-200 dark:border-lavender-blue-800 p-4">
                          <p className="text-xs font-semibold text-lavender-blue-600 dark:text-lavender-blue-400 mb-3">
                            IJARA (Leasing)
                          </p>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="text-neutral-600 dark:text-neutral-400">Asset Value</p>
                              <p className="font-bold text-neutral-900 dark:text-white">
                                ₦{selectedReport.data.ijaraDetails.assetValue?.toLocaleString() || "N/A"}
                              </p>
                            </div>
                            <div>
                              <p className="text-neutral-600 dark:text-neutral-400">Monthly Rental</p>
                              <p className="font-bold text-neutral-900 dark:text-white">
                                ₦{selectedReport.data.ijaraDetails.monthlyRental?.toLocaleString() || "N/A"}
                              </p>
                            </div>
                            <div>
                              <p className="text-neutral-600 dark:text-neutral-400">Rentals Paid</p>
                              <p className="font-bold text-neutral-900 dark:text-white">
                                {selectedReport.data.ijaraDetails.rentalsPaid || 0}
                              </p>
                            </div>
                            <div>
                              <p className="text-neutral-600 dark:text-neutral-400">Asset Depreciation</p>
                              <p className="font-bold text-neutral-900 dark:text-white">
                                ₦{selectedReport.data.ijaraDetails.assetDepreciation?.toLocaleString() || "N/A"}
                              </p>
                            </div>
                            <div>
                              <p className="text-neutral-600 dark:text-neutral-400">Maintenance Costs</p>
                              <p className="font-bold text-neutral-900 dark:text-white">
                                ₦{selectedReport.data.ijaraDetails.maintenanceCosts?.toLocaleString() || "N/A"}
                              </p>
                            </div>
                            <div>
                              <p className="text-neutral-600 dark:text-neutral-400">Asset Condition</p>
                              <p className="font-bold text-neutral-900 dark:text-white capitalize">
                                {selectedReport.data.ijaraDetails.assetCondition || "N/A"}
                              </p>
                            </div>
                            {selectedReport.data.ijaraDetails.purchaseOptionExercised !== undefined && (
                              <div className="col-span-2">
                                <p className="text-neutral-600 dark:text-neutral-400">Purchase Option Status</p>
                                <p className={`font-bold ${selectedReport.data.ijaraDetails.purchaseOptionExercised ? "text-green-600" : "text-neutral-900 dark:text-white"}`}>
                                  {selectedReport.data.ijaraDetails.purchaseOptionExercised ? "✓ Exercised" : "Not Exercised"}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {selectedReport.data.contractType === "istisna" && selectedReport.data.salamDetails && (
                        <div className="bg-lavender-blue-50 dark:bg-lavender-blue-900/10 rounded-lg border-2 border-lavender-blue-200 dark:border-lavender-blue-800 p-4">
                          <p className="text-xs font-semibold text-lavender-blue-600 dark:text-lavender-blue-400 mb-3">
                            {selectedReport.data.contractType.toUpperCase()} (Forward Sale)
                          </p>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            {selectedReport.data.salamDetails.commodityDescription && (
                              <div className="col-span-2">
                                <p className="text-neutral-600 dark:text-neutral-400 mb-1">Commodity/Product</p>
                                <p className="text-sm text-neutral-800 dark:text-neutral-200">
                                  {selectedReport.data.salamDetails.commodityDescription}
                                </p>
                              </div>
                            )}
                            <div>
                              <p className="text-neutral-600 dark:text-neutral-400">Advance Payment Received</p>
                              <p className="font-bold text-neutral-900 dark:text-white">
                                ₦{selectedReport.data.salamDetails.advancePaymentReceived?.toLocaleString() || "N/A"}
                              </p>
                            </div>
                            <div>
                              <p className="text-neutral-600 dark:text-neutral-400">Production Progress</p>
                              <p className="font-bold text-neutral-900 dark:text-white">
                                {selectedReport.data.salamDetails.productionProgress || 0}%
                              </p>
                            </div>
                            <div>
                              <p className="text-neutral-600 dark:text-neutral-400">Quantity Ordered</p>
                              <p className="font-bold text-neutral-900 dark:text-white">
                                {selectedReport.data.salamDetails.quantityOrdered || 0}
                              </p>
                            </div>
                            <div>
                              <p className="text-neutral-600 dark:text-neutral-400">Quantity Delivered</p>
                              <p className="font-bold text-neutral-900 dark:text-white">
                                {selectedReport.data.salamDetails.quantityDelivered || 0}
                              </p>
                            </div>
                            <div>
                              <p className="text-neutral-600 dark:text-neutral-400">Delivery Status</p>
                              <p className="font-bold text-neutral-900 dark:text-white capitalize">
                                {selectedReport.data.salamDetails.deliveryStatus?.replace("_", " ") || "N/A"}
                              </p>
                            </div>
                            <div>
                              <p className="text-neutral-600 dark:text-neutral-400">Quality Compliance</p>
                              <p className="font-bold text-neutral-900 dark:text-white capitalize">
                                {selectedReport.data.salamDetails.qualityCompliance?.replace("_", " ") || "N/A"}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Review Section */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
                        Admin Notes (Optional)
                      </label>
                      <textarea
                        value={adminNotes}
                        onChange={(e) => setAdminNotes(e.target.value)}
                        placeholder="Add any feedback or comments..."
                        rows={3}
                        className="w-full px-4 py-3 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-white placeholder-neutral-500 focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
                        Revision Notes (Required if requesting revision)
                      </label>
                      <textarea
                        value={revisionNotes}
                        onChange={(e) => setRevisionNotes(e.target.value)}
                        placeholder="Explain what needs to be revised..."
                        rows={3}
                        className="w-full px-4 py-3 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-white placeholder-neutral-500 focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                      />
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => handleUpdateStatus("approved")}
                        disabled={updating}
                        className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold rounded-lg transition-all shadow-lg disabled:opacity-50"
                      >
                        {updating ? "Processing..." : "Approve"}
                      </button>
                      <button
                        onClick={() => handleUpdateStatus("under_review")}
                        disabled={updating}
                        className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-lg transition-all shadow-lg disabled:opacity-50"
                      >
                        Mark Under Review
                      </button>
                      <button
                        onClick={() => handleUpdateStatus("revision_requested")}
                        disabled={updating || !revisionNotes.trim()}
                        className="flex-1 px-6 py-3 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-semibold rounded-lg transition-all shadow-lg disabled:opacity-50"
                      >
                        Request Revision
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-[800px]">
                <div className="text-center">
                  <svg className="w-20 h-20 text-neutral-300 dark:text-neutral-700 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="text-neutral-600 dark:text-neutral-400">Select a report to review</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
