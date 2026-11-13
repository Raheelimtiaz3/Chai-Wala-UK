'use client';

import React, { useState } from 'react';
import { Package, Search } from 'lucide-react';
import type { Order } from '@/lib/types';
import { formatGBP } from '@/lib/uk-validation';

const STEPS = ['pending', 'confirmed', 'preparing', 'dispatched', 'delivered'];

export default function TrackOrderPage() {
  const [orderNumber, setOrderNumber] = useState('');
  const [verify, setVerify] = useState('');
  const [order, setOrder] = useState<Order | null>(null);
  const [emailInfo, setEmailInfo] = useState<{
    subject: string;
    status: string;
    created_at: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setOrder(null);
    setLoading(true);
    try {
      const res = await fetch(
        `/api/orders?orderNumber=${encodeURIComponent(
          orderNumber.trim()
        )}&verify=${encodeURIComponent(verify.trim())}`
      );
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Could not locate order.');
      } else {
        setOrder(data.order);
        setEmailInfo(data.confirmationEmail || null);
      }
    } catch {
      setError('Network error while checking order status.');
    } finally {
      setLoading(false);
    }
  };

  const currentStepIndex = order ? STEPS.indexOf(order.order_status) : -1;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16 space-y-10">
      <div className="space-y-2 border-b border-[#382015]/10 pb-6">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#063B20]">
          UK Parcel Dispatch
        </p>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#382015]">
          Track Your Order
        </h1>
        <p className="text-sm text-[#6B4D3E]">
          Enter your CHAI WALA order reference and the email address or UK postcode used
          at checkout.
        </p>
      </div>

      <form
        onSubmit={handleLookup}
        className="bg-[#FFFDF8] border border-[#382015]/10 rounded-xl p-6 grid grid-cols-1 sm:grid-cols-12 gap-4 items-end"
      >
        <div className="sm:col-span-5">
          <label className="block text-xs font-medium text-[#382015] mb-1">
            Order Reference
          </label>
          <input
            type="text"
            required
            value={orderNumber}
            onChange={(e) => setOrderNumber(e.target.value.toUpperCase())}
            placeholder="e.g. CW-A1B2C3"
            className="w-full px-3.5 py-2.5 rounded-lg border border-[#382015]/20 bg-[#FFF8E9]/40 font-mono text-sm uppercase focus:outline-none focus:border-[#063B20]"
          />
        </div>
        <div className="sm:col-span-5">
          <label className="block text-xs font-medium text-[#382015] mb-1">
            Email or UK Postcode
          </label>
          <input
            type="text"
            required
            value={verify}
            onChange={(e) => setVerify(e.target.value)}
            placeholder="you@example.co.uk or SW1A 1AA"
            className="w-full px-3.5 py-2.5 rounded-lg border border-[#382015]/20 bg-[#FFF8E9]/40 text-sm focus:outline-none focus:border-[#063B20]"
          />
        </div>
        <div className="sm:col-span-2">
          <button
            type="submit"
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-lg bg-[#063B20] text-[#FFF8E9] text-sm font-medium hover:bg-[#042916] cursor-pointer disabled:opacity-50"
          >
            <Search className="w-4 h-4" />
            <span>{loading ? '...' : 'Track'}</span>
          </button>
        </div>
      </form>

      {error && (
        <div className="p-4 rounded-lg bg-[#C62828]/10 border border-[#C62828]/30 text-sm text-[#C62828]">
          {error}
        </div>
      )}

      {order && (
        <div className="bg-[#FFFDF8] border border-[#382015]/10 rounded-xl p-6 sm:p-8 space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#382015]/10 pb-5">
            <div>
              <p className="font-mono text-sm font-semibold text-[#063B20]">
                Order {order.order_number}
              </p>
              <p className="text-xs text-[#6B4D3E] mt-0.5">
                Placed on{' '}
                {new Date(order.created_at).toLocaleDateString('en-GB', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
            </div>
            <div className="text-sm font-semibold capitalize text-[#063B20]">
              Status: {order.order_status} · Payment: {order.payment_status}
            </div>
          </div>

          {order.order_status !== 'cancelled' && (
            <div className="grid grid-cols-5 gap-2">
              {STEPS.map((step, idx) => {
                const done = idx <= currentStepIndex;
                return (
                  <div key={step} className="space-y-1.5">
                    <div
                      className={`h-2 rounded-full ${
                        done ? 'bg-[#063B20]' : 'bg-[#382015]/10'
                      }`}
                    />
                    <p
                      className={`text-xs capitalize ${
                        done ? 'text-[#063B20] font-semibold' : 'text-[#6B4D3E]'
                      }`}
                    >
                      {step}
                    </p>
                  </div>
                );
              })}
            </div>
          )}

          {(order.courier_name || order.tracking_reference) && (
            <div className="p-4 rounded-lg bg-[#F5EBD6] flex items-center gap-3 text-sm">
              <Package className="w-5 h-5 text-[#063B20] shrink-0" />
              <div>
                <span className="font-semibold text-[#382015]">
                  Courier: {order.courier_name || 'Assigned'}
                </span>
                {order.tracking_reference && (
                  <span className="ml-3 font-mono text-xs text-[#063B20]">
                    Tracking: {order.tracking_reference}
                  </span>
                )}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <div className="space-y-1.5">
              <h3 className="font-semibold text-[#382015]">Delivery Address</h3>
              <p className="text-[#6B4D3E]">{order.customer_name}</p>
              <p className="text-[#6B4D3E]">{order.address_line1}</p>
              {order.address_line2 && (
                <p className="text-[#6B4D3E]">{order.address_line2}</p>
              )}
              <p className="text-[#6B4D3E]">
                {order.city}, {order.postcode}
              </p>
            </div>
            <div className="space-y-1.5">
              <h3 className="font-semibold text-[#382015]">Summary</h3>
              {order.items.map((item) => (
                <div key={item.id} className="flex justify-between text-[#6B4D3E]">
                  <span>
                    {item.product_name} ({item.variant_label}) × {item.quantity}
                  </span>
                  <span className="font-mono tabular-nums">
                    {formatGBP(item.line_total_pence)}
                  </span>
                </div>
              ))}
              <div className="flex justify-between pt-2 border-t border-[#382015]/10 font-semibold text-[#063B20]">
                <span>Total</span>
                <span className="font-mono tabular-nums">
                  {formatGBP(order.total_pence)}
                </span>
              </div>
            </div>
          </div>

          {emailInfo && (
            <p className="text-xs text-[#6B4D3E] border-t border-[#382015]/10 pt-4">
              Confirmation email recorded for {order.customer_email} ({emailInfo.subject}
              ).
            </p>
          )}
        </div>
      )}
    </div>
  );
}
