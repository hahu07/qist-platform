use serde_json::Value;

/// Validates KYC status and completeness
#[allow(dead_code)]
pub fn validate_kyc_status(profile_data: &Value) -> Result<(), String> {
    let kyc_status = profile_data.get("kycStatus")
        .and_then(|v| v.as_str())
        .unwrap_or("pending");
    
    let valid_statuses = vec!["pending", "in-review", "verified", "rejected"];
    
    if !valid_statuses.contains(&kyc_status) {
        return Err(format!("❌ Invalid KYC status: {}", kyc_status));
    }
    
    // If status is verified, ensure verification fields are present
    if kyc_status == "verified" {
        if profile_data.get("kycVerifiedAt").is_none() {
            return Err("❌ Verified KYC must include verification timestamp".to_string());
        }
        
        if profile_data.get("approvedBy").is_none() {
            return Err("❌ Verified KYC must include approver information".to_string());
        }
    }
    
    Ok(())
}

/// Validates Bank Verification Number (BVN) format
#[allow(dead_code)]
pub fn validate_bvn(bvn: &str) -> Result<(), String> {
    // BVN must be exactly 11 digits
    if bvn.len() != 11 {
        return Err(format!("❌ BVN must be 11 digits. Got: {}", bvn.len()));
    }
    
    // BVN must contain only numbers
    if !bvn.chars().all(|c| c.is_numeric()) {
        return Err("❌ BVN must contain only numeric characters".to_string());
    }
    
    // No spaces or special characters
    if bvn.contains(char::is_whitespace) {
        return Err("❌ BVN cannot contain spaces".to_string());
    }
    
    Ok(())
}

/// Validates business registration number format
#[allow(dead_code)]
pub fn validate_registration_number(reg_number: &str, business_type: &str) -> Result<(), String> {
    if reg_number.trim().is_empty() {
        return Err("❌ Registration number cannot be empty".to_string());
    }
    
    // For Nigerian businesses, RC numbers typically start with "RC" or "BN"
    match business_type {
        "llc" | "corporation" => {
            if !reg_number.starts_with("RC") && !reg_number.starts_with("rc") {
                return Err("❌ Limited companies should have RC (Registered Company) number".to_string());
            }
        }
        "sole_proprietorship" => {
            if !reg_number.starts_with("BN") && !reg_number.starts_with("bn") {
                return Err("❌ Sole proprietorships should have BN (Business Name) number".to_string());
            }
        }
        _ => {
            // Other business types may have varying formats
        }
    }
    
    Ok(())
}

/// Validates Shariah compliance of business activities
#[allow(dead_code)]
pub fn validate_shariah_compliance(industry: &str, business_description: &str) -> Result<(), String> {
    let prohibited_keywords = vec![
        "alcohol",
        "liquor",
        "gambling",
        "casino",
        "lottery",
        "betting",
        "pork",
        "tobacco",
        "cigarette",
        "interest",
        "conventional banking",
        "nightclub",
        "adult entertainment",
        "weapons",
        "pornography",
    ];
    
    let industry_lower = industry.to_lowercase();
    let description_lower = business_description.to_lowercase();
    
    // Check industry
    for prohibited in &prohibited_keywords {
        if industry_lower.contains(prohibited) {
            return Err(format!(
                "❌ Shariah Compliance: Business involves prohibited activity ({})",
                prohibited
            ));
        }
        
        if description_lower.contains(prohibited) {
            return Err(format!(
                "❌ Shariah Compliance: Business description mentions prohibited activity ({})",
                prohibited
            ));
        }
    }
    
    // Flag specifically prohibited industries
    let prohibited_industries = vec![
        "alcohol production",
        "gambling",
        "conventional finance",
        "adult entertainment",
        "weapons manufacturing",
    ];
    
    for prohibited_industry in prohibited_industries {
        if industry_lower == prohibited_industry {
            return Err(format!(
                "❌ Shariah Compliance: Industry '{}' is not permissible for Islamic financing",
                industry
            ));
        }
    }
    
    Ok(())
}

