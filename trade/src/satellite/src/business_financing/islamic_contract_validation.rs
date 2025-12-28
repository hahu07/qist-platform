use serde_json::Value;

/// Validates Murabaha (Cost-Plus Financing) contract-specific fields
pub fn validate_murabaha_details(details: &Value) -> Result<(), String> {
    let details_obj = details.as_object()
        .ok_or("Invalid Murabaha details format")?;
    
    // Extract values
    let asset_cost = details_obj.get("assetCost")
        .and_then(|v| v.as_f64());
    let markup_amount = details_obj.get("markupAmount")
        .and_then(|v| v.as_f64());
    let installments_paid = details_obj.get("installmentsPaid")
        .and_then(|v| v.as_i64());
    let installments_remaining = details_obj.get("installmentsRemaining")
        .and_then(|v| v.as_i64());
    let remaining_balance = details_obj.get("remainingBalance")
        .and_then(|v| v.as_f64());
    
    // Validate asset cost and markup
    if let (Some(cost), Some(markup)) = (asset_cost, markup_amount) {
        if cost <= 0.0 {
            return Err("❌ Murabaha: Asset cost must be positive".to_string());
        }
        
        if markup <= 0.0 {
            return Err("❌ Murabaha: Markup amount must be positive".to_string());
        }
        
        // Islamic finance guideline: Markup typically shouldn't exceed 30% of cost
        let markup_percentage = (markup / cost) * 100.0;
        if markup_percentage > 30.0 {
            return Err(format!(
                "❌ Murabaha: Markup {:.1}% exceeds recommended Islamic limit of 30%",
                markup_percentage
            ));
        }
        
        // Validate remaining balance calculation
        if let (Some(paid), Some(remaining), Some(balance)) = 
            (installments_paid, installments_remaining, remaining_balance) {
            let total_installments = paid + remaining;
            if total_installments == 0 {
                return Err("❌ Murabaha: Total installments cannot be zero".to_string());
            }
            
            let total_price = cost + markup;
            let installment_amount = total_price / total_installments as f64;
            let expected_balance = installment_amount * remaining as f64;
            
            // Allow 1% tolerance for rounding
            let tolerance = expected_balance * 0.01;
            if (balance - expected_balance).abs() > tolerance {
                return Err(format!(
                    "❌ Murabaha: Remaining balance ₦{:.2} doesn't match expected ₦{:.2}",
                    balance, expected_balance
                ));
            }
        }
    }
    
    Ok(())
}

/// Validates Mudaraba (Trust Financing) contract-specific fields
pub fn validate_mudaraba_details(details: &Value) -> Result<(), String> {
    let details_obj = details.as_object()
        .ok_or("Invalid Mudaraba details format")?;
    
    // Extract profit share percentages
    let investor_share = details_obj.get("investorProfitShare")
        .and_then(|v| v.as_f64());
    let mudarib_share = details_obj.get("mudaribProfitShare")
        .and_then(|v| v.as_f64());
    
    // Validate profit sharing ratios
    if let (Some(investor), Some(mudarib)) = (investor_share, mudarib_share) {
        if investor < 0.0 || investor > 100.0 {
            return Err("❌ Mudaraba: Investor profit share must be between 0-100%".to_string());
        }
        
        if mudarib < 0.0 || mudarib > 100.0 {
            return Err("❌ Mudaraba: Mudarib profit share must be between 0-100%".to_string());
        }
        
        // Critical Shariah requirement: Profit shares must sum to 100%
        let total = investor + mudarib;
        if (total - 100.0).abs() > 0.01 {
            return Err(format!(
                "❌ Mudaraba: Profit shares must sum to 100% (got {:.2}%)",
                total
            ));
        }
        
        // Validate actual profit distribution matches ratios
        let actual_investor = details_obj.get("actualInvestorProfit")
            .and_then(|v| v.as_f64());
        let actual_mudarib = details_obj.get("actualMudaribProfit")
            .and_then(|v| v.as_f64());
        
        if let (Some(inv_profit), Some(mud_profit)) = (actual_investor, actual_mudarib) {
            let total_profit = inv_profit + mud_profit;
            
            if total_profit > 0.0 {
                let actual_inv_percentage = (inv_profit / total_profit) * 100.0;
                let actual_mud_percentage = (mud_profit / total_profit) * 100.0;
                
                // Allow 2% tolerance for rounding
                if (actual_inv_percentage - investor).abs() > 2.0 {
                    return Err(format!(
                        "❌ Mudaraba: Investor actual profit {:.1}% doesn't match agreed {:.1}%",
                        actual_inv_percentage, investor
                    ));
                }
                
                if (actual_mud_percentage - mudarib).abs() > 2.0 {
                    return Err(format!(
                        "❌ Mudaraba: Mudarib actual profit {:.1}% doesn't match agreed {:.1}%",
                        actual_mud_percentage, mudarib
                    ));
                }
            }
        }
    }
    
    // Validate capital is positive
    if let Some(capital) = details_obj.get("capitalProvided").and_then(|v| v.as_f64()) {
        if capital <= 0.0 {
            return Err("❌ Mudaraba: Capital provided must be positive".to_string());
        }
    }
    
    Ok(())
}

