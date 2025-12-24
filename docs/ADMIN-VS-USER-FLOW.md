# Admin vs User Flow

## Key Differences

### Admin Users
- **No Onboarding Required**: Admins are internal staff, not applicants/investors
- **Direct Access**: Skip business/investor onboarding flows entirely
- **Setup Flow**: First admin uses `/admin/setup` to create super_admin profile
- **Authentication Check**: System checks `admin_profiles` collection first
- **Dashboard**: Routes to `/admin/dashboard` after authentication

### Regular Users
- **Onboarding Required**: Must complete either business or investor onboarding
- **Profile Creation**: Creates `business_profiles` or `investor_profiles`
- **KYC Process**: Must submit documents and complete verification
- **Dashboard**: Routes to `/business/dashboard` or `/member/dashboard`

---

## First Admin Setup Flow

### 1. Navigate to Admin Setup
```
Visit: https://your-domain.com/admin/setup
```

### 2. Authenticate
- Sign in with Internet Identity, NFID, or other provider
- System checks if admin profile exists

### 3. Create Super Admin Profile
- Fill in:
  - Full Name
  - Email Address
  - Phone Number (optional)
- Automatically assigned `super_admin` role
- Unlimited approval limit
- All permissions enabled

### 4. Bootstrap Protection
The Rust serverless function has special bootstrap logic:

```rust
// If caller is creating their own super_admin profile and no profile exists, allow it
if target_user_id == caller && new_role == "super_admin" {
    return Ok(()); // Allow first super_admin self-creation
}
```

This allows the **first user** to create a super_admin profile without needing an existing admin to approve them.

### 5. Subsequent Admin Creation
After the first super_admin exists:
- Only existing managers/super_admins can create new admins
- Navigate to `/admin/team`
- Click "Add New Admin"
- Fill in profile details and assign role
- New admin can immediately login and access their dashboard

---

## Authentication Priority Order

When a user signs in, the system checks profiles in this order:

1. **Admin Profile** (`admin_profiles` collection)
   - If found and active → `/admin/dashboard`
   - If found but inactive → Error message

2. **Investor Profile** (`individual_investor_profiles` or `corporate_investor_profiles`)
   - If found → `/member/dashboard`

3. **Business Profile** (`business_profiles`)
   - If found → `/business/dashboard`

4. **No Profile Found**
   - → `/onboarding` (role selection page)

---

## Admin Profile Schema

```typescript
{
  userId: string;              // Internet Identity principal
  displayName: string;         // Full name
  email: string;              // Contact email
  phoneNumber?: string;       // Optional phone
  role: "super_admin" | "manager" | "approver" | "reviewer" | "viewer";
  approvalLimit: number;      // Maximum approval amount in ₦
  isActive: boolean;          // Account status
  createdAt: number;          // Timestamp
  createdBy: string;          // Admin who created this profile
  permissions: {
    canManageTeam: boolean;
    canDistributeProfits: boolean;
    canApproveApplications: boolean;
    canManageOpportunities: boolean;
    canViewReports: boolean;
    canManageSettings: boolean;
  };
}
```

---

## Common Scenarios

### Scenario 1: First Time Platform Setup
1. Deploy platform
2. Visit `/admin/setup`
3. Sign in with Internet Identity
4. Create super_admin profile
5. Access admin dashboard
6. Add other team members via `/admin/team`

### Scenario 2: Regular User Signs Up
1. Visit homepage
2. Click "Get Started"
3. Sign in with Internet Identity
4. Redirected to `/onboarding`
5. Choose "Business" or "Investor"
6. Complete onboarding flow
7. Submit application/documents
8. Wait for admin approval

### Scenario 3: Existing Admin Logs In
1. Sign in with Internet Identity
2. System finds admin profile
3. Checks `isActive: true`
4. Redirects to `/admin/dashboard`
5. Can perform actions based on role/permissions

### Scenario 4: Deactivated Admin Tries Login
1. Sign in with Internet Identity
2. System finds admin profile
3. Checks `isActive: false`
4. Redirects to signin with error: `?error=inactive_admin`
5. Cannot access any dashboards

---

## Security Implications

### Bootstrap Phase (No Admins Exist)
- ✅ **Allow**: First user creating super_admin for themselves
- ❌ **Block**: Creating any other role without admin
- ❌ **Block**: Creating super_admin for someone else

### Normal Operations (Admins Exist)
- ✅ **Allow**: Managers/Super Admins creating new admins
- ✅ **Allow**: Role-based permissions enforcement
- ❌ **Block**: Self-promotion to higher roles
- ❌ **Block**: Creating admin without manager authorization

### Blockchain Validation
All admin operations validated on-chain:
- Cannot fake admin profile from frontend
- Cannot bypass approval limits
- Cannot operate with inactive account
- All actions logged to audit trail

---

## Deployment Steps

### 1. Build Frontend
```bash
npm run build
```

### 2. Build Serverless Functions
```bash
juno functions build
```

### 3. Deploy Hosting
```bash
juno hosting deploy
```

### 4. Upgrade Functions
```bash
juno functions upgrade
```

### 5. Create First Admin
- Visit `https://your-satellite-id.icp0.io/admin/setup`
- Complete profile creation
- Verify access to admin dashboard

---

## Troubleshooting

### Error: "Admin profile not found"
- **During Bootstrap**: Navigate to `/admin/setup` first
- **After Bootstrap**: Contact existing admin to create your profile
- **Check**: Verify you're signing in with correct Internet Identity

### Error: "Only managers can manage admin profiles"
- You're not a manager or super_admin
- Contact super_admin to upgrade your role
- Cannot create admin profiles with viewer/reviewer/approver roles

### Redirected to Onboarding Instead of Admin Dashboard
- No admin profile exists for your user ID
- Visit `/admin/setup` if you're the first admin
- Or ask existing admin to create profile for you

### "Inactive Admin" Error
- Your admin account has been deactivated
- Contact super_admin to reactivate
- Cannot perform any operations while inactive
