"use client";

import { useEffect, useState } from "react";
import { initSatellite } from "@junobuild/core";
import {
  CreditBureauResponse,
  KYCVerificationResponse,
  DocumentOCRResult,
} from "@/schemas/integrations.schema";
import {
  fetchCreditReport,
  verifyKYC,
  processDocumentOCR,
} from "@/utils/integration-actions";

interface IntegrationHubProps {
  applicationId: string;
  applicantData: {
    bvn?: string;
    nin?: string;
    name: string;
    email: string;
  };
}

export default function IntegrationHub({ applicationId, applicantData }: IntegrationHubProps) {
  const [activeTab, setActiveTab] = useState<"credit" | "kyc" | "ocr">("credit");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");

  // Credit Bureau
  const [creditReport, setCreditReport] = useState<CreditBureauResponse | null>(null);

  // KYC
  const [kycType, setKycType] = useState<KYCVerificationResponse["verificationType"]>("bvn");
  const [kycNumber, setKycNumber] = useState("");
  const [kycResult, setKycResult] = useState<KYCVerificationResponse | null>(null);

  // OCR
  const [documentUrl, setDocumentUrl] = useState("");
  const [documentType, setDocumentType] = useState("");
  const [ocrResult, setOcrResult] = useState<DocumentOCRResult | null>(null);

  useEffect(() => {
    (async () => await initSatellite({ workers: { auth: true } }))();
  }, []);

  const handleFetchCreditReport = async () => {
    if (!applicantData.bvn) {
      setError("BVN is required for credit report");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const report = await fetchCreditReport(
        applicationId,
        applicantData.bvn,
        "current_user_id"
      );
      setCreditReport(report);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch credit report");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyKYC = async () => {
    if (!kycNumber) {
      setError("Identification number is required");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const result = await verifyKYC(
        applicationId,
        kycType,
        kycNumber,
        "current_user_id"
      );
      setKycResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "KYC verification failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleProcessOCR = async () => {
    if (!documentUrl || !documentType) {
      setError("Document URL and type are required");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const result = await processDocumentOCR(
        `doc_${Date.now()}`,
        documentType,
        documentUrl,
        applicationId
      );
      setOcrResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "OCR processing failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex space-x-2 border-b border-neutral-200 dark:border-neutral-700">
        <button
          onClick={() => setActiveTab("credit")}
          className={`px-4 py-2 font-medium text-sm transition-colors ${
            activeTab === "credit"
              ? "text-primary-600 border-b-2 border-primary-600"
              : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
          }`}
        >
          Credit Bureau
        </button>
        <button
          onClick={() => setActiveTab("kyc")}
          className={`px-4 py-2 font-medium text-sm transition-colors ${
            activeTab === "kyc"
              ? "text-primary-600 border-b-2 border-primary-600"
              : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
          }`}
        >
          KYC Verification
        </button>
        <button
          onClick={() => setActiveTab("ocr")}
          className={`px-4 py-2 font-medium text-sm transition-colors ${
            activeTab === "ocr"
              ? "text-primary-600 border-b-2 border-primary-600"
              : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
          }`}
        >
          Document OCR
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Credit Bureau Tab */}
      {activeTab === "credit" && (
        <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-sm p-6 border border-neutral-200 dark:border-neutral-700">
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">
            Credit Bureau Report
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                BVN
              </label>
              <input
                type="text"
                value={applicantData.bvn || ""}
                disabled
                className="w-full px-4 py-2 border border-neutral-200 dark:border-neutral-700 rounded-lg bg-neutral-100 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100"
              />
            </div>

            <button
              onClick={handleFetchCreditReport}
              disabled={isLoading || !applicantData.bvn}
              className="w-full px-6 py-3 bg-primary-600 hover:bg-primary-700 disabled:bg-neutral-400 text-white font-medium rounded-xl transition-colors"
            >
              {isLoading ? "Fetching Report..." : "Fetch Credit Report"}
            </button>

            {creditReport && (
              <div className="mt-6 space-y-4">
                {/* Credit Score */}
                <div className="p-4 bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20 rounded-lg">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-primary-600 dark:text-primary-400">
                      {creditReport.creditScore}
                    </div>
                    <div className="text-sm text-neutral-600 dark:text-neutral-400">
                      Credit Score
                    </div>
                    <div className="mt-2">
                      <span className="px-3 py-1 bg-primary-600 text-white text-xs font-medium rounded-full">
                        Rating: {creditReport.creditRating}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Account Summary */}
                <div>
                  <h4 className="text-sm font-medium text-neutral-900 dark:text-white mb-2">
                    Account Summary
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-neutral-50 dark:bg-neutral-900/50 rounded-lg">
                      <div className="text-lg font-semibold text-neutral-900 dark:text-white">
                        {creditReport.accountSummary.totalAccounts}
                      </div>
                      <div className="text-xs text-neutral-600 dark:text-neutral-400">
                        Total Accounts
                      </div>
                    </div>
                    <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <div className="text-lg font-semibold text-green-600 dark:text-green-400">
                        {creditReport.accountSummary.activeAccounts}
                      </div>
                      <div className="text-xs text-neutral-600 dark:text-neutral-400">
                        Active
                      </div>
                    </div>
                    <div className="p-3 bg-neutral-50 dark:bg-neutral-900/50 rounded-lg">
                      <div className="text-lg font-semibold text-neutral-900 dark:text-white">
                        {creditReport.accountSummary.closedAccounts}
                      </div>
                      <div className="text-xs text-neutral-600 dark:text-neutral-400">
                        Closed
                      </div>
                    </div>
                    <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                      <div className="text-lg font-semibold text-red-600 dark:text-red-400">
                        {creditReport.accountSummary.defaultedAccounts}
                      </div>
                      <div className="text-xs text-neutral-600 dark:text-neutral-400">
                        Defaulted
                      </div>
                    </div>
                  </div>
                </div>

                {/* Risk Flags */}
                {creditReport.riskFlags.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-neutral-900 dark:text-white mb-2">
                      Risk Flags
                    </h4>
                    <div className="space-y-2">
                      {creditReport.riskFlags.map((flag, index) => (
                        <div
                          key={index}
                          className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
                        >
                          <p className="text-sm text-red-600 dark:text-red-400">{flag}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* KYC Verification Tab */}
      {activeTab === "kyc" && (
        <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-sm p-6 border border-neutral-200 dark:border-neutral-700">
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">
            KYC Verification
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                Verification Type
              </label>
              <select
                value={kycType}
                onChange={(e) => setKycType(e.target.value as KYCVerificationResponse["verificationType"])}
                className="w-full px-4 py-2 border border-neutral-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="bvn">BVN</option>
                <option value="nin">NIN</option>
                <option value="drivers_license">Driver's License</option>
                <option value="passport">Passport</option>
                <option value="company_registration">Company Registration</option>
                <option value="tax_id">Tax ID</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                Identification Number
              </label>
              <input
                type="text"
                value={kycNumber}
                onChange={(e) => setKycNumber(e.target.value)}
                placeholder="Enter identification number..."
                className="w-full px-4 py-2 border border-neutral-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            <button
              onClick={handleVerifyKYC}
              disabled={isLoading || !kycNumber}
              className="w-full px-6 py-3 bg-primary-600 hover:bg-primary-700 disabled:bg-neutral-400 text-white font-medium rounded-xl transition-colors"
            >
              {isLoading ? "Verifying..." : "Verify KYC"}
            </button>

            {kycResult && (
              <div className="mt-6 space-y-4">
                <div className={`p-4 rounded-lg ${
                  kycResult.status === "verified"
                    ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800"
                    : "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
                }`}>
                  <div className="text-center">
                    <div className={`text-2xl font-bold ${
                      kycResult.status === "verified" ? "text-green-600" : "text-red-600"
                    }`}>
                      {kycResult.status.toUpperCase()}
                    </div>
                    <div className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                      Match Score: {kycResult.matchScore}%
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-neutral-900 dark:text-white mb-2">
                    Verified Details
                  </h4>
                  <div className="space-y-2">
                    {Object.entries(kycResult.details).map(([key, value]) =>
                      value ? (
                        <div
                          key={key}
                          className="flex justify-between p-3 bg-neutral-50 dark:bg-neutral-900/50 rounded-lg"
                        >
                          <span className="text-sm text-neutral-600 dark:text-neutral-400">
                            {key.replace(/([A-Z])/g, " $1").trim()}:
                          </span>
                          <span className="text-sm font-medium text-neutral-900 dark:text-white">
                            {value}
                          </span>
                        </div>
                      ) : null
                    )}
                  </div>
                </div>

                {kycResult.discrepancies.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-neutral-900 dark:text-white mb-2">
                      Discrepancies
                    </h4>
                    <div className="space-y-2">
                      {kycResult.discrepancies.map((discrepancy, index) => (
                        <div
                          key={index}
                          className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg"
                        >
                          <p className="text-sm text-yellow-600 dark:text-yellow-400">
                            {discrepancy}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Document OCR Tab */}
      {activeTab === "ocr" && (
        <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-sm p-6 border border-neutral-200 dark:border-neutral-700">
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">
            Document OCR Processing
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                Document Type
              </label>
              <input
                type="text"
                value={documentType}
                onChange={(e) => setDocumentType(e.target.value)}
                placeholder="e.g., passport, bank_statement, tax_certificate"
                className="w-full px-4 py-2 border border-neutral-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                Document URL
              </label>
              <input
                type="url"
                value={documentUrl}
                onChange={(e) => setDocumentUrl(e.target.value)}
                placeholder="https://example.com/document.pdf"
                className="w-full px-4 py-2 border border-neutral-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            <button
              onClick={handleProcessOCR}
              disabled={isLoading || !documentUrl || !documentType}
              className="w-full px-6 py-3 bg-primary-600 hover:bg-primary-700 disabled:bg-neutral-400 text-white font-medium rounded-xl transition-colors"
            >
              {isLoading ? "Processing..." : "Process Document"}
            </button>

            {ocrResult && (
              <div className="mt-6 space-y-4">
                <div className="p-4 bg-neutral-50 dark:bg-neutral-900/50 rounded-lg">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                      {ocrResult.confidence}%
                    </div>
                    <div className="text-sm text-neutral-600 dark:text-neutral-400">
                      Confidence Score
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-neutral-900 dark:text-white mb-2">
                    Extracted Fields
                  </h4>
                  <div className="space-y-2">
                    {ocrResult.detectedFields.map((field, index) => (
                      <div
                        key={index}
                        className="p-3 bg-neutral-50 dark:bg-neutral-900/50 rounded-lg"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="text-xs text-neutral-600 dark:text-neutral-400">
                              {field.fieldName}
                            </div>
                            <div className="text-sm font-medium text-neutral-900 dark:text-white mt-1">
                              {field.value}
                            </div>
                          </div>
                          <span className={`text-xs px-2 py-1 rounded ${
                            field.confidence >= 80
                              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                              : field.confidence >= 60
                              ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                              : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                          }`}>
                            {field.confidence}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {ocrResult.requiresManualReview && (
                  <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                    <p className="text-sm text-yellow-600 dark:text-yellow-400">
                      ⚠️ This document requires manual review due to low confidence scores or validation errors.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
