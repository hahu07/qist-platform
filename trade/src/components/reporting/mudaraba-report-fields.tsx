"use client";

import React from "react";

interface MudarabaReportFieldsProps {
  details: {
    capitalProvided?: number;
    investorProfitShare?: number;
    mudaribProfitShare?: number;
    actualInvestorProfit?: number;
    actualMudaribProfit?: number;
    managementPerformance?: "excellent" | "good" | "satisfactory" | "poor";
    businessActivities?: string;
  };
  onChange: (field: string, value: any) => void;
  errors?: Record<string, string>;
}

export function MudarabaReportFields({ details, onChange, errors }: MudarabaReportFieldsProps) {
  return (
    <div className="space-y-4 p-4 bg-lavender-blue-50 dark:bg-lavender-blue-900/10 rounded-lg border-2 border-lavender-blue-200 dark:border-lavender-blue-800">
      <h3 className="font-bold text-lg text-neutral-900 dark:text-white mb-3">
        Mudaraba (Trust Financing) Specific Details
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
            Capital Provided by Investor (₦)
          </label>
          <input
            type="number"
            value={details.capitalProvided || ""}
            onChange={(e) => onChange("capitalProvided", parseFloat(e.target.value) || 0)}
            className="w-full px-4 py-2 border-2 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-neutral-800"
            placeholder="Capital amount"
            min={0}
            step={0.01}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
            Management Performance
          </label>
          <select
            value={details.managementPerformance || "good"}
            onChange={(e) => onChange("managementPerformance", e.target.value)}
            className="w-full px-4 py-2 border-2 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-neutral-800"
          >
            <option value="excellent">Excellent</option>
            <option value="good">Good</option>
            <option value="satisfactory">Satisfactory</option>
            <option value="poor">Poor</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
            Investor Profit Share (%)
          </label>
          <input
            type="number"
            value={details.investorProfitShare || ""}
            onChange={(e) => onChange("investorProfitShare", parseFloat(e.target.value) || 0)}
            className="w-full px-4 py-2 border-2 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-neutral-800"
            placeholder="Agreed percentage"
            min={0}
            max={100}
            step={0.1}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
            Mudarib Profit Share (%)
          </label>
          <input
            type="number"
            value={details.mudaribProfitShare || ""}
            onChange={(e) => onChange("mudaribProfitShare", parseFloat(e.target.value) || 0)}
            className="w-full px-4 py-2 border-2 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-neutral-800"
            placeholder="Agreed percentage"
            min={0}
            max={100}
            step={0.1}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
            Actual Investor Profit (₦)
          </label>
          <input
            type="number"
            value={details.actualInvestorProfit || ""}
            onChange={(e) => onChange("actualInvestorProfit", parseFloat(e.target.value) || 0)}
            className="w-full px-4 py-2 border-2 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-neutral-800"
            placeholder="Calculated profit"
            step={0.01}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
            Actual Mudarib Profit (₦)
          </label>
          <input
            type="number"
            value={details.actualMudaribProfit || ""}
            onChange={(e) => onChange("actualMudaribProfit", parseFloat(e.target.value) || 0)}
            className="w-full px-4 py-2 border-2 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-neutral-800"
            placeholder="Calculated profit"
            step={0.01}
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
            Business Activities Summary
          </label>
          <textarea
            value={details.businessActivities || ""}
            onChange={(e) => onChange("businessActivities", e.target.value)}
            className="w-full px-4 py-2 border-2 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-neutral-800"
            placeholder="Describe key business activities this period..."
            rows={3}
            maxLength={500}
          />
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
            {(details.businessActivities || "").length}/500 characters
          </p>
        </div>
      </div>
    </div>
  );
}
