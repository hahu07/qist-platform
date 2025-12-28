# SMS/WhatsApp Notifications - Quick Reference

## Quick Start

### 1. Environment Setup
```bash
# Add to .env.local
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+1234567890
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
```

### 2. Basic Usage

```tsx
import { sendKYCApprovedNotification } from '@/utils/sms-notifications';

// Send KYC approval notification
await sendKYCApprovedNotification({
  phoneNumber: '+2348012345678',
  memberName: 'John Doe',
  memberNumber: 'INV-2025-0001',
  sendSMS: true,
  sendWhatsApp: true,
});
```

## Available Notification Functions

### KYC Notifications
```tsx
import { 
  sendKYCApprovedNotification,
  sendKYCRejectedNotification 
} from '@/utils/sms-notifications';

// Approved
await sendKYCApprovedNotification({
  phoneNumber: '+2348012345678',
  memberName: 'John Doe',
  memberNumber: 'INV-2025-0001',
  sendSMS: true,
  sendWhatsApp: true,
});

// Rejected
await sendKYCRejectedNotification({
  phoneNumber: '+2348012345678',
  memberName: 'John Doe',
  reason: 'Document not clear',
  allowsResubmit: true,
  sendSMS: true,
  sendWhatsApp: true,
});
```

### Investment Notifications
```tsx
import { 
  sendInvestmentConfirmedNotification,
  sendProfitDistributionNotification,
  sendDepositConfirmedNotification 
} from '@/utils/sms-notifications';

// Investment confirmed
await sendInvestmentConfirmedNotification({
  phoneNumber: '+2348012345678',
  businessName: 'Tech Startup Ltd',
  amount: 100000,
  sendSMS: true,
  sendWhatsApp: true,
});

// Profit distributed
await sendProfitDistributionNotification({
  phoneNumber: '+2348012345678',
  amount: 15000,
  sendSMS: true,
  sendWhatsApp: true,
});

// Deposit confirmed
await sendDepositConfirmedNotification({
  phoneNumber: '+2348012345678',
  amount: 50000,
  sendSMS: true,
  sendWhatsApp: true,
});
```

### Custom Messages
```tsx
import { sendCustomNotification } from '@/utils/sms-notifications';

await sendCustomNotification({
  phoneNumber: '+2348012345678',
  message: 'Your custom message here',
  sendSMS: true,
  sendWhatsApp: false, // SMS only
});
```

## Phone Number Utilities

```tsx
import { 
  formatPhoneNumber, 
  isValidPhoneNumber 
} from '@/utils/sms-notifications';

// Format to E.164
const formatted = formatPhoneNumber('08012345678'); // +2348012345678

// Validate E.164
const isValid = isValidPhoneNumber('+2348012345678'); // true
```

## Testing

### Local Testing
```bash
# 1. Start dev server
npm run dev

# 2. Test via curl
curl -X POST http://localhost:3000/api/notifications/send-sms \
  -H "Content-Type: application/json" \
  -d '{
    "type": "sms",
    "phoneNumber": "+2348012345678",
    "message": "Test message"
  }'
```

### WhatsApp Sandbox
```bash
# 1. Join sandbox via WhatsApp
# Send: join [sandbox-code]
# To: +14155238886

# 2. Test WhatsApp
curl -X POST http://localhost:3000/api/notifications/send-sms \
  -H "Content-Type: application/json" \
  -d '{
    "type": "whatsapp",
    "phoneNumber": "+2348012345678",
    "message": "Test WhatsApp"
  }'
```

## Integration Example (KYC Approval)

```tsx
const handleApproveKYC = async (investor: Investor) => {
  // ... approval logic ...
  
  // Get phone from investor data
  const phoneNumber = (investor.data as any).phone;
  const smsEnabled = (investor.data as any).smsNotifications !== false;
  
  if (phoneNumber && smsEnabled) {
    try {
      await sendKYCApprovedNotification({
        phoneNumber,
        memberName: getInvestorName(investor),
        memberNumber,
        sendSMS: true,
        sendWhatsApp: true,
      });
    } catch (error) {
      console.error('SMS/WhatsApp failed:', error);
      // Continue with approval even if SMS fails
    }
  }
};
```

## Cost Reference

### Twilio Pricing (Nigeria)
| Service  | Cost per Message | Est. 1000 msgs |
|----------|------------------|----------------|
| SMS      | ₦7-₦12 (~$0.01)  | ₦10,000        |
| WhatsApp | ₦4-₦8 (~$0.007)  | ₦6,000         |

**Tip**: WhatsApp is ~40% cheaper and supports richer formatting.

## Common Patterns

### Send Only If User Opted In
```tsx
const smsEnabled = (user.data as any).smsNotifications !== false;
if (phoneNumber && smsEnabled) {
  // Send notification
}
```

### Send WhatsApp First, SMS as Fallback
```tsx
try {
  const result = await sendNotification({
    type: 'whatsapp',
    phoneNumber,
    message,
  });
  
  if (!result.success) {
    // Fallback to SMS
    await sendNotification({
      type: 'sms',
      phoneNumber,
      message,
    });
  }
} catch (error) {
  console.error('Both WhatsApp and SMS failed');
}
```

### Batch Send (Multiple Users)
```tsx
const promises = investors.map(investor => 
  sendKYCApprovedNotification({
    phoneNumber: investor.data.phone,
    memberName: investor.data.fullName,
    memberNumber: investor.data.memberNumber,
    sendSMS: true,
    sendWhatsApp: true,
  })
);

const results = await Promise.allSettled(promises);
const succeeded = results.filter(r => r.status === 'fulfilled').length;
console.log(`Sent ${succeeded}/${investors.length} notifications`);
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "SMS service not configured" | Add env vars to `.env.local`, restart server |
| Not receiving messages | Verify number in Twilio Console (trial), check format |
| WhatsApp not working | Join sandbox: send "join [code]" to sandbox number |
| "Invalid phone number" | Use E.164 format: `+2348012345678` |
| High costs | Switch to WhatsApp, enable user preferences |

## Files Reference

| File | Purpose |
|------|---------|
| `src/utils/sms-service.ts` | Server-side Twilio API wrapper |
| `src/utils/sms-notifications.ts` | Client-side helper functions |
| `src/app/api/notifications/send-sms/route.ts` | Next.js API endpoint |
| `docs/SMS-WHATSAPP-NOTIFICATIONS.md` | Full documentation |

## Next Steps

1. **Setup Twilio**: Get credentials from [console.twilio.com](https://console.twilio.com)
2. **Add Env Vars**: Copy from `.env.example` to `.env.local`
3. **Test**: Use curl commands above
4. **Deploy**: Ensure production env vars are set
5. **Monitor**: Check Twilio logs for delivery status

## Support Links

- [Twilio Console](https://console.twilio.com)
- [SMS Documentation](https://www.twilio.com/docs/sms)
- [WhatsApp Documentation](https://www.twilio.com/docs/whatsapp)
- [Pricing](https://www.twilio.com/pricing)
