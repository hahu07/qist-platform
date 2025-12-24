use junobuild_satellite::OnSetDocContext;
use serde_json::Value;

/// Validates financial data integrity for revenue reports
pub async fn validate_revenue_report(context: &OnSetDocContext) -> Result<(), String> {
    let collection = &context.data.collection;
    
    if collection != "revenue_reports" {
        return Ok(());
    }
    
    // Parse the after data from JSON string
    let data_str = std::str::from_utf8(&context.data.data.after.data)
        .map_err(|e| format!("Failed to decode revenue report data as UTF-8: {}", e))?;
    
    let data: Value = serde_json::from_str(data_str)
        .map_err(|e| format!("Failed to parse revenue report data: {}", e))?;
    
    let data = data.as_object()
        .ok_or("Invalid revenue report data format")?;
    
    // Extract financial values
    let total_revenue = data.get("totalRevenue")
        .and_then(|v| v.as_f64())
        .ok_or("Missing or invalid totalRevenue")?;
    
    let total_expenses = data.get("totalExpenses")
        .and_then(|v| v.as_f64())
        .ok_or("Missing or invalid totalExpenses")?;
    
    let gross_profit = data.get("grossProfit")
        .and_then(|v| v.as_f64())
        .ok_or("Missing or invalid grossProfit")?;
    
    let operating_expenses = data.get("operatingExpenses")
        .and_then(|v| v.as_f64())
        .ok_or("Missing or invalid operatingExpenses")?;
    
    let net_profit = data.get("netProfit")
        .and_then(|v| v.as_f64())
        .ok_or("Missing or invalid netProfit")?;
    
    // Validate calculations
    let calculated_net_profit = total_revenue - total_expenses;
    let tolerance = 0.01; // Allow 1 cent tolerance for floating point
    
    if (net_profit - calculated_net_profit).abs() > tolerance {
        return Err(format!(
            "Net profit calculation mismatch. Submitted: {}, Expected: {}",
            net_profit, calculated_net_profit
        ));
    }
    
    // Validate gross profit
    if (gross_profit - (total_revenue - (total_expenses - operating_expenses))).abs() > tolerance {
        return Err("Gross profit calculation is incorrect".to_string());
    }
    
    // Validate amounts are non-negative
    if total_revenue < 0.0 || total_expenses < 0.0 || operating_expenses < 0.0 {
        return Err("Financial amounts cannot be negative".to_string());
    }
    
    // Validate period dates
    let period_start = data.get("periodStart")
        .and_then(|v| v.as_str())
        .ok_or("Missing periodStart")?;
    
    let period_end = data.get("periodEnd")
        .and_then(|v| v.as_str())
        .ok_or("Missing periodEnd")?;
    
    // Basic date validation (start < end)
    if period_start >= period_end {
        return Err("Period start date must be before end date".to_string());
    }
    
    // Validate document requirement
    let documents = data.get("documents")
        .and_then(|v| v.as_array())
        .ok_or("Missing required documents")?;
    
    if documents.is_empty() {
        return Err("At least one supporting document is required".to_string());
    }
    
    Ok(())
}

/// Validates profit distribution calculations
#[allow(dead_code)]
pub fn validate_profit_distribution(
    total_profit: f64,
    investor_share_percentage: f64,
) -> Result<f64, String> {
    if investor_share_percentage < 0.0 || investor_share_percentage > 100.0 {
        return Err("Investor share percentage must be between 0 and 100".to_string());
    }
    
    if total_profit < 0.0 {
        return Err("Total profit cannot be negative".to_string());
    }
    
    Ok(total_profit * (investor_share_percentage / 100.0))
}

/// Validates financial ratios
#[allow(dead_code)]
pub fn validate_financial_ratios(data: &Value) -> Result<(), String> {
    let current_assets = data.get("currentAssets").and_then(|v| v.as_f64()).unwrap_or(0.0);
    let current_liabilities = data.get("currentLiabilities").and_then(|v| v.as_f64()).unwrap_or(0.0);
    let total_debt = data.get("totalLiabilities").and_then(|v| v.as_f64()).unwrap_or(0.0);
    let total_equity = data.get("totalEquity").and_then(|v| v.as_f64()).unwrap_or(0.0);
    
    // Current Ratio check (should be > 1.0 for healthy business)
    if current_liabilities > 0.0 {
        let current_ratio = current_assets / current_liabilities;
        if current_ratio < 0.5 {
            return Err("Current ratio is critically low (< 0.5). Business may have liquidity issues.".to_string());
        }
    }
    
    // Debt-to-Equity Ratio check
    if total_equity > 0.0 {
        let debt_to_equity = total_debt / total_equity;
        if debt_to_equity > 5.0 {
            return Err("Debt-to-equity ratio is too high (> 5.0). Business is over-leveraged.".to_string());
        }
    }
    
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_profit_distribution() {
        let result = validate_profit_distribution(1000000.0, 70.0);
        assert!(result.is_ok());
        assert_eq!(result.unwrap(), 700000.0);
    }
    
    #[test]
    fn test_invalid_percentage() {
        let result = validate_profit_distribution(1000000.0, 150.0);
        assert!(result.is_err());
    }
}
