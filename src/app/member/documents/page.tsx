"use client";

import { ThemeToggle } from "@/components/theme-toggle";
import { AuthButton } from "@/components/auth-button";
import { DocumentUploadModal } from "@/components/document-upload-modal";
import { initSatellite, onAuthStateChange, type Doc } from "@junobuild/core";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getUserDocuments, deleteDocument, getDocumentDownloadUrl } from "@/utils/document-actions";
import type { Document } from "@/schemas";

type User = {
  key: string;
} | null | undefined;

export default function DocumentsPage() {
  const [user, setUser] = useState<User>(undefined);
  const [documents, setDocuments] = useState<Doc<Document>[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [filter, setFilter] = useState<string>("all");
  const router = useRouter();

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
      fetchDocuments();
    }
  }, [user, filter]);

  const fetchDocuments = async () => {
    if (!user || user === null) return;

    try {
      setLoading(true);
      const docs = await getUserDocuments(
        user.key,
        filter !== "all" ? { documentType: filter } : undefined
      );
      setDocuments(docs);
    } catch (error) {
      console.error("Error fetching documents:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (doc: Doc<Document>) => {
    try {
      const url = await getDocumentDownloadUrl(doc.key);
      if (url) {
        window.open(url, "_blank");
      }
    } catch (error) {
      console.error("Error downloading document:", error);
    }
  };

  const handleDelete = async (documentId: string) => {
    if (!confirm("Are you sure you want to delete this document?")) return;

    const result = await deleteDocument(documentId);
    if (result.success) {
      fetchDocuments();
    } else {
      alert(result.error || "Failed to delete document");
    }
  };

  const getDocumentIcon = (mimeType: string) => {
    if (mimeType.includes("pdf")) {
      return (
        <svg className="w-6 h-6 text-error-600" fill="currentColor" viewBox="0 0 20 20">
          <path d="M4 18h12V6h-4V2H4v16zm-2 1V0h10l6 6v14H2z"/>
          <path d="M7 11h6v1H7zm0 2h6v1H7zm0 2h4v1H7z"/>
        </svg>
      );
    }
    if (mimeType.includes("image")) {
      return (
        <svg className="w-6 h-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      );
    }
    return (
      <svg className="w-6 h-6 text-neutral-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    );
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: "bg-warning-100 dark:bg-warning-900/30 text-warning-700 dark:text-warning-300",
      verified: "bg-success-100 dark:bg-success-900/30 text-success-700 dark:text-success-300",
      rejected: "bg-error-100 dark:bg-error-900/30 text-error-700 dark:text-error-300",
      archived: "bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300",
    };
    return styles[status as keyof typeof styles] || styles.pending;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB";
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  };

  const formatDate = (timestamp: bigint | undefined): string => {
    if (!timestamp) return "N/A";
    const date = new Date(Number(timestamp) / 1000000);
    return date.toLocaleDateString("en-NG", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const documentTypeLabels: Record<string, string> = {
    kyc_id: "KYC ID Document",
    kyc_proof_of_address: "Proof of Address",
    kyc_business_registration: "Business Registration",
    investment_certificate: "Investment Certificate",
    contract_agreement: "Contract Agreement",
    tax_statement: "Tax Statement",
    profit_distribution_receipt: "Profit Receipt",
    bank_statement: "Bank Statement",
    other: "Other Document",
  };

  if (user === null) {
    router.push("/auth/signin");
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-neutral-50 to-white dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950">
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl border-b border-neutral-200 dark:border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/member/dashboard" className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span className="font-medium">Back to Dashboard</span>
            </Link>
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <AuthButton />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-neutral-900 dark:text-white mb-2">My Documents</h1>
            <p className="text-neutral-600 dark:text-neutral-400">
              Manage your investment certificates, contracts, and KYC documents
            </p>
          </div>
          <button
            onClick={() => setShowUploadModal(true)}
            className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Upload Document
          </button>
        </div>

        <div className="bg-white dark:bg-neutral-900 rounded-2xl border-2 border-neutral-200 dark:border-neutral-800 shadow-lg overflow-hidden">
          <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 bg-gradient-to-br from-white to-neutral-50 dark:from-neutral-900 dark:to-neutral-900/50">
            <div className="flex gap-2 overflow-x-auto">
              {[
                { value: "all", label: "All Documents" },
                { value: "investment_certificate", label: "Certificates" },
                { value: "contract_agreement", label: "Contracts" },
                { value: "tax_statement", label: "Tax Statements" },
                { value: "kyc_id", label: "KYC Documents" },
              ].map((f) => (
                <button
                  key={f.value}
                  onClick={() => setFilter(f.value)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                    filter === f.value
                      ? "bg-primary-600 text-white"
                      : "bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-12 text-center">
                <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-neutral-600 dark:text-neutral-400">Loading documents...</p>
              </div>
            ) : documents.length === 0 ? (
              <div className="p-12 text-center">
                <div className="w-20 h-20 bg-neutral-100 dark:bg-neutral-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-10 h-10 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <p className="text-lg font-medium text-neutral-900 dark:text-white mb-2">No documents yet</p>
                <p className="text-neutral-600 dark:text-neutral-400 mb-4">
                  Upload your first document to get started
                </p>
                <button
                  onClick={() => setShowUploadModal(true)}
                  className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl transition-colors inline-flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Upload Document
                </button>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-neutral-50 dark:bg-neutral-800/50 border-b border-neutral-200 dark:border-neutral-800">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">
                      Document
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">
                      Size
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">
                      Uploaded
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                  {documents.map((doc) => (
                    <tr key={doc.key} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {getDocumentIcon(doc.data.mimeType)}
                          <div>
                            <p className="font-medium text-neutral-900 dark:text-white">{doc.data.fileName}</p>
                            {doc.data.metadata?.description && (
                              <p className="text-xs text-neutral-500 mt-1">{doc.data.metadata.description}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-neutral-700 dark:text-neutral-300">
                          {documentTypeLabels[doc.data.documentType]}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-neutral-600 dark:text-neutral-400">
                        {formatFileSize(doc.data.fileSize)}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadge(doc.data.status)}`}>
                          {doc.data.status.charAt(0).toUpperCase() + doc.data.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-neutral-600 dark:text-neutral-400">
                        {formatDate(doc.data.uploadedAt)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleDownload(doc)}
                            className="p-2 hover:bg-primary-100 dark:hover:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-lg transition-colors"
                            title="Download"
                          >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDelete(doc.key)}
                            className="p-2 hover:bg-error-100 dark:hover:bg-error-900/30 text-error-600 dark:text-error-400 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </main>

      {showUploadModal && user && (
        <DocumentUploadModal
          userId={user.key}
          onClose={() => setShowUploadModal(false)}
          onSuccess={fetchDocuments}
        />
      )}
    </div>
  );
}
