import { NextResponse } from 'next/server';
import crypto from 'node:crypto';
import Stripe from 'stripe';
import { getSiteSettings } from '@/lib/db';
import { calculateServerQuote } from '@/lib/pricing';
import {
  validateEmail,
  validateUKPhone,
  validateUKPostcode,
} from '@/lib/uk-validation';
import type { ShippingMethod } from '@/lib/types';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const settings = getSiteSettings();
    if (!settings.payment.stripeEnabled) {
      return NextResponse.json(
        { error: 'Card payments are currently disabled by the administrator.' },
        { status: 400 }
      );
    }

    const name = String(body.customerName || '').trim();
    const email = String(body.customerEmail || '').trim().toLowerCase();
    const phone = String(body.customerPhone || '').trim();
    const addressLine1 = String(body.addressLine1 || '').trim();
    const city = String(body.city || '').trim();
    const postcodeCheck = validateUKPostcode(String(body.postcode || ''));

    if (name.length < 2) {
      return NextResponse.json({ error: 'Please enter your full name.' }, { status: 400 });
    }
    if (!validateEmail(email)) {
      return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
    }
    if (!validateUKPhone(phone)) {
      return NextResponse.json({ error: 'Please enter a valid UK phone number.' }, { status: 400 });
    }
    if (addressLine1.length < 4 || city.length < 2) {
      return NextResponse.json(
        { error: 'Please enter your complete UK delivery address.' },
        { status: 400 }
      );
    }
    if (!postcodeCheck.valid) {
      return NextResponse.json(
        { error: 'Please enter a valid UK postcode (e.g. SW1A 1AA).' },
        { status: 400 }
      );
    }

    const shippingMethod: ShippingMethod =
      body.shippingMethod === 'express' ? 'express' : 'standard';

    const quoteRes = calculateServerQuote(
      body.items || [],
      shippingMethod,
      body.discountCode ? String(body.discountCode) : null
    );
    if (!quoteRes.ok) {
      return NextResponse.json({ error: quoteRes.error }, { status: quoteRes.status });
    }

    const stripeSecret = process.env.STRIPE_SECRET_KEY;
    if (stripeSecret && stripeSecret.startsWith('sk_')) {
      const stripe = new Stripe(stripeSecret);
      const intent = await stripe.paymentIntents.create({
        amount: quoteRes.quote.totalPence,
        currency: 'gbp',
        automatic_payment_methods: { enabled: true },
        receipt_email: email,
        metadata: {
          brand: 'CHAI WALA',
          customer_name: name,
          postcode: postcodeCheck.formatted,
          shipping_method: shippingMethod,
        },
      });

      return NextResponse.json({
        mode: 'stripe_live_test',
        clientSecret: intent.client_secret,
        paymentIntentId: intent.id,
        quote: quoteRes.quote,
        formattedPostcode: postcodeCheck.formatted,
      });
    }

    // Fallback when STRIPE_SECRET_KEY is not configured in environment secrets yet
    const testIntentId = `cw_test_pi_${crypto.randomBytes(10).toString('hex')}`;
    return NextResponse.json({
      mode: 'stripe_sandbox_demo',
      clientSecret: null,
      paymentIntentId: testIntentId,
      quote: quoteRes.quote,
      formattedPostcode: postcodeCheck.formatted,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to initialise Stripe payment.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
