# Business Financing Serverless Functions Module

This module contains **Rust-based serverless functions** that act as **gatekeepers** between the QIST Platform frontend and the Juno backend datastore. These functions enforce critical business rules, validate data integrity, and provide security controls that cannot be bypassed by frontend manipulation.

## Module Structure

```
src/satellite/src/business_financing/
├── mod.rs                              # Module exports
├── financial_data_validation.rs        # Revenue report & profit calculations
├── business_application_validation.rs  # Application approval enforcement
├── investment_opportunity_validation.rs # Opportunity creation & investment rules
├── document_validation.rs              # File upload security & validation
├── revenue_report_validation.rs        # Monthly/quarterly report validation
├── islamic_contract_validation.rs      # Islamic finance contract-specific rules
├── kyc_compliance.rs                   # KYC, BVN, Shariah compliance checks
├── access_control.rs                   # Role-based access & admin operations
└── admin_permissions.rs                # Admin authorization & permission management
```

## Critical Gatekeepers Implemented

### 1. **Business Application Approval** (`assert_set_doc`)
**File:** `business_application_validation.rs`

**Purpose:** Ensures applications cannot be approved until due diligence is 100% complete.

**Enforces:**
- ✅ Due diligence score must be exactly 100%
- ✅ All required fields present (business name, amount, contract type, etc.)
- ✅ Requested amount between ₦100,000 and ₦100,000,000
- ✅ Valid contract type (musharaka, mudaraba, murabaha, ijara, istisna)
- ✅ Documents submitted
- ✅ Reviewer information present
- ✅ Years in operation within valid range (0-200)

**Example Error:**
```
❌ Cannot approve: Due diligence only 75% complete. Must be 100%
```

### 2. **Revenue Report Validation** (`on_set_doc`)
**Files:** `financial_data_validation.rs`, `revenue_report_validation.rs`, `islamic_contract_validation.rs`

**Purpose:** Validates financial calculations, prevents fraudulent reporting, and enforces Islamic finance contract compliance.

**Enforces:**
- ✅ Net Profit = Total Revenue - Total Expenses (auto-calculated)
- ✅ Gross Profit = Revenue - COGS (auto-calculated)
- ✅ Period dates logical (start < end, no future dates)
- ✅ Document requirements (4 for monthly, 5 for quarterly)
- ✅ No overlapping report periods (anti-fraud)
- ✅ **NEW: Contract-specific Islamic finance rules**

**Contract-Specific Validations:**

**Murabaha (Cost-Plus Financing):**
- ✅ Markup cannot exceed 30% of asset cost (Islamic guideline)
- ✅ Remaining balance calculation accuracy
- ✅ Installment math verification

**Mudaraba (Trust Financing):**
- ✅ Profit shares must sum to exactly 100%
- ✅ Actual profit distribution matches agreed ratios (±2% tolerance)
- ✅ Capital must be positive

**Musharaka (Partnership):**
- ✅ Partner profit shares must sum to 100%
- ✅ Actual profit distribution matches agreed ratios (±2% tolerance)
- ✅ Both capitals must be positive
- ✅ Buyout progress validation (0-100%)

**Ijara (Leasing):**
- ✅ Total rentals cannot exceed asset value + 50% (profit limit)
- ✅ Depreciation cannot exceed asset value
- ✅ Maintenance costs limited to 20% of asset value per period

**Salam/Istisna (Forward Sales):**
- ✅ Advance payment must be positive (100% in Salam)
- ✅ Quantity delivered cannot exceed quantity ordered
- ✅ Production progress between 0-100%
- ✅ Suspicious pattern detection (revenue spikes, consistent losses)

**Example Error:**
```
❌ Net profit calculation error. Expected: 300000.00, Got: 350000.00
```

### 3. **Document Upload Security** (`assert_upload_asset`)
**File:** `document_validation.rs`

**Purpose:** Prevents malicious file uploads and ensures compliance.

**Enforces:**
- ✅ Allowed file types only (PDF, JPG, PNG, DOC, DOCX, XLS, XLSX)
- ✅ File size limit (10MB maximum)
- ✅ File signature validation (magic bytes check for PDF/JPEG/PNG)
- ✅ Filename sanitization (no path traversal, dangerous characters)
- ✅ Minimum file size (prevents empty files)

**Example Error:**
```
❌ File type not allowed: .exe. Allowed types: ["pdf", "jpg", "jpeg", "png", "doc", "docx", "xls", "xlsx"]
```

### 4. **Investment Opportunity Creation** (`assert_set_doc`)
**File:** `investment_opportunity_validation.rs`

**Purpose:** Ensures opportunities are only created from approved applications with valid terms.

**Enforces:**
- ✅ Linked to approved application
- ✅ Funding goal between ₦100,000 and ₦100,000,000
- ✅ Minimum investment ≥ ₦10,000 and ≤ funding goal
- ✅ Return rates between 0-100%
- ✅ Min return ≤ Max return
- ✅ Valid Shariah-compliant contract type
- ✅ Term between 3-60 months
- ✅ Current funding doesn't exceed goal

**Example Error:**
```
❌ Minimum return cannot exceed maximum return
```

### 5. **KYC & Shariah Compliance** 
**File:** `kyc_compliance.rs`

**Purpose:** Validates identity, business registration, and Islamic financing compliance.

