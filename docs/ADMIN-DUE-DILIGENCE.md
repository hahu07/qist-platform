# Admin Due Diligence & Application Review System

## Overview

The Admin Business Applications page provides a comprehensive due diligence and approval workflow for reviewing Islamic financing applications. The system includes automated risk assessment, financial analysis, pricing recommendations, and AI-powered advisory to help admins make informed decisions while maintaining Shariah compliance.

---

## Architecture

### Component Structure
```
/admin/business-applications
├── Application List View (Dashboard)
├── Application Detail Modal (4 Tabs)
│   ├── Request Details
│   ├── Due Diligence Checklist
│   ├── Pricing & Terms
│   └── Recommendations
└── Approval Workflow (Approve/Reject/Request Info)
```

### State Management
- **Applications**: List of all financing applications from Juno datastore
- **Due Diligence**: 26 checklist items across 6 categories (4-state system)
- **Financial Ratios**: 10 input fields with 7 calculated metrics
- **Risk Assessment**: Automated scoring with credit ratings
- **Pricing Terms**: Islamic instrument configuration (Murabaha, Musharakah, etc.)
- **Recommendations**: AI-generated advisory with admin override capability

---

## Tab 1: Request Details

### Application Information Display
Shows comprehensive business information:
- **Business Profile**: Name, type, industry, registration number
- **Financing Request**: Amount, contract type, purpose, term
- **Key Metrics**: Years active, employees, annual revenue
- **Contact**: Email, phone, owner details
- **Documents**: Uploaded supporting documentation

### Document Viewer
- Displays all uploaded documents with type categorization
- Shows upload status and verification state
- Provides document preview/download capability
- Groups documents by category (Financial, Legal, Operational)

---

## Tab 2: Due Diligence Checklist

### 4-State Check System

Each due diligence item uses a **4-button pattern** instead of simple checkboxes:

#### CheckStatus Type
```typescript
type CheckStatus = 'pass' | 'fail' | 'na' | 'unknown'
```

#### Button States
1. **✓ Pass** (Green) - Item verified and acceptable
2. **✗ Fail** (Red) - Item failed verification or unacceptable
3. **— N/A** (Gray) - Not applicable to this business
4. **? Unknown** (Yellow) - Not yet verified or pending information

### Due Diligence Categories

#### 1. Financial Analysis (5 items)
- `financialStatementsReviewed` - Financial documents examined
- `bankStatementsVerified` - Bank statements cross-checked
- `cashFlowAnalyzed` - Cash flow sustainability assessed
- `debtEquityRatioAcceptable` - Leverage position evaluated
- `profitabilityAcceptable` - Profit margins reviewed

#### 2. Legal & Compliance (4 items)
- `businessRegistrationValid` - CAC registration verified
- `licensesVerified` - Industry licenses confirmed
- `taxComplianceConfirmed` - Tax records checked
- `regulatoryApprovalsObtained` - Sector approvals validated

#### 3. Identity Verification (4 items)
- `ownerIdentityConfirmed` - Owner NIN/BVN verified
- `addressVerified` - Business address validated
- `businessLocationConfirmed` - Physical location checked
- `referencesChecked` - Business references contacted

#### 4. Operational Due Diligence (4 items)
- `businessModelViable` - Business model sustainability
- `managementExperienceAdequate` - Team competency assessed
- `marketDemandVerified` - Market opportunity validated
- `operationalRiskAssessed` - Operational risks identified

#### 5. Collateral Verification (6 items)
- `collateralValuationCompleted` - Asset valuation done
- `titleDocumentsVerified` - Ownership documents checked
- `collateralConditionAcceptable` - Physical condition assessed
- `collateralLiquidityAssessed` - Marketability evaluated
- `insuranceVerified` - Asset insurance confirmed
- `legalEncumbrancesCleared` - No liens or claims

