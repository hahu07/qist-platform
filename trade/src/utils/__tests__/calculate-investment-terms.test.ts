/**
 * Tests for Investment Terms Calculation
 */

import {
  calculateInvestmentTermsFromContract,
  getCalculationExplanation,
  type InvestmentTerms
} from '../calculate-investment-terms';
import type {
  MurabahaTerms,
  MudarabahTerms,
  MusharakahTerms,
  IjarahTerms,
  SalamTerms
} from '@/schemas/islamic-contracts.schema';

describe('calculateInvestmentTermsFromContract', () => {
  describe('Murabaha calculations', () => {
    it('should calculate terms for a 12-month Murabaha contract', () => {
      const contractTerms: MurabahaTerms = {
        contractType: 'murabaha',
        amount: 5000000,
        duration: 12,
        costPrice: 5000000,
        sellingPrice: 5600000,
        profitAmount: 600000,
        profitRate: 12, // 12% annual
        paymentStructure: 'installment',
        installmentFrequency: 'monthly',
        assetDescription: 'Commercial equipment',
        assetCost: 5000000,
        defermentPeriod: 0,
        earlySettlementDiscount: 0,
        latePaymentPenalty: 'charity'
      };

      const result = calculateInvestmentTermsFromContract(contractTerms);

      expect(result).not.toBeNull();
      expect(result?.termMonths).toBe(12);
      expect(result?.returnMin).toBeGreaterThan(10);
      expect(result?.returnMax).toBeGreaterThan(result!.returnMin);
      expect(result?.minimumInvestment).toBeGreaterThan(0);
      expect(result?.campaignDays).toBe(21); // Shorter campaign for 12-month term
    });

    it('should calculate terms for a 24-month Murabaha contract', () => {
      const contractTerms: MurabahaTerms = {
        contractType: 'murabaha',
        amount: 10000000,
        duration: 24,
        costPrice: 10000000,
        sellingPrice: 12000000,
        profitAmount: 2000000,
        profitRate: 20, // 20% over 24 months
        paymentStructure: 'installment',
        installmentFrequency: 'monthly',
        assetDescription: 'Industrial machinery',
        assetCost: 10000000,
        defermentPeriod: 0,
        earlySettlementDiscount: 0,
        latePaymentPenalty: 'charity'
      };

      const result = calculateInvestmentTermsFromContract(contractTerms);

      expect(result).not.toBeNull();
      expect(result?.termMonths).toBe(24);
      expect(result?.campaignDays).toBe(30); // Longer campaign for 24-month term
    });
  });

  describe('Mudarabah calculations', () => {
    it('should calculate terms based on investor profit share', () => {
      const contractTerms: MudarabahTerms = {
        contractType: 'mudarabah',
        amount: 8000000,
        duration: 18,
        capitalAmount: 8000000,
        capitalProvider: 'investor-123',
        mudarib: 'entrepreneur-456',
        investorProfitShare: 30,
        mudaribProfitShare: 70,
        expectedAnnualReturn: 15,
        expectedReturnRate: 15,
        projectedProfit: 1200000,
        lossDistribution: 'capital-provider-only',
        businessActivity: 'Halal food production business',
        businessPlan: 'Comprehensive business plan for halal food manufacturing with market analysis showing strong demand...',
        useOfFunds: 'Capital will be used to purchase equipment, hire staff, and establish production facility...',
        managementFee: 0,
        mudaribAuthority: 'full',
        capitalGuarantee: false,
        reportingFrequency: 'quarterly',
        profitCalculationMethod: 'net',
        profitDistributionFrequency: 'quarterly'
      };

      const result = calculateInvestmentTermsFromContract(contractTerms);

      expect(result).not.toBeNull();
      expect(result?.termMonths).toBe(18);
      expect(result?.returnMin).toBeGreaterThan(12); // Expected return - buffer
      expect(result?.returnMax).toBeGreaterThan(result!.returnMin);
      expect(result?.minimumInvestment).toBeGreaterThan(0);
      expect(result?.campaignDays).toBe(30);
    });
  });

  describe('Musharakah calculations', () => {
    it('should calculate terms for joint venture partnership', () => {
      const contractTerms: MusharakahTerms = {
        contractType: 'musharakah',
        amount: 15000000,
        duration: 24,
        totalCapital: 15000000,
        party1Capital: 10000000,
        party2Capital: 5000000,
        party1Id: 'business-123',
        party2Id: 'investor-pool',
        party1CapitalRatio: 66.67,
        party2CapitalRatio: 33.33,
        party1ProfitShare: 60,
        party2ProfitShare: 40,
        party1LossShare: 66.67,
        party2LossShare: 33.33,
        expectedAnnualReturn: 18,
        projectedProfit: 3600000,
        partnershipType: 'general',
        businessPurpose: 'Establish and operate a halal restaurant chain with shared ownership and management',
        managementStructure: 'joint',
        managementFee: 0,
        profitCalculationMethod: 'net',
        profitDistributionFrequency: 'quarterly',
        decisionMaking: 'majority',
        reportingFrequency: 'quarterly'
      };

      const result = calculateInvestmentTermsFromContract(contractTerms);

      expect(result).not.toBeNull();
      expect(result?.termMonths).toBe(24);
      expect(result?.returnMin).toBeGreaterThan(14);
      expect(result?.returnMax).toBeGreaterThan(result!.returnMin);
      expect(result?.campaignDays).toBe(45); // Longer campaign for 24+ month joint venture
    });
  });

  describe('Ijarah calculations', () => {
    it('should calculate terms based on rental yield', () => {
      const contractTerms: IjarahTerms = {
        contractType: 'ijarah',
        amount: 20000000,
        duration: 18,
        assetDescription: 'Commercial property lease',
        assetValue: 20000000,
        assetCategory: 'Real Estate',
        assetCondition: 'new',
        monthlyRental: 300000, // ₦300k/month
        totalRentalPayments: 5400000, // 18 months
        leaseType: 'operating',
        rentalFrequency: 'monthly',
        purchaseOptionIncluded: false,
        maintenanceResponsibility: 'lessor',
        insuranceRequired: true,
        maintenanceCost: 0,
        insuranceCost: 0,
        latePaymentPenalty: 'charity',
        securityDeposit: 0,
        earlyTerminationAllowed: false,
        earlyTerminationPenalty: 0,
        renewalOption: false,
        subleaseAllowed: false,
        depreciationMethod: 'straight-line'
      };

      const result = calculateInvestmentTermsFromContract(contractTerms);

      expect(result).not.toBeNull();
      expect(result?.termMonths).toBe(18);
      
      // Rental yield: (300k * 12) / 20M = 18%
      expect(result?.returnMin).toBeCloseTo(17, 0); // ~17% (18% - 1%)
      expect(result?.returnMax).toBeCloseTo(19, 0); // ~19% (18% + 1%)
      expect(result?.campaignDays).toBe(30);
    });
  });

  describe('Salam calculations', () => {
    it('should calculate terms for forward commodity purchase', () => {
      const contractTerms: SalamTerms = {
        contractType: 'salam',
        amount: 6000000,
        duration: 12,
        commodityType: 'Agricultural Produce',
        commodityDescription: 'Premium quality rice, 25kg bags meeting international quality standards',
        quantity: 10000,
        unit: 'bags',
        qualitySpecifications: ['Moisture content < 14%', 'Broken grains < 5%', 'Foreign matter < 0.1%'],
        qualityGrade: 'premium',
        advancePayment: 6000000,
        spotPrice: 650,
        agreedPrice: 700,
        deliveryValue: 7000000,
        deliveryDate: '2025-12-01',
        deliveryPeriod: 365,
        deliveryLocation: 'Lagos Central Warehouse',
        paymentDate: '2024-12-01',
        purpose: 'Forward purchase of agricultural commodities to support farmer production and ensure stable supply',
        inspectionRequired: true,
        defaultPenalty: 'replacement',
        lateDeliveryPenalty: 0,
        lateFee: 0,
        thirdPartyGuarantee: false
      };

      const result = calculateInvestmentTermsFromContract(contractTerms);

      expect(result).not.toBeNull();
      expect(result?.termMonths).toBe(12);
      
      // Profit: (7M - 6M) / 6M = 16.67% annual
      expect(result?.returnMin).toBeGreaterThan(14);
      expect(result?.returnMax).toBeGreaterThan(result!.returnMin);
      expect(result?.campaignDays).toBe(60); // Longer campaign for 12-month Salam
    });
  });

  describe('Edge cases', () => {
    it('should return null for null contract terms', () => {
      const result = calculateInvestmentTermsFromContract(null);
      expect(result).toBeNull();
    });

    it('should return null for undefined contract terms', () => {
      const result = calculateInvestmentTermsFromContract(undefined);
      expect(result).toBeNull();
    });

    it('should handle invalid contract data gracefully', () => {
      const invalidTerms = {
        contractType: 'unknown',
        amount: 1000000,
        duration: 12
      } as any;

      const result = calculateInvestmentTermsFromContract(invalidTerms);
      expect(result).toBeNull();
    });
  });
});