**Enforces:**
- ✅ BVN validation (exactly 11 digits, numeric only)
- ✅ Registration number format (RC for LLC, BN for sole proprietorship)
- ✅ Shariah compliance (no alcohol, gambling, interest, tobacco, etc.)
- ✅ Identity document validation (NIN, passport, driver's license)
- ✅ AML checks (PEP risk, high-risk industries)
- ✅ Contact information validation (email format, phone length)

**Example Error:**
```
❌ Shariah Compliance: Business involves prohibited activity (alcohol)
```

### 6. **Access Control & Admin Operations** (`assert_set_doc`)
**File:** `access_control.rs`

**Purpose:** Prevents unauthorized privilege escalation and enforces role-based access.

**Enforces:**
- ✅ Only admins can create opportunities
- ✅ Only admins can approve applications
- ✅ Only admins can distribute profits
- ✅ Users can only access their own data (except admins)
- ✅ Rate limiting (max requests per hour)
- ✅ Audit logging for sensitive operations

**Example Error:**
```
❌ Access Denied: Only admins can approve_application on business_applications
```

## Integration with Juno Hooks

### `#[assert_set_doc]` - Pre-Write Validation
Runs **before** data is written to the datastore. If validation fails, the write is **rejected**.

```rust
#[assert_set_doc]
fn assert_set_doc(context: AssertSetDocContext) -> Result<(), String> {
    // 1. Business Application Approval - Must have 100% due diligence
    assert_business_application_approval(&context)?;
    
    // 2. Investment Opportunity Creation - Only from approved applications
    assert_investment_opportunity_creation(&context)?;
    
    // 3. Admin-Only Operations - Prevent unauthorized privilege escalation
    assert_admin_only_operation(&context)?;
    
    Ok(())
}
```

### `#[on_set_doc]` - Post-Write Actions
Runs **after** data is written. Used for additional validation and side effects.

```rust
#[on_set_doc]
async fn on_set_doc(context: OnSetDocContext) -> Result<(), String> {
    // Validate revenue reports on submission
    validate_revenue_report(&context).await?;
    validate_revenue_report_submission(&context).await?;
    
    Ok(())
}
```

### `#[assert_upload_asset]` - Pre-Upload Validation
Runs **before** files are uploaded. Validates file type, size, and content.

```rust
#[assert_upload_asset]
fn assert_upload_asset(context: AssertUploadAssetContext) -> Result<(), String> {
    // Document Upload Security - File type, size, and malware protection
    assert_document_upload(&context)?;
    
    Ok(())
}
```

## Testing

Each module includes unit tests. Run with:

```bash
cd src/satellite
cargo test
```

Example test:
```rust
#[test]
fn test_valid_bvn() {
    assert!(validate_bvn("12345678901").is_ok());
}

#[test]
fn test_invalid_bvn_length() {
    assert!(validate_bvn("123456").is_err());
}
```

## Building & Deployment

### Local Development
```bash
# Build Satellite functions
juno functions build

# Deploy to local emulator
juno emulator start
```

### Production Deployment
```bash
# Build and upgrade production Satellite
juno functions upgrade
```

## Security Benefits

1. **Tamper-Proof Business Logic**: Frontend cannot bypass validation rules
2. **Data Integrity**: All financial calculations verified server-side
3. **Fraud Prevention**: Detects suspicious patterns (revenue spikes, overlapping reports)
4. **File Security**: Prevents malicious uploads (malware, oversized files, wrong types)
5. **Compliance Enforcement**: Shariah compliance checks cannot be circumvented
6. **Access Control**: Role-based permissions enforced at the backend level
7. **Audit Trail**: All sensitive operations logged with user, action, and timestamp

## Future Enhancements

- [ ] External API integration for BVN verification (Paystack, Mono, etc.)
- [ ] Bank statement parsing and validation
- [ ] Automated risk scoring using ML models
- [ ] Real-time fraud detection with pattern matching
- [ ] Webhook notifications for admin alerts
- [ ] Advanced AML screening with sanctions lists

## Architecture Diagram

```
┌─────────────────┐
│   Frontend      │  (Next.js)
│   TypeScript    │
└────────┬────────┘
         │
         │ ❌ Can be manipulated
         │
         ▼
┌─────────────────────────────────────┐
│   Juno Serverless Functions         │  (Rust - WASM)
│   ================================   │
│   ✅ assert_set_doc                 │  ◄── GATEKEEPER
│   ✅ assert_upload_asset            │  ◄── GATEKEEPER
│   ✅ on_set_doc                     │
│   ✅ Business Logic Enforcement     │
│   ✅ Data Validation                │
│   ✅ Security Controls               │
└────────┬────────────────────────────┘
         │
         │ ✅ Validated & Secure
         │
         ▼
┌─────────────────┐
│   Juno          │  (ICP Blockchain)
│   Datastore     │
│   Storage       │
└─────────────────┘
```

## Key Takeaways

- **Frontend is UNTRUSTED** - all critical validation happens in Rust serverless functions
- **Gatekeepers cannot be bypassed** - `assert_*` hooks block writes before they reach the database
- **Business rules are enforced** - 100% due diligence, Shariah compliance, amount limits, etc.
- **Security is layered** - file validation, access control, rate limiting, audit logging
- **Fraud is detected** - suspicious patterns flagged automatically
- **Compliance is guaranteed** - BVN, KYC, Shariah checks enforced server-side

This architecture ensures the QIST Platform's financial integrity is maintained **on-chain** with tamper-proof logic that runs in WebAssembly canisters on the Internet Computer Protocol.
