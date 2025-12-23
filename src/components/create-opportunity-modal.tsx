"use client";

import { useState } from "react";
import { setDoc } from "@junobuild/core";
import { opportunitySchema, type OpportunityFormData } from "@/schemas";
import { validateOrThrow } from "@/utils/validation";

interface CreateOpportunityModalProps {
  adminId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateOpportunityModal({ adminId, onClose, onSuccess }: CreateOpportunityModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [formData, setFormData] = useState({
    businessName: "",
    industry: "",
    description: "",
    businessBackground: "",
    yearsInBusiness: "",
    teamSize: "",
    location: "",
    riskRating: "moderate" as "low" | "moderate" | "high",
    fundingGoal: "",
    minimumInvestment: "",
    contractType: "musharakah" as "musharakah" | "mudarabah" | "murabaha" | "ijarah",
    expectedReturnMin: "",
    expectedReturnMax: "",
    termMonths: "",
    campaignDays: "30",
    featured: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      setLoading(true);

      const today = new Date();
      const deadline = new Date(today);
      deadline.setDate(deadline.getDate() + parseInt(formData.campaignDays));

      const formatDate = (date: Date): string => {
        const day = String(date.getDate()).padStart(2, "0");
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const year = date.getFullYear();
        return `${day}-${month}-${year}`;
      };

      const opportunityData: OpportunityFormData = {
        applicationId: `manual_${Date.now()}`,
        businessId: `manual_${Date.now()}`,
        businessName: formData.businessName,
        industry: formData.industry,
        description: formData.description,
        businessBackground: formData.businessBackground || undefined,
        yearsInBusiness: formData.yearsInBusiness ? parseInt(formData.yearsInBusiness) : undefined,
        teamSize: formData.teamSize ? parseInt(formData.teamSize) : undefined,
        location: formData.location || undefined,
        riskRating: formData.riskRating,
        fundingGoal: parseFloat(formData.fundingGoal),
        currentFunding: 0,
        minimumInvestment: parseFloat(formData.minimumInvestment),
        contractType: formData.contractType,
        expectedReturnMin: parseFloat(formData.expectedReturnMin),
        expectedReturnMax: parseFloat(formData.expectedReturnMax),
        termMonths: parseInt(formData.termMonths),
        campaignDeadline: formatDate(deadline),
        featured: formData.featured,
        status: "active",
        investorCount: 0,
        createdAt: formatDate(today),
        approvedBy: adminId,
      };

      const validatedOpportunity = validateOrThrow(
        opportunitySchema,
        opportunityData,
        "Create opportunity"
      );

      console.log("Creating opportunity with data:", validatedOpportunity);

      const docKey = `opp_manual_${Date.now()}`;
      await setDoc({
        collection: "opportunities",
        doc: {
          key: docKey,
          data: validatedOpportunity,
        },
      });

      console.log("✅ Opportunity created successfully with key:", docKey);
      alert(`Investment opportunity created for ${formData.businessName}!`);
      onSuccess();
      onClose();
    } catch (err) {
      console.error("Error creating opportunity:", err);
      setError(err instanceof Error ? err.message : "Failed to create opportunity");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border-2 border-neutral-200 dark:border-neutral-800 max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-neutral-900 border-b-2 border-neutral-200 dark:border-neutral-800 p-6 flex items-center justify-between rounded-t-2xl">
          <div>
            <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-1">
              Create Investment Opportunity
            </h2>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Manually create a new investment opportunity for members
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Business Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-neutral-900 dark:text-white mb-2">
                Business Name *
              </label>
              <input
                type="text"
                required
                value={formData.businessName}
                onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border-2 border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-neutral-900 dark:text-white mb-2">
                Industry *
              </label>
              <select
                required
                value={formData.industry}
                onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border-2 border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
              >
                <option value="">Select industry</option>
                <option value="Technology">Technology</option>
                <option value="Agriculture">Agriculture</option>
                <option value="Manufacturing">Manufacturing</option>
                <option value="Retail">Retail</option>
                <option value="Services">Services</option>
                <option value="Real Estate">Real Estate</option>
                <option value="Healthcare">Healthcare</option>
                <option value="Education">Education</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-neutral-900 dark:text-white mb-2">
              Description *
            </label>
            <textarea
              required
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border-2 border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
              placeholder="Describe the investment opportunity..."
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-neutral-900 dark:text-white mb-2">
              Business Background
            </label>
            <textarea
              rows={4}
              value={formData.businessBackground}
              onChange={(e) => setFormData({ ...formData, businessBackground: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border-2 border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
              placeholder="Detailed business history, mission, achievements, market position..."
            />
          </div>

          {/* Business Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-semibold text-neutral-900 dark:text-white mb-2">
                Years in Business
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={formData.yearsInBusiness}
                onChange={(e) => setFormData({ ...formData, yearsInBusiness: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border-2 border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-neutral-900 dark:text-white mb-2">
                Team Size
              </label>
              <input
                type="number"
                min="1"
                max="10000"
                value={formData.teamSize}
                onChange={(e) => setFormData({ ...formData, teamSize: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border-2 border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-neutral-900 dark:text-white mb-2">
                Location
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border-2 border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                placeholder="e.g., Lagos, Nigeria"
              />
            </div>
          </div>

          {/* Risk Assessment */}
          <div>
            <label className="block text-sm font-semibold text-neutral-900 dark:text-white mb-2">
              Risk Rating *
            </label>
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, riskRating: "low" })}
                className={`px-4 py-3 rounded-xl border-2 font-semibold transition-all ${
                  formData.riskRating === "low"
                    ? "border-success-500 bg-success-50 dark:bg-success-900/30 text-success-700 dark:text-success-300"
                    : "border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:border-success-300"
                }`}
              >
                🟢 Low Risk
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, riskRating: "moderate" })}
                className={`px-4 py-3 rounded-xl border-2 font-semibold transition-all ${
                  formData.riskRating === "moderate"
                    ? "border-warning-500 bg-warning-50 dark:bg-warning-900/30 text-warning-700 dark:text-warning-300"
                    : "border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:border-warning-300"
                }`}
              >
                🟡 Moderate
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, riskRating: "high" })}
                className={`px-4 py-3 rounded-xl border-2 font-semibold transition-all ${
                  formData.riskRating === "high"
                    ? "border-error-500 bg-error-50 dark:bg-error-900/30 text-error-700 dark:text-error-300"
                    : "border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:border-error-300"
                }`}
              >
                🔴 High Risk
              </button>
            </div>
          </div>

          {/* Funding Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-neutral-900 dark:text-white mb-2">
                Funding Goal (₦) *
              </label>
              <input
                type="number"
                required
                min="100000"
                step="1000"
                value={formData.fundingGoal}
                onChange={(e) => setFormData({ ...formData, fundingGoal: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border-2 border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-neutral-900 dark:text-white mb-2">
                Minimum Investment (₦) *
              </label>
              <input
                type="number"
                required
                min="50000"
                step="1000"
                value={formData.minimumInvestment}
                onChange={(e) => setFormData({ ...formData, minimumInvestment: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border-2 border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
              />
            </div>
          </div>

          {/* Contract Terms */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-neutral-900 dark:text-white mb-2">
                Contract Type *
              </label>
              <select
                required
                value={formData.contractType}
                onChange={(e) => setFormData({ ...formData, contractType: e.target.value as any })}
                className="w-full px-4 py-3 rounded-xl border-2 border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
              >
                <option value="musharakah">Musharakah (Partnership)</option>
                <option value="mudarabah">Mudarabah (Profit-sharing)</option>
                <option value="murabaha">Murabaha (Cost-plus)</option>
                <option value="ijarah">Ijarah (Lease)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-neutral-900 dark:text-white mb-2">
                Term (Months) *
              </label>
              <input
                type="number"
                required
                min="6"
                max="60"
                value={formData.termMonths}
                onChange={(e) => setFormData({ ...formData, termMonths: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border-2 border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-semibold text-neutral-900 dark:text-white mb-2">
                Expected Return Min (%) *
              </label>
              <input
                type="number"
                required
                min="1"
                max="100"
                step="0.1"
                value={formData.expectedReturnMin}
                onChange={(e) => setFormData({ ...formData, expectedReturnMin: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border-2 border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-neutral-900 dark:text-white mb-2">
                Expected Return Max (%) *
              </label>
              <input
                type="number"
                required
                min="1"
                max="100"
                step="0.1"
                value={formData.expectedReturnMax}
                onChange={(e) => setFormData({ ...formData, expectedReturnMax: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border-2 border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-neutral-900 dark:text-white mb-2">
                Campaign Duration (Days) *
              </label>
              <input
                type="number"
                required
                min="1"
                max="90"
                value={formData.campaignDays}
                onChange={(e) => setFormData({ ...formData, campaignDays: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border-2 border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
              />
            </div>
          </div>

          {/* Featured Toggle */}
          <div className="flex items-center gap-3 p-4 bg-neutral-50 dark:bg-neutral-800 rounded-xl">
            <input
              type="checkbox"
              id="featured"
              checked={formData.featured}
              onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
              className="w-5 h-5 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
            />
            <label htmlFor="featured" className="text-sm font-semibold text-neutral-900 dark:text-white">
              Mark as Featured Opportunity ⭐
            </label>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-xl p-4">
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-900 dark:text-white font-bold rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-primary-600 hover:bg-primary-700 disabled:bg-neutral-300 dark:disabled:bg-neutral-700 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-lg transition-all"
            >
              {loading ? "Creating..." : "Create Opportunity"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
