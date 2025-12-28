/**
 * Auto-calculate investment terms from Islamic contract-specific data
 * 
 * This utility derives investment opportunity terms (returns, duration, minimums)
 * from the underlying contract terms to ensure consistency and reduce manual input.
 */

import { 
  ContractTerms,
  isMurabahaTerms,
  isMudarabahTerms,
  isMusharakahTerms,
  isIjarahTerms,
  isSalamTerms,
  type MurabahaTerms,
  type MudarabahTerms,
  type MusharakahTerms,
  type IjarahTerms,
  type SalamTerms
} from "@/schemas/islamic-contracts.schema";

export interface InvestmentTerms {
  returnMin: number;      // Minimum annual return percentage
  returnMax: number;      // Maximum annual return percentage
  termMonths: number;     // Investment term in months
  minimumInvestment: number;  // Minimum investment amount
  campaignDays: number;   // Fundraising campaign duration
}

/**
 * Calculate Murabaha investment terms
 * 
 * Returns are based on the profit margin spread over the repayment period.
 * Formula: Annual Return = (Profit Rate / Duration in Years)
 */
function calculateMurabahaTerms(terms: MurabahaTerms): InvestmentTerms {
  const termMonths = terms.duration;
  const termYears = termMonths / 12;
  
  // Profit rate is already annualized, so we need to account for the term
  const annualReturn = terms.profitRate / termYears;
  
  // Conservative range: ±1% around calculated return
  const returnMin = Math.max(0, annualReturn - 1);
  const returnMax = annualReturn + 1;
  
  // Minimum investment: typically 10-20% of asset cost
  const minimumInvestment = Math.max(100000, Math.round(terms.assetCost * 0.15));
  
  // Campaign duration: shorter for Murabaha (21-30 days)
  const campaignDays = termMonths <= 12 ? 21 : 30;
  
  return {
    returnMin: Math.round(returnMin * 100) / 100,
    returnMax: Math.round(returnMax * 100) / 100,
    termMonths,
    minimumInvestment,
    campaignDays
  };
}

/**
 * Calculate Mudarabah investment terms
 * 
 * Returns are based on the investor's profit-sharing ratio.
 * This is an expected return since actual returns depend on business performance.
 */
function calculateMudarabahTerms(terms: MudarabahTerms): InvestmentTerms {
  const termMonths = terms.duration;
  
  // Use expected annual return if provided, otherwise derive from profit share
  const expectedReturn = terms.expectedAnnualReturn || terms.expectedReturnRate || 
                         (terms.investorProfitShare * 0.18); // Assume 18% base business return
  
  // Wider range for Mudarabah due to profit-sharing uncertainty
  const returnMin = expectedReturn - 2;
  const returnMax = expectedReturn + 4;
  
  // Minimum investment: typically 10-15% of capital
  const minimumInvestment = Math.max(250000, Math.round(terms.capitalAmount * 0.12));
  
  // Campaign duration: standard 30 days
  const campaignDays = 30;
  
  return {
    returnMin: Math.max(0, Math.round(returnMin * 100) / 100),
    returnMax: Math.round(returnMax * 100) / 100,
    termMonths,
    minimumInvestment,
    campaignDays
  };
}

/**
 * Calculate Musharakah investment terms
 * 
 * Returns are based on the investor's profit-sharing ratio in the partnership.
 * Similar to Mudarabah but typically involves more capital.
 */
function calculateMusharakahTerms(terms: MusharakahTerms): InvestmentTerms {
  const termMonths = terms.duration;
  
  // Use expected annual return or derive from Party 2 (investor) profit share
  const expectedReturn = terms.expectedAnnualReturn || 
                         (terms.party2ProfitShare * 0.20); // Assume 20% base return
  
  // Moderate range for Musharakah
  const returnMin = expectedReturn - 2;
  const returnMax = expectedReturn + 3;
  
  // Minimum investment: 10-15% of Party 2's capital contribution
  const minimumInvestment = Math.max(500000, Math.round(terms.party2Capital * 0.12));
  
  // Campaign duration: longer for joint ventures (30-45 days)
  const campaignDays = termMonths >= 24 ? 45 : 30;
  
  return {
    returnMin: Math.max(0, Math.round(returnMin * 100) / 100),
    returnMax: Math.round(returnMax * 100) / 100,
    termMonths,
    minimumInvestment,
    campaignDays
  };
}

/**
 * Calculate Ijarah investment terms
 * 
 * Returns are based on rental yield (monthly rental / asset value).
 * Formula: Annual Return = (Monthly Rental × 12 / Asset Value) × 100
 */