/// Validates identity document
#[allow(dead_code)]
pub fn validate_identity_document(
    id_type: &str,
    id_number: &str,
) -> Result<(), String> {
    match id_type.to_lowercase().as_str() {
        "national_id" | "nin" => {
            // Nigerian NIN is 11 digits
            if id_number.len() != 11 || !id_number.chars().all(|c| c.is_numeric()) {
                return Err("❌ National ID (NIN) must be 11 digits".to_string());
            }
        }
        "drivers_license" => {
            // Nigerian driver's license format varies, basic validation
            if id_number.len() < 10 {
                return Err("❌ Driver's license number seems invalid (too short)".to_string());
            }
        }
        "international_passport" => {
            // Nigerian passport is typically 9 characters (A12345678)
            if id_number.len() < 8 || id_number.len() > 10 {
                return Err("❌ Passport number format invalid".to_string());
            }
        }
        "voters_card" => {
            // PVC numbers vary
            if id_number.len() < 10 {
                return Err("❌ Voter's card number seems invalid".to_string());
            }
        }
        _ => {
            return Err(format!("❌ Unsupported ID type: {}", id_type));
        }
    }
    
    Ok(())
}

/// Performs AML (Anti-Money Laundering) basic checks
#[allow(dead_code)]
pub fn perform_aml_check(profile_data: &Value) -> Vec<String> {
    let mut flags = Vec::new();
    
    // Check for PEP (Politically Exposed Person) indicators
    if let Some(position) = profile_data.get("contactPersonPosition").and_then(|v| v.as_str()) {
        let pep_keywords = vec!["minister", "senator", "governor", "commissioner", "president"];
        for keyword in pep_keywords {
            if position.to_lowercase().contains(keyword) {
                flags.push(format!("⚠️ PEP Risk: Position '{}' requires enhanced due diligence", position));
                break;
            }
        }
    }
    
    // Check for high-risk industries
    if let Some(industry) = profile_data.get("industry").and_then(|v| v.as_str()) {
        let high_risk_industries = vec!["money transfer", "crypto", "forex", "gold trading"];
        for risk_industry in high_risk_industries {
            if industry.to_lowercase().contains(risk_industry) {
                flags.push(format!("⚠️ High-Risk Industry: '{}' requires enhanced monitoring", industry));
                break;
            }
        }
    }
    
    // Check for unusual business structure
    if let Some(years) = profile_data.get("yearsInOperation").and_then(|v| v.as_i64()) {
        if let Some(revenue) = profile_data.get("annualRevenue").and_then(|v| v.as_f64()) {
            // New business with very high revenue
            if years < 1 && revenue > 50_000_000.0 {
                flags.push("⚠️ Unusual Pattern: New business with high revenue requires verification".to_string());
            }
        }
    }
    
    flags
}

/// Validates contact information
#[allow(dead_code)]
pub fn validate_contact_information(email: &str, phone: &str) -> Result<(), String> {
    // Email validation
    if !email.contains('@') || !email.contains('.') {
        return Err("❌ Invalid email format".to_string());
    }
    
    // Check for common typos in email domains
    let suspicious_domains = vec!["gmial.com", "yahooo.com", "hotmial.com"];
    for suspicious in suspicious_domains {
        if email.ends_with(suspicious) {
            return Err(format!("❌ Suspicious email domain: {}. Please verify", suspicious));
        }
    }
    
    // Phone validation (Nigerian format)
    let phone_clean = phone.replace(&[' ', '-', '(', ')', '+'][..], "");
    
    if phone_clean.len() < 10 || phone_clean.len() > 14 {
        return Err("❌ Invalid phone number length".to_string());
    }
    
    // Check if it's mostly numeric
    let numeric_count = phone_clean.chars().filter(|c| c.is_numeric()).count();
    if numeric_count < 10 {
        return Err("❌ Phone number must contain at least 10 digits".to_string());
    }
    
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_valid_bvn() {
        assert!(validate_bvn("12345678901").is_ok());
    }
    
    #[test]
    fn test_invalid_bvn_length() {
        assert!(validate_bvn("123456").is_err());
    }
    
    #[test]
    fn test_invalid_bvn_characters() {
        assert!(validate_bvn("1234567890A").is_err());
    }
    
    #[test]
    fn test_shariah_compliance_alcohol() {
        let result = validate_shariah_compliance("Beverage", "We sell alcohol and spirits");
        assert!(result.is_err());
    }
    
    #[test]
    fn test_shariah_compliance_halal() {
        let result = validate_shariah_compliance("Food & Beverage", "Halal restaurant serving Nigerian cuisine");
        assert!(result.is_ok());
    }
    
    #[test]
    fn test_valid_nin() {
        assert!(validate_identity_document("nin", "12345678901").is_ok());
    }
    
    #[test]
    fn test_invalid_nin() {
        assert!(validate_identity_document("nin", "12345").is_err());
    }
    
    #[test]
    fn test_valid_email_phone() {
        assert!(validate_contact_information("test@example.com", "+234-801-234-5678").is_ok());
    }
}
