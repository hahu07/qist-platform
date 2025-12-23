# KYC (Know Your Customer) Requirements

## Overview

After completing onboarding, all members (investors) must complete KYC verification before they can access investment opportunities. This is a regulatory requirement to ensure compliance with anti-money laundering (AML) and counter-terrorism financing (CTF) regulations.

## User Flow

1. **Complete Onboarding** → User fills out investor profile (individual or corporate)
2. **Redirect to KYC** → Success page prompts immediate KYC completion
3. **Upload Documents** → User uploads required identity/business documents
4. **Compliance Review** → Admin team reviews documents (2-3 business days)
5. **Account Activation** → User receives notification and gains full platform access

## KYC Status States

- **`pending`**: Initial state after onboarding, no documents submitted yet
- **`in-review`**: Documents submitted and under compliance team review
- **`verified`**: KYC approved, full platform access granted
- **`rejected`**: Documents rejected, user must resubmit with corrections

## Required Documents

### Individual Investors

#### Required (3 documents):
1. **Government-issued ID**
   - Passport, National ID, or Driver's License
   - Must be valid (not expired)
   - Photo must be clear and legible

2. **Proof of Address**
   - Utility bill, bank statement, or government letter
   - Must be dated within last 3 months
   - Address must match profile information

3. **Selfie with ID**
   - Photo of applicant holding their ID document
   - Face and ID details must be clearly visible
   - Used for biometric verification

#### Optional (helps expedite):
4. **Source of Funds Documentation**
   - Salary slips, business registration, bank statements
   - Demonstrates legitimacy of investment capital

### Corporate Investors

#### Required (3 documents minimum):
1. **Certificate of Incorporation**
   - Official company registration certificate
   - Must show company name, registration number, and date

2. **Business Registration Documents**
   - Tax registration certificate
   - Business license or permit
   - Memorandum/Articles of Association

3. **Authorized Representative's ID**
   - Government-issued ID of the signatory
   - Must match representative details in onboarding

#### Optional (recommended):
4. **Beneficial Owners' IDs**
   - ID documents for all owners with 25%+ ownership
   - Required for enhanced due diligence
   - Helps prevent delays in verification

5. **Proof of Business Address**
   - Utility bill or lease agreement for business premises
   - Recent bank statement showing business address

6. **Financial Statements**
   - Recent company financial reports
   - Bank reference letter
   - Demonstrates company financial standing

## Document Guidelines

### Accepted Formats
- PDF (preferred)
- JPG/JPEG
- PNG

### File Size
- Maximum 10MB per file
- Compress large files before uploading

### Quality Requirements
- All text must be clear and legible
- No cut-off edges or missing corners
- Color scans preferred over black & white
- No watermarks or alterations

## Implementation Details

### Routes
- `/member/kyc` - Main KYC upload page
- `/member/onboarding/success` - Post-onboarding landing (redirects to KYC)
- `/member/dashboard` - Shows KYC alert if not verified

### Components
- `src/app/member/kyc/page.tsx` - KYC document upload interface
- `src/components/kyc-alert.tsx` - Dashboard alert component

### Data Storage
- **Collection**: `kyc_documents`
- **Access**: Owner-only (user who uploaded)
- **Metadata**: Stored in `investor_profiles` collection under `kycDocuments` field

### Schema Fields (Investor Profile)
```typescript
{
  kycStatus: "pending" | "in-review" | "verified" | "rejected",
  kycDocuments: string[], // Array of download URLs
  kycSubmittedAt: bigint, // Timestamp when submitted
  kycVerifiedAt: bigint, // Timestamp when approved (optional)
  kycRejectionReason: string // Reason if rejected (optional)
}
```

## Security & Privacy

### Data Protection
- All documents encrypted at rest
- Only accessible by user and authorized admin
- Stored on decentralized Internet Computer storage
- No third-party access

### Access Control
- Users can only view their own documents
- Admin/compliance team has read-only access for review
- Audit trail maintained for all document access

### Retention Policy
- Documents retained for regulatory compliance (7 years minimum)
- Users can request deletion after account closure
- Anonymization after retention period

## Compliance Review Process

### Admin Workflow
1. **Notification** - Admin receives alert when documents submitted
2. **Document Review** - Check all documents for completeness and validity
3. **Verification** - Cross-reference information with profile data
4. **Decision** - Approve, reject, or request additional information
5. **Communication** - Notify user of decision via email/dashboard

### Approval Criteria
- All required documents submitted
- Documents are valid and not expired
- Information matches profile data
- No red flags or discrepancies
- Beneficial ownership transparency (for corporate)

