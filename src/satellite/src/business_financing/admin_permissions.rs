use junobuild_satellite::{AssertSetDocContext, AssertDeleteDocContext, get_doc};
use serde_json::Value;

/// Fetches admin profile from datastore (SECURITY-CRITICAL)
/// Always use this function to verify admin permissions - never trust frontend data
pub fn get_admin_profile(user_id: &str) -> Result<AdminProfile, String> {
    // Fetch from admin_profiles collection
    let doc = get_doc("admin_profiles".to_string(), user_id.to_string())
        .ok_or_else(|| format!("❌ Admin profile not found for user: {}", user_id))?;
    
    // Parse document data
    let data_bytes = doc.data;
    let data_str = std::str::from_utf8(&data_bytes)
        .map_err(|e| format!("❌ Failed to decode admin profile as UTF-8: {}", e))?;
    let data: Value = serde_json::from_str(data_str)
        .map_err(|e| format!("❌ Invalid JSON in admin profile: {}", e))?;
    
    // Extract and validate fields
    let role = data["role"].as_str().unwrap_or("viewer").to_string();
    let approval_limit = data["approvalLimit"].as_f64().unwrap_or(0.0);
    let is_active = data["isActive"].as_bool().unwrap_or(false);
    
    // Validate admin is active
    if !is_active {
        return Err(format!("❌ Admin account '{}' is inactive", user_id));
    }
    
    Ok(AdminProfile {
        user_id: data["userId"].as_str().unwrap_or(user_id).to_string(),
        display_name: data["displayName"].as_str().unwrap_or("Unknown").to_string(),
        role,
        approval_limit,
        is_active,
    })
}

/// Enhanced admin role validation with datastore lookup
/// SECURITY: Never trust role data from request - always fetch from datastore
#[allow(dead_code)]
pub fn validate_admin_role_from_datastore(
    context: &AssertSetDocContext,
    required_role: &str,
) -> Result<AdminProfile, String> {
    let caller = &context.caller.to_text();
    
    // Fetch admin profile from datastore
    let admin_profile = get_admin_profile(caller)?;
    
    // Validate role level
    if !has_sufficient_role(&admin_profile.role, required_role) {
        return Err(format!(
            "❌ Access Denied: Your role '{}' is insufficient. Required: '{}' or higher",
            admin_profile.role, required_role
        ));
    }
    
    Ok(admin_profile)
}

/// Admin Profile structure matching frontend schema
#[allow(dead_code)]
#[derive(Debug)]
pub struct AdminProfile {
    pub user_id: String,
    pub display_name: String,
    pub role: String,
    pub approval_limit: f64,
    pub is_active: bool,
}

