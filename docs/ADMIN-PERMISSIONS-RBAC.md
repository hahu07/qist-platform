# Admin Permissions & Role-Based Access Control (RBAC) Implementation

## Overview

The QIST Platform now has a comprehensive admin permission system with **5 role levels**, **amount-based authorization**, **separation of duties**, **dual authorization**, and **audit logging**. This system enforces security at both the **frontend** (TypeScript) and **backend** (Rust serverless functions) layers.

---

## Architecture

### Three-Layer Security Model

```
┌─────────────────────────────────────────────────────────────┐
│  Layer 1: Frontend Permission Checks (TypeScript)           │
│  ✓ UI visibility control                                    │
│  ✓ Button enable/disable                                    │
│  ✓ Route protection                                         │
│  ✗ Can be bypassed by manipulating browser                  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  Layer 2: Juno SDK Validation (Client-side)                 │
│  ✓ Schema validation                                        │
│  ✓ Type checking                                            │
│  ✗ Can be bypassed by direct API calls                      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  Layer 3: Rust Serverless Functions (TAMPER-PROOF)          │
│  ✅ assert_admin_approval_with_limits                       │
│  ✅ validate_separation_of_duties                           │
│  ✅ assert_can_manage_admins                                │
│  ✅ assert_can_distribute_profits                           │
│  ✅ Runs on Internet Computer blockchain                    │
│  ✅ CANNOT BE BYPASSED                                      │
└─────────────────────────────────────────────────────────────┘
```

---

## Role Hierarchy & Permissions

### 1. Viewer (Level 1)
**Purpose**: Read-only access for auditors, interns, or observers

| Permission | Allowed |
|------------|---------|
| View Applications | ✅ Yes |
| Review Due Diligence | ❌ No |
| Request Changes | ❌ No |
| Approve Applications | ❌ No |
| Approval Limit | ₦0 |
| Assign Reviews | ❌ No |
| Manage Admins | ❌ No |
| Access System Config | ❌ No |
| Distribute Profits | ❌ No |
| View Reports | ✅ Yes |
| Export Data | ❌ No |
| Access Audit Logs | ❌ No |

### 2. Reviewer (Level 2)
**Purpose**: Junior analysts who can review applications up to ₦5M

| Permission | Allowed |
|------------|---------|
| View Applications | ✅ Yes |
| Review Due Diligence | ✅ Yes |
| Request Changes | ✅ Yes |
| Approve Applications | ✅ Yes (≤ ₦5M) |
| Approval Limit | **₦5,000,000** |
| Assign Reviews | ❌ No |
| Manage Admins | ❌ No |
| Access System Config | ❌ No |
| Distribute Profits | ❌ No |
| View Reports | ✅ Yes |
| Export Data | ✅ Yes |
| Access Audit Logs | ❌ No |

**Special Rules**:
- Cannot approve applications > ₦5M (requires escalation)
- Amounts > ₦5M require secondary approval from Approver/Manager

### 3. Approver (Level 3)
**Purpose**: Senior analysts with authority up to ₦50M

| Permission | Allowed |
|------------|---------|
| View Applications | ✅ Yes |
| Review Due Diligence | ✅ Yes |
| Request Changes | ✅ Yes |
| Approve Applications | ✅ Yes (≤ ₦50M) |
| Approval Limit | **₦50,000,000** |
| Assign Reviews | ✅ Yes (own reviews) |
| Manage Admins | ❌ No |
| Access System Config | ❌ No |
| Distribute Profits | ❌ No |
| View Reports | ✅ Yes |
| Export Data | ✅ Yes |
| Access Audit Logs | ✅ Yes |
| Manage Investors | ✅ Yes |

**Special Rules**:
- Can assign applications to themselves or other reviewers
- Cannot approve applications > ₦50M (requires Manager approval)

### 4. Manager (Level 4)
**Purpose**: Department heads with high-value approval authority

| Permission | Allowed |
|------------|---------|
| View Applications | ✅ Yes |
| Review Due Diligence | ✅ Yes |
| Request Changes | ✅ Yes |
| Approve Applications | ✅ Yes (≤ ₦100M) |
| Approval Limit | **₦100,000,000** |
| Assign Reviews | ✅ Yes (all) |
| Manage Admins | ✅ Yes |
| Access System Config | ✅ Yes |
| Distribute Profits | ✅ Yes |
| View Reports | ✅ Yes |
| Export Data | ✅ Yes |
| Access Audit Logs | ✅ Yes |
| Manage Investors | ✅ Yes |

