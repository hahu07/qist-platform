"use client";

import React from "react";

interface IjaraReportFieldsProps {
  details: {
    assetValue?: number;
    monthlyRental?: number;
    rentalsPaid?: number;
    rentalsRemaining?: number;
    assetDepreciation?: number;
    maintenanceCosts?: number;
    assetCondition?: string;
    purchaseOptionExercised?: boolean;
  };
  onChange: (field: string, value: any) => void;
  errors?: Record<string, string>;
}

export function IjaraReportFields({ details, onChange, errors }: IjaraReportFieldsProps) {
  return (
    <div className="space-y-4 p-4 bg-lavender-blue-50 dark:bg-lavender-blue-900/10 rounded-lg border-2 border-lavender-blue-200 dark:border-lavender-blue-800">
      <h3 className="font-bold text-lg text-neutral-900 dark:text-white mb-3">
        Ijara (Leasing) Specific Details
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
            Asset Value (₦)
          </label>
          <input
            type="number"
            value={details.assetValue || ""}
            onChange={(e) => onChange("assetValue", parseFloat(e.target.value) || 0)}
            className="w-full px-4 py-2 border-2 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-neutral-800"
            placeholder="Initial asset value"
            min={0}
            step={0.01}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
            Monthly Rental (₦)
          </label>
          <input
            type="number"
            value={details.monthlyRental || ""}
            onChange={(e) => onChange("monthlyRental", parseFloat(e.target.value) || 0)}
            className="w-full px-4 py-2 border-2 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-neutral-800"
            placeholder="Agreed monthly rental"
            min={0}
            step={0.01}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
            Rentals Paid (count)
          </label>
          <input
            type="number"
            value={details.rentalsPaid || ""}
            onChange={(e) => onChange("rentalsPaid", parseInt(e.target.value) || 0)}
            className="w-full px-4 py-2 border-2 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-neutral-800"
            placeholder="Number of installments paid"
            min={0}
            step={1}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
            Rentals Remaining (count)
          </label>
          <input
            type="number"
            value={details.rentalsRemaining || ""}
            onChange={(e) => onChange("rentalsRemaining", parseInt(e.target.value) || 0)}
            className="w-full px-4 py-2 border-2 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-neutral-800"
            placeholder="Number of remaining installments"
            min={0}
            step={1}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
            Asset Depreciation (₦)
          </label>
          <input
            type="number"
            value={details.assetDepreciation || ""}
            onChange={(e) => onChange("assetDepreciation", parseFloat(e.target.value) || 0)}
            className="w-full px-4 py-2 border-2 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-neutral-800"
            placeholder="Asset depreciation"
            min={0}
            step={0.01}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
            Maintenance Costs (₦)
          </label>
          <input
            type="number"
            value={details.maintenanceCosts || ""}
            onChange={(e) => onChange("maintenanceCosts", parseFloat(e.target.value) || 0)}
            className="w-full px-4 py-2 border-2 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-neutral-800"
            placeholder="Maintenance expenses"
            min={0}
            step={0.01}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
            Asset Condition
          </label>
          <select
            value={details.assetCondition || ""}
            onChange={(e) => onChange("assetCondition", e.target.value)}
            className="w-full px-4 py-2 border-2 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-neutral-800"
          >
            <option value="">Select condition</option>
            <option value="excellent">Excellent</option>
            <option value="good">Good</option>
            <option value="fair">Fair</option>
            <option value="poor">Poor</option>
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="flex items-center space-x-2 text-sm font-medium text-neutral-700 dark:text-neutral-300">
            <input
              type="checkbox"
              checked={details.purchaseOptionExercised || false}
              onChange={(e) => onChange("purchaseOptionExercised", e.target.checked)}
              className="w-5 h-5 text-primary-600 border-2 rounded focus:ring-2 focus:ring-primary-500"
            />
            <span>Purchase Option Exercised (Ijara Muntahia Bittamleek)</span>
          </label>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 ml-7">
            Check if the lessee has exercised their right to purchase the asset
          </p>
        </div>
      </div>
    </div>
  );
}
