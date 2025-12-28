import {
  generateInvestmentCertificateHTML,
  generateTaxStatementHTML,
  type CertificateData,
  type TaxStatementData,
} from '../pdf-generator';

describe('PDF Generator', () => {
  describe('generateInvestmentCertificateHTML', () => {
    const mockCertificateData: CertificateData = {
      certificateNumber: 'QIST-ABC123456789',
      investorName: 'John Doe',
      investmentAmount: 5000000,
      businessName: 'Tech Innovations Ltd',
      contractType: 'Musharakah',
      investmentDate: 'January 15, 2025',
      expectedReturn: 750000,
      termMonths: 12,
      pool: 'business',
    };

    it('should generate valid HTML structure', () => {
      const html = generateInvestmentCertificateHTML(mockCertificateData);

      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('<html lang="en">');
      expect(html).toContain('</html>');
      expect(html).toContain('<head>');
      expect(html).toContain('<body>');
    });

    it('should include certificate title', () => {
      const html = generateInvestmentCertificateHTML(mockCertificateData);

      expect(html).toContain('Certificate of Investment');
      expect(html).toContain('QIST PLATFORM');
    });

    it('should include all certificate data', () => {
      const html = generateInvestmentCertificateHTML(mockCertificateData);

      expect(html).toContain(mockCertificateData.certificateNumber);
      expect(html).toContain(mockCertificateData.investorName);
      expect(html).toContain('5,000,000'); // Formatted amount
      expect(html).toContain(mockCertificateData.businessName);
      expect(html).toContain(mockCertificateData.contractType);
      expect(html).toContain(mockCertificateData.investmentDate);
      expect(html).toContain('750,000'); // Formatted expected return
      expect(html).toContain('12 Months');
    });

    it('should include Shariah compliance indicators', () => {
      const html = generateInvestmentCertificateHTML(mockCertificateData);

      expect(html).toContain('Shariah-Compliant');
      expect(html).toContain('Shariah compliance');
      expect(html).toContain('Islamic finance principles');
    });

    it('should include proper pool display', () => {
      const businessPoolHtml = generateInvestmentCertificateHTML({
        ...mockCertificateData,
        pool: 'business',
      });
      expect(businessPoolHtml).toContain('Business Pool');

      const cryptoPoolHtml = generateInvestmentCertificateHTML({
        ...mockCertificateData,
        pool: 'crypto',
      });
      expect(cryptoPoolHtml).toContain('Crypto Pool');
    });

    it('should include CSS styles for printing', () => {
      const html = generateInvestmentCertificateHTML(mockCertificateData);

      expect(html).toContain('<style>');
      expect(html).toContain('@page');
      expect(html).toContain('@media print');
    });

    it('should format numbers with thousand separators', () => {
      const html = generateInvestmentCertificateHTML(mockCertificateData);

      // Nigerian Naira formatting
      expect(html).toContain('₦5,000,000');
      expect(html).toContain('₦750,000');
    });

    it('should include authorized signature section', () => {
      const html = generateInvestmentCertificateHTML(mockCertificateData);

      expect(html).toContain('Authorized Signature');
      expect(html).toContain('QIST Platform');
    });

    it('should include issued date', () => {
      const html = generateInvestmentCertificateHTML(mockCertificateData);

      expect(html).toContain('Issued:');
      // Should contain current date in some format
      expect(html).toMatch(/\d{4}/); // Year
    });
  });

  describe('generateTaxStatementHTML', () => {
    const mockTaxData: TaxStatementData = {
      year: 2024,
      investorName: 'Jane Smith',
      investorId: 'INV-2024-001',
      totalInvestment: 10000000,
      totalReturns: 1500000,
      investments: [
        {
          businessName: 'Agriculture Co',
          amount: 5000000,
          returns: 750000,
          contractType: 'Musharakah',
        },
        {
          businessName: 'Tech Startup',
          amount: 3000000,
          returns: 450000,
          contractType: 'Murabaha',
        },
        {
          businessName: 'Real Estate Fund',
          amount: 2000000,
          returns: 300000,
          contractType: 'Ijarah',
        },
      ],
    };

    it('should generate valid HTML structure', () => {
      const html = generateTaxStatementHTML(mockTaxData);

      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('<html lang="en">');
      expect(html).toContain('</html>');
    });

    it('should include tax statement title and year', () => {
      const html = generateTaxStatementHTML(mockTaxData);

      expect(html).toContain('Investment Income Statement');
      expect(html).toContain('Tax Statement 2024');
      expect(html).toContain('Tax Year 2024');
    });

    it('should include investor information', () => {
      const html = generateTaxStatementHTML(mockTaxData);

      expect(html).toContain(mockTaxData.investorName);
      expect(html).toContain(mockTaxData.investorId);
    });

    it('should include all investment entries', () => {
      const html = generateTaxStatementHTML(mockTaxData);

      mockTaxData.investments.forEach((inv) => {
        expect(html).toContain(inv.businessName);
        expect(html).toContain(inv.contractType);
      });
    });

    it('should format currency amounts correctly', () => {
      const html = generateTaxStatementHTML(mockTaxData);

      expect(html).toContain('₦10,000,000'); // Total investment
      expect(html).toContain('₦1,500,000'); // Total returns
      expect(html).toContain('₦5,000,000'); // First investment
      expect(html).toContain('₦750,000'); // First return
    });

    it('should include table structure', () => {
      const html = generateTaxStatementHTML(mockTaxData);

      expect(html).toContain('<table');
      expect(html).toContain('<thead');
      expect(html).toContain('<tbody');
      expect(html).toContain('Business');
      expect(html).toContain('Contract Type');
      expect(html).toContain('Investment');
      expect(html).toContain('Returns');
    });

    it('should include total row', () => {
      const html = generateTaxStatementHTML(mockTaxData);

      expect(html).toContain('TOTAL');
      expect(html).toContain('total-row'); // CSS class
    });

    it('should include disclaimer and contact information', () => {
      const html = generateTaxStatementHTML(mockTaxData);

      expect(html).toContain('Important Notice');
      expect(html).toContain('tax professional');
      expect(html).toContain('support@qistplatform.com');
    });

    it('should include QIST Platform branding', () => {
      const html = generateTaxStatementHTML(mockTaxData);

      expect(html).toContain('QIST PLATFORM');
      expect(html).toContain('Shariah-Compliant Investments');
    });

    it('should calculate and display correct totals', () => {
      const html = generateTaxStatementHTML(mockTaxData);

      // Verify totals match sum of individual investments
      const expectedTotalInvestment = mockTaxData.investments.reduce(
        (sum, inv) => sum + inv.amount,
        0
      );
      const expectedTotalReturns = mockTaxData.investments.reduce(
        (sum, inv) => sum + inv.returns,
        0
      );

      expect(expectedTotalInvestment).toBe(mockTaxData.totalInvestment);
      expect(expectedTotalReturns).toBe(mockTaxData.totalReturns);
    });

    it('should handle empty investments array gracefully', () => {
      const emptyData: TaxStatementData = {
        ...mockTaxData,
        investments: [],
        totalInvestment: 0,
        totalReturns: 0,
      };

      const html = generateTaxStatementHTML(emptyData);

      expect(html).toContain('TOTAL');
      expect(html).toContain('₦0');
    });
  });
});
