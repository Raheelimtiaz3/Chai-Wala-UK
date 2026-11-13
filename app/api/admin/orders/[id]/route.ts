import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-guard';
import { getDb, hydrateOrder } from '@/lib/db';

const VALID_ORDER_STATUSES = new Set([
  'pending',
  'confirmed',
  'preparing',
  'dispatched',
  'delivered',
  'cancelled',
]);

const VALID_PAYMENT_STATUSES = new Set([
  'pending',
  'paid',
  'failed',
  'cod_pending',
  'refunded',
]);

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const { id } = await context.params;
  const orderId = Number(id);
  if (!Number.isInteger(orderId) || orderId <= 0) {
    return NextResponse.json({ error: 'Invalid order ID.' }, { status: 400 });
  }

  const db = getDb();
  const existing = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId) as
    | Record<string, unknown>
    | undefined;
  if (!existing) {
    return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
  }

  try {
    const body = await req.json();
    const orderStatus =
      body.order_status !== undefined
        ? String(body.order_status)
        : String(existing.order_status);
    const paymentStatus =
      body.payment_status !== undefined
        ? String(body.payment_status)
        : String(existing.payment_status);
    const courierName =
      body.courier_name !== undefined
        ? String(body.courier_name).trim() || null
        : existing.courier_name
          ? String(existing.courier_name)
          : null;
    const trackingReference =
      body.tracking_reference !== undefined
        ? String(body.tracking_reference).trim() || null
        : existing.tracking_reference
          ? String(existing.tracking_reference)
          : null;

    if (!VALID_ORDER_STATUSES.has(orderStatus)) {
      return NextResponse.json({ error: 'Invalid order status.' }, { status: 400 });
    }
    if (!VALID_PAYMENT_STATUSES.has(paymentStatus)) {
      return NextResponse.json({ error: 'Invalid payment status.' }, { status: 400 });
    }

    const now = new Date().toISOString();
    db.prepare(
      `UPDATE orders
       SET order_status = ?, payment_status = ?, courier_name = ?, tracking_reference = ?, updated_at = ?
       WHERE id = ?`
    ).run(orderStatus, paymentStatus, courierName, trackingReference, now, orderId);

    const updatedRow = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId) as Record<
      string,
      unknown
    >;
    return NextResponse.json({ order: hydrateOrder(db, updatedRow) });
  } catch {
    return NextResponse.json({ error: 'Failed to update order.' }, { status: 500 });
  }
}
