# KYC Requirements Summary

## What We Need from Members (Investors)

### For Individual Investors (Personal Accounts)

**REQUIRED - 3 Documents:**

1. **Government-Issued Photo ID**
   - Passport, National ID Card, or Driver's License
   - Must be valid and not expired
   - All information clearly visible

2. **Proof of Residential Address**
   - Recent utility bill (electricity, water, gas)
   - Bank statement
   - Government-issued correspondence
   - **Must be dated within the last 3 months**

3. **Selfie/Photo Holding ID**
   - Applicant holding their ID document next to their face
   - Both face and ID details clearly visible
   - Used for biometric identity verification

**OPTIONAL (but helpful):**
- Source of funds documentation (salary slips, bank statements)

---

### For Corporate Investors (Company Accounts)

**REQUIRED - Minimum 3 Documents:**

1. **Certificate of Incorporation**
   - Official company registration certificate
   - Shows legal company name and registration number

2. **Business Registration Documents**
   - Tax ID/registration
   - Business license or permit
   - Articles of Association/Memorandum

3. **Authorized Representative's ID**
   - Government-issued photo ID of the person authorized to act on behalf of the company
   - Must match the representative information provided during onboarding

**RECOMMENDED (for faster approval):**
- **Beneficial Owners' IDs** - ID documents for all individuals owning 25% or more of the company
- **Proof of Business Address** - Utility bill or lease agreement for business premises
- **Company Financial Statements** - Recent financial reports or bank reference letter

---

## Implementation Flow

### User Journey After Onboarding:

```
1. User completes onboarding form
   ↓
2. Redirected to success page
   ↓
3. Prompted: "Complete KYC Verification" (primary action)
   ↓
4. Directed to /member/kyc page
   ↓
5. Selects investor type (Individual or Corporate)
   ↓
6. Uploads required documents
   ↓
7. Submits for compliance review
   ↓
8. KYC status changes to "in-review"
   ↓
9. Dashboard shows alert: "Documents under review"
   ↓
10. Admin reviews (2-3 business days)
   ↓
11. Status changes to "verified" or "rejected"
   ↓
12. User notified via email/dashboard
   ↓
13. If verified: Full platform access granted
    If rejected: Prompt to resubmit with corrections
```

### If User Skips KYC:
- They can click "Skip for Now" on success page
- Dashboard shows **prominent KYC alert banner** every time they log in
- Alert is color-coded based on status:
  - 🟡 **Pending** (Yellow) - "Complete Your KYC Verification"
  - 🔵 **In-Review** (Blue) - "KYC Documents Under Review"
  - 🔴 **Rejected** (Red) - "KYC Verification Rejected - Resubmit"
  - ✅ **Verified** (Green) - No alert shown

---

## Document Technical Requirements

- **Formats**: PDF, JPG, PNG
- **Max File Size**: 10MB per file
- **Quality**: Clear, legible, no cut-off edges
- **Validity**: Documents must not be expired
- **Recency**: Proof of address must be within 3 months

---

## What Compliance Team Checks

1. ✅ All required documents submitted
2. ✅ Documents are valid and current
3. ✅ Information matches onboarding profile
4. ✅ Photo ID matches selfie (facial verification)
5. ✅ Address on proof matches profile address
6. ✅ For corporate: Beneficial ownership transparency
7. ✅ No suspicious activity or red flags

---

## Data Security

- All documents stored on decentralized Internet Computer storage
- Encrypted at rest
- Only accessible by user and authorized compliance team
- Audit trail for all access
- 7-year retention for regulatory compliance

---

## Key Files Created

1. **`/src/app/member/kyc/page.tsx`** - KYC document upload interface
2. **`/src/components/kyc-alert.tsx`** - Dashboard alert component
3. **`/docs/kyc-requirements.md`** - Full documentation
4. **Updated**: Success page redirects to KYC
5. **Updated**: Dashboard shows KYC alert banner

---

## Quick Reference: What Members Upload

| Investor Type | Doc 1 | Doc 2 | Doc 3 | Optional |
|--------------|-------|-------|-------|----------|
| **Individual** | Photo ID | Proof of Address | Selfie with ID | Source of Funds |
| **Corporate** | Incorporation Cert | Business Registration | Representative ID | Beneficial Owner IDs, Business Address, Financials |

---

## Testing the Flow

1. Run the app: `npm run dev`
2. Complete onboarding as individual or corporate
3. Click "Complete KYC Verification" on success page
4. Upload 3 required documents
5. Submit for review
6. Check dashboard - should see "in-review" alert
7. (Admin would then approve/reject)

The system is now fully ready for KYC implementation! 🎉