#### 6. Shariah Compliance (3 items)
- `businessActivitiesHalal` - No prohibited activities (alcohol, gambling, pork, interest-based lending, etc.)
- `noInterestBasedOperations` - Business does not engage in riba
- `noProhibitedSectors` - Not in haram industries

### Financial Ratio Calculator

**Expandable section** for detailed financial analysis:

#### Input Fields (10 metrics)
1. **Current Assets (₦)** - Cash, inventory, receivables
2. **Current Liabilities (₦)** - Short-term debts, payables
3. **Total Assets (₦)** - All business assets
4. **Total Liabilities (₦)** - All debts and obligations
5. **Total Equity (₦)** - Owner's capital
6. **Revenue (₦)** - Annual sales/income
7. **Net Income (₦)** - Profit after all expenses
8. **Operating Income (₦)** - Profit from core operations
9. **Inventory (₦)** - Stock value
10. **Cost of Goods Sold (₦)** - Direct costs

#### Calculated Ratios (7 metrics)

**Liquidity:**
- **Current Ratio** = Current Assets ÷ Current Liabilities
  - Good: ≥2.0, Acceptable: 1.5-2.0, Weak: <1.0

**Leverage:**
- **Debt-to-Equity** = Total Liabilities ÷ Total Equity
  - Good: ≤0.5, Acceptable: 0.5-1.0, High Risk: >2.0

**Profitability:**
- **ROA (Return on Assets)** = (Net Income ÷ Total Assets) × 100%
  - Excellent: ≥10%, Good: 5-10%, Low: <5%
- **ROE (Return on Equity)** = (Net Income ÷ Total Equity) × 100%
  - Excellent: ≥15%, Good: 10-15%, Low: <5%
- **Profit Margin** = (Net Income ÷ Revenue) × 100%
  - Strong: ≥15%, Good: 10-15%, Thin: <5%

**Efficiency:**
- **Operating Margin** = (Operating Income ÷ Revenue) × 100%
  - Excellent: ≥20%, Good: 15-20%, Acceptable: 10-15%
- **Inventory Turnover** = Cost of Goods Sold ÷ Inventory
  - Higher is better (varies by industry)

### Risk Assessment

**Auto-calculated** based on financial ratios with manual override:

#### Risk Scoring Algorithm
```typescript
// Weighted scoring system (100 points total)
- Current Ratio: 20 points (≥2=20, ≥1.5=15, ≥1=10, ≥0.5=5)
- Debt-to-Equity: 20 points (≤0.5=20, ≤1=15, ≤2=10, ≤3=5)
- ROA: 15 points (≥10=15, ≥5=10, ≥2=5)
- ROE: 15 points (≥15=15, ≥10=10, ≥5=5)
- Profit Margin: 15 points (≥15=15, ≥10=10, ≥5=5)
- Operating Margin: 15 points (≥20=15, ≥15=10, ≥10=5)
```

#### Credit Rating Scale
- **A+ (Excellent)**: Score ≥85% - Low risk
- **A (Very Good)**: Score 75-84% - Low risk
- **B+ (Good)**: Score 65-74% - Medium risk
- **B (Fair)**: Score 55-64% - Medium risk
- **B- (Below Average)**: Score 45-54% - Medium risk
- **C+ (Marginal)**: Score 35-44% - High risk
- **C (Poor)**: Score 25-34% - High risk
- **D (High Risk)**: Score <25% - High risk

#### Risk Assessment Fields
1. **Overall Risk Score** (dropdown) - Low/Medium/High/Very High
2. **Credit Rating** (dropdown) - A+ to D scale
3. **Risk Factors** (textarea) - Identified risks and concerns
4. **Mitigation Measures** (textarea) - Actions to reduce risk
5. **Additional Risk Notes** (textarea) - Other observations

### Progress Tracking

**Overall Due Diligence Score:**
- Calculates completion percentage: `(passed items / applicable items) × 100%`
- Excludes N/A items from denominator
- Visual progress bar with color coding:
  - Green (≥80%): Complete
  - Yellow (60-79%): Good progress
  - Orange (40-59%): Needs work
  - Red (<40%): Incomplete

