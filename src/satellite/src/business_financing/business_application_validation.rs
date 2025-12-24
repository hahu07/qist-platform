use junobuild_satellite::AssertSetDocContext;
use serde_json::Value;

/// Validates business application before approval
/// This is the critical gatekeeper that enforces due diligence completion
pub fn assert_business_application_approval(
    context: &AssertSetDocContext,
) -> Result<(), String> {
    let collection = &context.data.collection;
    
    // Only enforce for business_applications collection
    if collection != "business_applications" {
        return Ok(());
    }
    
    // Parse the proposed data from JSON string
    let data_str = std::str::from_utf8(&context.data.data.proposed.data)
        .map_err(|e| format!("Failed to decode business application data as UTF-8: {}", e))?;
    
    let data: Value = serde_json::from_str(data_str)
        .map_err(|e| format!("Failed to parse business application data: {}", e))?;
    
    let data = data.as_object()
        .ok_or("Invalid business application data format")?;
    
    // If status is being changed to 'approved', enforce strict rules
    if let Some(status) = data.get("status") {
        if status.as_str() == Some("approved") {
            // 1. CRITICAL: Verify due diligence is 100% complete
            let dd_score = data.get("dueDiligenceScore")
                .and_then(|v| v.as_i64())
                .unwrap_or(0);
            
            if dd_score < 100 {
                return Err(format!(
                    "❌ Cannot approve: Due diligence only {}% complete. Must be 100%",
                    dd_score
                ));
            }
            
            // 2. Verify all required fields exist
            let required_fields = vec![
                "businessName",
                "businessEmail",
                "businessPhone",
                "businessAddress",
                "requestedAmount",
                "contractType",
                "industry",
                "yearsInOperation",
            ];
            
            for field in required_fields {
                if !data.contains_key(field) || data.get(field).unwrap().is_null() {
                    return Err(format!("❌ Missing required field: {}", field));
                }
            }
            
            // 3. Validate requested amount is within platform bounds
            if let Some(amount) = data.get("requestedAmount").and_then(|v| v.as_f64()) {
                if amount < 100_000.0 {
                    return Err("❌ Requested amount must be at least ₦100,000".to_string());
                }
                if amount > 100_000_000.0 {
                    return Err("❌ Requested amount cannot exceed ₦100,000,000".to_string());
                }
            } else {
                return Err("❌ Invalid requested amount".to_string());
            }
            
            // 4. Validate contract type is one of the allowed types
            let contract_type = data.get("contractType")
                .and_then(|v| v.as_str())
                .ok_or("❌ Invalid contract type")?;
            
            let valid_contracts = vec!["musharaka", "mudaraba", "murabaha", "ijara", "istisna"];
            if !valid_contracts.contains(&contract_type) {
                return Err(format!(
                    "❌ Invalid contract type: {}. Must be one of: {:?}",
                    contract_type, valid_contracts
                ));
            }
            
            // 5. Verify documents are submitted
            let docs_submitted = data.get("documentsSubmitted")
                .and_then(|v| v.as_bool())
                .unwrap_or(false);
            
            if !docs_submitted {
                return Err("❌ Cannot approve: Required documents not submitted".to_string());
            }
            
            // 6. Verify reviewer information is present
            if !data.contains_key("reviewedBy") || !data.contains_key("reviewedAt") {
                return Err("❌ Approval must include reviewer information".to_string());
            }
            
            // 7. Validate years in operation (prevent impossible values)
            if let Some(years) = data.get("yearsInOperation").and_then(|v| v.as_i64()) {
                if years < 0 || years > 200 {
                    return Err(format!(
                        "❌ Invalid years in operation: {}. Must be between 0 and 200",
                        years
                    ));
                }
            }
        }
    }
    
    Ok(())
}

/// Validates business application data integrity on submission
#[allow(dead_code)]
pub fn validate_application_data(data: &Value) -> Result<(), String> {
    // Validate email format
    if let Some(email) = data.get("businessEmail").and_then(|v| v.as_str()) {
        if !email.contains('@') || !email.contains('.') {
            return Err("Invalid email format".to_string());
        }
    }
    
    // Validate phone number (basic check)
    if let Some(phone) = data.get("businessPhone").and_then(|v| v.as_str()) {
        if phone.len() < 10 {
            return Err("Phone number must be at least 10 digits".to_string());
        }
    }
    
    // Validate BVN (11 digits)
    if let Some(bvn) = data.get("bvn").and_then(|v| v.as_str()) {
        if bvn.len() != 11 || !bvn.chars().all(|c| c.is_numeric()) {
            return Err("BVN must be exactly 11 digits".to_string());
        }
    }
    
    // Validate registration number is not empty
    if let Some(reg_num) = data.get("registrationNumber").and_then(|v| v.as_str()) {
        if reg_num.trim().is_empty() {
            return Err("Registration number cannot be empty".to_string());
        }
    }
    
    Ok(())
}

/// Calculates risk score based on application data
#[allow(dead_code)]
pub fn calculate_risk_score(data: &Value) -> Result<i32, String> {
    let mut score = 50; // Start with medium risk
    
    // Years in operation (more years = lower risk)
    if let Some(years) = data.get("yearsInOperation").and_then(|v| v.as_i64()) {
        if years >= 5 {
            score += 15;
        } else if years >= 2 {
            score += 10;
        } else if years < 1 {
            score -= 10;
        }
    }
    
    // Annual revenue (higher revenue = lower risk)
    if let Some(revenue) = data.get("annualRevenue").and_then(|v| v.as_f64()) {
        if revenue >= 50_000_000.0 {
            score += 20;
        } else if revenue >= 10_000_000.0 {
            score += 10;
        } else if revenue < 1_000_000.0 {
            score -= 15;
        }
    }
    
    // Number of employees (larger team = lower risk)
    if let Some(employees) = data.get("numberOfEmployees").and_then(|v| v.as_i64()) {
        if employees >= 50 {
            score += 10;
        } else if employees >= 10 {
            score += 5;
        } else if employees < 3 {
            score -= 5;
        }
    }
    
    // Clamp score between 0 and 100
    Ok(score.max(0).min(100))
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;
    
    #[test]
    fn test_validate_email() {
        let data = json!({
            "businessEmail": "test@example.com"
        });
        assert!(validate_application_data(&data).is_ok());
    }
    
    #[test]
    fn test_invalid_bvn() {
        let data = json!({
            "bvn": "123" // Too short
        });
        assert!(validate_application_data(&data).is_err());
    }
    
    #[test]
    fn test_risk_score_high_revenue() {
        let data = json!({
            "yearsInOperation": 10,
            "annualRevenue": 100000000.0,
            "numberOfEmployees": 100
        });
        let score = calculate_risk_score(&data).unwrap();
        assert!(score >= 80);
    }
}
