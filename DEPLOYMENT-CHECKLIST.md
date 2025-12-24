# Admin Permissions & RBAC - Deployment Checklist

## ✅ Pre-Deployment (Completed)

- [x] Created admin roles schema with 5 levels
- [x] Implemented 13 granular permissions
- [x] Built 7 Rust serverless gatekeepers
- [x] Created admin team management UI at `/admin/team`
- [x] Implemented frontend permission utilities
- [x] Created React permission guard components
- [x] Added separation of duties validation
- [x] Implemented dual authorization logic
- [x] Added time-based restrictions
- [x] Created audit logging structure
- [x] Wrote comprehensive documentation
- [x] Compiled Satellite successfully (1.766 MB)
- [x] Zero compilation errors

---

## 🚀 Deployment Steps

### Step 1: Deploy Satellite Functions
```bash
cd /home/mutalab/projects/qist-platform
juno functions upgrade
```

**Expected Output**: 
```
✔ Functions upgraded successfully
→ New canister version: vX.X.X
```

### Step 2: Seed Super Admin User
Create the first super admin manually via Juno console or CLI:

```typescript
// Run in browser console after authentication
import { setDoc } from "@junobuild/core";

await setDoc({
  collection: "admin_profiles",
  doc: {
    key: "YOUR_PRINCIPAL_ID", // From Internet Identity
    data: {
      userId: "YOUR_PRINCIPAL_ID",
      displayName: "System Administrator",
      email: "admin@qist.com",
      role: "super_admin",
      approvalLimit: Infinity,
      department: "Executive",
      isActive: true,
      specializations: ["all"],
      currentWorkload: 0,
      maxWorkload: 20,
      performanceMetrics: {
        totalReviewed: 0,
        averageReviewTime: 0,
        approvalRate: 0,
        qualityScore: 100,
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
  },
});
```

### Step 3: Test Permission Boundaries

#### Test 1: Viewer Cannot Approve
- [ ] Login as viewer
- [ ] Navigate to business application
- [ ] Verify "Approve" button is disabled
- [ ] Attempt direct API call (should fail in Rust)

#### Test 2: Reviewer Amount Limit
- [ ] Login as reviewer (₦5M limit)
- [ ] Try to approve ₦3M application → Should succeed
- [ ] Try to approve ₦10M application → Should fail with "Amount exceeds limit"

#### Test 3: Separation of Duties
- [ ] Login as reviewer
- [ ] Complete due diligence on application
- [ ] Attempt to approve same application → Should fail with "Separation of duties violation"

#### Test 4: Dual Authorization
- [ ] Create application for ₦75M
- [ ] Login as approver, give primary approval
- [ ] Verify status = "pending_secondary"
- [ ] Login as manager, give secondary approval
- [ ] Verify status = "approved"

#### Test 5: Time Restrictions
- [ ] Try to approve ₦15M at 11 PM → Should show warning about business hours
- [ ] Try same approval at 10 AM → Should succeed

#### Test 6: Admin Management
- [ ] Login as reviewer → Cannot access `/admin/team`
- [ ] Login as manager → Can access `/admin/team`
- [ ] Create new reviewer user
- [ ] Edit reviewer's approval limit
- [ ] Deactivate reviewer

#### Test 7: Audit Logging
- [ ] Perform approval action
- [ ] Check `admin_audit_logs` collection
- [ ] Verify log entry with adminId, action, timestamp, metadata

### Step 4: Verify Rust Enforcement

Test that frontend bypasses don't work:

```typescript
// Attempt to directly call setDoc without permission
// (Simulates malicious user bypassing frontend checks)

await setDoc({
  collection: "business_applications",
  doc: {
    key: "app_123",
    data: {
      status: "approved",
      requestedAmount: 100_000_000, // ₦100M
      approvedBy: "fake_admin_id",
      // Attempt to bypass due diligence check
      dueDiligenceScore: 50, // Less than 100
    },
  },
});

// Expected: Rust hook rejects with "Due diligence only 50% complete"
```

### Step 5: Monitor Satellite Logs

```bash
# Check for any runtime errors
juno functions logs --follow
```

Look for:
- ✅ Successful permission checks
- ✅ Proper error messages for violations
- ❌ Any unexpected errors or bypasses

---

## 🔍 Post-Deployment Verification

### Datastore Collections to Verify

#### 1. `admin_profiles`
- [ ] Super admin exists and is active
- [ ] All role fields properly set
- [ ] Approval limits match role definitions

