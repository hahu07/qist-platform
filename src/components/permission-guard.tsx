"use client";

import { useEffect, useState } from "react";
import { onAuthStateChange, type User } from "@junobuild/core";
import { getUserPermissions, type AdminPermissions } from "@/utils/admin-permissions";

interface PermissionGuardProps {
  children: React.ReactNode;
  permission: keyof AdminPermissions;
  fallback?: React.ReactNode;
  requireAll?: boolean;
}

/**
 * Permission Guard Component
 * Shows children only if user has required permission
 */
export function PermissionGuard({
  children,
  permission,
  fallback = null,
}: PermissionGuardProps) {
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [hasPermission, setHasPermission] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChange((authUser) => setUser(authUser));
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    (async () => {
      if (!user) {
        setHasPermission(false);
        setLoading(false);
        return;
      }

      try {
        const permissions = await getUserPermissions(user.key);
        if (permissions && permissions[permission]) {
          setHasPermission(true);
        } else {
          setHasPermission(false);
        }
      } catch (error) {
        console.error("Error checking permission:", error);
        setHasPermission(false);
      } finally {
        setLoading(false);
      }
    })();
  }, [user, permission]);

  if (loading) {
    return null;
  }

  if (!hasPermission) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

interface RoleGuardProps {
  children: React.ReactNode;
  minimumRole: "viewer" | "reviewer" | "approver" | "manager" | "super_admin";
  fallback?: React.ReactNode;
}

/**
 * Role Guard Component
 * Shows children only if user has sufficient role level
 */
export function RoleGuard({ children, minimumRole, fallback = null }: RoleGuardProps) {
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChange((authUser) => setUser(authUser));
    return () => unsubscribe();
  }, []);

  const roleHierarchy: Record<string, number> = {
    super_admin: 5,
    manager: 4,
    approver: 3,
    reviewer: 2,
    viewer: 1,
  };

  useEffect(() => {
    (async () => {
      if (!user) {
        setHasAccess(false);
        setLoading(false);
        return;
      }

      try {
        const permissions = await getUserPermissions(user.key);
        if (!permissions) {
          setHasAccess(false);
          setLoading(false);
          return;
        }

        // Get user's role from admin profile
        const { getAdminProfile } = await import("@/utils/admin-permissions");
        const profile = await getAdminProfile(user.key);
        
        if (!profile) {
          setHasAccess(false);
          setLoading(false);
          return;
        }

        const userLevel = roleHierarchy[profile.role] || 0;
        const requiredLevel = roleHierarchy[minimumRole] || 0;

        setHasAccess(userLevel >= requiredLevel);
      } catch (error) {
        console.error("Error checking role:", error);
        setHasAccess(false);
      } finally {
        setLoading(false);
      }
    })();
  }, [user, minimumRole]);

  if (loading) {
    return null;
  }

  if (!hasAccess) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

interface ApprovalAmountGuardProps {
  children: React.ReactNode;
  amount: number;
  fallback?: React.ReactNode;
}

/**
 * Approval Amount Guard Component
 * Shows children only if user can approve the amount
 */
export function ApprovalAmountGuard({
  children,
  amount,
  fallback = null,
}: ApprovalAmountGuardProps) {
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [canApprove, setCanApprove] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChange((authUser) => setUser(authUser));
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    (async () => {
      if (!user) {
        setCanApprove(false);
        setLoading(false);
        return;
      }

      try {
        const { canApproveAmount } = await import("@/utils/admin-permissions");
        const allowed = await canApproveAmount(user.key, amount);
        setCanApprove(allowed);
      } catch (error) {
        console.error("Error checking approval amount:", error);
        setCanApprove(false);
      } finally {
        setLoading(false);
      }
    })();
  }, [user, amount]);

  if (loading) {
    return null;
  }

  if (!canApprove) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

/**
 * Access Denied Component
 * Shows when user doesn't have required permissions
 */
export function AccessDenied({ message }: { message?: string }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-lavender-blue-50 to-white dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-8">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-xl border-[3px] border-black shadow-[8px_8px_0px_rgba(0,0,0,1)] p-8 text-center">
        <div className="w-20 h-20 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg
            className="w-10 h-10 text-red-600 dark:text-red-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Access Denied
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          {message || "You don't have permission to access this resource."}
        </p>
        <button
          onClick={() => window.history.back()}
          className="px-6 py-3 bg-lavender-blue-600 text-white rounded-xl border-[3px] border-black shadow-[8px_8px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_rgba(0,0,0,1)] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all font-bold"
        >
          Go Back
        </button>
      </div>
    </div>
  );
}
