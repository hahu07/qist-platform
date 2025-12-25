import { useCallback } from "react";
import {
  sanitizePlainText,
  sanitizeEmail,
  sanitizePhone,
  sanitizeUrl,
  sanitizeNumber,
  sanitizeAlphanumeric,
  sanitizeTextarea,
  sanitizeFilename,
} from "@/utils/sanitization";

/**
 * Hook for sanitized input handling
 * Provides sanitization functions for form inputs
 */
export function useSanitizedInput() {
  const handleTextInput = useCallback((
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    setter: (value: string) => void,
    type: "plain" | "email" | "phone" | "url" | "alphanumeric" | "textarea" | "filename" = "plain"
  ) => {
    const value = e.target.value;
    
    let sanitized: string;
    switch (type) {
      case "email":
        sanitized = sanitizeEmail(value);
        break;
      case "phone":
        sanitized = sanitizePhone(value);
        break;
      case "url":
        sanitized = sanitizeUrl(value);
        break;
      case "alphanumeric":
        sanitized = sanitizeAlphanumeric(value);
        break;
      case "textarea":
        sanitized = sanitizeTextarea(value);
        break;
      case "filename":
        sanitized = sanitizeFilename(value);
        break;
      case "plain":
      default:
        sanitized = sanitizePlainText(value);
        break;
    }
    
    setter(sanitized);
  }, []);

  const handleNumberInput = useCallback((
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (value: number | null) => void,
    options?: { min?: number; max?: number; decimals?: number }
  ) => {
    const value = e.target.value;
    const sanitized = sanitizeNumber(value, options);
    setter(sanitized);
  }, []);

  return {
    handleTextInput,
    handleNumberInput,
  };
}
