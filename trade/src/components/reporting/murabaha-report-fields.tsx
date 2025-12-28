"use client";

import React from "react";

interface MurabahaReportFieldsProps {
  details: {
    assetCost?: number;
    markupAmount?: number;
    installmentsPaid?: number;
    installmentsRemaining?: number;
    remainingBalance?: number;
    paymentStatus?: "on-time" | "delayed" | "defaulted";
  };
  onChange: (field: string, value: any) => void;
  errors?: Record<string, string>;
}

export function MurabahaReportFields({ details, onChange, errors }: MurabahaReportFieldsProps) {
  return (
    <div className="space-y-4 p-4 bg-lavender-blue-50 dark:bg-lavender-blue-900/10 rounded-lg border-2 border-lavender-blue-200 dark:border-lavender-blue-800">
      <h3 className="font-bold text-lg text-neutral-900 dark:text-white mb-3">
        Murabaha (Cost-Plus) Specific Details
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
            Asset Cost (₦)
          </label>
          <input
            type="number"
            value={details.assetCost || ""}
            onChange={(e) => onChange("assetCost", parseFloat(e.target.value) || 0)}
            className="w-full px-4 py-2 border-2 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-neutral-800"
            placeholder="Original asset cost"
            min={0}
            step={0.01}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
            Markup Amount (₦)
          </label>
          <input
            type="number"
            value={details.markupAmount || ""}
            onChange={(e) => onChange("markupAmount", parseFloat(e.target.value) || 0)}
            className="w-full px-4 py-2 border-2 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-neutral-800"
            placeholder="Profit markup"
            min={0}
            step={0.01}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
            Installments Paid
          </label>
          <input
            type="number"
            value={details.installmentsPaid || ""}
            onChange={(e) => onChange("installmentsPaid", parseInt(e.target.value) || 0)}
            className="w-full px-4 py-2 border-2 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-neutral-800"
            placeholder="Number of installments paid"
            min={0}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
            Installments Remaining
          </label>
          <input
            type="number"
            value={details.installmentsRemaining || ""}
            onChange={(e) => onChange("installmentsRemaining", parseInt(e.target.value) || 0)}
            className="w-full px-4 py-2 border-2 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-neutral-800"
            placeholder="Number remaining"
            min={0}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
            Remaining Balance (₦)
          </label>
          <input
            type="number"
            value={details.remainingBalance || ""}
            onChange={(e) => onChange("remainingBalance", parseFloat(e.target.value) || 0)}
            className="w-full px-4 py-2 border-2 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-neutral-800"
            placeholder="Outstanding amount"
            min={0}
            step={0.01}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
            Payment Status
          </label>
          <select
            value={details.paymentStatus || "on-time"}
            onChange={(e) => onChange("paymentStatus", e.target.value)}
            className="w-full px-4 py-2 border-2 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-neutral-800"
          >
            <option value="on-time">On Time</option>
            <option value="delayed">Delayed</option>
            <option value="defaulted">Defaulted</option>
          </select>
        </div>
      </div>
    </div>
  );
}
