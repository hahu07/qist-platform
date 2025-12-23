/**
 * Schema Usage Examples
 * Demonstrates how to use schemas for validation across the AmanaTrade platform
 */

import { applicationDataSchema, type ApplicationData } from "@/schemas";
import { validateData, validateOrThrow, formatZodErrors } from "@/utils/validation";
import { z } from "zod";

// ==========================================
// 1. VALIDATING FORM DATA
// ==========================================

export function validateApplicationForm(formData: unknown) {
  const result = validateData(applicationDataSchema, formData);
  
  if (result.success) {
    // Type-safe access to validated data
    const app: ApplicationData = result.data;
    console.log("Valid application:", app.businessName);
    return { valid: true, data: app };
  } else {
    // Handle validation errors
    console.error("Validation errors:", result.errors);
    return { valid: false, errors: result.errors };
  }
}

// ==========================================
// 2. VALIDATING WITH EXCEPTIONS
// ==========================================

export function createApplicationStrict(data: unknown): ApplicationData {
  // Throws error with descriptive message if validation fails
  return validateOrThrow(
    applicationDataSchema,
    data,
    "Create application"
  );
}

// ==========================================
// 3. TYPE INFERENCE
// ==========================================

// Automatically infer TypeScript types from schemas
type InferredType = z.infer<typeof applicationDataSchema>;
// InferredType is equivalent to ApplicationData

// ==========================================
// 4. PARTIAL VALIDATION (for updates)
// ==========================================

export function validateApplicationUpdate(data: Partial<ApplicationData>) {
  // Only validate the fields that are provided
  const partialSchema = applicationDataSchema.partial();
  const result = partialSchema.safeParse(data);
  
  if (result.success) {
    return { valid: true, data: result.data };
  } else {
    return { valid: false, errors: formatZodErrors(result.error) };
  }
}

// ==========================================
// 5. CUSTOM VALIDATION RULES
// ==========================================

const customApplicationSchema = applicationDataSchema.refine(
  (data) => {
    // Custom rule: Business pool applications must meet minimum duration
    const duration = data.duration || data.fundingDuration || 0;
    if (data.pool === "business" && duration < 6) {
      return false;
    }
    return true;
  },
  {
    message: "Business pool applications must have a minimum 6-month duration",
    path: ["duration"], // Which field to attach error to
  }
);

// ==========================================
// 6. TRANSFORMING DATA
// ==========================================

const applicationWithTransform = applicationDataSchema.transform((data) => {
  // Automatically transform data after validation
  return {
    ...data,
    businessName: data.businessName.trim().toUpperCase(),
    amount: Math.round(data.amount || data.requestedAmount || 0),
  };
});

// ==========================================
// 7. FORM FIELD VALIDATION (React example)
// ==========================================

export function validateField(
  fieldName: keyof ApplicationData,
  value: any
): string | null {
  try {
    // Extract single field schema
    const fieldSchema = applicationDataSchema.shape[fieldName];
    if (fieldSchema) {
      fieldSchema.parse(value);
      return null; // No error
    }
    return "Unknown field";
  } catch (error) {
    if (error instanceof z.ZodError) {
      return error.issues[0]?.message || "Invalid value";
    }
    return "Validation error";
  }
}

// ==========================================
// 8. BATCH VALIDATION
// ==========================================

export function validateMultipleApplications(applications: unknown[]) {
  const results = applications.map((app, index) => {
    const result = validateData(applicationDataSchema, app);
    return {
      index,
      ...result,
    };
  });
  
  const valid = results.filter(r => r.success);
  const invalid = results.filter(r => !r.success);
  
  return {
    total: applications.length,
    validCount: valid.length,
    invalidCount: invalid.length,
    valid,
    invalid,
  };
}

// ==========================================
// 9. DEFAULT VALUES
// ==========================================

export function getDefaultApplication(): Partial<ApplicationData> {
  // Use schema defaults
  return {
    status: "new",
    documents: [],
    yearsInOperation: 0,
  };
}

// ==========================================
// 10. SAFE PARSING (no exceptions)
// ==========================================

export function safeParseApplication(data: unknown) {
  const result = applicationDataSchema.safeParse(data);
  
  if (result.success) {
    // result.data is fully typed
    return result.data;
  } else {
    // result.error contains all validation issues
    console.error("Validation failed:", result.error.issues);
    return null;
  }
}

// ==========================================
// USAGE IN JUNO BACKEND OPERATIONS
// ==========================================

import { setDoc } from "@junobuild/core";

export async function createApplication(data: unknown) {
  try {
    // Validate before sending to Juno
    const validatedData = validateOrThrow(
      applicationDataSchema,
      data,
      "Create application"
    );
    
    // Data is now type-safe and validated
    await setDoc({
      collection: "business_applications",
      doc: {
        key: `app-${Date.now()}`,
        data: validatedData,
      },
    });
    
    return { success: true };
  } catch (error) {
    console.error("Failed to create application:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    };
  }
}