/// Validates Musharaka (Partnership) contract-specific fields
pub fn validate_musharaka_details(details: &Value) -> Result<(), String> {
    let details_obj = details.as_object()
        .ok_or("Invalid Musharaka details format")?;
    
    // Extract capital contributions
    let party1_capital = details_obj.get("party1Capital")
        .and_then(|v| v.as_f64());
    let party2_capital = details_obj.get("party2Capital")
        .and_then(|v| v.as_f64());
    
    // Validate capitals are positive
    if let Some(cap1) = party1_capital {
        if cap1 <= 0.0 {
            return Err("❌ Musharaka: Partner 1 capital must be positive".to_string());
        }
    }
    
    if let Some(cap2) = party2_capital {
        if cap2 <= 0.0 {
            return Err("❌ Musharaka: Partner 2 capital must be positive".to_string());
        }
    }
    
    // Extract profit share percentages
    let party1_share = details_obj.get("party1ProfitShare")
        .and_then(|v| v.as_f64());
    let party2_share = details_obj.get("party2ProfitShare")
        .and_then(|v| v.as_f64());
    
    // Validate profit sharing
    if let (Some(share1), Some(share2)) = (party1_share, party2_share) {
        if share1 < 0.0 || share1 > 100.0 {
            return Err("❌ Musharaka: Partner 1 profit share must be between 0-100%".to_string());
        }
        
        if share2 < 0.0 || share2 > 100.0 {
            return Err("❌ Musharaka: Partner 2 profit share must be between 0-100%".to_string());
        }
        
        // Profit shares must sum to 100%
        let total = share1 + share2;
        if (total - 100.0).abs() > 0.01 {
            return Err(format!(
                "❌ Musharaka: Profit shares must sum to 100% (got {:.2}%)",
                total
            ));
        }
        
        // In traditional Musharaka, profit shares should be proportional to capital
        // However, modern Islamic finance allows negotiated ratios
        // We'll just warn if they're significantly disproportionate
        if let (Some(cap1), Some(cap2)) = (party1_capital, party2_capital) {
            let total_capital = cap1 + cap2;
            let expected_share1 = (cap1 / total_capital) * 100.0;
            
            // If profit share differs from capital ratio by more than 20%, it's unusual
            // but not necessarily invalid in modern Islamic finance
            if (share1 - expected_share1).abs() > 20.0 {
                // This is informational, not an error
                // In production, this could trigger a review flag
            }
        }
        
        // Validate actual profit distribution
        let actual_party1 = details_obj.get("actualParty1Profit")
            .and_then(|v| v.as_f64());
        let actual_party2 = details_obj.get("actualParty2Profit")
            .and_then(|v| v.as_f64());
        
        if let (Some(prof1), Some(prof2)) = (actual_party1, actual_party2) {
            let total_profit = prof1 + prof2;
            
            if total_profit > 0.0 {
                let actual_share1 = (prof1 / total_profit) * 100.0;
                let actual_share2 = (prof2 / total_profit) * 100.0;
                
                // Allow 2% tolerance
                if (actual_share1 - share1).abs() > 2.0 {
                    return Err(format!(
                        "❌ Musharaka: Partner 1 actual profit {:.1}% doesn't match agreed {:.1}%",
                        actual_share1, share1
                    ));
                }
                
                if (actual_share2 - share2).abs() > 2.0 {
                    return Err(format!(
                        "❌ Musharaka: Partner 2 actual profit {:.1}% doesn't match agreed {:.1}%",
                        actual_share2, share2
                    ));
                }
            }
        }
    }
    
    // Validate buyout progress for diminishing Musharaka
    if let Some(buyout) = details_obj.get("buyoutProgress").and_then(|v| v.as_f64()) {
        if buyout < 0.0 || buyout > 100.0 {
            return Err("❌ Musharaka: Buyout progress must be between 0-100%".to_string());
        }
    }
    
    Ok(())
}

