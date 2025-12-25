/**
 * Input Sanitization Utilities
 * Prevents XSS attacks and ensures data integrity
 */

/**
 * Sanitize HTML string to prevent XSS attacks
 * Removes dangerous tags and attributes
 */
export function sanitizeHtml(input: string): string {
  if (!input) return "";
  
  // Remove script tags and their content
  let sanitized = input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");
  
  // Remove event handlers (onclick, onerror, etc.)
  sanitized = sanitized.replace(/on\w+\s*=\s*["'][^"']*["']/gi, "");
  sanitized = sanitized.replace(/on\w+\s*=\s*[^\s>]*/gi, "");
  
  // Remove javascript: protocol
  sanitized = sanitized.replace(/javascript:/gi, "");
  
  // Remove dangerous tags
  const dangerousTags = ["iframe", "object", "embed", "applet", "meta", "link", "style"];
  dangerousTags.forEach((tag) => {
    const regex = new RegExp(`<${tag}\\b[^<]*(?:(?!<\\/${tag}>)<[^<]*)*<\\/${tag}>`, "gi");
    sanitized = sanitized.replace(regex, "");
  });
  
  return sanitized.trim();
}

/**
 * Sanitize plain text input
 * Removes all HTML tags and special characters
 */
export function sanitizePlainText(input: string): string {
  if (!input) return "";
  
  // Remove all HTML tags
  let sanitized = input.replace(/<[^>]*>/g, "");
  
  // Remove null bytes
  sanitized = sanitized.replace(/\0/g, "");
  
  // Normalize whitespace
  sanitized = sanitized.replace(/\s+/g, " ");
  
  return sanitized.trim();
}

/**
 * Sanitize email address
 * Validates and normalizes email format
 */
export function sanitizeEmail(input: string): string {
  if (!input) return "";
  
  // Remove whitespace and convert to lowercase
  let email = input.trim().toLowerCase();
  
  // Remove any HTML tags
  email = email.replace(/<[^>]*>/g, "");
  
  // Basic email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return "";
  }
  
  return email;
}

/**
 * Sanitize phone number
 * Removes non-numeric characters except + at start
 */
export function sanitizePhone(input: string): string {
  if (!input) return "";
  
  // Remove whitespace
  let phone = input.trim();
  
  // Keep only numbers and leading +
  phone = phone.replace(/[^\d+]/g, "");
  
  // Ensure + is only at the start
  if (phone.includes("+")) {
    phone = "+" + phone.replace(/\+/g, "");
  }
  
  return phone;
}

/**
 * Sanitize URL
 * Ensures URL is safe and valid
 */
export function sanitizeUrl(input: string): string {
  if (!input) return "";
  
  let url = input.trim();
  
  // Remove any whitespace
  url = url.replace(/\s/g, "");
  
  // Block dangerous protocols
  const dangerousProtocols = ["javascript:", "data:", "vbscript:", "file:"];
  const lowerUrl = url.toLowerCase();
  
  for (const protocol of dangerousProtocols) {
    if (lowerUrl.startsWith(protocol)) {
      return "";
    }
  }
  
  // Ensure http/https if no protocol specified
  if (!url.match(/^https?:\/\//i)) {
    url = "https://" + url;
  }
  
  try {
    // Validate URL structure
    new URL(url);
    return url;
  } catch {
    return "";
  }
}

/**
 * Sanitize filename
 * Removes dangerous characters from filenames
 */
export function sanitizeFilename(input: string): string {
  if (!input) return "";
  
  // Remove path traversal attempts
  let filename = input.replace(/\.\./g, "");
  
  // Remove directory separators
  filename = filename.replace(/[/\\]/g, "");
  
  // Remove null bytes
  filename = filename.replace(/\0/g, "");
  
  // Replace spaces with underscores
  filename = filename.replace(/\s+/g, "_");
  
  // Keep only safe characters: letters, numbers, dash, underscore, dot
  filename = filename.replace(/[^a-zA-Z0-9._-]/g, "");
  
  // Limit length
  if (filename.length > 255) {
    const ext = filename.substring(filename.lastIndexOf("."));
    filename = filename.substring(0, 255 - ext.length) + ext;
  }
  
  return filename;
}

/**
 * Sanitize number input
 * Ensures input is a valid number
 */
export function sanitizeNumber(input: string | number, options?: {
  min?: number;
  max?: number;
  decimals?: number;
}): number | null {
  if (input === "" || input === null || input === undefined) return null;
  
  const num = typeof input === "string" ? parseFloat(input.replace(/[^\d.-]/g, "")) : input;
  
  if (isNaN(num)) return null;
  
  let sanitized = num;
  
  // Apply min/max constraints
  if (options?.min !== undefined && sanitized < options.min) {
    sanitized = options.min;
  }
  if (options?.max !== undefined && sanitized > options.max) {
    sanitized = options.max;
  }
  
  // Round to specified decimals
  if (options?.decimals !== undefined) {
    const factor = Math.pow(10, options.decimals);
    sanitized = Math.round(sanitized * factor) / factor;
  }
  
  return sanitized;
}

/**
 * Sanitize alphanumeric input
 * Keeps only letters, numbers, and optionally spaces/dashes
 */
export function sanitizeAlphanumeric(input: string, allowSpaces = true, allowDashes = true): string {
  if (!input) return "";
  
  let pattern = "a-zA-Z0-9";
  if (allowSpaces) pattern += "\\s";
  if (allowDashes) pattern += "-";
  
  const regex = new RegExp(`[^${pattern}]`, "g");
  return input.replace(regex, "").trim();
}

/**
 * Sanitize textarea/long text input
 * Preserves newlines but removes dangerous content
 */
export function sanitizeTextarea(input: string, maxLength?: number): string {
  if (!input) return "";
  
  // Remove script tags and event handlers
  let sanitized = sanitizeHtml(input);
  
  // Normalize newlines
  sanitized = sanitized.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  
  // Limit consecutive newlines
  sanitized = sanitized.replace(/\n{4,}/g, "\n\n\n");
  
  // Apply max length if specified
  if (maxLength && sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }
  
  return sanitized.trim();
}

/**
 * Sanitize object keys
 * Ensures object keys are safe (useful for dynamic data)
 */
export function sanitizeObjectKeys<T extends Record<string, any>>(obj: T): Record<string, any> {
  const sanitized: Record<string, any> = {};
  
  for (const [key, value] of Object.entries(obj)) {
    // Sanitize the key
    const safeKey = sanitizeAlphanumeric(key, false, true);
    
    if (safeKey) {
      // Recursively sanitize nested objects
      if (typeof value === "object" && value !== null && !Array.isArray(value)) {
        sanitized[safeKey] = sanitizeObjectKeys(value);
      } else if (typeof value === "string") {
        sanitized[safeKey] = sanitizePlainText(value);
      } else {
        sanitized[safeKey] = value;
      }
    }
  }
  
  return sanitized;
}
