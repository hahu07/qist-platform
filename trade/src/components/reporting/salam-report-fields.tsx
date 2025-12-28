"use client";

import React from "react";

interface SalamReportFieldsProps {
  details: {
    commodityDescription?: string;
    advancePaymentReceived?: number;
    productionProgress?: number;
    deliveryStatus?: string;
    quantityOrdered?: number;
    quantityDelivered?: number;
    qualityCompliance?: string;
    productionCosts?: number;
  };
  onChange: (field: string, value: any) => void;
  errors?: Record<string, string>;
}

export function SalamReportFields({ details, onChange, errors }: SalamReportFieldsProps) {
  return (
    <div className="space-y-4 p-4 bg-lavender-blue-50 dark:bg-lavender-blue-900/10 rounded-lg border-2 border-lavender-blue-200 dark:border-lavender-blue-800">
      <h3 className="font-bold text-lg text-neutral-900 dark:text-white mb-3">
        Salam/Istisna (Forward Sale) Specific Details
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
            Commodity/Product Description
          </label>
          <textarea
            value={details.commodityDescription || ""}
            onChange={(e) => onChange("commodityDescription", e.target.value)}
            className="w-full px-4 py-2 border-2 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-neutral-800"
            placeholder="Describe the commodity or manufactured product..."
            rows={2}
            maxLength={300}
          />
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
            {(details.commodityDescription || "").length}/300 characters
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
            Advance Payment Received (₦)
          </label>
          <input
            type="number"
            value={details.advancePaymentReceived || ""}
            onChange={(e) => onChange("advancePaymentReceived", parseFloat(e.target.value) || 0)}
            className="w-full px-4 py-2 border-2 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-neutral-800"
            placeholder="Full payment made upfront"
            min={0}
            step={0.01}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
            Production Progress (%)
          </label>
          <input
            type="number"
            value={details.productionProgress || ""}
            onChange={(e) => onChange("productionProgress", parseFloat(e.target.value) || 0)}
            className="w-full px-4 py-2 border-2 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-neutral-800"
            placeholder="Completion percentage"
            min={0}
            max={100}
            step={0.1}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
            Quantity Ordered
          </label>
          <input
            type="number"
            value={details.quantityOrdered || ""}
            onChange={(e) => onChange("quantityOrdered", parseFloat(e.target.value) || 0)}
            className="w-full px-4 py-2 border-2 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-neutral-800"
            placeholder="Total quantity ordered"
            min={0}
            step={0.01}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
            Quantity Delivered
          </label>
          <input
            type="number"
            value={details.quantityDelivered || ""}
            onChange={(e) => onChange("quantityDelivered", parseFloat(e.target.value) || 0)}
            className="w-full px-4 py-2 border-2 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-neutral-800"
            placeholder="Quantity delivered so far"
            min={0}
            step={0.01}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
            Production Costs (₦)
          </label>
          <input
            type="number"
            value={details.productionCosts || ""}
            onChange={(e) => onChange("productionCosts", parseFloat(e.target.value) || 0)}
            className="w-full px-4 py-2 border-2 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-neutral-800"
            placeholder="Total production costs"
            min={0}
            step={0.01}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
            Delivery Status
          </label>
          <select
            value={details.deliveryStatus || ""}
            onChange={(e) => onChange("deliveryStatus", e.target.value)}
            className="w-full px-4 py-2 border-2 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-neutral-800"
          >
            <option value="">Select status</option>
            <option value="not-started">Not Started</option>
            <option value="in-progress">In Progress</option>
            <option value="partial">Partial Delivery</option>
            <option value="completed">Completed</option>
            <option value="delayed">Delayed</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
            Quality Compliance
          </label>
          <select
            value={details.qualityCompliance || ""}
            onChange={(e) => onChange("qualityCompliance", e.target.value)}
            className="w-full px-4 py-2 border-2 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-neutral-800"
          >
            <option value="">Select compliance</option>
            <option value="compliant">Compliant</option>
            <option value="minor-issues">Minor Issues</option>
            <option value="major-issues">Major Issues</option>
          </select>
        </div>
      </div>
    </div>
  );
}
