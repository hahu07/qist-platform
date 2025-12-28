"use client";

import { useState } from "react";
import type { Doc } from "@junobuild/core";
import type { BusinessKycDocument, BusinessKycDocumentType } from "@/schemas";
import { businessKycDocumentLabels, requiredBusinessKycDocuments } from "@/schemas";
import { DocumentPreviewModal } from "./document-preview-modal";

interface DocumentCardProps {
  doc: Doc<BusinessKycDocument>;
  onDelete: (doc: Doc<BusinessKycDocument>) => void;
  onReplace: (doc: Doc<BusinessKycDocument>, file: File) => void;
  kycStatus: string;
}

export function DocumentCard({ doc, onDelete, onReplace, kycStatus }: DocumentCardProps) {
  const [showPreview, setShowPreview] = useState(false);
  const [isReplacing, setIsReplacing] = useState(false);

  const isRequired = requiredBusinessKycDocuments.includes(doc.data.documentType);
  const isExpired = checkDocumentExpiry(doc);
  const canModify = kycStatus === "pending" || kycStatus === "rejected";

  const handleReplaceClick = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".pdf,.jpg,.jpeg,.png";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        setIsReplacing(true);
        await onReplace(doc, file);
        setIsReplacing(false);
      }
    };
    input.click();
  };

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = doc.data.fileUrl;
    link.download = doc.data.fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      <div className="p-4 border border-neutral-200 dark:border-neutral-700 rounded-lg hover:border-primary-300 dark:hover:border-primary-600 transition-colors">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <p className="font-medium text-neutral-900 dark:text-white truncate">
                {businessKycDocumentLabels[doc.data.documentType]}
                {isRequired && <span className="text-danger-500 ml-1">*</span>}
              </p>
              {isExpired && (
                <span className="px-2 py-0.5 text-xs font-medium bg-warning-100 dark:bg-warning-900/30 text-warning-700 dark:text-warning-300 rounded-full">
                  Expired
                </span>
              )}
            </div>
            
            <p className="text-sm text-neutral-500 dark:text-neutral-400 truncate mb-2">
              {doc.data.fileName} • {(doc.data.fileSize / 1024).toFixed(0)}KB
            </p>
            
            <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
              <span>Uploaded: {new Date(doc.data.uploadedAt).toLocaleDateString()}</span>
              {isExpired && (
                <span className="text-warning-600 dark:text-warning-400">
                  • Bank statement is {getMonthsOld(doc)} months old
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-col items-end gap-2">
            <span
              className={`px-3 py-1 text-xs font-medium rounded-full whitespace-nowrap ${
                doc.data.status === "verified"
                  ? "bg-success-100 dark:bg-success-900/30 text-success-800 dark:text-success-300"
                  : doc.data.status === "rejected"
                  ? "bg-danger-100 dark:bg-danger-900/30 text-danger-800 dark:text-danger-300"
                  : "bg-warning-100 dark:bg-warning-900/30 text-warning-800 dark:text-warning-300"
              }`}
            >
              {doc.data.status}
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowPreview(true)}
                className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 text-sm font-medium"
              >
                Preview
              </button>
              
              <button
                onClick={handleDownload}
                className="text-success-600 dark:text-success-400 hover:text-success-700 dark:hover:text-success-300 text-sm font-medium"
                title="Download document"
              >
                Download
              </button>

              {canModify && (
                <>
                  <button
                    onClick={handleReplaceClick}
                    disabled={isReplacing}
                    className="px-3 py-1 text-xs font-medium bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 hover:bg-primary-200 dark:hover:bg-primary-900/50 rounded transition-colors disabled:opacity-50"
                    title="Replace this document"
                  >
                    {isReplacing ? "Replacing..." : "Replace"}
                  </button>
                  
                  <button
                    onClick={() => onDelete(doc)}
                    className="px-3 py-1 text-xs font-medium bg-danger-100 dark:bg-danger-900/30 text-danger-700 dark:text-danger-300 hover:bg-danger-200 dark:hover:bg-danger-900/50 rounded transition-colors"
                    title="Delete this document"
                  >
                    Delete
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Expiry Warning */}
        {isExpired && (
          <div className="mt-3 p-3 bg-warning-50 dark:bg-warning-900/20 border border-warning-200 dark:border-warning-800 rounded-lg">
            <div className="flex items-start gap-2">
              <svg className="w-5 h-5 text-warning-600 dark:text-warning-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div className="flex-1">
                <p className="text-sm font-medium text-warning-800 dark:text-warning-200 mb-1">
                  Document Expired
                </p>
                <p className="text-sm text-warning-700 dark:text-warning-300">
                  Bank statements must be less than 3 months old. Please upload a more recent statement.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Rejection Notice */}
        {doc.data.status === "rejected" && (
          <div className={`mt-3 p-3 rounded-lg border ${
            doc.data.rejectionAllowsResubmit !== false
              ? "bg-warning-50 dark:bg-warning-900/20 border-warning-200 dark:border-warning-800"
              : "bg-danger-50 dark:bg-danger-900/20 border-danger-200 dark:border-danger-800"
          }`}>
            <div className="flex items-start gap-2 mb-2">
              <svg className="w-5 h-5 text-danger-600 dark:text-danger-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              <div className="flex-1">
                <p className="text-sm font-medium text-danger-800 dark:text-danger-200">
                  Rejection Reason
                </p>
                <p className="text-sm text-danger-700 dark:text-danger-300 mt-1">
                  {doc.data.rejectionReason || "No reason provided"}
                </p>
              </div>
            </div>

            {doc.data.rejectionAllowsResubmit !== false ? (
              <div className="text-sm text-warning-800 dark:text-warning-300">
                <p className="font-medium mb-1">How to resubmit:</p>
                <ol className="ml-4 list-decimal space-y-1">
                  <li>Click "Replace" to upload a corrected document, or</li>
                  <li>Click "Delete" and upload a new file</li>
                </ol>
              </div>
            ) : (
              <p className="text-sm text-danger-700 dark:text-danger-300 font-medium">
                This document has been permanently rejected. Please contact support.
              </p>
            )}
          </div>
        )}
      </div>

      {showPreview && (
        <DocumentPreviewModal
          isOpen={showPreview}
          fileUrl={doc.data.fileUrl}
          fileName={doc.data.fileName}
          fileType={doc.data.mimeType}
          onClose={() => setShowPreview(false)}
        />
      )}
    </>
  );
}

// Helper functions
function checkDocumentExpiry(doc: Doc<BusinessKycDocument>): boolean {
  // Only check expiry for bank statements
  if (!doc.data.documentType.includes("bank-statement")) return false;
  
  const uploadDate = new Date(doc.data.uploadedAt);
  const now = new Date();
  const monthsDiff = (now.getFullYear() - uploadDate.getFullYear()) * 12 + 
                     (now.getMonth() - uploadDate.getMonth());
  
  return monthsDiff >= 3;
}

function getMonthsOld(doc: Doc<BusinessKycDocument>): number {
  const uploadDate = new Date(doc.data.uploadedAt);
  const now = new Date();
  return (now.getFullYear() - uploadDate.getFullYear()) * 12 + 
         (now.getMonth() - uploadDate.getMonth());
}
