import { NextRequest, NextResponse } from 'next/server';

/**
 * API Route: Verify Paystack Payment
 * This endpoint verifies a Paystack payment using the reference
 */

export async function POST(request: NextRequest) {
  try {
    const { reference } = await request.json();

    if (!reference) {
      return NextResponse.json(
        { error: 'Payment reference is required' },
        { status: 400 }
      );
    }

    // Verify payment with Paystack API
    // You need PAYSTACK_SECRET_KEY in your .env.local
    const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY;

    if (!paystackSecretKey) {
      console.error('PAYSTACK_SECRET_KEY not configured');
      return NextResponse.json(
        { error: 'Payment verification not configured' },
        { status: 500 }
      );
    }

    const response = await fetch(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${paystackSecretKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { 
          success: false, 
          reference,
          error: data.message || 'Verification failed' 
        },
        { status: 400 }
      );
    }

    // Check if payment was successful
    if (data.data.status === 'success') {
      return NextResponse.json({
        success: true,
        reference: data.data.reference,
        amount: data.data.amount / 100, // Convert from kobo to naira
        paidAt: data.data.paid_at,
        metadata: data.data.metadata,
        message: 'Payment verified successfully'
      });
    } else {
      return NextResponse.json({
        success: false,
        reference,
        message: `Payment status: ${data.data.status}`
      });
    }

  } catch (error) {
    console.error('Paystack Verification Error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Payment verification failed' 
      },
      { status: 500 }
    );
  }
}