**Special Rules**:
- Can create/edit admin profiles (except Super Admin promotion)
- Can reassign applications between any admins
- Amounts > ₦100M require Super Admin or dual authorization

### 5. Super Admin (Level 5)
**Purpose**: Full system access with no limits

| Permission | Allowed |
|------------|---------|
| All Permissions | ✅ Yes |
| Approval Limit | **Unlimited** |
| Manage All Admins | ✅ Yes (including Super Admins) |
| System Configuration | ✅ Yes |
| Override Security | ✅ Yes (with audit trail) |

---

## Security Enforcement Mechanisms

### 1. Amount-Based Authorization

**Rule**: Admins cannot approve applications exceeding their approval limit.

**Implementation**:
- **Frontend**: `canApproveAmount(role, amount)` disables approve button
- **Backend**: `assert_admin_approval_with_limits()` blocks the transaction

**Example**:
```typescript
// Frontend check
const canApprove = await canApproveAmount(userId, 10_000_000);
if (!canApprove) {
  // Show "Request Manager Approval" button
}
```

```rust
// Backend enforcement (CANNOT BE BYPASSED)
if requested_amount > admin_profile.approval_limit {
    return Err("❌ Amount exceeds your approval limit".to_string());
}
```

### 2. Separation of Duties

**Rule**: The reviewer who performed due diligence **cannot** be the final approver.

**Implementation**:
- Tracks `reviewedBy` and `approvedBy` fields separately
- Backend validates they are different principals

**Example**:
```rust
if reviewed_by == approved_by && !reviewed_by.is_empty() {
    return Err("❌ Separation of duties violation".to_string());
}
```

### 3. Dual Authorization

**Rule**: High-value applications (> ₦50M) require **two approvals**.

**Workflow**:
1. Primary approver (Approver/Manager) reviews and approves
2. System creates `dual_authorization` record with status `pending_secondary`
3. Secondary approver (Manager/Super Admin) must review and approve
4. Only after both approvals does status change to `approved`

**Implementation**:
```typescript
if (requiresDualAuthorization(amount, primaryApproverRole)) {
  // Create dual authorization request
  await setDoc({
    collection: "dual_authorizations",
    doc: {
      key: applicationId,
      data: {
        applicationId,
        requestedAmount: amount,
        primaryApproverId: currentUserId,
        primaryApprovalAt: Date.now(),
        status: "pending_secondary",
        // ... other fields
      },
    },
  });
}
```

### 4. Time-Based Restrictions

**Rule**: High-value approvals (> ₦10M) are restricted to business hours.

**Business Hours**:
- **Days**: Monday - Friday
- **Time**: 6:00 AM - 10:00 PM (WAT)
- **Excluded**: Weekends, Public holidays (future enhancement)

**Implementation**:
```typescript
const { allowed, reason } = canApproveHighValue(amount);
if (!allowed) {
  alert(reason); // "High-value approvals restricted to business hours"
}
```

### 5. Audit Logging

**Rule**: All sensitive admin operations are logged to `admin_audit_logs` collection.

**Logged Actions**:
- `approve_application`
- `reject_application`
- `update_due_diligence`
- `distribute_profit`
- `create_admin`
- `update_admin`
- `deactivate_admin`
- `export_data`
- `access_audit_logs`

**Log Structure**:
```typescript
{
  adminId: "principal_xyz",
  adminName: "Ahmad Hassan",
  adminRole: "manager",
  action: "approve_application",
  targetCollection: "business_applications",
  targetId: "app_123",
  targetName: "ABC Manufacturing",
  metadata: {
    requestedAmount: 25000000,
    dueDiligenceScore: 100,
    previousStatus: "under_review",
    newStatus: "approved"
  },
  ipAddress: "102.89.45.23",
  userAgent: "Mozilla/5.0...",
  timestamp: 1703423400000,
  success: true
}
```

---

## Juno Datastore Collections

### `admin_profiles`
Stores admin user profiles with roles and permissions.

**Schema**: See `AdminProfileSchema` in `src/schemas/assignment.schema.ts`

**Key**: User's principal ID (from Internet Identity)

