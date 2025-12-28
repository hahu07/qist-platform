use junobuild_satellite::OnSetDocContext;
use serde_json::Value;
use super::islamic_contract_validation::validate_contract_specific_details;

/// Validates revenue report submission integrity
pub async fn validate_revenue_report_submission(
    context: &OnSetDocContext,
) -> Result<(), String> {
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
    
    // 1. Validate reporting period type
    let period_type = data.get("reportingPeriod")
        .and_then(|v| v.as_str())
        .ok_or("❌ Missing reporting period type")?;
    
    if period_type != "monthly" && period_type != "quarterly" {
        return Err("❌ Reporting period must be either 'monthly' or 'quarterly'".to_string());
    }
    
    // 2. Validate document requirements based on period type
    let documents = data.get("documents")
        .and_then(|v| v.as_array())
        .ok_or("❌ Missing documents array")?;
    
    let required_doc_count = if period_type == "monthly" { 4 } else { 5 };
    
    if documents.len() < required_doc_count {
        return Err(format!(
            "❌ {} reports require at least {} documents. Only {} provided",
            period_type, required_doc_count, documents.len()
        ));
    }
    
    // 3. Validate status
    let status = data.get("status")
        .and_then(|v| v.as_str())
        .unwrap_or("draft");
    
    let valid_statuses = vec!["draft", "submitted", "under_review", "approved", "revision_requested"];
    if !valid_statuses.contains(&status) {
        return Err(format!("❌ Invalid status: {}", status));
    }
    
    // 4. If status is submitted, ensure all required fields are present
    if status == "submitted" {
        let required_fields = vec![
            "totalRevenue",
            "totalExpenses",
            "netProfit",
            "grossProfit",
            "operatingExpenses",
            "periodStart",
            "periodEnd",
            "applicationId",
            "businessName",
        ];
        
        for field in required_fields {
            if !data.contains_key(field) || data.get(field).unwrap().is_null() {
                return Err(format!("❌ Missing required field for submission: {}", field));
            }
        }
    }
    
    // 5. Validate that period dates are logical
    validate_report_period(&Value::Object(data.clone()))?;
    
    // 6. Auto-validate financial calculations
    validate_financial_calculations(&Value::Object(data.clone()))?;
    
    // 7. NEW: Validate Islamic finance contract-specific details
    if let Some(contract_type) = data.get("contractType").and_then(|v| v.as_str()) {
        // Validate contract-specific details based on contract type
        match contract_type {
            "murabaha" => {
                if let Some(details) = data.get("murabahaDetails") {
                    validate_contract_specific_details("murabaha", details)?;
                }
            },
            "mudaraba" => {
                if let Some(details) = data.get("mudarabaDetails") {
                    validate_contract_specific_details("mudaraba", details)?;
                }
            },
            "musharaka" => {
                if let Some(details) = data.get("musharakahDetails") {
                    validate_contract_specific_details("musharaka", details)?;
                }
            },
            "ijara" => {
                if let Some(details) = data.get("ijaraDetails") {
                    validate_contract_specific_details("ijara", details)?;
                }
            },
            "istisna" | "salam" => {
                if let Some(details) = data.get("salamDetails") {
                    validate_contract_specific_details(contract_type, details)?;
                }
            },
            _ => {
                // Unknown contract type, no specific validation
            }
        }
    }
    
    Ok(())
}

/// Validates that report periods don't overlap (anti-fraud measure)
#[allow(dead_code)]
pub fn validate_no_period_overlap(
    new_start: &str,
    new_end: &str,
    existing_reports: Vec<Value>,
) -> Result<(), String> {
    for report in existing_reports {
        let existing_start = report.get("periodStart")
            .and_then(|v| v.as_str())
            .unwrap_or("");
        
        let existing_end = report.get("periodEnd")
            .and_then(|v| v.as_str())
            .unwrap_or("");
        
        // Check for any overlap
        if new_start <= existing_end && new_end >= existing_start {
            return Err(format!(
                "❌ Report period overlaps with existing report ({} to {})",
                existing_start, existing_end
            ));
        }
    }
    
    Ok(())
}

