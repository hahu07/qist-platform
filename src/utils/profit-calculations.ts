// import type { ProfitCalc } from "@/schemas";

type ProfitCalc = {
  contractType: string;
  netProfit: number;
  totalInvestment: number;
  businessSharePercentage: number;
  investments: Array<{ investorId: string; amount: number }>;
};

/**
 * Calculate profit distribution based on Islamic finance contract types
 */
export function calculateProfitDistribution(params: ProfitCalc) {
  const { contractType, netProfit, totalInvestment, businessSharePercentage, investments } = params;
  
  // Validate inputs
  if (totalInvestment <= 0) {
    throw new Error("Total investment must be positive");
  }
  
  if (businessSharePercentage < 0 || businessSharePercentage > 100) {
    throw new Error("Business share percentage must be between 0 and 100");
  }
  
  // Calculate based on contract type
  switch (contractType) {
    case "musharaka":
      // Musharaka: Profit AND loss shared proportionally
      return calculateMusharakaDistribution(netProfit, totalInvestment, businessSharePercentage, investments);
      
    case "mudaraba":
      // Mudaraba: Only profit shared, loss borne by investors (unless business negligence)
      return calculateMudarabaDistribution(netProfit, totalInvestment, businessSharePercentage, investments);
      
    case "murabaha":
      // Murabaha: Fixed markup, not profit sharing
      return calculateMurabahaDistribution(netProfit, totalInvestment, businessSharePercentage, investments);
      
    case "ijara":
      // Ijara: Fixed lease payments, not profit sharing
      return calculateIjaraDistribution(netProfit, totalInvestment, businessSharePercentage, investments);
      
    case "istisna":
      // Istisna: Project-based, profit at completion
      return calculateIstisnaDistribution(netProfit, totalInvestment, businessSharePercentage, investments);
      
    default:
      throw new Error(`Unsupported contract type: ${contractType}`);
  }
}

/**
 * Musharaka: Partnership - both profit and loss shared
 */
function calculateMusharakaDistribution(
  netProfit: number,
  totalInvestment: number,
  businessSharePercentage: number,
  investments: Array<{ investorId: string; amount: number }>
) {
  const investorSharePercentage = 100 - businessSharePercentage;
  const businessShare = (netProfit * businessSharePercentage) / 100;
  const totalInvestorShare = (netProfit * investorSharePercentage) / 100;
  
  const distributionPerInvestor = investments.map((inv) => {
    const investmentPercentage = (inv.amount / totalInvestment) * 100;
    const profitShare = (totalInvestorShare * inv.amount) / totalInvestment;
    
    return {
      investorId: inv.investorId,
      investmentAmount: inv.amount,
      profitShare: profitShare,
      percentage: investmentPercentage,
    };
  });
  
  return {
    totalDistributable: netProfit,
    businessShare: businessShare,
    investorShare: totalInvestorShare,
    distributionPerInvestor,
  };
}

/**
 * Mudaraba: Profit sharing only, loss borne by capital provider (investors)
 */
function calculateMudarabaDistribution(
  netProfit: number,
  totalInvestment: number,
  businessSharePercentage: number,
  investments: Array<{ investorId: string; amount: number }>
) {
  // If loss, business (mudarib) doesn't share unless negligent
  if (netProfit <= 0) {
    const distributionPerInvestor = investments.map((inv) => {
      const investmentPercentage = (inv.amount / totalInvestment) * 100;
      const lossShare = (netProfit * inv.amount) / totalInvestment;
      
      return {
        investorId: inv.investorId,
        investmentAmount: inv.amount,
        profitShare: lossShare, // Negative value = loss
        percentage: investmentPercentage,
      };
    });
    
    return {
      totalDistributable: netProfit,
      businessShare: 0, // Business doesn't share loss
      investorShare: netProfit, // All loss to investors
      distributionPerInvestor,
    };
  }
  
  // If profit, share according to agreed ratio
  return calculateMusharakaDistribution(netProfit, totalInvestment, businessSharePercentage, investments);
}

