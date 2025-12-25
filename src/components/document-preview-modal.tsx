"use client";

import { useState } from "react";

interface DocumentPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileUrl?: string;
  fileName?: string;
  fileType?: string;
}

export function DocumentPreviewModal({
  isOpen,
  onClose,
  fileUrl,
  fileName = "Document",
  fileType = "application/pdf",
}: DocumentPreviewModalProps) {
  const [error, setError] = useState(false);

  if (!isOpen) return null;

  const isImage = fileType?.startsWith("image/");
  const isPDF = fileType === "application/pdf" || fileName?.endsWith(".pdf");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-white dark:bg-neutral-900 rounded-2xl border-[3px] border-black dark:border-neutral-600 shadow-[8px_8px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_#7888FF] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b-2 border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
              <svg
                className="w-5 h-5 text-primary-600 dark:text-primary-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <div>
              <h3 className="font-bold text-neutral-900 dark:text-white">{fileName}</h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                {isImage ? "Image Preview" : isPDF ? "PDF Preview" : "Document"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
          >
            <svg
              className="w-5 h-5 text-neutral-500 dark:text-neutral-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Preview Content */}
        <div className="flex-1 overflow-auto bg-neutral-50 dark:bg-neutral-950 p-4">
          {error ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
              <svg
                className="w-16 h-16 text-neutral-400 dark:text-neutral-600 mb-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="text-neutral-600 dark:text-neutral-400 mb-2">
                Unable to preview this document
              </p>
              <p className="text-sm text-neutral-500 dark:text-neutral-500">
                Try downloading it instead
              </p>
            </div>
          ) : isImage && fileUrl ? (
            <div className="flex items-center justify-center">
              <img
                src={fileUrl}
                alt={fileName}
                onError={() => setError(true)}
                className="max-w-full max-h-[70vh] object-contain rounded-lg"
              />
            </div>
          ) : isPDF && fileUrl ? (
            <iframe
              src={fileUrl}
              title={fileName}
              onError={() => setError(true)}
              className="w-full h-[70vh] rounded-lg border-2 border-neutral-200 dark:border-neutral-800"
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
              <svg
                className="w-16 h-16 text-neutral-400 dark:text-neutral-600 mb-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <p className="text-neutral-600 dark:text-neutral-400">
                Preview not available for this file type
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t-2 border-neutral-200 dark:border-neutral-800">
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            {fileUrl ? "Preview loaded" : "No file URL provided"}
          </p>
          <div className="flex gap-2">
            {fileUrl && (
              <a
                href={fileUrl}
                download={fileName}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors"
              >
                Download
              </a>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 bg-white dark:bg-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-700 border-2 border-neutral-300 dark:border-neutral-600 text-neutral-700 dark:text-neutral-300 font-medium rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
