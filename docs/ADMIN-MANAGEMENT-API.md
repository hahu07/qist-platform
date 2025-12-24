# Admin Management API

## Overview
Comprehensive admin role management system with secure creation, deactivation, reactivation, deletion, and permission updates.

## Security Model
- **Blockchain Validation**: All operations validated against `admin_profiles` datastore
- **Role Hierarchy**: Super Admin > Manager > Approver > Reviewer > Viewer
- **Audit Logging**: All sensitive operations logged with timestamp and metadata
- **Self-Protection**: Prevents self-demotion, self-deactivation, and self-deletion

---

## Operations

### 1. Create Admin
**Collection**: `admin_profiles`  
**Method**: `setDoc()`  
**Authorization**: Manager or Super Admin

**Rules**:
- Only managers can create admins
- Only super_admins can create other super_admins
- Required fields: `userId`, `displayName`, `email`, `role`, `approvalLimit`, `isActive`

**Validation**: `assert_can_manage_admins()`

```typescript
await setDoc({
  collection: "admin_profiles",
  doc: {
    key: userId,
    data: {
      userId,
      displayName: "John Doe",
      email: "john@amana.trade",
      role: "reviewer", // viewer | reviewer | approver | manager | super_admin
      approvalLimit: 5000000, // ₦5M for reviewer
      isActive: true,
      createdAt: Date.now(),
      createdBy: currentAdminId
    }
  }
});
```

---

### 2. Deactivate Admin (Soft Delete)
**Collection**: `admin_profiles`  
**Method**: `setDoc()` with `isActive: false`  
**Authorization**: Manager or Super Admin

**Rules**:
- Cannot deactivate yourself
- Deactivated admins cannot perform any operations
- Preserves all data and audit history

**Validation**: `assert_can_deactivate_admin()`

```typescript
await setDoc({
  collection: "admin_profiles",
  doc: {
    key: userId,
    data: {
      ...existingProfile,
      isActive: false,
      deactivatedAt: Date.now(),
      deactivatedBy: currentAdminId
    },
    version: existingProfile.version // Required for updates
  }
});
```

---

### 3. Reactivate Admin
**Collection**: `admin_profiles`  
**Method**: `setDoc()` with `isActive: true`  
**Authorization**: Manager or Super Admin

**Rules**:
- Restores full access with previous role and permissions
- Logged as separate action from deactivation

**Validation**: `assert_can_deactivate_admin()`

```typescript
await setDoc({
  collection: "admin_profiles",
  doc: {
    key: userId,
    data: {
      ...existingProfile,
      isActive: true,
      reactivatedAt: Date.now(),
      reactivatedBy: currentAdminId
    },
    version: existingProfile.version
  }
});
```

---

### 4. Delete Admin (Hard Delete)
**Collection**: `admin_profiles`  
**Method**: `deleteDoc()`  
**Authorization**: Super Admin ONLY

**Rules**:
- Permanently removes admin profile from datastore
- Cannot delete yourself
- Cannot be undone - use deactivation for reversible removal
- All audit logs are preserved

**Validation**: `assert_can_delete_admin()`

```typescript
await deleteDoc({
  collection: "admin_profiles",
  key: userId
});
```

---

### 5. Update Admin Permissions
**Collection**: `admin_profiles`  
**Method**: `setDoc()`  
**Authorization**: Manager or Super Admin

**Rules**:
- **Role Changes**:
  - Cannot promote to your own level or higher (except super_admin)
  - Only super_admins can promote to super_admin
  - Cannot demote yourself from super_admin
- **Approval Limit Changes**:
  - Only managers can increase limits
  - Managers cannot set limits above their own (₦100M)
  - Super admins have no limit restrictions

**Validation**: `assert_can_update_permissions()`

```typescript
// Increase approval limit
await setDoc({
  collection: "admin_profiles",
  doc: {
    key: userId,
    data: {
      ...existingProfile,
      approvalLimit: 50000000, // ₦50M (must be <= caller's limit)
      updatedAt: Date.now(),
      updatedBy: currentAdminId
    },
    version: existingProfile.version
  }
});

// Change role
await setDoc({
  collection: "admin_profiles",
  doc: {
    key: userId,
    data: {
      ...existingProfile,
      role: "approver", // Promote from reviewer to approver
      approvalLimit: 50000000, // Update limit to match new role
      updatedAt: Date.now(),
      updatedBy: currentAdminId
    },
    version: existingProfile.version
  }
});
```

---

## Role Approval Limits

| Role | Default Limit | Can Manage Team | Can Distribute Profits |
|------|--------------|----------------|----------------------|
| Viewer | ₦0 | ❌ | ❌ |
| Reviewer | ₦5,000,000 | ❌ | ❌ |
| Approver | ₦50,000,000 | ❌ | ❌ |
| Manager | ₦100,000,000 | ✅ | ✅ |
| Super Admin | Unlimited | ✅ | ✅ |

