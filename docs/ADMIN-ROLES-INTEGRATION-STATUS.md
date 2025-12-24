# Admin Roles Integration Status

## ✅ UI Navigation Fixed

**Added Team Management Link to Admin Dashboard**

The admin team management page now has a visible navigation link in the admin dashboard:

```
/admin/dashboard → Team (with user icon)
```

Location: Top navigation bar, between "Business Apps" and "Workflow"

## 🔄 Current Integration Status

### Frontend (TypeScript) ✅ COMPLETE

**File**: `src/schemas/admin-roles.schema.ts`

**5 Role Levels**:
1. **Viewer** (Level 1) - Read-only access
2. **Reviewer** (Level 2) - Can review and approve up to ₦5M
3. **Approver** (Level 3) - Can approve up to ₦50M, assign reviews
4. **Manager** (Level 4) - Can approve up to ₦100M, manage team, distribute profits
5. **Super Admin** (Level 5) - Full system access

**13 Granular Permissions**:
- `canViewApplications`
- `canReviewDueDiligence`
- `canRequestChanges`
- `canApprove`
- `approvalLimit` (amount-based)
- `canAssignReviews`
- `canManageAdmins`
- `canAccessSystemConfig`
- `canDistributeProfits`
- `canViewReports`
- `canExportData`
- `canAccessAuditLogs`
- `canManageInvestors`

### Backend (Rust) ✅ ROLES DEFINED, ⚠️ DATASTORE LOOKUP PENDING

**File**: `src/satellite/src/business_financing/admin_permissions.rs`

**Active Serverless Functions**:
1. ✅ `assert_admin_approval_with_limits()` - Amount-based authorization (₦5M/₦50M/₦100M)
2. ✅ `validate_separation_of_duties()` - Ensures reviewer ≠ approver
3. ✅ `assert_can_manage_admins()` - Only managers can manage admin profiles
4. ✅ `assert_can_distribute_profits()` - Only managers can distribute profits
5. ✅ `get_role_level()` - Role hierarchy (super_admin=5, manager=4, approver=3, reviewer=2, viewer=1)
6. ✅ `has_sufficient_role()` - Permission level comparison

**Integration Hooks in lib.rs**:
```rust
#[assert_set_doc]
fn assert_set_doc(context: AssertSetDocContext) -> Result<(), String> {
    // ... other validators
    assert_admin_approval_with_limits(&context)?; // ← Checks approval limits
    validate_separation_of_duties(&context)?;      // ← Checks reviewer ≠ approver
    assert_can_manage_admins(&context)?;           // ← Manager-only admin management
    assert_can_distribute_profits(&context)?;      // ← Manager-only profit distribution
    Ok(())
}
```

## ⚠️ Missing Integration: Datastore Lookup

### Current State
The serverless functions **define the role hierarchy** but **do not yet enforce it from the datastore**. Here's what's marked as TODO:

```rust
// TODO: In production, fetch admin profile from datastore
// let admin_profile = get_admin_profile(&caller)?;
// if !has_sufficient_role(&admin_profile.role, "manager") {
//     return Err("❌ Access Denied: Only managers can manage admin profiles".to_string());
// }
```

### Why This Matters
**Currently**:
- ✅ Role structure exists in both frontend and backend
- ✅ Amount-based limits are enforced (₦5M, ₦50M, ₦100M thresholds)
- ✅ Separation of duties is enforced
- ⚠️ **But** role validation relies on frontend data, not tamper-proof blockchain storage

**Security Risk**: 
A malicious user could potentially bypass role checks by manipulating frontend requests. The serverless function should **always fetch the admin profile from the `admin_profiles` collection** to verify permissions.

## 🔒 What Needs to Be Done

### 1. Implement Datastore Lookup Function

Add to `admin_permissions.rs`:

```rust
use junobuild_satellite::{get_doc, AssertSetDocContext};

/// Fetches admin profile from datastore (SECURITY-CRITICAL)
pub fn get_admin_profile(user_id: &str) -> Result<AdminProfile, String> {
    // Fetch from admin_profiles collection
    let result = get_doc("admin_profiles", user_id)
        .map_err(|e| format!("❌ Admin profile not found: {}", e))?;
    
    // Parse and validate
    let data: Value = serde_json::from_slice(&result.data)
        .map_err(|e| format!("❌ Invalid admin profile data: {}", e))?;
    
    Ok(AdminProfile {
        user_id: data["userId"].as_str().unwrap_or("").to_string(),
        display_name: data["displayName"].as_str().unwrap_or("").to_string(),
        role: data["role"].as_str().unwrap_or("viewer").to_string(),
        approval_limit: data["approvalLimit"].as_f64().unwrap_or(0.0),
        is_active: data["isActive"].as_bool().unwrap_or(false),
    })
}
```

### 2. Update All Validators to Use Datastore

Replace all `// TODO` comments with actual checks:

```rust
pub fn assert_can_manage_admins(context: &AssertSetDocContext) -> Result<(), String> {
    let collection = &context.data.collection;
    if collection != "admin_profiles" { return Ok(()); }
    
    let caller = context.caller.to_text();
    
    // SECURITY: Always fetch from datastore
    let caller_profile = get_admin_profile(&caller)?;
    
    if !has_sufficient_role(&caller_profile.role, "manager") {
        return Err("❌ Access Denied: Only managers can manage admin profiles".to_string());
    }
    
    Ok(())
}
```

### 3. Enforce Role-Based Approval Limits

Update `assert_admin_approval_with_limits()`:

```rust
let admin_profile = get_admin_profile(&approver_id)?;

// Validate role-based approval limit
if requested_amount > admin_profile.approval_limit {
    return Err(format!(
        "❌ Approval Denied: Amount ₦{:.2} exceeds your approval limit of ₦{:.2} ({} role)",
        requested_amount, admin_profile.approval_limit, admin_profile.role
    ));
}
```

### 4. Validate Active Status

```rust
if !admin_profile.is_active {
    return Err("❌ Admin account is inactive".to_string());
}
```

## 📋 Deployment Checklist

Before deploying to production:

- [ ] Add `get_admin_profile()` function with datastore lookup
- [ ] Update all 4 admin permission validators to use datastore
- [ ] Test with real `admin_profiles` collection data
- [ ] Seed first super_admin user in production
- [ ] Build and deploy: `juno functions build && juno functions upgrade`
- [ ] Test all permission scenarios:
  - [ ] Viewer cannot approve (should fail)
  - [ ] Reviewer can approve ≤₦5M (should pass)
  - [ ] Reviewer cannot approve >₦5M (should fail)
  - [ ] Approver can approve ≤₦50M (should pass)
  - [ ] Manager can approve ≤₦100M (should pass)
  - [ ] Dual authorization required for >₦50M (should fail without secondary approver)
  - [ ] Separation of duties enforced (reviewer ≠ approver)
  - [ ] Only managers can create admin profiles
  - [ ] Only managers can distribute profits

## 🎯 Summary

**Current State**:
- ✅ **Frontend RBAC**: Fully implemented with 5 roles and 13 permissions
- ✅ **Backend Role Structure**: Defined with role hierarchy (1-5)
- ✅ **Backend Validators**: 4 gatekeepers active in serverless functions
- ⚠️ **Backend Datastore Integration**: Not yet implemented (security risk)

**Next Step**:
Implement `get_admin_profile()` and update all validators to fetch admin roles from the blockchain datastore, ensuring tamper-proof permission enforcement.

**UI Access**:
- Admin Dashboard: `/admin/dashboard`
- Team Management: `/admin/team` (now visible in navigation bar)
