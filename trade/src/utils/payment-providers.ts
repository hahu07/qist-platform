/**
 * Payment Provider Integration Utilities
 * Handles Paystack and Stripe payment processing
 */

// Environment variables for API keys (add these to your .env.local)
const PAYSTACK_PUBLIC_KEY = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || 'DEMO_MODE';
const STRIPE_PUBLIC_KEY = process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY || 'DEMO_MODE';

const IS_DEMO_MODE = PAYSTACK_PUBLIC_KEY === 'DEMO_MODE' || STRIPE_PUBLIC_KEY === 'DEMO_MODE';

export interface PaymentConfig {
  amount: number; // Amount in Naira
  email: string;
  userId: string;
  currency?: string;
  metadata?: Record<string, any>;
}

export interface PaymentResponse {
  success: boolean;
  reference: string;
  message?: string;
  error?: string;
}

/**
 * Initialize Paystack payment
 * Uses Paystack Inline JS SDK
 */
export async function initiatePaystackPayment(
  config: PaymentConfig,
  onSuccess: (reference: string) => void,
  onClose: () => void
): Promise<void> {
  try {
    // Demo mode - simulate payment without API keys
    if (IS_DEMO_MODE) {
      if (confirm(`🎭 DEMO MODE\n\nSimulate successful payment of ₦${config.amount.toLocaleString()}?\n\n(Get real API keys from dashboard.paystack.com to enable live payments)`)) {
        const demoReference = `DEMO_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        setTimeout(() => onSuccess(demoReference), 1000);
      } else {
        onClose();
      }
      return;
    }

    // Dynamically import PaystackPop
    const PaystackPop = (window as any).PaystackPop;
    
    if (!PaystackPop) {
      throw new Error('Paystack SDK not loaded. Please add the script to your HTML.');
    }

    const handler = PaystackPop.setup({
      key: PAYSTACK_PUBLIC_KEY,
      email: config.email,
      amount: config.amount * 100, // Convert to kobo (Paystack uses smallest currency unit)
      currency: config.currency || 'NGN',
      ref: `QIST-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      metadata: {
        custom_fields: [
          {
            display_name: "User ID",
            variable_name: "user_id",
            value: config.userId
          },
          ...(config.metadata ? Object.entries(config.metadata).map(([key, value]) => ({
            display_name: key,
            variable_name: key,
            value: String(value)
          })) : [])
        ]
      },
      callback: (response: any) => {
        onSuccess(response.reference);
      },
      onClose: () => {
        onClose();
      }
    });

    handler.openIframe();
  } catch (error) {
    console.error('Paystack initialization error:', error);
    throw error;
  }
}

/**
 * Initialize Stripe payment
 * Uses Stripe Elements
 */
export async function initiateStripePayment(
  config: PaymentConfig,
  onSuccess: (reference: string) => void,
  onClose: () => void
): Promise<void> {
  try {
    // Demo mode - simulate payment without API keys
    if (IS_DEMO_MODE) {
      if (confirm(`🎭 DEMO MODE\n\nSimulate successful Stripe payment of ₦${config.amount.toLocaleString()}?\n\n(Get real API keys from dashboard.stripe.com to enable live payments)`)) {
        const demoReference = `DEMO_STRIPE_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        setTimeout(() => onSuccess(demoReference), 1000);
      } else {
        onClose();
      }
      return;
    }

    // Dynamically import Stripe
    const { loadStripe } = await import('@stripe/stripe-js');
    const stripe = await loadStripe(STRIPE_PUBLIC_KEY);

    if (!stripe) {
      throw new Error('Failed to load Stripe');
    }

    // In a real implementation, you would:
    // 1. Call your backend API to create a Payment Intent
    // 2. Get the client_secret from the response
    // 3. Use stripe.confirmPayment() with the client_secret
    
    // For now, we'll show a placeholder
    // You need to create a backend endpoint that creates a Stripe Payment Intent
    const response = await fetch('/api/create-payment-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: config.amount,
        currency: config.currency || 'ngn',
        userId: config.userId,
        metadata: config.metadata
      })
    });

    if (!response.ok) {
      throw new Error('Failed to create payment intent');
    }

    const { clientSecret, paymentIntentId } = await response.json();

    // Redirect to Stripe Checkout or use Stripe Elements
    const result = await stripe.confirmPayment({
      clientSecret,
      confirmParams: {
        return_url: `${window.location.origin}/member/wallet?payment=success`,
      },
    });

    if (result.error) {
      throw new Error(result.error.message);
    }

    onSuccess(paymentIntentId);
  } catch (error) {
    console.error('Stripe initialization error:', error);
    onClose();
    throw error;
  }
}

/**
 * Verify Paystack payment on backend
 */
export async function verifyPaystackPayment(reference: string): Promise<PaymentResponse> {
  try {
    const response = await fetch(`/api/verify-paystack-payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reference })
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Paystack verification error:', error);
    return {
      success: false,
      reference,
      error: 'Verification failed'
    };
  }
}

/**
 * Verify Stripe payment on backend
 */
export async function verifyStripePayment(paymentIntentId: string): Promise<PaymentResponse> {
  try {
    const response = await fetch(`/api/verify-stripe-payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentIntentId })
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Stripe verification error:', error);
    return {
      success: false,
      reference: paymentIntentId,
      error: 'Verification failed'
    };
  }
}