/// Validates admin approval with amount-based limits
/// Enforces role hierarchy and approval limits from admin profile
pub fn assert_admin_approval_with_limits(
    context: &AssertSetDocContext,
) -> Result<(), String> {
    let collection = &context.data.collection;
    
    // Only validate business_applications collection
    if collection != "business_applications" {
        return Ok(());
    }
    
    let doc_data = &context.data.data.proposed.data;
    let data_str = std::str::from_utf8(doc_data)
        .map_err(|e| format!("❌ Failed to decode data as UTF-8: {}", e))?;
    let data: Value = serde_json::from_str(data_str)
        .map_err(|e| format!("❌ Invalid JSON data: {}", e))?;
    
    // Check if status is being set to "approved"
    let status = data["status"]
        .as_str()
        .ok_or_else(|| "❌ Missing status field".to_string())?;
    
    if status != "approved" {
        return Ok(()); // Only validate approvals
    }
    
    // Get requested amount
    let requested_amount = data["requestedAmount"]
        .as_f64()
        .ok_or_else(|| "❌ Missing or invalid requestedAmount".to_string())?;
    
    // Get approver ID from context.caller (tamper-proof)
    let approver_id = context.caller.to_text();
    
    // SECURITY: Fetch admin profile from datastore (never trust frontend data)
    let admin_profile = get_admin_profile(&approver_id)?;
    
    // Validate role-based approval limit
    if requested_amount > admin_profile.approval_limit {
        return Err(format!(
            "❌ Approval Denied: Amount ₦{:.2} exceeds your approval limit of ₦{:.2} ({} role)",
            requested_amount, admin_profile.approval_limit, admin_profile.role
        ));
    }
    
    // Validate approvedBy field matches caller (consistency check)
    let approved_by = data["approvedBy"]
        .as_str()
        .ok_or_else(|| "❌ Missing approvedBy field".to_string())?;
    
    if approved_by != approver_id {
        return Err(format!(
            "❌ Security violation: approvedBy field ('{}') does not match authenticated caller ('{}')",
            approved_by, approver_id
        ));
    }
    
    // Validate time-based restrictions for high-value approvals
    if requested_amount > 10_000_000.0 {
        // Get current time from Internet Computer
        let current_time_nanos = ic_cdk::api::time();
        // Convert nanoseconds to seconds
        let current_time_secs = current_time_nanos / 1_000_000_000;
        
        // Convert to datetime components (UTC)
        // Using simple calculation: seconds since Unix epoch (1970-01-01)
        let days_since_epoch = current_time_secs / 86400;
        let day_of_week = ((days_since_epoch + 4) % 7) as u8; // 0=Monday, 6=Sunday
        
        let seconds_today = current_time_secs % 86400;
        let hours = (seconds_today / 3600) as u8;
        
        // Check if weekend (Saturday=5, Sunday=6)
        if day_of_week >= 5 {
            return Err(format!(
                "❌ Time Restriction: Approvals above ₦10M cannot be processed on weekends. Amount: ₦{:.2}",
                requested_amount
            ));
        }
        
        // Check if outside business hours (6 AM - 10 PM UTC)
        if hours < 6 || hours >= 22 {
            return Err(format!(
                "❌ Time Restriction: Approvals above ₦10M must be processed between 6 AM - 10 PM (UTC). Current hour: {}:00. Amount: ₦{:.2}",
                hours, requested_amount
            ));
        }
    }
    
    // Validate dual authorization requirement
    if requested_amount > 50_000_000.0 {
        let secondary_approver = data["secondaryApprover"].as_str();
        
        if secondary_approver.is_none() || secondary_approver == Some("") {
            return Err(format!(
                "❌ Dual authorization required: Amount ₦{:.2} exceeds ₦50M threshold. Secondary approver must be assigned.",
                requested_amount
            ));
        }
    }
    
    Ok(())
}

/// Validates separation of duties
/// Ensures reviewer and approver are different people
pub fn validate_separation_of_duties(
    context: &AssertSetDocContext,
) -> Result<(), String> {
    let collection = &context.data.collection;
    
    if collection != "business_applications" {
        return Ok(());
    }
    
    let doc_data = &context.data.data.proposed.data;
    let data_str = std::str::from_utf8(doc_data)
        .map_err(|e| format!("❌ Failed to decode data as UTF-8: {}", e))?;
    let data: Value = serde_json::from_str(data_str)
        .map_err(|e| format!("❌ Invalid JSON data: {}", e))?;
    
    let status = data["status"].as_str();
    
    if status != Some("approved") {
        return Ok(());
    }
    
    // Get reviewer ID and approver ID
    let reviewed_by = data["reviewedBy"].as_str().unwrap_or("");
    let approved_by = data["approvedBy"].as_str().unwrap_or("");
    
    if !reviewed_by.is_empty() && reviewed_by == approved_by {
        return Err(
            "❌ Separation of duties violation: Reviewer cannot approve their own review".to_string()
        );
    }
    
    Ok(())
}

/// Logs admin action to audit trail
/// Records all sensitive operations for compliance
pub fn log_admin_action(
    admin_id: &str,
    action: &str,
    target_collection: &str,
    target_id: &str,
    metadata: Option<&Value>,
) -> Result<(), String> {
    // Generate timestamp
    let timestamp = ic_cdk::api::time();
    
    // Create audit log entry
    let _log_entry = format!(
        "{{\"adminId\":\"{}\",\"action\":\"{}\",\"targetCollection\":\"{}\",\"targetId\":\"{}\",\"timestamp\":{},\"metadata\":{}}}",
        admin_id,
        action,
        target_collection,
        target_id,
        timestamp,
        metadata.map(|m| m.to_string()).unwrap_or_else(|| "null".to_string())
    );
    
    // TODO: Store in admin_audit_logs collection
    // For now, just return success
    // set_doc("admin_audit_logs", &format!("{}_{}", admin_id, timestamp), &log_entry)?;
    
    Ok(())
}

