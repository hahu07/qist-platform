"use client";

import { useEffect, useState } from "react";
import { initSatellite, listDocs, setDoc, getDoc, onAuthStateChange, type Doc, type User } from "@junobuild/core";
import { 
  AdminProfile, 
  AdminProfileSchema,
  getPermissionsForRole,
  type AdminPermissions,
  AdminActionLogSchema,
} from "@/schemas";
import { useRouter } from "next/navigation";
import { ErrorBoundary } from "@/components/error-boundary";

interface AdminWithPermissions extends AdminProfile {
  permissions: AdminPermissions;
}

interface AdminDoc extends Doc<AdminProfile> {
  data: AdminWithPermissions;
}

function AdminTeamPageContent() {
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [currentAdminProfile, setCurrentAdminProfile] = useState<AdminDoc | null>(null);
  const [admins, setAdmins] = useState<AdminDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAdmin, setSelectedAdmin] = useState<AdminDoc | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [customPermissionKey, setCustomPermissionKey] = useState("");
  const [customPermissionDesc, setCustomPermissionDesc] = useState("");
  const [authError, setAuthError] = useState<string>("");
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const router = useRouter();

  useEffect(() => {
    (async () => await initSatellite({ workers: { auth: true } }))();
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChange(async (authUser) => {
      setUser(authUser);
      if (!authUser) {
        setLoading(false);
        setAuthError("You must be signed in to access this page.");
        // Redirect to admin login after a short delay
        setTimeout(() => {
          router.push("/auth/signin?redirect=/admin/team");
        }, 1500);
      } else {
        await checkCurrentUserRole(authUser);
      }
    });
    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    if (currentAdminProfile) {
      loadAdmins();
    }
  }, [currentAdminProfile]);

  const checkCurrentUserRole = async (authUser: User) => {
    try {
      // Get admin profile from database
      const profile = await getDoc<AdminProfile>({
        collection: "admin_profiles",
        key: authUser.key,
      });

      if (!profile) {
        setAuthError("You do not have admin access. Please contact a super admin.");
        setLoading(false);
        return;
      }

      // Check if admin is active
      if (!profile.data.isActive) {
        setAuthError("Your admin account is inactive. Please contact a super admin.");
        setLoading(false);
        return;
      }

      // Check if user has permission to manage admins
      const permissions = getPermissionsForRole(profile.data.role);
      if (!permissions.canManageAdmins && profile.data.role !== "super_admin") {
        setAuthError("You do not have permission to manage admin team members.");
        setLoading(false);
        return;
      }

      // Set current admin profile with permissions
      setCurrentAdminProfile({
        ...profile,
        data: {
          ...profile.data,
          permissions,
        },
      } as AdminDoc);
      
      setLoading(false);
    } catch (error) {
      console.error("Error checking user role:", error);
      setAuthError("Failed to verify admin access. Please try again.");
      setLoading(false);
    }
  };

  const loadAdmins = async () => {
    try {
      setLoading(true);
      const { items } = await listDocs<AdminProfile>({
        collection: "admin_profiles",
        filter: {},
      });

      const adminsWithPermissions = items.map((item) => {
        const admin = item.data;
        // Get role-based permissions
        const permissions = getPermissionsForRole(admin.role);
        return {
          ...item,
          data: {
            ...admin,
            permissions,
          },
        };
      });

      setAdmins(adminsWithPermissions as AdminDoc[]);
    } catch (error) {
      console.error("Error loading admins:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditAdmin = (admin: AdminDoc) => {
    setSelectedAdmin(admin);
    setShowEditModal(true);
  };

  const handleToggleActive = async (admin: AdminDoc) => {
    const action = admin.data.isActive ? "deactivate" : "activate";
    if (!confirm(`Are you sure you want to ${action} ${admin.data.displayName}?`)) {
      return;
    }

    try {
      await setDoc({
        collection: "admin_profiles",
        doc: {
          key: admin.key,
          data: {
            ...admin.data,
            isActive: !admin.data.isActive,
            updatedAt: Date.now(),
          },
          version: admin.version,
        },
      });

      await loadAdmins();
      alert(`${admin.data.displayName} has been ${action}d successfully.`);
    } catch (error: any) {
      console.error(`Error ${action}ing admin:`, error);
      alert(`Failed to ${action} admin: ${error.message || "Unknown error"}`);
    }
  };

  const handleDeleteAdmin = async (admin: AdminDoc) => {
    if (!confirm(`⚠️ WARNING: Are you sure you want to permanently DELETE ${admin.data.displayName}?\n\nThis action cannot be undone!`)) {
      return;
    }

    try {
      await setDoc({
        collection: "admin_profiles",
        doc: {
          key: admin.key,
          data: {
            ...admin.data,
            isActive: false,
            updatedAt: Date.now(),
          },
          version: admin.version,
        },
      });

      await loadAdmins();
      alert(`${admin.data.displayName} has been deleted (deactivated).`);
    } catch (error: any) {
      console.error("Error deleting admin:", error);
      alert(`Failed to delete admin: ${error.message || "Unknown error"}`);
    }
  };

  const handleSaveAdmin = async () => {
    if (!selectedAdmin) return;

    // Validate inputs
    const errors: Record<string, string> = {};
    
    if (!selectedAdmin.data.displayName?.trim()) {
      errors.displayName = "Display name is required";
    }
    
    if (!selectedAdmin.data.email?.trim()) {
      errors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(selectedAdmin.data.email)) {
      errors.email = "Invalid email format";
    }
    
    if (!selectedAdmin.data.userId?.trim()) {
      errors.userId = "User ID is required";
    }
    
    if (selectedAdmin.data.phoneNumber && !/^\+?[\d\s-()]+$/.test(selectedAdmin.data.phoneNumber)) {
      errors.phoneNumber = "Invalid phone number format";
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    setValidationErrors({});
    setSaving(true);

    try {
      // For updates, include version; for new docs, omit it
      const docToSave = selectedAdmin.version
        ? {
            key: selectedAdmin.key,
            data: {
              ...selectedAdmin.data,
              updatedAt: Date.now(),
            },
            version: selectedAdmin.version,
          }
        : {
            key: selectedAdmin.key,
            data: {
              ...selectedAdmin.data,
              createdAt: Date.now(),
              updatedAt: Date.now(),
            },
          };

      await setDoc({
        collection: "admin_profiles",
        doc: docToSave,
      });

      // Log the action
      if (currentAdminProfile) {
        await setDoc({
          collection: "admin_audit_logs",
          doc: {
            key: `${selectedAdmin.key}_${Date.now()}`,
            data: {
              adminId: currentAdminProfile.key,
              adminName: currentAdminProfile.data.displayName,
              adminRole: currentAdminProfile.data.role,
              action: selectedAdmin.version ? "update_admin" : "create_admin",
              targetCollection: "admin_profiles",
              targetId: selectedAdmin.key,
              targetName: selectedAdmin.data.displayName,
              timestamp: Date.now(),
              success: true,
            },
          },
        });
      }

      // Reload to get fresh versions
      await loadAdmins();
      setShowEditModal(false);
      setSelectedAdmin(null);
      alert("Admin profile saved successfully!");
    } catch (error: any) {
      console.error("Error saving admin:", error);
      
      // Handle version conflict
      if (error.message?.includes("version_outdated")) {
        alert("This admin profile was modified by someone else. Please refresh and try again.");
        await loadAdmins();
        setShowEditModal(false);
        setSelectedAdmin(null);
      } else {
        alert(`Failed to save admin profile: ${error.message || "Unknown error"}`);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleCreateAdmin = () => {
    if (!currentAdminProfile) return;
    
    const newAdminData: AdminWithPermissions = {
      userId: `admin_${Date.now()}`,
      displayName: "",
      email: "",
      phoneNumber: "",
      department: "",
      role: "viewer",
      approvalLimit: 0,
      isActive: true,
      specializations: [],
      currentWorkload: 0,
      maxWorkload: 10,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      permissions: getPermissionsForRole("viewer"),
    };
    
    // Create a new doc structure (no version for new docs)
    const newAdminDoc: AdminDoc = {
      key: newAdminData.userId,
      data: newAdminData,
      owner: "",
      created_at: BigInt(Date.now()),
      updated_at: BigInt(Date.now()),
    };
    
    setSelectedAdmin(newAdminDoc);
    setShowEditModal(true);
  };

  const getRoleBadgeColor = (role: string) => {
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
  };

  const formatCurrency = (amount: number) => {
    if (amount === Infinity) return "Unlimited";
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Filter and search admins
  const filteredAdmins = admins.filter((admin) => {
    const matchesSearch = 
      admin.data.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      admin.data.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      admin.data.userId.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = filterRole === "all" || admin.data.role === filterRole;
    const matchesStatus = filterStatus === "all" || 
      (filterStatus === "active" && admin.data.isActive) ||
      (filterStatus === "inactive" && !admin.data.isActive);
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  // Show loading state while checking authentication
  if (user === undefined || (user !== null && loading)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-lavender-blue-50/30 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950 flex items-center justify-center p-8">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-neutral-600 dark:text-neutral-400 font-medium">Loading admin team...</p>
        </div>
      </div>
    );
  }

  // Show auth error if user is not signed in or not authorized
  if (user === null || authError || !currentAdminProfile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-lavender-blue-50/30 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950 flex items-center justify-center p-8">
        <div className="max-w-md w-full bg-white dark:bg-neutral-900 p-8 rounded-xl border-[3px] border-black shadow-[8px_8px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_#ef4444]">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-error-100 dark:bg-error-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-error-600 dark:text-error-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">Access Denied</h2>
            <p className="text-neutral-600 dark:text-neutral-400 mb-6">
              {authError || "You do not have permission to access this page."}
            </p>
          </div>
          <button
            onClick={() => router.push("/admin/dashboard")}
            className="w-full px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg border-[3px] border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all font-bold"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-lavender-blue-50/30 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950">
      {/* Top Navigation Bar */}
      <nav className="sticky top-0 z-50 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md border-b border-neutral-200 dark:border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <a
              href="/admin/dashboard"
              className="flex items-center gap-2 text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Dashboard
            </a>
            <h1 className="text-xl font-bold text-neutral-900 dark:text-white">Admin Team</h1>
            <div className="w-36"></div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold text-neutral-900 dark:text-white mb-2">
              Team Management
            </h2>
            <p className="text-neutral-600 dark:text-neutral-400">
              Manage administrator roles, permissions, and access levels
            </p>
          </div>
          {(currentAdminProfile.data.role === "manager" || currentAdminProfile.data.role === "super_admin") && (
            <button
              onClick={handleCreateAdmin}
              className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl border-[3px] border-black shadow-[8px_8px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_#10b981] hover:shadow-[4px_4px_0px_rgba(0,0,0,1)] dark:hover:shadow-[4px_4px_0px_#7888FF] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all font-bold"
            >
              + Add Administrator
            </button>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-neutral-900 p-6 rounded-xl border-[3px] border-black shadow-[8px_8px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_#10b981]">
            <h3 className="text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-1">
              Total Admins
            </h3>
            <p className="text-3xl font-bold text-neutral-900 dark:text-white">{admins.length}</p>
          </div>
          <div className="bg-white dark:bg-neutral-900 p-6 rounded-xl border-[3px] border-black shadow-[8px_8px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_#10b981]">
            <h3 className="text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-1">
              Active
            </h3>
            <p className="text-3xl font-bold text-success-600 dark:text-success-400">
              {admins.filter((a) => a.data.isActive).length}
            </p>
          </div>
          <div className="bg-white dark:bg-neutral-900 p-6 rounded-xl border-[3px] border-black shadow-[8px_8px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_#10b981]">
            <h3 className="text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-1">
              Managers
            </h3>
            <p className="text-3xl font-bold text-primary-600 dark:text-primary-400">
              {admins.filter((a) => a.data.role === "manager" || a.data.role === "super_admin").length}
            </p>
          </div>
          <div className="bg-white dark:bg-neutral-900 p-6 rounded-xl border-[3px] border-black shadow-[8px_8px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_#10b981]">
            <h3 className="text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-1">
              Reviewers
            </h3>
            <p className="text-3xl font-bold text-secondary-600 dark:text-secondary-400">
              {admins.filter((a) => a.data.role === "reviewer" || a.data.role === "approver").length}
            </p>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white dark:bg-neutral-900 p-6 rounded-xl border-[3px] border-black shadow-[8px_8px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_#10b981] mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
                Search
              </label>
              <input
                type="text"
                placeholder="Search by name, email, or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 bg-white dark:bg-neutral-700 border-[2px] border-neutral-300 dark:border-neutral-600 rounded-lg text-neutral-900 dark:text-white focus:border-primary-600 focus:ring-2 focus:ring-primary-200 dark:focus:ring-primary-800 outline-none transition-all"
              />
            </div>

            {/* Role Filter */}
            <div>
              <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
                Filter by Role
              </label>
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="w-full px-4 py-2 bg-white dark:bg-neutral-700 border-[2px] border-neutral-300 dark:border-neutral-600 rounded-lg text-neutral-900 dark:text-white focus:border-primary-600 focus:ring-2 focus:ring-primary-200 dark:focus:ring-primary-800 outline-none transition-all"
              >
                <option value="all">All Roles</option>
                <option value="viewer">Viewer</option>
                <option value="reviewer">Reviewer</option>
                <option value="approver">Approver</option>
                <option value="manager">Manager</option>
                <option value="super_admin">Super Admin</option>
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
                Filter by Status
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-4 py-2 bg-white dark:bg-neutral-700 border-[2px] border-neutral-300 dark:border-neutral-600 rounded-lg text-neutral-900 dark:text-white focus:border-primary-600 focus:ring-2 focus:ring-primary-200 dark:focus:ring-primary-800 outline-none transition-all"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
          <div className="mt-4 text-sm text-neutral-600 dark:text-neutral-400">
            Showing {filteredAdmins.length} of {admins.length} administrators
          </div>
        </div>

        {/* Admin List */}
        {filteredAdmins.length === 0 ? (
          <div className="bg-white dark:bg-neutral-900 rounded-xl border-[3px] border-black shadow-[8px_8px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_#10b981] p-12 text-center">
            <div className="w-20 h-20 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-primary-600 dark:text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-2">
              No Administrators Yet
            </h3>
            <p className="text-neutral-600 dark:text-neutral-400 mb-6">
              Get started by creating your first administrator profile
            </p>
            {(currentAdminProfile.data.role === "manager" || currentAdminProfile.data.role === "super_admin") && (
              <button
                onClick={handleCreateAdmin}
                className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl border-[3px] border-black shadow-[8px_8px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_#10b981] hover:shadow-[4px_4px_0px_rgba(0,0,0,1)] dark:hover:shadow-[4px_4px_0px_#7888FF] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all font-bold"
              >
                + Create First Administrator
              </button>
            )}
          </div>
        ) : (
        <div className="bg-white dark:bg-neutral-900 rounded-xl border-[3px] border-black shadow-[8px_8px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_#10b981] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-primary-50 dark:bg-neutral-800">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-bold text-neutral-900 dark:text-white">
                    Admin
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-900 dark:text-white">
                    Role
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-900 dark:text-white">
                    Approval Limit
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-900 dark:text-white">
                    Workload
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-900 dark:text-white">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-900 dark:text-white">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                {filteredAdmins.map((admin) => (
                  <tr
                    key={admin.key}
                    className="hover:bg-primary-50 dark:hover:bg-neutral-800 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-bold text-neutral-900 dark:text-white">
                          {admin.data.displayName}
                        </div>
                        <div className="text-sm text-neutral-600 dark:text-neutral-400">
                          {admin.data.email}
                        </div>
                        {admin.data.department && (
                          <div className="text-xs text-neutral-500 dark:text-neutral-500">
                            {admin.data.department}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${getRoleBadgeColor(
                          admin.data.role
                        )}`}
                      >
                        {admin.data.role.replace("_", " ").toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-neutral-900 dark:text-white font-mono font-semibold">
                      {formatCurrency(admin.data.approvalLimit)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-neutral-900 dark:text-white font-medium">
                        {admin.data.currentWorkload} / {admin.data.maxWorkload}
                      </div>
                      <div className="w-full bg-neutral-200 dark:bg-neutral-700 rounded-full h-2 mt-1">
                        <div
                          className="bg-primary-600 h-2 rounded-full transition-all"
                          style={{
                            width: `${(admin.data.currentWorkload / admin.data.maxWorkload) * 100}%`,
                          }}
                        ></div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {admin.data.isActive ? (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-success-100 text-success-800 dark:bg-success-900/30 dark:text-success-300">
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-error-100 text-error-800 dark:bg-error-900/30 dark:text-error-300">
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEditAdmin(admin)}
                          disabled={
                            currentAdminProfile.data.role !== "manager" && currentAdminProfile.data.role !== "super_admin"
                          }
                          className="px-3 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg border-[2px] border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_#10b981] hover:shadow-[2px_2px_0px_rgba(0,0,0,1)] dark:hover:shadow-[2px_2px_0px_#7888FF] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all text-xs font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleToggleActive(admin)}
                          disabled={
                            currentAdminProfile.data.role !== "manager" && currentAdminProfile.data.role !== "super_admin"
                          }
                          className={`px-3 py-2 rounded-lg border-[2px] border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all text-xs font-bold disabled:opacity-50 disabled:cursor-not-allowed ${
                            admin.data.isActive
                              ? "bg-yellow-600 hover:bg-yellow-700 dark:shadow-[4px_4px_0px_#FFA500] dark:hover:shadow-[2px_2px_0px_#FFA500] text-white"
                              : "bg-green-600 hover:bg-green-700 dark:shadow-[4px_4px_0px_#10b981] dark:hover:shadow-[2px_2px_0px_#10b981] text-white"
                          }`}
                        >
                          {admin.data.isActive ? "Deactivate" : "Activate"}
                        </button>
                        {currentAdminProfile.data.role === "super_admin" && (
                          <button
                            onClick={() => handleDeleteAdmin(admin)}
                            className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg border-[2px] border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_#FF0000] hover:shadow-[2px_2px_0px_rgba(0,0,0,1)] dark:hover:shadow-[2px_2px_0px_#FF0000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all text-xs font-bold"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        )}

        {/* Edit Modal */}
        {showEditModal && selectedAdmin && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-neutral-900 rounded-xl border-[3px] border-black shadow-[8px_8px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_#10b981] max-w-2xl w-full max-h-[90vh] overflow-y-auto p-8">
              <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-6">
                {selectedAdmin.data.displayName ? "Edit Administrator" : "Create Administrator"}
              </h2>

              {/* Validation Errors Summary */}
              {Object.keys(validationErrors).length > 0 && (
                <div className="mb-4 p-4 bg-error-50 dark:bg-error-900/20 border-2 border-error-600 dark:border-error-400 rounded-lg">
                  <h3 className="font-bold text-error-800 dark:text-error-300 mb-2">Please fix the following errors:</h3>
                  <ul className="list-disc list-inside space-y-1">
                    {Object.values(validationErrors).map((error, idx) => (
                      <li key={idx} className="text-sm text-error-700 dark:text-error-400">{error}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-2">
                    User ID (Internet Identity Principal) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={selectedAdmin.data.userId}
                    onChange={(e) =>
                      setSelectedAdmin({ 
                        ...selectedAdmin, 
                        key: e.target.value, // Update key as well for new admins
                        data: { ...selectedAdmin.data, userId: e.target.value } 
                      })
                    }
                    disabled={!!selectedAdmin.version} // Disable if editing existing admin
                    placeholder="hav73-z7wpe-3fjnm-qyonq-dsx7o-jgctl-4omh4-yxoia-xduez-2tr5m-nae"
                    className={`w-full px-4 py-2 bg-white dark:bg-neutral-700 border-[3px] ${validationErrors.userId ? 'border-error-600' : 'border-black dark:border-neutral-600'} rounded-lg text-neutral-900 dark:text-white focus:border-primary-600 focus:ring-2 focus:ring-primary-200 dark:focus:ring-primary-800 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed font-mono text-sm`}
                  />
                  {validationErrors.userId && (
                    <p className="text-xs text-error-600 dark:text-error-400 mt-1">{validationErrors.userId}</p>
                  )}
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                    {selectedAdmin.version 
                      ? "User ID cannot be changed after creation" 
                      : "The Internet Identity principal of the user (ask them to sign in and copy from browser console or a utility page)"}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-2">
                    Display Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={selectedAdmin.data.displayName}
                    onChange={(e) =>
                      setSelectedAdmin({ ...selectedAdmin, data: { ...selectedAdmin.data, displayName: e.target.value } })
                    }
                    className={`w-full px-4 py-2 bg-white dark:bg-neutral-700 border-[3px] ${validationErrors.displayName ? 'border-error-600' : 'border-black dark:border-neutral-600'} rounded-lg text-neutral-900 dark:text-white focus:border-primary-600 focus:ring-2 focus:ring-primary-200 dark:focus:ring-primary-800 outline-none transition-all`}
                  />
                  {validationErrors.displayName && (
                    <p className="text-xs text-error-600 dark:text-error-400 mt-1">{validationErrors.displayName}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-2">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={selectedAdmin.data.email}
                    onChange={(e) =>
                      setSelectedAdmin({ ...selectedAdmin, data: { ...selectedAdmin.data, email: e.target.value } })
                    }
                    className={`w-full px-4 py-2 bg-white dark:bg-neutral-700 border-[3px] ${validationErrors.email ? 'border-error-600' : 'border-black dark:border-neutral-600'} rounded-lg text-neutral-900 dark:text-white focus:border-primary-600 focus:ring-2 focus:ring-primary-200 dark:focus:ring-primary-800 outline-none transition-all`}
                  />
                  {validationErrors.email && (
                    <p className="text-xs text-error-600 dark:text-error-400 mt-1">{validationErrors.email}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={selectedAdmin.data.phoneNumber}
                    onChange={(e) =>
                      setSelectedAdmin({ ...selectedAdmin, data: { ...selectedAdmin.data, phoneNumber: e.target.value } })
                    }
                    className={`w-full px-4 py-2 bg-white dark:bg-neutral-700 border-[3px] ${validationErrors.phoneNumber ? 'border-error-600' : 'border-black dark:border-neutral-600'} rounded-lg text-neutral-900 dark:text-white focus:border-primary-600 focus:ring-2 focus:ring-primary-200 dark:focus:ring-primary-800 outline-none transition-all`}
                  />
                  {validationErrors.phoneNumber && (
                    <p className="text-xs text-error-600 dark:text-error-400 mt-1">{validationErrors.phoneNumber}</p>
                  )}
                  <label className="block text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={selectedAdmin.data.email}
                    onChange={(e) =>
                      setSelectedAdmin({ ...selectedAdmin, data: { ...selectedAdmin.data, email: e.target.value } })
                    }
                    className="w-full px-4 py-2 bg-white dark:bg-neutral-700 border-[3px] border-black dark:border-neutral-600 rounded-lg text-neutral-900 dark:text-white focus:border-primary-600 focus:ring-2 focus:ring-primary-200 dark:focus:ring-primary-800 outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-2">
                    Role
                  </label>
                  <select
                    value={selectedAdmin.data.role}
                    onChange={(e) => {
                      const newRole = e.target.value as "viewer" | "reviewer" | "approver" | "manager" | "super_admin";
                      const permissions = getPermissionsForRole(newRole);
                      setSelectedAdmin({
                        ...selectedAdmin,
                        data: {
                          ...selectedAdmin.data,
                          role: newRole,
                          approvalLimit: permissions.approvalLimit,
                          permissions,
                        },
                      });
                    }}
                    className="w-full px-4 py-2 bg-white dark:bg-neutral-700 border-[3px] border-black dark:border-neutral-600 rounded-lg text-neutral-900 dark:text-white focus:border-primary-600 focus:ring-2 focus:ring-primary-200 dark:focus:ring-primary-800 outline-none transition-all"
                  >
                    <option value="viewer" className="bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white">Viewer</option>
                    <option value="reviewer" className="bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white">Reviewer</option>
                    <option value="approver" className="bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white">Approver</option>
                    <option value="manager" className="bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white">Manager</option>
                    {currentAdminProfile.data.role === "super_admin" && (
                      <option value="super_admin" className="bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white">Super Admin</option>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-2">
                    Approval Limit
                  </label>
                  <input
                    type="number"
                    value={selectedAdmin.data.approvalLimit}
                    readOnly
                    className="w-full px-4 py-2 border-[3px] border-black rounded-lg bg-neutral-100 dark:bg-neutral-700"
                  />
                  <p className="text-xs text-neutral-500 mt-1">
                    Automatically set based on role
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-2">
                    Department (Optional)
                  </label>
                  <input
                    type="text"
                    value={selectedAdmin.data.department || ""}
                    onChange={(e) =>
                      setSelectedAdmin({ ...selectedAdmin, data: { ...selectedAdmin.data, department: e.target.value } })
                    }
                    className="w-full px-4 py-2 bg-white dark:bg-neutral-700 border-[3px] border-black dark:border-neutral-600 rounded-lg text-neutral-900 dark:text-white focus:border-primary-600 focus:ring-2 focus:ring-primary-200 dark:focus:ring-primary-800 outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={selectedAdmin.data.isActive}
                      onChange={(e) =>
                        setSelectedAdmin({ ...selectedAdmin, data: { ...selectedAdmin.data, isActive: e.target.checked } })
                      }
                      className="w-5 h-5 border-[3px] border-black rounded"
                    />
                    <span className="text-sm font-bold text-neutral-700 dark:text-neutral-300">
                      Active
                    </span>
                  </label>
                </div>

                {/* Dynamic Permissions Management */}
                <div className="border-t-[3px] border-neutral-200 dark:border-neutral-700 pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-bold text-neutral-700 dark:text-neutral-300">
                      Permissions Management
                    </h3>
                    <button
                      type="button"
                      onClick={() => {
                        const basePermissions = getPermissionsForRole(selectedAdmin.data.role);
                        setSelectedAdmin({
                          ...selectedAdmin,
                          data: {
                            ...selectedAdmin.data,
                            permissions: basePermissions,
                          },
                        });
                      }}
                      className="text-xs text-primary-600 dark:text-primary-400 hover:underline font-semibold"
                    >
                      Reset to Role Defaults
                    </button>
                  </div>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-4">
                    Toggle individual permissions. Changes override role-based defaults.
                  </p>
                  
                  <div className="grid grid-cols-1 gap-3 max-h-80 overflow-y-auto pr-2">
                    {/* View Applications */}
                    <label className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg border-2 border-neutral-200 dark:border-neutral-700 cursor-pointer hover:border-primary-500 transition-colors">
                      <div className="flex-1">
                        <span className="text-sm font-semibold text-neutral-900 dark:text-white">View Applications</span>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">Access to view all business applications</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={selectedAdmin.data.permissions.canViewApplications}
                        onChange={(e) =>
                          setSelectedAdmin({
                            ...selectedAdmin,
                            data: {
                              ...selectedAdmin.data,
                              permissions: {
                                ...selectedAdmin.data.permissions,
                                canViewApplications: e.target.checked,
                              },
                            },
                          })
                        }
                        className="w-5 h-5 border-2 border-black dark:border-neutral-600 rounded"
                      />
                    </label>

                    {/* Review Due Diligence */}
                    <label className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg border-2 border-neutral-200 dark:border-neutral-700 cursor-pointer hover:border-primary-500 transition-colors">
                      <div className="flex-1">
                        <span className="text-sm font-semibold text-neutral-900 dark:text-white">Review Due Diligence</span>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">Perform due diligence reviews</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={selectedAdmin.data.permissions.canReviewDueDiligence}
                        onChange={(e) =>
                          setSelectedAdmin({
                            ...selectedAdmin,
                            data: {
                              ...selectedAdmin.data,
                              permissions: {
                                ...selectedAdmin.data.permissions,
                                canReviewDueDiligence: e.target.checked,
                              },
                            },
                          })
                        }
                        className="w-5 h-5 border-2 border-black dark:border-neutral-600 rounded"
                      />
                    </label>

                    {/* Request Changes */}
                    <label className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg border-2 border-neutral-200 dark:border-neutral-700 cursor-pointer hover:border-primary-500 transition-colors">
                      <div className="flex-1">
                        <span className="text-sm font-semibold text-neutral-900 dark:text-white">Request Changes</span>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">Request changes from applicants</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={selectedAdmin.data.permissions.canRequestChanges}
                        onChange={(e) =>
                          setSelectedAdmin({
                            ...selectedAdmin,
                            data: {
                              ...selectedAdmin.data,
                              permissions: {
                                ...selectedAdmin.data.permissions,
                                canRequestChanges: e.target.checked,
                              },
                            },
                          })
                        }
                        className="w-5 h-5 border-2 border-black dark:border-neutral-600 rounded"
                      />
                    </label>

                    {/* Approve Applications */}
                    <label className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg border-2 border-neutral-200 dark:border-neutral-700 cursor-pointer hover:border-primary-500 transition-colors">
                      <div className="flex-1">
                        <span className="text-sm font-semibold text-neutral-900 dark:text-white">Approve Applications</span>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">Approve/reject business applications</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={selectedAdmin.data.permissions.canApprove}
                        onChange={(e) =>
                          setSelectedAdmin({
                            ...selectedAdmin,
                            data: {
                              ...selectedAdmin.data,
                              permissions: {
                                ...selectedAdmin.data.permissions,
                                canApprove: e.target.checked,
                              },
                            },
                          })
                        }
                        className="w-5 h-5 border-2 border-black dark:border-neutral-600 rounded"
                      />
                    </label>

                    {/* Assign Reviews */}
                    <label className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg border-2 border-neutral-200 dark:border-neutral-700 cursor-pointer hover:border-primary-500 transition-colors">
                      <div className="flex-1">
                        <span className="text-sm font-semibold text-neutral-900 dark:text-white">Assign Reviews</span>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">Assign applications to reviewers</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={selectedAdmin.data.permissions.canAssignReviews}
                        onChange={(e) =>
                          setSelectedAdmin({
                            ...selectedAdmin,
                            data: {
                              ...selectedAdmin.data,
                              permissions: {
                                ...selectedAdmin.data.permissions,
                                canAssignReviews: e.target.checked,
                              },
                            },
                          })
                        }
                        className="w-5 h-5 border-2 border-black dark:border-neutral-600 rounded"
                      />
                    </label>

                    {/* Manage Admins */}
                    <label className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg border-2 border-neutral-200 dark:border-neutral-700 cursor-pointer hover:border-primary-500 transition-colors">
                      <div className="flex-1">
                        <span className="text-sm font-semibold text-neutral-900 dark:text-white">Manage Admins</span>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">Create/edit/delete admin users</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={selectedAdmin.data.permissions.canManageAdmins}
                        onChange={(e) =>
                          setSelectedAdmin({
                            ...selectedAdmin,
                            data: {
                              ...selectedAdmin.data,
                              permissions: {
                                ...selectedAdmin.data.permissions,
                                canManageAdmins: e.target.checked,
                              },
                            },
                          })
                        }
                        className="w-5 h-5 border-2 border-black dark:border-neutral-600 rounded"
                        disabled={currentAdminProfile.data.role !== "super_admin"}
                      />
                    </label>

                    {/* Access System Config */}
                    <label className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg border-2 border-neutral-200 dark:border-neutral-700 cursor-pointer hover:border-primary-500 transition-colors">
                      <div className="flex-1">
                        <span className="text-sm font-semibold text-neutral-900 dark:text-white">Access System Config</span>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">Modify system configuration</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={selectedAdmin.data.permissions.canAccessSystemConfig}
                        onChange={(e) =>
                          setSelectedAdmin({
                            ...selectedAdmin,
                            data: {
                              ...selectedAdmin.data,
                              permissions: {
                                ...selectedAdmin.data.permissions,
                                canAccessSystemConfig: e.target.checked,
                              },
                            },
                          })
                        }
                        className="w-5 h-5 border-2 border-black dark:border-neutral-600 rounded"
                        disabled={currentAdminProfile.data.role !== "super_admin"}
                      />
                    </label>

                    {/* Distribute Profits */}
                    <label className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg border-2 border-neutral-200 dark:border-neutral-700 cursor-pointer hover:border-primary-500 transition-colors">
                      <div className="flex-1">
                        <span className="text-sm font-semibold text-neutral-900 dark:text-white">Distribute Profits</span>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">Execute profit distribution to investors</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={selectedAdmin.data.permissions.canDistributeProfits}
                        onChange={(e) =>
                          setSelectedAdmin({
                            ...selectedAdmin,
                            data: {
                              ...selectedAdmin.data,
                              permissions: {
                                ...selectedAdmin.data.permissions,
                                canDistributeProfits: e.target.checked,
                              },
                            },
                          })
                        }
                        className="w-5 h-5 border-2 border-black dark:border-neutral-600 rounded"
                      />
                    </label>

                    {/* View Reports */}
                    <label className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg border-2 border-neutral-200 dark:border-neutral-700 cursor-pointer hover:border-primary-500 transition-colors">
                      <div className="flex-1">
                        <span className="text-sm font-semibold text-neutral-900 dark:text-white">View Reports</span>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">Access analytics and reports</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={selectedAdmin.data.permissions.canViewReports}
                        onChange={(e) =>
                          setSelectedAdmin({
                            ...selectedAdmin,
                            data: {
                              ...selectedAdmin.data,
                              permissions: {
                                ...selectedAdmin.data.permissions,
                                canViewReports: e.target.checked,
                              },
                            },
                          })
                        }
                        className="w-5 h-5 border-2 border-black dark:border-neutral-600 rounded"
                      />
                    </label>

                    {/* Export Data */}
                    <label className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg border-2 border-neutral-200 dark:border-neutral-700 cursor-pointer hover:border-primary-500 transition-colors">
                      <div className="flex-1">
                        <span className="text-sm font-semibold text-neutral-900 dark:text-white">Export Data</span>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">Export data to CSV/Excel</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={selectedAdmin.data.permissions.canExportData}
                        onChange={(e) =>
                          setSelectedAdmin({
                            ...selectedAdmin,
                            data: {
                              ...selectedAdmin.data,
                              permissions: {
                                ...selectedAdmin.data.permissions,
                                canExportData: e.target.checked,
                              },
                            },
                          })
                        }
                        className="w-5 h-5 border-2 border-black dark:border-neutral-600 rounded"
                      />
                    </label>

                    {/* Access Audit Logs */}
                    <label className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg border-2 border-neutral-200 dark:border-neutral-700 cursor-pointer hover:border-primary-500 transition-colors">
                      <div className="flex-1">
                        <span className="text-sm font-semibold text-neutral-900 dark:text-white">Access Audit Logs</span>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">View system audit trail</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={selectedAdmin.data.permissions.canAccessAuditLogs}
                        onChange={(e) =>
                          setSelectedAdmin({
                            ...selectedAdmin,
                            data: {
                              ...selectedAdmin.data,
                              permissions: {
                                ...selectedAdmin.data.permissions,
                                canAccessAuditLogs: e.target.checked,
                              },
                            },
                          })
                        }
                        className="w-5 h-5 border-2 border-black dark:border-neutral-600 rounded"
                      />
                    </label>

                    {/* Manage Investors */}
                    <label className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg border-2 border-neutral-200 dark:border-neutral-700 cursor-pointer hover:border-primary-500 transition-colors">
                      <div className="flex-1">
                        <span className="text-sm font-semibold text-neutral-900 dark:text-white">Manage Investors</span>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">Create/edit investor profiles</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={selectedAdmin.data.permissions.canManageInvestors}
                        onChange={(e) =>
                          setSelectedAdmin({
                            ...selectedAdmin,
                            data: {
                              ...selectedAdmin.data,
                              permissions: {
                                ...selectedAdmin.data.permissions,
                                canManageInvestors: e.target.checked,
                              },
                            },
                          })
                        }
                        className="w-5 h-5 border-2 border-black dark:border-neutral-600 rounded"
                      />
                    </label>
                  </div>
                </div>

                {/* Approval Limit (if can approve) */}
                {selectedAdmin.data.permissions.canApprove && (
                  <div className="border-t-[3px] border-neutral-200 dark:border-neutral-700 pt-4">
                    <label className="block text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-2">
                      Approval Limit (₦)
                    </label>
                    <input
                      type="number"
                      value={selectedAdmin.data.approvalLimit === Infinity ? 999999999999 : selectedAdmin.data.approvalLimit}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value);
                        setSelectedAdmin({
                          ...selectedAdmin,
                          data: {
                            ...selectedAdmin.data,
                            approvalLimit: value,
                            permissions: {
                              ...selectedAdmin.data.permissions,
                              approvalLimit: value,
                            },
                          },
                        });
                      }}
                      className="w-full px-4 py-2 bg-white dark:bg-neutral-700 border-[3px] border-black dark:border-neutral-600 rounded-lg text-neutral-900 dark:text-white focus:border-primary-600 focus:ring-2 focus:ring-primary-200 dark:focus:ring-primary-800 outline-none transition-all"
                    />
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                      Maximum amount this admin can approve (set 999999999999 for unlimited)
                    </p>
                  </div>
                )}

                {/* Custom Permissions Section */}
                <div className="border-t-[3px] border-neutral-200 dark:border-neutral-700 pt-4">
                  <h3 className="text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-3">
                    Custom Permissions
                  </h3>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-4">
                    Add custom permissions beyond the standard set. These will be stored with the admin profile.
                  </p>
                  
                  {/* Display existing custom permissions */}
                  <div className="space-y-2 mb-4">
                    {Object.entries(selectedAdmin.data.permissions)
                      .filter(([key]) => 
                        !['canViewApplications', 'canReviewDueDiligence', 'canRequestChanges', 
                         'canApprove', 'approvalLimit', 'canAssignReviews', 'canManageAdmins', 
                         'canAccessSystemConfig', 'canDistributeProfits', 'canViewReports', 
                         'canExportData', 'canAccessAuditLogs', 'canManageInvestors'].includes(key)
                      )
                      .map(([key, value]) => (
                        <div key={key} className="flex items-center justify-between p-3 bg-primary-50 dark:bg-primary-900/20 rounded-lg border-2 border-primary-300 dark:border-primary-700">
                          <div className="flex-1">
                            <span className="text-sm font-semibold text-neutral-900 dark:text-white">
                              {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                            </span>
                            <p className="text-xs text-neutral-500 dark:text-neutral-400">Custom permission</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={!!value}
                              onChange={(e) => {
                                const newPermissions = { ...selectedAdmin.data.permissions };
                                (newPermissions as Record<string, boolean | number>)[key as keyof AdminPermissions] = e.target.checked;
                                setSelectedAdmin({
                                  ...selectedAdmin,
                                  data: {
                                    ...selectedAdmin.data,
                                    permissions: newPermissions,
                                  },
                                });
                              }}
                              className="w-5 h-5 border-2 border-black dark:border-neutral-600 rounded"
                            />
                            <button
                              onClick={() => {
                                const newPermissions = { ...selectedAdmin.data.permissions };
                                delete newPermissions[key as keyof AdminPermissions];
                                setSelectedAdmin({
                                  ...selectedAdmin,
                                  data: {
                                    ...selectedAdmin.data,
                                    permissions: newPermissions,
                                  },
                                });
                              }}
                              className="text-red-600 hover:text-red-800 font-bold"
                              title="Remove custom permission"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>

                  {/* Add new custom permission */}
                  <div className="bg-neutral-50 dark:bg-neutral-800 p-4 rounded-lg border-2 border-neutral-200 dark:border-neutral-700">
                    <h4 className="text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-3">
                      Add New Custom Permission
                    </h4>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1">
                          Permission Key (camelCase)
                        </label>
                        <input
                          type="text"
                          value={customPermissionKey}
                          onChange={(e) => setCustomPermissionKey(e.target.value)}
                          placeholder="e.g., canManagePayments"
                          className="w-full px-3 py-2 text-sm bg-white dark:bg-neutral-700 border-2 border-neutral-300 dark:border-neutral-600 rounded-lg text-neutral-900 dark:text-white focus:border-primary-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1">
                          Description (Optional)
                        </label>
                        <input
                          type="text"
                          value={customPermissionDesc}
                          onChange={(e) => setCustomPermissionDesc(e.target.value)}
                          placeholder="e.g., Manage payment processing"
                          className="w-full px-3 py-2 text-sm bg-white dark:bg-neutral-700 border-2 border-neutral-300 dark:border-neutral-600 rounded-lg text-neutral-900 dark:text-white focus:border-primary-500 outline-none"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          if (!customPermissionKey.trim()) {
                            alert("Please enter a permission key");
                            return;
                          }
                          
                          // Validate camelCase format
                          if (!/^[a-z][a-zA-Z0-9]*$/.test(customPermissionKey)) {
                            alert("Permission key must be in camelCase format (start with lowercase, no spaces or special characters)");
                            return;
                          }
                          
                          const newPermissions = {
                            ...selectedAdmin.data.permissions,
                            [customPermissionKey]: false, // Default to false
                          };
                          
                          setSelectedAdmin({
                            ...selectedAdmin,
                            data: {
                              ...selectedAdmin.data,
                              permissions: newPermissions as any,
                            },
                          });
                          
                          setCustomPermissionKey("");
                          setCustomPermissionDesc("");
                          alert(`Custom permission "${customPermissionKey}" added successfully!`);
                        }}
                        className="w-full px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg border-2 border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_#10b981] hover:shadow-[2px_2px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all text-sm font-bold"
                      >
                        Add Custom Permission
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-4 mt-6">
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedAdmin(null);
                    setValidationErrors({});
                  }}
                  disabled={saving}
                  className="px-6 py-2 bg-neutral-200 dark:bg-neutral-700 text-neutral-900 dark:text-white rounded-lg border-[3px] border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_#10b981] hover:shadow-[2px_2px_0px_rgba(0,0,0,1)] dark:hover:shadow-[2px_2px_0px_#7888FF] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveAdmin}
                  disabled={saving}
                  className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg border-[3px] border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_#10b981] hover:shadow-[2px_2px_0px_rgba(0,0,0,1)] dark:hover:shadow-[2px_2px_0px_#7888FF] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {saving ? (
                    <>
                      <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Wrap with Error Boundary
export default function AdminTeamPage() {
  return (
    <ErrorBoundary>
      <AdminTeamPageContent />
    </ErrorBoundary>
  );
}
