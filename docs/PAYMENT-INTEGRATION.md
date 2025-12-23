# Payment Provider Integration Setup Guide

This guide explains how to configure Paystack and Stripe payment integration for the QIST Platform.

## Overview

The platform supports two payment providers:
- **Paystack** (Primary - Nigeria-focused)
- **Stripe** (Secondary - Global)

Both providers are integrated for card payments in the wallet deposit flow.

## Prerequisites

### 1. Paystack Account
1. Sign up at [https://dashboard.paystack.com/signup](https://dashboard.paystack.com/signup)
2. Complete business verification (required for live payments)
3. Get your API keys from Settings > API Keys & Webhooks

### 2. Stripe Account
1. Sign up at [https://dashboard.stripe.com/register](https://dashboard.stripe.com/register)
2. Complete business verification
3. Get your API keys from Developers > API keys

## Installation

The required packages are already installed:
```bash
npm install @paystack/inline-js @stripe/stripe-js
```

## Configuration

### 1. Environment Variables

Create a `.env.local` file in the project root (copy from `.env.example`):

```env
# Paystack Configuration
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_xxxxxxxxxxxxx
PAYSTACK_SECRET_KEY=sk_test_xxxxxxxxxxxxx

# Stripe Configuration  
NEXT_PUBLIC_STRIPE_PUBLIC_KEY=pk_test_xxxxxxxxxxxxx
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxx
```

**Important Notes:**
- `NEXT_PUBLIC_*` variables are exposed to the browser
- Never commit `.env.local` to version control
- Use test keys (`pk_test_*`, `sk_test_*`) for development
- Switch to live keys (`pk_live_*`, `sk_live_*`) for production

### 2. Paystack Setup

**Test Mode:**
- Public Key: `pk_test_xxxxxxxxxxxxxxxxxxxxxxx`
- Secret Key: `sk_test_xxxxxxxxxxxxxxxxxxxxxxx`

**Test Cards:**
```
Success: 4084084084084081
Insufficient Funds: 4084080000000408
Declined: 4084084084084083
```

**Webhook URL (for production):**
```
https://your-domain.com/api/webhooks/paystack
```

### 3. Stripe Setup

**Test Mode:**
- Public Key: `pk_test_xxxxxxxxxxxxxxxxxxxxxxx`
- Secret Key: `sk_test_xxxxxxxxxxxxxxxxxxxxxxx`

**Test Cards:**
```
Success: 4242 4242 4242 4242
Declined: 4000 0000 0000 0002
Requires Authentication: 4000 0025 0000 3155
```

Use any future expiry date, any 3-digit CVC, and any postal code.

**Webhook URL (for production):**
```
https://your-domain.com/api/webhooks/stripe
```

## Implementation Details

### Payment Flow

1. **User initiates payment:**
   - User enters deposit amount
   - Selects payment method: "Card Payment"
   - Chooses provider: Paystack or Stripe
   - Clicks "Pay with Paystack/Stripe"

2. **Payment processing:**
   - Frontend calls `handleCardPayment()` function
   - Opens Paystack Inline modal or Stripe Payment Element
   - User completes payment

3. **Payment verification:**
   - Success callback receives payment reference
   - Backend verifies payment with provider API
   - Creates deposit request in database
   - Updates wallet balance (auto-approved for verified card payments)

4. **User notification:**
   - Success/error alert shown
   - Wallet balance updated
   - Transaction appears in history

### Code Structure

**Frontend:**
- `/src/app/member/wallet/page.tsx` - Wallet UI with payment integration
- `/src/utils/payment-providers.ts` - Payment provider utilities

**Backend API Routes:**
- `/src/app/api/create-payment-intent/route.ts` - Stripe Payment Intent creation
- `/src/app/api/verify-paystack-payment/route.ts` - Paystack payment verification
- `/src/app/api/verify-stripe-payment/route.ts` - Stripe payment verification

**Layout:**
- `/src/app/layout.tsx` - Includes Paystack Inline JS SDK script

## Testing

### 1. Test Paystack Payment

```bash
# 1. Start development server
npm run dev

# 2. Navigate to wallet page
# http://localhost:3000/member/wallet

# 3. Click "Deposit Funds"
# 4. Enter amount (min ₦1,000)
# 5. Select "Card Payment"
# 6. Choose "Paystack"
# 7. Click "🔒 Pay with Paystack"
# 8. Use test card: 4084084084084081
# 9. Enter: PIN: 0000, OTP: 123456
```

### 2. Test Stripe Payment

```bash
# Follow same steps but choose "Stripe"
# Use test card: 4242 4242 4242 4242
# Any future date, any CVC, any postal code
```

## Production Deployment

### 1. Update Environment Variables

Replace test keys with live keys in your hosting platform:

**Vercel/Netlify:**
```bash
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_live_xxxxx
PAYSTACK_SECRET_KEY=sk_live_xxxxx
NEXT_PUBLIC_STRIPE_PUBLIC_KEY=pk_live_xxxxx
STRIPE_SECRET_KEY=sk_live_xxxxx
```

### 2. Configure Webhooks

**Paystack Webhook:**
1. Go to Settings > API Keys & Webhooks
2. Add webhook URL: `https://yourdomain.com/api/webhooks/paystack`
3. Subscribe to events: `charge.success`, `charge.failed`
4. Save the webhook secret

**Stripe Webhook:**
1. Go to Developers > Webhooks
2. Add endpoint: `https://yourdomain.com/api/webhooks/stripe`
3. Subscribe to events: `payment_intent.succeeded`, `payment_intent.payment_failed`
4. Save the webhook signing secret

### 3. Update Backend Verification

The current implementation uses direct API verification. For production, webhook handlers provide real-time payment status updates.

Create webhook handlers:
- `/src/app/api/webhooks/paystack/route.ts`
- `/src/app/api/webhooks/stripe/route.ts`

## Security Best Practices

1. **Never expose secret keys** - Only `NEXT_PUBLIC_*` variables should be in frontend code
2. **Validate webhooks** - Verify webhook signatures to prevent fraud
3. **Server-side verification** - Always verify payments on the backend
4. **Amount validation** - Verify payment amount matches user request
5. **Idempotency** - Handle duplicate payment notifications
6. **Rate limiting** - Protect API endpoints from abuse

## Troubleshooting

### Paystack Issues

**Error: "Paystack SDK not loaded"**
- Ensure `<script src="https://js.paystack.co/v1/inline.js">` is in layout.tsx
- Check browser console for script loading errors

**Error: "Invalid public key"**
- Verify `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` is set correctly
- Ensure no extra spaces in environment variable

### Stripe Issues

**Error: "Failed to load Stripe"**
- Check that `@stripe/stripe-js` is installed
- Verify `NEXT_PUBLIC_STRIPE_PUBLIC_KEY` is set

**Error: "Failed to create payment intent"**
- Install Stripe SDK: `npm install stripe`
- Uncomment Stripe initialization code in `/src/app/api/create-payment-intent/route.ts`
- Verify `STRIPE_SECRET_KEY` is set

### General Issues

**Payment succeeds but wallet not updated:**
- Check browser console and server logs
- Verify Juno collections: `deposit_requests`, `wallets`
- Ensure user is authenticated

**Verification endpoint errors:**
- Check API route logs in terminal
- Verify secret keys are correct
- Test API endpoints directly with curl/Postman

## Support

### Paystack Support
- Email: support@paystack.com
- Docs: https://paystack.com/docs
- Community: https://paystack.community

### Stripe Support
- Email: support@stripe.com
- Docs: https://stripe.com/docs
- Discord: https://stripe.com/go/developer-chat

## Next Steps

1. ✅ Install payment SDKs
2. ✅ Add environment variables
3. ✅ Test with test cards
4. ⏳ Implement webhook handlers (recommended for production)
5. ⏳ Add transaction history page
6. ⏳ Implement refund functionality
7. ⏳ Add payment analytics dashboard

## Additional Features to Implement

### 1. Webhook Handlers (High Priority)
Real-time payment status updates improve reliability.

### 2. Email Notifications
Send payment receipts to users via email.

### 3. Transaction Receipts
Generate PDF receipts for successful payments.

### 4. Refund System
Allow admins to process refunds for failed transactions.

### 5. Multi-currency Support
Expand beyond NGN to support USD, EUR, etc.

### 6. Recurring Payments
Implement subscription-style recurring deposits.

### 7. Payment Analytics
Track conversion rates, failed payments, and revenue metrics.
