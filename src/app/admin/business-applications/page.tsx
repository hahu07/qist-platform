"use client";

import { ThemeToggle } from "@/components/theme-toggle";
import { initSatellite, onAuthStateChange, signOut, listDocs, getDoc, setDoc, type Doc } from "@junobuild/core";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { applicationDataSchema, applicationStatusSchema, opportunitySchema, type ApplicationData, type OpportunityFormData } from "@/schemas";
import { validateOrThrow } from "@/utils/validation";

type User = {
  key: string;
} | null | undefined;

type Application = Doc<ApplicationData>;

type CheckStatus = 'pass' | 'fail' | 'na' | 'unknown';

interface DueDiligenceChecklist {
  financial: {
    financialStatementsReviewed: CheckStatus;
    bankStatementsVerified: CheckStatus;
    cashFlowAnalyzed: CheckStatus;
    debtEquityRatioAcceptable: CheckStatus;
    profitabilityAcceptable: CheckStatus;
  };
  legal: {
    businessRegistrationValid: CheckStatus;
    licensesVerified: CheckStatus;
    taxComplianceConfirmed: CheckStatus;
    regulatoryApprovalsObtained: CheckStatus;
  };
  identity: {
    bvnVerified: CheckStatus;
    identityDocumentsValid: CheckStatus;
    backgroundCheckCleared: CheckStatus;
    ownershipStructureConfirmed: CheckStatus;
  };
  operational: {
    businessViabilityConfirmed: CheckStatus;
    industryAnalysisCompleted: CheckStatus;
    businessModelAssessed: CheckStatus;
    marketPositionEvaluated: CheckStatus;
  };
  collateral: {
    assetValuationCompleted: CheckStatus;
    titleDocumentsVerified: CheckStatus;
    insuranceCoverageConfirmed: CheckStatus;
    legalEncumbrancesChecked: CheckStatus;
  };
  shariah: {
    businessActivitiesHalal: CheckStatus;
    noInterestBasedOperations: CheckStatus;
    noProhibitedSectors: CheckStatus;
  };
}

