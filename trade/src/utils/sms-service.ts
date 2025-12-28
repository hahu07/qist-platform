/**
 * SMS Service - Twilio Integration
 * 
 * Provides SMS notification functionality using Twilio API
 * Supports both SMS and WhatsApp messaging
 * 
 * Setup:
 * 1. Sign up for Twilio account: https://www.twilio.com/try-twilio
 * 2. Get Account SID and Auth Token from Twilio Console
 * 3. Get a Twilio phone number
 * 4. For WhatsApp: Enable WhatsApp sandbox or get approved number
 * 5. Set environment variables in .env.local:
 *    - TWILIO_ACCOUNT_SID
 *    - TWILIO_AUTH_TOKEN
 *    - TWILIO_PHONE_NUMBER
 *    - TWILIO_WHATSAPP_NUMBER (optional)
 */

export interface SMSConfig {
  accountSid: string;
  authToken: string;
  phoneNumber: string;
  whatsappNumber?: string;
}

export interface SMSMessage {
  to: string;
  body: string;
  from?: string;
}

export interface WhatsAppMessage {
  to: string;
  body: string;
  from?: string;
  mediaUrl?: string;
}

export interface SMSResponse {
  success: boolean;
  messageId?: string;
  status?: string;
  error?: string;
}

/**
 * SMS Service Class
 * Handles SMS and WhatsApp messaging via Twilio
 */
export class SMSService {
  private config: SMSConfig;
  private baseUrl = 'https://api.twilio.com/2010-04-01';

  constructor(config: SMSConfig) {
    this.config = config;
  }

  /**
   * Send SMS message
   */
  async sendSMS(message: SMSMessage): Promise<SMSResponse> {
    try {
      const from = message.from || this.config.phoneNumber;
      
      if (!from) {
        throw new Error('No sender phone number configured');
      }

      // Format phone number (ensure E.164 format)
      const to = this.formatPhoneNumber(message.to);

      const response = await fetch(
        `${this.baseUrl}/Accounts/${this.config.accountSid}/Messages.json`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${btoa(`${this.config.accountSid}:${this.config.authToken}`)}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            To: to,
            From: from,
            Body: message.body,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to send SMS');
      }

      const data = await response.json();
      
      return {
        success: true,
        messageId: data.sid,
        status: data.status,
      };
    } catch (error) {
      console.error('SMS send error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send SMS',
      };
    }
  }

  /**
   * Send WhatsApp message
   */
  async sendWhatsApp(message: WhatsAppMessage): Promise<SMSResponse> {
    try {
      const from = message.from || this.config.whatsappNumber;
      
      if (!from) {
        throw new Error('No WhatsApp sender number configured');
      }

      // Format phone numbers for WhatsApp
      const to = `whatsapp:${this.formatPhoneNumber(message.to)}`;
      const whatsappFrom = from.startsWith('whatsapp:') ? from : `whatsapp:${from}`;

      const params: Record<string, string> = {
        To: to,
        From: whatsappFrom,
        Body: message.body,
      };

      // Add media URL if provided
      if (message.mediaUrl) {
        params.MediaUrl = message.mediaUrl;
      }

      const response = await fetch(
        `${this.baseUrl}/Accounts/${this.config.accountSid}/Messages.json`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${btoa(`${this.config.accountSid}:${this.config.authToken}`)}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams(params),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to send WhatsApp message');
      }

      const data = await response.json();
      
      return {
        success: true,
        messageId: data.sid,
        status: data.status,
      };
    } catch (error) {
      console.error('WhatsApp send error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send WhatsApp message',
      };
    }
  }

  /**
   * Send bulk SMS messages
   */
  async sendBulkSMS(messages: SMSMessage[]): Promise<SMSResponse[]> {
    return Promise.all(messages.map(msg => this.sendSMS(msg)));
  }

  /**
   * Send bulk WhatsApp messages
   */
  async sendBulkWhatsApp(messages: WhatsAppMessage[]): Promise<SMSResponse[]> {
    return Promise.all(messages.map(msg => this.sendWhatsApp(msg)));
  }

  /**
   * Format phone number to E.164 format
   * E.164: +[country code][area code][phone number]
   * Example: +2348012345678 (Nigeria), +60123456789 (Malaysia)
   */
  private formatPhoneNumber(phone: string): string {
    // Remove all non-digit characters except leading +
    let formatted = phone.replace(/[^\d+]/g, '');
    
    // If doesn't start with +, assume needs country code
    if (!formatted.startsWith('+')) {
      // Default to Nigeria (+234) if not specified
      // You can modify this based on your primary market
      if (formatted.startsWith('0')) {
        formatted = '+234' + formatted.substring(1);
      } else if (formatted.startsWith('234')) {
        formatted = '+' + formatted;
      } else {
        formatted = '+234' + formatted;
      }
    }
    
    return formatted;
  }

  /**
   * Validate phone number format
   */
  isValidPhoneNumber(phone: string): boolean {
    const formatted = this.formatPhoneNumber(phone);
    // Basic E.164 validation: + followed by 7-15 digits
    return /^\+\d{7,15}$/.test(formatted);
  }
}

