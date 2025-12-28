use junobuild_macros::{
    assert_delete_asset, assert_delete_doc, assert_set_doc, assert_upload_asset, on_delete_asset,
    on_delete_doc, on_delete_filtered_assets, on_delete_filtered_docs, on_delete_many_assets,
    on_delete_many_docs, on_set_doc, on_set_many_docs, on_upload_asset,
};
use junobuild_satellite::{
    include_satellite, AssertDeleteAssetContext, AssertDeleteDocContext, AssertSetDocContext,
    AssertUploadAssetContext, OnDeleteAssetContext, OnDeleteDocContext,
    OnDeleteFilteredAssetsContext, OnDeleteFilteredDocsContext, OnDeleteManyAssetsContext,
    OnDeleteManyDocsContext, OnSetDocContext, OnSetManyDocsContext, OnUploadAssetContext,
};

// Business Financing Module - Serverless Functions
mod business_financing;

use business_financing::{
    business_application_validation::assert_business_application_approval,
    document_validation::assert_document_upload,
    financial_data_validation::validate_revenue_report,
    investment_opportunity_validation::assert_investment_opportunity_creation,
    revenue_report_validation::validate_revenue_report_submission,
    access_control::assert_admin_only_operation,
    platform_message_validation::validate_platform_message,
    member_validation::{
        assert_member_number_uniqueness,
        assert_immutable_fields,
        assert_kyc_verified_for_investment,
        assert_investment_limits,
        assert_corporate_ubo_compliance,
    },
    admin_permissions::{
        assert_admin_approval_with_limits,
        validate_separation_of_duties,
        assert_can_manage_admins,
        assert_can_distribute_profits,
        assert_can_deactivate_admin,
        assert_can_delete_admin,
        assert_can_update_permissions,
    },
};

// All the available hooks and assertions for your Datastore and Storage are scaffolded by default in this `lib.rs` module.
// However, if you don't have to implement all of them, for example to improve readability or reduce unnecessary logic,
// you can selectively enable only the features you need.
//
// To do this, disable the default features in your `Cargo.toml` and explicitly specify only the ones you want to use.
//
// For example, if you only need `on_set_doc`, configure your `Cargo.toml` like this:
//
// [dependencies]
// junobuild-satellite = { version = "0.0.22", default-features = false, features = ["on_set_doc"] }
//
// With this setup, only `on_set_doc` must be implemented with custom logic,
// and other hooks and assertions can be removed. They will not be included in your Satellite.

#[on_set_doc]
async fn on_set_doc(context: OnSetDocContext) -> Result<(), String> {
    // Validate revenue reports on submission
    validate_revenue_report(&context).await?;
    validate_revenue_report_submission(&context).await?;
    
    Ok(())
}

#[on_set_many_docs]
async fn on_set_many_docs(_context: OnSetManyDocsContext) -> Result<(), String> {
    Ok(())
}

#[on_delete_doc]
async fn on_delete_doc(_context: OnDeleteDocContext) -> Result<(), String> {
    Ok(())
}

#[on_delete_many_docs]
async fn on_delete_many_docs(_context: OnDeleteManyDocsContext) -> Result<(), String> {
    Ok(())
}

#[on_delete_filtered_docs]
async fn on_delete_filtered_docs(_context: OnDeleteFilteredDocsContext) -> Result<(), String> {
    Ok(())
}

#[on_upload_asset]
async fn on_upload_asset(_context: OnUploadAssetContext) -> Result<(), String> {
    Ok(())
}

#[on_delete_asset]
async fn on_delete_asset(_context: OnDeleteAssetContext) -> Result<(), String> {
    Ok(())
}

#[on_delete_many_assets]
async fn on_delete_many_assets(_context: OnDeleteManyAssetsContext) -> Result<(), String> {
    Ok(())
}

#[on_delete_filtered_assets]
async fn on_delete_filtered_assets(_context: OnDeleteFilteredAssetsContext) -> Result<(), String> {
    Ok(())
}

#[assert_set_doc]
fn assert_set_doc(context: AssertSetDocContext) -> Result<(), String> {
    // CRITICAL GATEKEEPERS - Enforce business rules before data is stored
    
    // 1. Business Application Approval - Must have 100% due diligence
    assert_business_application_approval(&context)?;
    
    // 2. Admin Approval Limits - Validate amount-based authorization
    assert_admin_approval_with_limits(&context)?;
    
    // 3. Separation of Duties - Reviewer cannot approve own review
    validate_separation_of_duties(&context)?;
    
    // 4. Investment Opportunity Creation - Only from approved applications
    assert_investment_opportunity_creation(&context)?;
    
    // 5. Platform Message Validation - Ensure message integrity and prevent abuse
    validate_platform_message(&context)?;
    
    // 6. Admin-Only Operations - Prevent unauthorized privilege escalation
    assert_admin_only_operation(&context)?;
    
    // 7. Admin Profile Management - Only managers can manage admins
    assert_can_manage_admins(&context)?;
    
    // 8. Admin Deactivation/Reactivation - Managers can toggle active status
    assert_can_deactivate_admin(&context)?;
    
    // 9. Admin Permission Updates - Enforce hierarchy when changing limits/roles
    assert_can_update_permissions(&context)?;
    
    // 10. Profit Distribution - Only managers can distribute profits
    assert_can_distribute_profits(&context)?;
    
    // 11. Member Number Uniqueness - Prevent duplicate membership numbers
    assert_member_number_uniqueness(&context)?;
    
    // === MEMBER/INVESTOR CORE VALIDATIONS ===
    
    // 12. Profile Update Restrictions - Enforce immutable fields
    assert_immutable_fields(&context)?;
    
    // 13. Investment Authorization - Only verified KYC can invest
    assert_kyc_verified_for_investment(&context)?;
    
    // 14. Investment Limits - Accredited vs non-accredited caps
    assert_investment_limits(&context)?;
    
    // 15. Corporate UBO Validation - Beneficial ownership compliance
    assert_corporate_ubo_compliance(&context)?;
    
    Ok(())
}

#[assert_delete_doc]
fn assert_delete_doc(context: AssertDeleteDocContext) -> Result<(), String> {
    // Admin Profile Deletion - Only super_admins can permanently remove admins
    assert_can_delete_admin(&context)?;
    
    Ok(())
}

#[assert_upload_asset]
fn assert_upload_asset(context: AssertUploadAssetContext) -> Result<(), String> {
    // Document Upload Security - File type, size, and malware protection
    assert_document_upload(&context)?;
    
    Ok(())
}

#[assert_delete_asset]
fn assert_delete_asset(_context: AssertDeleteAssetContext) -> Result<(), String> {
    Ok(())
}

include_satellite!();
