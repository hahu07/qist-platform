"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { initSatellite, onAuthStateChange, setDoc, getDoc } from "@junobuild/core";
import type { User } from "@junobuild/core";

export default function AdminSetupPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>("");
  const [formData, setFormData] = useState({
    displayName: "",
    email: "",
    phoneNumber: "",
  });

  useEffect(() => {
    (async () => {
      await initSatellite({
        workers: { auth: true },
      });

      const unsubscribe = onAuthStateChange((currentUser) => {
        if (!currentUser) {
          router.push("/auth/signin");
          return;
        }

        setUser(currentUser);
        
        // Check if admin profile already exists
        (async () => {
          try {
            const existingProfile = await getDoc({
              collection: "admin_profiles",
              key: currentUser.key,
            });

            if (existingProfile) {
              // Profile exists, redirect to dashboard
              router.push("/admin/dashboard");
              return;
            }

            setLoading(false);
          } catch (err) {
            console.error("Error checking admin profile:", err);
            setLoading(false);
          }
        })();
      });

      return () => unsubscribe();
    })();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;
    
    if (!formData.displayName || !formData.email) {
      setError("Please fill in all required fields");
      return;
    }

    setSaving(true);
    setError("");

    try {
      // Create initial super_admin profile
      await setDoc({
        collection: "admin_profiles",
        doc: {
          key: user.key,
          data: {
            userId: user.key,
            displayName: formData.displayName,
            email: formData.email,
            phoneNumber: formData.phoneNumber || "",
            role: "super_admin",
            approvalLimit: 999999999999, // Unlimited for super_admin
            isActive: true,
            createdAt: Date.now(),
            createdBy: user.key, // Self-created
            permissions: {
              canManageTeam: true,
              canDistributeProfits: true,
              canApproveApplications: true,
              canManageOpportunities: true,
              canViewReports: true,
              canManageSettings: true,
            },
          },
        },
      });

      // Redirect to admin dashboard
      router.push("/admin/dashboard");
    } catch (err: any) {
      console.error("Error creating admin profile:", err);
      setError(err.message || "Failed to create admin profile");
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-primary-50/30 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary-600 mx-auto mb-4"></div>
          <p className="text-neutral-600 dark:text-neutral-400">
            Checking admin profile...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-primary-50/30 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-neutral-900 dark:text-white mb-2">
              Admin Setup
            </h1>
            <p className="text-neutral-600 dark:text-neutral-400">
              Create your Super Admin profile to access the platform
            </p>
          </div>

          {/* Setup Card */}
          <div className="bg-white dark:bg-neutral-800 rounded-xl border-[3px] border-black dark:border-primary-500 shadow-[8px_8px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_#10b981] p-8">
            <div className="mb-6">
              <div className="inline-flex items-center gap-2 bg-primary-100 dark:bg-primary-900/30 px-4 py-2 rounded-lg border-2 border-primary-600">
                <svg
                  className="w-5 h-5 text-primary-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
                <span className="font-semibold text-primary-900 dark:text-primary-100">
                  Super Administrator
                </span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Display Name */}
              <div>
                <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.displayName}
                  onChange={(e) =>
                    setFormData({ ...formData, displayName: e.target.value })
                  }
                  placeholder="John Doe"
                  className="w-full px-4 py-3 bg-white dark:bg-neutral-700 border-2 border-neutral-300 dark:border-neutral-600 rounded-lg focus:border-primary-600 focus:ring-2 focus:ring-primary-200 dark:focus:ring-primary-800 outline-none transition-all text-neutral-900 dark:text-white"
                  required
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder="admin@amana.trade"
                  className="w-full px-4 py-3 bg-white dark:bg-neutral-700 border-2 border-neutral-300 dark:border-neutral-600 rounded-lg focus:border-primary-600 focus:ring-2 focus:ring-primary-200 dark:focus:ring-primary-800 outline-none transition-all text-neutral-900 dark:text-white"
                  required
                />
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
                  Phone Number (Optional)
                </label>
                <input
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, phoneNumber: e.target.value })
                  }
                  placeholder="+234 800 000 0000"
                  className="w-full px-4 py-3 bg-white dark:bg-neutral-700 border-2 border-neutral-300 dark:border-neutral-600 rounded-lg focus:border-primary-600 focus:ring-2 focus:ring-primary-200 dark:focus:ring-primary-800 outline-none transition-all text-neutral-900 dark:text-white"
                />
              </div>

              {/* User ID Display */}
              {user && (
                <div className="bg-neutral-50 dark:bg-neutral-900/50 p-4 rounded-lg border-2 border-neutral-200 dark:border-neutral-700">
                  <p className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 mb-1">
                    Your User ID (Internet Identity)
                  </p>
                  <p className="text-sm font-mono text-neutral-700 dark:text-neutral-300 break-all">
                    {user.key}
                  </p>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-500 rounded-lg p-4">
                  <p className="text-red-700 dark:text-red-400 text-sm font-medium">
                    {error}
                  </p>
                </div>
              )}

              {/* Permissions Info */}
              <div className="bg-primary-50 dark:bg-primary-900/20 p-4 rounded-lg border-2 border-primary-200 dark:border-primary-800">
                <h3 className="font-semibold text-primary-900 dark:text-primary-100 mb-2 text-sm">
                  Super Admin Permissions:
                </h3>
                <ul className="space-y-1 text-xs text-primary-800 dark:text-primary-200">
                  <li>✓ Manage admin team (create, edit, deactivate)</li>
                  <li>✓ Approve applications with unlimited amount</li>
                  <li>✓ Create and manage investment opportunities</li>
                  <li>✓ Distribute profits to investors</li>
                  <li>✓ View all reports and analytics</li>
                  <li>✓ Configure platform settings</li>
                </ul>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={saving}
                className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-4 px-6 rounded-lg border-[3px] border-black dark:border-primary-400 shadow-[4px_4px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_#10b981] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg
                      className="animate-spin h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Creating Profile...
                  </span>
                ) : (
                  "Create Super Admin Profile"
                )}
              </button>
            </form>
          </div>

          {/* Info Note */}
          <div className="mt-6 text-center">
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              This is a one-time setup. After creating your profile, you can add other admin team members.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
