"use client";

import React from "react";
import { SalamTerms } from "@/schemas/islamic-contracts.schema";

interface SalamFieldsProps {
  terms: Partial<SalamTerms>;
  onChange: (field: keyof SalamTerms, value: string | number | boolean | Date | string[]) => void;
  errors?: Partial<Record<keyof SalamTerms, string>>;
}

export function SalamFields({ terms, onChange, errors }: SalamFieldsProps) {
  const advancePaymentPercentage = terms.agreedPrice && terms.advancePayment
    ? (terms.advancePayment / terms.agreedPrice) * 100
    : 0;

  return (
    <div className="space-y-4">
      <div className="bg-lavender-blue-50 dark:bg-lavender-blue-900/10 rounded-lg p-4 border-2 border-lavender-blue-200 dark:border-lavender-blue-800">
        <h3 className="font-display font-bold text-lg text-neutral-900 dark:text-white mb-3">
          Salam Specific Details
        </h3>
        <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
          Salam is a forward purchase contract where full payment is made upfront for goods to be delivered in the future
        </p>

        <div className="space-y-4">
          {/* Commodity Type */}
          <div>
            <label htmlFor="commodityType" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Commodity Type *
            </label>
            <select
              id="commodityType"
              value={terms.commodityType || "agricultural"}
              onChange={(e) => onChange("commodityType", e.target.value)}
              required
              aria-required="true"
              className="w-full px-4 py-2 border-2 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white border-neutral-300 dark:border-neutral-700"
            >
              <option value="agricultural">Agricultural Products</option>
              <option value="manufactured">Manufactured Goods</option>
              <option value="raw-materials">Raw Materials</option>
              <option value="commodities">Commodities (metals, oil, etc.)</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Commodity Description */}
          <div>
            <label htmlFor="commodityDescription" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Commodity Description *
            </label>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-2">
              💡 Detailed description of the goods/commodity to be delivered in the future
            </p>
            <textarea
              id="commodityDescription"
              value={terms.commodityDescription || ""}
              onChange={(e) => onChange("commodityDescription", e.target.value)}
              rows={3}
              required
              aria-required="true"
              aria-invalid={!!errors?.commodityDescription}
              className={`w-full px-4 py-2 border-2 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white ${
                errors?.commodityDescription ? 'border-red-500' : 'border-neutral-300 dark:border-neutral-700'
              }`}
              placeholder="Detailed description of the goods to be purchased"
            />
            {errors?.commodityDescription && (
              <p className="text-sm text-red-600 dark:text-red-400 mt-1" role="alert">
                {errors.commodityDescription}
              </p>
            )}
          </div>

          {/* Quantity and Unit */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="quantity" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                Quantity *
              </label>
              <input
                id="quantity"
                type="number"
                value={terms.quantity || ""}
                onChange={(e) => onChange("quantity", parseFloat(e.target.value))}
                min={0}
                step={0.01}
                required
                aria-required="true"
                aria-invalid={!!errors?.quantity}
                className={`w-full px-4 py-2 border-2 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white ${
                  errors?.quantity ? 'border-red-500' : 'border-neutral-300 dark:border-neutral-700'
                }`}
                placeholder="Amount"
              />
            </div>

            <div>
              <label htmlFor="unit" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                Unit *
              </label>
              <input
                id="unit"
                type="text"
                value={terms.unit || ""}
                onChange={(e) => onChange("unit", e.target.value)}
                required
                aria-required="true"
                aria-invalid={!!errors?.unit}
                className={`w-full px-4 py-2 border-2 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white ${
                  errors?.unit ? 'border-red-500' : 'border-neutral-300 dark:border-neutral-700'
                }`}
                placeholder="kg, tons, liters, pieces, etc."
              />
            </div>
          </div>

          {/* Quality Specifications */}
          <div>
            <label htmlFor="qualitySpecifications" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Quality Specifications *
            </label>
            <textarea
              id="qualitySpecifications"
              value={Array.isArray(terms.qualitySpecifications) ? terms.qualitySpecifications.join("\n") : ""}
              onChange={(e) => onChange("qualitySpecifications", e.target.value.split("\n").filter(s => s.trim()))}
              rows={3}
              required
              aria-required="true"
              aria-invalid={!!errors?.qualitySpecifications}
              className={`w-full px-4 py-2 border-2 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white ${
                errors?.qualitySpecifications ? 'border-red-500' : 'border-neutral-300 dark:border-neutral-700'
              }`}
              placeholder="Grade, size, color, purity, and other quality standards (one per line)"
            />
            {errors?.qualitySpecifications && (
              <p className="text-sm text-red-600 dark:text-red-400 mt-1" role="alert">
                {errors.qualitySpecifications}
              </p>
            )}
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
              ⚠️ Quality must be precisely specified in Salam contracts (enter each specification on a new line)
            </p>
          </div>

          {/* Quality Grade */}
          <div>
            <label htmlFor="qualityGrade" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Quality Grade
            </label>
            <input
              id="qualityGrade"
              type="text"
              value={terms.qualityGrade || ""}
              onChange={(e) => onChange("qualityGrade", e.target.value)}
              aria-invalid={!!errors?.qualityGrade}
              className={`w-full px-4 py-2 border-2 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white ${
                errors?.qualityGrade ? 'border-red-500' : 'border-neutral-300 dark:border-neutral-700'
              }`}
              placeholder="e.g., Grade A, Premium, Standard"
            />
          </div>

          {/* Packaging Requirements */}
          <div>
            <label htmlFor="packagingRequirements" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Packaging Requirements
            </label>
            <input
              id="packagingRequirements"
              type="text"
              value={terms.packagingRequirements || ""}
              onChange={(e) => onChange("packagingRequirements", e.target.value)}
              aria-invalid={!!errors?.packagingRequirements}
              className={`w-full px-4 py-2 border-2 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white ${
                errors?.packagingRequirements ? 'border-red-500' : 'border-neutral-300 dark:border-neutral-700'
              }`}
              placeholder="Packaging specifications (bags, containers, pallets, etc.)"
            />
          </div>

          {/* Agreed Price */}
          <div>
            <label htmlFor="agreedPrice" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Agreed Price (₦) *
            </label>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-2">
              💡 Total price to be paid upfront for future delivery (usually below spot price)
            </p>
            <input
              id="agreedPrice"
              type="number"
              value={terms.agreedPrice || ""}
              onChange={(e) => onChange("agreedPrice", parseFloat(e.target.value))}
              min={0}
              step={0.01}
              required
              aria-required="true"
              aria-invalid={!!errors?.agreedPrice}
              className={`w-full px-4 py-2 border-2 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white ${
                errors?.agreedPrice ? 'border-red-500' : 'border-neutral-300 dark:border-neutral-700'
              }`}
              placeholder="Agreed purchase price"
            />
            {errors?.agreedPrice && (
              <p className="text-sm text-red-600 dark:text-red-400 mt-1" role="alert">
                {errors.agreedPrice}
              </p>
            )}
            {terms.quantity && terms.agreedPrice && (
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                Price per {terms.unit || "unit"}: ₦
                {(terms.agreedPrice / terms.quantity).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })}
              </p>
            )}
          </div>

          {/* Advance Payment */}
          <div>
            <label htmlFor="advancePayment" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Advance Payment (₦) *
            </label>
            <input
              id="advancePayment"
              type="number"
              value={terms.advancePayment || ""}
              onChange={(e) => onChange("advancePayment", parseFloat(e.target.value))}
              min={0}
              step={0.01}
              required
              aria-required="true"
              aria-invalid={!!errors?.advancePayment}
              className={`w-full px-4 py-2 border-2 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white ${
                errors?.advancePayment ? 'border-red-500' : 'border-neutral-300 dark:border-neutral-700'
              }`}
              placeholder="Full payment made upfront"
            />
            {errors?.advancePayment && (
              <p className="text-sm text-red-600 dark:text-red-400 mt-1" role="alert">
                {errors.advancePayment}
              </p>
            )}
            {advancePaymentPercentage > 0 && (
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                {advancePaymentPercentage.toFixed(1)}% of total price
                {advancePaymentPercentage < 100 && (
                  <span className="text-amber-600 dark:text-amber-400 ml-2">
                    ⚠️ Salam typically requires 100% upfront payment
                  </span>
                )}
              </p>
            )}
          </div>

          {/* Delivery Date */}
          <div>
            <label htmlFor="deliveryDate" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Delivery Date *
            </label>
            <input
              id="deliveryDate"
              type="date"
              value={terms.deliveryDate ? new Date(terms.deliveryDate).toISOString().split("T")[0] : ""}
              onChange={(e) => onChange("deliveryDate", new Date(e.target.value))}
              required
              aria-required="true"
              aria-invalid={!!errors?.deliveryDate}
              className={`w-full px-4 py-2 border-2 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white ${
                errors?.deliveryDate ? 'border-red-500' : 'border-neutral-300 dark:border-neutral-700'
              }`}
            />
            {errors?.deliveryDate && (
              <p className="text-sm text-red-600 dark:text-red-400 mt-1" role="alert">
                {errors.deliveryDate}
              </p>
            )}
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
              Must be a specific future date (cannot be immediate)
            </p>
          </div>

          {/* Delivery Period */}
          <div>
            <label htmlFor="deliveryPeriod" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Delivery Period (Days)
            </label>
            <input
              id="deliveryPeriod"
              type="number"
              value={terms.deliveryPeriod || ""}
              onChange={(e) => onChange("deliveryPeriod", parseInt(e.target.value) || 0)}
              min={0}
              aria-invalid={!!errors?.deliveryPeriod}
              className={`w-full px-4 py-2 border-2 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white ${
                errors?.deliveryPeriod ? 'border-red-500' : 'border-neutral-300 dark:border-neutral-700'
              }`}
              placeholder="Time window for delivery (e.g., 30 days)"
            />
          </div>

          {/* Delivery Location */}
          <div>
            <label htmlFor="deliveryLocation" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Delivery Location *
            </label>
            <input
              id="deliveryLocation"
              type="text"
              value={terms.deliveryLocation || ""}
              onChange={(e) => onChange("deliveryLocation", e.target.value)}
              required
              aria-required="true"
              aria-invalid={!!errors?.deliveryLocation}
              className={`w-full px-4 py-2 border-2 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white ${
                errors?.deliveryLocation ? 'border-red-500' : 'border-neutral-300 dark:border-neutral-700'
              }`}
              placeholder="Specific delivery address or location"
            />
            {errors?.deliveryLocation && (
              <p className="text-sm text-red-600 dark:text-red-400 mt-1" role="alert">
                {errors.deliveryLocation}
              </p>
            )}
          </div>

          {/* Collateral */}
          <div className="p-4 bg-white dark:bg-neutral-800 rounded-lg border-2 border-neutral-200 dark:border-neutral-700">
            <h4 className="font-semibold text-neutral-900 dark:text-white mb-3">Collateral (Optional)</h4>
            
            <div className="space-y-3">
              <div>
                <label htmlFor="collateralType" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Collateral Type
                </label>
                <select
                  id="collateralType"
                  value={terms.collateralType || "none"}
                  onChange={(e) => onChange("collateralType", e.target.value)}
                  className="w-full px-4 py-2 border-2 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white border-neutral-300 dark:border-neutral-700"
                >
                  <option value="none">None</option>
                  <option value="property">Property</option>
                  <option value="assets">Business Assets</option>
                  <option value="guarantor">Personal Guarantor</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {terms.collateralType && terms.collateralType !== "none" && (
                <div>
                  <label htmlFor="guarantorDetails" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    Collateral/Guarantor Details
                  </label>
                  <textarea
                    id="guarantorDetails"
                    value={terms.guarantorDetails || ""}
                    onChange={(e) => onChange("guarantorDetails", e.target.value)}
                    rows={2}
                    className="w-full px-4 py-2 border-2 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white border-neutral-300 dark:border-neutral-700"
                    placeholder="Description of collateral or guarantor information"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Summary */}
          {terms.quantity && terms.agreedPrice && terms.deliveryDate && (
            <div className="p-4 bg-blue-50 dark:bg-blue-900/10 border-2 border-blue-200 dark:border-blue-800 rounded-lg">
              <h4 className="font-semibold text-neutral-900 dark:text-white mb-2">Salam Contract Summary</h4>
              <div className="text-sm space-y-1">
                <p className="text-neutral-700 dark:text-neutral-300">
                  Total Order: {terms.quantity} {terms.unit} @ ₦{terms.agreedPrice.toLocaleString()}
                </p>
                <p className="text-neutral-700 dark:text-neutral-300">
                  Delivery: {new Date(terms.deliveryDate).toLocaleDateString()}
                </p>
                {terms.advancePayment && (
                  <p className="text-neutral-700 dark:text-neutral-300">
                    Advance Payment: ₦{terms.advancePayment.toLocaleString()} ({advancePaymentPercentage.toFixed(1)}%)
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
