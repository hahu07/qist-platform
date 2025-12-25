"use client";

import { ThemeToggle } from "@/components/theme-toggle";
import { AuthButton } from "@/components/auth-button";
import { initSatellite, onAuthStateChange, uploadFile, setDoc, listDocs, deleteDoc, type Doc } from "@junobuild/core";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { logger } from "@/utils/logger";
import { validateFileWithPreset } from "@/utils/file-validation";
import { DocumentCard } from "@/components/document-card";
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
  const [isPendingProfile, setIsPendingProfile] = useState(false); // Track if profile is from localStorage
  const [documents, setDocuments] = useState<Doc<BusinessKycDocument>[]>([]);
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
      // Load business profile from Juno
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
      
      // Check if profile is still pending approval
      setIsPendingProfile(userProfile.data.accountStatus === 'pending-approval');

      // Load existing KYC documents from Juno datastore (all documents now stored in Juno)
      try {
        const docsResult = await listDocs<BusinessKycDocument>({
          collection: "business_kyc_documents",
        });

        const userDocs = docsResult.items
          .filter((doc) => doc.data.businessId === user.key)
          .sort((a, b) => b.data.uploadedAt.localeCompare(a.data.uploadedAt)); // Sort by newest first

        // Group by document type and keep only the latest version of each type
        const latestDocs = userDocs.reduce((acc, doc) => {
          if (!acc[doc.data.documentType]) {
            acc[doc.data.documentType] = doc;
          }
          return acc;
        }, {} as Record<string, Doc<BusinessKycDocument>>);

        setDocuments(Object.values(latestDocs));
      } catch (docError: any) {
        if (!docError?.message?.includes("not_found")) {
          logger.error("Error loading documents:", docError);
        }
      }
    } catch (error) {
      logger.error("Error loading profile:", error);
      setError("Failed to load business profile");
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !user || !profile) return;

    const file = e.target.files[0];

    // Validate file using centralized utility
    const validation = validateFileWithPreset(file, "kyc");
    if (!validation.isValid) {
      setError(validation.error || "Invalid file");
      toast.error(validation.error || "Invalid file");
      return;
    }

    setUploading(true);
    setError("");

    try {
      // For all profiles, read file as base64 first
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Data = reader.result as string;
        
        const docMetadata: BusinessKycDocument = {
          businessId: user.key,
          documentType: uploadType,
          fileName: file.name,
          fileUrl: base64Data, // Store base64 data temporarily
          fileSize: file.size,
          mimeType: file.type,
          uploadedAt: new Date().toISOString(),
          status: "pending",
        };

        // Save to Juno datastore immediately (with base64 fileUrl)
        await setDoc({
          collection: "business_kyc_documents",
          doc: {
            key: `${user.key}_${uploadType}_${Date.now()}`,
            data: docMetadata,
          },
        });

        // If profile was rejected and user is resubmitting, update status back to pending
        if (profile.data.kycStatus === "rejected" && profile.data.kycRejectionAllowsResubmit !== false) {
          await setDoc({
            collection: "business_profiles",
            doc: {
              key: user.key,
              data: {
                ...profile.data,
                kycStatus: "pending",
                kycRejectionReason: undefined,
                kycRejectionAllowsResubmit: undefined,
                updatedAt: new Date().toISOString(),
              },
              version: profile.version,
            },
          });
        }

        // Refresh documents list
        await loadProfileAndDocuments();

        // Reset upload type to next required document
        const uploadedTypes = [...documents.map(d => d.data.documentType), uploadType];
        const nextRequired = requiredBusinessKycDocuments.find(t => !uploadedTypes.includes(t));
        if (nextRequired) {
          setUploadType(nextRequired);
        }

        setUploading(false);
      };
      reader.onerror = () => {
        setError("Failed to read file");
        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      logger.error("Upload error:", err);
      setError(err.message || "Failed to upload document");
      setUploading(false);
    }
  };

  const handleDeleteDocument = async (doc: Doc<BusinessKycDocument>) => {
    if (!user || !profile) return;

    // Allow deletion if KYC hasn't been submitted for final review yet
    // Once KYC is in-review or verified at profile level, prevent deletion
    if (profile.data.kycStatus === "in-review") {
      toast.error("Cannot delete documents while KYC is under review. Please contact support if you need to make changes.");
      return;
    }

    if (profile.data.kycStatus === "verified") {
      toast.error("Cannot delete verified documents. Please contact support if you need to update a verified document.");
      return;
    }

    if (!confirm(`Are you sure you want to delete "${businessKycDocumentLabels[doc.data.documentType]}"?\n\nFilename: ${doc.data.fileName}`)) {
      return;
    }

    try {
      await deleteDoc({
        collection: "business_kyc_documents",
        doc: doc,
      });

      // Refresh documents list
      await loadProfileAndDocuments();
      
      toast.success("Document deleted successfully");
    } catch (err: any) {
      logger.error("Delete error:", err);
      setError(err.message || "Failed to delete document");
    }
  };

  const handleReplaceDocument = async (doc: Doc<BusinessKycDocument>, file: File) => {
    if (!user || !profile) return;

    // Validate file using centralized utility
    const validation = validateFileWithPreset(file, "kyc");
    if (!validation.isValid) {
      toast.error(validation.error || "Invalid file");
      return;
    }

    try {
      // Read file as base64
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Data = reader.result as string;
        
        // Delete old document
        await deleteDoc({
          collection: "business_kyc_documents",
          doc: doc,
        });

        // Create new document with same type
        const docMetadata: BusinessKycDocument = {
          businessId: user.key,
          documentType: doc.data.documentType,
          fileName: file.name,
          fileUrl: base64Data,
          fileSize: file.size,
          mimeType: file.type,
          uploadedAt: new Date().toISOString(),
          status: "pending",
        };

        await setDoc({
          collection: "business_kyc_documents",
          doc: {
            key: `${user.key}_${doc.data.documentType}_${Date.now()}`,
            data: docMetadata,
          },
        });

        // Refresh documents list
        await loadProfileAndDocuments();
        toast.success("Document replaced successfully");
      };
      reader.onerror = () => {
        toast.error("Failed to read file");
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      logger.error("Replace error:", err);
      toast.error(err.message || "Failed to replace document");
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

      // Update in Juno datastore
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
      logger.error("Save error:", err);
      setError(err.message || "Failed to save progress");
      setSubmitting(false);
    }
  };

  const handleSubmitForReview = async () => {
    if (!user || !profile) return;

    // Check if all required documents are uploaded
    const uploadedTypes = documents.map(d => d.data.documentType);
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

      // Update in Juno datastore
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
      logger.error("Submit error:", err);
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

  const uploadedTypes = documents.map(d => d.data.documentType);
  const allRequiredUploaded = requiredBusinessKycDocuments.every(t => uploadedTypes.includes(t));
  const canSubmit = allRequiredUploaded && profile.data.kycStatus === "pending";

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-secondary-50/30 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950">
      {/* Header */}
      <header className="border-b border-neutral-200 dark:border-neutral-800 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <Link href="/" className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-primary-600 to-primary-700 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">A</span>
                </div>
                <span className="font-display font-bold text-xl text-neutral-900 dark:text-white">
                  AmanaTrade
                </span>
              </Link>
              <Link 
                href="/business/dashboard"
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Dashboard
              </Link>
            </div>
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
          <div className={`mb-6 p-4 border-2 rounded-lg ${
            profile.data.kycRejectionAllowsResubmit === false
              ? 'bg-error-50 dark:bg-error-900/20 border-error-200 dark:border-error-800'
              : 'bg-warning-50 dark:bg-warning-900/20 border-warning-200 dark:border-warning-800'
          }`}>
            <p className={`font-medium ${
              profile.data.kycRejectionAllowsResubmit === false
                ? 'text-error-800 dark:text-error-300'
                : 'text-warning-800 dark:text-warning-300'
            }`}>
              {profile.data.kycRejectionAllowsResubmit === false ? (
                <>❌ KYC Permanently Rejected: {profile.data.kycRejectionReason || "Your account is not eligible for registration"}</>
              ) : (
                <>⚠️ KYC Rejected: {profile.data.kycRejectionReason || "Please re-upload correct documents"}</>
              )}
            </p>
            {profile.data.kycRejectionAllowsResubmit !== false && (
              <p className="text-sm text-warning-700 dark:text-warning-400 mt-2">
                You can upload new documents to resubmit your KYC application.
              </p>
            )}
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
          </div>
        )}

        {/* Upload Section - Disabled if permanently rejected */}
        {profile.data.kycRejectionAllowsResubmit === false ? (
          <div className="bg-neutral-100 dark:bg-neutral-800 rounded-xl p-6 border-2 border-neutral-300 dark:border-neutral-700 mb-6">
            <h2 className="font-display font-bold text-xl text-neutral-600 dark:text-neutral-400 mb-4">
              Upload Documents (Disabled)
            </h2>
            <p className="text-neutral-600 dark:text-neutral-400">
              Document uploads are disabled due to permanent KYC rejection. Please contact support if you believe this is an error.
            </p>
          </div>
        ) : (
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
                  disabled={uploading || (profile.data.kycStatus !== "pending" && !(profile.data.kycStatus === "rejected" && (profile.data.kycRejectionAllowsResubmit === undefined || profile.data.kycRejectionAllowsResubmit === true)))}
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
                  disabled={uploading || (profile.data.kycStatus !== "pending" && !(profile.data.kycStatus === "rejected" && (profile.data.kycRejectionAllowsResubmit === undefined || profile.data.kycRejectionAllowsResubmit === true)))}
                  className="w-full px-4 py-2 border-2 border-neutral-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                />
                {uploading && (
                  <div className="mt-2 flex items-center gap-2">
                    <svg className="animate-spin w-4 h-4 text-secondary-600 dark:text-secondary-400" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <p className="text-sm text-secondary-600 dark:text-secondary-400">
                      Uploading document...
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

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
                <DocumentCard
                  key={doc.key || index}
                  doc={doc}
                  onDelete={handleDeleteDocument}
                  onReplace={handleReplaceDocument}
                  kycStatus={profile.data.kycStatus}
                />
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
