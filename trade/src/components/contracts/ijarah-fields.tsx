"use client";

import React from "react";
import { IjarahTerms } from "@/schemas/islamic-contracts.schema";

interface IjarahFieldsProps {
  terms: Partial<IjarahTerms>;
  onChange: (field: keyof IjarahTerms, value: string | number | boolean) => void;
  errors?: Partial<Record<keyof IjarahTerms, string>>;
}

export function IjarahFields({ terms, onChange, errors }: IjarahFieldsProps) {
  const totalRental = terms.monthlyRental && terms.leaseTerm 
    ? terms.monthlyRental * terms.leaseTerm 
    : 0;

  return (
    <div className="space-y-4">
      <div className="bg-lavender-blue-50 dark:bg-lavender-blue-900/10 rounded-lg p-4 border-2 border-lavender-blue-200 dark:border-lavender-blue-800">
        <h3 className="font-display font-bold text-lg text-neutral-900 dark:text-white mb-3">
          Ijarah Specific Details
        </h3>
        <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
          Ijarah is an Islamic lease agreement where the institution owns an asset and leases it to you for an agreed rental payment
        </p>

        <div className="space-y-4">
          {/* Asset Type */}
          <div>
            <label htmlFor="assetType" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Asset Type *
            </label>
            <select
              id="assetType"
              value={terms.assetType || "equipment"}
              onChange={(e) => onChange("assetType", e.target.value)}
              required
              aria-required="true"
              className="w-full px-4 py-2 border-2 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white border-neutral-300 dark:border-neutral-700"
            >
              <option value="equipment">Equipment</option>
              <option value="machinery">Machinery</option>
              <option value="vehicle">Vehicle</option>
              <option value="property">Property/Real Estate</option>
              <option value="technology">Technology/IT</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Asset Description */}
          <div>
            <label htmlFor="assetDescription" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Asset Description *
            </label>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-2">
              💡 Describe the asset you want to lease (vehicle, equipment, property, etc.)
            </p>
            <textarea
              id="assetDescription"
              value={terms.assetDescription || ""}
              onChange={(e) => onChange("assetDescription", e.target.value)}
              rows={3}
              required
              aria-required="true"
              aria-invalid={!!errors?.assetDescription}
              className={`w-full px-4 py-2 border-2 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white ${
                errors?.assetDescription ? 'border-red-500' : 'border-neutral-300 dark:border-neutral-700'
              }`}
              placeholder="Detailed description of the asset to be leased"
            />
            {errors?.assetDescription && (
              <p className="text-sm text-red-600 dark:text-red-400 mt-1" role="alert">
                {errors.assetDescription}
              </p>
            )}
          </div>

          {/* Asset Value */}
          <div>
            <label htmlFor="assetValue" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Asset Value (₦) *
            </label>
            <input
              id="assetValue"
              type="number"
              value={terms.assetValue || ""}
              onChange={(e) => onChange("assetValue", parseFloat(e.target.value))}
              min={0}
              step={0.01}
              required
              aria-required="true"
              aria-invalid={!!errors?.assetValue}
              className={`w-full px-4 py-2 border-2 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white ${
                errors?.assetValue ? 'border-red-500' : 'border-neutral-300 dark:border-neutral-700'
              }`}
              placeholder="Market value of the asset"
            />
            {errors?.assetValue && (
              <p className="text-sm text-red-600 dark:text-red-400 mt-1" role="alert">
                {errors.assetValue}
              </p>
            )}
          </div>

          {/* Monthly Rental */}
          <div>
            <label htmlFor="monthlyRental" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Monthly Rental (₦) *
            </label>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-2">
              💡 Proposed monthly lease payment amount
            </p>
            <input
              id="monthlyRental"
              type="number"
              value={terms.monthlyRental || ""}
              onChange={(e) => onChange("monthlyRental", parseFloat(e.target.value))}
              min={0}
              step={0.01}
              required
              aria-required="true"
              aria-invalid={!!errors?.monthlyRental}
              className={`w-full px-4 py-2 border-2 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white ${
                errors?.monthlyRental ? 'border-red-500' : 'border-neutral-300 dark:border-neutral-700'
              }`}
              placeholder="Monthly lease payment"
            />
            {errors?.monthlyRental && (
              <p className="text-sm text-red-600 dark:text-red-400 mt-1" role="alert">
                {errors.monthlyRental}
              </p>
            )}
          </div>

          {/* Lease Term */}
          <div>
            <label htmlFor="leaseTerm" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Lease Term (Months) *
            </label>
            <input
              id="leaseTerm"
              type="number"
              value={terms.leaseTerm || ""}
              onChange={(e) => onChange("leaseTerm", parseInt(e.target.value))}
              min={1}
              max={600}
              required
              aria-required="true"
              aria-invalid={!!errors?.leaseTerm}
              className={`w-full px-4 py-2 border-2 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white ${
                errors?.leaseTerm ? 'border-red-500' : 'border-neutral-300 dark:border-neutral-700'
              }`}
              placeholder="Duration of lease agreement"
            />
            {errors?.leaseTerm && (
              <p className="text-sm text-red-600 dark:text-red-400 mt-1" role="alert">
                {errors.leaseTerm}
              </p>
            )}
            {totalRental > 0 && (
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                Total Rental: ₦{totalRental.toLocaleString()}
              </p>
            )}
          </div>

          {/* Purchase Option */}
          <div className="p-4 bg-white dark:bg-neutral-800 rounded-lg border-2 border-neutral-200 dark:border-neutral-700">
            <div className="flex items-start space-x-3 mb-3">
              <input
                id="purchaseOption"
                type="checkbox"
                checked={terms.purchaseOption || false}
                onChange={(e) => onChange("purchaseOption", e.target.checked)}
                className="mt-1"
              />
              <div className="flex-1">
                <label htmlFor="purchaseOption" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 cursor-pointer">
                  Purchase Option (Ijarah Muntahia Bittamleek)
                </label>
                <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1">
                  Option to purchase the asset at the end of the lease term
                </p>
              </div>
            </div>

            {terms.purchaseOption && (
              <div>
                <label htmlFor="purchasePrice" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Purchase Price at End of Lease (₦)
                </label>
                <input
                  id="purchasePrice"
                  type="number"
                  value={terms.purchasePrice || ""}
                  onChange={(e) => onChange("purchasePrice", parseFloat(e.target.value) || 0)}
                  min={0}
                  step={0.01}
                  aria-invalid={!!errors?.purchasePrice}
                  className={`w-full px-4 py-2 border-2 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white ${
                    errors?.purchasePrice ? 'border-red-500' : 'border-neutral-300 dark:border-neutral-700'
                  }`}
                  placeholder="Final purchase price (often nominal or market value)"
                />
                {terms.assetValue && terms.purchasePrice && (
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                    {((terms.purchasePrice / terms.assetValue) * 100).toFixed(1)}% of original asset value
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Maintenance Responsibility */}
          <div>
            <label htmlFor="maintenanceResponsibility" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Maintenance Responsibility *
            </label>
            <select
              id="maintenanceResponsibility"
              value={terms.maintenanceResponsibility || "lessee"}
              onChange={(e) => onChange("maintenanceResponsibility", e.target.value)}
              required
              aria-required="true"
              className="w-full px-4 py-2 border-2 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white border-neutral-300 dark:border-neutral-700"
            >
              <option value="lessor">Lessor (Institution) - Major repairs</option>
              <option value="lessee">Lessee (You) - Routine maintenance</option>
              <option value="shared">Shared - As per agreement</option>
            </select>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
              In Shariah-compliant Ijarah, lessor typically handles major repairs
            </p>
          </div>

          {/* Insurance */}
          <div className="p-4 bg-white dark:bg-neutral-800 rounded-lg border-2 border-neutral-200 dark:border-neutral-700">
            <div className="flex items-start space-x-3 mb-3">
              <input
                id="insuranceRequirement"
                type="checkbox"
                checked={terms.insuranceRequirement || false}
                onChange={(e) => onChange("insuranceRequirement", e.target.checked)}
                className="mt-1"
              />
              <div className="flex-1">
                <label htmlFor="insuranceRequirement" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 cursor-pointer">
                  Insurance Required
                </label>
                <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1">
                  Takaful (Islamic insurance) coverage for the asset
                </p>
              </div>
            </div>

            {terms.insuranceRequirement && (
              <div>
                <label htmlFor="insurancePremiumPayer" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Insurance Premium Payer
                </label>
                <select
                  id="insurancePremiumPayer"
                  value={terms.insurancePremiumPayer || "lessee"}
                  onChange={(e) => onChange("insurancePremiumPayer", e.target.value)}
                  className="w-full px-4 py-2 border-2 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white border-neutral-300 dark:border-neutral-700"
                >
                  <option value="lessor">Lessor (Included in rental)</option>
                  <option value="lessee">Lessee (Separate payment)</option>
                </select>
              </div>
            )}
          </div>

          {/* Early Termination */}
          <div className="flex items-start space-x-3">
            <input
              id="earlyTerminationAllowed"
              type="checkbox"
              checked={terms.earlyTerminationAllowed || false}
              onChange={(e) => onChange("earlyTerminationAllowed", e.target.checked)}
              className="mt-1"
            />
            <div className="flex-1">
              <label htmlFor="earlyTerminationAllowed" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 cursor-pointer">
                Early Termination Allowed
              </label>
              <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1">
                Option to terminate lease before end of term (may incur penalties)
              </p>
            </div>
          </div>

          {/* Renewal Option */}
          <div className="flex items-start space-x-3">
            <input
              id="renewalOption"
              type="checkbox"
              checked={terms.renewalOption || false}
              onChange={(e) => onChange("renewalOption", e.target.checked)}
              className="mt-1"
            />
            <div className="flex-1">
              <label htmlFor="renewalOption" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 cursor-pointer">
                Renewal Option
              </label>
              <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1">
                Option to extend the lease at the end of the term
              </p>
            </div>
          </div>

          {/* Summary */}
          {terms.assetValue && terms.monthlyRental && terms.leaseTerm && (
            <div className="p-4 bg-blue-50 dark:bg-blue-900/10 border-2 border-blue-200 dark:border-blue-800 rounded-lg">
              <h4 className="font-semibold text-neutral-900 dark:text-white mb-2">Lease Summary</h4>
              <div className="text-sm space-y-1">
                <p className="text-neutral-700 dark:text-neutral-300">
                  Total Rental Payments: ₦{totalRental.toLocaleString()}
                </p>
                <p className="text-neutral-700 dark:text-neutral-300">
                  Rental Yield: {((totalRental / terms.assetValue) * 100).toFixed(2)}%
                </p>
                {terms.purchaseOption && terms.purchasePrice && (
                  <p className="text-neutral-700 dark:text-neutral-300">
                    Total Cost with Purchase: ₦{(totalRental + terms.purchasePrice).toLocaleString()}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