#### 2. `admin_audit_logs`
- [ ] Logs being created for admin actions
- [ ] Proper metadata structure
- [ ] Timestamps accurate

#### 3. `dual_authorizations`
- [ ] Created for high-value applications
- [ ] Status transitions work (pending_secondary → approved)
- [ ] Both approver IDs recorded

### UI Verification

#### Admin Team Page (`/admin/team`)
- [ ] Lists all admins correctly
- [ ] Role badges display proper colors
- [ ] Workload bars show correct percentages
- [ ] Edit modal opens with correct data
- [ ] Permission preview shows accurate permissions
- [ ] Save changes persists to datastore
- [ ] Non-managers cannot access page

#### Business Applications Page
- [ ] Approve button visibility based on role
- [ ] Amount-based button states correct
- [ ] Separation of duties message shown
- [ ] Dual auth badge appears for high-value apps

---

## 📊 Success Metrics

Track these KPIs after deployment:

1. **Permission Violations Blocked**: Count of Rust hook rejections
2. **Separation of Duties Enforced**: # of self-approval attempts blocked
3. **Dual Authorization Success Rate**: % of high-value apps with 2 approvals
4. **Average Approval Time by Role**: Reviewer vs Approver vs Manager
5. **Audit Log Completeness**: % of actions with logs
6. **Admin Active Users**: # of admins using system daily
7. **Role Distribution**: Balance across 5 role levels

---

## 🚨 Rollback Plan

If critical issues found:

### Option 1: Revert Satellite
```bash
# Deploy previous satellite version
juno functions upgrade --version <previous_version>
```

### Option 2: Disable Specific Hooks
Modify `src/satellite/src/lib.rs`:
```rust
#[assert_set_doc]
fn assert_set_doc(context: AssertSetDocContext) -> Result<(), String> {
    // Comment out problematic validators temporarily
    // assert_admin_approval_with_limits(&context)?;
    
    // Keep critical validators active
    assert_business_application_approval(&context)?;
    
    Ok(())
}
```

Then rebuild and redeploy:
```bash
juno functions build
juno functions upgrade
```

### Option 3: Emergency Admin Override
Create temporary super admin to fix permissions:
```typescript
// In Juno console as existing super admin
await setDoc({
  collection: "admin_profiles",
  doc: {
    key: "EMERGENCY_ADMIN_PRINCIPAL",
    data: {
      userId: "EMERGENCY_ADMIN_PRINCIPAL",
      displayName: "Emergency Admin",
      role: "super_admin",
      approvalLimit: Infinity,
      isActive: true,
      // ... other fields
    },
  },
});
```

---

## 📝 Documentation for Team

After deployment, share with team:

1. **For Admins**: `docs/ADMIN-PERMISSIONS-RBAC.md`
   - Full permissions matrix
   - How to use each role
   - Security policies

2. **For Developers**: `ADMIN-PERMISSIONS-SUMMARY.md`
   - Technical implementation details
   - Code examples
   - API reference

3. **For Operations**: This checklist
   - Deployment steps
   - Testing procedures
   - Monitoring guidelines

---

## 🎓 Training Sessions

Schedule training for:

### Session 1: Admin Users (1 hour)
- Understanding role levels
- Permission boundaries
- Separation of duties concept
- Dual authorization workflow
- How to use `/admin/team`

### Session 2: Developers (2 hours)
- Frontend permission utilities
- React guard components
- Testing permission boundaries
- Adding new permissions
- Debugging Rust hooks

### Session 3: Operations Team (1 hour)
- Monitoring admin actions
- Reviewing audit logs
- Creating/editing admin users
- Incident response procedures
- Performance metrics interpretation

---

## ✅ Sign-off

After completing all tests and verifications:

- [ ] **Engineering Lead**: Approved code review
- [ ] **Security Lead**: Approved security audit
- [ ] **Product Owner**: Approved feature completeness
- [ ] **Operations Lead**: Approved deployment process
- [ ] **Compliance Officer**: Approved audit trail implementation

**Deployment Date**: _________________

**Deployed By**: _________________

**Satellite Version**: _________________

**Status**: ⏳ Pending Deployment

---

## 📞 Support Contacts

**Technical Issues**:
- Backend (Rust): Platform Engineering Team
- Frontend (React): Frontend Team
- Juno/ICP: Juno Community Discord

**Security Concerns**:
- Email: security@qist.com
- Escalation: CTO

**Operational Issues**:
- Email: ops@qist.com
- On-call: Operations Team

---

**Last Updated**: December 24, 2025  
**Version**: 1.0.0  
**Next Review**: Weekly until stable
