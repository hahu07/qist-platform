# Business Dashboard Contract Terms Integration

## Overview
Integrated contract terms review status into the business dashboard, allowing businesses to see admin responses (approved, counter-offer, revision request) to their proposed contract terms.

## What Was Implemented

### 1. ContractTermsStatus Component (`/src/components/business/contract-terms-status.tsx`)
**Purpose**: Display contract terms status and admin actions on the business dashboard.

**Features**:
- ✅ **4 Status States**:
  1. **Pending/Under Review**: Terms submitted, awaiting admin review
  2. **Approved**: Admin approved the proposed terms
  3. **Counter Offer**: Admin proposed alternative terms with comparison view
  4. **Revision Requested**: Admin asks business to revise terms with feedback

**UI Components**:
- ✅ Color-coded alert cards matching design system:
  - Green: Approved
  - Blue: Counter Offer
  - Amber: Revision Requested
  - Neutral: Pending Review
- ✅ Animated spinner for pending status
- ✅ Side-by-side comparison table for counter offers
- ✅ Justification message display for admin feedback
- ✅ Call-to-action buttons linking to application form

**Counter Offer Comparison**:
- Shows original proposal vs admin counter offer
- Highlights key differences (profit rates, shares, rental amounts)
- Displays admin's justification message
- Contract-type specific fields:
  - **Murabaha**: Profit rate, cost price
  - **Mudarabah/Musharakah**: Profit share percentages
  - **Ijarah**: Monthly rental amount

### 2. Business Dashboard Integration (`/src/app/business/dashboard/page.tsx`)

**Changes**:
- ✅ Added import for `ContractTermsStatus` component
- ✅ Renders status card between rejection history and application status
- ✅ Automatically shows/hides based on application state:
  - Only shows if application has `contractTerms`
  - Hides for fully approved applications (no action needed)
  - Shows for pending, more-info, and review statuses

**Placement**: Inserted after `RejectionHistoryView` and before status badge

### 3. Schema Updates (`/src/schemas/application.schema.ts`)

**New Fields Added**:
```typescript
contractTermsStatus: z.enum(["pending", "approved", "counter-offered", "revision-requested"]).optional()
contractTermsCounterOffer: z.any().optional()        // Admin's alternative terms
contractTermsRevisionMessage: z.string().optional()   // Admin's feedback
finalContractTerms: z.any().optional()               // Locked terms after agreement
```

## Complete Workflow

### Admin Side (Already Implemented)
1. Admin reviews application in admin panel
2. Clicks "Contract Terms" tab
3. Sees business's proposed terms
4. Takes action:
   - **Approve** → Sets `contractTermsStatus: 'approved'`
   - **Counter Offer** → Sets `contractTermsStatus: 'counter-offered'` + stores counter terms
   - **Request Revision** → Sets `contractTermsStatus: 'revision-requested'` + stores message

### Business Side (Now Implemented)
1. Business submits application with contract terms
2. Business views dashboard
3. Sees contract terms status card with one of these states:

#### State 1: Terms Under Review (Pending)
```
📊 Contract Terms Under Review
Your murabaha contract terms are currently being reviewed by the institution. 
You'll be notified once they're approved or if changes are requested.
```

#### State 2: Terms Approved ✅
```
✓ Contract Terms Approved
Your proposed murabaha contract terms have been approved by the institution. 
Your application will now proceed to final approval.
```

#### State 3: Counter Offer Received 🔄
```
⇄ Counter Offer Received
The institution has proposed alternative terms for your murabaha contract.

┌─────────────────┬─────────────────┐
│ Your Proposal   │ Counter Offer   │
├─────────────────┼─────────────────┤
│ Profit Rate: 20%│ Profit Rate: 15%│
│ Cost: ₦2,000,000│ Cost: ₦2,000,000│
└─────────────────┴─────────────────┘

Justification: "Based on similar transactions, 15% is more market-aligned..."

[Review Counter Offer] button
```

#### State 4: Revision Requested ⚠️
```
✎ Contract Terms Need Revision
The institution has requested changes to your proposed contract terms:

"Please provide more details about your capital sources and revise your 
 profit share expectations based on market standards."

[Revise Contract Terms] button
```

## User Actions

### When Business Sees Counter Offer
1. Click "Review Counter Offer" button
2. Redirects to `/business/financing/apply`
3. Business can:
   - Accept counter offer (update application with counter terms)
   - Decline and withdraw
   - Propose new terms (negotiation continues)

### When Business Sees Revision Request
1. Click "Revise Contract Terms" button
2. Redirects to `/business/financing/apply`
3. Business revises terms based on feedback
4. Resubmits application
5. Admin reviews revised terms

## Technical Implementation Details

### Component Logic
- Component only renders if `application.data.contractTerms` exists
- Hides when `application.data.status === 'approved'` (no action needed)
- Maps `contractTermsStatus` to appropriate UI state
- Reads contract type to show relevant fields in comparison

### State Transitions
```
Business Submits → contractTermsStatus: undefined/pending
                ↓
Admin Reviews  → contractTermsStatus: 'approved' | 'counter-offered' | 'revision-requested'
                ↓
Business Views Dashboard → See status card
                ↓
Business Takes Action → Update contractTerms, resubmit
                ↓
Loop continues until terms approved
```

