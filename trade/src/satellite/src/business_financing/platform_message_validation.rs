use junobuild_satellite::AssertSetDocContext;
use serde_json::Value;

/// Validate platform messages before storing
/// Ensures message integrity, proper formatting, and prevents abuse
pub fn validate_platform_message(context: &AssertSetDocContext) -> Result<(), String> {
    // Check if this is a platform_messages collection operation
    let collection = &context.data.collection;
    
    if collection != "platform_messages" {
        return Ok(());
    }

    // Parse message data from the context
    let data_bytes = &context.data.data.proposed.data;
    let data: Value = serde_json::from_slice(data_bytes)
        .map_err(|e| format!("Failed to parse message data: {}", e))?;
    
    // Extract fields from the data map
    let message_id = data.get("messageId")
        .and_then(|v| v.as_str())
        .ok_or("Missing messageId")?;
    
    let from = data.get("from")
        .and_then(|v| v.as_str())
        .ok_or("Missing from field")?;
    
    let to = data.get("to")
        .and_then(|v| v.as_str())
        .ok_or("Missing to field")?;
    
    let subject = data.get("subject")
        .and_then(|v| v.as_str())
        .ok_or("Missing subject")?;
    
    let content = data.get("content")
        .and_then(|v| v.as_str())
        .ok_or("Missing content")?;
    
    let msg_type = data.get("type")
        .and_then(|v| v.as_str())
        .ok_or("Missing type field")?;
    
    let status = data.get("status")
        .and_then(|v| v.as_str())
        .ok_or("Missing status")?;

    // Validate message ID format
    if !message_id.starts_with("msg_") {
        return Err("Invalid messageId format. Must start with 'msg_'".to_string());
    }

    // Validate from/to fields are not empty
    if from.trim().is_empty() {
        return Err("From field cannot be empty".to_string());
    }
    
    if to.trim().is_empty() {
        return Err("To field cannot be empty".to_string());
    }

    // Validate subject length (3-200 characters)
    if subject.trim().len() < 3 {
        return Err("Subject must be at least 3 characters".to_string());
    }
    
    if subject.len() > 200 {
        return Err("Subject must not exceed 200 characters".to_string());
    }

    // Validate content length (10-10000 characters)
    if content.trim().len() < 10 {
        return Err("Message content must be at least 10 characters".to_string());
    }
    
    if content.len() > 10000 {
        return Err("Message content must not exceed 10000 characters".to_string());
    }

    // Validate message type
    match msg_type {
        "info" | "request" | "warning" | "urgent" => {},
        _ => return Err(format!("Invalid message type: {}. Must be one of: info, request, warning, urgent", msg_type)),
    }

    // Validate status
    match status {
        "sent" | "read" | "responded" => {},
        _ => return Err(format!("Invalid status: {}. Must be one of: sent, read, responded", status)),
    }

    // Validate attachments if present
    if let Some(attachments_value) = data.get("attachments") {
        if let Some(attachments_array) = attachments_value.as_array() {
            if attachments_array.len() > 5 {
                return Err("Cannot attach more than 5 files per message".to_string());
            }
            
            // Validate each attachment URL
            for attachment in attachments_array {
                if let Some(url) = attachment.as_str() {
                    if !url.starts_with("http://") && !url.starts_with("https://") {
                        return Err("Invalid attachment URL format".to_string());
                    }
                } else {
                    return Err("Attachment must be a valid URL string".to_string());
                }
            }
        }
    }

    // Validate response content length if present (when status is "responded")
    if status == "responded" {
        if let Some(response_content) = data.get("responseContent").and_then(|v| v.as_str()) {
            if response_content.trim().len() < 10 {
                return Err("Response content must be at least 10 characters".to_string());
            }
            
            if response_content.len() > 10000 {
                return Err("Response content must not exceed 10000 characters".to_string());
            }
        } else {
            return Err("Response content is required when status is 'responded'".to_string());
        }
    }

    // Validate sentAt timestamp is present
    if data.get("sentAt").is_none() {
        return Err("sentAt timestamp is required".to_string());
    }

    // If status is "read", readAt must be present
    if status == "read" || status == "responded" {
        if data.get("readAt").is_none() {
            return Err("readAt timestamp is required when status is 'read' or 'responded'".to_string());
        }
    }

    // If status is "responded", respondedAt must be present
    if status == "responded" {
        if data.get("respondedAt").is_none() {
            return Err("respondedAt timestamp is required when status is 'responded'".to_string());
        }
    }

    Ok(())
}

/// Check rate limiting for message creation
/// Prevents spam by limiting messages per business per time period
pub fn check_message_rate_limit(from: &str, _existing_messages_count: usize) -> Result<(), String> {
    // Simple validation: platform can send unlimited, but businesses are tracked
    if from == "platform" {
        return Ok(()); // No limit for admin/platform messages
    }

    // Note: For full rate limiting implementation, you would need to:
    // 1. Count messages from this business in the last hour/day
    // 2. Compare against a threshold (e.g., 10 messages per hour)
    // 3. This requires querying the collection which is not available in assert hooks
    // 
    // For now, we just validate the format and let the frontend handle rate limiting
    // through UI/UX controls (e.g., disable send button after X messages)

    Ok(())
}
