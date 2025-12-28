/**
 * Contract Strategy Pattern
 * 
 * Defines abstract interfaces and concrete implementations for handling
 * different Islamic financing contract types using the Strategy pattern.
 * This allows uniform handling of contracts while maintaining type-specific logic.
 */

import type {
  MurabahaTerms,
  MudarabahTerms,
  MusharakahTerms,
  IjarahTerms,
  SalamTerms,
} from '@/schemas/islamic-contracts.schema';
import type {
  PaymentScheduleEntry,
  IjarahPaymentEntry,
  ProfitDistributionEntry,
  ContractMetrics,
} from '@/utils/contract-calculations';
import {
  calculateMurabahaPaymentSchedule,
  calculateMurabahaMetrics,
  calculateMurabahaEarlySettlement,
  calculateMudarabahDistribution,
  calculateMudarabahLoss,
  calculateMusharakahDistribution,
  calculateMusharakahLoss,
  calculateIjarahPaymentSchedule,
  calculateIjarahMetrics,
  calculateSalamMetrics,
} from '@/utils/contract-calculations';

/**
 * Base interface for all contract strategies
 */
export interface IContractStrategy<T> {
  /** Validate contract terms */
  validate(terms: T): { valid: boolean; errors: string[] };
  
  /** Calculate financial metrics for the contract */
  calculateMetrics(terms: T): ContractMetrics;
  
  /** Get contract type identifier */
  getType(): string;
  
  /** Get human-readable contract name */
  getDisplayName(): string;
  
  /** Get contract description */
  getDescription(): string;
}

/**
 * Extended interface for payment-based contracts (Murabaha, Ijarah)
 */
export interface IPaymentBasedContract<T> extends IContractStrategy<T> {
  /** Generate payment schedule */
  calculatePaymentSchedule(terms: T): PaymentScheduleEntry[] | IjarahPaymentEntry[];
  
  /** Calculate early settlement amount (if applicable) */
  calculateEarlySettlement?(terms: T, paidInstallments: number): {
    remainingPrincipal: number;
    remainingProfit: number;
    discount: number;
    settlementAmount: number;
  };
}

/**
 * Extended interface for profit-sharing contracts (Mudarabah, Musharakah)
 */
export interface IProfitSharingContract<T> extends IContractStrategy<T> {
  /** Calculate profit distribution among partners */
  calculateProfitDistribution(terms: T, profit: number): {
    totalProfit: number;
    distribution: ProfitDistributionEntry[];
  };
  
  /** Calculate loss allocation among partners */
  calculateLossAllocation(terms: T, loss: number): {
    totalLoss: number;
    distribution: Array<{ party: string; amount: number; percentage: number }>;
  };
}

/**
 * Murabaha Contract Strategy
 * Cost-plus financing with fixed installments
 */
export class MurabahaStrategy implements IPaymentBasedContract<MurabahaTerms> {
  validate(terms: MurabahaTerms): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (terms.sellingPrice !== terms.costPrice + terms.profitAmount) {
      errors.push('Selling price must equal cost price plus profit amount');
    }
    
    if (terms.profitRate !== (terms.profitAmount / terms.costPrice) * 100) {
      errors.push('Profit rate must match calculated percentage');
    }
    
    if (terms.numberOfInstallments && terms.numberOfInstallments < 1) {
      errors.push('Number of installments must be at least 1');
    }
    
    if (terms.duration < 1) {
      errors.push('Duration must be at least 1 month');
    }
    
    return { valid: errors.length === 0, errors };
  }
  
  calculateMetrics(terms: MurabahaTerms): ContractMetrics {
    return calculateMurabahaMetrics(terms);
  }
  
  calculatePaymentSchedule(terms: MurabahaTerms): PaymentScheduleEntry[] {
    return calculateMurabahaPaymentSchedule(terms);
  }
  
  calculateEarlySettlement(terms: MurabahaTerms, paidInstallments: number) {
    return calculateMurabahaEarlySettlement(terms, paidInstallments);
  }
  
  getType(): string {
    return 'murabaha';
  }
  
  getDisplayName(): string {
    return 'Murabaha (Cost-Plus Financing)';
  }
  
  getDescription(): string {
    return 'Islamic financing where the financier purchases an asset and sells it to the client at cost plus disclosed markup, payable in installments.';
  }
}

/**
 * Mudarabah Contract Strategy
 * Profit-sharing partnership (capital provider + entrepreneur)
 */
export class MudarabahStrategy implements IProfitSharingContract<MudarabahTerms> {
  validate(terms: MudarabahTerms): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (terms.investorProfitShare + terms.mudaribProfitShare !== 100) {
      errors.push('Profit shares must sum to 100%');
    }
    
    if (terms.capitalAmount <= 0) {
      errors.push('Capital amount must be positive');
    }
    
