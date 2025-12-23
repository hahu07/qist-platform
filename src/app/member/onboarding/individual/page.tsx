"use client";

import { ThemeToggle } from "@/components/theme-toggle";
import { useState, useEffect } from "react";
import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { individualInvestorSchema, type IndividualInvestor } from "@/schemas";
import { validateData, formatZodErrors } from "@/utils/validation";
import { setDoc, uploadFile, initSatellite, onAuthStateChange, getDoc } from "@junobuild/core";

type FormErrors = Record<string, string>;
export default function IndividualOnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    (async () => await initSatellite({ workers: { auth: true } }))();
  }, []);
  
  const [formData, setFormData] = useState<Partial<IndividualInvestor>>({
    investorType: "individual",
    riskProfile: "moderate",
    businessPoolAllocation: 0,
    cryptoPoolAllocation: 0,
    kycStatus: "pending",
    accredited: false,
    isPoliticallyExposed: false,
    agreeToTerms: false,
    agreeToShariah: false,
  });

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  };

  const updateNestedField = (parent: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [parent]: {
        ...(prev[parent as keyof IndividualInvestor] as any),
        [field]: value
      }
    }));
  };

  const validateStep = (currentStep: number): boolean => {
    // Clear errors first
    setErrors({});
    
    // Define required fields per step
    const stepFields: Record<number, (keyof IndividualInvestor)[]> = {
      1: ["fullName", "email", "phone", "nationality", "idType", "idNumber", "address"],
      2: ["employmentStatus", "occupation", "sourceOfFunds", "nextOfKin"],
      3: ["riskProfile"],
      4: ["agreeToTerms", "agreeToShariah"], // Agreement step
      5: [] // Review step - no additional validation
    };
    
    const fieldsToValidate = stepFields[currentStep] || [];
    const stepErrors: Record<string, string> = {};
    
    // Validate each required field for this step
    fieldsToValidate.forEach(field => {
      const value = formData[field];
      
      // For booleans in step 4 (agreements), check if they're true
      if (currentStep === 4 && typeof value === 'boolean') {
        if (!value) {
          stepErrors[field] = "You must agree to continue";
        }
        return;
      }
      
      // For numbers, check if they exist (including 0)
      if (typeof value === 'number') {
        return;
      }
      
      // For nextOfKin object, validate nested fields
      if (field === "nextOfKin" && currentStep === 2) {
        const nextOfKin = formData.nextOfKin;
        if (!nextOfKin?.fullName || nextOfKin.fullName.trim() === "") {
          stepErrors["nextOfKin.fullName"] = "Next of kin name is required";
        }
        if (!nextOfKin?.phone || nextOfKin.phone.trim() === "") {
          stepErrors["nextOfKin.phone"] = "Next of kin phone is required";
        }
        return;
      }
      
      if (value === undefined || value === null || value === "") {
        stepErrors[field] = "This field is required";
      }
    });
    
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      return false;
    }
    
    return true;
  };

  const nextStep = () => {
    console.log("=== Next Step Clicked ===");
    console.log("Current step before validation:", step);
    if (validateStep(step)) {
      if (step < 5) {
        console.log("Moving to step:", step + 1);
        setStep(step + 1);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } else {
      // Scroll to first error
      const firstErrorField = Object.keys(errors)[0];
      const element = document.querySelector(`[name="${firstErrorField}"], #${firstErrorField}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };

  const prevStep = () => {
    if (step > 1) {
      setStep(step - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    console.log("=== HANDLE SUBMIT CALLED ===");
    console.log("Current step:", step);
    e.preventDefault();
    
    // Only allow submission on step 5 (Review & Submit)
    if (step !== 5) {
      console.log("Form submission BLOCKED - not on review step. Current step:", step);
      return;
    }
    
    console.log("Form submission ALLOWED - proceeding with validation");
    
    // Final validation
    const result = validateData(individualInvestorSchema, formData);
    
    if (!result.success) {
      setErrors(result.errors);
      alert("Please fix the errors before submitting");
      return;
    }

    try {
      setLoading(true);
      
      // Get current user
      let unsubscribe: (() => void) | undefined;
      
      unsubscribe = onAuthStateChange(async (user) => {
        if (!user) {
          setErrors({ submit: "You must be signed in to complete onboarding." });
          setLoading(false);
          return;
        }
        
        unsubscribe?.();
        
        try {
          // Check if profile already exists to get version
          const existingDoc = await getDoc({
            collection: "individual_investor_profiles",
            key: user.key
          });
          
          // Save to Juno using user's key
          await setDoc({
            collection: "individual_investor_profiles",
            doc: {
              key: user.key,
              data: result.data,
              ...(existingDoc && { version: existingDoc.version })
            }
          });

          // Redirect to success page
          router.push("/member/onboarding/success");
        } catch (err) {
          console.error("Error saving profile:", err);
          setErrors({ submit: "Failed to submit application. Please try again." });
          setLoading(false);
        }
      });
    } catch (error) {
      console.error("Error getting user:", error);
      setErrors({ submit: "Authentication error. Please try again." });
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-950 dark:to-neutral-900">
      {/* Header */}
      <header className="border-b-2 border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/member/onboarding" className="text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <Link href="/" className="flex items-center gap-2">
                <div className="w-8 h-8 bg-primary-600 dark:bg-primary-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">A</span>
                </div>
                <span className="font-display font-bold text-xl text-neutral-900 dark:text-white">
                  AmanaTrade
                </span>
              </Link>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="bg-white dark:bg-neutral-900 border-b-2 border-neutral-200 dark:border-neutral-800">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center">
            {[
              { num: 1, label: "Personal Info" },
              { num: 2, label: "Employment" },
              { num: 3, label: "Preferences" },
              { num: 4, label: "Agreement" },
              { num: 5, label: "Review" }
            ].map((s, index) => (
              <React.Fragment key={s.num}>
                <div className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${
                    s.num < step ? "bg-success-600 text-white" :
                    s.num === step ? "bg-primary-600 text-white" :
                    "bg-neutral-200 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-400"
                  }`}>
                    {s.num < step ? "✓" : s.num}
                  </div>
                  <span className="text-xs mt-2 text-neutral-600 dark:text-neutral-400 text-center whitespace-nowrap">
                    {s.label}
                  </span>
                </div>
                {index < 4 && (
                  <div className={`flex-1 h-1 mx-2 rounded ${
                    s.num < step ? "bg-success-600" : "bg-neutral-200 dark:bg-neutral-700"
                  }`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      {/* Main Form */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form 
          onSubmit={handleSubmit}
          onKeyDown={(e) => {
            // Prevent Enter key from submitting form unless on review step
            if (e.key === 'Enter' && step !== 5) {
              e.preventDefault();
            }
          }}
        >
          {/* Error Banner */}
          {Object.keys(errors).length > 0 && (
            <div className="mb-6 p-4 bg-error-50 dark:bg-error-900/20 border-2 border-error-600 dark:border-error-400 rounded-lg">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-error-600 dark:text-error-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-error-900 dark:text-error-100 mb-1">
                    Please fix the following errors:
                  </h3>
                  <ul className="text-sm text-error-800 dark:text-error-200 list-disc list-inside space-y-1">
                    {Object.entries(errors).map(([field, message]) => (
                      <li key={field}>{message}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Step 1: Personal Information */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="font-display font-bold text-3xl text-neutral-900 dark:text-white mb-2">
                  Personal Information
                </h2>
                <p className="text-neutral-600 dark:text-neutral-400">
                  Tell us about yourself to get started
                </p>
              </div>

              <div className="bg-white dark:bg-neutral-900 rounded-xl border-2 border-neutral-200 dark:border-neutral-800 p-6 space-y-6">
                {/* Full Name */}
                <div>
                  <label className="block text-sm font-semibold text-neutral-900 dark:text-white mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={formData.fullName || ""}
                    onChange={(e) => updateField("fullName", e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border-2 border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:border-primary-600 dark:focus:border-primary-400 focus:ring-2 focus:ring-primary-600/20 outline-none transition-colors"
                    placeholder="Enter your full legal name"
                  />
                  {errors.fullName && <p className="mt-1 text-sm text-error-600 dark:text-error-400">{errors.fullName}</p>}
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-semibold text-neutral-900 dark:text-white mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    value={formData.email || ""}
                    onChange={(e) => updateField("email", e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border-2 border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:border-primary-600 dark:focus:border-primary-400 focus:ring-2 focus:ring-primary-600/20 outline-none transition-colors"
                    placeholder="your.email@example.com"
                  />
                  {errors.email && <p className="mt-1 text-sm text-error-600 dark:text-error-400">{errors.email}</p>}
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-semibold text-neutral-900 dark:text-white mb-2">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    value={formData.phone || ""}
                    onChange={(e) => updateField("phone", e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border-2 border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:border-primary-600 dark:focus:border-primary-400 focus:ring-2 focus:ring-primary-600/20 outline-none transition-colors"
                    placeholder="+1234567890"
                  />
                  {errors.phone && <p className="mt-1 text-sm text-error-600 dark:text-error-400">{errors.phone}</p>}
                </div>

                {/* Date of Birth */}
                <div>
                  <label className="block text-sm font-semibold text-neutral-900 dark:text-white mb-2">
                    Date of Birth 
                  </label>
                  <input
                    type="date"
                    value={formData.dateOfBirth ? formData.dateOfBirth.split('-').reverse().join('-') : ""}
                    onChange={(e) => {
                      const dateValue = e.target.value;
                      if (dateValue) {
                        const [year, month, day] = dateValue.split('-');
                        const ddmmyyyy = `${day}-${month}-${year}`;
                        updateField("dateOfBirth", ddmmyyyy);
                      } else {
                        updateField("dateOfBirth", "");
                      }
                    }}
                    className="w-full px-4 py-3 rounded-lg border-2 border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:border-primary-600 dark:focus:border-primary-400 focus:ring-2 focus:ring-primary-600/20 outline-none transition-colors"
                  />
                  {errors.dateOfBirth && <p className="mt-1 text-sm text-error-600 dark:text-error-400">{errors.dateOfBirth}</p>}
                </div>

                {/* Nationality */}
                <div>
                  <label className="block text-sm font-semibold text-neutral-900 dark:text-white mb-2">
                    Nationality *
                  </label>
                  <input
                    type="text"
                    value={formData.nationality || ""}
                    onChange={(e) => updateField("nationality", e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border-2 border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:border-primary-600 dark:focus:border-primary-400 focus:ring-2 focus:ring-primary-600/20 outline-none transition-colors"
                    placeholder="e.g., United States"
                  />
                  {errors.nationality && <p className="mt-1 text-sm text-error-600 dark:text-error-400">{errors.nationality}</p>}
                </div>

                {/* ID Type */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-neutral-900 dark:text-white mb-2">
                      ID Type *
                    </label>
                    <select
                      value={formData.idType || ""}
                      onChange={(e) => updateField("idType", e.target.value)}
                      className="w-full px-4 py-3 rounded-lg border-2 border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:border-primary-600 dark:focus:border-primary-400 focus:ring-2 focus:ring-primary-600/20 outline-none transition-colors"
                    >
                      <option value="">Select ID type</option>
                      <option value="passport">Passport</option>
                      <option value="national-id">National ID</option>
                      <option value="drivers-license">Driver's License</option>
                    </select>
                    {errors.idType && <p className="mt-1 text-sm text-error-600 dark:text-error-400">{errors.idType}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-neutral-900 dark:text-white mb-2">
                      ID Number *
                    </label>
                    <input
                      type="text"
                      value={formData.idNumber || ""}
                      onChange={(e) => updateField("idNumber", e.target.value)}
                      className="w-full px-4 py-3 rounded-lg border-2 border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:border-primary-600 dark:focus:border-primary-400 focus:ring-2 focus:ring-primary-600/20 outline-none transition-colors"
                      placeholder="ID number"
                    />
                    {errors.idNumber && <p className="mt-1 text-sm text-error-600 dark:text-error-400">{errors.idNumber}</p>}
                  </div>
                </div>

                {/* ID Expiry Date */}
                <div>
                  <label className="block text-sm font-semibold text-neutral-900 dark:text-white mb-2">
                    ID Expiry Date 
                  </label>
                  <input
                    type="date"
                    value={formData.idExpiryDate ? formData.idExpiryDate.split('-').reverse().join('-') : ""}
                    onChange={(e) => {
                      const dateValue = e.target.value;
                      if (dateValue) {
                        const [year, month, day] = dateValue.split('-');
                        const ddmmyyyy = `${day}-${month}-${year}`;
                        updateField("idExpiryDate", ddmmyyyy);
                      } else {
                        updateField("idExpiryDate", "");
                      }
                    }}
                    className="w-full px-4 py-3 rounded-lg border-2 border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:border-primary-600 dark:focus:border-primary-400 focus:ring-2 focus:ring-primary-600/20 outline-none transition-colors"
                  />
                  {errors.idExpiryDate && <p className="mt-1 text-sm text-error-600 dark:text-error-400">{errors.idExpiryDate}</p>}
                </div>

                {/* Address */}
                <div className="border-t-2 border-neutral-200 dark:border-neutral-800 pt-6">
                  <h3 className="font-bold text-lg text-neutral-900 dark:text-white mb-4">
                    Residential Address
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-neutral-900 dark:text-white mb-2">
                        Street Address *
                      </label>
                      <input
                        type="text"
                        value={formData.address?.street || ""}
                        onChange={(e) => updateNestedField("address", "street", e.target.value)}
                        className="w-full px-4 py-3 rounded-lg border-2 border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:border-primary-600 dark:focus:border-primary-400 focus:ring-2 focus:ring-primary-600/20 outline-none transition-colors"
                        placeholder="123 Main Street, Apt 4B"
                      />
                      {errors["address.street"] && <p className="mt-1 text-sm text-error-600 dark:text-error-400">{errors["address.street"]}</p>}
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-neutral-900 dark:text-white mb-2">
                          City *
                        </label>
                        <input
                          type="text"
                          value={formData.address?.city || ""}
                          onChange={(e) => updateNestedField("address", "city", e.target.value)}
                          className="w-full px-4 py-3 rounded-lg border-2 border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:border-primary-600 dark:focus:border-primary-400 focus:ring-2 focus:ring-primary-600/20 outline-none transition-colors"
                          placeholder="City"
                        />
                        {errors["address.city"] && <p className="mt-1 text-sm text-error-600 dark:text-error-400">{errors["address.city"]}</p>}
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-neutral-900 dark:text-white mb-2">
                          State/Province
                        </label>
                        <input
                          type="text"
                          value={formData.address?.state || ""}
                          onChange={(e) => updateNestedField("address", "state", e.target.value)}
                          className="w-full px-4 py-3 rounded-lg border-2 border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:border-primary-600 dark:focus:border-primary-400 focus:ring-2 focus:ring-primary-600/20 outline-none transition-colors"
                          placeholder="State/Province"
                        />
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-neutral-900 dark:text-white mb-2">
                          Postal Code 
                        </label>
                        <input
                          type="text"
                          value={formData.address?.postalCode || ""}
                          onChange={(e) => updateNestedField("address", "postalCode", e.target.value)}
                          className="w-full px-4 py-3 rounded-lg border-2 border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:border-primary-600 dark:focus:border-primary-400 focus:ring-2 focus:ring-primary-600/20 outline-none transition-colors"
                          placeholder="Postal code"
                        />
                        {errors["address.postalCode"] && <p className="mt-1 text-sm text-error-600 dark:text-error-400">{errors["address.postalCode"]}</p>}
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-neutral-900 dark:text-white mb-2">
                          Country *
                        </label>
                        <input
                          type="text"
                          value={formData.address?.country || formData.country || ""}
                          onChange={(e) => {
                            updateNestedField("address", "country", e.target.value);
                            updateField("country", e.target.value);
                          }}
                          className="w-full px-4 py-3 rounded-lg border-2 border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:border-primary-600 dark:focus:border-primary-400 focus:ring-2 focus:ring-primary-600/20 outline-none transition-colors"
                          placeholder="Country"
                        />
                        {errors["address.country"] && <p className="mt-1 text-sm text-error-600 dark:text-error-400">{errors["address.country"]}</p>}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Employment & Financial Information */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="font-display font-bold text-3xl text-neutral-900 dark:text-white mb-2">
                  Employment & Financial Information
                </h2>
                <p className="text-neutral-600 dark:text-neutral-400">
                  Help us understand your financial background
                </p>
              </div>

              <div className="bg-white dark:bg-neutral-900 rounded-xl border-2 border-neutral-200 dark:border-neutral-800 p-6 space-y-6">
                {/* Employment Status */}
                <div>
                  <label className="block text-sm font-semibold text-neutral-900 dark:text-white mb-2">
                    Employment Status *
                  </label>
                  <select
                    value={formData.employmentStatus || ""}
                    onChange={(e) => updateField("employmentStatus", e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border-2 border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:border-primary-600 dark:focus:border-primary-400 focus:ring-2 focus:ring-primary-600/20 outline-none transition-colors"
                  >
                    <option value="">Select status</option>
                    <option value="employed">Employed</option>
                    <option value="self-employed">Self-Employed</option>
                    <option value="retired">Retired</option>
                    <option value="unemployed">Unemployed</option>
                    <option value="student">Student</option>
                  </select>
                  {errors.employmentStatus && <p className="mt-1 text-sm text-error-600 dark:text-error-400">{errors.employmentStatus}</p>}
                </div>

                {/* Occupation */}
                <div>
                  <label className="block text-sm font-semibold text-neutral-900 dark:text-white mb-2">
                    Occupation *
                  </label>
                  <input
                    type="text"
                    value={formData.occupation || ""}
                    onChange={(e) => updateField("occupation", e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border-2 border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:border-primary-600 dark:focus:border-primary-400 focus:ring-2 focus:ring-primary-600/20 outline-none transition-colors"
                    placeholder="Your occupation or profession"
                  />
                  {errors.occupation && <p className="mt-1 text-sm text-error-600 dark:text-error-400">{errors.occupation}</p>}
                </div>

                {/* Employer (conditional) */}
                {(formData.employmentStatus === "employed" || formData.employmentStatus === "self-employed") && (
                  <div>
                    <label className="block text-sm font-semibold text-neutral-900 dark:text-white mb-2">
                      Employer / Company Name
                    </label>
                    <input
                      type="text"
                      value={formData.employer || ""}
                      onChange={(e) => updateField("employer", e.target.value)}
                      className="w-full px-4 py-3 rounded-lg border-2 border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:border-primary-600 dark:focus:border-primary-400 focus:ring-2 focus:ring-primary-600/20 outline-none transition-colors"
                      placeholder="Company name"
                    />
                  </div>
                )}

                {/* Source of Funds */}
                <div>
                  <label className="block text-sm font-semibold text-neutral-900 dark:text-white mb-2">
                    Primary Source of Funds *
                  </label>
                  <select
                    value={formData.sourceOfFunds || ""}
                    onChange={(e) => updateField("sourceOfFunds", e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border-2 border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:border-primary-600 dark:focus:border-primary-400 focus:ring-2 focus:ring-primary-600/20 outline-none transition-colors"
                  >
                    <option value="">Select source</option>
                    <option value="salary">Salary/Wages</option>
                    <option value="business-income">Business Income</option>
                    <option value="investments">Investment Returns</option>
                    <option value="inheritance">Inheritance</option>
                    <option value="savings">Savings</option>
                    <option value="other">Other</option>
                  </select>
                  {errors.sourceOfFunds && <p className="mt-1 text-sm text-error-600 dark:text-error-400">{errors.sourceOfFunds}</p>}
                </div>

                {/* Politically Exposed Person */}
                <div className="flex items-start gap-3 p-4 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                  <input
                    type="checkbox"
                    id="pep"
                    checked={formData.isPoliticallyExposed || false}
                    onChange={(e) => updateField("isPoliticallyExposed", e.target.checked)}
                    className="mt-1 w-5 h-5 rounded border-2 border-neutral-300 dark:border-neutral-600 text-primary-600 focus:ring-2 focus:ring-primary-600/20"
                  />
                  <label htmlFor="pep" className="text-sm text-neutral-700 dark:text-neutral-300">
                    <span className="font-semibold block mb-1">Politically Exposed Person (PEP)</span>
                    I am, or have been in the past 12 months, a senior political figure, government official, or close associate/family member of such a person.
                  </label>
                </div>

                {/* Next of Kin */}
                <div>
                  <h3 className="font-semibold text-lg text-neutral-900 dark:text-white mb-4">
                    Next of Kin
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-neutral-900 dark:text-white mb-2">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        value={formData.nextOfKin?.fullName || ""}
                        onChange={(e) => updateNestedField("nextOfKin", "fullName", e.target.value)}
                        className="w-full px-4 py-3 rounded-lg border-2 border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:border-primary-600 dark:focus:border-primary-400 focus:ring-2 focus:ring-primary-600/20 outline-none transition-colors"
                        placeholder="Next of kin full name"
                      />
                      {errors["nextOfKin.fullName"] && <p className="mt-1 text-sm text-error-600 dark:text-error-400">{errors["nextOfKin.fullName"]}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-neutral-900 dark:text-white mb-2">
                        Phone Number *
                      </label>
                      <input
                        type="tel"
                        value={formData.nextOfKin?.phone || ""}
                        onChange={(e) => updateNestedField("nextOfKin", "phone", e.target.value)}
                        className="w-full px-4 py-3 rounded-lg border-2 border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:border-primary-600 dark:focus:border-primary-400 focus:ring-2 focus:ring-primary-600/20 outline-none transition-colors"
                        placeholder="Contact number"
                      />
                      {errors["nextOfKin.phone"] && <p className="mt-1 text-sm text-error-600 dark:text-error-400">{errors["nextOfKin.phone"]}</p>}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Investment Preferences */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="font-display font-bold text-3xl text-neutral-900 dark:text-white mb-2">
                  Investment Preferences
                </h2>
                <p className="text-neutral-600 dark:text-neutral-400">
                  Help us understand your investment approach and risk tolerance
                </p>
              </div>

              <div className="bg-white dark:bg-neutral-900 rounded-xl border-2 border-neutral-200 dark:border-neutral-800 p-6 space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-neutral-900 dark:text-white mb-3">
                    Risk Tolerance *
                  </label>
                  <div className="grid gap-4">
                    <label className={`relative flex items-start p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                      formData.riskProfile === 'conservative' 
                        ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20' 
                        : 'border-neutral-300 dark:border-neutral-700 hover:border-neutral-400 dark:hover:border-neutral-600'
                    }`}>
                      <input
                        type="radio"
                        name="riskProfile"
                        value="conservative"
                        checked={formData.riskProfile === 'conservative'}
                        onChange={(e) => updateField('riskProfile', e.target.value)}
                        className="mt-1 w-5 h-5 text-primary-600 focus:ring-2 focus:ring-primary-600/20"
                      />
                      <div className="ml-3 flex-1">
                        <div className="font-semibold text-neutral-900 dark:text-white">Conservative</div>
                        <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                          Focus on capital preservation with lower-risk Shariah-compliant investments. Expects stable, modest returns with minimal volatility.
                        </p>
                        <div className="mt-2 text-xs text-neutral-500 dark:text-neutral-500">
                          • Lower risk exposure • Stable returns • Capital protection priority
                        </div>
                      </div>
                    </label>

                    <label className={`relative flex items-start p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                      formData.riskProfile === 'moderate' 
                        ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20' 
                        : 'border-neutral-300 dark:border-neutral-700 hover:border-neutral-400 dark:hover:border-neutral-600'
                    }`}>
                      <input
                        type="radio"
                        name="riskProfile"
                        value="moderate"
                        checked={formData.riskProfile === 'moderate'}
                        onChange={(e) => updateField('riskProfile', e.target.value)}
                        className="mt-1 w-5 h-5 text-primary-600 focus:ring-2 focus:ring-primary-600/20"
                      />
                      <div className="ml-3 flex-1">
                        <div className="font-semibold text-neutral-900 dark:text-white">Moderate</div>
                        <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                          Balanced approach between growth and stability. Comfortable with moderate market fluctuations for better long-term returns.
                        </p>
                        <div className="mt-2 text-xs text-neutral-500 dark:text-neutral-500">
                          • Balanced risk-return • Diversified portfolio • Medium-term growth focus
                        </div>
                      </div>
                    </label>

                    <label className={`relative flex items-start p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                      formData.riskProfile === 'aggressive' 
                        ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20' 
                        : 'border-neutral-300 dark:border-neutral-700 hover:border-neutral-400 dark:hover:border-neutral-600'
                    }`}>
                      <input
                        type="radio"
                        name="riskProfile"
                        value="aggressive"
                        checked={formData.riskProfile === 'aggressive'}
                        onChange={(e) => updateField('riskProfile', e.target.value)}
                        className="mt-1 w-5 h-5 text-primary-600 focus:ring-2 focus:ring-primary-600/20"
                      />
                      <div className="ml-3 flex-1">
                        <div className="font-semibold text-neutral-900 dark:text-white">Aggressive</div>
                        <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                          Growth-oriented strategy accepting higher volatility for potential superior returns. Long investment horizon with high risk tolerance.
                        </p>
                        <div className="mt-2 text-xs text-neutral-500 dark:text-neutral-500">
                          • Higher risk tolerance • Growth focused • Long-term horizon • Maximum return potential
                        </div>
                      </div>
                    </label>
                  </div>
                  {errors.riskProfile && <p className="mt-2 text-sm text-error-600 dark:text-error-400">{errors.riskProfile}</p>}
                </div>

                <div className="border-t-2 border-neutral-200 dark:border-neutral-800 pt-6">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.accredited || false}
                      onChange={(e) => updateField("accredited", e.target.checked)}
                      className="w-5 h-5 mt-0.5 rounded border-2 border-neutral-300 dark:border-neutral-700 text-primary-600 focus:ring-2 focus:ring-primary-600/20"
                    />
                    <div>
                      <span className="text-sm font-semibold text-neutral-900 dark:text-white block">
                        Accredited Investor Status
                      </span>
                      <span className="text-sm text-neutral-600 dark:text-neutral-400">
                        I qualify as an accredited investor with higher investment capacity and financial sophistication
                      </span>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Contractual Agreement */}
          {step === 4 && (
            <div className="space-y-6">
              <div>
                <h2 className="font-display font-bold text-3xl text-neutral-900 dark:text-white mb-2">
                  Investment Service Agreement
                </h2>
                <p className="text-neutral-600 dark:text-neutral-400">
                  Review and accept the terms of service
                </p>
              </div>

              <div className="bg-white dark:bg-neutral-900 rounded-xl border-2 border-neutral-200 dark:border-neutral-800 p-6 space-y-6">
                <div className="bg-neutral-50 dark:bg-neutral-800 rounded-lg p-6 max-h-96 overflow-y-auto border border-neutral-200 dark:border-neutral-700">
                  <h3 className="font-semibold text-lg text-neutral-900 dark:text-white mb-4">
                    AmanaTrade Platform Service Agreement
                  </h3>
                  
                  <div className="prose prose-sm dark:prose-invert max-w-none space-y-4 text-neutral-700 dark:text-neutral-300">
                    <section>
                      <h4 className="font-semibold text-neutral-900 dark:text-white">1. Nature of Services</h4>
                      <p>
                        AmanaTrade is the trading name and digital platform of AmanaTrader Cooperative Society, a pure investment cooperative duly registered with the Corporate Affairs Commission. 
                        We provide Shariah-compliant investment opportunities through Business Pool (financing businesses via profit-sharing contracts) and Crypto Pool (halal cryptocurrency investing). 
                        The platform acts as an intermediary connecting member-investors with vetted business opportunities.
                      </p>
                    </section>

                    <section>
                      <h4 className="font-semibold text-neutral-900 dark:text-white">2. Investment Structure</h4>
                      <p>
                        All investments follow Islamic finance principles with pre-agreed profit-sharing ratios. 
                        Investments are diversified across multiple businesses to manage risk. You may participate in:
                      </p>
                      <ul className="list-disc ml-6 space-y-1">
                        <li>Business Pool: Market-return focused Shariah-compliant investments in businesses</li>
                        <li>Crypto Pool: Halal cryptocurrency investment opportunities</li>
                      </ul>
                    </section>

                    <section>
                      <h4 className="font-semibold text-neutral-900 dark:text-white">3. Risk Disclosure</h4>
                      <p>
                        All investments carry risk. Past performance does not guarantee future results. You may lose some or all of your invested capital. 
                        The platform does not guarantee returns and is not responsible for business performance beyond conducting due diligence.
                      </p>
                    </section>

                    <section>
                      <h4 className="font-semibold text-neutral-900 dark:text-white">4. Fees and Charges</h4>
                      <p>
                        Platform fees are deducted from profits earned, not from principal. Fee structure:
                      </p>
                      <ul className="list-disc ml-6 space-y-1">
                        <li>Management Fee: [X]% of profits annually</li>
                        <li>Performance Fee: [Y]% of returns above benchmark</li>
                        <li>No withdrawal fees for standard redemptions</li>
                      </ul>
                    </section>

                    <section>
                      <h4 className="font-semibold text-neutral-900 dark:text-white">5. Shariah Compliance</h4>
                      <p>
                        All investments are screened and monitored by our Shariah Advisory Board. We commit to:
                      </p>
                      <ul className="list-disc ml-6 space-y-1">
                        <li>Avoiding prohibited (haram) business activities</li>
                        <li>No interest-based (riba) transactions</li>
                        <li>Transparent business-sharing arrangements</li>
                        <li>Regular Shariah compliance audits</li>
                      </ul>
                    </section>

                    <section>
                      <h4 className="font-semibold text-neutral-900 dark:text-white">6. Rights and Responsibilities</h4>
                      <p>
                        You have the right to receive regular performance reports, access to your investment dashboard, and the ability to redeem investments 
                        subject to lock-in periods. You are responsible for providing accurate information and understanding the risks involved.
                      </p>
                    </section>

                    <section>
                      <h4 className="font-semibold text-neutral-900 dark:text-white">7. Data Privacy</h4>
                      <p>
                        Your personal information is protected according to our Privacy Policy. We use blockchain technology to ensure 
                        data integrity while maintaining confidentiality.
                      </p>
                    </section>

                    <section>
                      <h4 className="font-semibold text-neutral-900 dark:text-white">8. Termination</h4>
                      <p>
                        Either party may terminate this agreement with [X] days notice. Existing investments will continue until their maturity or redemption period.
                      </p>
                    </section>
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="flex items-start gap-3 cursor-pointer p-4 border-2 border-neutral-200 dark:border-neutral-700 rounded-lg hover:border-primary-600 dark:hover:border-primary-400 transition-colors">
                    <input
                      type="checkbox"
                      checked={formData.agreeToTerms || false}
                      onChange={(e) => updateField("agreeToTerms", e.target.checked)}
                      className="w-5 h-5 mt-0.5 rounded border-2 border-neutral-300 dark:border-neutral-700 text-primary-600 focus:ring-2 focus:ring-primary-600/20"
                    />
                    <span className="text-sm text-neutral-700 dark:text-neutral-300">
                      I have read, understood, and agree to the Investment Service Agreement and{" "}
                      <Link href="/terms" className="text-primary-600 dark:text-primary-400 hover:underline font-semibold">
                        Terms & Conditions
                      </Link>
                    </span>
                  </label>
                  {errors.agreeToTerms && <p className="text-sm text-error-600 dark:text-error-400">{errors.agreeToTerms}</p>}

                  <label className="flex items-start gap-3 cursor-pointer p-4 border-2 border-neutral-200 dark:border-neutral-700 rounded-lg hover:border-primary-600 dark:hover:border-primary-400 transition-colors">
                    <input
                      type="checkbox"
                      checked={formData.agreeToShariah || false}
                      onChange={(e) => updateField("agreeToShariah", e.target.checked)}
                      className="w-5 h-5 mt-0.5 rounded border-2 border-neutral-300 dark:border-neutral-700 text-primary-600 focus:ring-2 focus:ring-primary-600/20"
                    />
                    <span className="text-sm text-neutral-700 dark:text-neutral-300">
                      I acknowledge that all investments will be Shariah-compliant and agree to the{" "}
                      <Link href="/shariah" className="text-primary-600 dark:text-primary-400 hover:underline font-semibold">
                        Shariah Compliance Guidelines
                      </Link>
                    </span>
                  </label>
                  {errors.agreeToShariah && <p className="text-sm text-error-600 dark:text-error-400">{errors.agreeToShariah}</p>}
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Review & Submit */}
          {step === 5 && (
            <div className="space-y-6">
              <div>
                <h2 className="font-display font-bold text-3xl text-neutral-900 dark:text-white mb-2">
                  Review & Submit
                </h2>
                <p className="text-neutral-600 dark:text-neutral-400">
                  Please review your information before submitting
                </p>
              </div>

              <div className="bg-white dark:bg-neutral-900 rounded-xl border-2 border-neutral-200 dark:border-neutral-800 p-6 space-y-6">
                {/* Personal Info Summary */}
                <div>
                  <h3 className="font-bold text-lg text-neutral-900 dark:text-white mb-3">
                    Personal Information
                  </h3>
                  <dl className="grid md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <dt className="text-neutral-600 dark:text-neutral-400">Full Name</dt>
                      <dd className="font-semibold text-neutral-900 dark:text-white">{formData.fullName}</dd>
                    </div>
                    <div>
                      <dt className="text-neutral-600 dark:text-neutral-400">Email</dt>
                      <dd className="font-semibold text-neutral-900 dark:text-white">{formData.email}</dd>
                    </div>
                    <div>
                      <dt className="text-neutral-600 dark:text-neutral-400">Phone</dt>
                      <dd className="font-semibold text-neutral-900 dark:text-white">{formData.phone}</dd>
                    </div>
                    <div>
                      <dt className="text-neutral-600 dark:text-neutral-400">Date of Birth</dt>
                      <dd className="font-semibold text-neutral-900 dark:text-white">{formData.dateOfBirth}</dd>
                    </div>
                    <div>
                      <dt className="text-neutral-600 dark:text-neutral-400">Nationality</dt>
                      <dd className="font-semibold text-neutral-900 dark:text-white">{formData.nationality}</dd>
                    </div>
                    <div>
                      <dt className="text-neutral-600 dark:text-neutral-400">ID Type</dt>
                      <dd className="font-semibold text-neutral-900 dark:text-white">{formData.idType}</dd>
                    </div>
                  </dl>
                </div>

                {/* Financial Info Summary */}
                <div className="border-t-2 border-neutral-200 dark:border-neutral-800 pt-6">
                  <h3 className="font-bold text-lg text-neutral-900 dark:text-white mb-3">
                    Financial Information
                  </h3>
                  <dl className="grid md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <dt className="text-neutral-600 dark:text-neutral-400">Employment Status</dt>
                      <dd className="font-semibold text-neutral-900 dark:text-white capitalize">{formData.employmentStatus?.replace("-", " ")}</dd>
                    </div>
                    <div>
                      <dt className="text-neutral-600 dark:text-neutral-400">Occupation</dt>
                      <dd className="font-semibold text-neutral-900 dark:text-white">{formData.occupation}</dd>
                    </div>
                    <div>
                      <dt className="text-neutral-600 dark:text-neutral-400">Source of Funds</dt>
                      <dd className="font-semibold text-neutral-900 dark:text-white capitalize">{formData.sourceOfFunds?.replace("-", " ")}</dd>
                    </div>
                  </dl>
                </div>

                {/* Next of Kin Summary */}
                <div className="border-t-2 border-neutral-200 dark:border-neutral-800 pt-6">
                  <h3 className="font-bold text-lg text-neutral-900 dark:text-white mb-3">
                    Next of Kin
                  </h3>
                  <dl className="grid md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <dt className="text-neutral-600 dark:text-neutral-400">Full Name</dt>
                      <dd className="font-semibold text-neutral-900 dark:text-white">{formData.nextOfKin?.fullName}</dd>
                    </div>
                    <div>
                      <dt className="text-neutral-600 dark:text-neutral-400">Phone Number</dt>
                      <dd className="font-semibold text-neutral-900 dark:text-white">{formData.nextOfKin?.phone}</dd>
                    </div>
                  </dl>
                </div>

                {/* Investment Preferences Summary */}
                <div className="border-t-2 border-neutral-200 dark:border-neutral-800 pt-6">
                  <h3 className="font-bold text-lg text-neutral-900 dark:text-white mb-3">
                    Investment Preferences
                  </h3>
                  <dl className="grid md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <dt className="text-neutral-600 dark:text-neutral-400">Risk Tolerance</dt>
                      <dd className="font-semibold text-neutral-900 dark:text-white capitalize">{formData.riskProfile}</dd>
                    </div>
                    <div>
                      <dt className="text-neutral-600 dark:text-neutral-400">Accredited Investor</dt>
                      <dd className="font-semibold text-neutral-900 dark:text-white">{formData.accredited ? 'Yes' : 'No'}</dd>
                    </div>
                  </dl>
                </div>

                {/* Agreement Status */}
                <div className="border-t-2 border-neutral-200 dark:border-neutral-800 pt-6">
                  <h3 className="font-bold text-lg text-neutral-900 dark:text-white mb-3">
                    Agreement Status
                  </h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      {formData.agreeToTerms ? (
                        <svg className="w-5 h-5 text-success-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5 text-neutral-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                      )}
                      <span className="text-sm text-neutral-700 dark:text-neutral-300">Investment Service Agreement</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {formData.agreeToShariah ? (
                        <svg className="w-5 h-5 text-success-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5 text-neutral-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                      )}
                      <span className="text-sm text-neutral-700 dark:text-neutral-300">Shariah Compliance Guidelines</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </form>

        {/* Navigation Buttons - Outside form to prevent accidental submission */}
        <div className="flex items-center justify-between mt-8">
          <button
            type="button"
            onClick={prevStep}
            disabled={step === 1}
            className="px-6 py-3 border-2 border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-lg font-semibold hover:border-neutral-400 dark:hover:border-neutral-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>

          {step < 5 ? (
            <button
              type="button"
              onClick={nextStep}
              className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-semibold transition-colors"
            >
              Continue
            </button>
          ) : (
            <button
              type="button"
              onClick={(e) => {
                console.log("Submit button clicked");
                const form = document.querySelector('form');
                if (form) {
                  form.requestSubmit();
                }
              }}
              disabled={loading}
              className="px-8 py-3 bg-success-600 hover:bg-success-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <span>Submit Application</span>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </>
              )}
            </button>
          )}
        </div>
      </main>
    </div>
  );
}
