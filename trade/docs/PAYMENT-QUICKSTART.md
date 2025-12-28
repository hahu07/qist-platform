# Payment Integration Quick Reference

## 🚀 Quick Start

1. **Install dependencies** (already done):
   ```bash
   npm install @paystack/inline-js @stripe/stripe-js
   ```

2. **Add environment variables**:
   ```bash
   cp .env.example .env.local
   # Then edit .env.local with your API keys
   ```

3. **Get API Keys**:
   - Paystack: https://dashboard.paystack.com/settings/developer
   - Stripe: https://dashboard.stripe.com/apikeys

## 🔑 Environment Variables

```env
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_xxxxx
PAYSTACK_SECRET_KEY=sk_test_xxxxx
NEXT_PUBLIC_STRIPE_PUBLIC_KEY=pk_test_xxxxx
STRIPE_SECRET_KEY=sk_test_xxxxx
```

## 🧪 Test Cards

### Paystack
- ✅ Success: `4084084084084081` (PIN: 0000, OTP: 123456)
- ❌ Decline: `4084084084084083`
- 💰 Insufficient: `4084080000000408`

### Stripe
- ✅ Success: `4242 4242 4242 4242`
- ❌ Decline: `4000 0000 0000 0002`
- 🔐 3D Secure: `4000 0025 0000 3155`

Any future expiry, any CVC, any postal code for Stripe.

## 📁 Key Files

### Frontend
- `src/app/member/wallet/page.tsx` - Payment UI
- `src/utils/payment-providers.ts` - Payment utilities
- `src/app/layout.tsx` - Paystack script loader

### Backend API
- `src/app/api/create-payment-intent/route.ts` - Stripe setup
- `src/app/api/verify-paystack-payment/route.ts` - Paystack verify
- `src/app/api/verify-stripe-payment/route.ts` - Stripe verify

## 🔄 Payment Flow

```
User clicks "Pay" 
  → Provider opens payment modal
    → User completes payment
      → Success callback fires
        → Backend verifies payment
          → Wallet updated
            → User notified
```

## ⚡ Common Commands

```bash
# Development
npm run dev

# Check environment variables
cat .env.local

# Test Paystack webhook locally
curl -X POST http://localhost:3000/api/verify-paystack-payment \
  -H "Content-Type: application/json" \
  -d '{"reference":"test_ref_123"}'
```

## 🐛 Quick Troubleshooting

| Issue | Solution |
|-------|----------|
| Paystack not loading | Check `layout.tsx` has Paystack script |
| Invalid API key | Verify `.env.local` has correct keys |
| Payment succeeds but wallet not updated | Check browser console for errors |
| Stripe payment fails | Uncomment Stripe SDK code in API routes |

## 📚 Documentation

- Full Setup: `/docs/PAYMENT-INTEGRATION.md`
- Paystack Docs: https://paystack.com/docs
- Stripe Docs: https://stripe.com/docs

## ✅ Production Checklist

- [ ] Replace test keys with live keys
- [ ] Configure webhook URLs
- [ ] Implement webhook handlers
- [ ] Test with real cards
- [ ] Set up email notifications
- [ ] Configure logging/monitoring
- [ ] Review security settings

## 🎯 Current Status

✅ Paystack integration complete
✅ Stripe integration complete  
✅ Payment verification working
⏳ Webhook handlers (recommended)
⏳ Email receipts (optional)
