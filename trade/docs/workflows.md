# QistFi Platform Workflows

## Overview

This document describes the end-to-end workflows for key platform operations, showing how investors, businesses, and managers interact throughout the financing lifecycle.

---

## Table of Contents

1. [Business Financing Workflow](#1-business-financing-workflow)
2. [Investor Allocation Workflow (Directed Mode)](#2-investor-allocation-workflow-directed-mode)
3. [Investor Pooled Investment Workflow](#3-investor-pooled-investment-workflow)
4. [Profit Distribution Workflow](#4-profit-distribution-workflow)
5. [Manager Due Diligence Workflow](#5-manager-due-diligence-workflow)
6. [Default Management Workflow](#6-default-management-workflow)
7. [Contract Lifecycle Workflow](#7-contract-lifecycle-workflow)

---

## 1. Business Financing Workflow

### Overview
How a business applies for financing, gets approved, raises capital, and fulfills obligations.

### Participants
- **Business**: Seeking financing
- **Manager**: Reviews and approves applications
- **Platform System**: Manages campaign and funds
- **Investors**: Provide capital (indirectly through platform)

### Workflow Steps

```
Business Registration → Application → Due Diligence → Approval → 
Campaign → Funding → Contract Execution → Disbursement → 
Performance Reporting → Profit Distribution/Payments → Settlement
```

---

#### Phase 1: Registration & Application

**Step 1.1: Business Registration**
- **Actor**: Business
- **Actions**:
  1. Visit QistFi platform
  2. Click "Register as Business"
  3. Provide company information
  4. Upload business registration documents
  5. Complete KYC verification
  6. Accept terms and conditions
- **Output**: Business account created, status: Pending Verification

**Step 1.2: Create Financing Application** (Draft)
- **Actor**: Business
- **Actions**:
  1. Navigate to "Apply for Financing"
  2. Fill application form:
     - Financing amount needed
     - Use of funds (detailed breakdown)
     - Preferred Islamic finance structure
     - Business duration
     - Proposed profit-sharing ratio (if applicable)
  3. Upload required documents:
     - Business plan
     - Financial statements (last 2-3 years)
     - Financial projections
     - Shariah compliance certificate
     - Management team bios
     - Licenses and permits
     - Any collateral documentation
  4. Save as draft (can return to edit)
- **Output**: Draft application saved

**Step 1.3: Submit Application**
- **Actor**: Business
- **Actions**:
  1. Review application completeness checklist
  2. Preview application summary
  3. Click "Submit for Review"
  4. Receive submission confirmation
- **Output**: Application submitted, status: Under Review
- **Notification**: Manager receives new application alert

---

#### Phase 2: Manager Due Diligence

**Step 2.1: Initial Review**
- **Actor**: Manager
- **Actions**:
  1. Application appears in review queue
  2. Manager assigns to self or analyst
  3. Run automated checks:
     - Application completeness
     - Prohibited industry screening
     - Document verification
  4. If fails automated checks → Reject with reason
  5. If passes → Proceed to manual review
- **Output**: Application proceeds to detailed review OR rejected

**Step 2.2: Shariah Compliance Review**
- **Actor**: Manager + Shariah Scholar (if needed)
- **Actions**:
  1. Review business model for Shariah compliance
  2. Verify Shariah certificate authenticity
  3. Check revenue sources for prohibited income
  4. Assess Islamic business ethics compliance
  5. If complex case → Escalate to Shariah board
  6. Decision: Compliant / Non-Compliant / Needs Board Review
- **Output**: Shariah compliance determination

**Step 2.3: Financial Health Assessment**
- **Actor**: Manager/Analyst
- **Actions**:
  1. Analyze financial statements
  2. Calculate financial ratios
  3. Review cash flow and profitability
  4. Assess financial sustainability
  5. Identify financial red flags
  6. Assign financial health score: Strong / Moderate / Weak
- **Output**: Financial health assessment

**Step 2.4: Business Model Validation**
- **Actor**: Manager
- **Actions**:
  1. Evaluate business viability
  2. Assess management team capability
  3. Review market opportunity
  4. Analyze competitive position
  5. Validate revenue model
  6. Assign business model score: Strong / Moderate / Weak
- **Output**: Business model assessment

**Step 2.5: Legal & Documentation Check**
- **Actor**: Manager
- **Actions**:
  1. Verify business registration
  2. Check licenses and permits
  3. Review legal documentation
  4. Check for litigation or disputes
  5. Verify tax compliance
  6. Decision: Compliant / Minor Issues / Legal Problems
- **Output**: Legal compliance determination

**Step 2.6: Risk Scoring**
- **Actor**: Manager
- **Actions**:
  1. Aggregate all assessment scores
  2. Identify risk factors
  3. Document mitigation measures
  4. Assign overall risk rating: Low / Medium / High / Very High
  5. Complete due diligence report
- **Output**: Risk assessment and due diligence report

**Step 2.7: Contract Selection**
- **Actor**: Manager
- **Actions**:
  1. Based on business need and risk, select Islamic contract:
     - Musharakah (equity partnership)
     - Murabaha (asset financing)
     - Ijarah (leasing)
     - Salam (commodity financing)
     - Istisna'a (project financing)
  2. Set profit-sharing ratios OR payment terms
  3. Define milestone schedule for fund disbursement
  4. Prepare contract draft
- **Output**: Recommended contract structure

**Step 2.8: Final Decision**
- **Actor**: Manager (or approval committee for large amounts)
- **Actions**:
  1. Review complete due diligence package
  2. Make decision:
     - **Approve**: Opportunity goes live
     - **Request More Info**: Send feedback to business
     - **Reject**: Document reasons, notify business
     - **On Hold**: Pending external review
- **Notification**: Business receives decision
- **Output**: Application approved/rejected/on-hold

**If Approved:**
- Opportunity listed on platform for investors
- Business notified of approval
- Campaign begins

**If Rejected:**
- Business receives detailed rejection reasons
- Option to address issues and resubmit
- Business can appeal or apply again later

**If More Info Needed:**
- Business receives specific requests
- Business uploads additional documents
- Returns to Step 2.1 when resubmitted

---

#### Phase 3: Funding Campaign

**Step 3.1: Campaign Launch**
- **Actor**: Platform System (after manager approval)
- **Actions**:
  1. Opportunity becomes visible to investors
  2. Campaign page goes live with:
     - Business profile
     - Funding goal and terms
     - Risk rating
     - Manager's assessment summary
     - Islamic contract type
     - Campaign duration
  3. Investors can now browse and allocate
- **Output**: Active campaign, visible to investors

**Step 3.2: Investor Allocation Requests**
- **Actor**: Investors
- **Actions**:
  1. Investors browse opportunity
  2. Submit allocation requests to platform
  3. Platform queues requests for manager approval
- **Output**: Allocation requests pending

**Step 3.3: Manager Approves Allocations**
- **Actor**: Manager
- **Actions**:
  1. Review investor allocation requests
  2. Check investor portfolio concentration
  3. Verify platform liquidity
  4. Approve/reject allocations
- **Output**: Capital reserved for business

**Step 3.4: Track Campaign Progress**
- **Actor**: Business (monitoring), Platform (tracking)
- **Actions**:
  1. Business sees funding progress real-time
  2. Track % of goal reached
  3. Number of investors participating
  4. Days remaining
- **Output**: Campaign status updated continuously

**Step 3.5: Campaign Outcomes**

**Scenario A: Fully Funded**
- **Trigger**: 100% of funding goal reached
- **Actions**:
  1. Campaign closes successfully
  2. Platform prepares contract execution
  3. Proceed to Phase 4
- **Output**: Campaign successful, ready for contract

**Scenario B: Partially Funded (Above Threshold)**
- **Trigger**: Campaign ends with 70-99% of goal (threshold varies)
- **Actions**:
  1. If above minimum threshold (e.g., 70%), proceed with partial funding
  2. Adjust contract terms for lower amount
  3. Notify business and investors
  4. Proceed to Phase 4 with adjusted amount
- **Output**: Partial funding accepted

**Scenario C: Under-Funded (Below Threshold)**
- **Trigger**: Campaign ends below minimum threshold
- **Actions**:
  1. Campaign fails
  2. All allocated capital released back to investors
  3. Business notified of failure
  4. Business can reapply in future
- **Output**: Campaign failed, capital returned

**Scenario D: Campaign Extension**
- **Trigger**: Business requests extension near end of campaign
- **Actions**:
  1. Business submits extension request
  2. Manager evaluates (typically if >80% funded)
  3. If approved, add X more days
  4. Notify investors of extension
- **Output**: Campaign extended OR denied

---

#### Phase 4: Contract Execution

**Step 4.1: Prepare Contract**
- **Actor**: Platform System + Manager
- **Actions**:
  1. Generate contract from template based on type:
     - Musharakah agreement
     - Murabaha contract
     - Ijarah lease
     - Salam contract
     - Istisna'a agreement
  2. Include specific terms:
     - Principal amount (total funded)
     - Duration
     - Profit-sharing ratio OR payment schedule
     - Milestone schedule
     - Terms and conditions
  3. Manager reviews contract
- **Output**: Contract ready for execution

**Step 4.2: Contract Signing**
- **Actor**: Business + Platform
- **Actions**:
  1. Platform sends contract to business for review
  2. Business reviews terms
  3. Business signs digitally
  4. Platform signs on behalf of Mudarabah pool
  5. Contract becomes legally binding
- **Output**: Executed contract

**Step 4.3: Initial Disbursement**
- **Actor**: Platform Finance Team
- **Actions**:
  1. Based on milestone schedule, release first tranche
  2. Transfer funds to business bank account
  3. Record disbursement in system
  4. Notify business of transfer
  5. Update investors on fund deployment
- **Output**: Initial funds disbursed

---

#### Phase 5: Ongoing Performance & Reporting

**Step 5.1: Milestone Achievement**
- **Actor**: Business
- **Actions**:
  1. Work toward achieving first milestone
  2. When milestone reached, upload evidence:
     - Photos, invoices, reports, etc.
  3. Submit milestone completion notification
- **Output**: Milestone completion claim

**Step 5.2: Milestone Verification**
- **Actor**: Manager
- **Actions**:
  1. Review milestone completion evidence
  2. Verify milestone actually achieved
  3. Approve or request more proof
  4. If approved, authorize next disbursement
- **Output**: Milestone verified, funds released

**Step 5.3: Regular Financial Reporting**
- **Actor**: Business
- **Actions**:
  1. Prepare monthly/quarterly financial reports:
     - Revenue and expenses
     - Profit/loss statement
     - Cash flow
     - KPI updates
  2. Upload to platform
  3. Write narrative update (challenges, achievements)
- **Output**: Financial report submitted

**Step 5.4: Platform Review & Distribution**
- **Actor**: Manager
- **Actions**:
  1. Review business financial report
  2. Verify accuracy
  3. For Musharakah: Calculate profit share
  4. For Murabaha/Ijarah: Verify payment received
  5. Update investor dashboards with business performance
- **Output**: Performance tracked, investors informed

---

#### Phase 6: Profit Distribution / Payments

**For Musharakah (Profit-Sharing)**

**Step 6.1: Profit Calculation**
- **Actor**: Business + Platform
- **Actions**:
  1. Business reports quarterly profit
  2. Platform verifies calculation
  3. Calculate platform's profit share per contract (e.g., 30%)
  4. Calculate business's share (e.g., 70%)
- **Output**: Profit distribution amounts determined

**Step 6.2: Platform Receives Profit**
- **Actor**: Business
- **Actions**:
  1. Business transfers platform's profit share
  2. Platform confirms receipt
  3. Adds to platform profit pool
- **Output**: Platform profit received

**Step 6.3: Investor Distribution**
- **Actor**: Platform
- **Actions**:
  1. Platform aggregates all profits from all businesses
  2. Takes Mudarib share (e.g., 20% of platform profits)
  3. Distributes remaining 80% to investors per their capital contribution
  4. Transfers to investor accounts
  5. Notifies investors
- **Output**: Investors receive profit distribution

**For Murabaha/Ijarah (Fixed Payments)**

**Step 6.1: Payment Due**
- **Actor**: Platform System
- **Actions**:
  1. System generates payment reminder
  2. Sends to business 7 days before due date
  3. Business sees payment due in dashboard
- **Output**: Payment reminder sent

**Step 6.2: Business Makes Payment**
- **Actor**: Business
- **Actions**:
  1. Transfer payment amount to platform
  2. Provide payment confirmation/reference
- **Output**: Payment made

**Step 6.3: Platform Confirms Receipt**
- **Actor**: Platform Finance
- **Actions**:
  1. Verify payment received
  2. Record in system
  3. Update business payment schedule
  4. Add to platform revenue for investor distribution
- **Output**: Payment confirmed and recorded

---

#### Phase 7: Contract Settlement

**Step 7.1: Contract Maturity**
- **Trigger**: Contract term ends (e.g., 2 years completed)
- **Actor**: Platform + Business
- **Actions**:
  1. Platform notifies business of upcoming maturity
  2. Business prepares final financial report
  3. Calculate any outstanding obligations

**For Musharakah:**
  - Final profit distribution
  - Return of original capital to investors (not "repayment" but partnership conclusion)
  - Settlement of accounts

**For Murabaha:**
  - Final payment
  - Transfer of asset ownership (if applicable)
  - Contract closure

**For Ijarah:**
  - Final lease payment
  - Asset return to platform OR purchase option exercised
  - Contract closure

- **Output**: Contract obligations fulfilled

**Step 7.2: Final Reconciliation**
- **Actor**: Platform Finance + Manager
- **Actions**:
  1. Verify all obligations met
  2. Return capital to investors (Musharakah)
  3. Generate final report for investors
  4. Archive contract documentation
  5. Update business track record
- **Output**: Contract closed successfully

**Step 7.3: Success Documentation**
- **Actor**: Manager
- **Actions**:
  1. Document business success
  2. Calculate ROI for investors
  3. Update business's platform reputation
  4. Consider for success story feature
  5. Enable business for future reapplication
- **Output**: Success recorded, business eligible for re-financing

---

## 2. Investor Allocation Workflow (Directed Mode)

### Overview
How investors select specific businesses and allocate capital through platform approval.

### Workflow Steps

```
Browse Opportunities → Select Business → Submit Allocation Request → 
Manager Review → Approval/Rejection → Capital Reserved → 
Campaign Closes → Contract Execution → Monitor Performance → 
Receive Distributions
```

---

**Step 1: Investor Browses Opportunities**
- **Actor**: Investor
- **Actions**:
  1. Log in to QistFi platform
  2. Navigate to "Investment Opportunities"
  3. View only manager-approved listings
  4. Apply filters:
     - Industry
     - Risk level
     - Funding amount
     - Contract type
     - Expected returns
  5. Click on opportunity for details
- **Output**: Investor viewing opportunity details

**Step 2: Review Business Details**
- **Actor**: Investor
- **Actions**:
  1. Read business profile
  2. Review financial statements
  3. Check manager's risk assessment
  4. Read Shariah compliance verification
  5. Review proposed contract terms
  6. Ask questions via Q&A (if needed)
- **Output**: Investor informed about opportunity

**Step 3: Submit Allocation Request**
- **Actor**: Investor
- **Actions**:
  1. Decide on allocation amount
  2. Click "Invest in This Business"
  3. Enter investment amount
  4. Review Mudarabah contract terms with platform
  5. Acknowledge risks
  6. Submit allocation request
- **Output**: Allocation request submitted
- **Notification**: Manager receives allocation request

**Step 4: Platform Reviews Request**
- **Actor**: Manager
- **Actions**:
  1. Review allocation request
  2. Check:
     - Is business still open for funding?
     - Would this over-concentrate investor's portfolio?
     - Does investor's risk profile match business risk?
     - Does platform have liquidity?
  3. Make decision:
     - **Approve**: Reserve capital for this business
     - **Reject**: Provide reason (concentration, liquidity, etc.)
     - **Suggest Alternative**: Recommend different opportunity
- **Output**: Decision made

**Step 5: Investor Notified**
- **Actor**: Platform System
- **Actions**:
  1. Send notification to investor:
     - ✅ Approved: Capital reserved, will be deployed when campaign closes
     - ❌ Rejected: Reason provided, capital remains available
     - 💡 Alternative: Different opportunity suggested
  2. If approved, update investor's "Pending Allocations"
  3. If rejected, capital remains in available balance
- **Output**: Investor informed, pending allocation tracked

**Step 6: Campaign Closes**
- **Trigger**: Business reaches funding goal or campaign ends
- **Actor**: Platform
- **Actions**:
  1. Campaign closes
  2. All approved allocations are executed
  3. Platform enters contract with business
  4. Investor's capital officially deployed
  5. Move from "Pending" to "Active Investments"
- **Output**: Investment active

**Step 7: Monitor Performance**
- **Actor**: Investor
- **Actions**:
  1. View investment in portfolio
  2. Receive updates from business (through platform)
  3. See quarterly/monthly financial reports
  4. Track business milestones
  5. Monitor expected vs. actual returns
- **Output**: Investor stays informed

**Step 8: Receive Distributions**
- **Actor**: Investor
- **Actions**:
  1. Business generates profits or makes payments
  2. Platform receives funds
  3. Platform distributes to investor per Mudarabah ratio
  4. Investor receives notification
  5. Funds appear in investor wallet
  6. View distribution history
- **Output**: Investor receives returns

**Step 9: Investment Matures**
- **Actor**: Platform + Investor
- **Actions**:
  1. Contract term ends
  2. Platform returns original capital (Musharakah)
  3. Final distribution made
  4. Investment moves to "Completed"
  5. Investor can reinvest or withdraw
- **Output**: Investment concluded

---

## 3. Investor Pooled Investment Workflow

### Overview
How investors deposit capital into platform-managed pool without selecting specific businesses.

### Workflow Steps

```
Deposit Funds → Enter Mudarabah Pool → Platform Allocates → 
Receive Consolidated Performance Reports → Receive Distributions → 
Withdraw or Reinvest
```

---

**Step 1: Investor Deposits Funds**
- **Actor**: Investor
- **Actions**:
  1. Navigate to "Deposit Funds"
  2. Choose "Pooled Investment" mode
  3. Enter deposit amount
  4. Select payment method
  5. Complete transaction
  6. Review Mudarabah contract with platform
  7. Accept terms
- **Output**: Funds deposited to Mudarabah pool

**Step 2: Platform Manages Allocation**
- **Actor**: Manager
- **Actions**:
  1. Investor's capital enters general pool
  2. Platform has full discretion (Mudarib role)
  3. Platform allocates across:
     - Multiple businesses
     - Different industries
     - Various contract types
     - Balanced risk levels
  4. Investor doesn't select specific businesses
- **Output**: Capital deployed across diversified portfolio

**Step 3: Investor Receives Consolidated Reports**
- **Actor**: Platform
- **Actions**:
  1. Provide monthly/quarterly performance summary
  2. Show:
     - Total portfolio value
     - Overall return rate
     - Number of businesses funded
     - Industry/contract type breakdown
     - Risk distribution
  3. No individual business details (unless opt-in for transparency)
- **Output**: Investor sees pooled performance

**Step 4: Receive Distributions**
- **Actor**: Platform
- **Actions**:
  1. Aggregate profits from all businesses in pool
  2. Platform takes Mudarib share (e.g., 20%)
  3. Distribute remaining to all investors proportionally
  4. Transfer to investor accounts
  5. Investor receives notification
- **Output**: Investor receives profit distribution

**Step 5: Withdraw or Reinvest**
- **Actor**: Investor
- **Actions**:
  1. Investor can:
     - Withdraw profits (request withdrawal)
     - Reinvest profits (keep in pool)
     - Withdraw original capital (subject to liquidity)
  2. Submit withdrawal request if desired
  3. Platform processes (may take a few days for liquidity)
- **Output**: Funds withdrawn or reinvested

---

## 4. Profit Distribution Workflow

### Overview
How the platform calculates and distributes profits from businesses to investors.

### Frequency
Monthly or Quarterly (depending on contract terms)

### Workflow Steps

```
Businesses Report Performance → Platform Calculates Profits → 
Platform Takes Mudarib Share → Distribute to Investors → 
Update Records
```

---

**Step 1: Businesses Submit Performance Reports**
- **Actor**: Businesses
- **Actions**:
  1. All businesses submit quarterly financials
  2. For Musharakah: Report profit/loss
  3. For Murabaha/Ijarah: Make scheduled payments
  4. Upload supporting documentation
- **Output**: Business performance data collected

**Step 2: Platform Verifies & Collects**
- **Actor**: Manager
- **Actions**:
  1. Review and verify each business's report
  2. Confirm profit calculations accurate
  3. For Musharakah: Calculate platform's profit share
  4. Collect payments/profits from businesses
  5. Aggregate total platform profit for period
- **Output**: Total platform profit pool determined

**Step 3: Calculate Platform's Mudarib Share**
- **Actor**: Platform Finance
- **Actions**:
  1. Total platform profit from all businesses = $X
  2. Platform's Mudarib share = X% (e.g., 20%)
  3. Platform keeps this as revenue
  4. Remaining (e.g., 80%) goes to investor pool
- **Output**: Platform revenue and investor pool determined

**Step 4: Calculate Individual Investor Shares**
- **Actor**: Platform System
- **Actions**:
  1. For each investor:
     - Calculate % of total Mudarabah pool
     - Example: Investor A has $10K of $1M pool = 1%
     - Investor A receives 1% of investor profit pool
  2. Generate distribution report for each investor
  3. Prepare payment instructions
- **Output**: Individual investor amounts calculated

**Step 5: Execute Distributions**
- **Actor**: Platform Finance
- **Actions**:
  1. Transfer calculated amounts to each investor account
  2. Update investor statements
  3. Generate distribution receipts
  4. Record transactions
- **Output**: Distributions completed

**Step 6: Notify Investors**
- **Actor**: Platform System
- **Actions**:
  1. Send distribution notification to each investor:
     - Amount received
     - Distribution period
     - Source breakdown (which businesses contributed)
     - Year-to-date total
  2. Update investor dashboard
  3. Make distribution receipt available for download
- **Output**: Investors informed and can view details

**Step 7: Tax Documentation** (End of Year)
- **Actor**: Platform
- **Actions**:
  1. Generate annual distribution summary for each investor
  2. Provide tax forms (if applicable)
  3. Zakah calculation assistance
  4. Export capabilities for investor records
- **Output**: Tax and zakah documentation provided

---

## 5. Manager Due Diligence Workflow

### Overview
Detailed step-by-step process managers follow to evaluate business applications.

*(Covered in detail in Business Financing Workflow Phase 2, summarized here)*

### Workflow Steps

```
Receive Application → Automated Checks → Shariah Review → 
Financial Assessment → Business Model Review → Legal Check → 
Risk Scoring → Contract Selection → Final Decision → 
Notify Business
```

### Timeline
Typical: 3-7 business days from submission to decision

### Key Decision Points
1. **Auto-reject if**: Prohibited industry, incomplete application
2. **Shariah board escalation if**: Complex religious question
3. **Reject if**: Financial health weak, business model unviable, legal issues
4. **Approve if**: All checks pass, risk acceptable
5. **Request more info if**: Gaps in documentation, need clarification

---

## 6. Default Management Workflow

### Overview
How platform handles businesses that underperform or fail to meet obligations.

### Triggers
- Musharakah: Business reports losses for 2+ consecutive quarters
- Murabaha/Ijarah: Missed 2+ consecutive payments
- Any: Business becomes unresponsive

### Workflow Steps

```
Identify Default → Contact Business → Assess Situation → 
Develop Recovery Plan → Execute Recovery → 
Communicate with Investors → Allocate Losses
```

---

**Step 1: Identify Potential Default**
- **Trigger**: Automated alert
  - Late payment (>15 days overdue)
  - Negative cash flow report
  - Business misses reporting deadline
  - Revenue decline >30%
- **Actor**: Platform System
- **Actions**:
  1. System flags business as "at risk"
  2. Alert sent to manager
  3. Move to default monitoring
- **Output**: Business under watch

**Step 2: Manager Contacts Business**
- **Actor**: Manager
- **Actions**:
  1. Send communication to business
  2. Request explanation for default/underperformance
  3. Ask for updated financial situation
  4. Understand root cause:
     - Temporary cash flow issue?
     - Market downturn?
     - Management problems?
     - Fundamental business failure?
  5. Schedule call or meeting
- **Output**: Situation assessment begun

**Step 3: Evaluate Situation**
- **Actor**: Manager
- **Actions**:
  1. Analyze business's explanation
  2. Review latest financials
  3. Assess:
     - Is recovery possible?
     - Is this temporary or permanent?
     - What's the likelihood of turnaround?
  4. Determine category:
     - **Temporary difficulty**: Can be resolved
     - **Serious trouble**: Major intervention needed
     - **Failure**: Unlikely to recover
- **Output**: Situation categorized

**Step 4: Develop Recovery Plan**

**Scenario A: Temporary Difficulty**
- **Actions**:
  1. Negotiate payment plan restructuring
  2. Extend payment deadlines (if Shariah-compliant)
  3. Provide grace period
  4. Require more frequent reporting
  5. Offer business support/mentoring
- **Output**: Recovery plan agreed

**Scenario B: Serious Trouble**
- **Actions**:
  1. Require detailed turnaround plan from business
  2. Consider:
     - Bringing in new management
     - Asset sales to raise cash
     - Cost reduction measures
     - Pivot strategy
  3. Increase monitoring frequency (weekly reports)
  4. May require personal guarantees
  5. Set milestones for improvement
- **Output**: Intensive recovery plan

**Scenario C: Business Failure**
- **Actions**:
  1. Accept that recovery unlikely
  2. Move to liquidation process
  3. Attempt to recover maximum value:
     - Sell assets
     - Collect receivables
     - Negotiate settlements
  4. Prepare for loss allocation to investors
- **Output**: Liquidation initiated

**Step 5: Execute Recovery Actions**
- **Actor**: Manager + Business
- **Actions**:
  1. Implement agreed recovery plan
  2. Monitor progress closely
  3. Adjust as needed
  4. Document all actions taken
- **Output**: Recovery attempt underway

**Step 6: Communicate with Investors**
- **Actor**: Manager
- **Actions**:
  1. Inform investors of situation (transparency)
  2. Explain:
     - What happened
     - Recovery plan being implemented
     - Possible outcomes (best/worst case)
     - Expected timeline
  3. Provide regular updates
  4. Manage investor expectations
- **Output**: Investors informed

**Step 7: Outcome & Loss Allocation**

**Success: Business Recovers**
- Resume normal operations
- Update investors on success
- Continue monitoring closely
- Document lessons learned

**Partial Recovery**
- Recover some capital
- Distribute recovered amount to investors
- Calculate and allocate loss
- Close contract

**Failure: Complete Loss**
- Exhaust all recovery options
- Calculate total loss
- Per Mudarabah rules:
  - Investors bear capital loss (proportional to investment)
  - Platform loses management effort (no Mudarib share from this business)
- Distribute any recovered proceeds
- Allocate remaining loss to investors
- Update investor accounts
- Provide loss documentation for tax purposes

**Step 8: Post-Mortem Analysis**
- **Actor**: Manager
- **Actions**:
  1. Conduct thorough review:
     - What went wrong?
     - Were there warning signs missed?
     - Did due diligence miss something?
  2. Update due diligence procedures
  3. Adjust risk scoring criteria
  4. Improve screening for similar businesses
  5. Share learnings with team
- **Output**: Improved processes

---

## 7. Contract Lifecycle Workflow

### Overview
How different Islamic finance contracts are structured, executed, and concluded.

---

### A. Musharakah (Equity Partnership) Lifecycle

**Contract Setup**
1. Platform and business agree to partnership
2. Platform contributes capital (from Mudarabah pool)
3. Business contributes expertise, management, existing assets
4. Agree on profit-sharing ratio (e.g., Platform 30%, Business 70%)
5. Define loss-sharing: Proportional to capital contributed
6. Set contract duration (e.g., 2 years)

**During Contract**
1. **Business Operations**:
   - Business operates and generates revenue
   - Uses capital for agreed purposes
   - Makes business decisions (with platform oversight)

2. **Reporting** (Quarterly):
   - Submit profit/loss statements
   - Calculate profits after expenses
   - Apply profit-sharing ratio
   - Distribute profits to platform

3. **Platform Monitors**:
   - Review financial reports
   - Verify profit calculations
   - Ensure compliance with terms
   - Support business as needed

**Contract Conclusion**
1. Contract term ends (or early exit agreed)
2. Final profit distribution
3. Platform's capital returned to pool
4. Partnership dissolved
5. Business retains remaining assets and operations

**If Losses Occur**:
- Losses borne by capital providers (investors via platform)
- Business loses time and effort (no compensation)
- No guaranteed return (Shariah-compliant)

---

### B. Murabaha (Cost-Plus Financing) Lifecycle

**Contract Setup**
1. Business identifies specific asset/inventory needed (e.g., equipment)
2. Platform agrees to purchase it
3. Platform buys asset at cost price
4. Platform sells to business at cost + markup (profit)
5. Business pays in installments over agreed period
6. Ownership transfers to business immediately or upon final payment

**Example**:
- Equipment costs $100,000
- Platform markup: $20,000
- Total owed: $120,000
- Payment: $10,000/month for 12 months

**During Contract**
1. Business makes monthly payments
2. Platform tracks payments received
3. If late: Remind business, may charge charity penalty (not interest)
4. Asset belongs to business (or held as collateral)

**Contract Conclusion**
1. All payments completed
2. Full ownership to business (if not already transferred)
3. Platform profit received
4. Contract closed

**Default Scenario**:
- Business misses payments
- Platform may repossess asset
- Sell asset to recover funds
- Difference allocated as loss

---

### C. Ijarah (Leasing) Lifecycle

**Contract Setup**
1. Business needs equipment/asset but prefers not to purchase
2. Platform buys asset
3. Platform leases to business for monthly rental
4. Lease term defined (e.g., 3 years)
5. End-of-lease options agreed:
   - Return asset to platform
   - Purchase at residual value
   - Extend lease

**During Contract**
1. Business pays monthly lease rentals
2. Platform maintains ownership
3. Maintenance responsibilities defined (business or platform)
4. Asset must be maintained in good condition

**Contract Conclusion**

**Option 1: Business Returns Asset**
- Asset returned to platform
- Platform can re-lease or sell

**Option 2: Business Purchases**
- Business pays residual value
- Ownership transfers
- New sale contract executed

**Option 3: Lease Extension**
- New lease term agreed
- New rental amount set
- Continue as before

---

### D. Salam (Forward Sale) Lifecycle

**Contract Setup**
1. Business (farmer/producer) needs capital for production
2. Agree on commodity to be delivered (e.g., 1000 kg wheat)
3. Agree on quality specifications
4. Platform pays full price upfront
5. Delivery date set (after harvest/production)

**During Contract**
1. Business uses capital for production
2. Platform has no involvement in production
3. Business assumes production risk

**Contract Conclusion**
1. Delivery date arrives
2. Business delivers commodity to platform
3. Platform verifies quality meets specifications
4. If quality acceptable: Contract complete
5. If quality unacceptable: Business must replace or compensate
6. Platform sells commodity at market price (profit = market price - salam price)

**Risk**
- Platform bears market price risk (price may fall)
- Business bears production risk (crop failure, etc.)

---

## Workflow Diagrams Summary

Each workflow above follows these patterns:

1. **Initiation**: User action or system trigger
2. **Processing**: Reviews, verifications, calculations
3. **Decision Points**: Approve/reject/escalate
4. **Execution**: Actions taken based on decision
5. **Monitoring**: Ongoing tracking and reporting
6. **Conclusion**: Contract fulfillment and settlement

All workflows maintain:
- ✅ Shariah compliance at every step
- ✅ Transparency to all parties
- ✅ Proper documentation and audit trail
- ✅ Risk management and monitoring
- ✅ Clear communication with stakeholders
