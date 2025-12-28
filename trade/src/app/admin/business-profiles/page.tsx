"use client";

import { ThemeToggle } from "@/components/theme-toggle";
import { AuthButton } from "@/components/auth-button";
import { initSatellite, onAuthStateChange, listDocs, setDoc, type Doc } from "@junobuild/core";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { BusinessProfile, BusinessKycDocument } from "@/schemas";
import { businessKycDocumentLabels, requiredBusinessKycDocuments } from "@/schemas";

type User = {
  key: string;
} | null | undefined;

export default function AdminBusinessProfilesPage() {
  const [user, setUser] = useState<User>(undefined);
  const [profiles, setProfiles] = useState<Doc<BusinessProfile>[]>([]);
  const [documents, setDocuments] = useState<Record<string, BusinessKycDocument[]>>({});
  const [loading, setLoading] = useState(true);
  const [selectedProfile, setSelectedProfile] = useState<Doc<BusinessProfile> | null>(null);
  const [showDocuments, setShowDocuments] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [processing, setProcessing] = useState(false);
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
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    if (!user) return;

    try {
      // Load all business profiles
      const profilesResult = await listDocs<BusinessProfile>({
        collection: "business_profiles",
      });

      setProfiles(profilesResult.items);

      // Load all KYC documents
      const docsResult = await listDocs<BusinessKycDocument>({
        collection: "business_kyc_documents",
      });

      // Group documents by business ID
      const grouped: Record<string, BusinessKycDocument[]> = {};
      docsResult.items.forEach((doc) => {
        const businessId = doc.data.businessId;
        if (!grouped[businessId]) {
          grouped[businessId] = [];
        }
        grouped[businessId].push(doc.data);
      });

      setDocuments(grouped);
    } catch (error) {
      console.error("Error loading data:", error);
    }
  };

  const handleVerifyKyc = async (profile: Doc<BusinessProfile>) => {
    setProcessing(true);

    try {
      const updatedProfile: BusinessProfile = {
        ...profile.data,
        kycStatus: "verified",
        kycVerifiedAt: new Date().toISOString(),
        kycRejectionReason: undefined,
        updatedAt: new Date().toISOString(),
      };

      await setDoc({
        collection: "business_profiles",
        doc: {
          key: profile.key,
          data: updatedProfile,
          version: profile.version,
        },
      });

      await loadData();
      setSelectedProfile(null);
      setShowDocuments(false);
      setProcessing(false);
    } catch (error) {
      console.error("Error verifying KYC:", error);
      setProcessing(false);
    }
  };

  const handleRejectKyc = async (profile: Doc<BusinessProfile>) => {
    if (!rejectionReason.trim()) {
      alert("Please provide a rejection reason");
      return;
    }

    setProcessing(true);

    try {
      const updatedProfile: BusinessProfile = {
        ...profile.data,
        kycStatus: "rejected",
        kycRejectionReason: rejectionReason,
        updatedAt: new Date().toISOString(),
      };

      await setDoc({
        collection: "business_profiles",
        doc: {
          key: profile.key,
          data: updatedProfile,
          version: profile.version,
        },
      });

      await loadData();
      setSelectedProfile(null);
      setShowDocuments(false);
      setRejectionReason("");
      setProcessing(false);
    } catch (error) {
      console.error("Error rejecting KYC:", error);
      setProcessing(false);
    }
  };

  const viewDocuments = (profile: Doc<BusinessProfile>) => {
    setSelectedProfile(profile);
    setShowDocuments(true);
    setRejectionReason("");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-primary-50/30 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950 flex items-center justify-center">
        <div className="text-neutral-600 dark:text-neutral-400">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const businessDocs = selectedProfile ? documents[selectedProfile.key] || [] : [];
  const uploadedTypes = businessDocs.map((d) => d.documentType);
  const allRequiredUploaded = requiredBusinessKycDocuments.every((t) => uploadedTypes.includes(t));

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

      {/* Header */}
      <header className="border-b border-neutral-200 dark:border-neutral-800 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-display font-bold text-xl text-neutral-900 dark:text-white">AmanaTrade Admin</h1>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">Business Profiles & KYC Management</p>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/admin/dashboard" className="text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white text-sm">
                Dashboard
              </Link>
              <Link href="/admin/business-applications" className="text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white text-sm">
                Financing Apps
              </Link>
              <AuthButton />
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-neutral-900 rounded-xl p-6 border-2 border-neutral-200 dark:border-neutral-800">
            <div className="text-sm text-neutral-600 dark:text-neutral-400 mb-1">Total Profiles</div>
            <div className="text-2xl font-bold text-neutral-900 dark:text-white">{profiles.length}</div>
          </div>
          <div className="bg-white dark:bg-neutral-900 rounded-xl p-6 border-2 border-neutral-200 dark:border-neutral-800">
            <div className="text-sm text-neutral-600 dark:text-neutral-400 mb-1">Pending KYC</div>
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              {profiles.filter((p) => p.data.kycStatus === "pending").length}
            </div>
          </div>
          <div className="bg-white dark:bg-neutral-900 rounded-xl p-6 border-2 border-neutral-200 dark:border-neutral-800">
            <div className="text-sm text-neutral-600 dark:text-neutral-400 mb-1">Under Review</div>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {profiles.filter((p) => p.data.kycStatus === "in-review").length}
            </div>
          </div>
          <div className="bg-white dark:bg-neutral-900 rounded-xl p-6 border-2 border-neutral-200 dark:border-neutral-800">
            <div className="text-sm text-neutral-600 dark:text-neutral-400 mb-1">Verified</div>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {profiles.filter((p) => p.data.kycStatus === "verified").length}
            </div>
          </div>
        </div>

        {/* Profiles List */}
        <div className="bg-white dark:bg-neutral-900 rounded-xl border-2 border-neutral-200 dark:border-neutral-800 overflow-hidden">
          <div className="p-6 border-b border-neutral-200 dark:border-neutral-800">
            <h2 className="font-display font-bold text-xl text-neutral-900 dark:text-white">
              Business Profiles
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-neutral-50 dark:bg-neutral-800/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase">
                    Business Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase">
                    Industry
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase">
                    Registration
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase">
                    KYC Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase">
                    Docs
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                {profiles.map((profile) => {
                  const profileDocs = documents[profile.key] || [];
                  const uploadedTypes = profileDocs.map((d) => d.documentType);
                  const hasAllRequired = requiredBusinessKycDocuments.every((t) => uploadedTypes.includes(t));

                  return (
                    <tr key={profile.key} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/30">
                      <td className="px-6 py-4">
                        <div className="font-medium text-neutral-900 dark:text-white">
                          {profile.data.businessName}
                        </div>
                        <div className="text-sm text-neutral-500 dark:text-neutral-400">
                          {profile.data.businessEmail}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-neutral-600 dark:text-neutral-400 capitalize">
                        {profile.data.industry}
                      </td>
                      <td className="px-6 py-4 text-sm text-neutral-600 dark:text-neutral-400">
                        {profile.data.registrationNumber}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 text-xs font-medium rounded-full ${
                            profile.data.kycStatus === "verified"
                              ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300"
                              : profile.data.kycStatus === "in-review"
                              ? "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300"
                              : profile.data.kycStatus === "rejected"
                              ? "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300"
                              : "bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300"
                          }`}
                        >
                          {profile.data.kycStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className={hasAllRequired ? "text-green-600 dark:text-green-400" : "text-amber-600 dark:text-amber-400"}>
                          {profileDocs.length} / {requiredBusinessKycDocuments.length}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => viewDocuments(profile)}
                          className="text-primary-600 dark:text-primary-400 hover:underline text-sm font-medium"
                        >
                          Review
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Documents Modal */}
      {showDocuments && selectedProfile && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-neutral-900 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border-2 border-neutral-200 dark:border-neutral-800">
            <div className="p-6 border-b border-neutral-200 dark:border-neutral-800 sticky top-0 bg-white dark:bg-neutral-900 z-10">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="font-display font-bold text-xl text-neutral-900 dark:text-white">
                    {selectedProfile.data.businessName}
                  </h2>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    KYC Documents Review
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowDocuments(false);
                    setSelectedProfile(null);
                  }}
                  className="text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Profile Info */}
              <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-neutral-500 dark:text-neutral-400">Registration:</span>
                    <span className="ml-2 text-neutral-900 dark:text-white">{selectedProfile.data.registrationNumber}</span>
                  </div>
                  <div>
                    <span className="text-neutral-500 dark:text-neutral-400">Industry:</span>
                    <span className="ml-2 text-neutral-900 dark:text-white capitalize">{selectedProfile.data.industry}</span>
                  </div>
                  <div>
                    <span className="text-neutral-500 dark:text-neutral-400">Established:</span>
                    <span className="ml-2 text-neutral-900 dark:text-white">{selectedProfile.data.yearEstablished}</span>
                  </div>
                  <div>
                    <span className="text-neutral-500 dark:text-neutral-400">Employees:</span>
                    <span className="ml-2 text-neutral-900 dark:text-white">{selectedProfile.data.numberOfEmployees}</span>
                  </div>
                </div>
              </div>

              {/* Documents */}
              <div>
                <h3 className="font-semibold text-neutral-900 dark:text-white mb-3">Uploaded Documents</h3>
                {businessDocs.length === 0 ? (
                  <p className="text-neutral-500 dark:text-neutral-400 text-sm">No documents uploaded</p>
                ) : (
                  <div className="space-y-2">
                    {businessDocs.map((doc, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 border border-neutral-200 dark:border-neutral-700 rounded-lg"
                      >
                        <div className="flex-1">
                          <div className="font-medium text-neutral-900 dark:text-white text-sm">
                            {businessKycDocumentLabels[doc.documentType]}
                            {requiredBusinessKycDocuments.includes(doc.documentType) && (
                              <span className="ml-2 text-red-500">*</span>
                            )}
                          </div>
                          <div className="text-xs text-neutral-500 dark:text-neutral-400">
                            {doc.fileName} • {(doc.fileSize / 1024).toFixed(0)}KB
                          </div>
                        </div>
                        <a
                          href={doc.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary-600 dark:text-primary-400 hover:underline text-sm"
                        >
                          View
                        </a>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Required Documents Checklist */}
              <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-lg p-4">
                <h4 className="font-medium text-neutral-900 dark:text-white mb-3">Required Documents</h4>
                <div className="grid grid-cols-2 gap-2">
                  {requiredBusinessKycDocuments.map((type) => {
                    const isUploaded = uploadedTypes.includes(type);
                    return (
                      <div key={type} className="flex items-center gap-2">
                        <span className={`text-sm ${isUploaded ? "text-green-600 dark:text-green-400" : "text-neutral-500 dark:text-neutral-400"}`}>
                          {isUploaded ? "✓" : "○"}
                        </span>
                        <span className={`text-xs ${isUploaded ? "text-neutral-900 dark:text-white" : "text-neutral-600 dark:text-neutral-400"}`}>
                          {businessKycDocumentLabels[type]}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Rejection Reason Input */}
              {selectedProfile.data.kycStatus === "in-review" && (
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    Rejection Reason (if rejecting)
                  </label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    rows={3}
                    placeholder="Provide reason for rejection"
                    className="w-full px-4 py-2 border-2 border-neutral-300 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white text-sm"
                  />
                </div>
              )}

              {/* Actions */}
              {selectedProfile.data.kycStatus === "in-review" && (
                <div className="flex justify-end gap-3 pt-4 border-t border-neutral-200 dark:border-neutral-800">
                  <button
                    onClick={() => handleRejectKyc(selectedProfile)}
                    disabled={processing || !allRequiredUploaded}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  >
                    {processing ? "Processing..." : "Reject KYC"}
                  </button>
                  <button
                    onClick={() => handleVerifyKyc(selectedProfile)}
                    disabled={processing || !allRequiredUploaded}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  >
                    {processing ? "Processing..." : "Verify KYC"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
