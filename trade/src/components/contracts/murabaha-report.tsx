/**
 * Murabaha Contract Report Component
 * 
 * Displays detailed financial information and payment schedule for Murabaha
 * (cost-plus financing) contracts.
 */

import React from 'react';
import type { MurabahaTerms } from '@/schemas/islamic-contracts.schema';
import {
  calculateMurabahaPaymentSchedule,
  calculateMurabahaMetrics,
  calculateMurabahaEarlySettlement,
} from '@/utils/contract-calculations';

interface MurabahaReportProps {
  terms: MurabahaTerms;
  paidInstallments?: number;
  actualPaidAmount?: number;
}

export function MurabahaReport({ terms, paidInstallments = 0, actualPaidAmount = 0 }: MurabahaReportProps) {
  const metrics = calculateMurabahaMetrics(terms);
  const schedule = calculateMurabahaPaymentSchedule(terms);
  const earlySettlement = paidInstallments > 0 && paidInstallments < (terms.numberOfInstallments || 1)
    ? calculateMurabahaEarlySettlement(terms, paidInstallments)
    : null;

  const progress = terms.numberOfInstallments 
    ? (paidInstallments / terms.numberOfInstallments) * 100 
    : 0;

  return (
    <div className="space-y-6">
      {/* Contract Overview */}
      <div className="bg-primary-50 dark:bg-primary-900/20 rounded-xl p-6 border-2 border-primary-200 dark:border-primary-800">
        <h3 className="text-xl font-bold text-primary-900 dark:text-primary-100 mb-4">
          📋 Murabaha Contract Overview
        </h3>
        <p className="text-sm text-primary-700 dark:text-primary-300 mb-4">
          Cost-plus financing with disclosed markup and fixed repayment schedule
        </p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-neutral-800 rounded-lg p-4">
            <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase">Cost Price</p>
            <p className="text-2xl font-bold text-neutral-900 dark:text-white">
              ₦{terms.costPrice.toLocaleString()}
            </p>
          </div>
          <div className="bg-white dark:bg-neutral-800 rounded-lg p-4">
            <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase">Profit</p>
            <p className="text-2xl font-bold text-success-600 dark:text-success-400">
              ₦{terms.profitAmount.toLocaleString()}
            </p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
              {terms.profitRate.toFixed(2)}% markup
            </p>
          </div>
          <div className="bg-white dark:bg-neutral-800 rounded-lg p-4">
            <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase">Selling Price</p>
            <p className="text-2xl font-bold text-neutral-900 dark:text-white">
              ₦{terms.sellingPrice.toLocaleString()}
            </p>
          </div>
          <div className="bg-white dark:bg-neutral-800 rounded-lg p-4">
            <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase">APR</p>
            <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">
              {metrics.apr.toFixed(2)}%
            </p>
          </div>
        </div>
      </div>

      {/* Payment Progress */}
      {paidInstallments > 0 && (
        <div className="bg-white dark:bg-neutral-900 rounded-xl p-6 border-2 border-neutral-200 dark:border-neutral-800">
          <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-4">
            💳 Payment Progress
          </h3>
          
          <div className="mb-6">
            <div className="flex justify-between text-sm mb-2">
              <span className="font-medium text-neutral-700 dark:text-neutral-300">
                {paidInstallments} of {terms.numberOfInstallments} payments made
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
              <p className="text-sm text-neutral-500 dark:text-neutral-400">Total Paid</p>
              <p className="text-lg font-bold text-success-600 dark:text-success-400">
                ₦{actualPaidAmount.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">Remaining</p>
              <p className="text-lg font-bold text-neutral-900 dark:text-white">
                ₦{(terms.sellingPrice - actualPaidAmount).toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">Next Payment</p>
              <p className="text-lg font-bold text-primary-600 dark:text-primary-400">
                {schedule[paidInstallments]?.dueDate || 'N/A'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Early Settlement Option */}
      {earlySettlement && (
        <div className="bg-success-50 dark:bg-success-900/20 rounded-xl p-6 border-2 border-success-200 dark:border-success-800">
          <h3 className="text-lg font-bold text-success-900 dark:text-success-100 mb-4">
            ✨ Early Settlement Option
          </h3>
          <p className="text-sm text-success-700 dark:text-success-300 mb-4">
            Pay off remaining balance early and save on profit charges
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-neutral-800 rounded-lg p-3">
              <p className="text-xs text-neutral-500 dark:text-neutral-400">Remaining Principal</p>
              <p className="text-lg font-bold text-neutral-900 dark:text-white">
                ₦{earlySettlement.remainingPrincipal.toLocaleString()}
              </p>
            </div>
            <div className="bg-white dark:bg-neutral-800 rounded-lg p-3">
              <p className="text-xs text-neutral-500 dark:text-neutral-400">Remaining Profit</p>
              <p className="text-lg font-bold text-neutral-900 dark:text-white">
                ₦{earlySettlement.remainingProfit.toLocaleString()}
              </p>
            </div>
            <div className="bg-white dark:bg-neutral-800 rounded-lg p-3">
              <p className="text-xs text-neutral-500 dark:text-neutral-400">Discount</p>
              <p className="text-lg font-bold text-success-600 dark:text-success-400">
                -₦{earlySettlement.discount.toLocaleString()}
              </p>
            </div>
            <div className="bg-white dark:bg-neutral-800 rounded-lg p-3">
              <p className="text-xs text-neutral-500 dark:text-neutral-400">Settlement Amount</p>
              <p className="text-lg font-bold text-primary-600 dark:text-primary-400">
                ₦{earlySettlement.settlementAmount.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Payment Schedule */}
      <div className="bg-white dark:bg-neutral-900 rounded-xl p-6 border-2 border-neutral-200 dark:border-neutral-800">
        <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-4">
          📅 Payment Schedule
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-neutral-200 dark:border-neutral-800">
                <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase">#</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase">Due Date</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase">Principal</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase">Profit</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase">Total</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase">Balance</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase">Status</th>
              </tr>
            </thead>
            <tbody>
              {schedule.map((entry) => {
                const isPaid = entry.paymentNumber <= paidInstallments;
                const isCurrent = entry.paymentNumber === paidInstallments + 1;

                return (
                  <tr 
                    key={entry.paymentNumber}
                    className={`border-b border-neutral-100 dark:border-neutral-800 ${
                      isCurrent ? 'bg-primary-50 dark:bg-primary-900/20' : ''
                    } ${isPaid ? 'opacity-60' : ''}`}
                  >
                    <td className="px-4 py-3 text-sm font-medium text-neutral-900 dark:text-white">
                      {entry.paymentNumber}
                    </td>
                    <td className="px-4 py-3 text-sm text-neutral-700 dark:text-neutral-300">
                      {entry.dueDate}
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-neutral-700 dark:text-neutral-300">
                      ₦{entry.principalAmount.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-neutral-700 dark:text-neutral-300">
                      ₦{entry.profitAmount.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-semibold text-neutral-900 dark:text-white">
                      ₦{entry.totalPayment.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-neutral-500 dark:text-neutral-400">
                      ₦{entry.remainingBalance.toLocaleString()}
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

      {/* Contract Details */}
      <div className="bg-white dark:bg-neutral-900 rounded-xl p-6 border-2 border-neutral-200 dark:border-neutral-800">
        <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-4">
          📄 Contract Details
        </h3>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-neutral-500 dark:text-neutral-400">Asset Description</span>
              <span className="text-sm font-medium text-neutral-900 dark:text-white text-right max-w-xs">
                {terms.assetDescription}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-neutral-500 dark:text-neutral-400">Payment Structure</span>
              <span className="text-sm font-medium text-neutral-900 dark:text-white capitalize">
                {terms.paymentStructure}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-neutral-500 dark:text-neutral-400">Frequency</span>
              <span className="text-sm font-medium text-neutral-900 dark:text-white capitalize">
                {terms.installmentFrequency}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-neutral-500 dark:text-neutral-400">Number of Installments</span>
              <span className="text-sm font-medium text-neutral-900 dark:text-white">
                {terms.numberOfInstallments}
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-neutral-500 dark:text-neutral-400">Deferment Period</span>
              <span className="text-sm font-medium text-neutral-900 dark:text-white">
                {terms.defermentPeriod} months
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-neutral-500 dark:text-neutral-400">Early Settlement Discount</span>
              <span className="text-sm font-medium text-neutral-900 dark:text-white">
                {terms.earlySettlementDiscount}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-neutral-500 dark:text-neutral-400">Late Payment Penalty</span>
              <span className="text-sm font-medium text-neutral-900 dark:text-white capitalize">
                {terms.latePaymentPenalty === 'charity' ? 'Charity (Islamic)' : 'None'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-neutral-500 dark:text-neutral-400">Contract Duration</span>
              <span className="text-sm font-medium text-neutral-900 dark:text-white">
                {terms.duration} months
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