describe('getCalculationExplanation', () => {
  it('should generate explanation for Murabaha', () => {
    const contractTerms: MurabahaTerms = {
      contractType: 'murabaha',
      amount: 5000000,
      duration: 12,
      costPrice: 5000000,
      sellingPrice: 5600000,
      profitAmount: 600000,
      profitRate: 12,
      paymentStructure: 'installment',
      installmentFrequency: 'monthly',
      assetDescription: 'Equipment',
      assetCost: 5000000,
      defermentPeriod: 0,
      earlySettlementDiscount: 0,
      latePaymentPenalty: 'charity'
    };

    const explanation = getCalculationExplanation(contractTerms);

    expect(explanation).not.toBeNull();
    expect(explanation).toContain('12.0%');
    expect(explanation).toContain('12 months');
    expect(explanation).toContain('5,000,000');
  });

  it('should generate explanation for Mudarabah', () => {
    const contractTerms: MudarabahTerms = {
      contractType: 'mudarabah',
      amount: 8000000,
      duration: 18,
      capitalAmount: 8000000,
      capitalProvider: 'investor-123',
      mudarib: 'entrepreneur-456',
      investorProfitShare: 30,
      mudaribProfitShare: 70,
      expectedAnnualReturn: 15,
      expectedReturnRate: 15,
      projectedProfit: 1200000,
      lossDistribution: 'capital-provider-only',
      businessActivity: 'Business',
      businessPlan: 'Plan...',
      useOfFunds: 'Funds...',
      managementFee: 0,
      mudaribAuthority: 'full',
      capitalGuarantee: false,
      reportingFrequency: 'quarterly',
      profitCalculationMethod: 'net',
      profitDistributionFrequency: 'quarterly'
    };

    const explanation = getCalculationExplanation(contractTerms);

    expect(explanation).not.toBeNull();
    expect(explanation).toContain('30%');
    expect(explanation).toContain('8,000,000');
  });

  it('should return null for null contract terms', () => {
    const explanation = getCalculationExplanation(null);
    expect(explanation).toBeNull();
  });
});
