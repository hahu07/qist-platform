/**
 * Ijarah Contract Report Component
 * 
 * Displays leasing contract details for Ijarah agreements.
 * Asset is leased to the lessee for rental payments, with optional
 * purchase at end of term (Ijarah Muntahia Bittamleek).
 */

import React from 'react';
import type { IjarahTerms } from '@/schemas/islamic-contracts.schema';
import {
  calculateIjarahPaymentSchedule,
  calculateIjarahMetrics,
} from '@/utils/contract-calculations';

interface IjarahReportProps {
  terms: IjarahTerms;
  paidPeriods?: number;
  actualPaidAmount?: number;
}

export function IjarahReport({ terms, paidPeriods = 0, actualPaidAmount = 0 }: IjarahReportProps) {
  const metrics = calculateIjarahMetrics(terms);
  const schedule = calculateIjarahPaymentSchedule(terms);
  
  const leaseTerm = terms.leaseTerm || terms.duration;
  const progress = leaseTerm ? (paidPeriods / leaseTerm) * 100 : 0;
  const totalRentalValue = terms.monthlyRental * leaseTerm;
  const remainingRental = totalRentalValue - actualPaidAmount;

  return (
    <div className="space-y-6">
      {/* Contract Overview */}
      <div className="bg-primary-50 dark:bg-primary-900/20 rounded-xl p-6 border-2 border-primary-200 dark:border-primary-800">
        <h3 className="text-xl font-bold text-primary-900 dark:text-primary-100 mb-4">
          🏢 Ijarah Lease Agreement
        </h3>
        <p className="text-sm text-primary-700 dark:text-primary-300 mb-4">
          Islamic leasing with {(terms.purchaseOption || terms.purchaseOptionIncluded) ? 'ownership transfer option' : 'rental only'}
        </p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-neutral-800 rounded-lg p-4">
            <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase">Asset Value</p>
            <p className="text-2xl font-bold text-neutral-900 dark:text-white">
              ₦{terms.assetValue.toLocaleString()}
            </p>
          </div>
          <div className="bg-white dark:bg-neutral-800 rounded-lg p-4">
            <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase">Monthly Rental</p>
            <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">
              ₦{terms.monthlyRental.toLocaleString()}
            </p>
          </div>
          <div className="bg-white dark:bg-neutral-800 rounded-lg p-4">
            <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase">Total Rental</p>
            <p className="text-2xl font-bold text-success-600 dark:text-success-400">
              ₦{totalRentalValue.toLocaleString()}
            </p>
          </div>
          <div className="bg-white dark:bg-neutral-800 rounded-lg p-4">
            <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase">Rental Yield</p>
            <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">
              {metrics.rentalYield.toFixed(2)}%
            </p>
          </div>
        </div>
      </div>

      {/* Lease Progress */}
      {paidPeriods > 0 && (
        <div className="bg-white dark:bg-neutral-900 rounded-xl p-6 border-2 border-neutral-200 dark:border-neutral-800">
          <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-4">
            📅 Lease Progress
          </h3>
          
          <div className="mb-6">
            <div className="flex justify-between text-sm mb-2">
              <span className="font-medium text-neutral-700 dark:text-neutral-300">
                {paidPeriods} of {leaseTerm} months completed
              </span>
              <span className="font-bold text-primary-600 dark:text-primary-400">
                {progress.toFixed(1)}%
              </span>
            </div>
            <div className="w-full h-4 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-primary-500 to-primary-600 transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">Rental Paid</p>
              <p className="text-lg font-bold text-success-600 dark:text-success-400">
                ₦{actualPaidAmount.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">Remaining</p>
              <p className="text-lg font-bold text-neutral-900 dark:text-white">
                ₦{remainingRental.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">Next Payment</p>
              <p className="text-lg font-bold text-primary-600 dark:text-primary-400">
                {schedule[paidPeriods]?.dueDate || 'N/A'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Purchase Option */}
      {(terms.purchaseOption || terms.purchaseOptionIncluded) && (
        <div className="bg-success-50 dark:bg-success-900/20 rounded-xl p-6 border-2 border-success-200 dark:border-success-800">
          <h3 className="text-lg font-bold text-success-900 dark:text-success-100 mb-4">
            ✨ Purchase Option (Ijarah Muntahia Bittamleek)
          </h3>
          <p className="text-sm text-success-700 dark:text-success-300 mb-4">
            Option to purchase the asset at end of lease term
          </p>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-neutral-800 rounded-lg p-4">
              <p className="text-xs text-neutral-500 dark:text-neutral-400">Purchase Price</p>
              <p className="text-2xl font-bold text-success-600 dark:text-success-400">
                ₦{(terms.purchasePrice || terms.residualValue || 0).toLocaleString()}
              </p>
            </div>
            <div className="bg-white dark:bg-neutral-800 rounded-lg p-4">
              <p className="text-xs text-neutral-500 dark:text-neutral-400">Total Cost</p>
              <p className="text-lg font-bold text-neutral-900 dark:text-white">
                ₦{(totalRentalValue + (terms.purchasePrice || terms.residualValue || 0)).toLocaleString()}
              </p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                Rental + Purchase
              </p>
            </div>
            <div className="bg-white dark:bg-neutral-800 rounded-lg p-4">
              <p className="text-xs text-neutral-500 dark:text-neutral-400">Asset Markup</p>
              <p className="text-lg font-bold text-primary-600 dark:text-primary-400">
                {(((totalRentalValue + (terms.purchasePrice || terms.residualValue || 0) - terms.assetValue) / terms.assetValue) * 100).toFixed(2)}%
              </p>
            </div>
          </div>

          <div className="mt-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg p-4">
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              <strong>Note:</strong> The purchase price is typically nominal or fair market value at end of lease. 
              The lessee has the option to purchase, but is not obligated.
            </p>
          </div>
        </div>
      )}

      {/* Asset & Maintenance Details */}
      <div className="bg-white dark:bg-neutral-900 rounded-xl p-6 border-2 border-neutral-200 dark:border-neutral-800">
        <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-4">
          🔧 Asset & Maintenance
        </h3>

        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div className="bg-primary-50 dark:bg-primary-900/20 rounded-lg p-6 border-2 border-primary-200 dark:border-primary-800">
            <h4 className="font-bold text-primary-900 dark:text-primary-100 mb-3">Asset Description</h4>
            <p className="text-sm text-primary-700 dark:text-primary-300 mb-4">
              {terms.assetDescription}
            </p>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-primary-700 dark:text-primary-300">Asset Type</span>
                <span className="text-sm font-medium text-primary-900 dark:text-primary-100 capitalize">
                  {terms.assetType || terms.assetCategory}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-primary-700 dark:text-primary-300">Condition</span>
                <span className="text-sm font-medium text-primary-900 dark:text-primary-100 capitalize">
                  {terms.assetCondition}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-neutral-50 dark:bg-neutral-800 rounded-lg p-6 border-2 border-neutral-200 dark:border-neutral-700">
            <h4 className="font-bold text-neutral-900 dark:text-white mb-3">Maintenance Responsibilities</h4>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary-600 dark:bg-primary-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5">
                  L
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-neutral-900 dark:text-white">Lessor (Owner)</p>
                  <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1">
                    {terms.maintenanceResponsibility === 'lessor' 
                      ? 'Full responsibility for maintenance and repairs'
                      : 'Minimal responsibility per agreement'}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-success-600 dark:bg-success-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5">
                  L
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-neutral-900 dark:text-white">Lessee (Renter)</p>
                  <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1">
                    {terms.maintenanceResponsibility === 'lessee' 
                      ? 'Full responsibility for maintenance and repairs'
                      : terms.maintenanceResponsibility === 'shared'
                      ? 'Shared responsibility as per agreement'
                      : 'Usage only, no maintenance burden'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {(terms.insuranceRequirement || terms.insuranceRequired) && (
          <div className="bg-warning-50 dark:bg-warning-900/20 rounded-lg p-4 border-2 border-warning-200 dark:border-warning-800">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">🛡️</span>
              <span className="font-bold text-warning-900 dark:text-warning-100">Insurance Required</span>
            </div>
            <p className="text-sm text-warning-700 dark:text-warning-300">
              Asset must be insured according to Takaful (Islamic insurance) principles or conventional 
              insurance if unavailable. Premium responsibility: <strong className="capitalize">{terms.insurancePremiumPayer || 'Lessor'}</strong>
            </p>
          </div>
        )}
      </div>

      {/* Payment Schedule */}
      <div className="bg-white dark:bg-neutral-900 rounded-xl p-6 border-2 border-neutral-200 dark:border-neutral-800">
        <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-4">
          📅 Rental Payment Schedule
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-neutral-200 dark:border-neutral-800">
                <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase">Period</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase">Due Date</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase">Rental Amount</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase">Cumulative</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase">Status</th>
              </tr>
            </thead>
            <tbody>
              {schedule.map((entry) => {
                const isPaid = entry.period <= paidPeriods;
                const isCurrent = entry.period === paidPeriods + 1;

                return (
                  <tr 
                    key={entry.period}
                    className={`border-b border-neutral-100 dark:border-neutral-800 ${
                      isCurrent ? 'bg-primary-50 dark:bg-primary-900/20' : ''
                    } ${isPaid ? 'opacity-60' : ''}`}
                  >
                    <td className="px-4 py-3 text-sm font-medium text-neutral-900 dark:text-white">
                      Month {entry.period}
                    </td>
                    <td className="px-4 py-3 text-sm text-neutral-700 dark:text-neutral-300">
                      {entry.dueDate}
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-semibold text-neutral-900 dark:text-white">
                      ₦{entry.rentalAmount.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-neutral-500 dark:text-neutral-400">
                      ₦{entry.cumulativeAmount.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {isPaid ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-success-100 dark:bg-success-900/30 text-success-800 dark:text-success-300">
                          ✓ Paid
                        </span>
                      ) : isCurrent ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-100 dark:bg-primary-900/30 text-primary-800 dark:text-primary-300">
                          → Due
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
                          Pending
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Contract Terms */}
      <div className="bg-white dark:bg-neutral-900 rounded-xl p-6 border-2 border-neutral-200 dark:border-neutral-800">
        <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-4">
          📄 Lease Terms & Conditions
        </h3>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-neutral-500 dark:text-neutral-400">Lease Term</span>
              <span className="text-sm font-medium text-neutral-900 dark:text-white">
                {terms.leaseTerm} months
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-neutral-500 dark:text-neutral-400">Rental Frequency</span>
              <span className="text-sm font-medium text-neutral-900 dark:text-white capitalize">
                {terms.rentalFrequency}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-neutral-500 dark:text-neutral-400">Security Deposit</span>
              <span className="text-sm font-medium text-neutral-900 dark:text-white">
                ₦{terms.securityDeposit.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-neutral-500 dark:text-neutral-400">Late Payment Penalty</span>
              <span className="text-sm font-medium text-neutral-900 dark:text-white capitalize">
                {terms.latePaymentPenalty === 'charity' ? 'Charity (Islamic)' : 'None'}
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-neutral-500 dark:text-neutral-400">Early Termination</span>
              <span className="text-sm font-medium text-neutral-900 dark:text-white">
                {terms.earlyTerminationAllowed ? 'Allowed' : 'Not Allowed'}
              </span>
            </div>
            {terms.earlyTerminationAllowed && (
              <div className="flex justify-between">
                <span className="text-sm text-neutral-500 dark:text-neutral-400">Termination Penalty</span>
                <span className="text-sm font-medium text-neutral-900 dark:text-white">
                  {terms.earlyTerminationPenalty}%
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-sm text-neutral-500 dark:text-neutral-400">Renewal Option</span>
              <span className="text-sm font-medium text-neutral-900 dark:text-white">
                {terms.renewalOption ? 'Available' : 'Not Available'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-neutral-500 dark:text-neutral-400">Sublease Allowed</span>
              <span className="text-sm font-medium text-neutral-900 dark:text-white">
                {terms.subleaseAllowed ? 'Yes' : 'No'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Financial Metrics */}
      <div className="bg-white dark:bg-neutral-900 rounded-xl p-6 border-2 border-neutral-200 dark:border-neutral-800">
        <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-4">
          📊 Financial Metrics
        </h3>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-primary-50 dark:bg-primary-900/30 rounded-lg">
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">Total Rental Income</p>
            <p className="text-xl font-bold text-primary-600 dark:text-primary-400">
              ₦{metrics.totalRentalIncome.toLocaleString()}
            </p>
          </div>
          <div className="text-center p-4 bg-success-50 dark:bg-success-900/30 rounded-lg">
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">Rental Yield</p>
            <p className="text-xl font-bold text-success-600 dark:text-success-400">
              {metrics.rentalYield.toFixed(2)}%
            </p>
          </div>
          <div className="text-center p-4 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">Monthly Return</p>
            <p className="text-xl font-bold text-neutral-900 dark:text-white">
              {metrics.monthlyReturnRate.toFixed(2)}%
            </p>
          </div>
          <div className="text-center p-4 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">Payback Period</p>
            <p className="text-xl font-bold text-neutral-900 dark:text-white">
              {metrics.paybackPeriod.toFixed(1)} months
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
