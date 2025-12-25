/**
 * Mudarabah Contract Report Component
 * 
 * Displays profit-sharing partnership details for Mudarabah contracts.
 * Capital provider (Rab-ul-Mal) provides capital, entrepreneur (Mudarib)
 * provides effort. Profits shared per agreement, losses borne by capital provider.
 */

import React from 'react';
import type { MudarabahTerms } from '@/schemas/islamic-contracts.schema';
import {
  calculateMudarabahDistribution,
  calculateMudarabahLoss,
} from '@/utils/contract-calculations';

interface MudarabahReportProps {
  terms: MudarabahTerms;
  actualProfit?: number;
  actualLoss?: number;
  projectStatus?: 'active' | 'completed' | 'liquidated';
}

export function MudarabahReport({ 
  terms, 
  actualProfit = 0, 
  actualLoss = 0,
  projectStatus = 'active'
}: MudarabahReportProps) {
  const profitDistribution = actualProfit > 0 
    ? calculateMudarabahDistribution(terms, actualProfit)
    : null;

  const lossAllocation = actualLoss > 0
    ? calculateMudarabahLoss(terms, actualLoss)
    : null;

  const expectedROI = ((actualProfit - actualLoss) / terms.capitalAmount) * 100;
  const investorROI = profitDistribution
    ? ((profitDistribution.investorShare - actualLoss) / terms.capitalAmount) * 100
    : expectedROI * (terms.investorProfitShare / 100);

  return (
    <div className="space-y-6">
      {/* Contract Overview */}
      <div className="bg-primary-50 dark:bg-primary-900/20 rounded-xl p-6 border-2 border-primary-200 dark:border-primary-800">
        <h3 className="text-xl font-bold text-primary-900 dark:text-primary-100 mb-4">
          🤝 Mudarabah Partnership Overview
        </h3>
        <p className="text-sm text-primary-700 dark:text-primary-300 mb-4">
          Profit-sharing partnership: Capital provider (Rab-ul-Mal) + Entrepreneur (Mudarib)
        </p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-neutral-800 rounded-lg p-4">
            <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase">Capital Invested</p>
            <p className="text-2xl font-bold text-neutral-900 dark:text-white">
              ₦{terms.capitalAmount.toLocaleString()}
            </p>
          </div>
          <div className="bg-white dark:bg-neutral-800 rounded-lg p-4">
            <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase">Expected Return</p>
            <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">
              {terms.expectedReturnRate.toFixed(1)}%
            </p>
          </div>
          <div className="bg-white dark:bg-neutral-800 rounded-lg p-4">
            <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase">Actual ROI</p>
            <p className={`text-2xl font-bold ${
              investorROI >= 0 
                ? 'text-success-600 dark:text-success-400' 
                : 'text-danger-600 dark:text-danger-400'
            }`}>
              {investorROI >= 0 ? '+' : ''}{investorROI.toFixed(2)}%
            </p>
          </div>
          <div className="bg-white dark:bg-neutral-800 rounded-lg p-4">
            <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase">Status</p>
            <p className="text-lg font-bold capitalize">
              {projectStatus === 'active' && <span className="text-primary-600 dark:text-primary-400">⚡ Active</span>}
              {projectStatus === 'completed' && <span className="text-success-600 dark:text-success-400">✓ Completed</span>}
              {projectStatus === 'liquidated' && <span className="text-neutral-600 dark:text-neutral-400">⊗ Liquidated</span>}
            </p>
          </div>
        </div>
      </div>

      {/* Profit Sharing Structure */}
      <div className="bg-white dark:bg-neutral-900 rounded-xl p-6 border-2 border-neutral-200 dark:border-neutral-800">
        <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-4">
          💰 Profit Sharing Agreement
        </h3>

        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div className="bg-success-50 dark:bg-success-900/20 rounded-lg p-6 border-2 border-success-200 dark:border-success-800">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-success-600 dark:bg-success-500 flex items-center justify-center text-white text-xl font-bold">
                I
              </div>
              <div>
                <h4 className="font-bold text-success-900 dark:text-success-100">Rab-ul-Mal (Investor)</h4>
                <p className="text-xs text-success-700 dark:text-success-300">Capital Provider</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-success-700 dark:text-success-300">Profit Share</span>
                <span className="text-3xl font-bold text-success-900 dark:text-success-100">
                  {terms.investorProfitShare}%
                </span>
              </div>
              <div className="w-full h-3 bg-success-200 dark:bg-success-900 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-success-600 dark:bg-success-500"
                  style={{ width: `${terms.investorProfitShare}%` }}
                />
              </div>
            </div>
          </div>

          <div className="bg-primary-50 dark:bg-primary-900/20 rounded-lg p-6 border-2 border-primary-200 dark:border-primary-800">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-primary-600 dark:bg-primary-500 flex items-center justify-center text-white text-xl font-bold">
                M
              </div>
              <div>
                <h4 className="font-bold text-primary-900 dark:text-primary-100">Mudarib (Entrepreneur)</h4>
                <p className="text-xs text-primary-700 dark:text-primary-300">Effort Provider</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-primary-700 dark:text-primary-300">Profit Share</span>
                <span className="text-3xl font-bold text-primary-900 dark:text-primary-100">
                  {terms.mudaribProfitShare}%
                </span>
              </div>
              <div className="w-full h-3 bg-primary-200 dark:bg-primary-900 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary-600 dark:bg-primary-500"
                  style={{ width: `${terms.mudaribProfitShare}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-lg p-4">
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            <strong>Shariah Principle:</strong> Profits are shared according to pre-agreed ratios. 
            Losses are borne entirely by the capital provider (investor), while the entrepreneur 
            loses their time and effort.
          </p>
        </div>
      </div>

      {/* Profit Distribution */}
      {profitDistribution && (
        <div className="bg-success-50 dark:bg-success-900/20 rounded-xl p-6 border-2 border-success-200 dark:border-success-800">
          <h3 className="text-lg font-bold text-success-900 dark:text-success-100 mb-4">
            📊 Profit Distribution
          </h3>

          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="bg-white dark:bg-neutral-800 rounded-lg p-4">
              <p className="text-xs text-neutral-500 dark:text-neutral-400">Total Profit</p>
              <p className="text-2xl font-bold text-success-600 dark:text-success-400">
                ₦{profitDistribution.totalProfit.toLocaleString()}
              </p>
            </div>
            <div className="bg-white dark:bg-neutral-800 rounded-lg p-4">
              <p className="text-xs text-neutral-500 dark:text-neutral-400">Investor Share</p>
              <p className="text-2xl font-bold text-success-600 dark:text-success-400">
                ₦{profitDistribution.investorShare.toLocaleString()}
              </p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                {terms.investorProfitShare}% of profit
              </p>
            </div>
            <div className="bg-white dark:bg-neutral-800 rounded-lg p-4">
              <p className="text-xs text-neutral-500 dark:text-neutral-400">Mudarib Share</p>
              <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                ₦{profitDistribution.mudaribShare.toLocaleString()}
              </p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                {terms.mudaribProfitShare}% of profit
              </p>
            </div>
          </div>

          <div className="space-y-2">
            {profitDistribution.distribution.map((entry, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                  entry.party === 'investor' 
                    ? 'bg-success-600 dark:bg-success-500' 
                    : 'bg-primary-600 dark:bg-primary-500'
                }`}>
                  {entry.party === 'investor' ? 'I' : 'M'}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-neutral-900 dark:text-white capitalize">
                      {entry.party}
                    </span>
                    <span className="text-sm font-bold text-neutral-900 dark:text-white">
                      ₦{entry.amount.toLocaleString()} ({entry.percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${
                        entry.party === 'investor' 
                          ? 'bg-success-600 dark:bg-success-500' 
                          : 'bg-primary-600 dark:bg-primary-500'
                      }`}
                      style={{ width: `${entry.percentage}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Loss Allocation */}
      {lossAllocation && (
        <div className="bg-danger-50 dark:bg-danger-900/20 rounded-xl p-6 border-2 border-danger-200 dark:border-danger-800">
          <h3 className="text-lg font-bold text-danger-900 dark:text-danger-100 mb-4">
            ⚠️ Loss Allocation
          </h3>

          <div className="bg-white dark:bg-neutral-800 rounded-lg p-6 mb-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-danger-600 dark:bg-danger-500 flex items-center justify-center text-white text-2xl">
                I
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-neutral-900 dark:text-white mb-2">
                  Investor Bears All Financial Loss
                </h4>
                <p className="text-2xl font-bold text-danger-600 dark:text-danger-400 mb-2">
                  -₦{lossAllocation.investorLoss.toLocaleString()}
                </p>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  In Mudarabah, the capital provider (Rab-ul-Mal) bears all financial losses, 
                  while the Mudarib loses their time and effort invested in the venture.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">📋</span>
              <span className="font-bold text-neutral-900 dark:text-white">Shariah Compliance Note:</span>
            </div>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              This loss allocation follows Islamic finance principles where the entrepreneur (Mudarib) 
              is not liable for losses unless due to negligence or breach of contract terms.
            </p>
          </div>
        </div>
      )}

      {/* Business Activity */}
      <div className="bg-white dark:bg-neutral-900 rounded-xl p-6 border-2 border-neutral-200 dark:border-neutral-800">
        <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-4">
          💼 Business Activity & Terms
        </h3>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">Business Activity</p>
              <p className="text-sm font-medium text-neutral-900 dark:text-white">
                {terms.businessActivity}
              </p>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-neutral-500 dark:text-neutral-400">Contract Duration</span>
              <span className="text-sm font-medium text-neutral-900 dark:text-white">
                {terms.duration} months
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-neutral-500 dark:text-neutral-400">Mudarib Authority</span>
              <span className="text-sm font-medium text-neutral-900 dark:text-white capitalize">
                {terms.mudaribAuthority}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-neutral-500 dark:text-neutral-400">Capital Guarantee</span>
              <span className="text-sm font-medium text-neutral-900 dark:text-white">
                {terms.capitalGuarantee ? 'Yes' : 'No (Islamic Standard)'}
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">Profit Calculation Method</p>
              <p className="text-sm font-medium text-neutral-900 dark:text-white capitalize">
                {terms.profitCalculationMethod}
              </p>
            </div>
            <div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">Profit Distribution Frequency</p>
              <p className="text-sm font-medium text-neutral-900 dark:text-white capitalize">
                {terms.profitDistributionFrequency}
              </p>
            </div>
            <div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">Management Fee</p>
              <p className="text-sm font-medium text-neutral-900 dark:text-white">
                {terms.managementFee ? `${terms.managementFee}%` : 'None'}
              </p>
            </div>
            <div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">Performance Incentive</p>
              <p className="text-sm font-medium text-neutral-900 dark:text-white">
                {terms.performanceIncentive ? `${terms.performanceIncentive}%` : 'None'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Capital Utilization */}
      <div className="bg-white dark:bg-neutral-900 rounded-xl p-6 border-2 border-neutral-200 dark:border-neutral-800">
        <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-4">
          📈 Financial Summary
        </h3>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">Capital</p>
            <p className="text-xl font-bold text-neutral-900 dark:text-white">
              ₦{terms.capitalAmount.toLocaleString()}
            </p>
          </div>
          <div className="text-center p-4 bg-success-50 dark:bg-success-900/30 rounded-lg">
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">Total Profit</p>
            <p className="text-xl font-bold text-success-600 dark:text-success-400">
              +₦{actualProfit.toLocaleString()}
            </p>
          </div>
          <div className="text-center p-4 bg-danger-50 dark:bg-danger-900/30 rounded-lg">
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">Total Loss</p>
            <p className="text-xl font-bold text-danger-600 dark:text-danger-400">
              -₦{actualLoss.toLocaleString()}
            </p>
          </div>
          <div className="text-center p-4 bg-primary-50 dark:bg-primary-900/30 rounded-lg">
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">Net Return</p>
            <p className={`text-xl font-bold ${
              (actualProfit - actualLoss) >= 0
                ? 'text-success-600 dark:text-success-400'
                : 'text-danger-600 dark:text-danger-400'
            }`}>
              {(actualProfit - actualLoss) >= 0 ? '+' : ''}₦{(actualProfit - actualLoss).toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