---

## Tab 3: Pricing & Terms

### Islamic Financing Instruments

Comprehensive configuration for Shariah-compliant financing structures:

#### 1. Instrument Selection

**Murabaha (Cost-Plus Financing)**
- Platform purchases asset and sells to business at cost + profit
- Fixed profit margin agreed upfront
- Payment can be deferred or in installments
- **Use Case**: Asset acquisition, equipment purchase, working capital

**Musharakah (Partnership)**
- Joint venture between platform and business
- Both parties contribute capital
- Profits shared according to pre-agreed ratio
- Losses shared based on capital contribution ratio
- **Use Case**: Business expansion, project financing, real estate

**Mudarabah (Profit-Sharing)**
- Platform provides capital (Rabb-ul-Mal)
- Business manages operations (Mudarib)
- Profits distributed per agreed percentage
- Losses borne by capital provider (platform)
- **Use Case**: New ventures, trading businesses, startups

**Ijarah (Leasing)**
- Platform owns asset and leases to business
- Rent payments over agreed period
- Option to purchase at end (Ijarah Muntahia Bittamleek)
- **Use Case**: Equipment, vehicles, machinery, property

**Salam (Forward Sale)**
- Payment in advance for future delivery of goods
- Price fixed at contract time
- Delivery date specified
- **Use Case**: Agriculture, manufacturing, commodities

### Pricing Configuration

#### Murabaha Pricing Structure
```typescript
{
  costPrice: number,           // Platform's acquisition cost
  profitRate: number,          // Percentage markup (%)
  profitAmount: number,        // Auto-calculated (costPrice × profitRate/100)
  sellingPrice: number,        // Auto-calculated (costPrice + profitAmount)
}
```

**Example:**
- Cost Price: ₦5,000,000
- Profit Rate: 12%
- Profit Amount: ₦600,000 (auto-calculated)
- **Selling Price: ₦5,600,000** (total repayment)

#### Musharakah/Mudarabah Profit Sharing
```typescript
{
  profitSharingRatio: number,    // Business share (%)
  investorSharingRatio: number,  // Platform share (auto = 100 - business)
}
```

**Example:**
- Business Share: 70%
- Platform Share: 30% (auto-calculated)
- If profit = ₦1,000,000 → Business gets ₦700k, Platform gets ₦300k

**Key Difference:**
- **Musharakah**: Losses shared by capital ratio (both invest)
- **Mudarabah**: Losses borne by platform only (business provides labor)

### Payment Structure

#### Payment Options
1. **Installment Payments** - Regular periodic payments
2. **Lump Sum at Maturity** - Single payment at end of term
3. **Deferred Payment** - Grace period before payments begin

#### Installment Configuration
```typescript
{
  installmentFrequency: 'monthly' | 'quarterly' | 'semi-annual' | 'annual',
  numberOfInstallments: number,    // Total payment count
  defermentPeriod: number,         // Grace period in months
}
```

### Fees & Charges

**Shariah-Compliant Fee Structure:**

1. **Administration Fee** (%) - Platform service charge
   - Covers platform operations, due diligence, monitoring
   - Typically 2-5% of financing amount

2. **Early Settlement Discount** (%) - Discount for early payoff
   - Encourages early repayment
   - Example: 1% discount if paid 6+ months early

3. **Late Payment Penalty** - Shariah-compliant handling
   - **Option 1: Charity** - Late fees donated to charity (recommended)
   - **Option 2: None** - No penalty (more lenient)
   - ❌ **Not allowed**: Interest-based penalties (riba)

4. **Takaful Coverage** (Islamic Insurance) - Optional/Required toggle
   - Cooperative insurance based on mutual assistance
   - Protects against asset loss, business disruption
   - Premium structure Shariah-compliant (no gambling element)

### Collateral & Security

