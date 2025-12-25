/**
 * Application Status State Machine
 * Validates status transitions and prevents invalid state changes
 */

export type ApplicationStatus = "pending" | "new" | "review" | "approved" | "rejected" | "more-info";

type TransitionRule = {
  from: ApplicationStatus;
  to: ApplicationStatus[];
  requiresConditions?: string[]; // Optional conditions that must be met
};

/**
 * Valid status transitions
 * Each status can only transition to specific other statuses
 */
const TRANSITION_RULES: TransitionRule[] = [
  // New/Pending applications can move to review
  { from: "new", to: ["review", "rejected"] },
  { from: "pending", to: ["review", "rejected"] },
  
  // Review can go to approved, rejected, or request more info
  { from: "review", to: ["approved", "rejected", "more-info"] },
  
  // More info requested can be resubmitted (back to review)
  { from: "more-info", to: ["review", "rejected"] },
  
  // Approved is a terminal state (can only be reverted by admin if needed)
  { from: "approved", to: ["rejected"] }, // Only in exceptional cases
  
  // Rejected applications can be resubmitted if allowed
  { from: "rejected", to: ["review"] }, // Only if rejectionAllowsResubmit = true
];

type ValidationResult = {
  valid: boolean;
  error?: string;
  warning?: string;
};

/**
 * Validates if a status transition is allowed
 */
export function validateStatusTransition(
  currentStatus: ApplicationStatus,
  newStatus: ApplicationStatus,
  context?: {
    hasRequiredDocuments?: boolean;
    dueDiligenceComplete?: boolean;
    rejectionAllowsResubmit?: boolean;
  }
): ValidationResult {
  // No change is always valid
  if (currentStatus === newStatus) {
    return { valid: true, warning: "Status unchanged" };
  }

  // Find the transition rule for current status
  const rule = TRANSITION_RULES.find((r) => r.from === currentStatus);
  
  if (!rule) {
    return {
      valid: false,
      error: `No transition rules defined for status: ${currentStatus}`
    };
  }

  // Check if the new status is in the allowed list
  if (!rule.to.includes(newStatus)) {
    return {
      valid: false,
      error: `Invalid transition: ${currentStatus} → ${newStatus}. Allowed transitions: ${rule.to.join(", ")}`
    };
  }

  // Additional validation for specific transitions
  if (currentStatus === "rejected" && newStatus === "review") {
    if (context?.rejectionAllowsResubmit === false) {
      return {
        valid: false,
        error: "This rejected application cannot be resubmitted (permanent rejection)"
      };
    }
  }

  if (newStatus === "approved") {
    if (context?.hasRequiredDocuments === false) {
      return {
        valid: false,
        error: "Cannot approve: required documents not submitted"
      };
    }
    
    if (context?.dueDiligenceComplete === false) {
      return {
        valid: false,
        error: "Cannot approve: due diligence not completed"
      };
    }
  }

  return { valid: true };
}

/**
 * Get all valid next statuses for a given current status
 */
export function getValidNextStatuses(currentStatus: ApplicationStatus): ApplicationStatus[] {
  const rule = TRANSITION_RULES.find((r) => r.from === currentStatus);
  return rule?.to || [];
}

/**
 * Get human-readable status labels
 */
export function getStatusLabel(status: ApplicationStatus): string {
  const labels: Record<ApplicationStatus, string> = {
    new: "New Application",
    pending: "Pending Review",
    review: "Under Review",
    approved: "Approved",
    rejected: "Rejected",
    "more-info": "More Information Required"
  };
  return labels[status];
}

/**
 * Get status color classes for UI
 */
export function getStatusColorClasses(status: ApplicationStatus): string {
  const colors: Record<ApplicationStatus, string> = {
    new: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800",
    pending: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800",
    review: "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800",
    approved: "bg-success-100 dark:bg-success-900/30 text-success-700 dark:text-success-300 border-success-200 dark:border-success-800",
    rejected: "bg-danger-100 dark:bg-danger-900/30 text-danger-700 dark:text-danger-300 border-danger-200 dark:border-danger-800",
    "more-info": "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800"
  };
  return colors[status];
}
