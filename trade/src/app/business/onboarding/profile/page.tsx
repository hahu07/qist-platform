"use client";

import { ThemeToggle } from "@/components/theme-toggle";
import { AuthButton } from "@/components/auth-button";
import { initSatellite, onAuthStateChange, setDoc, listDocs, getDoc } from "@junobuild/core";
import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { businessProfileSchema, type BusinessProfile } from "@/schemas";
import { validateData } from "@/utils/validation";
import { logger } from "@/utils/logger";
import toast from "react-hot-toast";

type User = {
  key: string;
} | null | undefined;

export default function BusinessProfileOnboardingPage() {
  const [user, setUser] = useState<User>(undefined);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();
  const isEditMode = searchParams.get('edit') === 'true';
  const formSubmittedRef = useRef(false);

  // Form state
  const [businessName, setBusinessName] = useState("");
  const [businessEmail, setBusinessEmail] = useState("");
  const [businessPhone, setBusinessPhone] = useState("");
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [businessType, setBusinessType] = useState<BusinessProfile["businessType"]>("limited-liability");
  const [industry, setIndustry] = useState<BusinessProfile["industry"]>("services");
  const [yearEstablished, setYearEstablished] = useState(new Date().getFullYear());
  const [numberOfEmployees, setNumberOfEmployees] = useState(1);
  const [annualRevenue, setAnnualRevenue] = useState<number | undefined>();
  const [businessAddress, setBusinessAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [country, setCountry] = useState("Nigeria");
  const [contactPersonName, setContactPersonName] = useState("");
  const [contactPersonPosition, setContactPersonPosition] = useState("");

  useEffect(() => {
    (async () => {
      await initSatellite({ workers: { auth: true } });
    })();
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChange((authUser) => {
      setUser(authUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/signin");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      checkExistingProfile();
    }
  }, [user, isEditMode]);

  const checkExistingProfile = async () => {
    if (!user || formSubmittedRef.current) return;

    try {
      const profilesResult = await listDocs<BusinessProfile>({
        collection: "business_profiles",
      });

      const existingProfile = profilesResult.items.find(
        (doc) => doc.key === user.key || doc.data.businessEmail === user.key
      );

      if (existingProfile) {
        // If in edit mode, load the existing profile data
        if (isEditMode) {
          const profile = existingProfile.data;
          setBusinessName(profile.businessName);
          setBusinessEmail(profile.businessEmail);
          setBusinessPhone(profile.businessPhone);
          setRegistrationNumber(profile.registrationNumber);
          setBusinessType(profile.businessType);
          setIndustry(profile.industry);
          setYearEstablished(profile.yearEstablished);
          setNumberOfEmployees(profile.numberOfEmployees);
          setAnnualRevenue(profile.annualRevenue);
          setBusinessAddress(profile.businessAddress);
          setCity(profile.city);
          setState(profile.state);
          setCountry(profile.country);
          setContactPersonName(profile.contactPersonName);
          setContactPersonPosition(profile.contactPersonPosition);
          return; // Don't redirect when editing
        }
        
        // Not in edit mode - redirect based on profile status
        if (existingProfile.data.kycStatus === "pending" && !existingProfile.data.kycDocumentsUploaded) {
          router.push("/business/kyc");
        } else {
          // Profile and KYC complete, redirect to dashboard
          router.push("/business/dashboard");
        }
      }
    } catch (error) {
      logger.error("Error checking profile:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSubmitting(true);
    setError("");

    try {
      const profileData: BusinessProfile = {
        businessName,
        businessEmail,
        businessPhone,
        registrationNumber,
        businessType,
        industry,
        yearEstablished,
        numberOfEmployees,
        annualRevenue,
        businessAddress,
        city,
        state,
        country,
        contactPersonName,
        contactPersonPosition,
        kycStatus: "pending",
        kycDocumentsUploaded: false,
        accountStatus: "active",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Validate data
      const validation = validateData(businessProfileSchema, profileData);
      if (!validation.success) {
        setError(Object.values(validation.errors).join(", "));
        setSubmitting(false);
        return;
      }

      if (isEditMode) {
        // Update existing profile
        const existingDoc = await getDoc<BusinessProfile>({
          collection: "business_profiles",
          key: user.key,
        });

        await setDoc({
          collection: "business_profiles",
          doc: {
            key: user.key,
            data: {
              ...profileData,
              kycStatus: existingDoc?.data?.kycStatus || "pending",
              kycDocumentsUploaded: existingDoc?.data?.kycDocumentsUploaded || false,
              accountStatus: existingDoc?.data?.accountStatus || "active",
              createdAt: existingDoc?.data?.createdAt || new Date().toISOString(),
            },
            version: existingDoc?.version,
          },
        });

        // Mark form as submitted
        formSubmittedRef.current = true;

        // Show success message
        toast.success('Business profile updated successfully!');

        // Redirect back to dashboard
        await router.push("/business/dashboard");
      } else {
        // Create new profile - Save to Juno datastore immediately with 'pending-approval' status
        // This allows admin to see the profile even before document upload
        await setDoc({
          collection: "business_profiles",
          doc: {
            key: user.key,
            data: {
              ...profileData,
              accountStatus: 'pending-approval', // Mark as pending admin approval
            },
          },
        });
        
        // Mark form as submitted to prevent checkExistingProfile from interfering
        formSubmittedRef.current = true;
        
        // Redirect to KYC upload immediately
        await router.push("/business/kyc");
      }
    } catch (err: any) {
      logger.error("Profile creation error:", err);
      setError(err.message || "Failed to create business profile");
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-secondary-50/30 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950 flex items-center justify-center">
        <div className="text-neutral-600 dark:text-neutral-400">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-secondary-50/30 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950">
      {/* Header */}
      <header className="border-b border-neutral-200 dark:border-neutral-800 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-primary-600 to-primary-700 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">A</span>
              </div>
              <span className="font-display font-bold text-xl text-neutral-900 dark:text-white">
                AmanaTrade
              </span>
            </Link>
            <div className="flex items-center gap-4">
              <AuthButton />
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="font-display font-bold text-3xl text-neutral-900 dark:text-white mb-2">
            {isEditMode ? 'Edit Your Business Profile' : 'Create Your Business Profile'}
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400">
            {isEditMode 
              ? 'Update your business information and contact details'
              : 'Set up your business account to access KYC verification and financing opportunities'
            }
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
          </div>
        )}

        {isEditMode && (
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-blue-900 dark:text-blue-200 text-sm font-medium mb-1">Editing Business Profile</p>
                <p className="text-blue-700 dark:text-blue-300 text-xs">
                  Note: Registration Number, Business Type, and Year Established cannot be changed after initial registration for regulatory compliance.
                </p>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Business Identity */}
          <div className="bg-white dark:bg-neutral-900 rounded-xl p-6 border-2 border-neutral-200 dark:border-neutral-800">
            <h2 className="font-display font-bold text-xl text-neutral-900 dark:text-white mb-4">
              Business Identity
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Business Name *
                </label>
                <input
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  required
                  className="w-full px-4 py-2 border-2 border-neutral-300 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-secondary-500 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Registration Number (CAC/BN) *
                </label>
                <input
                  type="text"
                  value={registrationNumber}
                  onChange={(e) => setRegistrationNumber(e.target.value)}
                  required
                  disabled={isEditMode}
                  className="w-full px-4 py-2 border-2 border-neutral-300 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-secondary-500 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white disabled:opacity-60 disabled:cursor-not-allowed"
                />
                {isEditMode && (
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">Cannot be changed after registration</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Business Email *
                </label>
                <input
                  type="email"
                  value={businessEmail}
                  onChange={(e) => setBusinessEmail(e.target.value)}
                  required
                  className="w-full px-4 py-2 border-2 border-neutral-300 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-secondary-500 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Business Phone *
                </label>
                <input
                  type="tel"
                  value={businessPhone}
                  onChange={(e) => setBusinessPhone(e.target.value)}
                  required
                  className="w-full px-4 py-2 border-2 border-neutral-300 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-secondary-500 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Business Type & Industry */}
          <div className="bg-white dark:bg-neutral-900 rounded-xl p-6 border-2 border-neutral-200 dark:border-neutral-800">
            <h2 className="font-display font-bold text-xl text-neutral-900 dark:text-white mb-4">
              Business Classification
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Business Type *
                </label>
                <select
                  value={businessType}
                  onChange={(e) => setBusinessType(e.target.value as BusinessProfile["businessType"])}
                  required
                  disabled={isEditMode}
                  className="w-full px-4 py-2 border-2 border-neutral-300 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-secondary-500 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <option value="sole-proprietorship">Sole Proprietorship</option>
                  <option value="partnership">Partnership</option>
                  <option value="limited-liability">Limited Liability Company</option>
                  <option value="corporation">Corporation</option>
                  <option value="cooperative">Cooperative</option>
                  <option value="non-profit">Non-Profit</option>
                </select>
                {isEditMode && (
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">Cannot be changed after registration</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Industry *
                </label>
                <select
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value as BusinessProfile["industry"])}
                  required
                  className="w-full px-4 py-2 border-2 border-neutral-300 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-secondary-500 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
                >
                  <option value="agriculture">Agriculture</option>
                  <option value="manufacturing">Manufacturing</option>
                  <option value="retail">Retail</option>
                  <option value="services">Services</option>
                  <option value="technology">Technology</option>
                  <option value="healthcare">Healthcare</option>
                  <option value="education">Education</option>
                  <option value="construction">Construction</option>
                  <option value="hospitality">Hospitality</option>
                  <option value="transportation">Transportation</option>
                  <option value="real-estate">Real Estate</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Year Established *
                </label>
                <input
                  type="number"
                  value={yearEstablished}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    setYearEstablished(isNaN(val) ? new Date().getFullYear() : val);
                  }}
                  min={1800}
                  max={new Date().getFullYear()}
                  required
                  disabled={isEditMode}
                  className="w-full px-4 py-2 border-2 border-neutral-300 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-secondary-500 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white disabled:opacity-60 disabled:cursor-not-allowed"
                />
                {isEditMode && (
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">Historical data cannot be changed</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Number of Employees *
                </label>
                <input
                  type="number"
                  value={numberOfEmployees}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    setNumberOfEmployees(isNaN(val) ? 0 : val);
                  }}
                  min={0}
                  required
                  className="w-full px-4 py-2 border-2 border-neutral-300 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-secondary-500 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Annual Revenue (₦) - Optional
                </label>
                <input
                  type="number"
                  value={annualRevenue ?? ""}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    setAnnualRevenue(e.target.value === "" ? undefined : (isNaN(val) ? undefined : val));
                  }}
                  min={0}
                  placeholder="Enter annual revenue"
                  className="w-full px-4 py-2 border-2 border-neutral-300 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-secondary-500 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="bg-white dark:bg-neutral-900 rounded-xl p-6 border-2 border-neutral-200 dark:border-neutral-800">
            <h2 className="font-display font-bold text-xl text-neutral-900 dark:text-white mb-4">
              Business Location
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Business Address *
                </label>
                <textarea
                  value={businessAddress}
                  onChange={(e) => setBusinessAddress(e.target.value)}
                  required
                  rows={3}
                  className="w-full px-4 py-2 border-2 border-neutral-300 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-secondary-500 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    City *
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    required
                    className="w-full px-4 py-2 border-2 border-neutral-300 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-secondary-500 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    State *
                  </label>
                  <input
                    type="text"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    required
                    className="w-full px-4 py-2 border-2 border-neutral-300 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-secondary-500 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    Country *
                  </label>
                  <input
                    type="text"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    required
                    className="w-full px-4 py-2 border-2 border-neutral-300 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-secondary-500 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Contact Person */}
          <div className="bg-white dark:bg-neutral-900 rounded-xl p-6 border-2 border-neutral-200 dark:border-neutral-800">
            <h2 className="font-display font-bold text-xl text-neutral-900 dark:text-white mb-4">
              Primary Contact Person
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={contactPersonName}
                  onChange={(e) => setContactPersonName(e.target.value)}
                  required
                  className="w-full px-4 py-2 border-2 border-neutral-300 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-secondary-500 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Position/Title *
                </label>
                <input
                  type="text"
                  value={contactPersonPosition}
                  onChange={(e) => setContactPersonPosition(e.target.value)}
                  required
                  placeholder="e.g., CEO, Managing Director"
                  className="w-full px-4 py-2 border-2 border-neutral-300 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-secondary-500 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-4">
            <Link
              href="/"
              className="px-6 py-3 border-2 border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-lg font-medium hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {submitting 
                ? (isEditMode ? "Updating Profile..." : "Creating Profile...") 
                : (isEditMode ? "Save Changes" : "Continue to KYC")
              }
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
