/**
 * Unified Contract Report Component
 * 
 * Routes to the appropriate contract-specific report based on contract type.
 * Provides a consistent interface for displaying any Islamic financing contract.
 */

import React from 'react';
import type {
  MurabahaTerms,
  MudarabahTerms,
  MusharakahTerms,
  IjarahTerms,
  SalamTerms,
} from '@/schemas/islamic-contracts.schema';
import {
  isMurabahaTerms,
  isMudarabahTerms,
  isMusharakahTerms,
  isIjarahTerms,
  isSalamTerms,
} from '@/schemas/islamic-contracts.schema';
import { MurabahaReport } from './murabaha-report';
import { MudarabahReport } from './mudarabah-report';
import { MusharakahReport } from './musharakah-report';
import { IjarahReport } from './ijarah-report';
import { SalamReport } from './salam-report';

export type ContractTerms = 
  | MurabahaTerms 
  | MudarabahTerms 
  | MusharakahTerms 
  | IjarahTerms 
  | SalamTerms;

interface ContractReportProps {
  terms: ContractTerms;
  contractType: 'murabaha' | 'mudarabah' | 'musharakah' | 'ijarah' | 'salam';
  // Optional runtime data
  paidInstallments?: number;
  actualPaidAmount?: number;
  actualProfit?: number;
  actualLoss?: number;
  projectStatus?: 'active' | 'completed' | 'liquidated';
  deliveryStatus?: 'pending' | 'partial' | 'completed' | 'delayed';
  deliveredQuantity?: number;
  deliveredDate?: string;
  paidPeriods?: number;
}

/**
 * ContractReport - Unified interface for all Islamic contract reports
 * 
 * Automatically routes to the correct contract-specific component based on
 * contract type and validates that the terms match the contract type.
 * 
 * @example
 * ```tsx
 * <ContractReport 
 *   contractType="murabaha"
 *   terms={murabahaTerms}
 *   paidInstallments={5}
 *   actualPaidAmount={250000}
 * />
 * ```
 */
export function ContractReport(props: ContractReportProps) {
  const { terms, contractType } = props;

  // Validate terms match contract type
  if (contractType === 'murabaha' && !isMurabahaTerms(terms)) {
    return <ErrorDisplay message="Invalid terms for Murabaha contract" />;
  }
  if (contractType === 'mudarabah' && !isMudarabahTerms(terms)) {
    return <ErrorDisplay message="Invalid terms for Mudarabah contract" />;
  }
  if (contractType === 'musharakah' && !isMusharakahTerms(terms)) {
    return <ErrorDisplay message="Invalid terms for Musharakah contract" />;
  }
  if (contractType === 'ijarah' && !isIjarahTerms(terms)) {
    return <ErrorDisplay message="Invalid terms for Ijarah contract" />;
  }
  if (contractType === 'salam' && !isSalamTerms(terms)) {
    return <ErrorDisplay message="Invalid terms for Salam contract" />;
  }

  // Route to appropriate contract report
  switch (contractType) {
    case 'murabaha':
      return (
        <MurabahaReport
          terms={terms as MurabahaTerms}
          paidInstallments={props.paidInstallments}
          actualPaidAmount={props.actualPaidAmount}
        />
      );

    case 'mudarabah':
      return (
        <MudarabahReport
          terms={terms as MudarabahTerms}
          actualProfit={props.actualProfit}
          actualLoss={props.actualLoss}
          projectStatus={props.projectStatus}
        />
      );

    case 'musharakah':
      return (
        <MusharakahReport
          terms={terms as MusharakahTerms}
          actualProfit={props.actualProfit}
          actualLoss={props.actualLoss}
          projectStatus={props.projectStatus}
        />
      );

    case 'ijarah':
      return (
        <IjarahReport
          terms={terms as IjarahTerms}
          paidPeriods={props.paidPeriods}
          actualPaidAmount={props.actualPaidAmount}
        />
      );

    case 'salam':
      return (
        <SalamReport
          terms={terms as SalamTerms}
          deliveryStatus={props.deliveryStatus}
          deliveredQuantity={props.deliveredQuantity}
          deliveredDate={props.deliveredDate}
        />
      );

    default:
      return <ErrorDisplay message={`Unsupported contract type: ${contractType}`} />;
  }
}

/**
 * ErrorDisplay - Shows validation or routing errors
 */
function ErrorDisplay({ message }: { message: string }) {
  return (
    <div className="bg-danger-50 dark:bg-danger-900/20 rounded-xl p-6 border-2 border-danger-200 dark:border-danger-800">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-12 h-12 rounded-full bg-danger-600 dark:bg-danger-500 flex items-center justify-center text-white text-2xl">
          ⚠️
        </div>
        <div>
          <h3 className="text-lg font-bold text-danger-900 dark:text-danger-100">
            Contract Report Error
          </h3>
          <p className="text-sm text-danger-700 dark:text-danger-300">
            {message}
          </p>
        </div>
      </div>
      <div className="bg-white dark:bg-neutral-800 rounded-lg p-4 mt-4">
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          <strong>Troubleshooting:</strong>
        </p>
        <ul className="text-sm text-neutral-600 dark:text-neutral-400 mt-2 space-y-1 list-disc list-inside">
          <li>Verify the contract type matches the provided terms</li>
          <li>Ensure all required fields are present in the terms object</li>
          <li>Check that the terms object is properly validated with Zod schema</li>
          <li>Review the console for additional error details</li>
        </ul>
      </div>
    </div>
  );
}

/**
 * ContractReportSkeleton - Loading state for contract reports
 */
export function ContractReportSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="bg-neutral-100 dark:bg-neutral-800 rounded-xl h-48" />
      <div className="bg-neutral-100 dark:bg-neutral-800 rounded-xl h-64" />
      <div className="bg-neutral-100 dark:bg-neutral-800 rounded-xl h-96" />
    </div>
  );
}

/**
 * Helper function to get contract display name
 */
export function getContractDisplayName(contractType: string): string {
  const names: Record<string, string> = {
    murabaha: 'Murabaha (Cost-Plus Financing)',
    mudarabah: 'Mudarabah (Profit-Sharing Partnership)',
    musharakah: 'Musharakah (Joint Venture)',
    ijarah: 'Ijarah (Islamic Lease)',
    salam: 'Salam (Forward Purchase)',
  };
  return names[contractType] || contractType;
}

/**
 * Helper function to get contract icon
 */
export function getContractIcon(contractType: string): string {
  const icons: Record<string, string> = {
    murabaha: '📋',
    mudarabah: '🤝',
    musharakah: '🤝',
    ijarah: '🏢',
    salam: '📦',
  };
  return icons[contractType] || '📄';
}
