# Quick Fix: "Please enter a valid key" Error

## Problem
The error "We could not start this transaction - Please enter a valid key" means Paystack/Stripe API keys are not configured.

## Solution: Get Your API Keys

### Option 1: Use Paystack (Recommended for Nigeria)

1. **Sign up for Paystack:**
   - Go to: https://dashboard.paystack.com/signup
   - Complete registration

2. **Get Test API Keys:**
   - Login to: https://dashboard.paystack.com
   - Click your profile icon (top right) → Settings
   - Navigate to: **Settings > API Keys & Webhooks**
   - Copy your **Test Public Key** (starts with `pk_test_`)
   - Copy your **Test Secret Key** (starts with `sk_test_`)

3. **Update `.env.local` file:**
   ```env
   NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_your_actual_key_here
   PAYSTACK_SECRET_KEY=sk_test_your_actual_secret_here
   ```

4. **Restart the development server:**
   ```bash
   # Stop the current server (Ctrl+C)
   npm run dev
   ```

### Option 2: Use Stripe

1. **Sign up for Stripe:**
   - Go to: https://dashboard.stripe.com/register
   - Complete registration

2. **Get Test API Keys:**
   - Login to: https://dashboard.stripe.com
   - Go to: **Developers > API keys**
   - Copy **Publishable key** (test mode)
   - Click "Reveal test key" and copy **Secret key**

3. **Update `.env.local` file:**
   ```env
   NEXT_PUBLIC_STRIPE_PUBLIC_KEY=pk_test_your_actual_key_here
   STRIPE_SECRET_KEY=sk_test_your_actual_secret_here
   ```

4. **Restart the development server:**
   ```bash
   # Stop the current server (Ctrl+C)
   npm run dev
   ```

## Quick Test Without Signup (Temporary)

If you just want to test the UI without actual payment processing, you can temporarily modify the payment provider utility:

Edit `/home/mutalab/projects/qist-platform/src/utils/payment-providers.ts`:

Change line 7-8 from:
```typescript
const PAYSTACK_PUBLIC_KEY = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || 'pk_test_xxxxxxxxxxxxx';
const STRIPE_PUBLIC_KEY = process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY || 'pk_test_xxxxxxxxxxxxx';
```

To (temporary demo mode):
```typescript
const PAYSTACK_PUBLIC_KEY = 'pk_test_demo_key_12345'; // Demo mode
const STRIPE_PUBLIC_KEY = 'pk_test_demo_key_12345'; // Demo mode
```

**Note:** This will show alerts instead of real payment processing.

## Test Cards (After API Keys Configured)

### Paystack Test Cards:
- **Success:** 4084084084084081
  - PIN: 0000
  - OTP: 123456
- **Declined:** 4084084084084083
- **Insufficient Funds:** 4084080000000408

### Stripe Test Cards:
- **Success:** 4242 4242 4242 4242
- **Declined:** 4000 0000 0000 0002
- **3D Secure:** 4000 0025 0000 3155

Expiry: Any future date (e.g., 12/25)
CVV: Any 3 digits (e.g., 123)

## After Setup Checklist

- [ ] Created `.env.local` file
- [ ] Added Paystack or Stripe API keys
- [ ] Restarted development server
- [ ] Tested with test card
- [ ] Payment modal opens without errors

## Still Having Issues?

1. Check `.env.local` file exists in project root
2. Verify no typos in API keys
3. Ensure keys start with `pk_test_` (not `pk_live_`)
4. Restart VS Code terminal if needed
5. Check browser console for additional errors
