"use client";

import React from "react";
import { MurabahaTerms } from "@/schemas/islamic-contracts.schema";

interface MurabahaFieldsProps {
  terms: Partial<MurabahaTerms>;
  onChange: (field: keyof MurabahaTerms, value: string | number | boolean) => void;
  errors?: Partial<Record<keyof MurabahaTerms, string>>;
}

export function MurabahaFields({ terms, onChange, errors }: MurabahaFieldsProps) {
  return (
    <div className="space-y-4">
      <div className="bg-lavender-blue-50 dark:bg-lavender-blue-900/10 rounded-lg p-4 border-2 border-lavender-blue-200 dark:border-lavender-blue-800">
        <h3 className="font-display font-bold text-lg text-neutral-900 dark:text-white mb-3">
          Murabaha Specific Details
        </h3>
        <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
          Murabaha is a cost-plus financing where the institution purchases an asset and sells it to you at cost + agreed profit margin
        </p>

        <div className="space-y-4">
          {/* Asset Description */}
          <div>
            <label htmlFor="assetDescription" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Asset Description *
            </label>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-2">
              💡 Describe the asset/goods to be purchased (equipment, inventory, property, etc.)
            </p>
            <textarea
              id="assetDescription"
              value={terms.assetDescription || ""}
              onChange={(e) => onChange("assetDescription", e.target.value)}
              rows={3}
              required
              aria-required="true"
              aria-invalid={!!errors?.assetDescription}
              className={`w-full px-4 py-2 border-2 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white \${
                errors?.assetDescription ? 'border-red-500' : 'border-neutral-300 dark:border-neutral-700'
              }`}
              placeholder="Describe the asset you wish to acquire (e.g., machinery, inventory, property)"
            />
            {errors?.assetDescription && (
              <p className="text-sm text-red-600 dark:text-red-400 mt-1" role="alert">
                {errors.assetDescription}
              </p>
            )}
          </div>

          {/* Cost Price */}
          <div>
            <label htmlFor="costPrice" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Cost Price (₦) *
            </label>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-2">
              💡 Actual purchase cost of the asset (what the institution will pay)
            </p>
            <input
              id="costPrice"
              type="number"
              value={terms.costPrice || ""}
              onChange={(e) => onChange("costPrice", parseFloat(e.target.value))}
              min={0}
              step={0.01}
              required
              aria-required="true"
              aria-invalid={!!errors?.costPrice}
              className={`w-full px-4 py-2 border-2 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white \${
                errors?.costPrice ? 'border-red-500' : 'border-neutral-300 dark:border-neutral-700'
              }`}
              placeholder="Actual purchase cost of the asset"
            />
            {errors?.costPrice && (
              <p className="text-sm text-red-600 dark:text-red-400 mt-1" role="alert">
                {errors.costPrice}
              </p>
            )}
          </div>

          {/* Profit Rate */}
          <div>
            <label htmlFor="profitRate" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Profit Rate (%) *
            </label>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-2">
              💡 Proposed markup percentage (typically 10-25%). Final rate subject to approval.
            </p>
            <input
              id="profitRate"
              type="number"
              value={terms.profitRate || ""}
              onChange={(e) => onChange("profitRate", parseFloat(e.target.value))}
              min={0}
              max={50}
              step={0.1}
              required
              aria-required="true"
              aria-invalid={!!errors?.profitRate}
              className={`w-full px-4 py-2 border-2 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white \${
                errors?.profitRate ? 'border-red-500' : 'border-neutral-300 dark:border-neutral-700'
              }`}
              placeholder="Agreed profit margin (e.g., 15)"
            />
            {errors?.profitRate && (
              <p className="text-sm text-red-600 dark:text-red-400 mt-1" role="alert">
                {errors.profitRate}
              </p>
            )}
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
              {terms.costPrice && terms.profitRate
                ? `Selling Price: ₦${(terms.costPrice * (1 + terms.profitRate / 100)).toLocaleString()}`
                : "Selling Price will be calculated"}
            </p>
          </div>

          {/* Number of Installments */}
          <div>
            <label htmlFor="numberOfInstallments" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Number of Installments *
            </label>
            <input
              id="numberOfInstallments"
              type="number"
              value={terms.numberOfInstallments || ""}
              onChange={(e) => onChange("numberOfInstallments", parseInt(e.target.value))}
              min={1}
              max={120}
              required
              aria-required="true"
              aria-invalid={!!errors?.numberOfInstallments}
              className={`w-full px-4 py-2 border-2 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white \${
                errors?.numberOfInstallments ? 'border-red-500' : 'border-neutral-300 dark:border-neutral-700'
              }`}
              placeholder="Payment frequency (monthly)"
            />
            {errors?.numberOfInstallments && (
              <p className="text-sm text-red-600 dark:text-red-400 mt-1" role="alert">
                {errors.numberOfInstallments}
              </p>
            )}
            {terms.costPrice && terms.profitRate && terms.numberOfInstallments && (
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                Monthly Payment: ₦
                {((terms.costPrice * (1 + terms.profitRate / 100)) / terms.numberOfInstallments).toLocaleString(
                  undefined,
                  { minimumFractionDigits: 2, maximumFractionDigits: 2 }
                )}
              </p>
            )}
          </div>

          {/* Installment Frequency */}
          <div>
            <label htmlFor="installmentFrequency" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Payment Frequency *
            </label>
            <select
              id="installmentFrequency"
              value={terms.installmentFrequency || "monthly"}
              onChange={(e) => onChange("installmentFrequency", e.target.value)}
              required
              aria-required="true"
              className="w-full px-4 py-2 border-2 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white border-neutral-300 dark:border-neutral-700"
            >
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
              <option value="semi-annual">Semi-Annual</option>
              <option value="annual">Annual</option>
            </select>
          </div>

          {/* Early Settlement Discount */}
          <div>
            <label htmlFor="earlySettlementDiscount" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Early Settlement Discount (%)
            </label>
            <input
              id="earlySettlementDiscount"
              type="number"
              value={terms.earlySettlementDiscount || ""}
              onChange={(e) => onChange("earlySettlementDiscount", parseFloat(e.target.value) || 0)}
              min={0}
              max={100}
              step={0.1}
              aria-invalid={!!errors?.earlySettlementDiscount}
              className={`w-full px-4 py-2 border-2 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white \${
                errors?.earlySettlementDiscount ? 'border-red-500' : 'border-neutral-300 dark:border-neutral-700'
              }`}
              placeholder="Optional discount for early payment (e.g., 5)"
            />
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
              Shariah-compliant discount for early settlement (optional)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
