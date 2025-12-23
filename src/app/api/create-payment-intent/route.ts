import { NextRequest, NextResponse } from 'next/server';

/**
 * API Route: Create Stripe Payment Intent
 * This endpoint creates a Payment Intent on Stripe's servers
 */

// You'll need to install stripe package: npm install stripe
// import Stripe from 'stripe';

export async function POST(request: NextRequest) {
  try {
    const { amount, currency, userId, metadata } = await request.json();

    // Validate input
    if (!amount || amount < 1000) {
      return NextResponse.json(
        { error: 'Invalid amount. Minimum is ₦1,000' },
        { status: 400 }
      );
    }

    // Initialize Stripe (you need to add STRIPE_SECRET_KEY to your .env.local)
    // const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    //   apiVersion: '2023-10-16',
    // });

    // Create Payment Intent
    // const paymentIntent = await stripe.paymentIntents.create({
    //   amount: Math.round(amount * 100), // Convert to smallest currency unit (kobo)
    //   currency: currency || 'ngn',
    //   metadata: {
    //     userId,
    //     ...metadata,
    //   },
    //   automatic_payment_methods: {
    //     enabled: true,
    //   },
    // });

    // For now, return a mock response
    // TODO: Uncomment above code and install Stripe SDK
    return NextResponse.json({
      clientSecret: 'pi_mock_secret_' + Math.random().toString(36),
      paymentIntentId: 'pi_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9),
      message: 'Payment intent created (MOCK - Install Stripe SDK for production)'
    });

    // Production response:
    // return NextResponse.json({
    //   clientSecret: paymentIntent.client_secret,
    //   paymentIntentId: paymentIntent.id,
    // });

  } catch (error) {
    console.error('Stripe Payment Intent Error:', error);
    return NextResponse.json(
      { error: 'Failed to create payment intent' },
      { status: 500 }
    );
  }
}
