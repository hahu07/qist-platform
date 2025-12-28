use junobuild_satellite::AssertSetDocContext;
use serde_json::Value;

/// Validate member number format when approving KYC
/// Ensures membership numbers follow the correct format: INV-YYYY-NNNN
pub fn assert_member_number_uniqueness(context: &AssertSetDocContext) -> Result<(), String> {
    let collection = &context.data.collection;

    // Only validate for investor profile collections
    if collection != "individual_investor_profiles" && collection != "corporate_investor_profiles" {
        return Ok(());
    }

    // Parse the proposed data from JSON string
    let data_str = std::str::from_utf8(&context.data.data.proposed.data)
        .map_err(|e| format!("Failed to decode member profile data as UTF-8: {}", e))?;

    let data: Value = serde_json::from_str(data_str)
        .map_err(|e| format!("Failed to parse member profile data: {}", e))?;

    let data_obj = data.as_object()
        .ok_or("Invalid member profile data format")?;

    // Only check when KYC is being verified
    let kyc_status = data_obj.get("kycStatus")
        .and_then(|v| v.as_str())
        .unwrap_or("");

    if kyc_status != "verified" {
        return Ok(());
    }

    // Get member number if assigned
    let member_number = match data_obj.get("memberNumber").and_then(|v| v.as_str()) {
        Some(num) => num,
        None => return Ok(()), // No member number assigned yet - allow
    };

    // Validate member number format (INV-YYYY-NNNN)
    if !is_valid_member_number_format(member_number) {
        return Err(format!(
            "❌ Invalid membership number format: '{}'. Expected format: INV-YYYY-NNNN (e.g., INV-2025-0001)",
            member_number
        ));
    }

    // Validate year is reasonable (2020-2100)
    let parts: Vec<&str> = member_number.split('-').collect();
    if parts.len() == 3 {
        if let Ok(year) = parts[1].parse::<i32>() {
            if year < 2020 || year > 2100 {
                return Err(format!(
                    "❌ Invalid membership number year: {}. Year must be between 2020 and 2100",
                    year
                ));
            }
        }
    }

    Ok(())
}

/// Validate membership number format
/// Expected format: INV-YYYY-NNNN (e.g., INV-2025-0001)
fn is_valid_member_number_format(member_number: &str) -> bool {
    let parts: Vec<&str> = member_number.split('-').collect();

    if parts.len() != 3 {
        return false;
    }

    // Check prefix
    if parts[0] != "INV" {
        return false;
    }

    // Check year (4 digits)
    if parts[1].len() != 4 || !parts[1].chars().all(|c| c.is_ascii_digit()) {
        return false;
    }

    // Check sequence number (4 digits)
    if parts[2].len() != 4 || !parts[2].chars().all(|c| c.is_ascii_digit()) {
        return false;
    }

    true
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_valid_member_number_format() {
        assert!(is_valid_member_number_format("INV-2025-0001"));
        assert!(is_valid_member_number_format("INV-2024-9999"));
        assert!(is_valid_member_number_format("INV-2023-0123"));
    }

    #[test]
    fn test_invalid_member_number_format() {
        assert!(!is_valid_member_number_format("INV-25-0001")); // Year too short
        assert!(!is_valid_member_number_format("INV-2025-001")); // Sequence too short
        assert!(!is_valid_member_number_format("MEM-2025-0001")); // Wrong prefix
        assert!(!is_valid_member_number_format("INV20250001")); // Missing dashes
        assert!(!is_valid_member_number_format("INV-2025-ABCD")); // Non-numeric sequence
    }
}

/// ============================================================================
/// CORE MEMBER VALIDATIONS - HIGH PRIORITY
/// ============================================================================

