"use client";

import { useState } from "react";
import type { Doc } from "@junobuild/core";
import type { ApplicationData } from "@/schemas";
import type {
  MurabahaTerms,
  MudarabahTerms,
  MusharakahTerms,
  IjarahTerms,
  SalamTerms,
} from "@/schemas/islamic-contracts.schema";

interface ContractTermsReviewProps {
  application: Doc<ApplicationData>;
  onCounterOffer: (terms: any) => void;
  onApprove: () => void;
  onRequestRevision: (message: string) => void;
}

export function ContractTermsReview({
  application,
  onCounterOffer,
  onApprove,
  onRequestRevision,
}: ContractTermsReviewProps) {
  const [showCounterOfferModal, setShowCounterOfferModal] = useState(false);
  const [revisionMessage, setRevisionMessage] = useState("");
  const [showRevisionModal, setShowRevisionModal] = useState(false);

  const contractType = application.data.contractType;
  const contractTerms = application.data.contractTerms;

  if (!contractTerms) {
    return (
      <div className="p-8 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-warning-100 dark:bg-warning-900/30 rounded-full mb-4">
          <svg className="w-8 h-8 text-warning-600 dark:text-warning-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-2">No Contract Terms Submitted</h3>
        <p className="text-neutral-600 dark:text-neutral-400">This application does not have contract-specific terms.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <div className="flex items-center justify-between pb-4 border-b border-neutral-200 dark:border-neutral-800">
        <div>
          <h3 className="text-xl font-bold text-neutral-900 dark:text-white">Contract Terms Review</h3>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
            Review and approve or counter-offer the proposed terms
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowRevisionModal(true)}
            className="px-4 py-2 bg-warning-600 hover:bg-warning-700 text-white font-medium rounded-lg transition-colors"
          >
            Request Revision
          </button>
          <button
            onClick={() => setShowCounterOfferModal(true)}
            className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors"
          >
            Counter Offer
          </button>
          <button
            onClick={onApprove}
            className="px-4 py-2 bg-success-600 hover:bg-success-700 text-white font-medium rounded-lg transition-colors"
          >
            Approve Terms
          </button>
        </div>
      </div>

      {/* Contract-Specific Terms Display */}
      {contractType === "murabaha" && <MurabahaTermsDisplay terms={contractTerms as MurabahaTerms} />}
      {contractType === "mudaraba" && <MudarabahTermsDisplay terms={contractTerms as MudarabahTerms} />}
      {contractType === "musharaka" && <MusharakahTermsDisplay terms={contractTerms as MusharakahTerms} />}
      {contractType === "ijara" && <IjarahTermsDisplay terms={contractTerms as IjarahTerms} />}
      {contractType === "istisna" && <SalamTermsDisplay terms={contractTerms as SalamTerms} />}

      {/* Counter Offer Modal */}
      {showCounterOfferModal && (
        <CounterOfferModal
          contractType={contractType}
          currentTerms={contractTerms}
          onClose={() => setShowCounterOfferModal(false)}
          onSubmit={(newTerms) => {
            onCounterOffer(newTerms);
            setShowCounterOfferModal(false);
          }}
        />
      )}

      {/* Revision Request Modal */}
      {showRevisionModal && (
        <RevisionRequestModal
          onClose={() => setShowRevisionModal(false)}
          onSubmit={(message) => {
            onRequestRevision(message);
            setShowRevisionModal(false);
          }}
        />
      )}
    </div>
  );
}

// Murabaha Terms Display
function MurabahaTermsDisplay({ terms }: { terms: MurabahaTerms }) {
  const sellingPrice = terms.costPrice * (1 + terms.profitRate / 100);
  const profitAmount = sellingPrice - terms.costPrice;
  const monthlyPayment = terms.numberOfInstallments ? sellingPrice / terms.numberOfInstallments : 0;

  return (
    <div className="grid grid-cols-2 gap-6">
      <InfoCard label="Asset Description" value={terms.assetDescription} />
      <InfoCard label="Cost Price" value={`₦${terms.costPrice.toLocaleString()}`} />
      <InfoCard label="Profit Rate" value={`${terms.profitRate}%`} highlight />
      <InfoCard label="Selling Price" value={`₦${sellingPrice.toLocaleString()}`} />
      <InfoCard label="Profit Amount" value={`₦${profitAmount.toLocaleString()}`} />
      <InfoCard label="Number of Installments" value={terms.numberOfInstallments?.toString() || "N/A"} />
      <InfoCard label="Installment Frequency" value={terms.installmentFrequency || "monthly"} />
      <InfoCard label="Monthly Payment" value={`₦${monthlyPayment.toLocaleString(undefined, { minimumFractionDigits: 2 })}`} />
      {terms.earlySettlementDiscount > 0 && (
        <InfoCard label="Early Settlement Discount" value={`${terms.earlySettlementDiscount}%`} />
      )}
    </div>
  );
}

