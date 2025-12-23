"use client";

import { ThemeToggle } from "@/components/theme-toggle";
import { initSatellite, onAuthStateChange, signOut, listDocs, type Doc } from "@junobuild/core";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ApplicationData, OpportunityFormData } from "@/schemas";

type User = {
  key: string;
} | null | undefined;

interface InvestorProfileData {
  fullName: string;
  email: string;
  phone: string;
  kycStatus: string;
  [key: string]: any;
}

export default function AdminDashboardPage() {
  const [user, setUser] = useState<User>(undefined);
  const [businessApplications, setBusinessApplications] = useState<Doc<ApplicationData>[]>([]);
  const [memberApplications, setMemberApplications] = useState<Doc<InvestorProfileData>[]>([]);
  const [opportunities, setOpportunities] = useState<Doc<OpportunityFormData>[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch from both individual and corporate investor profiles
      let allMemberApps: Doc<InvestorProfileData>[] = [];
      
      try {
        const individualResult = await listDocs<InvestorProfileData>({
          collection: "individual_investor_profiles",
          filter: {}
        });
        if (individualResult?.items) {
          allMemberApps = [...allMemberApps, ...individualResult.items];
        }
      } catch (err) {
        console.log("No individual_investor_profiles collection found");
      }

      try {
        const corporateResult = await listDocs<InvestorProfileData>({
          collection: "corporate_investor_profiles",
          filter: {}
        });
        if (corporateResult?.items) {
          allMemberApps = [...allMemberApps, ...corporateResult.items];
        }
      } catch (err) {
        console.log("No corporate_investor_profiles collection found");
      }

      const [businessApps, opps] = await Promise.all([
        listDocs<ApplicationData>({ collection: "business_applications", filter: {} }),
        listDocs<OpportunityFormData>({ collection: "opportunities", filter: {} })
      ]);
      
      setBusinessApplications(businessApps?.items || []);
      setMemberApplications(allMemberApps);
      setOpportunities(opps?.items || []);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

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
    if (user && user !== null) {
      fetchDashboardData();
    }
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  if (user === undefined || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-primary-50/30 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-neutral-600 dark:text-neutral-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (user === null) {
    router.push("/admin/login");
    return null;
  }

  const stats = {
    // Business applications
    pendingBusinessApps: businessApplications.filter(a => a.data.status === 'pending' || a.data.status === 'new').length,
    approvedBusinessApps: businessApplications.filter(a => a.data.status === 'approved').length,
    totalBusinessApps: businessApplications.length,
    
    // Member applications
    pendingMemberApps: memberApplications.filter(m => m.data.kycStatus === 'pending' || m.data.kycStatus === 'in-review').length,
    verifiedMembers: memberApplications.filter(m => m.data.kycStatus === 'verified').length,
    totalMembers: memberApplications.length,
    
    // Opportunities
    activeOpportunities: opportunities.filter(o => o.data.status === 'active').length,
    totalFunding: opportunities.reduce((sum, o) => sum + o.data.currentFunding, 0),
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-primary-50/30 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950">
      {/* Dev Mode Switcher */}
      <div className="bg-amber-100 dark:bg-amber-900/30 border-b border-amber-300 dark:border-amber-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-xs font-semibold text-amber-800 dark:text-amber-300">DEV MODE:</span>
            <a href="/member/dashboard" className="px-3 py-1 bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-300 dark:hover:bg-neutral-600 text-xs font-medium rounded transition-colors">
              Member
            </a>
            <a href="/waqf/dashboard" className="px-3 py-1 bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-300 dark:hover:bg-neutral-600 text-xs font-medium rounded transition-colors">
              Waqf
            </a>
            <a href="/business/dashboard" className="px-3 py-1 bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-300 dark:hover:bg-neutral-600 text-xs font-medium rounded transition-colors">
              Business
            </a>
            <span className="px-3 py-1 bg-neutral-800 dark:bg-neutral-600 text-white text-xs font-medium rounded">
              Admin ✓
            </span>
            <a href="/" className="ml-auto px-3 py-1 border border-amber-400 dark:border-amber-600 text-amber-800 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-amber-900/50 text-xs font-medium rounded transition-colors">
              ← Home
            </a>
          </div>
        </div>
      </div>

      {/* Top Navigation */}
      <nav className="sticky top-0 z-50 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md border-b border-neutral-200 dark:border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-8">
              <Link href="/admin/dashboard" className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-primary-700 rounded-lg flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-xl">A</span>
                </div>
                <div>
                  <h1 className="font-display font-bold text-xl text-neutral-900 dark:text-white">AmanaTrade Admin</h1>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">Platform Management</p>
                </div>
              </Link>

              <div className="hidden md:flex items-center gap-4">
                <Link href="/admin/dashboard" className="px-3 py-2 text-sm font-medium text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-950/30 rounded-lg">
                  Dashboard
                </Link>
                <Link href="/admin/member-applications" className="px-3 py-2 text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white rounded-lg">
                  Member Apps
                </Link>
                <Link href="/admin/business-applications" className="px-3 py-2 text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white rounded-lg">
                  Business Apps
                </Link>
                <Link href="/admin/workflow" className="px-3 py-2 text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white rounded-lg flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  Workflow
                </Link>
                <Link href="/admin/analytics" className="px-3 py-2 text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white rounded-lg flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 00-2-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  Analytics
                </Link>
                <Link href="/admin/integrations" className="px-3 py-2 text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white rounded-lg flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Integrations
                </Link>
                <Link href="/admin/kyc-review" className="px-3 py-2 text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white rounded-lg">
                  KYC Review
                </Link>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <ThemeToggle />
              <button onClick={handleSignOut} className="px-4 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:text-error-600 dark:hover:text-error-400 transition-colors">
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Header */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-neutral-900 dark:text-white mb-2">Admin Dashboard</h2>
          <p className="text-neutral-600 dark:text-neutral-400">Platform overview and quick actions</p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Pending Business Apps */}
          <div className="bg-white dark:bg-neutral-900 rounded-xl p-6 border border-neutral-200 dark:border-neutral-800 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-warning-100 dark:bg-warning-900/30 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-warning-600 dark:text-warning-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              {stats.pendingBusinessApps > 0 && (
                <span className="px-2 py-1 bg-warning-100 dark:bg-warning-900/30 text-warning-700 dark:text-warning-300 text-xs font-semibold rounded-full">
                  Urgent
                </span>
              )}
            </div>
            <div className="font-mono font-bold text-3xl text-neutral-900 dark:text-white mb-1">{stats.pendingBusinessApps}</div>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">Pending Business Apps</p>
          </div>

          {/* Pending Member Apps */}
          <div className="bg-white dark:bg-neutral-900 rounded-xl p-6 border border-neutral-200 dark:border-neutral-800 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-secondary-100 dark:bg-secondary-900/30 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-secondary-600 dark:text-secondary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
            <div className="font-mono font-bold text-3xl text-neutral-900 dark:text-white mb-1">{stats.pendingMemberApps}</div>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">Pending Member KYC</p>
          </div>

          {/* Active Opportunities */}
          <div className="bg-white dark:bg-neutral-900 rounded-xl p-6 border border-neutral-200 dark:border-neutral-800 shadow-sm">
            <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-primary-600 dark:text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <div className="font-mono font-bold text-3xl text-neutral-900 dark:text-white mb-1">{stats.activeOpportunities}</div>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">Active Opportunities</p>
          </div>

          {/* Total Funding */}
          <div className="bg-white dark:bg-neutral-900 rounded-xl p-6 border border-neutral-200 dark:border-neutral-800 shadow-sm">
            <div className="w-12 h-12 bg-success-100 dark:bg-success-900/30 rounded-xl flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-success-600 dark:text-success-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div className="font-mono font-bold text-2xl text-neutral-900 dark:text-white mb-1">{formatCurrency(stats.totalFunding)}</div>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">Total Funding Raised</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Link href="/admin/member-applications" className="group bg-gradient-to-br from-secondary-50 to-secondary-100 dark:from-secondary-900/20 dark:to-secondary-800/10 rounded-2xl border-2 border-secondary-200 dark:border-secondary-800 p-8 hover:shadow-lg transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="w-16 h-16 bg-secondary-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              {stats.pendingMemberApps > 0 && (
                <span className="px-3 py-1 bg-secondary-600 text-white text-sm font-bold rounded-full">
                  {stats.pendingMemberApps} pending
                </span>
              )}
            </div>
            <h3 className="text-2xl font-bold text-secondary-900 dark:text-secondary-200 mb-2">Member Applications</h3>
            <p className="text-secondary-700 dark:text-secondary-300">Review investor/member registrations and KYC</p>
          </Link>

          <Link href="/admin/business-applications" className="group bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/10 rounded-2xl border-2 border-primary-200 dark:border-primary-800 p-8 hover:shadow-lg transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="w-16 h-16 bg-primary-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              {stats.pendingBusinessApps > 0 && (
                <span className="px-3 py-1 bg-warning-600 text-white text-sm font-bold rounded-full">
                  {stats.pendingBusinessApps} pending
                </span>
              )}
            </div>
            <h3 className="text-2xl font-bold text-primary-900 dark:text-primary-200 mb-2">Business Applications</h3>
            <p className="text-primary-700 dark:text-primary-300">Approve business funding and create opportunities</p>
          </Link>

          <Link href="/admin/integrations" className="group bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/10 rounded-2xl border-2 border-purple-200 dark:border-purple-800 p-8 hover:shadow-lg transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="w-16 h-16 bg-purple-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            </div>
            <h3 className="text-2xl font-bold text-purple-900 dark:text-purple-200 mb-2">Integrations & Automation</h3>
            <p className="text-purple-700 dark:text-purple-300">External APIs, bulk operations, and exports</p>
          </Link>

          <Link href="/admin/kyc-review" className="group bg-gradient-to-br from-success-50 to-success-100 dark:from-success-900/20 dark:to-success-800/10 rounded-2xl border-2 border-success-200 dark:border-success-800 p-8 hover:shadow-lg transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="w-16 h-16 bg-success-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            </div>
            <h3 className="text-2xl font-bold text-success-900 dark:text-success-200 mb-2">Member KYC</h3>
            <p className="text-success-700 dark:text-success-300">Verify investor documents</p>
          </Link>

          <Link href="/admin/business-kyc" className="group bg-gradient-to-br from-warning-50 to-warning-100 dark:from-warning-900/20 dark:to-warning-800/10 rounded-2xl border-2 border-warning-200 dark:border-warning-800 p-8 hover:shadow-lg transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="w-16 h-16 bg-warning-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
            </div>
            <h3 className="text-2xl font-bold text-warning-900 dark:text-warning-200 mb-2">Business KYC</h3>
            <p className="text-warning-700 dark:text-warning-300">Verify business documents</p>
          </Link>

          <Link href="/admin/financial-reports" className="group bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/10 rounded-2xl border-2 border-blue-200 dark:border-blue-800 p-8 hover:shadow-lg transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
            <h3 className="text-2xl font-bold text-blue-900 dark:text-blue-200 mb-2">Financial Reports</h3>
            <p className="text-blue-700 dark:text-blue-300">Review business financial reports</p>
          </Link>

          <Link href="/admin/business-messages" className="group bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/20 dark:to-indigo-800/10 rounded-2xl border-2 border-indigo-200 dark:border-indigo-800 p-8 hover:shadow-lg transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="w-16 h-16 bg-indigo-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
            <h3 className="text-2xl font-bold text-indigo-900 dark:text-indigo-200 mb-2">Business Messaging</h3>
            <p className="text-indigo-700 dark:text-indigo-300">Send messages to businesses</p>
          </Link>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Business Applications */}
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-neutral-900 dark:text-white">Recent Business Applications</h3>
              <Link href="/admin/business-applications" className="text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400">
                View All →
              </Link>
            </div>
            {businessApplications.length === 0 ? (
              <div className="py-8 text-center">
                <svg className="w-12 h-12 text-neutral-300 dark:text-neutral-600 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">No business applications yet</p>
              </div>
            ) : (
              <div className="divide-y divide-neutral-200 dark:divide-neutral-800">
                {businessApplications.slice(0, 5).map((app) => (
                  <div key={app.key} className="py-3 flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-neutral-900 dark:text-white">{app.data.businessName}</p>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400">{app.data.industry} • {formatCurrency(app.data.requestedAmount || 0)}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      app.data.status === 'approved' ? 'bg-success-100 dark:bg-success-900/30 text-success-700 dark:text-success-300' :
                      app.data.status === 'rejected' ? 'bg-error-100 dark:bg-error-900/30 text-error-700 dark:text-error-300' :
                      'bg-warning-100 dark:bg-warning-900/30 text-warning-700 dark:text-warning-300'
                    }`}>
                      {app.data.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Member Applications */}
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-neutral-900 dark:text-white">Recent Member Applications</h3>
              <Link href="/admin/member-applications" className="text-sm font-medium text-secondary-600 hover:text-secondary-700 dark:text-secondary-400">
                View All →
              </Link>
            </div>
            {memberApplications.length === 0 ? (
              <div className="py-8 text-center">
                <svg className="w-12 h-12 text-neutral-300 dark:text-neutral-600 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">No member applications yet</p>
              </div>
            ) : (
              <div className="divide-y divide-neutral-200 dark:divide-neutral-800">
                {memberApplications.slice(0, 5).map((app) => (
                  <div key={app.key} className="py-3 flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-neutral-900 dark:text-white">{app.data.fullName}</p>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400">{app.data.email}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      app.data.kycStatus === 'verified' ? 'bg-success-100 dark:bg-success-900/30 text-success-700 dark:text-success-300' :
                      app.data.kycStatus === 'rejected' ? 'bg-error-100 dark:bg-error-900/30 text-error-700 dark:text-error-300' :
                      'bg-warning-100 dark:bg-warning-900/30 text-warning-700 dark:text-warning-300'
                    }`}>
                      {app.data.kycStatus}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
