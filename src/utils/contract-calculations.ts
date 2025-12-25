/**
 * Islamic Contract Calculations
 * 
 * This module provides contract-specific calculation utilities for each type
 * of Islamic financing contract. Each contract type has unique calculation
 * methods for returns, payments, and profit/loss distribution.
 */

import type {
  MurabahaTerms,
  MudarabahTerms,
  MusharakahTerms,
  IjarahTerms,
  SalamTerms,
  ContractTerms,
  IslamicContractType,
} from "@/schemas/islamic-contracts.schema";

/**
 * Payment Schedule Entry
 */
export interface PaymentScheduleEntry {
  paymentNumber: number;
  dueDate: string;
  principalAmount: number;
  profitAmount: number;
  totalPayment: number;
  remainingBalance: number;
}

/**
 * Ijarah Payment Schedule Entry
 */
export interface IjarahPaymentEntry {
  period: number;
  dueDate: string;
  rentalAmount: number;
  cumulativeAmount: number;
}

/**
 * Profit Distribution Entry
 */
export interface ProfitDistributionEntry {
  party: string;
  percentage: number;
  amount: number;
}

/**
 * Contract Metrics (common interface)
 */
export interface ContractMetrics {
  contractType: IslamicContractType;
  totalAmount: number;
  totalReturn: number;
  effectiveRate: number;
  duration: number;
}

// ========================================
// MURABAHA CALCULATIONS
// ========================================

/**
 * Calculate Murabaha Payment Schedule
 */
export function calculateMurabahaPaymentSchedule(
  terms: MurabahaTerms,
  startDate: Date = new Date()
): PaymentScheduleEntry[] {
  const {
    sellingPrice,
    costPrice,
    profitAmount,
    numberOfInstallments = 1,
    paymentStructure,
    installmentFrequency,
    defermentPeriod = 0,
  } = terms;

  if (paymentStructure === "lump-sum") {
    // Single payment at end
    const dueDate = addMonths(startDate, terms.duration);
    return [{
      paymentNumber: 1,
      dueDate: formatDate(dueDate),
      principalAmount: costPrice,
      profitAmount: profitAmount,
      totalPayment: sellingPrice,
      remainingBalance: 0,
    }];
  }

  // Installment payments
  const schedule: PaymentScheduleEntry[] = [];
  const installmentAmount = sellingPrice / numberOfInstallments;
  const principalPerInstallment = costPrice / numberOfInstallments;
  const profitPerInstallment = profitAmount / numberOfInstallments;

  let remainingBalance = sellingPrice;
  let currentDate = addMonths(startDate, defermentPeriod);

  const monthsPerInstallment = getMonthsPerFrequency(installmentFrequency);

  for (let i = 1; i <= numberOfInstallments; i++) {
    currentDate = addMonths(currentDate, i === 1 ? 0 : monthsPerInstallment);
    remainingBalance -= installmentAmount;

    schedule.push({
      paymentNumber: i,
      dueDate: formatDate(currentDate),
      principalAmount: principalPerInstallment,
      profitAmount: profitPerInstallment,
      totalPayment: installmentAmount,
      remainingBalance: Math.max(0, remainingBalance),
    });
  }

  return schedule;
}

/**
 * Calculate Murabaha Early Settlement Amount
 */
export function calculateMurabahaEarlySettlement(
  terms: MurabahaTerms,
  paidInstallments: number
): {
  remainingPrincipal: number;
  remainingProfit: number;
  discount: number;
  settlementAmount: number;
} {
  const {
    sellingPrice,
    costPrice,
    profitAmount,
    numberOfInstallments = 1,
    earlySettlementDiscount,
  } = terms;

  const installmentAmount = sellingPrice / numberOfInstallments;
  const paidAmount = paidInstallments * installmentAmount;
  const remainingAmount = sellingPrice - paidAmount;

  const principalPerInstallment = costPrice / numberOfInstallments;
  const profitPerInstallment = profitAmount / numberOfInstallments;

  const remainingInstallments = numberOfInstallments - paidInstallments;
  const remainingPrincipal = remainingInstallments * principalPerInstallment;
  const remainingProfit = remainingInstallments * profitPerInstallment;

  // Apply discount to profit portion only (Islamic finance principle)
  const discount = (remainingProfit * earlySettlementDiscount) / 100;
  const settlementAmount = remainingPrincipal + remainingProfit - discount;

  return {
    remainingPrincipal,
    remainingProfit,
    discount,
    settlementAmount,
  };
}

