import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-guard';
import { getDb } from '@/lib/db';

export async function GET() {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const db = getDb();
  const customers = db
    .prepare(
      `SELECT u.id, u.name, u.email, u.phone, u.default_address, u.default_postcode, u.created_at,
              COUNT(o.id) as order_count,
              COALESCE(SUM(CASE WHEN o.order_status != 'cancelled' THEN o.total_pence ELSE 0 END), 0) as total_spent_pence
       FROM users u
       LEFT JOIN orders o ON (o.user_id = u.id OR LOWER(o.customer_email) = LOWER(u.email))
       WHERE u.role = 'customer'
       GROUP BY u.id
       ORDER BY u.created_at DESC`
    )
    .all();

  return NextResponse.json({ customers });
}
