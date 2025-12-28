/**
 * Application Status State Machine
 * Defines valid status transitions and validation rules
 */

export type ApplicationStatus = "pending" | "new" | "review" | "approved" | "rejected" | "more-info";

/**
 * Valid status transitions map
 * Key: current status, Value: array of allowed next statuses
 */
const STATUS_TRANSITIONS: Record<ApplicationStatus, ApplicationStatus[]> = {
  // New applications start as pending
  pending: ["review", "rejected", "more-info"],
  
  // New is an alias for pending (legacy support)
  new: ["review", "rejected", "more-info"],
  
  // Under review can go to approved, rejected, or request more info
  review: ["approved", "rejected", "more-info"],
  
  // Approved is a terminal state (can only be archived/deleted, not transitioned)
  approved: [],
  
  // Rejected applications can be resubmitted (back to pending) if allowed
  rejected: ["pending"],
  
  // More info requested can be resubmitted after business provides info
  "more-info": ["pending", "review"],
};

/**
 * Status categories for permissions and workflow
 */
export const STATUS_CATEGORIES = {
  active: ["pending", "new", "review", "more-info"] as ApplicationStatus[],
  terminal: ["approved", "rejected"] as ApplicationStatus[],
  needsAction: ["pending", "more-info"] as ApplicationStatus[],
  inProgress: ["review"] as ApplicationStatus[],
} as const;

/**
 * Human-readable status labels
 */
export const STATUS_LABELS: Record<ApplicationStatus, string> = {
  pending: "Pending Review",
  new: "New Application",
  review: "Under Review",
  approved: "Approved",
  rejected: "Rejected",
  "more-info": "More Information Requested",
};

/**
 * Status descriptions for user guidance
 */
export const STATUS_DESCRIPTIONS: Record<ApplicationStatus, string> = {
  pending: "Your application has been submitted and is awaiting initial review.",
  new: "Your application has been received and will be reviewed soon.",
  review: "Your application is currently being reviewed by our team.",
  approved: "Congratulations! Your application has been approved.",
  rejected: "Your application has been rejected. Please see the reason provided.",
  "more-info": "We need additional information to proceed with your application.",
};

/**
 * Validation result for status transitions
 */
export interface StatusTransitionResult {
  isValid: boolean;
  error?: string;
  warning?: string;
}

/**
 * Validate if a status transition is allowed
 */
export function canTransitionTo(
  currentStatus: ApplicationStatus,
  newStatus: ApplicationStatus,
  options: {
    rejectionAllowsResubmit?: boolean;
    isResubmission?: boolean;
  } = {}
): StatusTransitionResult {
  // Same status is always allowed (no-op)
  if (currentStatus === newStatus) {
    return {
      isValid: true,
      warning: "Status unchanged",
    };
  }

  // Check if transition is in allowed list
  const allowedTransitions = STATUS_TRANSITIONS[currentStatus];
  
  if (!allowedTransitions.includes(newStatus)) {
    return {
      isValid: false,
      error: `Cannot transition from '${STATUS_LABELS[currentStatus]}' to '${STATUS_LABELS[newStatus]}'`,
    };
  }

  // Special validation for rejected -> pending (resubmission)
  if (currentStatus === "rejected" && newStatus === "pending") {
    if (options.rejectionAllowsResubmit === false) {
      return {
        isValid: false,
        error: "This application cannot be resubmitted due to permanent rejection",
      };
    }
    if (!options.isResubmission) {
      return {
        isValid: false,
        error: "Resubmission flag must be set when transitioning from rejected to pending",
      };
    }
  }

  // Special validation for approved (terminal state)
  if (currentStatus === "approved") {
    return {
      isValid: false,
      error: "Approved applications cannot be changed. Please archive or delete instead.",
    };
  }

  return { isValid: true };
}

/**
 * Get all valid next statuses for a current status
 */
export function getValidNextStatuses(
  currentStatus: ApplicationStatus,
  rejectionAllowsResubmit?: boolean
): ApplicationStatus[] {
  const transitions = STATUS_TRANSITIONS[currentStatus];
  
  // Filter out rejected->pending if resubmission not allowed
  if (currentStatus === "rejected" && rejectionAllowsResubmit === false) {
    return []; // No valid transitions from permanent rejection
  }
  
  return transitions;
}

/**
 * Check if a status is terminal (no further transitions allowed)
 */
export function isTerminalStatus(status: ApplicationStatus): boolean {
  return STATUS_CATEGORIES.terminal.includes(status);
}

/**
 * Check if a status requires business action
 */
export function requiresBusinessAction(status: ApplicationStatus): boolean {
  return STATUS_CATEGORIES.needsAction.includes(status);
}

/**
 * Check if a status is actively being processed
 */
export function isActiveStatus(status: ApplicationStatus): boolean {
  return STATUS_CATEGORIES.active.includes(status);
}

/**
 * Validate a complete status transition with context
 */
export function validateStatusTransition(
  currentStatus: ApplicationStatus,
  newStatus: ApplicationStatus,
  context: {
    isAdmin?: boolean;
    isBusiness?: boolean;
    rejectionAllowsResubmit?: boolean;
    isResubmission?: boolean;
    hasRequiredFields?: boolean;
  } = {}
): StatusTransitionResult {
  // Basic transition validation
  const transitionCheck = canTransitionTo(currentStatus, newStatus, {
    rejectionAllowsResubmit: context.rejectionAllowsResubmit,
    isResubmission: context.isResubmission,
  });
  
  if (!transitionCheck.isValid) {
    return transitionCheck;
  }

  // Permission checks
  const adminOnlyTransitions: ApplicationStatus[] = ["review", "approved", "rejected", "more-info"];
  if (adminOnlyTransitions.includes(newStatus) && !context.isAdmin) {
    return {
      isValid: false,
      error: "Only administrators can set this status",
    };
  }

  // Business can only resubmit (rejected -> pending or more-info -> pending)
  if (context.isBusiness && newStatus === "pending") {
    if (!(currentStatus === "rejected" || currentStatus === "more-info")) {
      return {
        isValid: false,
        error: "Businesses can only resubmit rejected or more-info applications",
      };
    }
  }

  // Field requirements for certain transitions
  if (newStatus === "rejected" && !context.hasRequiredFields) {
    return {
      isValid: false,
      error: "Rejection reason is required when rejecting an application",
    };
  }

  return { isValid: true };
}
