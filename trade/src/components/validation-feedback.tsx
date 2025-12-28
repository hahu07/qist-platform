/**
 * Validation Feedback Components
 * Visual components for displaying validation errors and warnings
 */

import React from "react";

interface ValidationMessageProps {
  type: "error" | "warning" | "success";
  message: string;
}

export function ValidationMessage({ type, message }: ValidationMessageProps) {
  const styles = {
    error: {
      container: "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800",
      icon: "text-red-600 dark:text-red-400",
      text: "text-red-700 dark:text-red-300",
    },
    warning: {
      container: "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800",
      icon: "text-yellow-600 dark:text-yellow-400",
      text: "text-yellow-700 dark:text-yellow-300",
    },
    success: {
      container: "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800",
      icon: "text-green-600 dark:text-green-400",
      text: "text-green-700 dark:text-green-300",
    },
  };

  const style = styles[type];

  return (
    <div className={`flex items-start gap-2 p-3 border rounded-lg ${style.container}`}>
      {type === "error" && (
        <svg className={`w-5 h-5 flex-shrink-0 mt-0.5 ${style.icon}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )}
      {type === "warning" && (
        <svg className={`w-5 h-5 flex-shrink-0 mt-0.5 ${style.icon}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      )}
      {type === "success" && (
        <svg className={`w-5 h-5 flex-shrink-0 mt-0.5 ${style.icon}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )}
      <p className={`text-sm ${style.text}`}>{message}</p>
    </div>
  );
}

interface FieldErrorProps {
  error?: string;
  warning?: string;
}

export function FieldError({ error, warning }: FieldErrorProps) {
  if (!error && !warning) return null;

  if (error) {
    return (
      <p className="text-xs text-red-600 dark:text-red-400 mt-1 flex items-center gap-1">
        <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        {error}
      </p>
    );
  }

  if (warning) {
    return (
      <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1 flex items-center gap-1">
        <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        {warning}
      </p>
    );
  }

  return null;
}

interface ProfileCompletenessProps {
  percentage: number;
  missingFields: string[];
}

export function ProfileCompleteness({ percentage, missingFields }: ProfileCompletenessProps) {
  const getStatusColor = () => {
    if (percentage >= 90) return "bg-green-600";
    if (percentage >= 70) return "bg-yellow-600";
    if (percentage >= 50) return "bg-orange-600";
    return "bg-red-600";
  };

  const getStatusText = () => {
    if (percentage === 100) return "Complete";
    if (percentage >= 90) return "Almost complete";
    if (percentage >= 70) return "Good progress";
    if (percentage >= 50) return "Halfway there";
    return "Getting started";
  };

  return (
    <div className="p-4 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-semibold text-neutral-900 dark:text-white">
          Profile Completeness
        </h4>
        <span className="text-sm font-bold text-neutral-900 dark:text-white">
          {percentage}%
        </span>
      </div>
      
      <div className="w-full bg-neutral-200 dark:bg-neutral-700 rounded-full h-2 mb-2">
        <div
          className={`h-2 rounded-full transition-all duration-500 ${getStatusColor()}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      
      <p className="text-xs text-neutral-600 dark:text-neutral-400 mb-2">
        {getStatusText()}
      </p>
      
      {missingFields.length > 0 && percentage < 100 && (
        <details className="mt-3">
          <summary className="text-xs font-medium text-neutral-700 dark:text-neutral-300 cursor-pointer hover:text-primary-600 dark:hover:text-primary-400">
            Missing fields ({missingFields.length})
          </summary>
          <ul className="mt-2 space-y-1">
            {missingFields.slice(0, 5).map((field, idx) => (
              <li key={idx} className="text-xs text-neutral-600 dark:text-neutral-400 flex items-center gap-1">
                <svg className="w-3 h-3 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                {field}
              </li>
            ))}
            {missingFields.length > 5 && (
              <li className="text-xs text-neutral-500 dark:text-neutral-500 italic">
                + {missingFields.length - 5} more...
              </li>
            )}
          </ul>
        </details>
      )}
    </div>
  );
}

interface RiskProfileBadgeProps {
  riskProfile: "conservative" | "moderate" | "aggressive";
  isMatching: boolean;
}

export function RiskProfileBadge({ riskProfile, isMatching }: RiskProfileBadgeProps) {
  const styles = {
    conservative: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800",
    moderate: "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800",
    aggressive: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800",
  };

  return (
    <div className="flex items-center gap-2">
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 border rounded-full text-xs font-semibold capitalize ${styles[riskProfile]}`}>
        {riskProfile}
      </span>
      {!isMatching && (
        <span className="text-xs text-yellow-600 dark:text-yellow-400 flex items-center gap-1">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          Allocation may not match risk profile
        </span>
      )}
    </div>
  );
}

interface AllocationSliderProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  color?: "business" | "crypto";
}

export function AllocationSlider({ label, value, onChange, color = "business" }: AllocationSliderProps) {
  const colorStyles = {
    business: "bg-business-600",
    crypto: "bg-primary-600",
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
          {label}
        </label>
        <span className="text-sm font-bold text-neutral-900 dark:text-white">
          {value}%
        </span>
      </div>
      <input
        type="range"
        min="0"
        max="100"
        step="5"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 bg-neutral-200 dark:bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-primary-600"
      />
      <div className="w-full bg-neutral-200 dark:bg-neutral-700 rounded-full h-1">
        <div
          className={`h-1 rounded-full transition-all duration-300 ${colorStyles[color]}`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}
