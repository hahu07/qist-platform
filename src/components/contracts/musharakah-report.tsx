/**
 * Musharakah Contract Report Component
 * 
 * Displays joint venture partnership details for Musharakah contracts.
 * Both parties contribute capital and share profits/losses according to
 * agreed ratios (losses must match capital contribution ratios per Shariah).
 */

import React from 'react';
import type { MusharakahTerms } from '@/schemas/islamic-contracts.schema';
import {
  calculateMusharakahDistribution,
  calculateMusharakahLoss,
} from '@/utils/contract-calculations';

interface MusharakahReportProps {
  terms: MusharakahTerms;
  actualProfit?: number;
  actualLoss?: number;
  projectStatus?: 'active' | 'completed' | 'liquidated';
}

export function MusharakahReport({
  terms,
  actualProfit = 0,
  actualLoss = 0,
  projectStatus = 'active'
}: MusharakahReportProps) {
  const profitDistribution = actualProfit > 0
    ? calculateMusharakahDistribution(terms, actualProfit)
    : null;

  const lossAllocation = actualLoss > 0
    ? calculateMusharakahLoss(terms, actualLoss)
    : null;

  const totalCapital = terms.party1Capital + terms.party2Capital;
  const party1ROI = profitDistribution
    ? ((profitDistribution.party1Share - (lossAllocation?.party1Loss || 0)) / terms.party1Capital) * 100
    : 0;
  const party2ROI = profitDistribution
    ? ((profitDistribution.party2Share - (lossAllocation?.party2Loss || 0)) / terms.party2Capital) * 100
    : 0;

  return (
    <div className="space-y-6">
      {/* Contract Overview */}
      <div className="bg-primary-50 dark:bg-primary-900/20 rounded-xl p-6 border-2 border-primary-200 dark:border-primary-800">
        <h3 className="text-xl font-bold text-primary-900 dark:text-primary-100 mb-4">
          🤝 Musharakah Joint Venture
        </h3>
        <p className="text-sm text-primary-700 dark:text-primary-300 mb-4">
          Partnership where both parties contribute capital and share profits/losses
        </p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-neutral-800 rounded-lg p-4">
            <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase">Total Capital</p>
            <p className="text-2xl font-bold text-neutral-900 dark:text-white">
              ₦{totalCapital.toLocaleString()}
            </p>
          </div>
          <div className="bg-white dark:bg-neutral-800 rounded-lg p-4">
            <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase">Net Result</p>
            <p className={`text-2xl font-bold ${
              (actualProfit - actualLoss) >= 0
                ? 'text-success-600 dark:text-success-400'
                : 'text-danger-600 dark:text-danger-400'
            }`}>
              {(actualProfit - actualLoss) >= 0 ? '+' : ''}₦{(actualProfit - actualLoss).toLocaleString()}
            </p>
          </div>
          <div className="bg-white dark:bg-neutral-800 rounded-lg p-4">
            <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase">Partnership Type</p>
            <p className="text-lg font-bold text-primary-600 dark:text-primary-400 capitalize">
              {terms.partnershipType}
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

      {/* Partner Contributions */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-success-50 dark:bg-success-900/20 rounded-xl p-6 border-2 border-success-200 dark:border-success-800">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-success-600 dark:bg-success-500 flex items-center justify-center text-white text-xl font-bold">
              P1
            </div>
            <div>
              <h4 className="font-bold text-success-900 dark:text-success-100">Partner 1</h4>
              <p className="text-xs text-success-700 dark:text-success-300">
                {terms.party1Name || 'Primary Partner'}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-success-700 dark:text-success-300">Capital Contribution</span>
                <span className="text-2xl font-bold text-success-900 dark:text-success-100">
                  ₦{terms.party1Capital.toLocaleString()}
                </span>
              </div>
              <div className="w-full h-3 bg-success-200 dark:bg-success-900 rounded-full overflow-hidden">
                <div
                  className="h-full bg-success-600 dark:bg-success-500"
                  style={{ width: `${(terms.party1Capital / totalCapital) * 100}%` }}
                />
              </div>
              <p className="text-xs text-success-700 dark:text-success-300 mt-1">
                {((terms.party1Capital / totalCapital) * 100).toFixed(1)}% of total capital
              </p>
            </div>

            <div className="bg-white dark:bg-neutral-800 rounded-lg p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-neutral-500 dark:text-neutral-400">Profit Share</span>
                <span className="text-sm font-bold text-success-600 dark:text-success-400">
                  {terms.party1ProfitShare}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-neutral-500 dark:text-neutral-400">Loss Share</span>
                <span className="text-sm font-bold text-danger-600 dark:text-danger-400">
                  {terms.party1LossShare}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-neutral-500 dark:text-neutral-400">ROI</span>
                <span className={`text-sm font-bold ${
                  party1ROI >= 0
                    ? 'text-success-600 dark:text-success-400'
                    : 'text-danger-600 dark:text-danger-400'
                }`}>
                  {party1ROI >= 0 ? '+' : ''}{party1ROI.toFixed(2)}%
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-primary-50 dark:bg-primary-900/20 rounded-xl p-6 border-2 border-primary-200 dark:border-primary-800">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-primary-600 dark:bg-primary-500 flex items-center justify-center text-white text-xl font-bold">
              P2
            </div>
            <div>
              <h4 className="font-bold text-primary-900 dark:text-primary-100">Partner 2</h4>
              <p className="text-xs text-primary-700 dark:text-primary-300">
                {terms.party2Name || 'Secondary Partner'}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-primary-700 dark:text-primary-300">Capital Contribution</span>
                <span className="text-2xl font-bold text-primary-900 dark:text-primary-100">
                  ₦{terms.party2Capital.toLocaleString()}
                </span>
              </div>
              <div className="w-full h-3 bg-primary-200 dark:bg-primary-900 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary-600 dark:bg-primary-500"
                  style={{ width: `${(terms.party2Capital / totalCapital) * 100}%` }}
                />
              </div>
              <p className="text-xs text-primary-700 dark:text-primary-300 mt-1">
                {((terms.party2Capital / totalCapital) * 100).toFixed(1)}% of total capital
              </p>
            </div>

            <div className="bg-white dark:bg-neutral-800 rounded-lg p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-neutral-500 dark:text-neutral-400">Profit Share</span>
                <span className="text-sm font-bold text-success-600 dark:text-success-400">
                  {terms.party2ProfitShare}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-neutral-500 dark:text-neutral-400">Loss Share</span>
                <span className="text-sm font-bold text-danger-600 dark:text-danger-400">
                  {terms.party2LossShare}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-neutral-500 dark:text-neutral-400">ROI</span>
                <span className={`text-sm font-bold ${
                  party2ROI >= 0
                    ? 'text-success-600 dark:text-success-400'
                    : 'text-danger-600 dark:text-danger-400'
                }`}>
                  {party2ROI >= 0 ? '+' : ''}{party2ROI.toFixed(2)}%
                </span>
              </div>
            </div>
          </div>
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
              <p className="text-xs text-neutral-500 dark:text-neutral-400">Partner 1 Share</p>
              <p className="text-2xl font-bold text-success-600 dark:text-success-400">
                ₦{profitDistribution.party1Share.toLocaleString()}
              </p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                {terms.party1ProfitShare}% of profit
              </p>
            </div>
            <div className="bg-white dark:bg-neutral-800 rounded-lg p-4">
              <p className="text-xs text-neutral-500 dark:text-neutral-400">Partner 2 Share</p>
              <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                ₦{profitDistribution.party2Share.toLocaleString()}
              </p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                {terms.party2ProfitShare}% of profit
              </p>
            </div>
          </div>

          <div className="space-y-2">
            {profitDistribution.distribution.map((entry, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                  entry.party === 'party1'
                    ? 'bg-success-600 dark:bg-success-500'
                    : 'bg-primary-600 dark:bg-primary-500'
                }`}>
                  {entry.party === 'party1' ? 'P1' : 'P2'}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-neutral-900 dark:text-white">
                      {entry.party === 'party1' ? terms.party1Name || 'Partner 1' : terms.party2Name || 'Partner 2'}
                    </span>
                    <span className="text-sm font-bold text-neutral-900 dark:text-white">
                      ₦{entry.amount.toLocaleString()} ({entry.percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${
                        entry.party === 'party1'
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

          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <div className="bg-white dark:bg-neutral-800 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-full bg-danger-600 dark:bg-danger-500 flex items-center justify-center text-white text-sm font-bold">
                  P1
                </div>
                <p className="text-sm font-medium text-neutral-900 dark:text-white">
                  {terms.party1Name || 'Partner 1'}
                </p>
              </div>
              <p className="text-2xl font-bold text-danger-600 dark:text-danger-400">
                -₦{lossAllocation.party1Loss.toLocaleString()}
              </p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                {terms.party1LossShare}% of total loss
              </p>
            </div>
            <div className="bg-white dark:bg-neutral-800 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-full bg-danger-600 dark:bg-danger-500 flex items-center justify-center text-white text-sm font-bold">
                  P2
                </div>
                <p className="text-sm font-medium text-neutral-900 dark:text-white">
                  {terms.party2Name || 'Partner 2'}
                </p>
              </div>
              <p className="text-2xl font-bold text-danger-600 dark:text-danger-400">
                -₦{lossAllocation.party2Loss.toLocaleString()}
              </p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                {terms.party2LossShare}% of total loss
              </p>
            </div>
          </div>

          <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">📋</span>
              <span className="font-bold text-neutral-900 dark:text-white">Shariah Compliance Note:</span>
            </div>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              In Musharakah, losses <strong>must</strong> be shared according to capital contribution ratios 
              (Party 1: {((terms.party1Capital / totalCapital) * 100).toFixed(1)}%, 
              Party 2: {((terms.party2Capital / totalCapital) * 100).toFixed(1)}%), 
              while profits can be shared according to any agreed ratio.
            </p>
          </div>
        </div>
      )}

      {/* Business Details */}
      <div className="bg-white dark:bg-neutral-900 rounded-xl p-6 border-2 border-neutral-200 dark:border-neutral-800">
        <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-4">
          💼 Business Details & Management
        </h3>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">Business Purpose</p>
              <p className="text-sm font-medium text-neutral-900 dark:text-white">
                {terms.businessPurpose}
              </p>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-neutral-500 dark:text-neutral-400">Partnership Type</span>
              <span className="text-sm font-medium text-neutral-900 dark:text-white capitalize">
                {terms.partnershipType}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-neutral-500 dark:text-neutral-400">Management Structure</span>
              <span className="text-sm font-medium text-neutral-900 dark:text-white capitalize">
                {terms.managementStructure}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-neutral-500 dark:text-neutral-400">Duration</span>
              <span className="text-sm font-medium text-neutral-900 dark:text-white">
                {terms.duration} months
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-neutral-500 dark:text-neutral-400">Profit Calculation</span>
              <span className="text-sm font-medium text-neutral-900 dark:text-white capitalize">
                {terms.profitCalculationMethod}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-neutral-500 dark:text-neutral-400">Distribution Frequency</span>
              <span className="text-sm font-medium text-neutral-900 dark:text-white capitalize">
                {terms.profitDistributionFrequency}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-neutral-500 dark:text-neutral-400">Capital Withdrawal</span>
              <span className="text-sm font-medium text-neutral-900 dark:text-white">
                {terms.capitalWithdrawalTerms || 'As per agreement'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-neutral-500 dark:text-neutral-400">Exit Strategy</span>
              <span className="text-sm font-medium text-neutral-900 dark:text-white">
                {terms.exitStrategy || 'Mutual agreement'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Financial Summary */}
      <div className="bg-white dark:bg-neutral-900 rounded-xl p-6 border-2 border-neutral-200 dark:border-neutral-800">
        <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-4">
          📈 Financial Summary
        </h3>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="text-center p-4 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">Total Capital</p>
            <p className="text-xl font-bold text-neutral-900 dark:text-white">
              ₦{totalCapital.toLocaleString()}
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
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">Net Result</p>
            <p className={`text-xl font-bold ${
              (actualProfit - actualLoss) >= 0
                ? 'text-success-600 dark:text-success-400'
                : 'text-danger-600 dark:text-danger-400'
            }`}>
              {(actualProfit - actualLoss) >= 0 ? '+' : ''}₦{(actualProfit - actualLoss).toLocaleString()}
            </p>
          </div>
          <div className="text-center p-4 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">Avg ROI</p>
            <p className={`text-xl font-bold ${
              ((party1ROI + party2ROI) / 2) >= 0
                ? 'text-success-600 dark:text-success-400'
                : 'text-danger-600 dark:text-danger-400'
            }`}>
              {((party1ROI + party2ROI) / 2).toFixed(1)}%
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