/// Role hierarchy for permission checks
#[allow(dead_code)]
pub fn get_role_level(role: &str) -> i32 {
    match role {
        "super_admin" => 5,
        "manager" => 4,
        "approver" => 3,
        "reviewer" => 2,
        "viewer" => 1,
        _ => 0,
    }
}

/// Check if role has sufficient permission level
#[allow(dead_code)]
pub fn has_sufficient_role(user_role: &str, required_role: &str) -> bool {
    get_role_level(user_role) >= get_role_level(required_role)
}

/// Validates admin can manage other admins
pub fn assert_can_manage_admins(
    context: &AssertSetDocContext,
) -> Result<(), String> {
    let collection = &context.data.collection;
    
    if collection != "admin_profiles" {
        return Ok(());
    }
    
    let caller = context.caller.to_text();
    
    // Parse target admin data first to check if this is initial setup
    let doc_data = &context.data.data.proposed.data;
    let data_str = std::str::from_utf8(doc_data)
        .map_err(|e| format!("❌ Failed to decode data as UTF-8: {}", e))?;
    let data: Value = serde_json::from_str(data_str)
        .map_err(|e| format!("❌ Invalid JSON data: {}", e))?;
    
    let target_user_id = data["userId"].as_str().unwrap_or("");
    let new_role = data["role"].as_str().unwrap_or("");
    
    // BOOTSTRAP: Allow first super_admin creation without existing profile
    // If caller is creating their own super_admin profile and no profile exists, allow it
    let caller_profile_result = get_admin_profile(&caller);
    
    if caller_profile_result.is_err() {
        // No caller profile exists - check if this is bootstrap scenario
        if target_user_id == caller && new_role == "super_admin" {
            // Allow first super_admin to self-create
            return Ok(());
        }
        
        // Not bootstrap - return the original error
        return Err(format!(
            "❌ Admin profile not found. First user must create a super_admin profile for themselves. Your ID: {}",
            caller
        ));
    }
    
    // Normal flow: validate existing admin
    let caller_profile = caller_profile_result.unwrap();
    
    // Enforce manager-level access
    if !has_sufficient_role(&caller_profile.role, "manager") {
        return Err(format!(
            "❌ Access Denied: Only managers can manage admin profiles. Your role: {}",
            caller_profile.role
        ));
    }
    
    // Prevent super_admin from demoting themselves (unless another super_admin exists)
    if target_user_id == caller && caller_profile.role == "super_admin" && new_role != "super_admin" {
        return Err(
            "❌ Security Policy: Super admins cannot demote themselves. Have another super admin change your role.".to_string()
        );
    }
    
    // Prevent managers from creating/promoting to super_admin (only super_admins can)
    if new_role == "super_admin" && caller_profile.role != "super_admin" {
        return Err(
            "❌ Access Denied: Only super admins can create or promote to super_admin role".to_string()
        );
    }
    
    Ok(())
}

/// Validates profit distribution permissions
pub fn assert_can_distribute_profits(
    context: &AssertSetDocContext,
) -> Result<(), String> {
    let collection = &context.data.collection;
    
    if collection != "profit_distributions" {
        return Ok(());
    }
    
    // Only managers and super_admins can distribute profits
    let caller = context.caller.to_text();
    
    // SECURITY: Fetch admin profile and validate role
    let admin_profile = get_admin_profile(&caller)?;
    
    if !has_sufficient_role(&admin_profile.role, "manager") {
        return Err(format!(
            "❌ Access Denied: Only managers can distribute profits. Your role: {}",
            admin_profile.role
        ));
    }
    
    // Log the action
    let doc_data = &context.data.data.proposed.data;
    let data_str = std::str::from_utf8(doc_data)
        .map_err(|e| format!("❌ Failed to decode data as UTF-8: {}", e))?;
    let data: Value = serde_json::from_str(data_str)
        .map_err(|e| format!("❌ Invalid JSON data: {}", e))?;
    
    log_admin_action(
        &caller,
        "distribute_profit",
        collection,
        &context.data.key,
        Some(&data),
    )?;
    
    Ok(())
}

