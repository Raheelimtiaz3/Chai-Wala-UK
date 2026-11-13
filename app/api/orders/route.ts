import { NextResponse } from 'next/server';
import crypto from 'node:crypto';
import Stripe from 'stripe';
import { getSessionUser } from '@/lib/auth';
import { getDb, getSiteSettings, hydrateOrder } from '@/lib/db';
import { buildOrderConfirmationEmail } from '@/lib/email';
import { calculateServerQuote } from '@/lib/pricing';
import {
  validateEmail,
  validateUKPhone,
  validateUKPostcode,
} from '@/lib/uk-validation';
import type { PaymentMethod, PaymentStatus, ShippingMethod } from '@/lib/types';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const orderNumber = (searchParams.get('orderNumber') || '').trim().toUpperCase();
  const verification = (searchParams.get('verify') || '').trim().toLowerCase();

  if (!orderNumber || !verification) {
    return NextResponse.json(
      { error: 'Please provide both your Order Reference and Email or UK Postcode.' },
      { status: 400 }
    );
  }

  const db = getDb();
  const row = db
    .prepare('SELECT * FROM orders WHERE UPPER(order_number) = ?')
    .get(orderNumber) as Record<string, unknown> | undefined;

  if (!row) {
    return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
  }

  const emailMatches = String(row.customer_email || '').toLowerCase() === verification;
  const postcodeNormalized = String(row.postcode || '').replace(/\s+/g, '').toLowerCase();
  const verifyNormalized = verification.replace(/\s+/g, '').toLowerCase();
  const postcodeMatches = postcodeNormalized === verifyNormalized;

  if (!emailMatches && !postcodeMatches) {
    return NextResponse.json(
      { error: 'The email or postcode provided does not match this order.' },
      { status: 403 }
    );
  }

  const order = hydrateOrder(db, row);
  const emailLog = db
    .prepare(
      'SELECT subject, status, created_at FROM email_logs WHERE order_id = ? ORDER BY id DESC LIMIT 1'
    )
    .get(order.id) as Record<string, unknown> | undefined;

  return NextResponse.json({
    order,
    confirmationEmail: emailLog || null,
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const session = await getSessionUser();
    const settings = getSiteSettings();

    const customerName = String(body.customerName || '').trim();
    const customerEmail = String(body.customerEmail || '').trim().toLowerCase();
    const customerPhone = String(body.customerPhone || '').trim();
    const addressLine1 = String(body.addressLine1 || '').trim();
    const addressLine2 = String(body.addressLine2 || '').trim();
    const city = String(body.city || '').trim();
    const county = String(body.county || '').trim();
    const postcodeCheck = validateUKPostcode(String(body.postcode || ''));
    const deliveryInstructions = String(body.deliveryInstructions || '').trim().slice(0, 500);
    const shippingMethod: ShippingMethod =
      body.shippingMethod === 'express' ? 'express' : 'standard';
    const paymentMethod: PaymentMethod =
      body.paymentMethod === 'cash_on_delivery' ? 'cash_on_delivery' : 'stripe_card';
    const discountCodeInput = body.discountCode ? String(body.discountCode) : null;

    if (customerName.length < 2) {
      return NextResponse.json({ error: 'Please enter your full name.' }, { status: 400 });
    }
    if (!validateEmail(customerEmail)) {
      return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
    }
    if (!validateUKPhone(customerPhone)) {
      return NextResponse.json({ error: 'Please enter a valid UK phone number.' }, { status: 400 });
    }
    if (addressLine1.length < 4 || city.length < 2) {
      return NextResponse.json(
        { error: 'Please provide your full UK delivery address and town/city.' },
        { status: 400 }
      );
    }
    if (!postcodeCheck.valid) {
      return NextResponse.json(
        { error: 'Please enter a valid UK postcode (e.g. SW1A 1AA).' },
        { status: 400 }
      );
    }

    if (paymentMethod === 'cash_on_delivery' && !settings.payment.codEnabled) {
      return NextResponse.json(
        { error: 'Cash on Delivery is not currently enabled.' },
        { status: 403 }
      );
    }
    if (paymentMethod === 'stripe_card' && !settings.payment.stripeEnabled) {
      return NextResponse.json(
        { error: 'Stripe card payments are currently disabled.' },
        { status: 403 }
      );
    }

    const quoteRes = calculateServerQuote(body.items || [], shippingMethod, discountCodeInput);
    if (!quoteRes.ok) {
      return NextResponse.json({ error: quoteRes.error }, { status: quoteRes.status });
    }
    const { quote } = quoteRes;

    let paymentStatus: PaymentStatus = 'pending';
    let stripeIntentId: string | null = null;
    let initialOrderStatus = 'pending';

    if (paymentMethod === 'cash_on_delivery') {
      paymentStatus = 'cod_pending';
      initialOrderStatus = 'confirmed';
    } else {
      const paymentIntentId = String(body.paymentIntentId || '').trim();
      const stripeSecret = process.env.STRIPE_SECRET_KEY;

      if (stripeSecret && stripeSecret.startsWith('sk_')) {
        if (!paymentIntentId) {
          return NextResponse.json(
            { error: 'Missing Stripe payment reference.' },
            { status: 400 }
          );
        }
        const stripe = new Stripe(stripeSecret);
        const intent = await stripe.paymentIntents.retrieve(paymentIntentId);
        if (intent.status !== 'succeeded') {
          return NextResponse.json(
            { error: `Payment has not completed (status: ${intent.status}).` },
            { status: 402 }
          );
        }
        if (intent.amount !== quote.totalPence || intent.currency !== 'gbp') {
          return NextResponse.json(
            { error: 'Payment amount mismatch detected on server.' },
            { status: 400 }
          );
        }
        stripeIntentId = intent.id;
        paymentStatus = 'paid';
        initialOrderStatus = 'confirmed';
      } else {
        if (!paymentIntentId.startsWith('cw_test_pi_') || !body.testPaymentAuthorized) {
          return NextResponse.json(
            { error: 'Please complete Stripe Test Mode authorisation before placing order.' },
            { status: 402 }
          );
        }
        stripeIntentId = paymentIntentId;
        paymentStatus = 'paid';
        initialOrderStatus = 'confirmed';
      }
    }

    const db = getDb();
    const now = new Date().toISOString();
    const orderNumber = `CW-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

    db.exec('BEGIN IMMEDIATE;');
    try {
      for (const item of quote.items) {
        const dec = db
          .prepare(
            `UPDATE product_variants SET stock = stock - ? WHERE id = ? AND stock >= ?`
          )
          .run(item.quantity, item.variantId, item.quantity);

        if (dec.changes === 0) {
          throw new Error(`Insufficient stock for ${item.productName} (${item.variantLabel}).`);
        }
      }

      const discountedSubtotalPence = Math.max(0, quote.subtotalPence - quote.discountPence);
      const pointsEarned = Math.max(1, Math.floor(discountedSubtotalPence / 10));

      // Resolve recipient account: authenticated session user or matching registered email
      let rewardUserId: number | null = session ? session.userId : null;
      if (!rewardUserId) {
        const matchedUser = db
          .prepare('SELECT id FROM users WHERE LOWER(email) = LOWER(?)')
          .get(customerEmail) as { id: number } | undefined;
        if (matchedUser) {
          rewardUserId = Number(matchedUser.id);
        }
      }

      const orderRes = db
        .prepare(
          `INSERT INTO orders (
            order_number, user_id, customer_name, customer_email, customer_phone,
            address_line1, address_line2, city, county, postcode, delivery_instructions,
            shipping_method, subtotal_pence, discount_code, discount_pence, shipping_pence,
            total_pence, payment_method, payment_status, stripe_payment_intent_id,
            order_status, points_earned, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .run(
          orderNumber,
          rewardUserId,
          customerName,
          customerEmail,
          customerPhone,
          addressLine1,
          addressLine2,
          city,
          county,
          postcodeCheck.formatted,
          deliveryInstructions,
          shippingMethod,
          quote.subtotalPence,
          quote.discountCode,
          quote.discountPence,
          quote.shippingPence,
          quote.totalPence,
          paymentMethod,
          paymentStatus,
          stripeIntentId,
          initialOrderStatus,
          pointsEarned,
          now,
          now
        );

      const orderId = Number(orderRes.lastInsertRowid);

      const insertItem = db.prepare(
        `INSERT INTO order_items (
          order_id, product_id, variant_id, product_name, variant_label,
          unit_price_pence, quantity, line_total_pence
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      );
      for (const item of quote.items) {
        insertItem.run(
          orderId,
          item.productId,
          item.variantId,
          item.productName,
          item.variantLabel,
          item.unitPricePence,
          item.quantity,
          item.lineTotalPence
        );
      }

      if (quote.discountCode) {
        db.prepare(
          `UPDATE discount_codes SET usage_count = usage_count + 1 WHERE code = ?`
        ).run(quote.discountCode);
      }

      if (rewardUserId) {
        db.prepare(
          `UPDATE users SET points_balance = points_balance + ? WHERE id = ?`
        ).run(pointsEarned, rewardUserId);

        db.prepare(
          `INSERT INTO reward_ledger (user_id, order_id, order_number, points_delta, description, created_at)
           VALUES (?, ?, ?, ?, ?, ?)`
        ).run(
          rewardUserId,
          orderId,
          orderNumber,
          pointsEarned,
          `Earned on order ${orderNumber}`,
          now
        );
      }

      const orderRow = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId) as Record<
        string,
        unknown
      >;
      const createdOrder = hydrateOrder(db, orderRow);

      const emailContent = buildOrderConfirmationEmail(createdOrder);
      db.prepare(
        `INSERT INTO email_logs (order_id, recipient_email, subject, body_preview, status, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`
      ).run(
        orderId,
        customerEmail,
        emailContent.subject,
        emailContent.text,
        process.env.SMTP_HOST ? 'queued' : 'recorded_confirmation',
        now
      );

      db.exec('COMMIT;');

      return NextResponse.json(
        {
          order: createdOrder,
          confirmationEmail: {
            subject: emailContent.subject,
            recipient: customerEmail,
          },
        },
        { status: 201 }
      );
    } catch (txErr) {
      db.exec('ROLLBACK;');
      const msg = txErr instanceof Error ? txErr.message : 'Order creation failed.';
      return NextResponse.json({ error: msg }, { status: 409 });
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unable to process order.';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
