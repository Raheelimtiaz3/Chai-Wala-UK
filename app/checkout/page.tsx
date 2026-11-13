'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Award, CheckCircle2, CreditCard, Lock, ShieldCheck, Truck } from 'lucide-react';
import { useCart } from '@/components/CartProvider';
import { SafeImage } from '@/components/SafeImage';
import {
  formatGBP,
  validateEmail,
  validateUKPhone,
  validateUKPostcode,
} from '@/lib/uk-validation';
import type { PaymentMethod, ShippingMethod, SiteSettings } from '@/lib/types';

declare global {
  interface Window {
    Stripe?: (key: string) => {
      elements: (opts: { clientSecret: string; appearance?: unknown }) => {
        create: (type: string) => { mount: (el: HTMLElement) => void };
      };
      confirmPayment: (opts: {
        elements: unknown;
        redirect: 'if_required';
      }) => Promise<{ error?: { message?: string }; paymentIntent?: { id: string; status: string } }>;
    };
  }
}

interface QuoteData {
  subtotalPence: number;
  discountCode: string | null;
  discountPence: number;
  shippingPence: number;
  totalPence: number;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { items, clearCart, hydrated } = useCart();

  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [stripeConfigured, setStripeConfigured] = useState(false);
  const [stripePublishableKey, setStripePublishableKey] = useState('');

  // Form state
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [city, setCity] = useState('');
  const [county, setCounty] = useState('');
  const [postcode, setPostcode] = useState('');
  const [deliveryInstructions, setDeliveryInstructions] = useState('');
  const [shippingMethod, setShippingMethod] = useState<ShippingMethod>('standard');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('stripe_card');

  // Discount & Quote
  const [discountInput, setDiscountInput] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState<string | null>(null);
  const [discountFeedback, setDiscountFeedback] = useState<string | null>(null);
  const [quote, setQuote] = useState<QuoteData | null>(null);

