import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-guard';
import { getDb, hydrateOrder } from '@/lib/db';

export async function GET() {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const db = getDb();

  const orderRows = db
    .prepare('SELECT * FROM orders ORDER BY created_at DESC')
    .all() as Record<string, unknown>[];
  const orders = orderRows.map((r) => hydrateOrder(db, r));

  const validOrders = orders.filter((o) => o.order_status !== 'cancelled');
  const totalRevenuePence = validOrders.reduce((sum, o) => sum + o.total_pence, 0);
  const totalOrders = orders.length;
  const averageOrderValuePence =
    validOrders.length > 0 ? Math.round(totalRevenuePence / validOrders.length) : 0;

  const ordersByStatus: Record<string, number> = {};
  for (const o of orders) {
    ordersByStatus[o.order_status] = (ordersByStatus[o.order_status] || 0) + 1;
  }

  const variantSalesRows = db
    .prepare(
      `SELECT oi.product_name, oi.variant_label,
              SUM(oi.quantity) as units_sold,
              SUM(oi.line_total_pence) as revenue_pence
       FROM order_items oi
       JOIN orders o ON o.id = oi.order_id
       WHERE o.order_status != 'cancelled'
       GROUP BY oi.product_name, oi.variant_label
       ORDER BY revenue_pence DESC`
    )
    .all() as Record<string, unknown>[];

  const lowStockVariants = db
    .prepare(
      `SELECT v.id, v.label, v.sku, v.stock, p.name as product_name
       FROM product_variants v
       JOIN products p ON p.id = v.product_id
       WHERE v.stock <= 15
       ORDER BY v.stock ASC`
    )
    .all() as Record<string, unknown>[];

  const customerCount = (
    db.prepare(`SELECT COUNT(*) as count FROM users WHERE role = 'customer'`).get() as {
      count: number;
    }
  ).count;

  const subscribers = db
    .prepare('SELECT id, email, consent_given, created_at FROM newsletter_subscribers ORDER BY created_at DESC')
    .all();

  const messages = db
    .prepare('SELECT * FROM contact_messages ORDER BY created_at DESC')
    .all();

  const emailLogs = db
    .prepare('SELECT * FROM email_logs ORDER BY created_at DESC LIMIT 30')
    .all();

  return NextResponse.json({
    metrics: {
      totalRevenuePence,
      totalOrders,
      validOrderCount: validOrders.length,
      averageOrderValuePence,
      customerCount,
      subscriberCount: subscribers.length,
    },
    ordersByStatus,
    variantSales: variantSalesRows,
    lowStockVariants,
    recentOrders: orders.slice(0, 10),
    subscribers,
    messages,
    emailLogs,
  });
}
