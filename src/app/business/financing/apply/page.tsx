"use client";

import { ThemeToggle } from "@/components/theme-toggle";
import { AuthButton } from "@/components/auth-button";
import { initSatellite, onAuthStateChange, setDoc, listDocs, uploadFile } from "@junobuild/core";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { BusinessProfile, ApplicationData } from "@/schemas";
import { validateData } from "@/utils/validation";
import { applicationDataSchema } from "@/schemas";

type User = {
  key: string;
} | null | undefined;

export default function ApplyForFinancingPage() {
  const [user, setUser] = useState<User>(undefined);
  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  // Form state
  const [contractType, setContractType] = useState<ApplicationData["contractType"]>("musharaka");
  const [requestedAmount, setRequestedAmount] = useState<number>(100000);
  const [purpose, setPurpose] = useState("");
  const [businessPlan, setBusinessPlan] = useState("");
  const [revenueModel, setRevenueModel] = useState("");
  const [marketAnalysis, setMarketAnalysis] = useState("");
  const [useOfFunds, setUseOfFunds] = useState("");
  const [repaymentPlan, setRepaymentPlan] = useState("");
  const [collateralDescription, setCollateralDescription] = useState("");

  // Document upload state
  const [bankStatement6Months, setBankStatement6Months] = useState<File[]>([]);
  const [directorsBVN, setDirectorsBVN] = useState<string[]>([]);
  const [currentBVN, setCurrentBVN] = useState<string>("");
  const [directorsPhoto, setDirectorsPhoto] = useState<File[]>([]);
  const [auditedStatements2Years, setAuditedStatements2Years] = useState<File[]>([]);
  const [directorsID, setDirectorsID] = useState<File[]>([]);
  const [collateralDocs, setCollateralDocs] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{[key: string]: string}>({});
  const [showReview, setShowReview] = useState(false);

  useEffect(() => {
    (async () => await initSatellite({ workers: { auth: true } }))();
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChange((authUser) => {
      setUser(authUser);
      setLoading(false);
      
      // Only redirect to signin if user is explicitly null (not undefined) after loading
      if (authUser === null) {
        router.push("/auth/signin");
      }
    });

    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;

    try {
      const profilesResult = await listDocs<BusinessProfile>({
        collection: "business_profiles",
      });

      const userProfile = profilesResult.items.find((doc) => doc.key === user.key);

      if (!userProfile) {
        router.push("/business/onboarding/profile");
        return;
      }

      if (userProfile.data.kycStatus !== "verified") {
        setError("Your business KYC must be verified before applying for financing");
        setTimeout(() => router.push("/business/dashboard"), 3000);
        return;
      }

      setProfile(userProfile.data);
    } catch (error) {
      console.error("Error loading profile:", error);
      setError("Failed to load business profile");
    }
  };

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "user" },
        audio: false 
      });
      setStream(mediaStream);
      setShowCamera(true);
    } catch (err) {
      console.error("Error accessing camera:", err);
      setError("Unable to access camera. Please upload a file instead.");
      setTimeout(() => setError(""), 3000);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setShowCamera(false);
  };

  const capturePhoto = () => {
    const video = document.getElementById('camera-video') as HTMLVideoElement;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0);
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], `selfie-${Date.now()}.jpg`, { type: 'image/jpeg' });
          setDirectorsPhoto(prev => [...prev, file]);
          stopCamera();
        }
      }, 'image/jpeg', 0.95);
    }
  };

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    // Validate required fields
    const errors: {[key: string]: string} = {};
    if (!businessPlan || businessPlan.length < 50) errors.businessPlan = "Business description must be at least 50 characters";
    if (!purpose || purpose.length < 50) errors.purpose = "Purpose must be at least 50 characters";
    if (directorsBVN.length === 0 || directorsBVN[0].length !== 11) errors.bvn = "BVN must be 11 digits";
    
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setError("Please fix the errors above");
      return;
    }
    
    setShowReview(true);
    window.scrollTo(0, 0);
  };

  const handleSubmit = async () => {
    if (!user || !profile) return;

    setSubmitting(true);
    setError("");

    try {
      const applicationKey = `${user.key}_${Date.now()}`;
      
      // Upload all documents to Juno storage
      const uploadedDocs: Record<string, string[]> = {
        bankStatements: [],
        directorsPhotos: [],
        auditedStatements: [],
        directorsIDs: [],
        collateralDocuments: []
      };

      // Upload bank statements
      for (const file of bankStatement6Months) {
        const result = await uploadFile({
          collection: "business_documents",
          data: file,
          filename: `${applicationKey}/bank_statement_${Date.now()}_${file.name}`,
        });
        uploadedDocs.bankStatements.push(result.downloadUrl);
      }

      // Upload directors photos
      for (const file of directorsPhoto) {
        const result = await uploadFile({
          collection: "business_documents",
          data: file,
          filename: `${applicationKey}/director_photo_${Date.now()}_${file.name}`,
        });
        uploadedDocs.directorsPhotos.push(result.downloadUrl);
      }

      // Upload audited statements
      for (const file of auditedStatements2Years) {
        const result = await uploadFile({
          collection: "business_documents",
          data: file,
          filename: `${applicationKey}/audited_statement_${Date.now()}_${file.name}`,
        });
        uploadedDocs.auditedStatements.push(result.downloadUrl);
      }

      // Upload directors IDs
      for (const file of directorsID) {
        const result = await uploadFile({
          collection: "business_documents",
          data: file,
          filename: `${applicationKey}/director_id_${Date.now()}_${file.name}`,
        });
        uploadedDocs.directorsIDs.push(result.downloadUrl);
      }

      // Upload collateral documents
      for (const file of collateralDocs) {
        const result = await uploadFile({
          collection: "business_documents",
          data: file,
          filename: `${applicationKey}/collateral_${Date.now()}_${file.name}`,
        });
        uploadedDocs.collateralDocuments.push(result.downloadUrl);
      }

      // Map business type to application schema format
      const businessTypeMap: Record<string, ApplicationData["businessType"]> = {
        "sole-proprietorship": "sole_proprietorship",
        "partnership": "partnership",
        "limited-liability": "llc",
        "corporation": "corporation",
        "cooperative": "cooperative",
        "non-profit": "other"
      };

      const applicationData: Partial<ApplicationData> = {
        businessName: profile.businessName,
        businessEmail: profile.businessEmail,
        businessPhone: profile.businessPhone,
        businessAddress: profile.businessAddress,
        businessType: businessTypeMap[profile.businessType] || "other",
        industry: profile.industry,
        registrationNumber: profile.registrationNumber,
        bvn: directorsBVN.length > 0 ? directorsBVN[0] : "", // Use first BVN from array
        yearsInOperation: new Date().getFullYear() - profile.yearEstablished,
        numberOfEmployees: profile.numberOfEmployees,
        annualRevenue: profile.annualRevenue || 0,
        businessDescription: businessPlan,
        contractType,
        requestedAmount,
        fundingDuration: 12, // Default 12 months, make configurable
        fundingPurpose: purpose,
        purpose,
        status: "pending",
        documentsSubmitted: true,
        documentsStatus: "uploaded",
        documents: uploadedDocs, // Store document URLs
      };

      // Validate data
      const validation = validateData(applicationDataSchema, applicationData);
      if (!validation.success) {
        setError(Object.values(validation.errors).join(", "));
        setSubmitting(false);
        return;
      }

      // Save application to localStorage (NOT to Juno yet - only admin approval saves to Juno)
      const pendingApplications = JSON.parse(localStorage.getItem('pending_applications') || '[]');
      pendingApplications.push({
        key: applicationKey,
        data: {
          ...applicationData,
          submittedAt: new Date().toISOString(),
        },
        owner: user.key,
      });
      localStorage.setItem('pending_applications', JSON.stringify(pendingApplications));

      alert("Application submitted successfully! It will be reviewed by the admin.");
      
      // Redirect to dashboard
      router.push("/business/dashboard");
    } catch (err: any) {
      console.error("Application error:", err);
      setError(err.message || "Failed to submit application");
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-primary-50/30 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950 flex items-center justify-center">
        <div className="text-neutral-600 dark:text-neutral-400">Loading...</div>
      </div>
    );
  }

  if (!user || !profile) {
    return null;
  }

  const contractDetails = {
    musharaka: {
      name: "Musharakah (Partnership)",
      description: "Investor and business both contribute capital and share profits/losses proportionally. Example: You need ₦5M for inventory. Investor provides ₦3M (60%), you provide ₦2M (40%). Profits split 60/40.",
      expectedReturn: "15-18%",
      term: "24 months"
    },
    mudaraba: {
      name: "Mudarabah (Trust Financing)",
      description: "Investor provides 100% capital, you provide expertise and management. Profits shared as agreed, losses borne by investor. Example: Investor funds ₦10M for your trading business, profits split 70/30.",
      expectedReturn: "12-16%",
      term: "18 months"
    },
    murabaha: {
      name: "Murabaha (Cost-Plus Financing)",
      description: "Platform buys asset you need, sells to you at cost + agreed markup, paid in installments. Example: You need equipment worth ₦2M, platform adds 15% markup, you pay ₦2.3M over 12 months.",
      expectedReturn: "10-12%",
      term: "12 months"
    },
    ijara: {
      name: "Ijarah (Leasing)",
      description: "Platform buys asset and leases it to you with option to purchase at end. Example: ₦8M delivery van, you pay ₦150K monthly rent for 5 years, then purchase for ₦1M residual value.",
      expectedReturn: "12-14%",
      term: "18 months"
    },
    istisna: {
      name: "Istisna (Manufacturing)",
      description: "Pre-financing for manufacturing or construction with staged payments tied to milestones. Example: ₦20M factory expansion, funds released as: 30% at start, 40% at midpoint, 30% at completion.",
      expectedReturn: "13-16%",
      term: "24 months"
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-primary-50/30 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950">
      {/* Header */}
      <header className="border-b border-neutral-200 dark:border-neutral-800 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary-600 dark:bg-primary-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">A</span>
              </div>
              <span className="font-display font-bold text-xl text-neutral-900 dark:text-white">
                AmanaTrade
              </span>
            </Link>
            <div className="flex items-center gap-4">
              <Link
                href="/business/dashboard"
                className="text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white text-sm font-medium"
              >
                ← Back to Dashboard
              </Link>
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
            Apply for Shariah-Compliant Financing
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400">
            Submit your financing application for {profile.businessName}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleReviewSubmit} className="space-y-8">
          {/* Contract Type Selection */}
          <div className="bg-white dark:bg-neutral-900 rounded-xl p-6 border-2 border-neutral-200 dark:border-neutral-800">
            <h2 className="font-display font-bold text-xl text-neutral-900 dark:text-white mb-4">
              Select Financing Type
            </h2>
            <div className="space-y-3">
              {Object.entries(contractDetails).map(([type, details]) => (
                <label
                  key={type}
                  className={`block p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                    contractType === type
                      ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20"
                      : "border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-600"
                  }`}
                >
                  <input
                    type="radio"
                    name="contractType"
                    value={type}
                    checked={contractType === type}
                    onChange={(e) => setContractType(e.target.value as ApplicationData["contractType"])}
                    className="sr-only"
                  />
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="font-semibold text-neutral-900 dark:text-white mb-1">
                        {details.name}
                      </div>
                      <div className="text-sm text-neutral-600 dark:text-neutral-400">
                        {details.description}
                      </div>
                    </div>
                    {contractType === type && (
                      <div className="ml-4">
                        <span className="text-primary-600 dark:text-primary-400">✓</span>
                      </div>
                    )}
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Financing Amount */}
          <div className="bg-white dark:bg-neutral-900 rounded-xl p-6 border-2 border-neutral-200 dark:border-neutral-800">
            <h2 className="font-display font-bold text-xl text-neutral-900 dark:text-white mb-4">
              Financing Details
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Requested Amount (₦) *
                </label>
                <input
                  type="number"
                  value={requestedAmount}
                  onChange={(e) => setRequestedAmount(parseInt(e.target.value))}
                  min={10000}
                  required
                  className="w-full px-4 py-2 border-2 border-neutral-300 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Purpose of Financing *
                </label>
                <textarea
                  value={purpose}
                  onChange={(e) => {
                    setPurpose(e.target.value);
                    if (e.target.value.length > 0 && e.target.value.length < 50) {
                      setFieldErrors(prev => ({...prev, purpose: 'Purpose must be at least 50 characters'}));
                    } else {
                      setFieldErrors(prev => {const {purpose, ...rest} = prev; return rest;});
                    }
                  }}
                  required
                  minLength={50}
                  rows={3}
                  placeholder="Briefly describe what you need financing for (minimum 50 characters)"
                  className={`w-full px-4 py-2 border-2 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white ${
                    fieldErrors.purpose ? 'border-red-500 dark:border-red-500' : 'border-neutral-300 dark:border-neutral-700'
                  }`}
                />
                <div className="flex items-center justify-between mt-1">
                  {fieldErrors.purpose ? (
                    <p className="text-sm text-red-600 dark:text-red-400">{fieldErrors.purpose}</p>
                  ) : (
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">Minimum 50 characters</p>
                  )}
                  <p className={`text-xs ${
                    purpose.length < 50 ? 'text-red-600 dark:text-red-400' : 'text-neutral-500 dark:text-neutral-400'
                  }`}>
                    {purpose.length}/50
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Business Plan */}
          <div className="bg-white dark:bg-neutral-900 rounded-xl p-6 border-2 border-neutral-200 dark:border-neutral-800">
            <h2 className="font-display font-bold text-xl text-neutral-900 dark:text-white mb-4">
              Business Plan
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Business Plan Summary *
                </label>
                <textarea
                  value={businessPlan}
                  onChange={(e) => {
                    setBusinessPlan(e.target.value);
                    if (e.target.value.length > 0 && e.target.value.length < 50) {
                      setFieldErrors(prev => ({...prev, businessPlan: 'Business plan must be at least 50 characters'}));
                    } else {
                      setFieldErrors(prev => {const {businessPlan, ...rest} = prev; return rest;});
                    }
                  }}
                  required
                  minLength={50}
                  rows={5}
                  placeholder="Describe your business model, products/services, and growth strategy (minimum 50 characters)"
                  className={`w-full px-4 py-2 border-2 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white ${
                    fieldErrors.businessPlan ? 'border-red-500 dark:border-red-500' : 'border-neutral-300 dark:border-neutral-700'
                  }`}
                />
                <div className="flex items-center justify-between mt-1">
                  {fieldErrors.businessPlan ? (
                    <p className="text-sm text-red-600 dark:text-red-400">{fieldErrors.businessPlan}</p>
                  ) : (
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">Minimum 50 characters</p>
                  )}
                  <p className={`text-xs ${
                    businessPlan.length < 50 ? 'text-red-600 dark:text-red-400' : 'text-neutral-500 dark:text-neutral-400'
                  }`}>
                    {businessPlan.length}/50
                  </p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Revenue Model *
                </label>
                <textarea
                  value={revenueModel}
                  onChange={(e) => {
                    setRevenueModel(e.target.value);
                    if (e.target.value.length > 0 && e.target.value.length < 50) {
                      setFieldErrors(prev => ({...prev, revenueModel: 'Revenue model must be at least 50 characters'}));
                    } else {
                      setFieldErrors(prev => {const {revenueModel, ...rest} = prev; return rest;});
                    }
                  }}
                  required
                  minLength={50}
                  rows={4}
                  placeholder="Explain how your business generates revenue (minimum 50 characters)"
                  className={`w-full px-4 py-2 border-2 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white ${
                    fieldErrors.revenueModel ? 'border-red-500 dark:border-red-500' : 'border-neutral-300 dark:border-neutral-700'
                  }`}
                />
                <div className="flex items-center justify-between mt-1">
                  {fieldErrors.revenueModel ? (
                    <p className="text-sm text-red-600 dark:text-red-400">{fieldErrors.revenueModel}</p>
                  ) : (
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">Minimum 50 characters</p>
                  )}
                  <p className={`text-xs ${
                    revenueModel.length < 50 ? 'text-red-600 dark:text-red-400' : 'text-neutral-500 dark:text-neutral-400'
                  }`}>
                    {revenueModel.length}/50
                  </p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Market Analysis *
                </label>
                <textarea
                  value={marketAnalysis}
                  onChange={(e) => {
                    setMarketAnalysis(e.target.value);
                    if (e.target.value.length > 0 && e.target.value.length < 50) {
                      setFieldErrors(prev => ({...prev, marketAnalysis: 'Market analysis must be at least 50 characters'}));
                    } else {
                      setFieldErrors(prev => {const {marketAnalysis, ...rest} = prev; return rest;});
                    }
                  }}
                  required
                  minLength={50}
                  rows={4}
                  placeholder="Describe your target market, competition, and market opportunity (minimum 50 characters)"
                  className={`w-full px-4 py-2 border-2 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white ${
                    fieldErrors.marketAnalysis ? 'border-red-500 dark:border-red-500' : 'border-neutral-300 dark:border-neutral-700'
                  }`}
                />
                <div className="flex items-center justify-between mt-1">
                  {fieldErrors.marketAnalysis ? (
                    <p className="text-sm text-red-600 dark:text-red-400">{fieldErrors.marketAnalysis}</p>
                  ) : (
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">Minimum 50 characters</p>
                  )}
                  <p className={`text-xs ${
                    marketAnalysis.length < 50 ? 'text-red-600 dark:text-red-400' : 'text-neutral-500 dark:text-neutral-400'
                  }`}>
                    {marketAnalysis.length}/50
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Required Documents */}
          <div className="bg-white dark:bg-neutral-900 rounded-xl p-6 border-2 border-neutral-200 dark:border-neutral-800">
            <h2 className="font-display font-bold text-xl text-neutral-900 dark:text-white mb-2">
              Required Financial Documents
            </h2>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-6">
              All documents are required for processing your application
            </p>
            
            <div className="space-y-6">
              {/* Bank Statement 6 Months */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Bank Statement (Last 6 Months) *
                </label>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  multiple
                  required
                  onChange={(e) => {
                    const newFiles = Array.from(e.target.files || []);
                    setBankStatement6Months(prev => [...prev, ...newFiles]);
                  }}
                  className="w-full px-4 py-2 border-2 border-neutral-300 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-primary-50 dark:file:bg-primary-900/30 file:text-primary-700 dark:file:text-primary-300 file:cursor-pointer hover:file:bg-primary-100 dark:hover:file:bg-primary-900/50"
                />
                <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                  You can select multiple files at once or upload separately (files will be added to the list)
                </p>
                {bankStatement6Months.length > 0 && (
                  <div className="mt-2">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">{bankStatement6Months.length} file(s) uploaded</p>
                      <button
                        type="button"
                        onClick={() => setBankStatement6Months([])}
                        className="text-xs text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                      >
                        Clear all
                      </button>
                    </div>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {bankStatement6Months.map((file, index) => (
                        <div key={index} className="flex items-center justify-between text-sm text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/10 px-2 py-1 rounded">
                          <span className="truncate">✓ {file.name}</span>
                          <button
                            type="button"
                            onClick={() => setBankStatement6Months(prev => prev.filter((_, i) => i !== index))}
                            className="ml-2 text-red-600 hover:text-red-700 dark:text-red-400"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Directors BVN */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Directors' BVN *
                </label>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <input
                      type="text"
                      inputMode="numeric"
                      value={currentBVN}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '').slice(0, 11);
                        setCurrentBVN(value);
                      }}
                      maxLength={11}
                      placeholder="Enter 11-digit BVN"
                      className={`w-full px-4 py-2 border-2 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white ${
                        (currentBVN.length > 0 && currentBVN.length < 11) ? 'border-red-500 dark:border-red-500' : 'border-neutral-300 dark:border-neutral-700'
                      }`}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (currentBVN.length === 11 && !directorsBVN.includes(currentBVN)) {
                        setDirectorsBVN(prev => [...prev, currentBVN]);
                        setCurrentBVN('');
                      }
                    }}
                    disabled={currentBVN.length !== 11}
                    className="px-6 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-neutral-400 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors whitespace-nowrap"
                  >
                    Add BVN
                  </button>
                </div>
                {(currentBVN.length > 0 && currentBVN.length < 11) && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    BVN must be exactly 11 digits ({currentBVN.length}/11)
                  </p>
                )}
                <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                  Bank Verification Number (11 digits) - Add multiple directors' BVNs
                </p>
                {directorsBVN.length > 0 && (
                  <div className="mt-2">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">{directorsBVN.length} BVN(s) added</p>
                      <button
                        type="button"
                        onClick={() => setDirectorsBVN([])}
                        className="text-xs text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                      >
                        Clear all
                      </button>
                    </div>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {directorsBVN.map((bvn, index) => (
                        <div key={index} className="flex items-center justify-between text-sm text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/10 px-3 py-2 rounded">
                          <span className="font-mono">✓ {bvn}</span>
                          <button
                            type="button"
                            onClick={() => setDirectorsBVN(prev => prev.filter((_, i) => i !== index))}
                            className="ml-2 text-red-600 hover:text-red-700 dark:text-red-400"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Directors Photo/Selfie */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Directors' Photo/Selfie *
                </label>
                
                {showCamera ? (
                  <div className="space-y-3">
                    <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
                      <video
                        id="camera-video"
                        autoPlay
                        playsInline
                        ref={(video) => {
                          if (video && stream) {
                            video.srcObject = stream;
                          }
                        }}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={capturePhoto}
                        className="flex-1 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Capture
                      </button>
                      <button
                        type="button"
                        onClick={stopCamera}
                        className="px-6 py-3 bg-neutral-600 hover:bg-neutral-700 text-white rounded-lg font-medium transition-colors"
                      >
                        Done
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={startCamera}
                        className="flex-1 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Take Photo
                      </button>
                      <button
                        type="button"
                        onClick={() => document.getElementById('photo-upload')?.click()}
                        className="flex-1 px-6 py-3 bg-neutral-600 hover:bg-neutral-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                        Upload File
                      </button>
                    </div>
                    <input
                      id="photo-upload"
                      type="file"
                      accept="image/*"
                      multiple
                      required={directorsPhoto.length === 0}
                      onChange={(e) => {
                        const newFiles = Array.from(e.target.files || []);
                        setDirectorsPhoto(prev => [...prev, ...newFiles]);
                      }}
                      className="hidden"
                    />
                  </div>
                )}
                
                <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                  Take photos using your camera or upload existing images (multiple directors' photos)
                </p>
                {directorsPhoto.length > 0 && (
                  <div className="mt-2">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">{directorsPhoto.length} photo(s) uploaded</p>
                      <button
                        type="button"
                        onClick={() => setDirectorsPhoto([])}
                        className="text-xs text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                      >
                        Clear all
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                      {directorsPhoto.map((file, index) => (
                        <div key={index} className="relative group">
                          <div className="aspect-square rounded-lg overflow-hidden bg-neutral-100 dark:bg-neutral-800">
                            <img
                              src={URL.createObjectURL(file)}
                              alt={`Director ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => setDirectorsPhoto(prev => prev.filter((_, i) => i !== index))}
                            className="absolute top-1 right-1 w-6 h-6 bg-red-600 hover:bg-red-700 text-white rounded-full flex items-center justify-center text-sm font-bold"
                          >
                            ×
                          </button>
                          <p className="mt-1 text-xs text-neutral-600 dark:text-neutral-400 truncate">{file.name}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* 2 Years Audited Statements */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Audited Financial Statements (Last 2 Years) *
                </label>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  multiple
                  required
                  onChange={(e) => {
                    const newFiles = Array.from(e.target.files || []);
                    setAuditedStatements2Years(prev => [...prev, ...newFiles]);
                  }}
                  className="w-full px-4 py-2 border-2 border-neutral-300 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-primary-50 dark:file:bg-primary-900/30 file:text-primary-700 dark:file:text-primary-300 file:cursor-pointer hover:file:bg-primary-100 dark:hover:file:bg-primary-900/50"
                />
                <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                  You can select multiple files at once or upload separately (e.g., separate documents for each year)
                </p>
                {auditedStatements2Years.length > 0 && (
                  <div className="mt-2">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">{auditedStatements2Years.length} file(s) uploaded</p>
                      <button
                        type="button"
                        onClick={() => setAuditedStatements2Years([])}
                        className="text-xs text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                      >
                        Clear all
                      </button>
                    </div>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {auditedStatements2Years.map((file, index) => (
                        <div key={index} className="flex items-center justify-between text-sm text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/10 px-2 py-1 rounded">
                          <span className="truncate">✓ {file.name}</span>
                          <button
                            type="button"
                            onClick={() => setAuditedStatements2Years(prev => prev.filter((_, i) => i !== index))}
                            className="ml-2 text-red-600 hover:text-red-700 dark:text-red-400"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Directors ID */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Directors' Means of Identification *
                </label>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  multiple
                  required
                  onChange={(e) => {
                    const newFiles = Array.from(e.target.files || []);
                    setDirectorsID(prev => [...prev, ...newFiles]);
                  }}
                  className="w-full px-4 py-2 border-2 border-neutral-300 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-primary-50 dark:file:bg-primary-900/30 file:text-primary-700 dark:file:text-primary-300 file:cursor-pointer hover:file:bg-primary-100 dark:hover:file:bg-primary-900/50"
                />
                <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                  National ID, Driver's License, International Passport, or Voter's Card (You can upload multiple files)
                </p>
                {directorsID.length > 0 && (
                  <div className="mt-2">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">{directorsID.length} file(s) uploaded</p>
                      <button
                        type="button"
                        onClick={() => setDirectorsID([])}
                        className="text-xs text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                      >
                        Clear all
                      </button>
                    </div>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {directorsID.map((file, index) => (
                        <div key={index} className="flex items-center justify-between text-sm text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/10 px-2 py-1 rounded">
                          <span className="truncate">✓ {file.name}</span>
                          <button
                            type="button"
                            onClick={() => setDirectorsID(prev => prev.filter((_, i) => i !== index))}
                            className="ml-2 text-red-600 hover:text-red-700 dark:text-red-400"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Collateral Documents */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Collateral Documents or Member Guarantee Letter *
                </label>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  multiple
                  required
                  onChange={(e) => {
                    const newFiles = Array.from(e.target.files || []);
                    setCollateralDocs(prev => [...prev, ...newFiles]);
                  }}
                  className="w-full px-4 py-2 border-2 border-neutral-300 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-primary-50 dark:file:bg-primary-900/30 file:text-primary-700 dark:file:text-primary-300 file:cursor-pointer hover:file:bg-primary-100 dark:hover:file:bg-primary-900/50"
                />
                <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                  Property documents, equipment titles, or signed member guarantee letters (You can upload multiple files)
                </p>
                {collateralDocs.length > 0 && (
                  <div className="mt-2">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">{collateralDocs.length} file(s) uploaded</p>
                      <button
                        type="button"
                        onClick={() => setCollateralDocs([])}
                        className="text-xs text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                      >
                        Clear all
                      </button>
                    </div>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {collateralDocs.map((file, index) => (
                        <div key={index} className="flex items-center justify-between text-sm text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/10 px-2 py-1 rounded">
                          <span className="truncate">✓ {file.name}</span>
                          <button
                            type="button"
                            onClick={() => setCollateralDocs(prev => prev.filter((_, i) => i !== index))}
                            className="ml-2 text-red-600 hover:text-red-700 dark:text-red-400"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-4">
            <Link
              href="/business/dashboard"
              className="px-6 py-3 border-2 border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-lg font-medium hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors"
            >
              Review Application
            </button>
          </div>
        </form>
      </main>

      {/* Review Page Modal */}
      {showReview && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-neutral-900 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border-[3px] border-black dark:border-primary-400 shadow-[8px_8px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_#7888FF]">
            <div className="sticky top-0 bg-white dark:bg-neutral-900 border-b-[3px] border-black dark:border-primary-400 p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">Review Your Application</h2>
                <button
                  onClick={() => setShowReview(false)}
                  className="text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200 text-2xl font-bold"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Business Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-primary-600 dark:text-primary-400">Business Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-neutral-500 dark:text-neutral-400">Business Name</p>
                    <p className="font-medium text-neutral-900 dark:text-white">{profile?.businessName}</p>
                  </div>
                  <div>
                    <p className="text-neutral-500 dark:text-neutral-400">Registration Number</p>
                    <p className="font-medium text-neutral-900 dark:text-white">{profile?.registrationNumber}</p>
                  </div>
                  <div>
                    <p className="text-neutral-500 dark:text-neutral-400">Industry</p>
                    <p className="font-medium text-neutral-900 dark:text-white">{profile?.industry}</p>
                  </div>
                  <div>
                    <p className="text-neutral-500 dark:text-neutral-400">Number of Employees</p>
                    <p className="font-medium text-neutral-900 dark:text-white">{profile?.numberOfEmployees}</p>
                  </div>
                </div>
              </div>

              {/* Financing Details */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-primary-600 dark:text-primary-400">Financing Details</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-neutral-500 dark:text-neutral-400">Contract Type</p>
                    <p className="font-medium text-neutral-900 dark:text-white capitalize">{contractType}</p>
                  </div>
                  <div>
                    <p className="text-neutral-500 dark:text-neutral-400">Requested Amount</p>
                    <p className="font-medium text-neutral-900 dark:text-white">₦{requestedAmount.toLocaleString()}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-neutral-500 dark:text-neutral-400">Purpose</p>
                    <p className="font-medium text-neutral-900 dark:text-white">{purpose}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-neutral-500 dark:text-neutral-400">Business Description</p>
                    <p className="font-medium text-neutral-900 dark:text-white">{businessPlan}</p>
                  </div>
                </div>
              </div>

              {/* Documents */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-primary-600 dark:text-primary-400">Documents</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-primary-600 dark:text-primary-400">✓</span>
                    <span className="text-neutral-700 dark:text-neutral-300">Bank Statements: {bankStatement6Months.length} file(s)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-primary-600 dark:text-primary-400">✓</span>
                    <span className="text-neutral-700 dark:text-neutral-300">Directors BVN: {directorsBVN.length} BVN(s)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-primary-600 dark:text-primary-400">✓</span>
                    <span className="text-neutral-700 dark:text-neutral-300">Directors Photo: {directorsPhoto.length} photo(s)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-primary-600 dark:text-primary-400">✓</span>
                    <span className="text-neutral-700 dark:text-neutral-300">Audited Statements: {auditedStatements2Years.length} file(s)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-primary-600 dark:text-primary-400">✓</span>
                    <span className="text-neutral-700 dark:text-neutral-300">Directors ID: {directorsID.length} file(s)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-primary-600 dark:text-primary-400">✓</span>
                    <span className="text-neutral-700 dark:text-neutral-300">Collateral Documents: {collateralDocs.length} file(s)</span>
                  </div>
                </div>
              </div>

              {error && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border-2 border-red-500 rounded-lg">
                  <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-4 pt-4 border-t-[3px] border-neutral-200 dark:border-neutral-700">
                <button
                  onClick={() => setShowReview(false)}
                  disabled={submitting}
                  className="px-6 py-3 border-2 border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-lg font-medium hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors disabled:opacity-50"
                >
                  Back to Edit
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {submitting ? "Uploading documents and submitting..." : "Submit Application"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
