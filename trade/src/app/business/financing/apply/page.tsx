"use client";

import { ThemeToggle } from "@/components/theme-toggle";
import { AuthButton } from "@/components/auth-button";
import { initSatellite, onAuthStateChange, setDoc, listDocs, uploadFile, type Doc } from "@junobuild/core";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { BusinessProfile, ApplicationData } from "@/schemas";
import { validateData } from "@/utils/validation";
import { applicationDataSchema } from "@/schemas";
import toast from "react-hot-toast";
import { logger } from "@/utils/logger";
import { validateStatusTransition, type ApplicationStatus } from "@/utils/application-status-machine";
import { ErrorBoundary } from "@/components/error-boundary";
import { StepIndicator } from "@/components/step-indicator";
import { CharacterCountInput } from "@/components/character-count-input";
import { ValidationErrorSummary, InlineErrorMessage } from "@/components/validation-error-summary";
import { MurabahaFields } from "@/components/contracts/murabaha-fields";
import { MudarabahFields } from "@/components/contracts/mudarabah-fields";
import { MusharakahFields } from "@/components/contracts/musharakah-fields";
import { IjarahFields } from "@/components/contracts/ijarah-fields";
import { SalamFields } from "@/components/contracts/salam-fields";
import type { MurabahaTerms, MudarabahTerms, MusharakahTerms, IjarahTerms, SalamTerms } from "@/schemas/islamic-contracts.schema";

type User = {
  key: string;
} | null | undefined;