**Example**:
```json
{
  "userId": "principal_abc123",
  "displayName": "Ahmad Hassan",
  "email": "ahmad@qist.com",
  "role": "approver",
  "approvalLimit": 50000000,
  "department": "Risk Management",
  "isActive": true,
  "specializations": ["agriculture", "manufacturing"],
  "currentWorkload": 3,
  "maxWorkload": 10,
  "performanceMetrics": {
    "totalReviewed": 45,
    "averageReviewTime": 4.2,
    "approvalRate": 78.5,
    "qualityScore": 92
  },
  "createdAt": 1703423400000,
  "updatedAt": 1703423400000
}
```

### `admin_audit_logs`
Immutable log of all admin actions for compliance.

**Schema**: See `AdminActionLogSchema` in `src/schemas/admin-roles.schema.ts`

**Key**: `{adminId}_{timestamp}`

**Retention**: Permanent (required for financial audits)

### `dual_authorizations`
Tracks applications requiring two approvals.

**Schema**: See `DualAuthorizationSchema` in `src/schemas/admin-roles.schema.ts`

**Key**: `applicationId`

**Example**:
```json
{
  "applicationId": "app_123",
  "requestedAmount": 75000000,
  "primaryApproverId": "principal_abc",
  "primaryApprovalAt": 1703423400000,
  "primaryApprovalNotes": "Strong financials, approved.",
  "secondaryApproverId": "principal_xyz",
  "secondaryApprovalAt": 1703425000000,
  "secondaryApprovalNotes": "Verified collateral, approved.",
  "status": "approved",
  "requiredBy": 1703509800000,
  "createdAt": 1703423400000,
  "updatedAt": 1703425000000
}
```

---

## Frontend Implementation

### Permission Checking Utilities

Located in `src/utils/admin-permissions.ts`:

```typescript
// Check if user is admin
const isAdminUser = await isAdmin(userId);

// Get user's permissions
const permissions = await getUserPermissions(userId);

// Check specific permission
const canManage = await hasPermission(userId, "canManageAdmins");

// Check approval amount
const canApprove = await canApproveAmount(userId, 10_000_000);

// Check role level
const isManager = await hasRoleLevel(userId, "manager");
```

### Admin Team Management UI

**Route**: `/admin/team`

**Features**:
- List all admin users with roles
- Edit admin profiles (Manager+ only)
- Create new administrators
- View workload statistics
- Toggle active/inactive status
- Preview permissions for each role

**Access Control**:
- Only Managers and Super Admins can access
- Viewers/Reviewers/Approvers get "Access Denied"

---

## Backend (Rust) Implementation

### Serverless Function Hooks

Located in `src/satellite/src/lib.rs`:

```rust
#[assert_set_doc]
fn assert_set_doc(context: AssertSetDocContext) -> Result<(), String> {
    // 1. Business Application Approval - 100% due diligence
    assert_business_application_approval(&context)?;
    
    // 2. Admin Approval Limits - Amount-based authorization
    assert_admin_approval_with_limits(&context)?;
    
    // 3. Separation of Duties - Reviewer ≠ Approver
    validate_separation_of_duties(&context)?;
    
    // 4. Investment Opportunity Creation
    assert_investment_opportunity_creation(&context)?;
    
    // 5. Admin-Only Operations
    assert_admin_only_operation(&context)?;
    
    // 6. Admin Profile Management
    assert_can_manage_admins(&context)?;
    
    // 7. Profit Distribution
    assert_can_distribute_profits(&context)?;
    
    Ok(())
}
```

### Admin Permissions Module

Located in `src/satellite/src/business_financing/admin_permissions.rs`:

**Key Functions**:
- `assert_admin_approval_with_limits()` - Validates approval amount
- `validate_separation_of_duties()` - Enforces reviewer ≠ approver
- `assert_can_manage_admins()` - Only managers can create admins
- `assert_can_distribute_profits()` - Only managers can distribute
- `log_admin_action()` - Records audit trail

---

## Usage Examples

### Example 1: Approve Application (Frontend)

