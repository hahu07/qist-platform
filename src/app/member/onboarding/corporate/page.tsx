"use client";

import { ThemeToggle } from "@/components/theme-toggle";
import { useState } from "react";
import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { corporateInvestorSchema, type CorporateInvestor } from "@/schemas";
import { validateData } from "@/utils/validation";
import { setDoc, onAuthStateChange, getDoc } from "@junobuild/core";

type FormErrors = Record<string, string>;

// Helper to convert YYYY-MM-DD to DD-MM-YYYY
const convertDateFormat = (date: string | undefined): string => {
  if (!date) return "";
  // If already in DD-MM-YYYY format, return as is
  if (/^\d{2}-\d{2}-\d{4}$/.test(date)) return date;
  // If in YYYY-MM-DD format, convert
  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    const [year, month, day] = date.split('-');
    return `${day}-${month}-${year}`;
  }
  return date;
};

export default function CorporateOnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  
  const [formData, setFormData] = useState<Partial<CorporateInvestor>>({
    investorType: "corporate",
    riskProfile: "moderate",
    businessPoolAllocation: 0,
    cryptoPoolAllocation: 0,
    kycStatus: "pending",
    accredited: false,
    agreeToTerms: false,
    agreeToShariah: false,
    beneficialOwners: [],
  });

  // Auto-convert any old YYYY-MM-DD dates to DD-MM-YYYY on mount or data change
  React.useEffect(() => {
    setFormData(prev => {
      const updated = { ...prev };
      
      // Convert incorporation date
      if (updated.incorporationDate) {
        updated.incorporationDate = convertDateFormat(updated.incorporationDate);
      }
      
      // Convert authorized representative date
      if (updated.authorizedRepresentative?.dateOfBirth) {
        updated.authorizedRepresentative = {
          ...updated.authorizedRepresentative,
          dateOfBirth: convertDateFormat(updated.authorizedRepresentative.dateOfBirth)
        };
      }
      
      // Convert beneficial owners dates
      if (updated.beneficialOwners && updated.beneficialOwners.length > 0) {
        updated.beneficialOwners = updated.beneficialOwners.map(owner => ({
          ...owner,
          dateOfBirth: owner.dateOfBirth ? convertDateFormat(owner.dateOfBirth) : owner.dateOfBirth
        }));
      }
      
      return updated;
    });
  }, []);

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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
        ...(prev[parent as keyof CorporateInvestor] as any),
        [field]: value
      }
    }));
    // Clear error for nested field
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[`${parent}.${field}`];
      return newErrors;
    });
  };

  const addBeneficialOwner = () => {
    setFormData(prev => ({
      ...prev,
      beneficialOwners: [
        ...(prev.beneficialOwners || []),
        {
          fullName: "",
          dateOfBirth: "",
          nationality: "",
          ownershipPercentage: 25,
          idType: "passport" as const,
          idNumber: "",
          isPoliticallyExposed: false,
        }
      ]
    }));
  };

  const updateBeneficialOwner = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      beneficialOwners: prev.beneficialOwners?.map((owner, i) =>
        i === index ? { ...owner, [field]: value } : owner
      )
    }));
  };

  const removeBeneficialOwner = (index: number) => {
    setFormData(prev => ({
      ...prev,
      beneficialOwners: prev.beneficialOwners?.filter((_, i) => i !== index)
    }));
  };

  const handleAllocationChange = (pool: "business" | "crypto", value: number) => {
    const numValue = Math.max(0, Math.min(100, value));
    if (pool === "business") {
      setFormData(prev => ({
        ...prev,
        businessPoolAllocation: numValue,
        cryptoPoolAllocation: 100 - numValue
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        cryptoPoolAllocation: numValue,
        businessPoolAllocation: 100 - numValue
      }));
    }
  };

  const validateStep = (currentStep: number): boolean => {
    // Clear errors first
    setErrors({});
    
    // Define required fields per step
    const stepFields: Record<number, string[]> = {
      1: ["companyName", "legalEntityType", "registrationNumber", "registrationCountry", "incorporationDate", 
          "email", "phone", "industry", "businessDescription", "registeredAddress.street", "registeredAddress.city", "registeredAddress.country"],
      2: ["authorizedRepresentative.fullName", "authorizedRepresentative.title", "authorizedRepresentative.email", 
          "authorizedRepresentative.phone", "authorizedRepresentative.nationality", "authorizedRepresentative.idType", "authorizedRepresentative.idNumber"],
      3: [], // Beneficial owners - at least one required but validated separately
      4: ["riskProfile"],
      5: ["agreeToTerms", "agreeToShariah"], // Agreement step
      6: [] // Review step - no additional validation
    };
    
    const fieldsToValidate = stepFields[currentStep] || [];
    const stepErrors: Record<string, string> = {};
    
    // Validate each required field for this step
    fieldsToValidate.forEach(field => {
      const value = field.includes('.') 
        ? field.split('.').reduce((obj: any, key) => obj?.[key], formData)
        : formData[field as keyof CorporateInvestor];
      
      // For booleans in step 5 (agreements), check if they're true
      if (currentStep === 5 && typeof value === 'boolean') {
        if (!value) {
          stepErrors[field] = "You must agree to continue";
        }
        return;
      }
      
      // For numbers, check if they exist (including 0)
      if (typeof value === 'number') {
        return;
      }
      
      if (value === undefined || value === null || value === "") {
        stepErrors[field] = "This field is required";
        return;
      }
      
      // Special validation for incorporation date format
      if (field === "incorporationDate" && typeof value === 'string') {
        if (!/^\d{2}-\d{2}-\d{4}$/.test(value)) {
          stepErrors[field] = "Date must be DD-MM-YYYY format";
        }
      }
    });

    // Step 3: Validate beneficial owners
    if (currentStep === 3) {
      if (!formData.beneficialOwners || formData.beneficialOwners.length === 0) {
        stepErrors.beneficialOwners = "At least one beneficial owner is required";
      }
    }
    
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      return false;
    }
    
    return true;
  };

  const nextStep = () => {
    console.log("=== Attempting to go to next step ===");
    console.log("Current step:", step);
    console.log("Current form data:", formData);
    console.log("Incorporation date value:", formData.incorporationDate);
    console.log("Incorporation date type:", typeof formData.incorporationDate);
    console.log("Date format valid?", formData.incorporationDate ? /^\d{2}-\d{2}-\d{4}$/.test(formData.incorporationDate) : "N/A");
    
    if (validateStep(step)) {
      if (step < 6) {
        setStep(step + 1);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } else {
      // Scroll to first error
      const errorKeys = Object.keys(errors);
      if (errorKeys.length > 0) {
        const firstErrorField = errorKeys[0];
        // Escape special characters in CSS selectors
        const escapedField = firstErrorField.replace(/\./g, '\\.').replace(/\[/g, '\\[').replace(/\]/g, '\\]');
        try {
          const element = document.querySelector(`[name="${escapedField}"], #${escapedField}`);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          } else {
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
        } catch (err) {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
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
    e.preventDefault();
    
    // Only allow submission on step 6 (Review & Submit)
    if (step !== 6) {
      console.log("Form submission prevented - not on review step. Current step:", step);
      return;
    }
    
    console.log("=== SUBMITTING FORM ===");
    console.log("Full form data:", JSON.stringify(formData, null, 2));
    console.log("Incorporation date:", formData.incorporationDate);
    console.log("Authorized rep DOB:", formData.authorizedRepresentative?.dateOfBirth);
    console.log("Beneficial owners:", formData.beneficialOwners);
    
    const result = validateData(corporateInvestorSchema, formData);
    
    if (!result.success) {
      console.error("=== VALIDATION FAILED ===");
      console.error("Validation errors:", result.errors);
      Object.keys(result.errors).forEach(key => {
        console.error(`  - ${key}: ${result.errors[key]}`);
      });
      setErrors(result.errors);
      // Scroll to first error field
      const firstErrorField = Object.keys(result.errors)[0];
      // Escape special characters in CSS selectors
      const escapedField = firstErrorField.replace(/\./g, '\\.').replace(/\[/g, '\\[').replace(/\]/g, '\\]');
      try {
        const element = document.querySelector(`[name="${escapedField}"], #${escapedField}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          (element as HTMLElement).focus?.();
        } else {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      } catch (err) {
        // If selector still fails, just scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
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
            collection: "corporate_investor_profiles",
            key: user.key
          });
          
          // Save to Juno using user's key
          await setDoc({
            collection: "corporate_investor_profiles",
            doc: {
              key: user.key,
              data: result.data,
              ...(existingDoc && { version: existingDoc.version })
            }
          });

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
              { num: 1, label: "Company" },
              { num: 2, label: "Representative" },
              { num: 3, label: "Owners" },
              { num: 4, label: "Preferences" },
              { num: 5, label: "Agreement" },
              { num: 6, label: "Review" }
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
                {index < 5 && (
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
            if (e.key === 'Enter' && step !== 6) {
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

          {/* Step 1: Company Information */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="font-display font-bold text-3xl text-neutral-900 dark:text-white mb-2">
                  Company Information
                </h2>
                <p className="text-neutral-600 dark:text-neutral-400">
                  Tell us about your organization
                </p>
              </div>

              <div className="bg-white dark:bg-neutral-900 rounded-xl border-2 border-neutral-200 dark:border-neutral-800 p-6 space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-neutral-900 dark:text-white mb-2">
                    Company Name *
                  </label>
                  <input
                    type="text"
                    value={formData.companyName || ""}
                    onChange={(e) => updateField("companyName", e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border-2 border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:border-primary-600 dark:focus:border-primary-400 focus:ring-2 focus:ring-primary-600/20 outline-none transition-colors"
                    placeholder="Legal company name"
                  />
                  {errors.companyName && <p className="mt-1 text-sm text-error-600 dark:text-error-400">{errors.companyName}</p>}
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-neutral-900 dark:text-white mb-2">
                      Legal Entity Type *
                    </label>
                    <select
                      value={formData.legalEntityType || ""}
                      onChange={(e) => updateField("legalEntityType", e.target.value)}
                      className="w-full px-4 py-3 rounded-lg border-2 border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:border-primary-600 dark:focus:border-primary-400 focus:ring-2 focus:ring-primary-600/20 outline-none transition-colors"
                    >
                      <option value="">Select type</option>
                      <option value="private-limited">Private Limited</option>
                      <option value="public-limited">Public Limited</option>
                      <option value="partnership">Partnership</option>
                      <option value="llc">LLC</option>
                      <option value="trust">Trust</option>
                      <option value="foundation">Foundation</option>
                      <option value="cooperative">Cooperative</option>
                      <option value="other">Other</option>
                    </select>
                    {errors.legalEntityType && <p className="mt-1 text-sm text-error-600 dark:text-error-400">{errors.legalEntityType}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-neutral-900 dark:text-white mb-2">
                      Registration Number *
                    </label>
                    <input
                      type="text"
                      value={formData.registrationNumber || ""}
                      onChange={(e) => updateField("registrationNumber", e.target.value)}
                      className="w-full px-4 py-3 rounded-lg border-2 border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:border-primary-600 dark:focus:border-primary-400 focus:ring-2 focus:ring-primary-600/20 outline-none transition-colors"
                      placeholder="Company registration number"
                    />
                    {errors.registrationNumber && <p className="mt-1 text-sm text-error-600 dark:text-error-400">{errors.registrationNumber}</p>}
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-neutral-900 dark:text-white mb-2">
                      Registration Country *
                    </label>
                    <input
                      type="text"
                      value={formData.registrationCountry || ""}
                      onChange={(e) => {
                        updateField("registrationCountry", e.target.value);
                        updateField("country", e.target.value);
                      }}
                      className="w-full px-4 py-3 rounded-lg border-2 border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:border-primary-600 dark:focus:border-primary-400 focus:ring-2 focus:ring-primary-600/20 outline-none transition-colors"
                      placeholder="Country of incorporation"
                    />
                    {errors.registrationCountry && <p className="mt-1 text-sm text-error-600 dark:text-error-400">{errors.registrationCountry}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-neutral-900 dark:text-white mb-2">
                      Incorporation Date *
                    </label>
                    <input
                      type="date"
                      name="incorporationDate"
                      id="incorporationDate"
                      value={formData.incorporationDate ? formData.incorporationDate.split('-').reverse().join('-') : ""}
                      onChange={(e) => {
                        const dateValue = e.target.value; // YYYY-MM-DD from input
                        const [year, month, day] = dateValue.split('-');
                        const ddmmyyyy = `${day}-${month}-${year}`; // Convert to DD-MM-YYYY
                        console.log("Date input value (YYYY-MM-DD):", dateValue);
                        console.log("Converted to DD-MM-YYYY:", ddmmyyyy);
                        console.log("Date matches DD-MM-YYYY?", /^\d{2}-\d{2}-\d{4}$/.test(ddmmyyyy));
                        updateField("incorporationDate", ddmmyyyy);
                      }}
                      max={new Date().toISOString().split('T')[0]}
                      className={`w-full px-4 py-3 rounded-lg border-2 ${
                        errors.incorporationDate 
                          ? 'border-error-600 dark:border-error-400' 
                          : 'border-neutral-300 dark:border-neutral-700'
                      } bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:border-primary-600 dark:focus:border-primary-400 focus:ring-2 focus:ring-primary-600/20 outline-none transition-colors`}
                      required
                    />
                    {errors.incorporationDate && <p className="mt-1 text-sm text-error-600 dark:text-error-400">{errors.incorporationDate}</p>}
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-neutral-900 dark:text-white mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      value={formData.email || ""}
                      onChange={(e) => updateField("email", e.target.value)}
                      className="w-full px-4 py-3 rounded-lg border-2 border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:border-primary-600 dark:focus:border-primary-400 focus:ring-2 focus:ring-primary-600/20 outline-none transition-colors"
                      placeholder="company@example.com"
                    />
                    {errors.email && <p className="mt-1 text-sm text-error-600 dark:text-error-400">{errors.email}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-neutral-900 dark:text-white mb-2">
                      Phone *
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
                </div>

                <div>
                  <label className="block text-sm font-semibold text-neutral-900 dark:text-white mb-2">
                    Industry *
                  </label>
                  <input
                    type="text"
                    value={formData.industry || ""}
                    onChange={(e) => updateField("industry", e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border-2 border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:border-primary-600 dark:focus:border-primary-400 focus:ring-2 focus:ring-primary-600/20 outline-none transition-colors"
                    placeholder="e.g., Technology, Healthcare"
                  />
                  {errors.industry && <p className="mt-1 text-sm text-error-600 dark:text-error-400">{errors.industry}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-neutral-900 dark:text-white mb-2">
                    Business Description *
                  </label>
                  <textarea
                    value={formData.businessDescription || ""}
                    onChange={(e) => updateField("businessDescription", e.target.value)}
                    rows={4}
                    className="w-full px-4 py-3 rounded-lg border-2 border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:border-primary-600 dark:focus:border-primary-400 focus:ring-2 focus:ring-primary-600/20 outline-none transition-colors"
                    placeholder="Brief description of your business activities"
                  />
                  {errors.businessDescription && <p className="mt-1 text-sm text-error-600 dark:text-error-400">{errors.businessDescription}</p>}
                </div>

                <div>
                  <h3 className="font-semibold text-lg text-neutral-900 dark:text-white mb-4">
                    Registered Address
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-neutral-900 dark:text-white mb-2">
                        Street Address *
                      </label>
                      <input
                        type="text"
                        value={formData.registeredAddress?.street || ""}
                        onChange={(e) => updateNestedField("registeredAddress", "street", e.target.value)}
                        className="w-full px-4 py-3 rounded-lg border-2 border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:border-primary-600 dark:focus:border-primary-400 focus:ring-2 focus:ring-primary-600/20 outline-none transition-colors"
                        placeholder="Street address"
                      />
                      {errors["registeredAddress.street"] && <p className="mt-1 text-sm text-error-600 dark:text-error-400">{errors["registeredAddress.street"]}</p>}
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-neutral-900 dark:text-white mb-2">
                          City *
                        </label>
                        <input
                          type="text"
                          value={formData.registeredAddress?.city || ""}
                          onChange={(e) => updateNestedField("registeredAddress", "city", e.target.value)}
                          className="w-full px-4 py-3 rounded-lg border-2 border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:border-primary-600 dark:focus:border-primary-400 focus:ring-2 focus:ring-primary-600/20 outline-none transition-colors"
                          placeholder="City"
                        />
                        {errors["registeredAddress.city"] && <p className="mt-1 text-sm text-error-600 dark:text-error-400">{errors["registeredAddress.city"]}</p>}
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-neutral-900 dark:text-white mb-2">
                          State/Province
                        </label>
                        <input
                          type="text"
                          value={formData.registeredAddress?.state || ""}
                          onChange={(e) => updateNestedField("registeredAddress", "state", e.target.value)}
                          className="w-full px-4 py-3 rounded-lg border-2 border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:border-primary-600 dark:focus:border-primary-400 focus:ring-2 focus:ring-primary-600/20 outline-none transition-colors"
                          placeholder="State or province"
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
                          value={formData.registeredAddress?.postalCode || ""}
                          onChange={(e) => updateNestedField("registeredAddress", "postalCode", e.target.value)}
                          className="w-full px-4 py-3 rounded-lg border-2 border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:border-primary-600 dark:focus:border-primary-400 focus:ring-2 focus:ring-primary-600/20 outline-none transition-colors"
                          placeholder="Postal/ZIP code"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-neutral-900 dark:text-white mb-2">
                          Country *
                        </label>
                        <input
                          type="text"
                          value={formData.registeredAddress?.country || ""}
                          onChange={(e) => updateNestedField("registeredAddress", "country", e.target.value)}
                          className="w-full px-4 py-3 rounded-lg border-2 border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:border-primary-600 dark:focus:border-primary-400 focus:ring-2 focus:ring-primary-600/20 outline-none transition-colors"
                          placeholder="Country"
                        />
                        {errors["registeredAddress.country"] && <p className="mt-1 text-sm text-error-600 dark:text-error-400">{errors["registeredAddress.country"]}</p>}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Authorized Representative */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="font-display font-bold text-3xl text-neutral-900 dark:text-white mb-2">
                  Authorized Representative
                </h2>
                <p className="text-neutral-600 dark:text-neutral-400">
                  Information about the person authorized to act on behalf of the company
                </p>
              </div>

              <div className="bg-white dark:bg-neutral-900 rounded-xl border-2 border-neutral-200 dark:border-neutral-800 p-6 space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-neutral-900 dark:text-white mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      value={formData.authorizedRepresentative?.fullName || ""}
                      onChange={(e) => updateNestedField("authorizedRepresentative", "fullName", e.target.value)}
                      className="w-full px-4 py-3 rounded-lg border-2 border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:border-primary-600 dark:focus:border-primary-400 focus:ring-2 focus:ring-primary-600/20 outline-none transition-colors"
                      placeholder="Full legal name"
                    />
                    {errors["authorizedRepresentative.fullName"] && <p className="mt-1 text-sm text-error-600 dark:text-error-400">{errors["authorizedRepresentative.fullName"]}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-neutral-900 dark:text-white mb-2">
                      Position/Title *
                    </label>
                    <input
                      type="text"
                      value={formData.authorizedRepresentative?.title || ""}
                      onChange={(e) => updateNestedField("authorizedRepresentative", "title", e.target.value)}
                      className="w-full px-4 py-3 rounded-lg border-2 border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:border-primary-600 dark:focus:border-primary-400 focus:ring-2 focus:ring-primary-600/20 outline-none transition-colors"
                      placeholder="e.g., CEO, Director"
                    />
                    {errors["authorizedRepresentative.title"] && <p className="mt-1 text-sm text-error-600 dark:text-error-400">{errors["authorizedRepresentative.title"]}</p>}
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-neutral-900 dark:text-white mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      value={formData.authorizedRepresentative?.email || ""}
                      onChange={(e) => updateNestedField("authorizedRepresentative", "email", e.target.value)}
                      className="w-full px-4 py-3 rounded-lg border-2 border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:border-primary-600 dark:focus:border-primary-400 focus:ring-2 focus:ring-primary-600/20 outline-none transition-colors"
                      placeholder="representative@company.com"
                    />
                    {errors["authorizedRepresentative.email"] && <p className="mt-1 text-sm text-error-600 dark:text-error-400">{errors["authorizedRepresentative.email"]}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-neutral-900 dark:text-white mb-2">
                      Phone *
                    </label>
                    <input
                      type="tel"
                      value={formData.authorizedRepresentative?.phone || ""}
                      onChange={(e) => updateNestedField("authorizedRepresentative", "phone", e.target.value)}
                      className="w-full px-4 py-3 rounded-lg border-2 border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:border-primary-600 dark:focus:border-primary-400 focus:ring-2 focus:ring-primary-600/20 outline-none transition-colors"
                      placeholder="+1234567890"
                    />
                    {errors["authorizedRepresentative.phone"] && <p className="mt-1 text-sm text-error-600 dark:text-error-400">{errors["authorizedRepresentative.phone"]}</p>}
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-neutral-900 dark:text-white mb-2">
                      Date of Birth
                    </label>
                    <input
                      type="date"
                      value={formData.authorizedRepresentative?.dateOfBirth ? formData.authorizedRepresentative.dateOfBirth.split('-').reverse().join('-') : ""}
                      onChange={(e) => {
                        const dateValue = e.target.value;
                        if (dateValue) {
                          const [year, month, day] = dateValue.split('-');
                          const ddmmyyyy = `${day}-${month}-${year}`;
                          updateNestedField("authorizedRepresentative", "dateOfBirth", ddmmyyyy);
                        } else {
                          updateNestedField("authorizedRepresentative", "dateOfBirth", "");
                        }
                      }}
                      className="w-full px-4 py-3 rounded-lg border-2 border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:border-primary-600 dark:focus:border-primary-400 focus:ring-2 focus:ring-primary-600/20 outline-none transition-colors"
                    />
                    {errors["authorizedRepresentative.dateOfBirth"] && <p className="mt-1 text-sm text-error-600 dark:text-error-400">{errors["authorizedRepresentative.dateOfBirth"]}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-neutral-900 dark:text-white mb-2">
                      Nationality *
                    </label>
                    <input
                      type="text"
                      value={formData.authorizedRepresentative?.nationality || ""}
                      onChange={(e) => updateNestedField("authorizedRepresentative", "nationality", e.target.value)}
                      className="w-full px-4 py-3 rounded-lg border-2 border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:border-primary-600 dark:focus:border-primary-400 focus:ring-2 focus:ring-primary-600/20 outline-none transition-colors"
                      placeholder="Country of citizenship"
                    />
                    {errors["authorizedRepresentative.nationality"] && <p className="mt-1 text-sm text-error-600 dark:text-error-400">{errors["authorizedRepresentative.nationality"]}</p>}
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-neutral-900 dark:text-white mb-2">
                      ID Type *
                    </label>
                    <select
                      value={formData.authorizedRepresentative?.idType || "passport"}
                      onChange={(e) => updateNestedField("authorizedRepresentative", "idType", e.target.value)}
                      className="w-full px-4 py-3 rounded-lg border-2 border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:border-primary-600 dark:focus:border-primary-400 focus:ring-2 focus:ring-primary-600/20 outline-none transition-colors"
                    >
                      <option value="passport">Passport</option>
                      <option value="national-id">National ID</option>
                      <option value="drivers-license">Driver's License</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-neutral-900 dark:text-white mb-2">
                      ID Number *
                    </label>
                    <input
                      type="text"
                      value={formData.authorizedRepresentative?.idNumber || ""}
                      onChange={(e) => updateNestedField("authorizedRepresentative", "idNumber", e.target.value)}
                      className="w-full px-4 py-3 rounded-lg border-2 border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:border-primary-600 dark:focus:border-primary-400 focus:ring-2 focus:ring-primary-600/20 outline-none transition-colors"
                      placeholder="Identification number"
                    />
                    {errors["authorizedRepresentative.idNumber"] && <p className="mt-1 text-sm text-error-600 dark:text-error-400">{errors["authorizedRepresentative.idNumber"]}</p>}
                  </div>
                </div>

                <div>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.authorizedRepresentative?.isPoliticallyExposed || false}
                      onChange={(e) => updateNestedField("authorizedRepresentative", "isPoliticallyExposed", e.target.checked)}
                      className="w-5 h-5 rounded border-2 border-neutral-300 dark:border-neutral-700 text-primary-600 focus:ring-2 focus:ring-primary-600/20"
                    />
                    <span className="text-sm text-neutral-700 dark:text-neutral-300">
                      Is this person a Politically Exposed Person (PEP)?
                    </span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Beneficial Owners */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="font-display font-bold text-3xl text-neutral-900 dark:text-white mb-2">
                  Beneficial Owners
                </h2>
                <p className="text-neutral-600 dark:text-neutral-400">
                  List all individuals who own 25% or more of the company
                </p>
              </div>

              <div className="space-y-4">
                {formData.beneficialOwners?.map((owner, index) => (
                  <div key={index} className="bg-white dark:bg-neutral-900 rounded-xl border-2 border-neutral-200 dark:border-neutral-800 p-6 space-y-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-lg text-neutral-900 dark:text-white">
                        Beneficial Owner {index + 1}
                      </h3>
                      {(formData.beneficialOwners?.length || 0) > 1 && (
                        <button
                          type="button"
                          onClick={() => removeBeneficialOwner(index)}
                          className="px-3 py-1 text-sm text-error-600 dark:text-error-400 hover:bg-error-50 dark:hover:bg-error-900/20 rounded-lg transition-colors"
                        >
                          Remove
                        </button>
                      )}
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-neutral-900 dark:text-white mb-2">
                          Full Name *
                        </label>
                        <input
                          type="text"
                          value={owner.fullName}
                          onChange={(e) => updateBeneficialOwner(index, "fullName", e.target.value)}
                          className="w-full px-4 py-3 rounded-lg border-2 border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:border-primary-600 dark:focus:border-primary-400 focus:ring-2 focus:ring-primary-600/20 outline-none transition-colors"
                          placeholder="Full legal name"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-neutral-900 dark:text-white mb-2">
                          Date of Birth 
                        </label>
                        <input
                          type="date"
                          value={owner.dateOfBirth ? owner.dateOfBirth.split('-').reverse().join('-') : ""}
                          onChange={(e) => {
                            const dateValue = e.target.value;
                            if (dateValue) {
                              const [year, month, day] = dateValue.split('-');
                              const ddmmyyyy = `${day}-${month}-${year}`;
                              updateBeneficialOwner(index, "dateOfBirth", ddmmyyyy);
                            } else {
                              updateBeneficialOwner(index, "dateOfBirth", "");
                            }
                          }}
                          className="w-full px-4 py-3 rounded-lg border-2 border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:border-primary-600 dark:focus:border-primary-400 focus:ring-2 focus:ring-primary-600/20 outline-none transition-colors"
                        />
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-neutral-900 dark:text-white mb-2">
                          Nationality *
                        </label>
                        <input
                          type="text"
                          value={owner.nationality}
                          onChange={(e) => updateBeneficialOwner(index, "nationality", e.target.value)}
                          className="w-full px-4 py-3 rounded-lg border-2 border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:border-primary-600 dark:focus:border-primary-400 focus:ring-2 focus:ring-primary-600/20 outline-none transition-colors"
                          placeholder="Country of citizenship"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-neutral-900 dark:text-white mb-2">
                          Ownership Percentage *
                        </label>
                        <input
                          type="number"
                          min="25"
                          max="100"
                          value={owner.ownershipPercentage}
                          onChange={(e) => updateBeneficialOwner(index, "ownershipPercentage", parseInt(e.target.value))}
                          className="w-full px-4 py-3 rounded-lg border-2 border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:border-primary-600 dark:focus:border-primary-400 focus:ring-2 focus:ring-primary-600/20 outline-none transition-colors"
                        />
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-neutral-900 dark:text-white mb-2">
                          ID Type *
                        </label>
                        <select
                          value={owner.idType}
                          onChange={(e) => updateBeneficialOwner(index, "idType", e.target.value)}
                          className="w-full px-4 py-3 rounded-lg border-2 border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:border-primary-600 dark:focus:border-primary-400 focus:ring-2 focus:ring-primary-600/20 outline-none transition-colors"
                        >
                          <option value="passport">Passport</option>
                          <option value="national-id">National ID</option>
                          <option value="drivers-license">Driver's License</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-neutral-900 dark:text-white mb-2">
                          ID Number *
                        </label>
                        <input
                          type="text"
                          value={owner.idNumber}
                          onChange={(e) => updateBeneficialOwner(index, "idNumber", e.target.value)}
                          className="w-full px-4 py-3 rounded-lg border-2 border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:border-primary-600 dark:focus:border-primary-400 focus:ring-2 focus:ring-primary-600/20 outline-none transition-colors"
                          placeholder="Identification number"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={owner.isPoliticallyExposed}
                          onChange={(e) => updateBeneficialOwner(index, "isPoliticallyExposed", e.target.checked)}
                          className="w-5 h-5 rounded border-2 border-neutral-300 dark:border-neutral-700 text-primary-600 focus:ring-2 focus:ring-primary-600/20"
                        />
                        <span className="text-sm text-neutral-700 dark:text-neutral-300">
                          Is this person a Politically Exposed Person (PEP)?
                        </span>
                      </label>
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={addBeneficialOwner}
                  className="w-full px-4 py-3 border-2 border-dashed border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-lg hover:border-primary-600 dark:hover:border-primary-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors font-semibold"
                >
                  + Add Another Beneficial Owner
                </button>
              </div>
            </div>
          )}

{/* Step 4: Investment Preferences */}
          {step === 4 && (
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
                        Accredited/Institutional Investor Status
                      </span>
                      <span className="text-sm text-neutral-600 dark:text-neutral-400">
                        The company qualifies as an accredited or institutional investor with higher investment capacity and sophistication
                      </span>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          )}


          {/* Step 5: Contractual Agreement */}
          {step === 5 && (
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
                        AmanaTrade is the trading name and digital platform of AmanaTrader Cooperative Society, a pure investment cooperative duly registered with Ministry of Commerce. 
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
                        Your personal and business information is protected according to our Privacy Policy. We use blockchain technology to ensure 
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

          {/* Step 6: Review & Submit */}
          {step === 6 && (
            <div className="space-y-6">
              <div>
                <h2 className="font-display font-bold text-3xl text-neutral-900 dark:text-white mb-2">
                  Review & Submit
                </h2>
                <p className="text-neutral-600 dark:text-neutral-400">
                  Please review your information before submitting
                </p>
              </div>

              <div className="space-y-4">
                {/* Company Information Summary */}
                <div className="bg-white dark:bg-neutral-900 rounded-xl border-2 border-neutral-200 dark:border-neutral-800 p-6">
                  <h3 className="font-semibold text-lg text-neutral-900 dark:text-white mb-4">
                    Company Information
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-neutral-600 dark:text-neutral-400">Company Name:</span>
                      <p className="font-medium text-neutral-900 dark:text-white">{formData.companyName}</p>
                    </div>
                    <div>
                      <span className="text-neutral-600 dark:text-neutral-400">Entity Type:</span>
                      <p className="font-medium text-neutral-900 dark:text-white">{formData.legalEntityType}</p>
                    </div>
                    <div>
                      <span className="text-neutral-600 dark:text-neutral-400">Registration Number:</span>
                      <p className="font-medium text-neutral-900 dark:text-white">{formData.registrationNumber}</p>
                    </div>
                    <div>
                      <span className="text-neutral-600 dark:text-neutral-400">Country:</span>
                      <p className="font-medium text-neutral-900 dark:text-white">{formData.registrationCountry}</p>
                    </div>
                    <div>
                      <span className="text-neutral-600 dark:text-neutral-400">Incorporation Date:</span>
                      <p className="font-medium text-neutral-900 dark:text-white">{formData.incorporationDate}</p>
                    </div>
                    <div>
                      <span className="text-neutral-600 dark:text-neutral-400">Industry:</span>
                      <p className="font-medium text-neutral-900 dark:text-white">{formData.industry}</p>
                    </div>
                    <div className="md:col-span-2">
                      <span className="text-neutral-600 dark:text-neutral-400">Registered Address:</span>
                      <p className="font-medium text-neutral-900 dark:text-white">
                        {formData.registeredAddress?.street}, {formData.registeredAddress?.city}
                        {formData.registeredAddress?.state && `, ${formData.registeredAddress.state}`}
                        {formData.registeredAddress?.postalCode && ` ${formData.registeredAddress.postalCode}`}
                        , {formData.registeredAddress?.country}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Representative Summary */}
                <div className="bg-white dark:bg-neutral-900 rounded-xl border-2 border-neutral-200 dark:border-neutral-800 p-6">
                  <h3 className="font-semibold text-lg text-neutral-900 dark:text-white mb-4">
                    Authorized Representative
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-neutral-600 dark:text-neutral-400">Name:</span>
                      <p className="font-medium text-neutral-900 dark:text-white">{formData.authorizedRepresentative?.fullName}</p>
                    </div>
                    <div>
                      <span className="text-neutral-600 dark:text-neutral-400">Position:</span>
                      <p className="font-medium text-neutral-900 dark:text-white">{formData.authorizedRepresentative?.title}</p>
                    </div>
                    <div>
                      <span className="text-neutral-600 dark:text-neutral-400">Email:</span>
                      <p className="font-medium text-neutral-900 dark:text-white">{formData.authorizedRepresentative?.email}</p>
                    </div>
                    <div>
                      <span className="text-neutral-600 dark:text-neutral-400">Phone:</span>
                      <p className="font-medium text-neutral-900 dark:text-white">{formData.authorizedRepresentative?.phone}</p>
                    </div>
                  </div>
                </div>

                {/* Beneficial Owners Summary */}
                <div className="bg-white dark:bg-neutral-900 rounded-xl border-2 border-neutral-200 dark:border-neutral-800 p-6">
                  <h3 className="font-semibold text-lg text-neutral-900 dark:text-white mb-4">
                    Beneficial Owners ({formData.beneficialOwners?.length || 0})
                  </h3>
                  <div className="space-y-3">
                    {formData.beneficialOwners?.map((owner, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                        <div>
                          <p className="font-medium text-neutral-900 dark:text-white">{owner.fullName}</p>
                          <p className="text-sm text-neutral-600 dark:text-neutral-400">{owner.nationality}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-primary-600 dark:text-primary-400">{owner.ownershipPercentage}%</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Investment Preferences Summary */}
                <div className="bg-white dark:bg-neutral-900 rounded-xl border-2 border-neutral-200 dark:border-neutral-800 p-6">
                  <h3 className="font-semibold text-lg text-neutral-900 dark:text-white mb-4">
                    Investment Preferences
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-600 dark:text-neutral-400">Risk Tolerance:</span>
                      <p className="font-medium text-neutral-900 dark:text-white capitalize">{formData.riskProfile}</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-600 dark:text-neutral-400">Accredited Investor:</span>
                      <p className="font-medium text-neutral-900 dark:text-white">{formData.accredited ? 'Yes' : 'No'}</p>
                    </div>
                  </div>
                </div>

                {/* Agreement Confirmation */}
                <div className="bg-white dark:bg-neutral-900 rounded-xl border-2 border-neutral-200 dark:border-neutral-800 p-6">
                  <h3 className="font-semibold text-lg text-neutral-900 dark:text-white mb-4">
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

          {step < 6 ? (
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