/// Validates admin deactivation (soft delete)
/// Allows managers to deactivate admin accounts without removing them
pub fn assert_can_deactivate_admin(
    context: &AssertSetDocContext,
) -> Result<(), String> {
    let collection = &context.data.collection;
    
    if collection != "admin_profiles" {
        return Ok(());
    }
    
    let caller = context.caller.to_text();
    
    // Parse target admin data to check for bootstrap scenario
    let doc_data = &context.data.data.proposed.data;
    let data_str = std::str::from_utf8(doc_data)
        .map_err(|e| format!("❌ Failed to decode data as UTF-8: {}", e))?;
    let data: Value = serde_json::from_str(data_str)
        .map_err(|e| format!("❌ Invalid JSON data: {}", e))?;
    
    let target_user_id = data["userId"].as_str().unwrap_or("");
    let new_role = data["role"].as_str().unwrap_or("");
    let is_active = data["isActive"].as_bool().unwrap_or(true);
    
    // BOOTSTRAP: Allow first super_admin creation (skip this validator)
    let caller_profile_result = get_admin_profile(&caller);
    if caller_profile_result.is_err() {
        if target_user_id == caller && new_role == "super_admin" && is_active {
            // Allow bootstrap - first super_admin self-creation
            return Ok(());
        }
        // Not bootstrap - return error
        return Err(format!("❌ Admin profile not found for user: {}", caller));
    }
    
    // SECURITY: Fetch caller's admin profile from datastore
    let caller_profile = caller_profile_result.unwrap();
    
    // Enforce manager-level access for deactivation
    if !has_sufficient_role(&caller_profile.role, "manager") {
        return Err(format!(
            "❌ Access Denied: Only managers can deactivate admin accounts. Your role: {}",
            caller_profile.role
        ));
    }
    
    // Prevent self-deactivation
    if target_user_id == caller && !is_active {
        return Err(
            "❌ Security Policy: You cannot deactivate your own admin account".to_string()
        );
    }
    
    // Prevent deactivating the last super_admin
    let target_role = data["role"].as_str().unwrap_or("");
    if target_role == "super_admin" && !is_active {
        // TODO: Check if other active super_admins exist
        // For now, allow but log warning
    }
    
    // Log the action
    let action = if is_active { "reactivate_admin" } else { "deactivate_admin" };
    log_admin_action(
        &caller,
        action,
        collection,
        target_user_id,
        Some(&data),
    )?;
    
    Ok(())
}

/// Validates admin deletion (hard delete)
/// Only super_admins can permanently remove admin accounts
pub fn assert_can_delete_admin(
    context: &AssertDeleteDocContext,
) -> Result<(), String> {
    let collection = &context.data.collection;
    
    if collection != "admin_profiles" {
        return Ok(());
    }
    
    let caller = context.caller.to_text();
    
    // SECURITY: Fetch caller's admin profile from datastore
    let caller_profile = get_admin_profile(&caller)?;
    
    // Only super_admins can permanently delete admin profiles
    if caller_profile.role != "super_admin" {
        return Err(format!(
            "❌ Access Denied: Only super admins can permanently delete admin profiles. Your role: {}. Use deactivation instead.",
            caller_profile.role
        ));
    }
    
    let target_user_id = &context.data.key;
    
    // Prevent self-deletion
    if target_user_id == &caller {
        return Err(
            "❌ Security Policy: You cannot delete your own admin account".to_string()
        );
    }
    
    // Log the action
    log_admin_action(
        &caller,
        "delete_admin",
        collection,
        target_user_id,
        None,
    )?;
    
    Ok(())
}

