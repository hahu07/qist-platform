"use client";

import { ThemeToggle } from "@/components/theme-toggle";
import { AuthButton } from "@/components/auth-button";
import { initSatellite, onAuthStateChange, listDocs, type Doc } from "@junobuild/core";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { BusinessProfile, ApplicationData, OpportunityFormData } from "@/schemas";
import { logger } from "@/utils/logger";

type User = {
  key: string;
} | null | undefined;

export default function NewBusinessDashboardPage() {
  const [user, setUser] = useState<User>(undefined);
  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  const [applications, setApplications] = useState<Doc<ApplicationData>[]>([]);
  const [opportunities, setOpportunities] = useState<Doc<OpportunityFormData>[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
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
      loadBusinessData();
    }
  }, [user]);

  const loadBusinessData = async () => {
    if (!user) return;

    try {
      // Load business profile
      const profilesResult = await listDocs<BusinessProfile>({
        collection: "business_profiles",
      });

      const userProfile = profilesResult.items.find((doc) => doc.key === user.key);

      if (!userProfile) {
        // No profile yet, redirect to profile creation
        router.push("/business/onboarding/profile");
        return;
      }

      setProfile(userProfile.data);

      // Load financing applications
      const applicationsResult = await listDocs<ApplicationData>({
        collection: "business_applications",
      });

      const userApplications = applicationsResult.items.filter(
        (app) => app.data.businessEmail === userProfile.data.businessEmail || app.owner === user.key
      );

      setApplications(userApplications);

      // Load approved opportunities
      const opportunitiesResult = await listDocs<OpportunityFormData>({
        collection: "opportunities",
      });

      const userOpportunities = opportunitiesResult.items.filter(
        (opp) => opp.data.businessId === user.key
      );

      setOpportunities(userOpportunities);
    } catch (error) {
      logger.error("Error loading business data:", error);
      setError("Failed to load business data");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-secondary-50/30 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950 flex items-center justify-center">
        <div className="text-neutral-600 dark:text-neutral-400">Loading...</div>
      </div>
    );
  }

  if (!user || !profile) {
    return null;
  }

  const hasActiveApplication = applications.some(app => app.data.status === "pending" || app.data.status === "new" || app.data.status === "review");
  const hasApprovedOpportunity = opportunities.length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-secondary-50/30 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950">
      {/* Dev Dashboard Switcher */}
      <div className="fixed top-0 left-0 right-0 z-[60] bg-amber-100 dark:bg-amber-900/30 border-b border-amber-300 dark:border-amber-800">
        <div className="px-4 py-2">
          <div className="flex items-center gap-2 md:gap-3 flex-wrap">
            <span className="text-xs font-semibold text-amber-800 dark:text-amber-300">DEV MODE:</span>
            <a href="/member/dashboard" className="px-3 py-1 bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-300 dark:hover:bg-neutral-600 text-xs font-medium rounded transition-colors">
              Member
            </a>
            <a href="/waqf/dashboard" className="px-3 py-1 bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-300 dark:hover:bg-neutral-600 text-xs font-medium rounded transition-colors">
              Waqf
            </a>
            <span className="px-3 py-1 bg-secondary-600 text-white text-xs font-medium rounded">
              Business ✓
            </span>
            <a href="/admin/dashboard" className="px-3 py-1 bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-300 dark:hover:bg-neutral-600 text-xs font-medium rounded transition-colors">
              Admin
            </a>
            <a href="/" className="ml-auto px-3 py-1 border border-amber-400 dark:border-amber-600 text-amber-800 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-amber-900/50 text-xs font-medium rounded transition-colors">
              ← Home
            </a>
          </div>
        </div>
      </div>

      {/* Header */}
      <header className="border-b border-neutral-200 dark:border-neutral-800 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-sm sticky top-12 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-display font-bold text-2xl text-neutral-900 dark:text-white">
                {profile.businessName}
              </h1>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                {profile.industry} • {profile.businessType}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <AuthButton />
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
          </div>
        )}

        {/* KYC Status Banner */}
        {profile.kycStatus === "pending" && (
          <div className="mb-6 p-6 bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-200 dark:border-amber-800 rounded-xl">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-amber-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xl">📋</span>
                </div>
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-lg text-amber-900 dark:text-amber-100 mb-2">
                  Complete Your KYC Verification
                </h3>
                <p className="text-amber-800 dark:text-amber-200 mb-4">
                  Upload required business documents to verify your account and access financing opportunities.
                </p>
                <Link
                  href="/business/kyc"
                  className="inline-flex items-center px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-medium transition-colors"
                >
                  Complete KYC →
                </Link>
              </div>
            </div>
          </div>
        )}

        {profile.kycStatus === "in-review" && (
          <div className="mb-6 p-6 bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-xl">
            <div className="flex items-center gap-3">
              <span className="text-3xl">⏳</span>
              <div>
                <h3 className="font-bold text-lg text-blue-900 dark:text-blue-100">
                  KYC Under Review
                </h3>
                <p className="text-blue-800 dark:text-blue-200">
                  Your documents are being reviewed. You'll be notified within 2-3 business days.
                </p>
              </div>
            </div>
          </div>
        )}

        {profile.kycStatus === "verified" && !hasApprovedOpportunity && (
          <div className="mb-6 p-6 bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-800 rounded-xl">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xl">✓</span>
                </div>
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-lg text-green-900 dark:text-green-100 mb-2">
                  KYC Verified! Ready for Financing
                </h3>
                <p className="text-green-800 dark:text-green-200 mb-4">
                  Your business is verified. You can now apply for Shariah-compliant financing.
                </p>
                <Link
                  href="/business/financing/apply"
                  className="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
                >
                  Apply for Financing →
                </Link>
              </div>
            </div>
          </div>
        )}

        {profile.kycStatus === "rejected" && (
          <div className="mb-6 p-6 bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-xl">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xl">✕</span>
                </div>
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-lg text-red-900 dark:text-red-100 mb-2">
                  KYC Verification Failed
                </h3>
                <p className="text-red-800 dark:text-red-200 mb-2">
                  {profile.kycRejectionReason || "Some documents were not accepted."}
                </p>
                <Link
                  href="/business/kyc"
                  className="inline-flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
                >
                  Re-upload Documents →
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-neutral-900 rounded-xl p-6 border-2 border-neutral-200 dark:border-neutral-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-neutral-600 dark:text-neutral-400 text-sm font-medium">KYC Status</span>
              <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                profile.kycStatus === "verified" ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300" :
                profile.kycStatus === "in-review" ? "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300" :
                profile.kycStatus === "rejected" ? "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300" :
                "bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300"
              }`}>
                {profile.kycStatus}
              </span>
            </div>
            <p className="text-2xl font-bold text-neutral-900 dark:text-white">
              {profile.kycStatus === "verified" ? "Verified" : 
               profile.kycStatus === "in-review" ? "Under Review" :
               profile.kycStatus === "rejected" ? "Action Required" : "Incomplete"}
            </p>
          </div>

          <div className="bg-white dark:bg-neutral-900 rounded-xl p-6 border-2 border-neutral-200 dark:border-neutral-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-neutral-600 dark:text-neutral-400 text-sm font-medium">Financing Applications</span>
            </div>
            <p className="text-2xl font-bold text-neutral-900 dark:text-white">
              {applications.length}
            </p>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
              {hasActiveApplication ? "Active application pending" : "No active applications"}
            </p>
          </div>

          <div className="bg-white dark:bg-neutral-900 rounded-xl p-6 border-2 border-neutral-200 dark:border-neutral-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-neutral-600 dark:text-neutral-400 text-sm font-medium">Active Opportunities</span>
            </div>
            <p className="text-2xl font-bold text-neutral-900 dark:text-white">
              {opportunities.length}
            </p>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
              {opportunities.length > 0 ? `${opportunities.reduce((sum, opp) => sum + (opp.data.currentFunding || 0), 0).toLocaleString()} raised` : "No active opportunities"}
            </p>
          </div>
        </div>

        {/* Business Profile Card */}
        <div className="bg-white dark:bg-neutral-900 rounded-xl p-6 border-2 border-neutral-200 dark:border-neutral-800 mb-6">
          <div className="flex items-start justify-between mb-6">
            <h2 className="font-display font-bold text-xl text-neutral-900 dark:text-white">
              Business Profile
            </h2>
            <Link
              href="/business/profile/edit"
              className="text-secondary-600 dark:text-secondary-400 hover:underline text-sm font-medium"
            >
              Edit Profile
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-sm font-medium text-neutral-500 dark:text-neutral-400 block mb-1">
                Registration Number
              </label>
              <p className="text-neutral-900 dark:text-white">{profile.registrationNumber}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-neutral-500 dark:text-neutral-400 block mb-1">
                Industry
              </label>
              <p className="text-neutral-900 dark:text-white capitalize">{profile.industry}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-neutral-500 dark:text-neutral-400 block mb-1">
                Year Established
              </label>
              <p className="text-neutral-900 dark:text-white">{profile.yearEstablished}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-neutral-500 dark:text-neutral-400 block mb-1">
                Number of Employees
              </label>
              <p className="text-neutral-900 dark:text-white">{profile.numberOfEmployees}</p>
            </div>
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-neutral-500 dark:text-neutral-400 block mb-1">
                Business Address
              </label>
              <p className="text-neutral-900 dark:text-white">
                {profile.businessAddress}, {profile.city}, {profile.state}, {profile.country}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-neutral-500 dark:text-neutral-400 block mb-1">
                Contact Person
              </label>
              <p className="text-neutral-900 dark:text-white">
                {profile.contactPersonName} ({profile.contactPersonPosition})
              </p>
            </div>
          </div>
        </div>

        {/* Financing Applications */}
        {applications.length > 0 && (
          <div className="bg-white dark:bg-neutral-900 rounded-xl p-6 border-2 border-neutral-200 dark:border-neutral-800 mb-6">
            <h2 className="font-display font-bold text-xl text-neutral-900 dark:text-white mb-4">
              Financing Applications
            </h2>
            <div className="space-y-4">
              {applications.map((app) => (
                <div
                  key={app.key}
                  className="p-4 border border-neutral-200 dark:border-neutral-700 rounded-lg"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-neutral-900 dark:text-white">
                        {app.data.contractType.toUpperCase()} Financing
                      </h3>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400">
                        ₦{app.data.requestedAmount?.toLocaleString()} requested
                      </p>
                    </div>
                    <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                      app.data.status === "approved" ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300" :
                      app.data.status === "rejected" ? "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300" :
                      "bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300"
                    }`}>
                      {app.data.status}
                    </span>
                  </div>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-3">
                    {app.data.purpose}
                  </p>
                  <div className="flex gap-3">
                    <Link
                      href={`/business/financing/${app.key}`}
                      className="text-secondary-600 dark:text-secondary-400 hover:underline text-sm font-medium"
                    >
                      View Details
                    </Link>
                    {app.data.status === "approved" && (
                      <Link
                        href="/business/reporting"
                        className="text-secondary-600 dark:text-secondary-400 hover:underline text-sm font-medium"
                      >
                        Submit Report
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            href="/business/kyc"
            className="p-6 bg-white dark:bg-neutral-900 rounded-xl border-2 border-neutral-200 dark:border-neutral-800 hover:border-secondary-500 dark:hover:border-secondary-500 transition-colors"
          >
            <h3 className="font-bold text-lg text-neutral-900 dark:text-white mb-2">
              📋 KYC Documents
            </h3>
            <p className="text-neutral-600 dark:text-neutral-400 text-sm">
              View and manage your verification documents
            </p>
          </Link>

          {profile.kycStatus === "verified" && (
            <Link
              href="/business/financing/apply"
              className="p-6 bg-white dark:bg-neutral-900 rounded-xl border-2 border-neutral-200 dark:border-neutral-800 hover:border-secondary-500 dark:hover:border-secondary-500 transition-colors"
            >
              <h3 className="font-bold text-lg text-neutral-900 dark:text-white mb-2">
                💰 Apply for Financing
              </h3>
              <p className="text-neutral-600 dark:text-neutral-400 text-sm">
                Submit a new Shariah-compliant financing application
              </p>
            </Link>
          )}

          {opportunities.length > 0 && (
            <Link
              href="/business/reporting"
              className="p-6 bg-white dark:bg-neutral-900 rounded-xl border-2 border-neutral-200 dark:border-neutral-800 hover:border-secondary-500 dark:hover:border-secondary-500 transition-colors"
            >
              <h3 className="font-bold text-lg text-neutral-900 dark:text-white mb-2">
                📊 Submit Revenue Report
              </h3>
              <p className="text-neutral-600 dark:text-neutral-400 text-sm">
                Report your business revenue for profit distribution
              </p>
            </Link>
          )}

          <Link
            href="/business/profile/edit"
            className="p-6 bg-white dark:bg-neutral-900 rounded-xl border-2 border-neutral-200 dark:border-neutral-800 hover:border-secondary-500 dark:hover:border-secondary-500 transition-colors"
          >
            <h3 className="font-bold text-lg text-neutral-900 dark:text-white mb-2">
              ⚙️ Business Settings
            </h3>
            <p className="text-neutral-600 dark:text-neutral-400 text-sm">
              Update your business profile and settings
            </p>
          </Link>
        </div>
      </main>
    </div>
  );
}
