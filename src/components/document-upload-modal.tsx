"use client";

import { useState } from "react";
import { uploadDocument } from "@/utils/document-actions";
import type { DocumentUpload } from "@/schemas";

interface DocumentUploadModalProps {
  userId: string;
  documentType?: string;
  relatedEntityId?: string;
  relatedEntityType?: "investment" | "application" | "transaction" | "kyc" | "profile";
  isOpen?: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function DocumentUploadModal({
  userId,
  documentType = "other",
  relatedEntityId,
  relatedEntityType,
  isOpen = true,
  onClose,
  onSuccess,
}: DocumentUploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState<DocumentUpload>({
    documentType: documentType as any,
    relatedEntityId,
    relatedEntityType,
    description: "",
    tags: [],
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Validate file size (max 10MB)
      if (selectedFile.size > 10 * 1024 * 1024) {
        setError("File size must be less than 10MB");
        return;
      }

      // Validate file type
      const allowedTypes = ["application/pdf", "image/jpeg", "image/png", "image/jpg"];
      if (!allowedTypes.includes(selectedFile.type)) {
        setError("Only PDF, JPG, and PNG files are allowed");
        return;
      }

      setFile(selectedFile);
      setError("");
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a file");
      return;
    }

    setUploading(true);
    setError("");

    const result = await uploadDocument(userId, file, formData);

    if (result.success) {
      onSuccess();
      onClose();
    } else {
      setError(result.error || "Failed to upload document");
    }

    setUploading(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border-2 border-neutral-200 dark:border-neutral-800 shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">Upload Document</h2>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 text-neutral-600 dark:text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          {/* Document Type */}
          <div>
            <label htmlFor="documentType" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Document Type *
            </label>
            <select
              id="documentType"
              value={formData.documentType}
              onChange={(e) => setFormData({ ...formData, documentType: e.target.value as any })}
              className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              disabled={uploading}
            >
              <option value="kyc_id">KYC ID Document</option>
              <option value="kyc_proof_of_address">Proof of Address</option>
              <option value="kyc_business_registration">Business Registration</option>
              <option value="investment_certificate">Investment Certificate</option>
              <option value="contract_agreement">Contract Agreement</option>
              <option value="tax_statement">Tax Statement</option>
              <option value="profit_distribution_receipt">Profit Distribution Receipt</option>
              <option value="bank_statement">Bank Statement</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* File Upload */}
          <div>
            <label htmlFor="fileInput" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Select File * (PDF, JPG, PNG - Max 10MB)
            </label>
            <div className="relative">
              <input
                id="fileInput"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileChange}
                disabled={uploading}
                className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary-600 file:text-white hover:file:bg-primary-700 file:cursor-pointer"
              />
            </div>
            {file && (
              <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
                Selected: {file.name} ({(file.size / 1024).toFixed(2)} KB)
              </p>
            )}
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Description (Optional)
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              maxLength={500}
              disabled={uploading}
              className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
              placeholder="Add any notes about this document..."
            />
            <p className="mt-1 text-xs text-neutral-500">{formData.description?.length || 0}/500</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-error-100 dark:bg-error-900/30 border border-error-200 dark:border-error-800 rounded-lg">
              <p className="text-sm text-error-700 dark:text-error-300">{error}</p>
            </div>
          )}

          {/* Info */}
          <div className="p-4 bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-lg">
            <div className="flex gap-3">
              <svg className="w-5 h-5 text-primary-600 dark:text-primary-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-sm font-medium text-primary-900 dark:text-primary-200 mb-1">Upload Guidelines</p>
                <ul className="text-xs text-primary-700 dark:text-primary-300 space-y-1">
                  <li>• Documents are securely stored and encrypted</li>
                  <li>• Maximum file size: 10MB</li>
                  <li>• Accepted formats: PDF, JPG, PNG</li>
                  <li>• Documents will be reviewed by our team</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-neutral-200 dark:border-neutral-800 flex gap-3">
          <button
            onClick={onClose}
            disabled={uploading}
            className="flex-1 px-6 py-3 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={uploading || !file}
            className="flex-1 px-6 py-3 bg-primary-600 hover:bg-primary-700 disabled:bg-neutral-400 text-white font-semibold rounded-xl transition-colors disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {uploading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Uploading...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                Upload Document
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
