import { NextRequest, NextResponse } from 'next/server';

/**
 * API Route: Send SMS/WhatsApp Notification
 * 
 * POST /api/notifications/send-sms
 * 
 * Body:
 * {
 *   type: 'sms' | 'whatsapp',
 *   phoneNumber: string,
 *   message: string,
 *   template?: 'kyc_approved' | 'kyc_rejected' | 'investment_confirmed' | 'profit_distribution' | 'deposit_confirmed',
 *   data?: { [key: string]: any }
 * }
 */

interface SendSMSRequest {
  type: 'sms' | 'whatsapp';
  phoneNumber: string;
  message?: string;
  template?: string;
  data?: Record<string, any>;
}

export async function POST(request: NextRequest) {
  try {
    const body: SendSMSRequest = await request.json();
    const { type, phoneNumber, message, template, data } = body;

    // Validate request
    if (!type || !phoneNumber) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (!message && !template) {
      return NextResponse.json(
        { success: false, error: 'Either message or template is required' },
        { status: 400 }
      );
    }

    // Initialize SMS service (server-side only)
    const { SMSService } = await import('@/utils/sms-service');
    
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const twilioPhone = process.env.TWILIO_PHONE_NUMBER;
    const whatsappPhone = process.env.TWILIO_WHATSAPP_NUMBER;

    if (!accountSid || !authToken || !twilioPhone) {
      return NextResponse.json(
        { success: false, error: 'SMS service not configured' },
        { status: 500 }
      );
    }

    const smsService = new SMSService({
      accountSid,
      authToken,
      phoneNumber: twilioPhone,
      whatsappNumber: whatsappPhone,
    });

    // Build message from template if provided
    let finalMessage = message;
    
    if (template && data) {
      finalMessage = buildMessageFromTemplate(template, data);
    }

    if (!finalMessage) {
      return NextResponse.json(
        { success: false, error: 'Failed to build message' },
        { status: 400 }
      );
    }

    // Send notification
    let result;
    if (type === 'whatsapp') {
      result = await smsService.sendWhatsApp({
        to: phoneNumber,
        body: finalMessage,
      });
    } else {
      result = await smsService.sendSMS({
        to: phoneNumber,
        body: finalMessage,
      });
    }

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      messageId: result.messageId,
      status: result.status,
    });

  } catch (error) {
    console.error('Send SMS API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to send notification' 
      },
      { status: 500 }
    );
  }
}

/**
 * Build message from template
 */
function buildMessageFromTemplate(template: string, data: Record<string, any>): string {
  const { memberName, memberNumber, reason, allowsResubmit, businessName, amount } = data;

  switch (template) {
    case 'kyc_approved_sms':
      return `🎉 Congratulations ${memberName}! Your KYC verification is approved. Membership: ${memberNumber}. Start investing at qist.app`;
    
    case 'kyc_approved_whatsapp':
      return `🎉 *KYC Approved!*\n\nCongratulations ${memberName}!\n\nYour identity verification has been approved.\n\n✅ *Membership Number:* ${memberNumber}\n\nYou can now start investing in Shariah-compliant opportunities.\n\n👉 Visit: qist.app`;
    
    case 'kyc_rejected_sms':
      return allowsResubmit
        ? `${memberName}, your KYC needs more info. Reason: ${reason}. Resubmit at qist.app/member/kyc`
        : `${memberName}, KYC verification rejected. Reason: ${reason}. Contact support at qist.app`;
    
    case 'kyc_rejected_whatsapp':
      return allowsResubmit
        ? `⚠️ *KYC Update Required*\n\n${memberName}, your KYC verification requires additional information.\n\n📋 *Reason:* ${reason}\n\n🔄 Please review and resubmit your documents.\n\n👉 Visit: qist.app/member/kyc`
        : `❌ *KYC Rejected*\n\n${memberName}, your KYC verification has been rejected.\n\n📋 *Reason:* ${reason}\n\n📞 Please contact support for assistance.\n\n👉 Visit: qist.app`;
    
    case 'investment_confirmed':
      return `Investment confirmed! ₦${amount?.toLocaleString()} in ${businessName}. Track at qist.app/member/dashboard`;
    
    case 'profit_distribution':
      return `💰 Profit distributed: ₦${amount?.toLocaleString()}. Check your wallet at qist.app/member/wallet`;
    
    case 'deposit_confirmed':
      return `Deposit confirmed: ₦${amount?.toLocaleString()}. Available in your wallet. Invest at qist.app`;
    
    default:
      return '';
  }
}
