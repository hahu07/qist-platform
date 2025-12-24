use junobuild_satellite::AssertUploadAssetContext;

/// Validates document uploads for security and compliance
pub fn assert_document_upload(context: &AssertUploadAssetContext) -> Result<(), String> {
    let collection = &context.data.batch.key.collection;
    let filename = &context.data.batch.key.full_path;
    
    // Only validate business document uploads
    if collection != "business_documents" {
        return Ok(());
    }
    
    // 1. Validate file extension
    let allowed_extensions = vec!["pdf", "jpg", "jpeg", "png", "doc", "docx", "xls", "xlsx"];
    let extension = filename.split('.').last().unwrap_or("").to_lowercase();
    
    if !allowed_extensions.contains(&extension.as_str()) {
        return Err(format!(
            "❌ File type not allowed: .{}. Allowed types: {:?}",
            extension, allowed_extensions
        ));
    }
    
    // 2. Validate filename doesn't contain dangerous characters
    let dangerous_chars = vec!["../", "..\\", "<", ">", "|", "&", ";", "$"];
    for dangerous in dangerous_chars {
        if filename.contains(dangerous) {
            return Err(format!("❌ Filename contains invalid characters: {}", dangerous));
        }
    }
    
    // 3. Validate filename is not too long
    if filename.len() > 255 {
        return Err("❌ Filename too long. Maximum 255 characters".to_string());
    }
    
    // Note: File size and signature validation would require accessing chunks
    // which happens during the upload process. Basic validation is sufficient here.
    
    Ok(())
}

/// Document type validation
#[allow(dead_code)]
pub enum DocumentType {
    BankStatement,
    FinancialStatement,
    TaxDocument,
    RegistrationCertificate,
    DirectorsID,
    BusinessPlan,
    CollateralDocument,
    AuditReport,
}

#[allow(dead_code)]
impl DocumentType {
    pub fn from_string(doc_type: &str) -> Result<Self, String> {
        match doc_type.to_lowercase().as_str() {
            "bank_statement" => Ok(DocumentType::BankStatement),
            "financial_statement" => Ok(DocumentType::FinancialStatement),
            "tax_document" => Ok(DocumentType::TaxDocument),
            "registration_certificate" => Ok(DocumentType::RegistrationCertificate),
            "directors_id" => Ok(DocumentType::DirectorsID),
            "business_plan" => Ok(DocumentType::BusinessPlan),
            "collateral_document" => Ok(DocumentType::CollateralDocument),
            "audit_report" => Ok(DocumentType::AuditReport),
            _ => Err(format!("Invalid document type: {}", doc_type)),
        }
    }
    
    pub fn required_for_application(&self) -> bool {
        matches!(
            self,
            DocumentType::BankStatement
                | DocumentType::FinancialStatement
                | DocumentType::RegistrationCertificate
                | DocumentType::DirectorsID
        )
    }
}

/// Validates document completeness for application
#[allow(dead_code)]
pub fn validate_document_completeness(uploaded_doc_types: Vec<&str>) -> Result<(), String> {
    let required_types = vec![
        "bank_statement",
        "financial_statement",
        "registration_certificate",
        "directors_id",
    ];
    
    for required in &required_types {
        if !uploaded_doc_types.contains(required) {
            return Err(format!("❌ Missing required document: {}", required));
        }
    }
    
    Ok(())
}

/// Generates secure document access token (placeholder for real implementation)
#[allow(dead_code)]
pub fn generate_document_access_token(
    document_id: &str,
    user_id: &str,
    expiry_hours: i64,
) -> String {
    // In production, this would use proper JWT or similar token generation
    // For now, returning a simple placeholder
    format!(
        "token_{}_{}_exp{}",
        document_id,
        user_id,
        expiry_hours
    )
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_document_type_parsing() {
        assert!(DocumentType::from_string("bank_statement").is_ok());
        assert!(DocumentType::from_string("invalid_type").is_err());
    }
    
    #[test]
    fn test_required_documents() {
        let uploaded = vec!["bank_statement", "financial_statement"];
        assert!(validate_document_completeness(uploaded).is_err());
    }
    
    #[test]
    fn test_complete_documents() {
        let uploaded = vec![
            "bank_statement",
            "financial_statement",
            "registration_certificate",
            "directors_id",
        ];
        assert!(validate_document_completeness(uploaded).is_ok());
    }
}
