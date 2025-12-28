"use client";

import { useState, useEffect } from "react";
import {
  Assignment,
  AdminProfile,
  WorkloadStats,
} from "@/schemas";
import {
  assignApplication,
  reassignApplication,
  getAdminAssignments,
  listAdminProfiles,
  getWorkloadStats,
  autoAssignApplication,
  checkSLAStatus,
} from "@/utils/assignment-actions";

interface AssignmentManagerProps {
  applicationId: string;
  currentAssignment?: Assignment;
  onAssignmentChange?: (assignment: Assignment) => void;
}

export function AssignmentManager({
  applicationId,
  currentAssignment,
  onAssignmentChange,
}: AssignmentManagerProps) {
  const [admins, setAdmins] = useState<AdminProfile[]>([]);
  const [selectedAdmin, setSelectedAdmin] = useState<string>("");
  const [priority, setPriority] = useState<Assignment["priority"]>("medium");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAdmins();
  }, []);

  const loadAdmins = async () => {
    try {
      const profiles = await listAdminProfiles(true);
      setAdmins(profiles);
    } catch (err) {
      console.error("Failed to load admins:", err);
      setError("Failed to load admin list");
    }
  };

  const handleAssign = async () => {
    if (!selectedAdmin) {
      setError("Please select an admin");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Get current user ID (would come from auth context in real app)
      const currentUserId = "current_admin_id"; // TODO: Get from auth

      const assignment = await assignApplication({
        applicationId,
        assignedTo: selectedAdmin,
        assignedBy: currentUserId,
        priority,
        notes: notes || undefined,
      });

      onAssignmentChange?.(assignment);
      setSelectedAdmin("");
      setNotes("");
    } catch (err) {
      console.error("Assignment failed:", err);
      setError(err instanceof Error ? err.message : "Assignment failed");
    } finally {
      setLoading(false);
    }
  };

  const handleReassign = async () => {
    if (!currentAssignment || !selectedAdmin) return;

    setLoading(true);
    setError(null);

    try {
      const currentUserId = "current_admin_id"; // TODO: Get from auth

      const newAssignment = await reassignApplication({
        assignmentId: `assign_${currentAssignment.applicationId}_${currentAssignment.assignedAt}`,
        fromAssignee: currentAssignment.assignedTo,
        toAssignee: selectedAdmin,
        performedBy: currentUserId,
        reason: notes || undefined,
      });

      onAssignmentChange?.(newAssignment);
      setSelectedAdmin("");
      setNotes("");
    } catch (err) {
      console.error("Reassignment failed:", err);
      setError(err instanceof Error ? err.message : "Reassignment failed");
    } finally {
      setLoading(false);
    }
  };

  const handleAutoAssign = async () => {
    setLoading(true);
    setError(null);

    try {
      const currentUserId = "current_admin_id"; // TODO: Get from auth

      const assignment = await autoAssignApplication({
        applicationId,
        assignedBy: currentUserId,
        priority,
      });

      onAssignmentChange?.(assignment);
    } catch (err) {
      console.error("Auto-assignment failed:", err);
      setError(err instanceof Error ? err.message : "Auto-assignment failed");
    } finally {
      setLoading(false);
    }
  };

  const getAdminWorkloadColor = (admin: AdminProfile) => {
    const utilizationRate =
      admin.maxWorkload > 0
        ? (admin.currentWorkload / admin.maxWorkload) * 100
        : 0;

    if (utilizationRate >= 90) return "text-red-600";
    if (utilizationRate >= 70) return "text-amber-600";
    return "text-green-600";
  };

  const slaStatus = currentAssignment ? checkSLAStatus(currentAssignment) : null;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-4">Assignment Management</h3>

      {/* Current Assignment Display */}
      {currentAssignment && (
        <div className="bg-gradient-to-br from-primary-50/50 to-transparent dark:from-primary-900/10 dark:to-transparent rounded-xl border border-primary-200 dark:border-primary-800/30 p-6">
          <div className="space-y-2">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-semibold">Currently Assigned To:</p>
                <p className="text-lg">
                  {admins.find((a) => a.userId === currentAssignment.assignedTo)
                    ?.displayName || currentAssignment.assignedTo}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Priority
                </p>
                <span
                  className={`px-3 py-1 text-sm font-bold uppercase ${
                    currentAssignment.priority === "urgent"
                      ? "bg-red-500 text-white"
                      : currentAssignment.priority === "high"
                      ? "bg-amber-500 text-white"
                      : "bg-lavender-blue-500 text-white"
                  }`}
                >
                  {currentAssignment.priority}
                </span>
              </div>
            </div>

            <div className="flex justify-between text-sm">
              <div>
                <p className="text-gray-600 dark:text-gray-300">Status:</p>
                <p className="font-semibold uppercase">
                  {currentAssignment.status}
                </p>
              </div>
              {currentAssignment.dueDate && (
                <div className="text-right">
                  <p className="text-gray-600 dark:text-gray-300">SLA Status:</p>
                  <p
                    className={`font-semibold uppercase ${
                      slaStatus === "overdue"
                        ? "text-red-600"
                        : slaStatus === "due_soon"
                        ? "text-amber-600"
                        : "text-green-600"
                    }`}
                  >
                    {slaStatus}
                  </p>
                </div>
              )}
            </div>

            {currentAssignment.notes && (
              <div className="mt-2 pt-2 border-t-2 border-black dark:border-lavender-blue-300">
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Notes:
                </p>
                <p className="text-sm">{currentAssignment.notes}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Assignment Form */}
      <div className="space-y-4">
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 text-red-700 dark:text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Admin Selection */}
        <div>
          <label className="block text-sm font-bold mb-2">
            {currentAssignment ? "Reassign To:" : "Assign To:"}
          </label>
          <select
            value={selectedAdmin}
            onChange={(e) => setSelectedAdmin(e.target.value)}
            disabled={loading}
            className="w-full px-4 py-2.5 text-sm border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="">Select an admin...</option>
            {admins.map((admin) => {
              const utilizationRate =
                admin.maxWorkload > 0
                  ? (admin.currentWorkload / admin.maxWorkload) * 100
                  : 0;

              return (
                <option
                  key={admin.userId}
                  value={admin.userId}
                  disabled={admin.currentWorkload >= admin.maxWorkload}
                >
                  {admin.displayName} - {admin.role} (
                  {admin.currentWorkload}/{admin.maxWorkload} -{" "}
                  {utilizationRate.toFixed(0)}%)
                  {admin.currentWorkload >= admin.maxWorkload && " - AT CAPACITY"}
                </option>
              );
            })}
          </select>
        </div>

        {/* Priority Selection */}
        <div>
          <label className="block text-sm font-bold mb-2 text-neutral-900 dark:text-white">Priority:</label>
          <div className="grid grid-cols-4 gap-2">
            {(["low", "medium", "high", "urgent"] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPriority(p)}
                disabled={loading}
                className={`px-4 py-2 rounded-lg font-semibold uppercase text-xs transition-all ${
                  priority === p
                    ? "bg-primary-600 text-white"
                    : "bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700"
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-bold mb-2 text-neutral-900 dark:text-white">
            Notes {currentAssignment && "(Reason for Reassignment)"}:
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={loading}
            placeholder="Optional notes or reason for assignment..."
            rows={3}
            className="w-full px-4 py-3 text-sm border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          {currentAssignment ? (
            <button
              onClick={handleReassign}
              disabled={loading || !selectedAdmin}
              className="flex-1 px-6 py-3 bg-amber-600 hover:bg-amber-700 disabled:bg-neutral-400 disabled:cursor-not-allowed text-white font-semibold rounded-xl shadow-sm hover:shadow-md transition-all"
            >
              {loading ? "Reassigning..." : "Reassign Application"}
            </button>
          ) : (
            <>
              <button
                onClick={handleAssign}
                disabled={loading || !selectedAdmin}
                className="flex-1 px-6 py-3 bg-primary-600 hover:bg-primary-700 disabled:bg-neutral-400 disabled:cursor-not-allowed text-white font-semibold rounded-xl shadow-sm hover:shadow-md transition-all"
              >
                {loading ? "Assigning..." : "Assign Application"}
              </button>
              <button
                onClick={handleAutoAssign}
                disabled={loading}
                className="px-6 py-3 bg-success-600 hover:bg-success-700 disabled:bg-neutral-400 disabled:cursor-not-allowed text-white font-semibold rounded-xl shadow-sm hover:shadow-md transition-all"
              >
                {loading ? "Auto-Assigning..." : "Auto-Assign"}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Workload Overview */}
      <div className="mt-6 pt-6 border-t border-neutral-200 dark:border-neutral-800">
        <h4 className="text-sm font-bold text-neutral-900 dark:text-white mb-3">Admin Workload Overview</h4>
        <div className="space-y-2">
          {admins.map((admin) => {
            const utilizationRate =
              admin.maxWorkload > 0
                ? (admin.currentWorkload / admin.maxWorkload) * 100
                : 0;

            return (
              <div
                key={admin.userId}
                className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg"
              >
                <div>
                  <p className="font-semibold text-neutral-900 dark:text-white">{admin.displayName}</p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 uppercase">
                    {admin.role}
                  </p>
                </div>
                <div className="text-right">
                  <p className={`font-bold ${getAdminWorkloadColor(admin)}`}>
                    {admin.currentWorkload}/{admin.maxWorkload}
                  </p>
                  <div className="w-24 h-2 bg-gray-300 dark:bg-gray-700 mt-1">
                    <div
                      className={`h-full ${
                        utilizationRate >= 90
                          ? "bg-red-600"
                          : utilizationRate >= 70
                          ? "bg-amber-600"
                          : "bg-green-600"
                      }`}
                      style={{ width: `${Math.min(utilizationRate, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/**
 * Workload Dashboard Component
 * Displays overall workload statistics
 */
export function WorkloadDashboard() {
  const [stats, setStats] = useState<WorkloadStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
    // Refresh every 30 seconds
    const interval = setInterval(loadStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadStats = async () => {
    try {
      const workloadStats = await getWorkloadStats();
      setStats(workloadStats);
    } catch (err) {
      console.error("Failed to load workload stats:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !stats) {
    return (
      <div className="p-6 text-center border-[3px] border-black dark:border-lavender-blue-200 shadow-[8px_8px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_#7888FF]">
        Loading workload statistics...
      </div>
    );
  }

  return (
    <div className="space-y-4 border-[3px] border-black dark:border-lavender-blue-200 p-6 shadow-[8px_8px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_#7888FF]">
      <h3 className="text-xl font-bold">Workload Dashboard</h3>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-lavender-blue-100 dark:bg-lavender-blue-900 p-4 border-[3px] border-black dark:border-lavender-blue-300">
          <p className="text-sm font-bold text-gray-600 dark:text-gray-300">
            Total Applications
          </p>
          <p className="text-3xl font-bold">{stats.totalApplications}</p>
        </div>

        <div className="bg-amber-100 dark:bg-amber-900 p-4 border-[3px] border-black dark:border-amber-600">
          <p className="text-sm font-bold text-gray-600 dark:text-gray-300">
            Unassigned
          </p>
          <p className="text-3xl font-bold">{stats.unassigned}</p>
        </div>

        <div className="bg-blue-100 dark:bg-blue-900 p-4 border-[3px] border-black dark:border-blue-600">
          <p className="text-sm font-bold text-gray-600 dark:text-gray-300">
            In Review
          </p>
          <p className="text-3xl font-bold">{stats.inReview}</p>
        </div>

        <div className="bg-red-100 dark:bg-red-900 p-4 border-[3px] border-black dark:border-red-600">
          <p className="text-sm font-bold text-gray-600 dark:text-gray-300">
            Overdue SLA
          </p>
          <p className="text-3xl font-bold">{stats.overdueSLA}</p>
        </div>
      </div>

      {/* Admin Workload Table */}
      <div className="mt-6">
        <h4 className="font-bold mb-3">Team Capacity</h4>
        <div className="overflow-x-auto">
          <table className="w-full border-[3px] border-black dark:border-lavender-blue-200">
            <thead>
              <tr className="bg-lavender-blue-600 text-white">
                <th className="px-4 py-2 text-left border-r-[3px] border-black">
                  Admin
                </th>
                <th className="px-4 py-2 text-center border-r-[3px] border-black">
                  Assigned
                </th>
                <th className="px-4 py-2 text-center border-r-[3px] border-black">
                  Capacity
                </th>
                <th className="px-4 py-2 text-center">Utilization</th>
              </tr>
            </thead>
            <tbody>
              {stats.adminWorkloads.map((admin, index) => (
                <tr
                  key={admin.adminId}
                  className={
                    index % 2 === 0
                      ? "bg-white dark:bg-gray-800"
                      : "bg-gray-50 dark:bg-gray-900"
                  }
                >
                  <td className="px-4 py-2 border-r-[3px] border-black dark:border-lavender-blue-200 font-semibold">
                    {admin.displayName}
                  </td>
                  <td className="px-4 py-2 text-center border-r-[3px] border-black dark:border-lavender-blue-200">
                    {admin.assigned}
                  </td>
                  <td className="px-4 py-2 text-center border-r-[3px] border-black dark:border-lavender-blue-200">
                    {admin.capacity}
                  </td>
                  <td className="px-4 py-2 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <span
                        className={`font-bold ${
                          admin.utilizationRate >= 90
                            ? "text-red-600"
                            : admin.utilizationRate >= 70
                            ? "text-amber-600"
                            : "text-green-600"
                        }`}
                      >
                        {admin.utilizationRate.toFixed(0)}%
                      </span>
                      <div className="w-16 h-2 bg-gray-300 dark:bg-gray-700">
                        <div
                          className={`h-full ${
                            admin.utilizationRate >= 90
                              ? "bg-red-600"
                              : admin.utilizationRate >= 70
                              ? "bg-amber-600"
                              : "bg-green-600"
                          }`}
                          style={{
                            width: `${Math.min(admin.utilizationRate, 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