    if (terms.duration < 1) {
      errors.push('Duration must be at least 1 month');
    }
    
    return { valid: errors.length === 0, errors };
  }
  
  calculateMetrics(terms: MudarabahTerms): ContractMetrics {
    // For Mudarabah, metrics depend on actual performance
    const expectedReturn = terms.capitalAmount * (terms.expectedReturnRate / 100);
    return {
      contractType: 'mudarabah',
      totalAmount: terms.capitalAmount,
      totalReturn: expectedReturn,
      effectiveRate: terms.expectedReturnRate,
      duration: terms.duration,
    };
  }
  
  calculateProfitDistribution(terms: MudarabahTerms, profit: number) {
    return calculateMudarabahDistribution(terms, profit);
  }
  
  calculateLossAllocation(terms: MudarabahTerms, loss: number) {
    const lossCalc = calculateMudarabahLoss(terms, loss);
    return {
      totalLoss: loss,
      distribution: [
        { party: 'investor', amount: lossCalc.investorLoss, percentage: 100 },
        { party: 'mudarib', amount: 0, percentage: 0 },
      ],
    };
  }
  
  getType(): string {
    return 'mudarabah';
  }
  
  getDisplayName(): string {
    return 'Mudarabah (Profit-Sharing Partnership)';
  }
  
  getDescription(): string {
    return 'Partnership where capital provider (Rab-ul-Mal) provides funds and entrepreneur (Mudarib) provides expertise. Profits shared per agreement, losses borne by capital provider.';
  }
}

/**
 * Musharakah Contract Strategy
 * Joint venture partnership (multiple capital contributors)
 */
export class MusharakahStrategy implements IProfitSharingContract<MusharakahTerms> {
  validate(terms: MusharakahTerms): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (terms.party1ProfitShare + terms.party2ProfitShare !== 100) {
      errors.push('Profit shares must sum to 100%');
    }
    
    if (terms.party1LossShare + terms.party2LossShare !== 100) {
      errors.push('Loss shares must sum to 100%');
    }
    
    const totalCapital = terms.party1Capital + terms.party2Capital;
    const party1CapitalRatio = (terms.party1Capital / totalCapital) * 100;
    const party2CapitalRatio = (terms.party2Capital / totalCapital) * 100;
    
    // In Musharakah, loss sharing MUST match capital ratio (Shariah requirement)
    if (Math.abs(terms.party1LossShare - party1CapitalRatio) > 0.01) {
      errors.push(`Party 1 loss share (${terms.party1LossShare}%) must match capital ratio (${party1CapitalRatio.toFixed(2)}%)`);
    }
    if (Math.abs(terms.party2LossShare - party2CapitalRatio) > 0.01) {
      errors.push(`Party 2 loss share (${terms.party2LossShare}%) must match capital ratio (${party2CapitalRatio.toFixed(2)}%)`);
    }
    
    if (terms.party1Capital <= 0 || terms.party2Capital <= 0) {
      errors.push('Both parties must contribute positive capital');
    }
    
    if (terms.duration < 1) {
      errors.push('Duration must be at least 1 month');
    }
    
    return { valid: errors.length === 0, errors };
  }
  
  calculateMetrics(terms: MusharakahTerms): ContractMetrics {
    const totalCapital = terms.party1Capital + terms.party2Capital;
    const expectedReturn = totalCapital * (terms.expectedAnnualReturn / 100);
    return {
      contractType: 'musharakah',
      totalAmount: totalCapital,
      totalReturn: expectedReturn,
      effectiveRate: terms.expectedAnnualReturn,
      duration: terms.duration,
    };
  }
  
  calculateProfitDistribution(terms: MusharakahTerms, profit: number) {
    return calculateMusharakahDistribution(terms, profit);
  }
  
  calculateLossAllocation(terms: MusharakahTerms, loss: number) {
    const lossCalc = calculateMusharakahLoss(terms, loss);
    return {
      totalLoss: loss,
      distribution: [
        { party: 'party1', amount: lossCalc.party1Loss, percentage: terms.party1LossShare },
        { party: 'party2', amount: lossCalc.party2Loss, percentage: terms.party2LossShare },
      ],
    };
  }
  
  getType(): string {
    return 'musharakah';
  }
  
  getDisplayName(): string {
    return 'Musharakah (Joint Venture Partnership)';
  }
  
  getDescription(): string {
    return 'Joint venture where all partners contribute capital and share profits per agreement. Losses must be shared according to capital contribution ratios per Shariah law.';
  }
}

/**
 * Ijarah Contract Strategy
 * Islamic leasing with optional purchase
 */
export class IjarahStrategy implements IPaymentBasedContract<IjarahTerms> {
  validate(terms: IjarahTerms): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (terms.assetValue <= 0) {
      errors.push('Asset value must be positive');
    }
    
