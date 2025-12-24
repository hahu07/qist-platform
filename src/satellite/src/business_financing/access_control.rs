use junobuild_satellite::AssertSetDocContext;
use serde_json::Value;

/// Role-based access control
#[allow(dead_code)]
#[derive(Debug, PartialEq)]
pub enum UserRole {
    // Admin role types with hierarchical permissions
    SuperAdmin,  // Full system access, can manage all admins
    Manager,     // Can approve up to ₦100M, manage team, distribute profits
    Approver,    // Can approve up to ₦50M
    Reviewer,    // Can approve up to ₦5M, review applications
    Viewer,      // Read-only admin access
    
    // Non-admin roles
    Business,    // Business owner/applicant
    Member,      // Investor/member
}

#[allow(dead_code)]
impl UserRole {
    pub fn from_string(role: &str) -> Self {
        match role.to_lowercase().as_str() {
            "super_admin" | "superadmin" => UserRole::SuperAdmin,
            "manager" => UserRole::Manager,
            "approver" => UserRole::Approver,
            "reviewer" => UserRole::Reviewer,
            "viewer" => UserRole::Viewer,
            "admin" => UserRole::Manager, // Default admin role maps to Manager
            "business" => UserRole::Business,
            "member" | "investor" => UserRole::Member,
            _ => UserRole::Member, // Default to Member for authenticated users
        }
    }
    
    /// Check if role has admin-level access
    pub fn is_admin(&self) -> bool {
        matches!(
            self,
            UserRole::SuperAdmin | UserRole::Manager | UserRole::Approver | UserRole::Reviewer | UserRole::Viewer
        )
    }
    
    /// Check if role has management permissions
    pub fn is_manager_or_above(&self) -> bool {
        matches!(self, UserRole::SuperAdmin | UserRole::Manager)
    }
    
    /// Check if role can approve applications
    pub fn can_approve(&self) -> bool {
        matches!(
            self,
            UserRole::SuperAdmin | UserRole::Manager | UserRole::Approver | UserRole::Reviewer
        )
    }
}

/// Validates user has permission to perform action
#[allow(dead_code)]
pub fn validate_user_permission(
    user_role: UserRole,
    action: &str,
    resource: &str,
) -> Result<(), String> {
    match action {
        "approve_application" | "reject_application" => {
            if !user_role.can_approve() {
                return Err(format!(
                    "❌ Access Denied: Only admin staff (Reviewer or above) can {} on {}",
                    action, resource
                ));
            }
        }
        "review_kyc" => {
            if !user_role.is_admin() {
                return Err(format!(
                    "❌ Access Denied: Only admin staff can {} on {}",
                    action, resource
                ));
            }
        }
        "manage_team" | "distribute_profits" => {
            if !user_role.is_manager_or_above() {
                return Err(format!(
                    "❌ Access Denied: Only Managers or Super Admins can {} on {}",
                    action, resource
                ));
            }
        }
        "submit_application" | "upload_documents" => {
            if user_role != UserRole::Business && !user_role.is_admin() {
                return Err(format!(
                    "❌ Access Denied: Only businesses can {} for {}",
                    action, resource
                ));
            }
        }
        "invest" | "view_opportunities" => {
            // All authenticated users (Member or Business) can invest/view
            // Admin authentication is handled by Juno/Internet Identity
        }
        "create_opportunity" => {
            if !user_role.is_manager_or_above() {
                return Err("❌ Access Denied: Only Managers can create opportunities".to_string());
            }
        }
        _ => {
            // Default: allow
        }
    }
    
    Ok(())
}

/// Validates that a user can only access their own data
#[allow(dead_code)]
pub fn validate_data_ownership(
    user_id: &str,
    resource_owner_id: &str,
    user_role: UserRole,
) -> Result<(), String> {
    // Admin staff can access any data (based on their specific role permissions)
    if user_role.is_admin() {
        return Ok(());
    }
    
    // Users can only access their own data
    if user_id != resource_owner_id {
        return Err("❌ Access Denied: You can only access your own data".to_string());
    }
    
    Ok(())
}

/// Validates admin-only operations
pub fn assert_admin_only_operation(context: &AssertSetDocContext) -> Result<(), String> {
    let collection = &context.data.collection;
    
    // SKIP admin_profiles - bootstrap logic handled in assert_can_manage_admins
    if collection == "admin_profiles" {
        return Ok(());
    }
    
    // Parse the proposed data from JSON string
    let data_str = std::str::from_utf8(&context.data.data.proposed.data)
        .map_err(|e| format!("Failed to decode data as UTF-8: {}", e))?;
    
    let data: Value = serde_json::from_str(data_str)
        .map_err(|e| format!("Failed to parse data: {}", e))?;
    
    let data = data.as_object()
        .ok_or("Invalid data format")?;
    
    // Operations that require admin privileges
    let admin_only_collections = vec![
        "opportunities",           // Only admins create opportunities
        "profit_distributions",    // Only admins distribute profits
        "admin_audit_logs",        // Only admins can write audit logs
    ];
    
    if admin_only_collections.contains(&collection.as_str()) {
        // Check if user has admin role (in production, this would check JWT or session)
        // For audit logs, check adminId field instead of createdBy
        let admin_field = if collection == "admin_audit_logs" {
            data.get("adminId").and_then(|v| v.as_str())
        } else {
            data.get("createdBy").and_then(|v| v.as_str())
        };
        
        if let Some(admin_user) = admin_field {
            // In production, verify admin_user is actually an admin
            if !is_admin_user(admin_user) {
                return Err(format!(
                    "❌ Access Denied: Only admins can create {} records",
                    collection
                ));
            }
        } else {
            let required_field = if collection == "admin_audit_logs" { "adminId" } else { "createdBy" };
            return Err(format!("❌ Admin operations must include {} field", required_field));
        }
    }
    
    // Prevent non-admins from changing status to 'approved'
    if collection == "business_applications" || collection == "revenue_reports" {
        if let Some(status) = data.get("status").and_then(|v| v.as_str()) {
            if status == "approved" {
                // Verify this is being done by an admin
                if !data.contains_key("approvedBy") && !data.contains_key("reviewedBy") {
                    return Err("❌ Approval must be done by an admin with proper authorization".to_string());
                }
            }
        }
    }
    
    Ok(())
}