```typescript
{
  collateralType: string,        // Asset type (Real Estate, Equipment, etc.)
  collateralValue: number,       // Appraised value
  securityCoverageRatio: number, // Auto: (collateralValue/financingAmount)×100%
}
```

**Security Coverage Benchmarks:**
- **Strong**: ≥150% (collateral worth 1.5× financing)
- **Adequate**: 100-149%
- **Weak**: <100% (under-collateralized)

---

## Tab 4: Recommendations

### AI-Powered Advisory System

Automated analysis that combines all assessment data to generate actionable recommendations.

#### Data Inputs
1. **Due Diligence Score** (30% weight) - Completion and pass rate
2. **Financial Risk Score** (70% weight) - Calculated from ratios
3. **Shariah Compliance** - Pass/fail on all 3 checks
4. **Legal Compliance** - Registration, tax, regulatory status
5. **Collateral Coverage** - Security ratio assessment
6. **Business Profile** - Years in operation, industry, size

### Recommendation Logic

#### Overall Scoring Formula
```typescript
totalScore = (dueDiligenceScore × 0.3) + (riskScore × 0.7)
```

#### Approval Decision Matrix

| Total Score | Concerns | Recommendation | Action |
|------------|----------|----------------|---------|
| ≥70% | ≤2 | **APPROVE** | Proceed with standard terms |
| 50-69% | ≤4 | **CONDITIONAL APPROVE** | Approval with conditions |
| 35-49% | Any | **REQUEST MORE INFO** | Additional documentation needed |
| <35% | Any | **REJECT** | High risk, insufficient mitigation |
| Any | Shariah Fail | **REJECT** | Non-compliant business |

#### Automatic Instrument Selection

**Decision Tree:**

1. **Check Shariah Compliance** → If fail, immediate rejection
2. **Evaluate Financial Health:**
   - **Strong** (Current Ratio ≥1.5, D/E ≤1, Profit Margin ≥10%)
     → Recommend **Murabaha** (lowest risk, fixed terms)
   
   - **Established** (ROE ≥12%, 3+ years operation)
     → Recommend **Musharakah** (partnership model)
   
   - **Growth Stage** (<2 years operation, potential shown)
     → Recommend **Mudarabah** (platform takes more risk)
   
   - **Asset-Focused** (Strong collateral, equipment needs)
     → Recommend **Ijarah** (leasing structure)

3. **Adjust for Risk Level:**
   - Low Risk → Extend term, reduce profit rate
   - High Risk → Shorten term, increase profit rate, require collateral

#### Risk-Based Pricing

| Risk Level | Credit Rating | Profit Rate | Term (Months) | Collateral Requirement |
|-----------|---------------|-------------|---------------|----------------------|
| Low | A+, A | 10% | 24 | Optional |
| Medium | B+, B, B- | 12% | 18 | Recommended |
| High | C+, C, D | 15% | 12 | Required (150%+) |

### Generated Outputs

#### 1. Key Strengths (Auto-populated)
Examples of auto-generated strength indicators:
- ✅ "Excellent due diligence completion (92%)"
- ✅ "Strong liquidity position (Current Ratio: 2.3)"
- ✅ "Healthy leverage (Debt-to-Equity: 0.7)"
- ✅ "Excellent profitability (ROE: 18%)"
- ✅ "Strong profit margins (16%)"
- ✅ "Low risk profile (Credit Rating: A)"
- ✅ "Full Shariah compliance confirmed"
- ✅ "Established operations (5+ years)"

#### 2. Risk Concerns (Auto-populated)
Examples of auto-identified concerns:
- ⚠️ "Incomplete due diligence (45% completed)"
- ⚠️ "Weak liquidity (Current Ratio: 0.8)"
- ⚠️ "High leverage risk (Debt-to-Equity: 2.5)"
- ⚠️ "Low profitability (ROE: 3%)"
- ⚠️ "Thin profit margins (4%)"
- ⚠️ "High risk profile (Credit Rating: C)"
- ⚠️ "Shariah compliance issues identified"
- ⚠️ "Legal compliance deficiencies found"

