import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { getDb, getUserById, hydrateOrder, listUserRewardLedger } from '@/lib/db';
import { validateUKPhone, validateUKPostcode } from '@/lib/uk-validation';

export async function GET() {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ user: null, orders: [], rewardsHistory: [] });
  }

  const user = getUserById(session.userId);
  if (!user) {
    return NextResponse.json({ user: null, orders: [], rewardsHistory: [] });
  }

  const db = getDb();
  const orderRows = db
    .prepare(
      'SELECT * FROM orders WHERE user_id = ? OR LOWER(customer_email) = LOWER(?) ORDER BY created_at DESC'
    )
    .all(user.id, user.email) as Record<string, unknown>[];

  const orders = orderRows.map((row) => hydrateOrder(db, row));
  const rewardsHistory = listUserRewardLedger(user.id);

  return NextResponse.json({ user, orders, rewardsHistory });
}

export async function PATCH(req: Request) {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ error: 'Please sign in first.' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const name = String(body.name || '').trim();
    const phone = String(body.phone || '').trim();
    const defaultAddress = String(body.default_address || '').trim();
    const rawPostcode = String(body.default_postcode || '').trim();

    if (name.length < 2) {
      return NextResponse.json({ error: 'Please provide your name.' }, { status: 400 });
    }
    if (phone && !validateUKPhone(phone)) {
      return NextResponse.json({ error: 'Please enter a valid UK phone number.' }, { status: 400 });
    }

    let formattedPostcode = '';
    if (rawPostcode) {
      const pc = validateUKPostcode(rawPostcode);
      if (!pc.valid) {
        return NextResponse.json({ error: 'Please enter a valid UK postcode.' }, { status: 400 });
      }
      formattedPostcode = pc.formatted;
    }

    const db = getDb();
    db.prepare(
      `UPDATE users SET name = ?, phone = ?, default_address = ?, default_postcode = ? WHERE id = ?`
    ).run(name, phone, defaultAddress, formattedPostcode, session.userId);

    const updated = getUserById(session.userId);
    return NextResponse.json({ user: updated });
  } catch {
    return NextResponse.json({ error: 'Failed to update profile.' }, { status: 500 });
  }
}
