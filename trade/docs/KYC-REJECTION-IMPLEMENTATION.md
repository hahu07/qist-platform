# KYC Rejection & Request More Info Implementation

## Overview
Implemented comprehensive rejection and "request more information" functionality for the admin KYC review process, matching the existing business financing application flow.

## Implementation Date
December 26, 2025

## Changes Made

### 1. Schema Updates

#### `/src/schemas/investor.schema.ts`
- **Added admin feedback fields to `baseInvestorFields`:**
  - `adminMessage`: Optional string for admin notes/feedback
  - `rejectionReason`: Optional string for rejection reason label
  - `rejectionAllowsResubmit`: Optional boolean (if false, member cannot resubmit)
  - `requestedAt`: Optional ISO timestamp when more info was requested
  - `approvedAt`: Optional ISO timestamp when KYC was approved
  - `approvedBy`: Optional string for admin user key
  - `rejectedAt`: Optional ISO timestamp when KYC was rejected
  - `rejectedBy`: Optional string for admin user key

- **Added `kycRejectionReasons` constant:**
  ```typescript
  export const kycRejectionReasons = {
    resubmittable: [
      { value: "incomplete-documents", label: "Incomplete or missing KYC documents" },
      { value: "unclear-id-photo", label: "ID document photo is unclear or illegible" },
      { value: "expired-id", label: "Identification document has expired" },
      { value: "address-proof-needed", label: "Proof of address is required or unclear" },
      { value: "document-mismatch", label: "Documents contain mismatched information" },
      { value: "additional-info-needed", label: "Additional information or clarification needed" },
    ],
    permanent: [
      { value: "fraudulent-documents", label: "Fraudulent or falsified documents detected" },
      { value: "sanctions-list", label: "Individual/entity appears on sanctions list" },
      { value: "pep-high-risk", label: "Politically Exposed Person - high risk profile" },
      { value: "prohibited-jurisdiction", label: "Resident of prohibited jurisdiction" },
      { value: "criminal-record", label: "Criminal record or adverse media findings" },
      { value: "age-restriction", label: "Does not meet minimum age requirement" },
      { value: "duplicate-account", label: "Duplicate account already exists" },
      { value: "kyc-permanently-failed", label: "KYC verification permanently failed" },
    ]
  };
  ```

#### `/src/schemas/index.ts`
- Exported `kycRejectionReasons` from investor schema

### 2. Admin KYC Review Page Updates

#### `/src/app/admin/kyc-review/page.tsx`

**New State Variables:**
- `showRejectionDialog`: Boolean to control rejection modal visibility
- `investorToReject`: Investor document to be rejected
- `rejectionReason`: Selected rejection reason value
- `customRejectionMessage`: Optional admin message
- `rejectionAllowsResubmit`: Boolean flag (true = fixable, false = permanent)
- `showRequestInfoDialog`: Boolean to control request info modal visibility
- `requestInfoMessage`: Message requesting additional information
- `processing`: Boolean to prevent duplicate submissions

**Updated Functions:**

1. **`handleRejectKYC()`** - Enhanced rejection handler:
   - Validates rejection reason is selected
   - Finds human-readable label for rejection reason
   - Saves rejection data including:
     - `kycStatus: 'rejected'`
     - `rejectionReason`: Human-readable label
     - `rejectionAllowsResubmit`: Boolean flag
     - `adminMessage`: Custom message or reason label
     - `rejectedAt`: ISO timestamp
     - `rejectedBy`: Admin user key
   - Clears form state after successful rejection
   - Shows success/error alerts

2. **`handleRequestInfo()`** - Enhanced request info handler:
   - Validates message is provided
   - Updates investor profile with:
     - `kycStatus: 'pending'`
     - `adminMessage`: Admin's request message
     - `requestedAt`: ISO timestamp
   - Clears form state after success
   - Shows success/error alerts

**Updated UI:**
- Modified action buttons to open dialogs instead of direct actions
- Added `disabled` and `processing` states to prevent duplicate submissions

**New Modals:**

1. **KYC Rejection Dialog** (`showRejectionDialog`):
   - Header with investor name and close button
   - Rejection Type Selection:
     - "Fixable Issue" (allows resubmission)
     - "Permanent Rejection" (blocks resubmission)
   - Rejection Reason Selection:
     - Radio buttons for resubmittable or permanent reasons
     - Changes based on rejection type selected
   - Optional custom message textarea
   - Warning box for permanent rejections
   - Cancel and Confirm buttons

2. **Request More Information Dialog** (`showRequestInfoDialog`):
   - Header with investor name and close button
   - Message textarea with:
     - Character counter (500 max suggested)
     - Placeholder with example text
     - Clear instructions
   - Informational note about status change
   - Cancel and Send buttons

### 3. Member Dashboard Updates

#### `/src/components/kyc-alert.tsx`

**Props Updated:**
- Added `profile?: InvestorProfile | null` prop to access rejection details

**New Variables:**
- `rejectionReason`: Extracted from profile
- `adminMessage`: Extracted from profile
- `canResubmit`: Checks if `rejectionAllowsResubmit !== false`

**Updated `rejected` Config:**
- Dynamic title based on `canResubmit` flag
- Dynamic message based on resubmission eligibility
- Dynamic button text and link (Support vs. Resubmit)

**New UI Elements:**

