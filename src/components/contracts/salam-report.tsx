/**
 * Salam Contract Report Component
 * 
 * Displays forward purchase contract details for Salam agreements.
 * Buyer pays full price upfront for commodity to be delivered in future,
 * enabling farmers/producers to access working capital.
 */

import React from 'react';
import type { SalamTerms } from '@/schemas/islamic-contracts.schema';
import { calculateSalamMetrics } from '@/utils/contract-calculations';

interface SalamReportProps {
  terms: SalamTerms;
  deliveryStatus?: 'pending' | 'partial' | 'completed' | 'delayed';
  deliveredQuantity?: number;
  deliveredDate?: string;
}

export function SalamReport({
  terms,
  deliveryStatus = 'pending',
  deliveredQuantity = 0,
  deliveredDate
}: SalamReportProps) {
  const metrics = calculateSalamMetrics(terms);
  
  const deliveryProgress = terms.quantity ? (deliveredQuantity / terms.quantity) * 100 : 0;
  const remainingQuantity = terms.quantity - deliveredQuantity;
  const remainingValue = (remainingQuantity / terms.quantity) * terms.deliveryValue;

  // Calculate days until/since delivery
  const deliveryDate = new Date(terms.deliveryDate);
  const today = new Date();
  const daysUntilDelivery = Math.ceil((deliveryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  return (
    <div className="space-y-6">
      {/* Contract Overview */}
      <div className="bg-primary-50 dark:bg-primary-900/20 rounded-xl p-6 border-2 border-primary-200 dark:border-primary-800">
        <h3 className="text-xl font-bold text-primary-900 dark:text-primary-100 mb-4">
          📦 Salam Forward Purchase Contract
        </h3>
        <p className="text-sm text-primary-700 dark:text-primary-300 mb-4">
          Full advance payment for future commodity delivery
        </p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-neutral-800 rounded-lg p-4">
            <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase">Advance Payment</p>
            <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">
              ₦{terms.advancePayment.toLocaleString()}
            </p>
          </div>
          <div className="bg-white dark:bg-neutral-800 rounded-lg p-4">
            <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase">Delivery Value</p>
            <p className="text-2xl font-bold text-success-600 dark:text-success-400">
              ₦{terms.deliveryValue.toLocaleString()}
            </p>
          </div>
          <div className="bg-white dark:bg-neutral-800 rounded-lg p-4">
            <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase">Discount Rate</p>
            <p className="text-2xl font-bold text-neutral-900 dark:text-white">
              {metrics.discountRate.toFixed(2)}%
            </p>
          </div>
          <div className="bg-white dark:bg-neutral-800 rounded-lg p-4">
            <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase">Days to Delivery</p>
            <p className={`text-2xl font-bold ${
              daysUntilDelivery > 0 
                ? 'text-primary-600 dark:text-primary-400'
                : 'text-danger-600 dark:text-danger-400'
            }`}>
              {daysUntilDelivery > 0 ? daysUntilDelivery : Math.abs(daysUntilDelivery) + ' overdue'}
            </p>
          </div>
        </div>
      </div>

      {/* Delivery Status */}
      <div className={`rounded-xl p-6 border-2 ${
        deliveryStatus === 'completed' 
          ? 'bg-success-50 dark:bg-success-900/20 border-success-200 dark:border-success-800'
          : deliveryStatus === 'delayed'
          ? 'bg-danger-50 dark:bg-danger-900/20 border-danger-200 dark:border-danger-800'
          : deliveryStatus === 'partial'
          ? 'bg-warning-50 dark:bg-warning-900/20 border-warning-200 dark:border-warning-800'
          : 'bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800'
      }`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-neutral-900 dark:text-white">
            🚚 Delivery Status
          </h3>
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold ${
            deliveryStatus === 'completed'
              ? 'bg-success-100 dark:bg-success-900/30 text-success-800 dark:text-success-300'
              : deliveryStatus === 'delayed'
              ? 'bg-danger-100 dark:bg-danger-900/30 text-danger-800 dark:text-danger-300'
              : deliveryStatus === 'partial'
              ? 'bg-warning-100 dark:bg-warning-900/30 text-warning-800 dark:text-warning-300'
              : 'bg-primary-100 dark:bg-primary-900/30 text-primary-800 dark:text-primary-300'
          }`}>
            {deliveryStatus === 'completed' && '✓ Completed'}
            {deliveryStatus === 'delayed' && '⚠️ Delayed'}
            {deliveryStatus === 'partial' && '⏳ Partial'}
            {deliveryStatus === 'pending' && '⏱️ Pending'}
          </span>
        </div>

        {deliveryStatus !== 'pending' && deliveryStatus !== 'completed' && (
          <div className="mb-6">
            <div className="flex justify-between text-sm mb-2">
              <span className="font-medium text-neutral-700 dark:text-neutral-300">
                {deliveredQuantity.toLocaleString()} {terms.unit} of {terms.quantity.toLocaleString()} {terms.unit} delivered
              </span>
              <span className="font-bold text-primary-600 dark:text-primary-400">
                {deliveryProgress.toFixed(1)}%
              </span>
            </div>
            <div className="w-full h-4 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-500 ${
                  deliveryStatus === 'delayed'
                    ? 'bg-danger-600 dark:bg-danger-500'
                    : 'bg-primary-600 dark:bg-primary-500'
                }`}
                style={{ width: `${deliveryProgress}%` }}
              />
            </div>
          </div>
        )}

        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white dark:bg-neutral-800 rounded-lg p-4">
            <p className="text-xs text-neutral-500 dark:text-neutral-400">Delivered</p>
            <p className="text-lg font-bold text-success-600 dark:text-success-400">
              {deliveredQuantity.toLocaleString()} {terms.unit}
            </p>
          </div>
          <div className="bg-white dark:bg-neutral-800 rounded-lg p-4">
            <p className="text-xs text-neutral-500 dark:text-neutral-400">Remaining</p>
            <p className="text-lg font-bold text-neutral-900 dark:text-white">
              {remainingQuantity.toLocaleString()} {terms.unit}
            </p>
          </div>
          <div className="bg-white dark:bg-neutral-800 rounded-lg p-4">
            <p className="text-xs text-neutral-500 dark:text-neutral-400">Remaining Value</p>
            <p className="text-lg font-bold text-primary-600 dark:text-primary-400">
              ₦{remainingValue.toLocaleString()}
            </p>
          </div>
        </div>

        {deliveredDate && (
          <div className="mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-700">
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              <strong>Latest Delivery:</strong> {deliveredDate}
            </p>
          </div>
        )}
      </div>

      {/* Commodity Specifications */}
      <div className="bg-white dark:bg-neutral-900 rounded-xl p-6 border-2 border-neutral-200 dark:border-neutral-800">
        <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-4">
          📋 Commodity Specifications
        </h3>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="bg-primary-50 dark:bg-primary-900/20 rounded-lg p-4">
              <p className="text-xs text-primary-600 dark:text-primary-400 font-semibold mb-1">Commodity Type</p>
              <p className="text-lg font-bold text-primary-900 dark:text-primary-100 capitalize">
                {terms.commodityType}
              </p>
            </div>

            <div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-2">Description</p>
              <p className="text-sm text-neutral-900 dark:text-white">
                {terms.commodityDescription}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">Quantity</p>
                <p className="text-xl font-bold text-neutral-900 dark:text-white">
                  {terms.quantity.toLocaleString()}
                </p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  {terms.unit}
                </p>
              </div>
              <div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">Unit Price</p>
                <p className="text-xl font-bold text-neutral-900 dark:text-white">
                  ₦{(terms.deliveryValue / terms.quantity).toLocaleString()}
                </p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  per {terms.unit}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-2">Quality Grade</p>
              <p className="text-sm font-medium text-neutral-900 dark:text-white capitalize">
                {terms.qualityGrade}
              </p>
            </div>

            <div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-2">Quality Specifications</p>
              <ul className="text-sm text-neutral-900 dark:text-white space-y-1">
                {terms.qualitySpecifications.map((spec, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-success-600 dark:text-success-400">✓</span>
                    <span>{spec}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">Packaging</p>
              <p className="text-sm font-medium text-neutral-900 dark:text-white">
                {terms.packagingRequirements}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Delivery Terms */}
      <div className="bg-white dark:bg-neutral-900 rounded-xl p-6 border-2 border-neutral-200 dark:border-neutral-800">
        <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-4">
          🚚 Delivery Terms & Location
        </h3>

        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-neutral-500 dark:text-neutral-400">Delivery Date</span>
              <span className="text-sm font-bold text-neutral-900 dark:text-white">
                {new Date(terms.deliveryDate).toLocaleDateString('en-NG', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-neutral-500 dark:text-neutral-400">Delivery Period</span>
              <span className="text-sm font-medium text-neutral-900 dark:text-white">
                {terms.deliveryPeriod} days
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-neutral-500 dark:text-neutral-400">Payment Date</span>
              <span className="text-sm font-medium text-neutral-900 dark:text-white">
                {new Date(terms.paymentDate).toLocaleDateString('en-NG', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                })}
              </span>
            </div>
          </div>

          <div className="bg-neutral-50 dark:bg-neutral-800 rounded-lg p-4">
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-2">Delivery Location</p>
            <p className="text-sm font-medium text-neutral-900 dark:text-white">
              {terms.deliveryLocation}
            </p>
            {terms.deliveryMethod && (
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-3">
                <strong>Method:</strong> {terms.deliveryMethod}
              </p>
            )}
          </div>
        </div>

        <div className="bg-warning-50 dark:bg-warning-900/20 rounded-lg p-4 border-2 border-warning-200 dark:border-warning-800">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl">⚠️</span>
            <span className="font-bold text-warning-900 dark:text-warning-100">Delay Penalties</span>
          </div>
          <p className="text-sm text-warning-700 dark:text-warning-300">
            Late delivery penalty: <strong>{terms.lateDeliveryPenalty}%</strong> of contract value per day 
            (charged to charity as per Islamic principles). Non-delivery allows buyer to claim actual damages.
          </p>
        </div>
      </div>

      {/* Financial Summary */}
      <div className="bg-white dark:bg-neutral-900 rounded-xl p-6 border-2 border-neutral-200 dark:border-neutral-800">
        <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-4">
          💰 Financial Summary
        </h3>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center p-4 bg-primary-50 dark:bg-primary-900/30 rounded-lg">
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">Advance Payment</p>
            <p className="text-xl font-bold text-primary-600 dark:text-primary-400">
              ₦{terms.advancePayment.toLocaleString()}
            </p>
          </div>
          <div className="text-center p-4 bg-success-50 dark:bg-success-900/30 rounded-lg">
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">Delivery Value</p>
            <p className="text-xl font-bold text-success-600 dark:text-success-400">
              ₦{terms.deliveryValue.toLocaleString()}
            </p>
          </div>
          <div className="text-center p-4 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">Discount</p>
            <p className="text-xl font-bold text-neutral-900 dark:text-white">
              {metrics.discountRate.toFixed(2)}%
            </p>
          </div>
          <div className="text-center p-4 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">Buyer Benefit</p>
            <p className="text-xl font-bold text-success-600 dark:text-success-400">
              ₦{metrics.buyerBenefit.toLocaleString()}
            </p>
          </div>
        </div>

        <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-lg p-4">
          <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-2">
            <strong>Shariah Principle:</strong> Salam provides producers (farmers, manufacturers) with 
            working capital by receiving full payment upfront, while buyers benefit from a discount on 
            future market price.
          </p>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            <strong>Risk Allocation:</strong> Buyer bears delivery risk. If commodity isn't delivered, 
            seller must refund payment plus compensation for actual losses (not penalty interest).
          </p>
        </div>
      </div>

      {/* Risk Management */}
      <div className="bg-white dark:bg-neutral-900 rounded-xl p-6 border-2 border-neutral-200 dark:border-neutral-800">
        <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-4">
          🛡️ Risk Management & Collateral
        </h3>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-primary-50 dark:bg-primary-900/20 rounded-lg p-4 border border-primary-200 dark:border-primary-800">
            <h4 className="font-bold text-primary-900 dark:text-primary-100 mb-3 flex items-center gap-2">
              <span>📌</span> Collateral
            </h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-primary-700 dark:text-primary-300">Type</span>
                <span className="text-sm font-medium text-primary-900 dark:text-primary-100 capitalize">
                  {terms.collateralType || 'None'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-primary-700 dark:text-primary-300">Value</span>
                <span className="text-sm font-medium text-primary-900 dark:text-primary-100">
                  ₦{terms.collateralValue?.toLocaleString() || '0'}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-neutral-50 dark:bg-neutral-800 rounded-lg p-4 border border-neutral-200 dark:border-neutral-700">
            <h4 className="font-bold text-neutral-900 dark:text-white mb-3 flex items-center gap-2">
              <span>🔒</span> Guarantees
            </h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-neutral-500 dark:text-neutral-400">Third Party Guarantee</span>
                <span className="text-sm font-medium text-neutral-900 dark:text-white">
                  {terms.thirdPartyGuarantee ? 'Yes' : 'No'}
                </span>
              </div>
              {terms.thirdPartyGuarantee && (
                <div>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">Guarantor</p>
                  <p className="text-sm font-medium text-neutral-900 dark:text-white">
                    {terms.guarantorDetails || 'Details on file'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
