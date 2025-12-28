"use client";

import { ThemeToggle } from "@/components/theme-toggle";
import { AuthButton } from "@/components/auth-button";
import { initSatellite, onAuthStateChange, uploadFile, setDoc, getDoc } from "@junobuild/core";
import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type User = {
  key: string;
} | null | undefined;

type DocumentType = 
  | "id-document"
  | "proof-of-address"
  | "selfie"
  | "source-of-funds"
  | "incorporation-certificate"
  | "business-registration"
  | "rep-id"
  | "beneficial-owner-id"
  | "business-address-proof"
  | "financial-statements";

interface UploadedDocument {
  type: DocumentType;
  fileName: string;
  downloadUrl: string;
  uploadedAt: number;
}

export default function KYCPage() {
  const [user, setUser] = useState<User>(undefined);
  const [investorType, setInvestorType] = useState<"individual" | "corporate" | null>(null);
  const [uploading, setUploading] = useState(false);
  const [documents, setDocuments] = useState<UploadedDocument[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [currentDocType, setCurrentDocType] = useState<DocumentType | null>(null);
  const router = useRouter();

  useEffect(() => {
    (async () =>
      await initSatellite({
        workers: {
          auth: true,
        },
      }))();
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChange(async (authUser) => {
      setUser(authUser);
      
      // Fetch investor profile to get investor type
      if (authUser) {
        try {
          // Check individual first, then corporate
          let profile = await getDoc({
            collection: "individual_investor_profiles",
            key: authUser.key
          });
          
          if (!profile) {
            profile = await getDoc({
              collection: "corporate_investor_profiles",
              key: authUser.key
            });
          }
          
          if (profile) {
            const data = profile.data as any;
            setInvestorType(data.investorType || null);
          }
        } catch (err) {
          console.error("Error fetching investor profile:", err);
        }
      }
    });

    return () => unsubscribe();
  }, [router]);

  const handleFileUpload = async (type: DocumentType, file: File) => {
    try {
      setUploading(true);
      setError("");

      // Upload to Juno storage
      const result = await uploadFile({
        collection: "kyc_documents",
        data: file,
        filename: `${user?.key}_${type}_${Date.now()}_${file.name}`,
      });

      // Add to uploaded documents list
      const newDoc: UploadedDocument = {
        type,
        fileName: file.name,
        downloadUrl: result.downloadUrl,
        uploadedAt: Date.now(),
      };

      setDocuments(prev => [...prev.filter(d => d.type !== type), newDoc]);
    } catch (err) {
      console.error("Upload error:", err);
      setError("Failed to upload document. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleCameraCapture = (type: DocumentType) => {
    setCurrentDocType(type);
    setShowCamera(true);
  };

  const handlePhotoTaken = async (blob: Blob) => {
    if (!currentDocType) return;

    const file = new File([blob], `camera_capture_${Date.now()}.jpg`, { type: "image/jpeg" });
    await handleFileUpload(currentDocType, file);
    setShowCamera(false);
    setCurrentDocType(null);
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      setError("");

      // Validate required documents
      const requiredDocs: DocumentType[] = investorType === "individual"
        ? ["id-document", "proof-of-address", "selfie"]
        : ["incorporation-certificate", "business-registration", "rep-id"];

      const missingDocs = requiredDocs.filter(
        type => !documents.find(d => d.type === type)
      );

      if (missingDocs.length > 0) {
        setError("Please upload all required documents before submitting.");
        return;
      }

      // Get existing profile to retrieve version and merge data
      const collection = investorType === "individual" 
        ? "individual_investor_profiles" 
        : "corporate_investor_profiles";
      
      const existingProfile = await getDoc({
        collection,
        key: user!.key,
      });

      if (!existingProfile) {
        setError("Profile not found. Please complete onboarding first.");
        return;
      }

      // Update investor profile with KYC status
      const existingData = existingProfile.data as Record<string, any>;
      
      await setDoc({
        collection,
        doc: {
          key: user!.key,
          data: {
            ...existingData,
            kycStatus: "in-review",
            kycDocuments: documents.map(d => ({
              type: d.type,
              fileName: d.fileName,
              downloadUrl: d.downloadUrl,
              uploadedAt: d.uploadedAt,
            })),
            kycSubmittedAt: BigInt(Date.now()),
          },
          version: existingProfile.version,
        },
      });

      setSuccess(true);
      
      // Redirect to dashboard after 3 seconds
      setTimeout(() => {
        router.push("/member/dashboard");
      }, 3000);
    } catch (err) {
      console.error("Submission error:", err);
      setError("Failed to submit KYC documents. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const getDocumentLabel = (type: DocumentType): string => {
    const labels: Record<DocumentType, string> = {
      "id-document": "Government-issued ID (Passport/National ID/Driver's License)",
      "proof-of-address": "Proof of Address (Utility Bill/Bank Statement - max 3 months old)",
      "selfie": "Selfie/Photo holding your ID",
      "source-of-funds": "Source of Funds Documentation (Optional)",
      "incorporation-certificate": "Certificate of Incorporation",
      "business-registration": "Business Registration Documents",
      "rep-id": "Authorized Representative's ID",
      "beneficial-owner-id": "Beneficial Owners' IDs (25%+ ownership)",
      "business-address-proof": "Proof of Business Address",
      "financial-statements": "Company Financial Statements (Optional)",
    };
    return labels[type] || type;
  };

  const individualRequiredDocs: DocumentType[] = ["id-document", "proof-of-address", "selfie"];
  const individualOptionalDocs: DocumentType[] = ["source-of-funds"];
  const corporateRequiredDocs: DocumentType[] = ["incorporation-certificate", "business-registration", "rep-id"];
  const corporateOptionalDocs: DocumentType[] = ["beneficial-owner-id", "business-address-proof", "financial-statements"];

  if (user === undefined) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-primary-50/30 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-neutral-600 dark:text-neutral-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to sign in if not authenticated
  if (user === null) {
    router.push("/auth/signin");
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-primary-50/30 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-neutral-600 dark:text-neutral-400">Redirecting...</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-success-50/30 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="w-24 h-24 bg-success-100 dark:bg-success-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-12 h-12 text-success-600 dark:text-success-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="font-display font-bold text-3xl text-neutral-900 dark:text-white mb-4">
            KYC Documents Submitted!
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400 mb-6">
            Thank you for submitting your KYC documents. Our compliance team will review them within 2-3 business days.
          </p>
          <p className="text-sm text-neutral-500 dark:text-neutral-500">
            Redirecting to dashboard...
          </p>
        </div>
      </div>
    );
  }

  // Investor type selection
  if (!investorType) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-950 dark:to-neutral-900">
        <header className="border-b-2 border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
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

        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-12">
            <h1 className="font-display font-bold text-4xl text-neutral-900 dark:text-white mb-4">
              Complete Your KYC Verification
            </h1>
            <p className="text-lg text-neutral-600 dark:text-neutral-400">
              Select your investor type to begin the verification process
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <button
              onClick={() => setInvestorType("individual")}
              className="bg-white dark:bg-neutral-900 border-[3px] border-black dark:border-neutral-700 shadow-[8px_8px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_#7888FF] hover:shadow-[4px_4px_0px_rgba(0,0,0,1)] dark:hover:shadow-[4px_4px_0px_#7888FF] hover:translate-x-[4px] hover:translate-y-[4px] active:translate-x-[8px] active:translate-y-[8px] active:shadow-none transition-all p-8 rounded-2xl text-left"
            >
              <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-primary-600 dark:text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h3 className="font-bold text-2xl text-neutral-900 dark:text-white mb-3">
                Individual Investor
              </h3>
              <p className="text-neutral-600 dark:text-neutral-400 mb-4">
                For personal investment accounts
              </p>
              <ul className="text-sm text-neutral-600 dark:text-neutral-400 space-y-2">
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-success-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  3 required documents
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-success-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Quick verification process
                </li>
              </ul>
            </button>

            <button
              onClick={() => setInvestorType("corporate")}
              className="bg-white dark:bg-neutral-900 border-[3px] border-black dark:border-neutral-700 shadow-[8px_8px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_#7888FF] hover:shadow-[4px_4px_0px_rgba(0,0,0,1)] dark:hover:shadow-[4px_4px_0px_#7888FF] hover:translate-x-[4px] hover:translate-y-[4px] active:translate-x-[8px] active:translate-y-[8px] active:shadow-none transition-all p-8 rounded-2xl text-left"
            >
              <div className="w-16 h-16 bg-secondary-100 dark:bg-secondary-900/30 rounded-xl flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-secondary-600 dark:text-secondary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h3 className="font-bold text-2xl text-neutral-900 dark:text-white mb-3">
                Corporate Investor
              </h3>
              <p className="text-neutral-600 dark:text-neutral-400 mb-4">
                For companies and organizations
              </p>
              <ul className="text-sm text-neutral-600 dark:text-neutral-400 space-y-2">
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-success-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Enhanced due diligence
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-success-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Corporate compliance
                </li>
              </ul>
            </button>
          </div>

          <div className="mt-8 text-center">
            <Link
              href="/member/dashboard"
              className="text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
            >
              ← Back to Dashboard
            </Link>
          </div>
        </main>
      </div>
    );
  }

  // Document upload interface
  const requiredDocs = investorType === "individual" ? individualRequiredDocs : corporateRequiredDocs;
  const optionalDocs = investorType === "individual" ? individualOptionalDocs : corporateOptionalDocs;

  // Camera modal
  if (showCamera && currentDocType) {
    return (
      <CameraCapture
        onCapture={handlePhotoTaken}
        onClose={() => {
          setShowCamera(false);
          setCurrentDocType(null);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-950 dark:to-neutral-900">
      <header className="border-b-2 border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
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

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <button
            onClick={() => setInvestorType(null)}
            className="text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Change investor type
          </button>
        </div>

        <div className="text-center mb-8">
          <h1 className="font-display font-bold text-3xl text-neutral-900 dark:text-white mb-2">
            Upload KYC Documents
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400 mb-3">
            {investorType === "individual" ? "Individual Investor" : "Corporate Investor"} Verification
          </p>
          <div className="flex flex-wrap justify-center gap-3 text-xs text-neutral-500 dark:text-neutral-400">
            <span className="px-3 py-1 bg-neutral-100 dark:bg-neutral-800 rounded-full">
              📄 PDF, JPG, PNG
            </span>
            <span className="px-3 py-1 bg-neutral-100 dark:bg-neutral-800 rounded-full">
              📊 Max 5MB per file
            </span>
            <span className="px-3 py-1 bg-neutral-100 dark:bg-neutral-800 rounded-full">
              ⏱️ Review: 2-3 business days
            </span>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-error-50 dark:bg-error-900/20 border-2 border-error-600 dark:border-error-400 rounded-lg">
            <p className="text-error-900 dark:text-error-100">{error}</p>
          </div>
        )}

        {/* Required Documents */}
        <div className="mb-8">
          <h2 className="font-bold text-xl text-neutral-900 dark:text-white mb-4">
            Required Documents
          </h2>
          <div className="space-y-4">
            {requiredDocs.map((docType) => (
              <DocumentUploadCard
                key={docType}
                type={docType}
                label={getDocumentLabel(docType)}
                required={true}
                uploaded={documents.find(d => d.type === docType)}
                onUpload={(file) => handleFileUpload(docType, file)}
                onCamera={() => handleCameraCapture(docType)}
                uploading={uploading}
                allowCamera={docType === "selfie" || docType === "id-document"}
              />
            ))}
          </div>
        </div>

        {/* Optional Documents */}
        <div className="mb-8">
          <h2 className="font-bold text-xl text-neutral-900 dark:text-white mb-4">
            Optional Documents
          </h2>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
            These documents may help expedite your verification process
          </p>
          <div className="space-y-4">
            {optionalDocs.map((docType) => (
              <DocumentUploadCard
                key={docType}
                type={docType}
                label={getDocumentLabel(docType)}
                required={false}
                uploaded={documents.find(d => d.type === docType)}
                onUpload={(file) => handleFileUpload(docType, file)}
                onCamera={() => handleCameraCapture(docType)}
                uploading={uploading}
                allowCamera={false}
              />
            ))}
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-center gap-4">
          <Link
            href="/member/dashboard"
            className="px-8 py-4 border-2 border-neutral-300 dark:border-neutral-700 hover:border-neutral-400 dark:hover:border-neutral-600 text-neutral-700 dark:text-neutral-300 font-semibold rounded-xl transition-colors"
          >
            Save & Continue Later
          </Link>
          <button
            onClick={handleSubmit}
            disabled={submitting || uploading}
            className="px-8 py-4 bg-primary-600 hover:bg-primary-700 disabled:bg-neutral-400 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors"
          >
            {submitting ? "Submitting..." : "Submit for Review"}
          </button>
        </div>

        {/* Help Text */}
        <div className="mt-8 p-6 bg-primary-50 dark:bg-primary-900/10 border-2 border-primary-200 dark:border-primary-800 rounded-xl">
          <h3 className="font-semibold text-neutral-900 dark:text-white mb-2">
            Document Guidelines
          </h3>
          <ul className="text-sm text-neutral-600 dark:text-neutral-400 space-y-2">
            <li>• All documents must be clear and legible</li>
            <li>• Accepted formats: PDF, JPG, PNG (max 10MB per file)</li>
            <li>• Documents must be valid and not expired</li>
            <li>• Proof of address must be dated within the last 3 months</li>
            <li>• For corporate investors, all beneficial owners with 25%+ ownership must provide ID</li>
          </ul>
        </div>
      </main>
    </div>
  );
}

// Document Upload Card Component
interface DocumentUploadCardProps {
  type: DocumentType;
  label: string;
  required: boolean;
  uploaded?: UploadedDocument;
  onUpload: (file: File) => void;
  onCamera: () => void;
  uploading: boolean;
  allowCamera: boolean;
}

function DocumentUploadCard({ type, label, required, uploaded, onUpload, onCamera, uploading, allowCamera }: DocumentUploadCardProps) {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (5MB max)
      const maxSize = 5 * 1024 * 1024; // 5MB in bytes
      if (file.size > maxSize) {
        alert(`File size must be less than 5MB. Current file size: ${(file.size / (1024 * 1024)).toFixed(2)}MB`);
        return;
      }
      
      // Validate file type
      const validTypes = ["application/pdf", "image/jpeg", "image/jpg", "image/png"];
      if (!validTypes.includes(file.type)) {
        alert("Only PDF, JPG, and PNG files are allowed");
        return;
      }

      onUpload(file);
    }
  };

  return (
    <div className="bg-white dark:bg-neutral-900 border-2 border-neutral-200 dark:border-neutral-800 rounded-xl p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-semibold text-neutral-900 dark:text-white">
              {label}
            </h3>
            {required && (
              <span className="px-2 py-0.5 bg-error-100 dark:bg-error-900/30 text-error-600 dark:text-error-400 text-xs font-semibold rounded">
                Required
              </span>
            )}
          </div>
          
          {uploaded ? (
            <div className="flex items-center gap-2 text-sm text-success-600 dark:text-success-400">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span className="font-medium">Uploaded: {uploaded.fileName}</span>
            </div>
          ) : (
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              No file uploaded
            </p>
          )}
        </div>

        <div className="flex gap-2">
          {allowCamera && (
            <button
              onClick={onCamera}
              disabled={uploading}
              className="inline-flex items-center gap-2 px-4 py-2 bg-secondary-600 hover:bg-secondary-700 disabled:bg-neutral-400 text-white text-sm font-semibold rounded-lg transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Camera
            </button>
          )}
          <label className="cursor-pointer">
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleFileChange}
              disabled={uploading}
              className="hidden"
            />
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-neutral-400 text-white text-sm font-semibold rounded-lg transition-colors">
              {uploading ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Uploading...
                </>
              ) : uploaded ? (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Replace
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  Upload
                </>
              )}
            </span>
          </label>
        </div>
      </div>
    </div>
  );
}