/// Validates financial calculations are correct
fn validate_financial_calculations(data: &Value) -> Result<(), String> {
    let total_revenue = data.get("totalRevenue")
        .and_then(|v| v.as_f64())
        .unwrap_or(0.0);
    
    let total_expenses = data.get("totalExpenses")
        .and_then(|v| v.as_f64())
        .unwrap_or(0.0);
    
    let net_profit = data.get("netProfit")
        .and_then(|v| v.as_f64())
        .unwrap_or(0.0);
    
    let gross_profit = data.get("grossProfit")
        .and_then(|v| v.as_f64())
        .unwrap_or(0.0);
    
    let operating_expenses = data.get("operatingExpenses")
        .and_then(|v| v.as_f64())
        .unwrap_or(0.0);
    
    // Net Profit = Total Revenue - Total Expenses
    let calculated_net_profit = total_revenue - total_expenses;
    let tolerance = 0.01;
    
    if (net_profit - calculated_net_profit).abs() > tolerance {
        return Err(format!(
            "❌ Net profit calculation error. Expected: {:.2}, Got: {:.2}",
            calculated_net_profit, net_profit
        ));
    }
    
    // Gross Profit validation
    let cogs = total_expenses - operating_expenses;
    let calculated_gross_profit = total_revenue - cogs;
    
    if (gross_profit - calculated_gross_profit).abs() > tolerance {
        return Err(format!(
            "❌ Gross profit calculation error. Expected: {:.2}, Got: {:.2}",
            calculated_gross_profit, gross_profit
        ));
    }
    
    Ok(())
}

/// Validates report period dates
fn validate_report_period(data: &Value) -> Result<(), String> {
    let period_start = data.get("periodStart")
        .and_then(|v| v.as_str())
        .ok_or("❌ Missing periodStart")?;
    
    let period_end = data.get("periodEnd")
        .and_then(|v| v.as_str())
        .ok_or("❌ Missing periodEnd")?;
    
    // Check that start is before end
    if period_start >= period_end {
        return Err("❌ Period start date must be before end date".to_string());
    }
    
    // Check that dates are not in the future (can't report future revenue)
    // This is a simplified check - in production, use proper date parsing
    let current_date = "2025-12-24"; // Would use actual current date
    
    if period_end > current_date {
        return Err("❌ Cannot submit report for future periods".to_string());
    }
    
    Ok(())
}

/// Calculates profit margin
#[allow(dead_code)]
pub fn calculate_profit_margin(revenue: f64, net_profit: f64) -> Result<f64, String> {
    if revenue <= 0.0 {
        return Err("Revenue must be positive to calculate margin".to_string());
    }
    
    Ok((net_profit / revenue) * 100.0)
}

/// Flags suspicious revenue patterns
#[allow(dead_code)]
pub fn detect_suspicious_patterns(
    current_revenue: f64,
    previous_revenues: Vec<f64>,
) -> Vec<String> {
    let mut warnings = Vec::new();
    
    if previous_revenues.is_empty() {
        return warnings;
    }
    
    let avg_revenue: f64 = previous_revenues.iter().sum::<f64>() / previous_revenues.len() as f64;
    
    // Flag if current revenue is 200% higher than average
    if current_revenue > avg_revenue * 2.0 {
        warnings.push(format!(
            "⚠️ Revenue spike detected: Current (₦{:.2}) is 2x higher than average (₦{:.2})",
            current_revenue, avg_revenue
        ));
    }
    
    // Flag if current revenue drops by 50% or more
    if let Some(last_revenue) = previous_revenues.last() {
        if current_revenue < last_revenue * 0.5 {
            warnings.push(format!(
                "⚠️ Significant revenue drop: Down {:.0}% from last period",
                ((last_revenue - current_revenue) / last_revenue) * 100.0
            ));
        }
    }
    
    // Flag consistent negative profits
    if current_revenue > 0.0 && previous_revenues.iter().all(|&r| r > 0.0) {
        warnings.push("⚠️ Consistent losses may indicate business viability issues".to_string());
    }
    
    warnings
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;
    
    #[test]
    fn test_validate_calculations() {
        let data = json!({
            "totalRevenue": 1000000.0,
            "totalExpenses": 700000.0,
            "netProfit": 300000.0,
            "grossProfit": 500000.0,
            "operatingExpenses": 200000.0
        });
        
        assert!(validate_financial_calculations(&data).is_ok());
    }
    
    #[test]
    fn test_invalid_net_profit() {
        let data = json!({
            "totalRevenue": 1000000.0,
            "totalExpenses": 700000.0,
            "netProfit": 500000.0, // Should be 300000
            "grossProfit": 500000.0,
            "operatingExpenses": 200000.0
        });
        
        assert!(validate_financial_calculations(&data).is_err());
    }
    
    #[test]
    fn test_profit_margin() {
        let margin = calculate_profit_margin(1000000.0, 300000.0).unwrap();
        assert_eq!(margin, 30.0);
    }
    
    #[test]
    fn test_revenue_spike_detection() {
        let previous = vec![100000.0, 110000.0, 105000.0];
        let warnings = detect_suspicious_patterns(300000.0, previous);
        assert!(!warnings.is_empty());
    }
}
