"use client";

import type { Doc } from "@junobuild/core";
import type { ApplicationData } from "@/schemas";
import Link from "next/link";

interface ContractTermsStatusProps {
  application: Doc<ApplicationData>;
}

export function ContractTermsStatus({ application }: ContractTermsStatusProps) {
  const contractTermsStatus = application.data.contractTermsStatus;
  const contractType = application.data.contractType;

  // Only show if application has contract terms
  if (!application.data.contractTerms) {
    return null;
  }

  // Don't show for approved applications (already in approved state)
  if (application.data.status === 'approved') {
    return null;
  }

  return (
    <div className="mt-4">
      {/* Contract Terms Approved */}
      {contractTermsStatus === 'approved' && (
        <div className="relative overflow-hidden bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-l-4 border-green-500 dark:border-green-600 rounded-xl p-5 shadow-sm">
          <div className="absolute top-0 right-0 w-32 h-32 bg-green-400/10 dark:bg-green-400/5 rounded-full -mr-16 -mt-16"></div>
          <div className="relative flex items-start gap-4">
            <div className="flex-shrink-0 w-10 h-10 bg-green-100 dark:bg-green-900/40 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <h4 className="text-base font-bold text-green-900 dark:text-green-200">Contract Terms Approved</h4>
                <span className="px-2 py-0.5 text-xs font-medium bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200 rounded-full">
                  ✓ Approved
                </span>
              </div>
              <p className="text-sm text-green-800 dark:text-green-300 leading-relaxed">
                Your proposed {contractType} contract terms have been approved by the institution. Your application will now proceed to final approval.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Counter Offer Received */}
      {contractTermsStatus === 'counter-offered' && application.data.contractTermsCounterOffer && (
        <div className="relative overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-l-4 border-blue-500 dark:border-blue-600 rounded-xl p-5 shadow-sm">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-400/10 dark:bg-blue-400/5 rounded-full -mr-16 -mt-16"></div>
          <div className="relative flex items-start gap-4">
            <div className="flex-shrink-0 w-10 h-10 bg-blue-100 dark:bg-blue-900/40 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <h4 className="text-base font-bold text-blue-900 dark:text-blue-200">Counter Offer Received</h4>
                <span className="px-2 py-0.5 text-xs font-medium bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200 rounded-full">
                  Action Required
                </span>
              </div>
              <p className="text-sm text-blue-800 dark:text-blue-300 leading-relaxed mb-4">
                The institution has proposed alternative terms for your {contractType} contract. Please review the counter offer and decide whether to accept or revise.
              </p>

              {/* Counter Offer Details */}
              <CounterOfferDetails 
                contractType={contractType}
                originalTerms={application.data.contractTerms}
                counterOffer={application.data.contractTermsCounterOffer}
              />

              <div className="flex gap-3 mt-4">
                <Link
                  href="/business/financing/apply"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-semibold rounded-lg transition-all shadow-sm hover:shadow-md"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  Review Counter Offer
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Revision Requested */}
      {contractTermsStatus === 'revision-requested' && application.data.contractTermsRevisionMessage && (
        <div className="relative overflow-hidden bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-l-4 border-amber-500 dark:border-amber-600 rounded-xl p-5 shadow-sm">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-400/10 dark:bg-amber-400/5 rounded-full -mr-16 -mt-16"></div>
          <div className="relative flex items-start gap-4">
            <div className="flex-shrink-0 w-10 h-10 bg-amber-100 dark:bg-amber-900/40 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <h4 className="text-base font-bold text-amber-900 dark:text-amber-200">Contract Terms Need Revision</h4>
                <span className="px-2 py-0.5 text-xs font-medium bg-amber-200 dark:bg-amber-800 text-amber-800 dark:text-amber-200 rounded-full">
                  Review Needed
                </span>
              </div>
              <p className="text-sm text-amber-800 dark:text-amber-300 leading-relaxed mb-3">
                The institution has requested changes to your proposed contract terms:
              </p>
              <div className="bg-amber-100/50 dark:bg-amber-900/20 rounded-lg p-3 mb-4 border border-amber-200 dark:border-amber-800">
                <p className="text-sm text-amber-900 dark:text-amber-200 italic">
                  "{application.data.contractTermsRevisionMessage}"
                </p>
              </div>
              <Link
                href="/business/financing/apply"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white text-sm font-semibold rounded-lg transition-all shadow-sm hover:shadow-md"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Revise Contract Terms
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Terms Under Review */}
      {(!contractTermsStatus || contractTermsStatus === 'pending') && (
        <div className="relative overflow-hidden bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-800 dark:to-neutral-900 border-l-4 border-neutral-400 dark:border-neutral-600 rounded-xl p-5 shadow-sm">
          <div className="absolute top-0 right-0 w-32 h-32 bg-neutral-400/10 dark:bg-neutral-400/5 rounded-full -mr-16 -mt-16"></div>
          <div className="relative flex items-start gap-4">
            <div className="flex-shrink-0 w-10 h-10 bg-neutral-100 dark:bg-neutral-700/40 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-neutral-600 dark:text-neutral-400 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <h4 className="text-base font-bold text-neutral-900 dark:text-neutral-200">Contract Terms Under Review</h4>
                <span className="px-2 py-0.5 text-xs font-medium bg-neutral-200 dark:bg-neutral-700 text-neutral-800 dark:text-neutral-200 rounded-full">
                  Pending
                </span>
              </div>
              <p className="text-sm text-neutral-700 dark:text-neutral-400 leading-relaxed">
                Your {contractType} contract terms are currently being reviewed by the institution. You'll be notified once they're approved or if changes are requested.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Counter Offer Details Component
function CounterOfferDetails({
  contractType,
  originalTerms,
  counterOffer,
}: {
  contractType: string;
  originalTerms: any;
  counterOffer: any;
}) {
  return (
    <div className="bg-white/50 dark:bg-neutral-900/30 rounded-lg border border-blue-200 dark:border-blue-800 overflow-hidden">
      <div className="grid grid-cols-2 divide-x divide-blue-200 dark:divide-blue-800">
        {/* Original Terms */}
        <div className="p-4">
          <h5 className="text-xs font-bold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider mb-3">Your Proposal</h5>
          <div className="space-y-2">
            {contractType === 'murabaha' && (
              <>
                <ComparisonItem label="Profit Rate" value={`${originalTerms.profitRate}%`} />
                <ComparisonItem label="Cost Price" value={`₦${originalTerms.costPrice?.toLocaleString()}`} />
              </>
            )}
            {(contractType === 'mudaraba' || contractType === 'musharaka') && (
              <>
                <ComparisonItem 
                  label="Your Profit Share" 
                  value={`${originalTerms.mudaribProfitShare || originalTerms.party2ProfitShare}%`} 
                />
                <ComparisonItem 
                  label="Institution Share" 
                  value={`${originalTerms.investorProfitShare || originalTerms.party1ProfitShare}%`} 
                />
              </>
            )}
            {contractType === 'ijara' && (
              <ComparisonItem label="Monthly Rental" value={`₦${originalTerms.monthlyRental?.toLocaleString()}`} />
            )}
          </div>
        </div>

        {/* Counter Offer */}
        <div className="p-4 bg-blue-50/50 dark:bg-blue-900/10">
          <h5 className="text-xs font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider mb-3">Counter Offer</h5>
          <div className="space-y-2">
            {contractType === 'murabaha' && (
              <>
                <ComparisonItem label="Profit Rate" value={`${counterOffer.profitRate}%`} highlight />
                <ComparisonItem label="Cost Price" value={`₦${counterOffer.costPrice?.toLocaleString()}`} highlight />
              </>
            )}
            {(contractType === 'mudaraba' || contractType === 'musharaka') && (
              <>
                <ComparisonItem 
                  label="Your Profit Share" 
                  value={`${counterOffer.mudaribProfitShare || counterOffer.party2ProfitShare}%`} 
                  highlight 
                />
                <ComparisonItem 
                  label="Institution Share" 
                  value={`${counterOffer.investorProfitShare || counterOffer.party1ProfitShare}%`} 
                  highlight 
                />
              </>
            )}
            {contractType === 'ijara' && (
              <ComparisonItem label="Monthly Rental" value={`₦${counterOffer.monthlyRental?.toLocaleString()}`} highlight />
            )}
          </div>
        </div>
      </div>

      {/* Justification */}
      {counterOffer.counterOfferMessage && (
        <div className="px-4 py-3 bg-blue-100/50 dark:bg-blue-900/20 border-t border-blue-200 dark:border-blue-800">
          <p className="text-xs font-medium text-blue-900 dark:text-blue-300 mb-1">Justification:</p>
          <p className="text-sm text-blue-800 dark:text-blue-400 italic">"{counterOffer.counterOfferMessage}"</p>
        </div>
      )}
    </div>
  );
}

function ComparisonItem({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-xs text-neutral-600 dark:text-neutral-400">{label}</span>
      <span className={`text-sm font-semibold ${highlight ? 'text-blue-700 dark:text-blue-300' : 'text-neutral-900 dark:text-neutral-100'}`}>
        {value}
      </span>
    </div>
  );
}