  // Stripe Element state
  const [stripeClientSecret, setStripeClientSecret] = useState<string | null>(null);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
  const [stripeMode, setStripeMode] = useState<'stripe_live_test' | 'stripe_sandbox_demo' | null>(null);
  const stripeContainerRef = useRef<HTMLDivElement | null>(null);
  const stripeInstanceRef = useRef<ReturnType<NonNullable<Window['Stripe']>> | null>(null);
  const stripeElementsRef = useRef<unknown>(null);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Load settings & logged-in user defaults
  useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json())
      .then((d) => {
        if (d.settings) {
          setSettings(d.settings);
          if (!d.settings.payment.stripeEnabled && d.settings.payment.codEnabled) {
            setPaymentMethod('cash_on_delivery');
          }
        }
        setStripeConfigured(Boolean(d.stripeConfigured));
        setStripePublishableKey(d.stripePublishableKey || '');
      })
      .catch(() => {});

    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((d) => {
        if (d.user) {
          setCustomerName((v) => v || d.user.name || '');
          setCustomerEmail((v) => v || d.user.email || '');
          setCustomerPhone((v) => v || d.user.phone || '');
          setAddressLine1((v) => v || d.user.default_address || '');
          setPostcode((v) => v || d.user.default_postcode || '');
        }
      })
      .catch(() => {});
  }, []);

  const refreshQuote = useCallback(
    async (codeToTry: string | null) => {
      if (items.length === 0) return;
      try {
        const res = await fetch('/api/quote', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            items: items.map((i) => ({ variantId: i.variantId, quantity: i.quantity })),
            shippingMethod,
            discountCode: codeToTry,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          if (codeToTry) {
            setDiscountFeedback(data.error || 'Invalid discount code.');
            setAppliedDiscount(null);
            // Retry without discount code
            const fallback = await fetch('/api/quote', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                items: items.map((i) => ({ variantId: i.variantId, quantity: i.quantity })),
                shippingMethod,
                discountCode: null,
              }),
            });
            const fbData = await fallback.json();
            if (fallback.ok) setQuote(fbData.quote);
          }
        } else {
          setQuote(data.quote);
          if (codeToTry) {
            setAppliedDiscount(data.quote.discountCode);
            setDiscountFeedback(
              `Code ${data.quote.discountCode} applied (-${formatGBP(data.quote.discountPence)}).`
            );
          }
        }
      } catch {
        // Ignore transient quote failure
      }
    },
    [items, shippingMethod]
  );

  useEffect(() => {
    if (hydrated && items.length > 0) {
      queueMicrotask(() => {
        void refreshQuote(appliedDiscount);
      });
    }
  }, [hydrated, items, shippingMethod, appliedDiscount, refreshQuote]);

  // Mount Stripe Payment Element if live test key + clientSecret are ready
  useEffect(() => {
    if (
      stripeMode !== 'stripe_live_test' ||
      !stripeClientSecret ||
      !stripePublishableKey ||
      !stripeContainerRef.current
    ) {
      return;
    }

    const mountElement = () => {
      if (!window.Stripe || !stripeContainerRef.current) return;
      const stripe = window.Stripe(stripePublishableKey);
      stripeInstanceRef.current = stripe;
      const elements = stripe.elements({
        clientSecret: stripeClientSecret,
        appearance: {
          theme: 'stripe',
          variables: {
            colorPrimary: '#063B20',
            colorBackground: '#FFFDF8',
            colorText: '#382015',
          },
        },
      });
      stripeElementsRef.current = elements;
      const paymentEl = elements.create('payment');
      stripeContainerRef.current.innerHTML = '';
      paymentEl.mount(stripeContainerRef.current);
    };

    if (window.Stripe) {
      mountElement();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://js.stripe.com/v3/';
    script.async = true;
    script.onload = mountElement;
    document.head.appendChild(script);
  }, [stripeMode, stripeClientSecret, stripePublishableKey]);

  const validateAddressFields = (): string | null => {
    if (customerName.trim().length < 2) return 'Please enter your full name.';
    if (!validateEmail(customerEmail)) return 'Please enter a valid email address.';
    if (!validateUKPhone(customerPhone))
      return 'Please enter a valid UK telephone or mobile number (e.g. 07700 900123).';
    if (addressLine1.trim().length < 4) return 'Please enter your street address.';
    if (city.trim().length < 2) return 'Please enter your town or city.';
    const pc = validateUKPostcode(postcode);
    if (!pc.valid) return 'Please enter a valid UK postcode (e.g. SW1A 1AA).';
    return null;
  };

  const handlePrepareStripe = async () => {
    setErrorMsg(null);
    const validationError = validateAddressFields();
    if (validationError) {
      setErrorMsg(validationError);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/checkout/payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName,
          customerEmail,
          customerPhone,
          addressLine1,
          city,
          postcode,
          shippingMethod,
          discountCode: appliedDiscount,
          items: items.map((i) => ({ variantId: i.variantId, quantity: i.quantity })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'Could not start Stripe payment.');
        return;
      }
      setPostcode(data.formattedPostcode || postcode.toUpperCase());
      setPaymentIntentId(data.paymentIntentId);
      setStripeClientSecret(data.clientSecret);
      setStripeMode(data.mode);
    } catch {
      setErrorMsg('Network error while preparing payment.');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const validationError = validateAddressFields();
    if (validationError) {
      setErrorMsg(validationError);
      return;
    }

    if (paymentMethod === 'stripe_card' && !paymentIntentId) {
      await handlePrepareStripe();
      return;
    }

    setSubmitting(true);
    try {
      let confirmedIntentId = paymentIntentId;

      if (
        paymentMethod === 'stripe_card' &&
        stripeMode === 'stripe_live_test' &&
        stripeInstanceRef.current &&
        stripeElementsRef.current
      ) {
        const result = await stripeInstanceRef.current.confirmPayment({
          elements: stripeElementsRef.current,
          redirect: 'if_required',
        });
        if (result.error) {
          setErrorMsg(result.error.message || 'Card payment failed.');
          setSubmitting(false);
          return;
        }
        if (result.paymentIntent?.id) {
          confirmedIntentId = result.paymentIntent.id;
        }
      }

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName,
          customerEmail,
          customerPhone,
          addressLine1,
          addressLine2,
          city,
          county,
          postcode,
          deliveryInstructions,
          shippingMethod,
          paymentMethod,
          discountCode: appliedDiscount,
          paymentIntentId: confirmedIntentId,
          testPaymentAuthorized:
            paymentMethod === 'stripe_card' && stripeMode === 'stripe_sandbox_demo',
          items: items.map((i) => ({ variantId: i.variantId, quantity: i.quantity })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'Unable to place order.');
        setSubmitting(false);
        return;
      }

      clearCart();
      router.push(
        `/orders/${encodeURIComponent(data.order.order_number)}?email=${encodeURIComponent(
          data.order.customer_email
        )}`
      );
    } catch {
      setErrorMsg('Network error while submitting your order.');
      setSubmitting(false);
    }
  };

  if (!hydrated) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <p className="text-sm text-[#6B4D3E]">Preparing checkout...</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center space-y-4">
        <h1 className="font-serif text-3xl font-bold text-[#382015]">
          Your Basket is Empty
        </h1>
        <p className="text-sm text-[#6B4D3E]">
          Add a tea blend before proceeding to UK checkout.
        </p>
        <Link
          href="/shop"
          className="inline-block px-6 py-3 rounded-lg bg-[#063B20] text-[#FFF8E9] text-sm font-medium"
        >
          Return to Shop
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-16">
      <div className="mb-8 pb-5 border-b border-[#382015]/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#382015]">
            UK Checkout
          </h1>
          <p className="text-sm text-[#6B4D3E] mt-1">
            Secure Pounds Sterling (GBP £) checkout with UK postcode validation.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-[#063B20] font-medium">
          <Lock className="w-4 h-4" />
          <span>Encrypted Server-Validated Checkout</span>
        </div>
      </div>

      <form
        onSubmit={handlePlaceOrder}
        className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start"
      >
        {/* Left: Delivery & Payment Details */}
        <div className="lg:col-span-7 space-y-8">
          {/* Contact & UK Delivery Address */}
          <section className="bg-[#FFFDF8] border border-[#382015]/10 rounded-xl p-6 sm:p-8 space-y-5">
            <h2 className="font-serif text-xl font-semibold text-[#382015]">
              1. Customer & UK Delivery Details
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-[#382015] mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g. Amina Patel"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-[#382015]/20 bg-[#FFF8E9]/40 text-sm focus:outline-none focus:border-[#063B20]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#382015] mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="you@example.co.uk"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-[#382015]/20 bg-[#FFF8E9]/40 text-sm focus:outline-none focus:border-[#063B20]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#382015] mb-1">
                  UK Phone Number *
                </label>
                <input
                  type="tel"
                  required
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="07700 900123"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-[#382015]/20 bg-[#FFF8E9]/40 text-sm focus:outline-none focus:border-[#063B20]"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-[#382015] mb-1">
                  Address Line 1 *
                </label>
                <input
                  type="text"
                  required
                  value={addressLine1}
                  onChange={(e) => setAddressLine1(e.target.value)}
                  placeholder="House number and street name"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-[#382015]/20 bg-[#FFF8E9]/40 text-sm focus:outline-none focus:border-[#063B20]"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-[#382015] mb-1">
                  Address Line 2 (Optional)
                </label>
                <input
                  type="text"
                  value={addressLine2}
                  onChange={(e) => setAddressLine2(e.target.value)}
                  placeholder="Flat, apartment, or building"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-[#382015]/20 bg-[#FFF8E9]/40 text-sm focus:outline-none focus:border-[#063B20]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#382015] mb-1">
                  Town / City *
                </label>
                <input
                  type="text"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. London, Manchester, Birmingham"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-[#382015]/20 bg-[#FFF8E9]/40 text-sm focus:outline-none focus:border-[#063B20]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#382015] mb-1">
                  County (Optional)
                </label>
                <input
                  type="text"
                  value={county}
                  onChange={(e) => setCounty(e.target.value)}
                  placeholder="e.g. Greater London"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-[#382015]/20 bg-[#FFF8E9]/40 text-sm focus:outline-none focus:border-[#063B20]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#382015] mb-1">
                  UK Postcode *
                </label>
                <input
                  type="text"
                  required
                  value={postcode}
                  onChange={(e) => setPostcode(e.target.value.toUpperCase())}
                  placeholder="SW1A 1AA"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-[#382015]/20 bg-[#FFF8E9]/40 font-mono text-sm uppercase focus:outline-none focus:border-[#063B20]"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-[#382015] mb-1">
                  Delivery Instructions (Optional)
                </label>
                <textarea
                  rows={2}
                  value={deliveryInstructions}
                  onChange={(e) => setDeliveryInstructions(e.target.value)}
                  placeholder="Safe place or entry instructions for the UK courier"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-[#382015]/20 bg-[#FFF8E9]/40 text-sm focus:outline-none focus:border-[#063B20]"
                />
              </div>
            </div>
          </section>

          {/* UK Delivery Method */}
          <section className="bg-[#FFFDF8] border border-[#382015]/10 rounded-xl p-6 sm:p-8 space-y-4">
            <div className="flex items-center gap-2">
              <Truck className="w-5 h-5 text-[#063B20]" />
              <h2 className="font-serif text-xl font-semibold text-[#382015]">
                2. UK Delivery Method
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setShippingMethod('standard');
                  setPaymentIntentId(null);
                  setStripeClientSecret(null);
                }}
                className={`p-4 rounded-lg border text-left transition-colors cursor-pointer ${
                  shippingMethod === 'standard'
                    ? 'border-[#063B20] bg-[#063B20]/5'
                    : 'border-[#382015]/20 hover:border-[#063B20]'
                }`}
              >
                <div className="flex justify-between items-center font-semibold text-sm text-[#382015]">
                  <span>UK Standard Delivery</span>
                  <span className="font-mono tabular-nums text-[#063B20]">
                    {quote && quote.shippingPence === 0 && shippingMethod === 'standard'
                      ? 'FREE'
                      : formatGBP(settings?.shipping.standardRatePence ?? 395)}
                  </span>
                </div>
                <p className="text-xs text-[#6B4D3E] mt-1">
                  Free over {formatGBP(settings?.shipping.freeThresholdPence ?? 4000)}
                </p>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShippingMethod('express');
                  setPaymentIntentId(null);
                  setStripeClientSecret(null);
                }}
                className={`p-4 rounded-lg border text-left transition-colors cursor-pointer ${
                  shippingMethod === 'express'
                    ? 'border-[#063B20] bg-[#063B20]/5'
                    : 'border-[#382015]/20 hover:border-[#063B20]'
                }`}
              >
                <div className="flex justify-between items-center font-semibold text-sm text-[#382015]">
                  <span>UK Express Delivery</span>
                  <span className="font-mono tabular-nums text-[#063B20]">
                    {formatGBP(settings?.shipping.expressRatePence ?? 795)}
                  </span>
                </div>
                <p className="text-xs text-[#6B4D3E] mt-1">
                  Priority courier dispatch handling
                </p>
              </button>
            </div>

            {settings?.shipping.deliveryNote && (
              <p className="text-xs text-[#6B4D3E] bg-[#F5EBD6] p-3 rounded-lg">
                {settings.shipping.deliveryNote}
              </p>
            )}
          </section>

          {/* Payment Method */}
          <section className="bg-[#FFFDF8] border border-[#382015]/10 rounded-xl p-6 sm:p-8 space-y-5">
            <div className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-[#063B20]" />
              <h2 className="font-serif text-xl font-semibold text-[#382015]">
                3. Payment Method
              </h2>
            </div>

            <div className="space-y-3">
              {settings?.payment.stripeEnabled !== false && (
                <div
                  className={`rounded-lg border p-4 space-y-4 ${
                    paymentMethod === 'stripe_card'
                      ? 'border-[#063B20] bg-[#063B20]/[0.03]'
                      : 'border-[#382015]/20'
                  }`}
                >
                  <label className="flex items-center justify-between gap-3 cursor-pointer">
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="paymentMethod"
                        checked={paymentMethod === 'stripe_card'}
                        onChange={() => setPaymentMethod('stripe_card')}
                        className="accent-[#063B20]"
                      />
                      <div>
                        <span className="text-sm font-semibold text-[#382015]">
                          Card, Apple Pay or Google Pay (Stripe Test Mode)
                        </span>
                        <p className="text-xs text-[#6B4D3E]">
                          Processed securely via Stripe. CHAI WALA never stores card
                          details.
                        </p>
                      </div>
                    </div>
                    <ShieldCheck className="w-5 h-5 text-[#063B20] shrink-0" />
                  </label>

                  {paymentMethod === 'stripe_card' && (
                    <div className="pt-2 border-t border-[#382015]/10 space-y-3">
                      {!paymentIntentId ? (
                        <button
                          type="button"
                          onClick={handlePrepareStripe}
                          disabled={submitting}
                          className="px-4 py-2.5 rounded-lg bg-[#063B20] text-[#FFF8E9] text-xs font-semibold hover:bg-[#042916] cursor-pointer disabled:opacity-50"
                        >
                          {submitting
                            ? 'Initialising Stripe...'
                            : stripeConfigured
                              ? 'Continue to Card / Apple Pay / Google Pay'
                              : 'Initialise Stripe Test Payment Session'}
                        </button>
                      ) : stripeMode === 'stripe_live_test' ? (
                        <div className="space-y-2">
                          <div
                            ref={stripeContainerRef}
                            className="p-3 bg-white rounded-lg border border-[#382015]/15"
                          />
                          <p className="text-xs text-[#063B20]">
                            Stripe Payment Element ready ({paymentIntentId}).
                          </p>
                        </div>
                      ) : (
                        <div className="p-3.5 rounded-lg bg-[#F5EBD6] border border-[#063B20]/25 text-xs space-y-1">
                          <div className="flex items-center gap-1.5 font-semibold text-[#063B20]">
                            <CheckCircle2 className="w-4 h-4" />
                            <span>
                              Stripe Test Mode Intent Ready ({paymentIntentId})
                            </span>
                          </div>
                          <p className="text-[#6B4D3E]">
                            Test keys are not set in environment secrets yet, so this
                            order uses server-verified Stripe Test Simulation without
                            collecting card numbers.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {settings?.payment.codEnabled && (
                <label
                  className={`flex items-center gap-3 rounded-lg border p-4 cursor-pointer ${
                    paymentMethod === 'cash_on_delivery'
                      ? 'border-[#063B20] bg-[#063B20]/[0.03]'
                      : 'border-[#382015]/20'
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    checked={paymentMethod === 'cash_on_delivery'}
                    onChange={() => setPaymentMethod('cash_on_delivery')}
                    className="accent-[#063B20]"
                  />
                  <div>
                    <span className="text-sm font-semibold text-[#382015]">
                      Cash on Delivery
                    </span>
                    <p className="text-xs text-[#6B4D3E]">
                      Pay in cash upon UK parcel delivery (enabled by administrator).
                    </p>
                  </div>
                </label>
              )}
            </div>
          </section>

          {errorMsg && (
            <div
              role="alert"
              className="p-4 rounded-lg bg-[#C62828]/10 border border-[#C62828]/30 text-sm text-[#C62828] font-medium"
            >
              {errorMsg}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-4 px-6 rounded-lg bg-[#063B20] text-[#FFF8E9] font-semibold text-base hover:bg-[#042916] transition-colors cursor-pointer disabled:opacity-50"
          >
            {submitting
              ? 'Processing Order...'
              : paymentMethod === 'stripe_card' && !paymentIntentId
                ? 'Validate & Continue to Payment'
                : `Complete Order (${formatGBP(quote?.totalPence || 0)})`}
          </button>
        </div>

        {/* Right: Order Summary */}
        <aside className="lg:col-span-5 lg:sticky lg:top-24 bg-[#FFFDF8] border border-[#382015]/10 rounded-xl p-6 sm:p-8 space-y-6">
          <h2 className="font-serif text-xl font-semibold text-[#382015]">
            Order Summary
          </h2>

          <div className="divide-y divide-[#382015]/10 max-h-80 overflow-y-auto pr-1">
            {items.map((item) => (
              <div key={item.variantId} className="py-3.5 flex items-center gap-3.5">
                <SafeImage
                  src={item.image}
                  alt={item.name}
                  className="w-16 h-16 rounded-lg object-cover bg-[#F5EBD6] shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#382015] truncate">
                    {item.name}
                  </p>
                  <p className="text-xs text-[#6B4D3E]">
                    {item.variantLabel} × {item.quantity}
                  </p>
                </div>
                <span className="font-mono text-sm font-semibold tabular-nums text-[#063B20]">
                  {formatGBP(item.pricePence * item.quantity)}
                </span>
              </div>
            ))}
          </div>

          {/* Discount Code */}
          <div className="pt-2 border-t border-[#382015]/10 space-y-2">
            <label className="block text-xs font-medium text-[#382015]">
              Discount Code
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={discountInput}
                onChange={(e) => setDiscountInput(e.target.value.toUpperCase())}
                placeholder="Enter code"
                className="flex-1 px-3 py-2 rounded-lg border border-[#382015]/20 bg-[#FFF8E9]/40 font-mono text-xs uppercase focus:outline-none focus:border-[#063B20]"
              />
              <button
                type="button"
                onClick={() => refreshQuote(discountInput)}
                className="px-4 py-2 rounded-lg border border-[#063B20] text-[#063B20] text-xs font-semibold hover:bg-[#063B20]/5 cursor-pointer"
              >
                Apply
              </button>
            </div>
            {discountFeedback && (
              <p className="text-xs text-[#063B20]">{discountFeedback}</p>
            )}
          </div>

          <div className="space-y-2.5 pt-4 border-t border-[#382015]/10 text-sm">
            <div className="flex justify-between">
              <span className="text-[#6B4D3E]">Subtotal</span>
              <span className="font-mono tabular-nums font-medium">
                {formatGBP(quote?.subtotalPence ?? 0)}
              </span>
            </div>

            {quote && quote.discountPence > 0 && (
              <div className="flex justify-between text-[#063B20]">
                <span>Discount ({quote.discountCode})</span>
                <span className="font-mono tabular-nums font-medium">
                  -{formatGBP(quote.discountPence)}
                </span>
              </div>
            )}

            <div className="flex justify-between">
              <span className="text-[#6B4D3E]">
                UK Delivery ({shippingMethod === 'express' ? 'Express' : 'Standard'})
              </span>
              <span className="font-mono tabular-nums font-medium">
                {quote?.shippingPence === 0
                  ? 'FREE'
                  : formatGBP(quote?.shippingPence ?? 0)}
              </span>
            </div>

            <div className="flex justify-between pt-3 border-t border-[#382015]/10 text-lg font-bold text-[#063B20]">
              <span>Total (GBP)</span>
              <span className="font-mono tabular-nums">
                {formatGBP(quote?.totalPence ?? 0)}
              </span>
            </div>

            {quote && quote.subtotalPence > 0 && (
              <div className="mt-3 p-3.5 rounded-lg bg-[#F5EBD6]/70 border border-[#D9A52B]/30 space-y-1">
                <div className="flex items-center justify-between text-xs font-semibold text-[#063B20]">
                  <span className="inline-flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-[#D9A52B]" />
                    <span>Chai Rewards</span>
                  </span>
                  <span className="font-mono tabular-nums">
                    +
                    {Math.max(
                      1,
                      Math.floor(
                        Math.max(0, quote.subtotalPence - quote.discountPence) / 10
                      )
                    ).toLocaleString('en-GB')}{' '}
                    pts
                  </span>
                </div>
                <p className="text-[11px] text-[#6B4D3E]">
                  Earned automatically at 10 points per £1 on tea blends. View your
                  balance on your account page.
                </p>
              </div>
            )}
          </div>
        </aside>
      </form>
    </div>
  );
}