---

## Security Features

### 1. Self-Protection
```rust
// Prevent self-demotion
if target_user_id == caller && caller_role == "super_admin" && new_role != "super_admin" {
    return Err("Cannot demote yourself");
}

// Prevent self-deactivation
if target_user_id == caller && !is_active {
    return Err("Cannot deactivate your own account");
}

// Prevent self-deletion
if target_user_id == caller {
    return Err("Cannot delete your own account");
}
```

### 2. Hierarchy Enforcement
```rust
// Cannot promote above your level
if get_role_level(new_role) >= get_role_level(caller_role) && caller_role != "super_admin" {
    return Err("Cannot promote to your level or higher");
}

// Cannot set approval limits above your own
if new_limit > caller_limit && caller_role == "manager" {
    return Err("Cannot set limit higher than your own");
}
```

### 3. Audit Trail
All operations logged to `admin_audit_logs`:
- Admin ID performing action
- Action type (create/deactivate/reactivate/delete/update_permissions)
- Target collection and document ID
- Timestamp (blockchain time via `ic_cdk::api::time()`)
- Metadata (full document data)

---

## Frontend Integration

### Example: Admin Management Component

```typescript
import { setDoc, deleteDoc, getDoc } from "@junobuild/core";

// Deactivate admin
async function deactivateAdmin(userId: string) {
  const profile = await getDoc({
    collection: "admin_profiles",
    key: userId
  });
  
  await setDoc({
    collection: "admin_profiles",
    doc: {
      key: userId,
      data: {
        ...profile.data,
        isActive: false,
        deactivatedAt: Date.now()
      },
      version: profile.version
    }
  });
}

// Delete admin (super admin only)
async function deleteAdmin(userId: string) {
  await deleteDoc({
    collection: "admin_profiles",
    key: userId
  });
}

// Update permissions
async function updateApprovalLimit(userId: string, newLimit: number) {
  const profile = await getDoc({
    collection: "admin_profiles",
    key: userId
  });
  
  await setDoc({
    collection: "admin_profiles",
    doc: {
      key: userId,
      data: {
        ...profile.data,
        approvalLimit: newLimit,
        updatedAt: Date.now()
      },
      version: profile.version
    }
  });
}
```

---

## Error Messages

| Error | Meaning | Resolution |
|-------|---------|-----------|
| `❌ Access Denied: Only managers can deactivate admin accounts` | Non-manager tried to deactivate | Login as manager or super_admin |
| `❌ Security Policy: You cannot deactivate your own admin account` | Self-deactivation attempted | Have another admin deactivate you |
| `❌ Access Denied: Only super admins can permanently delete admin profiles` | Non-super_admin tried hard delete | Use deactivation or login as super_admin |
| `❌ Security Policy: You cannot delete your own admin account` | Self-deletion attempted | Have another super_admin delete you |
| `❌ Cannot promote to your level or higher` | Manager tried to create super_admin | Only super_admins can promote to super_admin |
| `❌ Cannot set limit higher than your own` | Manager exceeded their own limit | Login as super_admin for unlimited |
| `❌ Admin account 'user_123' is inactive` | Deactivated admin tried operation | Reactivate account first |

---

## Testing Checklist

### Manager Role Tests
- ✅ Can create viewer/reviewer/approver
- ✅ Cannot create super_admin
- ✅ Can deactivate other admins
- ✅ Cannot deactivate self
- ✅ Cannot delete admins (need super_admin)
- ✅ Can increase approval limits up to ₦100M
- ✅ Cannot set limits above ₦100M

### Super Admin Role Tests
- ✅ Can create all roles including super_admin
- ✅ Can delete admin profiles
- ✅ Cannot delete self
- ✅ Cannot demote self
- ✅ Can set unlimited approval limits
- ✅ Can promote managers to super_admin

### Deactivated Admin Tests
- ✅ Cannot approve applications
- ✅ Cannot manage team
- ✅ Cannot distribute profits
- ✅ Fetch from datastore returns error
- ✅ Can be reactivated by manager

---

## Deployment

After implementing frontend UI for these operations:

```bash
# Build serverless functions
juno functions build

# Deploy to production
juno functions upgrade

# Verify in Juno Console
# Check admin_profiles collection for proper validation
```

---

## Next Steps

1. **UI Implementation**: Add buttons for deactivate/reactivate/delete in admin team page
2. **Bulk Operations**: Implement `assert_bulk_admin_operation()` for mass management
3. **Audit Dashboard**: Create admin audit log viewer
4. **Notification System**: Alert admins when their permissions change
5. **Role Templates**: Pre-configured permission sets for common scenarios