    if (terms.monthlyRental <= 0) {
      errors.push('Monthly rental must be positive');
    }
    
    const leaseTerm = terms.leaseTerm || terms.duration;
    if (leaseTerm < 1) {
      errors.push('Lease term must be at least 1 month');
    }
    
    if ((terms.purchaseOption || terms.purchaseOptionIncluded) && 
        (terms.purchasePrice || terms.residualValue || 0) <= 0) {
      errors.push('Purchase price must be positive if purchase option is enabled');
    }
    
    if (terms.securityDeposit < 0) {
      errors.push('Security deposit cannot be negative');
    }
    
    return { valid: errors.length === 0, errors };
  }
  
  calculateMetrics(terms: IjarahTerms): ContractMetrics {
    return calculateIjarahMetrics(terms);
  }
  
  calculatePaymentSchedule(terms: IjarahTerms): IjarahPaymentEntry[] {
    return calculateIjarahPaymentSchedule(terms);
  }
  
  getType(): string {
    return 'ijarah';
  }
  
  getDisplayName(): string {
    return 'Ijarah (Islamic Lease)';
  }
  
  getDescription(): string {
    return 'Islamic leasing where lessor retains ownership while lessee pays rental. May include purchase option (Ijarah Muntahia Bittamleek) at end of term.';
  }
}

/**
 * Salam Contract Strategy
 * Forward purchase with advance payment
 */
export class SalamStrategy implements IContractStrategy<SalamTerms> {
  validate(terms: SalamTerms): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (terms.advancePayment <= 0) {
      errors.push('Advance payment must be positive');
    }
    
    if (terms.deliveryValue <= terms.advancePayment) {
      errors.push('Delivery value must be greater than advance payment');
    }
    
    if (terms.quantity <= 0) {
      errors.push('Quantity must be positive');
    }
    
    if (terms.deliveryPeriod < 1) {
      errors.push('Delivery period must be at least 1 day');
    }
    
    const paymentDate = new Date(terms.paymentDate);
    const deliveryDate = new Date(terms.deliveryDate);
    
    if (deliveryDate <= paymentDate) {
      errors.push('Delivery date must be after payment date');
    }
    
    if (terms.qualitySpecifications.length === 0) {
      errors.push('Quality specifications must be defined');
    }
    
    return { valid: errors.length === 0, errors };
  }
  
  calculateMetrics(terms: SalamTerms): ContractMetrics {
    return calculateSalamMetrics(terms);
  }
  
  getType(): string {
    return 'salam';
  }
  
  getDisplayName(): string {
    return 'Salam (Forward Purchase)';
  }
  
  getDescription(): string {
    return 'Forward purchase contract where buyer pays full price upfront for commodity to be delivered later. Provides working capital to producers while buyer benefits from discount.';
  }
}

/**
 * Contract Strategy Factory
 * Creates appropriate strategy instance based on contract type
 */
export class ContractStrategyFactory {
  private static strategies = new Map<string, IContractStrategy<any>>([
    ['murabaha', new MurabahaStrategy()],
    ['mudarabah', new MudarabahStrategy()],
    ['musharakah', new MusharakahStrategy()],
    ['ijarah', new IjarahStrategy()],
    ['salam', new SalamStrategy()],
  ]);
  
  /**
   * Get strategy instance for contract type
   */
  static getStrategy<T>(contractType: string): IContractStrategy<T> | null {
    return this.strategies.get(contractType.toLowerCase()) || null;
  }
  
  /**
   * Get all available contract types
   */
  static getAvailableTypes(): string[] {
    return Array.from(this.strategies.keys());
  }
  
  /**
   * Get display names for all contract types
   */
  static getContractDisplayNames(): Record<string, string> {
    const names: Record<string, string> = {};
    this.strategies.forEach((strategy, type) => {
      names[type] = strategy.getDisplayName();
    });
    return names;
  }
  
  /**
   * Validate contract terms using appropriate strategy
   */
  static validateContract<T>(contractType: string, terms: T): { valid: boolean; errors: string[] } {
    const strategy = this.getStrategy<T>(contractType);
    if (!strategy) {
      return { valid: false, errors: [`Unknown contract type: ${contractType}`] };
    }
    return strategy.validate(terms);
  }
}

/**
 * Type guards for strategy interfaces
 */
export function isPaymentBasedContract<T>(
  strategy: IContractStrategy<T>
): strategy is IPaymentBasedContract<T> {
  return 'calculatePaymentSchedule' in strategy;
}

export function isProfitSharingContract<T>(
  strategy: IContractStrategy<T>
): strategy is IProfitSharingContract<T> {
  return 'calculateProfitDistribution' in strategy && 'calculateLossAllocation' in strategy;
}