#### 3. Approval Conditions (Auto-generated)
Smart condition generation based on findings:
- 📋 "Complete all required due diligence checks before approval"
- 📋 "Require cash flow monitoring and liquidity improvement plan"
- 📋 "Cap additional debt until ratio improves below 1.5"
- 📋 "Require enhanced collateral coverage (minimum 150%)"
- 📋 "Monthly financial reporting and covenant monitoring"
- 📋 "Resolve all legal and regulatory issues before disbursement"
- 📋 "Platform takes active monitoring role as Rabb-ul-Mal"
- 📋 "Regular quarterly reviews for first 12 months"
- 📋 "Reduce initial financing to ₦3.0M due to risk profile"

#### 4. Recommended Terms
```typescript
{
  approvalRecommendation: 'approve' | 'reject' | 'request-info' | 'pending',
  recommendedInstrument: 'murabaha' | 'musharakah' | 'mudarabah' | 'ijarah' | 'salam',
  recommendedAmount: number,      // May be less than requested if high risk
  recommendedTerm: number,        // Months
  recommendedProfitRate: number,  // Percentage
}
```

#### 5. Mitigation Suggestions (Editable)
Pre-filled with risk assessment mitigation measures, admin can customize:
- Specific monitoring requirements
- Reporting frequency
- Financial covenants
- Operational milestones
- Contingency plans

### Admin Override Capability

All recommendations are **fully editable**:
- Change approval decision via dropdown
- Adjust financing instrument
- Modify amount, term, profit rate
- Edit reasoning text
- Add/remove strengths and concerns
- Customize conditions
- Update mitigation suggestions

**Philosophy**: AI provides data-driven starting point, human judgment makes final decision.

---

## Approval Workflow

### Approval Process

#### 1. Review All Tabs
Admin should verify:
- ✓ Request details are complete and accurate
- ✓ Due diligence score is adequate (typically ≥80%)
- ✓ Financial ratios meet minimum thresholds
- ✓ Risk assessment is completed
- ✓ Shariah compliance is confirmed
- ✓ Pricing terms are configured
- ✓ Recommendations are reviewed and adjusted if needed

#### 2. Approve Application

**Click "Approve Application" button:**

1. **Set Investment Terms** form appears:
   - Min Return (%): 10-20%
   - Max Return (%): 12-25%
   - Term (Months): 6-36 months
   - Minimum Investment (₦): 100k-1M per investor
   - Campaign Duration (Days): 7-90 days

2. **Default Terms by Contract Type:**
   ```typescript
   musharaka:  { returnMin: 15, returnMax: 18, termMonths: 24, minInvest: 500k, days: 30 }
   mudaraba:   { returnMin: 12, returnMax: 16, termMonths: 18, minInvest: 500k, days: 30 }
   murabaha:   { returnMin: 10, returnMax: 12, termMonths: 12, minInvest: 500k, days: 21 }
   ijara:      { returnMin: 12, returnMax: 14, termMonths: 18, minInvest: 500k, days: 30 }
   istisna:    { returnMin: 10, returnMax: 12, termMonths: 12, minInvest: 500k, days: 45 }
   ```

3. **System Actions on Confirmation:**
   - Updates application status to "approved"
   - Stores all due diligence data in application record
   - Saves financial ratios and risk assessment
   - Records admin reviewer and timestamp
   - Creates investment opportunity in platform
   - Sets campaign deadline: `today + campaignDays`
   - Triggers notification to business owner
   - Makes opportunity visible to investors

#### 3. Reject Application

**Click "Reject Application" button:**

1. **Admin Message Required** - Explain rejection reason
2. **System Actions:**
   - Updates status to "rejected"
   - Sends notification to business with admin message
   - Application removed from pending queue
   - Business can reapply after addressing issues

#### 4. Request More Information

**Click "Request More Information" button:**

