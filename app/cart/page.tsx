'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import { useCart } from '@/components/CartProvider';
import { SafeImage } from '@/components/SafeImage';
import { formatGBP } from '@/lib/uk-validation';
import type { SiteSettings } from '@/lib/types';

export default function CartPage() {
  const { items, subtotalPence, updateQuantity, removeItem, hydrated } = useCart();
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [shippingMethod, setShippingMethod] = useState<'standard' | 'express'>('standard');

  useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json())
      .then((d) => setSettings(d.settings || null))
      .catch(() => {});
  }, []);

  const standardRate = settings?.shipping.standardRatePence ?? 395;
  const expressRate = settings?.shipping.expressRatePence ?? 795;
  const freeThreshold = settings?.shipping.freeThresholdPence ?? 4000;

  const shippingPence =
    items.length === 0
      ? 0
      : shippingMethod === 'express'
        ? expressRate
        : subtotalPence >= freeThreshold
          ? 0
          : standardRate;

  const totalPence = subtotalPence + shippingPence;

  if (!hydrated) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <p className="text-sm text-[#6B4D3E]">Loading your basket...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16 space-y-10">
      <div className="border-b border-[#382015]/10 pb-6">
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#382015]">
          Shopping Basket
        </h1>
        <p className="text-sm text-[#6B4D3E] mt-1">
          Review your CHAI WALA selections before proceeding to UK checkout.
        </p>
      </div>

      {items.length === 0 ? (
        <div className="bg-[#FFFDF8] border border-[#382015]/10 rounded-xl p-12 text-center space-y-4">
          <ShoppingBag className="w-12 h-12 mx-auto text-[#6B4D3E]/50" />
          <h2 className="font-serif text-2xl font-semibold text-[#382015]">
            Your basket is empty
          </h2>
          <p className="text-sm text-[#6B4D3E] max-w-md mx-auto">
            Discover our signature Chai Wala Premium Tea Blend in 250g, 500g, and 1kg
            packaging.
          </p>
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-[#063B20] text-[#FFF8E9] text-sm font-medium hover:bg-[#042916] transition-colors"
          >
            <span>Browse Tea Blends</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-8 bg-[#FFFDF8] border border-[#382015]/10 rounded-xl divide-y divide-[#382015]/10">
            {items.map((item) => (
              <div
                key={item.variantId}
                className="p-5 sm:p-6 flex flex-col sm:flex-row gap-5 items-start sm:items-center"
              >
                <SafeImage
                  src={item.image}
                  alt={item.name}
                  className="w-24 h-24 rounded-lg object-cover bg-[#F5EBD6] shrink-0"
                />
                <div className="flex-1 min-w-0 space-y-1">
                  <Link
                    href={`/shop/${item.slug}`}
                    className="font-serif text-lg font-semibold text-[#382015] hover:text-[#063B20]"
                  >
                    {item.name}
                  </Link>
                  <p className="text-xs text-[#6B4D3E]">
                    Pack Size: {item.variantLabel} · Unit price:{' '}
                    <span className="font-mono tabular-nums">
                      {formatGBP(item.pricePence)}
                    </span>
                  </p>
                </div>

                <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                  <div className="flex items-center border border-[#382015]/20 rounded-lg">
                    <button
                      type="button"
                      aria-label="Decrease quantity"
                      onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                      className="p-2.5 text-[#382015] cursor-pointer"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-8 text-center font-mono text-sm tabular-nums">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      aria-label="Increase quantity"
                      onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                      className="p-2.5 text-[#382015] cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <span className="font-mono text-base font-semibold tabular-nums text-[#063B20] w-20 text-right">
                    {formatGBP(item.pricePence * item.quantity)}
                  </span>

                  <button
                    type="button"
                    aria-label={`Remove ${item.name}`}
                    onClick={() => removeItem(item.variantId)}
                    className="p-2 text-[#6B4D3E] hover:text-[#C62828] cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <aside className="lg:col-span-4 bg-[#FFFDF8] border border-[#382015]/10 rounded-xl p-6 space-y-5">
            <h2 className="font-serif text-xl font-semibold text-[#382015]">
              Order Summary
            </h2>

            <div className="space-y-2.5 text-sm">
              <label className="block text-xs font-medium text-[#6B4D3E]">
                UK Delivery Option
              </label>
              <div className="grid grid-cols-1 gap-2">
                <button
                  type="button"
                  onClick={() => setShippingMethod('standard')}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-lg border text-left text-xs cursor-pointer ${
                    shippingMethod === 'standard'
                      ? 'border-[#063B20] bg-[#063B20]/5 font-semibold text-[#063B20]'
                      : 'border-[#382015]/20 text-[#382015]'
                  }`}
                >
                  <span>UK Standard Delivery</span>
                  <span className="font-mono tabular-nums">
                    {subtotalPence >= freeThreshold ? 'FREE' : formatGBP(standardRate)}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setShippingMethod('express')}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-lg border text-left text-xs cursor-pointer ${
                    shippingMethod === 'express'
                      ? 'border-[#063B20] bg-[#063B20]/5 font-semibold text-[#063B20]'
                      : 'border-[#382015]/20 text-[#382015]'
                  }`}
                >
                  <span>UK Express Delivery</span>
                  <span className="font-mono tabular-nums">
                    {formatGBP(expressRate)}
                  </span>
                </button>
              </div>
            </div>

            <div className="space-y-2.5 pt-3 border-t border-[#382015]/10 text-sm">
              <div className="flex justify-between">
                <span className="text-[#6B4D3E]">Subtotal</span>
                <span className="font-mono tabular-nums font-medium">
                  {formatGBP(subtotalPence)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6B4D3E]">UK Delivery</span>
                <span className="font-mono tabular-nums font-medium">
                  {shippingPence === 0 ? 'FREE' : formatGBP(shippingPence)}
                </span>
              </div>
              <div className="flex justify-between pt-3 border-t border-[#382015]/10 text-base font-semibold text-[#063B20]">
                <span>Total (GBP)</span>
                <span className="font-mono tabular-nums">{formatGBP(totalPence)}</span>
              </div>
            </div>

            <Link
              href="/checkout"
              className="w-full inline-flex items-center justify-center gap-2 py-3.5 px-6 rounded-lg bg-[#063B20] text-[#FFF8E9] text-sm font-semibold hover:bg-[#042916] transition-colors"
            >
              <span>Proceed to Checkout</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <p className="text-xs text-[#6B4D3E] leading-relaxed">
              Discount codes can be applied at checkout. Delivery timeframes are
              confirmed upon courier dispatch.
            </p>
          </aside>
        </div>
      )}
    </div>
  );
}