// Camera Capture Component
interface CameraCaptureProps {
  onCapture: (blob: Blob) => void;
  onClose: () => void;
}

function CameraCapture({ onCapture, onClose }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [captured, setCaptured] = useState<string | null>(null);

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: "user",
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false 
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      alert("Unable to access camera. Please ensure you've granted camera permissions.");
      onClose();
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const context = canvasRef.current.getContext("2d");
    if (!context) return;

    canvasRef.current.width = videoRef.current.videoWidth;
    canvasRef.current.height = videoRef.current.videoHeight;
    context.drawImage(videoRef.current, 0, 0);

    canvasRef.current.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        setCaptured(url);
      }
    }, "image/jpeg", 0.98);
  };

  const retake = () => {
    setCaptured(null);
  };

  const confirmCapture = () => {
    if (!canvasRef.current || !captured) return;

    canvasRef.current.toBlob((blob) => {
      if (blob) {
        onCapture(blob);
        stopCamera();
      }
    }, "image/jpeg", 0.95);
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      <div className="flex items-center justify-between p-4 bg-black/80 backdrop-blur-sm relative z-10">
        <h2 className="text-white font-semibold text-lg">Take Photo</h2>
        <button
          onClick={() => {
            stopCamera();
            onClose();
          }}
          className="text-white hover:text-neutral-300 p-2"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="flex-1 relative bg-black overflow-hidden">
        {!captured ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="absolute inset-0 w-full h-full object-cover"
            style={{ transform: 'scaleX(-1)' }}
          />
        ) : (
          <img 
            src={captured} 
            alt="Captured" 
            className="absolute inset-0 w-full h-full object-contain"
            style={{ transform: 'scaleX(-1)' }}
          />
        )}
        <canvas ref={canvasRef} className="hidden" />

        {/* Capture button overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex justify-center">
          {!captured ? (
            <div className="flex flex-col items-center gap-3">
              <button
                onClick={capturePhoto}
                className="w-24 h-24 bg-white rounded-full flex items-center justify-center hover:scale-110 transition-transform shadow-2xl border-4 border-neutral-800"
                aria-label="Capture photo"
              >
                <div className="w-20 h-20 bg-primary-600 rounded-full" />
              </button>
              <p className="text-white text-base font-semibold drop-shadow-lg">Tap to capture</p>
            </div>
          ) : (
            <div className="flex gap-4">
              <button
                onClick={retake}
                className="px-8 py-4 bg-neutral-600 hover:bg-neutral-700 text-white text-lg font-semibold rounded-xl transition-colors shadow-xl"
              >
                Retake
              </button>
              <button
                onClick={confirmCapture}
                className="px-8 py-4 bg-primary-600 hover:bg-primary-700 text-white text-lg font-semibold rounded-xl transition-colors shadow-xl"
              >
                Use Photo
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
