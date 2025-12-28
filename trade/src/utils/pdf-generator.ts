/**
 * Generate investment certificate PDF
 * Note: For production, consider using a library like jsPDF or PDFKit
 * This is a simplified HTML-based approach that can be printed to PDF
 */

export interface CertificateData {
  certificateNumber: string;
  investorName: string;
  investmentAmount: number;
  businessName: string;
  contractType: string;
  investmentDate: string;
  expectedReturn: number;
  termMonths: number;
  pool: string;
}

export function generateInvestmentCertificateHTML(data: CertificateData): string {
  const currentDate = new Date().toLocaleDateString("en-NG", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Investment Certificate - ${data.certificateNumber}</title>
  <style>
    @page {
      size: A4;
      margin: 0;
    }
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: 'Georgia', 'Times New Roman', serif;
      background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
      padding: 40px;
    }
    .certificate {
      background: white;
      max-width: 800px;
      margin: 0 auto;
      padding: 60px;
      border: 20px solid #2563eb;
      border-image: linear-gradient(135deg, #2563eb, #7c3aed) 1;
      box-shadow: 0 20px 40px rgba(0,0,0,0.1);
    }
    .header {
      text-align: center;
      margin-bottom: 40px;
      border-bottom: 3px solid #2563eb;
      padding-bottom: 30px;
    }
    .logo {
      font-size: 48px;
      font-weight: bold;
      color: #2563eb;
      margin-bottom: 10px;
      font-family: 'Arial', sans-serif;
    }
    .subtitle {
      font-size: 14px;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 2px;
    }
    .title {
      font-size: 36px;
      font-weight: bold;
      color: #1e293b;
      text-align: center;
      margin: 30px 0;
      text-transform: uppercase;
      letter-spacing: 3px;
    }
    .content {
      line-height: 2;
      font-size: 16px;
      color: #334155;
      margin: 30px 0;
    }
    .highlight {
      color: #2563eb;
      font-weight: bold;
      font-size: 18px;
    }
    .details-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin: 40px 0;
      padding: 30px;
      background: #f8fafc;
      border-radius: 10px;
    }
    .detail-item {
      display: flex;
      flex-direction: column;
    }
    .detail-label {
      font-size: 12px;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 5px;
    }
    .detail-value {
      font-size: 16px;
      color: #1e293b;
      font-weight: 600;
    }
    .footer {
      margin-top: 60px;
      padding-top: 30px;
      border-top: 2px solid #e2e8f0;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }
    .signature-line {
      width: 250px;
      border-top: 2px solid #1e293b;
      padding-top: 10px;
      text-align: center;
    }
    .signature-label {
      font-size: 12px;
      color: #64748b;
      margin-top: 5px;
    }
    .certificate-number {
      font-size: 11px;
      color: #94a3b8;
      text-align: right;
      margin-top: 30px;
    }
    .seal {
      width: 100px;
      height: 100px;
      border-radius: 50%;
      border: 5px solid #2563eb;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      color: #2563eb;
      font-size: 12px;
      text-align: center;
      line-height: 1.2;
    }
    @media print {
      body {
        background: white;
        padding: 0;
      }
      .certificate {
        box-shadow: none;
      }
    }
  </style>
</head>
<body>
  <div class="certificate">
    <div class="header">
      <div class="logo">QIST PLATFORM</div>
      <div class="subtitle">Shariah-Compliant Investment Network</div>
    </div>

    <div class="title">Certificate of Investment</div>

    <div class="content">
      This is to certify that
      <span class="highlight">${data.investorName}</span>
      has made a Shariah-compliant investment in
      <span class="highlight">${data.businessName}</span>
      under the
      <span class="highlight">${data.contractType}</span>
      contract structure through the ${data.pool} pool.
    </div>

    <div class="details-grid">
      <div class="detail-item">
        <div class="detail-label">Investment Amount</div>
        <div class="detail-value">₦${data.investmentAmount.toLocaleString()}</div>
      </div>
      <div class="detail-item">
        <div class="detail-label">Expected Return</div>
        <div class="detail-value">₦${data.expectedReturn.toLocaleString()}</div>
      </div>
      <div class="detail-item">
        <div class="detail-label">Investment Date</div>
        <div class="detail-value">${data.investmentDate}</div>
      </div>
      <div class="detail-item">
        <div class="detail-label">Term Period</div>
        <div class="detail-value">${data.termMonths} Months</div>
      </div>
      <div class="detail-item">
        <div class="detail-label">Contract Type</div>
        <div class="detail-value">${data.contractType}</div>
      </div>
      <div class="detail-item">
        <div class="detail-label">Investment Pool</div>
        <div class="detail-value">${data.pool.charAt(0).toUpperCase() + data.pool.slice(1)} Pool</div>
      </div>
    </div>

    <div class="content" style="font-size: 14px; line-height: 1.8; color: #64748b;">
      This investment is structured in accordance with Islamic finance principles and has been reviewed for Shariah compliance. 
      The investor is entitled to the profit-sharing arrangement as specified in the investment agreement.
    </div>

    <div class="footer">
      <div>
        <div class="signature-line">
          <strong>Authorized Signature</strong>
          <div class="signature-label">QIST Platform</div>
        </div>
      </div>
      <div class="seal">
        SHARIAH<br>COMPLIANT<br>✓
      </div>
    </div>

    <div class="certificate-number">
      Certificate No: ${data.certificateNumber}<br>
      Issued: ${currentDate}
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Generate and download investment certificate as PDF
 */
export function downloadInvestmentCertificate(data: CertificateData) {
  const html = generateInvestmentCertificateHTML(data);
  
  // Create a new window with the certificate
  const printWindow = window.open("", "_blank");
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    
    // Trigger print dialog (user can save as PDF)
    setTimeout(() => {
      printWindow.print();
    }, 500);
  }
}

/**
 * Generate tax statement HTML
 */
export interface TaxStatementData {
  year: number;
  investorName: string;
  investorId: string;
  totalInvestment: number;
  totalReturns: number;
  investments: Array<{
    businessName: string;
    amount: number;
    returns: number;
    contractType: string;
  }>;
}

export function generateTaxStatementHTML(data: TaxStatementData): string {
  const currentDate = new Date().toLocaleDateString("en-NG", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Tax Statement ${data.year} - ${data.investorName}</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      max-width: 900px;
      margin: 0 auto;
      padding: 40px;
      color: #1e293b;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: start;
      margin-bottom: 40px;
      padding-bottom: 20px;
      border-bottom: 3px solid #2563eb;
    }
    .logo {
      font-size: 24px;
      font-weight: bold;
      color: #2563eb;
    }
    .header-info {
      text-align: right;
      font-size: 14px;
      color: #64748b;
    }
    h1 {
      font-size: 28px;
      margin-bottom: 10px;
    }
    .subtitle {
      font-size: 14px;
      color: #64748b;
      margin-bottom: 30px;
    }
    .info-section {
      background: #f8fafc;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 30px;
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      padding: 10px 0;
      border-bottom: 1px solid #e2e8f0;
    }
    .info-row:last-child {
      border-bottom: none;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
    }
    th {
      background: #2563eb;
      color: white;
      padding: 12px;
      text-align: left;
      font-weight: 600;
    }
    td {
      padding: 12px;
      border-bottom: 1px solid #e2e8f0;
    }
    .total-row {
      font-weight: bold;
      background: #f8fafc;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 2px solid #e2e8f0;
      font-size: 12px;
      color: #64748b;
      line-height: 1.6;
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="logo">QIST PLATFORM</div>
      <div>Shariah-Compliant Investments</div>
    </div>
    <div class="header-info">
      <div><strong>Tax Statement ${data.year}</strong></div>
      <div>Generated: ${currentDate}</div>
    </div>
  </div>

  <h1>Investment Income Statement</h1>
  <div class="subtitle">For Tax Year ${data.year}</div>

  <div class="info-section">
    <div class="info-row">
      <span><strong>Investor Name:</strong></span>
      <span>${data.investorName}</span>
    </div>
    <div class="info-row">
      <span><strong>Investor ID:</strong></span>
      <span>${data.investorId}</span>
    </div>
    <div class="info-row">
      <span><strong>Tax Year:</strong></span>
      <span>${data.year}</span>
    </div>
  </div>

  <h2 style="margin-top: 30px;">Investment Summary</h2>
  <table>
    <thead>
      <tr>
        <th>Business</th>
        <th>Contract Type</th>
        <th style="text-align: right;">Investment</th>
        <th style="text-align: right;">Returns</th>
      </tr>
    </thead>
    <tbody>
      ${data.investments.map(inv => `
        <tr>
          <td>${inv.businessName}</td>
          <td>${inv.contractType}</td>
          <td style="text-align: right;">₦${inv.amount.toLocaleString()}</td>
          <td style="text-align: right;">₦${inv.returns.toLocaleString()}</td>
        </tr>
      `).join('')}
      <tr class="total-row">
        <td colspan="2"><strong>TOTAL</strong></td>
        <td style="text-align: right;"><strong>₦${data.totalInvestment.toLocaleString()}</strong></td>
        <td style="text-align: right;"><strong>₦${data.totalReturns.toLocaleString()}</strong></td>
      </tr>
    </tbody>
  </table>

  <div class="footer">
    <p><strong>Important Notice:</strong></p>
    <p>This statement summarizes your investment activities and returns for the specified tax year. 
    All investments are structured in accordance with Islamic finance principles.</p>
    <p>Please consult with a tax professional regarding the tax implications of your investment returns. 
    QIST Platform does not provide tax advice.</p>
    <p>For questions or corrections, please contact support@qistplatform.com</p>
  </div>
</body>
</html>
  `;
}

export function downloadTaxStatement(data: TaxStatementData) {
  const html = generateTaxStatementHTML(data);
  
  const printWindow = window.open("", "_blank");
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    
    setTimeout(() => {
      printWindow.print();
    }, 500);
  }
}