/// Rate limiting check (simple implementation)
pub struct RateLimiter {
    pub max_requests_per_hour: u32,
}

#[allow(dead_code)]
impl RateLimiter {
    pub fn new(max_requests: u32) -> Self {
        RateLimiter {
            max_requests_per_hour: max_requests,
        }
    }
    
    pub fn check_rate_limit(
        &self,
        user_id: &str,
        request_count: u32,
    ) -> Result<(), String> {
        if request_count > self.max_requests_per_hour {
            return Err(format!(
                "❌ Rate Limit Exceeded: User {} has made {} requests (max: {})",
                user_id, request_count, self.max_requests_per_hour
            ));
        }
        Ok(())
    }
}

/// Audit logging for sensitive operations
#[allow(dead_code)]
pub fn log_sensitive_operation(
    user_id: &str,
    action: &str,
    resource: &str,
    details: &Value,
) -> String {
    let timestamp = chrono::Utc::now().to_rfc3339();
    
    format!(
        "[AUDIT] {} | User: {} | Action: {} | Resource: {} | Details: {}",
        timestamp,
        user_id,
        action,
        resource,
        serde_json::to_string(details).unwrap_or_else(|_| "{}".to_string())
    )
}

/// Validates IP-based access control (placeholder for geo-restriction)
#[allow(dead_code)]
pub fn validate_ip_access(ip_address: &str, _allowed_countries: Vec<&str>) -> Result<(), String> {
    // In production, this would use a GeoIP service
    // For now, just a placeholder implementation
    
    // Block known malicious IPs (example)
    let blocked_ips = vec!["0.0.0.0", "127.0.0.1"];
    
    if blocked_ips.contains(&ip_address) {
        return Err(format!("❌ Access Denied: IP {} is blocked", ip_address));
    }
    
    Ok(())
}

/// Validates business can only submit one active application at a time
#[allow(dead_code)]
pub fn validate_single_active_application(
    business_id: &str,
    existing_applications: Vec<Value>,
) -> Result<(), String> {
    let active_statuses = vec!["pending", "under_review", "in-review"];
    
    for app in existing_applications {
        let app_business_id = app.get("businessId")
            .or_else(|| app.get("key"))
            .and_then(|v| v.as_str())
            .unwrap_or("");
        
        let status = app.get("status")
            .and_then(|v| v.as_str())
            .unwrap_or("unknown");
        
        if app_business_id == business_id && active_statuses.contains(&status) {
            return Err(format!(
                "❌ Access Denied: You already have an active application (status: {}). Wait for it to be processed.",
                status
            ));
        }
    }
    
    Ok(())
}

/// Helper function to check if user is admin (stub for production implementation)
fn is_admin_user(user_id: &str) -> bool {
    // In production, this would:
    // 1. Query user collection to get role
    // 2. Verify JWT token has admin claims
    // 3. Check against admin whitelist
    
    // For now, placeholder that assumes admin verification is done elsewhere
    !user_id.is_empty()
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_admin_can_approve() {
        let result = validate_user_permission(
            UserRole::Manager,
            "approve_application",
            "business_applications"
        );
        assert!(result.is_ok());
    }
    
    #[test]
    fn test_reviewer_can_approve() {
        let result = validate_user_permission(
            UserRole::Reviewer,
            "approve_application",
            "business_applications"
        );
        assert!(result.is_ok());
    }
    
    #[test]
    fn test_viewer_cannot_approve() {
        let result = validate_user_permission(
            UserRole::Viewer,
            "approve_application",
            "business_applications"
        );
        assert!(result.is_err());
    }
    
    #[test]
    fn test_business_cannot_approve() {
        let result = validate_user_permission(
            UserRole::Business,
            "approve_application",
            "business_applications"
        );
        assert!(result.is_err());
    }
    
    #[test]
    fn test_data_ownership_admin() {
        let result = validate_data_ownership("user1", "user2", UserRole::Manager);
        assert!(result.is_ok());
    }
    
    #[test]
    fn test_data_ownership_non_admin() {
        let result = validate_data_ownership("user1", "user2", UserRole::Business);
        assert!(result.is_err());
    }
    
    #[test]
    fn test_rate_limiter() {
        let limiter = RateLimiter::new(100);
        assert!(limiter.check_rate_limit("user1", 50).is_ok());
        assert!(limiter.check_rate_limit("user1", 150).is_err());
    }
}
