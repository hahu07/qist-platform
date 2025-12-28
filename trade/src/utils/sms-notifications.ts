/**
 * Client-side SMS/WhatsApp Notification Helpers
 * 
 * Usage:
 * ```tsx
 * import { sendKYCApprovedNotification } from '@/utils/sms-notifications';
 * 
 * await sendKYCApprovedNotification({
 *   phoneNumber: '+2348012345678',
 *   memberName: 'John Doe',
 *   memberNumber: 'INV-2025-0001',
 *   sendWhatsApp: true,
 * });
 * ```
 */

interface SendSMSOptions {
  type: 'sms' | 'whatsapp';
  phoneNumber: string;
  message?: string;
  template?: string;
  data?: Record<string, any>;
}

interface SendSMSResponse {
  success: boolean;
  error?: string;
  messageId?: string;
  status?: string;
}

/**
 * Send SMS or WhatsApp notification via API
 */
export async function sendNotification(options: SendSMSOptions): Promise<SendSMSResponse> {
  try {
    const response = await fetch('/api/notifications/send-sms', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(options),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to send notification:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send notification',
    };
  }
}

// ============================================================================
// KYC Notification Helpers
// ============================================================================

export interface KYCApprovedNotificationData {
  phoneNumber: string;
  memberName: string;
  memberNumber: string;
  sendSMS?: boolean;
  sendWhatsApp?: boolean;
}

/**
 * Send KYC approved notification
 */
export async function sendKYCApprovedNotification(
  data: KYCApprovedNotificationData
): Promise<{ sms?: SendSMSResponse; whatsapp?: SendSMSResponse }> {
  const results: { sms?: SendSMSResponse; whatsapp?: SendSMSResponse } = {};

  if (data.sendSMS) {
    results.sms = await sendNotification({
      type: 'sms',
      phoneNumber: data.phoneNumber,
      template: 'kyc_approved_sms',
      data: {
        memberName: data.memberName,
        memberNumber: data.memberNumber,
      },
    });
  }

  if (data.sendWhatsApp) {
    results.whatsapp = await sendNotification({
      type: 'whatsapp',
      phoneNumber: data.phoneNumber,
      template: 'kyc_approved_whatsapp',
      data: {
        memberName: data.memberName,
        memberNumber: data.memberNumber,
      },
    });
  }

  return results;
}

export interface KYCRejectedNotificationData {
  phoneNumber: string;
  memberName: string;
  reason: string;
  allowsResubmit: boolean;
  sendSMS?: boolean;
  sendWhatsApp?: boolean;
}

/**
 * Send KYC rejected notification
 */
export async function sendKYCRejectedNotification(
  data: KYCRejectedNotificationData
): Promise<{ sms?: SendSMSResponse; whatsapp?: SendSMSResponse }> {
  const results: { sms?: SendSMSResponse; whatsapp?: SendSMSResponse } = {};

  if (data.sendSMS) {
    results.sms = await sendNotification({
      type: 'sms',
      phoneNumber: data.phoneNumber,
      template: 'kyc_rejected_sms',
      data: {
        memberName: data.memberName,
        reason: data.reason,
        allowsResubmit: data.allowsResubmit,
      },
    });
  }

  if (data.sendWhatsApp) {
    results.whatsapp = await sendNotification({
      type: 'whatsapp',
      phoneNumber: data.phoneNumber,
      template: 'kyc_rejected_whatsapp',
      data: {
        memberName: data.memberName,
        reason: data.reason,
        allowsResubmit: data.allowsResubmit,
      },
    });
  }

  return results;
}

// ============================================================================
// Investment Notification Helpers
// ============================================================================

export interface InvestmentNotificationData {
  phoneNumber: string;
  businessName: string;
  amount: number;
  sendSMS?: boolean;
  sendWhatsApp?: boolean;
}

/**
 * Send investment confirmed notification
 */
export async function sendInvestmentConfirmedNotification(
  data: InvestmentNotificationData
): Promise<{ sms?: SendSMSResponse; whatsapp?: SendSMSResponse }> {
  const results: { sms?: SendSMSResponse; whatsapp?: SendSMSResponse } = {};

  if (data.sendSMS) {
    results.sms = await sendNotification({
      type: 'sms',
      phoneNumber: data.phoneNumber,
      template: 'investment_confirmed',
      data: {
        businessName: data.businessName,
        amount: data.amount,
      },
    });
  }

  if (data.sendWhatsApp) {
    results.whatsapp = await sendNotification({
      type: 'whatsapp',
      phoneNumber: data.phoneNumber,
      template: 'investment_confirmed',
      data: {
        businessName: data.businessName,
        amount: data.amount,
      },
    });
  }

  return results;
}

