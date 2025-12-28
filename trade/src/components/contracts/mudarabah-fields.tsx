"use client";

import React from "react";
import { MudarabahTerms } from "@/schemas/islamic-contracts.schema";

interface MudarabahFieldsProps {
  terms: Partial<MudarabahTerms>;
  onChange: (field: keyof MudarabahTerms, value: string | number | boolean) => void;
  errors?: Partial<Record<keyof MudarabahTerms, string>>;
}

export function MudarabahFields({ terms, onChange, errors }: MudarabahFieldsProps) {
  return (
    <div className="space-y-4">
      <div className="bg-lavender-blue-50 dark:bg-lavender-blue-900/10 rounded-lg p-4 border-2 border-lavender-blue-200 dark:border-lavender-blue-800">
        <h3 className="font-display font-bold text-lg text-neutral-900 dark:text-white mb-3">
          Mudarabah Specific Details
        </h3>
        <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
          Mudarabah is a profit-sharing partnership where the institution provides capital (Rabb-ul-Mal) and you provide expertise/labor (Mudarib)
        </p>

        <div className="space-y-4">
          {/* Capital Amount */}
          <div>
            <label htmlFor="capitalAmount" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Capital Amount (₦) *
            </label>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-2">
              💡 Total capital the institution will provide for your business venture
            </p>
            <input
              id="capitalAmount"
              type="number"
              value={terms.capitalAmount || ""}
              onChange={(e) => onChange("capitalAmount", parseFloat(e.target.value))}
              min={0}
              step={0.01}
              required
              aria-required="true"
              aria-invalid={!!errors?.capitalAmount}
              className={`w-full px-4 py-2 border-2 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white ${
                errors?.capitalAmount ? 'border-red-500' : 'border-neutral-300 dark:border-neutral-700'
              }`}
              placeholder="Total capital provided by investor"
            />
            {errors?.capitalAmount && (
              <p className="text-sm text-red-600 dark:text-red-400 mt-1" role="alert">
                {errors.capitalAmount}
              </p>
            )}
          </div>

          {/* Business Activity */}
          <div>
            <label htmlFor="businessActivity" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Business Activity *
            </label>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-2">
              💡 Describe your business venture and how the capital will be used
            </p>
            <textarea
              id="businessActivity"
              value={terms.businessActivity || ""}
              onChange={(e) => onChange("businessActivity", e.target.value)}
              rows={3}
              required
              aria-required="true"
              aria-invalid={!!errors?.businessActivity}
              className={`w-full px-4 py-2 border-2 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white ${
                errors?.businessActivity ? 'border-red-500' : 'border-neutral-300 dark:border-neutral-700'
              }`}
              placeholder="Describe the business venture and how capital will be utilized"
            />
            {errors?.businessActivity && (
              <p className="text-sm text-red-600 dark:text-red-400 mt-1" role="alert">
                {errors.businessActivity}
              </p>
            )}
          </div>

          {/* Investor Profit Share */}
          <div>
            <label htmlFor="investorProfitShare" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Investor Profit Share (%) *
            </label>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-2">
              💡 Propose the institution's share of profits (typically 40-70%). Final terms subject to negotiation.
            </p>
            <input
              id="investorProfitShare"
              type="number"
              value={terms.investorProfitShare || ""}
              onChange={(e) => {
                const value = parseFloat(e.target.value);
                onChange("investorProfitShare", value);
                if (value > 0 && value <= 100) {
                  onChange("mudaribProfitShare", 100 - value);
                }
              }}
              min={0}
              max={100}
              step={0.1}
              required
              aria-required="true"
              aria-invalid={!!errors?.investorProfitShare}
              className={`w-full px-4 py-2 border-2 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white ${
                errors?.investorProfitShare ? 'border-red-500' : 'border-neutral-300 dark:border-neutral-700'
              }`}
              placeholder="Investor's share of profits (e.g., 60)"
            />
            {errors?.investorProfitShare && (
              <p className="text-sm text-red-600 dark:text-red-400 mt-1" role="alert">
                {errors.investorProfitShare}
              </p>
            )}
          </div>

          {/* Mudarib Profit Share */}
          <div>
            <label htmlFor="mudaribProfitShare" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Mudarib Profit Share (%) *
            </label>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-2">
              💡 Your share of profits as the entrepreneur (auto-calculated to equal 100% with investor share)
            </p>
            <input
              id="mudaribProfitShare"
              type="number"
              value={terms.mudaribProfitShare || ""}
              onChange={(e) => {
                const value = parseFloat(e.target.value);
                onChange("mudaribProfitShare", value);
                if (value > 0 && value <= 100) {
                  onChange("investorProfitShare", 100 - value);
                }
              }}
              min={0}
              max={100}
              step={0.1}
              required
              aria-required="true"
              aria-invalid={!!errors?.mudaribProfitShare}
              className={`w-full px-4 py-2 border-2 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white ${
                errors?.mudaribProfitShare ? 'border-red-500' : 'border-neutral-300 dark:border-neutral-700'
              }`}
              placeholder="Your share of profits (e.g., 40)"
            />
            {errors?.mudaribProfitShare && (
              <p className="text-sm text-red-600 dark:text-red-400 mt-1" role="alert">
                {errors.mudaribProfitShare}
              </p>
            )}
            {terms.investorProfitShare && terms.mudaribProfitShare && (
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                Total: {(terms.investorProfitShare + terms.mudaribProfitShare).toFixed(1)}%
                {Math.abs((terms.investorProfitShare + terms.mudaribProfitShare) - 100) > 0.1 && (
                  <span className="text-red-600 dark:text-red-400 ml-2">Must equal 100%</span>
                )}
              </p>
            )}
          </div>

          {/* Expected Return Rate */}
          <div>
            <label htmlFor="expectedReturnRate" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Expected Return Rate (% per annum)
            </label>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-2">
              💡 Your projected annual profit rate based on business projections (estimate only)
            </p>
            <input
              id="expectedReturnRate"
              type="number"
              value={terms.expectedReturnRate || ""}
              onChange={(e) => onChange("expectedReturnRate", parseFloat(e.target.value) || 0)}
              min={0}
              max={100}
              step={0.1}
              aria-invalid={!!errors?.expectedReturnRate}
              className={`w-full px-4 py-2 border-2 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white ${
                errors?.expectedReturnRate ? 'border-red-500' : 'border-neutral-300 dark:border-neutral-700'
              }`}
              placeholder="Projected annual return (e.g., 18)"
            />
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
              This is an estimate only - actual returns may vary
            </p>
          </div>

          {/* Profit Calculation Method */}
          <div>
            <label htmlFor="profitCalculationMethod" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Profit Calculation Method *
            </label>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-2">
              💡 How profits will be calculated: Net (after expenses), Gross (before expenses), or IRR (return rate)
            </p>
            <select
              id="profitCalculationMethod"
              value={terms.profitCalculationMethod || "net-profit"}
              onChange={(e) => onChange("profitCalculationMethod", e.target.value)}
              required
              aria-required="true"
              className="w-full px-4 py-2 border-2 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white border-neutral-300 dark:border-neutral-700"
            >
              <option value="net-profit">Net Profit (After all expenses)</option>
              <option value="gross-profit">Gross Profit (Before operating expenses)</option>
              <option value="revenue">Revenue Based</option>
            </select>
          </div>

          {/* Profit Distribution Frequency */}
          <div>
            <label htmlFor="profitDistributionFrequency" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Profit Distribution Frequency *
            </label>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-2">
              💡 How often profits will be distributed to partners
            </p>
            <select
              id="profitDistributionFrequency"
              value={terms.profitDistributionFrequency || "monthly"}
              onChange={(e) => onChange("profitDistributionFrequency", e.target.value)}
              required
              aria-required="true"
              className="w-full px-4 py-2 border-2 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white border-neutral-300 dark:border-neutral-700"
            >
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
              <option value="semi-annual">Semi-Annual</option>
              <option value="annual">Annual</option>
              <option value="at-maturity">At Maturity</option>
            </select>
          </div>

          {/* Capital Guarantee */}
          <div className="flex items-start space-x-3 p-4 bg-yellow-50 dark:bg-yellow-900/10 border-2 border-yellow-200 dark:border-yellow-800 rounded-lg">
            <input
              id="capitalGuarantee"
              type="checkbox"
              checked={terms.capitalGuarantee || false}
              onChange={(e) => onChange("capitalGuarantee", e.target.checked)}
              className="mt-1"
            />
            <div className="flex-1">
              <label htmlFor="capitalGuarantee" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 cursor-pointer">
                Capital Guarantee
              </label>
              <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1">
                ⚠️ In Shariah-compliant Mudarabah, capital is typically not guaranteed. Losses are borne by the investor (except in cases of negligence/misconduct by Mudarib).
              </p>
            </div>
          </div>

          {/* Mudarib Authority */}
          <div>
            <label htmlFor="mudaribAuthority" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Mudarib Authority Level *
            </label>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-2">
              💡 Your management authority: Full (independent), Restricted (needs approval), or Limited (investor oversight)
            </p>
            <select
              id="mudaribAuthority"
              value={terms.mudaribAuthority || "unrestricted"}
              onChange={(e) => onChange("mudaribAuthority", e.target.value)}
              required
              aria-required="true"
              className="w-full px-4 py-2 border-2 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white border-neutral-300 dark:border-neutral-700"
            >
              <option value="unrestricted">Unrestricted (Full business autonomy)</option>
              <option value="restricted">Restricted (Specific limitations apply)</option>
            </select>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
              Determines your level of decision-making authority
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