/**
 * Calculate Murabaha Metrics
 */
export function calculateMurabahaMetrics(terms: MurabahaTerms): ContractMetrics & {
  markup: number;
  markupRate: number;
  apr: number;
} {
  const { costPrice, sellingPrice, profitAmount, duration } = terms;
  const markup = sellingPrice - costPrice;
  const markupRate = (markup / costPrice) * 100;
  
  // Calculate APR (annualized)
  const monthlyRate = markup / costPrice / duration;
  const apr = monthlyRate * 12 * 100;

  return {
    contractType: "murabaha",
    totalAmount: sellingPrice,
    totalReturn: profitAmount,
    effectiveRate: apr,
    duration: duration,
    markup,
    markupRate,
    apr,
  };
}

// ========================================
// MUDARABAH CALCULATIONS
// ========================================

/**
 * Calculate Mudarabah Profit Distribution
 */
export function calculateMudarabahDistribution(
  terms: MudarabahTerms,
  actualProfit: number
): {
  totalProfit: number;
  investorShare: number;
  mudaribShare: number;
  distribution: ProfitDistributionEntry[];
} {
  const { investorProfitShare, mudaribProfitShare, capitalAmount } = terms;

  const investorAmount = (actualProfit * investorProfitShare) / 100;
  const mudaribAmount = (actualProfit * mudaribProfitShare) / 100;

  return {
    totalProfit: actualProfit,
    investorShare: investorAmount,
    mudaribShare: mudaribAmount,
    distribution: [
      {
        party: "investor",
        percentage: investorProfitShare,
        amount: investorAmount,
      },
      {
        party: "mudarib",
        percentage: mudaribProfitShare,
        amount: mudaribAmount,
      },
    ],
  };
}

/**
 * Calculate Mudarabah Loss Allocation
 * In Mudarabah, only capital provider bears financial loss
 */
export function calculateMudarabahLoss(
  terms: MudarabahTerms,
  actualLoss: number
): {
  investorLoss: number;
  mudaribLoss: number;
  capitalRemaining: number;
} {
  const { capitalAmount } = terms;

  return {
    investorLoss: actualLoss,
    mudaribLoss: 0, // Mudarib loses effort/time only
    capitalRemaining: Math.max(0, capitalAmount - actualLoss),
  };
}

/**
 * Calculate Mudarabah Metrics
 */
export function calculateMudarabahMetrics(
  terms: MudarabahTerms,
  actualProfit?: number
): ContractMetrics & {
  projectedROI: number;
  actualROI?: number;
  investorExpectedReturn: number;
  mudaribExpectedReturn: number;
} {
  const {
    capitalAmount,
    expectedAnnualReturn,
    projectedProfit,
    investorProfitShare,
    mudaribProfitShare,
    duration,
  } = terms;

  const projectedROI = expectedAnnualReturn;
  const actualROI = actualProfit ? (actualProfit / capitalAmount) * 100 * (12 / duration) : undefined;

  const investorExpectedReturn = (projectedProfit * investorProfitShare) / 100;
  const mudaribExpectedReturn = (projectedProfit * mudaribProfitShare) / 100;

  return {
    contractType: "mudarabah",
    totalAmount: capitalAmount,
    totalReturn: projectedProfit,
    effectiveRate: projectedROI,
    duration,
    projectedROI,
    actualROI,
    investorExpectedReturn,
    mudaribExpectedReturn,
  };
}

