import Link from 'next/link';
import { Award, CheckCircle2, Mail, Package } from 'lucide-react';
import { getDb, hydrateOrder } from '@/lib/db';
import { formatGBP } from '@/lib/uk-validation';

export const dynamic = 'force-dynamic';

export default async function OrderConfirmationPage({
  params,
  searchParams,
}: {
  params: Promise<{ orderNumber: string }>;
  searchParams: Promise<{ email?: string }>;
}) {
  const { orderNumber } = await params;
  const { email } = await searchParams;

  const db = getDb();
  const row = db
    .prepare('SELECT * FROM orders WHERE UPPER(order_number) = ?')
    .get(orderNumber.toUpperCase()) as Record<string, unknown> | undefined;

  if (!row || !email || String(row.customer_email).toLowerCase() !== email.toLowerCase()) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center space-y-4">
        <h1 className="font-serif text-3xl font-bold text-[#382015]">
          Order Verification Required
        </h1>
        <p className="text-sm text-[#6B4D3E]">
          Use our Order Tracking page with your Order Reference and email or postcode to
          view order details.
        </p>
        <Link
          href="/track"
          className="inline-block px-6 py-3 rounded-lg bg-[#063B20] text-[#FFF8E9] text-sm font-medium"
        >
          Go to Order Tracking
        </Link>
      </div>
    );
  }

  const order = hydrateOrder(db, row);
  const emailLog = db
    .prepare('SELECT subject, status, created_at FROM email_logs WHERE order_id = ? LIMIT 1')
    .get(order.id) as { subject: string; status: string; created_at: string } | undefined;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16 space-y-8">
      <div className="bg-[#FFFDF8] border border-[#063B20]/20 rounded-xl p-8 space-y-6">
        <div className="flex items-start gap-4">
          <CheckCircle2 className="w-9 h-9 text-[#063B20] shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-mono text-xs uppercase tracking-wider text-[#063B20] font-semibold">
              Order Confirmed · {order.order_number}
            </p>
            <h1 className="font-serif text-3xl font-bold text-[#382015]">
              Thank you, {order.customer_name}
            </h1>
            <p className="text-sm text-[#6B4D3E]">
              Your CHAI WALA order has been recorded. Dispatch and courier tracking
              details will be updated once your parcel is prepared.
            </p>
          </div>
        </div>

        {emailLog && (
          <div className="p-4 rounded-lg bg-[#F5EBD6] flex items-center gap-3 text-xs text-[#382015]">
            <Mail className="w-4 h-4 text-[#063B20] shrink-0" />
            <span>
              Order confirmation email prepared for <strong>{order.customer_email}</strong>{' '}
              ({emailLog.subject}).
            </span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-[#382015]/10 text-sm">
          <div className="space-y-1.5">
            <h2 className="font-semibold text-[#382015]">UK Delivery Address</h2>
            <p className="text-[#6B4D3E]">{order.customer_name}</p>
            <p className="text-[#6B4D3E]">{order.address_line1}</p>
            {order.address_line2 && (
              <p className="text-[#6B4D3E]">{order.address_line2}</p>
            )}
            <p className="text-[#6B4D3E]">
              {order.city}
              {order.county ? `, ${order.county}` : ''}
            </p>
            <p className="font-mono text-[#382015] font-medium">{order.postcode}</p>
            <p className="text-xs text-[#6B4D3E] pt-1">Phone: {order.customer_phone}</p>
          </div>

          <div className="space-y-2">
            <h2 className="font-semibold text-[#382015]">Payment & Status</h2>
            <p className="text-[#6B4D3E]">
              Method:{' '}
              {order.payment_method === 'stripe_card'
                ? 'Stripe (Card / Wallet)'
                : 'Cash on Delivery'}
            </p>
            <p className="text-[#6B4D3E] capitalize">
              Payment Status: {order.payment_status.replace('_', ' ')}
            </p>
            <p className="text-[#6B4D3E] capitalize">
              Order Status: {order.order_status}
            </p>
            <p className="text-[#6B4D3E] capitalize">
              Shipping: UK {order.shipping_method}
            </p>
            {order.points_earned > 0 && (
              <p className="text-[#063B20] font-medium flex items-center gap-1.5 pt-0.5">
                <Award className="w-4 h-4 text-[#D9A52B] shrink-0" />
                <span>
                  Chai Rewards Earned:{' '}
                  <span className="font-mono tabular-nums font-semibold">
                    +{order.points_earned.toLocaleString('en-GB')} pts
                  </span>
                </span>
              </p>
            )}
          </div>
        </div>

        <div className="pt-4 border-t border-[#382015]/10 space-y-3">
          <h2 className="font-semibold text-[#382015] text-sm">Items Ordered</h2>
          {order.items.map((item) => (
            <div key={item.id} className="flex justify-between text-sm">
              <span className="text-[#382015]">
                {item.product_name} ({item.variant_label}) × {item.quantity}
              </span>
              <span className="font-mono tabular-nums font-medium text-[#063B20]">
                {formatGBP(item.line_total_pence)}
              </span>
            </div>
          ))}
          <div className="pt-3 border-t border-[#382015]/10 space-y-1.5 text-sm">
            <div className="flex justify-between text-[#6B4D3E]">
              <span>Subtotal</span>
              <span className="font-mono tabular-nums">
                {formatGBP(order.subtotal_pence)}
              </span>
            </div>
            {order.discount_pence > 0 && (
              <div className="flex justify-between text-[#063B20]">
                <span>Discount ({order.discount_code})</span>
                <span className="font-mono tabular-nums">
                  -{formatGBP(order.discount_pence)}
                </span>
              </div>
            )}
            <div className="flex justify-between text-[#6B4D3E]">
              <span>UK Delivery</span>
              <span className="font-mono tabular-nums">
                {order.shipping_pence === 0 ? 'FREE' : formatGBP(order.shipping_pence)}
              </span>
            </div>
            <div className="flex justify-between text-base font-bold text-[#063B20] pt-2 border-t border-[#382015]/10">
              <span>Total (GBP)</span>
              <span className="font-mono tabular-nums">
                {formatGBP(order.total_pence)}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 pt-4">
          <Link
            href="/track"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#063B20] text-[#FFF8E9] text-sm font-medium"
          >
            <Package className="w-4 h-4" />
            <span>Track This Order</span>
          </Link>
          <Link
            href="/account"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-[#063B20]/30 text-[#063B20] text-sm font-medium"
          >
            <Award className="w-4 h-4 text-[#D9A52B]" />
            <span>View Chai Rewards</span>
          </Link>
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-[#382015]/25 text-[#382015] text-sm font-medium"
          >
            <span>Continue Shopping</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