function ApplyForFinancingPageContent() {
  const [user, setUser] = useState<User>(undefined);
  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  const [existingApplication, setExistingApplication] = useState<Doc<ApplicationData> | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  // Form state
  const [contractType, setContractType] = useState<ApplicationData["contractType"]>("musharaka");
  const [requestedAmount, setRequestedAmount] = useState<number>(100000);
  const [fundingDuration, setFundingDuration] = useState<number>(12); // Default 12 months
  const [purpose, setPurpose] = useState("");
  const [businessPlan, setBusinessPlan] = useState("");
  const [revenueModel, setRevenueModel] = useState("");
  const [marketAnalysis, setMarketAnalysis] = useState("");
  const [useOfFunds, setUseOfFunds] = useState("");
  const [repaymentPlan, setRepaymentPlan] = useState("");
  const [collateralDescription, setCollateralDescription] = useState("");

  // Contract-specific terms state
  const [murabahaTerms, setMurabahaTerms] = useState<Partial<MurabahaTerms>>({});
  const [mudarabahTerms, setMudarabahTerms] = useState<Partial<MudarabahTerms>>({});
  const [musharakahTerms, setMusharakahTerms] = useState<Partial<MusharakahTerms>>({});
  const [ijarahTerms, setIjarahTerms] = useState<Partial<IjarahTerms>>({});
  const [salamTerms, setSalamTerms] = useState<Partial<SalamTerms>>({});
  const [contractFieldErrors, setContractFieldErrors] = useState<{[key: string]: string}>({});

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
  const [currentStep, setCurrentStep] = useState(1);
  const [resubmissionFiles, setResubmissionFiles] = useState<File[]>([]);

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

      // Load existing application if any
      const applicationsResult = await listDocs<ApplicationData>({
        collection: "business_applications",
      });

      const userApp = applicationsResult.items.find(
        (doc) => doc.key.startsWith(user.key) || doc.owner === user.key
      );

      if (userApp) {
        setExistingApplication(userApp);
      }
    } catch (error) {
      logger.error("Error loading profile:", error);
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
      logger.error("Error accessing camera:", err);
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
    
    // Contract-specific validation
    const contractErrors: {[key: string]: string} = {};
    
    if (contractType === "murabaha") {
      if (!murabahaTerms.assetDescription) contractErrors.assetDescription = "Asset description is required";
      if (!murabahaTerms.costPrice || murabahaTerms.costPrice <= 0) contractErrors.costPrice = "Cost price must be greater than 0";
      if (!murabahaTerms.profitRate || murabahaTerms.profitRate <= 0) contractErrors.profitRate = "Profit rate must be greater than 0";
      if (!murabahaTerms.numberOfInstallments || murabahaTerms.numberOfInstallments < 1) contractErrors.numberOfInstallments = "Number of installments must be at least 1";
    }
    
    if (contractType === "mudaraba") {  // Note: ApplicationData uses "mudaraba" not "mudarabah"
      if (!mudarabahTerms.capitalAmount || mudarabahTerms.capitalAmount <= 0) contractErrors.capitalAmount = "Capital amount must be greater than 0";
      if (!mudarabahTerms.businessActivity) contractErrors.businessActivity = "Business activity description is required";
      if (!mudarabahTerms.investorProfitShare || mudarabahTerms.investorProfitShare <= 0) contractErrors.investorProfitShare = "Investor profit share must be greater than 0";
      if (!mudarabahTerms.mudaribProfitShare || mudarabahTerms.mudaribProfitShare <= 0) contractErrors.mudaribProfitShare = "Mudarib profit share must be greater than 0";
      if (mudarabahTerms.investorProfitShare && mudarabahTerms.mudaribProfitShare) {
        const total = mudarabahTerms.investorProfitShare + mudarabahTerms.mudaribProfitShare;
        if (Math.abs(total - 100) > 0.1) contractErrors.profitShare = "Total profit share must equal 100%";
      }
    }
    
    if (contractType === "musharaka") {
      if (!musharakahTerms.businessPurpose) contractErrors.businessPurpose = "Business purpose is required";
      if (!musharakahTerms.party1Capital || musharakahTerms.party1Capital <= 0) contractErrors.party1Capital = "Partner 1 capital must be greater than 0";
      if (!musharakahTerms.party2Capital || musharakahTerms.party2Capital <= 0) contractErrors.party2Capital = "Partner 2 capital must be greater than 0";
      if (!musharakahTerms.party1ProfitShare || musharakahTerms.party1ProfitShare <= 0) contractErrors.party1ProfitShare = "Partner 1 profit share must be greater than 0";
      if (!musharakahTerms.party2ProfitShare || musharakahTerms.party2ProfitShare <= 0) contractErrors.party2ProfitShare = "Partner 2 profit share must be greater than 0";
      if (musharakahTerms.party1ProfitShare && musharakahTerms.party2ProfitShare) {
        const total = musharakahTerms.party1ProfitShare + musharakahTerms.party2ProfitShare;
        if (Math.abs(total - 100) > 0.1) contractErrors.profitShare = "Total profit share must equal 100%";
      }
    }
    
    if (contractType === "ijara") {  // Note: ApplicationData uses "ijara" not "ijarah"
      if (!ijarahTerms.assetDescription) contractErrors.assetDescription = "Asset description is required";
      if (!ijarahTerms.assetValue || ijarahTerms.assetValue <= 0) contractErrors.assetValue = "Asset value must be greater than 0";
      if (!ijarahTerms.monthlyRental || ijarahTerms.monthlyRental <= 0) contractErrors.monthlyRental = "Monthly rental must be greater than 0";
      if (!ijarahTerms.leaseTerm || ijarahTerms.leaseTerm < 1) contractErrors.leaseTerm = "Lease term must be at least 1 month";
    }
    
    if (contractType === "istisna") {  // Note: Using "istisna" but we don't have Istisna component yet - could map to Salam for now
      if (!salamTerms.commodityDescription) contractErrors.commodityDescription = "Commodity description is required";
      if (!salamTerms.quantity || salamTerms.quantity <= 0) contractErrors.quantity = "Quantity must be greater than 0";
      if (!salamTerms.unit) contractErrors.unit = "Unit is required";
      if (!salamTerms.qualitySpecifications || salamTerms.qualitySpecifications.length === 0) contractErrors.qualitySpecifications = "Quality specifications are required";
      if (!salamTerms.agreedPrice || salamTerms.agreedPrice <= 0) contractErrors.agreedPrice = "Agreed price must be greater than 0";
      if (!salamTerms.advancePayment || salamTerms.advancePayment <= 0) contractErrors.advancePayment = "Advance payment must be greater than 0";
      if (!salamTerms.deliveryDate) contractErrors.deliveryDate = "Delivery date is required";
      if (!salamTerms.deliveryLocation) contractErrors.deliveryLocation = "Delivery location is required";
    }
    
    setContractFieldErrors(contractErrors);
    
    if (Object.keys(errors).length > 0 || Object.keys(contractErrors).length > 0) {
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
      // Check for duplicate/pending applications before allowing new submission
      if (!existingApplication || existingApplication.data.status === 'rejected') {
        // Check if there's already a pending or approved application
        const applicationsResult = await listDocs<ApplicationData>({
          collection: "business_applications",
        });
        
        const userApps = applicationsResult.items.filter(
          (doc) => doc.key.startsWith(user.key) || doc.owner === user.key
        );
        
        const hasPendingOrApproved = userApps.some(
          (app) => app.data.status === 'pending' || app.data.status === 'approved' || app.data.status === 'review'
        );
        
        if (hasPendingOrApproved) {
          toast.error("You already have a pending or approved application. Please wait for review completion.");
          setSubmitting(false);
          return;
        }
      }
      
      // If resubmitting a rejected application, reuse the existing key
      // Otherwise create a new key
      const isResubmission = existingApplication && 
        existingApplication.data.status === 'rejected' && 
        existingApplication.data.rejectionAllowsResubmit !== false;
      
      // Validate status transition for resubmissions
      if (isResubmission && existingApplication) {
        const currentStatus = existingApplication.data.status as ApplicationStatus;
        const transitionValidation = validateStatusTransition(currentStatus, "pending", {
          isBusiness: true,
          isResubmission: true,
          rejectionAllowsResubmit: existingApplication.data.rejectionAllowsResubmit !== false,
        });
        
        if (!transitionValidation.isValid) {
          toast.error(transitionValidation.error || "Cannot resubmit this application");
          setSubmitting(false);
          return;
        }
      }
      
      const applicationKey = isResubmission 
        ? existingApplication.key 
        : `${user.key}_${Date.now()}`;
      
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
        fundingDuration: fundingDuration, // User-configurable duration
        fundingPurpose: purpose,
        purpose,
        status: "pending",
        documentsSubmitted: true,
        documentsStatus: "uploaded",
        documents: uploadedDocs, // Store document URLs
        // Add contract-specific terms based on selected type
        contractTerms: contractType === "murabaha" ? murabahaTerms :
                      contractType === "mudaraba" ? mudarabahTerms :
                      contractType === "musharaka" ? musharakahTerms :
                      contractType === "ijara" ? ijarahTerms :
                      contractType === "istisna" ? salamTerms :
                      undefined,
      };

      // Validate data
      const validation = validateData(applicationDataSchema, applicationData);
      if (!validation.success) {
        setError(Object.values(validation.errors).join(", "));
        setSubmitting(false);
        return;
      }

      // Save application to Juno datastore immediately
      await setDoc({
        collection: "business_applications",
        doc: {
          key: applicationKey,
          data: {
            ...applicationData,
            submittedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            resubmittedAt: isResubmission ? new Date().toISOString() : undefined,
            // Clear rejection fields when resubmitting
            rejectionReason: undefined,
            rejectionAllowsResubmit: undefined,
            adminMessage: undefined,
          },
          // Include version if updating existing application
          ...(isResubmission && existingApplication ? { version: existingApplication.version } : {}),
        },
      });

      const successMessage = isResubmission 
        ? "Application resubmitted successfully! Your updated application will be reviewed by the admin."
        : "Application submitted successfully! It will be reviewed by the admin.";
      
      toast.success(successMessage);
      
      // Redirect to dashboard
      router.push("/business/dashboard");
    } catch (err: any) {
      logger.error("Application error:", err);
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
        {/* Step Indicator */}
        {!showReview && (
          <StepIndicator
            currentStep={currentStep}
            totalSteps={5}
            steps={[
              { label: "Financing Type", description: "Select your preferred contract structure" },
              { label: "Business Details", description: "Tell us about your business plan" },
              { label: "Financial Information", description: "Market analysis and fund usage" },
              { label: "Documents", description: "Upload required supporting documents" },
              { label: "Review & Submit", description: "Verify your application before submission" },
            ]}
          />
        )}

        <div className="mb-8">
          <h1 className="font-display font-bold text-3xl text-neutral-900 dark:text-white mb-2">
            Apply for Shariah-Compliant Financing
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400">
            Submit your financing application for {profile.businessName}
          </p>
        </div>

        {/* Application Rejection Notice */}
        {existingApplication && existingApplication.data.status === "rejected" && (
          <div className={`mb-6 p-6 border-2 rounded-lg ${
            existingApplication.data.rejectionAllowsResubmit === false
              ? 'bg-error-50 dark:bg-error-900/20 border-error-200 dark:border-error-800'
              : 'bg-warning-50 dark:bg-warning-900/20 border-warning-200 dark:border-warning-800'
          }`}>
            <h3 className={`font-bold text-lg mb-2 ${
              existingApplication.data.rejectionAllowsResubmit === false
                ? 'text-error-800 dark:text-error-300'
                : 'text-warning-800 dark:text-warning-300'
            }`}>
              {existingApplication.data.rejectionAllowsResubmit === false ? (
                <>❌ Application Permanently Rejected</>
              ) : (
                <>⚠️ Application Rejected - Resubmission Allowed</>
              )}
            </h3>
            <p className={`text-sm mb-3 ${
              existingApplication.data.rejectionAllowsResubmit === false
                ? 'text-error-700 dark:text-error-300'
                : 'text-warning-700 dark:text-warning-300'
            }`}>
              <strong>Reason:</strong> {existingApplication.data.rejectionReason || existingApplication.data.adminMessage || "No reason provided"}
            </p>
            {existingApplication.data.rejectionAllowsResubmit === false ? (
              <p className="text-sm text-error-700 dark:text-error-300 font-medium">
                🚫 This application cannot be resubmitted. Please contact support if you believe this is an error.
              </p>
            ) : (
              <p className="text-sm text-warning-700 dark:text-warning-300">
                ✓ You can submit a new application below. Please address the rejection reason in your resubmission.
              </p>
            )}
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
          </div>
        )}

        {/* Disable form if permanently rejected */}
        {existingApplication?.data.status === "rejected" && existingApplication.data.rejectionAllowsResubmit === false ? (
          <div className="bg-neutral-100 dark:bg-neutral-800 rounded-xl p-8 border-2 border-neutral-300 dark:border-neutral-700 text-center">
            <p className="text-neutral-600 dark:text-neutral-400 text-lg">
              Application form is disabled due to permanent rejection.
            </p>
            <p className="text-neutral-500 dark:text-neutral-500 text-sm mt-2">
              Please contact support for assistance.
            </p>
          </div>
        ) : (
        <form onSubmit={handleReviewSubmit} className="space-y-8">
          {/* Validation Error Summary */}
          {Object.keys(fieldErrors).length > 0 && (
            <ValidationErrorSummary 
              errors={fieldErrors}
              onErrorClick={(fieldName) => {
                setFieldErrors(prev => {
                  const { [fieldName]: removed, ...rest } = prev;
                  return rest;
                });
              }}
            />
          )}

          {/* Resubmission File Upload Section */}
          {existingApplication && existingApplication.data.status === "rejected" && existingApplication.data.rejectionAllowsResubmit !== false && (
            <div className="bg-warning-50 dark:bg-warning-900/20 rounded-xl p-6 border-2 border-warning-300 dark:border-warning-700">
              <h3 className="font-bold text-lg text-warning-900 dark:text-warning-100 mb-3">
                📎 Supporting Documents for Resubmission
              </h3>
              <p className="text-sm text-warning-700 dark:text-warning-300 mb-4" id="resubmission-reason">
                Attach any additional documents that address the rejection reason:
                <strong className="block mt-1">{existingApplication.data.rejectionReason}</strong>
              </p>
              <label htmlFor="resubmission-files" className="sr-only">
                Upload supporting documents for resubmission
              </label>
              <input
                id="resubmission-files"
                type="file"
                multiple
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => {
                  if (e.target.files) {
                    setResubmissionFiles(Array.from(e.target.files));
                  }
                }}
                aria-describedby="resubmission-reason"
                aria-label="Upload supporting documents for resubmission"
                className="block w-full text-sm text-neutral-500 dark:text-neutral-400
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-lg file:border-0
                  file:text-sm file:font-semibold
                  file:bg-warning-600 file:text-white
                  hover:file:bg-warning-700
                  file:cursor-pointer"
              />
              {resubmissionFiles.length > 0 && (
                <div className="mt-3 space-y-2">
                  <p className="text-sm font-medium text-warning-800 dark:text-warning-200">
                    Selected files ({resubmissionFiles.length}):
                  </p>
                  {resubmissionFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between text-sm bg-white dark:bg-neutral-800 rounded px-3 py-2">
                      <span className="text-neutral-700 dark:text-neutral-300">{file.name}</span>
                      <button
                        type="button"
                        onClick={() => setResubmissionFiles(prev => prev.filter((_, i) => i !== index))}
                        className="text-danger-600 hover:text-danger-700 dark:text-danger-400 dark:hover:text-danger-300"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

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

          {/* Contract-Specific Fields */}
          {contractType === "murabaha" && (
            <MurabahaFields
              terms={murabahaTerms}
              onChange={(field, value) => setMurabahaTerms(prev => ({ ...prev, [field]: value }))}
              errors={contractFieldErrors as Partial<Record<keyof MurabahaTerms, string>>}
            />
          )}
          {contractType === "mudaraba" && (
            <MudarabahFields
              terms={mudarabahTerms}
              onChange={(field, value) => setMudarabahTerms(prev => ({ ...prev, [field]: value }))}
              errors={contractFieldErrors as Partial<Record<keyof MudarabahTerms, string>>}
            />
          )}
          {contractType === "musharaka" && (
            <MusharakahFields
              terms={musharakahTerms}
              onChange={(field, value) => setMusharakahTerms(prev => ({ ...prev, [field]: value }))}
              errors={contractFieldErrors as Partial<Record<keyof MusharakahTerms, string>>}
            />
          )}
          {contractType === "ijara" && (
            <IjarahFields
              terms={ijarahTerms}
              onChange={(field, value) => setIjarahTerms(prev => ({ ...prev, [field]: value }))}
              errors={contractFieldErrors as Partial<Record<keyof IjarahTerms, string>>}
            />
          )}
          {contractType === "istisna" && (
            <SalamFields
              terms={salamTerms}
              onChange={(field, value) => setSalamTerms(prev => ({ ...prev, [field]: value }))}
              errors={contractFieldErrors as Partial<Record<keyof SalamTerms, string>>}
            />
          )}

          {/* Financing Amount */}
          <div className="bg-white dark:bg-neutral-900 rounded-xl p-6 border-2 border-neutral-200 dark:border-neutral-800">
            <h2 className="font-display font-bold text-xl text-neutral-900 dark:text-white mb-4">
              Financing Details
            </h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="requestedAmount" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Requested Amount (₦) *
                </label>
                <input
                  id="requestedAmount"
                  name="requestedAmount"
                  type="number"
                  value={requestedAmount || ""}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 0;
                    setRequestedAmount(value);
                    if (value > 0 && value < 10000) {
                      setFieldErrors(prev => ({...prev, requestedAmount: 'Minimum amount is ₦10,000'}));
                    } else if (value > 100000000) {
                      setFieldErrors(prev => ({...prev, requestedAmount: 'Maximum amount is ₦100,000,000'}));
                    } else {
                      setFieldErrors(prev => {const {requestedAmount, ...rest} = prev; return rest;});
                    }
                  }}
                  min={10000}
                  max={100000000}
                  required
                  aria-required="true"
                  aria-invalid={!!fieldErrors.requestedAmount}
                  aria-describedby={fieldErrors.requestedAmount ? "requestedAmount-error requestedAmount-help" : "requestedAmount-help"}
                  className={`w-full px-4 py-2 border-2 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white ${
                    fieldErrors.requestedAmount ? 'border-red-500 dark:border-red-500' : 'border-neutral-300 dark:border-neutral-700'
                  }`}
                />
                {fieldErrors.requestedAmount && (
                  <p id="requestedAmount-error" className="text-sm text-red-600 dark:text-red-400 mt-1" role="alert">{fieldErrors.requestedAmount}</p>
                )}
                <p id="requestedAmount-help" className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                  Enter amount between ₦10,000 and ₦100,000,000
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Funding Duration (Months) *
                </label>
                <select
                  value={fundingDuration || ""}
                  onChange={(e) => setFundingDuration(parseInt(e.target.value) || 12)}
                  required
                  className="w-full px-4 py-2 border-2 border-neutral-300 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
                >
                  <option value="">Select duration</option>
                  <option value="6">6 months</option>
                  <option value="12">12 months (1 year)</option>
                  <option value="18">18 months</option>
                  <option value="24">24 months (2 years)</option>
                  <option value="36">36 months (3 years)</option>
                  <option value="48">48 months (4 years)</option>
                  <option value="60">60 months (5 years)</option>
                </select>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                  Select the period over which you plan to repay the financing
                </p>
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
          <div className="flex justify-between items-center gap-4">
            {currentStep > 1 && !showReview ? (
              <button
                type="button"
                onClick={() => {
                  setCurrentStep(prev => Math.max(1, prev - 1));
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="px-6 py-3 border-2 border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-lg font-medium hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              >
                ← Previous Step
              </button>
            ) : (
              <Link
                href="/business/dashboard"
                className="px-6 py-3 border-2 border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-lg font-medium hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              >
                Cancel
              </Link>
            )}
            
            {currentStep < 5 ? (
              <button
                type="button"
                onClick={() => {
                  // Basic validation before moving to next step
                  if (currentStep === 1 && !contractType) {
                    setFieldErrors(prev => ({...prev, contractType: 'Please select a financing type'}));
                    return;
                  }
                  if (currentStep === 1 && (requestedAmount < 10000 || requestedAmount > 100000000)) {
                    setFieldErrors(prev => ({...prev, requestedAmount: 'Invalid amount'}));
                    return;
                  }
                  setCurrentStep(prev => Math.min(5, prev + 1));
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                Continue to Step {currentStep + 1}
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            ) : (
              <button
                type="submit"
                className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors"
              >
                Review Application
              </button>
            )}
          </div>
        </form>
        )}
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

// Wrap with Error Boundary
export default function ApplyForFinancingPage() {
  return (
    <ErrorBoundary>
      <ApplyForFinancingPageContent />
    </ErrorBoundary>
  );
}