// ========================================
// MUSHARAKAH CALCULATIONS
// ========================================

/**
 * Calculate Musharakah Profit Distribution
 */
export function calculateMusharakahDistribution(
  terms: MusharakahTerms,
  actualProfit: number
): {
  totalProfit: number;
  party1Share: number;
  party2Share: number;
  distribution: ProfitDistributionEntry[];
} {
  const { party1ProfitShare, party2ProfitShare } = terms;

  const party1Amount = (actualProfit * party1ProfitShare) / 100;
  const party2Amount = (actualProfit * party2ProfitShare) / 100;

  return {
    totalProfit: actualProfit,
    party1Share: party1Amount,
    party2Share: party2Amount,
    distribution: [
      {
        party: "party1",
        percentage: party1ProfitShare,
        amount: party1Amount,
      },
      {
        party: "party2",
        percentage: party2ProfitShare,
        amount: party2Amount,
      },
    ],
  };
}

/**
 * Calculate Musharakah Loss Allocation
 * Loss must be shared according to capital contribution ratio
 */
export function calculateMusharakahLoss(
  terms: MusharakahTerms,
  actualLoss: number
): {
  party1Loss: number;
  party2Loss: number;
  party1CapitalRemaining: number;
  party2CapitalRemaining: number;
} {
  const { party1Capital, party2Capital, party1LossShare, party2LossShare } = terms;

  const party1Loss = (actualLoss * party1LossShare) / 100;
  const party2Loss = (actualLoss * party2LossShare) / 100;

  return {
    party1Loss,
    party2Loss,
    party1CapitalRemaining: Math.max(0, party1Capital - party1Loss),
    party2CapitalRemaining: Math.max(0, party2Capital - party2Loss),
  };
}

/**
 * Calculate Musharakah Metrics
 */
export function calculateMusharakahMetrics(
  terms: MusharakahTerms,
  actualProfit?: number
): ContractMetrics & {
  projectedROI: number;
  actualROI?: number;
  party1ExpectedReturn: number;
  party2ExpectedReturn: number;
  party1Equity: number;
  party2Equity: number;
} {
  const {
    totalCapital,
    party1Capital,
    party2Capital,
    expectedAnnualReturn,
    projectedProfit,
    party1ProfitShare,
    party2ProfitShare,
    duration,
  } = terms;

  const projectedROI = expectedAnnualReturn;
  const actualROI = actualProfit ? (actualProfit / totalCapital) * 100 * (12 / duration) : undefined;

  const party1ExpectedReturn = (projectedProfit * party1ProfitShare) / 100;
  const party2ExpectedReturn = (projectedProfit * party2ProfitShare) / 100;

  const party1Equity = (party1Capital / totalCapital) * 100;
  const party2Equity = (party2Capital / totalCapital) * 100;

  return {
    contractType: "musharakah",
    totalAmount: totalCapital,
    totalReturn: projectedProfit,
    effectiveRate: projectedROI,
    duration,
    projectedROI,
    actualROI,
    party1ExpectedReturn,
    party2ExpectedReturn,
    party1Equity,
    party2Equity,
  };
}

// ========================================
// IJARAH CALCULATIONS
// ========================================

/**
 * Calculate Ijarah Payment Schedule
 */
export function calculateIjarahPaymentSchedule(
  terms: IjarahTerms,
  startDate: Date = new Date()
): IjarahPaymentEntry[] {
  const { monthlyRental, duration } = terms;
  const schedule: IjarahPaymentEntry[] = [];

  let currentDate = new Date(startDate);
  let cumulative = 0;

  for (let i = 1; i <= duration; i++) {
    currentDate = addMonths(currentDate, 1);
    cumulative += monthlyRental;

    schedule.push({
      period: i,
      dueDate: formatDate(currentDate),
      rentalAmount: monthlyRental,
      cumulativeAmount: cumulative,
    });
  }

  return schedule;
}

/**
 * Calculate Ijarah Metrics
 */