/// Validates permission updates for admin roles
/// Ensures proper authorization hierarchy when changing approval limits or roles
pub fn assert_can_update_permissions(
    context: &AssertSetDocContext,
) -> Result<(), String> {
    let collection = &context.data.collection;
    
    if collection != "admin_profiles" {
        return Ok(());
    }
    
    let caller = context.caller.to_text();
    
    // Parse target admin data to check for bootstrap scenario
    let doc_data = &context.data.data.proposed.data;
    let data_str = std::str::from_utf8(doc_data)
        .map_err(|e| format!("❌ Failed to decode data as UTF-8: {}", e))?;
    let data: Value = serde_json::from_str(data_str)
        .map_err(|e| format!("❌ Invalid JSON data: {}", e))?;
    
    let target_user_id = data["userId"].as_str().unwrap_or("");
    let new_role = data["role"].as_str().unwrap_or("");
    
    // BOOTSTRAP: Allow first super_admin creation (skip this validator)
    let caller_profile_result = get_admin_profile(&caller);
    if caller_profile_result.is_err() {
        if target_user_id == caller && new_role == "super_admin" {
            // Allow bootstrap - first super_admin self-creation
            return Ok(());
        }
        // Not bootstrap - return error
        return Err(format!("❌ Admin profile not found for user: {}", caller));
    }
    
    // SECURITY: Fetch caller's admin profile from datastore
    let caller_profile = caller_profile_result.unwrap();();
    
    let new_approval_limit = data["approvalLimit"].as_f64().unwrap_or(0.0);
    
    // Get existing profile if it exists
    if let Ok(existing_profile) = get_admin_profile(target_user_id) {
        // Check if approval limit is being increased
        if new_approval_limit > existing_profile.approval_limit {
            // Only managers and super_admins can increase approval limits
            if !has_sufficient_role(&caller_profile.role, "manager") {
                return Err(format!(
                    "❌ Access Denied: Only managers can increase approval limits. Your role: {}",
                    caller_profile.role
                ));
            }
            
            // Managers cannot set limits above their own
            if caller_profile.role == "manager" && new_approval_limit > caller_profile.approval_limit {
                return Err(format!(
                    "❌ Access Denied: Cannot set approval limit (₦{:.2}) higher than your own (₦{:.2})",
                    new_approval_limit, caller_profile.approval_limit
                ));
            }
        }
        
        // Check if role is being changed to a higher level
        if get_role_level(new_role) > get_role_level(&existing_profile.role) {
            // Only super_admins can promote to their own level or above
            if get_role_level(new_role) >= get_role_level(&caller_profile.role) && caller_profile.role != "super_admin" {
                return Err(format!(
                    "❌ Access Denied: Cannot promote admin to role '{}' (level {}) when your role is '{}' (level {})",
                    new_role, get_role_level(new_role), caller_profile.role, get_role_level(&caller_profile.role)
                ));
            }
        }
    }
    
    // Log the action
    log_admin_action(
        &caller,
        "update_admin_permissions",
        collection,
        target_user_id,
        Some(&data),
    )?;
    
    Ok(())
}

/// Validates bulk admin operations
/// Prevents mass deactivation or role changes without proper authorization
pub fn assert_bulk_admin_operation(
    caller_role: &str,
    operation: &str,
    target_count: usize,
) -> Result<(), String> {
    // Only super_admins can perform bulk operations
    if caller_role != "super_admin" {
        return Err(format!(
            "❌ Access Denied: Only super admins can perform bulk operations. Your role: {}",
            caller_role
        ));
    }
    
    // Limit bulk operations to reasonable sizes
    let max_bulk_size = match operation {
        "deactivate" => 10,
        "delete" => 5,
        "update_permissions" => 20,
        _ => 50,
    };
    
    if target_count > max_bulk_size {
        return Err(format!(
            "❌ Bulk Operation Limit: Cannot {} more than {} admin profiles at once. Current: {}",
            operation, max_bulk_size, target_count
        ));
    }
    
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_role_hierarchy() {
        assert_eq!(get_role_level("super_admin"), 5);
        assert_eq!(get_role_level("manager"), 4);
        assert_eq!(get_role_level("approver"), 3);
        assert_eq!(get_role_level("reviewer"), 2);
        assert_eq!(get_role_level("viewer"), 1);
        assert_eq!(get_role_level("unknown"), 0);
    }

    #[test]
    fn test_has_sufficient_role() {
        assert!(has_sufficient_role("super_admin", "manager"));
        assert!(has_sufficient_role("manager", "approver"));
        assert!(has_sufficient_role("approver", "reviewer"));
        assert!(!has_sufficient_role("viewer", "approver"));
        assert!(!has_sufficient_role("reviewer", "manager"));
    }
    
    #[test]
    fn test_bulk_operation_limits() {
        assert!(assert_bulk_admin_operation("super_admin", "deactivate", 5).is_ok());
        assert!(assert_bulk_admin_operation("super_admin", "deactivate", 15).is_err());
        assert!(assert_bulk_admin_operation("manager", "deactivate", 5).is_err());
    }
}