// Mudarabah Terms Display
function MudarabahTermsDisplay({ terms }: { terms: MudarabahTerms }) {
  return (
    <div className="grid grid-cols-2 gap-6">
      <InfoCard label="Capital Amount" value={`₦${terms.capitalAmount.toLocaleString()}`} />
      <InfoCard label="Business Activity" value={terms.businessActivity} span2 />
      <InfoCard label="Investor Profit Share" value={`${terms.investorProfitShare}%`} highlight />
      <InfoCard label="Mudarib Profit Share" value={`${terms.mudaribProfitShare}%`} highlight />
      <InfoCard label="Expected Return Rate" value={`${terms.expectedReturnRate}% p.a.`} />
      <InfoCard label="Profit Calculation Method" value={terms.profitCalculationMethod} />
      <InfoCard label="Profit Distribution Frequency" value={terms.profitDistributionFrequency} />
      <InfoCard label="Mudarib Authority" value={terms.mudaribAuthority} />
      <InfoCard label="Capital Guarantee" value={terms.capitalGuarantee ? "Yes (Non-Shariah)" : "No"} />
    </div>
  );
}

// Musharakah Terms Display
function MusharakahTermsDisplay({ terms }: { terms: MusharakahTerms }) {
  const totalCapital = terms.party1Capital + terms.party2Capital;
  const party1CapitalRatio = ((terms.party1Capital / totalCapital) * 100).toFixed(1);
  const party2CapitalRatio = ((terms.party2Capital / totalCapital) * 100).toFixed(1);

  return (
    <div className="space-y-6">
      <InfoCard label="Partnership Type" value={terms.partnershipType} span2 />
      <InfoCard label="Business Purpose" value={terms.businessPurpose} span2 />
      
      {/* Partner 1 */}
      <div className="bg-primary-50 dark:bg-primary-900/20 rounded-lg p-4 border-2 border-primary-200 dark:border-primary-800">
        <h4 className="font-bold text-primary-900 dark:text-primary-100 mb-3">Partner 1 (Institution)</h4>
        <div className="grid grid-cols-2 gap-4">
          <InfoCard label="Name" value={terms.party1Name || "Institution"} light />
          <InfoCard label="Capital Contribution" value={`₦${terms.party1Capital.toLocaleString()}`} light />
          <InfoCard label="Capital Ratio" value={`${party1CapitalRatio}%`} light />
          <InfoCard label="Profit Share" value={`${terms.party1ProfitShare}%`} highlight light />
          <InfoCard label="Loss Share" value={`${terms.party1LossShare}%`} light />
        </div>
      </div>

      {/* Partner 2 */}
      <div className="bg-success-50 dark:bg-success-900/20 rounded-lg p-4 border-2 border-success-200 dark:border-success-800">
        <h4 className="font-bold text-success-900 dark:text-success-100 mb-3">Partner 2 (Business)</h4>
        <div className="grid grid-cols-2 gap-4">
          <InfoCard label="Name" value={terms.party2Name || "Business"} light />
          <InfoCard label="Capital Contribution" value={`₦${terms.party2Capital.toLocaleString()}`} light />
          <InfoCard label="Capital Ratio" value={`${party2CapitalRatio}%`} light />
          <InfoCard label="Profit Share" value={`${terms.party2ProfitShare}%`} highlight light />
          <InfoCard label="Loss Share" value={`${terms.party2LossShare}%`} light />
        </div>
      </div>

      {terms.exitStrategy && <InfoCard label="Exit Strategy" value={terms.exitStrategy} span2 />}
    </div>
  );
}

