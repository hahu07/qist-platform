# SMS and WhatsApp Notifications Implementation

## Overview

The QIST platform now supports SMS and WhatsApp notifications via Twilio integration, providing immediate communication channels for critical events like KYC approval/rejection.

## Features

✅ **SMS Notifications**: Send text messages to users via Twilio  
✅ **WhatsApp Notifications**: Send WhatsApp messages via Twilio Business API  
✅ **Multi-channel Delivery**: Automatically send both SMS and WhatsApp for important updates  
✅ **User Preferences**: Respect user's `smsNotifications` preference  
✅ **Phone Number Validation**: E.164 format validation and auto-formatting  
✅ **Template System**: Pre-built message templates for common notifications  
✅ **Error Handling**: Graceful fallback if SMS/WhatsApp delivery fails  

## Architecture

```
┌─────────────────────┐
│  KYC Approval Flow  │
│ (kyc-review/page)   │
└──────────┬──────────┘
           │
           ├─────────────────────┐
           │                     │
┌──────────▼──────────┐  ┌──────▼────────────┐
│   In-App Notify     │  │  SMS/WhatsApp     │
│ (notification-      │  │  (sms-            │
│  actions.ts)        │  │   notifications.ts)│
└─────────────────────┘  └──────┬────────────┘
                                │
                         ┌──────▼────────────┐
                         │  API Route        │
                         │  /api/            │
                         │  notifications/   │
                         │  send-sms         │
                         └──────┬────────────┘
                                │
                         ┌──────▼────────────┐
                         │  Twilio REST API  │
                         │  (Server-side)    │
                         └───────────────────┘
```

## Files Created

### 1. **SMS Service** (`src/utils/sms-service.ts`)
Server-side Twilio integration class with methods for:
- `sendSMS()`: Send SMS messages
- `sendWhatsApp()`: Send WhatsApp messages
- `sendKYCApprovedSMS/WhatsApp()`: KYC approval templates
- `sendKYCRejectedSMS/WhatsApp()`: KYC rejection templates
- Phone number formatting and validation

### 2. **SMS Notifications Helper** (`src/utils/sms-notifications.ts`)
Client-side helper functions for easy integration:
- `sendKYCApprovedNotification()`: Send KYC approval notification
- `sendKYCRejectedNotification()`: Send KYC rejection notification
- `sendInvestmentConfirmedNotification()`: Investment confirmation
- `sendProfitDistributionNotification()`: Profit distribution
- `sendDepositConfirmedNotification()`: Deposit confirmation
- `sendCustomNotification()`: Custom messages
- `formatPhoneNumber()`: Phone number formatting utility
- `isValidPhoneNumber()`: E.164 validation

### 3. **API Route** (`src/app/api/notifications/send-sms/route.ts`)
Next.js API route for server-side SMS sending:
- POST endpoint: `/api/notifications/send-sms`
- Handles SMS and WhatsApp delivery
- Template rendering with data interpolation
- Environment variable configuration
- Error handling and logging

## Integration Points

### KYC Approval Flow
Modified `src/app/admin/kyc-review/page.tsx`:

```tsx
// In handleApproveKYC
const phoneNumber = investor.data.phoneNumber;
const smsEnabled = investor.data.smsNotifications !== false;

if (phoneNumber && smsEnabled) {
  const { sendKYCApprovedNotification } = await import('@/utils/sms-notifications');
  
  await sendKYCApprovedNotification({
    phoneNumber,
    memberName,
    memberNumber,
    sendSMS: true,
    sendWhatsApp: true,
  });
}
```

### KYC Rejection Flow
```tsx
// In handleRejectKYC
if (phoneNumber && smsEnabled) {
  const { sendKYCRejectedNotification } = await import('@/utils/sms-notifications');
  
  await sendKYCRejectedNotification({
    phoneNumber,
    memberName,
    reason: message,
    allowsResubmit: rejectionAllowsResubmit,
    sendSMS: true,
    sendWhatsApp: true,
  });
}
```

## Setup Instructions

### 1. Create Twilio Account