/// Validates Ijara (Leasing) contract-specific fields
pub fn validate_ijara_details(details: &Value) -> Result<(), String> {
    let details_obj = details.as_object()
        .ok_or("Invalid Ijara details format")?;
    
    // Extract values
    let asset_value = details_obj.get("assetValue")
        .and_then(|v| v.as_f64());
    let monthly_rental = details_obj.get("monthlyRental")
        .and_then(|v| v.as_f64());
    let rentals_paid = details_obj.get("rentalsPaid")
        .and_then(|v| v.as_i64());
    let asset_depreciation = details_obj.get("assetDepreciation")
        .and_then(|v| v.as_f64());
    
    // Validate asset value
    if let Some(value) = asset_value {
        if value <= 0.0 {
            return Err("❌ Ijara: Asset value must be positive".to_string());
        }
        
        // Validate depreciation doesn't exceed asset value
        if let Some(depreciation) = asset_depreciation {
            if depreciation < 0.0 {
                return Err("❌ Ijara: Depreciation cannot be negative".to_string());
            }
            
            if depreciation > value {
                return Err("❌ Ijara: Depreciation cannot exceed asset value".to_string());
            }
        }
    }
    
    // Validate monthly rental
    if let Some(rental) = monthly_rental {
        if rental <= 0.0 {
            return Err("❌ Ijara: Monthly rental must be positive".to_string());
        }
        
        // Validate total rentals don't exceed reasonable profit margin
        if let (Some(value), Some(paid)) = (asset_value, rentals_paid) {
            let total_rentals_paid = rental * paid as f64;
            
            // Islamic guideline: Total rentals shouldn't exceed asset value + 50% profit
            let max_reasonable_total = value * 1.5;
            if total_rentals_paid > max_reasonable_total {
                return Err(format!(
                    "❌ Ijara: Total rentals ₦{:.2} exceed reasonable limit ₦{:.2}",
                    total_rentals_paid, max_reasonable_total
                ));
            }
        }
    }
    
    // Validate maintenance costs are reasonable
    if let Some(maintenance) = details_obj.get("maintenanceCosts").and_then(|v| v.as_f64()) {
        if maintenance < 0.0 {
            return Err("❌ Ijara: Maintenance costs cannot be negative".to_string());
        }
        
        // Maintenance shouldn't exceed 20% of asset value per reporting period
        if let Some(value) = asset_value {
            let max_maintenance = value * 0.2;
            if maintenance > max_maintenance {
                return Err(format!(
                    "❌ Ijara: Maintenance costs ₦{:.2} seem excessive (max ₦{:.2})",
                    maintenance, max_maintenance
                ));
            }
        }
    }
    
    Ok(())
}

/// Validates Salam/Istisna (Forward Sales) contract-specific fields
pub fn validate_salam_details(details: &Value) -> Result<(), String> {
    let details_obj = details.as_object()
        .ok_or("Invalid Salam/Istisna details format")?;
    
    // Validate advance payment (must be 100% in Salam)
    if let Some(advance) = details_obj.get("advancePaymentReceived").and_then(|v| v.as_f64()) {
        if advance <= 0.0 {
            return Err("❌ Salam: Advance payment must be positive".to_string());
        }
    }
    
    // Validate production progress
    if let Some(progress) = details_obj.get("productionProgress").and_then(|v| v.as_f64()) {
        if progress < 0.0 || progress > 100.0 {
            return Err("❌ Salam: Production progress must be between 0-100%".to_string());
        }
    }
    
    // Validate quantities
    let qty_ordered = details_obj.get("quantityOrdered").and_then(|v| v.as_f64());
    let qty_delivered = details_obj.get("quantityDelivered").and_then(|v| v.as_f64());
    
    if let (Some(ordered), Some(delivered)) = (qty_ordered, qty_delivered) {
        if ordered <= 0.0 {
            return Err("❌ Salam: Quantity ordered must be positive".to_string());
        }
        
        if delivered < 0.0 {
            return Err("❌ Salam: Quantity delivered cannot be negative".to_string());
        }
        
        if delivered > ordered {
            return Err(format!(
                "❌ Salam: Quantity delivered ({:.2}) cannot exceed ordered ({:.2})",
                delivered, ordered
            ));
        }
    }
    
    // Validate production costs
    if let Some(costs) = details_obj.get("productionCosts").and_then(|v| v.as_f64()) {
        if costs < 0.0 {
            return Err("❌ Salam: Production costs cannot be negative".to_string());
        }
    }
    
    Ok(())
}

/// Main validator that routes to contract-specific validators
pub fn validate_contract_specific_details(
    contract_type: &str,
    details: &Value,
) -> Result<(), String> {
    match contract_type {
        "murabaha" => validate_murabaha_details(details),
        "mudaraba" => validate_mudaraba_details(details),
        "musharaka" => validate_musharaka_details(details),
        "ijara" => validate_ijara_details(details),
        "istisna" | "salam" => validate_salam_details(details),
        _ => Ok(()), // Unknown contract type, skip validation
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;
    
    #[test]
    fn test_murabaha_valid() {
        let details = json!({
            "assetCost": 1000000.0,
            "markupAmount": 200000.0,
            "installmentsPaid": 5,
            "installmentsRemaining": 7,
            "remainingBalance": 700000.0
        });
        
        assert!(validate_murabaha_details(&details).is_ok());
    }
    
    #[test]
    fn test_murabaha_excessive_markup() {
        let details = json!({
            "assetCost": 1000000.0,
            "markupAmount": 400000.0, // 40% markup
        });
        
        assert!(validate_murabaha_details(&details).is_err());
    }
    
    #[test]
    fn test_mudaraba_profit_shares() {
        let details = json!({
            "investorProfitShare": 60.0,
            "mudaribProfitShare": 40.0,
            "capitalProvided": 5000000.0
        });
        
        assert!(validate_mudaraba_details(&details).is_ok());
    }
    
    #[test]
    fn test_mudaraba_invalid_shares() {
        let details = json!({
            "investorProfitShare": 60.0,
            "mudaribProfitShare": 50.0, // Sum = 110%
        });
        
        assert!(validate_mudaraba_details(&details).is_err());
    }
}