// Ijarah Terms Display
function IjarahTermsDisplay({ terms }: { terms: IjarahTerms }) {
  const totalRental = terms.monthlyRental * (terms.leaseTerm || terms.duration);

  return (
    <div className="grid grid-cols-2 gap-6">
      <InfoCard label="Asset Description" value={terms.assetDescription} span2 />
      <InfoCard label="Asset Type" value={terms.assetType || terms.assetCategory} />
      <InfoCard label="Asset Value" value={`₦${terms.assetValue.toLocaleString()}`} />
      <InfoCard label="Monthly Rental" value={`₦${terms.monthlyRental.toLocaleString()}`} highlight />
      <InfoCard label="Lease Term" value={`${terms.leaseTerm || terms.duration} months`} />
      <InfoCard label="Total Rental Payments" value={`₦${totalRental.toLocaleString()}`} />
      <InfoCard label="Purchase Option" value={terms.purchaseOption || terms.purchaseOptionIncluded ? "Yes" : "No"} />
      {(terms.purchaseOption || terms.purchaseOptionIncluded) && (
        <InfoCard label="Purchase Price" value={`₦${(terms.purchasePrice || terms.residualValue || 0).toLocaleString()}`} />
      )}
      <InfoCard label="Maintenance Responsibility" value={terms.maintenanceResponsibility} />
      <InfoCard label="Insurance Required" value={terms.insuranceRequired || terms.insuranceRequirement ? "Yes" : "No"} />
    </div>
  );
}

// Salam Terms Display
function SalamTermsDisplay({ terms }: { terms: SalamTerms }) {
  const discount = terms.deliveryValue - terms.agreedPrice;
  const discountPercent = ((discount / terms.deliveryValue) * 100).toFixed(2);

  return (
    <div className="grid grid-cols-2 gap-6">
      <InfoCard label="Commodity Type" value={terms.commodityType} />
      <InfoCard label="Quantity" value={`${terms.quantity} ${terms.unit}`} />
      <InfoCard label="Commodity Description" value={terms.commodityDescription} span2 />
      <InfoCard label="Quality Grade" value={terms.qualityGrade} />
      <InfoCard label="Agreed Price" value={`₦${terms.agreedPrice.toLocaleString()}`} highlight />
      <InfoCard label="Spot Price" value={`₦${terms.spotPrice.toLocaleString()}`} />
      <InfoCard label="Delivery Value" value={`₦${terms.deliveryValue.toLocaleString()}`} />
      <InfoCard label="Discount" value={`₦${discount.toLocaleString()} (${discountPercent}%)`} />
      <InfoCard label="Advance Payment" value={`₦${terms.advancePayment.toLocaleString()}`} />
      <InfoCard label="Delivery Date" value={new Date(terms.deliveryDate).toLocaleDateString()} />
      <InfoCard label="Delivery Location" value={terms.deliveryLocation} />
      {terms.qualitySpecifications && terms.qualitySpecifications.length > 0 && (
        <InfoCard label="Quality Specifications" value={terms.qualitySpecifications.join(", ")} span2 />
      )}
    </div>
  );
}

// Helper Component
function InfoCard({
  label,
  value,
  highlight = false,
  span2 = false,
  light = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  span2?: boolean;
  light?: boolean;
}) {
  return (
    <div className={`${span2 ? "col-span-2" : ""} ${light ? "" : "bg-white dark:bg-neutral-800 rounded-lg p-4 border border-neutral-200 dark:border-neutral-700"}`}>
      <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1">{label}</p>
      <p className={`font-semibold ${highlight ? "text-primary-600 dark:text-primary-400 text-lg" : "text-neutral-900 dark:text-white"}`}>
        {value}
      </p>
    </div>
  );
}

