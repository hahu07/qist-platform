# Automatic Membership Number Generation

## Overview

This feature implements automatic sequential membership/investor number generation when admins approve membership (KYC) applications. Each approved member receives a unique, sequentially assigned membership number in the format `INV-YYYY-NNNN`.

## Format

- **Pattern**: `INV-YYYY-NNNN`
- **Example**: `INV-2025-0001`, `INV-2025-0002`, etc.
- **Prefix**: `INV` (Investor)
- **Year**: Current year (4 digits)
- **Sequence**: 4-digit sequential number, zero-padded

### Year Reset

The sequence counter automatically resets to `0001` at the start of each new year. For example:
- Last member of 2024: `INV-2024-9999`
- First member of 2025: `INV-2025-0001`

## Implementation

### 1. Schema Changes

**File**: `src/schemas/investor.schema.ts`

Added `memberNumber` field to `baseInvestorFields`:

```typescript
const baseInvestorFields = {
  memberNumber: z.string().optional(), // Auto-generated sequential membership number
  // ... other fields
};
```

This field is automatically included in both:
- `individualInvestorSchema`
- `corporateInvestorSchema`

### 2. Counter Service

**File**: `src/utils/counter-service.ts`

Provides counter management functionality:

#### Key Functions

- **`getNextMemberNumber()`**: Get the next membership number
  ```typescript
  const memberNumber = await getNextMemberNumber();
  // Returns: "INV-2025-0001"
  ```

- **`getNextSequentialNumber(counterType, prefix)`**: Generic counter function
  ```typescript
  const number = await getNextSequentialNumber("member_number", "INV");
  ```

- **`getCurrentCounterValue(counterType)`**: Get current counter without incrementing
  ```typescript
  const current = await getCurrentCounterValue("member_number");
  ```

- **`resetCounter(counterType, value)`**: Admin function to reset counter
  ```typescript
  await resetCounter("member_number", 0);
  ```

- **`isValidMemberNumber(memberNumber)`**: Validate format
  ```typescript
  const valid = isValidMemberNumber("INV-2025-0001"); // true
  ```

#### How It Works

1. Counter data is stored in the `counters` collection in Juno datastore
2. Each counter document has:
   ```typescript
   {
     currentValue: number,    // Last assigned number
     lastUpdated: timestamp,  // When last incremented
     prefix: string,          // "INV", "BIZ", etc.
     year: number            // Current year for reset logic
   }
   ```
3. When getting the next number:
   - Checks if year has changed → resets to 1 if new year
   - Increments current value
   - Saves updated counter with version control
   - Returns formatted number

4. Fallback mechanism if counter fails:
   - Uses timestamp + random suffix
   - Example: `INV-2025-1735320000-742`

### 3. KYC Approval Integration

**File**: `src/app/admin/kyc-review/page.tsx`

Updated `handleApproveKYC` function:

```typescript
const handleApproveKYC = async (investor: Investor) => {
  // ... validation code ...
  
  // Generate membership number
  const { getNextMemberNumber } = await import('@/utils/counter-service');
  const memberNumber = await getNextMemberNumber();
  
  const profileData = {
    ...investor.data,
    memberNumber, // Assign auto-generated membership number
    kycStatus: 'verified',
    approvedAt: new Date().toISOString(),
    approvedBy: user?.key || 'admin'
  };
  
  await setDoc({
    collection,
    doc: { key: investor.key, data: profileData }
  });
  
  // Show success message with membership number
  alert(`KYC approved for ${getInvestorName(investor)}. Membership Number: ${memberNumber}`);
};
```

### 4. Satellite Validation

**File**: `src/satellite/src/business_financing/member_validation.rs`

Rust-based serverless validation enforces:

1. **Format Validation**: Ensures `INV-YYYY-NNNN` pattern
2. **Uniqueness Check**: Prevents duplicate membership numbers
3. **Collections Checked**:
   - `individual_investor_profiles`
   - `corporate_investor_profiles`

#### Validation Logic

```rust
pub fn assert_member_number_uniqueness(context: &AssertSetDocContext) -> Result<(), String> {
    // Only validate investor profile collections
    // Only check when KYC is verified
    // Validate format: INV-YYYY-NNNN
    // Check for duplicates across both collections
    // Skip current document being updated
}
```

**Integrated in**: `src/satellite/src/lib.rs`

```rust
#[assert_set_doc]
fn assert_set_doc(context: AssertSetDocContext) -> Result<(), String> {
    // ... other validations ...
    
    // 11. Member Number Uniqueness
    assert_member_number_uniqueness(&context)?;
    
    Ok(())
}
```

### 5. UI Display

**File**: `src/app/member/dashboard/page.tsx`

Membership number is displayed on the member dashboard:

```tsx
{investorProfile?.memberNumber && (
  <span className="inline-flex items-center gap-1.5 px-3 py-1 
    bg-primary-100 dark:bg-primary-900/30 
    border border-primary-200 dark:border-primary-800 
    rounded-full text-xs font-semibold 
    text-primary-700 dark:text-primary-300">
    <svg className="w-3.5 h-3.5" {...iconProps}>...</svg>
    Member: {investorProfile.memberNumber}
  </span>
)}
```

## Usage Examples

### Admin Approval Flow

1. Admin reviews KYC application in `/admin/kyc-review`
2. Admin clicks "Approve KYC" button
3. System automatically:
   - Generates next sequential membership number
   - Assigns to approved member's profile
   - Saves profile with membership number
   - Shows confirmation with membership number
4. Member sees membership number on their dashboard

### Manual Counter Management (Admin)

