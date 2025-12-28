"use client";

import { useState } from "react";
import { seedDashboardData, seedInvestmentData, seedInvestorProfile, seedNotifications } from "@/utils/seed-investment-data";

interface DataSeederProps {
  userId: string;
}

export function DataSeeder({ userId }: DataSeederProps) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [investorType, setInvestorType] = useState<"individual" | "corporate">("individual");

  const handleSeedAll = async () => {
    setLoading(true);
    setMessage("");
    
    try {
      const success = await seedDashboardData(userId, investorType);
      setMessage(success ? "✅ Successfully seeded all data!" : "❌ Failed to seed data");
    } catch (error) {
      setMessage(`❌ Error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSeedProfile = async () => {
    setLoading(true);
    setMessage("");
    
    try {
      const success = await seedInvestorProfile(userId, investorType);
      setMessage(success ? "✅ Successfully seeded profile!" : "❌ Failed to seed profile");
    } catch (error) {
      setMessage(`❌ Error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSeedInvestments = async () => {
    setLoading(true);
    setMessage("");
    
    try {
      const success = await seedInvestmentData(userId);
      setMessage(success ? "✅ Successfully seeded investments!" : "❌ Failed to seed investments");
    } catch (error) {
      setMessage(`❌ Error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSeedNotifications = async () => {
    setLoading(true);
    setMessage("");
    
    try {
      const success = await seedNotifications(userId);
      setMessage(success ? "✅ Successfully seeded notifications!" : "❌ Failed to seed notifications");
    } catch (error) {
      setMessage(`❌ Error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-white dark:bg-neutral-900 border-2 border-amber-500 dark:border-amber-600 rounded-xl shadow-2xl p-4 max-w-sm">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <h3 className="font-bold text-sm text-amber-900 dark:text-amber-100">Dev: Seed Test Data</h3>
        </div>

        <div className="space-y-2 mb-3">
          <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300">
            Investor Type:
          </label>
          <select
            value={investorType}
            onChange={(e) => setInvestorType(e.target.value as "individual" | "corporate")}
            className="w-full px-3 py-2 text-xs bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-amber-500"
            disabled={loading}
          >
            <option value="individual">Individual Investor</option>
            <option value="corporate">Corporate Investor</option>
          </select>
        </div>

        <div className="space-y-2">
          <button
            onClick={handleSeedAll}
            disabled={loading}
            className="w-full px-3 py-2 bg-amber-600 hover:bg-amber-700 disabled:bg-neutral-400 text-white text-xs font-semibold rounded-lg transition-colors"
          >
            {loading ? "Seeding..." : "Seed All Data"}
          </button>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleSeedProfile}
              disabled={loading}
              className="px-3 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-neutral-400 text-white text-xs font-medium rounded-lg transition-colors"
            >
              Profile Only
            </button>
            <button
              onClick={handleSeedInvestments}
              disabled={loading}
              className="px-3 py-2 bg-business-600 hover:bg-business-700 disabled:bg-neutral-400 text-white text-xs font-medium rounded-lg transition-colors"
            >
              Investments Only
            </button>
          </div>

          <button
            onClick={handleSeedNotifications}
            disabled={loading}
            className="w-full px-3 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-neutral-400 text-white text-xs font-medium rounded-lg transition-colors"
          >
            Notifications Only
          </button>
        </div>

        {message && (
          <div className={`mt-3 p-2 rounded-lg text-xs ${
            message.includes("✅")
              ? "bg-success-100 dark:bg-success-900/30 text-success-700 dark:text-success-300"
              : "bg-error-100 dark:bg-error-900/30 text-error-700 dark:text-error-300"
          }`}>
            {message}
          </div>
        )}

        <p className="mt-3 text-xs text-neutral-500 dark:text-neutral-400">
          User ID: <code className="font-mono text-[10px]">{userId.substring(0, 12)}...</code>
        </p>
      </div>
    </div>
  );
}
