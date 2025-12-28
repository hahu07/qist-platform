import { getDoc } from "@junobuild/core";
import type { AdminProfile } from "@/schemas";
import { getPermissionsForRole, type AdminPermissions } from "@/schemas";

export type { AdminPermissions };

/**
 * Fetches admin profile from Juno datastore
 * Returns null if user is not an admin
 */
export async function getAdminProfile(userId: string): Promise<AdminProfile | null> {
  try {
    const result = await getDoc({
      collection: "admin_profiles",
      key: userId,
    });

    if (!result) {
      return null;
    }

    return result.data as AdminProfile;
  } catch (error) {
    console.error("Error fetching admin profile:", error);
    return null;
  }
}

/**
 * Checks if user has admin permissions
 */
export async function isAdmin(userId: string): Promise<boolean> {
  const profile = await getAdminProfile(userId);
  return profile !== null && profile.isActive;
}

/**
 * Gets permissions for the current user
 */
export async function getUserPermissions(userId: string): Promise<AdminPermissions | null> {
  const profile = await getAdminProfile(userId);
  
  if (!profile || !profile.isActive) {
    return null;
  }

  return getPermissionsForRole(profile.role);
}

/**
 * Checks if user has specific permission
 */
export async function hasPermission(
  userId: string,
  permission: keyof AdminPermissions
): Promise<boolean> {
  const permissions = await getUserPermissions(userId);
  
  if (!permissions) {
    return false;
  }

  return permissions[permission] as boolean;
}

/**
 * Checks if user can approve a specific amount
 */
export async function canApproveAmount(userId: string, amount: number): Promise<boolean> {
  const profile = await getAdminProfile(userId);
  
  if (!profile || !profile.isActive) {
    return false;
  }

  const permissions = getPermissionsForRole(profile.role);
  return permissions.canApprove && amount <= profile.approvalLimit;
}

/**
 * Role hierarchy for comparisons
 */
const roleHierarchy: Record<string, number> = {
  super_admin: 5,
  manager: 4,
  approver: 3,
  reviewer: 2,
  viewer: 1,
};

/**
 * Checks if user role has sufficient level
 */
export async function hasRoleLevel(
  userId: string,
  minimumRole: string
): Promise<boolean> {
  const profile = await getAdminProfile(userId);
  
  if (!profile || !profile.isActive) {
    return false;
  }

  const userLevel = roleHierarchy[profile.role] || 0;
  const requiredLevel = roleHierarchy[minimumRole] || 0;

  return userLevel >= requiredLevel;
}

/**
 * Redirects non-admin users
 */
export function requireAdmin() {
  return async (userId: string) => {
    const isAdminUser = await isAdmin(userId);
    
    if (!isAdminUser) {
      throw new Error("Unauthorized: Admin access required");
    }
  };
}

/**
 * Checks if user can manage other admins
 */
export async function canManageAdmins(userId: string): Promise<boolean> {
  return hasRoleLevel(userId, "manager");
}

/**
 * Validates separation of duties for approval
 */
export function validateSeparationOfDuties(
  reviewerId: string,
  approverId: string
): { valid: boolean; reason?: string } {
  if (reviewerId === approverId) {
    return {
      valid: false,
      reason: "Separation of duties violation: Reviewer cannot approve their own review",
    };
  }
  
  return { valid: true };
}

/**
 * Checks if dual authorization is required
 */
export function requiresDualAuthorization(
  amount: number,
  primaryApproverRole: string
): boolean {
  const dualAuthThreshold = 50_000_000; // ₦50M
  
  // Amounts over ₦50M always require dual authorization
  if (amount > dualAuthThreshold) {
    return true;
  }
  
  // Reviewers need secondary approval for amounts over ₦5M
  if (primaryApproverRole === "reviewer" && amount > 5_000_000) {
    return true;
  }
  
  return false;
}

/**
 * Format role name for display
 */
export function formatRoleName(role: string): string {
  return role
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Get role badge color classes
 */
export function getRoleBadgeColor(role: string): string {
  switch (role) {
    case "super_admin":
      return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
    case "manager":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
    case "approver":
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
    case "reviewer":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
  }
}
