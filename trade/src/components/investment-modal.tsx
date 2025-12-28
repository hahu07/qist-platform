"use client";

import { useState } from "react";
import type { OpportunityFormData } from "@/schemas";
import { processInvestment, calculateReturns } from "@/utils/investment-actions";

interface InvestmentModalProps {
  opportunity: OpportunityFormData;
  opportunityId: string;
  userId: string;
  userType: "individual" | "corporate";
  onClose: () => void;
  onSuccess: () => void;
}

export function InvestmentModal({
  opportunity,
  opportunityId,
  userId,
  userType,
  onClose,
  onSuccess,
}: InvestmentModalProps) {
  const [amount, setAmount] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  const investmentAmount = parseFloat(amount) || 0;
  const returns = calculateReturns({
    amount: investmentAmount,
    returnMin: opportunity.expectedReturnMin,
    returnMax: opportunity.expectedReturnMax,
    termMonths: opportunity.termMonths,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (investmentAmount < opportunity.minimumInvestment) {
      setError(`Minimum investment is ₦${opportunity.minimumInvestment.toLocaleString()}`);
      return;
    }

    setLoading(true);

    const result = await processInvestment({
      userId,
      userType,
      opportunityId,
      amount: investmentAmount,
    });

    setLoading(false);

    if (result.success) {
      alert(result.message);
      onSuccess();
      onClose();
    } else {
      setError(result.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border-2 border-neutral-200 dark:border-neutral-800 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-neutral-900 border-b-2 border-neutral-200 dark:border-neutral-800 p-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-1">
              Invest in {opportunity.businessName}
            </h2>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 capitalize">
              {opportunity.contractType.replace("-", " ")} • {opportunity.industry}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Business Background */}
          {opportunity.businessBackground && (
            <div className="bg-gradient-to-br from-neutral-50 to-white dark:from-neutral-800 dark:to-neutral-900 rounded-xl p-4 border border-neutral-200 dark:border-neutral-700">
              <h3 className="font-bold text-sm text-neutral-900 dark:text-white mb-2 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                About the Business
              </h3>
              <p className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed">
                {opportunity.businessBackground}
              </p>
              {(opportunity.yearsInBusiness || opportunity.teamSize || opportunity.location) && (
                <div className="grid grid-cols-3 gap-4 mt-3 pt-3 border-t border-neutral-200 dark:border-neutral-700">
                  {opportunity.yearsInBusiness && (
                    <div>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400">Years Operating</p>
                      <p className="font-bold text-sm text-neutral-900 dark:text-white">{opportunity.yearsInBusiness}+ years</p>
                    </div>
                  )}
                  {opportunity.teamSize && (
                    <div>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400">Team Size</p>
                      <p className="font-bold text-sm text-neutral-900 dark:text-white">{opportunity.teamSize} people</p>
                    </div>
                  )}
                  {opportunity.location && (
                    <div>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400">Location</p>
                      <p className="font-bold text-sm text-neutral-900 dark:text-white">{opportunity.location}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Risk Assessment */}
          <div className={`rounded-xl p-4 border-2 ${
            opportunity.riskRating === "low"
              ? "bg-success-50 dark:bg-success-900/20 border-success-200 dark:border-success-800"
              : opportunity.riskRating === "high"
              ? "bg-error-50 dark:bg-error-900/20 border-error-200 dark:border-error-800"
              : "bg-warning-50 dark:bg-warning-900/20 border-warning-200 dark:border-warning-800"
          }`}>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">
                {opportunity.riskRating === "low" ? "🟢" : opportunity.riskRating === "high" ? "🔴" : "🟡"}
              </span>
              <h3 className={`font-bold text-sm ${
                opportunity.riskRating === "low"
                  ? "text-success-900 dark:text-success-300"
                  : opportunity.riskRating === "high"
                  ? "text-error-900 dark:text-error-300"
                  : "text-warning-900 dark:text-warning-300"
              }`}>
                {opportunity.riskRating === "low" ? "Low" : opportunity.riskRating === "high" ? "High" : "Moderate"} Risk Investment
              </h3>
            </div>
            <p className={`text-xs ${
              opportunity.riskRating === "low"
                ? "text-success-700 dark:text-success-400"
                : opportunity.riskRating === "high"
                ? "text-error-700 dark:text-error-400"
                : "text-warning-700 dark:text-warning-400"
            }`}>
              {opportunity.riskRating === "low" 
                ? "This investment has undergone thorough vetting and shows strong fundamentals with predictable returns."
                : opportunity.riskRating === "high"
                ? "This investment carries higher risk due to market conditions, business stage, or other factors. Higher potential returns come with increased risk."
                : "This investment has balanced risk-reward profile. Moderate volatility expected with good growth potential."}
            </p>
          </div>

          {/* Opportunity Summary */}
          <div className="bg-gradient-to-br from-neutral-50 to-white dark:from-neutral-800 dark:to-neutral-900 rounded-xl p-4 border border-neutral-200 dark:border-neutral-700">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">Funding Goal</p>
                <p className="font-mono font-bold text-neutral-900 dark:text-white">
                  ₦{opportunity.fundingGoal.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">Current Funding</p>
                <p className="font-mono font-bold text-neutral-900 dark:text-white">
                  ₦{opportunity.currentFunding.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">Expected Return</p>
                <p className="font-mono font-bold text-success-600 dark:text-success-400">
                  {opportunity.expectedReturnMin}-{opportunity.expectedReturnMax}%
                </p>
              </div>
              <div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">Term</p>
                <p className="font-mono font-bold text-neutral-900 dark:text-white">
                  {opportunity.termMonths} months
                </p>
              </div>
            </div>
          </div>

          {/* Investment Amount */}
          <div>
            <label htmlFor="amount" className="block text-sm font-semibold text-neutral-900 dark:text-white mb-2">
              Investment Amount (₦)
            </label>
            <input
              type="number"
              id="amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min={opportunity.minimumInvestment}
              step="1000"
              required
              className="w-full px-4 py-3 rounded-xl border-2 border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white font-mono text-lg focus:border-primary-500 dark:focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20 transition-colors"
              placeholder={`Min: ${opportunity.minimumInvestment.toLocaleString()}`}
            />
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
              Minimum: ₦{opportunity.minimumInvestment.toLocaleString()}
            </p>
          </div>

          {/* Projected Returns */}
          {investmentAmount >= opportunity.minimumInvestment && (
            <div className="bg-gradient-to-br from-primary-50 to-business-50 dark:from-primary-900/20 dark:to-business-900/20 rounded-xl p-4 border border-primary-200 dark:border-primary-800">
              <h3 className="font-bold text-neutral-900 dark:text-white mb-3">Projected Returns</h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-neutral-600 dark:text-neutral-400 mb-1">Minimum</p>
                  <p className="font-mono font-bold text-success-600 dark:text-success-400">
                    +₦{returns.minReturn.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-neutral-600 dark:text-neutral-400 mb-1">Maximum</p>
                  <p className="font-mono font-bold text-success-600 dark:text-success-400">
                    +₦{returns.maxReturn.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-neutral-600 dark:text-neutral-400 mb-1">Avg/Month</p>
                  <p className="font-mono font-bold text-neutral-900 dark:text-white">
                    ₦{returns.avgMonthly.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-xl p-4">
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-900 dark:text-white font-bold rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || investmentAmount < opportunity.minimumInvestment}
              className="flex-1 px-6 py-3 bg-primary-600 hover:bg-primary-700 disabled:bg-neutral-300 dark:disabled:bg-neutral-700 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-lg transition-all transform hover:-translate-y-0.5 disabled:transform-none"
            >
              {loading ? "Processing..." : "Confirm Investment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
