/**
 * File validation utilities for document uploads
 * Ensures consistent validation across the platform
 */

export interface FileValidationOptions {
  maxSizeMB?: number;
  allowedTypes?: string[];
  allowedExtensions?: string[];
}

export interface FileValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Default validation settings for different document types
 */
export const FILE_VALIDATION_PRESETS = {
  // KYC documents: PDF, images
  kyc: {
    maxSizeMB: 5,
    allowedTypes: ["application/pdf", "image/jpeg", "image/jpg", "image/png"],
    allowedExtensions: [".pdf", ".jpg", ".jpeg", ".png"],
  },
  // Financial documents: PDF, Excel, images
  financial: {
    maxSizeMB: 10,
    allowedTypes: [
      "application/pdf",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "image/jpeg",
      "image/jpg",
      "image/png",
    ],
    allowedExtensions: [".pdf", ".xls", ".xlsx", ".jpg", ".jpeg", ".png"],
  },
  // Message attachments: various document types
  message: {
    maxSizeMB: 5,
    allowedTypes: [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "image/jpeg",
      "image/jpg",
      "image/png",
      "text/plain",
    ],
    allowedExtensions: [".pdf", ".doc", ".docx", ".xls", ".xlsx", ".jpg", ".jpeg", ".png", ".txt"],
  },
};

/**
 * Get file extension from filename
 */
function getFileExtension(filename: string): string {
  const lastDot = filename.lastIndexOf(".");
  return lastDot === -1 ? "" : filename.substring(lastDot).toLowerCase();
}

/**
 * Format file size in human-readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

/**
 * Validate a file against specified criteria
 */
export function validateFile(
  file: File,
  options: FileValidationOptions = {}
): FileValidationResult {
  const {
    maxSizeMB = 5,
    allowedTypes = [],
    allowedExtensions = [],
  } = options;

  // Check file size
  const maxBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxBytes) {
    return {
      isValid: false,
      error: `File size must be less than ${maxSizeMB}MB. Your file is ${formatFileSize(file.size)}.`,
    };
  }

  // Check MIME type if specified
  if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
    const typeNames = getReadableFileTypes(allowedExtensions);
    return {
      isValid: false,
      error: `Invalid file type. Only ${typeNames} files are allowed.`,
    };
  }

  // Check file extension if specified
  if (allowedExtensions.length > 0) {
    const extension = getFileExtension(file.name);
    if (!allowedExtensions.includes(extension)) {
      const typeNames = getReadableFileTypes(allowedExtensions);
      return {
        isValid: false,
        error: `Invalid file extension. Only ${typeNames} files are allowed.`,
      };
    }
  }

  return { isValid: true };
}

/**
 * Convert file extensions to readable format
 * e.g., [".pdf", ".jpg", ".png"] => "PDF, JPG, and PNG"
 */
function getReadableFileTypes(extensions: string[]): string {
  if (extensions.length === 0) return "supported";
  
  const types = extensions.map((ext) => ext.substring(1).toUpperCase());
  
  if (types.length === 1) return types[0];
  if (types.length === 2) return `${types[0]} and ${types[1]}`;
  
  const lastType = types.pop();
  return `${types.join(", ")}, and ${lastType}`;
}

/**
 * Validate file using preset configuration
 */
export function validateFileWithPreset(
  file: File,
  preset: keyof typeof FILE_VALIDATION_PRESETS
): FileValidationResult {
  return validateFile(file, FILE_VALIDATION_PRESETS[preset]);
}