// Counter Offer Modal
function CounterOfferModal({
  contractType,
  currentTerms,
  onClose,
  onSubmit,
}: {
  contractType: string;
  currentTerms: any;
  onClose: () => void;
  onSubmit: (terms: any) => void;
}) {
  const [counterTerms, setCounterTerms] = useState({ ...currentTerms });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-neutral-900 rounded-2xl max-w-2xl w-full p-6 border-[3px] border-black dark:border-neutral-600 shadow-[8px_8px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_#7888FF]">
        <h3 className="text-2xl font-bold text-neutral-900 dark:text-white mb-4">Counter Offer</h3>
        <p className="text-neutral-600 dark:text-neutral-400 mb-6">
          Propose alternative terms for this {contractType} contract
        </p>

        <div className="space-y-4 mb-6">
          {/* Contract-specific counter offer fields */}
          {contractType === "murabaha" && (
            <>
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Counter Profit Rate (%)
                </label>
                <input
                  type="number"
                  value={counterTerms.profitRate || ""}
                  onChange={(e) => setCounterTerms({ ...counterTerms, profitRate: parseFloat(e.target.value) })}
                  className="w-full px-4 py-2 border-2 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-neutral-800"
                  placeholder="Proposed profit rate"
                  min={0}
                  max={50}
                  step={0.1}
                />
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                  Current: {currentTerms.profitRate}%
                </p>
              </div>
            </>
          )}

          {(contractType === "mudaraba" || contractType === "musharaka") && (
            <>
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Counter Investor/Party 1 Profit Share (%)
                </label>
                <input
                  type="number"
                  value={contractType === "mudaraba" ? (counterTerms.investorProfitShare || "") : (counterTerms.party1ProfitShare || "")}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value) || 0;
                    if (contractType === "mudaraba") {
                      setCounterTerms({
                        ...counterTerms,
                        investorProfitShare: value,
                        mudaribProfitShare: 100 - value,
                      });
                    } else {
                      setCounterTerms({
                        ...counterTerms,
                        party1ProfitShare: value,
                        party2ProfitShare: 100 - value,
                      });
                    }
                  }}
                  className="w-full px-4 py-2 border-2 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-neutral-800"
                  min={0}
                  max={100}
                  step={0.1}
                />
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                  Current: {contractType === "mudaraba" ? currentTerms.investorProfitShare : currentTerms.party1ProfitShare}%
                </p>
              </div>
            </>
          )}

          {contractType === "ijara" && (
            <>
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Counter Monthly Rental (₦)
                </label>
                <input
                  type="number"
                  value={counterTerms.monthlyRental || ""}
                  onChange={(e) => setCounterTerms({ ...counterTerms, monthlyRental: parseFloat(e.target.value) })}
                  className="w-full px-4 py-2 border-2 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-neutral-800"
                  placeholder="Proposed monthly rental"
                  min={0}
                  step={0.01}
                />
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                  Current: ₦{currentTerms.monthlyRental.toLocaleString()}
                </p>
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Justification for Counter Offer
            </label>
            <textarea
              value={counterTerms.counterOfferMessage || ""}
              onChange={(e) => setCounterTerms({ ...counterTerms, counterOfferMessage: e.target.value })}
              className="w-full px-4 py-2 border-2 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-neutral-800"
              rows={3}
              placeholder="Explain why you're proposing these alternative terms..."
            />
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 bg-neutral-200 dark:bg-neutral-700 text-neutral-900 dark:text-white font-bold rounded-xl hover:bg-neutral-300 dark:hover:bg-neutral-600"
          >
            Cancel
          </button>
          <button
            onClick={() => onSubmit(counterTerms)}
            className="flex-1 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl"
          >
            Send Counter Offer
          </button>
        </div>
      </div>
    </div>
  );
}

// Revision Request Modal
function RevisionRequestModal({
  onClose,
  onSubmit,
}: {
  onClose: () => void;
  onSubmit: (message: string) => void;
}) {
  const [message, setMessage] = useState("");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-neutral-900 rounded-2xl max-w-2xl w-full p-6 border-[3px] border-black dark:border-neutral-600 shadow-[8px_8px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_#7888FF]">
        <h3 className="text-2xl font-bold text-neutral-900 dark:text-white mb-4">Request Revision</h3>
        <p className="text-neutral-600 dark:text-neutral-400 mb-6">
          Ask the business to revise their proposed contract terms
        </p>

        <div className="mb-6">
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
            What needs to be revised?
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full px-4 py-2 border-2 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-neutral-800"
            rows={5}
            placeholder="Please provide more details about your capital sources, or revise your profit share expectations based on..."
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 bg-neutral-200 dark:bg-neutral-700 text-neutral-900 dark:text-white font-bold rounded-xl hover:bg-neutral-300 dark:hover:bg-neutral-600"
          >
            Cancel
          </button>
          <button
            onClick={() => onSubmit(message)}
            disabled={!message.trim()}
            className="flex-1 px-6 py-3 bg-warning-600 hover:bg-warning-700 text-white font-bold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Send Revision Request
          </button>
        </div>
      </div>
    </div>
  );
}
