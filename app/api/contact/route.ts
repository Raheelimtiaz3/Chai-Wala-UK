import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { validateEmail } from '@/lib/uk-validation';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const name = String(body.name || '').trim();
    const email = String(body.email || '').trim().toLowerCase();
    const subject = String(body.subject || '').trim();
    const message = String(body.message || '').trim();

    if (name.length < 2) {
      return NextResponse.json({ error: 'Please enter your name.' }, { status: 400 });
    }
    if (!validateEmail(email)) {
      return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
    }
    if (subject.length < 3) {
      return NextResponse.json({ error: 'Please enter a subject.' }, { status: 400 });
    }
    if (message.length < 10) {
      return NextResponse.json(
        { error: 'Please enter a message of at least 10 characters.' },
        { status: 400 }
      );
    }

    const db = getDb();
    const now = new Date().toISOString();
    db.prepare(
      `INSERT INTO contact_messages (name, email, subject, message, status, created_at)
       VALUES (?, ?, ?, ?, 'new', ?)`
    ).run(name, email, subject, message, now);

    return NextResponse.json({
      ok: true,
      message: 'Your message has been received by CHAI WALA.',
    });
  } catch {
    return NextResponse.json({ error: 'Failed to send message.' }, { status: 500 });
  }
}