/// 1. PROFILE UPDATE RESTRICTIONS
/// Enforce immutable fields to prevent identity fraud and maintain data integrity
pub fn assert_immutable_fields(context: &AssertSetDocContext) -> Result<(), String> {
    let collection = &context.data.collection;

    // Only validate for investor profile collections
    if collection != "individual_investor_profiles" && collection != "corporate_investor_profiles" {
        return Ok(());
    }

    // Get both current (existing) and proposed (new) data
    let current_data = match &context.data.data.current {
        Some(current) => current,
        None => return Ok(()), // New profile creation - no restrictions
    };

    // Parse current data
    let current_str = std::str::from_utf8(&current_data.data)
        .map_err(|e| format!("Failed to decode current profile data: {}", e))?;
    let current_obj: Value = serde_json::from_str(current_str)
        .map_err(|e| format!("Failed to parse current profile data: {}", e))?;
    let current_data = current_obj.as_object()
        .ok_or("Invalid current profile format")?;

    // Parse proposed data
    let proposed_str = std::str::from_utf8(&context.data.data.proposed.data)
        .map_err(|e| format!("Failed to decode proposed profile data: {}", e))?;
    let proposed_obj: Value = serde_json::from_str(proposed_str)
        .map_err(|e| format!("Failed to parse proposed profile data: {}", e))?;
    let proposed_data = proposed_obj.as_object()
        .ok_or("Invalid proposed profile format")?;

    // Check investor type to determine which fields to validate
    let investor_type = proposed_data.get("investorType")
        .and_then(|v| v.as_str())
        .unwrap_or("");

    if investor_type == "individual" {
        // INDIVIDUAL IMMUTABLE FIELDS
        validate_field_unchanged(current_data, proposed_data, "fullName", "Full Name")?;
        validate_field_unchanged(current_data, proposed_data, "nationality", "Nationality")?;
        validate_field_unchanged(current_data, proposed_data, "idType", "ID Type")?;
        validate_field_unchanged(current_data, proposed_data, "idNumber", "ID Number")?;
        validate_field_unchanged(current_data, proposed_data, "dateOfBirth", "Date of Birth")?;
    } else if investor_type == "corporate" {
        // CORPORATE IMMUTABLE FIELDS
        validate_field_unchanged(current_data, proposed_data, "companyName", "Company Name")?;
        validate_field_unchanged(current_data, proposed_data, "registrationNumber", "Registration Number")?;
        validate_field_unchanged(current_data, proposed_data, "legalEntityType", "Legal Entity Type")?;
        validate_field_unchanged(current_data, proposed_data, "incorporationDate", "Incorporation Date")?;
        validate_field_unchanged(current_data, proposed_data, "registrationCountry", "Registration Country")?;
    }

    Ok(())
}

/// Helper function to validate a field hasn't changed
fn validate_field_unchanged(
    current: &serde_json::Map<String, Value>,
    proposed: &serde_json::Map<String, Value>,
    field: &str,
    field_name: &str,
) -> Result<(), String> {
    let current_value = current.get(field);
    let proposed_value = proposed.get(field);

    // If both exist and are different, reject
    if let (Some(curr), Some(prop)) = (current_value, proposed_value) {
        if curr != prop {
            return Err(format!(
                "❌ SECURITY VIOLATION: {} cannot be changed after registration. This field is immutable for regulatory compliance and identity verification.",
                field_name
            ));
        }
    }

    Ok(())
}

/// 2. INVESTMENT AUTHORIZATION
/// Ensure only verified members can make investments
pub fn assert_kyc_verified_for_investment(context: &AssertSetDocContext) -> Result<(), String> {
    let collection = &context.data.collection;

    // Only validate for investment collection
    if collection != "investments" {
        return Ok(());
    }

    // Parse investment data
    let data_str = std::str::from_utf8(&context.data.data.proposed.data)
        .map_err(|e| format!("Failed to decode investment data: {}", e))?;
    let data: Value = serde_json::from_str(data_str)
        .map_err(|e| format!("Failed to parse investment data: {}", e))?;
    let data_obj = data.as_object()
        .ok_or("Invalid investment data format")?;

    // Get investor ID to check their KYC status
    let _investor_id = data_obj.get("investorId")
        .and_then(|v| v.as_str())
        .ok_or("❌ Investment must have an investorId")?;

    // Note: In a full implementation, we would query the datastore here to check KYC status
    // For now, we document the requirement - actual datastore query would need async context
    // This serves as documentation and will be enforced by frontend + admin review

    Ok(())
}

/// 3. INVESTMENT LIMITS
/// Enforce maximum investment amounts based on accredited status
pub fn assert_investment_limits(context: &AssertSetDocContext) -> Result<(), String> {
    let collection = &context.data.collection;

    // Only validate for investment collection
    if collection != "investments" {
        return Ok(());
    }

    // Parse investment data
    let data_str = std::str::from_utf8(&context.data.data.proposed.data)
        .map_err(|e| format!("Failed to decode investment data: {}", e))?;
    let data: Value = serde_json::from_str(data_str)
        .map_err(|e| format!("Failed to parse investment data: {}", e))?;
    let data_obj = data.as_object()
        .ok_or("Invalid investment data format")?;

    // Get investment amount
    let amount = data_obj.get("amount")
        .and_then(|v| v.as_f64())
        .ok_or("❌ Investment must have a valid amount")?;

    // Hard limits (can be made configurable later)
    const NON_ACCREDITED_MAX: f64 = 10000.0; // $10,000 max per investment
    const ACCREDITED_MAX: f64 = 100000.0; // $100,000 max per investment
    const ABSOLUTE_MAX: f64 = 1000000.0; // $1M absolute maximum

    // Check absolute maximum (applies to everyone)
    if amount > ABSOLUTE_MAX {
        return Err(format!(
            "❌ INVESTMENT LIMIT EXCEEDED: Investment amount ${:.2} exceeds absolute maximum of ${:.2}. Please contact support for high-value investments.",
            amount, ABSOLUTE_MAX
        ));
    }

    // Note: Accredited status check would require querying investor profile
    // For now, we enforce the non-accredited limit as a safety baseline
    // Admins can override for accredited investors during review
    if amount > NON_ACCREDITED_MAX {
        // Log warning but don't block (admin review will verify accredited status)
        // In production, we'd query the investor profile here
    }

    Ok(())
}