1. **Rejection Details Section** (shows when KYC is rejected):
   - White/dark card with rejection reason
   - Shows admin message if different from reason
   - Warning banner for permanent rejections
   - Styled with error colors

2. **Admin Request Section** (shows when KYC is pending with admin message):
   - White/dark card with warning styling
   - Shows admin's request for more information
   - Helps member understand what to provide

#### `/src/app/member/dashboard/page.tsx`
- Updated `<KYCAlert>` component call to pass `profile={investorProfile}`

## User Flows

### Admin Rejection Flow
1. Admin clicks "Reject KYC" button on investor detail modal
2. Rejection dialog opens with investor name
3. Admin selects rejection type (Fixable vs. Permanent)
4. List of appropriate rejection reasons appears
5. Admin selects specific reason
6. (Optional) Admin adds custom message with more details
7. Warning appears for permanent rejections
8. Admin clicks "Confirm Rejection"
9. Investor profile updated with rejection data
10. Modal closes, list refreshes

### Admin Request More Info Flow
1. Admin clicks "Request Info" button on investor detail modal
2. Request info dialog opens with investor name
3. Admin types message explaining what's needed
4. Character counter shows message length
5. Info note explains status will change to pending
6. Admin clicks "Send Request"
7. Investor profile updated with pending status and message
8. Modal closes, list refreshes

### Member View Flow (Rejected)
1. Member logs into dashboard
2. KYC Alert displays with error styling
3. If fixable:
   - Shows "KYC Verification Rejected" title
   - Displays rejection reason and admin message
   - Shows "Resubmit Documents" button → links to `/member/kyc`
4. If permanent:
   - Shows "KYC Verification Permanently Rejected" title
   - Displays rejection reason with warning banner
   - Shows "Contact Support" button → links to `/support`

### Member View Flow (More Info Requested)
1. Member logs into dashboard
2. KYC Alert displays with warning styling
3. Shows "Additional Information Requested" section
4. Displays admin's message with specific requirements
5. "Complete KYC Now" button → links to `/member/kyc`

## Design Patterns

### Consistency with Business Applications
This implementation mirrors the business financing application flow:
- Same modal structure and styling
- Same rejection type selection (Fixable vs. Permanent)
- Same categorized rejection reasons
- Same admin message flow
- Same user feedback display

### Neuomorphic Design System
All modals follow the platform's design system:
- Border: `border-[3px] border-black` or semantic colors
- Shadow: `shadow-[8px_8px_0px_rgba(0,0,0,1)]`
- Dark mode: `dark:shadow-[8px_8px_0px_#7888FF]`
- Rounded corners: `rounded-2xl` for modals
- Transition: `transition-all` for smooth interactions

### Accessibility
- ARIA labels on close buttons
- Keyboard navigation supported
- Focus management in modals
- Clear error/success messages
- Color is not the only indicator (icons + text)

## Database Fields Summary

| Field | Type | Purpose |
|-------|------|---------|
| `kycStatus` | enum | "pending", "in-review", "verified", "rejected" |
| `rejectionReason` | string | Human-readable rejection reason label |
| `rejectionAllowsResubmit` | boolean | If false, member cannot resubmit |
| `adminMessage` | string | Admin's custom message or request |
| `requestedAt` | ISO string | When admin requested more info |
| `approvedAt` | ISO string | When KYC was approved |
| `approvedBy` | string | Admin user key who approved |
| `rejectedAt` | ISO string | When KYC was rejected |
| `rejectedBy` | string | Admin user key who rejected |

## Testing Checklist

- [x] Schema compiles without errors
- [x] Admin page compiles without errors
- [x] KYCAlert component compiles without errors
- [x] Member dashboard compiles without errors
- [ ] Test rejection with fixable reason
- [ ] Test rejection with permanent reason
- [ ] Test request more information flow
- [ ] Test member view of rejection details
- [ ] Test member view of info request
- [ ] Test resubmission prevention for permanent rejections

## Future Enhancements

1. **Email Notifications:**
   - Send email when KYC is rejected
   - Send email when more info is requested
   - Include rejection reason and admin message

2. **Admin Audit Log:**
   - Track all rejection actions
   - Track all info requests
   - Display in admin dashboard

3. **Member Response Tracking:**
   - Track when member resubmits after rejection
   - Track when member provides requested info
   - Show resubmission count

4. **Templates:**
   - Pre-written message templates for common requests
   - Quick-select rejection reasons with auto-filled messages
   - Multi-language support for messages

5. **Document-Specific Feedback:**
   - Allow admins to comment on specific documents
   - Highlight which documents need attention
   - Visual indicators on document cards

## Related Files

- `/src/schemas/investor.schema.ts` - Investor profile schema with rejection fields
- `/src/schemas/application.schema.ts` - Reference for business rejection patterns
- `/src/app/admin/kyc-review/page.tsx` - Admin KYC review interface
- `/src/components/kyc-alert.tsx` - Member-facing KYC status alert
- `/src/app/member/dashboard/page.tsx` - Member dashboard
- `/src/app/admin/business-applications/page.tsx` - Reference implementation

## Notes

- All rejection reasons are predefined to ensure consistency
- Permanent rejections require extra confirmation (visual warning)
- Admin messages are preserved even when status changes
- Member can see feedback immediately after admin action
- System prevents accidental resubmissions for permanent rejections