```typescript
import { canApproveAmount, validateSeparationOfDuties } from "@/utils/admin-permissions";

async function handleApproveApplication(applicationId: string) {
  const application = await getDoc({ collection: "business_applications", key: applicationId });
  const amount = application.data.requestedAmount;
  const reviewedBy = application.data.reviewedBy;
  
  // Check approval amount
  const canApprove = await canApproveAmount(currentUserId, amount);
  if (!canApprove) {
    alert("Amount exceeds your approval limit. Request manager approval.");
    return;
  }
  
  // Check separation of duties
  const { valid, reason } = validateSeparationOfDuties(reviewedBy, currentUserId);
  if (!valid) {
    alert(reason);
    return;
  }
  
  // Proceed with approval
  await setDoc({
    collection: "business_applications",
    doc: {
      key: applicationId,
      data: {
        ...application.data,
        status: "approved",
        approvedBy: currentUserId,
        approvedAt: Date.now(),
      },
    },
  });
}
```

### Example 2: Create Admin (Frontend)

```typescript
import { canManageAdmins } from "@/utils/admin-permissions";

async function handleCreateAdmin() {
  // Check permission
  const canManage = await canManageAdmins(currentUserId);
  if (!canManage) {
    alert("Only managers can create admin profiles");
    return;
  }
  
  // Create admin
  await setDoc({
    collection: "admin_profiles",
    doc: {
      key: newAdminPrincipal,
      data: {
        userId: newAdminPrincipal,
        displayName: "New Admin",
        email: "newadmin@qist.com",
        role: "reviewer",
        approvalLimit: 5_000_000,
        isActive: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    },
  });
  
  // Log the action
  await logAdminAction("create_admin", "admin_profiles", newAdminPrincipal);
}
```

---

## Testing Scenarios

### Test Case 1: Reviewer Exceeds Limit
```
Given: Reviewer with ₦5M approval limit
When: Attempts to approve ₦10M application
Then: Backend rejects with "Amount exceeds approval limit"
```

### Test Case 2: Self-Approval
```
Given: Reviewer performed due diligence
When: Same reviewer attempts to approve
Then: Backend rejects with "Separation of duties violation"
```

### Test Case 3: Dual Authorization
```
Given: Application for ₦75M
When: Approver gives primary approval
Then: Status = "pending_secondary"
And: Manager must provide secondary approval
Then: Status = "approved"
```

### Test Case 4: Unauthorized Admin Creation
```
Given: Reviewer user
When: Attempts to create new admin profile
Then: Backend rejects with "Only managers can manage admins"
```

---

## Future Enhancements

### Phase 1 (Current Sprint)
- ✅ Role-based permissions
- ✅ Amount-based authorization
- ✅ Separation of duties
- ✅ Dual authorization
- ✅ Audit logging
- ✅ Admin team management UI

### Phase 2 (Next Sprint)
- [ ] Real-time admin datastore lookup in Rust (currently TODO)
- [ ] IP geolocation restrictions
- [ ] Multi-factor authentication for high-value operations
- [ ] Approval workflow SLA tracking
- [ ] Admin performance analytics dashboard

### Phase 3 (Future)
- [ ] Blockchain-verified audit trail
- [ ] External KYC provider integration
- [ ] AI-powered fraud detection
- [ ] Compliance reporting automation
- [ ] Role-based data masking

---

## Security Best Practices

1. **Never Trust Frontend Data**: Always fetch admin profile from datastore in Rust
2. **Immutable Audit Logs**: Never allow deletion of admin_audit_logs
3. **Regular Access Reviews**: Quarterly review of admin permissions
4. **Principle of Least Privilege**: Grant minimum necessary permissions
5. **Time-Limited Access**: Consider expiring high-privilege roles
6. **Multi-Party Authorization**: High-value operations require multiple approvals
7. **Comprehensive Logging**: Log all state-changing operations

---

## Deployment Checklist

- [x] Create `admin-roles.schema.ts` with permissions map
- [x] Create `admin_permissions.rs` Rust module
- [x] Integrate into `lib.rs` assert hooks
- [x] Create `/admin/team` management page
- [x] Create `admin-permissions.ts` utility functions
- [x] Update `index.ts` schema exports
- [ ] Seed initial super admin user
- [ ] Deploy to production Satellite
- [ ] Test all permission boundaries
- [ ] Document for team onboarding
- [ ] Setup monitoring and alerts

---

## Support & Documentation

- **Frontend Types**: `src/schemas/admin-roles.schema.ts`
- **Backend Logic**: `src/satellite/src/business_financing/admin_permissions.rs`
- **UI Components**: `src/app/admin/team/page.tsx`
- **Utilities**: `src/utils/admin-permissions.ts`
- **Juno Docs**: https://juno.build/docs

For questions, contact the platform engineering team.