function calculateIjarahTerms(terms: IjarahTerms): InvestmentTerms {
  const termMonths = terms.duration;
  
  // Calculate annual rental yield
  const annualRental = terms.monthlyRental * 12;
  const rentalYield = (annualRental / terms.assetValue) * 100;
  
  // Conservative range for leasing: ±1%
  const returnMin = rentalYield - 1;
  const returnMax = rentalYield + 1;
  
  // Minimum investment: 15-20% of asset value
  const minimumInvestment = Math.max(300000, Math.round(terms.assetValue * 0.17));
  
  // Campaign duration: standard 30 days
  const campaignDays = 30;
  
  return {
    returnMin: Math.max(0, Math.round(returnMin * 100) / 100),
    returnMax: Math.round(returnMax * 100) / 100,
    termMonths,
    minimumInvestment,
    campaignDays
  };
}

/**
 * Calculate Salam investment terms
 * 
 * Returns are based on the difference between advance payment and delivery value.
 * Formula: Return = ((Delivery Value - Advance Payment) / Advance Payment) × 100 / Years
 */
function calculateSalamTerms(terms: SalamTerms): InvestmentTerms {
  const termMonths = terms.duration;
  const termYears = termMonths / 12;
  
  // Calculate profit margin from advance to delivery
  const profitMargin = ((terms.deliveryValue - terms.advancePayment) / terms.advancePayment) * 100;
  const annualReturn = profitMargin / termYears;
  
  // Wider range for commodity trading: ±2%
  const returnMin = annualReturn - 2;
  const returnMax = annualReturn + 2;
  
  // Minimum investment: 10-12% of advance payment
  const minimumInvestment = Math.max(150000, Math.round(terms.advancePayment * 0.11));
  
  // Campaign duration: longer for Salam contracts (45-60 days)
  const campaignDays = termMonths >= 12 ? 60 : 45;
  
  return {
    returnMin: Math.max(0, Math.round(returnMin * 100) / 100),
    returnMax: Math.round(returnMax * 100) / 100,
    termMonths,
    minimumInvestment,
    campaignDays
  };
}

/**
 * Main function to auto-calculate investment terms from contract terms
 * 
 * @param contractTerms - The Islamic contract terms object
 * @returns Calculated investment terms or null if invalid
 */
export function calculateInvestmentTermsFromContract(
  contractTerms: ContractTerms | null | undefined
): InvestmentTerms | null {
  if (!contractTerms) {
    return null;
  }
  
  try {
    if (isMurabahaTerms(contractTerms)) {
      return calculateMurabahaTerms(contractTerms);
    }
    
    if (isMudarabahTerms(contractTerms)) {
      return calculateMudarabahTerms(contractTerms);
    }
    
    if (isMusharakahTerms(contractTerms)) {
      return calculateMusharakahTerms(contractTerms);
    }
    
    if (isIjarahTerms(contractTerms)) {
      return calculateIjarahTerms(contractTerms);
    }
    
    if (isSalamTerms(contractTerms)) {
      return calculateSalamTerms(contractTerms);
    }
    
    // Unknown contract type
    return null;
  } catch (error) {
    console.error('Failed to calculate investment terms:', error);
    return null;
  }
}

/**
 * Generate human-readable explanation of how terms were calculated
 * 
 * @param contractTerms - The Islamic contract terms object
 * @returns Explanation string or null
 */
export function getCalculationExplanation(
  contractTerms: ContractTerms | null | undefined
): string | null {
  if (!contractTerms) {
    return null;
  }
  
  try {
    if (isMurabahaTerms(contractTerms)) {
      return `Returns calculated from ${contractTerms.profitRate.toFixed(1)}% profit margin over ${contractTerms.duration} months. Min investment is 15% of ₦${contractTerms.assetCost.toLocaleString()} asset cost.`;
    }
    
    if (isMudarabahTerms(contractTerms)) {
      return `Expected returns based on ${contractTerms.investorProfitShare}% investor profit share. Min investment is 12% of ₦${contractTerms.capitalAmount.toLocaleString()} capital.`;
    }
    
    if (isMusharakahTerms(contractTerms)) {
      return `Returns based on ${contractTerms.party2ProfitShare}% investor profit share (${contractTerms.party2CapitalRatio}% capital contribution). Min investment is 12% of ₦${contractTerms.party2Capital.toLocaleString()} capital.`;
    }
    
    if (isIjarahTerms(contractTerms)) {
      const annualRental = contractTerms.monthlyRental * 12;
      const yield_ = ((annualRental / contractTerms.assetValue) * 100).toFixed(1);
      return `Returns calculated from ${yield_}% rental yield (₦${contractTerms.monthlyRental.toLocaleString()}/month × 12 ÷ ₦${contractTerms.assetValue.toLocaleString()} asset value). Min investment is 17% of asset value.`;
    }
    
    if (isSalamTerms(contractTerms)) {
      const profit = contractTerms.deliveryValue - contractTerms.advancePayment;
      const margin = ((profit / contractTerms.advancePayment) * 100).toFixed(1);
      return `Returns calculated from ${margin}% profit margin over ${contractTerms.duration} months (₦${profit.toLocaleString()} profit on ₦${contractTerms.advancePayment.toLocaleString()} advance). Min investment is 11% of advance payment.`;
    }
    
    return null;
  } catch (error) {
    console.error('Failed to generate explanation:', error);
    return null;
  }
}
