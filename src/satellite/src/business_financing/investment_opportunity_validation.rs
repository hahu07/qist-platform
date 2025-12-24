use junobuild_satellite::AssertSetDocContext;
use serde_json::Value;

/// Validates investment opportunity creation
/// Ensures opportunities are only created from approved applications
pub fn assert_investment_opportunity_creation(
    context: &AssertSetDocContext,
) -> Result<(), String> {
    let collection = &context.data.collection;
    
    if collection != "opportunities" {
        return Ok(());
    }
    
    // Parse the proposed data from JSON string
    let data_str = std::str::from_utf8(&context.data.data.proposed.data)
        .map_err(|e| format!("Failed to decode opportunity data as UTF-8: {}", e))?;
    
    let data: Value = serde_json::from_str(data_str)
        .map_err(|e| format!("Failed to parse opportunity data: {}", e))?;
    
    let data = data.as_object()
        .ok_or("Invalid opportunity data format")?;
    
    // 1. Verify opportunity is linked to an approved application
    let application_id = data.get("applicationId")
        .and_then(|v| v.as_str())
        .ok_or("❌ Opportunity must be linked to an application")?;
    
    if application_id.is_empty() {
        return Err("❌ Application ID cannot be empty".to_string());
    }
    
    // 2. Validate funding goal
    let funding_goal = data.get("fundingGoal")
        .and_then(|v| v.as_f64())
        .ok_or("❌ Invalid funding goal")?;
    
    if funding_goal < 100_000.0 {
        return Err("❌ Funding goal must be at least ₦100,000".to_string());
    }
    
    if funding_goal > 100_000_000.0 {
        return Err("❌ Funding goal cannot exceed ₦100,000,000".to_string());
    }
    
    // 3. Validate minimum investment
    let min_investment = data.get("minimumInvestment")
        .and_then(|v| v.as_f64())
        .ok_or("❌ Invalid minimum investment")?;
    
    if min_investment < 10_000.0 {
        return Err("❌ Minimum investment must be at least ₦10,000".to_string());
    }
    
    if min_investment > funding_goal {
        return Err("❌ Minimum investment cannot exceed funding goal".to_string());
    }
    
    // 4. Validate expected return rates
    let return_min = data.get("expectedReturnMin")
        .and_then(|v| v.as_f64())
        .ok_or("❌ Invalid minimum return rate")?;
    
    let return_max = data.get("expectedReturnMax")
        .and_then(|v| v.as_f64())
        .ok_or("❌ Invalid maximum return rate")?;
    
    if return_min < 0.0 || return_min > 100.0 {
        return Err("❌ Minimum return rate must be between 0% and 100%".to_string());
    }
    
    if return_max < 0.0 || return_max > 100.0 {
        return Err("❌ Maximum return rate must be between 0% and 100%".to_string());
    }
    
    if return_min > return_max {
        return Err("❌ Minimum return cannot exceed maximum return".to_string());
    }
    
    // 5. Validate contract type (Shariah-compliant instruments)
    let contract_type = data.get("contractType")
        .and_then(|v| v.as_str())
        .ok_or("❌ Invalid contract type")?;
    
    let valid_contracts = vec!["musharakah", "mudarabah", "murabaha", "ijarah"];
    if !valid_contracts.contains(&contract_type) {
        return Err(format!(
            "❌ Invalid contract type: {}. Must be Shariah-compliant: {:?}",
            contract_type, valid_contracts
        ));
    }
    
    // 6. Validate term months
    let term_months = data.get("termMonths")
        .and_then(|v| v.as_i64())
        .ok_or("❌ Invalid term months")?;
    
    if term_months < 3 || term_months > 60 {
        return Err("❌ Term must be between 3 and 60 months".to_string());
    }
    
    // 7. Validate status
    let status = data.get("status")
        .and_then(|v| v.as_str())
        .ok_or("❌ Invalid status")?;
    
    let valid_statuses = vec!["active", "funded", "closed", "cancelled"];
    if !valid_statuses.contains(&status) {
        return Err(format!("❌ Invalid status: {}", status));
    }
    
    // 8. Ensure current funding doesn't exceed goal
    if let Some(current_funding) = data.get("currentFunding").and_then(|v| v.as_f64()) {
        if current_funding > funding_goal {
            return Err("❌ Current funding cannot exceed funding goal".to_string());
        }
        if current_funding < 0.0 {
            return Err("❌ Current funding cannot be negative".to_string());
        }
    }
    
    // 9. Verify approver information
    if !data.contains_key("approvedBy") {
        return Err("❌ Opportunity must include approver information".to_string());
    }
    
    Ok(())
}

/// Validates investment transaction
#[allow(dead_code)]
pub fn validate_investment_transaction(
    investment_amount: f64,
    opportunity_data: &Value,
) -> Result<(), String> {
    let min_investment = opportunity_data.get("minimumInvestment")
        .and_then(|v| v.as_f64())
        .unwrap_or(10_000.0);
    
    let funding_goal = opportunity_data.get("fundingGoal")
        .and_then(|v| v.as_f64())
        .unwrap_or(0.0);
    
    let current_funding = opportunity_data.get("currentFunding")
        .and_then(|v| v.as_f64())
        .unwrap_or(0.0);
    
    // Check minimum investment
    if investment_amount < min_investment {
        return Err(format!(
            "Investment amount (₦{}) is below minimum (₦{})",
            investment_amount, min_investment
        ));
    }
    
    // Check if opportunity is still open
    let status = opportunity_data.get("status")
        .and_then(|v| v.as_str())
        .unwrap_or("closed");
    
    if status != "active" {
        return Err(format!("Opportunity is not active (status: {})", status));
    }
    
    // Check if investment would exceed funding goal
    if current_funding + investment_amount > funding_goal {
        let remaining = funding_goal - current_funding;
        return Err(format!(
            "Investment would exceed funding goal. Only ₦{} remaining",
            remaining
        ));
    }
    
    Ok(())
}

/// Calculates proportional profit share for investor
#[allow(dead_code)]
pub fn calculate_profit_share(
    investment_amount: f64,
    total_funding: f64,
    total_profit: f64,
) -> Result<f64, String> {
    if total_funding <= 0.0 {
        return Err("Total funding must be positive".to_string());
    }
    
    if investment_amount < 0.0 {
        return Err("Investment amount cannot be negative".to_string());
    }
    
    let share_percentage = investment_amount / total_funding;
    let profit_share = total_profit * share_percentage;
    
    Ok(profit_share)
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;
    
    #[test]
    fn test_validate_investment_above_minimum() {
        let opp_data = json!({
            "minimumInvestment": 10000.0,
            "fundingGoal": 1000000.0,
            "currentFunding": 500000.0,
            "status": "active"
        });
        
        assert!(validate_investment_transaction(50000.0, &opp_data).is_ok());
    }
    
    #[test]
    fn test_validate_investment_below_minimum() {
        let opp_data = json!({
            "minimumInvestment": 10000.0,
            "fundingGoal": 1000000.0,
            "currentFunding": 500000.0,
            "status": "active"
        });
        
        assert!(validate_investment_transaction(5000.0, &opp_data).is_err());
    }
    
    #[test]
    fn test_calculate_profit_share() {
        let result = calculate_profit_share(100000.0, 1000000.0, 200000.0);
        assert!(result.is_ok());
        assert_eq!(result.unwrap(), 20000.0); // 10% of profit
    }
}
