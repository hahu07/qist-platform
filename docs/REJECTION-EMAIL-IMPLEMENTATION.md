# Rejection Email Notifications - Implementation Guide

## Overview
Email notifications for application rejections require backend infrastructure that is not currently available in the Juno-only architecture. This document outlines the implementation approach once email services are configured.

## Current Architecture Limitation
- **Juno Platform**: Provides datastore, authentication, and file storage but **does not include email sending capabilities**
- **No SMTP Service**: The application currently has no email delivery mechanism
- **Client-side Only**: All current functionality runs in the browser or on-chain via Internet Computer canisters

## Required Infrastructure

### Option 1: Third-Party Email Service (Recommended)
Integrate a dedicated email service provider:

#### SendGrid Integration
```typescript
// Add to environment variables
SENDGRID_API_KEY=your_api_key_here
SENDGRID_FROM_EMAIL=noreply@qistplatform.com
```

```typescript
// src/lib/email.ts
import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

export async function sendRejectionEmail(
  to: string,
  businessName: string,
  rejectionReason: string,
  allowsResubmit: boolean,
  adminMessage?: string
) {
  const msg = {
    to,
    from: process.env.SENDGRID_FROM_EMAIL!,
    subject: `Application Update: ${allowsResubmit ? 'Revision Needed' : 'Decision'}`,
    html: generateRejectionEmailHtml({
      businessName,
      rejectionReason,
      allowsResubmit,
      adminMessage,
    }),
  };

  try {
    await sgMail.send(msg);
    console.log(`Rejection email sent to ${to}`);
  } catch (error) {
    console.error('Email sending failed:', error);
    throw error;
  }
}

function generateRejectionEmailHtml(params: {
  businessName: string;
  rejectionReason: string;
  allowsResubmit: boolean;
  adminMessage?: string;
}): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: ${params.allowsResubmit ? '#f59e0b' : '#ef4444'}; color: white; padding: 20px; border-radius: 8px; }
          .content { padding: 20px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; margin-top: 20px; }
          .reason-box { background: white; padding: 15px; border-left: 4px solid ${params.allowsResubmit ? '#f59e0b' : '#ef4444'}; margin: 15px 0; }
          .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
          .button { display: inline-block; padding: 12px 24px; background: #3b82f6; color: white; text-decoration: none; border-radius: 6px; margin-top: 15px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${params.allowsResubmit ? '📋 Application Revision Needed' : '❌ Application Decision'}</h1>
          </div>
          
          <div class="content">
            <p>Dear ${params.businessName},</p>
            
            <p>We have reviewed your financing application. ${params.allowsResubmit 
              ? 'Unfortunately, we need some revisions before we can proceed.' 
              : 'Unfortunately, we are unable to approve your application at this time.'
            }</p>
            
            <div class="reason-box">
              <strong>Reason:</strong><br/>
              ${params.rejectionReason}
              ${params.adminMessage ? `<br/><br/><strong>Additional Details:</strong><br/>${params.adminMessage}` : ''}
            </div>
            
            ${params.allowsResubmit ? `
              <p><strong>Next Steps:</strong></p>
              <ol>
                <li>Log in to your dashboard</li>
                <li>Review the rejection reason above</li>
                <li>Update your application with the necessary corrections</li>
                <li>Resubmit for review</li>
              </ol>
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/business/financing/apply" class="button">
                Update Application
              </a>
            ` : `
              <p>This decision is final. If you believe this is an error, please contact our support team.</p>
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/business/messages" class="button">
                Contact Support
              </a>
            `}
          </div>
          
          <div class="footer">
            <p>QIST Platform - Sharia-Compliant Financing</p>
            <p>Need help? <a href="${process.env.NEXT_PUBLIC_APP_URL}/support">Contact Support</a></p>
          </div>
        </div>
      </body>
    </html>
  `;
}
```

#### Alternative Services
- **Resend**: Modern, developer-friendly API (recommended for Next.js)
- **AWS SES**: Cost-effective for high volume
- **Postmark**: Excellent deliverability
- **Mailgun**: Enterprise-grade features

### Option 2: Custom SMTP (Not Recommended)
Requires managing your own email server infrastructure, dealing with deliverability issues, SPF/DKIM/DMARC configuration.

## Integration Points

### 1. Admin Application Review Page
```typescript
// src/app/admin/business-applications/page.tsx
import { sendRejectionEmail } from '@/lib/email';

const handleReject = async () => {
  // ... existing rejection logic ...
  
  try {
    // Send rejection email
    await sendRejectionEmail(
      profile.data.email, // Business email
      profile.data.businessName,
      selectedReason,
      allowsResubmit,
      adminMessage
    );
    
    toast.success("Application rejected and email notification sent");
  } catch (emailError) {
    console.error("Failed to send email:", emailError);
    toast.error("Application rejected but email notification failed");
  }
};
```

### 2. Email Queue (Production-Ready Approach)
For reliability, implement an email queue:

```typescript
// src/lib/email-queue.ts
import { setDoc } from '@junobuild/core';