### Rejection Reasons
- Expired or invalid documents
- Poor quality/illegible scans
- Information mismatch
- Missing required documents
- Suspicious activity indicators

## User Experience

### KYC Alert on Dashboard
- Prominent banner at top of dashboard
- Different styles based on status (pending/in-review/rejected)
- Clear call-to-action button
- Can be dismissed if status is "pending" (saved in localStorage)
- Non-dismissible for "rejected" status

### Success Page Flow
After onboarding completion:
1. Shows success message
2. Highlights KYC as next required step
3. Primary action: "Complete KYC Verification"
4. Secondary action: "Skip for Now" (goes to dashboard)
5. Dashboard will still show alert if skipped

### Mobile Responsiveness
- Upload interface works on mobile devices
- Camera integration for selfie capture
- Document scanning using device camera
- Progress saving (can continue later)

## Testing Scenarios

### Individual Investor
1. Complete individual onboarding
2. Redirected to success page
3. Click "Complete KYC Verification"
4. Select "Individual Investor"
5. Upload 3 required documents
6. Submit for review
7. Status changes to "in-review"
8. Dashboard shows "under review" alert

### Corporate Investor
1. Complete corporate onboarding
2. Navigate to KYC page
3. Select "Corporate Investor"
4. Upload required company documents
5. Upload optional beneficial owner docs
6. Submit for review
7. Receive confirmation

### Rejection & Resubmission
1. Admin rejects KYC with reason
2. User sees rejection alert on dashboard
3. Click "Resubmit Documents"
4. Upload corrected documents
5. Resubmit for review

## Future Enhancements

### Planned Features
- [ ] Automated ID verification using OCR/AI
- [ ] Real-time document quality checks
- [ ] Integration with third-party KYC providers (e.g., Onfido, Jumio)
- [ ] Progressive disclosure (upload in stages)
- [ ] Video KYC for high-value investors
- [ ] Blockchain-based credential verification
- [ ] Multi-language support for documents

### Analytics
- Track KYC completion rate
- Average time to verification
- Common rejection reasons
- Document quality metrics
- Compliance team workload

## Regulatory Compliance

### Standards Followed
- **FATF Recommendations** - Financial Action Task Force guidelines
- **AML/CTF** - Anti-Money Laundering and Counter-Terrorism Financing
- **KYC/CDD** - Customer Due Diligence standards
- **Beneficial Ownership** - Ultimate Beneficial Owner (UBO) identification

### Jurisdictional Requirements
System supports multi-jurisdiction compliance:
- Different requirements based on user's country
- Accredited investor verification (where applicable)
- Enhanced due diligence for high-risk countries
- Ongoing monitoring and periodic re-verification

## Support & Assistance

### Help Resources
- In-app document guidelines
- FAQ section on KYC requirements
- Support email: compliance@amanatrade.com
- Live chat for urgent queries

### Common Issues
1. **Document Rejected** - Check quality and validity
2. **Upload Failed** - Reduce file size or change format
3. **Status Not Updated** - Allow 2-3 business days for review
4. **Missing Documents** - Review checklist carefully

## API/Backend Hooks

### Satellite Functions (Rust)
```rust
#[on_upload_asset]
fn validate_kyc_document(context: OnUploadAssetContext) -> Result<(), String> {
    // Validate file type and size
    // Check user permissions
    // Log upload event
}

#[on_set_doc]
fn update_kyc_status(context: OnSetDocContext) -> Result<(), String> {
    // Validate status transition
    // Trigger notifications
    // Update investor profile
}
```

### Frontend Integration
```typescript
// Upload document
await uploadFile({
  collection: "kyc_documents",
  data: file,
  filename: `${userId}_${docType}_${timestamp}_${filename}`,
});

// Update KYC status (use appropriate collection based on investor type)
const collection = investorType === "individual" 
  ? "individual_investor_profiles" 
  : "corporate_investor_profiles";

await setDoc({
  collection,
  doc: {
    key: userId,
    data: {
      kycStatus: "in-review",
      kycDocuments: [...documentUrls],
      kycSubmittedAt: BigInt(Date.now()),
    },
  },
});
```

## Monitoring & Alerts

### For Compliance Team
- Email notification when documents submitted
- Dashboard showing pending KYC reviews
- SLA tracking (must review within 72 hours)
- Quality metrics and analytics

### For Users
- Email confirmation when documents received
- Push notification when status changes
- Dashboard alert for rejected status
- Reminder emails if KYC incomplete after 7 days