export function calculateIjarahMetrics(terms: IjarahTerms): ContractMetrics & {
  totalRentalIncome: number;
  assetDepreciation: number;
  netReturn: number;
  residualValue: number;
  rentalYield: number;
  monthlyReturnRate: number;
  paybackPeriod: number;
} {
  const {
    assetValue,
    monthlyRental,
    duration,
    totalRentalPayments,
    residualValue = 0,
    maintenanceCost = 0,
  } = terms;

  const totalRentalIncome = totalRentalPayments;
  const totalMaintenance = maintenanceCost * duration;
  const assetDepreciation = assetValue - residualValue;
  const netReturn = totalRentalIncome - totalMaintenance;

  // Rental yield (annual)
  const annualRental = monthlyRental * 12;
  const rentalYield = (annualRental / assetValue) * 100;

  // Monthly return rate
  const monthlyReturnRate = (monthlyRental / assetValue) * 100;

  // Payback period (in months)
  const paybackPeriod = assetValue / monthlyRental;

  return {
    contractType: "ijarah",
    totalAmount: assetValue,
    totalReturn: netReturn,
    effectiveRate: rentalYield,
    duration,
    totalRentalIncome,
    assetDepreciation,
    netReturn,
    residualValue,
    rentalYield,
    monthlyReturnRate,
    paybackPeriod,
  };
}

// ========================================
// SALAM CALCULATIONS
// ========================================

/**
 * Calculate Salam Metrics
 */
export function calculateSalamMetrics(terms: SalamTerms): ContractMetrics & {
  discount: number;
  discountRate: number;
  deliveryValue: number;
  buyerBenefit: number;
} {
  const { advancePayment, spotPrice, quantity, duration } = terms;

  const deliveryValue = spotPrice * quantity;
  const discount = deliveryValue - advancePayment;
  const discountRate = (discount / deliveryValue) * 100;
  const buyerBenefit = discount; // Same as discount - buyer's financial gain

  // Annualized return
  const monthlyReturn = (discount / advancePayment) / duration;
  const annualizedReturn = monthlyReturn * 12 * 100;

  return {
    contractType: "salam",
    totalAmount: advancePayment,
    totalReturn: discount,
    effectiveRate: annualizedReturn,
    duration,
    discount,
    discountRate,
    deliveryValue,
    buyerBenefit,
  };
}

// ========================================
// UTILITY FUNCTIONS
// ========================================

function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

function formatDate(date: Date): string {
  return date.toISOString().split("T")[0]; // YYYY-MM-DD
}

function getMonthsPerFrequency(frequency: string): number {
  switch (frequency) {
    case "monthly":
      return 1;
    case "quarterly":
      return 3;
    case "semi-annual":
      return 6;
    case "annual":
      return 12;
    default:
      return 1;
  }
}

/**
 * Contract Calculator Factory
 * Returns appropriate calculator based on contract type
 */
export function getContractCalculator(contractType: IslamicContractType) {
  switch (contractType) {
    case "murabaha":
      return {
        calculatePaymentSchedule: calculateMurabahaPaymentSchedule,
        calculateMetrics: calculateMurabahaMetrics,
        calculateEarlySettlement: calculateMurabahaEarlySettlement,
      };
    case "mudarabah":
      return {
        calculateDistribution: calculateMudarabahDistribution,
        calculateLoss: calculateMudarabahLoss,
        calculateMetrics: calculateMudarabahMetrics,
      };
    case "musharakah":
      return {
        calculateDistribution: calculateMusharakahDistribution,
        calculateLoss: calculateMusharakahLoss,
        calculateMetrics: calculateMusharakahMetrics,
      };
    case "ijarah":
      return {
        calculatePaymentSchedule: calculateIjarahPaymentSchedule,
        calculateMetrics: calculateIjarahMetrics,
      };
    case "salam":
      return {
        calculateMetrics: calculateSalamMetrics,
      };
    default:
      throw new Error(`Unsupported contract type: ${contractType}`);
  }
}