export default function AdminApplicationsPage() {
  const [user, setUser] = useState<User>(undefined);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [showApprovalForm, setShowApprovalForm] = useState(false);
  const [showRequestInfoForm, setShowRequestInfoForm] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'due-diligence' | 'pricing' | 'recommendations'>('details');
  const [dueDiligence, setDueDiligence] = useState<DueDiligenceChecklist>({
    financial: {
      financialStatementsReviewed: 'unknown',
      bankStatementsVerified: 'unknown',
      cashFlowAnalyzed: 'unknown',
      debtEquityRatioAcceptable: 'unknown',
      profitabilityAcceptable: 'unknown',
    },
    legal: {
      businessRegistrationValid: 'unknown',
      licensesVerified: 'unknown',
      taxComplianceConfirmed: 'unknown',
      regulatoryApprovalsObtained: 'unknown',
    },
    identity: {
      bvnVerified: 'unknown',
      identityDocumentsValid: 'unknown',
      backgroundCheckCleared: 'unknown',
      ownershipStructureConfirmed: 'unknown',
    },
    operational: {
      businessViabilityConfirmed: 'unknown',
      industryAnalysisCompleted: 'unknown',
      businessModelAssessed: 'unknown',
      marketPositionEvaluated: 'unknown',
    },
    collateral: {
      assetValuationCompleted: 'unknown',
      titleDocumentsVerified: 'unknown',
      insuranceCoverageConfirmed: 'unknown',
      legalEncumbrancesChecked: 'unknown',
    },
    shariah: {
      businessActivitiesHalal: 'unknown',
      noInterestBasedOperations: 'unknown',
      noProhibitedSectors: 'unknown',
    },
  });
  const [dueDiligenceNotes, setDueDiligenceNotes] = useState('');
  const [riskRating, setRiskRating] = useState<'low' | 'moderate' | 'high'>('moderate');
  const [showFinancialCalculator, setShowFinancialCalculator] = useState(false);
  const [financialRatios, setFinancialRatios] = useState({
    currentAssets: 0,
    currentLiabilities: 0,
    totalAssets: 0,
    totalLiabilities: 0,
    totalEquity: 0,
    revenue: 0,
    netIncome: 0,
    operatingIncome: 0,
    inventory: 0,
    costOfGoodsSold: 0,
  });
  const [riskAssessment, setRiskAssessment] = useState({
    overallRiskScore: 'medium',
    creditRating: 'B',
    riskFactors: '',
    mitigationMeasures: '',
    additionalNotes: '',
  });
  const [approvalTerms, setApprovalTerms] = useState({
    returnMin: 12,
    returnMax: 14,
    termMonths: 18,
    minimumInvestment: 500000,
    campaignDays: 30
  });
  const [pricingTerms, setPricingTerms] = useState({
    financingInstrument: 'murabaha', // murabaha, musharakah, mudarabah, ijarah, salam
    costPrice: 0,
    sellingPrice: 0,
    profitAmount: 0,
    profitRate: 0,
    profitSharingRatio: 70, // Business share % (for Musharakah/Mudarabah)
    investorSharingRatio: 30, // Investor share %
    paymentStructure: 'installment', // installment, lump-sum, deferred
    installmentFrequency: 'monthly', // monthly, quarterly, semi-annual, annual
    numberOfInstallments: 18,
    defermentPeriod: 0, // Grace period in months
    latePaymentPenalty: 'charity', // charity, none
    earlySettlementDiscount: 0, // Percentage discount for early payment
    administrationFee: 2, // Platform fee %
    takafulCoverage: false, // Islamic insurance
    collateralValue: 0,
    collateralType: '',
  });
  const [recommendations, setRecommendations] = useState({
    approvalRecommendation: 'pending', // approve, reject, request-info, pending
    recommendedInstrument: 'murabaha',
    recommendedAmount: 0,
    recommendedTerm: 18,
    recommendedProfitRate: 12,
    reasoning: '',
    strengths: [] as string[],
    concerns: [] as string[],
    conditions: [] as string[],
    mitigationSuggestions: '',
  });
  const [adminMessage, setAdminMessage] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [processing, setProcessing] = useState(false);
  
  // Phase 1: Advanced Filtering
  const [filterIndustry, setFilterIndustry] = useState<string>('all');
  const [filterAmountMin, setFilterAmountMin] = useState<string>('');
  const [filterAmountMax, setFilterAmountMax] = useState<string>('');
  const [filterDateFrom, setFilterDateFrom] = useState<string>('');
  const [filterDateTo, setFilterDateTo] = useState<string>('');
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'score'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // Phase 1: Bulk Selection
  const [selectedApplicationIds, setSelectedApplicationIds] = useState<string[]>([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  
  // Phase 1: Internal Notes
  const [internalNotes, setInternalNotes] = useState<{[key: string]: string}>({});
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [currentNotesApplicationKey, setCurrentNotesApplicationKey] = useState<string | null>(null);
  const [notesText, setNotesText] = useState('');
  
  // Phase 1: Document Verification
  const [documentVerification, setDocumentVerification] = useState<{[key: string]: 'verified' | 'rejected' | 'pending'}>({});
  
  const router = useRouter();

  // Auto-calculate risk score when financial ratios change
  useEffect(() => {
    const { score, riskLevel, creditRating } = calculateRiskScoreFromRatios();
    setRiskAssessment(prev => ({
      ...prev,
      overallRiskScore: riskLevel,
      creditRating,
    }));
  }, [financialRatios]);

  // Auto-generate recommendations based on all assessment data
  useEffect(() => {
    if (selectedApplication) {
      generateRecommendations();
    }
  }, [dueDiligence, financialRatios, riskAssessment, pricingTerms, selectedApplication]);

  // Fetch applications and documents
  const fetchApplications = async () => {
    try {
      setLoading(true);
      const { items } = await listDocs<ApplicationData>({
        collection: "business_applications",
        filter: {}
      });
      setApplications(items);
    } catch (error) {
      console.error("Error fetching applications:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredApplications = applications.filter(app => {
    const matchesStatus = filterStatus === 'all' || app.data.status === filterStatus;
    const matchesSearch = app.data.businessName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         app.data.industry.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Phase 1: Advanced Filters
    const matchesIndustry = filterIndustry === 'all' || app.data.industry === filterIndustry;
    
    const appAmount = app.data.requestedAmount || 0;
    const matchesAmountMin = !filterAmountMin || appAmount >= Number(filterAmountMin);
    const matchesAmountMax = !filterAmountMax || appAmount <= Number(filterAmountMax);
    
    const appDate = app.created_at ? new Date(Number(app.created_at) / 1000000) : null;
    const matchesDateFrom = !filterDateFrom || !appDate || appDate >= new Date(filterDateFrom);
    const matchesDateTo = !filterDateTo || !appDate || appDate <= new Date(filterDateTo + 'T23:59:59');
    
    return matchesStatus && matchesSearch && matchesIndustry && matchesAmountMin && matchesAmountMax && matchesDateFrom && matchesDateTo;
  }).sort((a, b) => {
    // Phase 1: Sorting
    let comparison = 0;
    
    if (sortBy === 'date') {
      const dateA = a.created_at ? Number(a.created_at) : 0;
      const dateB = b.created_at ? Number(b.created_at) : 0;
      comparison = dateA - dateB;
    } else if (sortBy === 'amount') {
      const amountA = a.data.requestedAmount || 0;
      const amountB = b.data.requestedAmount || 0;
      comparison = amountA - amountB;
    } else if (sortBy === 'score') {
      const scoreA = a.data.dueDiligenceScore || 0;
      const scoreB = b.data.dueDiligenceScore || 0;
      comparison = scoreA - scoreB;
    }
    
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  // Phase 1: Bulk Selection Handlers
  const toggleSelectAll = () => {
    if (selectedApplicationIds.length === filteredApplications.length) {
      setSelectedApplicationIds([]);
    } else {
      setSelectedApplicationIds(filteredApplications.map(app => app.key));
    }
  };

  const toggleSelectApplication = (key: string) => {
    setSelectedApplicationIds(prev => 
      prev.includes(key) ? prev.filter(id => id !== key) : [...prev, key]
    );
  };

  // Phase 1: CSV Export
  const exportToCSV = () => {
    const appsToExport = selectedApplicationIds.length > 0 
      ? applications.filter(app => selectedApplicationIds.includes(app.key))
      : filteredApplications;
    
    const headers = [
      'Business Name',
      'Industry',
      'Status',
      'Requested Amount',
      'Contract Type',
      'Submitted Date',
      'Days Pending',
      'Due Diligence Score',
      'Risk Rating',
      'Credit Rating',
      'Phone',
      'Email'
    ];
    
    const rows = appsToExport.map(app => [
      app.data.businessName,
      app.data.industry,
      app.data.status,
      app.data.requestedAmount || 0,
      app.data.contractType,
      app.created_at ? new Date(Number(app.created_at) / 1000000).toLocaleDateString() : '',
      getSubmittedDaysAgo(app.created_at),
      app.data.dueDiligenceScore || 0,
      'N/A', // Risk assessment not stored in schema
      'N/A', // Credit rating not stored in schema
      app.data.contactPhone || 'N/A',
      app.data.businessEmail
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `business-applications-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  // Phase 1: Save Internal Notes
  const saveInternalNote = async (applicationKey: string, note: string) => {
    try {
      setInternalNotes(prev => ({ ...prev, [applicationKey]: note }));
      // TODO: Persist to Juno datastore in production
      console.log('Internal note saved:', { applicationKey, note });
    } catch (error) {
      console.error('Error saving internal note:', error);
    }
  };

  const openNotesModal = (applicationKey: string) => {
    setCurrentNotesApplicationKey(applicationKey);
    setNotesText(internalNotes[applicationKey] || '');
    setShowNotesModal(true);
  };

  const closeNotesModal = () => {
    setShowNotesModal(false);
    setCurrentNotesApplicationKey(null);
    setNotesText('');
  };

  const handleSaveNote = async () => {
    if (currentNotesApplicationKey) {
      await saveInternalNote(currentNotesApplicationKey, notesText);
      closeNotesModal();
    }
  };

  const getSubmittedDaysAgo = (timestamp?: bigint): number => {
    if (!timestamp) return 0;
    const now = Date.now();
    const created = Number(timestamp) / 1000000;
    const diffDays = Math.floor((now - created) / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const renderCheckButtons = (category: keyof DueDiligenceChecklist, key: string, value: CheckStatus) => (
    <div className="flex gap-2">
      <button
        onClick={() => setDueDiligence({
          ...dueDiligence,
          [category]: { ...dueDiligence[category], [key]: 'pass' }
        })}
        className={`w-10 h-10 rounded-lg border-2 flex items-center justify-center transition-all ${
          value === 'pass'
            ? 'bg-green-500 border-green-600 text-white shadow-lg scale-105'
            : 'bg-white dark:bg-neutral-800 border-neutral-300 dark:border-neutral-600 text-neutral-400 dark:text-neutral-500 hover:border-green-500 hover:text-green-600'
        }`}
        title="Pass"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </button>
      <button
        onClick={() => setDueDiligence({
          ...dueDiligence,
          [category]: { ...dueDiligence[category], [key]: 'fail' }
        })}
        className={`w-10 h-10 rounded-lg border-2 flex items-center justify-center transition-all ${
          value === 'fail'
            ? 'bg-red-500 border-red-600 text-white shadow-lg scale-105'
            : 'bg-white dark:bg-neutral-800 border-neutral-300 dark:border-neutral-600 text-neutral-400 dark:text-neutral-500 hover:border-red-500 hover:text-red-600'
        }`}
        title="Fail"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
      <button
        onClick={() => setDueDiligence({
          ...dueDiligence,
          [category]: { ...dueDiligence[category], [key]: 'na' }
        })}
        className={`w-10 h-10 rounded-lg border-2 flex items-center justify-center transition-all ${
          value === 'na'
            ? 'bg-neutral-400 border-neutral-500 text-white shadow-lg scale-105'
            : 'bg-white dark:bg-neutral-800 border-neutral-300 dark:border-neutral-600 text-neutral-400 dark:text-neutral-500 hover:border-neutral-500 hover:text-neutral-600'
        }`}
        title="Not Applicable"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
        </svg>
      </button>
      <button
        onClick={() => setDueDiligence({
          ...dueDiligence,
          [category]: { ...dueDiligence[category], [key]: 'unknown' }
        })}
        className={`w-10 h-10 rounded-lg border-2 flex items-center justify-center transition-all ${
          value === 'unknown'
            ? 'bg-amber-500 border-amber-600 text-white shadow-lg scale-105'
            : 'bg-white dark:bg-neutral-800 border-neutral-300 dark:border-neutral-600 text-neutral-400 dark:text-neutral-500 hover:border-amber-500 hover:text-amber-600'
        }`}
        title="Unknown / Need More Info"
      >
        <span className="text-lg font-bold">?</span>
      </button>
    </div>
  );

  const calculateFinancialRatios = () => {
    const currentRatio = financialRatios.currentLiabilities > 0 
      ? (financialRatios.currentAssets / financialRatios.currentLiabilities).toFixed(2) 
      : '0.00';
    
    const debtToEquity = financialRatios.totalEquity > 0 
      ? (financialRatios.totalLiabilities / financialRatios.totalEquity).toFixed(2) 
      : '0.00';
    
    const returnOnAssets = financialRatios.totalAssets > 0 
      ? ((financialRatios.netIncome / financialRatios.totalAssets) * 100).toFixed(2) 
      : '0.00';
    
    const returnOnEquity = financialRatios.totalEquity > 0 
      ? ((financialRatios.netIncome / financialRatios.totalEquity) * 100).toFixed(2) 
      : '0.00';
    
    const profitMargin = financialRatios.revenue > 0 
      ? ((financialRatios.netIncome / financialRatios.revenue) * 100).toFixed(2) 
      : '0.00';
    
    const operatingMargin = financialRatios.revenue > 0 
      ? ((financialRatios.operatingIncome / financialRatios.revenue) * 100).toFixed(2) 
      : '0.00';
    
    const inventoryTurnover = financialRatios.inventory > 0 
      ? (financialRatios.costOfGoodsSold / financialRatios.inventory).toFixed(2) 
      : '0.00';

    return {
      currentRatio,
      debtToEquity,
      returnOnAssets,
      returnOnEquity,
      profitMargin,
      operatingMargin,
      inventoryTurnover,
    };
  };

  const calculateRiskScoreFromRatios = () => {
    const ratios = calculateFinancialRatios();
    let score = 0;
    let maxScore = 0;

    // Current Ratio (Liquidity) - 20 points
    maxScore += 20;
    const currentRatio = parseFloat(ratios.currentRatio);
    if (currentRatio >= 2) score += 20;
    else if (currentRatio >= 1.5) score += 15;
    else if (currentRatio >= 1) score += 10;
    else if (currentRatio >= 0.5) score += 5;

    // Debt-to-Equity (Leverage) - 20 points
    maxScore += 20;
    const debtToEquity = parseFloat(ratios.debtToEquity);
    if (debtToEquity <= 0.5) score += 20;
    else if (debtToEquity <= 1) score += 15;
    else if (debtToEquity <= 2) score += 10;
    else if (debtToEquity <= 3) score += 5;

    // ROA (Profitability) - 15 points
    maxScore += 15;
    const roa = parseFloat(ratios.returnOnAssets);
    if (roa >= 10) score += 15;
    else if (roa >= 5) score += 10;
    else if (roa >= 2) score += 5;

    // ROE (Profitability) - 15 points
    maxScore += 15;
    const roe = parseFloat(ratios.returnOnEquity);
    if (roe >= 15) score += 15;
    else if (roe >= 10) score += 10;
    else if (roe >= 5) score += 5;

    // Profit Margin - 15 points
    maxScore += 15;
    const profitMargin = parseFloat(ratios.profitMargin);
    if (profitMargin >= 15) score += 15;
    else if (profitMargin >= 10) score += 10;
    else if (profitMargin >= 5) score += 5;

    // Operating Margin - 15 points
    maxScore += 15;
    const operatingMargin = parseFloat(ratios.operatingMargin);
    if (operatingMargin >= 20) score += 15;
    else if (operatingMargin >= 15) score += 10;
    else if (operatingMargin >= 10) score += 5;

    const percentage = maxScore > 0 ? (score / maxScore) * 100 : 0;

    // Determine risk level and credit rating
    let riskLevel = 'high';
    let creditRating = 'C';
    
    if (percentage >= 85) {
      riskLevel = 'low';
      creditRating = 'A+';
    } else if (percentage >= 75) {
      riskLevel = 'low';
      creditRating = 'A';
    } else if (percentage >= 65) {
      riskLevel = 'medium';
      creditRating = 'B+';
    } else if (percentage >= 55) {
      riskLevel = 'medium';
      creditRating = 'B';
    } else if (percentage >= 45) {
      riskLevel = 'medium';
      creditRating = 'B-';
    } else if (percentage >= 35) {
      riskLevel = 'high';
      creditRating = 'C+';
    } else if (percentage >= 25) {
      riskLevel = 'high';
      creditRating = 'C';
    } else {
      riskLevel = 'high';
      creditRating = 'D';
    }

    return { score: percentage.toFixed(1), riskLevel, creditRating };
  };

  const generateRecommendations = () => {
    if (!selectedApplication) return;

    const ddScore = calculateDueDiligenceScore();
    const { score: riskScore, riskLevel, creditRating } = calculateRiskScoreFromRatios();
    const ratios = calculateFinancialRatios();
    
    const strengths: string[] = [];
    const concerns: string[] = [];
    const conditions: string[] = [];
    let reasoning = '';
    let approvalRecommendation: 'approve' | 'reject' | 'request-info' | 'pending' = 'pending';
    let recommendedInstrument = pricingTerms.financingInstrument;
    let recommendedProfitRate = 12;

    // Analyze Due Diligence
    if (ddScore >= 80) {
      strengths.push(`Excellent due diligence completion (${ddScore}%)`);
    } else if (ddScore >= 60) {
      strengths.push(`Good due diligence progress (${ddScore}%)`);
    } else if (ddScore < 40) {
      concerns.push(`Incomplete due diligence (${ddScore}% completed)`);
      conditions.push('Complete all required due diligence checks before approval');
    }

    // Analyze Financial Ratios
    const currentRatio = parseFloat(ratios.currentRatio);
    if (currentRatio >= 2) {
      strengths.push(`Strong liquidity position (Current Ratio: ${currentRatio})`);
    } else if (currentRatio < 1) {
      concerns.push(`Weak liquidity (Current Ratio: ${currentRatio})`);
      conditions.push('Require cash flow monitoring and liquidity improvement plan');
    }

    const debtToEquity = parseFloat(ratios.debtToEquity);
    if (debtToEquity <= 1) {
      strengths.push(`Healthy leverage (Debt-to-Equity: ${debtToEquity})`);
    } else if (debtToEquity > 2) {
      concerns.push(`High leverage risk (Debt-to-Equity: ${debtToEquity})`);
      conditions.push('Cap additional debt until ratio improves below 1.5');
    }

    const roe = parseFloat(ratios.returnOnEquity);
    if (roe >= 15) {
      strengths.push(`Excellent profitability (ROE: ${roe}%)`);
    } else if (roe < 5) {
      concerns.push(`Low profitability (ROE: ${roe}%)`);
    }

    const profitMargin = parseFloat(ratios.profitMargin);
    if (profitMargin >= 15) {
      strengths.push(`Strong profit margins (${profitMargin}%)`);
    } else if (profitMargin < 5) {
      concerns.push(`Thin profit margins (${profitMargin}%)`);
    }

    // Analyze Risk Assessment
    if (riskLevel === 'low') {
      strengths.push(`Low risk profile (Credit Rating: ${creditRating})`);
      recommendedProfitRate = 10;
    } else if (riskLevel === 'medium') {
      strengths.push(`Moderate risk profile (Credit Rating: ${creditRating})`);
      recommendedProfitRate = 12;
    } else {
      concerns.push(`High risk profile (Credit Rating: ${creditRating})`);
      recommendedProfitRate = 15;
      conditions.push('Require enhanced collateral coverage (minimum 150%)');
      conditions.push('Monthly financial reporting and covenant monitoring');
    }

    // Recommend Financing Instrument
    const requestedAmount = selectedApplication.data.requestedAmount || 0;
    if (currentRatio >= 1.5 && debtToEquity <= 1 && profitMargin >= 10) {
      recommendedInstrument = 'murabaha';
      reasoning += 'Murabaha recommended due to strong financial health and stable cash flows. ';
    } else if (roe >= 12 && selectedApplication.data.yearsInOperation >= 3) {
      recommendedInstrument = 'musharakah';
      reasoning += 'Musharakah partnership suitable given established operations and profit track record. ';
    } else if (selectedApplication.data.yearsInOperation < 2) {
      recommendedInstrument = 'mudarabah';
      reasoning += 'Mudarabah structure appropriate for newer business with growth potential. ';
      conditions.push('Platform takes active monitoring role as Rabb-ul-Mal');
    }

    // Check Shariah Compliance
    const shariahChecks = [
      dueDiligence.shariah?.businessActivitiesHalal,
      dueDiligence.shariah?.noInterestBasedOperations,
      dueDiligence.shariah?.noProhibitedSectors
    ];
    const shariahPassed = shariahChecks.filter(c => c === 'pass').length;
    if (shariahPassed === 3) {
      strengths.push('Full Shariah compliance confirmed');
    } else if (shariahChecks.includes('fail')) {
      concerns.push('Shariah compliance issues identified');
      approvalRecommendation = 'reject';
      reasoning = 'REJECT: Business activities not Shariah-compliant. ' + reasoning;
    }

    // Check Legal Compliance
    const legalChecks = [
      dueDiligence.legal?.businessRegistrationValid,
      dueDiligence.legal?.taxComplianceConfirmed,
      dueDiligence.legal?.regulatoryApprovalsObtained
    ];
    if (legalChecks.includes('fail')) {
      concerns.push('Legal compliance deficiencies found');
      conditions.push('Resolve all legal and regulatory issues before disbursement');
    }

    // Final Recommendation
    if (approvalRecommendation !== 'reject') {
      const totalScore = (ddScore * 0.3) + (parseFloat(riskScore) * 0.7);
      
      if (totalScore >= 70 && concerns.length <= 2) {
        approvalRecommendation = 'approve';
        reasoning = `APPROVE: Strong overall assessment (${totalScore.toFixed(1)}/100). ` + reasoning;
      } else if (totalScore >= 50 && concerns.length <= 4) {
        approvalRecommendation = 'approve';
        reasoning = `CONDITIONAL APPROVE: Acceptable risk with conditions (${totalScore.toFixed(1)}/100). ` + reasoning;
        conditions.push('Regular quarterly reviews for first 12 months');
      } else if (totalScore >= 35) {
        approvalRecommendation = 'request-info';
        reasoning = `REQUEST MORE INFO: Insufficient data for decision (${totalScore.toFixed(1)}/100). ` + reasoning;
        conditions.push('Complete all due diligence items');
        conditions.push('Provide additional financial documentation');
      } else {
        approvalRecommendation = 'reject';
        reasoning = `REJECT: High risk with insufficient mitigation (${totalScore.toFixed(1)}/100). ` + reasoning;
      }
    }

    // Adjust amount if needed
    let recommendedAmount = requestedAmount;
    if (riskLevel === 'high' && requestedAmount > 5000000) {
      recommendedAmount = Math.min(requestedAmount, 3000000);
      conditions.push(`Reduce initial financing to ₦${(recommendedAmount / 1000000).toFixed(1)}M due to risk profile`);
    }

    setRecommendations({
      approvalRecommendation,
      recommendedInstrument,
      recommendedAmount,
      recommendedTerm: riskLevel === 'low' ? 24 : riskLevel === 'medium' ? 18 : 12,
      recommendedProfitRate,
      reasoning,
      strengths,
      concerns,
      conditions,
      mitigationSuggestions: riskAssessment.mitigationMeasures || 'No specific mitigation measures identified.',
    });
  };

  const calculateDueDiligenceScore = (): number => {
    let total = 0;
    let completed = 0;
    
    Object.values(dueDiligence).forEach(category => {
      Object.values(category).forEach((value) => {
        if (value !== 'na') {
          total++;
          if (value === 'pass') completed++;
        }
      });
    });
    
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  };

  const getDueDiligenceCompletionStatus = () => {
    const score = calculateDueDiligenceScore();
    if (score === 100) return { status: 'Complete', color: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-900/20' };
    if (score >= 75) return { status: 'Almost Complete', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20' };
    if (score >= 50) return { status: 'In Progress', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/20' };
    return { status: 'Not Started', color: 'text-neutral-500 dark:text-neutral-400', bg: 'bg-neutral-50 dark:bg-neutral-800' };
  };

  async function handleApprove(app: Application) {
    try {
      setProcessing(true);
      
      // Refetch latest version to avoid version conflicts
      const latestDoc = await getDoc<ApplicationData>({
        collection: "business_applications",
        key: app.key
      });

      if (!latestDoc) {
        throw new Error('Application not found');
      }

      // Validate status update
      const validatedStatus = validateOrThrow(
        applicationStatusSchema,
        { status: 'approved' },
        'Approve application'
      );
      
      // Update application status with due diligence data and latest version
      await setDoc({
        collection: "business_applications",
        doc: {
          ...latestDoc,
          data: {
            ...latestDoc.data,
            status: validatedStatus.status,
            dueDiligence,
            dueDiligenceNotes,
            riskRating,
            dueDiligenceScore: calculateDueDiligenceScore(),
            reviewedBy: user?.key || 'admin',
            reviewedAt: new Date().toISOString()
          }
        }
      });
      
      // Create investment opportunity from approved application
      const today = new Date();
      const deadline = new Date(today);
      deadline.setDate(deadline.getDate() + approvalTerms.campaignDays);
      
      const formatDate = (date: Date): string => {
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}-${month}-${year}`;
      };
      
      // Map business application contract types to opportunity contract types
      const contractTypeMap: Record<string, "musharakah" | "mudarabah" | "murabaha" | "ijarah"> = {
        musharaka: "musharakah",
        mudaraba: "mudarabah",
        murabaha: "murabaha",
        ijara: "ijarah",
        istisna: "murabaha",
        musharakah: "musharakah",
        mudarabah: "mudarabah",
        ijarah: "ijarah"
      };
      
      const mappedContractType = contractTypeMap[latestDoc.data.contractType] || "musharakah";
      
      // Use manual terms from state instead of hardcoded values
      const opportunityData: OpportunityFormData = {
        applicationId: latestDoc.key,
        businessId: latestDoc.key,
        businessName: latestDoc.data.businessName,
        industry: latestDoc.data.industry,
        description: latestDoc.data.businessDescription || `${latestDoc.data.businessName} - ${latestDoc.data.industry} investment opportunity`,
        riskRating: "moderate",
        fundingGoal: latestDoc.data.requestedAmount || latestDoc.data.amount || 0,
        currentFunding: 0,
        minimumInvestment: approvalTerms.minimumInvestment,
        contractType: mappedContractType,
        expectedReturnMin: approvalTerms.returnMin,
        expectedReturnMax: approvalTerms.returnMax,
        termMonths: approvalTerms.termMonths,
        campaignDeadline: formatDate(deadline),
        featured: false,
        status: "active",
        investorCount: 0,
        createdAt: formatDate(today),
        approvedBy: user?.key || "admin"
      };
      
      const validatedOpportunity = validateOrThrow(
        opportunitySchema,
        opportunityData,
        'Create investment opportunity'
      );
      
      await setDoc({
        collection: "opportunities",
        doc: {
          key: `opp_${latestDoc.key}`,
          data: validatedOpportunity
        }
      });
      
      await fetchApplications();
      setSelectedApplication(null);
      alert(`Application approved! Investment opportunity created for ${latestDoc.data.businessName}`);
    } catch (error) {
      console.error('Error approving application:', error);
      alert(error instanceof Error ? error.message : 'Failed to approve application. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async (app: Application) => {
    try {
      setProcessing(true);
      const latestDoc = await getDoc<ApplicationData>({
        collection: "business_applications",
        key: app.key
      });

      if (!latestDoc) {
        throw new Error('Application not found');
      }

      const validatedStatus = validateOrThrow(
        applicationStatusSchema,
        { status: 'rejected' },
        'Reject application'
      );
      
      await setDoc({
        collection: "business_applications",
        doc: {
          ...latestDoc,
          data: {
            ...latestDoc.data,
            status: validatedStatus.status
          }
        }
      });
      
      await fetchApplications();
      setSelectedApplication(null);
      setShowApprovalForm(false); // Reset approval form
    } catch (error) {
      console.error('Error approving application:', error);
      alert(error instanceof Error ? error.message : 'Failed to approve application. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const handleRequestInfo = async (app: Application) => {
    if (!adminMessage.trim()) {
      alert('Please provide a message explaining what information is needed');
      return;
    }

    try {
      setProcessing(true);
      const latestDoc = await getDoc<ApplicationData>({
        collection: "business_applications",
        key: app.key
      });

      if (!latestDoc) {
        throw new Error('Application not found');
      }

      const validatedStatus = applicationStatusSchema.parse({ status: 'more-info' });
      
      await setDoc({
        collection: "business_applications",
        doc: {
          ...latestDoc,
          data: {
            ...latestDoc.data,
            status: validatedStatus.status,
            adminMessage: adminMessage.trim(),
            requestedAt: new Date().toISOString()
          }
        }
      });
      
      await fetchApplications();
      setSelectedApplication(null);
      setAdminMessage('');
      alert('Request sent. Business will be notified to resubmit with requested changes.');
    } catch (error) {
      console.error('Error requesting info:', error);
      alert('Failed to request more information. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  useEffect(() => {
    (async () => await initSatellite({ workers: { auth: true } }))();
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChange((authUser) => {
      setUser(authUser);
    });
    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    if (user && user !== null) {
      fetchApplications();
    }
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  if (user === undefined || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-primary-50/30 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-neutral-600 dark:text-neutral-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (user === null) {
    router.push("/admin/login");
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-primary-50/30 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950">
      {/* Top Navigation */}
      <nav className="sticky top-0 z-50 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md border-b border-neutral-200 dark:border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-8">
              <Link href="/admin/dashboard" className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-primary-700 rounded-lg flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-xl">A</span>
                </div>
                <div>
                  <h1 className="font-display font-bold text-xl text-neutral-900 dark:text-white">AmanaTrade Admin</h1>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">Business Applications</p>
                </div>
              </Link>

              <div className="hidden md:flex items-center gap-4">
                <Link href="/admin/dashboard" className="px-3 py-2 text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white rounded-lg">
                  Dashboard
                </Link>
                <Link href="/admin/member-applications" className="px-3 py-2 text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white rounded-lg">
                  Member Apps
                </Link>
                <Link href="/admin/business-applications" className="px-3 py-2 text-sm font-medium text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-950/30 rounded-lg">
                  Business Apps
                </Link>
                <Link href="/admin/workflow" className="px-3 py-2 text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white rounded-lg flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  Workflow
                </Link>
                <Link href="/admin/analytics" className="px-3 py-2 text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white rounded-lg flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 00-2-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  Analytics
                </Link>
                <Link href="/admin/integrations" className="px-3 py-2 text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white rounded-lg flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Integrations
                </Link>
                <Link href="/admin/kyc-review" className="px-3 py-2 text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white rounded-lg">
                  KYC Review
                </Link>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <ThemeToggle />
              <button onClick={handleSignOut} className="px-4 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:text-error-600 dark:hover:text-error-400 transition-colors">
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold text-neutral-900 dark:text-white mb-2">Business Applications</h2>
              <p className="text-neutral-600 dark:text-neutral-400">Review and approve business funding applications</p>
            </div>
            <div className="flex items-center gap-3">
              <button className="px-4 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                Advanced Filters
              </button>
              <button className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors flex items-center gap-2 shadow-lg shadow-primary-500/30">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                New Application
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="relative bg-gradient-to-br from-white to-neutral-50 dark:from-neutral-900 dark:to-neutral-800 rounded-xl p-6 border border-neutral-200 dark:border-neutral-700 shadow-lg hover:shadow-xl transition-shadow overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-warning-500/10 rounded-full blur-3xl group-hover:bg-warning-500/20 transition-colors"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-warning-100 dark:bg-warning-900/30 rounded-xl">
                  <svg className="w-6 h-6 text-warning-600 dark:text-warning-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                {applications.filter(a => a.data.status === 'pending' || a.data.status === 'new').length > 0 && (
                  <span className="px-2.5 py-1 bg-warning-100 dark:bg-warning-900/30 text-warning-700 dark:text-warning-300 text-xs font-bold rounded-full border border-warning-200 dark:border-warning-800">
                    Urgent
                  </span>
                )}
              </div>
              <p className="text-sm font-semibold text-neutral-600 dark:text-neutral-400 mb-1 uppercase tracking-wide">Pending</p>
              <p className="text-4xl font-bold text-neutral-900 dark:text-white">{applications.filter(a => a.data.status === 'pending' || a.data.status === 'new').length}</p>
            </div>
          </div>

          <div className="relative bg-gradient-to-br from-white to-neutral-50 dark:from-neutral-900 dark:to-neutral-800 rounded-xl p-6 border border-neutral-200 dark:border-neutral-700 shadow-lg hover:shadow-xl transition-shadow overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-success-500/10 rounded-full blur-3xl group-hover:bg-success-500/20 transition-colors"></div>
            <div className="relative">
              <div className="p-3 bg-success-100 dark:bg-success-900/30 rounded-xl mb-4 w-fit">
                <svg className="w-6 h-6 text-success-600 dark:text-success-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-sm font-semibold text-neutral-600 dark:text-neutral-400 mb-1 uppercase tracking-wide">Approved</p>
              <p className="text-4xl font-bold text-success-600 dark:text-success-400">{applications.filter(a => a.data.status === 'approved').length}</p>
            </div>
          </div>

          <div className="relative bg-gradient-to-br from-white to-neutral-50 dark:from-neutral-900 dark:to-neutral-800 rounded-xl p-6 border border-neutral-200 dark:border-neutral-700 shadow-lg hover:shadow-xl transition-shadow overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-error-500/10 rounded-full blur-3xl group-hover:bg-error-500/20 transition-colors"></div>
            <div className="relative">
              <div className="p-3 bg-error-100 dark:bg-error-900/30 rounded-xl mb-4 w-fit">
                <svg className="w-6 h-6 text-error-600 dark:text-error-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-sm font-semibold text-neutral-600 dark:text-neutral-400 mb-1 uppercase tracking-wide">Rejected</p>
              <p className="text-4xl font-bold text-error-600 dark:text-error-400">{applications.filter(a => a.data.status === 'rejected').length}</p>
            </div>
          </div>

          <div className="relative bg-gradient-to-br from-white to-neutral-50 dark:from-neutral-900 dark:to-neutral-800 rounded-xl p-6 border border-neutral-200 dark:border-neutral-700 shadow-lg hover:shadow-xl transition-shadow overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/10 rounded-full blur-3xl group-hover:bg-primary-500/20 transition-colors"></div>
            <div className="relative">
              <div className="p-3 bg-primary-100 dark:bg-primary-900/30 rounded-xl mb-4 w-fit">
                <svg className="w-6 h-6 text-primary-600 dark:text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <p className="text-sm font-semibold text-neutral-600 dark:text-neutral-400 mb-1 uppercase tracking-wide">Total</p>
              <p className="text-4xl font-bold text-neutral-900 dark:text-white">{applications.length}</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
                <svg className="w-5 h-5 text-primary-600 dark:text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-neutral-900 dark:text-white">Filters & Search</h3>
            </div>
            <div className="flex gap-2">
              <button
                onClick={exportToCSV}
                className="px-4 py-2.5 text-sm font-medium text-primary-700 dark:text-primary-300 bg-primary-50 dark:bg-primary-900/30 border border-primary-200 dark:border-primary-800 rounded-lg hover:bg-primary-100 dark:hover:bg-primary-900/50 transition-all hover:shadow-md flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export CSV {selectedApplicationIds.length > 0 && `(${selectedApplicationIds.length})`}
              </button>
              {selectedApplicationIds.length > 0 && (
                <button
                  onClick={() => setShowBulkActions(!showBulkActions)}
                  className="px-4 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 rounded-lg transition-all shadow-lg shadow-primary-500/30 hover:shadow-xl hover:shadow-primary-500/40 flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                  </svg>
                  Bulk Actions ({selectedApplicationIds.length})
                  <svg className={`w-4 h-4 transition-transform ${showBulkActions ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              )}
            </div>
          </div>
          
          {/* Basic Filters Row 1 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search business name or industry..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-sm border border-neutral-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white placeholder-neutral-500 dark:placeholder-neutral-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2.5 text-sm border border-neutral-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all cursor-pointer"
            >
              <option value="all">All Status</option>
              <option value="new">New</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="more-info">Need More Info</option>
            </select>
            <select
              value={filterIndustry}
              onChange={(e) => setFilterIndustry(e.target.value)}
              className="px-4 py-2.5 text-sm border border-neutral-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all cursor-pointer"
            >
              <option value="all">All Industries</option>
              <option value="agriculture">Agriculture</option>
              <option value="manufacturing">Manufacturing</option>
              <option value="retail">Retail</option>
              <option value="services">Services</option>
              <option value="technology">Technology</option>
              <option value="construction">Construction</option>
              <option value="healthcare">Healthcare</option>
              <option value="education">Education</option>
              <option value="real-estate">Real Estate</option>
              <option value="transportation">Transportation</option>
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'date' | 'amount' | 'score')}
              className="px-4 py-2.5 text-sm border border-neutral-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all cursor-pointer"
            >
              <option value="date">Sort by Date</option>
              <option value="amount">Sort by Amount</option>
              <option value="score">Sort by Score</option>
            </select>
          </div>

          {/* Advanced Filters Row 2 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">Min Amount (₦)</label>
              <input
                type="number"
                placeholder="0"
                value={filterAmountMin}
                onChange={(e) => setFilterAmountMin(e.target.value)}
                className="w-full px-4 py-2 text-sm border border-neutral-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">Max Amount (₦)</label>
              <input
                type="number"
                placeholder="∞"
                value={filterAmountMax}
                onChange={(e) => setFilterAmountMax(e.target.value)}
                className="w-full px-4 py-2 text-sm border border-neutral-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">From Date</label>
              <input
                type="date"
                value={filterDateFrom}
                onChange={(e) => setFilterDateFrom(e.target.value)}
                className="w-full px-4 py-2 text-sm border border-neutral-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">To Date</label>
              <input
                type="date"
                value={filterDateTo}
                onChange={(e) => setFilterDateTo(e.target.value)}
                className="w-full px-4 py-2 text-sm border border-neutral-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">Sort Order</label>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
                className="w-full px-4 py-2 text-sm border border-neutral-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="desc">Newest First</option>
                <option value="asc">Oldest First</option>
              </select>
            </div>
          </div>

          {/* Bulk Actions Panel */}
          {showBulkActions && selectedApplicationIds.length > 0 && (
            <div className="mt-4 p-4 bg-primary-50 dark:bg-primary-950/20 border border-primary-200 dark:border-primary-800 rounded-lg">
              <p className="text-sm font-medium text-primary-900 dark:text-primary-200 mb-3">
                {selectedApplicationIds.length} application(s) selected
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => {
                    if (confirm(`Export ${selectedApplicationIds.length} selected applications to CSV?`)) {
                      exportToCSV();
                    }
                  }}
                  className="px-4 py-2 text-sm font-medium text-primary-700 dark:text-primary-300 bg-white dark:bg-primary-900/30 border border-primary-300 dark:border-primary-700 rounded-lg hover:bg-primary-100 dark:hover:bg-primary-900/50 transition-colors"
                >
                  Export Selected
                </button>
                <button
                  onClick={() => setSelectedApplicationIds([])}
                  className="px-4 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
                >
                  Clear Selection
                </button>
              </div>
            </div>
          )}

          {/* Results Summary */}
          <div className="mt-4 flex items-center justify-between text-sm text-neutral-600 dark:text-neutral-400">
            <span>Showing {filteredApplications.length} of {applications.length} applications</span>
            {(filterStatus !== 'all' || searchQuery || filterIndustry !== 'all' || filterAmountMin || filterAmountMax || filterDateFrom || filterDateTo) && (
              <button
                onClick={() => {
                  setFilterStatus('all');
                  setSearchQuery('');
                  setFilterIndustry('all');
                  setFilterAmountMin('');
                  setFilterAmountMax('');
                  setFilterDateFrom('');
                  setFilterDateTo('');
                }}
                className="text-primary-600 dark:text-primary-400 hover:underline font-medium"
              >
                Clear All Filters
              </button>
            )}
          </div>
        </div>

        {/* Applications List */}
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm overflow-hidden">
          {filteredApplications.length === 0 ? (
            <div className="p-12 text-center">
              <svg className="w-16 h-16 text-neutral-300 dark:text-neutral-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-neutral-600 dark:text-neutral-400">No applications found</p>
            </div>
          ) : (
            <>
              {/* Select All Header */}
              <div className="p-4 bg-neutral-50 dark:bg-neutral-800/50 border-b border-neutral-200 dark:border-neutral-800">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedApplicationIds.length === filteredApplications.length && filteredApplications.length > 0}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 text-primary-600 border-neutral-300 dark:border-neutral-600 rounded focus:ring-primary-500 dark:focus:ring-primary-400"
                  />
                  <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    Select All ({filteredApplications.length})
                  </span>
                </label>
              </div>
              
              <div className="divide-y divide-neutral-200 dark:divide-neutral-800">
              {filteredApplications.map((app) => (
                <div key={app.key} className="p-6 hover:bg-gradient-to-r hover:from-neutral-50 hover:to-transparent dark:hover:from-neutral-800/50 dark:hover:to-transparent transition-all group">
                  <div className="flex items-start gap-4">
                    {/* Checkbox */}
                    <input
                      type="checkbox"
                      checked={selectedApplicationIds.includes(app.key)}
                      onChange={() => toggleSelectApplication(app.key)}
                      onClick={(e) => e.stopPropagation()}
                      className="mt-1.5 w-4 h-4 text-primary-600 border-neutral-300 dark:border-neutral-600 rounded focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 cursor-pointer"
                    />
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="font-bold text-lg text-neutral-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">{app.data.businessName}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${
                          app.data.status === 'approved' ? 'bg-success-100 dark:bg-success-900/30 text-success-700 dark:text-success-300 border border-success-200 dark:border-success-800' :
                          app.data.status === 'rejected' ? 'bg-error-100 dark:bg-error-900/30 text-error-700 dark:text-error-300 border border-error-200 dark:border-error-800' :
                          app.data.status === 'more-info' ? 'bg-secondary-100 dark:bg-secondary-900/30 text-secondary-700 dark:text-secondary-300 border border-secondary-200 dark:border-secondary-800' :
                          'bg-warning-100 dark:bg-warning-900/30 text-warning-700 dark:text-warning-300 border border-warning-200 dark:border-warning-800'
                        }`}>
                          {app.data.status === 'more-info' ? 'MORE INFO' : app.data.status.toUpperCase()}
                        </span>
                        {(app.data.status === 'pending' || app.data.status === 'new') && (
                          <span className="px-2 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 text-xs font-semibold rounded-full border border-amber-200 dark:border-amber-800 animate-pulse">
                            MORE-INFO
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-sm mb-4 p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg border border-neutral-200 dark:border-neutral-700">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
                            <svg className="w-4 h-4 text-primary-600 dark:text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-0.5">Industry</p>
                            <p className="font-semibold text-neutral-900 dark:text-white capitalize">{app.data.industry}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-success-100 dark:bg-success-900/30 rounded-lg">
                            <svg className="w-4 h-4 text-success-600 dark:text-success-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-0.5">Amount</p>
                            <p className="font-semibold text-neutral-900 dark:text-white">{formatCurrency(app.data.requestedAmount || 0)}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-secondary-100 dark:bg-secondary-900/30 rounded-lg">
                            <svg className="w-4 h-4 text-secondary-600 dark:text-secondary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-0.5">Contract</p>
                            <p className="font-semibold text-neutral-900 dark:text-white capitalize">{app.data.contractType}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-warning-100 dark:bg-warning-900/30 rounded-lg">
                            <svg className="w-4 h-4 text-warning-600 dark:text-warning-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-0.5">Submitted</p>
                            <p className="font-semibold text-neutral-900 dark:text-white">{getSubmittedDaysAgo(app.created_at)} days ago</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700">
                            <svg className="w-4 h-4 text-primary-600 dark:text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                            <span className="font-semibold text-neutral-900 dark:text-white">
                              {(() => {
                                const docs = app.data.documents;
                                if (!docs || typeof docs !== 'object' || Array.isArray(docs)) return 0;
                                return (
                                  (docs.bankStatements?.length || 0) +
                                  (docs.directorsPhotos?.length || 0) +
                                  (docs.auditedStatements?.length || 0) +
                                  (docs.directorsIDs?.length || 0) +
                                  (docs.collateralDocuments?.length || 0)
                                );
                              })()}
                            </span>
                            <span className="text-neutral-600 dark:text-neutral-400">documents</span>
                          </div>
                          {internalNotes[app.key] && (
                            <span className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/30 rounded-lg border border-amber-200 dark:border-amber-800">
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                              </svg>
                              Has notes
                            </span>
                          )}
                      </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => openNotesModal(app.key)}
                            className="px-4 py-2.5 bg-amber-50 hover:bg-amber-100 dark:bg-amber-900/20 dark:hover:bg-amber-900/40 text-amber-700 dark:text-amber-300 font-semibold rounded-lg transition-all hover:shadow-md border border-amber-200 dark:border-amber-800 flex items-center justify-center gap-2"
                            title="Add or edit internal notes"
                          >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                            </svg>
                            Notes
                          </button>
                          <button
                            onClick={() => setSelectedApplication(app)}
                            className="px-6 py-2.5 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white font-semibold rounded-lg transition-all shadow-lg shadow-primary-500/30 hover:shadow-xl hover:shadow-primary-500/40 flex items-center gap-2"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            Review
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            </>
          )}
        </div>
      </main>

      {/* Application Review Modal */}
      {selectedApplication && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity" onClick={() => setSelectedApplication(null)} />
            
            <div className="relative bg-white dark:bg-neutral-900 rounded-2xl max-w-5xl w-full shadow-2xl border border-neutral-200 dark:border-neutral-800">
              {/* Modal Header */}
              <div className="px-8 py-6 border-b border-neutral-200 dark:border-neutral-800">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-3xl font-bold text-neutral-900 dark:text-white mb-2">{selectedApplication.data.businessName}</h2>
                    <div className="flex items-center gap-3 text-sm">
                      <span className="px-3 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-full font-medium capitalize">
                        {selectedApplication.data.contractType}
                      </span>
                      <span className="text-neutral-500 dark:text-neutral-400">•</span>
                      <span className="text-neutral-600 dark:text-neutral-400">{selectedApplication.data.industry}</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => setSelectedApplication(null)} 
                    className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
                  >
                    <svg className="w-6 h-6 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Tabs Navigation */}
              <div className="px-8 border-b border-neutral-200 dark:border-neutral-800">
                <div className="flex gap-1">
                  <button
                    onClick={() => setActiveTab('details')}
                    className={`px-6 py-3 font-semibold text-sm transition-colors border-b-2 ${
                      activeTab === 'details'
                        ? 'border-primary-600 text-primary-600 dark:text-primary-400'
                        : 'border-transparent text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
                    }`}
                  >
                    Request Details
                  </button>
                  <button
                    onClick={() => setActiveTab('due-diligence')}
                    className={`px-6 py-3 font-semibold text-sm transition-colors border-b-2 flex items-center gap-2 ${
                      activeTab === 'due-diligence'
                        ? 'border-primary-600 text-primary-600 dark:text-primary-400'
                        : 'border-transparent text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
                    }`}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    </svg>
                    Due Diligence
                    <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${getDueDiligenceCompletionStatus().bg} ${getDueDiligenceCompletionStatus().color}`}>
                      {calculateDueDiligenceScore()}%
                    </span>
                  </button>
                  <button
                    onClick={() => setActiveTab('pricing')}
                    className={`px-6 py-3 font-semibold text-sm transition-colors border-b-2 flex items-center gap-2 ${
                      activeTab === 'pricing'
                        ? 'border-primary-600 text-primary-600 dark:text-primary-400'
                        : 'border-transparent text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
                    }`}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Pricing & Terms
                  </button>
                  <button
                    onClick={() => setActiveTab('recommendations')}
                    className={`px-6 py-3 font-semibold text-sm transition-colors border-b-2 flex items-center gap-2 ${
                      activeTab === 'recommendations'
                        ? 'border-primary-600 text-primary-600 dark:text-primary-400'
                        : 'border-transparent text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
                    }`}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    Recommendations
                  </button>
                </div>
              </div>

              {/* Modal Content */}
              <div className="px-8 py-6 max-h-[60vh] overflow-y-auto">
                {activeTab === 'details' ? (
                  <>
                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                  <div className="p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl">
                    <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide mb-1">Registration</p>
                    <p className="text-lg font-bold text-neutral-900 dark:text-white">{selectedApplication.data.registrationNumber}</p>
                  </div>
                  <div className="p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl">
                    <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide mb-1">Years Active</p>
                    <p className="text-lg font-bold text-neutral-900 dark:text-white">{selectedApplication.data.yearsInOperation} years</p>
                  </div>
                  <div className="p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl">
                    <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide mb-1">Employees</p>
                    <p className="text-lg font-bold text-neutral-900 dark:text-white">{selectedApplication.data.numberOfEmployees}</p>
                  </div>
                  <div className="p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl">
                    <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide mb-1">Annual Revenue</p>
                    <p className="text-lg font-bold text-neutral-900 dark:text-white">{formatCurrency(selectedApplication.data.annualRevenue)}</p>
                  </div>
                </div>

                    {/* Financing Details Section */}
                    <div className="mb-8">
                      <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-4 flex items-center gap-2">
                        <svg className="w-5 h-5 text-primary-600 dark:text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Financing Details
                          </h3>
                      <div className="grid grid-cols-2 gap-x-8 gap-y-4 p-6 bg-gradient-to-br from-primary-50/50 to-transparent dark:from-primary-900/10 dark:to-transparent rounded-xl border border-primary-200 dark:border-primary-800/30">
                        <div>
                          <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-1">Contract Type</p>
                          <p className="text-base font-semibold text-neutral-900 dark:text-white capitalize">{selectedApplication.data.contractType}</p>
                        </div>
                        <div>
                          <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-1">Requested Amount</p>
                          <p className="text-base font-semibold text-neutral-900 dark:text-white">{formatCurrency(selectedApplication.data.requestedAmount || 0)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-1">Duration</p>
                          <p className="text-base font-semibold text-neutral-900 dark:text-white">{selectedApplication.data.duration} months</p>
                        </div>
                        <div>
                          <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-1">Pool</p>
                          <p className="text-base font-semibold text-neutral-900 dark:text-white capitalize">{selectedApplication.data.pool || 'Business'}</p>
                        </div>
                      </div>
                    </div>

                    {/* Funding Purpose */}
                    <div className="mb-8">
                      <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-3">Funding Purpose</h3>
                      <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed bg-neutral-50 dark:bg-neutral-800/50 p-4 rounded-xl">
                        {selectedApplication.data.fundingPurpose}
                      </p>
                    </div>

                    {/* Business Description */}
                    {selectedApplication.data.businessDescription && (
                      <div className="mb-8">
                        <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-3">Business Description</h3>
                        <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed bg-neutral-50 dark:bg-neutral-800/50 p-4 rounded-xl">
                          {selectedApplication.data.businessDescription}
                        </p>
                      </div>
                    )}

                    {/* Documents Section */}
                    <div>
                          <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-4 flex items-center gap-2">
                        <svg className="w-5 h-5 text-primary-600 dark:text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Documents Submitted
                      </h3>
                          {(() => {
                        const appDocs = selectedApplication.data.documents;
                        const hasDocuments = appDocs && typeof appDocs === 'object' && !Array.isArray(appDocs);
                        
                        if (hasDocuments) {
                          const docsList: {type: string; count: number; urls: string[]}[] = [];
                          if (appDocs.bankStatements?.length) docsList.push({type: 'Bank Statements', count: appDocs.bankStatements.length, urls: appDocs.bankStatements});
                          if (appDocs.directorsPhotos?.length) docsList.push({type: 'Directors Photos', count: appDocs.directorsPhotos.length, urls: appDocs.directorsPhotos});
                          if (appDocs.auditedStatements?.length) docsList.push({type: 'Audited Statements', count: appDocs.auditedStatements.length, urls: appDocs.auditedStatements});
                          if (appDocs.directorsIDs?.length) docsList.push({type: 'Directors IDs', count: appDocs.directorsIDs.length, urls: appDocs.directorsIDs});
                          if (appDocs.collateralDocuments?.length) docsList.push({type: 'Collateral Documents', count: appDocs.collateralDocuments.length, urls: appDocs.collateralDocuments});
                          
                          return docsList.length > 0 ? (
                            <div className="grid gap-3">
                              {docsList.map((docGroup, idx) => (
                                <div key={idx} className="p-4 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl">
                                  <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-3">
                                      <div className="w-10 h-10 flex items-center justify-center bg-primary-100 dark:bg-primary-900/30 rounded-lg">
                                        <svg className="w-5 h-5 text-primary-600 dark:text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                      </div>
                                      <div>
                                        <p className="text-sm font-semibold text-neutral-900 dark:text-white">{docGroup.type}</p>
                                        <p className="text-xs text-neutral-500 dark:text-neutral-400">{docGroup.count} file(s)</p>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex flex-wrap gap-2 mt-3">
                                    {docGroup.urls.map((url, urlIdx) => (
                                      <a
                                        key={urlIdx}
                                        href={url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="px-3 py-1.5 text-xs font-medium text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-lg transition-colors"
                                      >
                                        View File {urlIdx + 1}
                                      </a>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="py-12 text-center bg-neutral-50 dark:bg-neutral-800/50 rounded-xl border-2 border-dashed border-neutral-300 dark:border-neutral-700">
                              <svg className="w-16 h-16 text-neutral-300 dark:text-neutral-600 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">No documents uploaded yet</p>
                            </div>
                          );
                        }
                        
                        return (
                          <div className="py-12 text-center bg-neutral-50 dark:bg-neutral-800/50 rounded-xl border-2 border-dashed border-neutral-300 dark:border-neutral-700">
                            <svg className="w-16 h-16 text-neutral-300 dark:text-neutral-600 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">No documents uploaded yet</p>
                          </div>
                        );
                      })()}
                    </div>
                  </>
                ) : activeTab === 'due-diligence' ? (
                  /* Due Diligence Checklist */
                  <div className="space-y-6">
                    {/* Progress Overview */}
                    <div className="bg-gradient-to-br from-primary-50 to-blue-50 dark:from-primary-900/20 dark:to-blue-900/20 rounded-xl p-6 border border-primary-200 dark:border-primary-800">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-bold text-neutral-900 dark:text-white">Due Diligence Progress</h3>
                          <p className="text-sm text-neutral-600 dark:text-neutral-400">{getDueDiligenceCompletionStatus().status}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-3xl font-bold text-primary-600 dark:text-primary-400">{calculateDueDiligenceScore()}%</p>
                          <p className="text-xs text-neutral-500 dark:text-neutral-400">Complete</p>
                        </div>
                      </div>
                      <div className="w-full bg-neutral-200 dark:bg-neutral-700 rounded-full h-3">
                        <div
                          className="bg-gradient-to-r from-primary-600 to-blue-600 h-3 rounded-full transition-all duration-500"
                          style={{ width: `${calculateDueDiligenceScore()}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Financial Due Diligence */}
                    <div className="bg-white dark:bg-neutral-800/50 rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
                      <div className="bg-gradient-to-r from-blue-50 to-primary-50 dark:from-blue-900/20 dark:to-primary-900/20 px-5 py-4 border-b border-neutral-200 dark:border-neutral-700">
                        <h4 className="font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                          <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                          </svg>
                          Financial Analysis
                        </h4>
                      </div>
                      <div className="divide-y divide-neutral-200 dark:divide-neutral-700">
                        {Object.entries(dueDiligence.financial).map(([key, value]) => (
                          <div key={key} className="p-4 hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition-colors">
                            <div className="flex items-center justify-between gap-4">
                              <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                                {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                              </span>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => setDueDiligence({
                                    ...dueDiligence,
                                    financial: { ...dueDiligence.financial, [key]: 'pass' }
                                  })}
                                  className={`w-10 h-10 rounded-lg border-2 flex items-center justify-center transition-all ${
                                    value === 'pass'
                                      ? 'bg-green-500 border-green-600 text-white shadow-lg scale-105'
                                      : 'bg-white dark:bg-neutral-800 border-neutral-300 dark:border-neutral-600 text-neutral-400 dark:text-neutral-500 hover:border-green-500 hover:text-green-600'
                                  }`}
                                  title="Pass"
                                >
                                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                  </svg>
                                </button>
                                <button
                                  onClick={() => setDueDiligence({
                                    ...dueDiligence,
                                    financial: { ...dueDiligence.financial, [key]: 'fail' }
                                  })}
                                  className={`w-10 h-10 rounded-lg border-2 flex items-center justify-center transition-all ${
                                    value === 'fail'
                                      ? 'bg-red-500 border-red-600 text-white shadow-lg scale-105'
                                      : 'bg-white dark:bg-neutral-800 border-neutral-300 dark:border-neutral-600 text-neutral-400 dark:text-neutral-500 hover:border-red-500 hover:text-red-600'
                                  }`}
                                  title="Fail"
                                >
                                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                                <button
                                  onClick={() => setDueDiligence({
                                    ...dueDiligence,
                                    financial: { ...dueDiligence.financial, [key]: 'na' }
                                  })}
                                  className={`w-10 h-10 rounded-lg border-2 flex items-center justify-center transition-all ${
                                    value === 'na'
                                      ? 'bg-neutral-400 border-neutral-500 text-white shadow-lg scale-105'
                                      : 'bg-white dark:bg-neutral-800 border-neutral-300 dark:border-neutral-600 text-neutral-400 dark:text-neutral-500 hover:border-neutral-500 hover:text-neutral-600'
                                  }`}
                                  title="Not Applicable"
                                >
                                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
                                  </svg>
                                </button>
                                <button
                                  onClick={() => setDueDiligence({
                                    ...dueDiligence,
                                    financial: { ...dueDiligence.financial, [key]: 'unknown' }
                                  })}
                                  className={`w-10 h-10 rounded-lg border-2 flex items-center justify-center transition-all ${
                                    value === 'unknown'
                                      ? 'bg-amber-500 border-amber-600 text-white shadow-lg scale-105'
                                      : 'bg-white dark:bg-neutral-800 border-neutral-300 dark:border-neutral-600 text-neutral-400 dark:text-neutral-500 hover:border-amber-500 hover:text-amber-600'
                                  }`}
                                  title="Unknown / Need More Info"
                                >
                                  <span className="text-lg font-bold">?</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Financial Ratios & Industry Analysis */}
                    <div className="bg-white dark:bg-neutral-800/50 rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
                      <button
                        onClick={() => setShowFinancialCalculator(!showFinancialCalculator)}
                        className="w-full px-5 py-4 bg-gradient-to-r from-blue-50 to-primary-50 dark:from-blue-900/20 dark:to-primary-900/20 border-b border-neutral-200 dark:border-neutral-700 flex items-center justify-between hover:from-blue-100 hover:to-primary-100 dark:hover:from-blue-900/30 dark:hover:to-primary-900/30 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                          </svg>
                          <h4 className="font-bold text-neutral-900 dark:text-white">Financial Ratios & Industry Analysis</h4>
                        </div>
                        <svg 
                          className={`w-5 h-5 text-neutral-500 transition-transform ${showFinancialCalculator ? 'rotate-180' : ''}`}
                          fill="none" 
                          viewBox="0 0 24 24" 
                          stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      
                      {showFinancialCalculator && (
                        <div className="p-5 space-y-6">
                          {/* Financial Ratio Calculator */}
                          <div>
                            <h5 className="text-sm font-bold text-neutral-900 dark:text-white mb-4 uppercase tracking-wide">Financial Ratio Calculator</h5>
                            
                            {/* Input Fields */}
                            <div className="grid grid-cols-2 gap-4 mb-6">
                              <div>
                                <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">Current Assets (₦)</label>
                                <input
                                  type="number"
                                  value={financialRatios.currentAssets || ''}
                                  onChange={(e) => setFinancialRatios({...financialRatios, currentAssets: Number(e.target.value)})}
                                  className="w-full px-3 py-2 text-sm border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                  placeholder="0"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">Current Liabilities (₦)</label>
                                <input
                                  type="number"
                                  value={financialRatios.currentLiabilities || ''}
                                  onChange={(e) => setFinancialRatios({...financialRatios, currentLiabilities: Number(e.target.value)})}
                                  className="w-full px-3 py-2 text-sm border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                  placeholder="0"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">Total Assets (₦)</label>
                                <input
                                  type="number"
                                  value={financialRatios.totalAssets || ''}
                                  onChange={(e) => setFinancialRatios({...financialRatios, totalAssets: Number(e.target.value)})}
                                  className="w-full px-3 py-2 text-sm border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                  placeholder="0"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">Total Liabilities (₦)</label>
                                <input
                                  type="number"
                                  value={financialRatios.totalLiabilities || ''}
                                  onChange={(e) => setFinancialRatios({...financialRatios, totalLiabilities: Number(e.target.value)})}
                                  className="w-full px-3 py-2 text-sm border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                  placeholder="0"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">Total Equity (₦)</label>
                                <input
                                  type="number"
                                  value={financialRatios.totalEquity || ''}
                                  onChange={(e) => setFinancialRatios({...financialRatios, totalEquity: Number(e.target.value)})}
                                  className="w-full px-3 py-2 text-sm border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                  placeholder="0"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">Revenue (₦)</label>
                                <input
                                  type="number"
                                  value={financialRatios.revenue || ''}
                                  onChange={(e) => setFinancialRatios({...financialRatios, revenue: Number(e.target.value)})}
                                  className="w-full px-3 py-2 text-sm border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                  placeholder="0"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">Net Income (₦)</label>
                                <input
                                  type="number"
                                  value={financialRatios.netIncome || ''}
                                  onChange={(e) => setFinancialRatios({...financialRatios, netIncome: Number(e.target.value)})}
                                  className="w-full px-3 py-2 text-sm border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                  placeholder="0"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">Operating Income (₦)</label>
                                <input
                                  type="number"
                                  value={financialRatios.operatingIncome || ''}
                                  onChange={(e) => setFinancialRatios({...financialRatios, operatingIncome: Number(e.target.value)})}
                                  className="w-full px-3 py-2 text-sm border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                  placeholder="0"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">Inventory (₦)</label>
                                <input
                                  type="number"
                                  value={financialRatios.inventory || ''}
                                  onChange={(e) => setFinancialRatios({...financialRatios, inventory: Number(e.target.value)})}
                                  className="w-full px-3 py-2 text-sm border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                  placeholder="0"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">Cost of Goods Sold (₦)</label>
                                <input
                                  type="number"
                                  value={financialRatios.costOfGoodsSold || ''}
                                  onChange={(e) => setFinancialRatios({...financialRatios, costOfGoodsSold: Number(e.target.value)})}
                                  className="w-full px-3 py-2 text-sm border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                  placeholder="0"
                                />
                              </div>
                            </div>

                            {/* Calculated Ratios */}
                            <div className="bg-gradient-to-br from-primary-50 to-blue-50 dark:from-primary-900/20 dark:to-blue-900/20 rounded-xl p-4 border border-primary-200 dark:border-primary-800">
                              <h6 className="text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-3 uppercase tracking-wide">Calculated Ratios</h6>
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                <div className="bg-white dark:bg-neutral-800/50 rounded-lg p-3">
                                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">Current Ratio</p>
                                  <p className="text-lg font-bold text-neutral-900 dark:text-white">{calculateFinancialRatios().currentRatio}</p>
                                  <p className="text-xs text-neutral-400 mt-1">Liquidity</p>
                                </div>
                                <div className="bg-white dark:bg-neutral-800/50 rounded-lg p-3">
                                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">Debt-to-Equity</p>
                                  <p className="text-lg font-bold text-neutral-900 dark:text-white">{calculateFinancialRatios().debtToEquity}</p>
                                  <p className="text-xs text-neutral-400 mt-1">Leverage</p>
                                </div>
                                <div className="bg-white dark:bg-neutral-800/50 rounded-lg p-3">
                                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">ROA</p>
                                  <p className="text-lg font-bold text-neutral-900 dark:text-white">{calculateFinancialRatios().returnOnAssets}%</p>
                                  <p className="text-xs text-neutral-400 mt-1">Return on Assets</p>
                                </div>
                                <div className="bg-white dark:bg-neutral-800/50 rounded-lg p-3">
                                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">ROE</p>
                                  <p className="text-lg font-bold text-neutral-900 dark:text-white">{calculateFinancialRatios().returnOnEquity}%</p>
                                  <p className="text-xs text-neutral-400 mt-1">Return on Equity</p>
                                </div>
                                <div className="bg-white dark:bg-neutral-800/50 rounded-lg p-3">
                                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">Profit Margin</p>
                                  <p className="text-lg font-bold text-neutral-900 dark:text-white">{calculateFinancialRatios().profitMargin}%</p>
                                  <p className="text-xs text-neutral-400 mt-1">Profitability</p>
                                </div>
                                <div className="bg-white dark:bg-neutral-800/50 rounded-lg p-3">
                                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">Operating Margin</p>
                                  <p className="text-lg font-bold text-neutral-900 dark:text-white">{calculateFinancialRatios().operatingMargin}%</p>
                                  <p className="text-xs text-neutral-400 mt-1">Efficiency</p>
                                </div>
                                <div className="bg-white dark:bg-neutral-800/50 rounded-lg p-3">
                                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">Inventory Turnover</p>
                                  <p className="text-lg font-bold text-neutral-900 dark:text-white">{calculateFinancialRatios().inventoryTurnover}</p>
                                  <p className="text-xs text-neutral-400 mt-1">Efficiency</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Risk Assessment */}
                    <div className="bg-white dark:bg-neutral-800/50 rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
                      <div className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 px-5 py-4 border-b border-neutral-200 dark:border-neutral-700">
                        <h4 className="font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                          <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                          Risk Assessment
                        </h4>
                      </div>
                      <div className="p-5 space-y-5">
                        {/* Auto-calculated Risk Score */}
                        <div className="bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 rounded-xl p-4 border border-amber-200 dark:border-amber-800">
                          <h6 className="text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-3 uppercase tracking-wide">Automated Risk Analysis</h6>
                          <div className="grid grid-cols-3 gap-4">
                            <div className="bg-white dark:bg-neutral-800/50 rounded-lg p-3">
                              <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">Risk Score</p>
                              <p className="text-2xl font-bold text-neutral-900 dark:text-white">{calculateRiskScoreFromRatios().score}%</p>
                              <p className="text-xs text-neutral-400 mt-1">Financial Health</p>
                            </div>
                            <div className="bg-white dark:bg-neutral-800/50 rounded-lg p-3">
                              <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">Risk Level</p>
                              <p className={`text-lg font-bold capitalize ${
                                calculateRiskScoreFromRatios().riskLevel === 'low' ? 'text-green-600 dark:text-green-400' :
                                calculateRiskScoreFromRatios().riskLevel === 'medium' ? 'text-yellow-600 dark:text-yellow-400' :
                                'text-red-600 dark:text-red-400'
                              }`}>{calculateRiskScoreFromRatios().riskLevel}</p>
                              <p className="text-xs text-neutral-400 mt-1">Assessment</p>
                            </div>
                            <div className="bg-white dark:bg-neutral-800/50 rounded-lg p-3">
                              <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">Credit Rating</p>
                              <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">{calculateRiskScoreFromRatios().creditRating}</p>
                              <p className="text-xs text-neutral-400 mt-1">Grade</p>
                            </div>
                          </div>
                        </div>

                        {/* Manual Risk Inputs */}
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                              Overall Risk Score
                            </label>
                            <select
                              value={riskAssessment.overallRiskScore}
                              onChange={(e) => setRiskAssessment({...riskAssessment, overallRiskScore: e.target.value})}
                              className="w-full px-4 py-2 text-sm border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            >
                              <option value="low">Low Risk</option>
                              <option value="medium">Medium Risk</option>
                              <option value="high">High Risk</option>
                              <option value="very-high">Very High Risk</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                              Credit Rating
                            </label>
                            <select
                              value={riskAssessment.creditRating}
                              onChange={(e) => setRiskAssessment({...riskAssessment, creditRating: e.target.value})}
                              className="w-full px-4 py-2 text-sm border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            >
                              <option value="A+">A+ (Excellent)</option>
                              <option value="A">A (Very Good)</option>
                              <option value="B+">B+ (Good)</option>
                              <option value="B">B (Fair)</option>
                              <option value="B-">B- (Below Average)</option>
                              <option value="C+">C+ (Marginal)</option>
                              <option value="C">C (Poor)</option>
                              <option value="D">D (High Risk)</option>
                              <option value="F">F (Very High Risk)</option>
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                            Risk Factors
                          </label>
                          <textarea
                            value={riskAssessment.riskFactors}
                            onChange={(e) => setRiskAssessment({...riskAssessment, riskFactors: e.target.value})}
                            rows={4}
                            className="w-full px-4 py-3 text-sm border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                            placeholder="Identify key risk factors such as market volatility, credit history, liquidity concerns, etc."
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                            Mitigation Measures
                          </label>
                          <textarea
                            value={riskAssessment.mitigationMeasures}
                            onChange={(e) => setRiskAssessment({...riskAssessment, mitigationMeasures: e.target.value})}
                            rows={4}
                            className="w-full px-4 py-3 text-sm border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                            placeholder="Recommended actions to reduce identified risks (e.g., collateral requirements, monitoring plans, financial covenants)."
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                            Additional Risk Notes
                          </label>
                          <textarea
                            value={riskAssessment.additionalNotes}
                            onChange={(e) => setRiskAssessment({...riskAssessment, additionalNotes: e.target.value})}
                            rows={3}
                            className="w-full px-4 py-3 text-sm border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                            placeholder="Any other observations or contextual information about risk assessment."
                          />
                        </div>
                      </div>
                    </div>

                    {/* Legal & Compliance */}
                    <div className="bg-white dark:bg-neutral-800/50 rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
                      <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 px-5 py-4 border-b border-neutral-200 dark:border-neutral-700">
                        <h4 className="font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                          <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                          </svg>
                          Legal & Compliance
                        </h4>
                      </div>
                      <div className="divide-y divide-neutral-200 dark:divide-neutral-700">
                        {Object.entries(dueDiligence.legal).map(([key, value]) => (
                          <div key={key} className="p-4 hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition-colors">
                            <div className="flex items-center justify-between gap-4">
                              <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                                {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                              </span>
                              {renderCheckButtons('legal', key, value)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Identity Verification */}
                    <div className="bg-white dark:bg-neutral-800/50 rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
                      <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 px-5 py-4 border-b border-neutral-200 dark:border-neutral-700">
                        <h4 className="font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                          <svg className="w-5 h-5 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                          </svg>
                          Identity Verification
                        </h4>
                      </div>
                      <div className="divide-y divide-neutral-200 dark:divide-neutral-700">
                        {Object.entries(dueDiligence.identity).map(([key, value]) => (
                          <div key={key} className="p-4 hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition-colors">
                            <div className="flex items-center justify-between gap-4">
                              <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                                {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                              </span>
                              {renderCheckButtons('identity', key, value)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Operational Due Diligence */}
                    <div className="bg-white dark:bg-neutral-800/50 rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
                      <div className="bg-gradient-to-r from-teal-50 to-cyan-50 dark:from-teal-900/20 dark:to-cyan-900/20 px-5 py-4 border-b border-neutral-200 dark:border-neutral-700">
                        <h4 className="font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                          <svg className="w-5 h-5 text-teal-600 dark:text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          Operational Due Diligence
                        </h4>
                      </div>
                      <div className="divide-y divide-neutral-200 dark:divide-neutral-700">
                        {Object.entries(dueDiligence.operational).map(([key, value]) => (
                          <div key={key} className="p-4 hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition-colors">
                            <div className="flex items-center justify-between gap-4">
                              <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                                {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                              </span>
                              {renderCheckButtons('operational', key, value)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Collateral Verification */}
                    <div className="bg-white dark:bg-neutral-800/50 rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
                      <div className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 px-5 py-4 border-b border-neutral-200 dark:border-neutral-700">
                        <h4 className="font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                          <svg className="w-5 h-5 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                          Collateral Verification
                        </h4>
                      </div>
                      <div className="divide-y divide-neutral-200 dark:divide-neutral-700">
                        {Object.entries(dueDiligence.collateral).map(([key, value]) => (
                          <div key={key} className="p-4 hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition-colors">
                            <div className="flex items-center justify-between gap-4">
                              <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                                {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                              </span>
                              {renderCheckButtons('collateral', key, value)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Shariah Compliance */}
                    <div className="bg-white dark:bg-neutral-800/50 rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
                      <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 px-5 py-4 border-b border-neutral-200 dark:border-neutral-700">
                        <h4 className="font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                          <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                          </svg>
                          Shariah Compliance
                        </h4>
                      </div>
                      <div className="divide-y divide-neutral-200 dark:divide-neutral-700">
                        {Object.entries(dueDiligence.shariah).map(([key, value]) => (
                          <div key={key} className="p-4 hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition-colors">
                            <div className="flex items-center justify-between gap-4">
                              <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                                {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                              </span>
                              {renderCheckButtons('shariah', key, value)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Due Diligence Notes */}
                    <div className="bg-white dark:bg-neutral-800/50 rounded-xl border border-neutral-200 dark:border-neutral-700 p-5">
                      <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-3">
                        Due Diligence Notes <span className="text-neutral-500">(Optional)</span>
                      </label>
                      <textarea
                        value={dueDiligenceNotes}
                        onChange={(e) => setDueDiligenceNotes(e.target.value)}
                        placeholder="Add any additional notes or findings from your due diligence review..."
                        rows={4}
                        className="w-full px-4 py-3 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white resize-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                ) : activeTab === 'pricing' ? (
                  /* Pricing & Terms - Islamic Finance Instruments */
                  <div className="space-y-6">
                    {/* Islamic Financing Instrument Selection */}
                    <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-xl p-6 border border-emerald-200 dark:border-emerald-800">
                      <h4 className="font-bold text-lg text-neutral-900 dark:text-white mb-4 flex items-center gap-2">
                        <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                        Islamic Financing Instrument
                      </h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                            Financing Type <span className="text-red-500">*</span>
                          </label>
                          <select
                            value={pricingTerms.financingInstrument}
                            onChange={(e) => setPricingTerms({...pricingTerms, financingInstrument: e.target.value})}
                            className="w-full px-4 py-2.5 text-sm border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                          >
                            <option value="murabaha">Murabaha (Cost-Plus Financing)</option>
                            <option value="musharakah">Musharakah (Partnership)</option>
                            <option value="mudarabah">Mudarabah (Profit-Sharing)</option>
                            <option value="ijarah">Ijarah (Leasing)</option>
                            <option value="salam">Salam (Forward Sale)</option>
                          </select>
                          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                            {pricingTerms.financingInstrument === 'murabaha' && 'Sale with disclosed cost and profit margin'}
                            {pricingTerms.financingInstrument === 'musharakah' && 'Joint venture partnership with profit/loss sharing'}
                            {pricingTerms.financingInstrument === 'mudarabah' && 'Silent partnership with profit distribution'}
                            {pricingTerms.financingInstrument === 'ijarah' && 'Asset lease with ownership transfer option'}
                            {pricingTerms.financingInstrument === 'salam' && 'Advance payment for future goods delivery'}
                          </p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                            Payment Structure
                          </label>
                          <select
                            value={pricingTerms.paymentStructure}
                            onChange={(e) => setPricingTerms({...pricingTerms, paymentStructure: e.target.value})}
                            className="w-full px-4 py-2.5 text-sm border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                          >
                            <option value="installment">Installment Payments</option>
                            <option value="lump-sum">Lump Sum at Maturity</option>
                            <option value="deferred">Deferred Payment</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Murabaha Pricing (Cost-Plus) */}
                    {(pricingTerms.financingInstrument === 'murabaha' || pricingTerms.financingInstrument === 'salam') && (
                      <div className="bg-white dark:bg-neutral-800/50 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
                        <h5 className="font-bold text-neutral-900 dark:text-white mb-4">Murabaha Pricing Structure</h5>
                        <div className="grid grid-cols-3 gap-4 mb-4">
                          <div>
                            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                              Cost Price (₦)
                            </label>
                            <input
                              type="number"
                              value={pricingTerms.costPrice || ''}
                              onChange={(e) => {
                                const cost = Number(e.target.value);
                                const profit = pricingTerms.profitRate > 0 ? cost * (pricingTerms.profitRate / 100) : pricingTerms.profitAmount;
                                setPricingTerms({
                                  ...pricingTerms,
                                  costPrice: cost,
                                  profitAmount: profit,
                                  sellingPrice: cost + profit
                                });
                              }}
                              className="w-full px-4 py-2 text-sm border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                              placeholder="0"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                              Profit Rate (%)
                            </label>
                            <input
                              type="number"
                              step="0.1"
                              value={pricingTerms.profitRate || ''}
                              onChange={(e) => {
                                const rate = Number(e.target.value);
                                const profit = pricingTerms.costPrice * (rate / 100);
                                setPricingTerms({
                                  ...pricingTerms,
                                  profitRate: rate,
                                  profitAmount: profit,
                                  sellingPrice: pricingTerms.costPrice + profit
                                });
                              }}
                              className="w-full px-4 py-2 text-sm border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                              placeholder="0.0"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                              Profit Amount (₦)
                            </label>
                            <input
                              type="number"
                              value={pricingTerms.profitAmount.toFixed(2)}
                              readOnly
                              className="w-full px-4 py-2 text-sm border border-neutral-300 dark:border-neutral-600 rounded-lg bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-white cursor-not-allowed"
                            />
                          </div>
                        </div>
                        <div className="bg-gradient-to-r from-primary-50 to-blue-50 dark:from-primary-900/20 dark:to-blue-900/20 rounded-lg p-4 border border-primary-200 dark:border-primary-800">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Total Selling Price</span>
                            <span className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                              ₦{pricingTerms.sellingPrice.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Musharakah/Mudarabah Profit Sharing */}
                    {(pricingTerms.financingInstrument === 'musharakah' || pricingTerms.financingInstrument === 'mudarabah') && (
                      <div className="bg-white dark:bg-neutral-800/50 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
                        <h5 className="font-bold text-neutral-900 dark:text-white mb-4">Profit Sharing Arrangement</h5>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div>
                            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                              Business Share (%)
                            </label>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={pricingTerms.profitSharingRatio || ''}
                              onChange={(e) => {
                                const businessShare = Number(e.target.value);
                                setPricingTerms({
                                  ...pricingTerms,
                                  profitSharingRatio: businessShare,
                                  investorSharingRatio: 100 - businessShare
                                });
                              }}
                              className="w-full px-4 py-2 text-sm border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                              placeholder="70"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                              Investor Share (%)
                            </label>
                            <input
                              type="number"
                              value={pricingTerms.investorSharingRatio}
                              readOnly
                              className="w-full px-4 py-2 text-sm border border-neutral-300 dark:border-neutral-600 rounded-lg bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-white cursor-not-allowed"
                            />
                          </div>
                        </div>
                        <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-4 border border-amber-200 dark:border-amber-800">
                          <p className="text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2">
                            <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                            <span>
                              {pricingTerms.financingInstrument === 'musharakah' 
                                ? 'Musharakah: Both parties contribute capital and share profits/losses according to agreement. Losses shared based on capital ratio.'
                                : 'Mudarabah: Investor provides capital (Rabb-ul-Mal), business manages (Mudarib). Profits shared per agreement, losses borne by investor.'}
                            </span>
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Installment & Payment Terms */}
                    {pricingTerms.paymentStructure === 'installment' && (
                      <div className="bg-white dark:bg-neutral-800/50 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
                        <h5 className="font-bold text-neutral-900 dark:text-white mb-4">Installment Schedule</h5>
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                              Frequency
                            </label>
                            <select
                              value={pricingTerms.installmentFrequency}
                              onChange={(e) => setPricingTerms({...pricingTerms, installmentFrequency: e.target.value})}
                              className="w-full px-4 py-2.5 text-sm border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                            >
                              <option value="monthly">Monthly</option>
                              <option value="quarterly">Quarterly</option>
                              <option value="semi-annual">Semi-Annual</option>
                              <option value="annual">Annual</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                              Number of Installments
                            </label>
                            <input
                              type="number"
                              value={pricingTerms.numberOfInstallments || ''}
                              onChange={(e) => setPricingTerms({...pricingTerms, numberOfInstallments: Number(e.target.value)})}
                              className="w-full px-4 py-2 text-sm border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                              placeholder="18"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                              Grace Period (Months)
                            </label>
                            <input
                              type="number"
                              value={pricingTerms.defermentPeriod || ''}
                              onChange={(e) => setPricingTerms({...pricingTerms, defermentPeriod: Number(e.target.value)})}
                              className="w-full px-4 py-2 text-sm border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                              placeholder="0"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Fees & Charges */}
                    <div className="bg-white dark:bg-neutral-800/50 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
                      <h5 className="font-bold text-neutral-900 dark:text-white mb-4">Fees & Charges</h5>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                            Administration Fee (%)
                          </label>
                          <input
                            type="number"
                            step="0.1"
                            value={pricingTerms.administrationFee || ''}
                            onChange={(e) => setPricingTerms({...pricingTerms, administrationFee: Number(e.target.value)})}
                            className="w-full px-4 py-2 text-sm border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                            placeholder="2.0"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                            Early Settlement Discount (%)
                          </label>
                          <input
                            type="number"
                            step="0.1"
                            value={pricingTerms.earlySettlementDiscount || ''}
                            onChange={(e) => setPricingTerms({...pricingTerms, earlySettlementDiscount: Number(e.target.value)})}
                            className="w-full px-4 py-2 text-sm border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                            placeholder="0.0"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                            Late Payment Penalty
                          </label>
                          <select
                            value={pricingTerms.latePaymentPenalty}
                            onChange={(e) => setPricingTerms({...pricingTerms, latePaymentPenalty: e.target.value})}
                            className="w-full px-4 py-2.5 text-sm border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                          >
                            <option value="charity">Donate to Charity (Shariah-compliant)</option>
                            <option value="none">No Penalty</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                            Takaful Coverage (Islamic Insurance)
                          </label>
                          <div className="flex items-center h-[42px]">
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={pricingTerms.takafulCoverage}
                                onChange={(e) => setPricingTerms({...pricingTerms, takafulCoverage: e.target.checked})}
                                className="sr-only peer"
                              />
                              <div className="w-11 h-6 bg-neutral-200 peer-focus:ring-2 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-neutral-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-neutral-600 peer-checked:bg-primary-600"></div>
                              <span className="ml-3 text-sm font-medium text-neutral-900 dark:text-neutral-300">
                                {pricingTerms.takafulCoverage ? 'Required' : 'Optional'}
                              </span>
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Collateral Information */}
                    <div className="bg-white dark:bg-neutral-800/50 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
                      <h5 className="font-bold text-neutral-900 dark:text-white mb-4">Collateral & Security</h5>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                            Collateral Type
                          </label>
                          <input
                            type="text"
                            value={pricingTerms.collateralType}
                            onChange={(e) => setPricingTerms({...pricingTerms, collateralType: e.target.value})}
                            className="w-full px-4 py-2 text-sm border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                            placeholder="e.g., Real Estate, Equipment, Inventory"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                            Collateral Value (₦)
                          </label>
                          <input
                            type="number"
                            value={pricingTerms.collateralValue || ''}
                            onChange={(e) => setPricingTerms({...pricingTerms, collateralValue: Number(e.target.value)})}
                            className="w-full px-4 py-2 text-sm border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                            placeholder="0"
                          />
                        </div>
                      </div>
                      {pricingTerms.collateralValue > 0 && (
                        <div className="mt-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Security Coverage Ratio</span>
                            <span className="text-lg font-bold text-green-600 dark:text-green-400">
                              {((pricingTerms.collateralValue / (pricingTerms.sellingPrice || pricingTerms.costPrice || 1)) * 100).toFixed(1)}%
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : activeTab === 'recommendations' ? (
                  /* AI-Powered Recommendations */
                  <div className="space-y-6">
                    {/* Approval Decision Card */}
                    <div className={`rounded-xl p-6 border-2 ${
                      recommendations.approvalRecommendation === 'approve' 
                        ? 'bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-300 dark:border-green-700'
                        : recommendations.approvalRecommendation === 'reject'
                        ? 'bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 border-red-300 dark:border-red-700'
                        : recommendations.approvalRecommendation === 'request-info'
                        ? 'bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 border-amber-300 dark:border-amber-700'
                        : 'bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-800 dark:to-neutral-900 border-neutral-300 dark:border-neutral-700'
                    }`}>
                      <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-full ${
                          recommendations.approvalRecommendation === 'approve' 
                            ? 'bg-green-200 dark:bg-green-800'
                            : recommendations.approvalRecommendation === 'reject'
                            ? 'bg-red-200 dark:bg-red-800'
                            : recommendations.approvalRecommendation === 'request-info'
                            ? 'bg-amber-200 dark:bg-amber-800'
                            : 'bg-neutral-200 dark:bg-neutral-700'
                        }`}>
                          {recommendations.approvalRecommendation === 'approve' ? (
                            <svg className="w-8 h-8 text-green-700 dark:text-green-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          ) : recommendations.approvalRecommendation === 'reject' ? (
                            <svg className="w-8 h-8 text-red-700 dark:text-red-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          ) : recommendations.approvalRecommendation === 'request-info' ? (
                            <svg className="w-8 h-8 text-amber-700 dark:text-amber-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          ) : (
                            <svg className="w-8 h-8 text-neutral-700 dark:text-neutral-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          )}
                        </div>
                        <div className="flex-1">
                          <h4 className="text-xl font-bold text-neutral-900 dark:text-white mb-2 flex items-center gap-2">
                            System Recommendation
                            <select
                              value={recommendations.approvalRecommendation}
                              onChange={(e) => setRecommendations({...recommendations, approvalRecommendation: e.target.value as any})}
                              className="ml-auto text-sm px-3 py-1.5 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
                            >
                              <option value="approve">Approve</option>
                              <option value="reject">Reject</option>
                              <option value="request-info">Request Info</option>
                              <option value="pending">Pending Review</option>
                            </select>
                          </h4>
                          <textarea
                            value={recommendations.reasoning}
                            onChange={(e) => setRecommendations({...recommendations, reasoning: e.target.value})}
                            rows={3}
                            className="w-full px-4 py-3 text-sm border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                            placeholder="Reasoning for recommendation..."
                          />
                        </div>
                      </div>
                    </div>

                    {/* Recommended Terms Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-white dark:bg-neutral-800/50 rounded-xl border border-neutral-200 dark:border-neutral-700 p-4">
                        <label className="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-2">Financing Instrument</label>
                        <select
                          value={recommendations.recommendedInstrument}
                          onChange={(e) => setRecommendations({...recommendations, recommendedInstrument: e.target.value})}
                          className="w-full px-3 py-2 text-sm border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white"
                        >
                          <option value="murabaha">Murabaha</option>
                          <option value="musharakah">Musharakah</option>
                          <option value="mudarabah">Mudarabah</option>
                          <option value="ijarah">Ijarah</option>
                          <option value="salam">Salam</option>
                        </select>
                      </div>
                      <div className="bg-white dark:bg-neutral-800/50 rounded-xl border border-neutral-200 dark:border-neutral-700 p-4">
                        <label className="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-2">Recommended Amount (₦)</label>
                        <input
                          type="number"
                          value={recommendations.recommendedAmount || ''}
                          onChange={(e) => setRecommendations({...recommendations, recommendedAmount: Number(e.target.value)})}
                          className="w-full px-3 py-2 text-sm border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white"
                        />
                      </div>
                      <div className="bg-white dark:bg-neutral-800/50 rounded-xl border border-neutral-200 dark:border-neutral-700 p-4">
                        <label className="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-2">Term (Months)</label>
                        <input
                          type="number"
                          value={recommendations.recommendedTerm || ''}
                          onChange={(e) => setRecommendations({...recommendations, recommendedTerm: Number(e.target.value)})}
                          className="w-full px-3 py-2 text-sm border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white"
                        />
                      </div>
                      <div className="bg-white dark:bg-neutral-800/50 rounded-xl border border-neutral-200 dark:border-neutral-700 p-4">
                        <label className="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-2">Profit Rate (%)</label>
                        <input
                          type="number"
                          step="0.1"
                          value={recommendations.recommendedProfitRate || ''}
                          onChange={(e) => setRecommendations({...recommendations, recommendedProfitRate: Number(e.target.value)})}
                          className="w-full px-3 py-2 text-sm border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white"
                        />
                      </div>
                    </div>

                    {/* Strengths Section */}
                    {recommendations.strengths.length > 0 && (
                      <div className="bg-white dark:bg-neutral-800/50 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
                        <h5 className="font-bold text-neutral-900 dark:text-white mb-4 flex items-center gap-2">
                          <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Key Strengths
                        </h5>
                        <ul className="space-y-2">
                          {recommendations.strengths.map((strength, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-sm text-neutral-700 dark:text-neutral-300">
                              <svg className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                              <span>{strength}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Concerns Section */}
                    {recommendations.concerns.length > 0 && (
                      <div className="bg-white dark:bg-neutral-800/50 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
                        <h5 className="font-bold text-neutral-900 dark:text-white mb-4 flex items-center gap-2">
                          <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                          Risk Concerns
                        </h5>
                        <ul className="space-y-2">
                          {recommendations.concerns.map((concern, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-sm text-neutral-700 dark:text-neutral-300">
                              <svg className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
                              <span>{concern}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Conditions & Requirements */}
                    {recommendations.conditions.length > 0 && (
                      <div className="bg-white dark:bg-neutral-800/50 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
                        <h5 className="font-bold text-neutral-900 dark:text-white mb-4 flex items-center gap-2">
                          <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                          </svg>
                          Approval Conditions
                        </h5>
                        <ul className="space-y-2">
                          {recommendations.conditions.map((condition, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-sm text-neutral-700 dark:text-neutral-300">
                              <svg className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                              </svg>
                              <span>{condition}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Mitigation Suggestions */}
                    <div className="bg-white dark:bg-neutral-800/50 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
                      <h5 className="font-bold text-neutral-900 dark:text-white mb-3">Risk Mitigation Suggestions</h5>
                      <textarea
                        value={recommendations.mitigationSuggestions}
                        onChange={(e) => setRecommendations({...recommendations, mitigationSuggestions: e.target.value})}
                        rows={5}
                        className="w-full px-4 py-3 text-sm border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white focus:ring-2 focus:ring-primary-500 resize-none"
                        placeholder="Add specific mitigation measures and monitoring requirements..."
                      />
                    </div>
                  </div>
                ) : null}
              </div>

              {/* Modal Footer */}
              <div className="px-8 py-6 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50">
                {!showApprovalForm && !showRequestInfoForm ? (
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={() => {
                        // Set default terms based on contract type
                        const contractType = selectedApplication.data.contractType;
                        const defaultTerms = {
                          musharaka: { returnMin: 15, returnMax: 18, termMonths: 24, minimumInvestment: 500000, campaignDays: 30 },
                          mudaraba: { returnMin: 12, returnMax: 16, termMonths: 18, minimumInvestment: 500000, campaignDays: 30 },
                          murabaha: { returnMin: 10, returnMax: 12, termMonths: 12, minimumInvestment: 500000, campaignDays: 21 },
                          ijara: { returnMin: 12, returnMax: 14, termMonths: 18, minimumInvestment: 500000, campaignDays: 30 },
                          istisna: { returnMin: 10, returnMax: 12, termMonths: 12, minimumInvestment: 500000, campaignDays: 45 }
                        };
                        const terms = defaultTerms[contractType as keyof typeof defaultTerms] || defaultTerms.mudaraba;
                        setApprovalTerms(terms);
                        setShowApprovalForm(true);
                      }}
                      disabled={processing || calculateDueDiligenceScore() < 100}
                      className="flex-1 min-w-[160px] px-6 py-3.5 bg-success-600 hover:bg-success-700 disabled:bg-neutral-400 disabled:cursor-not-allowed text-white font-semibold rounded-xl shadow-sm hover:shadow-md transition-all"
                      title={calculateDueDiligenceScore() < 100 ? `Complete due diligence first (${calculateDueDiligenceScore()}% done)` : 'Approve application'}
                    >
                      Approve Application
                    </button>
                    <button
                      onClick={() => {
                        setAdminMessage('');
                        setShowRequestInfoForm(true);
                      }}
                      disabled={processing}
                      className="px-6 py-3.5 bg-white dark:bg-neutral-800 border border-amber-300 dark:border-amber-600 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 disabled:opacity-50 disabled:cursor-not-allowed font-semibold rounded-xl shadow-sm transition-all"
                    >
                      Request More Info
                    </button>
                    <button
                      onClick={() => handleReject(selectedApplication)}
                      disabled={processing}
                      className="px-6 py-3.5 bg-white dark:bg-neutral-800 border border-error-300 dark:border-error-600 text-error-600 dark:text-error-400 hover:bg-error-50 dark:hover:bg-error-900/20 disabled:opacity-50 disabled:cursor-not-allowed font-semibold rounded-xl shadow-sm transition-all"
                    >
                      Reject
                    </button>
                  </div>
                ) : showApprovalForm ? (
                  <div className="space-y-4">
                    <h3 className="font-bold text-lg text-neutral-900 dark:text-white">Set Investment Terms</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                          Min Return (%)
                        </label>
                        <input
                          type="number"
                          value={approvalTerms.returnMin}
                          onChange={(e) => setApprovalTerms({...approvalTerms, returnMin: Number(e.target.value)})}
                          className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                          Max Return (%)
                        </label>
                        <input
                          type="number"
                          value={approvalTerms.returnMax}
                          onChange={(e) => setApprovalTerms({...approvalTerms, returnMax: Number(e.target.value)})}
                          className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                          Term (Months)
                        </label>
                        <input
                          type="number"
                          value={approvalTerms.termMonths}
                          onChange={(e) => setApprovalTerms({...approvalTerms, termMonths: Number(e.target.value)})}
                          className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                          Min Investment (₦)
                        </label>
                        <input
                          type="number"
                          value={approvalTerms.minimumInvestment}
                          onChange={(e) => setApprovalTerms({...approvalTerms, minimumInvestment: Number(e.target.value)})}
                          className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                          Campaign Duration (Days)
                        </label>
                        <input
                          type="number"
                          value={approvalTerms.campaignDays}
                          onChange={(e) => setApprovalTerms({...approvalTerms, campaignDays: Number(e.target.value)})}
                          className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
                          min="1"
                          max="365"
                        />
                      </div>
                    </div>
                    <div className="flex gap-3 pt-2">
                      <button
                        onClick={() => handleApprove(selectedApplication)}
                        disabled={processing}
                        className="flex-1 px-6 py-3 bg-success-600 hover:bg-success-700 disabled:bg-neutral-400 disabled:cursor-not-allowed text-white font-semibold rounded-xl shadow-sm transition-all"
                      >
                        {processing ? 'Processing...' : 'Confirm Approval'}
                      </button>
                      <button
                        onClick={() => setShowApprovalForm(false)}
                        disabled={processing}
                        className="px-6 py-3 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700 font-semibold rounded-xl shadow-sm transition-all"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-6 space-y-4">
                    <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-4">Request More Information</h3>
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                        Message to Business <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        value={adminMessage}
                        onChange={(e) => setAdminMessage(e.target.value)}
                        placeholder="Explain what information or changes are needed..."
                        rows={4}
                        className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white resize-none"
                      />
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                        This message will be shown to the business. They can then resubmit their application with the requested changes.
                      </p>
                    </div>
                    <div className="flex gap-3 pt-2">
                      <button
                        onClick={() => handleRequestInfo(selectedApplication)}
                        disabled={processing || !adminMessage.trim()}
                        className="flex-1 px-6 py-3 bg-amber-600 hover:bg-amber-700 disabled:bg-neutral-400 disabled:cursor-not-allowed text-white font-semibold rounded-xl shadow-sm transition-all"
                      >
                        {processing ? 'Sending...' : 'Send Request'}
                      </button>
                      <button
                        onClick={() => {
                          setAdminMessage('');
                          setShowRequestInfoForm(false);
                        }}
                        disabled={processing}
                        className="px-6 py-3 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700 font-semibold rounded-xl shadow-sm transition-all"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Internal Notes Modal */}
      {showNotesModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity" onClick={closeNotesModal} />
            
            <div className="relative bg-white dark:bg-neutral-900 rounded-2xl max-w-2xl w-full shadow-2xl border border-neutral-200 dark:border-neutral-800">
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-800">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-neutral-900 dark:text-white">Internal Admin Notes</h3>
                  <button 
                    onClick={closeNotesModal}
                    className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
                  >
                    <svg className="w-5 h-5 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                  These notes are only visible to admin team members
                </p>
              </div>

              {/* Modal Content */}
              <div className="px-6 py-4">
                <textarea
                  value={notesText}
                  onChange={(e) => setNotesText(e.target.value)}
                  placeholder="Add internal notes about this application..."
                  rows={8}
                  className="w-full px-4 py-3 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 rounded-lg text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 resize-none"
                />
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 border-t border-neutral-200 dark:border-neutral-800 flex justify-end gap-3">
                <button
                  onClick={closeNotesModal}
                  className="px-4 py-2 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700 font-semibold rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveNote}
                  className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg transition-colors"
                >
                  Save Notes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
