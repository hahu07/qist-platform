"use client";

import { ThemeToggle } from "@/components/theme-toggle";
import { AuthButton } from "@/components/auth-button";
import { initSatellite, onAuthStateChange, listDocs, type Doc } from "@junobuild/core";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { BusinessProfile, ApplicationData, OpportunityFormData } from "@/schemas";
import { logger } from "@/utils/logger";
import { ApplicationTimeline } from "@/components/application-timeline";
import { QuickStatsWidget } from "@/components/quick-stats-widget";
import { RejectionHistoryView } from "@/components/rejection-history-view";

type User = {
  key: string;
} | null | undefined;

export default function BusinessDashboardV2() {
  const [user, setUser] = useState<User>(undefined);
  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  const [application, setApplication] = useState<Doc<ApplicationData> | null>(null);
  const [opportunity, setOpportunity] = useState<Doc<OpportunityFormData> | null>(null);
  const [loading, setLoading] = useState(true);
  const [authInitialized, setAuthInitialized] = useState(false);
  const router = useRouter();

  useEffect(() => {
    (async () => {
      await initSatellite({ workers: { auth: true } });
      setAuthInitialized(true);
    })();
  }, []);

  useEffect(() => {
    if (!authInitialized) return;
    
    const unsubscribe = onAuthStateChange((authUser) => {
      setUser(authUser);
      setLoading(false);
      
      // Only redirect if auth check is complete and user is null (not undefined)
      if (authUser === null) {
        router.push("/auth/signin");
      }
    });

    return () => unsubscribe();
  }, [authInitialized, router]);

  useEffect(() => {
    if (user) {
      loadBusinessData();
    }
  }, [user]);

  const loadBusinessData = async () => {
    if (!user) return;

    try {
      // Load business profile from Juno
      const profilesResult = await listDocs<BusinessProfile>({
        collection: "business_profiles",
      });

      const userProfile = profilesResult.items.find((doc) => doc.key === user.key);

      if (!userProfile) {
        router.push("/business/onboarding/profile");
        return;
      }

      setProfile(userProfile.data);

      // Load financing application (optional)
      try {
        const applicationsResult = await listDocs<ApplicationData>({
          collection: "business_applications",
        });

        // Find all user applications and get the most recent one
        const userApps = applicationsResult.items.filter(
          (doc) => doc.key.startsWith(user.key) || doc.owner === user.key
        );

        // Sort by key (which includes timestamp) to get the latest
        const userApp = userApps.sort((a, b) => b.key.localeCompare(a.key))[0] || null;

        if (userApp) {
          logger.log("Found application:", userApp);
          logger.log("Documents submitted:", userApp.data.documentsSubmitted);
          logger.log("Documents:", userApp.data.documents);
        } else {
          logger.log("No application found for user");
        }

        setApplication(userApp || null);

        // Load opportunity if approved
        if (userApp && userApp.data.status === "approved") {
          const opportunitiesResult = await listDocs<OpportunityFormData>({
            collection: "opportunities",
          });

          const businessOpp = opportunitiesResult.items.find(
            (opp) => opp.data.applicationId === userApp.key
          );

          setOpportunity(businessOpp || null);
        }
      } catch (error) {
        logger.log("No financing application found");
      }
    } catch (error) {
      logger.error("Error loading business data:", error);
    }
  };

  const getKycStatusColor = (status: string) => {
    switch (status) {
      case "verified":
        return "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-300 dark:border-green-700";
      case "in-review":
        return "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-700";
      case "rejected":
        return "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-red-300 dark:border-red-700";
      default:
        return "bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-700";
    }
  };

  const getKycStatusText = (status: string) => {
    switch (status) {
      case "verified":
        return "KYC Verified";
      case "in-review":
        return "Pending KYC Approval";
      case "rejected":
        return "KYC Rejected";
      default:
        return "KYC Pending";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-primary-50/30 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-neutral-600 dark:text-neutral-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user || !profile) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-primary-50/30 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950">
      {/* Header */}
      <header className="border-b border-neutral-200 dark:border-neutral-800 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary-600 dark:bg-primary-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">A</span>
              </div>
              <span className="font-display font-bold text-xl text-neutral-900 dark:text-white">
                AmanaTrade
              </span>
            </Link>
            <div className="flex items-center gap-4">
              <AuthButton />
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-white mb-2">
            Welcome, {profile.businessName}
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400">
            Manage your business profile and financing applications
          </p>
        </div>

        {/* KYC Status Alert */}
        {profile.kycDocumentsUploaded && profile.kycStatus === "pending" && (
          <div className="mb-6 bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-200 dark:border-amber-800 rounded-xl p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-amber-900 dark:text-amber-200 mb-2">
                  Submit Your KYC Documents
                </h3>
                <p className="text-amber-800 dark:text-amber-300 mb-4">
                  You have uploaded KYC documents but haven't submitted them for review yet. Submit now to complete your verification.
                </p>
                <Link
                  href="/business/kyc"
                  className="inline-flex items-center px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg transition-colors"
                >
                  Submit KYC Documents →
                </Link>
              </div>
            </div>
          </div>
        )}

        {profile.kycStatus === "in-review" && (
          <div className="mb-6 bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-xl p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-blue-900 dark:text-blue-200 mb-2">
                  Pending KYC Approval
                </h3>
                <p className="text-blue-800 dark:text-blue-300">
                  Your KYC documents are under review. We'll notify you once the verification is complete. This typically takes 2-3 business days.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Dashboard Grid */}
        <div className="mb-6">
          <QuickStatsWidget 
            application={application?.data || null}
            submittedAt={application?.created_at ? new Date(Number(application.created_at) / 1000000).toISOString() : undefined}
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Business Information Card */}
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border-2 border-neutral-200 dark:border-neutral-800 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-neutral-900 dark:text-white">Business Information</h2>
              <span className={`px-3 py-1 rounded-lg text-sm font-semibold border-2 ${getKycStatusColor(profile.kycStatus)}`}>
                {getKycStatusText(profile.kycStatus)}
              </span>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm text-neutral-600 dark:text-neutral-400">Business Name</label>
                <p className="font-semibold text-neutral-900 dark:text-white">{profile.businessName}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-neutral-600 dark:text-neutral-400">Industry</label>
                  <p className="font-semibold text-neutral-900 dark:text-white capitalize">{profile.industry}</p>
                </div>
                <div>
                  <label className="text-sm text-neutral-600 dark:text-neutral-400">Business Type</label>
                  <p className="font-semibold text-neutral-900 dark:text-white capitalize">
                    {profile.businessType.replace(/-/g, ' ')}
                  </p>
                </div>
              </div>

              <div>
                <label className="text-sm text-neutral-600 dark:text-neutral-400">Registration Number</label>
                <p className="font-semibold text-neutral-900 dark:text-white">{profile.registrationNumber}</p>
              </div>

              <div>
                <label className="text-sm text-neutral-600 dark:text-neutral-400">Contact Email</label>
                <p className="font-semibold text-neutral-900 dark:text-white">{profile.businessEmail}</p>
              </div>

              <div>
                <label className="text-sm text-neutral-600 dark:text-neutral-400">Phone Number</label>
                <p className="font-semibold text-neutral-900 dark:text-white">{profile.businessPhone}</p>
              </div>

              <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800">
                <Link
                  href="/business/onboarding/profile"
                  className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium text-sm"
                >
                  Edit Business Profile →
                </Link>
              </div>
            </div>
          </div>

          {/* Financing Status Card */}
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border-2 border-neutral-200 dark:border-neutral-800 p-6">
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-6">Financing Status</h2>

            {!application ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-primary-600 dark:text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-2">No Financing Application</h3>
                <p className="text-neutral-600 dark:text-neutral-400 mb-6">
                  You haven't applied for financing yet. Apply now to access Sharia-compliant funding.
                </p>
                {profile.kycStatus === "verified" ? (
                  <Link
                    href="/business/financing/apply"
                    className="inline-flex items-center px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg transition-colors shadow-lg"
                  >
                    Apply for Financing →
                  </Link>
                ) : (
                  <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                    <p className="text-sm text-amber-800 dark:text-amber-300">
                      Complete your KYC verification to apply for financing
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-5">
                {/* Application Timeline */}
                <ApplicationTimeline 
                  application={application.data} 
                  submittedAt={application.created_at ? new Date(Number(application.created_at) / 1000000).toISOString() : undefined}
                />
                
                {/* Rejection History (if rejected) */}
                {application.data.status === 'rejected' && (
                  <RejectionHistoryView application={application} />
                )}
                
                <div>
                  <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-2 block">Application Status</label>
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-semibold capitalize" style={{
                    backgroundColor: application.data.status === 'approved' ? 'rgb(220 252 231)' : 
                                   application.data.status === 'pending' ? 'rgb(254 249 195)' :
                                   application.data.status === 'more-info' ? 'rgb(254 243 199)' :
                                   application.data.status === 'rejected' ? 'rgb(254 226 226)' : 'rgb(243 244 246)',
                    color: application.data.status === 'approved' ? 'rgb(21 128 61)' : 
                          application.data.status === 'pending' ? 'rgb(161 98 7)' :
                          application.data.status === 'more-info' ? 'rgb(146 64 14)' :
                          application.data.status === 'rejected' ? 'rgb(185 28 28)' : 'rgb(55 65 81)'
                  }}>
                    <span className="w-2 h-2 rounded-full" style={{
                      backgroundColor: application.data.status === 'approved' ? 'rgb(34 197 94)' : 
                                     application.data.status === 'pending' ? 'rgb(234 179 8)' :
                                     application.data.status === 'more-info' ? 'rgb(249 115 22)' :
                                     application.data.status === 'rejected' ? 'rgb(239 68 68)' : 'rgb(107 114 128)'
                    }}></span>
                    {application.data.status.replace(/-/g, ' ')}
                  </div>
                </div>

                {/* Admin Message for More Info Request */}
                {application.data.status === 'more-info' && application.data.adminMessage && (
                  <div className="relative overflow-hidden bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-l-4 border-amber-500 dark:border-amber-600 rounded-xl p-5 shadow-sm">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-amber-400/10 dark:bg-amber-400/5 rounded-full -mr-16 -mt-16"></div>
                    <div className="relative flex items-start gap-4">
                      <div className="flex-shrink-0 w-10 h-10 bg-amber-100 dark:bg-amber-900/40 rounded-lg flex items-center justify-center">
                        <svg className="w-6 h-6 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="text-base font-bold text-amber-900 dark:text-amber-200">Action Required</h4>
                          <span className="px-2 py-0.5 text-xs font-medium bg-amber-200 dark:bg-amber-800 text-amber-800 dark:text-amber-200 rounded-full">Review Needed</span>
                        </div>
                        <p className="text-sm text-amber-800 dark:text-amber-300 leading-relaxed mb-4">{application.data.adminMessage}</p>
                        <Link
                          href="/business/financing/apply"
                          className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white text-sm font-semibold rounded-lg transition-all shadow-sm hover:shadow-md"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          Resubmit Application
                        </Link>
                      </div>
                    </div>
                  </div>
                )}

                {/* Rejection Notice with Resubmit Option */}
                {application.data.status === 'rejected' && (
                  <div className={`relative overflow-hidden border-l-4 rounded-xl p-5 shadow-sm ${
                    application.data.rejectionAllowsResubmit === false
                      ? 'bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-900/30 border-red-500 dark:border-red-600'
                      : 'bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 border-orange-500 dark:border-orange-600'
                  }`}>
                    <div className={`absolute top-0 right-0 w-32 h-32 rounded-full -mr-16 -mt-16 ${
                      application.data.rejectionAllowsResubmit === false
                        ? 'bg-red-400/10 dark:bg-red-400/5'
                        : 'bg-orange-400/10 dark:bg-orange-400/5'
                    }`}></div>
                    <div className="relative flex items-start gap-4">
                      <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${
                        application.data.rejectionAllowsResubmit === false
                          ? 'bg-red-100 dark:bg-red-900/40'
                          : 'bg-orange-100 dark:bg-orange-900/40'
                      }`}>
                        <svg className={`w-6 h-6 ${
                          application.data.rejectionAllowsResubmit === false
                            ? 'text-red-600 dark:text-red-400'
                            : 'text-orange-600 dark:text-orange-400'
                        }`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className={`text-base font-bold ${
                            application.data.rejectionAllowsResubmit === false
                              ? 'text-red-900 dark:text-red-200'
                              : 'text-orange-900 dark:text-orange-200'
                          }`}>
                            {application.data.rejectionAllowsResubmit === false 
                              ? 'Application Permanently Rejected' 
                              : 'Application Rejected'}
                          </h4>
                          {application.data.rejectionAllowsResubmit !== false && (
                            <span className="px-2 py-0.5 text-xs font-medium bg-orange-200 dark:bg-orange-800 text-orange-800 dark:text-orange-200 rounded-full">
                              Can Resubmit
                            </span>
                          )}
                        </div>
                        
                        {(application.data.rejectionReason || application.data.adminMessage) && (
                          <div className="mb-4">
                            <p className={`text-sm font-semibold mb-1 ${
                              application.data.rejectionAllowsResubmit === false
                                ? 'text-red-800 dark:text-red-300'
                                : 'text-orange-800 dark:text-orange-300'
                            }`}>
                              Rejection Reason:
                            </p>
                            <div className={`text-sm leading-relaxed space-y-1 ${
                              application.data.rejectionAllowsResubmit === false
                                ? 'text-red-800 dark:text-red-300'
                                : 'text-orange-800 dark:text-orange-300'
                            }`}>
                              {application.data.rejectionReason && (
                                <p>{application.data.rejectionReason}</p>
                              )}
                              {application.data.adminMessage && application.data.rejectionReason !== application.data.adminMessage && (
                                <p>{application.data.adminMessage}</p>
                              )}
                              {!application.data.rejectionReason && application.data.adminMessage && (
                                <p>{application.data.adminMessage}</p>
                              )}
                            </div>
                          </div>
                        )}
                        
                        {application.data.rejectionAllowsResubmit === false ? (
                          <div className="bg-red-100 dark:bg-red-900/30 rounded-lg p-3 border border-red-200 dark:border-red-800">
                            <p className="text-xs text-red-800 dark:text-red-300 leading-relaxed">
                              🚫 This application cannot be resubmitted due to eligibility issues. Please contact support if you believe this is an error or need assistance.
                            </p>
                          </div>
                        ) : (
                          <>
                            <p className="text-sm text-orange-800 dark:text-orange-300 leading-relaxed mb-4">
                              ✓ You can address the concerns mentioned above and resubmit your application with the necessary corrections.
                            </p>
                            <Link
                              href="/business/financing/apply"
                              className="inline-flex items-center gap-2 px-5 py-2.5 bg-orange-600 hover:bg-orange-700 active:bg-orange-800 text-white text-sm font-semibold rounded-lg transition-all shadow-sm hover:shadow-md"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                              </svg>
                              Edit & Resubmit Application
                            </Link>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {application.data.contractType && (
                    <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-lg p-4 border border-neutral-200 dark:border-neutral-700">
                      <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-2 block">Contract Type</label>
                      <p className="text-lg font-bold text-neutral-900 dark:text-white capitalize">
                        {application.data.contractType}
                      </p>
                    </div>
                  )}

                  {application.data.requestedAmount && (
                    <div className="bg-primary-50 dark:bg-primary-900/20 rounded-lg p-4 border border-primary-200 dark:border-primary-800">
                      <label className="text-xs font-medium text-primary-600 dark:text-primary-400 uppercase tracking-wider mb-2 block">Requested Amount</label>
                      <p className="text-2xl font-bold text-primary-900 dark:text-primary-100">
                        ₦{application.data.requestedAmount.toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>

                {application.data.fundingPurpose && (
                  <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-lg p-4 border border-neutral-200 dark:border-neutral-700">
                    <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-2 block">Funding Purpose</label>
                    <p className="text-sm leading-relaxed text-neutral-900 dark:text-white">{application.data.fundingPurpose}</p>
                  </div>
                )}

                {/* Submitted Documents */}
                {application.data.documents && (
                  <div className="pt-5 border-t-2 border-neutral-200 dark:border-neutral-800">
                    <div className="flex items-center gap-2 mb-4">
                      <svg className="w-5 h-5 text-primary-600 dark:text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <h3 className="text-sm font-bold text-neutral-900 dark:text-white uppercase tracking-wider">Submitted Documents</h3>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {(() => {
                        const docs = application.data.documents;
                        if (typeof docs === 'object' && !Array.isArray(docs)) {
                          return (
                            <>
                              {docs.bankStatements && docs.bankStatements.length > 0 && (
                                <div className="flex items-center gap-3 p-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg">
                                  <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <svg className="w-4 h-4 text-primary-600 dark:text-primary-400" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-neutral-900 dark:text-white">Bank Statements</p>
                                    <p className="text-xs text-neutral-500 dark:text-neutral-400">{docs.bankStatements.length} file(s)</p>
                                  </div>
                                </div>
                              )}
                              {docs.directorsPhotos && docs.directorsPhotos.length > 0 && (
                                <div className="flex items-center gap-3 p-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg">
                                  <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <svg className="w-4 h-4 text-primary-600 dark:text-primary-400" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-neutral-900 dark:text-white">Directors Photos</p>
                                    <p className="text-xs text-neutral-500 dark:text-neutral-400">{docs.directorsPhotos.length} file(s)</p>
                                  </div>
                                </div>
                              )}
                              {docs.auditedStatements && docs.auditedStatements.length > 0 && (
                                <div className="flex items-center gap-3 p-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg">
                                  <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <svg className="w-4 h-4 text-primary-600 dark:text-primary-400" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-neutral-900 dark:text-white">Audited Statements</p>
                                    <p className="text-xs text-neutral-500 dark:text-neutral-400">{docs.auditedStatements.length} file(s)</p>
                                  </div>
                                </div>
                              )}
                              {docs.directorsIDs && docs.directorsIDs.length > 0 && (
                                <div className="flex items-center gap-3 p-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg">
                                  <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <svg className="w-4 h-4 text-primary-600 dark:text-primary-400" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-neutral-900 dark:text-white">Directors IDs</p>
                                    <p className="text-xs text-neutral-500 dark:text-neutral-400">{docs.directorsIDs.length} file(s)</p>
                                  </div>
                                </div>
                              )}
                              {docs.collateralDocuments && docs.collateralDocuments.length > 0 && (
                                <div className="flex items-center gap-3 p-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg">
                                  <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <svg className="w-4 h-4 text-primary-600 dark:text-primary-400" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-neutral-900 dark:text-white">Collateral Documents</p>
                                    <p className="text-xs text-neutral-500 dark:text-neutral-400">{docs.collateralDocuments.length} file(s)</p>
                                  </div>
                                </div>
                              )}
                            </>
                          );
                        }
                        return <p className="text-neutral-600 dark:text-neutral-400 text-xs">No documents available</p>;
                      })()}
                    </div>
                  </div>
                )}

                {opportunity && (
                  <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800">
                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                      <p className="text-sm font-semibold text-green-800 dark:text-green-300 mb-1">
                        🎉 Funding Approved!
                      </p>
                      <p className="text-xs text-green-700 dark:text-green-400">
                        Your application has been approved and is now available for investment.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Quick Actions Card */}
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border-2 border-neutral-200 dark:border-neutral-800 p-6 lg:col-span-2">
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-6">Quick Actions</h2>
            
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Link
                href="/business/kyc"
                prefetch={false}
                className="flex items-center gap-3 p-4 border-2 border-neutral-200 dark:border-neutral-800 rounded-xl hover:border-primary-300 dark:hover:border-primary-700 hover:bg-primary-50/50 dark:hover:bg-primary-900/10 transition-colors"
              >
                <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-primary-600 dark:text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-neutral-900 dark:text-white text-sm">KYC Documents</p>
                  <p className="text-xs text-neutral-600 dark:text-neutral-400">Manage documents</p>
                </div>
              </Link>

              {profile.kycStatus === "verified" && !application && (
                <Link
                  href="/business/financing/apply"
                  className="flex items-center gap-3 p-4 border-2 border-neutral-200 dark:border-neutral-800 rounded-xl hover:border-primary-300 dark:hover:border-primary-700 hover:bg-primary-50/50 dark:hover:bg-primary-900/10 transition-colors"
                >
                  <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-primary-600 dark:text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-neutral-900 dark:text-white text-sm">Apply for Financing</p>
                    <p className="text-xs text-neutral-600 dark:text-neutral-400">Get funding</p>
                  </div>
                </Link>
              )}

              <Link
                href="/business/reporting"
                className="flex items-center gap-3 p-4 border-2 border-neutral-200 dark:border-neutral-800 rounded-xl hover:border-primary-300 dark:hover:border-primary-700 hover:bg-primary-50/50 dark:hover:bg-primary-900/10 transition-colors"
              >
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-neutral-900 dark:text-white text-sm">Financial Reports</p>
                  <p className="text-xs text-neutral-600 dark:text-neutral-400">Submit reports</p>
                </div>
              </Link>

              <Link
                href="/business/messages"
                className="flex items-center gap-3 p-4 border-2 border-neutral-200 dark:border-neutral-800 rounded-xl hover:border-primary-300 dark:hover:border-primary-700 hover:bg-primary-50/50 dark:hover:bg-primary-900/10 transition-colors"
              >
                <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-neutral-900 dark:text-white text-sm">Platform Messages</p>
                  <p className="text-xs text-neutral-600 dark:text-neutral-400">View messages</p>
                </div>
              </Link>

              <Link
                href="/business/onboarding/profile"
                className="flex items-center gap-3 p-4 border-2 border-neutral-200 dark:border-neutral-800 rounded-xl hover:border-primary-300 dark:hover:border-primary-700 hover:bg-primary-50/50 dark:hover:bg-primary-900/10 transition-colors"
              >
                <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-primary-600 dark:text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-neutral-900 dark:text-white text-sm">Edit Profile</p>
                  <p className="text-xs text-neutral-600 dark:text-neutral-400">Update details</p>
                </div>
              </Link>

              <Link
                href="/opportunities"
                className="flex items-center gap-3 p-4 border-2 border-neutral-200 dark:border-neutral-800 rounded-xl hover:border-primary-300 dark:hover:border-primary-700 hover:bg-primary-50/50 dark:hover:bg-primary-900/10 transition-colors"
              >
                <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-primary-600 dark:text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-neutral-900 dark:text-white text-sm">Browse Opportunities</p>
                  <p className="text-xs text-neutral-600 dark:text-neutral-400">View listings</p>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