1. **Specify Requirements** - Detail what's needed
2. **System Actions:**
   - Status changes to "more-info"
   - Business receives notification with requirements
   - Application remains in queue
   - Business can resubmit with additional information

---

## Data Persistence

### Application Data Structure

```typescript
interface ApplicationData {
  // Basic Info
  businessName: string;
  businessType: string;
  industry: string;
  requestedAmount: number;
  contractType: string;
  
  // Due Diligence (stored on approval)
  dueDiligence?: {
    financial: { /* 5 CheckStatus fields */ },
    legal: { /* 4 CheckStatus fields */ },
    identity: { /* 4 CheckStatus fields */ },
    operational: { /* 4 CheckStatus fields */ },
    collateral: { /* 6 CheckStatus fields */ },
    shariah: { /* 3 CheckStatus fields */ }
  };
  dueDiligenceScore?: number;
  dueDiligenceNotes?: string;
  
  // Financial Analysis
  financialRatios?: {
    currentAssets: number;
    currentLiabilities: number;
    totalAssets: number;
    totalLiabilities: number;
    totalEquity: number;
    revenue: number;
    netIncome: number;
    operatingIncome: number;
    inventory: number;
    costOfGoodsSold: number;
  };
  
  // Risk Assessment
  riskAssessment?: {
    overallRiskScore: string;
    creditRating: string;
    riskFactors: string;
    mitigationMeasures: string;
    additionalNotes: string;
  };
  
  // Pricing Terms
  pricingTerms?: {
    financingInstrument: string;
    costPrice: number;
    sellingPrice: number;
    profitRate: number;
    profitSharingRatio: number;
    paymentStructure: string;
    installmentFrequency: string;
    numberOfInstallments: number;
    administrationFee: number;
    takafulCoverage: boolean;
    collateralValue: number;
    collateralType: string;
  };
  
  // Recommendations
  recommendations?: {
    approvalRecommendation: string;
    recommendedInstrument: string;
    recommendedAmount: number;
    recommendedTerm: number;
    recommendedProfitRate: number;
    reasoning: string;
    strengths: string[];
    concerns: string[];
    conditions: string[];
    mitigationSuggestions: string;
  };
  
  // Review Metadata
  reviewedBy?: string;
  reviewedAt?: Date;
  adminMessage?: string;
  status: 'new' | 'pending' | 'approved' | 'rejected' | 'more-info';
}
```

### Juno Integration

**Collections Used:**
- `business_applications` - Financing requests
- `investment_opportunities` - Approved campaigns
- `documents` - Supporting files

**Operations:**
- `listDocs()` - Fetch all applications
- `getDoc()` - Retrieve single application
- `setDoc()` - Update application (with version checking)
- `uploadFile()` - Store documents in storage

---

## UI/UX Patterns

### Design System

**Color Coding:**
- **Primary**: Blue - Neutral information
- **Success**: Green - Positive indicators, approvals
- **Warning**: Amber/Yellow - Caution, pending items
- **Error**: Red - Problems, rejections, failures
- **Neutral**: Gray - Inactive, N/A items

**Component Patterns:**

1. **4-Button Check System**
   ```tsx
   [✓ Pass] [✗ Fail] [— N/A] [? Unknown]
   ```
   - Hover: Scale 105%
   - Active: Scale 105% + shadow
   - Layout: `justify-between` (labels left, buttons right)

2. **Progress Indicators**
   - Circular progress rings for scores
   - Color-coded badges for status
   - Percentage displays with context

3. **Expandable Sections**
   - Chevron rotation animation
   - Smooth height transitions
   - Collapsible for cleaner interface

4. **Gradient Cards**
   - Category-specific color schemes
   - Dark mode compatible
   - Neuomorphic shadows (8px_8px_0px)

### Responsive Behavior

- **Desktop**: Full 4-column grids, side-by-side layouts
- **Tablet**: 2-column grids, stacked sections
- **Mobile**: Single column, collapsed by default

---

## Best Practices

### For Admins

