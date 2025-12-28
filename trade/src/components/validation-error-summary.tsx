"use client";

interface ValidationErrorSummaryProps {
  errors: Record<string, string>;
  onErrorClick?: (fieldName: string) => void;
}

export function ValidationErrorSummary({ errors, onErrorClick }: ValidationErrorSummaryProps) {
  const errorEntries = Object.entries(errors);

  if (errorEntries.length === 0) return null;

  const scrollToField = (fieldName: string) => {
    // Try multiple strategies to find the field
    const strategies = [
      () => document.querySelector(`[name="${fieldName}"]`),
      () => document.getElementById(fieldName),
      () => document.querySelector(`[data-field="${fieldName}"]`),
      () => {
        // Handle nested fields like "address.street"
        const parts = fieldName.split(".");
        if (parts.length > 1) {
          return document.querySelector(`[name="${parts[parts.length - 1]}"]`);
        }
        return null;
      },
    ];

    let element: Element | null = null;
    for (const strategy of strategies) {
      element = strategy();
      if (element) break;
    }

    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
      // Focus the element if it's an input
      if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement || element instanceof HTMLSelectElement) {
        setTimeout(() => element?.focus(), 300);
      }
    }

    onErrorClick?.(fieldName);
  };

  const formatFieldName = (fieldName: string): string => {
    // Convert camelCase and nested fields to readable format
    return fieldName
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, (str) => str.toUpperCase())
      .replace(/\./g, " - ")
      .trim();
  };

  return (
    <div className="mb-6 bg-danger-50 dark:bg-danger-900/20 border-2 border-danger-500 dark:border-danger-600 rounded-xl p-5">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <svg
            className="w-6 h-6 text-danger-600 dark:text-danger-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-bold text-danger-900 dark:text-danger-100 mb-2">
            Please fix {errorEntries.length} error{errorEntries.length !== 1 ? "s" : ""} before continuing
          </h3>
          <ul className="space-y-2">
            {errorEntries.map(([field, message]) => (
              <li key={field}>
                <button
                  type="button"
                  onClick={() => scrollToField(field)}
                  className="text-left w-full group hover:bg-danger-100 dark:hover:bg-danger-900/40 rounded px-2 py-1 transition-colors"
                >
                  <span className="text-sm font-medium text-danger-800 dark:text-danger-200 group-hover:underline">
                    {formatFieldName(field)}:
                  </span>{" "}
                  <span className="text-sm text-danger-700 dark:text-danger-300">{message}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

interface InlineErrorMessageProps {
  message?: string;
  className?: string;
}

export function InlineErrorMessage({ message, className = "" }: InlineErrorMessageProps) {
  if (!message) return null;

  return (
    <div className={`flex items-start gap-2 mt-2 ${className}`}>
      <svg
        className="w-4 h-4 text-danger-600 dark:text-danger-400 flex-shrink-0 mt-0.5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      <p className="text-sm text-danger-600 dark:text-danger-400 flex-1">{message}</p>
    </div>
  );
}
