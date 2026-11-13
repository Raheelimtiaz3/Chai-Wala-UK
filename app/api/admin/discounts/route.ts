import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-guard';
import { getDb, listDiscountCodes } from '@/lib/db';

export async function GET() {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  return NextResponse.json({ discounts: listDiscountCodes() });
}

export async function POST(req: Request) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  try {
    const body = await req.json();
    const code = String(body.code || '')
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9_-]/g, '');
    const discountType = body.discount_type === 'fixed' ? 'fixed' : 'percent';
    const value = Math.round(Number(body.value || 0));
    const minOrderPence = Math.max(0, Math.round(Number(body.min_order_pence || 0)));
    const expiresAt = body.expires_at ? String(body.expires_at).trim() : null;

    if (code.length < 3 || code.length > 30) {
      return NextResponse.json(
        { error: 'Discount code must be 3–30 alphanumeric characters.' },
        { status: 400 }
      );
    }
    if (discountType === 'percent' && (value < 1 || value > 90)) {
      return NextResponse.json(
        { error: 'Percentage discount must be between 1% and 90%.' },
        { status: 400 }
      );
    }
    if (discountType === 'fixed' && value < 50) {
      return NextResponse.json(
        { error: 'Fixed GBP discount must be at least £0.50 (50 pence).' },
        { status: 400 }
      );
    }

    const db = getDb();
    const exists = db.prepare('SELECT id FROM discount_codes WHERE code = ?').get(code);
    if (exists) {
      return NextResponse.json({ error: 'Discount code already exists.' }, { status: 409 });
    }

    const now = new Date().toISOString();
    db.prepare(
      `INSERT INTO discount_codes (code, discount_type, value, min_order_pence, active, usage_count, expires_at, created_at)
       VALUES (?, ?, ?, ?, 1, 0, ?, ?)`
    ).run(code, discountType, value, minOrderPence, expiresAt, now);

    return NextResponse.json({ discounts: listDiscountCodes() }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Failed to create discount code.' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  try {
    const body = await req.json();
    const id = Number(body.id);
    const active = body.active ? 1 : 0;
    const db = getDb();
    db.prepare('UPDATE discount_codes SET active = ? WHERE id = ?').run(active, id);
    return NextResponse.json({ discounts: listDiscountCodes() });
  } catch {
    return NextResponse.json({ error: 'Failed to update discount code.' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const { searchParams } = new URL(req.url);
  const id = Number(searchParams.get('id'));
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: 'Invalid ID.' }, { status: 400 });
  }
  const db = getDb();
  db.prepare('DELETE FROM discount_codes WHERE id = ?').run(id);
  return NextResponse.json({ discounts: listDiscountCodes() });
}