/**
 * Murabaha: Fixed markup - not profit sharing
 */
function calculateMurabahaDistribution(
  netProfit: number,
  totalInvestment: number,
  businessSharePercentage: number,
  investments: Array<{ investorId: string; amount: number }>
) {
  // In Murabaha, investors get fixed markup regardless of profit
  // This is simplified - actual markup should be predetermined
  const fixedMarkupRate = 0.15; // 15% markup (should come from contract terms)
  
  const distributionPerInvestor = investments.map((inv) => {
    const investmentPercentage = (inv.amount / totalInvestment) * 100;
    const fixedReturn = inv.amount * fixedMarkupRate;
    
    return {
      investorId: inv.investorId,
      investmentAmount: inv.amount,
      profitShare: fixedReturn,
      percentage: investmentPercentage,
    };
  });
  
  const totalInvestorShare = distributionPerInvestor.reduce((sum, dist) => sum + dist.profitShare, 0);
  const businessShare = netProfit - totalInvestorShare;
  
  return {
    totalDistributable: netProfit,
    businessShare: businessShare,
    investorShare: totalInvestorShare,
    distributionPerInvestor,
  };
}

/**
 * Ijara: Fixed lease payments
 */
function calculateIjaraDistribution(
  netProfit: number,
  totalInvestment: number,
  businessSharePercentage: number,
  investments: Array<{ investorId: string; amount: number }>
) {
  // Similar to Murabaha - fixed lease payments
  const fixedLeaseRate = 0.12; // 12% lease payment (should come from contract terms)
  
  const distributionPerInvestor = investments.map((inv) => {
    const investmentPercentage = (inv.amount / totalInvestment) * 100;
    const leasePayment = inv.amount * fixedLeaseRate;
    
    return {
      investorId: inv.investorId,
      investmentAmount: inv.amount,
      profitShare: leasePayment,
      percentage: investmentPercentage,
    };
  });
  
  const totalInvestorShare = distributionPerInvestor.reduce((sum, dist) => sum + dist.profitShare, 0);
  const businessShare = netProfit - totalInvestorShare;
  
  return {
    totalDistributable: netProfit,
    businessShare: businessShare,
    investorShare: totalInvestorShare,
    distributionPerInvestor,
  };
}

/**
 * Istisna: Project completion based
 */
function calculateIstisnaDistribution(
  netProfit: number,
  totalInvestment: number,
  businessSharePercentage: number,
  investments: Array<{ investorId: string; amount: number }>
) {
  // Istisna: Profit distributed based on project milestones/completion
  // Using Musharaka-style distribution for simplicity
  return calculateMusharakaDistribution(netProfit, totalInvestment, businessSharePercentage, investments);
}

/**
 * Format currency for display
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Calculate profit margin percentage
 */
export function calculateProfitMargin(revenue: number, expenses: number): number {
  if (revenue === 0) return 0;
  const netProfit = revenue - expenses;
  return (netProfit / revenue) * 100;
}

/**
 * Calculate ROI for investors
 */
export function calculateROI(initialInvestment: number, profitEarned: number): number {
  if (initialInvestment === 0) return 0;
  return (profitEarned / initialInvestment) * 100;
}

/**
 * Get contract type display name
 */
export function getContractTypeName(contractType: string): string {
  const names: Record<string, string> = {
    musharaka: "Musharaka (Partnership)",
    mudaraba: "Mudaraba (Profit Sharing)",
    murabaha: "Murabaha (Cost Plus)",
    ijara: "Ijara (Lease)",
    istisna: "Istisna (Manufacturing)",
  };
  return names[contractType] || contractType;
}

/**
 * Validate revenue report dates
 */
export function validateReportingPeriod(startDate: string, endDate: string): boolean {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return false;
  }
  
  return start < end;
}
