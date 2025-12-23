"use client";

import { ThemeToggle } from "@/components/theme-toggle";
import { AuthButton } from "@/components/auth-button";
import { initSatellite, onAuthStateChange, uploadFile, setDoc, listDocs, type Doc } from "@junobuild/core";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ApplicationData } from "@/schemas";

type User = {
  key: string;
} | null | undefined;

type BusinessDocumentType = 
  | "business-registration"
  | "audited-financial-statements"
  | "bank-statements"
  | "business-plan"
  | "collateral-assets"
  | "id-card"
  | "passport-photo"
  | "business-license"
  | "bank-reference"
  | "ownership-docs"
  | "other";

interface BusinessDocument {
  type: BusinessDocumentType;
  fileName: string;
  fileUrl: string;
  uploadedAt: string;
  status: "pending" | "verified" | "rejected";
  version?: number;
  expiryDate?: string | null;
}

export default function BusinessDocumentsPage() {
  const [user, setUser] = useState<User>(undefined);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingExpiryDate, setUploadingExpiryDate] = useState<string>("");
  const [applicationId, setApplicationId] = useState<string | null>(null);
  const [businessName, setBusinessName] = useState<string>("");
  const [businessApplication, setBusinessApplication] = useState<ApplicationData | null>(null);
  const [documents, setDocuments] = useState<BusinessDocument[]>([]);
  const [documentStatus, setDocumentStatus] = useState<"pending" | "in-review" | "verified" | "rejected">("pending");
  const [error, setError] = useState<string>("");
  const router = useRouter();

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
        setBusinessApplication(userApplication.data);

        // Fetch existing documents
        let businessDocs: BusinessDocument[] = [];
        try {
          const docsResult = await listDocs<any>({
            collection: "business_document_metadata",
          });

          businessDocs = docsResult.items
            .filter((doc) => doc.data.applicationId === userApplication.key)
            .map((doc) => ({
              type: doc.data.documentType as BusinessDocumentType,
              fileName: doc.data.fileName,
              fileUrl: doc.data.fileUrl,
              uploadedAt: doc.data.uploadedAt,
              status: doc.data.status || "pending",
            }));

          setDocuments(businessDocs);
        } catch (docError: any) {
          // Collection doesn't exist yet - show helpful error
          if (docError?.message?.includes("business_document_metadata") || 
              docError?.message?.includes("not_found")) {
            setError("Datastore collection not configured. Please contact administrator to create 'business_document_metadata' collection in Juno console.");
            setDocuments([]);
          } else {
            throw docError; // Re-throw unexpected errors
          }
        }

        // Determine overall document status based on admin review, not just upload
        if (businessDocs.some((d) => d.status === "verified")) {
          setDocumentStatus("verified");
        } else if (businessDocs.some((d) => d.status === "rejected")) {
          setDocumentStatus("rejected");
        } else if (userApplication.data.documentsSubmitted) {
          setDocumentStatus("in-review");
        } else {
          setDocumentStatus("pending");
        }
      } else {
        router.push("/business/onboarding/profile");
      }
    } catch (error) {
      console.error("Error fetching business data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, docType: BusinessDocumentType, expiryDate?: string) => {
    const file = e.target.files?.[0];
    if (!file || !applicationId) return;

    // Validate file type
    const allowedTypes = ["application/pdf", "image/jpeg", "image/png"];
    if (!allowedTypes.includes(file.type)) {
      setError("Only PDF, JPG, and PNG files are allowed");
      return;
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      setError(`File size must be less than 5MB. Current file size: ${(file.size / (1024 * 1024)).toFixed(2)}MB`);
      return;
    }

    try {
      setUploading(true);
      setError("");

      // Upload to Juno storage
      try {
        const result = await uploadFile({
          collection: "business_documents",
          data: file,
        });

        // Determine version number for this document type (increment)
        let version = 1;
        try {
          const allDocs = await listDocs<any>({ collection: "business_document_metadata" });
          const existing = (allDocs && allDocs.items || []).filter((d: any) => d.data.applicationId === applicationId && d.data.documentType === docType);
          if (existing.length > 0) {
            const maxV = existing.reduce((m: number, d: any) => Math.max(m, d.data.version || 1), 1);
            version = maxV + 1;
          }
        } catch (err) {
          console.warn('Could not compute existing document versions', err);
        }

        // Save document metadata
        await setDoc({
          collection: "business_document_metadata",
          doc: {
            key: `doc_${applicationId}_${Date.now()}`,
            data: {
              applicationId,
              businessName,
              documentType: docType,
              fileName: file.name,
              fileUrl: result.downloadUrl,
              fileSize: file.size,
              mimeType: file.type,
              uploadedAt: new Date().toISOString(),
              status: "pending",
            version,
            expiryDate: expiryDate || null
          },
        },
      });

        // Update local state only - don't change application status yet
        const newDoc = {
          type: docType,
          fileName: file.name,
          fileUrl: result.downloadUrl,
          uploadedAt: new Date().toISOString(),
          status: "pending" as const,
          version,
          expiryDate: expiryDate || null,
        };
        
        setDocuments((prev) => [...prev, newDoc]);
        setUploadingExpiryDate("");
        alert("Document uploaded successfully! Remember to click 'Submit for Review' when all documents are ready.");
      } catch (uploadError: any) {
        console.error("Error uploading file:", uploadError);
        
        // Check if it's a collection not found error
        if (uploadError?.message?.includes("not_found")) {
          if (uploadError?.message?.includes("business_documents")) {
            setError("Storage collection not configured. Please contact administrator to set up 'business_documents' storage collection in Juno console.");
          } else if (uploadError?.message?.includes("business_document_metadata")) {
            setError("Metadata collection not configured. Please contact administrator to set up 'business_document_metadata' datastore collection in Juno console.");
          } else {
            setError("Required collections not configured. Please contact administrator.");
          }
        } else {
          setError("Failed to upload document. Please try again.");
        }
        throw uploadError; // Re-throw to be caught by outer catch
      }
    } catch (error) {
      console.error("Error in upload process:", error);
      // Error message already set in inner catch
    } finally {
      setUploading(false);
    }
  };

  const handleSubmitForReview = async () => {
    // Ensure all required documents are present
    const missing = requiredDocs.filter((t) => !isDocumentUploaded(t));
    if (missing.length > 0) {
      setError(`Please upload required documents: ${missing.map((m) => getDocumentLabel(m)).join(", ")}`);
      return;
    }

    try {
      setSubmitting(true);

      // Update application with document submission status
      const applicationResult = await listDocs<ApplicationData>({
        collection: "business_applications",
      });

      const userApplication = applicationResult.items.find(
        (app) => app.key === applicationId
      );

      if (userApplication) {
        await setDoc({
          collection: "business_applications",
          doc: {
            key: applicationId!,
            data: {
              ...userApplication.data,
              documentsSubmitted: true,
              documentsSubmittedAt: new Date().toISOString(),
              documentsStatus: "in-review",
            },
            version: userApplication.version,
          },
        });
      }

      setDocumentStatus("in-review");
      alert("Documents submitted for review! Our compliance team will review them within 3-5 business days.");
    } catch (error) {
      console.error("Error submitting documents:", error);
      setError("Failed to submit documents. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const getDocumentLabel = (type: BusinessDocumentType): string => {
    const labels: Record<BusinessDocumentType, string> = {
      "business-registration": "Business Registration Certificate",
      "audited-financial-statements": "Audited Financial Statements (Last 2 years)",
      "bank-statements": "Bank Statements (Last 6 months)",
      "business-plan": "Business Plan (Required for new businesses)",
      "collateral-assets": "Collateral Assets (Physical asset docs or Member Investor Guarantee Letter)",
      "id-card": "ID Card (NIN, Driver's License, Int'l Passport, or Voter's Card)",
      "passport-photo": "Passport Photograph / Selfie",
      "business-license": "Business License/Permits (Required if applicable)",
      "bank-reference": "Bank Reference Letter",
      "ownership-docs": "CAC Status Report (Ownership)",
      "other": "Other Supporting Documents",
    };
    return labels[type];
  };

  const isDocumentUploaded = (type: BusinessDocumentType): boolean => {
    return documents.some((d) => d.type === type);
  };

  // Compute required/recommended documents dynamically based on application data
  const requiredDocs: BusinessDocumentType[] = (() => {
    const base: BusinessDocumentType[] = ["business-registration", "audited-financial-statements", "bank-statements", "collateral-assets", "id-card", "passport-photo", "ownership-docs"];
    const isNewBusiness = (businessApplication?.yearsInOperation ?? 0) < 1;
    const requiresLicense = (businessApplication as any)?.requiresLicense || (businessApplication as any)?.businessLicenseRequired || false;

    if (isNewBusiness) base.push("business-plan");
    if (requiresLicense) base.push("business-license");

    return base;
  })();

  const recommendedDocs: BusinessDocumentType[] = (() => {
    const list: BusinessDocumentType[] = [];
    // If license not required, recommend it instead
    const requiresLicense = (businessApplication as any)?.requiresLicense || (businessApplication as any)?.businessLicenseRequired || false;
    if (!requiresLicense) list.push("business-license");
    return list;
  })();

  const optionalDocs: BusinessDocumentType[] = [
    "bank-reference",
    "other",
  ];

  // Missing required docs (for enabling submit button)
  const missingRequired = requiredDocs.filter((t) => !isDocumentUploaded(t));

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-primary-50/30 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-neutral-600 dark:text-neutral-400">Loading business documents...</p>
        </div>
      </div>
    );
  }

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
              <span className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Business Documents</span>
            </div>
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <AuthButton />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
            className="px-4 py-2 bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 font-semibold rounded-lg border-2 border-neutral-200 dark:border-neutral-800 whitespace-nowrap transition-all"
          >
            Revenue Reports
          </Link>
          <Link
            href="/business/documents"
            className="px-4 py-2 bg-primary-600 text-white font-semibold rounded-lg whitespace-nowrap"
          >
            Documents
          </Link>
        </div>

        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-white mb-2">Business Documents</h1>
          <p className="text-neutral-600 dark:text-neutral-400">{businessName}</p>
        </div>

        {/* Status Banner */}
        {documentStatus === "pending" && (
          <div className="bg-warning-50 dark:bg-warning-900/20 border-2 border-warning-200 dark:border-warning-800 rounded-xl p-6 mb-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-warning-100 dark:bg-warning-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-warning-600 dark:text-warning-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-warning-900 dark:text-warning-200 mb-2">Documents Required</h3>
                <p className="text-warning-700 dark:text-warning-300 mb-3">
                  Please upload your business documents to complete verification. This is required before your application can be reviewed.
                </p>
                <div className="bg-warning-100/50 dark:bg-warning-900/10 rounded-lg p-3 mb-3">
                  <p className="text-sm text-warning-800 dark:text-warning-300 font-medium mb-2">Required Documents:</p>
                  <p className="text-xs text-warning-700 dark:text-warning-400">
                    Business registration, audited financial statements (2yrs), bank statements (6mo), collateral assets, ID card, passport photo, and ownership documents
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="px-2 py-1 bg-warning-100 dark:bg-warning-900/30 text-warning-700 dark:text-warning-300 rounded">
                    📄 Formats: PDF, JPG, PNG
                  </span>
                  <span className="px-2 py-1 bg-warning-100 dark:bg-warning-900/30 text-warning-700 dark:text-warning-300 rounded">
                    📊 Max size: 5MB per file
                  </span>
                  <span className="px-2 py-1 bg-warning-100 dark:bg-warning-900/30 text-warning-700 dark:text-warning-300 rounded">
                    ⏱️ Review: 3-5 business days
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {documentStatus === "in-review" && (
          <div className="bg-primary-50 dark:bg-primary-900/20 border-2 border-primary-200 dark:border-primary-800 rounded-xl p-6 mb-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-primary-600 dark:text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-primary-900 dark:text-primary-200 mb-2">Documents Under Review</h3>
                <p className="text-primary-700 dark:text-primary-300 mb-4">
                  Your documents have been submitted and are being reviewed by our compliance team.
                </p>
                <p className="text-sm text-primary-600 dark:text-primary-400">
                  Typical review time: 3-5 business days
                </p>
              </div>
            </div>
          </div>
        )}

        {documentStatus === "verified" && (
          <div className="bg-success-50 dark:bg-success-900/20 border-2 border-success-200 dark:border-success-800 rounded-xl p-6 mb-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-success-100 dark:bg-success-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-success-600 dark:text-success-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-success-900 dark:text-success-200 mb-2">Documents Verified</h3>
                <p className="text-success-700 dark:text-success-300">
                  Your business documents have been verified and approved. Your application is now under review.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-error-50 dark:bg-error-900/20 border-2 border-error-200 dark:border-error-800 rounded-xl p-4 mb-6">
            <p className="text-error-700 dark:text-error-300">{error}</p>
          </div>
        )}

        {/* Document Upload Sections */}
        
        {/* Required Documents */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border-2 border-neutral-200 dark:border-neutral-800 p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="px-3 py-1 bg-error-100 dark:bg-error-900/30 text-error-700 dark:text-error-300 text-xs font-bold rounded-full">
              REQUIRED
            </span>
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white">Required Documents</h2>
          </div>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-6">
              These documents are mandatory for your application to be processed.
            </p>
          <div className="space-y-4">
              {requiredDocs.map((docType) => (
              <DocumentUploadCard
                key={docType}
                type={docType}
                label={getDocumentLabel(docType)}
                isUploaded={isDocumentUploaded(docType)}
                uploadedDoc={documents.find((d) => d.type === docType)}
                onUpload={handleFileUpload}
                uploading={uploading}
                expiryDate={uploadingExpiryDate}
                onExpiryChange={setUploadingExpiryDate}
              />
            ))}
          </div>
        </div>

        {/* Recommended Documents */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border-2 border-neutral-200 dark:border-neutral-800 p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="px-3 py-1 bg-warning-100 dark:bg-warning-900/30 text-warning-700 dark:text-warning-300 text-xs font-bold rounded-full">
              RECOMMENDED
            </span>
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white">Recommended Documents</h2>
          </div>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-6">
            These documents will help expedite the review process.
          </p>
          <div className="space-y-4">
            {recommendedDocs.map((docType) => (
              <DocumentUploadCard
                key={docType}
                type={docType}
                label={getDocumentLabel(docType)}
                isUploaded={isDocumentUploaded(docType)}
                uploadedDoc={documents.find((d) => d.type === docType)}
                onUpload={handleFileUpload}
                uploading={uploading}
                expiryDate={uploadingExpiryDate}
                onExpiryChange={setUploadingExpiryDate}
              />
            ))}
          </div>
        </div>

        {/* Optional Documents */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border-2 border-neutral-200 dark:border-neutral-800 p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="px-3 py-1 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 text-xs font-bold rounded-full">
              OPTIONAL
            </span>
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white">Optional Documents</h2>
          </div>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-6">
            Additional supporting documents that strengthen your application.
          </p>
          <div className="space-y-4">
            {optionalDocs.map((docType) => (
              <DocumentUploadCard
                key={docType}
                type={docType}
                label={getDocumentLabel(docType)}
                isUploaded={isDocumentUploaded(docType)}
                uploadedDoc={documents.find((d) => d.type === docType)}
                onUpload={handleFileUpload}
                uploading={uploading}
                expiryDate={uploadingExpiryDate}
                onExpiryChange={setUploadingExpiryDate}
              />
            ))}
          </div>
        </div>

        {/* Submit Button - Show when documents uploaded but not yet submitted for review */}
        {documentStatus === "pending" && documents.length > 0 && (
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border-2 border-neutral-200 dark:border-neutral-800 p-6 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-neutral-900 dark:text-white mb-1">
                  Ready to Submit?
                </h3>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  {documents.length} document{documents.length !== 1 ? 's' : ''} uploaded
                  {missingRequired.length > 0 && ` — missing: ${missingRequired.map(m => getDocumentLabel(m)).join(', ')}`}
                </p>
              </div>
              <button
                onClick={handleSubmitForReview}
                disabled={submitting || missingRequired.length > 0}
                className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl border-2 border-primary-700 shadow-lg transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? "Submitting..." : "Submit for Review"}
              </button>
            </div>
          </div>
        )}

        {/* Guidelines */}
        <div className="bg-neutral-100 dark:bg-neutral-800 rounded-xl p-6 mt-6">
          <h3 className="font-bold text-neutral-900 dark:text-white mb-3">Document Guidelines</h3>
          <ul className="text-sm text-neutral-600 dark:text-neutral-400 space-y-2">
            <li>• Accepted formats: PDF, JPG, PNG (max 10MB per file)</li>
            <li>• All documents must be clear and legible</li>
            <li>• Audited financial statements should cover the last 2 years</li>
            <li>• Bank statements should cover the last 6 months</li>
            <li>• Collateral assets: Provide documentation for physical assets or a guarantee letter from member investors</li>
            <li>• ID card: Accepted forms - NIN, Driver's License, International Passport, or Voter's Card</li>
            <li>• Passport photo: Clear, recent photograph or selfie with good lighting</li>
            <li>• Documents must be current and not expired</li>
            <li>• Business registration must match the information provided during onboarding</li>
            <li>• All company directors/shareholders above 25% ownership should be documented</li>
          </ul>
        </div>
      </main>
    </div>
  );
}

// Document Upload Card Component
interface DocumentUploadCardProps {
  type: BusinessDocumentType;
  label: string;
  isUploaded: boolean;
  uploadedDoc?: BusinessDocument;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>, type: BusinessDocumentType, expiryDate?: string) => void;
  uploading: boolean;
  expiryDate: string;
  onExpiryChange: (date: string) => void;
}

function DocumentUploadCard({ type, label, isUploaded, uploadedDoc, onUpload, uploading, expiryDate, onExpiryChange }: DocumentUploadCardProps) {
  const [showCamera, setShowCamera] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useState<HTMLVideoElement | null>(null);
  const canvasRef = useState<HTMLCanvasElement | null>(null);
  
  const needsExpiry = ['business-license'].includes(type);
  const supportsCamera = type === 'passport-photo';

  const getStatusColor = (status: string) => {
    switch (status) {
      case "verified":
        return "bg-success-100 dark:bg-success-900/30 text-success-700 dark:text-success-300";
      case "rejected":
        return "bg-error-100 dark:bg-error-900/30 text-error-700 dark:text-error-300";
      default:
        return "bg-warning-100 dark:bg-warning-900/30 text-warning-700 dark:text-warning-300";
    }
  };

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user', width: 1280, height: 720 } 
      });
      setStream(mediaStream);
      setShowCamera(true);
      
      // Wait for next render to attach stream
      setTimeout(() => {
        if (videoRef[0]) {
          videoRef[0].srcObject = mediaStream;
        }
      }, 100);
    } catch (err) {
      console.error("Camera access error:", err);
      alert("Unable to access camera. Please ensure you've granted camera permissions.");
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setShowCamera(false);
  };

  const capturePhoto = () => {
    if (!videoRef[0] || !canvasRef[0]) return;
    
    const video = videoRef[0];
    const canvas = canvasRef[0];
    const context = canvas.getContext('2d');
    
    if (!context) return;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0);
    
    canvas.toBlob((blob) => {
      if (!blob) return;
      
      const file = new File([blob], `selfie-${Date.now()}.jpg`, { type: 'image/jpeg' });
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);
      
      const fakeEvent = {
        target: { files: dataTransfer.files }
      } as React.ChangeEvent<HTMLInputElement>;
      
      onUpload(fakeEvent, type, expiryDate);
      stopCamera();
    }, 'image/jpeg', 0.9);
  };

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  return (
    <div className="p-4 bg-neutral-50 dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h4 className="font-semibold text-neutral-900 dark:text-white mb-1">{label}</h4>
          {uploadedDoc && (
            <div className="flex items-center gap-2 mt-2">
              <svg className="w-4 h-4 text-success-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm text-neutral-600 dark:text-neutral-400">{uploadedDoc.fileName}</span>
              <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(uploadedDoc.status)}`}>
                {uploadedDoc.status}
              </span>
            </div>
          )}
        </div>
        {isUploaded && uploadedDoc && (
          <a
            href={uploadedDoc.fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1 bg-neutral-200 hover:bg-neutral-300 dark:bg-neutral-700 dark:hover:bg-neutral-600 text-neutral-900 dark:text-white text-sm font-semibold rounded-lg transition-all"
          >
            View
          </a>
        )}
      </div>
      
      {!isUploaded && (
        <div className="mt-3 space-y-2">
          {needsExpiry && (
            <div>
              <label className="block text-xs text-neutral-600 dark:text-neutral-400 mb-1">Expiry Date (Optional)</label>
              <input
                type="date"
                value={expiryDate}
                onChange={(e) => onExpiryChange(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm"
              />
            </div>
          )}
          
          {/* Camera UI for passport photo */}
          {supportsCamera && showCamera && (
            <div className="space-y-2">
              <video
                ref={(el) => { videoRef[0] = el; }}
                autoPlay
                playsInline
                className="w-full rounded-lg bg-black"
              />
              <canvas ref={(el) => { canvasRef[0] = el; }} className="hidden" />
              <div className="flex gap-2">
                <button
                  onClick={capturePhoto}
                  disabled={uploading}
                  className="flex-1 px-4 py-2 bg-success-600 hover:bg-success-700 text-white text-sm font-semibold rounded-lg transition-all disabled:opacity-50"
                >
                  📸 Capture Photo
                </button>
                <button
                  onClick={stopCamera}
                  className="px-4 py-2 bg-neutral-600 hover:bg-neutral-700 text-white text-sm font-semibold rounded-lg transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
          
          {/* Upload buttons */}
          {(!supportsCamera || !showCamera) && (
            <div className="flex gap-2">
              <label className="flex-1 cursor-pointer">
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => onUpload(e, type, expiryDate)}
                  disabled={uploading}
                  className="hidden"
                />
                <div className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold rounded-lg text-center transition-all cursor-pointer disabled:opacity-50">
                  {uploading ? "Uploading..." : "📁 Upload File"}
                </div>
              </label>
              
              {supportsCamera && (
                <button
                  onClick={startCamera}
                  disabled={uploading}
                  className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold rounded-lg transition-all disabled:opacity-50"
                >
                  📷 Take Photo
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
