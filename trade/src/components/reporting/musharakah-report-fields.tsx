"use client";

import React from "react";

interface MusharakahReportFieldsProps {
  details: {
    party1Capital?: number;
    party2Capital?: number;
    party1ProfitShare?: number;
    party2ProfitShare?: number;
    actualParty1Profit?: number;
    actualParty2Profit?: number;
    partnershipActivities?: string;
    buyoutProgress?: number;
  };
  onChange: (field: string, value: any) => void;
  errors?: Record<string, string>;
}

export function MusharakahReportFields({ details, onChange, errors }: MusharakahReportFieldsProps) {
  return (
    <div className="space-y-4 p-4 bg-lavender-blue-50 dark:bg-lavender-blue-900/10 rounded-lg border-2 border-lavender-blue-200 dark:border-lavender-blue-800">
      <h3 className="font-bold text-lg text-neutral-900 dark:text-white mb-3">
        Musharaka (Partnership) Specific Details
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
            Partner 1 Capital (₦)
          </label>
          <input
            type="number"
            value={details.party1Capital || ""}
            onChange={(e) => onChange("party1Capital", parseFloat(e.target.value) || 0)}
            className="w-full px-4 py-2 border-2 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-neutral-800"
            placeholder="Institution capital"
            min={0}
            step={0.01}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
            Partner 2 Capital (₦)
          </label>
          <input
            type="number"
            value={details.party2Capital || ""}
            onChange={(e) => onChange("party2Capital", parseFloat(e.target.value) || 0)}
            className="w-full px-4 py-2 border-2 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-neutral-800"
            placeholder="Your business capital"
            min={0}
            step={0.01}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
            Partner 1 Profit Share (%)
          </label>
          <input
            type="number"
            value={details.party1ProfitShare || ""}
            onChange={(e) => onChange("party1ProfitShare", parseFloat(e.target.value) || 0)}
            className="w-full px-4 py-2 border-2 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-neutral-800"
            placeholder="Agreed percentage"
            min={0}
            max={100}
            step={0.1}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
            Partner 2 Profit Share (%)
          </label>
          <input
            type="number"
            value={details.party2ProfitShare || ""}
            onChange={(e) => onChange("party2ProfitShare", parseFloat(e.target.value) || 0)}
            className="w-full px-4 py-2 border-2 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-neutral-800"
            placeholder="Agreed percentage"
            min={0}
            max={100}
            step={0.1}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
            Actual Partner 1 Profit (₦)
          </label>
          <input
            type="number"
            value={details.actualParty1Profit || ""}
            onChange={(e) => onChange("actualParty1Profit", parseFloat(e.target.value) || 0)}
            className="w-full px-4 py-2 border-2 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-neutral-800"
            placeholder="Calculated profit"
            step={0.01}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
            Actual Partner 2 Profit (₦)
          </label>
          <input
            type="number"
            value={details.actualParty2Profit || ""}
            onChange={(e) => onChange("actualParty2Profit", parseFloat(e.target.value) || 0)}
            className="w-full px-4 py-2 border-2 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-neutral-800"
            placeholder="Calculated profit"
            step={0.01}
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
            Buyout Progress (%) - For Diminishing Musharaka
          </label>
          <input
            type="number"
            value={details.buyoutProgress || ""}
            onChange={(e) => onChange("buyoutProgress", parseFloat(e.target.value) || 0)}
            className="w-full px-4 py-2 border-2 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-neutral-800"
            placeholder="Percentage of partner share purchased"
            min={0}
            max={100}
            step={0.1}
          />
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
            Leave empty if not applicable
          </p>
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
            Partnership Activities Summary
          </label>
          <textarea
            value={details.partnershipActivities || ""}
            onChange={(e) => onChange("partnershipActivities", e.target.value)}
            className="w-full px-4 py-2 border-2 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-neutral-800"
            placeholder="Describe joint venture activities this period..."
            rows={3}
            maxLength={500}
          />
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
            {(details.partnershipActivities || "").length}/500 characters
          </p>
        </div>
      </div>
    </div>
  );
}
