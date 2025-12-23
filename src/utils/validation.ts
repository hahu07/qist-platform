import { z } from "zod";

/**
 * Validation Helper Utilities
 * Provides common validation functions and error handling
 */

/**
 * Parse and validate data with user-friendly error messages
 */
export function validateData<T extends z.ZodType>(
  schema: T,
  data: unknown
): { success: true; data: z.infer<T> } | { success: false; errors: Record<string, string> } {
  const result = schema.safeParse(data);
  
  if (result.success) {
    return { success: true, data: result.data };
  }
  
  // Convert to field-error map
  const errors: Record<string, string> = {};
  result.error.issues.forEach((err: z.ZodIssue) => {
    const field = err.path.join(".");
    if (field) {
      errors[field] = err.message;
    }
  });
  
  return { success: false, errors };
}

/**
 * Validate data and throw formatted error
 */
export function validateOrThrow<T extends z.ZodType>(
  schema: T,
  data: unknown,
  context?: string
): z.infer<T> {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.issues.map((err: z.ZodIssue) => {
        const field = err.path.join(".");
        return field ? `${field}: ${err.message}` : err.message;
      }).join(", ");
      
      const contextMsg = context ? `${context}: ` : "";
      throw new Error(`${contextMsg}Validation failed - ${messages}`);
    }
    throw error;
  }
}

/**
 * Format Zod errors for display
 */
export function formatZodErrors(error: z.ZodError): Record<string, string> {
  const fieldErrors: Record<string, string> = {};
  
  error.issues.forEach((err: z.ZodIssue) => {
    const field = err.path.join(".");
    if (field) {
      fieldErrors[field] = err.message;
    }
  });
  
  return fieldErrors;
}

/**
 * Validate partial updates (only provided fields)
 */
export function validatePartialUpdate<T extends z.ZodTypeAny>(
  schema: T,
  data: Partial<z.infer<T>>
): { success: true; data: any } | { success: false; errors: Record<string, string> } {
  // For non-object schemas, just validate the data as-is
  if (!(schema instanceof z.ZodObject)) {
    return validateData(schema, data);
  }
  
  // Create a partial schema for objects
  const partialSchema = schema.partial();
  return validateData(partialSchema, data);
}