1. **Complete Due Diligence First**
   - Review all documents before starting checklist
   - Use N/A liberally for non-applicable items
   - Document concerns in notes section

2. **Use Financial Calculator**
   - Input actual values from financial statements
   - Verify calculated ratios match manual calculations
   - Compare ratios to industry benchmarks

3. **Review All Tabs Before Approval**
   - Don't skip any section
   - Recommendations tab provides holistic view
   - Override AI suggestions when necessary based on qualitative factors

4. **Shariah Compliance is Non-Negotiable**
   - Any "Fail" in Shariah section = automatic rejection
   - Verify business activities align with Islamic principles
   - Check for hidden riba or gharar in operations

5. **Document Your Decision**
   - Use due diligence notes extensively
   - Fill out risk factors and mitigation measures
   - Provide clear admin message on rejection/info request

### For Developers

1. **State Management**
   - All form data in React state (no uncontrolled inputs)
   - Auto-save to prevent data loss on accidental close
   - Optimistic updates with error rollback

2. **Performance**
   - Lazy load document previews
   - Memoize expensive calculations (ratios, scores)
   - Virtualize long lists if >100 applications

3. **Validation**
   - Client-side validation for immediate feedback
   - Server-side validation before persistence
   - Version checking to prevent concurrent edit conflicts

4. **Accessibility**
   - Keyboard navigation for all controls
   - Screen reader labels for icon buttons
   - Focus management in modal dialogs

---

## Future Enhancements

### Planned Features

1. **Automated Document OCR**
   - Extract financial data from uploaded PDFs
   - Auto-populate ratio calculator fields
   - Reduce manual data entry

2. **Industry Benchmarking**
   - Compare applicant ratios to industry averages
   - Context-aware recommendations
   - Sector-specific risk models

3. **Collaborative Review**
   - Multi-reviewer workflows
   - Shariah board approval integration
   - Audit trail for all changes

4. **Machine Learning**
   - Train model on historical approval/rejection data
   - Predict default probability
   - Improve recommendation accuracy over time

5. **Integration Enhancements**
   - Direct bank statement import
   - Credit bureau API integration
   - Automated company registry checks (CAC API)

---

## Technical Reference

### Key Functions

#### `calculateFinancialRatios()`
Computes 7 ratios from 10 input fields with zero-division protection.

#### `calculateRiskScoreFromRatios()`
Weighted scoring algorithm (100 points) returning score, risk level, and credit rating.

#### `calculateDueDiligenceScore()`
Percentage of passed items excluding N/A items.

#### `generateRecommendations()`
AI advisory engine combining all assessment data to produce actionable recommendations.

#### `renderCheckButtons(category, key, value)`
Helper function for consistent 4-button UI rendering across all categories.

### Dependencies

- **Juno Core** (`@junobuild/core`) - Backend integration
- **Next.js 16** - Frontend framework
- **React 19** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS 4** - Styling

### Environment

- **Development**: Local with Juno emulator (Skylab)
- **Production**: Deployed to ICP via `juno hosting deploy`
- **Data**: Stored in Juno Satellite (on-chain)

---

## Support & Resources

- **Platform Docs**: `/docs` directory
- **Juno Documentation**: https://juno.build/docs
- **Islamic Finance Guide**: Internal Shariah compliance handbook
- **Admin Training**: Contact platform administrator

---

## Changelog

### Version 2.0 (Current)
- ✨ Added 4-state due diligence system (Pass/Fail/N/A/Unknown)
- ✨ Integrated financial ratio calculator with 7 metrics
- ✨ Automated risk scoring and credit rating
- ✨ Added Pricing & Terms tab for Islamic instruments
- ✨ Implemented AI-powered recommendations engine
- ✨ Enhanced UI with gradient cards and neuomorphic design

### Version 1.0
- ✅ Basic application listing and filtering
- ✅ Modal detail view with document viewer
- ✅ Simple checkbox due diligence
- ✅ Manual approval/rejection workflow