// ============================================================================
// Profit Distribution Notification Helpers
// ============================================================================

export interface ProfitDistributionNotificationData {
  phoneNumber: string;
  amount: number;
  sendSMS?: boolean;
  sendWhatsApp?: boolean;
}

/**
 * Send profit distribution notification
 */
export async function sendProfitDistributionNotification(
  data: ProfitDistributionNotificationData
): Promise<{ sms?: SendSMSResponse; whatsapp?: SendSMSResponse }> {
  const results: { sms?: SendSMSResponse; whatsapp?: SendSMSResponse } = {};

  if (data.sendSMS) {
    results.sms = await sendNotification({
      type: 'sms',
      phoneNumber: data.phoneNumber,
      template: 'profit_distribution',
      data: {
        amount: data.amount,
      },
    });
  }

  if (data.sendWhatsApp) {
    results.whatsapp = await sendNotification({
      type: 'whatsapp',
      phoneNumber: data.phoneNumber,
      template: 'profit_distribution',
      data: {
        amount: data.amount,
      },
    });
  }

  return results;
}

// ============================================================================
// Deposit Notification Helpers
// ============================================================================

export interface DepositNotificationData {
  phoneNumber: string;
  amount: number;
  sendSMS?: boolean;
  sendWhatsApp?: boolean;
}

/**
 * Send deposit confirmed notification
 */
export async function sendDepositConfirmedNotification(
  data: DepositNotificationData
): Promise<{ sms?: SendSMSResponse; whatsapp?: SendSMSResponse }> {
  const results: { sms?: SendSMSResponse; whatsapp?: SendSMSResponse } = {};

  if (data.sendSMS) {
    results.sms = await sendNotification({
      type: 'sms',
      phoneNumber: data.phoneNumber,
      template: 'deposit_confirmed',
      data: {
        amount: data.amount,
      },
    });
  }

  if (data.sendWhatsApp) {
    results.whatsapp = await sendNotification({
      type: 'whatsapp',
      phoneNumber: data.phoneNumber,
      template: 'deposit_confirmed',
      data: {
        amount: data.amount,
      },
    });
  }

  return results;
}

// ============================================================================
// Custom Message Helper
// ============================================================================

export interface CustomNotificationData {
  phoneNumber: string;
  message: string;
  sendSMS?: boolean;
  sendWhatsApp?: boolean;
}

/**
 * Send custom notification message
 */
export async function sendCustomNotification(
  data: CustomNotificationData
): Promise<{ sms?: SendSMSResponse; whatsapp?: SendSMSResponse }> {
  const results: { sms?: SendSMSResponse; whatsapp?: SendSMSResponse } = {};

  if (data.sendSMS) {
    results.sms = await sendNotification({
      type: 'sms',
      phoneNumber: data.phoneNumber,
      message: data.message,
    });
  }

  if (data.sendWhatsApp) {
    results.whatsapp = await sendNotification({
      type: 'whatsapp',
      phoneNumber: data.phoneNumber,
      message: data.message,
    });
  }

  return results;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Check if SMS service is configured
 */
export async function isSMSServiceConfigured(): Promise<boolean> {
  try {
    const response = await fetch('/api/notifications/send-sms', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'sms',
        phoneNumber: '+1234567890',
        message: 'test',
      }),
    });

    const data = await response.json();
    // If we get "SMS service not configured", it means env vars are missing
    return !data.error?.includes('not configured');
  } catch {
    return false;
  }
}

/**
 * Validate phone number format
 */
export function isValidPhoneNumber(phone: string): boolean {
  // E.164 format: +[country code][number]
  // Must start with + and have 10-15 digits
  const e164Regex = /^\+[1-9]\d{9,14}$/;
  return e164Regex.test(phone);
}

/**
 * Format phone number to E.164
 * Assumes Nigerian number if no country code provided
 */
export function formatPhoneNumber(phone: string, defaultCountryCode = '234'): string {
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');

  // Already in E.164 format
  if (phone.startsWith('+')) {
    return phone;
  }

  // Has country code but missing +
  if (digits.length > 10) {
    return `+${digits}`;
  }

  // Local format - add default country code
  // Handle leading 0 (e.g., 08012345678 -> 8012345678)
  const localNumber = digits.startsWith('0') ? digits.slice(1) : digits;
  return `+${defaultCountryCode}${localNumber}`;
}
