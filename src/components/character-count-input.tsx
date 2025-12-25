"use client";

import { useState } from "react";

interface CharacterCountInputProps {
  value: string;
  onChange: (value: string) => void;
  maxLength: number;
  label: string;
  placeholder?: string;
  required?: boolean;
  error?: string;
  rows?: number;
  helpText?: string;
}

export function CharacterCountInput({
  value,
  onChange,
  maxLength,
  label,
  placeholder,
  required = false,
  error,
  rows = 4,
  helpText,
}: CharacterCountInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const characterCount = value?.length || 0;
  const remaining = maxLength - characterCount;
  const percentage = (characterCount / maxLength) * 100;

  const getCountColor = () => {
    if (percentage >= 100) return "text-danger-600 dark:text-danger-400";
    if (percentage >= 90) return "text-warning-600 dark:text-warning-400";
    if (percentage >= 75) return "text-primary-600 dark:text-primary-400";
    return "text-neutral-500 dark:text-neutral-400";
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300">
          {label} {required && <span className="text-danger-500">*</span>}
        </label>
        <div className="flex items-center gap-2">
          {isFocused && (
            <div className="flex items-center gap-1">
              <div className="w-20 h-1.5 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    percentage >= 100
                      ? "bg-danger-500"
                      : percentage >= 90
                      ? "bg-warning-500"
                      : percentage >= 75
                      ? "bg-primary-500"
                      : "bg-success-500"
                  }`}
                  style={{ width: `${Math.min(percentage, 100)}%` }}
                />
              </div>
            </div>
          )}
          <span className={`text-xs font-medium ${getCountColor()}`}>
            {remaining >= 0 ? `${remaining} left` : `${Math.abs(remaining)} over`}
          </span>
        </div>
      </div>

      {helpText && <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-2">{helpText}</p>}

      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        maxLength={maxLength}
        rows={rows}
        placeholder={placeholder}
        className={`w-full px-4 py-3 rounded-lg border-2 transition-colors resize-none ${
          error
            ? "border-danger-500 dark:border-danger-600 focus:border-danger-600 dark:focus:border-danger-500"
            : "border-neutral-300 dark:border-neutral-700 focus:border-primary-500 dark:focus:border-primary-400"
        } bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:ring-2 ${
          error
            ? "focus:ring-danger-500/20"
            : "focus:ring-primary-500/20"
        } outline-none`}
      />

      {error && <p className="mt-2 text-sm text-danger-600 dark:text-danger-400">{error}</p>}

      {characterCount >= maxLength * 0.9 && !error && (
        <p className="mt-1 text-xs text-warning-600 dark:text-warning-400">
          {characterCount >= maxLength ? "Maximum length reached" : "Approaching maximum length"}
        </p>
      )}
    </div>
  );
}