/**
 * Initialize SMS service with environment variables
 */
export function initSMSService(): SMSService | null {
  // In production, these should come from environment variables
  const accountSid = process.env.NEXT_PUBLIC_TWILIO_ACCOUNT_SID || process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN; // Should NOT be public
  const phoneNumber = process.env.NEXT_PUBLIC_TWILIO_PHONE_NUMBER || process.env.TWILIO_PHONE_NUMBER;
  const whatsappNumber = process.env.NEXT_PUBLIC_TWILIO_WHATSAPP_NUMBER || process.env.TWILIO_WHATSAPP_NUMBER;

  if (!accountSid || !authToken || !phoneNumber) {
    console.warn('Twilio credentials not configured. SMS service disabled.');
    return null;
  }

  return new SMSService({
    accountSid,
    authToken,
    phoneNumber,
    whatsappNumber,
  });
}

/**
 * Global SMS service instance
 */
let smsServiceInstance: SMSService | null = null;

export function getSMSService(): SMSService | null {
  if (!smsServiceInstance) {
    smsServiceInstance = initSMSService();
  }
  return smsServiceInstance;
}

/**
 * Helper: Send SMS notification
 */
export async function sendSMSNotification(
  phoneNumber: string,
  message: string
): Promise<SMSResponse> {
  const service = getSMSService();
  
  if (!service) {
    return {
      success: false,
      error: 'SMS service not configured',
    };
  }

  return service.sendSMS({
    to: phoneNumber,
    body: message,
  });
}

/**
 * Helper: Send WhatsApp notification
 */
export async function sendWhatsAppNotification(
  phoneNumber: string,
  message: string,
  mediaUrl?: string
): Promise<SMSResponse> {
  const service = getSMSService();
  
  if (!service) {
    return {
      success: false,
      error: 'WhatsApp service not configured',
    };
  }

  return service.sendWhatsApp({
    to: phoneNumber,
    body: message,
    mediaUrl,
  });
}

/**
 * KYC-specific notification templates
 */

export async function sendKYCApprovedSMS(
  phoneNumber: string,
  memberName: string,
  memberNumber: string
): Promise<SMSResponse> {
  const message = `🎉 Congratulations ${memberName}! Your KYC verification is approved. Membership: ${memberNumber}. Start investing at qist.app`;
  return sendSMSNotification(phoneNumber, message);
}

export async function sendKYCApprovedWhatsApp(
  phoneNumber: string,
  memberName: string,
  memberNumber: string
): Promise<SMSResponse> {
  const message = `🎉 *KYC Approved!*\n\nCongratulations ${memberName}!\n\nYour identity verification has been approved.\n\n✅ *Membership Number:* ${memberNumber}\n\nYou can now start investing in Shariah-compliant opportunities.\n\n👉 Visit: qist.app`;
  return sendWhatsAppNotification(phoneNumber, message);
}

export async function sendKYCRejectedSMS(
  phoneNumber: string,
  memberName: string,
  reason: string,
  allowsResubmit: boolean
): Promise<SMSResponse> {
  const message = allowsResubmit
    ? `${memberName}, your KYC needs more info. Reason: ${reason}. Resubmit at qist.app/member/kyc`
    : `${memberName}, KYC verification rejected. Reason: ${reason}. Contact support at qist.app`;
  return sendSMSNotification(phoneNumber, message);
}

export async function sendKYCRejectedWhatsApp(
  phoneNumber: string,
  memberName: string,
  reason: string,
  allowsResubmit: boolean
): Promise<SMSResponse> {
  const message = allowsResubmit
    ? `⚠️ *KYC Update Required*\n\n${memberName}, your KYC verification requires additional information.\n\n📋 *Reason:* ${reason}\n\n🔄 Please review and resubmit your documents.\n\n👉 Visit: qist.app/member/kyc`
    : `❌ *KYC Rejected*\n\n${memberName}, your KYC verification has been rejected.\n\n📋 *Reason:* ${reason}\n\n📞 Please contact support for assistance.\n\n👉 Visit: qist.app`;
  return sendWhatsAppNotification(phoneNumber, message);
}

/**
 * Investment notification templates
 */

export async function sendInvestmentConfirmedSMS(
  phoneNumber: string,
  businessName: string,
  amount: number
): Promise<SMSResponse> {
  const message = `Investment confirmed! ₦${amount.toLocaleString()} in ${businessName}. Track at qist.app/member/dashboard`;
  return sendSMSNotification(phoneNumber, message);
}

export async function sendProfitDistributionSMS(
  phoneNumber: string,
  amount: number
): Promise<SMSResponse> {
  const message = `💰 Profit distributed: ₦${amount.toLocaleString()}. Check your wallet at qist.app/member/wallet`;
  return sendSMSNotification(phoneNumber, message);
}

export async function sendDepositConfirmedSMS(
  phoneNumber: string,
  amount: number
): Promise<SMSResponse> {
  const message = `Deposit confirmed: ₦${amount.toLocaleString()}. Available in your wallet. Invest at qist.app`;
  return sendSMSNotification(phoneNumber, message);
}