### Data Flow
1. **Application Document** (Juno datastore):
   - `contractTerms`: Original business proposal
   - `contractTermsStatus`: Current status
   - `contractTermsCounterOffer`: Admin's alternative (if counter-offered)
   - `contractTermsRevisionMessage`: Admin's feedback (if revision requested)
   - `finalContractTerms`: Locked terms (after approval)

2. **Dashboard Reads**:
   - Fetches application from `business_applications` collection
   - Passes to `ContractTermsStatus` component
   - Component renders appropriate state

3. **Application Form** (Future Enhancement):
   - Pre-populate with counter offer if accepting
   - Show revision message as guidance
   - Allow editing and resubmission

## Visual Design

### Color Scheme (Matches Platform Design)
- **Approved**: Green gradient (`from-green-50 to-emerald-50`)
- **Counter Offer**: Blue gradient (`from-blue-50 to-indigo-50`)
- **Revision**: Amber gradient (`from-amber-50 to-orange-50`)
- **Pending**: Neutral gradient (`from-neutral-50 to-neutral-100`)

### Card Structure
- Icon badge (left) - Visual indicator
- Content area (center) - Status, message, details
- Action button (bottom) - CTA to next step
- Background pattern - Decorative circle (top-right)

### Comparison Table (Counter Offer)
- 2-column grid with divider
- Left: "Your Proposal" (neutral colors)
- Right: "Counter Offer" (blue highlight)
- Bottom: Justification banner (blue background)

## Files Modified/Created

### New Files
1. `/src/components/business/contract-terms-status.tsx` (350 lines)
   - ContractTermsStatus main component
   - CounterOfferDetails sub-component
   - ComparisonItem helper component

### Modified Files
1. `/src/app/business/dashboard/page.tsx`
   - Added import for ContractTermsStatus
   - Rendered component in application section
   
2. `/src/schemas/application.schema.ts`
   - Added 4 new optional fields for contract terms workflow

### Documentation
1. `/docs/BUSINESS-DASHBOARD-CONTRACT-TERMS.md` (this file)

## Testing Checklist

### ✅ Build Status
- [x] TypeScript compilation passes
- [x] Production build successful
- [x] No linting errors

### 🧪 Manual Testing Required
- [ ] Submit application with contract terms
- [ ] Admin approves terms → Business sees green "Approved" card
- [ ] Admin counter-offers → Business sees blue card with comparison
- [ ] Admin requests revision → Business sees amber card with feedback
- [ ] Click "Review Counter Offer" → Redirects to apply page
- [ ] Click "Revise Contract Terms" → Redirects to apply page
- [ ] Verify card doesn't show for applications without contract terms
- [ ] Verify card hides when application fully approved

### 🔄 Integration Testing
- [ ] Admin action updates → Business dashboard reflects change
- [ ] Multiple applications → Correct status for each
- [ ] Status transitions → UI updates accordingly
- [ ] Dark mode → All colors/gradients work correctly

## Future Enhancements

### Phase 1: Application Form Integration
- [ ] Pre-populate form with counter offer terms when business clicks button
- [ ] Show admin's revision message prominently at top of form
- [ ] Add "Accept Counter Offer" quick action button
- [ ] Track negotiation history (how many rounds)

### Phase 2: Real-Time Notifications
- [ ] Push notification when admin responds to terms
- [ ] Email notification with summary of counter offer
- [ ] In-app notification badge on dashboard
- [ ] WebSocket updates for instant status changes

### Phase 3: Advanced Negotiation
- [ ] Chat interface for term negotiation
- [ ] Suggest compromise terms automatically
- [ ] Compare against similar approved applications
- [ ] Show market-standard terms for reference

### Phase 4: Analytics
- [ ] Track average negotiation rounds
- [ ] Show acceptance rate of counter offers
- [ ] Display time-to-approval metrics
- [ ] Generate negotiation reports

## Business Impact

### Improved Transparency
- Businesses now see exactly what's happening with their terms
- No more "black box" - clear visibility into admin decisions
- Justification messages build trust

### Faster Resolution
- Clear call-to-action buttons guide next steps
- Side-by-side comparison helps quick decisions
- No need to email/call for status updates

### Better Outcomes
- Businesses can counter-counter-offer (iterative negotiation)
- Revision requests provide specific guidance
- Higher chance of eventual approval through collaboration

## Success Metrics

**Completion**: ✅ All features implemented and building successfully

**Key Achievements**:
1. ✅ Business dashboard shows all 4 contract terms statuses
2. ✅ Counter offer comparison view implemented
3. ✅ Revision request feedback display working
4. ✅ Schema updated with new fields
5. ✅ Component integrated seamlessly into existing dashboard
6. ✅ Build passing with no errors

**Ready for**: Manual testing and QA validation

---

**Implementation Date**: December 26, 2025  
**Status**: ✅ Complete - Ready for Testing  
**Build Status**: ✅ Passing (TypeScript, Production Build)
