import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-guard';
import { getDb, hydrateOrder } from '@/lib/db';

export async function GET(req: Request) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const { searchParams } = new URL(req.url);
  const status = (searchParams.get('status') || '').trim().toLowerCase();
  const q = (searchParams.get('q') || '').trim().toLowerCase();

  const db = getDb();
  const rows = db
    .prepare('SELECT * FROM orders ORDER BY created_at DESC')
    .all() as Record<string, unknown>[];

  let orders = rows.map((r) => hydrateOrder(db, r));

  if (status && status !== 'all') {
    orders = orders.filter((o) => o.order_status === status);
  }
  if (q) {
    orders = orders.filter(
      (o) =>
        o.order_number.toLowerCase().includes(q) ||
        o.customer_name.toLowerCase().includes(q) ||
        o.customer_email.toLowerCase().includes(q) ||
        o.postcode.toLowerCase().includes(q)
    );
  }

  return NextResponse.json({ orders });
}
