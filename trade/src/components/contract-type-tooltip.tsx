"use client";

import { useState } from "react";

interface ContractTypeInfo {
  name: string;
  arabic: string;
  description: string;
  example: string;
}

const contractTypes: Record<string, ContractTypeInfo> = {
  murabaha: {
    name: "Murabaha",
    arabic: "مرابحة",
    description: "Cost-plus financing where the bank purchases an asset and sells it to you at an agreed markup. The price and profit margin are transparent and fixed upfront.",
    example: "You need ₦1M for inventory. The bank buys it for ₦1M and sells to you for ₦1.15M payable over 12 months."
  },
  musharaka: {
    name: "Musharaka",
    arabic: "مشاركة",
    description: "Partnership financing where both parties contribute capital and share profits/losses according to an agreed ratio. Ideal for business expansion.",
    example: "You contribute ₦500K and the bank contributes ₦500K. Profits are shared 50/50, losses proportionally."
  },
  mudaraba: {
    name: "Mudaraba",
    arabic: "مضاربة",
    description: "Profit-sharing partnership where the bank provides capital and you provide expertise/management. Profits are shared per agreement, losses borne by the bank.",
    example: "Bank provides ₦2M for your trading business. You manage operations. Profits split 60/40, you bear no financial loss."
  },
  ijara: {
    name: "Ijara",
    arabic: "إجارة",
    description: "Lease-to-own arrangement where the bank purchases an asset and leases it to you. You can eventually own the asset after lease period ends.",
    example: "Bank buys equipment for ₦5M, leases to you for ₦450K/month for 12 months with ownership transfer at end."
  },
  istisna: {
    name: "Istisna'a",
    arabic: "استصناع",
    description: "Manufacturing/construction financing where payment is made progressively as work is completed. Commonly used for infrastructure or custom manufacturing.",
    example: "Bank finances ₦10M factory construction. Payments released in stages as builder completes each phase (foundation, structure, finishing)."
  }
};

interface ContractTypeTooltipProps {
  type: string;
}

export function ContractTypeTooltip({ type }: ContractTypeTooltipProps) {
  const [isOpen, setIsOpen] = useState(false);
  const contractInfo = contractTypes[type.toLowerCase()];

  if (!contractInfo) {
    return <span className="capitalize">{type}</span>;
  }

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-1 text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium underline decoration-dotted underline-offset-2"
      >
        {contractInfo.name}
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute z-50 w-80 max-w-sm mt-2 left-0 bg-white dark:bg-neutral-800 border-2 border-primary-200 dark:border-primary-700 rounded-xl shadow-2xl p-5 animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h4 className="text-lg font-bold text-neutral-900 dark:text-white">{contractInfo.name}</h4>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 font-arabic">{contractInfo.arabic}</p>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-3">
            <div>
              <p className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed">
                {contractInfo.description}
              </p>
            </div>

            <div className="bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-lg p-3">
              <p className="text-xs font-semibold text-primary-700 dark:text-primary-300 uppercase tracking-wider mb-1">Example</p>
              <p className="text-sm text-primary-900 dark:text-primary-100">
                {contractInfo.example}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface ContractTypeSelectProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

export function ContractTypeSelect({ value, onChange, error }: ContractTypeSelectProps) {
  return (
    <div>
      <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
        Contract Type <span className="text-danger-500">*</span>
      </label>
      <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-3">
        Select the Sharia-compliant financing structure. Hover over each option to learn more.
      </p>
      
      <div className="grid gap-3">
        {Object.entries(contractTypes).map(([key, info]) => (
          <label
            key={key}
            className={`relative flex items-start gap-3 p-4 border-2 rounded-xl cursor-pointer transition-all ${
              value === key
                ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20"
                : "border-neutral-200 dark:border-neutral-700 hover:border-primary-300 dark:hover:border-primary-600 bg-white dark:bg-neutral-900"
            }`}
          >
            <input
              type="radio"
              name="contractType"
              value={key}
              checked={value === key}
              onChange={(e) => onChange(e.target.value)}
              className="mt-1 w-4 h-4 text-primary-600 focus:ring-primary-500"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-bold text-neutral-900 dark:text-white">{info.name}</span>
                <span className="text-sm text-neutral-500 dark:text-neutral-400 font-arabic">({info.arabic})</span>
              </div>
              <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
                {info.description}
              </p>
            </div>
          </label>
        ))}
      </div>

      {error && (
        <p className="mt-2 text-sm text-danger-600 dark:text-danger-400">{error}</p>
      )}
    </div>
  );
}
