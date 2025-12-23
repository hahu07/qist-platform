"use client";

import { ThemeToggle } from "@/components/theme-toggle";
import { AuthButton } from "@/components/auth-button";
import { initSatellite, onAuthStateChange, uploadFile, setDoc, listDocs, type Doc } from "@junobuild/core";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  businessKycDocumentTypes, 
  requiredBusinessKycDocuments, 
  businessKycDocumentLabels,
  type BusinessProfile,
  type BusinessKycDocument,
  type BusinessKycDocumentType
} from "@/schemas";

type User = {
  key: string;
} | null | undefined;

export default function BusinessKycPage() {
  const [user, setUser] = useState<User>(undefined);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [profile, setProfile] = useState<Doc<BusinessProfile> | null>(null);
  const [documents, setDocuments] = useState<BusinessKycDocument[]>([]);
  const [error, setError] = useState("");
  const [uploadType, setUploadType] = useState<BusinessKycDocumentType>("business-registration-certificate");
  const router = useRouter();

  useEffect(() => {
    (async () => {
      await initSatellite({ workers: { auth: true } });
    })();
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
      loadProfileAndDocuments();
    }
  }, [user]);

  const loadProfileAndDocuments = async () => {
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

      setProfile(userProfile);

      // Load existing KYC documents
      try {
        const docsResult = await listDocs<BusinessKycDocument>({
          collection: "business_kyc_documents",
        });

        const userDocs = docsResult.items
          .filter((doc) => doc.data.businessId === user.key)
          .map((doc) => doc.data);

        setDocuments(userDocs);
      } catch (docError: any) {
        if (!docError?.message?.includes("not_found")) {
          console.error("Error loading documents:", docError);
        }
      }
    } catch (error) {
      console.error("Error loading profile:", error);
      setError("Failed to load business profile");
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !user || !profile) return;

    const file = e.target.files[0];

    // Validate file size (5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setError(`File size must be less than 5MB. Your file is ${(file.size / 1024 / 1024).toFixed(2)}MB`);
      return;
    }

    // Validate file type
    const allowedTypes = ["application/pdf", "image/jpeg", "image/jpg", "image/png"];
    if (!allowedTypes.includes(file.type)) {
      setError("Only PDF, JPG, and PNG files are allowed");
      return;
    }

    setUploading(true);
    setError("");

    try {
      // Upload file to Juno Storage
      const result = await uploadFile({
        collection: "business_kyc_files",
        data: file,
      });

      // Save document metadata
      const docMetadata: BusinessKycDocument = {
        businessId: user.key,
        documentType: uploadType,
        fileName: file.name,
        fileUrl: result.downloadUrl,
        fileSize: file.size,
        mimeType: file.type,
        uploadedAt: new Date().toISOString(),
        status: "pending",
      };

      await setDoc({
        collection: "business_kyc_documents",
        doc: {
          key: `${user.key}_${uploadType}_${Date.now()}`,
          data: docMetadata,
        },
      });

      // Refresh documents list
      await loadProfileAndDocuments();

      // Reset upload type to next required document
      const uploadedTypes = [...documents.map(d => d.documentType), uploadType];
      const nextRequired = requiredBusinessKycDocuments.find(t => !uploadedTypes.includes(t));
      if (nextRequired) {
        setUploadType(nextRequired);
      }

      setUploading(false);
    } catch (err: any) {
      console.error("Upload error:", err);
      setError(err.message || "Failed to upload document");
      setUploading(false);
    }
  };

  const handleSaveForLater = async () => {
    if (!user || !profile) return;

    setSubmitting(true);
    setError("");

    try {
      // Update profile to mark documents as uploaded but not submitted
      const updatedProfile: BusinessProfile = {
        ...profile.data,
        kycDocumentsUploaded: true,
        updatedAt: new Date().toISOString(),
      };

      await setDoc({
        collection: "business_profiles",
        doc: {
          key: user.key,
          data: updatedProfile,
          version: profile.version,
        },
      });

      // Redirect to success page
      router.push("/business/kyc/saved");
    } catch (err: any) {
      console.error("Save error:", err);
      setError(err.message || "Failed to save progress");
      setSubmitting(false);
    }
  };

  const handleSubmitForReview = async () => {
    if (!user || !profile) return;

    // Check if all required documents are uploaded
    const uploadedTypes = documents.map(d => d.documentType);
    const missingDocs = requiredBusinessKycDocuments.filter(t => !uploadedTypes.includes(t));

    if (missingDocs.length > 0) {
      setError(`Please upload the following required documents: ${missingDocs.map(t => businessKycDocumentLabels[t]).join(", ")}`);
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      // Update profile KYC status
      const updatedProfile: BusinessProfile = {
        ...profile.data,
        kycStatus: "in-review",
        kycDocumentsUploaded: true,
        kycSubmittedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await setDoc({
        collection: "business_profiles",
        doc: {
          key: user.key,
          data: updatedProfile,
          version: profile.version,
        },
      });

      // Redirect to success page
      router.push("/business/kyc/submitted");
    } catch (err: any) {
      console.error("Submit error:", err);
      setError(err.message || "Failed to submit for review");
      setSubmitting(false);
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

  const uploadedTypes = documents.map(d => d.documentType);
  const allRequiredUploaded = requiredBusinessKycDocuments.every(t => uploadedTypes.includes(t));
  const canSubmit = allRequiredUploaded && profile.data.kycStatus === "pending";

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-secondary-50/30 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950">
      {/* Header */}
      <header className="border-b border-neutral-200 dark:border-neutral-800 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-secondary-600 dark:bg-secondary-500 rounded-lg flex items-center justify-center">
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
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="font-display font-bold text-3xl text-neutral-900 dark:text-white mb-2">
            Business KYC Verification
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400">
            Upload required documents for {profile.data.businessName}
          </p>
        </div>

        {/* Status Banner */}
        {profile.data.kycStatus === "in-review" && (
          <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-200 dark:border-amber-800 rounded-lg">
            <p className="text-amber-800 dark:text-amber-300 font-medium">
              📋 Documents submitted for review. You will be notified once verification is complete.
            </p>
          </div>
        )}

        {profile.data.kycStatus === "verified" && (
          <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-800 rounded-lg">
            <p className="text-green-800 dark:text-green-300 font-medium">
              ✅ KYC Verified! You can now access all platform features.
            </p>
          </div>
        )}

        {profile.data.kycStatus === "rejected" && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-800 dark:text-red-300 font-medium">
              ❌ KYC Rejected: {profile.data.kycRejectionReason || "Please re-upload correct documents"}
            </p>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
          </div>
        )}

        {/* Upload Section */}
        <div className="bg-white dark:bg-neutral-900 rounded-xl p-6 border-2 border-neutral-200 dark:border-neutral-800 mb-6">
          <h2 className="font-display font-bold text-xl text-neutral-900 dark:text-white mb-4">
            Upload Documents
          </h2>

          <div className="mb-4 flex flex-wrap gap-2">
            <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-xs font-medium rounded-full">
              PDF, JPG, PNG accepted
            </span>
            <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-xs font-medium rounded-full">
              Max 5MB per file
            </span>
            <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-xs font-medium rounded-full">
              2-3 business days review
            </span>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                Select Document Type
              </label>
              <select
                value={uploadType}
                onChange={(e) => setUploadType(e.target.value as BusinessKycDocumentType)}
                disabled={uploading || profile.data.kycStatus !== "pending"}
                className="w-full px-4 py-2 border-2 border-neutral-300 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-secondary-500 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white disabled:opacity-50"
              >
                {/* Required Documents First */}
                <optgroup label="Required Documents">
                  {requiredBusinessKycDocuments.map((type) => (
                    <option key={type} value={type}>
                      {businessKycDocumentLabels[type]} *
                    </option>
                  ))}
                </optgroup>
                
                {/* Optional Documents */}
                <optgroup label="Optional Documents">
                  {Object.keys(businessKycDocumentLabels)
                    .filter((type) => !requiredBusinessKycDocuments.includes(type as BusinessKycDocumentType))
                    .map((type) => (
                      <option key={type} value={type}>
                        {businessKycDocumentLabels[type as BusinessKycDocumentType]}
                      </option>
                    ))}
                </optgroup>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                Choose File
              </label>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileUpload}
                disabled={uploading || profile.data.kycStatus !== "pending"}
                className="w-full px-4 py-2 border-2 border-neutral-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white disabled:opacity-50"
              />
              {uploading && (
                <p className="mt-2 text-sm text-secondary-600 dark:text-secondary-400">
                  Uploading document...
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Uploaded Documents */}
        <div className="bg-white dark:bg-neutral-900 rounded-xl p-6 border-2 border-neutral-200 dark:border-neutral-800">
          <h2 className="font-display font-bold text-xl text-neutral-900 dark:text-white mb-4">
            Uploaded Documents ({documents.length})
          </h2>

          {documents.length === 0 ? (
            <p className="text-neutral-500 dark:text-neutral-400 text-center py-8">
              No documents uploaded yet
            </p>
          ) : (
            <div className="space-y-3">
              {documents.map((doc, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 border border-neutral-200 dark:border-neutral-700 rounded-lg"
                >
                  <div className="flex-1">
                    <p className="font-medium text-neutral-900 dark:text-white">
                      {businessKycDocumentLabels[doc.documentType]}
                      {requiredBusinessKycDocuments.includes(doc.documentType) && (
                        <span className="ml-2 text-red-500">*</span>
                      )}
                    </p>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">
                      {doc.fileName} • {(doc.fileSize / 1024).toFixed(0)}KB
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-3 py-1 text-xs font-medium rounded-full ${
                        doc.status === "verified"
                          ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300"
                          : doc.status === "rejected"
                          ? "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300"
                          : "bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300"
                      }`}
                    >
                      {doc.status}
                    </span>
                    <a
                      href={doc.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-secondary-600 dark:text-secondary-400 hover:underline text-sm"
                    >
                      View
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Required Documents Checklist */}
          <div className="mt-6 p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg">
            <h3 className="font-medium text-neutral-900 dark:text-white mb-3">Required Documents *</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {requiredBusinessKycDocuments.map((type) => {
                const isUploaded = uploadedTypes.includes(type);
                return (
                  <div key={type} className="flex items-center gap-2">
                    <span className={`text-sm ${isUploaded ? "text-green-600 dark:text-green-400" : "text-neutral-500 dark:text-neutral-400"}`}>
                      {isUploaded ? "✓" : "○"}
                    </span>
                    <span className={`text-sm ${isUploaded ? "text-neutral-900 dark:text-white" : "text-neutral-600 dark:text-neutral-400"}`}>
                      {businessKycDocumentLabels[type]}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        {documents.length > 0 && (
          <div className="mt-6 flex justify-end gap-4">
            <button
              onClick={handleSaveForLater}
              disabled={submitting}
              className="px-6 py-3 border-2 border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-lg font-medium hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors disabled:opacity-50"
            >
              Save and Continue Later
            </button>
            {canSubmit && (
              <button
                onClick={handleSubmitForReview}
                disabled={submitting || !allRequiredUploaded}
                className="px-6 py-3 bg-secondary-600 hover:bg-secondary-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {submitting ? "Submitting..." : "Submit for Review"}
              </button>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
