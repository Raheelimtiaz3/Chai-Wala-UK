import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { validateEmail } from '@/lib/uk-validation';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = String(body.email || '').trim().toLowerCase();
    const consentGiven = Boolean(body.consentGiven);

    if (!validateEmail(email)) {
      return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
    }
    if (!consentGiven) {
      return NextResponse.json(
        { error: 'Please tick the consent box to receive email updates from CHAI WALA.' },
        { status: 400 }
      );
    }

    const db = getDb();
    const now = new Date().toISOString();
    db.prepare(
      `INSERT INTO newsletter_subscribers (email, consent_given, created_at)
       VALUES (?, 1, ?)
       ON CONFLICT(email) DO UPDATE SET consent_given = 1`
    ).run(email, now);

    return NextResponse.json({
      ok: true,
      message: 'Thank you for subscribing to CHAI WALA updates.',
    });
  } catch {
    return NextResponse.json({ error: 'Failed to subscribe.' }, { status: 500 });
  }
}