```typescript
import { resetCounter, getCurrentCounterValue } from '@/utils/counter-service';

// Check current counter
const current = await getCurrentCounterValue("member_number");
console.log(`Current counter: ${current}`);

// Reset counter (e.g., at year end or for testing)
await resetCounter("member_number", 0);
```

### Extend for Other Entities

The counter service is generic and can be used for other sequential numbers:

```typescript
// Business application numbers
const bizNumber = await getNextBusinessApplicationNumber();
// Returns: "BIZ-2025-0001"

// Transaction numbers
const txnNumber = await getNextTransactionNumber();
// Returns: "TXN-2025-0001"

// Custom counters
const customNumber = await getNextSequentialNumber("custom_type", "CUS");
// Returns: "CUS-2025-0001"
```

## Data Storage

### Counter Document

**Collection**: `counters`
**Key**: `counter_member_number`

```json
{
  "currentValue": 42,
  "lastUpdated": 1735320000000,
  "prefix": "INV",
  "year": 2025
}
```

### Member Profile

**Collections**: 
- `individual_investor_profiles`
- `corporate_investor_profiles`

**Key**: User's unique ID

```json
{
  "memberNumber": "INV-2025-0042",
  "investorType": "individual",
  "fullName": "John Doe",
  "kycStatus": "verified",
  "approvedAt": "2025-12-27T10:30:00Z",
  "approvedBy": "admin_user_id",
  // ... other profile fields
}
```

## Security & Validation

### Frontend Validation
- Member number is optional (auto-generated on approval)
- Format validation via TypeScript schema
- Cannot be manually set by users

### Satellite Validation (Rust)
- **Uniqueness**: Prevents duplicate membership numbers across all investor profiles
- **Format**: Enforces `INV-YYYY-NNNN` pattern
- **Scope**: Validates only when KYC status is "verified"
- **Collections**: Checks both individual and corporate profiles

### Race Condition Protection
- Uses Juno's document versioning
- Counter updates include version field
- Prevents concurrent modification conflicts

## Testing

### Unit Tests (Rust)

Located in `src/satellite/src/business_financing/member_validation.rs`:

```rust
#[cfg(test)]
mod tests {
    #[test]
    fn test_valid_member_number_format() {
        assert!(is_valid_member_number_format("INV-2025-0001"));
        assert!(is_valid_member_number_format("INV-2024-9999"));
    }

    #[test]
    fn test_invalid_member_number_format() {
        assert!(!is_valid_member_number_format("INV-25-0001")); // Year too short
        assert!(!is_valid_member_number_format("MEM-2025-0001")); // Wrong prefix
    }
}
```

Run with:
```bash
cd src/satellite
cargo test
```

### Integration Testing

1. **Approval Flow Test**:
   - Go to `/admin/kyc-review`
   - Approve a pending member
   - Verify membership number is assigned
   - Check member dashboard displays number

2. **Counter Increment Test**:
   - Approve multiple members in sequence
   - Verify sequential numbering (0001, 0002, 0003...)

3. **Year Reset Test**:
   - Mock system date to Dec 31, 2025
   - Approve member → `INV-2025-XXXX`
   - Change date to Jan 1, 2026
   - Approve member → `INV-2026-0001`

4. **Uniqueness Test**:
   - Try to manually create profile with existing member number
   - Satellite should reject with error

## Deployment

### Build Satellite

After making changes to Rust validation:

```bash
# Local development (emulator)
juno functions build

# Production
juno functions upgrade
```

### Database Collections

Ensure these collections exist in Juno Console:

1. **`counters`** - Stores counter state
2. **`individual_investor_profiles`** - Individual members
3. **`corporate_investor_profiles`** - Corporate members

### Permissions

Set appropriate read/write permissions in Juno Console:
- `counters`: Admin write only
- Investor profiles: Admin write, user read own

## Future Enhancements

### Potential Improvements

1. **Batch Assignment**:
   - Assign membership numbers to existing members
   - Migration script for legacy data

2. **Custom Prefixes by Type**:
   - Individual: `IND-2025-0001`
   - Corporate: `COR-2025-0001`

3. **Regional Prefixes**:
   - Nigeria: `INV-NG-2025-0001`
   - Malaysia: `INV-MY-2025-0001`

4. **Admin Dashboard**:
   - View counter statistics
   - Reset counters with audit trail
   - Search by membership number

5. **Notifications**:
   - Email member their membership number
   - Include in welcome message
   - Print on membership certificate

6. **API Endpoint**:
   - Expose membership number lookup
   - Integration with external systems

## Troubleshooting

### Counter Not Incrementing

**Check**:
1. Verify counter document exists in `counters` collection
2. Check browser console for errors
3. Verify admin has write permissions

**Fix**:
```typescript
await resetCounter("member_number", 0);
```

### Duplicate Membership Numbers

**Cause**: Race condition or Satellite validation not deployed

**Fix**:
1. Deploy latest Satellite: `juno functions upgrade`
2. Manually fix duplicates in database
3. Update counter to highest value + 1

### Format Validation Failing

**Check**:
- Ensure format is exactly `INV-YYYY-NNNN`
- Year must be 4 digits
- Sequence must be 4 digits (zero-padded)

### Member Number Not Displaying

**Check**:
1. Profile has `memberNumber` field populated
2. Component is checking `investorProfile?.memberNumber`
3. Cache/refresh browser

## References

- **Schema**: `src/schemas/investor.schema.ts`
- **Counter Service**: `src/utils/counter-service.ts`
- **KYC Approval**: `src/app/admin/kyc-review/page.tsx`
- **Satellite Validation**: `src/satellite/src/business_financing/member_validation.rs`
- **UI Display**: `src/app/member/dashboard/page.tsx`

## Related Features

- KYC Review System
- Admin Approval Workflow
- Member Dashboard
- Investor Profile Management