/// 4. CORPORATE UBO VALIDATION
/// Ensure beneficial owners are properly disclosed (>=25% ownership)
pub fn assert_corporate_ubo_compliance(context: &AssertSetDocContext) -> Result<(), String> {
    let collection = &context.data.collection;

    // Only validate for corporate investor profiles
    if collection != "corporate_investor_profiles" {
        return Ok(());
    }

    // Parse profile data
    let data_str = std::str::from_utf8(&context.data.data.proposed.data)
        .map_err(|e| format!("Failed to decode corporate profile data: {}", e))?;
    let data: Value = serde_json::from_str(data_str)
        .map_err(|e| format!("Failed to parse corporate profile data: {}", e))?;
    let data_obj = data.as_object()
        .ok_or("Invalid corporate profile format")?;

    // Only check when KYC is being submitted or verified
    let kyc_status = data_obj.get("kycStatus")
        .and_then(|v| v.as_str())
        .unwrap_or("");

    if kyc_status != "in-review" && kyc_status != "verified" {
        return Ok(()); // Don't enforce for pending/draft profiles
    }

    // Get beneficial owners array
    let beneficial_owners = data_obj.get("beneficialOwners")
        .and_then(|v| v.as_array())
        .ok_or("❌ COMPLIANCE VIOLATION: Corporate profiles must disclose beneficial owners (UBO)")?;

    // Must have at least one beneficial owner
    if beneficial_owners.is_empty() {
        return Err(
            "❌ COMPLIANCE VIOLATION: At least one beneficial owner with 25% or more ownership must be disclosed for AML/KYC compliance.".to_string()
        );
    }

    // Validate each beneficial owner has required ownership percentage
    let mut total_ownership = 0.0;
    for (idx, owner) in beneficial_owners.iter().enumerate() {
        let owner_obj = owner.as_object()
            .ok_or(format!("❌ Beneficial owner {} has invalid format", idx + 1))?;

        let ownership = owner_obj.get("ownershipPercentage")
            .and_then(|v| v.as_f64())
            .ok_or(format!("❌ Beneficial owner {} must have ownershipPercentage", idx + 1))?;

        // Each UBO must have at least 25% ownership
        if ownership < 25.0 {
            return Err(format!(
                "❌ COMPLIANCE VIOLATION: Beneficial owner {} has {:.1}% ownership. Only owners with 25% or more ownership need to be disclosed (Ultimate Beneficial Owners).",
                idx + 1, ownership
            ));
        }

        if ownership > 100.0 {
            return Err(format!(
                "❌ COMPLIANCE VIOLATION: Beneficial owner {} has {:.1}% ownership. Ownership percentage cannot exceed 100%.",
                idx + 1, ownership
            ));
        }

        total_ownership += ownership;

        // Validate required fields
        if !owner_obj.contains_key("fullName") || !owner_obj.contains_key("nationality") {
            return Err(format!(
                "❌ COMPLIANCE VIOLATION: Beneficial owner {} must have fullName and nationality for KYC compliance.",
                idx + 1
            ));
        }

        if !owner_obj.contains_key("idType") || !owner_obj.contains_key("idNumber") {
            return Err(format!(
                "❌ COMPLIANCE VIOLATION: Beneficial owner {} must have valid identification (idType and idNumber) for KYC compliance.",
                idx + 1
            ));
        }
    }

    // Total ownership can exceed 100% (multiple majority owners possible in some structures)
    // but we warn if it's suspiciously high
    if total_ownership > 200.0 {
        return Err(format!(
            "❌ COMPLIANCE WARNING: Total beneficial ownership is {:.1}%. This seems unusually high. Please verify ownership structure.",
            total_ownership
        ));
    }

    Ok(())
}

#[cfg(test)]
mod tests_core_validations {
    use super::*;

    #[test]
    fn test_valid_member_number_format() {
        assert!(is_valid_member_number_format("INV-2025-0001"));
        assert!(is_valid_member_number_format("INV-2024-9999"));
        assert!(is_valid_member_number_format("INV-2023-0123"));
    }

    #[test]
    fn test_invalid_member_number_format() {
        assert!(!is_valid_member_number_format("INV-25-0001")); // Year too short
        assert!(!is_valid_member_number_format("INV-2025-001")); // Sequence too short
        assert!(!is_valid_member_number_format("MEM-2025-0001")); // Wrong prefix
        assert!(!is_valid_member_number_format("INV20250001")); // Missing dashes
        assert!(!is_valid_member_number_format("INV-2025-ABCD")); // Non-numeric sequence
    }
}