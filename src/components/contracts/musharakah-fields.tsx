"use client";

import React from "react";
import { MusharakahTerms } from "@/schemas/islamic-contracts.schema";

interface MusharakahFieldsProps {
  terms: Partial<MusharakahTerms>;
  onChange: (field: keyof MusharakahTerms, value: string | number | boolean) => void;
  errors?: Partial<Record<keyof MusharakahTerms, string>>;
}

export function MusharakahFields({ terms, onChange, errors }: MusharakahFieldsProps) {
  const totalCapital = (terms.party1Capital || 0) + (terms.party2Capital || 0);
  const party1Percentage = totalCapital > 0 ? ((terms.party1Capital || 0) / totalCapital) * 100 : 0;
  const party2Percentage = totalCapital > 0 ? ((terms.party2Capital || 0) / totalCapital) * 100 : 0;

  return (
    <div className="space-y-4">
      <div className="bg-lavender-blue-50 dark:bg-lavender-blue-900/10 rounded-lg p-4 border-2 border-lavender-blue-200 dark:border-lavender-blue-800">
        <h3 className="font-display font-bold text-lg text-neutral-900 dark:text-white mb-3">
          Musharakah Specific Details
        </h3>
        <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
          Musharakah is a joint venture partnership where all partners contribute capital and share profits/losses based on agreed ratios
        </p>

        <div className="space-y-4">
          {/* Partnership Type */}
          <div>
            <label htmlFor="partnershipType" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Partnership Type *
            </label>
            <select
              id="partnershipType"
              value={terms.partnershipType || "diminishing"}
              onChange={(e) => onChange("partnershipType", e.target.value)}
              required
              aria-required="true"
              className="w-full px-4 py-2 border-2 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white border-neutral-300 dark:border-neutral-700"
            >
              <option value="general">General Musharakah (Equal participation)</option>
              <option value="limited">Limited Musharakah (One partner manages)</option>
              <option value="limited">Limited Musharakah (One partner manages)</option>
              <option value="diminishing">Diminishing Musharakah (Ownership transfer over time)</option>
            </select>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
              {terms.partnershipType === "general" && "All partners participate equally in management"}
              {terms.partnershipType === "limited" && "One partner manages, others provide capital only"}
              {terms.partnershipType === "diminishing" && "You gradually buy out the partner's share"}
            </p>
          </div>

          {/* Business Purpose */}
          <div>
            <label htmlFor="businessPurpose" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Business Purpose *
            </label>
            <textarea
              id="businessPurpose"
              value={terms.businessPurpose || ""}
              onChange={(e) => onChange("businessPurpose", e.target.value)}
              rows={3}
              required
              aria-required="true"
              aria-invalid={!!errors?.businessPurpose}
              className={`w-full px-4 py-2 border-2 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white ${
                errors?.businessPurpose ? 'border-red-500' : 'border-neutral-300 dark:border-neutral-700'
              }`}
              placeholder="Describe the joint venture purpose and activities"
            />
            {errors?.businessPurpose && (
              <p className="text-sm text-red-600 dark:text-red-400 mt-1" role="alert">
                {errors.businessPurpose}
              </p>
            )}
          </div>

          {/* Partner 1 Details */}
          <div className="p-4 bg-white dark:bg-neutral-800 rounded-lg border-2 border-neutral-200 dark:border-neutral-700">
            <h4 className="font-semibold text-neutral-900 dark:text-white mb-3">Partner 1 (Institution)</h4>
            
            <div className="space-y-3">
              <div>
                <label htmlFor="party1Name" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Name *
                </label>
                <input
                  id="party1Name"
                  type="text"
                  value={terms.party1Name || ""}
                  onChange={(e) => onChange("party1Name", e.target.value)}
                  required
                  aria-required="true"
                  aria-invalid={!!errors?.party1Name}
                  className={`w-full px-4 py-2 border-2 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white ${
                    errors?.party1Name ? 'border-red-500' : 'border-neutral-300 dark:border-neutral-700'
                  }`}
                  placeholder="Institution/Partner name"
                />
              </div>

              <div>
                <label htmlFor="party1Capital" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Capital Contribution (₦) *
                </label>
                <input
                  id="party1Capital"
                  type="number"
                  value={terms.party1Capital || ""}
                  onChange={(e) => onChange("party1Capital", parseFloat(e.target.value))}
                  min={0}
                  step={0.01}
                  required
                  aria-required="true"
                  aria-invalid={!!errors?.party1Capital}
                  className={`w-full px-4 py-2 border-2 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white ${
                    errors?.party1Capital ? 'border-red-500' : 'border-neutral-300 dark:border-neutral-700'
                  }`}
                  placeholder="Capital amount from institution"
                />
                {totalCapital > 0 && (
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                    {party1Percentage.toFixed(1)}% of total capital
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="party1ProfitShare" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Profit Share (%) *
                </label>
                <input
                  id="party1ProfitShare"
                  type="number"
                  value={terms.party1ProfitShare || ""}
                  onChange={(e) => onChange("party1ProfitShare", parseFloat(e.target.value))}
                  min={0}
                  max={100}
                  step={0.1}
                  required
                  aria-required="true"
                  aria-invalid={!!errors?.party1ProfitShare}
                  className={`w-full px-4 py-2 border-2 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white ${
                    errors?.party1ProfitShare ? 'border-red-500' : 'border-neutral-300 dark:border-neutral-700'
                  }`}
                  placeholder="Share of profits (e.g., 60)"
                />
              </div>

              <div>
                <label htmlFor="party1LossShare" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Loss Share (%) *
                </label>
                <input
                  id="party1LossShare"
                  type="number"
                  value={terms.party1LossShare || ""}
                  onChange={(e) => onChange("party1LossShare", parseFloat(e.target.value))}
                  min={0}
                  max={100}
                  step={0.1}
                  required
                  aria-required="true"
                  aria-invalid={!!errors?.party1LossShare}
                  className={`w-full px-4 py-2 border-2 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white ${
                    errors?.party1LossShare ? 'border-red-500' : 'border-neutral-300 dark:border-neutral-700'
                  }`}
                  placeholder="Share of losses (usually matches capital %)"
                />
              </div>
            </div>
          </div>

          {/* Partner 2 Details */}
          <div className="p-4 bg-white dark:bg-neutral-800 rounded-lg border-2 border-neutral-200 dark:border-neutral-700">
            <h4 className="font-semibold text-neutral-900 dark:text-white mb-3">Partner 2 (You/Business)</h4>
            
            <div className="space-y-3">
              <div>
                <label htmlFor="party2Name" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Name *
                </label>
                <input
                  id="party2Name"
                  type="text"
                  value={terms.party2Name || ""}
                  onChange={(e) => onChange("party2Name", e.target.value)}
                  required
                  aria-required="true"
                  aria-invalid={!!errors?.party2Name}
                  className={`w-full px-4 py-2 border-2 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white ${
                    errors?.party2Name ? 'border-red-500' : 'border-neutral-300 dark:border-neutral-700'
                  }`}
                  placeholder="Your name/business name"
                />
              </div>

              <div>
                <label htmlFor="party2Capital" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Capital Contribution (₦) *
                </label>
                <input
                  id="party2Capital"
                  type="number"
                  value={terms.party2Capital || ""}
                  onChange={(e) => onChange("party2Capital", parseFloat(e.target.value))}
                  min={0}
                  step={0.01}
                  required
                  aria-required="true"
                  aria-invalid={!!errors?.party2Capital}
                  className={`w-full px-4 py-2 border-2 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white ${
                    errors?.party2Capital ? 'border-red-500' : 'border-neutral-300 dark:border-neutral-700'
                  }`}
                  placeholder="Your capital contribution"
                />
                {totalCapital > 0 && (
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                    {party2Percentage.toFixed(1)}% of total capital
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="party2ProfitShare" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Profit Share (%) *
                </label>
                <input
                  id="party2ProfitShare"
                  type="number"
                  value={terms.party2ProfitShare || ""}
                  onChange={(e) => onChange("party2ProfitShare", parseFloat(e.target.value))}
                  min={0}
                  max={100}
                  step={0.1}
                  required
                  aria-required="true"
                  aria-invalid={!!errors?.party2ProfitShare}
                  className={`w-full px-4 py-2 border-2 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white ${
                    errors?.party2ProfitShare ? 'border-red-500' : 'border-neutral-300 dark:border-neutral-700'
                  }`}
                  placeholder="Your share of profits (e.g., 40)"
                />
              </div>

              <div>
                <label htmlFor="party2LossShare" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Loss Share (%) *
                </label>
                <input
                  id="party2LossShare"
                  type="number"
                  value={terms.party2LossShare || ""}
                  onChange={(e) => onChange("party2LossShare", parseFloat(e.target.value))}
                  min={0}
                  max={100}
                  step={0.1}
                  required
                  aria-required="true"
                  aria-invalid={!!errors?.party2LossShare}
                  className={`w-full px-4 py-2 border-2 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white ${
                    errors?.party2LossShare ? 'border-red-500' : 'border-neutral-300 dark:border-neutral-700'
                  }`}
                  placeholder="Your share of losses (usually matches capital %)"
                />
              </div>
            </div>
          </div>

          {/* Summary */}
          {totalCapital > 0 && (
            <div className="p-4 bg-blue-50 dark:bg-blue-900/10 border-2 border-blue-200 dark:border-blue-800 rounded-lg">
              <h4 className="font-semibold text-neutral-900 dark:text-white mb-2">Capital Summary</h4>
              <div className="text-sm space-y-1">
                <p className="text-neutral-700 dark:text-neutral-300">
                  Total Capital: ₦{totalCapital.toLocaleString()}
                </p>
                {terms.party1ProfitShare && terms.party2ProfitShare && (
                  <p className="text-neutral-700 dark:text-neutral-300">
                    Total Profit Share: {(terms.party1ProfitShare + terms.party2ProfitShare).toFixed(1)}%
                    {Math.abs((terms.party1ProfitShare + terms.party2ProfitShare) - 100) > 0.1 && (
                      <span className="text-red-600 dark:text-red-400 ml-2">Must equal 100%</span>
                    )}
                  </p>
                )}
                {terms.party1LossShare && terms.party2LossShare && (
                  <p className="text-neutral-700 dark:text-neutral-300">
                    Total Loss Share: {(terms.party1LossShare + terms.party2LossShare).toFixed(1)}%
                    {Math.abs((terms.party1LossShare + terms.party2LossShare) - 100) > 0.1 && (
                      <span className="text-red-600 dark:text-red-400 ml-2">Must equal 100%</span>
                    )}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Exit Strategy */}
          <div>
            <label htmlFor="exitStrategy" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Exit Strategy
            </label>
            <textarea
              id="exitStrategy"
              value={terms.exitStrategy || ""}
              onChange={(e) => onChange("exitStrategy", e.target.value)}
              rows={2}
              aria-invalid={!!errors?.exitStrategy}
              className={`w-full px-4 py-2 border-2 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white ${
                errors?.exitStrategy ? 'border-red-500' : 'border-neutral-300 dark:border-neutral-700'
              }`}
              placeholder="How and when can partners exit the partnership?"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