interface EmailQueueItem {
  to: string;
  subject: string;
  html: string;
  status: 'pending' | 'sent' | 'failed';
  attempts: number;
  createdAt: string;
  sentAt?: string;
  error?: string;
}

export async function queueRejectionEmail(params: {
  businessEmail: string;
  businessName: string;
  rejectionReason: string;
  allowsResubmit: boolean;
  adminMessage?: string;
}) {
  const emailData: EmailQueueItem = {
    to: params.businessEmail,
    subject: `Application Update: ${params.allowsResubmit ? 'Revision Needed' : 'Decision'}`,
    html: generateRejectionEmailHtml(params),
    status: 'pending',
    attempts: 0,
    createdAt: new Date().toISOString(),
  };

  await setDoc({
    collection: 'email_queue',
    doc: {
      key: `rejection_${Date.now()}_${params.businessEmail}`,
      data: emailData,
    },
  });
}
```

Then create a background worker or cron job to process the queue:

```typescript
// src/workers/email-processor.ts
import { listDocs, setDoc } from '@junobuild/core';
import { sendRejectionEmail } from '@/lib/email';

export async function processEmailQueue() {
  const pending = await listDocs<EmailQueueItem>({
    collection: 'email_queue',
    filter: {
      matcher: { status: 'pending' },
    },
  });

  for (const email of pending.items) {
    if (email.data.attempts >= 3) {
      // Mark as failed after 3 attempts
      await setDoc({
        collection: 'email_queue',
        doc: {
          key: email.key,
          data: { ...email.data, status: 'failed' },
          version: email.version,
        },
      });
      continue;
    }

    try {
      await sgMail.send({
        to: email.data.to,
        from: process.env.SENDGRID_FROM_EMAIL!,
        subject: email.data.subject,
        html: email.data.html,
      });

      await setDoc({
        collection: 'email_queue',
        doc: {
          key: email.key,
          data: {
            ...email.data,
            status: 'sent',
            sentAt: new Date().toISOString(),
          },
          version: email.version,
        },
      });
    } catch (error) {
      await setDoc({
        collection: 'email_queue',
        doc: {
          key: email.key,
          data: {
            ...email.data,
            attempts: email.data.attempts + 1,
            error: String(error),
          },
          version: email.version,
        },
      });
    }
  }
}
```

### 3. Vercel Cron Job (for Next.js on Vercel)
```json
// vercel.json
{
  "crons": [
    {
      "path": "/api/cron/process-emails",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

```typescript
// src/app/api/cron/process-emails/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { processEmailQueue } from '@/workers/email-processor';

export async function GET(request: NextRequest) {
  // Verify cron secret to prevent unauthorized access
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await processEmailQueue();
  
  return NextResponse.json({ success: true });
}
```

## Environment Variables Required
```env
# Email Service
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
SENDGRID_FROM_EMAIL=noreply@qistplatform.com

# Application URLs
NEXT_PUBLIC_APP_URL=https://qistplatform.com

# Cron Security
CRON_SECRET=your_secure_random_string
```

## Email Templates

### Resubmittable Rejection
- Subject: "Application Revision Needed - QIST Platform"
- Tone: Constructive, helpful
- CTA: "Update Application" button
- Include: Specific reason, steps to correct, support link

### Permanent Rejection
- Subject: "Application Decision - QIST Platform"
- Tone: Professional, empathetic
- CTA: "Contact Support" button
- Include: Reason, appeal process (if any)

## Testing

### Development
```bash
# Use Ethereal (fake SMTP for testing)
npm install nodemailer

# Create test account
const testAccount = await nodemailer.createTestAccount();
```

### Staging
Use SendGrid sandbox mode or a test domain

### Production
- Start with low volume
- Monitor deliverability rates
- Check spam folder placement
- Verify SPF/DKIM records

## Compliance

### CAN-SPAM Act (US)
- Include physical address
- Provide unsubscribe link
- Honor opt-out requests within 10 days

### GDPR (EU)
- Obtain consent for emails
- Provide data access/deletion
- Document legal basis

## Monitoring

### Key Metrics
- Delivery rate (target: >95%)
- Open rate (target: >20%)
- Bounce rate (target: <5%)
- Complaint rate (target: <0.1%)

### Tools
- SendGrid dashboard
- Application logs
- Error tracking (Sentry)

## Implementation Checklist

- [ ] Choose email service provider
- [ ] Create account and get API key
- [ ] Set up domain authentication (SPF, DKIM, DMARC)
- [ ] Install email SDK (`npm install @sendgrid/mail`)
- [ ] Create email templates
- [ ] Implement `sendRejectionEmail` function
- [ ] Add to admin rejection flow
- [ ] Implement email queue (optional but recommended)
- [ ] Set up cron job for queue processing
- [ ] Configure environment variables
- [ ] Test with real email addresses
- [ ] Monitor deliverability in production

## Current Status
❌ **Not Implemented** - Requires infrastructure setup

The codebase is prepared for email integration (rejection reasons, admin messages, application status tracking), but the actual email sending functionality awaits backend service configuration.

## Estimated Implementation Time
- Basic SendGrid integration: 2-4 hours
- With email queue: 4-6 hours
- Full production setup with monitoring: 8-12 hours