1. Sign up at [https://www.twilio.com/try-twilio](https://www.twilio.com/try-twilio)
2. Complete phone verification
3. Receive $15 free trial credits
4. Note: Trial accounts can only send to verified numbers

### 2. Get Credentials

Navigate to [Twilio Console](https://console.twilio.com):

1. **Account SID**: Found on dashboard home
2. **Auth Token**: Click "Show" next to Auth Token
3. **Phone Number**: Purchase from "Phone Numbers" → "Buy a Number"
   - For trial: Use provided trial number
   - For production: Purchase a number ($1-$15/month)

### 3. Configure Environment Variables

Create `.env.local` file:

```bash
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+1234567890
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
```

### 4. WhatsApp Sandbox Setup (Development)

1. Go to [Twilio WhatsApp Sandbox](https://console.twilio.com/us1/develop/sms/try-it-out/whatsapp-learn)
2. Send `join [your-sandbox-name]` to the sandbox number via WhatsApp
   - Example: `join steel-mountain`
3. Use sandbox number in `.env.local`:
   ```
   TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
   ```
4. **Important**: Sandbox sessions expire after 24 hours - users must rejoin

### 5. WhatsApp Production Setup

For production WhatsApp notifications:

1. **Submit Business Profile**:
   - Go to Twilio Console → Messaging → WhatsApp Senders
   - Click "Request to Enable WhatsApp"
   - Provide:
     - Business name
     - Business website
     - Use case description
     - Sample messages

2. **Approval Process**:
   - Takes 1-3 business days
   - You'll receive email notification
   - Meta reviews business profile

3. **Purchase WhatsApp-Enabled Number**:
   - After approval, buy a WhatsApp-enabled number
   - Update `.env.local` with your number:
     ```
     TWILIO_WHATSAPP_NUMBER=whatsapp:+1234567890
     ```

4. **Message Templates** (Optional):
   - For proactive messaging, create approved templates
   - Submit templates via Twilio Console
   - Use template SIDs in code

## Testing

### Test SMS Endpoint

```bash
curl -X POST http://localhost:3000/api/notifications/send-sms \
  -H "Content-Type: application/json" \
  -d '{
    "type": "sms",
    "phoneNumber": "+2348012345678",
    "message": "Test SMS message"
  }'
```

### Test WhatsApp Endpoint

```bash
curl -X POST http://localhost:3000/api/notifications/send-sms \
  -H "Content-Type: application/json" \
  -d '{
    "type": "whatsapp",
    "phoneNumber": "+2348012345678",
    "message": "Test WhatsApp message"
  }'
```

### Test KYC Notification

```bash
curl -X POST http://localhost:3000/api/notifications/send-sms \
  -H "Content-Type: application/json" \
  -d '{
    "type": "whatsapp",
    "phoneNumber": "+2348012345678",
    "template": "kyc_approved_whatsapp",
    "data": {
      "memberName": "John Doe",
      "memberNumber": "INV-2025-0001"
    }
  }'
```

## Message Templates

### KYC Approved (SMS)
```
🎉 Congratulations {memberName}! Your KYC verification is approved. Membership: {memberNumber}. Start investing at qist.app
```

### KYC Approved (WhatsApp)
```
🎉 *KYC Approved!*

Congratulations {memberName}!

Your identity verification has been approved.

✅ *Membership Number:* {memberNumber}

You can now start investing in Shariah-compliant opportunities.

👉 Visit: qist.app
```

### KYC Rejected (SMS - Resubmittable)
```
{memberName}, your KYC needs more info. Reason: {reason}. Resubmit at qist.app/member/kyc
```

### KYC Rejected (WhatsApp - Resubmittable)
```
⚠️ *KYC Update Required*

{memberName}, your KYC verification requires additional information.

📋 *Reason:* {reason}

🔄 Please review and resubmit your documents.

👉 Visit: qist.app/member/kyc
```

## Phone Number Formatting

The system automatically formats phone numbers to E.164 standard:

```tsx
import { formatPhoneNumber } from '@/utils/sms-notifications';

// Nigerian number examples
formatPhoneNumber('08012345678')      // → +2348012345678
formatPhoneNumber('8012345678')       // → +2348012345678
formatPhoneNumber('+2348012345678')   // → +2348012345678
formatPhoneNumber('2348012345678')    // → +2348012345678

// Other countries (provide country code)
formatPhoneNumber('5551234567', '1')  // → +15551234567 (US)
formatPhoneNumber('9876543210', '91') // → +919876543210 (India)
```

## User Preferences

Users can control SMS notifications via Settings page (`/member/settings`):

```tsx
// Check if user has SMS enabled (default: true)
const smsEnabled = investor.data.smsNotifications !== false;

if (smsEnabled && phoneNumber) {
  // Send SMS/WhatsApp
}
```

Toggle is already implemented in `src/app/member/settings/page.tsx`.

## Error Handling

The implementation includes graceful error handling:

1. **Validation Errors**: Invalid phone numbers or missing data
2. **API Errors**: Twilio API failures (rate limits, invalid credentials)
3. **Network Errors**: Connection failures
4. **Graceful Degradation**: KYC approval continues even if SMS fails

```tsx
try {
  await sendKYCApprovedNotification({ ... });
} catch (smsError) {
  console.error('SMS/WhatsApp notification failed:', smsError);
  // KYC approval still succeeds
}
```

## Cost Considerations

### Twilio Pricing (Nigeria)
- **SMS**: ₦7-₦12 per message (~$0.0075-$0.013 USD)
- **WhatsApp**: ₦4-₦8 per message (~$0.005-$0.009 USD)
- **Trial Credits**: $15 USD (~6,000 NGN, ~1500-2000 messages)

### Optimization Strategies
1. **Default to WhatsApp**: Cheaper than SMS, richer formatting
2. **User Preferences**: Only send to users who opt in
3. **Message Consolidation**: Combine multiple updates into one message
4. **Selective Notifications**: Only for critical events (KYC, investments)
5. **Rate Limiting**: Prevent duplicate sends within short time windows

## Security Best Practices

1. **Environment Variables**: Never commit `.env.local` to Git
2. **API Route Protection**: Consider adding authentication middleware
3. **Rate Limiting**: Implement rate limits on API endpoint
4. **Phone Validation**: Validate all phone numbers before sending
5. **Audit Logging**: Log all SMS sends for compliance
6. **Data Privacy**: Don't log sensitive user data in error messages

## Future Enhancements

### Planned Features
- [ ] **Message Queue**: Batch processing with Bull/BullMQ
- [ ] **Retry Logic**: Automatic retries on failure
- [ ] **Delivery Tracking**: Track message status via Twilio webhooks
- [ ] **Read Receipts**: WhatsApp read receipt tracking
- [ ] **Template Management**: Admin UI for editing templates
- [ ] **A/B Testing**: Test different message formats
- [ ] **Internationalization**: Multi-language support
- [ ] **Rich Media**: Send images/PDFs via WhatsApp
- [ ] **Two-way Messaging**: Handle replies from users
- [ ] **Scheduled Messages**: Send reminders and updates

### Integration Opportunities
- Investment confirmations
- Profit distribution alerts
- Payment reminders
- Contract expiration warnings
- Portfolio performance reports
- Security alerts (login from new device)

## Troubleshooting

### Common Issues

**Issue**: "SMS service not configured" error
- **Solution**: Ensure `.env.local` has all Twilio variables
- Restart Next.js dev server after adding env vars

**Issue**: Messages not being received
- **Solution**: 
  - Verify phone number is in E.164 format
  - For trial accounts, verify recipient's number in Twilio Console
  - Check Twilio logs in Console for delivery status

**Issue**: WhatsApp messages failing
- **Solution**:
  - Ensure user has joined sandbox with "join [code]" message
  - Check sandbox session hasn't expired (24 hour limit)
  - Verify WhatsApp number format: `whatsapp:+1234567890`

**Issue**: "Invalid phone number" errors
- **Solution**: 
  - Use `formatPhoneNumber()` utility before sending
  - Ensure country code is included
  - Validate with `isValidPhoneNumber()`

**Issue**: High SMS costs
- **Solution**:
  - Switch to WhatsApp (cheaper)
  - Implement user preference checks
  - Add rate limiting
  - Use message consolidation

## Support

For questions or issues:
- **Twilio Support**: [https://support.twilio.com](https://support.twilio.com)
- **Documentation**: [https://www.twilio.com/docs/sms](https://www.twilio.com/docs/sms)
- **WhatsApp Docs**: [https://www.twilio.com/docs/whatsapp](https://www.twilio.com/docs/whatsapp)

## Version History

- **v1.0.0** (2025-01-XX): Initial implementation
  - SMS/WhatsApp service setup
  - KYC notification integration
  - Template system
  - Phone number formatting
  - User preference support
